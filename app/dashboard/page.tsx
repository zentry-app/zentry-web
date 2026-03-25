"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRequired } from "@/lib/hooks";
import { motion, AnimatePresence } from "framer-motion";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    Building,
    Home,
    ShieldCheck,
    RefreshCw,
    Clock,
    AlertTriangle,
    UserPlus,
    ShieldAlert,
    TrendingUp,
    TrendingDown,
    Car,
    Calendar,
    Activity,
    CheckCircle2,
    XCircle,
    ArrowRight,
    Zap,
    Database,
    Bell,
    Search,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    FileText
} from "lucide-react";
import Link from "next/link";
import { AdminService, DashboardService } from "@/lib/services";
import type {
    SystemHealth
} from "@/lib/services/dashboard-service";
import { collection, getDocs, query, where, limit as fbLimit, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getUsuariosPendientes } from '@/lib/firebase/firestore';
// Componentes pesados cargados dinámicamente
const DashboardChart = dynamic(() => import('@/components/dashboard/dashboard-chart'), {
    ssr: false,
    loading: () => <Skeleton className="h-[260px] w-full rounded-2xl" />
});
const CountUp = dynamic(() => import('react-countup'), { ssr: false });

// Interfaces
interface DashboardStats {
    totalResidentes: number;
    totalResidenciales: number;
    totalAdmins: number;
    globalAdmins?: number;
    pendingUsers: number;
}

interface FinancialStats {
    casasMorosas: number;
    totalCasas: number;
    porcentajeMorosidad: number;
}

interface IngresoStats {
    totalIngresos: number;
    ingresosActivos: number;
    ingresosVehiculares: number;
    history: { day: string, count: number }[];
}

interface RecentActivity {
    id: string;
    type: 'ingreso' | 'alerta' | 'reserva' | 'usuario';
    title: string;
    subtitle: string;
    time: Date;
    status: 'active' | 'completed' | 'urgent';
}

interface PendingPass {
    id: string;
    passNumber: string | number;
    house: string;
    time: Date;
}

export default function DashboardPage() {
    const { isAdmin, isUserLoading } = useAdminRequired();
    const { user, userData, userClaims } = useAuth();

    // Estados
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [financialStats, setFinancialStats] = useState<FinancialStats | null>(null);
    const [ingresoStats, setIngresoStats] = useState<IngresoStats | null>(null);
    const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
    const [pendingPasses, setPendingPasses] = useState<PendingPass[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [residencialNombre, setResidencialNombre] = useState<string | null>(null);
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
    const [uniqueHousesCount, setUniqueHousesCount] = useState<number | null>(null);
    const [pendingReservationsCount, setPendingReservationsCount] = useState<number | null>(null);
    const [pendingUsersCount, setPendingUsersCount] = useState<number | null>(null);
    const [totalResidentesCount, setTotalResidentesCount] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [dbStatus, setDbStatus] = useState<'online' | 'error' | 'loading'>('loading');

    // Determinar tipo de admin
    const esAdminGlobal = userClaims?.isGlobalAdmin === true;
    const esAdminDeResidencial = (userClaims?.role === 'admin') && !esAdminGlobal;
    const residencialId = useMemo(() => {
        if (!esAdminDeResidencial) return null;
        return userClaims?.managedResidencials?.[0] || userClaims?.residencialId || null;
    }, [esAdminDeResidencial, userClaims]);

    // Reloj y Resize
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);

        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);

        return () => {
            clearInterval(timer);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Cargar nombre del residencial
    useEffect(() => {
        const fetchResidencialNombre = async () => {
            if (!esAdminDeResidencial || !residencialId) {
                setResidencialNombre(null);
                return;
            }
            try {
                const residencialesRef = collection(db, 'residenciales');
                const qByCode = query(residencialesRef, where('residencialID', '==', residencialId), fbLimit(1));
                const snapByCode = await getDocs(qByCode);
                if (!snapByCode.empty) {
                    const data: any = snapByCode.docs[0].data();
                    setResidencialNombre(data?.nombre || residencialId);
                    return;
                }
                try {
                    const { getDoc, doc } = await import('firebase/firestore');
                    const docSnap = await getDoc(doc(db, 'residenciales', residencialId));
                    if (docSnap.exists()) {
                        const data: any = docSnap.data();
                        setResidencialNombre(data?.nombre || residencialId);
                        return;
                    }
                } catch { }
                setResidencialNombre(residencialId);
            } catch (e) {
                setResidencialNombre(residencialId);
            }
        };
        fetchResidencialNombre();
    }, [esAdminDeResidencial, residencialId]);

    // Cargar datos básicos y financieros
    const fetchAllStats = useCallback(async () => {
        try {
            setLoadingStats(true);
            setError(null);

            // Importar servicios de caché
            const {
                getCachedSystemStats,
                getCachedSystemHealth,
                getCachedResidencialData,
                getCachedResidencialUsers,
                getCachedIngresos,
                getCachedActivePasses,
                getCachedPendingReservations
            } = await import('@/lib/cache/dashboard-cache');

            // 1. Estadísticas básicas (Caché)
            const systemStats = await getCachedSystemStats();
            setStats(systemStats);

            // 2. Salud del sistema (Caché)
            const health = await getCachedSystemHealth();
            setSystemHealth(health);

            if (esAdminDeResidencial && residencialId) {
                // 3. Usuarios y Casas (Morosidad) - Usamos caché
                const residentsData = await getCachedResidencialUsers(residencialId, 'resident');

                // FIX: Recalcular admins localmente para asegurar precisión (excluyendo globales si existen en la lista)
                const adminsData = await getCachedResidencialUsers(residencialId, 'admin');
                const localAdminsCount = adminsData.filter((d: any) => !d.isGlobalAdmin).length;

                // Actualizamos stats con el conteo real local
                setStats(prev => ({
                    ...prev!,
                    totalAdmins: localAdminsCount,
                    totalResidentes: residentsData.length
                }));

                const sanitize = (s?: string) => (s || '').toString().replace(/[\u0000-\u001F\u007F-\u009F\u200B\u200C\u200D\FEFF]/g, '');
                const normalize = (s?: string) => sanitize(s).trim().toUpperCase().replace(/\s+/g, ' ');
                const addrKey = (calle?: string, houseNumber?: string) => `ADDR::${normalize(calle)}#${normalize(houseNumber)}`;

                const casasUnicas = new Set<string>();
                const casasConMorosos = new Set<string>();
                const hidIndex = new Map<string, string>();
                const addrIndex = new Map<string, string>();

                residentsData.forEach((usuario: any) => {
                    const tieneCasa = usuario.houseID || usuario.houseId || usuario.houseNumber || usuario.calle;
                    if (!tieneCasa) return;

                    const rawHid = (usuario.houseID || usuario.houseId || '').toString();
                    const hidNorm = normalize(rawHid);
                    const aKey = addrKey(usuario.calle, usuario.houseNumber);

                    let chosenKey = hidNorm || aKey;

                    const addrExisting = addrIndex.get(aKey);
                    if (addrExisting && addrExisting !== chosenKey) {
                        chosenKey = addrExisting;
                    }

                    if (hidNorm) {
                        const hidExisting = hidIndex.get(hidNorm);
                        if (hidExisting && hidExisting !== chosenKey) {
                            chosenKey = hidExisting;
                        } else if (!hidExisting) {
                            hidIndex.set(hidNorm, chosenKey);
                        }
                    }
                    if (!addrIndex.has(aKey)) addrIndex.set(aKey, chosenKey);

                    casasUnicas.add(chosenKey);
                    if (usuario.isMoroso === true) casasConMorosos.add(chosenKey);
                });

                const totalCasas = casasUnicas.size;
                const casasMorosas = casasConMorosos.size;
                setUniqueHousesCount(totalCasas);
                setTotalResidentesCount(residentsData.length);
                setFinancialStats({
                    totalCasas,
                    casasMorosas,
                    porcentajeMorosidad: totalCasas > 0 ? Math.round((casasMorosas / totalCasas) * 100) : 0
                });

                // 4. Ingresos Vehiculares y Gráfica
                const residencialData = await getCachedResidencialData(residencialId);
                const residencialDocId = residencialData?.id;

                if (residencialDocId) {
                    const now = new Date();
                    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

                    // Para que los datos coincidan, debemos traer TODO lo del mes si queremos el total del mes
                    const fetchLimitDate = firstDayOfMonth < last7Days ? firstDayOfMonth : last7Days;

                    // Usamos caché para ingresos y pases activos
                    const [ingresosData, activePassesData] = await Promise.all([
                        getCachedIngresos(residencialDocId, fetchLimitDate),
                        getCachedActivePasses(residencialDocId)
                    ]);

                    let totalM = 0;
                    let activosM = 0;
                    let vehicularesM = 0;
                    const historyMap = new Map<string, number>();
                    const activities: RecentActivity[] = [];
                    const pPasses: PendingPass[] = [];

                    // Procesar Activos (Pases Pendientes)
                    activePassesData.forEach((data: any) => {
                        if (data.physicalPass?.delivered && !data.physicalPass?.returned) {
                            pPasses.push({
                                id: data.id,
                                passNumber: data.physicalPass?.number || 'S/N',
                                house: `${data.domicilio?.calle || ''} ${data.domicilio?.houseNumber || ''}`.trim() || 'N/A',
                                time: (data.timestamp as any).toDate()
                            });
                        }
                    });

                    // Procesar Stats y Actividad
                    ingresosData.forEach((data: any) => {
                        const date = (data.timestamp as any).toDate();

                        // Totales del mes (si es del mes actual)
                        if (date >= firstDayOfMonth) {
                            totalM++;
                            if (data.status === 'active') activosM++;

                            const isVehicular = !!data.vehicleInfo?.placa || !!data.vehicleInfo;
                            if (isVehicular) vehicularesM++;
                        }

                        // Historial últimos 7 días
                        if (date >= last7Days) {
                            const dayStr = date.toLocaleDateString('es-MX', { weekday: 'short' });
                            historyMap.set(dayStr, (historyMap.get(dayStr) || 0) + 1);
                        }

                        // Actividad reciente (Top 5)
                        if (activities.length < 5) {
                            activities.push({
                                id: data.id,
                                type: 'ingreso',
                                title: data.visitanteNombre || 'Registro en Caseta',
                                subtitle: `${data.domicilio?.calle || ''} ${data.domicilio?.houseNumber || ''}`,
                                time: date,
                                status: data.status === 'active' ? 'active' : 'completed'
                            });
                        }
                    });

                    const history = Array.from(historyMap.entries())
                        .map(([day, count]) => ({ day, count }))
                        .reverse();

                    setIngresoStats({
                        totalIngresos: totalM,
                        ingresosActivos: activosM,
                        ingresosVehiculares: vehicularesM,
                        history
                    });
                    setRecentActivities(activities);
                    setPendingPasses(pPasses.sort((a, b) => a.time.getTime() - b.time.getTime()));
                    setDbStatus('online');

                    // 5. Reservas Pendientes (Caché)
                    const reservationsData = await getCachedPendingReservations(residencialDocId);
                    setPendingReservationsCount(reservationsData.length);

                    // 6. Usuarios Pendientes (Este servicio ya suele estar optimizado, pero lo mantenemos igual por ahora)
                    const pending = await getUsuariosPendientes({ limit: 100 });
                    setPendingUsersCount(pending.filter(u => (u as any).residencialID === residencialId).length);
                }
            }
        } catch (err: any) {
            console.error("Error al cargar estadísticas:", err);
            setError(err.message);
            setDbStatus('error');
        } finally {
            setLoadingStats(false);
            setRefreshing(false);
        }
    }, [esAdminDeResidencial, residencialId]);

    useEffect(() => {
        if (isAdmin) {
            fetchAllStats();
        }
    }, [fetchAllStats, isAdmin]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAllStats();
        setRefreshing(false);
    };

    const formatTimeAgo = (date: Date): string => {
        const now = new Date();
        const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
        if (diffMin < 1) return 'Ahora';
        if (diffMin < 60) return `${diffMin}m`;
        if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h`;
        return date.toLocaleDateString();
    };

    if (isUserLoading || !isAdmin) {
        return (
            <div className="flex items-center justify-center h-screen bg-premium">
                <div className="text-center">
                    <div className="relative h-20 w-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
                        <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin"></div>
                    </div>
                    <p className="text-primary font-bold animate-pulse text-lg">Sincronizando Zentry...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-premium px-4 sm:px-6 lg:px-10 py-6 sm:py-8 relative">
            {/* Hero Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
            >
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em]">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                        Overview del Sistema
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                        Hola, <span className="text-gradient-zentry">{userData?.fullName?.split(' ')[0] || "Admin"}</span> 👋
                    </h1>
                    <p className="text-slate-500 font-medium text-base sm:text-lg">
                        {currentTime.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>

                <Button
                    onClick={handleRefresh}
                    disabled={refreshing || loadingStats}
                    size="lg"
                    className="bg-white dark:bg-slate-900 border-primary/20 dark:border-white/10 text-primary hover:bg-white dark:hover:bg-slate-800 shadow-zentry dark:shadow-none hover-lift rounded-2xl h-14 px-8 font-bold transition-all"
                >
                    <RefreshCw className={`mr-2 h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Sincronizando...' : 'Actualizar'}
                </Button>
            </motion.div>

            {/* Grid General de Stats */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                <StatCard
                    label="Residentes"
                    value={esAdminDeResidencial ? (totalResidentesCount ?? 0) : (stats?.totalResidentes || 0)}
                    icon={<Users className="h-6 w-6 text-white" />}
                    gradient="from-blue-600 to-sky-400"
                    delay={0.1}
                    trend={{ val: 8, up: true }}
                    loading={loadingStats}
                />
                <StatCard
                    label={esAdminDeResidencial ? "Propiedades" : "Comunidades"}
                    value={esAdminDeResidencial ? (uniqueHousesCount ?? 0) : (stats?.totalResidenciales || 0)}
                    icon={esAdminDeResidencial ? <Home className="h-6 w-6 text-white" /> : <Building className="h-6 w-6 text-white" />}
                    gradient="from-emerald-500 to-teal-400"
                    delay={0.2}
                    trend={{ val: 2, up: true }}
                    loading={loadingStats}
                />
                <StatCard
                    label="Administradores"
                    value={stats?.totalAdmins || 0}
                    icon={<ShieldCheck className="h-6 w-6 text-white" />}
                    gradient="from-amber-500 to-orange-400"
                    delay={0.3}
                    trend={{ val: 0, up: true }}
                    loading={loadingStats}
                />
                <StatCard
                    label={esAdminDeResidencial && financialStats ? "Morosidad" : "Pendientes"}
                    value={esAdminDeResidencial && financialStats ? `${financialStats.porcentajeMorosidad}%` : (esAdminDeResidencial ? (pendingUsersCount ?? 0) : (stats?.pendingUsers || 0))}
                    icon={esAdminDeResidencial && financialStats ? <TrendingDown className="h-6 w-6 text-white" /> : <UserPlus className="h-6 w-6 text-white" />}
                    gradient={esAdminDeResidencial && financialStats ? "from-red-600 to-rose-500" : "from-purple-600 to-fuchsia-500"}
                    delay={0.4}
                    trend={{ val: 3, up: false }}
                    loading={loadingStats}
                />
            </div>

            {/* Dashboard Bento Grid */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-12 mb-10">

                {/* Columna Principal - Gráfico y Stats Rápidas (8 Col) */}
                <div className="lg:col-span-8 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Card className="border-none shadow-zentry-lg dark:shadow-none bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden dark:ring-1 dark:ring-white/5">
                            <CardHeader className="p-8 pb-2">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-xl sm:text-2xl font-black flex items-center gap-3 dark:text-white">
                                            <Car className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                                            Flujo de Accesos
                                        </CardTitle>
                                        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">Volumen de ingresos semanal</p>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
                                        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-500/10 rounded-2xl shrink-0">
                                            <p className="text-[10px] font-black text-blue-400 dark:text-blue-500 uppercase leading-none mb-1">Total Mes</p>
                                            <p className="text-lg font-black text-blue-600 dark:text-blue-400 leading-none">{ingresoStats?.totalIngresos || 0}</p>
                                        </div>
                                        <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl shrink-0">
                                            <p className="text-[10px] font-black text-emerald-400 dark:text-emerald-500 uppercase leading-none mb-1">Activos</p>
                                            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">{ingresoStats?.ingresosActivos || 0}</p>
                                        </div>
                                        <div className="px-4 py-2 bg-purple-50 dark:bg-purple-500/10 rounded-2xl shrink-0">
                                            <p className="text-[10px] font-black text-purple-400 dark:text-purple-500 uppercase leading-none mb-1">Vehicular</p>
                                            <p className="text-lg font-black text-purple-600 dark:text-purple-400 leading-none">{ingresoStats?.ingresosVehiculares || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-8 pb-10">
                                <div className="h-[260px] w-full mt-6">
                                    <DashboardChart
                                        data={ingresoStats?.history || []}
                                        loading={loadingStats}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Estado del Sistema (Real) */}
                    <div className="grid grid-cols-1 gap-6">
                        <Card className="border-none shadow-zentry-lg dark:shadow-none bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 dark:ring-1 dark:ring-white/5">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center ${dbStatus === 'online' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' :
                                        dbStatus === 'loading' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600'
                                        }`}>
                                        <Database className="h-5 w-5 sm:h-6 sm:w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 dark:text-white leading-none text-sm">Estado de Conexión</h3>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Firebase Real-time DB</p>
                                    </div>
                                </div>
                                <Badge className={`${dbStatus === 'online' ? 'bg-emerald-500/10 text-emerald-600' :
                                    dbStatus === 'loading' ? 'bg-blue-500/10 text-blue-600' : 'bg-rose-500/10 text-rose-600'
                                    } border-none text-[10px] font-black uppercase tracking-widest px-3 py-1 w-fit`}>
                                    {dbStatus === 'online' ? 'Online' : dbStatus === 'loading' ? 'Sincronizando' : 'Error'}
                                </Badge>
                            </div>
                        </Card>

                        <div className="grid grid-cols-2 gap-4">
                            <QuickTile href="/dashboard/usuarios" icon={<Users size={20} />} label="Usuarios" color="blue" windowWidth={windowWidth} />
                            {esAdminDeResidencial ? (
                                <QuickTile href="/dashboard/ingresos" icon={<Car size={20} />} label="Ingresos" color="emerald" windowWidth={windowWidth} />
                            ) : (
                                <QuickTile href="/dashboard/residenciales" icon={<Building size={20} />} label="Condos" color="purple" windowWidth={windowWidth} />
                            )}
                            <QuickTile href="/dashboard/reportes" icon={<FileText size={20} />} label="Reportes" color="slate" windowWidth={windowWidth} />
                            <QuickTile href="/dashboard/reservas" icon={<Calendar size={20} />} label="Reservas" color="amber" windowWidth={windowWidth} />
                            <QuickTile href="/dashboard/alertas-panico" icon={<ShieldAlert size={20} />} label="Pánico" color="red" windowWidth={windowWidth} />
                        </div>
                    </div>
                </div>

                {/* Columna Lateral - Pases y Actividad (4 Col) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Pases Pendientes (Watchlist Crítica) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="shadow-zentry-lg bg-[#0f172a] text-white rounded-3xl sm:rounded-[2.5rem] overflow-hidden border border-white/5">
                            <div className="p-6 sm:p-8 pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-black flex items-center gap-3 text-white">
                                            <Database className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Pases Faltantes
                                        </h2>
                                        <p className="text-slate-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-[0.2em] mt-1 ml-8 sm:ml-9">+1 SEMANA FUERA</p>
                                    </div>
                                    <Badge className="bg-rose-500 hover:bg-rose-500 text-white border-none text-[10px] font-black px-2 sm:px-3 py-1">ALERTA</Badge>
                                </div>
                            </div>
                            <div className="px-4 sm:px-6 pb-6 sm:pb-8 space-y-3 sm:space-y-4">
                                {loadingStats ? (
                                    <Skeleton className="h-48 w-full rounded-3xl opacity-10" />
                                ) : pendingPasses.filter(p => (new Date().getTime() - p.time.getTime()) > 7 * 24 * 60 * 60 * 1000).length > 0 ? (
                                    pendingPasses
                                        .filter(p => (new Date().getTime() - p.time.getTime()) > 7 * 24 * 60 * 60 * 1000)
                                        .slice(0, 5)
                                        .map((pass) => (
                                            <div key={pass.id} className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl sm:rounded-[1.5rem] bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-all">
                                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 font-black text-xs sm:text-sm border border-primary/20">
                                                    #{pass.passNumber}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-base sm:text-lg font-black truncate text-white tracking-tight">{pass.house}</p>
                                                    <p className="text-[10px] sm:text-[11px] font-bold text-rose-400 uppercase flex items-center gap-1.5 opacity-90">
                                                        <Clock size={10} className="sm:size-12 text-rose-500" /> {pass.time.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).toUpperCase()}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-lg">
                                                        {pass.time.toLocaleDateString('es-MX', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <div className="text-center py-10 sm:py-12 opacity-40 bg-white/[0.02] rounded-3xl sm:rounded-[2rem] border border-white/5">
                                        <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-3 text-emerald-400" />
                                        <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-400">Sin rezagos críticos</p>
                                    </div>
                                )}

                                {pendingPasses.length > 0 && (
                                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/5 flex items-center justify-between px-2 sm:px-4">
                                        <span className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-widest">Total en circulación</span>
                                        <Badge variant="outline" className="border-white/10 text-white font-black text-[10px] sm:text-xs px-2 sm:px-3">
                                            {pendingPasses.length} pases
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Actividad en Vivo (Compacto) */}
                    <Card className="border-none shadow-zentry-lg dark:shadow-none bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] overflow-hidden dark:ring-1 dark:ring-white/5">
                        <CardHeader className="p-6 sm:p-8 pb-4">
                            <CardTitle className="text-base sm:text-lg font-black dark:text-white">Actividad Reciente</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 sm:px-6 pb-6 space-y-2">
                            {loadingStats ? (
                                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 sm:h-16 w-full rounded-2xl dark:bg-white/5" />)
                            ) : recentActivities.slice(0, 4).map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl hover:bg-white dark:hover:bg-white/5 transition-all border border-transparent hover:border-slate-100 dark:hover:border-white/5 group cursor-pointer"
                                >
                                    <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 ${activity.status === 'active' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500'
                                        }`}>
                                        <Car size={windowWidth < 640 ? 18 : 20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-slate-100 truncate">{activity.title}</p>
                                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate">{activity.subtitle}</p>
                                    </div>
                                    <span className="text-[8px] sm:text-[9px] font-black text-primary uppercase shrink-0">{formatTimeAgo(activity.time)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Subcomponentes
function StatCard({ label, value, icon, gradient, delay, trend, loading }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
        >
            <Card className="relative border-none shadow-zentry dark:shadow-none bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden group h-full dark:ring-1 dark:ring-white/5">
                <div className={`absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br ${gradient} opacity-[0.03] dark:opacity-[0.08] group-hover:scale-125 transition-transform duration-700`}></div>
                <CardHeader className="p-4 sm:p-6 pb-2 flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">{label}</CardTitle>
                    <div className={`h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all shrink-0 ml-2`}>
                        {React.cloneElement(icon, { className: "h-5 w-5 sm:h-6 sm:w-6 text-white" })}
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                    {loading ? <Skeleton className="h-8 sm:h-12 w-20 sm:w-28 dark:bg-white/5" /> : (
                        <>
                            <div className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white mb-1 sm:mb-2">
                                <CountUp end={typeof value === 'number' ? value : parseInt(value)} duration={2.5} suffix={typeof value === 'string' && value.includes('%') ? '%' : ''} />
                            </div>
                            <div className={`flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full w-fit text-[8px] sm:text-[10px] font-black uppercase ${trend.up ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                {trend.up ? <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 w-3" /> : <ArrowDownRight className="h-2.5 w-2.5 sm:h-3 w-3" />}
                                {trend.val}% <span className="hidden xs:inline">tendencia</span>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}

function MetricBox({ label, value, color }: any) {
    const colors: any = {
        blue: "bg-blue-50/50 text-blue-600 border-blue-100",
        emerald: "bg-emerald-50/50 text-emerald-600 border-emerald-100",
        purple: "bg-purple-50/50 text-purple-600 border-purple-100"
    };
    return (
        <div className={`p-6 rounded-[2rem] border ${colors[color]} hover-lift transition-all flex flex-col items-center`}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-2">{label}</p>
            <p className="text-3xl font-black text-slate-900"><CountUp end={value} duration={2} /></p>
        </div>
    );
}

function HealthBadge({ label, status }: any) {
    const isOk = status === 'operational';
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${isOk ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                <span className="font-bold text-slate-700 text-sm">{label}</span>
            </div>
            <Badge variant="outline" className={`${isOk ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-rose-600 border-rose-200 bg-rose-50'} font-black text-[10px] uppercase`}>
                {isOk ? 'OK' : 'ERR'}
            </Badge>
        </div>
    );
}

function QuickTile({ href, icon, label, color, windowWidth }: any) {
    const colors: any = {
        blue: "from-blue-600 to-sky-400 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
        emerald: "from-emerald-500 to-teal-400 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        purple: "from-purple-600 to-fuchsia-500 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
        amber: "from-amber-500 to-orange-400 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
        red: "from-red-600 to-rose-400 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400",
        slate: "from-slate-600 to-slate-500 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300"
    };
    return (
        <Link href={href} className="w-full">
            <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="h-full p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-100 dark:border-white/5 shadow-zentry dark:shadow-none flex flex-col items-center justify-center gap-3 sm:gap-4 transition-all group"
            >
                <div className={`h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-[1.5rem] bg-gradient-to-br ${colors[color].split(' ')[0]} ${colors[color].split(' ')[1]} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    {React.cloneElement(icon, { size: windowWidth < 640 ? 18 : 20 })}
                </div>
                <span className="font-black text-[10px] sm:text-sm uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-primary transition-colors text-center">{label}</span>
            </motion.div>
        </Link>
    );
}
