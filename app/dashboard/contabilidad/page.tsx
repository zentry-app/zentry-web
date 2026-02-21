"use client";

import React from 'react';
import AccountingDashboard from '@/components/dashboard/pagos/AccountingDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function ContabilidadPage() {
    const { userClaims } = useAuth();

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
                            No tienes permisos para acceder al módulo de contabilidad.
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

    // TODO: Obtener el residencialId del usuario actual o de la selección
    const residencialId = "default"; // Este valor debe venir del contexto de residencial seleccionado

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Contabilidad</h1>
                <p className="text-muted-foreground">
                    Gestión financiera, ingresos, egresos y reportes mensuales
                </p>
            </div>

            <AccountingDashboard residencialId={residencialId} />
        </div>
    );
}
