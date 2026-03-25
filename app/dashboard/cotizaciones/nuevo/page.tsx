'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { QuotingTool } from '@/components/admin/cotizaciones/QuotingTool';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

function NuevaCotizacionContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const editId = searchParams.get('id');

    return (
        <div className="min-h-screen bg-premium p-4 lg:p-10 space-y-8">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-6"
            >
                <Link href="/dashboard/cotizaciones">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-12 w-12 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all text-slate-400 hover:text-slate-900 border border-slate-100"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div className="space-y-1">
                    <Badge className="bg-primary/10 text-primary border-none font-black px-3 py-0.5 rounded-full flex gap-2 w-fit items-center mb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        Generador de Propuestas
                    </Badge>
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900">
                        {editId ? 'EDICIÓN DE' : 'CREACIÓN DE'} <span className="text-gradient-zentry">PROPUESTA COMERCIAL</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest opacity-60">
                        {editId
                            ? 'Ajustando detalles de la cotización guardada'
                            : 'Personaliza los servicios y hardware para el cliente'}
                    </p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <QuotingTool
                    existingQuoteId={editId || undefined}
                    onSaved={(quoteId) => {
                        router.push('/dashboard/cotizaciones');
                    }}
                />
            </motion.div>
        </div>
    );
}

export default function NuevaCotizacionPage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex items-center justify-center bg-premium">
                <div className="text-center">
                    <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto mb-6 opacity-20" />
                    <p className="font-black text-slate-300 tracking-[0.3em] uppercase italic animate-pulse">Iniciando Generador...</p>
                </div>
            </div>
        }>
            <NuevaCotizacionContent />
        </Suspense>
    );
}
