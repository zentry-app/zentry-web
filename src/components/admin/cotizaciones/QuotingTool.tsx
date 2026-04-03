'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Plus,
    Trash2,
    Save,
    FileText,
    Package,
    Cpu,
    Wrench,
    CircleDot,
    Eye,
    EyeOff,
    User,
    Building2,
    Mail,
    Phone,
    Layout,
    Hash,
    Sparkles,
    Settings2,
    ShieldCheck,
    DollarSign,
    RefreshCw,
    Download,
    Calendar,
    Briefcase,
    FolderOpen,
    Users
} from 'lucide-react';
import { QuotePreview } from './QuotePreview';
import { QuotesService } from '@/lib/services/quotes-service';
import type {
    QuoteFormData,
    QuoteLineItem,
    QuoteConcept,
    QuoteTerm,
    QuoteClient,
    IVAType,
    ConceptCategory,
    ChargeType,
    QuoteType,
} from '@/types/quotes';
import { DEFAULT_PROPUESTA_VALOR, DEFAULT_CONCEPTS, DEFAULT_TERMS } from '@/types/quotes';
import { useAuth } from '@/contexts/AuthContext';

interface QuotingToolProps {
    existingQuoteId?: string;
    onSaved?: (quoteId: string) => void;
}

const CATEGORY_ICONS: Record<ConceptCategory, React.ReactNode> = {
    licencia: <FileText className="h-4 w-4 text-blue-500" />,
    hardware: <Cpu className="h-4 w-4 text-blue-500" />,
    servicio: <Wrench className="h-4 w-4 text-amber-500" />,
    otro: <CircleDot className="h-4 w-4 text-slate-500" />,
};

const CHARGE_LABELS: Record<ChargeType, string> = {
    mensual: 'Mensual',
    unico: 'Único',
};

export function QuotingTool({ existingQuoteId, onSaved }: QuotingToolProps) {
    const { user } = useAuth();
    const { toast } = useToast();

    // Catálogos
    const [concepts, setConcepts] = useState<QuoteConcept[]>([]);
    const [terms, setTerms] = useState<QuoteTerm[]>([]);
    const [clients, setClients] = useState<QuoteClient[]>([]);
    const [loadingCatalogs, setLoadingCatalogs] = useState(true);

    // Estado del formulario
    const [formData, setFormData] = useState<QuoteFormData>({
        fecha: new Date().toISOString().split('T')[0],
        tipoCotizacion: 'nuevo',
        clienteNombre: '',
        clienteEmpresa: '',
        clienteEmail: '',
        clienteTelefono: '',
        clienteProyecto: '',
        clienteUnidades: 0,
        items: [],
        terminosIds: [],
        terminosPersonalizados: [],
        ivaType: '8',
        propuestaValor: DEFAULT_PROPUESTA_VALOR,
        validezDias: 30,
    });

    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(true);
    const [addConceptDialogOpen, setAddConceptDialogOpen] = useState(false);
    const [clientDialogOpen, setClientDialogOpen] = useState(false);

    // Estado del Wizard
    const [currentStep, setCurrentStep] = useState(1);
    const steps = [
        { id: 1, title: 'Cliente', icon: <User className="h-4 w-4" /> },
        { id: 2, title: 'Presupuesto', icon: <DollarSign className="h-4 w-4" /> },
        { id: 3, title: 'Cláusulas', icon: <ShieldCheck className="h-4 w-4" /> },
        { id: 4, title: 'Revisión', icon: <Eye className="h-4 w-4" /> },
    ];

    // Cargar catálogos
    useEffect(() => {
        const loadCatalogs = async () => {
            try {
                let [loadedConcepts, loadedTerms, loadedClients] = await Promise.all([
                    QuotesService.getAllConcepts(),
                    QuotesService.getAllTerms(),
                    QuotesService.getAllClients(),
                ]);

                if (loadedConcepts.length === 0 || loadedTerms.length === 0) {
                    await QuotesService.seedDefaults(DEFAULT_CONCEPTS, DEFAULT_TERMS);
                    [loadedConcepts, loadedTerms] = await Promise.all([
                        QuotesService.getAllConcepts(),
                        QuotesService.getAllTerms(),
                    ]);
                }

                setConcepts(loadedConcepts);
                setTerms(loadedTerms);
                setClients(loadedClients);

                if (!existingQuoteId) {
                    setFormData((prev) => ({
                        ...prev,
                        terminosIds: loadedTerms.filter((t) => t.activo && t.categoria !== 'clausula').map((t) => t.id),
                    }));
                }
            } catch (error) {
                console.error('Error loading catalogs:', error);
                toast({
                    title: 'Error',
                    description: 'No se pudieron cargar los catálogos',
                    variant: 'destructive',
                });
            } finally {
                setLoadingCatalogs(false);
            }
        };

        loadCatalogs();
    }, [existingQuoteId, toast]);

    // Cargar cotización existente
    useEffect(() => {
        if (!existingQuoteId) return;
        const loadQuote = async () => {
            try {
                const quote = await QuotesService.getQuoteById(existingQuoteId);
                if (quote) {
                    setFormData({
                        fecha: quote.fecha || new Date().toISOString().split('T')[0],
                        tipoCotizacion: quote.tipoCotizacion || 'nuevo',
                        clienteNombre: quote.clienteNombre,
                        clienteEmpresa: quote.clienteEmpresa,
                        clienteEmail: quote.clienteEmail,
                        clienteTelefono: quote.clienteTelefono,
                        clienteProyecto: quote.clienteProyecto,
                        clienteUnidades: quote.clienteUnidades,
                        items: quote.items,
                        terminosIds: quote.terminosIds,
                        terminosPersonalizados: quote.terminosPersonalizados,
                        ivaType: quote.ivaType,
                        propuestaValor: quote.propuestaValor,
                        validezDias: quote.validezDias,
                    });
                }
            } catch (error) {
                console.error('Error loading quote:', error);
            }
        };
        loadQuote();
    }, [existingQuoteId]);

    const updateField = useCallback((field: keyof QuoteFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const addConceptToQuote = useCallback((concept: QuoteConcept) => {
        const newItem: QuoteLineItem = {
            conceptoId: concept.id,
            nombre: concept.nombre,
            descripcion: concept.descripcion,
            categoria: concept.categoria,
            cantidad: 1,
            precioUnitario: concept.precioUnitario,
            tipoCobro: concept.tipoCobro,
            unidad: concept.unidad,
            subtotal: concept.precioUnitario,
        };
        setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
        setAddConceptDialogOpen(false);
        toast({ title: 'Concepto añadido', description: `${concept.nombre} se sumó a la propuesta.` });
    }, [toast]);

    const handleSaveClient = useCallback(async () => {
        if (!formData.clienteEmpresa || !formData.clienteNombre) {
            toast({ title: 'Atención', description: 'Nombre y Empresa son requeridos para un perfil de cliente.', variant: 'destructive' });
            return;
        }
        try {
            const newClient = {
                nombre: formData.clienteNombre,
                empresa: formData.clienteEmpresa,
                email: formData.clienteEmail,
                telefono: formData.clienteTelefono,
            };
            const id = await QuotesService.createClient(newClient);
            setClients(prev => [...prev, { id, ...newClient }]);
            toast({ title: 'Éxito', description: 'Cliente guardado en el directorio.' });
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo guardar el cliente.', variant: 'destructive' });
        }
    }, [formData, toast]);

    const selectClient = useCallback((client: QuoteClient) => {
        setFormData(prev => ({
            ...prev,
            clienteNombre: client.nombre,
            clienteEmpresa: client.empresa,
            clienteEmail: client.email,
            clienteTelefono: client.telefono,
        }));
        setClientDialogOpen(false);
        toast({ title: 'Cliente cargado', description: `${client.empresa}` });
    }, [toast]);

    const addManualItem = useCallback(() => {
        const newItem: QuoteLineItem = {
            nombre: '',
            descripcion: '',
            categoria: 'otro',
            cantidad: 1,
            precioUnitario: 0,
            tipoCobro: 'unico',
            unidad: 'pieza',
            subtotal: 0,
        };
        setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    }, []);

    const updateItem = useCallback((index: number, field: keyof QuoteLineItem, value: any) => {
        setFormData((prev) => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };
            newItems[index].subtotal = newItems[index].cantidad * newItems[index].precioUnitario;
            return { ...prev, items: newItems };
        });
    }, []);

    const removeItem = useCallback((index: number) => {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    }, []);

    const toggleTerm = useCallback((termId: string) => {
        setFormData((prev) => ({
            ...prev,
            terminosIds: prev.terminosIds.includes(termId)
                ? prev.terminosIds.filter((id) => id !== termId)
                : [...prev.terminosIds, termId],
        }));
    }, []);

    const handleSave = async (estado: 'borrador' | 'enviada' = 'borrador') => {
        if (!user?.uid) return;
        setSaving(true);
        try {
            if (existingQuoteId) {
                await QuotesService.updateQuote(existingQuoteId, { ...formData, estado });
                toast({ title: 'Cotización actualizada', description: 'Los cambios se guardaron correctamente.' });
            } else {
                const newId = await QuotesService.createQuote(formData, user.uid);
                if (estado === 'enviada') {
                    await QuotesService.updateQuote(newId, { estado: 'enviada' });
                }
                toast({ title: 'Cotización creada', description: `Se generó correctamente.` });
                onSaved?.(newId);
                return;
            }
            onSaved?.(existingQuoteId);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: `Error al guardar: ${error.message}`,
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const calcs = useMemo(() => QuotesService.calculateTotals(formData.items, formData.ivaType), [formData.items, formData.ivaType]);

    if (loadingCatalogs) {
        return (
            <div className="h-screen flex items-center justify-center bg-premium">
                <div className="text-center">
                    <RefreshCw className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="font-black text-primary tracking-widest uppercase italic">Cargando Catálogos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col xl:flex-row gap-8 min-h-[calc(100vh-140px)] pb-10">
            {/* === PANEL IZQUIERDO: Formulario === */}
            <div className={`${showPreview ? 'xl:w-3/5' : 'w-full'} space-y-8`}>
                {/* Header con Progreso (Wizard) */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-zentry-sm border border-slate-100 mb-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Nueva Propuesta</h2>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Paso {currentStep} de 4: {steps[currentStep - 1].title}</p>
                        </div>
                        <div className="flex gap-2">
                            {steps.map((step) => (
                                <div
                                    key={step.id}
                                    className={`h-10 w-10 h-10 w-10 flex items-center justify-center rounded-2xl flex items-center justify-center transition-all ${currentStep === step.id ? 'bg-[#0066FF] text-white shadow-xl scale-110' :
                                        currentStep > step.id ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-400'
                                        }`}
                                >
                                    {currentStep > step.id ? <ShieldCheck className="h-5 w-5" /> : step.icon}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentStep / 4) * 100}%` }}
                            className="absolute top-0 left-0 h-full bg-slate-900"
                        />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* PASO 1: CLIENTE Y CONFIGURACIÓN */}
                    {currentStep === 1 && (

                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            {/* Configuracion General */}
                            <Card className="border-none shadow-zentry-lg bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 text-center">
                                    <Badge className="mb-2 bg-slate-900 text-[10px] font-black uppercase tracking-widest">Paso 1: Configuración</Badge>
                                    <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">Datos de la Cotización</CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1 ml-1">Clasificación de Documento</Label>
                                            <Select
                                                value={formData.tipoCotizacion}
                                                onValueChange={(v) => updateField('tipoCotizacion', v as QuoteType)}
                                            >
                                                <SelectTrigger className="h-12 rounded-xl font-bold border-slate-200">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                    <SelectItem value="nuevo">Presupuesto Nuevo Residencial</SelectItem>
                                                    <SelectItem value="mensual">Cuota Mensual (SaaS)</SelectItem>
                                                    <SelectItem value="integracion">Integración / Hardware Extra</SelectItem>
                                                    <SelectItem value="otro">Otro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Fecha de Emisión</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    type="date"
                                                    value={formData.fecha}
                                                    onChange={(e) => updateField('fecha', e.target.value)}
                                                    className="pl-11 h-12 rounded-xl font-bold border-slate-200"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Vigencia de la Oferta (Días)</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={formData.validezDias}
                                                onChange={(e) => updateField('validezDias', parseInt(e.target.value) || 30)}
                                                className="h-12 rounded-xl font-bold border-slate-200 bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Esquema de Impuestos</Label>
                                            <Select
                                                value={formData.ivaType}
                                                onValueChange={(v) => updateField('ivaType', v as IVAType)}
                                            >
                                                <SelectTrigger className="h-12 rounded-xl font-bold border-slate-200 bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                    <SelectItem value="8">8% - IVA Zona Fronteriza Norte</SelectItem>
                                                    <SelectItem value="16">16% - IVA General México</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Info del Cliente */}
                            <Card className="border-none shadow-zentry-lg bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                                    <CardTitle className="text-lg font-black flex items-center gap-2 text-slate-900">
                                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                            <User className="h-4 w-4" />
                                        </div>
                                        INFORMACIÓN DEL CLIENTE
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => setClientDialogOpen(true)} className="rounded-xl font-bold bg-white h-10 px-4">
                                            <FolderOpen className="h-4 w-4 mr-2" /> Directorio
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={handleSaveClient} className="rounded-xl font-bold h-10 px-4 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
                                            <Save className="h-4 w-4 mr-2" /> Guardar Nuevo
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Nombre Completo</Label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    placeholder="Ej: Gerardo Arroyo"
                                                    value={formData.clienteNombre}
                                                    onChange={(e) => updateField('clienteNombre', e.target.value)}
                                                    className="pl-11 h-12 rounded-xl font-bold border-slate-200"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Empresa / Razón Social</Label>
                                            <div className="relative">
                                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    placeholder="Ej: Constructora Zentry"
                                                    value={formData.clienteEmpresa}
                                                    onChange={(e) => updateField('clienteEmpresa', e.target.value)}
                                                    className="pl-11 h-12 rounded-xl font-bold border-slate-200"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Correo Electrónico</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    type="email"
                                                    placeholder="correo@cliente.com"
                                                    value={formData.clienteEmail}
                                                    onChange={(e) => updateField('clienteEmail', e.target.value)}
                                                    className="pl-11 h-12 rounded-xl font-bold border-slate-200"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Teléfono</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    placeholder="+52 ..."
                                                    value={formData.clienteTelefono}
                                                    onChange={(e) => updateField('clienteTelefono', e.target.value)}
                                                    className="pl-11 h-12 rounded-xl font-bold border-slate-200"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Nombre del Proyecto</Label>
                                            <Input
                                                placeholder="Ej: Torre Smart 1"
                                                value={formData.clienteProyecto}
                                                onChange={(e) => updateField('clienteProyecto', e.target.value)}
                                                className="h-12 rounded-xl font-bold border-slate-200"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-black text-[10px] uppercase tracking-widest text-slate-500 ml-1">Número de Unidades</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={formData.clienteUnidades || ''}
                                                onChange={(e) => updateField('clienteUnidades', parseInt(e.target.value) || 0)}
                                                className="h-12 rounded-xl font-bold border-slate-200"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* PASO 2: CONCEPTOS Y PRECIOS */}
                    {currentStep === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            {/* Propuesta de Valor */}
                            {formData.tipoCotizacion !== 'integracion' && (
                                <Card className="border-none shadow-zentry-lg bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                                        <CardTitle className="text-lg font-black flex items-center gap-2 text-slate-900">
                                            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                                                <Sparkles className="h-4 w-4" />
                                            </div>
                                            PROPUESTA DE VALOR
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <textarea
                                            className="w-full border border-slate-200 rounded-2xl p-5 text-sm font-bold text-slate-700 min-h-[100px] bg-slate-50/30 focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all"
                                            value={formData.propuestaValor}
                                            onChange={(e) => updateField('propuestaValor', e.target.value)}
                                            placeholder="Introduce brevemente el valor de tu oferta..."
                                        />
                                    </CardContent>
                                </Card>
                            )}

                            {/* Conceptos / Items */}
                            <Card className="border-none shadow-zentry-lg bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 flex items-center justify-between">
                                    <CardTitle className="text-lg font-black flex items-center gap-2 text-slate-900">
                                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Package className="h-4 w-4" />
                                        </div>
                                        CONCEPTOS
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={addManualItem} className="rounded-xl font-bold bg-white h-10 px-4 border-slate-200">
                                            <Plus className="h-4 w-4 mr-2" /> Manual
                                        </Button>
                                        <Button size="sm" onClick={() => setAddConceptDialogOpen(true)} className="rounded-xl font-black bg-slate-900 text-white h-10 px-5 hover-lift">
                                            <Plus className="h-4 w-4 mr-2" /> Catálogo
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-4">
                                    {formData.items.length === 0 && (
                                        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                                            <Package className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No has agregado conceptos todavía</p>
                                        </div>
                                    )}
                                    <AnimatePresence>
                                        {formData.items.map((item, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="group relative border border-slate-100 rounded-3xl p-5 hover:bg-slate-50/80 transition-all hover:shadow-xl hover:shadow-slate-100/50"
                                            >
                                                <div className="flex items-start justify-between gap-4 mb-3">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center border border-slate-100">
                                                            {CATEGORY_ICONS[item.categoria]}
                                                        </div>
                                                        <Input
                                                            className="font-black text-base border-none bg-transparent shadow-none p-0 focus-visible:ring-0 text-slate-900 h-auto"
                                                            value={item.nombre}
                                                            onChange={(e) => updateItem(idx, 'nombre', e.target.value)}
                                                            placeholder="Concepto..."
                                                        />
                                                    </div>
                                                    <Button size="icon" variant="ghost" className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 rounded-xl transition-all" onClick={() => removeItem(idx)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    <div className="space-y-1">
                                                        <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cant.</Label>
                                                        <Input type="number" min={1} value={item.cantidad} onChange={(e) => updateItem(idx, 'cantidad', parseInt(e.target.value) || 1)} className="h-10 rounded-xl font-bold" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Precio Unit.</Label>
                                                        <Input type="number" min={0} step={0.01} value={item.precioUnitario} onChange={(e) => updateItem(idx, 'precioUnitario', parseFloat(e.target.value) || 0)} className="h-10 rounded-xl font-bold" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Cobro</Label>
                                                        <Select value={item.tipoCobro} onValueChange={(v) => updateItem(idx, 'tipoCobro', v as ChargeType)}>
                                                            <SelectTrigger className="h-10 rounded-xl font-bold">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                                <SelectItem value="mensual">Recurrente</SelectItem>
                                                                <SelectItem value="unico">Pago Único</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Total</Label>
                                                        <div className="h-10 flex items-center px-4 rounded-xl bg-slate-100 font-black text-slate-900 border border-slate-200/50">
                                                            ${(item.cantidad * item.precioUnitario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* PASO 3: TÉRMINOS Y CLÁUSULAS */}
                    {currentStep === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <Card className="border-none shadow-zentry-lg bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-black flex items-center gap-2 text-slate-900">
                                            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                                                <ShieldCheck className="h-4 w-4" />
                                            </div>
                                            TÉRMINOS Y CLÁUSULAS
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="space-y-8">
                                        {/* Incluye y Condiciones (Agrupados) */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                Principales Términos <div className="h-px bg-slate-100 flex-1" />
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {terms.filter(t => t.categoria !== 'clausula').map((term) => (
                                                    <label
                                                        key={term.id}
                                                        className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer group ${formData.terminosIds.includes(term.id) ? 'bg-slate-900 border-slate-900 shadow-lg' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                                    >
                                                        <div className="mt-0.5">
                                                            <input type="checkbox" className="hidden" checked={formData.terminosIds.includes(term.id)} onChange={() => toggleTerm(term.id)} />
                                                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.terminosIds.includes(term.id) ? 'bg-white border-white text-slate-900' : 'border-slate-200 text-transparent'}`}>
                                                                <Plus className="h-3 w-3" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-0.5 min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`font-black text-[12px] uppercase truncate ${formData.terminosIds.includes(term.id) ? 'text-white' : 'text-slate-900'}`}>{term.titulo}</span>
                                                                <Badge variant="outline" className={`text-[7px] h-3 font-black uppercase tracking-widest px-1 ${formData.terminosIds.includes(term.id) ? 'border-white/30 text-white/50' : 'border-slate-200 text-slate-400'}`}>
                                                                    {term.categoria}
                                                                </Badge>
                                                            </div>
                                                            <p className={`text-[10px] font-bold leading-tight line-clamp-1 ${formData.terminosIds.includes(term.id) ? 'text-white/60' : 'text-slate-500'}`}>{term.contenido}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Cláusulas Especiales (Diferenciado) */}
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                Cláusulas Legales Especiales <div className="h-px bg-blue-50 flex-1" />
                                            </h4>
                                            <div className="grid grid-cols-1 gap-3">
                                                {terms.filter(t => t.categoria === 'clausula').map((term) => (
                                                    <label
                                                        key={term.id}
                                                        className={`flex items-start gap-4 p-5 rounded-3xl border transition-all cursor-pointer group ${formData.terminosIds.includes(term.id) ? 'bg-blue-600 border-blue-600 shadow-xl ring-4 ring-blue-50' : 'bg-blue-50/30 border-blue-100 hover:border-blue-300'}`}
                                                    >
                                                        <div className="mt-1">
                                                            <input type="checkbox" className="hidden" checked={formData.terminosIds.includes(term.id)} onChange={() => toggleTerm(term.id)} />
                                                            <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.terminosIds.includes(term.id) ? 'bg-white border-white text-blue-600' : 'border-blue-200 text-transparent'}`}>
                                                                <Plus className="h-4 w-4" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className={`font-black text-sm uppercase tracking-tight block ${formData.terminosIds.includes(term.id) ? 'text-white' : 'text-blue-900'}`}>{term.titulo}</span>
                                                            <p className={`text-[11px] font-bold leading-relaxed ${formData.terminosIds.includes(term.id) ? 'text-blue-100' : 'text-blue-700/60'}`}>{term.contenido}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* PASO 4: REVISIÓN Y GUARDADO */}
                    {currentStep === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8 text-center"
                        >
                            <Card className="border-none shadow-zentry-lg bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden p-12 text-center">
                                <div className="h-20 w-20 rounded-[2rem] bg-[#0066FF] text-white shadow-xl shadow-blue-500/20">
                                    <ShieldCheck className="h-10 w-10" />
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase mb-2">¡Todo Listo!</h3>
                                <p className="text-slate-500 font-bold max-w-sm mx-auto mb-8">Revisa la vista previa a la derecha y procede a guardar o publicar tu cotización oficial.</p>

                                <div className="flex flex-col gap-4 max-w-md mx-auto">
                                    <Button
                                        className="h-16 rounded-2xl flex-1 font-black shadow-zentry-lg bg-[#0066FF] text-white hover:bg-blue-700 shadow-blue-500/30"
                                        onClick={() => handleSave('enviada')}
                                        disabled={saving}
                                    >
                                        <FileText className="mr-3 h-6 w-6" />
                                        {saving ? 'PROCESANDO...' : 'PUBLICAR COTIZACIÓN'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-16 rounded-2xl flex-1 font-black shadow-zentry-lg bg-white border-slate-200 text-slate-900 hover:bg-slate-50 hover-lift transition-all"
                                        onClick={() => handleSave('borrador')}
                                        disabled={saving}
                                    >
                                        <Save className="mr-3 h-6 w-6" />
                                        {saving ? 'PROCESANDO...' : 'GUARDAR COMO BORRADOR'}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navegación del Wizard */}
                <div className="flex justify-between items-center bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 shadow-zentry-sm mt-8">
                    <Button
                        variant="ghost"
                        className="rounded-xl font-bold h-12 px-6"
                        onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                        disabled={currentStep === 1}
                    >
                        Anterior
                    </Button>
                    <div className="flex gap-2">
                        {steps.map((s) => (
                            <div key={s.id} className={`h-2 w-2 rounded-full ${currentStep === s.id ? 'bg-[#0066FF] w-6' : 'bg-slate-200'} transition-all`} />
                        ))}
                    </div>
                    {currentStep < 4 ? (
                        <Button
                            className="bg-[#0066FF] text-white rounded-xl font-black h-12 px-8 hover-lift shadow-lg shadow-blue-500/20"
                            onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                        >
                            Siguiente Paso
                        </Button>
                    ) : (
                        <div className="w-[120px]" /> /* Espaciador */
                    )}
                </div>
            </div>

            {/* === PANEL DERECHO: Vista Previa en Tiempo Real === */}
            <div className={`${showPreview ? 'xl:w-2/5' : 'hidden'} xl:block`}>
                <div className="sticky top-10 space-y-6">
                    {/* Resumen de Costos Premium */}
                    <Card className="border-none shadow-premium-dark bg-slate-900 rounded-[2.5rem] overflow-hidden text-white">
                        <CardContent className="p-8 space-y-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-white/50">Resumen Financiero</h3>
                                <Badge className="bg-[#0066FF] text-white font-black px-4 py-1.5 rounded-full border-none text-[9px] uppercase tracking-widest leading-none shadow-lg shadow-blue-500/20 flex items-center justify-center">IVA {formData.ivaType}%</Badge>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {calcs.totalMensual > 0 && (
                                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-1">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Inversión Mensual</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-3xl font-black text-blue-400 font-mono tracking-tighter">${calcs.totalMensual.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                            <span className="text-xs font-black text-white/30 uppercase">MXN</span>
                                        </div>
                                        <p className="text-[9px] font-bold text-white/20 uppercase">Incluye IVA y Soporte</p>
                                    </div>
                                )}
                                {calcs.totalUnico > 0 && (
                                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-1">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Inversión Inicial</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-3xl font-black text-blue-400 font-mono tracking-tighter leading-none">${calcs.totalUnico.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                            <span className="text-xs font-black text-white/30 uppercase">MXN</span>
                                        </div>
                                        <p className="text-[9px] font-bold text-white/20 uppercase">Hardware e Instalación</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex items-center justify-between text-white/40">
                                <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                    <ShieldCheck className="h-3 w-3" /> Propuesta Protegida
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    {formData.validezDias} días de vigencia
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview Documento */}
                    <div className="flex items-center justify-between mb-2 px-4">
                        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            DOCUMENTO PDF FINAL
                        </h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)} className="h-8 rounded-lg text-slate-400 font-black text-[10px] uppercase">
                            {showPreview ? <EyeOff className="h-3.5 w-3.5 mr-2" /> : <Eye className="h-3.5 w-3.5 mr-2" />}
                            Configuración
                        </Button>
                    </div>

                    <div className="relative rounded-[2.5rem] bg-slate-200/50 p-6 shadow-inner min-h-[500px] overflow-hidden border border-slate-200/50">
                        <QuotePreview
                            formData={formData}
                            terms={terms}
                            previewMode={true}
                            showDownloadButton={true}
                        />
                    </div>
                </div>
            </div>

            {/* Dialog: Catálogo Premium */}
            <Dialog open={addConceptDialogOpen} onOpenChange={setAddConceptDialogOpen}>
                <DialogContent className="max-w-xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="p-8 bg-slate-900 flex items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-white text-2xl font-black">Catálogo Zentry</DialogTitle>
                            <DialogDescription className="text-white/50 font-bold">Selecciona items para tu propuesta comercial.</DialogDescription>
                        </div>
                        <Package className="h-10 w-10 text-white/10" />
                    </div>
                    <div className="p-6 space-y-3 max-h-[500px] overflow-y-auto">
                        <div className="grid grid-cols-1 gap-3">
                            {concepts.filter((c) => c.activo).length === 0 && (
                                <p className="text-center py-10 text-slate-400 font-bold">No hay conceptos en el catálogo.</p>
                            )}
                            {concepts.filter((c) => c.activo).map((concept) => (
                                <button
                                    key={concept.id}
                                    onClick={() => addConceptToQuote(concept)}
                                    className="group w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-4 hover-lift"
                                >
                                    <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                                        {CATEGORY_ICONS[concept.categoria]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-black text-slate-900 truncate uppercase tracking-tight text-sm">{concept.nombre}</span>
                                            <span className="font-black text-slate-900 text-sm whitespace-nowrap ml-2">
                                                ${concept.precioUnitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                <span className="text-[10px] text-slate-400 ml-1">/{concept.unidad}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[11px] font-bold text-slate-500 truncate">{concept.descripcion}</p>
                                            <Badge variant="outline" className="text-[9px] h-4 rounded-md font-black bg-slate-100/50 text-slate-400 border-none uppercase">
                                                {CHARGE_LABELS[concept.tipoCobro]}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                        <Plus className="h-4 w-4" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <Button variant="ghost" onClick={() => setAddConceptDialogOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog: Directorio de Clientes */}
            <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="p-8 bg-blue-600 flex items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-white text-2xl font-black">Directorio de Clientes</DialogTitle>
                            <DialogDescription className="text-blue-100 font-bold">Selecciona un cliente para cargar su información autmáticamente.</DialogDescription>
                        </div>
                        <Users className="h-10 w-10 text-white/20" />
                    </div>
                    <div className="p-6 space-y-3 max-h-[500px] overflow-y-auto bg-slate-50">
                        <div className="grid grid-cols-1 gap-3">
                            {clients.length === 0 ? (
                                <p className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-sm">Directorio vacío</p>
                            ) : (
                                clients.map((client) => (
                                    <button
                                        key={client.id}
                                        onClick={() => selectClient(client)}
                                        className="group w-full text-left p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg transition-all flex items-center justify-between hover-lift"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className="font-black text-slate-900 uppercase tracking-tight text-base">{client.empresa}</span>
                                                <Badge variant="secondary" className="text-[9px] font-black uppercase text-blue-600 bg-blue-50">Cliente</Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                                                <div className="flex items-center gap-1"><User className="h-3 w-3" /> {client.nombre}</div>
                                                <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {client.email}</div>
                                            </div>
                                        </div>
                                        <div className="h-10 w-10 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all">
                                            <Plus className="h-5 w-5" />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                    <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
                        <Button variant="ghost" onClick={() => setClientDialogOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default QuotingTool;

