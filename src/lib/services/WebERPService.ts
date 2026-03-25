import { db, functions } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// Types based on FINANCIAL_DATA_SHAPES.md
export type AgingBucketKey = 'current' | '30_days' | '60_days' | '90_days' | 'plus_90';
export type LedgerEntryType = 'charge' | 'payment' | 'reversal' | 'credit';

export interface WebDashboardStats {
    periodo: string;
    facturadoBruto: number;
    cobradoNeto: number;
    pendientePeriodo: number;
    pagosEnValidacion: number | null;
}

export interface WebPeriodSummary {
    periodKey: string;
    facturadoCents: number;
    validadoCents: number;
    conciliadoCents: number;
    cobradoBrutoCents: number;
    reversasCents: number;
    cobradoNetoCents: number;
    pendientePeriodoCents: number; // Rule: UI uses this directly
}

export interface WebCurrentSnapshot {
    saldoPendienteTotalCents: number;
    saldoVencidoTotalCents: number;
    saldoAFavorTotalCents: number;
    housesWithDebt: number;
    housesWithOverdue: number;
    totalActiveHouses: number;
    pctCasasConDeuda: number;
    pctCasasMorosas: number;
}

export interface WebReportingDashboard {
    summary: WebPeriodSummary;
    snapshot: WebCurrentSnapshot;
    validations: {
        total: number;
        pendingValidation: number;
    };
}

export interface WebAgingBucket {
    key: AgingBucketKey;
    index: number;
    label: "Al día" | "1-30" | "31-60" | "61-90" | "91+";
    amountCents: number;
    housesCount: number;
    severity: "low" | "medium" | "high" | "critical";
}

export interface WebHouseSummary {
    houseId: string;
    residentPrimaryName: string;
    totalBalanceCents: number;
    overdueBalanceCents: number;
    dominantAgingBucket: AgingBucketKey;
    lastPaymentDate: string | null;
    lastPaymentFolio: string | null;
    isMoroso: boolean;
}

export interface WebLedgerEntry {
    id: string;
    date: string;
    description: string;
    amountCents: number;
    type: LedgerEntryType;
    folio: string | null;
    status: "completed" | "pending_validation" | "rejected" | "reversed";
}

export interface WebHouseLedger {
    balanceCents: number;
    entries: WebLedgerEntry[];
}

export interface WebPaymentIntent {
    id: string;
    houseId: string;
    houseLabel?: string; // Phase 3 UI Enhancement
    residentId: string;
    residentName?: string; // Phase 3 UI Enhancement
    amountCents: number;
    date: string;
    method: 'transfer' | 'cash' | 'card';
    referenceNumber: string | null;
    status: 'pending_validation' | 'validated' | 'rejected' | 'reversed';
    reconciliationStatus: 'unreconciled' | 'reconciled';
    proofUrl: string | null;
    folio: string | null;
}

export interface WebBankTransaction {
    id: string;
    importId?: string; // Phase 3 UI Enhancement
    date: string;
    description: string;
    amountCents: number;
    referenceKey: string;
    type: 'deposit' | 'withdrawal' | 'fee';
    reconciliationStatus: 'unreconciled' | 'reconciled';
    isUnidentifiedDeposit: boolean;
    matchedPaymentIntentId?: string | null;
}

export interface BankImportPayload {
    dateStr: string;
    description: string;
    amountCents: number;
    referenceKey: string;
    type: 'deposit' | 'withdrawal' | 'fee';
}

// Phase 4: Billing Engine Interfaces
export interface WebBillingSettings {
    defaultMonthlyFeeCents: number;
    billingDayOfMonth: number;
    dueDayOfMonth: number;
    lateFeeType: 'fixed' | 'percentage';
    lateFeeValue: number;
    applyLateFeeAutomatically: boolean;
}

export interface WebBillingPeriod {
    id: string; // e.g. "2026-03"
    name: string;
    status: 'draft' | 'published' | 'closed';
    totalExpectedCents: number;
    totalCollectedCents: number;
    createdAt: string;
    publishedAt?: string;
}

export interface WebHouseFee {
    id: string;
    periodId: string;
    type: 'maintenance' | 'extraordinary' | 'late_penalty';
    amountCents: number;
    description: string;
    dueDate: string;
    status: 'pending' | 'paid' | 'cancelled';
    latePenaltyApplied: boolean;
    operationalStatus: 'vigente' | 'vencida' | 'pagada'; // Derived UI state
    paidAt?: string;
    matchedPaymentIntentId?: string;
}

export interface WebBillingOverview {
    recaudacionMesCents: number;
    carteraVencidaCents: number;
    proximoVencimiento: string | null;
}

/**
 * Service to interact with the Zentry ERP system from the Web Admin.
 * Focuses on High-Density data and reconciliation.
 */
export class WebERPService {
    /**
     * getReportingDashboard — Official Phase 5 entry point for analytics.
     * Returns period-specific metrics and a snapshot of current debt.
     */
    async getReportingDashboard(residencialId: string, periodKey?: string): Promise<WebReportingDashboard> {
        const getReportingDashboardFunc = httpsCallable<{ residencialId: string; periodKey?: string }, WebReportingDashboard>(functions, 'getReportingDashboard');
        const res = await getReportingDashboardFunc({ residencialId, periodKey });
        return res.data;
    }

    /**
     * Legacy/Simple stats (Phase 2). 
     * @deprecated Use getReportingDashboard for Phase 5+
     */
    async getDashboardStats(residencialId: string, periodId: string): Promise<WebDashboardStats> {
        const getPeriodSummary = httpsCallable<any, any>(functions, 'getPeriodSummary');
        const getPendingValidationsCount = httpsCallable<any, any>(functions, 'getPendingValidationsCount');

        const [summaryRes, pendingRes] = await Promise.allSettled([
            getPeriodSummary({ residencialId, periodKey: periodId }),
            getPendingValidationsCount({ residencialId })
        ]);

        const summary = summaryRes.status === 'fulfilled' ? summaryRes.value.data : {};
        const pending = pendingRes.status === 'fulfilled' ? pendingRes.value.data : null;

        return {
            periodo: periodId,
            facturadoBruto: summary.facturadoCents || 0,
            cobradoNeto: summary.cobradoNetoCents || 0,
            pendientePeriodo: summary.pendientePeriodoCents || 0,
            pagosEnValidacion: pending ? (pending.total ?? 0) : null,
        };
    }

    /**
     * Fetches the global aging report for a residential.
     */
    async getAgingReport(residencialId: string): Promise<WebAgingBucket[]> {
        const getResidentialAging = httpsCallable<any, any>(functions, 'getResidentialAging');
        const res = await getResidentialAging({ residencialId });
        const data = res.data;

        return [
            // Backend aging service implicitly skips 'current' houses, we might need a separate count for this later
            { key: 'current', index: 0, label: 'Al día', amountCents: 0, housesCount: 0, severity: 'low' },
            {
                key: '30_days',
                index: 1,
                label: '1-30',
                amountCents: data.bucket_0_30_cents || 0,
                housesCount: 0, // Backend aggregated report doesn't provide per-bucket house count yet
                severity: 'medium'
            },
            {
                key: '60_days',
                index: 2,
                label: '31-60',
                amountCents: data.bucket_31_60_cents || 0,
                housesCount: 0,
                severity: 'high'
            },
            {
                key: '90_days',
                index: 3,
                label: '61-90',
                amountCents: data.bucket_61_90_cents || 0,
                housesCount: 0,
                severity: 'critical'
            },
            {
                key: 'plus_90',
                index: 4,
                label: '91+',
                amountCents: data.bucket_91plus_cents || 0,
                housesCount: 0,
                severity: 'critical'
            },
        ];
    }

    /**
     * Fetches high-density summary for all houses in a residential.
     * Uses housePaymentBalance collection for current state.
     */
    async getHousesFinancialSummary(residencialId: string): Promise<WebHouseSummary[]> {
        const balancesRef = collection(db, 'residenciales', residencialId, 'housePaymentBalance');
        const snap = await getDocs(balancesRef);

        return snap.docs.map(doc => {
            const data = doc.data();
            const balanceCents = data.deudaAcumulada || 0;
            return {
                houseId: doc.id,
                residentPrimaryName: data.residentName || 'Residente', // Basic mapping
                totalBalanceCents: balanceCents,
                overdueBalanceCents: balanceCents, // Simplified for now
                dominantAgingBucket: balanceCents > 0 ? '30_days' : 'current', // Basic mapping
                lastPaymentDate: data.ultimoPago ? (data.ultimoPago as Timestamp).toDate().toISOString() : null,
                lastPaymentFolio: data.ultimoFolio || null,
                isMoroso: balanceCents > 0,
            };
        });
    }

    /**
     * Fetches the full audit ledger for a specific house.
     * Queries the 'ledger' subcollection directly.
     */
    async getHouseLedger(residencialId: string, houseId: string): Promise<HouseLedger> {
        const ledgerRef = collection(db, 'residenciales', residencialId, 'houses', houseId, 'ledger');
        const q = query(ledgerRef, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);

        const entries: WebLedgerEntry[] = snap.docs.map(doc => {
            const data = doc.data();
            const type = data.type?.toLowerCase() as LedgerEntryType;

            // Apply strict sign convention: + for charges, - for payments
            let amount = data.amountInCents || 0;
            if (type === 'payment' && amount > 0) {
                amount = -amount;
            }

            return {
                id: doc.id,
                date: (data.createdAt as Timestamp).toDate().toISOString(),
                description: data.description || '',
                amountCents: amount,
                type: type,
                folio: data.folio || null,
                status: data.status || 'completed',
            };
        });

        // Sum current balance from entries or return official field
        const balanceCents = entries.reduce((acc, curr) => acc + curr.amountCents, 0);

        return {
            balanceCents,
            entries,
        };
    }

    async getReconciledBankTransactions(residencialId: string): Promise<WebBankTransaction[]> {
        const txsRef = collection(db, 'residenciales', residencialId, 'bankTransactions');
        const q = query(txsRef, where('reconciliationStatus', '==', 'reconciled'));
        const snap = await getDocs(q);

        return snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                date: data.dateStr || (data.createdAt as Timestamp)?.toDate().toISOString() || '',
                description: data.description || '',
                amountCents: data.amountCents || 0,
                referenceKey: data.referenceKey || '',
                type: data.type || 'deposit',
                reconciliationStatus: data.reconciliationStatus || 'reconciled',
                isUnidentifiedDeposit: data.isUnidentifiedDeposit || false,
                matchedPaymentIntentId: data.matchedPaymentIntentId || null,
                importId: data.importId || null
            };
        });
    }

    // ==========================================
    // PHASE 3: TREASURY & RECONCILIATION
    // ==========================================

    async getPendingValidations(residencialId: string): Promise<WebPaymentIntent[]> {
        const intentsRef = collection(db, 'residenciales', residencialId, 'paymentIntents');
        const q = query(intentsRef, where('status', '==', 'pending_validation'));
        const snap = await getDocs(q);

        return snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                houseId: data.houseId || '',
                houseLabel: data.houseLabel || 'Casa N/A', // Assuming backend will start piping this or we map it
                residentId: data.residentId || '',
                residentName: data.residentName || 'Residente N/A',
                amountCents: data.amountCents || 0,
                date: data.dateStr || (data.createdAt as Timestamp)?.toDate().toISOString() || '',
                method: data.method || 'transfer',
                referenceNumber: data.referenceNumber || null,
                status: data.status || 'pending_validation',
                reconciliationStatus: data.reconciliationStatus || 'unreconciled',
                proofUrl: data.proofUrl || null,
                folio: data.folio || null
            };
        });
    }

    async getUnreconciledBankTransactions(residencialId: string): Promise<WebBankTransaction[]> {
        const txRef = collection(db, 'residenciales', residencialId, 'bankTransactions');
        const q = query(txRef, where('reconciliationStatus', '==', 'unreconciled'));
        const snap = await getDocs(q);

        return snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                importId: data.importBatchId || undefined,
                date: data.dateStr || (data.createdAt as Timestamp)?.toDate().toISOString() || '',
                description: data.description || '',
                amountCents: data.amountCents || 0,
                referenceKey: data.referenceKey || '',
                type: data.type || 'deposit',
                reconciliationStatus: data.reconciliationStatus || 'unreconciled',
                isUnidentifiedDeposit: !!data.isUnidentifiedDeposit
            };
        });
    }

    async validatePayment(residencialId: string, paymentId: string): Promise<{ success: boolean; folio?: string }> {
        const apiValidatePayment = httpsCallable<any, any>(functions, 'apiValidatePayment');
        const res = await apiValidatePayment({ residencialId, paymentId });
        return res.data;
    }

    async rejectPayment(residencialId: string, paymentId: string, reason: string): Promise<{ success: boolean }> {
        const apiRejectPayment = httpsCallable<any, any>(functions, 'apiRejectPayment');
        const res = await apiRejectPayment({ residencialId, paymentId, reason });
        return res.data;
    }

    async reversePayment(residencialId: string, paymentId: string, reason: string): Promise<{ success: boolean }> {
        const apiReversePayment = httpsCallable<any, any>(functions, 'apiReversePayment');
        const res = await apiReversePayment({ residencialId, paymentId, reason });
        return res.data;
    }

    async executeManualMatch(residencialId: string, bankTransactionId: string, paymentIntentId: string): Promise<{ success: boolean }> {
        const apiExecuteManualMatch = httpsCallable<any, any>(functions, 'apiExecuteManualMatch');
        const res = await apiExecuteManualMatch({ residencialId, bankTransactionId, paymentIntentId });
        return res.data;
    }

    async executeAutoMatch(residencialId: string, toleranceDays: number = 2): Promise<{ success: boolean; matchedCount: number; unmatchedCount: number }> {
        const apiExecuteAutoMatch = httpsCallable<any, any>(functions, 'apiExecuteAutoMatch');
        const res = await apiExecuteAutoMatch({ residencialId, toleranceDays });
        return res.data;
    }

    async importBankTransactions(
        residencialId: string,
        accountId: string,
        transactions: BankImportPayload[]
    ): Promise<{ success: boolean; importBatchId: string; stats: { processed: number; duplicates: number; invalid: number } }> {
        const apiImportBankTransactions = httpsCallable<any, any>(functions, 'apiImportBankTransactions');
        const res = await apiImportBankTransactions({ residencialId, accountId, transactions });
        return res.data;
    }

    // ==========================================
    // PHASE 4: BILLING ENGINE
    // ==========================================

    async getBillingSettings(residencialId: string): Promise<WebBillingSettings> {
        // Since there's no direct getter API for settings yet in apiCallables, 
        // we hit the firestore doc directly as we do for house balances
        const { getDoc, doc } = await import('firebase/firestore');
        const ref = doc(db, 'residenciales', residencialId, 'settings', 'billing');
        const snap = await getDoc(ref);

        if (snap.exists()) {
            return snap.data() as WebBillingSettings;
        }

        // Return sync defaults if not found
        return {
            defaultMonthlyFeeCents: 150000,
            billingDayOfMonth: 1,
            dueDayOfMonth: 10,
            lateFeeType: 'fixed',
            lateFeeValue: 20000,
            applyLateFeeAutomatically: true
        };
    }

    async updateBillingSettings(residencialId: string, config: Partial<WebBillingSettings>): Promise<void> {
        const { updateDoc, doc, setDoc } = await import('firebase/firestore');
        const ref = doc(db, 'residenciales', residencialId, 'settings', 'billing');
        await setDoc(ref, config, { merge: true });
    }

    async getBillingPeriods(residencialId: string): Promise<WebBillingPeriod[]> {
        const periodsRef = collection(db, 'residenciales', residencialId, 'billingPeriods');
        const q = query(periodsRef, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);

        return snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name || '',
                status: data.status || 'draft',
                totalExpectedCents: data.totalExpectedCents || 0,
                totalCollectedCents: data.totalCollectedCents || 0,
                createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || '',
                publishedAt: (data.publishedAt as Timestamp)?.toDate().toISOString() || undefined
            };
        });
    }

    async generatePeriodDraft(residencialId: string, periodId: string, periodName: string): Promise<{ success: boolean; period?: WebBillingPeriod }> {
        const apiGeneratePeriodDraft = httpsCallable<any, any>(functions, 'apiGeneratePeriodDraft');
        const res = await apiGeneratePeriodDraft({ residencialId, periodId, periodName });
        return res.data;
    }

    async publishPeriod(residencialId: string, periodId: string): Promise<{ success: boolean }> {
        const apiPublishPeriod = httpsCallable<any, any>(functions, 'apiPublishPeriod');
        const res = await apiPublishPeriod({ residencialId, periodId });
        return res.data;
    }

    async getHouseFees(residencialId: string, houseId: string): Promise<WebHouseFee[]> {
        const feesRef = collection(db, 'residenciales', residencialId, 'houses', houseId, 'fees');
        const q = query(feesRef, orderBy('dueDate', 'desc'));
        const snap = await getDocs(q);
        const now = new Date();

        return snap.docs.map(doc => {
            const data = doc.data();
            const dueDate = (data.dueDate as Timestamp)?.toDate();

            // Derive operational status
            let operationalStatus: WebHouseFee['operationalStatus'] = 'vigente';
            if (data.status === 'paid') {
                operationalStatus = 'pagada';
            } else if (dueDate && dueDate < now) {
                operationalStatus = 'vencida';
            }

            return {
                id: doc.id,
                periodId: data.periodId || '',
                type: data.type || 'maintenance',
                amountCents: data.amountCents || 0,
                description: data.description || '',
                dueDate: dueDate?.toISOString() || '',
                status: data.status || 'pending',
                latePenaltyApplied: !!data.latePenaltyApplied,
                operationalStatus,
                paidAt: (data.paidAt as Timestamp)?.toDate().toISOString() || undefined,
                matchedPaymentIntentId: data.matchedPaymentIntentId
            };
        });
    }

    async createExtraordinaryFee(residencialId: string, houseId: string, amountCents: number, description: string): Promise<{ success: boolean }> {
        const apiCreateExtraordinaryFee = httpsCallable<any, any>(functions, 'apiCreateExtraordinaryFee');
        const res = await apiCreateExtraordinaryFee({ residencialId, houseId, amountCents, description });
        return res.data;
    }

    async getBillingOverview(residencialId: string): Promise<WebBillingOverview> {
        // We can leverage existing Aging report and Dashboard stats for this
        const stats = await this.getDashboardStats(residencialId, new Date().toISOString().substring(0, 7));
        const aging = await this.getAgingReport(residencialId);

        // Sum all overdue buckets
        const overdueCents = aging
            .filter(b => b.key !== 'current')
            .reduce((acc, curr) => acc + curr.amountCents, 0);

        return {
            recaudacionMesCents: stats.cobradoNeto,
            carteraVencidaCents: overdueCents,
            proximoVencimiento: null // In future, we'd query the next pending published period due date
        };
    }
}

// Internal interface for HouseLedger to avoid export duplication if needed
interface HouseLedger {
    balanceCents: number;
    entries: WebLedgerEntry[];
}
