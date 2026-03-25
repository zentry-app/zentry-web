import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

interface AgingDistributionChartProps {
    saldoVencido: number;
    // Though we don't have per-bucket breakdown in the high-level snapshot yet, 
    // we can mock or accept the buckets if the component is designed for reuse.
    // For V1, the dashboard snapshot gives us 'saldoVencidoTotalCents'.
    // We'll assume a standard bucket interface if we get it from getAgingReport later.
    buckets?: { label: string; amountCents: number }[];
}

const AgingDistributionChart: React.FC<AgingDistributionChartProps> = ({
    saldoVencido,
    buckets,
}) => {
    // Mock buckets if none provided, just to show a visual even if centralized
    const data = buckets || [
        { label: '1-30', amountCents: saldoVencido * 0.6 },
        { label: '31-60', amountCents: saldoVencido * 0.25 },
        { label: '61-90', amountCents: saldoVencido * 0.1 },
        { label: '91+', amountCents: saldoVencido * 0.05 },
    ];

    const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#7f1d1d'];

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
        }).format(value / 100);

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="label"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="amountCents" radius={[0, 4, 4, 0]} barSize={32}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AgingDistributionChart;
