import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage, functions } from '@/lib/firebase/config';

export interface PaymentReceipt {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  residencialId: string;
  houseId: string; // Nuevo campo para identificar la casa
  amount: number;
  currency: string;
  concept: string;
  comprobanteUrl?: string;
  numeroMovimiento?: string;
  bancoOrigen?: string;
  status: 'pending_validation' | 'validated' | 'rejected' | 'paid';
  fechaSubida: Timestamp | Date;
  fechaValidacion?: Timestamp | Date;
  validadoPor?: string;
  observaciones?: string;
  montoEsperado: number;
  // Datos adicionales del usuario
  userAddress?: {
    calle: string;
    houseNumber: string;
    pais: string;
    residencialID: string;
  };
  // 🆕 Campos unificados para compatibilidad con efectivo
  paymentMethod?: 'transfer' | 'cash'; // Método de pago
  paymentType?: string; // Tipo de pago en español
  fechaPago?: Timestamp | Date; // Fecha del pago (unificada)
  registradoPor?: string; // Quien registró el pago
}

export interface PaymentValidation {
  pagoId: string;
  status: 'validated' | 'rejected';
  observaciones?: string;
  validadoPor: string;
}

/**
 * Servicio para manejar la validación de pagos desde la web
 */
export class PaymentValidationService {

  /**
   * Generar houseID único
   */
  static generateHouseId(calle: string, houseNumber: string): string {
    return `${calle.trim()}-${houseNumber.trim()}`.toLowerCase().replace(/\s+/g, '_');
  }

  /**
   * Obtener todos los pagos pendientes de validación para un residencial
   */
  static async getPendingPayments(residencialId: string): Promise<PaymentReceipt[]> {
    try {
      console.log(`🔍 Obteniendo pagos pendientes para residencial: ${residencialId} — [paymentIntents SoT]`);

      const pagosRef = collection(db, 'residenciales', residencialId, 'paymentIntents');
      const q = query(
        pagosRef,
        where('status', '==', 'pending_validation'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const pagos: PaymentReceipt[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();

        // Convert cents to standard currency for UI
        const amount = data.amountCents ? data.amountCents / 100 : (data.amount || 0);

        const pago: PaymentReceipt = {
          id: docSnapshot.id,
          userId: data.residentId || data.userId || '',
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          residencialId: data.residencialId || residencialId,
          houseId: data.houseId || this.generateHouseId(data.userAddress?.calle || '', data.userAddress?.houseNumber || ''),
          amount: amount,
          currency: data.currency || 'MXN',
          concept: data.concept || '',
          comprobanteUrl: data.proofUrl || data.comprobanteUrl || '',
          numeroMovimiento: data.referenceNumber || data.numeroMovimiento || '',
          bancoOrigen: data.bancoOrigen || '',
          status: data.status || 'pending_validation',
          fechaSubida: data.createdAt || data.fechaSubida || new Date(),
          fechaPago: data.createdAt || data.fechaPago || data.fechaSubida || new Date(),
          fechaValidacion: data.validatedAt || data.fechaValidacion || null,
          validadoPor: data.validatedBy || data.validadoPor || '',
          observaciones: data.observations || data.validationNote || '',
          montoEsperado: amount,
          userAddress: data.userAddress || null,
          paymentMethod: data.method || 'transfer',
        };


        // Obtener datos adicionales del usuario si no están en el pago
        if (!pago.userAddress) {
          try {
            const userDoc = await getDoc(doc(db, 'usuarios', pago.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              pago.userAddress = userData.domicilio || null;
            }
          } catch (error) {
            console.warn(`⚠️ No se pudieron obtener datos del usuario ${pago.userId}:`, error);
          }
        }

        pagos.push(pago);
      }

      console.log(`✅ ${pagos.length} pagos pendientes obtenidos`);
      return pagos;
    } catch (error) {
      console.error('❌ Error al obtener pagos pendientes:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los pagos de un residencial (con filtros)
   */
  static async getAllPayments(
    residencialId: string,
    statusFilter?: string
  ): Promise<PaymentReceipt[]> {
    try {
      console.log(`🔍 Obteniendo todos los pagos para residencial: ${residencialId} — [paymentIntents SoT]`);

      const pagosRef = collection(db, 'residenciales', residencialId, 'paymentIntents');
      let q = query(pagosRef, orderBy('createdAt', 'desc'));

      if (statusFilter && statusFilter !== 'todos') {
        q = query(pagosRef, where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      const pagos: PaymentReceipt[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();

        const amount = data.amountCents ? data.amountCents / 100 : (data.amount || 0);

        const pago: PaymentReceipt = {
          id: docSnapshot.id,
          userId: data.residentId || data.userId || '',
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          residencialId: data.residencialId || residencialId,
          houseId: data.houseId || this.generateHouseId(data.userAddress?.calle || '', data.userAddress?.houseNumber || ''),
          amount: amount,
          currency: data.currency || 'MXN',
          concept: data.concept || '',
          comprobanteUrl: data.proofUrl || data.comprobanteUrl || '',
          numeroMovimiento: data.referenceNumber || data.numeroMovimiento || '',
          bancoOrigen: data.bancoOrigen || '',
          status: data.status || 'pending_validation',
          fechaSubida: data.createdAt || data.fechaSubida || new Date(),
          fechaPago: data.createdAt || data.fechaPago || data.fechaSubida || new Date(),
          fechaValidacion: data.validatedAt || data.fechaValidacion || null,
          validadoPor: data.validatedBy || data.validadoPor || '',
          observaciones: data.validationNote || data.observaciones || '',
          montoEsperado: amount,
          userAddress: data.userAddress || null,
          paymentMethod: data.method || 'transfer',
        };

        pagos.push(pago);
      }

      console.log(`✅ ${pagos.length} pagos obtenidos`);
      return pagos;
    } catch (error) {
      console.error('❌ Error al obtener pagos:', error);
      throw error;
    }
  }

  /**
   * Validar un pago (aprobar o rechazar)
   */
  static async validatePayment(
    residencialId: string,
    pagoId: string,
    validation: PaymentValidation
  ): Promise<void> {
    try {
      console.log(`✅ Requesting backend to validate/reject ${pagoId} with status: ${validation.status}`);

      if (validation.status === 'validated') {
        const validatePaymentFn = httpsCallable<{ residencialId: string, paymentId: string }, { success: boolean }>(functions, 'apiValidatePayment');
        await validatePaymentFn({
          residencialId,
          paymentId: pagoId
        });
        console.log(`✅ Payment ${pagoId} successfully validated via Cloud Function`);
      } else if (validation.status === 'rejected') {
        const rejectPaymentFn = httpsCallable<{ residencialId: string, paymentId: string, reason: string }, { success: boolean }>(functions, 'apiRejectPayment');
        await rejectPaymentFn({
          residencialId,
          paymentId: pagoId,
          reason: validation.observaciones || 'Pago rechazado desde dashboard web'
        });
        console.log(`❌ Payment ${pagoId} successfully rejected via Cloud Function`);
      }
    } catch (error) {
      console.error('❌ Error calling backend validation:', error);
      throw error;
    }
  }

  /**
   * Revertir un pago (previamente validado)
   */
  static async reversePayment(
    residencialId: string,
    pagoId: string,
    reason: string
  ): Promise<void> {
    try {
      console.log(`✅ Requesting backend to reverse payment: ${pagoId}`);
      const reversePaymentFn = httpsCallable<{ residencialId: string, paymentId: string, reason: string }, { success: boolean }>(functions, 'apiReversePayment');

      await reversePaymentFn({
        residencialId,
        paymentId: pagoId,
        reason
      });
      console.log(`✅ Payment ${pagoId} successfully reversed via Cloud Function`);
    } catch (error) {
      console.error('❌ Error calling backend reversal:', error);
      throw error;
    }
  }

  /**
   * Ajustar balance manualmente (Administrativo)
   */
  static async adjustBalance(
    residencialId: string,
    houseId: string,
    amount: number,
    isDecrease: boolean,
    reason: string
  ): Promise<void> {
    try {
      console.log(`✅ Requesting backend to adjust balance for house: ${houseId}`);
      const adjustBalanceFn = httpsCallable<{
        residencialId: string,
        houseId: string,
        amount: number,
        isDecrease: boolean,
        reason: string
      }, { success: boolean }>(functions, 'apiAdjustBalance');

      await adjustBalanceFn({
        residencialId,
        houseId,
        amount,
        isDecrease,
        reason
      });
      console.log(`✅ Balance for ${houseId} successfully adjusted via Cloud Function`);
    } catch (error) {
      console.error('❌ Error calling backend adjustment:', error);
      throw error;
    }
  }

  /**
   * Obtener un pago específico
   */
  static async getPayment(residencialId: string, pagoId: string): Promise<PaymentReceipt | null> {
    try {
      const pagoRef = doc(db, 'residenciales', residencialId, 'paymentIntents', pagoId);
      const pagoDoc = await getDoc(pagoRef);

      if (!pagoDoc.exists()) {
        return null;
      }

      const data = pagoDoc.data();
      const amount = data.amountCents ? data.amountCents / 100 : (data.amount || 0);

      const pago: PaymentReceipt = {
        id: pagoDoc.id,
        userId: data.residentId || data.userId || '',
        userName: data.userName || '',
        userEmail: data.userEmail || '',
        residencialId: data.residencialId || residencialId,
        houseId: data.houseId || this.generateHouseId(data.userAddress?.calle || '', data.userAddress?.houseNumber || ''),
        amount: amount,
        currency: data.currency || 'MXN',
        concept: data.concept || '',
        comprobanteUrl: data.proofUrl || data.comprobanteUrl || '',
        numeroMovimiento: data.referenceNumber || data.numeroMovimiento || '',
        bancoOrigen: data.bancoOrigen || '',
        status: data.status || 'pending_validation',
        fechaSubida: data.createdAt || data.fechaSubida || new Date(),
        fechaValidacion: data.validatedAt || data.fechaValidacion || null,
        validadoPor: data.validatedBy || data.validadoPor || '',
        observaciones: data.validationNote || data.observaciones || '',
        montoEsperado: amount,
        userAddress: data.userAddress || null,
        paymentMethod: data.method || 'transfer',
      };

      return pago;
    } catch (error) {
      console.error('❌ Error al obtener pago:', error);
      throw error;
    }
  }

  /**
   * Escuchar cambios en pagos pendientes (tiempo real)
   */
  static watchPendingPayments(
    residencialId: string,
    callback: (pagos: PaymentReceipt[]) => void
  ): () => void {
    console.log(`🔔 Suscribiéndose a pagos pendientes para residencial: ${residencialId} — [paymentIntents SoT]`);

    const pagosRef = collection(db, 'residenciales', residencialId, 'paymentIntents');
    const q = query(
      pagosRef,
      where('status', '==', 'pending_validation'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const pagos: PaymentReceipt[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const amount = data.amountCents ? data.amountCents / 100 : (data.amount || 0);

        const pago: PaymentReceipt = {
          id: docSnapshot.id,
          userId: data.residentId || data.userId || '',
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          residencialId: data.residencialId || residencialId,
          houseId: data.houseId || this.generateHouseId(data.userAddress?.calle || '', data.userAddress?.houseNumber || ''),
          amount: amount,
          currency: data.currency || 'MXN',
          concept: data.concept || '',
          comprobanteUrl: data.proofUrl || data.comprobanteUrl || '',
          numeroMovimiento: data.referenceNumber || data.numeroMovimiento || '',
          bancoOrigen: data.bancoOrigen || '',
          status: data.status || 'pending_validation',
          fechaSubida: data.createdAt || data.fechaSubida || new Date(),
          fechaPago: data.createdAt || data.fechaPago || data.fechaSubida || new Date(),
          fechaValidacion: data.validatedAt || data.fechaValidacion || null,
          validadoPor: data.validatedBy || data.validadoPor || '',
          observaciones: data.validationNote || data.observaciones || '',
          montoEsperado: amount,
          userAddress: data.userAddress || null,
          paymentMethod: data.method || 'transfer',
        };

        pagos.push(pago);
      });

      console.log(`📣 Actualización en tiempo real — [paymentIntents]: ${pagos.length} pagos pendientes`);
      callback(pagos);
    });
  }

  /**
   * Obtener estadísticas de pagos para un residencial
   */
  static async getPaymentStats(residencialId: string): Promise<{
    totalPagos: number;
    pagosPendientes: number;
    pagosValidados: number;
    pagosRechazados: number;
    totalRecaudado: number;
    montoPendiente: number;
  }> {
    try {
      const pagos = await this.getAllPayments(residencialId);

      const stats = {
        totalPagos: pagos.length,
        pagosPendientes: pagos.filter(p => p.status === 'pending_validation').length,
        pagosValidados: pagos.filter(p => p.status === 'validated').length,
        pagosRechazados: pagos.filter(p => p.status === 'rejected').length,
        totalRecaudado: pagos
          .filter(p => p.status === 'validated')
          .reduce((sum, p) => sum + p.amount, 0),
        montoPendiente: pagos
          .filter(p => p.status === 'pending_validation')
          .reduce((sum, p) => sum + p.amount, 0),
      };

      console.log('📊 Estadísticas de pagos:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  }

  /**
   * Obtener URL de descarga de una imagen
   */
  static async getImageDownloadUrl(imageUrl: string): Promise<string> {
    try {
      if (imageUrl.startsWith('gs://')) {
        if (!storage) {
          console.warn('⚠️ Storage no está disponible');
          return imageUrl;
        }
        const imageRef = ref(storage, imageUrl);
        return await getDownloadURL(imageRef);
      }
      return imageUrl;
    } catch (error) {
      console.error('❌ Error al obtener URL de imagen:', error);
      throw error;
    }
  }

  /**
   * Disparar facturación masiva para un residencial (Admin Only)
   */
  static async triggerManualBilling(residencialId: string): Promise<void> {
    try {
      console.log(`🚀 Requesting manual billing trigger for: ${residencialId}`);
      const triggerFn = httpsCallable<{ residencialId: string }, { success: boolean }>(functions, 'apiTriggerManualBilling');

      await triggerFn({ residencialId });
      console.log(`✅ Billing triggered successfully for ${residencialId}`);
    } catch (error) {
      console.error('❌ Error triggering manual billing:', error);
      throw error;
    }
  }
}
