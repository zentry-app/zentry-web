import React from 'react';
import {
    BanknotesIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface FinancialStats {
    facturadoBruto: number;
    cobradoNeto: number;
    pendientePeriodo: number;
    pagosEnValidacion: number | null;
}

interface FinancialSummaryCardsProps {
    stats: FinancialStats | null;
    isLoading: boolean;
    error: string | null;
    lastUpdated?: string;
}

export const FinancialSummaryCards: React.FC<FinancialSummaryCardsProps> = ({
    stats,
    isLoading,
    error,
    lastUpdated
}) => {
    const formatCurrency = (amountInCents: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(amountInCents / 100);
    };

    const formatCount = (count: number | null) => {
        if (count === null) return 'N/A';
        return new Intl.NumberFormat('es-MX').format(count);
    };

    if (error) {
        return (
            <div className="p-6 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 text-red-600">
                <ExclamationCircleIcon className="w-6 h-6" />
                <span className="font-medium">{error}</span>
            </div>
        );
    }

    const Card = ({ title, value, icon: Icon, colorClass, isOperational = false }: any) => (
        <div className={`relative overflow-hidden p-6 rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${isOperational ? 'border-blue-100 bg-blue-50/10' : 'border-gray-100'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-xl ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {isOperational && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                        Operativo
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                {isLoading ? (
                    <div data-testid="skeleton" className="h-8 w-24 bg-gray-100 animate-pulse rounded-lg" />
                ) : (
                    <p className={`text-2xl font-bold ${isOperational && value === 'N/A' ? 'text-gray-400' : 'text-gray-900'}`}>
                        {value}
                    </p>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            {lastUpdated && (
                <div className="flex justify-end">
                    <p className="inline-flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                        Última actualización: {lastUpdated}
                    </p>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card
                    title="Facturado Bruto"
                    value={stats ? formatCurrency(stats.facturadoBruto) : '$0.00'}
                    icon={BanknotesIcon}
                    colorClass="bg-indigo-50 text-indigo-600"
                />
                <Card
                    title="Cobrado Neto"
                    value={stats ? formatCurrency(stats.cobradoNeto) : '$0.00'}
                    icon={CheckCircleIcon}
                    colorClass="bg-emerald-50 text-emerald-600"
                />
                <Card
                    title="Pendiente del Periodo"
                    value={stats ? formatCurrency(stats.pendientePeriodo) : '$0.00'}
                    icon={ClockIcon}
                    colorClass="bg-amber-50 text-amber-600"
                />
                <Card
                    title="Pagos en Validación"
                    value={formatCount(stats?.pagosEnValidacion ?? null)}
                    icon={ExclamationCircleIcon}
                    colorClass="bg-blue-50 text-blue-700"
                    isOperational={true}
                />
            </div>
        </div>
    );
};
