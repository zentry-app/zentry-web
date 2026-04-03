"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface DashboardChartProps {
    data: { day: string, count: number }[];
    loading?: boolean;
}

export default function DashboardChart({ data, loading }: DashboardChartProps) {
    if (loading) {
        return <div className="h-full w-full bg-slate-100 animate-pulse rounded-2xl" />;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0D8BFF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0D8BFF" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                />
                <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
                    className="text-slate-400 dark:text-slate-600"
                />
                <Tooltip
                    contentStyle={{
                        borderRadius: '16px',
                        border: 'none',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        backgroundColor: 'var(--card)',
                        color: 'var(--foreground)'
                    }}
                    itemStyle={{ fontWeight: 800, color: '#0D8BFF' }}
                    labelStyle={{ fontWeight: 800, color: 'currentColor', marginBottom: '4px' }}
                />
                <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#0D8BFF"
                    strokeWidth={4}
                    fill="url(#colorCount)"
                    animationDuration={1500}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
