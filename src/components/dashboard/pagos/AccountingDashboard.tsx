"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TrendingUp, TrendingDown, DollarSign, Search, Home, BarChart3, Clock,
} from "lucide-react";
import {
  AccountingService,
  FinancialEvent,
  AccountingSummary,
  SUBTYPE_LABELS,
  SUBTYPE_CATEGORY,
  SUBTYPE_METHOD,
} from "@/lib/services/accounting-service";

const fmtCents = (cents: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(cents / 100);

const fmtDate = (d: Date) => d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

export default function AccountingDashboard({ residencialId }: { residencialId: string }) {
  const [events, setEvents] = useState<FinancialEvent[]>([]);
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "charge">("all");
  const [periodFilter, setPeriodFilter] = useState<"current" | "3months" | "year">("current");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const now = new Date();
        let dateStart: Date;
        if (periodFilter === "3months") {
          dateStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        } else if (periodFilter === "year") {
          dateStart = new Date(now.getFullYear(), 0, 1);
        } else {
          dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        const dateEnd = now;

        const impactFilter = typeFilter === "income" ? "DECREASE_DEBT" as const
          : typeFilter === "charge" ? "INCREASE_DEBT" as const : undefined;

        const [evts, sum] = await Promise.all([
          AccountingService.getFinancialEvents(residencialId, dateStart, dateEnd, impactFilter),
          AccountingService.getAccountingSummary(residencialId, dateStart, dateEnd),
        ]);
        setEvents(evts);
        setSummary(sum);
      } catch (err) {
        console.error("[AccountingDashboard] Error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [residencialId, typeFilter, periodFilter]);

  const filtered = useMemo(() => {
    if (!search) return events;
    const q = search.toLowerCase();
    return events.filter(e =>
      e.description.toLowerCase().includes(q) ||
      e.houseId.toLowerCase().includes(q) ||
      (SUBTYPE_LABELS[e.subType] || "").toLowerCase().includes(q) ||
      (SUBTYPE_CATEGORY[e.subType] || "").toLowerCase().includes(q)
    );
  }, [events, search]);

  const kpis = summary ? [
    { label: "Ingresos", value: fmtCents(summary.totalIncomeCents), icon: TrendingDown, color: "text-emerald-600", grad: "from-emerald-500 to-teal-500" },
    { label: "Cargos", value: fmtCents(summary.totalChargesCents), icon: TrendingUp, color: "text-red-600", grad: "from-red-500 to-rose-500" },
    { label: "Balance", value: fmtCents(summary.balanceCents), icon: DollarSign, color: summary.balanceCents >= 0 ? "text-emerald-600" : "text-red-600", grad: "from-blue-500 to-blue-600" },
    { label: "Cobranza", value: `${summary.collectionRate.toFixed(0)}%`, icon: BarChart3, color: "text-blue-600", grad: "from-amber-500 to-orange-500" },
    { label: "Casas pagadas", value: `${summary.housesPaid}/${summary.totalHouses}`, icon: Home, color: "text-slate-800", grad: "from-emerald-500 to-teal-500" },
    { label: "Promedio mensual", value: fmtCents(summary.monthlyAverageCents), icon: Clock, color: "text-slate-600", grad: "from-slate-500 to-slate-600" },
  ] : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-xl font-black text-slate-900">Libro Mayor</h3>
        <p className="text-sm text-muted-foreground">Movimientos financieros del residencial</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {loading ? Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-none shadow-sm bg-white/70 rounded-xl">
            <CardContent className="pt-4 pb-3"><Skeleton className="h-4 w-16 mb-1" /><Skeleton className="h-6 w-20" /></CardContent>
          </Card>
        )) : kpis.map((k, i) => (
          <Card key={i} className="border-none shadow-sm bg-white/70 rounded-xl hover:shadow-md transition-all group overflow-hidden">
            <CardContent className="pt-4 pb-3 relative">
              <div className={`absolute top-0 right-0 w-12 h-12 bg-gradient-to-br ${k.grad} opacity-[0.07] rounded-bl-2xl -mr-1 -mt-1`} />
              <div className="flex items-center gap-1.5 mb-1">
                <k.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{k.label}</span>
              </div>
              <div className={`text-lg font-black ${k.color}`}>{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm bg-white/70 rounded-xl">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por descripción, casa, categoría..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 rounded-lg text-sm" />
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { key: "all", label: "Todos" },
                { key: "income", label: "Ingresos" },
                { key: "charge", label: "Cargos" },
              ].map(f => (
                <button key={f.key} onClick={() => setTypeFilter(f.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    typeFilter === f.key ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}>{f.label}</button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { key: "current", label: "Este mes" },
                { key: "3months", label: "3 meses" },
                { key: "year", label: "Este año" },
              ].map(f => (
                <button key={f.key} onClick={() => setPeriodFilter(f.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    periodFilter === f.key ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}>{f.label}</button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events table */}
      <Card className="border-none shadow-sm bg-white/70 rounded-xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-sm text-slate-500">Sin movimientos en este período</p>
              <p className="text-xs text-muted-foreground mt-1">Ajusta los filtros para ver más resultados</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b bg-slate-50/80 sticky top-0">
                    <th className="text-left py-3 pl-4">Fecha</th>
                    <th className="text-left py-3">Tipo</th>
                    <th className="text-left py-3">Categoría</th>
                    <th className="text-left py-3">Descripción</th>
                    <th className="text-left py-3">Casa</th>
                    <th className="text-left py-3">Método</th>
                    <th className="text-left py-3">Folio</th>
                    <th className="text-left py-3">Periodo</th>
                    <th className="text-right py-3 pr-4">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => {
                    const isIncome = e.impact === "DECREASE_DEBT";
                    return (
                      <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors text-xs">
                        <td className="py-2.5 pl-4 text-muted-foreground whitespace-nowrap">{fmtDate(e.timestamp)}</td>
                        <td className="py-2.5">
                          <Badge className={`text-[10px] font-bold border-0 rounded-md ${isIncome ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                            {isIncome ? "Ingreso" : "Cargo"}
                          </Badge>
                        </td>
                        <td className="py-2.5 font-medium text-slate-700">{SUBTYPE_CATEGORY[e.subType] || e.type}</td>
                        <td className="py-2.5 text-slate-600 truncate max-w-[200px]" title={e.description}>
                          {SUBTYPE_LABELS[e.subType] || e.description || e.subType}
                        </td>
                        <td className="py-2.5 font-bold text-slate-800">{e.houseId || "General"}</td>
                        <td className="py-2.5 text-muted-foreground">{SUBTYPE_METHOD[e.subType] || "Sistema"}</td>
                        <td className="py-2.5">{e.folio ? <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{e.folio}</span> : <span className="text-slate-300">—</span>}</td>
                        <td className="py-2.5 text-muted-foreground">{e.periodKey || "—"}</td>
                        <td className={`py-2.5 pr-4 text-right font-black ${isIncome ? "text-emerald-600" : "text-red-600"}`}>
                          {isIncome ? "+" : "-"}{fmtCents(e.amountCents)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t text-xs text-muted-foreground text-right">
                {filtered.length} movimientos · Montos en MXN
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
