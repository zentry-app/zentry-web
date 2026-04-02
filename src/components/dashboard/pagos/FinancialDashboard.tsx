"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ShoppingBag,
  Truck,
  Zap,
  Users,
  Receipt,
  Percent,
  Scale,
} from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { fmtFull } from "./payments-types";

// ─── Types (mirrors ConsolidatedReportService output) ────────────────────────

interface BreakdownBuckets {
  cuotas: number;
  multas: number;
  productos: number;
  otrosIngresos: number;
  reversiones: number;
  proveedores: number;
  servicios: number;
  otrosGastos: number;
}

interface UnifiedEntry {
  id: string;
  source: string;
  direction: string;
  category: string;
  amountCents: number;
  description: string;
  date: string;
  paymentMethod: string;
  houseId?: string;
  periodKey?: string;
  originalType: string;
}

interface ConsolidatedReport {
  periodLabel: string;
  totalIncomeCents: number;
  totalExpenseCents: number;
  totalReversalsCents: number;
  netIncomeCents: number;
  netCents: number;
  breakdown: BreakdownBuckets;
  openingBalanceCents?: number;
  closingBalanceCents?: number;
  entries: UnifiedEntry[];
}

// ─── Period helpers ──────────────────────────────────────────────────────────

function getPeriodRange(key: string): {
  start: Date;
  end: Date;
  label: string;
} {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (key) {
    case "prev": {
      const s = new Date(y, m - 1, 1);
      const e = new Date(y, m, 0, 23, 59, 59);
      return {
        start: s,
        end: e,
        label: s.toLocaleDateString("es-MX", {
          month: "long",
          year: "numeric",
        }),
      };
    }
    case "3m": {
      const s = new Date(y, m - 2, 1);
      return { start: s, end: now, label: "Ultimos 3 meses" };
    }
    case "year": {
      const s = new Date(y, 0, 1);
      return { start: s, end: now, label: `${y}` };
    }
    default: {
      // "current"
      const s = new Date(y, m, 1);
      return {
        start: s,
        end: now,
        label: s.toLocaleDateString("es-MX", {
          month: "long",
          year: "numeric",
        }),
      };
    }
  }
}

// ─── Format helpers ──────────────────────────────────────────────────────────

const fmt = (cents: number) => fmtFull(Math.abs(cents));

/** Parse any date-like value (Date, ISO string, Firestore Timestamp) to Date */
const toDate = (d: any): Date => {
  if (d instanceof Date) return d;
  if (typeof d === "string") return new Date(d);
  if (d?.toDate) return d.toDate();
  if (d?._seconds) return new Date(d._seconds * 1000);
  if (d?.seconds) return new Date(d.seconds * 1000);
  return new Date(0);
};

const fmtDate = (d: any) => {
  const date = toDate(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
};

const directionBadge: Record<string, { label: string; className: string }> = {
  income: { label: "Ingreso", className: "bg-emerald-100 text-emerald-700" },
  expense: { label: "Egreso", className: "bg-red-100 text-red-700" },
  reversal: { label: "Reversion", className: "bg-amber-100 text-amber-700" },
};

const sourceBadge: Record<string, { label: string; className: string }> = {
  ledger: { label: "Cuotas", className: "bg-blue-100 text-blue-700" },
  administrative: { label: "Admin", className: "bg-slate-100 text-slate-600" },
};

const categoryLabels: Record<string, string> = {
  cuota: "Cuota",
  multa: "Multa",
  producto: "Producto",
  reversal: "Reversion",
  donation: "Donacion",
  rental: "Renta",
  event: "Evento",
  interest: "Intereses",
  other_income: "Otros ingresos",
  maintenance: "Mantenimiento",
  utilities: "Servicios",
  supplier: "Proveedor",
  security: "Seguridad",
  cleaning: "Limpieza",
  admin_expense: "Administrativo",
  other_expense: "Otros gastos",
};

const methodLabels: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  check: "Cheque",
  unknown: "—",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function FinancialDashboard({
  residencialId,
}: {
  residencialId: string;
}) {
  const [report, setReport] = useState<ConsolidatedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("current");
  const [refreshing, setRefreshing] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);

  const fetchReport = useCallback(async () => {
    setError(null);
    const { start, end } = getPeriodRange(period);
    try {
      const res = await httpsCallable<any, ConsolidatedReport>(
        functions,
        "getConsolidatedFinancialReport",
      )({
        residencialId,
        dateStart: start.toISOString(),
        dateEnd: end.toISOString(),
      });
      setReport(res.data);
    } catch (e: any) {
      setError(
        e?.message?.includes("]")
          ? e.message.split("]").pop()
          : "Error al cargar datos financieros",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [residencialId, period]);

  useEffect(() => {
    setLoading(true);
    fetchReport();
  }, [fetchReport]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  const { label: periodLabel } = useMemo(
    () => getPeriodRange(period),
    [period],
  );

  // ── Derived metrics ──
  // Collection rate = net income / total charges billed
  // We need total charges from breakdown — but ConsolidatedReport skips CHARGEs.
  // So approximate: if netIncome > 0 and totalExpenses are 0 (no admin expenses yet),
  // use netIncome as proxy vs expected (totalHouses × cuota would be ideal but not available here)
  const collectionRate = useMemo(() => {
    if (!report) return null;
    // Net income after reversals = actual money collected
    const netIncome = report.netIncomeCents;
    if (netIncome <= 0) return 0;
    // Without charge data, we can't compute true collection rate.
    // Show null to avoid misleading numbers.
    return null;
  }, [report]);

  const netLabel = useMemo(() => {
    if (!report) return "";
    if (report.netCents > 0) return "Superavit";
    if (report.netCents < 0) return "Deficit";
    return "Equilibrado";
  }, [report]);

  const topExpense = useMemo(() => {
    if (!report) return "";
    const b = report.breakdown;
    const items = [
      { label: "Proveedores", v: b.proveedores },
      { label: "Servicios", v: b.servicios },
      { label: "Otros", v: b.otrosGastos },
    ];
    const max = items.sort((a, c) => c.v - a.v)[0];
    return max.v > 0 ? `${max.label}: ${fmt(max.v)}` : "Sin egresos";
  }, [report]);

  // ── CSV ──
  const exportCSV = () => {
    if (!report) return;
    const rows = [
      [
        "Fecha",
        "Descripcion",
        "Fuente",
        "Tipo",
        "Categoria",
        "Metodo",
        "Monto",
      ],
    ];
    const sorted = [...report.entries].sort(
      (a, b) => toDate(b.date).getTime() - toDate(a.date).getTime(),
    );
    sorted.forEach((e) => {
      rows.push([
        fmtDate(e.date),
        e.description,
        e.source === "ledger" ? "Cuotas" : "Admin",
        e.direction,
        categoryLabels[e.category] || e.category,
        methodLabels[e.paymentMethod] || e.paymentMethod,
        (e.amountCents / 100).toFixed(2),
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tesoreria-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-2xl" />
        <div className="grid gap-4 grid-cols-2">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <Card className="border-none shadow-sm bg-white rounded-2xl">
        <CardContent className="py-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-amber-400" />
          <p className="font-bold text-slate-700">{error}</p>
          <Button
            variant="outline"
            className="mt-4 rounded-xl"
            onClick={() => {
              setLoading(true);
              fetchReport();
            }}
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Empty ──
  if (!report || report.entries.length === 0) {
    return (
      <div className="space-y-5">
        <Header
          period={period}
          setPeriod={setPeriod}
          periodLabel={periodLabel}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
        <Card className="border-none shadow-sm bg-white rounded-2xl">
          <CardContent className="py-16 text-center">
            <Scale className="h-14 w-14 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-500">
              No hubo movimientos en este periodo
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Prueba cambiando el rango de fechas
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const b = report.breakdown;

  // ── Chart data ──
  const chartData = [
    { name: "Ingresos", value: report.netIncomeCents / 100 },
    { name: "Egresos", value: report.totalExpenseCents / 100 },
    { name: "Neto", value: report.netCents / 100 },
  ];
  const chartColors = [
    "#10b981",
    "#ef4444",
    report.netCents >= 0 ? "#3b82f6" : "#dc2626",
  ];

  return (
    <div className="space-y-5">
      {/* ─── A. Header ─── */}
      <Header
        period={period}
        setPeriod={setPeriod}
        periodLabel={periodLabel}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      {/* ─── B. KPI Cards ─── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Ingresos netos"
          value={fmt(report.netIncomeCents)}
          icon={TrendingUp}
          gradient="from-emerald-500 to-teal-500"
          insight={
            report.totalReversalsCents > 0
              ? `${fmt(b.cuotas)} cuotas - ${fmt(report.totalReversalsCents)} reversiones`
              : `+${fmt(b.cuotas)} de cuotas`
          }
        />
        <KPICard
          label="Egresos"
          value={fmt(report.totalExpenseCents)}
          icon={TrendingDown}
          gradient="from-red-500 to-rose-500"
          insight={topExpense}
        />
        <KPICard
          label="Neto"
          value={`${report.netCents >= 0 ? "+" : "-"}${fmt(report.netCents)}`}
          icon={DollarSign}
          gradient={
            report.netCents >= 0
              ? "from-blue-500 to-indigo-500"
              : "from-red-600 to-rose-600"
          }
          insight={netLabel}
          alert={report.netCents < 0}
        />
        <KPICard
          label="Cobranza"
          value={collectionRate !== null ? `${collectionRate}%` : "N/A"}
          icon={Percent}
          gradient={
            !collectionRate || collectionRate >= 70
              ? "from-sky-500 to-blue-500"
              : "from-amber-500 to-orange-500"
          }
          insight={
            !collectionRate
              ? "Sin datos suficientes"
              : collectionRate >= 90
                ? "Excelente"
                : collectionRate >= 70
                  ? "Aceptable"
                  : "Revisar cobranza"
          }
          alert={collectionRate !== null && collectionRate < 70}
          subtitle="Proxy de cobranza"
        />
      </div>

      {/* ─── C. Chart ─── */}
      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardContent className="pt-5 pb-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-4">
            Comparativo del periodo
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [
                  `$${value.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`,
                  "",
                ]}
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              />
              <ReferenceLine y={0} stroke="#cbd5e1" />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={chartColors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ─── D. Breakdown ─── */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <BreakdownCard
          title="Ingresos netos"
          total={report.netIncomeCents}
          items={[
            {
              label: "Cuotas",
              value: b.cuotas,
              color: "bg-emerald-500",
              icon: Receipt,
            },
            {
              label: "Multas",
              value: b.multas,
              color: "bg-amber-500",
              icon: AlertTriangle,
            },
            {
              label: "Productos",
              value: b.productos,
              color: "bg-purple-500",
              icon: ShoppingBag,
            },
            {
              label: "Otros ingresos",
              value: b.otrosIngresos,
              color: "bg-blue-500",
              icon: DollarSign,
            },
          ]}
          accentColor="emerald"
        />
        <BreakdownCard
          title="Egresos"
          total={report.totalExpenseCents}
          items={[
            {
              label: "Proveedores",
              value: b.proveedores,
              color: "bg-red-500",
              icon: Truck,
            },
            {
              label: "Servicios",
              value: b.servicios,
              color: "bg-orange-500",
              icon: Zap,
            },
            {
              label: "Otros gastos",
              value: b.otrosGastos,
              color: "bg-slate-500",
              icon: Users,
            },
          ]}
          accentColor="red"
        />
      </div>

      {/* ─���─ E. Tabla ─── */}
      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <button
            onClick={() => setTableOpen(!tableOpen)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-slate-800">
                Movimientos unificados
              </p>
              <Badge className="bg-slate-100 text-slate-600 font-bold text-[10px] rounded-md">
                {report.entries.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {tableOpen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    exportCSV();
                  }}
                  className="h-8 px-3 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </button>
              )}
              {tableOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </button>
          {tableOpen && (
            <ScrollArea className="max-h-[400px]">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-t bg-slate-50/80 sticky top-0">
                    <th className="text-left py-2.5 pl-5">Fecha</th>
                    <th className="text-left py-2.5">Descripcion</th>
                    <th className="text-left py-2.5">Fuente</th>
                    <th className="text-left py-2.5">Tipo</th>
                    <th className="text-left py-2.5">Categoria</th>
                    <th className="text-left py-2.5">Metodo</th>
                    <th className="text-right py-2.5 pr-5">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {[...report.entries]
                    .sort(
                      (a, c) =>
                        toDate(c.date).getTime() - toDate(a.date).getTime(),
                    )
                    .map((e) => {
                      const dir =
                        directionBadge[e.direction] || directionBadge.income;
                      const src = sourceBadge[e.source] || sourceBadge.ledger;
                      return (
                        <tr
                          key={e.id}
                          className="border-b border-slate-50 hover:bg-slate-50/50 text-xs transition-colors"
                        >
                          <td className="py-2.5 pl-5 text-muted-foreground whitespace-nowrap">
                            {fmtDate(e.date)}
                          </td>
                          <td className="py-2.5 text-slate-700 truncate max-w-[200px]">
                            {e.description || "—"}
                          </td>
                          <td className="py-2.5">
                            <Badge
                              className={`text-[9px] font-bold border-0 rounded-md ${src.className}`}
                            >
                              {src.label}
                            </Badge>
                          </td>
                          <td className="py-2.5">
                            <Badge
                              className={`text-[9px] font-bold border-0 rounded-md ${dir.className}`}
                            >
                              {dir.label}
                            </Badge>
                          </td>
                          <td className="py-2.5 text-slate-600">
                            {categoryLabels[e.category] || e.category}
                          </td>
                          <td className="py-2.5 text-muted-foreground">
                            {methodLabels[e.paymentMethod] || e.paymentMethod}
                          </td>
                          <td
                            className={`py-2.5 pr-5 text-right font-black ${
                              e.direction === "expense"
                                ? "text-red-600"
                                : e.direction === "reversal"
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                            }`}
                          >
                            {e.direction === "expense"
                              ? "-"
                              : e.direction === "reversal"
                                ? "-"
                                : "+"}
                            {fmtFull(e.amountCents)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Header({
  period,
  setPeriod,
  periodLabel,
  refreshing,
  onRefresh,
}: {
  period: string;
  setPeriod: (p: string) => void;
  periodLabel: string;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const pills = [
    { key: "current", label: "Este mes" },
    { key: "prev", label: "Mes anterior" },
    { key: "3m", label: "3 meses" },
    { key: "year", label: "Anio" },
  ];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Tesoreria
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
          {periodLabel}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
          {pills.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === p.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl h-8"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  icon: Icon,
  gradient,
  insight,
  alert,
  subtitle,
}: {
  label: string;
  value: string;
  icon: any;
  gradient: string;
  insight: string;
  alert?: boolean;
  subtitle?: string;
}) {
  return (
    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <div
              className={`h-8 w-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
            >
              <Icon className="h-4 w-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            {value}
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            {alert && (
              <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
            )}
            <p
              className={`text-[10px] font-medium ${alert ? "text-amber-600" : "text-muted-foreground"}`}
            >
              {insight}
            </p>
          </div>
          {subtitle && (
            <p className="text-[9px] text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({
  title,
  total,
  items,
  accentColor,
}: {
  title: string;
  total: number;
  items: { label: string; value: number; color: string; icon: any }[];
  accentColor: string;
}) {
  const maxVal = Math.max(...items.map((i) => i.value), 1);
  return (
    <Card className="border-none shadow-sm bg-white rounded-2xl">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          <p className={`text-sm font-black text-${accentColor}-600`}>
            {fmt(total)}
          </p>
        </div>
        <div className="space-y-3">
          {items.map((item) => {
            const pct =
              total > 0 ? Math.max(2, (item.value / maxVal) * 100) : 0;
            const Icon = item.icon;
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-600">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-xs font-black text-slate-800">
                    {item.value > 0 ? (
                      fmt(item.value)
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: item.value > 0 ? `${pct}%` : "0%" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
