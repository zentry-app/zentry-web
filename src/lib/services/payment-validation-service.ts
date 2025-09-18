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
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';

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
      console.log(`🔍 Obteniendo pagos pendientes para residencial: ${residencialId}`);
      
      const pagosRef = collection(db, 'residenciales', residencialId, 'pagos');
      const q = query(
        pagosRef,
        where('status', '==', 'pending_validation'),
        orderBy('fechaSubida', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const pagos: PaymentReceipt[] = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const pago: PaymentReceipt = {
          id: docSnapshot.id,
          userId: data.userId || '',
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          residencialId: data.residencialId || '',
          houseId: this.generateHouseId(data.userAddress?.calle || '', data.userAddress?.houseNumber || ''),
          amount: data.amount || 0,
          currency: data.currency || 'MXN',
          concept: data.concept || '',
          comprobanteUrl: data.comprobanteUrl || '',
          numeroMovimiento: data.numeroMovimiento || '',
          bancoOrigen: data.bancoOrigen || '',
          status: data.status || 'pending_validation',
          fechaSubida: data.fechaSubida || new Date(),
          fechaPago: data.fechaPago || data.fechaSubida || new Date(),
          fechaValidacion: data.fechaValidacion || null,
          validadoPor: data.validadoPor || '',
          observaciones: data.observaciones || '',
          montoEsperado: data.montoEsperado || data.amount || 0,
          userAddress: data.userAddress || null,
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
      console.log(`🔍 Obteniendo todos los pagos para residencial: ${residencialId}`);
      
      const pagosRef = collection(db, 'residenciales', residencialId, 'pagos');
      let q = query(pagosRef, orderBy('fechaSubida', 'desc'));
      
      if (statusFilter && statusFilter !== 'todos') {
        q = query(pagosRef, where('status', '==', statusFilter), orderBy('fechaSubida', 'desc'));
      }
      
      const querySnapshot = await getDocs(q);
      const pagos: PaymentReceipt[] = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const pago: PaymentReceipt = {
          id: docSnapshot.id,
          userId: data.userId || '',
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          residencialId: data.residencialId || '',
          houseId: this.generateHouseId(data.userAddress?.calle || '', data.userAddress?.houseNumber || ''),
          amount: data.amount || 0,
          currency: data.currency || 'MXN',
          concept: data.concept || '',
          comprobanteUrl: data.comprobanteUrl || '',
          numeroMovimiento: data.numeroMovimiento || '',
          bancoOrigen: data.bancoOrigen || '',
          status: data.status || 'pending_validation',
          fechaSubida: data.fechaSubida || new Date(),
          fechaPago: data.fechaPago || data.fechaSubida || new Date(),
          fechaValidacion: data.fechaValidacion || null,
          validadoPor: data.validadoPor || '',
          observaciones: data.observaciones || '',
          montoEsperado: data.montoEsperado || data.amount || 0,
          userAddress: data.userAddress || null,
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
      console.log(`✅ Validando pago ${pagoId} con estado: ${validation.status}`);
      
      const pagoRef = doc(db, 'residenciales', residencialId, 'pagos', pagoId);
      
      const updateData = {
        status: validation.status,
        fechaValidacion: Timestamp.now(),
        validadoPor: validation.validadoPor,
        observaciones: validation.observaciones || '',
      };
      
      await updateDoc(pagoRef, updateData);
      
      console.log(`✅ Pago ${pagoId} validado exitosamente`);
    } catch (error) {
      console.error('❌ Error al validar pago:', error);
      throw error;
    }
  }

  /**
   * Obtener un pago específico
   */
  static async getPayment(residencialId: string, pagoId: string): Promise<PaymentReceipt | null> {
    try {
      const pagoRef = doc(db, 'residenciales', residencialId, 'pagos', pagoId);
      const pagoDoc = await getDoc(pagoRef);
      
      if (!pagoDoc.exists()) {
        return null;
      }
      
      const data = pagoDoc.data();
      const pago: PaymentReceipt = {
        id: pagoDoc.id,
        userId: data.userId || '',
        userName: data.userName || '',
        userEmail: data.userEmail || '',
        residencialId: data.residencialId || '',
        houseId: this.generateHouseId(data.userAddress?.calle || '', data.userAddress?.houseNumber || ''),
        amount: data.amount || 0,
        currency: data.currency || 'MXN',
        concept: data.concept || '',
        comprobanteUrl: data.comprobanteUrl || '',
        numeroMovimiento: data.numeroMovimiento || '',
        bancoOrigen: data.bancoOrigen || '',
        status: data.status || 'pending_validation',
        fechaSubida: data.fechaSubida || new Date(),
        fechaValidacion: data.fechaValidacion || null,
        validadoPor: data.validadoPor || '',
        observaciones: data.observaciones || '',
        montoEsperado: data.montoEsperado || data.amount || 0,
        userAddress: data.userAddress || null,
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
    console.log(`🔔 Suscribiéndose a pagos pendientes para residencial: ${residencialId}`);
    
    const pagosRef = collection(db, 'residenciales', residencialId, 'pagos');
    const q = query(
      pagosRef,
      where('status', '==', 'pending_validation'),
      orderBy('fechaSubida', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const pagos: PaymentReceipt[] = [];
      
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const pago: PaymentReceipt = {
          id: docSnapshot.id,
          userId: data.userId || '',
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          residencialId: data.residencialId || '',
          houseId: this.generateHouseId(data.userAddress?.calle || '', data.userAddress?.houseNumber || ''),
          amount: data.amount || 0,
          currency: data.currency || 'MXN',
          concept: data.concept || '',
          comprobanteUrl: data.comprobanteUrl || '',
          numeroMovimiento: data.numeroMovimiento || '',
          bancoOrigen: data.bancoOrigen || '',
          status: data.status || 'pending_validation',
          fechaSubida: data.fechaSubida || new Date(),
          fechaPago: data.fechaPago || data.fechaSubida || new Date(),
          fechaValidacion: data.fechaValidacion || null,
          validadoPor: data.validadoPor || '',
          observaciones: data.observaciones || '',
          montoEsperado: data.montoEsperado || data.amount || 0,
          userAddress: data.userAddress || null,
        };
        
        pagos.push(pago);
      });
      
      console.log(`📣 Actualización en tiempo real: ${pagos.length} pagos pendientes`);
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
}
