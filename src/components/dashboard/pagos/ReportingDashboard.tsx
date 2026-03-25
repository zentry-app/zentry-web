import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    BarChart3,
    TrendingUp,
    AlertCircle,
    Clock,
    Wallet,
    CheckCircle2,
    History,
    FileText,
    Filter,
    RefreshCw,
    Loader2
} from 'lucide-react';
import { WebERPService, WebReportingDashboard } from '@/lib/services/WebERPService';
import CollectionEfficiencyChart from './CollectionEfficiencyChart';
import AgingDistributionChart from './AgingDistributionChart';
import { toast } from 'sonner';

interface ReportingDashboardProps {
    residencialId: string;
}

const ReportingDashboard: React.FC<ReportingDashboardProps> = ({ residencialId }) => {
    const erpService = useMemo(() => new WebERPService(), []);
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<WebReportingDashboard | null>(null);
    const [periodKey, setPeriodKey] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await erpService.getReportingDashboard(residencialId, periodKey);
            setDashboardData(data);
        } catch (error) {
            console.error('Error loading reporting dashboard:', error);
            toast.error('Error al cargar reporte de tesorería');
        } finally {
            setLoading(false);
        }
    }, [erpService, periodKey, residencialId]);

    useEffect(() => {
        if (residencialId) {
            loadData();
        }
    }, [loadData, residencialId]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(amount / 100);

    if (loading && !dashboardData) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-muted-foreground">Analizando tesorería...</p>
            </div>
        );
    }

    if (!dashboardData) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* HEADER & FILTERS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <BarChart3 className="h-8 w-8 text-blue-600" />
                        Treasury Intelligence
                    </h2>
                    <p className="text-muted-foreground">Análisis de recaudación, morosidad y salud financiera.</p>
                </div>

                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
                    <Filter className="h-4 w-4 ml-2 text-slate-500" />
                    <Select value={periodKey} onValueChange={setPeriodKey}>
                        <SelectTrigger className="w-[180px] bg-white border-none shadow-sm h-9">
                            <SelectValue placeholder="Seleccionar Periodo" />
                        </SelectTrigger>
                        <SelectContent>
                            {[0, 1, 2, 3, 4, 5].map((i) => {
                                const d = new Date();
                                d.setMonth(d.getMonth() - i);
                                const key = d.toISOString().slice(0, 7);
                                const label = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(d);
                                return <SelectItem key={key} value={key}>{label}</SelectItem>;
                            })}
                        </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={loadData} className="h-9 w-9">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* SECTION 1: PERIOD METRICS (Facturado, Validado, Conciliado, Pendiente) */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Periodo</Badge>
                    <h3 className="text-lg font-semibold text-slate-800">Métricas del Periodo ({periodKey})</h3>
                    <div className="h-px flex-1 bg-slate-200 ml-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPIModel
                        title="Facturado (Esperado)"
                        value={formatCurrency(dashboardData.summary.facturadoCents)}
                        description="Total de cargos publicados"
                        icon={<FileText className="h-5 w-5 text-slate-600" />}
                        trend="100% cuotas"
                    />
                    <KPIModel
                        title="Validado (Cobrado)"
                        value={formatCurrency(dashboardData.summary.validadoCents)}
                        description="Pagos aprobados por admin"
                        icon={<CheckCircle2 className="h-5 w-5 text-blue-600" />}
                        secondaryValue={`${((dashboardData.summary.validadoCents / (dashboardData.summary.facturadoCents || 1)) * 100).toFixed(1)}%`}
                    />
                    <KPIModel
                        title="Conciliado (Banco)"
                        value={formatCurrency(dashboardData.summary.conciliadoCents)}
                        description="Confirmado en movimientos"
                        icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
                        secondaryValue={`${((dashboardData.summary.conciliadoCents / (dashboardData.summary.facturadoCents || 1)) * 100).toFixed(1)}%`}
                        highlight
                    />
                    <KPIModel
                        title="Pendiente de Cobro"
                        value={formatCurrency(dashboardData.summary.pendientePeriodoCents)}
                        description="Deuda remanente del mes"
                        icon={<Clock className="h-5 w-5 text-amber-600" />}
                        severity={dashboardData.summary.pendientePeriodoCents > 0 ? "warning" : "success"}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    <Card className="lg:col-span-2 shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-md font-medium">Eficiencia de Cobranza (3-Tier)</CardTitle>
                            <CardDescription>Comparativa entre cargos, validaciones y conciliaciones bancarias.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CollectionEfficiencyChart
                                facturado={dashboardData.summary.facturadoCents}
                                validado={dashboardData.summary.validadoCents}
                                conciliado={dashboardData.summary.conciliadoCents}
                            />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-md font-medium text-slate-800">Validaciones</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col justify-center items-center h-full pb-10">
                            <div className="relative h-40 w-40 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-8 border-slate-100" />
                                <div
                                    className="absolute inset-0 rounded-full border-8 border-blue-600"
                                    style={{ clipPath: `inset(0 ${100 - (dashboardData.validations.pendingValidation > 0 ? 30 : 100)}% 0 0)` }}
                                />
                                <div className="text-center">
                                    <span className="text-4xl font-bold text-slate-900">{dashboardData.validations.pendingValidation}</span>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Pendientes</p>
                                </div>
                            </div>
                            <p className="mt-4 text-sm text-center text-slate-600">
                                Tienes {dashboardData.validations.pendingValidation} depósitos esperando revisión.
                            </p>
                            <Button variant="outline" className="mt-4 w-full" onClick={() => window.location.hash = '#validaciones'}>
                                Revisar Validaciones
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* SECTION 2: PORTFOLIO HEALTH (Snapshot at Cutoff) */}
            <section className="space-y-4 pt-4">
                <div className="flex items-center gap-2 px-1">
                    <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">Corte</Badge>
                    <h3 className="text-lg font-semibold text-slate-800">Salud de Cartera (Snapshot Actual)</h3>
                    <div className="h-px flex-1 bg-slate-200 ml-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPIModel
                        title="Saldo Pendiente Total"
                        value={formatCurrency(dashboardData.snapshot.saldoPendienteTotalCents)}
                        description="Deuda activa consolidada"
                        icon={<Wallet className="h-5 w-5 text-slate-700" />}
                    />
                    <KPIModel
                        title="Saldo Vencido (Mora)"
                        value={formatCurrency(dashboardData.snapshot.saldoVencidoTotalCents)}
                        description="Cuotas con fecha pasada"
                        icon={<AlertCircle className="h-5 w-5 text-red-600" />}
                        severity="danger"
                    />
                    <KPIModel
                        title="Casas con Deuda"
                        value={`${dashboardData.snapshot.housesWithDebt} / ${dashboardData.snapshot.totalActiveHouses}`}
                        description="Total de casas operativas"
                        icon={<History className="h-5 w-5 text-slate-600" />}
                        secondaryValue={`${dashboardData.snapshot.pctCasasConDeuda}%`}
                    />
                    <KPIModel
                        title="Indice de Morosidad"
                        value={`${dashboardData.snapshot.pctCasasMorosas}%`}
                        description="Casas con más de 30 días"
                        icon={<AlertCircle className="h-5 w-5 text-red-600" />}
                        severity={dashboardData.snapshot.pctCasasMorosas > 15 ? "danger" : "warning"}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-md font-medium">Distribución por Antigüedad (Aging)</CardTitle>
                            <CardDescription>Saldo vencido segmentado por días de atraso.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AgingDistributionChart saldoVencido={dashboardData.snapshot.saldoVencidoTotalCents} />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-200 bg-slate-50 border-dashed">
                        <CardHeader>
                            <CardTitle className="text-md font-medium text-slate-500 italic">Próximos lanzamientos</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center p-10 opacity-60">
                            <FileText className="h-12 w-12 text-slate-300 mb-4" />
                            <p className="text-center font-medium text-slate-400">Generador de Reportes PDF/CSV</p>
                            <p className="text-center text-xs text-slate-400 mt-1">ExportCenter estará disponible en la Fase 6.</p>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
};

// UI Helper: KPI Card
interface KPIProps {
    title: string;
    value: string;
    description: string;
    icon: React.ReactNode;
    trend?: string;
    secondaryValue?: string;
    highlight?: boolean;
    severity?: 'normal' | 'warning' | 'danger' | 'success';
}

const KPIModel: React.FC<KPIProps> = ({
    title, value, description, icon, trend, secondaryValue, highlight, severity = 'normal'
}) => {
    const severityColors = {
        normal: 'text-slate-900',
        warning: 'text-amber-700',
        danger: 'text-red-700',
        success: 'text-emerald-700'
    };

    return (
        <Card className={`shadow-sm border-slate-200 overflow-hidden ${highlight ? 'bg-blue-50/50 border-blue-100 ring-1 ring-blue-600/10' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</CardTitle>
                <div className="p-1.5 bg-slate-50 rounded-md border border-slate-100">
                    {icon}
                </div>
            </CardHeader>
            <CardContent className="pb-4">
                <div className="flex items-baseline gap-2">
                    <div className={`text-2xl font-bold tracking-tight ${severityColors[severity]}`}>{value}</div>
                    {secondaryValue && (
                        <Badge variant="secondary" className="text-[10px] font-bold px-1.5 bg-slate-100 text-slate-600">
                            {secondaryValue}
                        </Badge>
                    )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                    {description}
                    {trend && <span className="text-blue-600 font-medium ml-1">· {trend}</span>}
                </p>
            </CardContent>
        </Card>
    );
};

export default ReportingDashboard;
