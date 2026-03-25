import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';

interface CollectionEfficiencyChartProps {
    facturado: number;
    validado: number;
    conciliado: number;
}

const CollectionEfficiencyChart: React.FC<CollectionEfficiencyChartProps> = ({
    facturado,
    validado,
    conciliado,
}) => {
    const data = [
        {
            name: 'Eficiencia de Cobranza',
            Facturado: facturado / 100,
            Validado: validado / 100,
            Conciliado: conciliado / 100,
        },
    ];

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
        }).format(value);

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    barGap={8}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" hide />
                    <YAxis
                        tickFormatter={(value) => `$${value / 1000}k`}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="Facturado" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={60} />
                    <Bar dataKey="Validado" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60} />
                    <Bar dataKey="Conciliado" fill="#10b981" radius={[4, 4, 0, 0]} barSize={60} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default CollectionEfficiencyChart;
