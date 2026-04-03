"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { HistoricalDataUpload } from '@/components/dashboard/pagos/HistoricalDataUpload';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function CargaHistoricaPage() {
    const { userClaims } = useAuth();
    const router = useRouter();

    if (!userClaims?.isGlobalAdmin && userClaims?.role !== 'admin') {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex items-center space-x-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            <CardTitle>Acceso Denegado</CardTitle>
                        </div>
                        <CardDescription>
                            No tienes permisos para acceder al módulo de importación.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Este módulo es exclusivo para personal de administración.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const residencialId = userClaims?.residencialId || "default";

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8 flex items-center mb-6">
                <Button variant="ghost" className="mr-4" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Carga Inicial de Saldos</h1>
                    <p className="text-muted-foreground">
                        Importa el historial contable al Ledger inmutable.
                    </p>
                </div>
            </div>

            <HistoricalDataUpload residencialId={residencialId} />
        </div>
    );
}
