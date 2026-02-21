"use client";

import React, { useMemo } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import { Ingreso } from "@/types/ingresos";
import { format, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    TrendingUp,
    Clock,
    PieChart as PieIcon,
    BarChart3,
    Activity,
    Home,
    Car,
    Database,
    RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface EstadisticasIngresosProps {
    ingresos: Ingreso[];
    monthFilter: string;
    isGlobalAdmin: boolean;
}

const COLORS = ['#0D8BFF', '#F59E0B', '#8B5CF6', '#10B981', '#EF4444'];

export default function EstadisticasIngresos({ ingresos, monthFilter, isGlobalAdmin }: EstadisticasIngresosProps) {

    // Helper para convertir timestamps variados
    const convertToDate = (ts: any): Date => {
        if (!ts) return new Date();
        if (ts instanceof Date) return ts;
        if (ts.toDate) return ts.toDate();
        if (ts.seconds) return new Date(ts.seconds * 1000);
        return new Date(ts);
    };

    // 1. Data para Tendencia (Día a Día del mes)
    const trendData = useMemo(() => {
        const data: any[] = [];
        const now = new Date();
        let start, end;

        if (monthFilter === 'todos') {
            end = now;
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
        } else {
            const [year, month] = monthFilter.split('-').map(Number);
            start = new Date(year, month - 1, 1);
            end = new Date(year, month, 0);
        }

        const interval = eachDayOfInterval({ start, end });

        interval.forEach(day => {
            const count = ingresos.filter(ing => isSameDay(convertToDate(ing.timestamp), day)).length;
            data.push({
                name: format(day, 'dd MMM', { locale: es }),
                total: count
            });
        });

        return data;
    }, [ingresos, monthFilter]);

    // 2. Data para Categorías (Pie Chart)
    const categoryData = useMemo(() => {
        const categories: any = {};
        ingresos.forEach(ing => {
            const cat = ing.category === 'temporal' ? '1 Solo Uso' :
                ing.category === 'evento' ? 'Evento' : 'Autorizada';
            categories[cat] = (categories[cat] || 0) + 1;
        });

        return Object.keys(categories).map(name => ({
            name,
            value: categories[name]
        }));
    }, [ingresos]);

    // 3. Data para Horas Pico (Formato 12 horas)
    const peakHoursData = useMemo(() => {
        const hours = Array(24).fill(0);
        ingresos.forEach(ing => {
            const d = convertToDate(ing.timestamp);
            const hour = d.getHours();
            hours[hour]++;
        });

        return hours.map((count, hour) => {
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return {
                hour: `${displayHour} ${ampm}`,
                total: count
            };
        });
    }, [ingresos]);

    // 4. Top Casas con más ingresos
    const topHousesData = useMemo(() => {
        const counts: any = {};
        ingresos.forEach(ing => {
            const label = `${ing.domicilio?.calle || ''} ${ing.domicilio?.houseNumber || ''}`.trim();
            // Filtrar etiquetas vacías o genéricas "N/A"
            if (label && !label.toLowerCase().includes('no especificada') && !label.toLowerCase().includes('n/a')) {
                counts[label] = (counts[label] || 0) + 1;
            }
        });
        return Object.keys(counts)
            .map(name => ({ name, total: counts[name] }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [ingresos]);

    // 5. Flujo por Día de la Semana
    const weekdayData = useMemo(() => {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const counts = Array(7).fill(0);
        ingresos.forEach(ing => {
            const d = convertToDate(ing.timestamp);
            counts[d.getDay()]++;
        });
        return days.map((name, i) => ({ name, total: counts[i] }));
    }, [ingresos]);

    // 6. Vehicular vs Peatonal
    const transportData = useMemo(() => {
        const vehicular = ingresos.filter(i => !!i.vehicleInfo?.placa || !!i.vehicleInfo).length;
        const peatonal = ingresos.length - vehicular;
        return [
            { name: 'Vehicular', value: vehicular },
            { name: 'Peatonal', value: peatonal }
        ];
    }, [ingresos]);

    // 7. Data de Residenciales (Top 5 con más flujo) - Solo para Global Admin
    const residentialData = useMemo(() => {
        const resMap: any = {};
        ingresos.forEach(ing => {
            const name = ing._residencialNombre || 'Otros';
            resMap[name] = (resMap[name] || 0) + 1;
        });

        return Object.keys(resMap)
            .map(name => ({ name, total: resMap[name] }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [ingresos]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">

            {/* Fila Superior: Tendencia y Top Casas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-none shadow-zentry-lg bg-slate-900 text-white rounded-[2.5rem] p-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <TrendingUp size={180} />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="space-y-2">
                            <Badge className="bg-primary hover:bg-primary border-none text-white font-black px-4 py-1 rounded-full uppercase text-[10px] tracking-widest">Reporte Ejecutivo</Badge>
                            <h2 className="text-3xl font-black tracking-tighter">Tendencia de Flujo Mensual</h2>
                            <p className="text-slate-400 font-bold max-w-md">Análisis predictivo basado en el histórico de ingresos registrados en el periodo seleccionado.</p>
                        </div>

                        <div className="mt-8 h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0D8BFF" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#0D8BFF" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="total" stroke="#0D8BFF" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Card>

                {/* Top Casas */}
                <Card className="border-none shadow-zentry-lg bg-white rounded-[2.5rem] p-8 flex flex-col justify-between">
                    <div>
                        <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-6">
                            <Home size={28} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Casas con Mayor Flujo</h3>
                        <p className="text-sm font-bold text-slate-500">Ranking del periodo con las 5 casas que reciben mayor volumen de visitas.</p>
                    </div>

                    <div className="space-y-4 mt-8">
                        {topHousesData.length > 0 ? topHousesData.map((casa, idx) => (
                            <div key={casa.name} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="h-6 w-6 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-black shrink-0">#{idx + 1}</span>
                                    <span className="text-sm font-black text-slate-700 truncate">{casa.name}</span>
                                </div>
                                <Badge variant="secondary" className="font-black bg-white text-primary rounded-lg shrink-0">{casa.total} vis.</Badge>
                            </div>
                        )) : (
                            <div className="text-center py-10 opacity-40 italic font-bold">Sin datos suficientes</div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Grid de Gráficas Detalladas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">

                {/* Distribución por Tipo */}
                <Card className="border-none shadow-zentry-lg bg-white rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <PieIcon className="h-5 w-5 text-primary" /> Segmentación
                            </CardTitle>
                            <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mt-1">Por tipo de pase</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[250px] w-full flex items-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={8}
                                        cornerRadius={10}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-col gap-4 justify-center shrink-0 ml-4">
                                {categoryData.map((item, i) => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Horas Pico */}
                <Card className="border-none shadow-zentry-lg bg-white rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-slate-50">
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" /> Horas Pico
                        </CardTitle>
                        <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mt-1">Distribución horaria</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={peakHoursData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold' }} />
                                    <Bar dataKey="total" fill="#0D8BFF" radius={[5, 5, 0, 0]} barSize={15} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Frecuencia Semanal */}
                <Card className="border-none shadow-zentry-lg bg-white rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-slate-50">
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" /> Frecuencia Semanal
                        </CardTitle>
                        <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mt-1">Saturación por día</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weekdayData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold' }} />
                                    <Bar dataKey="total" fill="#8B5CF6" radius={[10, 10, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Modo de Transporte */}
                <Card className="border-none shadow-zentry-lg bg-white rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 border-b border-slate-50">
                        <CardTitle className="text-xl font-black flex items-center gap-2">
                            <Car className="h-5 w-5 text-primary" /> Transporte
                        </CardTitle>
                        <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mt-1">Vehicular vs Peatonal</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={transportData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        cornerRadius={10}
                                        dataKey="value"
                                    >
                                        <Cell fill="#0D8BFF" />
                                        <Cell fill="#94a3b8" />
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center gap-6 mt-2">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
                                    <div className="h-2 w-2 rounded-full bg-[#0D8BFF]" /> Vehicular
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
                                    <div className="h-2 w-2 rounded-full bg-[#94a3b8]" /> Peatonal
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>



                {/* Top Residenciales (SOLO GLOBAL) */}
                {isGlobalAdmin && (
                    <Card className="border-none shadow-zentry-lg bg-white rounded-[2.5rem] overflow-hidden md:col-span-1">
                        <CardHeader className="p-8 border-b border-slate-50">
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" /> Geografía
                            </CardTitle>
                            <CardDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mt-1">Flujo por complejo</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="h-[180px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={residentialData}>
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 10, fontWeight: 'black', fill: '#475569' }} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold' }} />
                                        <Bar dataKey="total" radius={[0, 5, 5, 0]} barSize={20}>
                                            {residentialData.map((e, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

        </div>
    );
}
