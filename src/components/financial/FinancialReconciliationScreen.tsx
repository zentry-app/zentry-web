import React, { useEffect, useState } from 'react';
import { WebERPService, WebBankTransaction, WebPaymentIntent } from '@/lib/services/WebERPService';

interface FinancialReconciliationScreenProps {
    service: WebERPService;
    residencialId: string;
}

export const FinancialReconciliationScreen: React.FC<FinancialReconciliationScreenProps> = ({ service, residencialId }) => {
    const [bankTxs, setBankTxs] = useState<WebBankTransaction[]>([]);
    const [paymentIntents, setPaymentIntents] = useState<WebPaymentIntent[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedBankTx, setSelectedBankTx] = useState<WebBankTransaction | null>(null);
    const [selectedIntent, setSelectedIntent] = useState<WebPaymentIntent | null>(null);
    const [isMatching, setIsMatching] = useState(false);
    const [autoMatchMessage, setAutoMatchMessage] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [txs, activeIntents] = await Promise.all([
                service.getUnreconciledBankTransactions(residencialId),
                // Normally we'd fetch ALL unreconciled intents, which might include pending_validation and validated endpoints.
                // Assuming getPendingValidations works as a proxy if it returns all unreconciled, or we need a new method.
                // Let's use getPendingValidations as requested for matching in Phase 3 MVP, 
                // though ideally there's a dedicated getUnreconciledIntents endpoint. 
                service.getPendingValidations(residencialId)
            ]);
            setBankTxs(txs);
            // In a real scenario we filter to `unreconciled` and non-rejected
            setPaymentIntents(activeIntents.filter(i => i.reconciliationStatus === 'unreconciled' && i.status !== 'rejected'));
            setSelectedBankTx(null);
            setSelectedIntent(null);
        } catch (error) {
            console.error('Failed to load reconciliation data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [residencialId]);

    const handleAutoMatch = async () => {
        setIsMatching(true);
        setAutoMatchMessage(null);
        try {
            const res = await service.executeAutoMatch(residencialId, 2);
            if (res.success) {
                setAutoMatchMessage(`Auto-match completado. ${res.matchedCount} coincidencias exactas encontradas. ${res.unmatchedCount} pendientes.`);
                await loadData();
            }
        } catch (e: any) {
            setAutoMatchMessage(`Error: ${e.message}`);
        } finally {
            setIsMatching(false);
        }
    };

    const handleManualMatch = async () => {
        if (!selectedBankTx || !selectedIntent) return;
        setIsMatching(true);
        try {
            const res = await service.executeManualMatch(residencialId, selectedBankTx.id, selectedIntent.id);
            if (res.success) {
                await loadData(); // Reloads all lists
            }
        } catch (e: any) {
            alert(`Error de conciliación manual: ${e.message}`);
        } finally {
            setIsMatching(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando datos de conciliación...</div>;

    const amountsMatch = selectedBankTx && selectedIntent && selectedBankTx.amountCents === selectedIntent.amountCents;

    return (
        <div className="bg-white rounded-lg shadow flex flex-col h-[800px]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h2 className="text-xl font-bold">Pantalla de Conciliación</h2>
                <button
                    onClick={handleAutoMatch}
                    disabled={isMatching || bankTxs.length === 0}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                    Ejecutar Auto-Match 1:1
                </button>
            </div>

            {autoMatchMessage && (
                <div className="p-4 bg-purple-50 text-purple-800 text-center text-sm font-semibold border-b border-purple-100">
                    {autoMatchMessage}
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* Left Column: Bank Txs */}
                <div className="w-1/2 border-r flex flex-col">
                    <div className="p-3 bg-gray-100 font-semibold border-b">
                        Movimientos Bancarios ({bankTxs.length})
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {bankTxs.length === 0 ? <p className="text-gray-400 text-center">No hay movimientos pendientes.</p> : null}
                        {bankTxs.map(tx => (
                            <div
                                key={tx.id}
                                onClick={() => setSelectedBankTx(tx.id === selectedBankTx?.id ? null : tx)}
                                className={`border p-3 rounded cursor-pointer transition-colors ${selectedBankTx?.id === tx.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-gray-800 text-lg">${(tx.amountCents / 100).toFixed(2)}</span>
                                    <span className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</span>
                                </div>
                                <div className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded inline-block mb-1">{tx.referenceKey || 'SIN REF'}</div>
                                <p className="text-sm text-gray-600 truncate">{tx.description}</p>
                                {tx.isUnidentifiedDeposit && (
                                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded mt-2 inline-block">Depósito No Identificado</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Intents */}
                <div className="w-1/2 flex flex-col">
                    <div className="p-3 bg-gray-100 font-semibold border-b">
                        Intenciones de Pago ({paymentIntents.length})
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {paymentIntents.length === 0 ? <p className="text-gray-400 text-center">No hay intenciones de pago pendientes.</p> : null}
                        {paymentIntents.map(intent => (
                            <div
                                key={intent.id}
                                onClick={() => setSelectedIntent(intent.id === selectedIntent?.id ? null : intent)}
                                className={`border p-3 rounded cursor-pointer transition-colors ${selectedIntent?.id === intent.id ? 'border-green-500 bg-green-50 ring-2 ring-green-200' : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-bold text-lg ${amountsMatch && intent.id === selectedIntent?.id ? 'text-green-700' : 'text-gray-800'}`}>
                                        ${(intent.amountCents / 100).toFixed(2)}
                                    </span>
                                    <span className="text-xs text-gray-500">{new Date(intent.date).toLocaleDateString()}</span>
                                </div>
                                <div className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded inline-block mb-1">Ref: {intent.referenceNumber || 'N/A'}</div>
                                <p className="text-sm text-gray-600 truncate">Casa: {intent.houseLabel} - {intent.residentName}</p>
                                <div className="flex gap-2 mt-2">
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded border border-yellow-200">{intent.status}</span>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">{intent.method}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Manual Match Panel */}
            <div className={`border-t bg-gray-50 p-4 transition-all duration-300 ${selectedBankTx && selectedIntent ? 'h-auto opacity-100' : 'h-0 opacity-0 overflow-hidden py-0'}`}>
                {selectedBankTx && selectedIntent && (
                    <div className="flex justify-between items-center">
                        <div className="flex gap-12 items-center">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Banco</p>
                                <p className="font-mono text-lg">${(selectedBankTx.amountCents / 100).toFixed(2)}</p>
                            </div>
                            <div className="text-xl text-gray-400">↔️</div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Sistema</p>
                                <p className="font-mono text-lg">${(selectedIntent.amountCents / 100).toFixed(2)}</p>
                            </div>
                            <div className="ml-8 border-l pl-8">
                                <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Evaluación de Match</p>
                                {amountsMatch ? (
                                    <span className="text-green-600 font-bold flex items-center gap-1">✅ Montos coinciden exactamente</span>
                                ) : (
                                    <span className="text-red-600 font-bold flex items-center gap-1">❌ Diferencia en montos</span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleManualMatch}
                            disabled={!amountsMatch || isMatching}
                            className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-400"
                        >
                            {isMatching ? 'Conciliando...' : 'Confirmar Match Manual'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
