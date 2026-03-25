import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebERPService } from '../WebERPService';

// Mock Firebase Functions
vi.mock('firebase/functions', () => ({
    httpsCallable: vi.fn((functions, name) => {
        return async (data: any) => {
            // Return mock data based on function name
            if (name === 'getPeriodSummary') {
                return {
                    data: {
                        facturadoCents: 100000,
                        cobradoNetoCents: 80000,
                        pendientePeriodoCents: 20000
                    }
                };
            }
            if (name === 'getPendingValidationsCount') {
                return {
                    data: {
                        total: 5000
                    }
                };
            }
            if (name === 'getResidentialAging') {
                return {
                    data: {
                        bucket_0_30_cents: 20000,
                        bucket_31_60_cents: 10000,
                        bucket_61_90_cents: 5000,
                        bucket_91plus_cents: 2000
                    }
                };
            }
            return { data: {} };
        };
    }),
    getFunctions: vi.fn(),
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    getDocs: vi.fn(async (q) => {
        // Return mock snapshots based on query context (simplified for unit tests)
        return {
            docs: [
                {
                    id: 'LOTE-101',
                    data: () => ({
                        residentName: 'Juan Perez',
                        deudaAcumulada: 15000,
                        ultimoPago: { toDate: () => new Date('2026-03-01') },
                        ultimoFolio: 'F-001'
                    })
                }
            ]
        };
    }),
    Timestamp: {
        fromDate: (d: Date) => ({ toDate: () => d }),
    }
}));

// Mock our internal config
vi.mock('@/lib/firebase/config', () => ({
    db: {},
    functions: {}
}));

describe('WebERPService (Integration Adapter)', () => {
    let service: WebERPService;

    beforeEach(() => {
        service = new WebERPService();
        vi.clearAllMocks();
    });

    describe('Dashboard Metrics Mapping', () => {
        it('should map backend Cents fields to camelCase without suffix', async () => {
            const stats = await service.getDashboardStats('res-1', '2026-03');

            expect(stats.facturadoBruto).toBe(100000);
            expect(stats.cobradoNeto).toBe(80000);
            expect(stats.pendientePeriodo).toBe(20000);
            expect(stats.pagosEnValidacion).toBe(5000);
        });

        it('should return null for pagosEnValidacion if the operational callable fails', async () => {
            const { httpsCallable } = await import('firebase/functions');

            // Mock both calls that happen inside getDashboardStats
            (httpsCallable as any).mockImplementation((functions: any, name: string) => {
                return async () => {
                    if (name === 'getPendingValidationsCount') {
                        throw new Error('Timeout or Permission Denied');
                    }
                    if (name === 'getPeriodSummary') {
                        return { data: { facturadoCents: 100 } };
                    }
                    return { data: {} };
                };
            });

            const stats = await service.getDashboardStats('res-1', '2026-03');
            expect(stats.pagosEnValidacion).toBeNull();
            expect(stats.facturadoBruto).toBe(100);

            // Restore original mock for subsequent tests
            (httpsCallable as any).mockImplementation((functions: any, name: string) => {
                return async () => {
                    if (name === 'getPeriodSummary') return { data: { facturadoCents: 100000, cobradoNetoCents: 80000, pendientePeriodoCents: 20000 } };
                    if (name === 'getPendingValidationsCount') return { data: { total: 5000 } };
                    if (name === 'getResidentialAging') return { data: { bucket_0_30_cents: 20000, bucket_31_60_cents: 10000, bucket_61_90_cents: 5000, bucket_91plus_cents: 2000 } };
                    return { data: {} };
                };
            });
        });
    });

    describe('Aging Buckets Mapping', () => {
        it('should map bucket_X_Y_cents to semantic keys (current, 30_days, etc.)', async () => {
            const report = await service.getAgingReport('res-1');

            const bucket30 = report.find((b: any) => b.key === '30_days');
            const bucketPlus90 = report.find((b: any) => b.key === 'plus_90');

            expect(bucket30?.amountCents).toBe(20000);
            expect(bucketPlus90?.amountCents).toBe(2000);
            expect(bucketPlus90?.label).toBe('91+');
        });
    });

    describe('House Summary Mapping', () => {
        it('should map housePaymentBalance fields to standard HouseSummary shape', async () => {
            const summary = await service.getHousesFinancialSummary('res-1');

            expect(summary[0].houseId).toBe('LOTE-101');
            expect(summary[0].totalBalanceCents).toBe(15000);
            expect(summary[0].isMoroso).toBe(true);
        });
    });

    describe('Ledger sign enforcement', () => {
        it('should enforce negative signs for payment types in ledger', async () => {
            // Mock specifically for ledger
            const { getDocs } = await import('firebase/firestore');
            (getDocs as any).mockResolvedValueOnce({
                docs: [
                    {
                        id: 'TX1',
                        data: () => ({
                            type: 'PAYMENT',
                            amountInCents: 5000,
                            createdAt: { toDate: () => new Date() },
                            description: 'Pago Test'
                        })
                    },
                    {
                        id: 'TX2',
                        data: () => ({
                            type: 'CHARGE',
                            amountInCents: 10000,
                            createdAt: { toDate: () => new Date() },
                            description: 'Cargo Test'
                        })
                    }
                ]
            });

            const ledger = await service.getHouseLedger('res-1', 'LOTE-101');

            const payment = ledger.entries.find((e: any) => e.type === 'payment');
            const charge = ledger.entries.find((e: any) => e.type === 'charge');

            expect(payment?.amountCents).toBe(-5000);
            expect(charge?.amountCents).toBe(10000);
            // Balance reflects the sum correctly
            expect(ledger.balanceCents).toBe(5000);
        });
    });

    describe('Phase 3: Treasury & Reconciliation', () => {
        it('should get pending validations mapped to WebPaymentIntent shape', async () => {
            const { getDocs } = await import('firebase/firestore');
            (getDocs as any).mockResolvedValueOnce({
                docs: [
                    {
                        id: 'PI-1',
                        data: () => ({
                            houseId: 'H1',
                            residentId: 'R1',
                            amountCents: 5000,
                            dateStr: '2026-03-08',
                            method: 'transfer',
                            status: 'pending_validation'
                        })
                    }
                ]
            });

            const intents = await service.getPendingValidations('res-1');
            expect(intents.length).toBe(1);
            expect(intents[0].id).toBe('PI-1');
            expect(intents[0].amountCents).toBe(5000);
            expect(intents[0].method).toBe('transfer');
        });

        it('should get unreconciled bank transactions mapped to WebBankTransaction shape', async () => {
            const { getDocs } = await import('firebase/firestore');
            (getDocs as any).mockResolvedValueOnce({
                docs: [
                    {
                        id: 'TX-1',
                        data: () => ({
                            dateStr: '2026-03-08',
                            amountCents: 15000,
                            description: 'SPEI DEPOSITO',
                            isUnidentifiedDeposit: true
                        })
                    }
                ]
            });

            const txs = await service.getUnreconciledBankTransactions('res-1');
            expect(txs.length).toBe(1);
            expect(txs[0].amountCents).toBe(15000);
            expect(txs[0].isUnidentifiedDeposit).toBe(true);
        });

        it('should call validatePayment api', async () => {
            const { httpsCallable } = await import('firebase/functions');
            (httpsCallable as any).mockImplementation(() => async () => ({ data: { success: true, folio: 'F-10' } }));

            const res = await service.validatePayment('res-1', 'pi-1');
            expect(res.success).toBe(true);
            expect(res.folio).toBe('F-10');
        });

        it('should call rejectPayment api', async () => {
            const { httpsCallable } = await import('firebase/functions');
            (httpsCallable as any).mockImplementation(() => async () => ({ data: { success: true } }));

            const res = await service.rejectPayment('res-1', 'pi-1', 'Reason');
            expect(res.success).toBe(true);
        });

        it('should call reversePayment api', async () => {
            const { httpsCallable } = await import('firebase/functions');
            (httpsCallable as any).mockImplementation(() => async () => ({ data: { success: true } }));

            const res = await service.reversePayment('res-1', 'pi-1', 'Reason');
            expect(res.success).toBe(true);
        });

        it('should call executeAutoMatch api', async () => {
            const { httpsCallable } = await import('firebase/functions');
            (httpsCallable as any).mockImplementation(() => async () => ({ data: { success: true, matchedCount: 5, unmatchedCount: 2 } }));

            const res = await service.executeAutoMatch('res-1', 2);
            expect(res.success).toBe(true);
            expect(res.matchedCount).toBe(5);
        });
    });
});
