"use client";

import React from 'react';
import { motion } from "framer-motion";
import {
    BarChart3,
    Users,
    Clock,
    Calendar,
    Eye,
    Trash2,
    TrendingUp,
    AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Survey {
    id: string;
    titulo: string;
    descripcion: string;
    fechaCreacion: string;
    fechaFin: string;
    status: 'pending' | 'concluida';
    totalRespuestas: number;
    preguntas: Array<{
        pregunta: string;
        tipo: string;
        opciones?: string[];
    }>;
}

interface SurveyCardProps {
    survey: Survey;
    onViewResults: (survey: Survey) => void;
    onDelete: (id: string) => void;
    formatDate: (dateString: string) => string;
}

export const SurveyCard = ({
    survey,
    onViewResults,
    onDelete,
    formatDate
}: SurveyCardProps) => {
    const isConcluida = survey.status === 'concluida' || new Date(survey.fechaFin) < new Date();

    // Calculate a fake "percentage" of growth or just use responses
    const participationRate = Math.min(100, (survey.totalRespuestas / 50) * 100); // Assuming 50 is total households for visual feedback

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="overflow-hidden border-none shadow-zentry bg-white/70 backdrop-blur-xl hover:shadow-zentry-lg transition-all duration-300 rounded-[2.5rem] group h-full flex flex-col">
                <CardHeader className="p-8 pb-4">
                    <div className="flex justify-between items-start gap-4 mb-4">
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${isConcluida ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary'
                            }`}>
                            <BarChart3 className="h-7 w-7" />
                        </div>
                        <Badge className={`font-black px-4 py-1.5 rounded-full uppercase tracking-widest text-[10px] shadow-sm border-none ${isConcluida
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-emerald-100 text-emerald-700 animate-pulse'
                            }`}>
                            {isConcluida ? 'CONCLUIDA' : 'ACTIVA'}
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors leading-tight">
                            {survey.titulo}
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-bold line-clamp-2 mt-2">
                            {survey.descripcion}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="px-8 pb-6 flex-grow space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Participación</p>
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                <span className="text-lg font-black text-slate-900">{survey.totalRespuestas}</span>
                            </div>
                        </div>
                        <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vence</p>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-500" />
                                <span className="text-xs font-black text-slate-700 uppercase">{formatDate(survey.fechaFin).split(',')[0]}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex gap-2 items-center">
                                <TrendingUp className="h-3 w-3" /> Nivel de Respuesta
                            </p>
                            <span className="text-[10px] font-black text-primary">{Math.round(participationRate)}%</span>
                        </div>
                        <Progress value={participationRate} className="h-2 rounded-full bg-slate-100" />
                    </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 mt-auto flex justify-between bg-slate-50/50 border-t border-slate-100/50">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary font-black hover:bg-primary/5 rounded-2xl px-6 h-12"
                        onClick={() => onViewResults(survey)}
                    >
                        <Eye className="h-5 w-5 mr-2" />
                        ANALIZAR RESULTADOS
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-300 hover:text-destructive hover:bg-destructive/5 rounded-2xl h-12 w-12 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onDelete(survey.id)}
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
};
