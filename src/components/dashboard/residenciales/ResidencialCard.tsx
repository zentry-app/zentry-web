"use client";

import React from 'react';
import { motion } from "framer-motion";
import {
    Building,
    MapPin,
    DollarSign,
    CreditCard,
    Users,
    Eye,
    Edit,
    Trash,
    ChevronRight,
    Landmark,
    ShieldCheck,
    ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Residencial } from "@/lib/firebase/firestore";

interface ResidencialCardProps {
    residencial: Residencial;
    onEdit: (residencial: Residencial) => void;
    onDelete: (id: string) => void;
    onViewDetails: (id: string) => void;
}

export const ResidencialCard = ({
    residencial,
    onEdit,
    onDelete,
    onViewDetails
}: ResidencialCardProps) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            whileHover={{ y: -5 }}
        >
            <Card className="overflow-hidden border-none shadow-zentry bg-white/70 backdrop-blur-xl hover:shadow-zentry-lg transition-all duration-300 rounded-[2rem] group h-full flex flex-col">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge className="bg-primary/10 text-primary border-none font-bold">
                        {residencial.residencialID || "------"}
                    </Badge>
                </div>

                <CardHeader className="p-6 pb-2">
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary shrink-0 shadow-inner">
                            <Building className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                                {residencial.nombre}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1 font-bold text-slate-500">
                                <MapPin className="h-3 w-3" />
                                {residencial.ciudad}, {residencial.estado}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6 pt-2 flex-grow space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                            <p className="line-clamp-2">{residencial.direccion}</p>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">CP: {residencial.codigoPostal}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black px-3 py-1 rounded-xl flex gap-1.5 items-center">
                            <DollarSign className="h-3 w-3" />
                            ${typeof residencial.cuotaMantenimiento === 'number' ? residencial.cuotaMantenimiento.toLocaleString() : '0'}
                        </Badge>

                        {residencial.cuentaPago?.banco && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-black px-3 py-1 rounded-xl flex gap-1.5 items-center">
                                <Landmark className="h-3 w-3" />
                                {residencial.cuentaPago.banco}
                            </Badge>
                        )}

                        {residencial.calles && residencial.calles.length > 0 && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100 font-black px-3 py-1 rounded-xl flex gap-1.5 items-center">
                                <ShieldCheck className="h-3 w-3" />
                                {residencial.calles.length} {residencial.calles.length === 1 ? 'Calle' : 'Calles'}
                            </Badge>
                        )}

                        {residencial.maxCodigosQRMorosos && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 font-black px-3 py-1 rounded-xl flex gap-1.5 items-center">
                                <ShieldAlert className="h-3 w-3" />
                                Límite QR: {residencial.maxCodigosQRMorosos}
                            </Badge>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 mt-auto flex justify-between bg-slate-50/50 border-t border-slate-100/50">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary font-black hover:bg-primary/5 rounded-xl px-4"
                        onClick={() => onViewDetails(residencial.id!)}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        DETALLES
                    </Button>

                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl h-9 w-9"
                            onClick={() => onEdit(residencial)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-destructive hover:bg-destructive/5 rounded-xl h-9 w-9"
                            onClick={() => onDelete(residencial.id!)}
                        >
                            <Trash className="h-4 w-4" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    );
};
