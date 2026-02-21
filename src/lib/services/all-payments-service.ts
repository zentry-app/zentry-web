import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface AllPayment {
  id: string;
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
  paymentMethod: 'cash' | 'transfer';
  paymentType: 'efectivo' | 'transferencia';
  status: string;
  fechaPago: Date | Timestamp;
  registradoPor: string;
  observaciones?: string;
  montoEsperado?: number;
  diferencia?: number;
  comprobanteEfectivo?: string;
  comprobanteUrl?: string;
  numeroMovimiento?: string;
  bancoOrigen?: string;
  fechaSubida?: Date | Timestamp;
  fechaValidacion?: Date | Timestamp;
  validadoPor?: string;
}

export class AllPaymentsService {
  /**
   * Obtiene TODOS los pagos (efectivo y transferencias) de un residencial
   */
  static async getAllPayments(
    residencialId: string,
    fechaInicio?: Date,
    fechaFin?: Date
  ): Promise<AllPayment[]> {
    try {
      console.log(`🔍 Obteniendo TODOS los pagos para residencial: ${residencialId}`);

      const pagosRef = collection(db, 'residenciales', residencialId, 'pagos');

      // Obtener TODOS los pagos sin filtros de paymentMethod
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
      const pagos: AllPayment[] = [];

      console.log(`🔍 [ALL] Query ejecutado. Documentos encontrados: ${querySnapshot.docs.length}`);

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        console.log(`🔍 [ALL] Procesando documento ${docSnapshot.id}:`, {
          paymentMethod: data.paymentMethod,
          paymentType: data.paymentType,
          amount: data.amount,
          userName: data.userName,
          fechaPago: data.fechaPago
        });

        const pago: AllPayment = {
          id: docSnapshot.id,
          residencialId: data.residencialId || '',
          userId: data.userId || '',
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          userAddress: {
            calle: data.houseName ? data.houseName.split('-')[1] || '' : (data.userAddress?.calle || ''),
            houseNumber: data.houseName ? data.houseName.split('-')[2] || '' : (data.userAddress?.houseNumber || ''),
            pais: data.userAddress?.pais || 'México',
            residencialID: data.residencialId || '',
          },
          amount: data.amount || 0,
          currency: data.currency || 'MXN',
          concept: data.concepto || data.concept || '',
          paymentMethod: data.paymentMethod || 'transfer', // Default a transfer si no está definido
          paymentType: data.paymentType || (data.paymentMethod === 'cash' ? 'efectivo' : 'transferencia'),
          status: data.status || 'completed',
          fechaPago: data.fechaPago || data.fechaSubida || new Date(),
          registradoPor: data.registradoPor || '',
          observaciones: data.observaciones || '',
          montoEsperado: data.montoEsperado || null,
          diferencia: data.diferencia || null,
          comprobanteEfectivo: data.comprobanteEfectivo || '',
          comprobanteUrl: data.comprobanteUrl || '',
          numeroMovimiento: data.referencia || data.numeroMovimiento || '',
          bancoOrigen: data.bancoOrigen || '',
          fechaSubida: data.fechaSubida || null,
          fechaValidacion: data.fechaValidacion || null,
          validadoPor: data.validadoPor || '',
        };

        pagos.push(pago);
      });

      console.log(`✅ ${pagos.length} pagos obtenidos (todos los tipos)`);
      return pagos;
    } catch (error) {
      console.error('❌ Error al obtener todos los pagos:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de todos los pagos
   */
  static async getPaymentStats(
    residencialId: string,
    fechaInicio?: Date,
    fechaFin?: Date
  ): Promise<{
    totalPagos: number;
    pagosEfectivo: number;
    pagosTransferencia: number;
    totalEfectivo: number;
    totalTransferencia: number;
    totalGeneral: number;
  }> {
    try {
      const pagos = await this.getAllPayments(residencialId, fechaInicio, fechaFin);

      const pagosEfectivo = pagos.filter(p => p.paymentMethod === 'cash');
      const pagosTransferencia = pagos.filter(p => p.paymentMethod === 'transfer');

      const totalEfectivo = pagosEfectivo.reduce((sum, p) => sum + p.amount, 0);
      const totalTransferencia = pagosTransferencia.reduce((sum, p) => sum + p.amount, 0);

      return {
        totalPagos: pagos.length,
        pagosEfectivo: pagosEfectivo.length,
        pagosTransferencia: pagosTransferencia.length,
        totalEfectivo,
        totalTransferencia,
        totalGeneral: totalEfectivo + totalTransferencia,
      };
    } catch (error) {
      console.error('❌ Error al obtener estadísticas de pagos:', error);
      throw error;
    }
  }
}
