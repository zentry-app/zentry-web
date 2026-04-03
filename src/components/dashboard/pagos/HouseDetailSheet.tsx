"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  Minus,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  XCircle,
  RotateCcw,
  Ban,
  Pencil,
  Printer,
} from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { HouseStatus } from "./payments-types";
import { fmtFull } from "./payments-types";
import {
  CatalogService,
  type PenaltyRule,
} from "@/lib/services/catalog-service";
import { generateReceiptPDF } from "@/lib/utils/generate-receipt-pdf";

interface HouseDetailSheetProps {
  open: boolean;
  onClose: () => void;
  residencialId: string;
  house: HouseStatus;
  onAction?: () => void;
}

interface AgingData {
  bucket_0_30_cents: number;
  bucket_31_60_cents: number;
  bucket_61_90_cents: number;
  bucket_91plus_cents: number;
  totalOverdueCents: number;
}

interface LedgerEntry {
  id: string;
  type: string;
  subType?: string;
  description: string;
  amount: number;
  amountInCents?: number;
  impact: string;
  status: string;
  createdAt: any;
  referenceId?: string;
  folio?: string;
  periodKey?: string;
  createdBy?: string;
  reversalReason?: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  al_dia: {
    label: "Al día",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
  con_deuda: {
    label: "Con deuda",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
  },
};

const entryIcon: Record<string, { icon: any; color: string }> = {
  PAYOUT: { icon: TrendingDown, color: "text-emerald-600 bg-emerald-50" },
  CHARGE: { icon: TrendingUp, color: "text-red-500 bg-red-50" },
  ADJUSTMENT: { icon: DollarSign, color: "text-blue-500 bg-blue-50" },
  REVERSAL: { icon: RotateCcw, color: "text-slate-500 bg-slate-100" },
};

export default function HouseDetailSheet({
  open,
  onClose,
  residencialId,
  house,
  onAction,
}: HouseDetailSheetProps) {
  const [aging, setAging] = useState<AgingData | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loadingAging, setLoadingAging] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(true);

  // Action dialogs
  const [actionType, setActionType] = useState<
    "condonar" | "multa" | "cargo" | null
  >(null);
  const [actionAmount, setActionAmount] = useState("");
  const [actionReason, setActionReason] = useState("");

  // Penalty rules for multa selector
  const [penaltyRules, setPenaltyRules] = useState<PenaltyRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  // Reversal
  const [reversalEntry, setReversalEntry] = useState<LedgerEntry | null>(null);
  const [reversalReason, setReversalReason] = useState("");
  const [reversing, setReversing] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Fiscal data for receipt PDF
  const [fiscalInfo, setFiscalInfo] = useState<{
    razonSocial?: string;
    rfc?: string;
    domicilioFiscal?: string;
    nombre?: string;
    direccion?: string;
  }>({});

  useEffect(() => {
    if (!residencialId) return;
    getDoc(doc(db, "residenciales", residencialId))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setFiscalInfo({
            razonSocial: d.datosFiscales?.razonSocial || "",
            rfc: d.datosFiscales?.rfc || "",
            domicilioFiscal: d.datosFiscales?.domicilioFiscal || "",
            nombre: d.nombre || "",
            direccion: d.direccion || "",
          });
        }
      })
      .catch(() => {});
  }, [residencialId]);

  const loadSheetData = useCallback(() => {
    setLoadingAging(true);
    setLoadingLedger(true);

    httpsCallable<any, AgingData>(
      functions,
      "getHouseAging",
    )({ residencialId, houseId: house.houseId })
      .then((res) => setAging(res.data))
      .catch(() => setAging(null))
      .finally(() => setLoadingAging(false));

    const ledgerRef = collection(
      db,
      "residenciales",
      residencialId,
      "houses",
      house.houseId,
      "ledger",
    );
    const q = query(ledgerRef, orderBy("createdAt", "desc"), limit(30));
    getDocs(q)
      .then((snap) => {
        setLedger(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as LedgerEntry),
        );
      })
      .catch(() => setLedger([]))
      .finally(() => setLoadingLedger(false));
  }, [residencialId, house.houseId]);

  useEffect(() => {
    if (!open) return;
    loadSheetData();
    // Load penalty rules once for the multa selector
    if (penaltyRules.length === 0) {
      CatalogService.getPenaltyRules(residencialId)
        .then((rules) => setPenaltyRules(rules.filter((r) => r.active)))
        .catch(() => {});
    }
  }, [open, loadSheetData, residencialId, penaltyRules.length]);

  const handleAction = async () => {
    const amt = parseFloat(actionAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Monto inválido");
      return;
    }
    if (!actionReason.trim() && actionType !== "cargo") {
      toast.error("Ingresa un motivo");
      return;
    }

    setActionSubmitting(true);
    try {
      if (actionType === "condonar") {
        await httpsCallable(
          functions,
          "apiAdjustBalance",
        )({
          residencialId,
          houseId: house.houseId,
          amount: Math.round(amt * 100),
          isDecrease: true,
          reason: actionReason.trim(),
        });
        toast.success("Condonación aplicada");
      } else if (actionType === "multa") {
        const rule = penaltyRules.find((r) => r.id === selectedRuleId);
        await httpsCallable(
          functions,
          "apiAdjustBalance",
        )({
          residencialId,
          houseId: house.houseId,
          amount: Math.round(amt * 100),
          isDecrease: false,
          reason: actionReason.trim(),
          subType: "penalty",
          ...(rule && { penaltyRuleId: rule.id, penaltyRuleName: rule.name }),
        });
        toast.success("Multa aplicada");
      } else if (actionType === "cargo") {
        await httpsCallable(
          functions,
          "apiCreateExtraordinaryFee",
        )({
          residencialId,
          houseId: house.houseId,
          amountCents: Math.round(amt * 100),
          description: actionReason.trim() || "Cargo extraordinario",
        });
        toast.success("Cargo extraordinario aplicado");
      }
      setActionType(null);
      setActionAmount("");
      setActionReason("");
      setSelectedRuleId(null);
      // Refresh sheet data after 1.5s (Firestore propagation)
      setTimeout(() => loadSheetData(), 1500);
      onAction?.();
    } catch (err: any) {
      toast.error(
        err?.message?.includes("]")
          ? err.message.split("]").pop()
          : "Error al aplicar",
      );
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleReversal = async () => {
    if (!reversalEntry || !reversalReason.trim()) {
      toast.error("Ingresa un motivo de reversión");
      return;
    }
    // The referenceId of the ledger entry points to the paymentIntent ID
    const paymentId = reversalEntry.referenceId;
    if (!paymentId) {
      toast.error("Este movimiento no tiene un pago asociado para reversar");
      return;
    }
    setReversing(true);
    try {
      await httpsCallable(
        functions,
        "apiReversePayment",
      )({
        residencialId,
        paymentId,
        reason: reversalReason.trim(),
      });
      toast.success("Pago reversado correctamente");
      setReversalEntry(null);
      setReversalReason("");
      setTimeout(() => loadSheetData(), 1500);
      onAction?.();
    } catch (err: any) {
      toast.error(
        err?.message?.includes("]")
          ? err.message.split("]").pop()
          : "Error al reversar",
      );
    } finally {
      setReversing(false);
    }
  };

  const printReceipt = async (entry: LedgerEntry) => {
    const amt = entry.amountInCents || entry.amount || 0;
    const date = entry.createdAt?.toDate
      ? entry.createdAt.toDate()
      : entry.createdAt?.seconds
        ? new Date(entry.createdAt.seconds * 1000)
        : new Date();

    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    const dateStr = `${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
    const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

    await generateReceiptPDF({
      folio: entry.folio || "---",
      houseId: house.houseId || house.label || "",
      payerName: house.residentName || "",
      concept: entry.description || entry.subType || "Pago",
      amountCents: amt,
      method:
        entry.subType === "cash_payment"
          ? "Efectivo"
          : entry.subType === "transfer_payment"
            ? "Transferencia"
            : "Pago",
      timestamp: `${dateStr} · ${timeStr}`,
      isAdmin: true,
      residencialName: fiscalInfo.nombre,
      residencialAddress: fiscalInfo.direccion,
      razonSocial: fiscalInfo.razonSocial,
      rfc: fiscalInfo.rfc,
      domicilioFiscal: fiscalInfo.domicilioFiscal,
    });
  };

  const houseDisplayStatus =
    (house.deudaCents || 0) > 0 ? "con_deuda" : "al_dia";
  const cfg = statusConfig[houseDisplayStatus];

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] rounded-[2rem] border-none shadow-2xl bg-white p-0 overflow-hidden flex flex-col">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-black text-slate-900">
                  {house.label}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground font-medium mt-0.5">
                  {house.residentName}
                </DialogDescription>
              </div>
              <Badge
                className={`${cfg.bg} ${cfg.color} font-bold border rounded-lg px-3 py-1`}
              >
                {cfg.label}
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Balance card — uses live data from ledger when available */}
              {(() => {
                // Compute live balance from ledger entries if loaded
                const liveDebt =
                  ledger.length > 0
                    ? ledger
                        .filter(
                          (e) =>
                            e.status !== "reversed" && e.type !== "REVERSAL",
                        )
                        .reduce((sum, e) => {
                          const amt = e.amountInCents || e.amount || 0;
                          if (e.impact === "INCREASE_DEBT") return sum + amt;
                          if (e.impact === "DECREASE_DEBT") return sum - amt;
                          return sum;
                        }, 0)
                    : null;
                const displayDebt =
                  liveDebt !== null ? Math.max(0, liveDebt) : house.deudaCents;
                const displayFavor =
                  liveDebt !== null
                    ? Math.max(0, -liveDebt)
                    : house.saldoAFavorCents;
                const isRefreshing = loadingAging || loadingLedger;

                return (
                  <div
                    className={`p-5 rounded-2xl border transition-all ${isRefreshing ? "animate-pulse" : ""} ${displayDebt > 0 ? "border-red-200 bg-red-50/50" : displayFavor > 0 ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50/50"}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        Balance actual
                      </p>
                      {isRefreshing && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    <p
                      className={`text-3xl font-black mt-1 ${displayDebt > 0 ? "text-red-600" : displayFavor > 0 ? "text-emerald-600" : "text-slate-800"}`}
                    >
                      {displayDebt > 0
                        ? `-${fmtFull(displayDebt)}`
                        : displayFavor > 0
                          ? `+${fmtFull(displayFavor)}`
                          : "$0"}
                    </p>
                    {house.ultimoPago && (
                      <p className="text-[11px] text-muted-foreground mt-2">
                        Último pago:{" "}
                        {new Date(house.ultimoPago).toLocaleDateString(
                          "es-MX",
                          { day: "numeric", month: "short", year: "numeric" },
                        )}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Aging buckets */}
              {house.deudaCents > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    Antigüedad de deuda
                  </p>
                  {loadingAging ? (
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-xl" />
                      ))}
                    </div>
                  ) : aging ? (
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        {
                          label: "0-30d",
                          value: aging.bucket_0_30_cents,
                          color: "text-amber-600 bg-amber-50 border-amber-200",
                        },
                        {
                          label: "31-60d",
                          value: aging.bucket_31_60_cents,
                          color:
                            "text-orange-600 bg-orange-50 border-orange-200",
                        },
                        {
                          label: "61-90d",
                          value: aging.bucket_61_90_cents,
                          color: "text-red-600 bg-red-50 border-red-200",
                        },
                        {
                          label: "90+d",
                          value: aging.bucket_91plus_cents,
                          color: "text-red-800 bg-red-100 border-red-300",
                        },
                      ].map((b) => (
                        <div
                          key={b.label}
                          className={`p-3 rounded-xl border text-center ${b.color}`}
                        >
                          <p className="text-[10px] font-bold uppercase">
                            {b.label}
                          </p>
                          <p className="text-sm font-black mt-0.5">
                            {b.value > 0 ? fmtFull(b.value) : "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Ledger timeline */}
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
                  Historial de movimientos
                </p>
                {loadingLedger ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 rounded-xl" />
                    ))}
                  </div>
                ) : ledger.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    Sin movimientos registrados
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {ledger.map((e) => {
                      const isReversed = e.status === "reversed";
                      const isReversal = e.type === "REVERSAL";
                      const iconCfg = entryIcon[e.type] || entryIcon.ADJUSTMENT;
                      const Icon = iconCfg.icon;
                      const amt = e.amountInCents || e.amount || 0;
                      const isCredit = e.impact === "DECREASE_DEBT";
                      const isNoImpact = e.impact === "NO_IMPACT";
                      const date = e.createdAt?.toDate
                        ? e.createdAt.toDate()
                        : e.createdAt?.seconds
                          ? new Date(e.createdAt.seconds * 1000)
                          : null;
                      const canReverse =
                        e.type === "PAYOUT" &&
                        e.status === "applied" &&
                        e.referenceId &&
                        !isReversed;

                      return (
                        <div
                          key={e.id}
                          className={`relative group p-3 rounded-xl border transition-all ${
                            isReversed
                              ? "bg-slate-100/50 border-dashed border-slate-300 opacity-60"
                              : isReversal
                                ? "bg-amber-50/50 border-amber-200"
                                : "bg-slate-50/80 border-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-8 w-8 rounded-lg ${isReversed ? "bg-slate-200 text-slate-400" : iconCfg.color} flex items-center justify-center shrink-0`}
                            >
                              {isReversed ? (
                                <Ban className="h-4 w-4" />
                              ) : (
                                <Icon className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p
                                  className={`text-xs font-bold truncate ${isReversed ? "line-through text-slate-400" : "text-slate-800"}`}
                                >
                                  {e.description || e.subType || e.type}
                                </p>
                                {e.folio && (
                                  <span
                                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                      isReversed
                                        ? "bg-slate-200 text-slate-400 line-through"
                                        : "text-primary bg-primary/10"
                                    }`}
                                  >
                                    {e.folio}
                                  </span>
                                )}
                                {isReversed && (
                                  <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded shrink-0">
                                    REVERSADO
                                  </span>
                                )}
                                {isReversal && (
                                  <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                                    REVERSIÓN
                                  </span>
                                )}
                                {e.subType === "penalty" && (
                                  <span className="text-[9px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded shrink-0">
                                    MULTA
                                  </span>
                                )}
                                {isNoImpact && (
                                  <span className="text-[9px] font-bold text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded shrink-0">
                                    PRODUCTO
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {date && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {date.toLocaleDateString("es-MX", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                )}
                                {e.periodKey && (
                                  <span className="text-[10px] text-muted-foreground">
                                    · {e.periodKey}
                                  </span>
                                )}
                                {e.reversalReason && (
                                  <span className="text-[10px] text-amber-600">
                                    · {e.reversalReason}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-sm font-black ${
                                  isReversed
                                    ? "line-through text-slate-400"
                                    : isCredit
                                      ? "text-emerald-600"
                                      : "text-red-600"
                                }`}
                              >
                                {isCredit ? "-" : "+"}
                                {fmtFull(amt)}
                              </span>
                              {/* Print receipt — entries with folio */}
                              {e.folio && !isReversed && (
                                <button
                                  onClick={() => printReceipt(e)}
                                  className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-lg bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-all"
                                  title="Imprimir recibo"
                                >
                                  <Printer className="h-3.5 w-3.5 text-blue-700" />
                                </button>
                              )}
                              {/* Reverse button — only on applied PAYOUT entries */}
                              {canReverse && (
                                <button
                                  onClick={() => {
                                    setReversalEntry(e);
                                    setReversalReason("");
                                  }}
                                  className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-lg bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-all"
                                  title="Reversar pago"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 text-amber-700" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons (sticky footer) */}
          <div className="border-t px-6 py-4 flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-xl font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              onClick={() => setActionType("condonar")}
            >
              <Minus className="h-3.5 w-3.5 mr-1.5" />
              Condonar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-xl font-bold text-red-700 border-red-200 hover:bg-red-50"
              onClick={() => setActionType("multa")}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Multa
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-xl font-bold text-blue-700 border-blue-200 hover:bg-blue-50"
              onClick={() => setActionType("cargo")}
            >
              <Receipt className="h-3.5 w-3.5 mr-1.5" />
              Cargo extra
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      {actionType && (
        <Dialog
          open={!!actionType}
          onOpenChange={(o) => {
            if (!o) {
              setActionType(null);
              setActionAmount("");
              setActionReason("");
              setSelectedRuleId(null);
            }
          }}
        >
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-black">
                {actionType === "condonar"
                  ? "Condonar deuda"
                  : actionType === "multa"
                    ? "Aplicar multa"
                    : "Cargo extraordinario"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Casa <strong>{house.label}</strong> · {house.residentName}
              </p>

              {/* Penalty rule selector — only for multas */}
              {actionType === "multa" && penaltyRules.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    Tipo de multa
                  </label>
                  <div className="mt-2 space-y-1.5">
                    {penaltyRules.map((rule) => {
                      const isSelected = selectedRuleId === rule.id;
                      const displayAmount =
                        rule.type === "percentage"
                          ? `${rule.amountCents}%`
                          : `$${(rule.amountCents / 100).toLocaleString("es-MX")}`;
                      return (
                        <button
                          key={rule.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedRuleId(null);
                              setActionAmount("");
                              setActionReason("");
                            } else {
                              setSelectedRuleId(rule.id);
                              if (rule.type === "fixed") {
                                setActionAmount(
                                  (rule.amountCents / 100).toString(),
                                );
                              }
                              setActionReason(rule.name);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? "border-red-500 bg-red-50"
                              : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "bg-red-500 text-white"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p
                                className={`text-sm font-bold truncate ${isSelected ? "text-red-700" : "text-slate-700"}`}
                              >
                                {rule.name}
                              </p>
                              {rule.description && (
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {rule.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-sm font-black shrink-0 ml-2 ${isSelected ? "text-red-600" : "text-slate-500"}`}
                          >
                            {displayAmount}
                          </span>
                        </button>
                      );
                    })}
                    {/* Custom option */}
                    <button
                      onClick={() => {
                        setSelectedRuleId(null);
                        setActionAmount("");
                        setActionReason("");
                      }}
                      className={`w-full flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left ${
                        actionType === "multa" && !selectedRuleId
                          ? "border-red-500 bg-red-50"
                          : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                      }`}
                    >
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                          !selectedRuleId
                            ? "bg-red-500 text-white"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </div>
                      <p
                        className={`text-sm font-bold ${!selectedRuleId ? "text-red-700" : "text-slate-500"}`}
                      >
                        Multa personalizada
                      </p>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Monto ($)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className="mt-1 h-12 rounded-xl font-bold text-lg"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  {actionType === "cargo" ? "Descripción" : "Motivo"}
                </label>
                <Input
                  placeholder={
                    actionType === "condonar"
                      ? "Ej: Acuerdo con residente"
                      : actionType === "multa"
                        ? "Ej: Ruido excesivo"
                        : "Ej: Reparación ventana"
                  }
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="mt-1 h-10 rounded-xl"
                />
              </div>
              <Button
                className={`w-full h-11 rounded-xl font-black text-white ${
                  actionType === "condonar"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : actionType === "multa"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-blue-600 hover:bg-blue-700"
                }`}
                onClick={handleAction}
                disabled={actionSubmitting || !actionAmount}
              >
                {actionSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {actionType === "condonar"
                  ? "Aplicar condonación"
                  : actionType === "multa"
                    ? "Aplicar multa"
                    : "Crear cargo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Reversal Dialog */}
      {reversalEntry && (
        <Dialog
          open={!!reversalEntry}
          onOpenChange={(o) => {
            if (!o) {
              setReversalEntry(null);
              setReversalReason("");
            }
          }}
        >
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-black flex items-center gap-2 text-amber-700">
                <RotateCcw className="h-5 w-5" />
                Reversar pago
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-800 mb-2">
                  Esta acción es irreversible y quedará registrada en el
                  historial de auditoría.
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-600">Folio</span>
                    <span className="font-mono font-bold text-amber-800">
                      {reversalEntry.folio || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-600">Monto</span>
                    <span className="font-black text-amber-800">
                      {fmtFull(
                        reversalEntry.amountInCents || reversalEntry.amount,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-600">Tipo</span>
                    <span className="font-bold text-amber-800">
                      {reversalEntry.subType === "cash_payment"
                        ? "Efectivo"
                        : "Transferencia"}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Motivo de reversión *
                </label>
                <Input
                  placeholder="Ej: Monto incorrecto, debió ser $1,150"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="mt-1 h-10 rounded-xl"
                />
              </div>
              <Button
                className="w-full h-11 rounded-xl font-black bg-amber-600 hover:bg-amber-700"
                onClick={handleReversal}
                disabled={reversing || !reversalReason.trim()}
              >
                {reversing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Confirmar reversión
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
