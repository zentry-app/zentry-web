import React from 'react';

export type AgingBucketKey = 'current' | '30_days' | '60_days' | '90_days' | 'plus_90';

interface WebAgingBucket {
    key: AgingBucketKey;
    index: number;
    label: "Al día" | "1-30" | "31-60" | "61-90" | "91+";
    amountCents: number;
    housesCount: number;
    severity: "low" | "medium" | "high" | "critical";
}

interface AgingRiskChartProps {
    buckets: WebAgingBucket[];
    isLoading: boolean;
}

const SEVERITY_COLORS: Record<string, string> = {
    low: 'bg-emerald-500',
    medium: 'bg-amber-500',
    high: 'bg-orange-500',
    critical: 'bg-red-600',
};

export const AgingRiskChart: React.FC<AgingRiskChartProps> = ({ buckets, isLoading }) => {
    const formatCurrency = (amountInCents: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            maximumFractionDigits: 0,
        }).format(amountInCents / 100);
    };

    const totalOverdue = buckets
        .filter(b => b.key !== 'current')
        .reduce((acc, curr) => acc + curr.amountCents, 0);

    const overdueBuckets = buckets.filter(b => b.key !== 'current');
    const currentBucket = buckets.find(b => b.key === 'current');

    const ChartSkeleton = () => (
        <div data-testid="chart-skeleton" className="animate-pulse flex items-end gap-2 h-32 px-4">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex-1 bg-gray-100 rounded-t-lg" style={{ height: `${20 * i}%` }} />
            ))}
        </div>
    );

    return (
        <div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Distribución de Deuda (Aging)</h3>
                    <p className="text-xs text-gray-500 mt-1">Total vencido: {formatCurrency(totalOverdue)}</p>
                </div>

                {/* Auxiliary 'Current' Metric */}
                {!isLoading && currentBucket && (
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                            Auxiliar
                        </span>
                        <p className="text-xs font-medium text-gray-600 mt-1">
                            Al día: <span className="font-bold text-gray-900">{currentBucket.housesCount} propiedades</span>
                        </p>
                    </div>
                )}
            </div>

            {isLoading ? (
                <ChartSkeleton />
            ) : (
                <div className="flex items-end gap-2 h-40 group/chart">
                    {overdueBuckets.map((bucket) => {
                        const percentage = totalOverdue > 0 ? (bucket.amountCents / totalOverdue) * 100 : 0;
                        return (
                            <div key={bucket.key} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="relative w-full flex flex-col items-center">
                                    {/* Tooltip-like amount on hover */}
                                    <div className="absolute -top-8 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                        {formatCurrency(bucket.amountCents)}
                                    </div>

                                    {/* Bar */}
                                    <div
                                        className={`w-full rounded-t-lg transition-all border-b-2 border-white/20 ${SEVERITY_COLORS[bucket.severity]} group-hover:brightness-110`}
                                        style={{ height: `${Math.max(percentage, 5)}%` }} // Minimum height for visibility
                                    />
                                </div>
                                <div className="text-center">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">{bucket.label}</span>
                                    <p className="text-[10px] font-mono text-gray-400">{Math.round(percentage)}%</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Legend / Stats */}
            {!isLoading && (
                <div className="mt-6 pt-6 border-t border-gray-50 flex flex-wrap gap-4">
                    {overdueBuckets.map(bucket => (
                        <div key={bucket.key} className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[bucket.severity]}`} />
                            <span className="text-[10px] font-medium text-gray-600">{bucket.label}: </span>
                            <span className="text-[10px] font-bold text-gray-900">{formatCurrency(bucket.amountCents)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
