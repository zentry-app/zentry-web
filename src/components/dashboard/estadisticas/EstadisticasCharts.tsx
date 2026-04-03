"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartProps {
    data: any[];
    loading?: boolean;
}

export function IngresosAreaChart({ data, loading }: ChartProps) {
    if (loading) return <Skeleton className="w-full h-full rounded-2xl" />;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                />
                <Tooltip
                    contentStyle={{
                        borderRadius: '16px',
                        border: 'none',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        backgroundColor: '#fff',
                        fontWeight: 800
                    }}
                    itemStyle={{ color: '#10B981' }}
                />
                <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#10B981"
                    strokeWidth={4}
                    fill="url(#colorIngresos)"
                    animationDuration={1500}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export function PagosDonutChart({ data, loading }: ChartProps) {
    if (loading) return <Skeleton className="w-full h-[250px] rounded-full mx-auto" />;

    // Si no hay datos, mostrar anillo gris vacío
    if (!data || data.length === 0 || data.every(d => d.value === 0)) {
        return (
            <div className="flex items-center justify-center w-full h-full">
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest text-center">
                    Módulo inactivo<br />o sin datos de pago
                </p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        borderRadius: '16px',
                        border: 'none',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        backgroundColor: '#fff',
                        fontWeight: 800,
                        color: '#334155'
                    }}
                    formatter={(value: number) => [`${value} casas`, 'Casas']}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}

export function ComunidadBarChart({ data, loading }: ChartProps) {
    if (loading) return <Skeleton className="w-full h-full rounded-2xl" />;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                />
                <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                        borderRadius: '16px',
                        border: 'none',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        backgroundColor: '#fff',
                        fontWeight: 800
                    }}
                />
                <Bar dataKey="resueltos" name="Resueltos / Completos" fill="#0EA5E9" radius={[4, 4, 0, 0]} barSize={30} animationDuration={1500} />
                <Bar dataKey="pendientes" name="Pendientes / Activos" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={30} animationDuration={1500} />
            </BarChart>
        </ResponsiveContainer>
    );
}
