import React, { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    AlertTriangle,
    CheckCircle2,
    Calendar,
    Info,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { WebERPService, WebBillingPeriod } from '@/lib/services/WebERPService';
import { formatCurrency } from '@/lib/utils/formatters';

interface BillingPeriodSlideOverProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    residencialId: string;
    mode: 'create' | 'preview';
    period?: WebBillingPeriod;
}

const BillingPeriodSlideOver: React.FC<BillingPeriodSlideOverProps> = ({
    isOpen,
    onClose,
    onSuccess,
    residencialId,
    mode,
    period
}) => {
    const [name, setName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfirmPublish, setShowConfirmPublish] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const erpService = new WebERPService();

    const handleGenerateDraft = async () => {
        if (!name.trim()) return;
        try {
            setIsProcessing(true);
            setError(null);
            // Default periodId to current month if not provided (simplified)
            const periodId = new Date().toISOString().substring(0, 7);
            const res = await erpService.generatePeriodDraft(residencialId, periodId, name);
            if (res.success) {
                onSuccess();
                onClose();
            } else {
                setError('No se pudo generar el borrador.');
            }
        } catch (err: any) {
            console.error('Error generating draft:', err);
            if (err.code === 'already-exists') {
                setError('Este periodo (mes) ya existe. No puedes generar duplicados.');
            } else if (err.code === 'permission-denied') {
                setError('No tienes permisos suficientes.');
            } else {
                setError(err.message || 'Error al generar el borrador.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePublish = async () => {
        if (!period) return;
        try {
            setIsProcessing(true);
            setError(null);
            const res = await erpService.publishPeriod(residencialId, period.id);
            if (res.success) {
                onSuccess();
                onClose();
            } else {
                setError('No se pudo publicar el periodo.');
            }
        } catch (err: any) {
            console.error('Error publishing period:', err);
            setError(err.message || 'Error de conexión al publicar el periodo.');
        } finally {
            setIsProcessing(false);
            setShowConfirmPublish(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-xl bg-slate-950 border-slate-800 text-slate-100">
                <SheetHeader className="mb-8">
                    <SheetTitle className="text-2xl font-bold flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <Calendar className="w-5 h-5" />
                        </div>
                        {mode === 'create' ? 'Configurar Nuevo Periodo' : 'Revisar Borrador'}
                    </SheetTitle>
                    <SheetDescription className="text-slate-400">
                        {mode === 'create'
                            ? 'Define el nombre para la generación automática de cuotas de este mes.'
                            : `Resumen de cargos proyectados para ${period?.name}`}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-8">
                    {mode === 'create' ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="periodName">Nombre del Periodo</Label>
                                <Input
                                    id="periodName"
                                    placeholder="Ej. Cuota Marzo 2026"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-slate-900 border-slate-800 text-white"
                                />
                            </div>
                            <Alert className="bg-blue-500/5 border-blue-500/20 text-blue-400">
                                <Info className="h-4 w-4" />
                                <AlertTitle>Información</AlertTitle>
                                <AlertDescription>
                                    Esta acción creará los registros de HouseFee en estado "borrador". No se realizarán cargos al historial de las casas todavía.
                                </AlertDescription>
                            </Alert>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <Alert className="bg-amber-500/5 border-amber-500/20 text-amber-400">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle className="font-bold">AVISO IMPORTANTE</AlertTitle>
                                <AlertDescription className="font-medium">
                                    BORRADOR: No afecta el ledger hasta publicar. Úselo para validar montos totales antes de que sean oficiales.
                                </AlertDescription>
                            </Alert>

                            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Total Proyectado</span>
                                    <span className="text-xl font-bold text-white">
                                        {formatCurrency(period?.totalExpectedCents || 0)}
                                    </span>
                                </div>
                                <div className="h-px bg-slate-800" />
                                <p className="text-xs text-slate-500 italic">
                                    * Los cargos serán inyectados en el ledger de cada casa con signo positivo (+).
                                </p>
                            </div>

                            {showConfirmPublish ? (
                                <Alert className="bg-rose-500/10 border-rose-500/30 text-rose-100">
                                    <AlertTriangle className="h-5 w-5 text-rose-400" />
                                    <AlertTitle className="text-rose-400 font-bold mb-2">¿Confirmar Publicación?</AlertTitle>
                                    <AlertDescription className="space-y-4">
                                        <p>Esta acción generará cargos reales en el ledger y balances de las casas. No se puede deshacer de forma masiva.</p>
                                        <div className="flex gap-3 pt-2">
                                            <Button
                                                variant="destructive"
                                                onClick={handlePublish}
                                                disabled={isProcessing}
                                                className="w-full font-bold"
                                            >
                                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                Sí, generar cargos reales
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowConfirmPublish(false)}
                                                className="bg-transparent border-slate-700 hover:bg-slate-800"
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Button
                                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-emerald-50 font-bold text-lg rounded-xl flex items-center justify-center gap-2"
                                    onClick={() => setShowConfirmPublish(true)}
                                >
                                    Publicar Periodo
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-900/20 border border-red-800/30 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {mode === 'create' && (
                    <SheetFooter className="mt-8">
                        <Button
                            className="w-full h-12 bg-blue-600 hover:bg-blue-500 font-bold"
                            onClick={handleGenerateDraft}
                            disabled={isProcessing || !name.trim()}
                        >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Generar Borrador
                        </Button>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default BillingPeriodSlideOver;
