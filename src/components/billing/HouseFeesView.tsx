import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    CreditCard,
    AlertCircle,
    CheckCircle2,
    Clock,
    ExternalLink,
    Wrench,
    Zap,
    Scale,
    Loader2
} from 'lucide-react';
import { WebERPService, WebHouseFee } from '@/lib/services/WebERPService';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils/formatters';

interface HouseFeesViewProps {
    residencialId: string;
    houseId: string;
}

const HouseFeesView: React.FC<HouseFeesViewProps> = ({ residencialId, houseId }) => {
    const [fees, setFees] = useState<WebHouseFee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const erpService = useMemo(() => new WebERPService(), []);

    const loadFees = useCallback(async () => {
        try {
            setLoading(true);
            const data = await erpService.getHouseFees(residencialId, houseId);
            setFees(data);
            setError(null);
        } catch (err) {
            setError('Error al cargar el historial de cuotas.');
        } finally {
            setLoading(false);
        }
    }, [erpService, residencialId, houseId]);

    useEffect(() => {
        loadFees();
    }, [loadFees]);

    const getTypeIcon = (type: WebHouseFee['type']) => {
        switch (type) {
            case 'maintenance': return <Wrench className="w-4 h-4" />;
            case 'extraordinary': return <Zap className="w-4 h-4 text-amber-400" />;
            case 'late_penalty': return <Scale className="w-4 h-4 text-rose-400" />;
            default: return <CreditCard className="w-4 h-4" />;
        }
    };

    const getTypeLabel = (type: WebHouseFee['type']) => {
        switch (type) {
            case 'maintenance': return 'Maintenance';
            case 'extraordinary': return 'Extraordinary';
            case 'late_penalty': return 'Late Penalty';
            default: return 'Other';
        }
    };

    const getStatusBadge = (status: WebHouseFee['operationalStatus']) => {
        switch (status) {
            case 'pagada':
                return <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Pagada</Badge>;
            case 'vencida':
                return <Badge variant="destructive" className="bg-rose-500/10 text-rose-400 border-rose-500/20"><AlertCircle className="w-3 h-3 mr-1" /> Vencida</Badge>;
            default:
                return <Badge variant="warning" className="bg-blue-500/10 text-blue-400 border-blue-500/20"><Clock className="w-3 h-3 mr-1" /> Vigente</Badge>;
        }
    };

    if (loading) {
        return (
            <div data-testid="house-fees-loading" className="space-y-4 py-8">
                <div className="flex items-center justify-center gap-3 text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-medium">Cargando historial de cuotas...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <p className="text-rose-400 font-medium">{error}</p>
                <button onClick={loadFees} className="text-blue-400 hover:text-blue-300 underline text-sm">Reintentar</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                    Historial de Cuotas y Cargos
                </h3>
                <span className="text-xs text-slate-500 font-mono">{houseId}</span>
            </div>

            <div className="space-y-3">
                {fees.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                        <p className="text-slate-500">No hay cuotas registradas para esta casa.</p>
                    </div>
                ) : (
                    fees.map((fee) => (
                        <div key={fee.id} className="glass-card p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl bg-slate-900 border border-slate-800 ${fee.type === 'late_penalty' ? 'text-rose-400' : fee.type === 'extraordinary' ? 'text-amber-400' : 'text-blue-400'
                                    }`}>
                                    {getTypeIcon(fee.type)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-white">{fee.description}</h4>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold uppercase tracking-tighter">
                                            {getTypeLabel(fee.type)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Vencimiento: {new Date(fee.dueDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-lg font-bold text-white">{formatCurrency(fee.amountCents)}</p>
                                    <div className="mt-1">
                                        {getStatusBadge(fee.operationalStatus)}
                                    </div>
                                </div>
                                {fee.matchedPaymentIntentId && (
                                    <div className="p-2 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded-lg hover:bg-emerald-500/10 cursor-pointer shadow-sm transition-all" title="Ver Pago Asociado">
                                        <ExternalLink className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HouseFeesView;
