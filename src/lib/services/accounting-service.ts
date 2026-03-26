/**
 * AccountingService — reads from ERP financialEvents collection.
 * All field names match the ERP schema (English).
 * Firestore path: residenciales/{id}/financialEvents
 *
 * ERP schema:
 *   type: 'PAYOUT' | 'CHARGE' | 'REVERSAL' | 'ADJUSTMENT'
 *   subType: 'transfer_payment' | 'cash_payment' | 'card_payment' | 'monthly_fee' | 'late_fee' | 'balance_adjustment_manual' | 'extraordinary_fee'
 *   amount: number (cents)
 *   amountInCents: number (cents, canonical)
 *   impact: 'DECREASE_DEBT' | 'INCREASE_DEBT'
 *   description: string
 *   houseId: string
 *   periodKey: string (e.g. '2026-03')
 *   referenceId: string
 *   timestamp: Timestamp
 */
import {
  collection, getDocs, query, where, orderBy, Timestamp, addDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ─── Types (English, matching ERP schema) ─────────────────────────
export type FinancialEventType = 'PAYOUT' | 'CHARGE' | 'REVERSAL' | 'ADJUSTMENT';
export type FinancialEventSubType =
  | 'transfer_payment' | 'cash_payment' | 'card_payment'
  | 'monthly_fee' | 'late_fee' | 'extraordinary_fee'
  | 'balance_adjustment_manual';
export type ImpactType = 'DECREASE_DEBT' | 'INCREASE_DEBT';

export interface FinancialEvent {
  id: string;
  type: FinancialEventType;
  subType: FinancialEventSubType;
  amountCents: number;
  impact: ImpactType;
  description: string;
  houseId: string;
  periodKey: string;
  referenceId: string;
  folio: string;
  timestamp: Date;
}

export interface AccountingSummary {
  period: string;
  totalIncomeCents: number;
  totalChargesCents: number;
  balanceCents: number;
  totalHouses: number;
  housesPaid: number;
  housesOverdue: number;
  collectionRate: number;
  monthlyAverageCents: number;
}

// Display helpers for subType → human-readable label
const SUBTYPE_LABELS: Record<string, string> = {
  transfer_payment: 'Transferencia',
  cash_payment: 'Efectivo',
  card_payment: 'Tarjeta',
  monthly_fee: 'Cuota mensual',
  late_fee: 'Recargo por mora',
  balance_adjustment_manual: 'Ajuste de saldo',
  extraordinary_fee: 'Cargo extraordinario',
};

const SUBTYPE_CATEGORY: Record<string, string> = {
  transfer_payment: 'Cobranza',
  cash_payment: 'Cobranza',
  card_payment: 'Cobranza',
  monthly_fee: 'Facturación',
  late_fee: 'Penalización',
  balance_adjustment_manual: 'Ajuste',
  extraordinary_fee: 'Cargo extra',
};

const SUBTYPE_METHOD: Record<string, string> = {
  transfer_payment: 'Transferencia',
  cash_payment: 'Efectivo',
  card_payment: 'Tarjeta',
};

export { SUBTYPE_LABELS, SUBTYPE_CATEGORY, SUBTYPE_METHOD };

// ─── Service ──────────────────────────────────────────────────────
export class AccountingService {

  /**
   * Get financial events for a date range.
   */
  static async getFinancialEvents(
    residencialId: string,
    dateStart: Date,
    dateEnd: Date,
    impactFilter?: ImpactType
  ): Promise<FinancialEvent[]> {
    const ref = collection(db, 'residenciales', residencialId, 'financialEvents');
    let q = impactFilter
      ? query(ref,
          where('timestamp', '>=', Timestamp.fromDate(dateStart)),
          where('timestamp', '<=', Timestamp.fromDate(dateEnd)),
          where('impact', '==', impactFilter),
          orderBy('timestamp', 'desc'))
      : query(ref,
          where('timestamp', '>=', Timestamp.fromDate(dateStart)),
          where('timestamp', '<=', Timestamp.fromDate(dateEnd)),
          orderBy('timestamp', 'desc'));

    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      let ts: Date;
      if (data.timestamp?.toDate) ts = data.timestamp.toDate();
      else if (data.timestamp?.seconds) ts = new Date(data.timestamp.seconds * 1000);
      else ts = new Date();

      return {
        id: d.id,
        type: data.type || 'CHARGE',
        subType: data.subType || 'monthly_fee',
        amountCents: data.amountInCents || data.amount || 0,
        impact: data.impact || 'INCREASE_DEBT',
        description: data.description || '',
        houseId: data.houseId || '',
        periodKey: data.periodKey || '',
        referenceId: data.referenceId || '',
        folio: data.folio || '',
        timestamp: ts,
      };
    });
  }

  /**
   * Get accounting summary for a date range.
   * Used by AccountingDashboard KPIs.
   */
  static async getAccountingSummary(
    residencialId: string,
    dateStart: Date,
    dateEnd: Date
  ): Promise<AccountingSummary> {
    const events = await this.getFinancialEvents(residencialId, dateStart, dateEnd);

    const totalIncomeCents = events
      .filter(e => e.impact === 'DECREASE_DEBT')
      .reduce((sum, e) => sum + e.amountCents, 0);

    const totalChargesCents = events
      .filter(e => e.impact === 'INCREASE_DEBT')
      .reduce((sum, e) => sum + e.amountCents, 0);

    const balanceCents = totalIncomeCents - totalChargesCents;

    // Houses from ERP source of truth
    const housesSnap = await getDocs(collection(db, 'residenciales', residencialId, 'housePaymentBalance'));
    const totalHouses = housesSnap.size;

    const housesPaid = new Set(
      events.filter(e => e.impact === 'DECREASE_DEBT' && e.houseId).map(e => e.houseId)
    ).size;

    const housesOverdue = totalHouses - housesPaid;
    const collectionRate = totalHouses > 0 ? (housesPaid / totalHouses) * 100 : 0;

    const days = Math.max(1, Math.ceil((dateEnd.getTime() - dateStart.getTime()) / (1000 * 60 * 60 * 24)));
    const monthlyAverageCents = Math.round((totalIncomeCents / days) * 30);

    return {
      period: `${dateStart.toLocaleDateString('es-MX')} - ${dateEnd.toLocaleDateString('es-MX')}`,
      totalIncomeCents,
      totalChargesCents,
      balanceCents,
      totalHouses,
      housesPaid,
      housesOverdue,
      collectionRate,
      monthlyAverageCents,
    };
  }

  // Legacy compatibility aliases — AccountingDashboard still calls these
  static async getAccountingRecords(
    residencialId: string,
    dateStart: Date,
    dateEnd: Date,
    tipo?: 'ingreso' | 'egreso'
  ) {
    const impact = tipo === 'ingreso' ? 'DECREASE_DEBT' : tipo === 'egreso' ? 'INCREASE_DEBT' : undefined;
    return this.getFinancialEvents(residencialId, dateStart, dateEnd, impact);
  }

  static async getMonthlyReports(_residencialId: string) {
    // No longer reads from reportesMensuales — reports are computed on-the-fly
    return [];
  }
}
