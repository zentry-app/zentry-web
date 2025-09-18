import { PaymentReceipt } from './payment-validation-service';
import { CashPayment } from './cash-payment-service';
import { AllPayment } from './all-payments-service';

// Tipo unificado para todos los pagos
export type UnifiedPayment = {
  id: string;
  type: 'transfer' | 'cash';
  status: string;
  fechaPago: any; // Timestamp o Date
  amount: number;
  concept: string;
  currency?: string;
  // Datos del usuario/casa
  userName?: string;
  userEmail?: string;
  houseAddress?: string;
  houseNumber?: string;
  // Datos específicos de transferencia
  numeroMovimiento?: string;
  bancoOrigen?: string;
  imageUrl?: string;
  // Datos específicos de efectivo
  registradoPor?: string;
  // Metadatos
  residencialId: string;
  userId?: string;
  casaId?: string;
};

export class UnifiedPaymentsService {
  /**
   * Convierte un PaymentReceipt (transferencia) a UnifiedPayment
   */
  static convertTransferToUnified(payment: PaymentReceipt): UnifiedPayment {
    return {
      id: payment.id,
      type: 'transfer',
      status: payment.status,
      fechaPago: payment.fechaPago,
      amount: payment.amount,
      concept: payment.concept,
      currency: payment.currency,
      userName: payment.userName,
      userEmail: payment.userEmail,
      houseAddress: payment.userAddress?.calle,
      houseNumber: payment.userAddress?.houseNumber,
      numeroMovimiento: payment.numeroMovimiento,
      imageUrl: payment.imageUrl,
      residencialId: payment.residencialId,
      userId: payment.userId,
    };
  }

  /**
   * Convierte un CashPayment (efectivo) a UnifiedPayment
   */
  static convertCashToUnified(payment: CashPayment): UnifiedPayment {
    return {
      id: payment.id,
      type: 'cash',
      status: payment.status,
      fechaPago: payment.fechaPago,
      amount: payment.amount,
      concept: payment.concept,
      currency: payment.currency,
      userName: payment.userName,
      userEmail: payment.userEmail,
      houseAddress: payment.userAddress?.calle,
      houseNumber: payment.userAddress?.houseNumber,
      registradoPor: payment.registradoPor,
      residencialId: payment.residencialId,
      userId: payment.userId,
      casaId: payment.casaId,
    };
  }

  /**
   * Convierte un AllPayment a UnifiedPayment
   */
  static convertAllPaymentToUnified(payment: AllPayment): UnifiedPayment {
    return {
      id: payment.id,
      type: payment.paymentMethod === 'cash' ? 'cash' : 'transfer',
      status: payment.status,
      fechaPago: payment.fechaPago,
      amount: payment.amount,
      concept: payment.concept,
      currency: payment.currency,
      userName: payment.userName,
      userEmail: payment.userEmail,
      houseAddress: payment.userAddress?.calle || '',
      houseNumber: payment.userAddress?.houseNumber || '',
      numeroMovimiento: payment.numeroMovimiento,
      bancoOrigen: payment.bancoOrigen,
      imageUrl: payment.comprobanteUrl,
      registradoPor: payment.registradoPor,
      residencialId: payment.residencialId,
      userId: payment.userId,
      casaId: payment.casaId,
    };
  }

  /**
   * Obtiene todos los pagos unificados para un residencial
   */
  static async getAllUnifiedPayments(residencialId: string): Promise<UnifiedPayment[]> {
    try {
      // Importar servicios dinámicamente para evitar dependencias circulares
      const { PaymentValidationService } = await import('./payment-validation-service');
      const { CashPaymentService } = await import('./cash-payment-service');
      const { AllPaymentsService } = await import('./all-payments-service');

      // Obtener todos los pagos usando AllPaymentsService
      const allPayments = await AllPaymentsService.getAllPayments(residencialId);
      
      // Convertir a formato unificado
      const unifiedPayments = allPayments.map(payment => 
        this.convertAllPaymentToUnified(payment)
      );

      // Ordenar por fecha (más recientes primero)
      unifiedPayments.sort((a, b) => {
        const dateA = a.fechaPago?.toDate ? a.fechaPago.toDate() : new Date(a.fechaPago);
        const dateB = b.fechaPago?.toDate ? b.fechaPago.toDate() : new Date(b.fechaPago);
        return dateB.getTime() - dateA.getTime();
      });

      return unifiedPayments;
    } catch (error) {
      console.error('Error obteniendo pagos unificados:', error);
      return [];
    }
  }

  /**
   * Filtra pagos unificados por criterios
   */
  static filterPayments(
    payments: UnifiedPayment[],
    filters: {
      searchTerm?: string;
      statusFilter?: string;
      typeFilter?: string;
      dateFilter?: string;
    }
  ): UnifiedPayment[] {
    let filtered = [...payments];

    // Filtro por término de búsqueda
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(payment =>
        payment.userName?.toLowerCase().includes(searchLower) ||
        payment.userEmail?.toLowerCase().includes(searchLower) ||
        payment.concept?.toLowerCase().includes(searchLower) ||
        payment.houseAddress?.toLowerCase().includes(searchLower) ||
        payment.houseNumber?.toLowerCase().includes(searchLower) ||
        payment.numeroMovimiento?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por estado
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === filters.statusFilter);
    }

    // Filtro por tipo
    if (filters.typeFilter && filters.typeFilter !== 'all') {
      filtered = filtered.filter(payment => payment.type === filters.typeFilter);
    }

    // Filtro por fecha
    if (filters.dateFilter && filters.dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(payment => {
        const paymentDate = payment.fechaPago?.toDate ? payment.fechaPago.toDate() : new Date(payment.fechaPago);
        
        switch (filters.dateFilter) {
          case 'today':
            return paymentDate.toDateString() === now.toDateString();
          case 'this_week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return paymentDate >= weekAgo;
          case 'this_month':
            return paymentDate.getMonth() === now.getMonth() && 
                   paymentDate.getFullYear() === now.getFullYear();
          case 'last_month':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return paymentDate >= lastMonth && paymentDate < thisMonth;
          default:
            return true;
        }
      });
    }

    return filtered;
  }

  /**
   * Obtiene estadísticas de pagos unificados
   */
  static getPaymentStats(payments: UnifiedPayment[]) {
    const stats = {
      total: payments.length,
      transfers: payments.filter(p => p.type === 'transfer').length,
      cash: payments.filter(p => p.type === 'cash').length,
      pending: payments.filter(p => p.status === 'pending_validation').length,
      validated: payments.filter(p => p.status === 'validated' || p.status === 'completed').length,
      rejected: payments.filter(p => p.status === 'rejected').length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      transferAmount: payments.filter(p => p.type === 'transfer').reduce((sum, p) => sum + p.amount, 0),
      cashAmount: payments.filter(p => p.type === 'cash').reduce((sum, p) => sum + p.amount, 0),
    };

    return stats;
  }
}
