'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlusCircle,
    Search,
    Eye,
    Trash2,
    FileText,
    Package,
    ScrollText,
    Edit,
    Download,
    TrendingUp,
    FileSpreadsheet,
    RefreshCw,
    X,
    Filter,
    ChevronRight,
    DollarSign,
    CheckCircle,
    Clock,
    Activity,
    FileCheck,
    AlertCircle,
    TrendingDown,
} from 'lucide-react';
import { QuotesService } from '@/lib/services/quotes-service';
import type { Quote, QuoteStatus, QuoteConcept, QuoteTerm, ConceptCategory, ChargeType } from '@/types/quotes';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Link from 'next/link';

const STATUS_STYLES: Record<QuoteStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color?: string }> = {
    borrador: { label: 'Borrador', variant: 'secondary', color: 'text-slate-500 bg-slate-100' },
    enviada: { label: 'Enviada', variant: 'default', color: 'text-blue-500 bg-blue-50' },
    aceptada: { label: 'Aceptada', variant: 'outline', color: 'text-blue-600 bg-blue-50 border-blue-200 shadow-sm shadow-blue-50/50 italic font-black' },
    rechazada: { label: 'Rechazada', variant: 'destructive', color: 'text-rose-500 bg-rose-50' },
    vencida: { label: 'Vencida', variant: 'secondary', color: 'text-amber-500 bg-amber-50' },
};

const CATEGORY_LABELS: Record<ConceptCategory, string> = {
    licencia: 'Licencia',
    hardware: 'Hardware',
    servicio: 'Servicio',
    otro: 'Otro',
};

export default function CotizacionesPage() {
    const [activeTab, setActiveTab] = useState('cotizaciones');
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [concepts, setConcepts] = useState<QuoteConcept[]>([]);
    const [terms, setTerms] = useState<QuoteTerm[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [deleteType, setDeleteType] = useState<'quote' | 'concept' | 'term'>('quote');
    const { toast } = useToast();

    // Concepts dialog
    const [conceptDialogOpen, setConceptDialogOpen] = useState(false);
    const [editingConcept, setEditingConcept] = useState<QuoteConcept | null>(null);
    const [conceptForm, setConceptForm] = useState({
        nombre: '',
        descripcion: '',
        categoria: 'otro' as ConceptCategory,
        precioUnitario: 0,
        tipoCobro: 'unico' as ChargeType,
        unidad: 'pieza',
        activo: true,
    });

    // Terms dialog
    const [termDialogOpen, setTermDialogOpen] = useState(false);
    const [editingTerm, setEditingTerm] = useState<QuoteTerm | null>(null);
    const [termForm, setTermForm] = useState({
        titulo: '',
        contenido: '',
        categoria: 'nota' as QuoteTerm['categoria'],
        activo: true,
        orden: 0,
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [q, c, t] = await Promise.all([
                QuotesService.getAllQuotes(),
                QuotesService.getAllConcepts(),
                QuotesService.getAllTerms(),
            ]);
            setQuotes(q);
            setConcepts(c);
            setTerms(t);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: `Error al cargar datos: ${error.message}`,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = useMemo(() => {
        const active = quotes.filter(q => q.estado === 'enviada' || q.estado === 'aceptada');
        return {
            total: quotes.length,
            enviadas: quotes.filter(q => q.estado === 'enviada').length,
            aceptadas: quotes.filter(q => q.estado === 'aceptada').length,
            montoTotal: active.reduce((acc, q) => acc + (q.totalUnico || 0) + (q.totalMensual || 0) * 12, 0)
        };
    }, [quotes]);

    const formatMXN = (val: number) =>
        `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const filteredQuotes = useMemo(() => {
        return quotes.filter(
            (q) =>
                q.clienteEmpresa.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.clienteNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.folio.includes(searchQuery)
        );
    }, [quotes, searchQuery]);

    // -- Delete handler --
    const handleDelete = async () => {
        try {
            if (deleteType === 'quote') await QuotesService.deleteQuote(selectedItem.id);
            else if (deleteType === 'concept') await QuotesService.deleteConcept(selectedItem.id);
            else if (deleteType === 'term') await QuotesService.deleteTerm(selectedItem.id);
            toast({ title: 'Eliminado', description: 'El elemento se eliminó correctamente.' });
            setDeleteDialogOpen(false);
            fetchData();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    // -- Concept CRUD --
    const openConceptDialog = (concept?: QuoteConcept) => {
        if (concept) {
            setEditingConcept(concept);
            setConceptForm({
                nombre: concept.nombre,
                descripcion: concept.descripcion,
                categoria: concept.categoria,
                precioUnitario: concept.precioUnitario,
                tipoCobro: concept.tipoCobro,
                unidad: concept.unidad,
                activo: concept.activo,
            });
        } else {
            setEditingConcept(null);
            setConceptForm({ nombre: '', descripcion: '', categoria: 'otro', precioUnitario: 0, tipoCobro: 'unico', unidad: 'pieza', activo: true });
        }
        setConceptDialogOpen(true);
    };

    const saveConcept = async () => {
        try {
            if (editingConcept) {
                await QuotesService.updateConcept(editingConcept.id, conceptForm);
            } else {
                await QuotesService.createConcept(conceptForm);
            }
            toast({ title: 'Guardado', description: 'Concepto guardado correctamente.' });
            setConceptDialogOpen(false);
            fetchData();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    // -- Term CRUD --
    const openTermDialog = (term?: QuoteTerm) => {
        if (term) {
            setEditingTerm(term);
            setTermForm({ titulo: term.titulo, contenido: term.contenido, categoria: term.categoria, activo: term.activo, orden: term.orden });
        } else {
            setEditingTerm(null);
            setTermForm({ titulo: '', contenido: '', categoria: 'nota', activo: true, orden: terms.length + 1 });
        }
        setTermDialogOpen(true);
    };

    const saveTerm = async () => {
        try {
            if (editingTerm) {
                await QuotesService.updateTerm(editingTerm.id, termForm);
            } else {
                await QuotesService.createTerm(termForm);
            }
            toast({ title: 'Guardado', description: 'Término guardado correctamente.' });
            setTermDialogOpen(false);
            fetchData();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    if (loading && quotes.length === 0) {
        return (
            <div className="h-screen flex items-center justify-center bg-premium">
                <div className="text-center">
                    <RefreshCw className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="font-black text-primary tracking-widest uppercase italic">Cargando Cotizaciones...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-premium p-4 lg:p-10 space-y-8 pb-20">
            {/* Header Premium */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col xl:flex-row justify-between gap-6 items-start">
                <div className="space-y-4 max-w-2xl">
                    <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1 rounded-full flex gap-2 w-fit items-center shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                        Sistema de Gestión Comercial
                    </Badge>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                        Cotizaciones <span className="text-gradient-zentry">& Propuestas</span>
                    </h1>
                    <p className="text-slate-600 font-bold text-base sm:text-lg max-w-lg">
                        Administración centralizada de ofertas de hardware, licencias y servicios Zentry.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                    <Button variant="outline" className="rounded-2xl h-12 sm:h-14 px-6 font-black shadow-zentry bg-white/60 border-slate-300 text-slate-800 hover:bg-slate-50 transition-all w-full sm:w-auto">
                        <Download className="mr-2 h-5 w-5" /> EXPORTAR REPORTE
                    </Button>
                    <Link href="/dashboard/cotizaciones/nuevo" className="w-full sm:w-auto">
                        <Button
                            className="rounded-2xl h-12 sm:h-14 px-8 font-black shadow-zentry-lg bg-slate-900 text-white hover:bg-slate-800 hover-lift transition-all w-full"
                        >
                            <PlusCircle className="mr-2 h-5 w-5" /> NUEVA COTIZACIÓN
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* Grid de Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <StatTile icon={<FileText />} label="Total Generado" value={stats.total} color="blue" description="Todas las propuestas" />
                <StatTile icon={<Clock />} label="En Seguimiento" value={stats.enviadas} color="purple" description="Por concretar" />
                <StatTile icon={<CheckCircle />} label="Concretadas" value={stats.aceptadas} color="blue" description="Aceptadas por cliente" />
                <StatTile icon={<TrendingUp />} label="Proyección Anual" value={formatMXN(stats.montoTotal)} color="orange" description="Monto total estimado" />
            </div>

            <Card className="border-none shadow-zentry-lg bg-white/80 backdrop-blur-2xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="px-4 sm:px-8 pt-8 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6">
                        <TabsList className="bg-slate-200/50 p-1 rounded-xl sm:rounded-2xl shadow-inner h-auto flex flex-wrap gap-1">
                            <TabsTrigger value="cotizaciones" className="h-10 px-6 rounded-lg sm:rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-700">
                                <FileText className="w-3.5 h-3.5 mr-2" /> Cotizaciones
                            </TabsTrigger>
                            <TabsTrigger value="conceptos" className="h-10 px-6 rounded-lg sm:rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-700">
                                <Package className="w-3.5 h-3.5 mr-2" /> Catálogo
                            </TabsTrigger>
                            <TabsTrigger value="terminos" className="h-10 px-6 rounded-lg sm:rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-700">
                                <ScrollText className="w-3.5 h-3.5 mr-2" /> Legal y Notas
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:min-w-[300px]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Buscar por folio, cliente o empresa..."
                                    className="pl-11 h-11 bg-white border border-slate-200 shadow-sm rounded-xl font-bold focus-visible:ring-primary/20 text-slate-900 w-full"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            {activeTab !== 'cotizaciones' && (
                                <Button
                                    onClick={() => activeTab === 'conceptos' ? openConceptDialog() : openTermDialog()}
                                    className="h-11 rounded-xl font-bold bg-slate-900 text-white px-6 hidden sm:flex shrink-0"
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" /> Agregar
                                </Button>
                            )}
                        </div>
                    </div>

                    <CardContent className="p-0">
                        <AnimatePresence mode="wait">
                            <TabsContent value="cotizaciones" className="m-0 border-none outline-none">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-100/50">
                                            <TableRow className="border-none">
                                                <TableHead className="py-6 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Folio</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Cliente / Empresa</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Proyecto / Unidades</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 text-right">Monto Total</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Estado</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 text-right px-10">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                Array(5).fill(0).map((_, i) => <TableRow key={i}><TableCell colSpan={6} className="p-6"><Skeleton className="h-16 w-full rounded-2xl" /></TableCell></TableRow>)
                                            ) : filteredQuotes.length > 0 ? (
                                                filteredQuotes.map((quote) => (
                                                    <TableRow key={quote.id} className="group border-white/10 hover:bg-slate-50/50 transition-all">
                                                        <TableCell className="py-6 px-10">
                                                            <div className="h-12 w-16 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg ring-1 ring-slate-800">
                                                                <span className="font-mono text-xs font-black">{quote.folio}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                                                    <FileText className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-slate-900 leading-none mb-1">{quote.clienteEmpresa}</p>
                                                                    <p className="text-xs font-bold text-slate-400">{quote.clienteNombre}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-bold text-slate-700 text-sm">{quote.clienteProyecto}</p>
                                                                <Badge variant="outline" className="text-[9px] h-5 rounded-md px-2 font-black border-slate-200 text-slate-500 uppercase">
                                                                    {quote.clienteUnidades} UNIDADES
                                                                </Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="space-y-1">
                                                                <p className="font-black text-slate-900">{formatMXN(quote.totalUnico + quote.totalMensual)}</p>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Iva Incluido</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={`px-4 py-1.5 rounded-full font-black text-[9px] tracking-widest shadow-sm border-none ${STATUS_STYLES[quote.estado]?.color}`}>
                                                                {STATUS_STYLES[quote.estado]?.label.toUpperCase() || quote.estado.toUpperCase()}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right px-10">
                                                            <div className="flex justify-end gap-2">
                                                                <Link href={`/dashboard/cotizaciones/nuevo?id=${quote.id}`}>
                                                                    <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-md transition-all text-slate-600">
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                </Link>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-10 w-10 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all text-slate-400"
                                                                    onClick={() => {
                                                                        setSelectedItem(quote);
                                                                        setDeleteType('quote');
                                                                        setDeleteDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="py-20 text-center">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200">
                                                                <FileSpreadsheet className="h-10 w-10" />
                                                            </div>
                                                            <p className="text-xl font-black text-slate-400">No se encontraron cotizaciones</p>
                                                            <Link href="/dashboard/cotizaciones/nuevo">
                                                                <Button className="rounded-2xl font-black px-8 h-12 bg-slate-900 shadow-xl">Generar tu Primera Cotización</Button>
                                                            </Link>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>

                            <TabsContent value="conceptos" className="m-0 border-none outline-none">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-100/50">
                                            <TableRow className="border-none">
                                                <TableHead className="py-6 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Concepto</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Categoría</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 text-right">Precio Base</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Esquema</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 text-right px-10">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {concepts.map((c) => (
                                                <TableRow key={c.id} className="group border-white/10 hover:bg-slate-50/50 transition-all">
                                                    <TableCell className="py-6 px-10">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                                                <Package className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-900">{c.nombre}</p>
                                                                <p className="text-xs font-bold text-slate-400">{c.descripcion}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="rounded-lg font-black text-[10px] border-slate-200 text-slate-600 bg-white shadow-sm uppercase">
                                                            {CATEGORY_LABELS[c.categoria]}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <p className="font-black text-slate-900">{formatMXN(c.precioUnitario)}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Por {c.unidad}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={`rounded-full px-3 py-1 font-black text-[9px] tracking-widest ${c.tipoCobro === 'mensual' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {c.tipoCobro === 'mensual' ? 'RECURRENTE' : 'PAGO ÚNICO'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right px-10">
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl hover:bg-white text-slate-400 hover:text-slate-600" onClick={() => openConceptDialog(c)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-10 w-10 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                                                                onClick={() => {
                                                                    setSelectedItem(c);
                                                                    setDeleteType('concept');
                                                                    setDeleteDialogOpen(true);
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>

                            <TabsContent value="terminos" className="m-0 border-none outline-none">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                                    {terms.map((t) => (
                                        <Card key={t.id} className="rounded-3xl border-none shadow-zentry-lg bg-white group hover:shadow-2xl transition-all p-6 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <Badge className="bg-slate-900 text-white rounded-lg font-black text-[9px] px-3 py-1 tracking-widest">
                                                    {t.categoria.toUpperCase()} #{t.orden}
                                                </Badge>
                                                <div className="flex gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => openTermDialog(t)}>
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 rounded-lg text-rose-400"
                                                        onClick={() => {
                                                            setSelectedItem(t);
                                                            setDeleteType('term');
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="font-black text-slate-900 text-lg leading-tight">{t.titulo}</h3>
                                                <p className="text-sm text-slate-500 font-bold line-clamp-4 leading-relaxed">{t.contenido}</p>
                                            </div>
                                        </Card>
                                    ))}
                                    <button onClick={() => openTermDialog()} className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-8 gap-4 text-slate-400 hover:border-primary hover:text-primary transition-all group">
                                        <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <PlusCircle className="h-6 w-6" />
                                        </div>
                                        <p className="font-black text-[11px] tracking-[0.2em] uppercase">Nueva Cláusula Legal</p>
                                    </button>
                                </div>
                            </TabsContent>
                        </AnimatePresence>
                    </CardContent>
                </Tabs>
            </Card>

            {/* Modales Compartidos */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="rounded-3xl border-none shadow-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600 font-black">
                            <AlertCircle className="h-5 w-5" /> Confirmar Eliminación
                        </DialogTitle>
                        <DialogDescription className="font-bold pt-2">
                            Estas a punto de eliminar un elemento. Esta acción es irreversible y afectará los registros históricos.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl font-bold border-slate-200">Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete} className="rounded-xl font-black bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200">
                            <Trash2 className="h-4 w-4 mr-2" /> ELIMINAR AHORA
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* === Dialog: Concepto === */}
            <Dialog open={conceptDialogOpen} onOpenChange={setConceptDialogOpen}>
                <DialogContent className="max-w-xl rounded-[2.5rem] border-none shadow-2xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black flex items-center gap-2">
                            <Package className="h-6 w-6 text-primary" />
                            {editingConcept ? 'Editar Concepto' : 'Nuevo Concepto del Catálogo'}
                        </DialogTitle>
                        <DialogDescription className="font-bold text-slate-500">
                            Define un concepto recurrente para optimizar tus cotizaciones.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Nombre Comercial</Label>
                                <Input value={conceptForm.nombre} onChange={(e) => setConceptForm({ ...conceptForm, nombre: e.target.value })} className="rounded-xl font-bold h-12" />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Descripción Detallada</Label>
                                <Input value={conceptForm.descripcion} onChange={(e) => setConceptForm({ ...conceptForm, descripcion: e.target.value })} className="rounded-xl font-bold h-12" />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Categoría</Label>
                                <Select value={conceptForm.categoria} onValueChange={(v) => setConceptForm({ ...conceptForm, categoria: v as ConceptCategory })}>
                                    <SelectTrigger className="rounded-xl font-bold h-12"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                        <SelectItem value="licencia">Licencia Software</SelectItem>
                                        <SelectItem value="hardware">Hardware / IOT</SelectItem>
                                        <SelectItem value="servicio">Servicios / Manto</SelectItem>
                                        <SelectItem value="otro">Misceláneos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Modelo de Facturación</Label>
                                <Select value={conceptForm.tipoCobro} onValueChange={(v) => setConceptForm({ ...conceptForm, tipoCobro: v as ChargeType })}>
                                    <SelectTrigger className="rounded-xl font-bold h-12"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                        <SelectItem value="mensual">Mensual (Recurrente)</SelectItem>
                                        <SelectItem value="unico">Pago Único (One-time)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Precio Unitario (MXN)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input type="number" step={0.01} value={conceptForm.precioUnitario} onChange={(e) => setConceptForm({ ...conceptForm, precioUnitario: parseFloat(e.target.value) || 0 })} className="rounded-xl font-bold h-12 pl-10" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Unidad de Medida</Label>
                                <Input value={conceptForm.unidad} onChange={(e) => setConceptForm({ ...conceptForm, unidad: e.target.value })} placeholder="ej: casa, puerta, licencia" className="rounded-xl font-bold h-12" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="pt-6">
                        <Button variant="ghost" onClick={() => setConceptDialogOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                        <Button onClick={saveConcept} className="rounded-xl h-12 px-8 font-black bg-slate-900 text-white shadow-xl hover-lift">
                            {editingConcept ? 'ACTUALIZAR CONCEPTO' : 'REGISTRAR EN CATÁLOGO'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* === Dialog: Término === */}
            <Dialog open={termDialogOpen} onOpenChange={setTermDialogOpen}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black flex items-center gap-2">
                            <ScrollText className="h-6 w-6 text-primary" />
                            {editingTerm ? 'Editar Término Legal' : 'Nueva Cláusula Legal'}
                        </DialogTitle>
                        <DialogDescription className="font-bold text-slate-500">
                            Estas cláusulas se pueden incluir dinámicamente en cualquier propuesta.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                        <div className="space-y-2">
                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Título de la Cláusula</Label>
                            <Input value={termForm.titulo} onChange={(e) => setTermForm({ ...termForm, titulo: e.target.value })} className="rounded-xl font-bold h-12 text-lg" />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Cuerpo Legal / Contenido</Label>
                            <textarea
                                className="w-full border border-slate-200 rounded-2xl p-5 text-sm min-h-[150px] font-bold text-slate-700 bg-slate-50/50 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder:text-slate-300"
                                value={termForm.contenido}
                                onChange={(e) => setTermForm({ ...termForm, contenido: e.target.value })}
                                placeholder="Escribe aquí los términos detallados..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Categorización</Label>
                                <Select value={termForm.categoria} onValueChange={(v) => setTermForm({ ...termForm, categoria: v as QuoteTerm['categoria'] })}>
                                    <SelectTrigger className="rounded-xl font-bold h-12"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                        <SelectItem value="incluye">Conceptos Incluidos</SelectItem>
                                        <SelectItem value="condicion">Términos y Condiciones</SelectItem>
                                        <SelectItem value="garantia">Detalles de Garantía</SelectItem>
                                        <SelectItem value="nota">Notas Comerciales</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Orden de Visualización</Label>
                                <Input type="number" value={termForm.orden} onChange={(e) => setTermForm({ ...termForm, orden: parseInt(e.target.value) || 0 })} className="rounded-xl font-bold h-12" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="pt-8">
                        <Button variant="ghost" onClick={() => setTermDialogOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                        <Button onClick={saveTerm} className="rounded-xl h-12 px-10 font-black bg-slate-900 text-white shadow-xl hover-lift">
                            {editingTerm ? 'GUARDAR CAMBIOS' : 'PUBLICAR CLÁUSULA'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// UI Premium Components
function StatTile({ icon, label, value, color, description }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100/50",
        blue: "bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100/50",
        purple: "bg-purple-50 text-purple-700 border-purple-200 shadow-purple-100/50",
        orange: "bg-orange-50 text-orange-700 border-orange-200 shadow-orange-100/50"
    };
    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="group">
            <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-2xl rounded-2xl sm:rounded-[2.2rem] p-4 sm:p-6 group-hover:translate-y-[-4px] group-hover:shadow-2xl transition-all duration-300 ring-1 ring-slate-100 min-w-0 h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    {React.cloneElement(icon as React.ReactElement, { className: "h-24 w-24" })}
                </div>
                <div className="flex items-start gap-3 sm:gap-5 relative z-10">
                    <div className={`h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl ${colors[color]} border flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-md`}>
                        {React.cloneElement(icon as React.ReactElement, { className: "h-5 w-5 sm:h-7 sm:w-7" })}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest sm:tracking-[0.2em] truncate">{label}</p>
                        <div className="flex items-baseline gap-1">
                            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
                            <span className={`h-1.5 w-1.5 rounded-full ${color === 'blue' ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                        </div>
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 truncate mt-1">{description}</p>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
