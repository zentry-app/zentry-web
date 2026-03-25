import React from 'react';
import {
    ArrowRightIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

export type AgingBucketKey = 'current' | '30_days' | '60_days' | '90_days' | 'plus_90';

interface HouseSummary {
    houseId: string;
    residentPrimaryName: string;
    totalBalanceCents: number;
    overdueBalanceCents: number;
    dominantAgingBucket: AgingBucketKey;
    lastPaymentDate: string | null;
    lastPaymentFolio: string | null;
    isMoroso: boolean;
}

interface FinancialReconciliationGridProps {
    houses: HouseSummary[];
    isLoading: boolean;
    onOpenLedger: (houseId: string) => void;
}

const SEVERITY_CONFIG: Record<AgingBucketKey, { label: string; dot: string; classes: string }> = {
    current: { label: 'Al día', dot: 'bg-emerald-500', classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    '30_days': { label: '1-30', dot: 'bg-amber-400', classes: 'bg-amber-50 text-amber-700 border-amber-100' },
    '60_days': { label: '31-60', dot: 'bg-red-500', classes: 'bg-red-50 text-red-700 border-red-100' },
    '90_days': { label: '61-90', dot: 'bg-red-500', classes: 'bg-red-50 text-red-700 border-red-100' },
    plus_90: { label: '91+', dot: 'bg-red-900', classes: 'bg-red-100 text-red-900 border-red-200' },
};

export const FinancialReconciliationGrid: React.FC<FinancialReconciliationGridProps> = ({
    houses,
    isLoading,
    onOpenLedger
}) => {
    const formatCurrency = (amountInCents: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(amountInCents / 100);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: '2-digit'
        });
    };

    const RowSkeleton = () => (
        <tr data-testid="row-skeleton" className="animate-pulse border-b border-gray-50">
            <td className="py-4 px-4"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
            <td className="py-4 px-4"><div className="h-4 w-32 bg-gray-100 rounded" /></td>
            <td className="py-4 px-4"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
            <td className="py-4 px-4"><div className="h-6 w-16 bg-gray-100 rounded-full" /></td>
            <td className="py-4 px-4"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
            <td className="py-4 px-4"><div className="h-4 w-8 bg-gray-100 rounded" /></td>
        </tr>
    );

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">Propiedad</th>
                            <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">Residente Principal</th>
                            <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">Saldo Total</th>
                            <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">Aging</th>
                            <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-gray-500">Último Pago</th>
                            <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-gray-500"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            <>
                                <RowSkeleton />
                                <RowSkeleton />
                                <RowSkeleton />
                            </>
                        ) : houses.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-gray-400">
                                    No se encontraron propiedades con estos criterios.
                                </td>
                            </tr>
                        ) : (
                            houses.map((house) => (
                                <tr
                                    key={house.houseId}
                                    onClick={() => onOpenLedger(house.houseId)}
                                    className="group cursor-pointer hover:bg-gray-50/80 transition-colors"
                                >
                                    <td className="py-4 px-4">
                                        <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                            {house.houseId}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="text-sm text-gray-600">{house.residentPrimaryName}</span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`font-semibold ${house.totalBalanceCents > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                            {formatCurrency(house.totalBalanceCents)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${SEVERITY_CONFIG[house.dominantAgingBucket].classes}`}>
                                            <span className={`w-1 h-1 rounded-full mr-1.5 ${SEVERITY_CONFIG[house.dominantAgingBucket].dot}`} />
                                            {SEVERITY_CONFIG[house.dominantAgingBucket].label}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-gray-700">{formatDate(house.lastPaymentDate)}</span>
                                            {house.lastPaymentFolio && (
                                                <span className="text-[10px] text-gray-400 font-mono uppercase">{house.lastPaymentFolio}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
