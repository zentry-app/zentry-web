"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRequired } from "@/lib/hooks";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from 'next/dynamic';

// UI Components
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Icons
import {
    Search,
    Calendar,
    RefreshCw,
    Download,
    Building,
    Car,
    User,
    MapPin,
    Clock,
    ChevronRight,
    Home,
    ArrowRightLeft,
    X,
    Wifi,
    TrendingUp,
    Filter,
    Hash,
    ChevronDown,
    ShieldCheck,
    UserCheck,
    Zap
} from "lucide-react";

// Firebase & Utils
import { collection, query, orderBy, onSnapshot, limit as fbLimit, getDocs, Timestamp as FirestoreTimestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { formatDistanceToNow, format, parseISO, isWithinInterval, startOfDay, endOfDay, isSameMonth, setMonth, setYear, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

// Types
import { Ingreso } from "@/types/ingresos";

// Dynamic Components
const DetallesIngresoDialogContent = dynamic(() => import('@/components/dashboard/ingresos/DetallesIngresoDialogContent'), {
    loading: () => <div className="p-10 text-center"><RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" /> Cargando auditoría...</div>,
    ssr: false
});

const VistaPorCasa = dynamic(() => import('@/components/dashboard/ingresos/VistaPorCasa'), {
    loading: () => <div className="p-6"><Skeleton className="h-40 w-full rounded-2xl" /></div>,
    ssr: false
});

const IngresosPorCasaDialog = dynamic(() => import('@/components/dashboard/ingresos/IngresosPorCasaDialog'), {
    ssr: false
});

const PaginationControls = dynamic(() => import('@/components/dashboard/ingresos/PaginationControls'), {
    ssr: false
});

const EstadisticasIngresos = dynamic(() => import('@/components/dashboard/ingresos/EstadisticasIngresos'), {
    loading: () => <div className="p-20 text-center"><RefreshCw className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" /><p className="font-black text-slate-400">Generando reporte de analítica...</p></div>,
    ssr: false
});

// Interfaces Locales
interface Residencial {
    id: string;
    nombre: string;
    residencialID: string;
}

export default function IngresosMasterPage() {
    const { isAdmin, isUserLoading } = useAdminRequired();
    const { userClaims } = useAuth();
    const router = useRouter();

    // Data States
    const [ingresos, setIngresos] = useState<Ingreso[]>([]);
    const [residenciales, setResidenciales] = useState<Residencial[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filtering & Pagination
    const [activeView, setActiveView] = useState<'general' | 'casas' | 'analitica'>('general');
    const [searchTerm, setSearchTerm] = useState("");
    const [residencialFilter, setResidencialFilter] = useState("todos");
    const [dateFilter, setDateFilter] = useState("");
    const [monthFilter, setMonthFilter] = useState<string>(format(new Date(), 'yyyy-MM')); // Default to current month
    const [tipoIngresoFilter, setTipoIngresoFilter] = useState("todos");
    const [statusFilter, setStatusFilter] = useState("todos");

    const [pageSize, setPageSize] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);

    // Modals
    const [selectedIngreso, setSelectedIngreso] = useState<Ingreso | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedCasa, setSelectedCasa] = useState<any>(null);
    const [casaDialogOpen, setCasaDialogOpen] = useState(false);

    // Permissions Config
    const isGlobalAdmin = userClaims?.isGlobalAdmin === true;
    const adminResidencialId = userClaims?.managedResidencialId || userClaims?.residencialId;

    // Formatting Helpers
    const convertToDate = (ts: any): Date => {
        if (!ts) return new Date();
        if (ts instanceof FirestoreTimestamp) return ts.toDate();
        if (typeof ts === 'object' && 'seconds' in ts) return new Date(ts.seconds * 1000);
        if (ts instanceof Date) return ts;
        return new Date(ts);
    };

    const formatDateToRelative = useCallback((ts: any) => {
        try {
            return formatDistanceToNow(convertToDate(ts), { addSuffix: true, locale: es });
        } catch (e) { return "Fecha inválida"; }
    }, []);

    const formatDateToFull = useCallback((ts: any) => {
        try {
            return format(convertToDate(ts), "PPPP p", { locale: es });
        } catch (e) { return "Fecha inválida"; }
    }, []);

    // Generate Year-Month options
    const monthOptions = useMemo(() => {
        const options = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            options.push({
                value: format(d, 'yyyy-MM'),
                label: format(d, 'MMMM yyyy', { locale: es })
            });
        }
        return options;
    }, []);

    // 1. Fetch Residenciales
    useEffect(() => {
        const fetchResidenciales = async () => {
            try {
                const snap = await getDocs(collection(db, 'residenciales'));
                const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Residencial));
                setResidenciales(list);

                if (!isGlobalAdmin && adminResidencialId) {
                    const found = list.find(r => r.residencialID === adminResidencialId || r.id === adminResidencialId);
                    if (found) {
                        setResidencialFilter(found.id);
                    }
                }
            } catch (e) { console.error(e); }
        };
        fetchResidenciales();
    }, [isGlobalAdmin, adminResidencialId]);

    // 2. Real-time Subscription with Month-aware Query
    useEffect(() => {
        if (!isAdmin || residenciales.length === 0) return;

        setLoading(true);
        let unsubscribes: (() => void)[] = [];

        const setup = () => {
            let targets: string[] = [];
            if (isGlobalAdmin) {
                targets = residencialFilter === 'todos' ? residenciales.map(r => r.id) : [residencialFilter];
            } else if (adminResidencialId) {
                const myRes = residenciales.find(r => r.residencialID === adminResidencialId || r.id === adminResidencialId);
                targets = myRes ? [myRes.id] : [];
                if (myRes && residencialFilter !== myRes.id) setResidencialFilter(myRes.id);
            }

            if (targets.length === 0) {
                setLoading(false);
                return;
            }

            targets.forEach(resId => {
                if (!resId) return;

                const colRef = collection(db, 'residenciales', resId, 'ingresos');
                let queryConstraints: any[] = [orderBy('timestamp', 'desc')];

                if (monthFilter !== 'todos') {
                    const [year, month] = monthFilter.split('-').map(Number);
                    const startDate = startOfMonth(new Date(year, month - 1));
                    const endDate = endOfMonth(new Date(year, month - 1));
                    queryConstraints.push(where('timestamp', '>=', FirestoreTimestamp.fromDate(startDate)));
                    queryConstraints.push(where('timestamp', '<=', FirestoreTimestamp.fromDate(endDate)));
                } else {
                    queryConstraints.push(fbLimit(10000));
                }

                const q = query(colRef, ...queryConstraints);

                const unsub = onSnapshot(q, (snap) => {
                    const resNombre = residenciales.find(r => r.id === resId)?.nombre || 'Residencial';
                    const nuevos = snap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        _residencialNombre: resNombre,
                        _residencialDocId: resId
                    } as Ingreso));

                    setIngresos(prev => {
                        const others = prev.filter(i => i._residencialDocId !== resId);
                        const result = [...others, ...nuevos].sort((a, b) => {
                            const tA = convertToDate(a.timestamp).getTime();
                            const tB = convertToDate(b.timestamp).getTime();
                            return tB - tA;
                        });
                        return result;
                    });
                    setLoading(false);
                    setRefreshing(false);
                }, (err) => {
                    console.error(`Subscription error for ${resId}:`, err);
                    if (err.message?.includes('index')) {
                        toast.error("Error de base de datos. Se requiere crear un índice.");
                    }
                    setLoading(false);
                });
                unsubscribes.push(unsub);
            });
        };

        setup();
        return () => unsubscribes.forEach(u => u());
    }, [isAdmin, residencialFilter, residenciales, isGlobalAdmin, adminResidencialId, monthFilter]);

    // 3. Advanced Filters Logic
    const filteredIngresos = useMemo(() => {
        return ingresos.filter(ing => {
            const search = searchTerm.toLowerCase();
            const visitorName = (ing.visitData?.name || '').toLowerCase();
            const placa = (ing.vehicleInfo?.placa || '').toLowerCase();
            const domicilio = `${ing.domicilio?.calle || ''} ${ing.domicilio?.houseNumber || ''}`.toLowerCase();
            const codigoAcceso = (ing.codigoAcceso || '').toLowerCase();

            const matchesSearch = !searchTerm ||
                visitorName.includes(search) ||
                placa.includes(search) ||
                domicilio.includes(search) ||
                codigoAcceso.includes(search);

            const matchesTipo = tipoIngresoFilter === 'todos' ||
                (tipoIngresoFilter === 'autorizada' ? (ing.category !== 'temporal' && ing.category !== 'evento') : ing.category === tipoIngresoFilter);

            const matchesStatus = statusFilter === 'todos' || ing.status === statusFilter;

            let matchesMonth = true;
            const ingDate = convertToDate(ing.timestamp);
            if (monthFilter && monthFilter !== 'todos') {
                const [year, month] = monthFilter.split('-').map(Number);
                const targetMonth = month - 1; // JavaScript months are 0-indexed
                matchesMonth = ingDate.getFullYear() === year && ingDate.getMonth() === targetMonth;
            }

            let matchesSpecificDate = true;
            if (dateFilter) {
                const target = parseISO(dateFilter);
                matchesSpecificDate = isWithinInterval(ingDate, { start: startOfDay(target), end: endOfDay(target) });
            }

            return matchesSearch && matchesTipo && matchesStatus && matchesMonth && matchesSpecificDate;
        });
    }, [ingresos, searchTerm, dateFilter, monthFilter, tipoIngresoFilter, statusFilter]);

    // General Stats
    const stats = useMemo(() => ({
        total: filteredIngresos.length,
        activos: filteredIngresos.filter(i => i.status === 'active').length,
        vehiculares: filteredIngresos.filter(i => i.vehicleInfo?.placa).length,
        casasAnalizadas: (new Set(filteredIngresos.map(i => `${i.domicilio?.calle}#${i.domicilio?.houseNumber}`))).size
    }), [filteredIngresos]);

    const clearFilters = () => {
        setSearchTerm("");
        setDateFilter("");
        setMonthFilter(format(new Date(), 'yyyy-MM'));
        setTipoIngresoFilter("todos");
        setStatusFilter("todos");
        if (isGlobalAdmin) setResidencialFilter("todos");
    };

    const paginatedIngresos = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredIngresos.slice(start, start + pageSize);
    }, [filteredIngresos, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredIngresos.length / pageSize);

    // Grouping por Casas
    const casasAgrupadas = useMemo(() => {
        const map = new Map<string, any>();
        filteredIngresos.forEach(ing => {
            const key = `${ing.domicilio?.calle || 'S/D'}#${ing.domicilio?.houseNumber || 'S/N'}`;
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    calle: ing.domicilio?.calle,
                    houseNumber: ing.domicilio?.houseNumber,
                    residencialID: ing.domicilio?.residencialID || ing._residencialDocId,
                    ingresos: [],
                    total: 0,
                    activos: 0,
                    completados: 0,
                    conVehiculo: 0,
                });
            }
            const casa = map.get(key);
            casa.ingresos.push(ing);
            casa.total++;
            if (ing.status === 'active') casa.activos++;
            if (ing.status === 'completed') casa.completados++;
            if (ing.vehicleInfo?.placa) casa.conVehiculo++;
        });
        return Array.from(map.values()).sort((a, b) => b.total - a.total);
    }, [filteredIngresos]);

    if (isUserLoading || !isAdmin) return (
        <div className="h-screen flex items-center justify-center bg-premium">
            <div className="text-center">
                <RefreshCw className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <p className="font-black text-primary tracking-widest uppercase">Zentry Security OS</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-premium p-4 lg:p-10 space-y-8 pb-20">
            {/* Header Premium */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col xl:flex-row justify-between gap-6 items-start">
                <div className="space-y-4 max-w-2xl">
                    <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1 rounded-full flex gap-2 w-fit items-center shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                        Vigilancia en Tiempo Real
                    </Badge>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                        Análisis de <span className="text-gradient-zentry">Accesos</span>
                    </h1>
                    <p className="text-slate-600 font-bold text-base sm:text-lg max-w-lg">Control total de ingresos y auditoría mensual avanzada del recinto.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                    <Button variant="outline" className="rounded-2xl h-12 sm:h-14 px-6 font-black shadow-zentry bg-white/60 border-slate-300 text-slate-800 hover:bg-slate-50 transition-all w-full sm:w-auto">
                        <Download className="mr-2 h-5 w-5" /> REPORTE XLS
                    </Button>
                    <Button
                        onClick={() => setRefreshing(true)}
                        className="rounded-2xl h-12 sm:h-14 px-8 font-black shadow-zentry-lg bg-slate-900 text-white hover:bg-slate-800 hover-lift transition-all w-full sm:w-auto"
                    >
                        <RefreshCw className={`mr-2 h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} /> ACTUALIZAR
                    </Button>
                </div>
            </motion.div>

            {/* Grid de Estadísticas con Filtro Dinámico */}
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1">
                        <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Calendar className="h-3 w-3" /> Periodo de Auditoría
                        </p>
                        <div className="flex items-center gap-4 bg-white/70 backdrop-blur-xl p-2 rounded-2xl shadow-sm border border-slate-200">
                            <Select value={monthFilter} onValueChange={setMonthFilter}>
                                <SelectTrigger className="h-10 border-none bg-transparent font-black text-slate-700 min-w-[200px] focus-visible:ring-0">
                                    <SelectValue placeholder="Mes del reporte" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-3xl">
                                    <SelectItem value="todos" className="font-bold">Todo el Historial</SelectItem>
                                    {monthOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value} className="font-bold">{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <StatTile icon={<User />} label={`Ingresos ${monthFilter === 'todos' ? 'Totales' : 'Mes'}`} value={stats.total} color="blue" description="Accesos registrados" />
                    <StatTile icon={<Clock />} label="En Recinto" value={stats.activos} color="green" description="Activos actualmente" />
                    <StatTile icon={<Car />} label="Vehiculares" value={stats.vehiculares} color="purple" description="Con placa auditada" />
                    <StatTile icon={<Home />} label="Cobertura" value={stats.casasAnalizadas} color="orange" description="Casas visitadas" />
                </div>
            </div>

            {/* SMART FILTERS SECTION */}
            <Card className="border-none shadow-zentry-lg bg-white/80 backdrop-blur-2xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden">
                <div className="p-4 sm:p-8 pb-4 border-b border-white/10 space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Filter className="h-5 w-5 text-primary" />
                                <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Filtrado Maestro</h2>
                            </div>

                            {/* Botones de Filtro - UI Refinada con Alto Contraste */}
                            <div className="flex bg-slate-200/50 p-1 rounded-xl sm:rounded-2xl shadow-inner gap-1 overflow-x-auto scrollbar-hide">
                                <FilterButton
                                    active={tipoIngresoFilter === 'todos'}
                                    onClick={() => setTipoIngresoFilter("todos")}
                                    label="Todos"
                                />
                                <FilterButton
                                    active={tipoIngresoFilter === 'temporal'}
                                    onClick={() => setTipoIngresoFilter("temporal")}
                                    label="1 Uso"
                                    icon={<Zap className="h-3 w-3" />}
                                />
                                <FilterButton
                                    active={tipoIngresoFilter === 'autorizada'}
                                    onClick={() => setTipoIngresoFilter("autorizada")}
                                    label="Visita"
                                    icon={<ShieldCheck className="h-3 w-3" />}
                                />
                                <FilterButton
                                    active={tipoIngresoFilter === 'evento'}
                                    onClick={() => setTipoIngresoFilter("evento")}
                                    label="Eventos"
                                    icon={<Calendar className="h-3 w-3" />}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <Tabs value={activeView} onValueChange={v => setActiveView(v as any)} className="bg-slate-200/50 p-1 rounded-xl sm:rounded-2xl shadow-inner w-full sm:w-auto">
                                <TabsList className="bg-transparent border-none gap-1 flex justify-center">
                                    <TabsTrigger value="general" className="flex-1 sm:flex-none h-9 px-4 sm:px-6 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-700">
                                        <ArrowRightLeft className="w-3.5 h-3.5 mr-2 hidden sm:inline" /> Historial
                                    </TabsTrigger>
                                    <TabsTrigger value="casas" className="flex-1 sm:flex-none h-9 px-4 sm:px-6 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-700">
                                        <Home className="w-3.5 h-3.5 mr-2 hidden sm:inline" /> Agrupado
                                    </TabsTrigger>
                                    <TabsTrigger value="analitica" className="flex-1 sm:flex-none h-9 px-4 sm:px-6 rounded-lg sm:rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-700">
                                        <TrendingUp className="w-3.5 h-3.5 mr-2 hidden sm:inline" /> Analítica
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                            {(searchTerm || dateFilter || (isGlobalAdmin && residencialFilter !== 'todos') || statusFilter !== 'todos') && (
                                <Button variant="secondary" onClick={clearFilters} className="rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest h-11 px-6 shadow-sm bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 w-full sm:w-auto">
                                    <X className="h-4 w-4 mr-2" /> Limpiar
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {/* Búsqueda General */}
                        <div className="sm:col-span-2 md:col-span-2 lg:col-span-3 relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                            <Input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Buscar visitante, placa, casa o código QR..."
                                className="pl-12 h-12 sm:h-14 bg-white border border-slate-300 shadow-sm rounded-xl sm:rounded-2xl font-bold focus-visible:ring-primary/20 text-slate-900 placeholder:text-slate-500 w-full"
                            />
                        </div>

                        {/* Filtro de Estado Discreto */}
                        <div className="relative">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-12 sm:h-14 bg-white border border-slate-300 shadow-sm rounded-xl sm:rounded-2xl font-bold px-6 text-slate-900 w-full">
                                    <Wifi className="mr-2 h-4 w-4 text-emerald-500" />
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl sm:rounded-3xl border-none shadow-2xl bg-white/95 backdrop-blur-3xl">
                                    <SelectItem value="todos" className="font-bold">Todos los Estados</SelectItem>
                                    <SelectItem value="active" className="font-bold text-emerald-600">En Recinto</SelectItem>
                                    <SelectItem value="completed" className="font-bold text-blue-600">Finalizado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {isGlobalAdmin ? (
                            <Select value={residencialFilter} onValueChange={setResidencialFilter}>
                                <SelectTrigger className="h-12 sm:h-14 bg-white border border-slate-300 shadow-sm rounded-xl sm:rounded-2xl font-bold px-6 text-slate-900 w-full">
                                    <Building className="mr-2 h-5 w-5 text-primary" />
                                    <SelectValue placeholder="Residencial" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl sm:rounded-3xl border-none shadow-2xl bg-white/95 backdrop-blur-3xl">
                                    <SelectItem value="todos" className="font-bold">Todos los Residenciales</SelectItem>
                                    {residenciales.map(r => (
                                        <SelectItem key={r.id} value={r.id} className="font-bold">{r.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="relative">
                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                                <Input
                                    type="date"
                                    value={dateFilter}
                                    onChange={e => setDateFilter(e.target.value)}
                                    className="pl-12 h-12 sm:h-14 bg-white border border-slate-300 shadow-sm rounded-xl sm:rounded-2xl font-bold focus-visible:ring-primary/20 text-slate-900 w-full"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <CardContent className="p-0">
                    <AnimatePresence mode="wait">
                        {activeView === 'general' ? (
                            <motion.div key="general" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-100/50">
                                            <TableRow className="border-none">
                                                <TableHead className="py-6 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">ID Pase</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Identificación / Tipo</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Vehículo / Placa</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Domicilio</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Llegada</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 text-right px-10">Estado</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                Array(6).fill(0).map((_, i) => <TableRow key={i}><TableCell colSpan={6} className="p-6"><Skeleton className="h-16 w-full rounded-2xl" /></TableCell></TableRow>)
                                            ) : paginatedIngresos.length > 0 ? (
                                                paginatedIngresos.map(ing => (
                                                    <TableRow
                                                        key={ing.id}
                                                        onClick={() => { setSelectedIngreso(ing); setDetailsOpen(true); }}
                                                        className="group border-white/10 hover:bg-slate-50 transition-all cursor-pointer"
                                                    >
                                                        <TableCell className="py-6 px-10">
                                                            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg ring-1 ring-slate-800">
                                                                <span className="font-mono text-xs font-black">
                                                                    {ing.physicalPass?.number ? `#${ing.physicalPass.number}` : "---"}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 shadow-sm border border-blue-100">
                                                                    <User className="h-5 w-5" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-black text-slate-900 truncate max-w-[180px]">{ing.visitData?.name || '---'}</p>
                                                                    <Badge
                                                                        className={`text-[9px] h-5 rounded-md px-2 font-black uppercase tracking-widest border-none shadow-sm ${ing.category === 'temporal' ? 'bg-amber-100 text-amber-700' :
                                                                            ing.category === 'evento' ? 'bg-purple-100 text-purple-700' :
                                                                                'bg-blue-100 text-blue-700'
                                                                            }`}
                                                                    >
                                                                        {ing.category === 'temporal' ? '1 SOLO USO' : ing.category === 'evento' ? 'EVENTO' : 'AUTORIZADA'}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {ing.vehicleInfo?.placa ? (
                                                                <div className="space-y-1">
                                                                    <Badge className="bg-slate-900 text-white font-mono tracking-tighter px-3 py-1 text-sm border-none shadow-lg">
                                                                        {ing.vehicleInfo.placa.toUpperCase()}
                                                                    </Badge>
                                                                    <p className="text-[10px] font-black uppercase text-slate-500">{ing.vehicleInfo.marca} {ing.vehicleInfo.modelo}</p>
                                                                </div>
                                                            ) : <Badge variant="outline" className="border-slate-300 text-slate-600 font-black text-[9px] uppercase tracking-widest bg-slate-50 px-2 py-1">Peatonal</Badge>}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0 border border-emerald-100">
                                                                    <MapPin className="h-4 w-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-sm text-slate-900">{ing.domicilio?.calle} #{ing.domicilio?.houseNumber}</p>
                                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{ing._residencialNombre}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-0.5">
                                                                <p className="text-sm font-black text-slate-900">{formatDateToRelative(ing.timestamp)}</p>
                                                                <p className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase tracking-widest">
                                                                    <Clock className="h-3 w-3" /> {format(convertToDate(ing.timestamp), "hh:mm aa")}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right px-10">
                                                            <div className="flex items-center justify-end gap-3">
                                                                <Badge className={
                                                                    ing.status === 'active' ? 'bg-emerald-600 text-white border-none px-4 py-1.5 rounded-full font-black text-[9px] tracking-widest shadow-md' :
                                                                        ing.status === 'completed' ? 'bg-blue-600 text-white border-none px-4 py-1.5 rounded-full font-black text-[9px] tracking-widest shadow-md' :
                                                                            'bg-slate-200 text-slate-500 border-none px-4 py-1.5 rounded-full font-black text-[9px] tracking-widest'
                                                                }>
                                                                    {ing.status === 'active' ? 'EN RECINTO' : 'FINALIZADO'}
                                                                </Badge>
                                                                <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary transition-all group-hover:translate-x-1" />
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="py-20 text-center">
                                                        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                                                            <Search className="h-16 w-16 text-slate-200" />
                                                            <div className="space-y-1">
                                                                <p className="text-xl font-black text-slate-600">Sin Resultados en {monthFilter === 'todos' ? 'el Historial' : format(parseISO(monthFilter + "-01"), "MMMM", { locale: es })}</p>
                                                                <p className="text-sm text-slate-500 font-bold">Intenta ajustar los filtros de periodo o categoría.</p>
                                                            </div>
                                                            <Button onClick={clearFilters} variant="outline" className="rounded-2xl font-black mt-2 text-slate-700 border-slate-300">Limpiar Todo</Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {!loading && filteredIngresos.length > 0 && (
                                    <div className="border-t border-slate-100 p-6 bg-slate-50/40">
                                        <PaginationControls
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            pageSize={pageSize}
                                            totalResults={filteredIngresos.length}
                                            currentResults={paginatedIngresos.length}
                                            onPageChange={setCurrentPage}
                                            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        ) : activeView === 'casas' ? (
                            <motion.div key="casas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
                                <VistaPorCasa
                                    casas={casasAgrupadas}
                                    onVerDetalles={(casa) => { setSelectedCasa(casa); setCasaDialogOpen(true); }}
                                    getResidencialNombre={(id) => residenciales.find(r => r.id === id)?.nombre || '---'}
                                />
                            </motion.div>
                        ) : (
                            <motion.div key="analitica" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 pb-12">
                                <EstadisticasIngresos
                                    ingresos={filteredIngresos}
                                    monthFilter={monthFilter}
                                    isGlobalAdmin={isGlobalAdmin}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>

            {/* Modales Compartidos */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl bg-white rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden">
                    <DetallesIngresoDialogContent
                        selectedIngreso={selectedIngreso}
                        formatDateToFull={formatDateToFull}
                    />
                </DialogContent>
            </Dialog>

            <IngresosPorCasaDialog
                casa={selectedCasa}
                isOpen={casaDialogOpen}
                onClose={() => setCasaDialogOpen(false)}
                onVerDetalles={(ing) => { setSelectedIngreso(ing); setDetailsOpen(true); }}
                formatDateToRelative={formatDateToRelative}
                formatDateToFull={formatDateToFull}
                getResidencialNombre={(id) => residenciales.find(r => r.id === id)?.nombre || '---'}
            />
        </div>
    );
}

// Sub-componentes Especializados para la UI Premium
function StatTile({ icon, label, value, color, description }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-700 border-blue-200",
        green: "bg-emerald-50 text-emerald-700 border-emerald-200",
        purple: "bg-purple-50 text-purple-700 border-purple-200",
        orange: "bg-orange-50 text-orange-700 border-orange-200"
    };
    return (
        <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-2xl rounded-2xl sm:rounded-[2.2rem] p-4 sm:p-6 group hover:translate-y-[-4px] hover:shadow-2xl transition-all duration-300 ring-1 ring-slate-100 min-w-0">
            <div className="flex items-start gap-3 sm:gap-5">
                <div className={`h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl ${colors[color]} border flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm`}>
                    {React.cloneElement(icon, { className: "h-5 w-5 sm:h-7 sm:w-7" })}
                </div>
                <div className="space-y-0.5 min-w-0">
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest sm:tracking-[0.2em] truncate">{label}</p>
                    <div className="flex items-baseline gap-1">
                        <p className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
                        <span className="text-emerald-500 font-black text-[10px] animate-pulse">●</span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 truncate mt-1">{description}</p>
                </div>
            </div>
        </Card>
    );
}

function FilterButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon?: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${active
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 scale-105'
                : 'text-slate-700 hover:text-slate-950 hover:bg-white/60'
                }`}
        >
            {icon && <span className={active ? 'text-primary-foreground' : 'text-slate-500'}>{icon}</span>}
            {label}
        </button>
    );
}
