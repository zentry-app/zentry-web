import React, { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export type LedgerEntryType = 'charge' | 'payment' | 'reversal' | 'credit';

interface WebLedgerEntry {
    id: string;
    date: string;
    description: string;
    amountCents: number;
    type: LedgerEntryType;
    folio: string | null;
    status: "completed" | "pending_validation" | "rejected" | "reversed";
}

interface WebHouseLedger {
    balanceCents: number;
    entries: WebLedgerEntry[];
}

interface AuditLedgerSlideOverProps {
    isOpen: boolean;
    houseId: string;
    ledger: WebHouseLedger | null;
    isLoading: boolean;
    onClose: () => void;
}

export const AuditLedgerSlideOver: React.FC<AuditLedgerSlideOverProps> = ({
    isOpen,
    houseId,
    ledger,
    isLoading,
    onClose
}) => {
    if (!isOpen) return null;

    const formatCurrency = (amountInCents: number) => {
        const isNegative = amountInCents < 0;
        const absoluteAmount = Math.abs(amountInCents);
        const formatted = new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(absoluteAmount / 100);

        return isNegative ? `-${formatted}` : formatted;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        const config: Record<string, string> = {
            completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            pending_validation: 'bg-amber-50 text-amber-700 border-amber-100',
            rejected: 'bg-red-50 text-red-700 border-red-100',
            reversed: 'bg-gray-100 text-gray-600 border-gray-200',
        };

        const labels: Record<string, string> = {
            completed: 'Completado',
            pending_validation: 'Pendiente',
            rejected: 'Rechazado',
            reversed: 'Revertido',
        };

        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${config[status] || 'bg-gray-50 text-gray-500'}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex">
                <div className="relative w-screen max-w-md">
                    <div className="h-full flex flex-col bg-white shadow-2xl">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Historial: {houseId}</h2>
                                <p className="text-xs text-gray-500 mt-1">Audit Ledger oficial para conciliación</p>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="Cerrar"
                                className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Balance Card */}
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                <p className="text-sm font-medium text-gray-500 mb-1">Saldo Actual</p>
                                {isLoading ? (
                                    <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-lg" />
                                ) : (
                                    <p className={`text-3xl font-bold ${ledger && ledger.balanceCents > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                        {ledger ? formatCurrency(ledger.balanceCents) : '$0.00'}
                                    </p>
                                )}
                            </div>

                            {/* Transactions list */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Movimientos</h3>
                                <div className="space-y-4">
                                    {isLoading ? (
                                        [1, 2, 3, 4].map(i => (
                                            <div key={i} className="animate-pulse space-y-2">
                                                <div className="h-4 w-full bg-gray-100 rounded" />
                                                <div className="h-3 w-1/2 bg-gray-50 rounded" />
                                            </div>
                                        ))
                                    ) : !ledger || ledger.entries.length === 0 ? (
                                        <p className="text-center py-12 text-gray-400 text-sm italic">
                                            No hay movimientos registrados para esta propiedad.
                                        </p>
                                    ) : (
                                        ledger.entries.map((entry) => (
                                            <div key={entry.id} className="group relative pl-6 pb-6 border-l border-gray-100 last:pb-0">
                                                {/* Dot indicator */}
                                                <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full border-2 border-white shadow-sm ${entry.amountCents < 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />

                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-gray-900 leading-tight mb-1">{entry.description}</p>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-xs text-gray-400">{formatDate(entry.date)}</span>
                                                            {entry.folio && (
                                                                <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">#{entry.folio}</span>
                                                            )}
                                                            {getStatusBadge(entry.status)}
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-sm font-bold ${entry.amountCents < 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                            {formatCurrency(entry.amountCents)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
