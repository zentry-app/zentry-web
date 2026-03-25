'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Plus, Trash2, Save, FileText, User, Building2, Mail,
    Phone, DollarSign, CreditCard, Calendar, Package, Eye, EyeOff,
    Hash, RefreshCw, FileCheck, ReceiptText,
} from 'lucide-react';
import { SaleNotePreview } from './SaleNotePreview';
import { SaleNotesService } from '@/lib/services/sales-notes-service';
import type { SaleNote, SaleNoteFormData, SaleLineItem, SaleIVAType, PaymentMethod, SaleItemCategory } from '@/types/sales-notes';
import { useAuth } from '@/contexts/AuthContext';

interface SaleNoteFormProps {
    onSaved?: (id: string) => void;
    initialData?: SaleNote | null;
}

const CATEGORY_ICONS: Record<SaleItemCategory, React.ReactNode> = {
    licencia: <FileText className="h-4 w-4 text-blue-500" />,
    hardware: <Package className="h-4 w-4 text-blue-500" />,
    servicio: <FileCheck className="h-4 w-4 text-amber-500" />,
    instalacion: <RefreshCw className="h-4 w-4 text-purple-500" />,
    otro: <Hash className="h-4 w-4 text-slate-500" />,
};

const PAYMENT_ICONS: Record<PaymentMethod, React.ReactNode> = {
    efectivo: <DollarSign className="h-4 w-4" />,
    transferencia: <CreditCard className="h-4 w-4" />,
    tarjeta: <CreditCard className="h-4 w-4" />,
    cheque: <FileText className="h-4 w-4" />,
    otro: <Hash className="h-4 w-4" />,
};

import { useEffect } from 'react';

export function SaleNoteForm({ onSaved, initialData }: SaleNoteFormProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [showPreview, setShowPreview] = useState(true);
    const [folio, setFolio] = useState('#NV-XXXX');

    const [formData, setFormData] = useState<SaleNoteFormData>({
        fecha: new Date().toISOString().split('T')[0],
        clienteNombre: '',
        clienteEmpresa: '',
        clienteEmail: '',
        clienteTelefono: '',
        clienteRFC: '',
        concepto: '',
        items: [],
        ivaType: '8',
        metodoPago: 'transferencia',
        referenciaPago: '',
        notas: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                fecha: initialData.fecha,
                clienteNombre: initialData.clienteNombre,
                clienteEmpresa: initialData.clienteEmpresa,
                clienteEmail: initialData.clienteEmail || '',
                clienteTelefono: initialData.clienteTelefono || '',
                clienteRFC: initialData.clienteRFC || '',
                concepto: initialData.concepto,
                items: initialData.items,
                ivaType: initialData.ivaType,
                metodoPago: initialData.metodoPago,
                referenciaPago: initialData.referenciaPago || '',
                notas: initialData.notas || '',
            });
            setFolio(initialData.folio);
        }
    }, [initialData]);

    const updateField = useCallback(<K extends keyof SaleNoteFormData>(field: K, value: SaleNoteFormData[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const addItem = useCallback(() => {
        const newItem: SaleLineItem = {
            nombre: '',
            descripcion: '',
            categoria: 'otro',
            cantidad: 1,
            precioUnitario: 0,
            subtotal: 0,
        };
        setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    }, []);

    const updateItem = useCallback((index: number, field: keyof SaleLineItem, value: any) => {
        setFormData((prev) => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };
            newItems[index].subtotal = newItems[index].cantidad * newItems[index].precioUnitario;
            return { ...prev, items: newItems };
        });
    }, []);

    const removeItem = useCallback((index: number) => {
        setFormData((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    }, []);

    const totals = useMemo(() => SaleNotesService.calculateTotals(formData.items, formData.ivaType), [formData.items, formData.ivaType]);

    const handleSave = async (estado: 'borrador' | 'emitida') => {
        if (!user?.uid) return;
        if (!formData.clienteNombre && !formData.clienteEmpresa) {
            toast({ title: 'Atención', description: 'Agrega al menos el nombre o empresa del cliente.', variant: 'destructive' });
            return;
        }
        if (formData.items.length === 0) {
            toast({ title: 'Atención', description: 'Agrega al menos un concepto a la nota de venta.', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            if (initialData?.id) {
                // Actualizar existente
                await SaleNotesService.updateSaleNote(initialData.id, {
                    ...formData,
                    subtotal: totals.subtotal,
                    iva: totals.iva,
                    total: totals.total,
                    estado,
                });
                toast({ title: '✅ Nota Actualizada', description: 'Los cambios se guardaron correctamente.' });
                onSaved?.(initialData.id);
            } else {
                // Crear nueva
                const id = await SaleNotesService.createSaleNote(formData, user.uid, estado);
                toast({
                    title: estado === 'emitida' ? '✅ Nota de Venta Emitida' : '💾 Borrador Guardado',
                    description: `Se guardó correctamente.`,
                });
                onSaved?.(id);
            }
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const formatMXN = (val: number) =>
        `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

    return (
        <div className="flex flex-col xl:flex-row gap-8 pb-10">
            {/* ===== PANEL IZQUIERDO ===== */}
            <div className={`${showPreview ? 'xl:w-3/5' : 'w-full'} space-y-6`}>

                {/* Header */}
                <div className="bg-slate-900 border-none rounded-[2rem] p-6 shadow-2xl shadow-slate-900/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                <ReceiptText className="h-7 w-7" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Nota de Venta</h2>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Registro Comercial Zentry · {folio}</p>
                            </div>
                        </div>
                        <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30 font-black text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest">
                            EMISIÓN EXPRESS
                        </Badge>
                    </div>
                </div>

                {/* === Configuración General === */}
                <Card className="border-none shadow-md bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-5">
                        <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" /> Datos Generales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                <Input type="date" value={formData.fecha} onChange={(e) => updateField('fecha', e.target.value)} className="pl-9 h-11 rounded-xl font-bold border-slate-200" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Método de Pago</Label>
                            <Select value={formData.metodoPago} onValueChange={(v) => updateField('metodoPago', v as PaymentMethod)}>
                                <SelectTrigger className="h-11 rounded-xl font-bold border-slate-200"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl">
                                    <SelectItem value="efectivo">💵 Efectivo</SelectItem>
                                    <SelectItem value="transferencia">🏦 Transferencia</SelectItem>
                                    <SelectItem value="tarjeta">💳 Tarjeta</SelectItem>
                                    <SelectItem value="cheque">📄 Cheque</SelectItem>
                                    <SelectItem value="otro">📋 Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">IVA</Label>
                            <Select value={formData.ivaType} onValueChange={(v) => updateField('ivaType', v as SaleIVAType)}>
                                <SelectTrigger className="h-11 rounded-xl font-bold border-slate-200"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl">
                                    <SelectItem value="8">8% — Frontera Norte</SelectItem>
                                    <SelectItem value="16">16% — General</SelectItem>
                                    <SelectItem value="exento">Exento de IVA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* === Cliente === */}
                <Card className="border-none shadow-md bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-5">
                        <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-400" /> Cliente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    <Input placeholder="Nombre completo" value={formData.clienteNombre} onChange={(e) => updateField('clienteNombre', e.target.value)} className="pl-9 h-11 rounded-xl font-bold border-slate-200" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Empresa</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    <Input placeholder="Razón social" value={formData.clienteEmpresa} onChange={(e) => updateField('clienteEmpresa', e.target.value)} className="pl-9 h-11 rounded-xl font-bold border-slate-200" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    <Input type="email" placeholder="correo@empresa.com" value={formData.clienteEmail} onChange={(e) => updateField('clienteEmail', e.target.value)} className="pl-9 h-11 rounded-xl font-bold border-slate-200" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teléfono</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    <Input placeholder="+52..." value={formData.clienteTelefono} onChange={(e) => updateField('clienteTelefono', e.target.value)} className="pl-9 h-11 rounded-xl font-bold border-slate-200" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">RFC (Opcional)</Label>
                                <Input placeholder="RFC del cliente" value={formData.clienteRFC} onChange={(e) => updateField('clienteRFC', e.target.value)} className="h-11 rounded-xl font-bold border-slate-200" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Referencia de Pago</Label>
                                <Input placeholder="Núm. transferencia, etc." value={formData.referenciaPago} onChange={(e) => updateField('referenciaPago', e.target.value)} className="h-11 rounded-xl font-bold border-slate-200" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Concepto General de la Venta</Label>
                            <Input placeholder="Ej: Licencia anual sistema Zentry · Torre Smart 1" value={formData.concepto} onChange={(e) => updateField('concepto', e.target.value)} className="h-11 rounded-xl font-bold border-slate-200" />
                        </div>
                    </CardContent>
                </Card>

                {/* === Items / Conceptos === */}
                <Card className="border-none shadow-xl bg-white/90 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-slate-900 border-b border-white/5 p-6 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Package className="h-4 w-4" /> Conceptos a Facturar
                        </CardTitle>
                        <Button size="sm" onClick={addItem} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black h-10 px-6 shadow-lg shadow-blue-500/20">
                            <Plus className="h-4 w-4 mr-2" /> Agregar Item
                        </Button>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                        {formData.items.length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                                <Package className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                                <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Sin conceptos todavía</p>
                                <p className="text-xs text-slate-300 mt-1">Haz clic en "Agregar" para comenzar</p>
                            </div>
                        )}
                        <AnimatePresence>
                            {formData.items.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="border border-slate-100 rounded-2xl p-4 bg-white hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                            {CATEGORY_ICONS[item.categoria]}
                                        </div>
                                        <Input
                                            className="font-bold text-sm border-none bg-transparent shadow-none p-0 focus-visible:ring-0 text-slate-900 h-auto flex-1"
                                            value={item.nombre}
                                            onChange={(e) => updateItem(idx, 'nombre', e.target.value)}
                                            placeholder="Nombre del concepto..."
                                        />
                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50" onClick={() => removeItem(idx)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-black uppercase text-slate-400">Cant.</Label>
                                            <Input type="number" min={1} value={item.cantidad} onChange={(e) => updateItem(idx, 'cantidad', parseInt(e.target.value) || 1)} className="h-9 rounded-xl font-bold text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-black uppercase text-slate-400">Precio Unit.</Label>
                                            <Input type="number" min={0} step={0.01} value={item.precioUnitario} onChange={(e) => updateItem(idx, 'precioUnitario', parseFloat(e.target.value) || 0)} className="h-9 rounded-xl font-bold text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-black uppercase text-slate-400">Categoría</Label>
                                            <Select value={item.categoria} onValueChange={(v) => updateItem(idx, 'categoria', v as SaleItemCategory)}>
                                                <SelectTrigger className="h-9 rounded-xl font-bold text-sm"><SelectValue /></SelectTrigger>
                                                <SelectContent className="rounded-2xl border-none shadow-xl">
                                                    <SelectItem value="licencia">Licencia</SelectItem>
                                                    <SelectItem value="hardware">Hardware</SelectItem>
                                                    <SelectItem value="servicio">Servicio</SelectItem>
                                                    <SelectItem value="instalacion">Instalación</SelectItem>
                                                    <SelectItem value="otro">Otro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-black uppercase text-slate-400">Total</Label>
                                            <div className="h-9 inline-flex items-center justify-center px-4 rounded-full bg-blue-50 text-blue-700 font-black text-[10px] border border-blue-100 uppercase tracking-widest leading-none">
                                                {formatMXN(item.cantidad * item.precioUnitario)}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Totales rápidos */}
                        {formData.items.length > 0 && (
                            <div className="border-t border-slate-100 pt-4 mt-4 space-y-1">
                                <div className="flex justify-between text-xs font-bold text-slate-500">
                                    <span>Subtotal</span><span>{formatMXN(totals.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-slate-500">
                                    <span>IVA ({formData.ivaType === 'exento' ? 'Exento' : `${formData.ivaType}%`})</span>
                                    <span>{formatMXN(totals.iva)}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg font-black text-[#0066FF] pt-4 border-t border-slate-100 uppercase italic tracking-tighter leading-none">
                                    <span>Total Final:</span>
                                    <span>{formatMXN(totals.total)}</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* === Notas === */}
                <Card className="border-none shadow-md bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-5">
                        <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider">Observaciones (Interno)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <textarea
                            className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 min-h-[80px] bg-slate-50/30 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all resize-none"
                            value={formData.notas}
                            onChange={(e) => updateField('notas', e.target.value)}
                            placeholder="Notas internas sobre esta venta..."
                        />
                    </CardContent>
                </Card>

                {/* === Botones de Acción === */}
                <div className="flex gap-4">
                    <Button
                        variant="ghost"
                        className="flex-1 h-16 rounded-[2rem] font-black bg-slate-100 text-slate-500 hover:bg-slate-200"
                        onClick={() => handleSave('borrador')}
                        disabled={saving}
                    >
                        <Save className="mr-3 h-5 w-5" />
                        Guardar Borrador
                    </Button>
                    <Button
                        className="flex-1 h-16 rounded-[2rem] font-black bg-slate-900 hover:bg-black text-white shadow-xl shadow-slate-900/20"
                        onClick={() => handleSave('emitida')}
                        disabled={saving}
                    >
                        <FileCheck className="mr-3 h-5 w-5 text-blue-500" />
                        {saving ? 'Emitiendo...' : 'Emitir Nota de Venta'}
                    </Button>
                </div>
            </div>

            {/* ===== PANEL DERECHO: Vista Previa ===== */}
            <div className={`${showPreview ? 'xl:w-2/5' : 'hidden'} xl:block`}>
                <div className="sticky top-10 space-y-4">
                    {/* Mini resumen financiero */}
                    <Card className="border-none bg-slate-900 rounded-[2.5rem] overflow-hidden text-white shadow-2xl shadow-slate-900/20">
                        <CardContent className="p-8 space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                <h3 className="font-black text-[10px] uppercase tracking-[0.4em] text-blue-400">Estado Financiero</h3>
                                <Badge className="bg-blue-600 text-white font-black text-[10px] border-none px-3 py-1">IVA {formData.ivaType}%</Badge>
                            </div>
                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-white/40">
                                    <span>Subtotal</span>
                                    <span className="font-mono italic">{formatMXN(totals.subtotal)}</span>
                                </div>
                                <div className="text-5xl font-black font-mono tracking-tighter text-white py-2 italic">
                                    {formatMXN(totals.total)}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-white/50 uppercase tracking-[0.2em] pt-2">
                                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                                    {formData.metodoPago} • MXN
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Toggle vista previa */}
                    <div className="flex items-center justify-between px-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vista previa del documento</p>
                        <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)} className="h-7 text-slate-400 font-bold text-[10px] uppercase">
                            {showPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                            {showPreview ? 'Ocultar' : 'Mostrar'}
                        </Button>
                    </div>

                    {/* Preview del PDF */}
                    <div className="relative rounded-[2rem] bg-slate-100/80 p-5 shadow-inner min-h-[480px] overflow-hidden border border-slate-200/50">
                        <SaleNotePreview
                            formData={formData}
                            folio={folio}
                            previewMode={true}
                            showDownloadButton={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SaleNoteForm;
