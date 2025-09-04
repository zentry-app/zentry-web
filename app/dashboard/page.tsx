"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRequired } from "@/lib/hooks";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Building, 
  Home, 
  UserCheck,
  ShieldCheck,
  RefreshCw,
  Clock,
  AlertTriangle,
  UserPlus,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { AdminService, DashboardService } from "@/lib/services";
import type { 
  DashboardRealTimeStats, 
  PanicAlert, 
  ActiveVisitor, 
  ActiveRound, 
  RecentActivity, 
  SystemHealth 
} from "@/lib/services/dashboard-service";
import { collection, getDocs, query, where, limit as fbLimit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getUsuariosPendientes } from '@/lib/firebase/firestore';

// Interfaces para datos básicos del sistema
interface DashboardStats {
  totalResidentes: number;
  totalResidenciales: number;
  totalAdmins: number;
  globalAdmins?: number;
  pendingUsers: number;
}

export default function DashboardPage() {
  // Proteger la ruta - este hook redirigirá automáticamente si no es admin
  const { isAdmin, isUserLoading } = useAdminRequired();
  const { user, userData, userClaims } = useAuth();
  
  // Estados para datos básicos del sistema
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [residencialNombre, setResidencialNombre] = useState<string | null>(null);
  
  // Estados para datos del dashboard en tiempo real
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [uniqueHousesCount, setUniqueHousesCount] = useState<number | null>(null);
  const [pendingReservationsCount, setPendingReservationsCount] = useState<number | null>(null);
  const [pendingUsersCount, setPendingUsersCount] = useState<number | null>(null);
  const [totalResidentesCount, setTotalResidentesCount] = useState<number | null>(null);
  
  // Obtener el ID del residencial que maneja este admin
  const esAdminGlobal = userClaims?.isGlobalAdmin === true;
  const esAdminDeResidencial = (userClaims?.role === 'admin') && !esAdminGlobal;
  const residencialId = useMemo(() => {
    if (!esAdminDeResidencial) return null;
    // Priorizar lista administrada; fallback a residencialId
    return userClaims?.managedResidencials?.[0] || userClaims?.residencialId || null;
  }, [esAdminDeResidencial, userClaims]);

  // Cargar nombre del residencial asignado (para admins no globales)
  useEffect(() => {
    const fetchResidencialNombre = async () => {
      if (!esAdminDeResidencial || !residencialId) {
        setResidencialNombre(null);
        return;
      }
      try {
        const residencialesRef = collection(db, 'residenciales');
        // 1) Buscar por código en campo residencialID
        const qByCode = query(residencialesRef, where('residencialID', '==', residencialId), fbLimit(1));
        const snapByCode = await getDocs(qByCode);
        if (!snapByCode.empty) {
          const data: any = snapByCode.docs[0].data();
          setResidencialNombre(data?.nombre || residencialId);
          return;
        }
        // 2) Fallback: intentar por ID de documento
        try {
          const { getDoc, doc } = await import('firebase/firestore');
          const docSnap = await getDoc(doc(db, 'residenciales', residencialId));
          if (docSnap.exists()) {
            const data: any = docSnap.data();
            setResidencialNombre(data?.nombre || residencialId);
            return;
          }
        } catch {}
        setResidencialNombre(residencialId);
      } catch (e) {
        console.error('Error obteniendo nombre de residencial:', e);
        setResidencialNombre(residencialId);
      }
    };
    fetchResidencialNombre();
  }, [esAdminDeResidencial, residencialId]);
  
  // Cargar datos básicos del sistema
  const fetchBasicStats = async () => {
    try {
      console.log("Obteniendo estadísticas básicas del dashboard...");
      const systemStats = await AdminService.getSystemStats();
      setStats(systemStats);
    } catch (err: any) {
      console.error("Error obteniendo estadísticas básicas:", err);
      setError(err.message || "Error al cargar estadísticas básicas");
    }
  };
  

  
  // Cargar estado del sistema
  const fetchSystemHealth = async () => {
    try {
      console.log("Obteniendo estado del sistema...");
      const health = await DashboardService.getSystemHealth();
      setSystemHealth(health);
    } catch (err: any) {
      console.error("Error obteniendo estado del sistema:", err);
    }
  };

  // Contar casas únicas usando la misma lógica que la página de usuarios
  const fetchUniqueHousesCount = async () => {
    try {
      if (!esAdminDeResidencial || !residencialId) {
        setUniqueHousesCount(null);
        return;
      }
      
      const usersRef = collection(db, 'usuarios');
      // Intento 1: por residencialID (código)
      const snap1 = await getDocs(query(usersRef, where('residencialID', '==', residencialId), where('role', '==', 'resident')));
      // Intento 2: por residencialId (docId) si el primero no trae resultados
      const snap2 = snap1.empty
        ? await getDocs(query(usersRef, where('residencialId', '==', residencialId), where('role', '==', 'resident')))
        : null;
      const snap = snap2 ?? snap1;
      
      // Aplicar la misma lógica de agrupación que en la página de usuarios
      const sanitize = (s?: string) => (s || '')
        .toString()
        .replace(/[\u0000-\u001F\u007F-\u009F\u200B\u200C\u200D\uFEFF]/g, '');
      const normalize = (s?: string) => sanitize(s).trim().toUpperCase().replace(/\s+/g, ' ');
      const addrKey = (calle?: string, houseNumber?: string) => `ADDR::${normalize(calle)}#${normalize(houseNumber)}`;

      const hidIndex = new Map<string, string>();
      const addrIndex = new Map<string, string>();
      const casasUnicas = new Set<string>();

      snap.forEach(doc => {
        const data = doc.data();
        // Solo residentes con referencia de casa
        const tieneCasa = data.houseID || data.houseId || data.houseNumber || data.calle;
        if (!tieneCasa) return;

        const rawHid = (data.houseID || data.houseId || '').toString();
        const hidSanitized = sanitize(rawHid);
        const hidNorm = normalize(hidSanitized);
        const aKey = addrKey(data.calle, data.houseNumber);

        // Elegir key preferente (HID si existe, sino dirección)
        let chosenKey = hidNorm || aKey;

        // Si ya existe una key para esta dirección, usar esa para agrupar
        const addrExisting = addrIndex.get(aKey);
        if (addrExisting && addrExisting !== chosenKey) {
          chosenKey = addrExisting;
        }

        // Registrar índices
        if (hidNorm) {
          const hidExisting = hidIndex.get(hidNorm);
          if (hidExisting && hidExisting !== chosenKey) {
            chosenKey = hidExisting;
          } else if (!hidExisting) {
            hidIndex.set(hidNorm, chosenKey);
          }
        }
        if (!addrIndex.has(aKey)) addrIndex.set(aKey, chosenKey);

        casasUnicas.add(chosenKey);
      });

      console.log(`🏠 [Dashboard] Casas únicas encontradas: ${casasUnicas.size}`);
      setUniqueHousesCount(casasUnicas.size);
    } catch (e) {
      console.error('Error contando casas únicas:', e);
      setUniqueHousesCount(null);
    }
  };

  // Contar reservas pendientes para admin de residencial
  const fetchPendingReservationsCount = async () => {
    try {
      if (!esAdminDeResidencial || !residencialId) {
        setPendingReservationsCount(null);
        return;
      }
      // Intentar directamente usar residencialId como docId
      let targetDocId: string | null = residencialId;
      try {
        const { getDoc, doc } = await import('firebase/firestore');
        const snap = await getDoc(doc(db, 'residenciales', residencialId));
        if (!snap.exists()) {
          targetDocId = null;
        }
      } catch {
        targetDocId = null;
      }
      if (!targetDocId) {
        // Buscar por código en campo residencialID
        const residencialesRef = collection(db, 'residenciales');
        const qByCode = query(residencialesRef, where('residencialID', '==', residencialId), fbLimit(1));
        const snapByCode = await getDocs(qByCode);
        targetDocId = snapByCode.empty ? null : snapByCode.docs[0].id;
      }
      if (!targetDocId) {
        setPendingReservationsCount(0);
        return;
      }
      const reservationsRef = collection(db, 'residenciales', targetDocId, 'reservaciones');
      const q = query(reservationsRef, where('status', '==', 'pendiente'), orderBy('fecha', 'desc'));
      const snap = await getDocs(q);
      setPendingReservationsCount(snap.size);
    } catch (e) {
      console.error('Error contando reservas pendientes:', e);
      setPendingReservationsCount(null);
    }
  };

  // Contar usuarios pendientes del residencial del admin
  const fetchPendingUsersCount = async () => {
    try {
      if (!esAdminDeResidencial || !residencialId) {
        setPendingUsersCount(null);
        return;
      }
      const pending = await getUsuariosPendientes({ limit: 100 });
      const count = pending.filter(u => (u as any).residencialID === residencialId).length;
      setPendingUsersCount(count);
    } catch (e) {
      console.error('Error contando usuarios pendientes:', e);
      setPendingUsersCount(null);
    }
  };

  // Contar total de usuarios residentes
  const fetchTotalResidentesCount = async () => {
    try {
      if (!esAdminDeResidencial || !residencialId) {
        setTotalResidentesCount(null);
        return;
      }
      
      const usersRef = collection(db, 'usuarios');
      // Intento 1: por residencialID (código)
      const snap1 = await getDocs(query(usersRef, where('residencialID', '==', residencialId), where('role', '==', 'resident')));
      // Intento 2: por residencialId (docId) si el primero no trae resultados
      const snap2 = snap1.empty
        ? await getDocs(query(usersRef, where('residencialId', '==', residencialId), where('role', '==', 'resident')))
        : null;
      const snap = snap2 ?? snap1;
      
      console.log(`👥 [Dashboard] Total de residentes encontrados: ${snap.size}`);
      setTotalResidentesCount(snap.size);
    } catch (e) {
      console.error('Error contando total de residentes:', e);
      setTotalResidentesCount(null);
    }
  };
  
  // Función para cargar todos los datos
  const fetchAllData = async () => {
    try {
      setLoadingStats(true);
      setError(null);
      
      // Cargar datos básicos y de estado del sistema en paralelo
      await Promise.all([
        fetchBasicStats(),
        fetchSystemHealth(),
        fetchUniqueHousesCount(),
        fetchPendingReservationsCount(),
        fetchPendingUsersCount(),
        fetchTotalResidentesCount(),
      ]);
      

      
    } catch (err: any) {
      console.error("Error obteniendo datos del dashboard:", err);
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoadingStats(false);
    }
  };
  
  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
      
      // Configurar actualización periódica de datos
      const interval = setInterval(() => {
        fetchSystemHealth();
      }, 60000); // Actualizar cada minuto
      
      return () => clearInterval(interval);
    }
  }, [isAdmin]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };
  
  // Renderizar skeleton durante la carga
  const renderStat = (value: number | undefined, label: string, icon: React.ReactNode, className?: string) => {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {label}
          </CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <Skeleton className="h-7 w-16" />
          ) : error ? (
            <div className="text-destructive text-xs">Error al cargar</div>
          ) : (
            <div className="text-2xl font-bold">{value || 0}</div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Función para formatear tiempo relativo
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMinutes < 1) return 'Ahora mismo';
    if (diffMinutes < 60) return `Hace ${diffMinutes} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    
    return date.toLocaleDateString();
  };

  // Si está cargando o no es administrador, mostrar un indicador de carga
  if (isUserLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Verificando permisos...</h2>
          <Progress value={60} className="w-64 mb-2" />
          <p className="text-muted-foreground">Por favor espere</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 lg:px-10">
      {/* Encabezado y botón de refresh */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Bienvenido, {userData?.fullName || "Administrador"}
          </h2>
          <p className="text-muted-foreground">
            Panel de control de Zentry - Vista general del sistema
          </p>
          {esAdminDeResidencial && (
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Residencial asignado: <span className="font-medium">{residencialNombre || residencialId}</span>
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing || loadingStats}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualizando...' : 'Actualizar datos'}
        </Button>
      </div>

      {/* Indicador de error */}
      {error && (
        <div className="bg-destructive/15 text-destructive p-3 rounded-md">
          <p className="flex items-center">
            <AlertTriangle className="mr-2 h-4 w-4" />
            <span>Error: {error}</span>
          </p>
        </div>
      )}

      {/* Pestañas del Dashboard */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
        </TabsList>
        
        {/* Pestaña de Vista General */}
        <TabsContent value="overview" className="space-y-4">
          {/* Estadísticas principales */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Mostrar total de residentes (global para admin global, del residencial para admin de residencial) */}
            {renderStat(
              esAdminDeResidencial ? totalResidentesCount ?? undefined : stats?.totalResidentes, 
              "Total de Residentes", 
              <Users className="h-4 w-4 text-blue-500" />
            )}
            {/* Ocultar card de residenciales para admin de residencial */}
            {!esAdminDeResidencial && renderStat(stats?.totalResidenciales, "Residenciales", <Building className="h-4 w-4 text-purple-500" />)}
            {esAdminDeResidencial && renderStat(uniqueHousesCount ?? undefined, "Casas", <Home className="h-4 w-4 text-emerald-600" />)}
            {/* En admins, no contar globales para admins de residencial */}
            {renderStat(
              esAdminDeResidencial && stats?.globalAdmins !== undefined
                ? Math.max((stats?.totalAdmins || 0) - (stats?.globalAdmins || 0), 0)
                : stats?.totalAdmins,
              "Administradores",
              <ShieldCheck className="h-4 w-4 text-amber-500" />
            )}
          </div>

          {/* Stripe Connect removido */}
          
          {/* Estado del sistema y acciones rápidas */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Estado del Sistema</CardTitle>
                <CardDescription>
                  Información en tiempo real del sistema Zentry
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Servidor API</span>
                  <Badge variant="outline" className={
                    systemHealth?.apiStatus === 'operational' ? 'bg-green-50 text-green-700' : 
                    systemHealth?.apiStatus === 'degraded' ? 'bg-yellow-50 text-yellow-700' : 
                    'bg-red-50 text-red-700'
                  }>
                    {systemHealth?.apiStatus === 'operational' ? 'Operativo' : 
                     systemHealth?.apiStatus === 'degraded' ? 'Degradado' : 'Inactivo'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Servicios de notificaciones</span>
                  <Badge variant="outline" className={
                    systemHealth?.notificationStatus === 'operational' ? 'bg-green-50 text-green-700' : 
                    systemHealth?.notificationStatus === 'degraded' ? 'bg-yellow-50 text-yellow-700' : 
                    'bg-red-50 text-red-700'
                  }>
                    {systemHealth?.notificationStatus === 'operational' ? 'Operativo' : 
                     systemHealth?.notificationStatus === 'degraded' ? 'Degradado' : 'Inactivo'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Base de datos</span>
                  <Badge variant="outline" className={
                    systemHealth?.databaseStatus === 'operational' ? 'bg-green-50 text-green-700' : 
                    systemHealth?.databaseStatus === 'degraded' ? 'bg-yellow-50 text-yellow-700' : 
                    'bg-red-50 text-red-700'
                  }>
                    {systemHealth?.databaseStatus === 'operational' ? 'Operativa' : 
                     systemHealth?.databaseStatus === 'degraded' ? 'Degradada' : 'Inactiva'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Almacenamiento</span>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {systemHealth?.storageUsage ? `${100 - systemHealth.storageUsage}% disponible` : 'Cargando...'}
                    </div>
                    <Progress 
                      value={systemHealth?.storageUsage || 0} 
                      className="h-2 w-24" 
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Última actualización</span>
                  <span className="text-sm text-muted-foreground">
                    {systemHealth?.lastUpdate ? formatTimeAgo(systemHealth.lastUpdate) : 'Cargando...'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>
                  Gestión rápida de la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Usuarios</p>
                    <p className="text-sm text-muted-foreground">
                      Administra residentes y usuarios del sistema
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/usuarios">Ir</Link>
                  </Button>
                </div>
                {!esAdminDeResidencial && (
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <Home className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Residenciales</p>
                      <p className="text-sm text-muted-foreground">
                        Gestiona residenciales y propiedades
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/residenciales">Ir</Link>
                    </Button>
                  </div>
                )}
                {esAdminDeResidencial && (
                  <>
                    <div className="flex items-start gap-4">
                                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                      <Clock className="h-4 w-4 text-amber-600" />
                    </div>
                      <div className="flex-1">
                        <p className="font-medium">Reservas pendientes</p>
                        <p className="text-sm text-muted-foreground">Revisa y aprueba las solicitudes de áreas comunes</p>
                      </div>
                      <Badge variant="secondary" className="mr-2">{pendingReservationsCount ?? 0}</Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/dashboard/reservas">Ir</Link>
                      </Button>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                        <UserPlus className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Usuarios por aprobar</p>
                        <p className="text-sm text-muted-foreground">Aprueba o rechaza nuevos registros</p>
                      </div>
                      <Badge variant="secondary" className="mr-2">{pendingUsersCount ?? 0}</Badge>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/dashboard/usuarios">Ir</Link>
                      </Button>
                    </div>
                  </>
                )}
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                    <ShieldAlert className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Alertas de Pánico</p>
                    <p className="text-sm text-muted-foreground">
                      Ver y gestionar alertas activas
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/alertas-panico">Ir</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        

          

          

          

        

      </Tabs>
    </div>
  );
} 