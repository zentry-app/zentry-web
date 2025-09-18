import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  getDoc,
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface HousePaymentStatus {
  houseId: string; // Formato: "calle-houseNumber" ej: "Av. Principal-123"
  calle: string;
  houseNumber: string;
  residencialId: string;
  userId?: string; // Usuario asociado a la casa
  userName?: string;
  userEmail?: string;
  
  // Estados de pago
  status: 'al_dia' | 'moroso' | 'pendiente';
  ultimoPago?: Timestamp | Date;
  montoUltimoPago?: number;
  conceptoUltimoPago?: string;
  
  // Información de morosidad
  mesesMoroso?: number;
  montoAdeudado?: number;
  fechaVencimiento?: Timestamp | Date;
  
  // Metadatos
  fechaActualizacion: Timestamp | Date;
  actualizadoPor: string;
}

export interface PaymentSummary {
  houseId: string;
  calle: string;
  houseNumber: string;
  totalPagos: number;
  totalRecaudado: number;
  ultimoPago?: Date;
  estado: 'al_dia' | 'moroso' | 'pendiente';
  mesesSinPagar?: number;
  montoAdeudado?: number;
}

/**
 * Servicio para manejar el estado de pagos por casa (houseID)
 */
export class HousePaymentStatusService {
  
  /**
   * Generar houseID único
   */
  static generateHouseId(calle: string, houseNumber: string): string {
    return `${calle.trim()}-${houseNumber.trim()}`.toLowerCase().replace(/\s+/g, '_');
  }

  /**
   * Obtener estado de pagos de todas las casas de un residencial
   */
  static async getHousePaymentStatuses(residencialId: string): Promise<HousePaymentStatus[]> {
    try {
      console.log(`🏠 Obteniendo estados de pagos por casa para residencial: ${residencialId}`);
      
      // Obtener todos los pagos del residencial
      const pagosRef = collection(db, 'residenciales', residencialId, 'pagos');
      const pagosQuery = query(pagosRef, orderBy('fechaSubida', 'desc'));
      const pagosSnapshot = await getDocs(pagosQuery);
      
      // Agrupar pagos por casa
      const pagosPorCasa = new Map<string, any[]>();
      
      pagosSnapshot.forEach((doc) => {
        const data = doc.data();
        const houseId = this.generateHouseId(data.userAddress?.calle || '', data.userAddress?.houseNumber || '');
        
        if (!pagosPorCasa.has(houseId)) {
          pagosPorCasa.set(houseId, []);
        }
        pagosPorCasa.get(houseId)!.push({
          id: doc.id,
          ...data,
          houseId
        });
      });
      
      // Crear estados de casas
      const estadosCasas: HousePaymentStatus[] = [];
      const ahora = new Date();
      
      for (const [houseId, pagos] of pagosPorCasa) {
        if (pagos.length === 0) continue;
        
        const primerPago = pagos[0];
        const ultimoPago = pagos.find(p => p.status === 'validated' || p.status === 'completed');
        
        // Calcular estado de morosidad
        let status: 'al_dia' | 'moroso' | 'pendiente' = 'pendiente';
        let mesesMoroso = 0;
        let montoAdeudado = 0;
        
        if (ultimoPago) {
          const fechaUltimoPago = ultimoPago.fechaSubida instanceof Timestamp 
            ? ultimoPago.fechaSubida.toDate() 
            : new Date(ultimoPago.fechaSubida);
          
          const mesesTranscurridos = this.calculateMonthsDifference(fechaUltimoPago, ahora);
          
          if (mesesTranscurridos <= 1) {
            status = 'al_dia';
          } else if (mesesTranscurridos <= 3) {
            status = 'pendiente';
            mesesMoroso = mesesTranscurridos - 1;
          } else {
            status = 'moroso';
            mesesMoroso = mesesTranscurridos - 1;
            montoAdeudado = mesesMoroso * (ultimoPago.montoEsperado || ultimoPago.amount || 0);
          }
        } else {
          // Sin pagos validados, considerar moroso
          status = 'moroso';
          mesesMoroso = 6; // Asumir 6 meses de morosidad
          montoAdeudado = mesesMoroso * (primerPago.montoEsperado || primerPago.amount || 0);
        }
        
        const estadoCasa: HousePaymentStatus = {
          houseId,
          calle: primerPago.userAddress?.calle || '',
          houseNumber: primerPago.userAddress?.houseNumber || '',
          residencialId,
          userId: primerPago.userId,
          userName: primerPago.userName,
          userEmail: primerPago.userEmail,
          status,
          ultimoPago: ultimoPago?.fechaSubida,
          montoUltimoPago: ultimoPago?.amount,
          conceptoUltimoPago: ultimoPago?.concept,
          mesesMoroso: mesesMoroso > 0 ? mesesMoroso : undefined,
          montoAdeudado: montoAdeudado > 0 ? montoAdeudado : undefined,
          fechaVencimiento: this.calculateNextDueDate(ultimoPago?.fechaSubida),
          fechaActualizacion: Timestamp.now(),
          actualizadoPor: 'system',
        };
        
        estadosCasas.push(estadoCasa);
      }
      
      console.log(`✅ ${estadosCasas.length} estados de casas calculados`);
      return estadosCasas;
    } catch (error) {
      console.error('❌ Error al obtener estados de pagos por casa:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen de pagos por casa
   */
  static async getPaymentSummaryByHouse(residencialId: string): Promise<PaymentSummary[]> {
    try {
      const estados = await this.getHousePaymentStatuses(residencialId);
      
      return estados.map(estado => ({
        houseId: estado.houseId,
        calle: estado.calle,
        houseNumber: estado.houseNumber,
        totalPagos: 0, // TODO: Calcular desde pagos reales
        totalRecaudado: 0, // TODO: Calcular desde pagos reales
        ultimoPago: estado.ultimoPago instanceof Timestamp 
          ? estado.ultimoPago.toDate() 
          : estado.ultimoPago,
        estado: estado.status,
        mesesSinPagar: estado.mesesMoroso,
        montoAdeudado: estado.montoAdeudado,
      }));
    } catch (error) {
      console.error('❌ Error al obtener resumen de pagos:', error);
      throw error;
    }
  }

  /**
   * Obtener casas morosas
   */
  static async getMorososHouses(residencialId: string): Promise<HousePaymentStatus[]> {
    try {
      const estados = await this.getHousePaymentStatuses(residencialId);
      return estados.filter(estado => estado.status === 'moroso');
    } catch (error) {
      console.error('❌ Error al obtener casas morosas:', error);
      throw error;
    }
  }

  /**
   * Obtener casas al día
   */
  static async getAlDiaHouses(residencialId: string): Promise<HousePaymentStatus[]> {
    try {
      const estados = await this.getHousePaymentStatuses(residencialId);
      return estados.filter(estado => estado.status === 'al_dia');
    } catch (error) {
      console.error('❌ Error al obtener casas al día:', error);
      throw error;
    }
  }

  /**
   * Actualizar estado de una casa específica
   */
  static async updateHouseStatus(
    residencialId: string,
    houseId: string,
    updates: Partial<HousePaymentStatus>
  ): Promise<void> {
    try {
      console.log(`🔄 Actualizando estado de casa: ${houseId}`);
      
      const estadoRef = doc(db, 'residenciales', residencialId, 'housePaymentStatus', houseId);
      await updateDoc(estadoRef, {
        ...updates,
        fechaActualizacion: Timestamp.now(),
      });
      
      console.log(`✅ Estado de casa ${houseId} actualizado`);
    } catch (error) {
      console.error('❌ Error al actualizar estado de casa:', error);
      throw error;
    }
  }

  /**
   * Guardar estado de casa en Firestore
   */
  static async saveHouseStatus(
    residencialId: string,
    houseStatus: HousePaymentStatus
  ): Promise<void> {
    try {
      console.log(`💾 Guardando estado de casa: ${houseStatus.houseId}`);
      
      const estadoRef = doc(db, 'residenciales', residencialId, 'housePaymentStatus', houseStatus.houseId);
      await updateDoc(estadoRef, {
        ...houseStatus,
        fechaActualizacion: Timestamp.now(),
      });
      
      console.log(`✅ Estado de casa ${houseStatus.houseId} guardado`);
    } catch (error) {
      console.error('❌ Error al guardar estado de casa:', error);
      throw error;
    }
  }

  /**
   * Escuchar cambios en estados de casas (tiempo real)
   */
  static watchHouseStatuses(
    residencialId: string,
    callback: (estados: HousePaymentStatus[]) => void
  ): () => void {
    console.log(`🔔 Suscribiéndose a estados de casas para residencial: ${residencialId}`);
    
    const estadosRef = collection(db, 'residenciales', residencialId, 'housePaymentStatus');
    const q = query(estadosRef, orderBy('fechaActualizacion', 'desc'));
    
    return onSnapshot(q, (querySnapshot) => {
      const estados: HousePaymentStatus[] = [];
      
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const estado: HousePaymentStatus = {
          houseId: data.houseId || docSnapshot.id,
          calle: data.calle || '',
          houseNumber: data.houseNumber || '',
          residencialId: data.residencialId || residencialId,
          userId: data.userId || '',
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          status: data.status || 'pendiente',
          ultimoPago: data.ultimoPago || null,
          montoUltimoPago: data.montoUltimoPago || null,
          conceptoUltimoPago: data.conceptoUltimoPago || '',
          mesesMoroso: data.mesesMoroso || null,
          montoAdeudado: data.montoAdeudado || null,
          fechaVencimiento: data.fechaVencimiento || null,
          fechaActualizacion: data.fechaActualizacion || Timestamp.now(),
          actualizadoPor: data.actualizadoPor || 'system',
        };
        
        estados.push(estado);
      });
      
      console.log(`📣 Actualización en tiempo real: ${estados.length} estados de casas`);
      callback(estados);
    });
  }

  /**
   * Calcular diferencia de meses entre dos fechas
   */
  private static calculateMonthsDifference(date1: Date, date2: Date): number {
    const year1 = date1.getFullYear();
    const month1 = date1.getMonth();
    const year2 = date2.getFullYear();
    const month2 = date2.getMonth();
    
    return (year2 - year1) * 12 + (month2 - month1);
  }

  /**
   * Calcular próxima fecha de vencimiento
   */
  private static calculateNextDueDate(ultimoPago?: Timestamp | Date): Timestamp | Date {
    const ahora = new Date();
    const proximoMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
    return Timestamp.fromDate(proximoMes);
  }

  /**
   * Obtener estadísticas de morosidad
   */
  static async getMorosidadStats(residencialId: string): Promise<{
    totalCasas: number;
    casasAlDia: number;
    casasPendientes: number;
    casasMorosas: number;
    porcentajeMorosidad: number;
    montoTotalAdeudado: number;
  }> {
    try {
      const estados = await this.getHousePaymentStatuses(residencialId);
      
      const stats = {
        totalCasas: estados.length,
        casasAlDia: estados.filter(e => e.status === 'al_dia').length,
        casasPendientes: estados.filter(e => e.status === 'pendiente').length,
        casasMorosas: estados.filter(e => e.status === 'moroso').length,
        porcentajeMorosidad: 0,
        montoTotalAdeudado: estados.reduce((sum, e) => sum + (e.montoAdeudado || 0), 0),
      };
      
      stats.porcentajeMorosidad = stats.totalCasas > 0 
        ? (stats.casasMorosas / stats.totalCasas) * 100 
        : 0;
      
      console.log('📊 Estadísticas de morosidad:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas de morosidad:', error);
      throw error;
    }
  }
}
