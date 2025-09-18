import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface CashPayment {
  id?: string;
  residencialId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAddress: {
    calle: string;
    houseNumber: string;
    pais: string;
    residencialID: string;
  };
  amount: number;
  currency: string;
  concept: string;
  paymentMethod: 'cash';
  status: 'completed' | 'pending' | 'cancelled';
  fechaPago: Timestamp | Date;
  registradoPor: string; // UID del admin que registró el pago
  observaciones?: string;
  // Campos adicionales para control
  montoEsperado?: number;
  diferencia?: number; // Diferencia entre monto esperado y real
  comprobanteEfectivo?: string; // URL de comprobante si se sube
  // 🆕 Campos unificados para compatibilidad con transferencias
  paymentType?: string; // Tipo de pago en español
  fechaSubida?: Timestamp | Date; // Fecha de subida/registro
  fechaValidacion?: Timestamp | Date; // Fecha de validación
  validadoPor?: string; // Quien validó el pago
  comprobanteUrl?: string; // URL del comprobante
  numeroMovimiento?: string; // Número de movimiento
  bancoOrigen?: string; // Banco de origen
  // 🆕 Campos adicionales para compatibilidad con Flutter
  houseId?: string; // ID de la casa (crítico para Flutter)
  mes?: string; // Mes del pago (ej: "2025-09")
  concepto?: string; // Concepto del pago (ej: "Cuota Mensual")
}

export interface CashPaymentStats {
  totalPagosEfectivo: number;
  totalRecaudadoEfectivo: number;
  pagosEsteMes: number;
  recaudadoEsteMes: number;
  casasConPagos: number;
  casasSinPagos: number;
}

/**
 * Servicio para manejar pagos en efectivo ligados a casas
 */
export class CashPaymentService {
  
  /**
   * Registrar un pago en efectivo
   */
  static async registerCashPayment(
    residencialId: string,
    paymentData: Omit<CashPayment, 'id' | 'fechaPago' | 'registradoPor'>
  ): Promise<string> {
    try {
      console.log(`💰 Registrando pago en efectivo para ${paymentData.userName}`);
      
      const pagosRef = collection(db, 'residenciales', residencialId, 'pagos');
      
      const newPayment: Omit<CashPayment, 'id'> = {
        ...paymentData,
        fechaPago: Timestamp.now(),
        registradoPor: 'admin', // TODO: Obtener UID del admin actual
        status: 'completed',
        paymentMethod: 'cash',
        currency: paymentData.currency || 'MXN',
        // 🆕 Campos unificados para compatibilidad con transferencias
        paymentType: 'efectivo', // Tipo de pago en español
        fechaSubida: Timestamp.now(), // Fecha de subida/registro
        fechaValidacion: Timestamp.now(), // Para efectivo se valida inmediatamente
        validadoPor: 'admin', // Admin que registró el pago
        observaciones: '', // Campo para observaciones
        montoEsperado: paymentData.amount, // Monto esperado (igual al real para efectivo)
        comprobanteUrl: '', // No hay comprobante para efectivo
        numeroMovimiento: '', // No aplica para efectivo
        bancoOrigen: '', // No aplica para efectivo
      };
      
      const docRef = await addDoc(pagosRef, newPayment);
      
      console.log(`✅ Pago en efectivo registrado con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error al registrar pago en efectivo:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los pagos en efectivo de un residencial
   */
  static async getCashPayments(
    residencialId: string,
    fechaInicio?: Date,
    fechaFin?: Date
  ): Promise<CashPayment[]> {
    try {
      console.log(`🔍 Obteniendo pagos en efectivo para residencial: ${residencialId}`);
      
      const pagosRef = collection(db, 'residenciales', residencialId, 'pagos');
      
      // TEMPORAL: Obtener TODOS los pagos sin filtros para debuggear
      let q = query(pagosRef, orderBy('fechaPago', 'desc'));
      
      // Si se especifican fechas, filtrar por ellas
      if (fechaInicio && fechaFin) {
        q = query(
          pagosRef,
          where('fechaPago', '>=', Timestamp.fromDate(fechaInicio)),
          where('fechaPago', '<=', Timestamp.fromDate(fechaFin)),
          orderBy('fechaPago', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const pagos: CashPayment[] = [];
      
      console.log(`🔍 [CASH] Query ejecutado. Documentos encontrados: ${querySnapshot.docs.length}`);
      
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        console.log(`🔍 [CASH] Procesando documento ${docSnapshot.id}:`, {
          paymentMethod: data.paymentMethod,
          amount: data.amount,
          userName: data.userName,
          fechaPago: data.fechaPago
        });
        const pago: CashPayment = {
          id: docSnapshot.id,
          residencialId: data.residencialId || '',
          userId: data.userId || '',
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          userAddress: data.userAddress || {
            calle: '',
            houseNumber: '',
            pais: '',
            residencialID: '',
          },
          amount: data.amount || 0,
          currency: data.currency || 'MXN',
          concept: data.concept || '',
          paymentMethod: 'cash',
          status: data.status || 'completed',
          fechaPago: data.fechaPago || new Date(),
          registradoPor: data.registradoPor || '',
          observaciones: data.observaciones || '',
          montoEsperado: data.montoEsperado || null,
          diferencia: data.diferencia || null,
          comprobanteEfectivo: data.comprobanteEfectivo || '',
        };
        
        // Solo agregar si es un pago en efectivo
        if (data.paymentMethod === 'cash') {
          pagos.push(pago);
        } else {
          console.log(`🔍 [CASH] Saltando pago (no es cash): ${data.paymentMethod}`);
        }
      });
      
      console.log(`✅ ${pagos.length} pagos en efectivo obtenidos`);
      return pagos;
    } catch (error) {
      console.error('❌ Error al obtener pagos en efectivo:', error);
      throw error;
    }
  }

  /**
   * Obtener pagos en efectivo por casa específica
   */
  static async getCashPaymentsByHouse(
    residencialId: string,
    calle: string,
    houseNumber: string
  ): Promise<CashPayment[]> {
    try {
      console.log(`🏠 Obteniendo pagos en efectivo para casa: ${calle} #${houseNumber}`);
      
      const pagosRef = collection(db, 'residenciales', residencialId, 'pagos');
      const q = query(
        pagosRef,
        where('paymentMethod', '==', 'cash'),
        where('userAddress.calle', '==', calle),
        where('userAddress.houseNumber', '==', houseNumber),
        orderBy('fechaPago', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const pagos: CashPayment[] = [];
      
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const pago: CashPayment = {
          id: docSnapshot.id,
          residencialId: data.residencialId || '',
          userId: data.userId || '',
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          userAddress: data.userAddress || {
            calle: '',
            houseNumber: '',
            pais: '',
            residencialID: '',
          },
          amount: data.amount || 0,
          currency: data.currency || 'MXN',
          concept: data.concept || '',
          paymentMethod: 'cash',
          status: data.status || 'completed',
          fechaPago: data.fechaPago || new Date(),
          registradoPor: data.registradoPor || '',
          observaciones: data.observaciones || '',
          montoEsperado: data.montoEsperado || null,
          diferencia: data.diferencia || null,
          comprobanteEfectivo: data.comprobanteEfectivo || '',
        };
        
        pagos.push(pago);
      });
      
      console.log(`✅ ${pagos.length} pagos en efectivo obtenidos para la casa`);
      return pagos;
    } catch (error) {
      console.error('❌ Error al obtener pagos en efectivo por casa:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de pagos en efectivo
   */
  static async getCashPaymentStats(residencialId: string): Promise<CashPaymentStats> {
    try {
      const pagos = await this.getCashPayments(residencialId);
      
      const ahora = new Date();
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      
      const pagosEsteMes = pagos.filter(pago => {
        const fechaPago = pago.fechaPago instanceof Timestamp 
          ? pago.fechaPago.toDate() 
          : new Date(pago.fechaPago);
        return fechaPago >= inicioMes;
      });
      
      const casasUnicas = new Set(
        pagos.map(p => `${p.userAddress.calle}-${p.userAddress.houseNumber}`)
      );
      
      const stats: CashPaymentStats = {
        totalPagosEfectivo: pagos.length,
        totalRecaudadoEfectivo: pagos.reduce((sum, p) => sum + p.amount, 0),
        pagosEsteMes: pagosEsteMes.length,
        recaudadoEsteMes: pagosEsteMes.reduce((sum, p) => sum + p.amount, 0),
        casasConPagos: casasUnicas.size,
        casasSinPagos: 0, // TODO: Calcular basado en total de casas del residencial
      };
      
      console.log('📊 Estadísticas de pagos en efectivo:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas de pagos en efectivo:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen de pagos por casa
   */
  static async getPaymentsByHouseSummary(residencialId: string): Promise<{
    casa: string;
    totalPagos: number;
    totalRecaudado: number;
    ultimoPago?: Date;
    estado: 'al_dia' | 'pendiente' | 'moroso';
  }[]> {
    try {
      const pagos = await this.getCashPayments(residencialId);
      
      // Agrupar por casa
      const pagosPorCasa = new Map<string, CashPayment[]>();
      
      pagos.forEach(pago => {
        const claveCasa = `${pago.userAddress.calle}-${pago.userAddress.houseNumber}`;
        if (!pagosPorCasa.has(claveCasa)) {
          pagosPorCasa.set(claveCasa, []);
        }
        pagosPorCasa.get(claveCasa)!.push(pago);
      });
      
      // Crear resumen
      const resumen = Array.from(pagosPorCasa.entries()).map(([casa, pagosCasa]) => {
        const totalRecaudado = pagosCasa.reduce((sum, p) => sum + p.amount, 0);
        const ultimoPago = pagosCasa
          .map(p => p.fechaPago instanceof Timestamp ? p.fechaPago.toDate() : new Date(p.fechaPago))
          .sort((a, b) => b.getTime() - a.getTime())[0];
        
        // Determinar estado (simplificado)
        const ahora = new Date();
        const haceUnMes = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
        const estado = ultimoPago > haceUnMes ? 'al_dia' : 'pendiente';
        
        return {
          casa,
          totalPagos: pagosCasa.length,
          totalRecaudado,
          ultimoPago,
          estado,
        };
      });
      
      console.log(`📋 Resumen de pagos por casa: ${resumen.length} casas`);
      return resumen;
    } catch (error) {
      console.error('❌ Error al obtener resumen por casa:', error);
      throw error;
    }
  }

  /**
   * Actualizar un pago en efectivo
   */
  static async updateCashPayment(
    residencialId: string,
    pagoId: string,
    updates: Partial<CashPayment>
  ): Promise<void> {
    try {
      console.log(`🔄 Actualizando pago en efectivo: ${pagoId}`);
      
      const pagoRef = doc(db, 'residenciales', residencialId, 'pagos', pagoId);
      await updateDoc(pagoRef, updates);
      
      console.log(`✅ Pago en efectivo actualizado exitosamente`);
    } catch (error) {
      console.error('❌ Error al actualizar pago en efectivo:', error);
      throw error;
    }
  }

  /**
   * Escuchar cambios en pagos en efectivo (tiempo real)
   */
  static watchCashPayments(
    residencialId: string,
    callback: (pagos: CashPayment[]) => void
  ): () => void {
    console.log(`🔔 Suscribiéndose a pagos en efectivo para residencial: ${residencialId}`);
    
    const pagosRef = collection(db, 'residenciales', residencialId, 'pagos');
    const q = query(
      pagosRef,
      where('paymentMethod', '==', 'cash'),
      orderBy('fechaPago', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const pagos: CashPayment[] = [];
      
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const pago: CashPayment = {
          id: docSnapshot.id,
          residencialId: data.residencialId || '',
          userId: data.userId || '',
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          userAddress: data.userAddress || {
            calle: '',
            houseNumber: '',
            pais: '',
            residencialID: '',
          },
          amount: data.amount || 0,
          currency: data.currency || 'MXN',
          concept: data.concept || '',
          paymentMethod: 'cash',
          status: data.status || 'completed',
          fechaPago: data.fechaPago || new Date(),
          registradoPor: data.registradoPor || '',
          observaciones: data.observaciones || '',
          montoEsperado: data.montoEsperado || null,
          diferencia: data.diferencia || null,
          comprobanteEfectivo: data.comprobanteEfectivo || '',
        };
        
        pagos.push(pago);
      });
      
      console.log(`📣 Actualización en tiempo real: ${pagos.length} pagos en efectivo`);
      callback(pagos);
    });
  }

  /**
   * Eliminar un pago en efectivo
   */
  static async deleteCashPayment(residencialId: string, paymentId: string): Promise<void> {
    try {
      console.log(`🗑️ Eliminando pago en efectivo: ${paymentId}`);
      
      const paymentRef = doc(db, 'residenciales', residencialId, 'pagos', paymentId);
      await deleteDoc(paymentRef);
      
      console.log(`✅ Pago en efectivo eliminado exitosamente: ${paymentId}`);
    } catch (error) {
      console.error('❌ Error al eliminar pago en efectivo:', error);
      throw error;
    }
  }
}
