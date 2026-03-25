"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import {
    FileText,
    Send,
    MessageSquare,
    TrendingUp,
    Image as ImageIcon,
    Users
} from "lucide-react";
import { motion } from "framer-motion";

interface ComunicadosStatsProps {
    total: number;
    esteMes: number;
    porTipo: {
        texto: number;
        imagen: number;
        pdf: number;
    };
    isLoading: boolean;
}

export const ComunicadosStats = ({
    total,
    esteMes,
    porTipo,
    isLoading
}: ComunicadosStatsProps) => {
    const stats = [
        {
            label: "TOTAL ENVIADOS",
            value: total,
            icon: <Send className="h-6 w-6" />,
            color: "blue",
            description: "Histórico de comunicados"
        },
        {
            label: "ESTE MES",
            value: esteMes,
            icon: <TrendingUp className="h-6 w-6" />,
            color: "emerald",
            description: "Actividad reciente"
        },
        {
            label: "MULTIMEDIA",
            value: porTipo.imagen + porTipo.pdf,
            icon: <ImageIcon className="h-6 w-6" />,
            color: "purple",
            description: "Imágenes y documentos"
        },
        {
            label: "MENSAJES",
            value: porTipo.texto,
            icon: <MessageSquare className="h-6 w-6" />,
            color: "amber",
            description: "Comunicados de texto"
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-2xl rounded-2xl sm:rounded-[2.2rem] p-4 sm:p-6 group hover:translate-y-[-4px] hover:shadow-2xl transition-all duration-300 ring-1 ring-slate-100 min-w-0">
                        <div className="flex items-start gap-3 sm:gap-5">
                            <div className={`h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm ${stat.color === 'blue' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                    stat.color === 'purple' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                        'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                {React.cloneElement(stat.icon as React.ReactElement, { className: "h-5 w-5 sm:h-7 sm:w-7" })}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                                <p className="text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-widest sm:tracking-[0.2em] truncate">{stat.label}</p>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-xl sm:text-3xl font-black text-slate-900 tracking-tighter leading-none">
                                        {isLoading ? "---" : stat.value}
                                    </p>
                                    <span className={`text-[10px] font-black animate-pulse ${stat.color === 'blue' ? 'text-blue-500' :
                                        stat.color === 'emerald' ? 'text-emerald-500' :
                                            stat.color === 'purple' ? 'text-purple-500' :
                                                'text-amber-500'
                                        }`}>●</span>
                                </div>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 truncate mt-1">{stat.description}</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
};
