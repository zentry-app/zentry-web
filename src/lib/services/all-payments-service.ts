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
      console.log(`🔍 Obteniendo TODOS los pagos para residencial: ${residencialId} — [paymentIntents SoT]`);

      const pagosRef = collection(db, 'residenciales', residencialId, 'paymentIntents');

      // Obtener TODOS los pagos de la nueva colección SoT
      let q = query(pagosRef, orderBy('createdAt', 'desc'));

      // Si se especifican fechas, filtrar por ellas
      if (fechaInicio && fechaFin) {
        q = query(
          pagosRef,
          where('createdAt', '>=', Timestamp.fromDate(fechaInicio)),
          where('createdAt', '<=', Timestamp.fromDate(fechaFin)),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const pagos: AllPayment[] = [];

      console.log(`🔍 [ALL] Query ejecutado. Documentos encontrados: ${querySnapshot.docs.length}`);

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();

        // El monto en paymentIntents está en CENTS
        const amount = data.amountCents ? data.amountCents / 100 : (data.amount || 0);

        const payment: AllPayment = {
          id: docSnapshot.id,
          residencialId: data.residencialId || residencialId,
          userId: data.residentId || data.userId || '',
          userName: data.userName || data.fullName || 'N/A',
          userEmail: data.userEmail || data.email || '',
          userAddress: {
            calle: data.userAddress?.calle || (data.houseId && data.houseId.includes('-') ? data.houseId.split('-')[0] : data.houseId || ''),
            houseNumber: data.userAddress?.houseNumber || (data.houseId && data.houseId.includes('-') ? data.houseId.split('-')[1] : ''),
            pais: data.userAddress?.pais || 'México',
            residencialID: data.residencialId || residencialId,
          },
          amount: amount,
          currency: data.currency || 'MXN',
          concept: data.concept || '',
          paymentMethod: data.method === 'cash' ? 'cash' : 'transfer',
          paymentType: data.method === 'cash' ? 'efectivo' : 'transferencia',
          status: data.status || 'pending_validation',
          fechaPago: data.createdAt || new Date(),
          registradoPor: data.registeredBy || data.reportedBy || '',
          observaciones: data.observations || data.validationNote || '',
          comprobanteUrl: data.proofUrl || data.receiptUrl || '',
          numeroMovimiento: data.referenceNumber || '',
          fechaSubida: data.createdAt || null,
          fechaValidacion: data.validatedAt || null,
          validadoPor: data.validatedBy || '',
        };

        pagos.push(payment);
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
