'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Plus, FileCheck, DollarSign, TrendingUp, Clock,
    CheckCircle2, Search, ChevronRight, ReceiptText,
} from 'lucide-react';
import { SaleNotesService } from '@/lib/services/sales-notes-service';
import { SaleNoteForm } from '@/components/admin/ventas/SaleNoteForm';
import type { SaleNote } from '@/types/sales-notes';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    borrador: { label: 'Borrador', color: 'bg-slate-100 text-slate-500' },
    emitida: { label: 'Emitida', color: 'bg-blue-100 text-blue-600' },
    pagada: { label: 'Pagada', color: 'bg-emerald-100 text-blue-600' },
    cancelada: { label: 'Cancelada', color: 'bg-rose-100 text-rose-500' },
};

const PAYMENT_EMOJI: Record<string, string> = {
    efectivo: '💵', transferencia: '🏦', tarjeta: '💳', cheque: '📄', otro: '📋',
};

export default function NotasVentaPage() {
    const [notes, setNotes] = useState<SaleNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'new'>('list');
    const [search, setSearch] = useState('');
    const [selectedNote, setSelectedNote] = useState<SaleNote | null>(null);

    const loadNotes = async () => {
        setLoading(true);
        try {
            const data = await SaleNotesService.getAllSaleNotes();
            setNotes(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadNotes(); }, []);

    const handleSaved = () => {
        setView('list');
        setSelectedNote(null);
        loadNotes();
    };

    const formatMXN = (val: number) =>
        `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

    const filtered = notes.filter((n) => {
        const q = search.toLowerCase();
        return (
            n.folio.toLowerCase().includes(q) ||
            n.clienteEmpresa.toLowerCase().includes(q) ||
            n.clienteNombre.toLowerCase().includes(q) ||
            n.concepto.toLowerCase().includes(q)
        );
    });

    // Stats
    const totalEmitido = notes.filter((n) => n.estado !== 'cancelada').reduce((acc, n) => acc + n.total, 0);
    const totalPagado = notes.filter((n) => n.estado === 'pagada').reduce((acc, n) => acc + n.total, 0);
    const pendientes = notes.filter((n) => n.estado === 'emitida').length;

    return (
        <div className="p-8 min-h-screen">
            {/* ===== HEADER ===== */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25">
                        <ReceiptText className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                            Notas de Venta
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            Confirmaciones de Venta · {notes.length} registros
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => {
                        setSelectedNote(null);
                        setView(view === 'new' ? 'list' : 'new');
                    }}
                    className={`h-12 px-6 rounded-2xl font-black shadow-lg transition-all ${view === 'new'
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 shadow-none'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30'
                        }`}
                >
                    {view === 'new' ? (
                        <>Ver Lista</>
                    ) : (
                        <><Plus className="h-5 w-5 mr-2" /> Nueva Nota</>
                    )}
                </Button>
            </div>

            <AnimatePresence mode="wait">
                {view === 'new' ? (
                    <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <SaleNoteForm onSaved={handleSaved} initialData={selectedNote} />
                    </motion.div>
                ) : (
                    <motion.div key="list" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

                        {/* ===== KPI CARDS ===== */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                {
                                    icon: <DollarSign className="h-6 w-6 text-blue-500" />,
                                    label: 'Total Emitido',
                                    value: formatMXN(totalEmitido),
                                    sub: `${notes.filter(n => n.estado !== 'cancelada').length} notas`,
                                    accent: 'from-blue-50 to-white border-blue-100',
                                },
                                {
                                    icon: <CheckCircle2 className="h-6 w-6 text-slate-900" />,
                                    label: 'Total Cobrado',
                                    value: formatMXN(totalPagado),
                                    sub: `${notes.filter(n => n.estado === 'pagada').length} notas pagadas`,
                                    accent: 'from-slate-100 to-white border-slate-200',
                                },
                                {
                                    icon: <Clock className="h-6 w-6 text-blue-400" />,
                                    label: 'Por Cobrar',
                                    value: pendientes > 0 ? `${pendientes} notas` : 'Al corriente',
                                    sub: pendientes > 0 ? 'notas emitidas sin confirmar pago' : 'Sin pendientes',
                                    accent: 'from-slate-50 to-white border-blue-50',
                                },
                            ].map((card, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                    <Card className={`border bg-gradient-to-br ${card.accent} rounded-[2rem] shadow-sm`}>
                                        <CardContent className="p-6 flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                                                {card.icon}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                                                <p className="text-xl font-black text-slate-900 tracking-tight">{card.value}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{card.sub}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* ===== BÚSQUEDA ===== */}
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por folio, cliente o concepto..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-6 h-14 rounded-2xl border border-slate-200 bg-white font-bold text-sm placeholder:text-slate-300 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all"
                            />
                        </div>

                        {/* ===== TABLA / LISTA ===== */}
                        <Card className="border-none shadow-md bg-white/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                            {loading ? (
                                <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-sm">
                                    Cargando notas de venta...
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="py-20 text-center">
                                    <ReceiptText className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                    <p className="font-black text-slate-300 uppercase tracking-widest text-sm">
                                        {search ? 'Sin resultados' : 'Sin notas de venta todavía'}
                                    </p>
                                    {!search && (
                                        <Button onClick={() => setView('new')} className="mt-4 bg-blue-600 text-white rounded-2xl font-black h-10 px-6 hover:bg-blue-700">
                                            <Plus className="h-4 w-4 mr-2" /> Crear primera nota
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-[1fr_2fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-slate-100">
                                        {['Folio', 'Cliente', 'Total', 'Estado', ''].map((h) => (
                                            <span key={h} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</span>
                                        ))}
                                    </div>
                                    {filtered.map((note, idx) => {
                                        const status = STATUS_CONFIG[note.estado] || STATUS_CONFIG.borrador;
                                        return (
                                            <motion.div
                                                key={note.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="grid grid-cols-[1fr_2fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-slate-50/80 transition-colors group"
                                            >
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm">{note.folio}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                                        {new Date(note.fecha + 'T12:00:00Z').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{note.clienteEmpresa || note.clienteNombre}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{note.concepto}</p>
                                                </div>
                                                <div>
                                                    <p className="font-black text-blue-600 text-sm italic">{formatMXN(note.total)}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold">
                                                        {PAYMENT_EMOJI[note.metodoPago]} {note.metodoPago}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedNote(note);
                                                        setView('new');
                                                    }}
                                                    className="h-8 w-8 rounded-xl text-slate-300 group-hover:text-slate-600 group-hover:bg-slate-100 transition-all"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
