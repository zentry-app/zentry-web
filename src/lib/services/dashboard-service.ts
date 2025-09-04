import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp,
  onSnapshot,
  getFirestore
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Interfaces para los datos del dashboard
export interface DashboardRealTimeStats {
  alertasPanico: number;
  visitantesActivos: number;
  rondasActivas: number;
  eventosHoy: number;
  ingresosUltimas24h: number;
}

export interface PanicAlert {
  id: string;
  userName: string;
  userEmail?: string;
  address: string;
  timestamp: Date;
  status: 'active' | 'resolved' | 'in_progress';
  type: string;
  _residencialNombre?: string;
  residencialID?: string;
}

export interface ActiveVisitor {
  id: string;
  visitorName: string;
  residentName: string;
  entryTime: Date;
  expectedDuration: string;
  status: string;
}

export interface ActiveRound {
  id: string;
  guardName: string;
  area: string;
  startTime: Date;
  estimatedCompletion: Date;
  status: string;
  residencialName?: string;
}

export interface RecentActivity {
  id: string;
  type: 'ingreso' | 'alerta' | 'evento' | 'pago' | 'alert' | 'visitor' | 'entry' | 'round' | 'user' | 'event';
  description: string;
  timestamp: Date;
  user?: string;
  message?: string;
}

export interface SystemHealth {
  uptime: string;
  activeServices: number;
  totalServices: number;
  responseTime: string;
  errorRate: string;
  apiStatus: 'operational' | 'degraded' | 'inactive';
  notificationStatus: 'operational' | 'degraded' | 'inactive';
  databaseStatus: 'operational' | 'degraded' | 'inactive';
  storageUsage: number;
  lastUpdate: Date;
}

// Función para obtener alertas usando la misma lógica que la página de alertas
const getAlertasPanicoActivas = async (): Promise<PanicAlert[]> => {
  try {
    console.log('[DashboardService] Buscando alertas de pánico activas usando lógica de la página de alertas');
    
    const alertasEncontradas: PanicAlert[] = [];
    
    // 1. Obtener todos los residenciales
    const residencialesSnapshot = await getDocs(collection(db, 'residenciales'));
    console.log(`[DashboardService] Encontrados ${residencialesSnapshot.docs.length} residenciales`);
    
    // 2. Buscar alertas en cada residencial (subcolecciones)
    for (const residencialDoc of residencialesSnapshot.docs) {
      const residencialData = residencialDoc.data();
      const residencialNombre = residencialData.nombre || residencialDoc.id;
      
      try {
        // Buscar en subcolección alertas
        const alertasRef = collection(db, `residenciales/${residencialDoc.id}/alertas`);
        const alertasQuery = query(
          alertasRef,
          where('status', '==', 'active'),
          where('tipo', '==', 'panic_alert'), // Solo alertas de pánico
          orderBy('timestamp', 'desc'),
          limit(20)
        );
        
        const alertasSnapshot = await getDocs(alertasQuery);
        console.log(`[DashboardService] Residencial ${residencialNombre}: ${alertasSnapshot.docs.length} alertas activas encontradas`);
        
        const alertasDelResidencial = alertasSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userName: data.userName || 'Usuario desconocido',
            userEmail: data.userEmail || '',
            address: residencialNombre, // Usar nombre del residencial como dirección
            timestamp: data.timestamp?.toDate() || new Date(),
            status: data.status || 'active',
            type: data.tipo || data.type || 'panic_alert',
            _residencialNombre: residencialNombre,
            residencialID: data.residencialID || residencialDoc.id
          } as PanicAlert;
        });
        
        alertasEncontradas.push(...alertasDelResidencial);
        
      } catch (error) {
        console.error(`[DashboardService] Error buscando alertas en residencial ${residencialNombre}:`, error);
        continue;
      }
    }
    
    // 3. Si no se encontraron alertas en subcolecciones, buscar en colecciones raíz
    if (alertasEncontradas.length === 0) {
      console.log('[DashboardService] No se encontraron alertas en subcolecciones, buscando en colecciones raíz...');
      
      const coleccionesPosibles = ['alertas', 'alertasPanico', 'panicAlerts'];
      
      for (const nombreColeccion of coleccionesPosibles) {
        try {
          const coleccionRef = collection(db, nombreColeccion);
          const alertasQuery = query(
            coleccionRef,
            where('status', '==', 'active'),
            where('tipo', '==', 'panic_alert'),
            orderBy('timestamp', 'desc'),
            limit(20)
          );
          
          const snapshot = await getDocs(alertasQuery);
          console.log(`[DashboardService] Colección raíz '${nombreColeccion}': ${snapshot.docs.length} alertas encontradas`);
          
          if (snapshot.docs.length > 0) {
            const alertasDeColeccion = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                userName: data.userName || 'Usuario desconocido',
                userEmail: data.userEmail || '',
                address: data._residencialNombre || 'Residencial desconocido',
                timestamp: data.timestamp?.toDate() || new Date(),
                status: data.status || 'active',
                type: data.tipo || data.type || 'panic_alert',
                _residencialNombre: data._residencialNombre,
                residencialID: data.residencialID
              } as PanicAlert;
            });
            
            alertasEncontradas.push(...alertasDeColeccion);
            break; // Si encontramos alertas en esta colección, no seguimos buscando
          }
        } catch (error) {
          console.error(`[DashboardService] Error buscando en colección '${nombreColeccion}':`, error);
          continue;
        }
      }
    }
    
    // Ordenar por timestamp (más recientes primero)
    alertasEncontradas.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    console.log(`[DashboardService] Total de alertas de pánico activas encontradas: ${alertasEncontradas.length}`);
    return alertasEncontradas.slice(0, 10); // Limitar a 10 para el dashboard
    
  } catch (error: any) {
    console.error('[DashboardService] Error al obtener alertas de pánico:', error.message);
    return [];
  }
};

/**
 * Servicio para obtener datos del dashboard desde Firestore
 */
const DashboardService = {
  /**
   * Obtiene estadísticas en tiempo real del sistema
   */
  getRealTimeStats: async (): Promise<DashboardRealTimeStats> => {
    try {
      console.log('[DashboardService] Obteniendo estadísticas en tiempo real...');
      
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Obtener alertas activas usando la misma lógica que la página de alertas
      const alertasActivas = await getAlertasPanicoActivas();
      
      // Estadísticas de ingresos activos (visitantes que no han salido)
      const ingresosActivosQuery = query(
        collection(db, 'ingresos'),
        where('status', '==', 'active'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      // Eventos de hoy
      const eventosHoyQuery = query(
        collection(db, 'eventos_residenciales'),
        where('dateTime', '>=', Timestamp.fromDate(todayStart)),
        where('dateTime', '<', Timestamp.fromDate(new Date(todayStart.getTime() + 24 * 60 * 60 * 1000))),
        orderBy('dateTime', 'asc'),
        limit(50)
      );
      
      // Ingresos de las últimas 24 horas
      const ingresosRecientesQuery = query(
        collection(db, 'ingresos'),
        where('timestamp', '>=', Timestamp.fromDate(yesterday)),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      // Ejecutar queries en paralelo (excepto alertas que ya las tenemos)
      const [ingresosActivosSnap, eventosHoySnap, ingresosRecientesSnap] = await Promise.all([
        getDocs(ingresosActivosQuery),
        getDocs(eventosHoyQuery),
        getDocs(ingresosRecientesQuery)
      ]);
      
      const stats: DashboardRealTimeStats = {
        alertasPanico: alertasActivas.length, // Usar el conteo real de alertas encontradas
        visitantesActivos: ingresosActivosSnap.size,
        rondasActivas: 0, // No hay colección security_rounds, mantener en 0
        eventosHoy: eventosHoySnap.size,
        ingresosUltimas24h: ingresosRecientesSnap.size
      };
      
      console.log('[DashboardService] Estadísticas obtenidas:', stats);
      return stats;
    } catch (error: any) {
      console.error('[DashboardService] Error al obtener estadísticas:', error.message);
      return {
        alertasPanico: 0,
        visitantesActivos: 0,
        rondasActivas: 0,
        eventosHoy: 0,
        ingresosUltimas24h: 0
      };
    }
  },

  /**
   * Obtiene alertas de pánico pendientes
   */
  getPendingPanicAlerts: async (): Promise<PanicAlert[]> => {
    console.log('[DashboardService] Obteniendo alertas de pánico pendientes...');
    return await getAlertasPanicoActivas();
  },

  /**
   * Obtiene visitantes activos
   */
  getActiveVisitors: async (): Promise<ActiveVisitor[]> => {
    try {
      console.log('[DashboardService] Obteniendo visitantes activos...');
      
      const ingresosQuery = query(
        collection(db, 'ingresos'),
        where('status', '==', 'active'),
        orderBy('timestamp', 'desc'),
        limit(15)
      );
      
      const querySnapshot = await getDocs(ingresosQuery);
      
      const visitors: ActiveVisitor[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          visitorName: data.visitorName || data.nombreVisitante || data.fullName || 'Visitante',
          residentName: data.residentName || data.nombreResidente || data.hostName || 'Residente',
          entryTime: data.timestamp?.toDate() || data.entryTime?.toDate() || new Date(),
          expectedDuration: data.expectedDuration || data.duracionEsperada || '2 horas',
          status: data.status || 'active'
        };
      });
      
      console.log(`[DashboardService] ${visitors.length} visitantes activos obtenidos`);
      return visitors;
    } catch (error: any) {
      console.error('[DashboardService] Error al obtener visitantes activos:', error.message);
      return [];
    }
  },

  /**
   * Obtiene rondas activas
   */
  getActiveRounds: async (): Promise<ActiveRound[]> => {
    try {
      console.log('[DashboardService] Rondas de seguridad no disponibles en este momento');
      return [];
    } catch (error: any) {
      console.error('[DashboardService] Error al obtener rondas activas:', error.message);
      return [];
    }
  },

  /**
   * Obtiene actividad reciente del sistema
   */
  getRecentActivity: async (): Promise<RecentActivity[]> => {
    try {
      console.log('[DashboardService] Obteniendo actividad reciente...');
      
      const activities: RecentActivity[] = [];
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Obtener ingresos recientes
      const ingresosQuery = query(
        collection(db, 'ingresos'),
        where('timestamp', '>=', Timestamp.fromDate(last24Hours)),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      
      // Obtener alertas recientes usando la misma lógica
      const alertasRecientes = await getAlertasPanicoActivas();
      
      // Obtener eventos recientes
      const eventosQuery = query(
        collection(db, 'eventos_residenciales'),
        where('dateTime', '>=', Timestamp.fromDate(last24Hours)),
        orderBy('dateTime', 'desc'),
        limit(5)
      );
      
      const [ingresosSnap, eventosSnap] = await Promise.all([
        getDocs(ingresosQuery),
        getDocs(eventosQuery)
      ]);
      
      // Procesar ingresos
      ingresosSnap.docs.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'ingreso',
          description: `Ingreso: ${data.visitorName || data.nombreVisitante || 'Visitante'} a casa de ${data.residentName || data.nombreResidente || 'Residente'}`,
          timestamp: data.timestamp?.toDate() || new Date(),
          user: data.visitorName || data.nombreVisitante
        });
      });
      
      // Procesar alertas (solo las recientes)
      alertasRecientes.slice(0, 5).forEach(alert => {
        activities.push({
          id: alert.id,
          type: 'alerta',
          description: `Alerta de pánico: ${alert.userName} en ${alert._residencialNombre || 'Residencial'}`,
          timestamp: alert.timestamp,
          user: alert.userName
        });
      });
      
      // Procesar eventos
      eventosSnap.docs.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'evento',
          description: `Evento: ${data.title || data.titulo || 'Evento residencial'}`,
          timestamp: data.dateTime?.toDate() || new Date(),
          user: data.createdBy || data.organizador
        });
      });
      
      // Ordenar por timestamp descendente y limitar a 15
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      const recentActivities = activities.slice(0, 15);
      
      console.log(`[DashboardService] ${recentActivities.length} actividades recientes obtenidas`);
      return recentActivities;
    } catch (error: any) {
      console.error('[DashboardService] Error al obtener actividad reciente:', error.message);
      return [];
    }
  },

  /**
   * Obtiene el estado de salud del sistema
   */
  getSystemHealth: async (): Promise<SystemHealth> => {
    try {
      // Calcular uptime basado en Firebase
      const uptimeHours = 24; // Simular 24 horas de uptime
      const uptime = `${uptimeHours}h`;
      
      // Simular métricas de sistema
      return {
        uptime,
        activeServices: 8,
        totalServices: 10,
        responseTime: '< 100ms',
        errorRate: '0.1%',
        apiStatus: 'operational',
        notificationStatus: 'operational',
        databaseStatus: 'operational',
        storageUsage: 0.5,
        lastUpdate: new Date()
      };
    } catch (error: any) {
      console.error('[DashboardService] Error al obtener estado del sistema:', error.message);
      return {
        uptime: '0h',
        activeServices: 0,
        totalServices: 10,
        responseTime: 'N/A',
        errorRate: 'N/A',
        apiStatus: 'inactive',
        notificationStatus: 'inactive',
        databaseStatus: 'inactive',
        storageUsage: 0,
        lastUpdate: new Date()
      };
    }
  },

  /**
   * Suscripción en tiempo real a estadísticas del dashboard
   */
  subscribeToRealTimeStats: (onUpdate: (stats: DashboardRealTimeStats) => void) => {
    console.log('[DashboardService] Configurando suscripciones en tiempo real...');
    
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Suscripción a ingresos activos
    const ingresosActivosQuery = query(
      collection(db, 'ingresos'), 
      where('status', '==', 'active')
    );

    // Suscripción a eventos de hoy
    const eventosQuery = query(
      collection(db, 'eventos_residenciales'),
      where('dateTime', '>=', Timestamp.fromDate(todayStart))
    );

    // Suscripción a ingresos recientes
    const ingresosRecientesQuery = query(
      collection(db, 'ingresos'),
      where('timestamp', '>=', Timestamp.fromDate(yesterday))
    );

    let stats: DashboardRealTimeStats = {
      alertasPanico: 0,
      visitantesActivos: 0,
      rondasActivas: 0,
      eventosHoy: 0,
      ingresosUltimas24h: 0
    };

    const updateStats = async () => {
      // Actualizar alertas de pánico de manera async
      try {
        const alertasActivas = await getAlertasPanicoActivas();
        stats.alertasPanico = alertasActivas.length;
      } catch (error) {
        console.error('[DashboardService] Error actualizando alertas:', error);
      }
      onUpdate({...stats});
    };

    const unsubIngresosActivos = onSnapshot(ingresosActivosQuery, (snapshot) => {
      stats.visitantesActivos = snapshot.size;
      updateStats();
    });

    const unsubEventos = onSnapshot(eventosQuery, (snapshot) => {
      stats.eventosHoy = snapshot.size;
      updateStats();
    });

    const unsubIngresosRecientes = onSnapshot(ingresosRecientesQuery, (snapshot) => {
      stats.ingresosUltimas24h = snapshot.size;
      updateStats();
    });

    // Actualización inicial
    updateStats();

    // Retornar función para cancelar suscripciones
    return () => {
      console.log('[DashboardService] Cancelando suscripciones en tiempo real');
      unsubIngresosActivos();
      unsubEventos();
      unsubIngresosRecientes();
    };
  }
};

export default DashboardService; 