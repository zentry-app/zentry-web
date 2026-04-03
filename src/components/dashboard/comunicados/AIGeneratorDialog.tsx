"use client";

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Sparkles,
    Wand2,
    RefreshCw,
    ArrowRight,
    MessageSquare,
    Zap,
    CheckCircle2,
    Copy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

interface AIGeneratorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    idea: string;
    setIdea: (idea: string) => void;
    textoGenerado: string;
    setTextoGenerado: (texto: string) => void;
    generando: boolean;
    onGenerate: () => Promise<void>;
    onImprove: () => Promise<void>;
    onAdjustTone: (tone: string) => Promise<void>;
    onRegenerate: () => Promise<void>;
    onUseText: () => void;
}

export const AIGeneratorDialog = ({
    open,
    onOpenChange,
    idea,
    setIdea,
    textoGenerado,
    setTextoGenerado,
    generando,
    onGenerate,
    onImprove,
    onAdjustTone,
    onRegenerate,
    onUseText
}: AIGeneratorDialogProps) => {
    const [tone, setTone] = React.useState<string>("");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-[800px] border-none shadow-2xl rounded-2xl sm:rounded-[2.5rem] bg-white p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="bg-slate-900 p-6 sm:p-8 text-white relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-[-50%] right-[-10%] w-[80%] h-[200%] bg-primary/20 blur-[120px] rounded-full rotate-12 pointer-events-none" />

                    <div className="relative z-10 flex items-center gap-4">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                            <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-primary animate-pulse" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight">Zentry AI Assist</DialogTitle>
                            <DialogDescription className="text-slate-400 font-bold text-sm sm:text-base mt-1">
                                Generador de comunicados profesionales con inteligencia artificial.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {!textoGenerado ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <Zap className="h-3.5 w-3.5" />
                                    </div>
                                    <p className="text-sm font-black text-slate-700 uppercase tracking-widest">¿Qué deseas comunicar?</p>
                                </div>
                                <Textarea
                                    value={idea}
                                    onChange={e => setIdea(e.target.value)}
                                    placeholder="Ej: Necesito informar que el mantenimiento de la alberca será el próximo martes de 8am a 4pm..."
                                    className="min-h-[150px] rounded-[1.5rem] bg-slate-50 border-slate-200 focus:ring-primary/20 font-medium p-6 text-lg shadow-inner"
                                    disabled={generando}
                                />
                            </div>

                            <Button
                                onClick={onGenerate}
                                disabled={!idea.trim() || generando}
                                className="w-full h-16 rounded-[1.5rem] bg-slate-900 text-white font-black text-lg hover:bg-slate-800 transition-all hover:shadow-zentry-lg gap-3"
                            >
                                {generando ? (
                                    <RefreshCw className="h-6 w-6 animate-spin" />
                                ) : (
                                    <Wand2 className="h-6 w-6" />
                                )}
                                {generando ? "DISEÑANDO COMUNICADO..." : "GENERAR CON IA"}
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        <p className="text-sm font-black text-slate-700 uppercase tracking-widest">Resultado Generado</p>
                                    </div>
                                    <Badge className="bg-emerald-50 text-emerald-700 border-none font-black px-3 py-1 rounded-xl flex gap-1.5 items-center">
                                        IA OPTIMIZADA
                                    </Badge>
                                </div>

                                <div className="relative group">
                                    <Textarea
                                        value={textoGenerado}
                                        onChange={e => setTextoGenerado(e.target.value)}
                                        className="min-h-[250px] sm:min-h-[300px] rounded-2xl sm:rounded-[2rem] bg-slate-50 border-slate-200 focus:ring-primary/20 font-medium p-4 sm:p-8 text-sm sm:text-base text-slate-800 leading-relaxed shadow-inner scrollbar-premium"
                                        disabled={generando}
                                    />
                                    <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white" onClick={() => {
                                            navigator.clipboard.writeText(textoGenerado);
                                        }}>
                                            <Copy className="h-4 w-4 text-slate-500" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-100/50 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] flex flex-wrap gap-2.5 sm:gap-3 items-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-full mb-1 ml-2">Herramientas de Refinamiento</p>

                                <Button
                                    variant="outline"
                                    className="rounded-xl border-slate-200 bg-white font-black text-xs hover:bg-primary/5 hover:text-primary transition-all gap-2"
                                    onClick={onImprove}
                                    disabled={generando}
                                >
                                    <Wand2 className="h-3.5 w-3.5" /> MEJORAR REDACCIÓN
                                </Button>

                                <div className="flex gap-2 items-center">
                                    <Select value={tone} onValueChange={setTone}>
                                        <SelectTrigger className="w-[140px] rounded-xl border-slate-200 bg-white font-black text-xs h-9">
                                            <SelectValue placeholder="CAMBIAR TONO" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-xl">
                                            <SelectItem value="formal" className="font-bold">Formal</SelectItem>
                                            <SelectItem value="amigable" className="font-bold">Amigable</SelectItem>
                                            <SelectItem value="urgente" className="font-bold">Urgente</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {tone && (
                                        <Button
                                            size="sm"
                                            className="rounded-xl font-black text-xs h-9"
                                            onClick={() => onAdjustTone(tone)}
                                            disabled={generando}
                                        >
                                            APLICAR
                                        </Button>
                                    )}
                                </div>

                                <Button
                                    variant="outline"
                                    className="rounded-xl border-slate-200 bg-white font-black text-xs hover:bg-slate-100 gap-2"
                                    onClick={onRegenerate}
                                    disabled={generando}
                                >
                                    <RefreshCw className="h-3.5 w-3.5" /> REGENERAR
                                </Button>

                                <Button
                                    className="ml-auto rounded-xl bg-primary text-white font-black text-xs h-10 px-6 gap-2 shadow-sm hover:shadow-md transition-all"
                                    onClick={onUseText}
                                    disabled={generando}
                                >
                                    USAR ESTE TEXTO <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {generando && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center">
                        <div className="bg-slate-900 border border-white/10 p-6 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-in fade-in zoom-in duration-300">
                            <div className="relative">
                                <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                                <Sparkles className="h-4 w-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <p className="text-white font-black tracking-widest text-sm uppercase">Zentry AI pensando...</p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
