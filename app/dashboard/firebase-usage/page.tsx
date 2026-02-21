"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdminRequired } from "@/lib/hooks";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Zap,
  Cloud,
  DollarSign,
  ExternalLink,
  BarChart3,
  AlertCircle,
  Flame,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Code2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  FirebaseUsageService,
  FirebaseUsageData,
  formatNumber,
  formatStorage,
  getCostBreakdown,
  getPeriodLabel,
  type FreeTierStatus,
} from "@/lib/services/firebase-usage-service";

const MONTH_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export default function FirebaseUsagePage() {
  const { isGlobalAdmin, isUserLoading } = useAdminRequired(true);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<FirebaseUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await FirebaseUsageService.getUsage(month, year);
      setData(result);
    } catch (err: any) {
      setError(err?.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    if (!isUserLoading && isGlobalAdmin) {
      loadData();
    }
  }, [isUserLoading, isGlobalAdmin, loadData]);

  const canGoForward =
    !(year === now.getFullYear() && month === now.getMonth() + 1);

  const goBack = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goForward = () => {
    if (!canGoForward) return;
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  if (isUserLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Uso y Costos Firebase
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitoreo de recursos del proyecto
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goBack} className="rounded-xl">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[120px] text-center font-semibold text-sm">
            {MONTH_SHORT[month - 1]} {year}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={goForward}
            disabled={!canGoForward}
            className="rounded-xl"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="rounded-xl ml-2"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"
        >
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-red-700 mb-1">Error al cargar datos</p>
          <p className="text-xs text-red-500 mb-4 max-w-md mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={loadData}>
            Reintentar
          </Button>
        </motion.div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      )}

      {/* Data */}
      {data && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Lecturas Firestore"
              value={formatNumber(data.firestore.reads.total)}
              icon={<Eye className="h-5 w-5" />}
              color="blue"
            />
            <SummaryCard
              title="Escrituras Firestore"
              value={formatNumber(data.firestore.writes.total)}
              icon={<Edit3 className="h-5 w-5" />}
              color="green"
            />
            <SummaryCard
              title="Invocaciones Functions"
              value={formatNumber(data.functions.invocations.total)}
              icon={<Zap className="h-5 w-5" />}
              color="orange"
            />
            <SummaryCard
              title="Storage"
              value={formatStorage(data.storage.totalBytes.total)}
              icon={<Cloud className="h-5 w-5" />}
              color="purple"
            />
          </div>

          {/* Free tier status */}
          {data.freeTier && <FreeTierCard freeTier={data.freeTier} />}

          {/* Cost overview */}
          <CostOverview costs={data.estimatedCosts} />

          {/* Firestore chart */}
          <FirestoreChart data={data} />

          {/* Functions chart */}
          <FunctionsChart data={data} />

          {/* Functions breakdown */}
          {data.functions.breakdown && data.functions.breakdown.length > 0 && (
            <FunctionsBreakdownCard breakdown={data.functions.breakdown} />
          )}

          {/* Storage chart */}
          {data.storage.totalBytes.series.length > 0 && (
            <StorageChart data={data} />
          )}

          {/* External links */}
          <ExternalLinks />
        </motion.div>
      )}
    </div>
  );
}

/* ---------- Sub-components ---------- */

const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-500" },
  green: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "text-emerald-500" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", icon: "text-orange-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", icon: "text-purple-500" },
};

function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  const c = colorMap[color] || colorMap.blue;
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400 }}>
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">{title}</span>
            <div className={`p-2 rounded-xl ${c.bg}`}>
              <span className={c.icon}>{icon}</span>
            </div>
          </div>
          <p className={`text-2xl font-bold tracking-tight ${c.text}`}>{value}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CostOverview({ costs }: { costs: FirebaseUsageData["estimatedCosts"] }) {
  const breakdown = getCostBreakdown(costs);
  return (
    <Card className="border-0 shadow-sm rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50">
              <DollarSign className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-base">Costo estimado del mes</CardTitle>
              <CardDescription className="text-xs">
                Basado en precios estándar de Firebase (Blaze plan)
              </CardDescription>
            </div>
          </div>
          <span className="text-xl font-bold text-blue-600">
            ${costs.total.toFixed(2)} USD
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {breakdown.map((item) => {
          const pct = costs.total > 0 ? (item.value / costs.total) * 100 : 0;
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-600">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-800">
                    ${item.value.toFixed(4)}
                  </span>
                  <span className="text-xs text-slate-400 w-10 text-right">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </div>
              <Progress
                value={pct}
                className="h-1.5"
                style={{ ["--progress-color" as any]: item.color }}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function formatFreeTierValue(value: number, unit: string): string {
  if (unit === "bytes") {
    if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(2)} GB`;
    if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(1)} MB`;
    if (value >= 1024) return `${(value / 1024).toFixed(0)} KB`;
    return `${Math.round(value)} B`;
  }
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("es-MX").format(Math.round(value));
}

function FreeTierCard({ freeTier }: { freeTier: FreeTierStatus }) {
  const isWithin = freeTier.withinFreeTier;
  return (
    <Card
      className={`border-0 shadow-sm rounded-2xl border-2 ${
        isWithin ? "border-emerald-200 bg-emerald-50/30" : "border-amber-200 bg-amber-50/30"
      }`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl ${isWithin ? "bg-emerald-100" : "bg-amber-100"}`}
          >
            {isWithin ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            )}
          </div>
          <div>
            <CardTitle className={`text-base ${isWithin ? "text-emerald-700" : "text-amber-700"}`}>
              {isWithin ? "Dentro del uso gratuito de Firebase" : "Superando el uso gratuito"}
            </CardTitle>
            <CardDescription className="text-xs">
              Comparado con los límites del plan Spark / cuota gratuita Blaze
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {freeTier.items.map((item) => {
          const pct = item.limit > 0 ? Math.min(100, (item.used / item.limit) * 100) : 0;
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      item.withinFreeTier ? "text-slate-700 font-medium" : "text-amber-700 font-semibold"
                    }
                  >
                    {formatFreeTierValue(item.used, item.unit)} /{" "}
                    {formatFreeTierValue(item.limit, item.unit)}
                  </span>
                  {item.withinFreeTier ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              </div>
              <Progress
                value={pct}
                className="h-1.5"
                style={{
                  ["--progress-color" as string]: item.withinFreeTier ? "#22c55e" : "#f59e0b",
                }}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function FunctionsBreakdownCard({
  breakdown,
}: {
  breakdown: { name: string; invocations: number; unused: boolean }[];
}) {
  return (
    <Card className="border-0 shadow-sm rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-50">
            <Code2 className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <CardTitle className="text-base">Uso por función</CardTitle>
            <CardDescription className="text-xs">
              Invocaciones en el periodo. Las marcadas como &quot;No usado&quot; no tuvieron ejecuciones.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {breakdown.map((fn) => (
            <div
              key={fn.name}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100"
            >
              <span className="font-mono text-sm text-slate-800 truncate flex-1 mr-4">
                {fn.name}
              </span>
              <span className="text-sm font-semibold text-slate-700 tabular-nums">
                {new Intl.NumberFormat("es-MX").format(fn.invocations)}
              </span>
              {fn.unused && (
                <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-600">
                  No usado
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function formatDay(dateStr: string) {
  if (!dateStr || dateStr.length < 10) return dateStr;
  return dateStr.substring(8, 10);
}

function FirestoreChart({ data }: { data: FirebaseUsageData }) {
  const chartData = (() => {
    const dates = new Set<string>();
    data.firestore.reads.series.forEach((p) => dates.add(p.date));
    data.firestore.writes.series.forEach((p) => dates.add(p.date));
    const sorted = Array.from(dates).sort();
    return sorted.map((date) => ({
      day: formatDay(date),
      Lecturas: data.firestore.reads.series.find((p) => p.date === date)?.value ?? 0,
      Escrituras: data.firestore.writes.series.find((p) => p.date === date)?.value ?? 0,
    }));
  })();

  if (chartData.length === 0) return null;

  return (
    <Card className="border-0 shadow-sm rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50">
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </div>
          <CardTitle className="text-base">Firestore - Uso diario</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(0)}M`
                    : v >= 1_000
                    ? `${(v / 1_000).toFixed(0)}K`
                    : `${v}`
                }
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                }}
                formatter={(value: number) =>
                  new Intl.NumberFormat("es-MX").format(value)
                }
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", fontWeight: 600 }}
                iconType="circle"
                iconSize={8}
              />
              <Bar dataKey="Lecturas" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="Escrituras" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function FunctionsChart({ data }: { data: FirebaseUsageData }) {
  const chartData = data.functions.invocations.series.map((p) => ({
    day: formatDay(p.date),
    Invocaciones: p.value,
  }));

  if (chartData.length === 0) return null;

  return (
    <Card className="border-0 shadow-sm rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-50">
            <Zap className="h-5 w-5 text-orange-500" />
          </div>
          <CardTitle className="text-base">Cloud Functions - Invocaciones diarias</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(v) =>
                  v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : `${v}`
                }
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                }}
                formatter={(value: number) =>
                  new Intl.NumberFormat("es-MX").format(value)
                }
              />
              <Bar
                dataKey="Invocaciones"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
                barSize={14}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function StorageChart({ data }: { data: FirebaseUsageData }) {
  const chartData = data.storage.totalBytes.series.map((p) => ({
    day: formatDay(p.date),
    MB: +(p.value / (1024 * 1024)).toFixed(2),
  }));

  if (chartData.length === 0) return null;

  return (
    <Card className="border-0 shadow-sm rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-50">
            <Cloud className="h-5 w-5 text-purple-500" />
          </div>
          <CardTitle className="text-base">Cloud Storage - Uso diario</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="colorStorage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickFormatter={(v) => `${v} MB`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value.toFixed(2)} MB`, "Storage"]}
              />
              <Line
                type="monotone"
                dataKey="MB"
                stroke="#a855f7"
                strokeWidth={3}
                dot={{ r: 3, fill: "#a855f7", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

const externalLinks = [
  {
    title: "Firebase Console",
    description: "Ver uso detallado en Firebase",
    url: "https://console.firebase.google.com",
    icon: <Flame className="h-5 w-5" />,
    color: "bg-orange-50 text-orange-500",
  },
  {
    title: "GCP Billing",
    description: "Facturación oficial de Google Cloud",
    url: "https://console.cloud.google.com/billing",
    icon: <DollarSign className="h-5 w-5" />,
    color: "bg-emerald-50 text-emerald-500",
  },
  {
    title: "Cloud Monitoring",
    description: "Métricas y alertas en tiempo real",
    url: "https://console.cloud.google.com/monitoring",
    icon: <Activity className="h-5 w-5" />,
    color: "bg-blue-50 text-blue-500",
  },
];

function ExternalLinks() {
  return (
    <Card className="border-0 shadow-sm rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Consolas externas</CardTitle>
        <CardDescription className="text-xs">
          Para datos oficiales de facturación y configuración avanzada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {externalLinks.map((link) => (
          <a
            key={link.title}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
          >
            <div className={`p-2 rounded-xl ${link.color}`}>{link.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">{link.title}</p>
              <p className="text-xs text-slate-500">{link.description}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
