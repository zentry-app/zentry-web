"use client";

/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { motion } from "framer-motion";
import {
    FileText,
    Image as ImageIcon,
    MessageSquare,
    Trash2,
    Download,
    Eye,
    Calendar,
    ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Comunicado {
    id: string;
    titulo: string;
    descripcion: string;
    tipo: 'texto' | 'imagen' | 'pdf';
    url?: string;
    fecha: any;
    path?: string;
}

interface ComunicadoCardProps {
    comunicado: Comunicado;
    onDelete: (comunicado: Comunicado) => void;
    onDownload: (url: string, titulo: string, tipo: string) => void;
    formatDate: (timestamp: any) => string;
}

export const ComunicadoCard = ({
    comunicado,
    onDelete,
    onDownload,
    formatDate
}: ComunicadoCardProps) => {
    const getIcon = () => {
        switch (comunicado.tipo) {
            case 'pdf': return <FileText className="h-6 w-6 text-red-500" />;
            case 'imagen': return <ImageIcon className="h-6 w-6 text-blue-500" />;
            default: return <MessageSquare className="h-6 w-6 text-emerald-500" />;
        }
    };

    const getBadgeStyles = () => {
        switch (comunicado.tipo) {
            case 'pdf': return "bg-red-50 text-red-700 border-red-100";
            case 'imagen': return "bg-blue-50 text-blue-700 border-blue-100";
            default: return "bg-emerald-50 text-emerald-700 border-emerald-100";
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="overflow-hidden border-none shadow-zentry bg-white/70 backdrop-blur-xl hover:shadow-zentry-lg transition-all duration-300 rounded-[2rem] group flex flex-col h-full">
                <CardHeader className="p-6 pb-3">
                    <div className="flex justify-between items-start gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${comunicado.tipo === 'pdf' ? 'bg-red-50' :
                            comunicado.tipo === 'imagen' ? 'bg-blue-50' : 'bg-emerald-50'
                            }`}>
                            {getIcon()}
                        </div>
                        <Badge variant="outline" className={`${getBadgeStyles()} font-black px-3 py-1 rounded-xl uppercase tracking-widest text-[10px]`}>
                            {comunicado.tipo}
                        </Badge>
                    </div>
                    <div className="mt-4 space-y-1">
                        <CardTitle className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                            {comunicado.titulo}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                            <Calendar className="h-3 w-3" />
                            {formatDate(comunicado.fecha)}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 pt-3 flex-grow">
                    <p className="text-slate-600 font-medium text-sm line-clamp-3 leading-relaxed">
                        {comunicado.descripcion || "Sin descripción proporcionada."}
                    </p>

                    {comunicado.url && comunicado.tipo === 'imagen' && (
                        <div className="mt-4 rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-200">
                            <img
                                src={comunicado.url}
                                alt={comunicado.titulo}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                    )}
                </CardContent>

                <CardFooter className="p-4 pt-0 mt-auto flex justify-between bg-slate-50/50 border-t border-slate-100/50">
                    <div className="flex gap-1 w-full justify-between">
                        <div className="flex gap-1">
                            {comunicado.url && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                        className="text-primary font-black hover:bg-primary/5 rounded-xl px-3"
                                    >
                                        <a href={comunicado.url} target="_blank" rel="noopener noreferrer">
                                            <Eye className="h-4 w-4 mr-2" />
                                            VER
                                        </a>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl h-9 w-9"
                                        onClick={() => onDownload(comunicado.url!, comunicado.titulo, comunicado.tipo)}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-300 hover:text-destructive hover:bg-destructive/5 rounded-xl h-9 w-9 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onDelete(comunicado)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    );
};
