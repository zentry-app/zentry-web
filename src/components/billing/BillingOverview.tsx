import React, { useEffect, useMemo, useState } from 'react';
import { WebERPService, WebBillingOverview } from '@/lib/services/WebERPService';
import { formatCurrency } from '@/lib/utils/formatters';
import { TrendingUp, CreditCard, Calendar, AlertCircle } from 'lucide-react';

interface BillingOverviewProps {
    residencialId: string;
}

const BillingOverview: React.FC<BillingOverviewProps> = ({ residencialId }) => {
    const [data, setData] = useState<WebBillingOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const erpService = useMemo(() => new WebERPService(), []);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const result = await erpService.getBillingOverview(residencialId);
                setData(result);
                setError(null);
            } catch (err) {
                console.error('Error loading billing overview:', err);
                setError('Error al cargar el resumen de facturación');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [erpService, residencialId]);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long' }).format(date);
    };

    if (loading) {
        return (
            <div data-testid="billing-overview-loading" className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-slate-800/40 rounded-2xl border border-slate-700/50 block" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-3 p-6 bg-red-900/20 border border-red-800/30 rounded-2xl text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
            </div>
        );
    }

    const kpis = [
        {
            label: 'Recaudación del Mes',
            value: formatCurrency(data?.recaudacionMesCents || 0),
            icon: TrendingUp,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10'
        },
        {
            label: 'Cartera Vencida',
            value: formatCurrency(data?.carteraVencidaCents || 0),
            icon: CreditCard,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10'
        },
        {
            label: 'Próximo Vencimiento',
            value: formatDate(data?.proximoVencimiento || null),
            icon: Calendar,
            color: 'text-sky-400',
            bg: 'bg-sky-500/10'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kpis.map((kpi, idx) => (
                <div key={idx} className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-slate-400 text-sm font-medium mb-1">{kpi.label}</p>
                            <h3 className={`text-2xl font-bold tracking-tight ${kpi.color}`}>
                                {kpi.value}
                            </h3>
                        </div>
                        <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>
                            <kpi.icon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BillingOverview;
