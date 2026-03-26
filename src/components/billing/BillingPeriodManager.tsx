import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Plus,
    Calendar,
    ChevronRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    RefreshCcw
} from 'lucide-react';
import { WebERPService, WebBillingPeriod } from '@/lib/services/WebERPService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/formatters';
import BillingPeriodSlideOver from './BillingPeriodSlideOver';

interface BillingPeriodManagerProps {
    residencialId: string;
}

const BillingPeriodManager: React.FC<BillingPeriodManagerProps> = ({ residencialId }) => {
    const [periods, setPeriods] = useState<WebBillingPeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    const [slideOverMode, setSlideOverMode] = useState<'create' | 'preview'>('create');
    const [selectedPeriod, setSelectedPeriod] = useState<WebBillingPeriod | undefined>();

    const erpService = useMemo(() => new WebERPService(), []);

    const loadPeriods = useCallback(async () => {
        try {
            setLoading(true);
            const data = await erpService.getBillingPeriods(residencialId);
            setPeriods(data);
            setError(null);
        } catch (err) {
            setError('Error al cargar los periodos de facturación.');
        } finally {
            setLoading(false);
        }
    }, [erpService, residencialId]);

    useEffect(() => {
        loadPeriods();
    }, [loadPeriods]);

    const handleCreateNew = () => {
        setSlideOverMode('create');
        setSelectedPeriod(undefined);
        setIsSlideOverOpen(true);
    };

    const handleSelectPeriod = (period: WebBillingPeriod) => {
        if (period.status === 'draft') {
            setSlideOverMode('preview');
            setSelectedPeriod(period);
            setIsSlideOverOpen(true);
        }
    };

    if (loading && !periods.length) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-slate-100/60 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        Periodos de Facturación
                    </h3>
                    <p className="text-sm text-muted-foreground">Historial y gestión de ciclos de cobranza mensual.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadPeriods}
                        className="bg-white/70 border-slate-200 hover:bg-slate-50 text-slate-600"
                    >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Refrescar
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleCreateNew}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Periodo
                    </Button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-slate-200 shadow-zentry overflow-hidden">
                <div className="divide-y divide-slate-100">
                    {periods.length === 0 ? (
                        <div className="p-12 text-center space-y-3">
                            <Clock className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-muted-foreground">No hay periodos registrados todavía.</p>
                            <Button variant="link" onClick={handleCreateNew} className="text-blue-500">
                                Crear el primer periodo operativo
                            </Button>
                        </div>
                    ) : (
                        periods.map((period) => (
                            <div
                                key={period.id}
                                onClick={() => handleSelectPeriod(period)}
                                className={`group flex items-center justify-between p-6 transition-all ${period.status === 'draft'
                                        ? 'hover:bg-amber-50 cursor-pointer border-l-4 border-l-amber-400/50'
                                        : 'hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${period.status === 'published' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'
                                        }`}>
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg">{period.name}</h4>
                                        <div className="flex items-center gap-3 mt-1 text-sm">
                                            <span className="text-slate-500">{period.id}</span>
                                            <Badge variant={period.status === 'published' ? 'success' : 'warning'} className="capitalize">
                                                {period.status === 'published' ? (
                                                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Publicado</>
                                                ) : (
                                                    <><Clock className="w-3 h-3 mr-1" /> Borrador</>
                                                )}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
                                            {period.status === 'published' ? 'Recaudado' : 'Proyectado'}
                                        </p>
                                        <p className={`font-bold ${period.status === 'published' ? 'text-emerald-600' : 'text-slate-600'}`}>
                                            {formatCurrency(period.status === 'published' ? period.totalCollectedCents : period.totalExpectedCents)}
                                        </p>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 transition-transform ${period.status === 'draft' ? 'text-amber-500 group-hover:translate-x-1' : 'text-slate-300'
                                        }`} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <BillingPeriodSlideOver
                isOpen={isSlideOverOpen}
                onClose={() => setIsSlideOverOpen(false)}
                onSuccess={loadPeriods}
                residencialId={residencialId}
                mode={slideOverMode}
                period={selectedPeriod}
            />
        </div>
    );
};

export default BillingPeriodManager;
