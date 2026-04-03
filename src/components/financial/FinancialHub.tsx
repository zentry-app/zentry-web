import React, { useState, useEffect, useMemo } from 'react';
import { FinancialSummaryCards } from './FinancialSummaryCards';
import { FinancialReconciliationGrid } from './FinancialReconciliationGrid';
import { AgingRiskChart } from './AgingRiskChart';
import { AuditLedgerSlideOver } from './AuditLedgerSlideOver';
import { WebERPService } from '@/lib/services/WebERPService';
import { convertToCSV, downloadCSV } from '@/lib/utils/exportUtils';
import { ArrowDownTrayIcon, FunnelIcon } from '@heroicons/react/24/outline';

export const FinancialHub: React.FC<{ residencialId: string; periodId: string }> = ({ residencialId, periodId }) => {
    const [stats, setStats] = useState<any>(null);
    const [houses, setHouses] = useState<any[]>([]);
    const [agingBuckets, setAgingBuckets] = useState<any[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Selection & Details
    const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);
    const [ledger, setLedger] = useState<any>(null);
    const [isLedgerLoading, setIsLedgerLoading] = useState(false);

    // Filters
    const [filterZone, setFilterZone] = useState('');
    const [onlyOverdue, setOnlyOverdue] = useState(false);

    const erpService = useMemo(() => new WebERPService(), []);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [statsRes, housesRes, agingRes] = await Promise.all([
                    erpService.getDashboardStats(residencialId, periodId),
                    erpService.getHousesFinancialSummary(residencialId),
                    erpService.getAgingReport(residencialId)
                ]);

                setStats(statsRes);
                setHouses(housesRes);
                setAgingBuckets(agingRes);
                setLastUpdated(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
            } catch (err: any) {
                setError('Error al cargar la información financiera. Por favor intente de nuevo.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [residencialId, periodId, erpService]);

    const fetchLedger = async (houseId: string) => {
        setSelectedHouseId(houseId);
        setIsLedgerLoading(true);
        try {
            const ledgerRes = await erpService.getHouseLedger(residencialId, houseId);
            setLedger(ledgerRes);
        } catch (err) {
            console.error('Error fetching ledger:', err);
        } finally {
            setIsLedgerLoading(false);
        }
    };

    const filteredHouses = useMemo(() => {
        return houses.filter(h => {
            const matchZone = filterZone === '' || h.houseId.toLowerCase().includes(filterZone.toLowerCase());
            const matchOverdue = !onlyOverdue || h.overdueBalanceCents > 0;
            return matchZone && matchOverdue;
        });
    }, [houses, filterZone, onlyOverdue]);

    const handleExport = () => {
        const csvContent = convertToCSV(filteredHouses);
        downloadCSV(csvContent, `reconciliacion_${residencialId}_${periodId}.csv`);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Hub Financiero</h1>
                    <p className="text-gray-500 mt-1">Gestión de cobranza y reconciliación para {periodId}</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm"
                >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Exportar CSV
                </button>
            </div>

            <FinancialSummaryCards
                stats={stats}
                isLoading={isLoading}
                error={error}
                lastUpdated={lastUpdated}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <FunnelIcon className="w-5 h-5 text-gray-400" />
                                <span className="text-sm font-bold text-gray-700">Filtros:</span>
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar por lote/zona..."
                                className="text-sm border-gray-100 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 px-3 py-1.5"
                                value={filterZone}
                                onChange={(e) => setFilterZone(e.target.value)}
                            />
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={onlyOverdue}
                                    onChange={(e) => setOnlyOverdue(e.target.checked)}
                                />
                                <span className="text-sm text-gray-600">Solo morosos</span>
                            </label>
                        </div>
                        <div className="text-xs text-gray-400 font-medium">
                            Mostrando {filteredHouses.length} de {houses.length} casas
                        </div>
                    </div>

                    <FinancialReconciliationGrid
                        houses={filteredHouses}
                        isLoading={isLoading}
                        onOpenLedger={fetchLedger}
                    />
                </div>

                <div className="space-y-6">
                    <AgingRiskChart buckets={agingBuckets} isLoading={isLoading} />

                    <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                        <h4 className="text-sm font-bold text-indigo-900 mb-2 underline decoration-indigo-200">Tips de Reconciliación</h4>
                        <ul className="text-xs text-indigo-800 space-y-2 list-disc pl-4">
                            <li>Usa el Audit Ledger para verificar folios duplicados.</li>
                            <li>Los pagos negativos indican abonos a la cuenta.</li>
                            <li>Exporta a CSV para cruzar contra estados bancarios.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <AuditLedgerSlideOver
                isOpen={selectedHouseId !== null}
                houseId={selectedHouseId || ''}
                ledger={ledger}
                isLoading={isLedgerLoading}
                onClose={() => setSelectedHouseId(null)}
            />
        </div>
    );
};
