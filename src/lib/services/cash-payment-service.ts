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
  getDoc
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/lib/firebase/config';

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
  status: 'completed' | 'pending' | 'cancelled' | 'pending_validation';
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
  isProduct?: boolean;
  productId?: string;
  productPrice?: number;
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

      console.log('🚀 Registrando pago en efectivo a través de Cloud Function (Atómico)...');

      const registerFn = httpsCallable<{ residencialId: string, data: any }, { success: boolean, paymentId: string }>(functions, 'apiRegisterDirectCashPayment');

      const result = await registerFn({
        residencialId,
        data: {
          houseId: paymentData.houseId,
          amount: paymentData.amount,
          concept: paymentData.concept || 'Pago en efectivo',
          userId: paymentData.userId || '',
          userName: paymentData.userName || '',
          userEmail: paymentData.userEmail || '',
          userAddress: paymentData.userAddress || {},
          isProduct: paymentData.isProduct || false,
          productId: paymentData.productId || null,
          productPrice: paymentData.productPrice || null
        }
      });

      console.log(`✅ Pago registrado exitosamente con ID: ${result.data.paymentId}`);
      return result.data.paymentId;
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
      console.log(`🔍 Obteniendo pagos en efectivo para residencial: ${residencialId} — [paymentIntents SoT]`);

      const pagosRef = collection(db, 'residenciales', residencialId, 'paymentIntents');

      // Obtener pagos de la nueva colección SoT (solo método cash)
      let q = query(pagosRef, where('method', '==', 'cash'), orderBy('createdAt', 'desc'));

      // Si se especifican fechas, filtrar por ellas
      if (fechaInicio && fechaFin) {
        q = query(
          pagosRef,
          where('method', '==', 'cash'),
          where('createdAt', '>=', Timestamp.fromDate(fechaInicio)),
          where('createdAt', '<=', Timestamp.fromDate(fechaFin)),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const pagos: CashPayment[] = [];

      console.log(`🔍 [CASH] Query ejecutado. Documentos encontrados: ${querySnapshot.docs.length}`);

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();

        // Convert cents to standard currency for UI
        const amount = data.amountCents ? data.amountCents / 100 : (data.amount || 0);

        const pago: CashPayment = {
          id: docSnapshot.id,
          residencialId: data.residencialId || residencialId,
          userId: data.residentId || data.userId || '',
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          userAddress: data.userAddress || { calle: '', houseNumber: '', pais: '', residencialID: '' },
          amount: amount,
          currency: data.currency || 'MXN',
          concept: data.concept || '',
          paymentMethod: 'cash',
          status: data.status || 'completed',
          fechaPago: data.createdAt || data.fechaPago || new Date(),
          registradoPor: data.registeredBy || data.registradoPor || '',
          observaciones: data.observations || data.observaciones || '',
          montoEsperado: amount,
          comprobanteEfectivo: data.proofUrl || data.comprobanteEfectivo || '',
        };

        pagos.push(pago);
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
      console.log(`🏠 Obteniendo pagos en efectivo para casa: ${calle} #${houseNumber} — [paymentIntents SoT]`);

      const pagosRef = collection(db, 'residenciales', residencialId, 'paymentIntents');
      const q = query(
        pagosRef,
        where('method', '==', 'cash'),
        where('houseId', '==', `${calle}-${houseNumber}`.toLowerCase().replace(/\s+/g, '_')),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const pagos: CashPayment[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const amount = data.amountCents ? data.amountCents / 100 : (data.amount || 0);

        const pago: CashPayment = {
          id: docSnapshot.id,
          residencialId: data.residencialId || residencialId,
          userId: data.residentId || data.userId || '',
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          userAddress: data.userAddress || { calle: '', houseNumber: '', pais: '', residencialID: '' },
          amount: amount,
          currency: data.currency || 'MXN',
          concept: data.concept || '',
          paymentMethod: 'cash',
          status: data.status || 'completed',
          fechaPago: data.createdAt || data.fechaPago || new Date(),
          registradoPor: data.registeredBy || data.registradoPor || '',
          observaciones: data.observations || data.observaciones || '',
          montoEsperado: amount,
          comprobanteEfectivo: data.proofUrl || data.comprobanteEfectivo || '',
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
        const estado = (ultimoPago && ultimoPago > haceUnMes ? 'al_dia' : 'pendiente') as 'al_dia' | 'pendiente' | 'moroso';

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
   * Escuchar cambios en pagos en efectivo (tiempo real)
   */
  static watchCashPayments(
    residencialId: string,
    callback: (pagos: CashPayment[]) => void
  ): () => void {
    console.log(`🔔 Suscribiéndose a intents de pago en efectivo para residencial: ${residencialId} — [paymentIntents SoT]`);

    const pagosRef = collection(db, 'residenciales', residencialId, 'paymentIntents');
    const q = query(
      pagosRef,
      where('method', '==', 'cash'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const pagos: CashPayment[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const amount = data.amountCents ? data.amountCents / 100 : (data.amount || 0);

        const pago: CashPayment = {
          id: docSnapshot.id,
          residencialId: data.residencialId || residencialId,
          userId: data.residentId || data.userId || '',
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          userAddress: data.userAddress || { calle: '', houseNumber: '', pais: '', residencialID: '' },
          amount: amount,
          currency: data.currency || 'MXN',
          concept: data.concept || '',
          paymentMethod: 'cash',
          status: data.status || 'completed',
          fechaPago: data.createdAt || data.fechaPago || new Date(),
          registradoPor: data.registeredBy || data.registradoPor || '',
          observaciones: data.observations || data.observaciones || '',
          montoEsperado: amount,
          comprobanteEfectivo: data.proofUrl || data.comprobanteEfectivo || '',
        };

        pagos.push(pago);
      });

      console.log(`📣 Actualización en tiempo real — [paymentIntents:cash]: ${pagos.length} pagos`);
      callback(pagos);
    });
  }

  /**
   * Eliminar un pago en efectivo
   */
  static async deleteCashPayment(_residencialId: string, _paymentId: string): Promise<void> {
    throw new Error('El borrado directo de paymentIntents está deshabilitado. Use el flujo oficial v2 en backend.');
  }
}
