"use client";

import React from 'react';
import { Card } from "@/components/ui/card";
import {
    Building,
    MapPin,
    DollarSign,
    CreditCard,
    TrendingUp,
    Landmark
} from "lucide-react";
import { motion } from "framer-motion";

interface ResidencialesStatsProps {
    total: number;
    ciudades: number;
    promedioCuota: number;
    conDatosBancarios: number;
    isLoading: boolean;
}

export const ResidencialesStats = ({
    total,
    ciudades,
    promedioCuota,
    conDatosBancarios,
    isLoading
}: ResidencialesStatsProps) => {
    const stats = [
        {
            label: "TOTAL RECINTOS",
            value: total,
            icon: <Building className="h-6 w-6" />,
            color: "blue",
            description: "Recintos activos registrados"
        },
        {
            label: "COBERTURA CIUDADES",
            value: ciudades,
            icon: <MapPin className="h-6 w-6" />,
            color: "emerald",
            description: "Distribución geográfica"
        },
        {
            label: "CUOTA PROMEDIO",
            value: `$${Math.round(promedioCuota).toLocaleString()}`,
            icon: <DollarSign className="h-6 w-6" />,
            color: "amber",
            description: "Mantenimiento estándar"
        },
        {
            label: "NODOS FINANCIEROS",
            value: conDatosBancarios,
            icon: <Landmark className="h-6 w-6" />,
            color: "purple",
            description: "Cuentas bancarias vinculadas"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-2xl rounded-[2.2rem] p-6 group hover:translate-y-[-4px] hover:shadow-2xl transition-all duration-300 ring-1 ring-slate-100">
                        <div className="flex items-start gap-5">
                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm ${stat.color === 'blue' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                    stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                        stat.color === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                            'bg-purple-50 text-purple-700 border border-purple-100'
                                }`}>
                                {stat.icon}
                            </div>
                            <div className="space-y-0.5 overflow-hidden">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{stat.label}</p>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                                        {isLoading ? "---" : stat.value}
                                    </p>
                                    <span className={`text-[10px] font-black animate-pulse ${stat.color === 'blue' ? 'text-blue-500' :
                                            stat.color === 'emerald' ? 'text-emerald-500' :
                                                stat.color === 'amber' ? 'text-amber-500' :
                                                    'text-purple-500'
                                        }`}>●</span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 truncate mt-1">{stat.description}</p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
};
