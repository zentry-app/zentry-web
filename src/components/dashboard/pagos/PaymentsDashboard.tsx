"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Banknote,
  Eye,
  TrendingUp,
  AlertTriangle,
  Home,
  Loader2,
  Image as ImageIcon,
  BookOpen,
  ArrowLeftRight,
  Tag,
  Settings,
  Search,
  LayoutGrid,
  List,
  ShieldCheck,
  Download,
  BarChart3,
  Receipt,
} from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import dynamic from "next/dynamic";

import HouseDetailSheet from "./HouseDetailSheet";
import CashTerminal from "./CashTerminal";
import {
  KPIData,
  PendingValidation,
  HouseStatus,
  fmtFull,
  statusDot,
  statusLabel,
  normalizeStatus,
} from "./payments-types";

// Lazy-loaded tool components
const AccountingDashboard = dynamic(() => import("./AccountingDashboard"), {
  ssr: false,
  loading: () => (
    <p className="py-12 text-center text-muted-foreground">Cargando...</p>
  ),
});
const CatalogManagement = dynamic(() => import("./CatalogManagement"), {
  ssr: false,
  loading: () => (
    <p className="py-12 text-center text-muted-foreground">Cargando...</p>
  ),
});
const BillingSettings = dynamic(() => import("./BillingSettings"), {
  ssr: false,
  loading: () => (
    <p className="py-12 text-center text-muted-foreground">Cargando...</p>
  ),
});
const MovementsManager = dynamic(() => import("./MovementsManager"), {
  ssr: false,
  loading: () => (
    <p className="py-12 text-center text-muted-foreground">Cargando...</p>
  ),
});

const FinancialDashboard = dynamic(() => import("./FinancialDashboard"), {
  ssr: false,
  loading: () => (
    <p className="py-12 text-center text-muted-foreground">Cargando...</p>
  ),
});

const FoliosRecibos = dynamic(() => import("./FoliosRecibos"), {
  ssr: false,
  loading: () => (
    <p className="py-12 text-center text-muted-foreground">Cargando...</p>
  ),
});

// Tabs — "Validación" is the default view (home), rest are tools
// Periodos removed: billing is automatic via BillingAgentCron. 2026-03-25.
// Analytics removed: redundant with KPIs + Libro Mayor. 2026-03-25.
const tabs = [
  { id: "validacion", label: "Validación", icon: ShieldCheck },
  { id: "folios", label: "Folios & Recibos", icon: Receipt },
  { id: "estado_cuenta", label: "Estado de Cuenta", icon: Home },
  { id: "libro_mayor", label: "Libro Mayor", icon: BookOpen },
  { id: "movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { id: "tesoreria", label: "Tesorería", icon: BarChart3 },
  { id: "admin", label: "Administración", icon: Tag },
  { id: "configuracion", label: "Configuración", icon: Settings },
];

// ─── Component ────────────────────────────────────────────────────
export default function PaymentsDashboard({
  residencialId,
}: {
  residencialId: string;
}) {
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [pending, setPending] = useState<PendingValidation[]>([]);
  const [houses, setHouses] = useState<HouseStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHouses, setLoadingHouses] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [activeTab, setActiveTab] = useState("validacion");
  const [selectedPayment, setSelectedPayment] =
    useState<PendingValidation | null>(null);
  const [validating, setValidating] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [cashOpen, setCashOpen] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState<HouseStatus | null>(null);

  const triggerRefresh = useCallback((delayMs = 0) => {
    if (delayMs > 0) setTimeout(() => setRefreshKey((k) => k + 1), delayMs);
    else setRefreshKey((k) => k + 1);
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      const [kpiRes, pendingRes, housesRes] = await Promise.allSettled([
        httpsCallable<any, KPIData>(
          functions,
          "getReportingDashboard",
        )({ residencialId }),
        httpsCallable<any, PendingValidation[]>(
          functions,
          "getPendingValidationsList",
        )({ residencialId }),
        httpsCallable<any, HouseStatus[]>(
          functions,
          "getResidentialHousesSummary",
        )({ residencialId }),
      ]);
      console.log(
        "[PaymentsDashboard] kpiRes:",
        kpiRes.status,
        kpiRes.status === "rejected" ? (kpiRes as any).reason?.message : "OK",
      );
      console.log("[PaymentsDashboard] pendingRes:", pendingRes.status);
      console.log("[PaymentsDashboard] housesRes:", housesRes.status);
      if (kpiRes.status === "fulfilled") {
        console.log(
          "[PaymentsDashboard] KPI data:",
          JSON.stringify(kpiRes.value.data, null, 2),
        );
        setKpi(kpiRes.value.data);
      }
      if (pendingRes.status === "fulfilled") setPending(pendingRes.value.data);
      if (housesRes.status === "fulfilled") setHouses(housesRes.value.data);
    } catch (err) {
      console.error("[PaymentsDashboard] fetch error:", err);
    } finally {
      setLoading(false);
      setLoadingHouses(false);
      setRefreshing(false);
    }
  }, [residencialId, refreshKey]);

  useEffect(() => {
    if (refreshKey === 0) {
      setLoading(true);
      setLoadingHouses(true);
    }
    fetchAllData();
  }, [fetchAllData]);

  const handleRefresh = () => {
    setRefreshing(true);
    triggerRefresh();
  };

  const handleValidate = async (paymentId: string) => {
    setValidating(true);
    try {
      const res = await httpsCallable<any, any>(
        functions,
        "apiValidatePayment",
      )({ residencialId, paymentId });
      const folio = res.data?.folio || res.data;
      toast.success(folio ? `Pago validado · Folio ${folio}` : "Pago validado");
      setSelectedPayment(null);
      setPending((prev) => prev.filter((p) => p.id !== paymentId));
      setRefreshing(true); // show animation immediately
      triggerRefresh(2500); // longer delay for Firestore propagation
    } catch {
      toast.error("Error al validar");
    } finally {
      setValidating(false);
    }
  };

  const handleReject = async (paymentId: string) => {
    if (!rejectReason.trim()) {
      toast.error("Ingresa un motivo");
      return;
    }
    setRejecting(true);
    try {
      await httpsCallable(
        functions,
        "apiRejectPayment",
      )({ residencialId, paymentId, reason: rejectReason.trim() });
      toast.success("Pago rechazado");
      setSelectedPayment(null);
      setRejectReason("");
      setPending((prev) => prev.filter((p) => p.id !== paymentId));
      setRefreshing(true);
      triggerRefresh(2500);
    } catch {
      toast.error("Error al rechazar");
    } finally {
      setRejecting(false);
    }
  };

  // ─── Computed ───────────────────────────────────────────────────
  const localDebt = houses.reduce((s, h) => s + (h.deudaCents || 0), 0);
  const localWithDebt = houses.filter((h) => (h.deudaCents || 0) > 0).length;
  const counts = useMemo(() => {
    const c = { al_dia: 0, con_deuda: 0 };
    houses.forEach((h) => {
      c[normalizeStatus(h)]++;
    });
    return c;
  }, [houses]);

  const kpiCards = [
    {
      label: "Cobrado mes",
      value: kpi ? fmtFull(kpi.summary.cobradoNetoCents) : "—",
      icon: TrendingUp,
      grad: "from-blue-500 to-blue-600",
    },
    {
      label: "Por validar",
      value: kpi
        ? String(kpi.validations.pendingValidation)
        : String(pending.length),
      icon: Clock,
      grad: "from-amber-500 to-orange-500",
      pulse: pending.length > 0,
    },
    {
      label: "Deuda total",
      value: houses.length > 0 ? fmtFull(localDebt) : "—",
      icon: AlertTriangle,
      grad: "from-red-500 to-rose-500",
    },
    {
      label: "Con deuda",
      value: houses.length > 0 ? `${localWithDebt}/${houses.length}` : "—",
      icon: Home,
      grad: "from-emerald-500 to-teal-500",
    },
  ];

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gradient-zentry">
            Pagos
          </h2>
          <p className="text-muted-foreground font-medium text-sm">
            Panel de cobros y validaciones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-2xl hover-lift"
          >
            <RefreshCw
              className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
          <Button
            size="sm"
            onClick={() => setCashOpen(true)}
            className="rounded-2xl shadow-zentry bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover-lift font-bold"
          >
            <Banknote className="h-4 w-4 mr-1.5" />
            Cobrar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card
                key={i}
                className="border-none shadow-zentry bg-white rounded-[1.5rem]"
              >
                <CardContent className="pt-5 pb-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-28" />
                </CardContent>
              </Card>
            ))
          : kpiCards.map((c, i) => (
              <Card
                key={i}
                className={`border-none shadow-zentry bg-white rounded-[1.5rem] hover:shadow-zentry-lg transition-all duration-300 group overflow-hidden ${refreshing ? "animate-pulse" : ""}`}
              >
                <CardContent className="pt-5 pb-4 relative">
                  <div
                    className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${c.grad} opacity-[0.07] rounded-bl-[2rem] -mr-1 -mt-1 group-hover:opacity-[0.12] transition-opacity`}
                  />
                  {/* Shimmer overlay when refreshing */}
                  {refreshing && (
                    <div className="absolute inset-0 overflow-hidden rounded-[1.5rem]">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className={`h-7 w-7 rounded-lg bg-gradient-to-br ${c.grad} flex items-center justify-center ${refreshing ? "animate-spin" : ""}`}
                    >
                      <c.icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                      {c.label}
                    </span>
                    {refreshing && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                    )}
                  </div>
                  <div
                    className={`text-xl font-black ${c.pulse ? "text-amber-600" : "text-slate-900"} ${refreshing ? "opacity-50" : ""} transition-opacity`}
                  >
                    {c.value}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              activeTab === t.id
                ? "bg-slate-900 text-white shadow-lg"
                : "bg-white/70 text-slate-500 border border-slate-200/60 hover:bg-white hover:text-slate-800 hover:shadow-sm"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {t.id === "validacion" && pending.length > 0 && (
              <span className="text-[9px] bg-amber-500 text-white rounded-full px-1.5 py-0.5">
                {pending.length}
              </span>
            )}
            {t.id === "estado_cuenta" && counts.con_deuda > 0 && (
              <span className="text-[9px] bg-red-500 text-white rounded-full px-1.5 py-0.5">
                {counts.con_deuda}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Tab: Validación ─────────────────────────────────────── */}
      {activeTab === "validacion" && (
        <Card className="border-none shadow-zentry-lg bg-white rounded-[2rem] overflow-hidden animate-fadeIn">
          <CardHeader className="px-6 pt-5 pb-2">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/5 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              Pagos por validar
              {pending.length > 0 && (
                <Badge className="bg-amber-100 text-amber-700 font-black rounded-full ml-auto">
                  {pending.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            {loading ? (
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : pending.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
                <p className="font-black text-lg text-slate-700">Todo al día</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No hay pagos pendientes de revisión
                </p>
              </div>
            ) : (
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {pending.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPayment(p)}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white/60 hover:bg-white hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-150"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm">
                          {p.houseLabel || p.houseId}
                        </span>
                        <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-slate-100 rounded">
                          {p.method === "transfer" ? "Transf." : "Efectivo"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {p.residentName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <span className="font-black text-sm">
                        {fmtFull(p.montoCents)}
                      </span>
                      <Eye className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Tab: Estado de Cuenta ───────────────────────────────── */}
      {activeTab === "estado_cuenta" && (
        <div className="animate-fadeIn">
          <EstadoCuentaView
            residencialId={residencialId}
            houses={houses}
            loadingHouses={loadingHouses}
            counts={counts}
            onSelectHouse={setSelectedHouse}
          />
        </div>
      )}

      {/* ─── Tab: Libro Mayor ────────────────────────────────────── */}
      {activeTab === "folios" && (
        <div className="animate-fadeIn">
          <FoliosRecibos residencialId={residencialId} />
        </div>
      )}

      {activeTab === "libro_mayor" && (
        <div className="animate-fadeIn">
          <AccountingDashboard residencialId={residencialId} />
        </div>
      )}

      {/* ─── Tab: Movimientos ────────────────────────────────────── */}
      {activeTab === "movimientos" && (
        <div className="animate-fadeIn">
          <MovementsManager residencialId={residencialId} />
        </div>
      )}

      {/* ─── Tab: Tesorería ────────────────────────────────────────── */}
      {activeTab === "tesoreria" && (
        <div className="animate-fadeIn">
          <FinancialDashboard residencialId={residencialId} />
        </div>
      )}

      {/* ─── Tab: Administración ──────────────────────────────────────── */}
      {activeTab === "admin" && (
        <div className="animate-fadeIn">
          <CatalogManagement residencialId={residencialId} />
        </div>
      )}

      {/* ─── Tab: Configuración ──────────────────────────────────── */}
      {activeTab === "configuracion" && (
        <div className="animate-fadeIn">
          <BillingSettings residencialId={residencialId} />
        </div>
      )}

      {/* ─── Cash Terminal ───────────────────────────────────────── */}
      {cashOpen && (
        <CashTerminal
          open={cashOpen}
          onClose={() => setCashOpen(false)}
          residencialId={residencialId}
          houses={houses}
          onPaymentRegistered={() => triggerRefresh(1200)}
        />
      )}

      {/* ─── House Detail Sheet ──────────────────────────────────── */}
      {selectedHouse && (
        <HouseDetailSheet
          open={!!selectedHouse}
          onClose={() => setSelectedHouse(null)}
          residencialId={residencialId}
          house={selectedHouse}
          onAction={() => triggerRefresh(1200)}
        />
      )}

      {/* ─── Validation Dialog ───────────────────────────────────── */}
      {selectedPayment && (
        <Dialog
          open={!!selectedPayment}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedPayment(null);
              setRejectReason("");
            }
          }}
        >
          <DialogContent className="max-w-lg rounded-[2rem] border-none shadow-2xl bg-white/95 backdrop-blur-3xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-black">
                Validar comprobante
              </DialogTitle>
              <DialogDescription className="font-medium">
                {selectedPayment.houseLabel} · {selectedPayment.residentName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center py-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl">
                <div className="text-2xl font-black">
                  {fmtFull(selectedPayment.montoCents)}
                </div>
                <div className="flex items-center justify-center gap-2 mt-1.5">
                  <Badge
                    variant="outline"
                    className="rounded-lg font-bold text-[11px]"
                  >
                    {selectedPayment.method === "transfer"
                      ? "Transferencia"
                      : "Efectivo"}
                  </Badge>
                  {selectedPayment.fecha && (
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(selectedPayment.fecha).toLocaleDateString(
                        "es-MX",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                    </span>
                  )}
                </div>
              </div>
              {selectedPayment.notas && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Notas
                  </span>
                  <p className="text-sm mt-0.5">{selectedPayment.notas}</p>
                </div>
              )}
              {selectedPayment.proofUrl && (
                <a
                  href={selectedPayment.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="relative rounded-xl overflow-hidden border hover:shadow-zentry transition-all group">
                    <img
                      src={selectedPayment.proofUrl}
                      alt="Comprobante"
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                      <span className="bg-white/90 backdrop-blur rounded-lg px-2.5 py-1 opacity-0 group-hover:opacity-100 text-xs font-bold flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Ver
                      </span>
                    </div>
                  </div>
                </a>
              )}
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Motivo de rechazo
                </label>
                <Input
                  placeholder="Solo si rechazas"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-1 h-10 rounded-xl"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1 h-11 rounded-xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  onClick={() => handleValidate(selectedPayment.id)}
                  disabled={validating || rejecting}
                >
                  {validating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Validar
                </Button>
                <Button
                  className="flex-1 h-11 rounded-xl font-black"
                  variant="destructive"
                  onClick={() => handleReject(selectedPayment.id)}
                  disabled={validating || rejecting}
                >
                  {rejecting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Rechazar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Genera lista de los últimos 12 meses completos (YYYY-MM) ──────
function buildMonthOptions() {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1 - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-MX", {
      month: "short",
      year: "numeric",
    });
    return { value, label };
  });
}
const MONTH_OPTIONS = buildMonthOptions();

// ─── Estado de Cuenta (inline sub-component) ──────────────────────
function EstadoCuentaView({
  residencialId,
  houses,
  loadingHouses,
  counts,
  onSelectHouse,
}: {
  residencialId: string;
  houses: HouseStatus[];
  loadingHouses: boolean;
  counts: { al_dia: number; con_deuda: number };
  onSelectHouse: (h: HouseStatus) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [monthIdx, setMonthIdx] = useState(0); // 0 = mes anterior (default)
  const reportMonth = MONTH_OPTIONS[monthIdx].value;
  const [exporting, setExporting] = useState(false);

  const exportExcel = async () => {
    setExporting(true);
    try {
      // Datos del mes desde CF (mismo approach que antes con CSV)
      const result = await httpsCallable<any, HouseStatus[]>(
        functions,
        "getResidentialHousesSummary",
      )({ residencialId, reportMonth });
      const apiData: HouseStatus[] = result.data ?? [];

      const paidMap: Record<string, number> = {};
      const fechaMap: Record<string, string | null> = {};
      const mesesMap: Record<string, string[]> = {};
      apiData.forEach((h) => {
        paidMap[h.houseId] = h.pagadoMesCents ?? 0;
        fechaMap[h.houseId] = h.fechaPago ?? null;
        mesesMap[h.houseId] = h.mesesCubiertos ?? [];
      });

      type HR = {
        houseId: string; label: string; residentName: string;
        deudaCents: number; saldoAFavorCents: number; pagadoCents: number;
        fechaPago: string | null; mesesCubiertos: string[];
        cubreMes: boolean; status: "con_deuda" | "al_dia";
      };
      const rows: HR[] = houses.map((h) => {
        const pagado = paidMap[h.houseId] ?? 0;
        const meses = mesesMap[h.houseId] ?? [];
        return {
          houseId: h.houseId, label: h.label,
          residentName: h.residentName || "",
          deudaCents: h.deudaCents ?? 0,
          saldoAFavorCents: h.saldoAFavorCents ?? 0,
          pagadoCents: pagado, fechaPago: fechaMap[h.houseId] ?? null,
          mesesCubiertos: meses, cubreMes: meses.includes(reportMonth),
          status: (h.deudaCents ?? 0) > 0 ? "con_deuda" : "al_dia",
        };
      });

      const totalCasas = rows.length;
      const totalRecaudado = rows.reduce((s, h) => s + h.pagadoCents, 0);
      const casasQuePagaron = rows.filter((h) => h.pagadoCents > 0).length;
      const totalDeuda = rows.reduce((s, h) => s + (h.deudaCents > 0 ? h.deudaCents : 0), 0);
      const pctCobranza = totalCasas > 0 ? Math.round((casasQuePagaron / totalCasas) * 100) : 0;
      let paraMesActualCents = 0;
      let paraOtrosMesesCents = 0;
      rows.forEach((h) => {
        if (h.pagadoCents === 0) return;
        if (h.mesesCubiertos.includes(reportMonth)) {
          const n = h.mesesCubiertos.length || 1;
          const pp = Math.round(h.pagadoCents / n);
          paraMesActualCents += pp;
          paraOtrosMesesCents += h.pagadoCents - pp;
        } else { paraOtrosMesesCents += h.pagadoCents; }
      });

      const fmtMXN = (c: number) =>
        new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(c / 100);
      const mesCorto = (ym: string) => {
        const [y, m] = ym.split("-").map(Number);
        return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "short", year: "numeric" });
      };
      const mesLargo = (ym: string) => {
        const [y, m] = ym.split("-").map(Number);
        return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" }).toUpperCase();
      };

      const C = {
        azulOscuro: "1E3A5F", azulMedio: "2E6DA4", azulClaro: "D6E4F0",
        verde: "1A7F4B", verdeClaro: "D4EFDF", rojo: "C0392B", rojoClaro: "FADBD8",
        grisHeader: "F2F3F4", blanco: "FFFFFF", negro: "1A1A1A", amarilloClaro: "FDEBD0",
      };
      const argb = (hex: string) => `FF${hex.toUpperCase()}`;

      const ExcelJSMod = await import("exceljs");
      const EJS = (ExcelJSMod as any).default ?? ExcelJSMod;
      const wb = new EJS.Workbook();
      wb.creator = "Zentry"; wb.created = new Date();
      const mesNombre = mesLargo(reportMonth);

      const styleH = (row: any, bg = C.azulOscuro, fg = C.blanco) =>
        row.eachCell((cell: any) => {
          cell.font = { bold: true, color: { argb: argb(fg) }, size: 11 };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(bg) } };
          cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
          cell.border = { bottom: { style: "thin", color: { argb: argb(C.azulMedio) } } };
        });
      const styleD = (row: any, even: boolean) =>
        row.eachCell((cell: any) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(even ? C.grisHeader : C.blanco) } };
          cell.alignment = { vertical: "middle" };
          cell.font = { size: 10, color: { argb: argb(C.negro) } };
        });
      const styleT = (row: any) =>
        row.eachCell((cell: any) => {
          cell.font = { bold: true, size: 11, color: { argb: argb(C.blanco) } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(C.azulMedio) } };
          cell.alignment = { vertical: "middle", horizontal: "center" };
        });

      // ── HOJA 1: RESUMEN ──
      const wsR = wb.addWorksheet("Resumen", { tabColor: { argb: argb(C.azulOscuro) } });
      wsR.columns = [{ width: 3 }, { width: 22 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 3 }];
      wsR.mergeCells("B2:F2");
      Object.assign(wsR.getCell("B2"), { value: `REPORTE DE COBRANZA — ${mesNombre}`,
        font: { bold: true, size: 18, color: { argb: argb(C.blanco) } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: argb(C.azulOscuro) } },
        alignment: { horizontal: "center", vertical: "middle" } });
      wsR.getRow(2).height = 40;
      wsR.mergeCells("B3:F3");
      Object.assign(wsR.getCell("B3"), { value: `Generado el ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}`,
        font: { size: 10, color: { argb: argb(C.blanco) }, italic: true },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: argb(C.azulMedio) } },
        alignment: { horizontal: "center", vertical: "middle" } });
      wsR.getRow(3).height = 20; wsR.getRow(4).height = 10;
      const kL = wsR.getRow(5);
      kL.values = ["", "CASAS ACTIVAS", "RECAUDADO EN EL MES", "DEUDA ACUMULADA", "CASAS PAGARON", "% COBRANZA"];
      styleH(kL, C.azulOscuro); kL.height = 22;
      const kV = wsR.getRow(6);
      kV.values = ["", totalCasas, fmtMXN(totalRecaudado), fmtMXN(totalDeuda), `${casasQuePagaron}/${totalCasas}`, `${pctCobranza}%`];
      kV.eachCell((cell: any, col: number) => {
        if (col < 2) return;
        const bg = col === 3 ? C.verdeClaro : col === 4 ? C.rojoClaro : col === 6 ? (pctCobranza >= 70 ? C.verdeClaro : C.amarilloClaro) : C.grisHeader;
        cell.font = { bold: true, size: 14 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(bg) } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
      kV.height = 36; wsR.getRow(7).height = 10;
      wsR.mergeCells("B8:F8");
      Object.assign(wsR.getCell("B8"), { value: "DESGLOSE DEL RECAUDADO",
        font: { bold: true, size: 11, color: { argb: argb(C.blanco) } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: argb(C.azulMedio) } },
        alignment: { horizontal: "center", vertical: "middle" } });
      wsR.getRow(8).height = 22;
      [
        ["Para cuota de " + mesCorto(reportMonth), fmtMXN(paraMesActualCents), "Pagos que liquidan la cuota del mes"],
        ["Para meses anteriores", fmtMXN(paraOtrosMesesCents), "Catch-up de adeudos pasados"],
        ["Total recaudado", fmtMXN(totalRecaudado), "Suma total de efectivo recibido"],
      ].forEach(([label, valor, nota], i) => {
        const row = wsR.getRow(9 + i);
        row.getCell(2).value = label; row.getCell(3).value = valor; row.getCell(5).value = nota;
        row.getCell(2).font = { bold: i === 2, size: 10 };
        row.getCell(3).font = { bold: i === 2, size: 11 };
        row.getCell(5).font = { italic: true, size: 9, color: { argb: argb("777777") } };
        const bg = i === 2 ? C.azulClaro : i % 2 === 0 ? C.blanco : C.grisHeader;
        [2, 3, 4, 5].forEach((c) => { row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(bg) } }; });
        row.height = 20;
      });

      // ── HOJA 2: PAGARON ──
      const wsP = wb.addWorksheet("Pagaron", { tabColor: { argb: argb(C.verde) } });
      wsP.columns = [{ width: 3 }, { width: 28 }, { width: 24 }, { width: 16 }, { width: 14 }, { width: 36 }, { width: 3 }];
      wsP.mergeCells("B2:F2");
      Object.assign(wsP.getCell("B2"), { value: `CASAS QUE PAGARON — ${mesNombre}`,
        font: { bold: true, size: 14, color: { argb: argb(C.blanco) } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: argb(C.verde) } },
        alignment: { horizontal: "center", vertical: "middle" } });
      wsP.getRow(2).height = 35;
      wsP.mergeCells("B3:F3");
      Object.assign(wsP.getCell("B3"), { value: `${casasQuePagaron} casas  ·  Total: ${fmtMXN(totalRecaudado)}`,
        font: { size: 10, color: { argb: argb(C.blanco) }, italic: true },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: argb("27AE60") } },
        alignment: { horizontal: "center", vertical: "middle" } });
      wsP.getRow(3).height = 18; wsP.getRow(4).height = 8;
      const pH = wsP.getRow(5);
      pH.values = ["", "Casa", "Residente", "Pagado ($)", "Fecha de pago", "Meses cubiertos"];
      styleH(pH, C.verde); pH.height = 20;
      const pagadores = rows.filter((h) => h.pagadoCents > 0).sort((a, b) => a.label.localeCompare(b.label));
      pagadores.forEach((h, i) => {
        const row = wsP.getRow(6 + i);
        row.values = ["", h.label, h.residentName, fmtMXN(h.pagadoCents), h.fechaPago || "", h.mesesCubiertos.map(mesCorto).join("  |  ")];
        styleD(row, i % 2 === 0);
        if (h.mesesCubiertos.length > 1) row.getCell(6).font = { size: 10, bold: true, color: { argb: argb(C.azulMedio) } };
        if (h.cubreMes) row.getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(C.verdeClaro) } };
        row.height = 18;
      });
      const pTot = wsP.getRow(6 + pagadores.length);
      pTot.values = ["", "TOTAL", `${pagadores.length} casas`, fmtMXN(totalRecaudado), "", ""];
      styleT(pTot); pTot.height = 22;

      // ── HOJA 3: PENDIENTES ──
      const wsPe = wb.addWorksheet("Pendientes", { tabColor: { argb: argb(C.rojo) } });
      wsPe.columns = [{ width: 3 }, { width: 28 }, { width: 24 }, { width: 18 }, { width: 16 }, { width: 3 }];
      wsPe.mergeCells("B2:E2");
      Object.assign(wsPe.getCell("B2"), { value: `PENDIENTES DE PAGO — ${mesNombre}`,
        font: { bold: true, size: 14, color: { argb: argb(C.blanco) } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: argb(C.rojo) } },
        alignment: { horizontal: "center", vertical: "middle" } });
      wsPe.getRow(2).height = 35;
      wsPe.mergeCells("B3:E3");
      Object.assign(wsPe.getCell("B3"), { value: `${rows.length - casasQuePagaron} casas sin pago  ·  Deuda total: ${fmtMXN(totalDeuda)}`,
        font: { size: 10, color: { argb: argb(C.blanco) }, italic: true },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: argb("E74C3C") } },
        alignment: { horizontal: "center", vertical: "middle" } });
      wsPe.getRow(3).height = 18; wsPe.getRow(4).height = 8;
      const peH = wsPe.getRow(5);
      peH.values = ["", "Casa", "Residente", "Deuda acumulada ($)", "Último pago"];
      styleH(peH, C.rojo); peH.height = 20;
      const pendientes = rows.filter((h) => h.pagadoCents === 0).sort((a, b) => b.deudaCents - a.deudaCents);
      pendientes.forEach((h, i) => {
        const row = wsPe.getRow(6 + i);
        row.values = ["", h.label, h.residentName, h.deudaCents > 0 ? fmtMXN(h.deudaCents) : "Al día", ""];
        styleD(row, i % 2 === 0);
        if (h.deudaCents > 230000) {
          row.getCell(4).font = { bold: true, size: 10, color: { argb: argb(C.rojo) } };
          row.getCell(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(C.rojoClaro) } };
        }
        row.height = 18;
      });
      const peTot = wsPe.getRow(6 + pendientes.length);
      peTot.values = ["", "TOTAL", `${pendientes.length} casas`, fmtMXN(totalDeuda), ""];
      styleT(peTot); peTot.height = 22;

      // ── HOJA 4: ESTADO COMPLETO ──
      const wsA = wb.addWorksheet("Estado Completo", { tabColor: { argb: argb(C.azulMedio) } });
      wsA.columns = [{ width: 3 }, { width: 28 }, { width: 24 }, { width: 12 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 36 }, { width: 3 }];
      wsA.mergeCells("B2:I2");
      Object.assign(wsA.getCell("B2"), { value: `ESTADO COMPLETO — ${mesNombre}`,
        font: { bold: true, size: 14, color: { argb: argb(C.blanco) } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: argb(C.azulOscuro) } },
        alignment: { horizontal: "center", vertical: "middle" } });
      wsA.getRow(2).height = 35; wsA.getRow(3).height = 8;
      const aH = wsA.getRow(4);
      aH.values = ["", "Casa", "Residente", "Estado", "Deuda ($)", "A Favor ($)", `Pagado ${mesCorto(reportMonth)} ($)`, "Fecha de pago", "Meses cubiertos"];
      styleH(aH, C.azulOscuro); aH.height = 22;
      const sorted = [...rows].sort((a, b) => a.status !== b.status ? (a.status === "con_deuda" ? -1 : 1) : b.deudaCents - a.deudaCents);
      sorted.forEach((h, i) => {
        const row = wsA.getRow(5 + i);
        row.values = ["", h.label, h.residentName, h.status === "con_deuda" ? "Con deuda" : "Al día",
          h.deudaCents > 0 ? fmtMXN(h.deudaCents) : "-",
          h.saldoAFavorCents > 0 ? fmtMXN(h.saldoAFavorCents) : "-",
          h.pagadoCents > 0 ? fmtMXN(h.pagadoCents) : "-",
          h.fechaPago || "-",
          h.mesesCubiertos.length > 0 ? h.mesesCubiertos.map(mesCorto).join("  |  ") : "-"];
        styleD(row, i % 2 === 0);
        const ec = row.getCell(4);
        ec.alignment = { horizontal: "center", vertical: "middle" };
        if (h.status === "con_deuda") {
          ec.font = { bold: true, size: 10, color: { argb: argb(C.rojo) } };
          ec.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(C.rojoClaro) } };
        } else {
          ec.font = { bold: true, size: 10, color: { argb: argb(C.verde) } };
          ec.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(C.verdeClaro) } };
        }
        row.height = 18;
      });
      const aTot = wsA.getRow(5 + sorted.length);
      aTot.values = ["", "TOTALES", `${totalCasas} casas`, "", fmtMXN(totalDeuda), "", fmtMXN(totalRecaudado), "", ""];
      styleT(aTot); aTot.height = 22;

      wsP.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }];
      wsPe.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }];
      wsA.views = [{ state: "frozen", xSplit: 0, ySplit: 4 }];

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = `reporte-cobranza-${reportMonth.replace("-", "")}.xlsx`;
      a.click();
      URL.revokeObjectURL(dlUrl);
    } catch (e: any) {
      toast.error(e?.message || "Error al generar Excel");
    } finally {
      setExporting(false);
    }
  };

  const filtered = useMemo(() => {
    let list = houses;
    if (filter !== "all")
      list = list.filter((h) => normalizeStatus(h) === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (h) =>
          h.label.toLowerCase().includes(q) ||
          h.residentName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [houses, filter, search]);

  return (
    <Card className="border-none shadow-zentry-lg bg-white rounded-[2rem] overflow-hidden">
      <CardHeader className="px-6 pt-5 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              {
                key: "all",
                label: "Todas",
                count: houses.length,
                dot: "bg-slate-400",
              },
              {
                key: "al_dia",
                label: "Al día",
                count: counts.al_dia,
                dot: "bg-emerald-500",
                active: "text-emerald-700 bg-emerald-50",
              },
              {
                key: "con_deuda",
                label: "Con deuda",
                count: counts.con_deuda,
                dot: "bg-red-500",
                active: "text-red-700 bg-red-50",
              },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                  filter === f.key
                    ? (f.active || "text-slate-800 bg-slate-100") + " shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${f.dot}`} />
                {f.label} ({f.count})
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 w-48 text-sm rounded-xl border-slate-200"
              />
            </div>
            <div className="flex items-center h-9 border border-slate-200 rounded-xl overflow-hidden text-xs font-bold text-slate-600">
              <button
                onClick={() =>
                  setMonthIdx((i) => Math.min(i + 1, MONTH_OPTIONS.length - 1))
                }
                className="px-2 h-full hover:bg-slate-100 transition-colors disabled:opacity-30"
                disabled={monthIdx >= MONTH_OPTIONS.length - 1}
              >
                ‹
              </button>
              <span className="px-2 whitespace-nowrap">
                {MONTH_OPTIONS[monthIdx].label}
              </span>
              <button
                onClick={() => setMonthIdx((i) => Math.max(i - 1, 0))}
                className="px-2 h-full hover:bg-slate-100 transition-colors disabled:opacity-30"
                disabled={monthIdx === 0}
              >
                ›
              </button>
            </div>
            <button
              onClick={exportExcel}
              disabled={exporting}
              className="h-9 px-3 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              title="Exportar Excel"
            >
              {exporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Excel
            </button>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-400"}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-400"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {loadingHouses ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-11 rounded-lg" />
            ))}
          </div>
        ) : viewMode === "list" ? (
          <ScrollArea className="h-[500px]">
            <table className="w-full">
              <thead>
                <tr className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b sticky top-0 bg-white/90 backdrop-blur">
                  <th className="text-left py-2.5 pl-2 w-8"></th>
                  <th className="text-left py-2.5">Casa</th>
                  <th className="text-left py-2.5">Residente</th>
                  <th className="text-left py-2.5">Estado</th>
                  <th className="text-right py-2.5">Deuda</th>
                  <th className="text-right py-2.5 pr-2">A favor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => (
                  <tr
                    key={h.houseId}
                    onClick={() => onSelectHouse(h)}
                    className="border-b border-slate-50 hover:bg-primary/5 cursor-pointer transition-colors text-sm"
                  >
                    <td className="py-2.5 pl-2">
                      <div
                        className={`h-3 w-3 rounded-full ${statusDot[normalizeStatus(h)]}`}
                      />
                    </td>
                    <td className="py-2.5 font-bold text-slate-800">
                      {h.label}
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {h.residentName}
                    </td>
                    <td className="py-2.5">
                      <Badge
                        className={`text-[10px] font-bold border-0 rounded-md px-2 ${normalizeStatus(h) === "con_deuda" ? "text-red-700 bg-red-100" : "text-emerald-700 bg-emerald-100"}`}
                      >
                        {statusLabel[normalizeStatus(h)]}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right font-bold">
                      {h.deudaCents > 0 ? (
                        <span className="text-red-600">
                          {fmtFull(h.deudaCents)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right pr-2 font-bold">
                      {h.saldoAFavorCents > 0 ? (
                        <span className="text-emerald-600">
                          +{fmtFull(h.saldoAFavorCents)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-12 text-sm">
                Sin resultados
              </p>
            )}
          </ScrollArea>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
              {filtered.map((h) => (
                <div
                  key={h.houseId}
                  onClick={() => onSelectHouse(h)}
                  className={`p-3 rounded-xl border cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all text-center ${
                    normalizeStatus(h) === "con_deuda"
                      ? "border-red-200 bg-red-50/60"
                      : "border-emerald-200 bg-emerald-50/60"
                  }`}
                >
                  <div className="font-black text-sm text-slate-800">
                    {h.label}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {h.residentName || "—"}
                  </div>
                  <Badge
                    className={`mt-2 text-[9px] font-bold border-0 rounded-md px-1.5 ${normalizeStatus(h) === "con_deuda" ? "text-red-700 bg-red-100" : "text-emerald-700 bg-emerald-100"}`}
                  >
                    {statusLabel[normalizeStatus(h)]}
                  </Badge>
                  {h.deudaCents > 0 && (
                    <div className="text-[10px] font-black text-red-600 mt-1">
                      {fmtFull(h.deudaCents)}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-12 text-sm">
                Sin resultados
              </p>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
