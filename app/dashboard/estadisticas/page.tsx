"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRequired } from "@/lib/hooks";
import { motion } from "framer-motion";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    RefreshCw,
    TrendingUp,
    Users,
    ShieldCheck,
    Car,
    FileText,
    CalendarCheck,
    DownloadCloud,
    PieChart as PieChartIcon,
    BarChart3
} from "lucide-react";
import { collection, getDocs, query, where, limit as fbLimit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Import services and charts
import { getCachedResidencialData, getCachedResidencialUsers, getCachedIngresos } from '@/lib/cache/dashboard-cache';
import { ReportesService } from "@/lib/services/reportes-service";
import { SurveyService } from "@/lib/services/survey-service";
import {
    IngresosAreaChart,
    PagosDonutChart,
    ComunidadBarChart
} from "@/components/dashboard/estadisticas/EstadisticasCharts";
import CountUp from "react-countup";

interface DataState {
    ingresosData: { day: string; count: number }[];
    pagosData: { name: string; value: number; color: string }[];
    comunidadData: { name: string; resueltos: number; pendientes: number }[];
    summary: {
        totalResidentes: number;
        tasaMorosidad: number;
        totalAccesos: number;
        reportesMes: number;
    }
}

export default function EstadisticasPage() {
    const { isAdmin, isUserLoading } = useAdminRequired();
    const { userClaims, userData } = useAuth();

    // States
    const [data, setData] = useState<DataState | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [residencialNombre, setResidencialNombre] = useState<string | "">("");

    // Determinar residencial
    const esAdminDeResidencial = (userClaims?.role === 'admin') && !userClaims?.isGlobalAdmin;
    const residencialId = useMemo(() => {
        if (!esAdminDeResidencial) return null;
        return userClaims?.managedResidencials?.[0] || userClaims?.residencialId || null;
    }, [esAdminDeResidencial, userClaims]);

    const fetchResidencialName = useCallback(async () => {
        try {
            const residencialesRef = collection(db, 'residenciales');
            const qByCode = query(residencialesRef, where('residencialID', '==', residencialId), fbLimit(1));
            const snapByCode = await getDocs(qByCode);
            if (!snapByCode.empty) {
                setResidencialNombre(snapByCode.docs[0].data()?.nombre || "Tus Instalaciones");
            }
        } catch (e) {
            // Ignorar
        }
    }, [residencialId]);

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            if (!residencialId) {
                throw new Error("Página requiere contexto de residencial activo.");
            }

            const residencialData = await getCachedResidencialData(residencialId);
            const residencialDocId = residencialData?.id || residencialId;

            // 1. Usuarios y Morosidad
            const residentsData = await getCachedResidencialUsers(residencialId, 'resident');
            const casasUnicas = new Set<string>();
            const casasConMorosos = new Set<string>();

            residentsData.forEach((usuario: any) => {
                const tieneCasa = usuario.houseID || usuario.houseId || usuario.houseNumber || usuario.calle;
                if (!tieneCasa) return;

                const key = `${usuario.calle || ''}#${usuario.houseNumber || ''}`.trim().toUpperCase();
                casasUnicas.add(key);
                if (usuario.isMoroso === true) casasConMorosos.add(key);
            });

            const totalCasas = casasUnicas.size || 1; // Prevenir div / 0
            const casasMorosas = casasConMorosos.size;
            const casasCorriente = casasUnicas.size - casasMorosas;

            const pagosChartData = [
                { name: 'Al corriente', value: casasCorriente, color: '#10B981' },
                { name: 'Con adeudos', value: casasMorosas, color: '#F43F5E' }
            ];

            // 2. Accesos
            const last7Days = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
            const ingresosRaw = await getCachedIngresos(residencialDocId, last7Days);

            const historyMap = new Map<string, number>();
            let totalAccesos = 0;

            ingresosRaw.forEach((i: any) => {
                const date = (i.timestamp as any).toDate();
                if (date >= last7Days) {
                    const dayStr = date.toLocaleDateString('es-MX', { weekday: 'short' }).toUpperCase();
                    historyMap.set(dayStr, (historyMap.get(dayStr) || 0) + 1);
                    totalAccesos++;
                }
            });

            const ingresosChartData = Array.from(historyMap.entries())
                .map(([day, count]) => ({ day, count }))
                .reverse();

            // 3. Comunidad (Reportes y Encuestas)
            const statsReportes = await ReportesService.getStats(residencialId);
            const encuestas = await SurveyService.getSurveysByResidencial(residencialDocId).catch(() => []);

            const encuestasActiv = encuestas.filter(s => s.status === 'pending').length;
            const encuestasCompl = encuestas.filter(s => s.status === 'concluida').length;

            const comunidadChartData = [
                {
                    name: 'Reportes',
                    resueltos: (statsReportes?.resueltos || 0) + (statsReportes?.cerrados || 0),
                    pendientes: (statsReportes?.pendientes || 0) + (statsReportes?.enProceso || 0) + (statsReportes?.enRevision || 0)
                },
                {
                    name: 'Encuestas',
                    resueltos: encuestasCompl,
                    pendientes: encuestasActiv
                }
            ];

            setData({
                ingresosData: ingresosChartData,
                pagosData: pagosChartData,
                comunidadData: comunidadChartData,
                summary: {
                    totalResidentes: residentsData.length,
                    tasaMorosidad: Math.round((casasMorosas / totalCasas) * 100),
                    totalAccesos,
                    reportesMes: statsReportes?.total || 0
                }
            });

        } catch (err: any) {
            console.error("Error cargando intel:", err);
            setError(err.message || "Error al cargar datos");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [residencialId]);

    useEffect(() => {
        if (isAdmin && residencialId) {
            fetchResidencialName();
        }
    }, [fetchResidencialName, isAdmin, residencialId]);

    useEffect(() => {
        if (isAdmin && residencialId) {
            fetchDashboardData();
        }
    }, [fetchDashboardData, isAdmin, residencialId]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    if (isUserLoading || !isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-premium">
                <div className="text-center space-y-4">
                    <Activity className="h-12 w-12 text-primary animate-pulse mx-auto" />
                    <p className="text-primary font-black tracking-widest uppercase">Cargando Inteligencia...</p>
                </div>
            </div>
        );
    }

    if (!esAdminDeResidencial) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-premium px-10">
                <div className="text-center space-y-4">
                    <ShieldCheck className="h-16 w-16 text-slate-300 mx-auto" />
                    <h2 className="text-2xl font-black text-slate-900">Vista No Disponible</h2>
                    <p className="text-slate-500 font-bold max-w-sm">Esta vista de analítica avanzada requiere ser administrador directo de un complejo residencial específico.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-premium px-4 lg:px-10 py-8 relative">
            {/* Header Mágico */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
            >
                <div className="space-y-2">
                    <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1 rounded-full flex gap-2 w-fit items-center shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                        Centro de Inteligencia
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                        Zentry <span className="text-gradient-zentry">Analytics</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-lg max-w-lg">
                        Métricas consolidadas y rendimiento financiero para {residencialNombre || 'tu complejo'}.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => window.print()}
                        variant="outline"
                        size="lg"
                        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm rounded-2xl h-14 px-6 font-black"
                    >
                        <DownloadCloud className="mr-2 h-5 w-5" />
                        Exportar
                    </Button>
                    <Button
                        onClick={handleRefresh}
                        disabled={refreshing || loading}
                        size="lg"
                        className="bg-slate-900 text-white hover:bg-slate-800 shadow-zentry hover-lift rounded-2xl h-14 px-8 font-black transition-all border-none"
                    >
                        <RefreshCw className={`mr-2 h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Sincronizando...' : 'Sincronizar'}
                    </Button>
                </div>
            </motion.div>

            {/* Top Cards KPIs */}
            <div className="grid gap-6 grid-cols-2 md:grid-cols-4 mb-10">
                {[
                    { title: "Residentes", value: data?.summary.totalResidentes, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
                    { title: "Tasa Morosidad", value: data?.summary.tasaMorosidad, icon: TrendingUp, color: "text-rose-500", bg: "bg-rose-50", suffix: "%" },
                    { title: "Accesos (7d)", value: data?.summary.totalAccesos, icon: Car, color: "text-emerald-500", bg: "bg-emerald-50" },
                    { title: "Reportes Totales", value: data?.summary.reportesMes, icon: FileText, color: "text-purple-500", bg: "bg-purple-50" },
                ].map((kpi, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}>
                        <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden p-6 hover:shadow-md transition-all group">
                            <div className="flex flex-col gap-4">
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${kpi.bg} ${kpi.color} group-hover:scale-110 transition-transform`}>
                                    <kpi.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.title}</p>
                                    <p className="text-4xl font-black text-slate-900 tracking-tighter mt-1">
                                        {loading ? "-" : <CountUp end={kpi.value || 0} duration={2} suffix={kpi.suffix || ""} />}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Módulo Central: Gráficos Flexibles */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 lg:grid-rows-2">

                {/* 1. Gráfico de Ingresos Area (Ocupa Row 1 - Col 1) */}
                <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
                    <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <Activity className="h-6 w-6 text-emerald-500" /> Flujo de Ingresos a Caseta
                            </CardTitle>
                            <p className="text-slate-500 font-bold text-sm mt-1">Tráfico vehicular y peatonal últimos 7 días</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 h-[280px]">
                        <IngresosAreaChart data={data?.ingresosData || []} loading={loading} />
                    </CardContent>
                </Card>

                {/* 2. Donut Pagos (Ocupa Row 1 - Col 2) */}
                <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8">
                    <CardHeader className="p-0 mb-6">
                        <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <PieChartIcon className="h-6 w-6 text-rose-500" /> Estado Contable
                        </CardTitle>
                        <p className="text-slate-500 font-bold text-sm mt-1">Composición general según casas activas</p>
                    </CardHeader>
                    <CardContent className="p-0 h-[220px] relative">
                        <PagosDonutChart data={data?.pagosData || []} loading={loading} />
                        {!loading && data?.summary.tasaMorosidad !== undefined && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <span className="text-3xl font-black text-slate-900">{data.summary.tasaMorosidad}%</span>
                                <span className="block text-[10px] uppercase font-bold text-slate-400">morosos</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. BarChart Comunidad (Ocupa Row 2 - spans Col 1 y 2 completos) */}
                <Card className="border-none shadow-sm rounded-[2.5rem] bg-white p-8 lg:col-span-2">
                    <CardHeader className="p-0 mb-8">
                        <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <BarChart3 className="h-6 w-6 text-blue-500" /> Relación con Comunidad
                        </CardTitle>
                        <p className="text-slate-500 font-bold text-sm mt-1">Reportes vs Encuestas (Efectividad de cierre de ciclo)</p>
                    </CardHeader>
                    <CardContent className="p-0 h-[300px]">
                        <ComunidadBarChart data={data?.comunidadData || []} loading={loading} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
