"use client";

import { useState, useEffect } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  AlertTriangle, CheckCircle, Clock, DollarSign, Loader2, Minus, Plus,
  Receipt, TrendingDown, TrendingUp, XCircle,
} from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import { collection, query, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { HouseStatus } from "./payments-types";
import { fmtFull } from "./payments-types";

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
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  al_dia:    { label: "Al día",  color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  pendiente: { label: "Debe",    color: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
  moroso:    { label: "Moroso",  color: "text-red-700",     bg: "bg-red-50 border-red-200" },
};

const entryIcon: Record<string, { icon: any; color: string }> = {
  PAYOUT:     { icon: TrendingDown, color: "text-emerald-600 bg-emerald-50" },
  CHARGE:     { icon: TrendingUp,   color: "text-red-500 bg-red-50" },
  ADJUSTMENT: { icon: DollarSign,   color: "text-blue-500 bg-blue-50" },
};

export default function HouseDetailSheet({ open, onClose, residencialId, house, onAction }: HouseDetailSheetProps) {
  const [aging, setAging] = useState<AgingData | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loadingAging, setLoadingAging] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(true);

  // Action dialogs
  const [actionType, setActionType] = useState<"condonar" | "multa" | "cargo" | null>(null);
  const [actionAmount, setActionAmount] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingAging(true);
    setLoadingLedger(true);

    // Fetch aging
    httpsCallable<any, AgingData>(functions, "getHouseAging")({ residencialId, houseId: house.houseId })
      .then(res => setAging(res.data))
      .catch(() => setAging(null))
      .finally(() => setLoadingAging(false));

    // Fetch ledger entries
    const ledgerRef = collection(db, "residenciales", residencialId, "houses", house.houseId, "ledger");
    const q = query(ledgerRef, orderBy("createdAt", "desc"), limit(30));
    getDocs(q).then(snap => {
      setLedger(snap.docs.map(d => ({ id: d.id, ...d.data() } as LedgerEntry)));
    }).catch(() => setLedger([]))
      .finally(() => setLoadingLedger(false));
  }, [open, residencialId, house.houseId]);

  const handleAction = async () => {
    const amt = parseFloat(actionAmount);
    if (isNaN(amt) || amt <= 0) { toast.error("Monto inválido"); return; }
    if (!actionReason.trim() && actionType !== "cargo") { toast.error("Ingresa un motivo"); return; }

    setActionSubmitting(true);
    try {
      if (actionType === "condonar") {
        await httpsCallable(functions, "apiAdjustBalance")({
          residencialId, houseId: house.houseId,
          amount: Math.round(amt * 100), isDecrease: true,
          reason: actionReason.trim(),
        });
        toast.success("Condonación aplicada");
      } else if (actionType === "multa") {
        await httpsCallable(functions, "apiAdjustBalance")({
          residencialId, houseId: house.houseId,
          amount: Math.round(amt * 100), isDecrease: false,
          reason: actionReason.trim(),
        });
        toast.success("Multa aplicada");
      } else if (actionType === "cargo") {
        await httpsCallable(functions, "apiCreateExtraordinaryFee")({
          residencialId, houseId: house.houseId,
          amountCents: Math.round(amt * 100),
          description: actionReason.trim() || "Cargo extraordinario",
        });
        toast.success("Cargo extraordinario aplicado");
      }
      setActionType(null); setActionAmount(""); setActionReason("");
      onAction?.();
    } catch (err: any) {
      toast.error(err?.message?.includes("]") ? err.message.split("]").pop() : "Error al aplicar");
    } finally {
      setActionSubmitting(false);
    }
  };

  const cfg = statusConfig[house.status] || statusConfig.al_dia;

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 border-none">
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="text-2xl font-black text-slate-900">{house.label}</SheetTitle>
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">{house.residentName}</p>
                </div>
                <Badge className={`${cfg.bg} ${cfg.color} font-bold border rounded-lg px-3 py-1`}>{cfg.label}</Badge>
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Balance card */}
                <div className={`p-5 rounded-2xl border ${house.deudaCents > 0 ? "border-red-200 bg-red-50/50" : house.saldoAFavorCents > 0 ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50/50"}`}>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Balance actual</p>
                  <p className={`text-3xl font-black mt-1 ${house.deudaCents > 0 ? "text-red-600" : house.saldoAFavorCents > 0 ? "text-emerald-600" : "text-slate-800"}`}>
                    {house.deudaCents > 0 ? `-${fmtFull(house.deudaCents)}` : house.saldoAFavorCents > 0 ? `+${fmtFull(house.saldoAFavorCents)}` : "$0"}
                  </p>
                  {house.ultimoPago && (
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Último pago: {new Date(house.ultimoPago).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>

                {/* Aging buckets */}
                {house.deudaCents > 0 && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Antigüedad de deuda</p>
                    {loadingAging ? (
                      <div className="grid grid-cols-4 gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                    ) : aging ? (
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "0-30d", value: aging.bucket_0_30_cents, color: "text-amber-600 bg-amber-50 border-amber-200" },
                          { label: "31-60d", value: aging.bucket_31_60_cents, color: "text-orange-600 bg-orange-50 border-orange-200" },
                          { label: "61-90d", value: aging.bucket_61_90_cents, color: "text-red-600 bg-red-50 border-red-200" },
                          { label: "90+d", value: aging.bucket_91plus_cents, color: "text-red-800 bg-red-100 border-red-300" },
                        ].map(b => (
                          <div key={b.label} className={`p-3 rounded-xl border text-center ${b.color}`}>
                            <p className="text-[10px] font-bold uppercase">{b.label}</p>
                            <p className="text-sm font-black mt-0.5">{b.value > 0 ? fmtFull(b.value) : "—"}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Ledger timeline */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Historial de movimientos</p>
                  {loadingLedger ? (
                    <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
                  ) : ledger.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Sin movimientos registrados</p>
                  ) : (
                    <div className="space-y-1.5">
                      {ledger.map(e => {
                        const iconCfg = entryIcon[e.type] || entryIcon.ADJUSTMENT;
                        const Icon = iconCfg.icon;
                        const amt = e.amountInCents || e.amount || 0;
                        const isCredit = e.impact === "DECREASE_DEBT";
                        const date = e.createdAt?.toDate ? e.createdAt.toDate() : e.createdAt?.seconds ? new Date(e.createdAt.seconds * 1000) : null;

                        return (
                          <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                            <div className={`h-8 w-8 rounded-lg ${iconCfg.color} flex items-center justify-center shrink-0`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-slate-800 truncate">{e.description || e.subType || e.type}</p>
                                {e.folio && <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">{e.folio}</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {date && <span className="text-[10px] text-muted-foreground">{date.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</span>}
                                {e.periodKey && <span className="text-[10px] text-muted-foreground">· {e.periodKey}</span>}
                              </div>
                            </div>
                            <span className={`text-sm font-black shrink-0 ${isCredit ? "text-emerald-600" : "text-red-600"}`}>
                              {isCredit ? "-" : "+"}{fmtFull(amt)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Action buttons (sticky footer) */}
            <div className="border-t px-6 py-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 rounded-xl font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                onClick={() => setActionType("condonar")}>
                <Minus className="h-3.5 w-3.5 mr-1.5" />Condonar
              </Button>
              <Button variant="outline" size="sm" className="flex-1 rounded-xl font-bold text-red-700 border-red-200 hover:bg-red-50"
                onClick={() => setActionType("multa")}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />Multa
              </Button>
              <Button variant="outline" size="sm" className="flex-1 rounded-xl font-bold text-blue-700 border-blue-200 hover:bg-blue-50"
                onClick={() => setActionType("cargo")}>
                <Receipt className="h-3.5 w-3.5 mr-1.5" />Cargo extra
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Action Dialog */}
      {actionType && (
        <Dialog open={!!actionType} onOpenChange={(o) => { if (!o) { setActionType(null); setActionAmount(""); setActionReason(""); } }}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-black">
                {actionType === "condonar" ? "Condonar deuda" : actionType === "multa" ? "Aplicar multa" : "Cargo extraordinario"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Casa <strong>{house.label}</strong> · {house.residentName}
              </p>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Monto ($)</label>
                <Input type="number" placeholder="0" value={actionAmount} onChange={e => setActionAmount(e.target.value)}
                  className="mt-1 h-12 rounded-xl font-bold text-lg" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  {actionType === "cargo" ? "Descripción" : "Motivo"}
                </label>
                <Input placeholder={actionType === "condonar" ? "Ej: Acuerdo con residente" : actionType === "multa" ? "Ej: Retraso en pago" : "Ej: Reparación ventana"}
                  value={actionReason} onChange={e => setActionReason(e.target.value)} className="mt-1 h-10 rounded-xl" />
              </div>
              <Button className={`w-full h-11 rounded-xl font-black ${
                actionType === "condonar" ? "bg-emerald-600 hover:bg-emerald-700" :
                actionType === "multa" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
              }`} onClick={handleAction} disabled={actionSubmitting || !actionAmount}>
                {actionSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {actionType === "condonar" ? "Aplicar condonación" : actionType === "multa" ? "Aplicar multa" : "Crear cargo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
