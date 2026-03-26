"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { DollarSign, Loader2, CheckCircle, Printer, ShieldCheck, Search, Plus, Lock, Fingerprint, Clock } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import type { HouseStatus } from "./payments-types";
import { fmtFull } from "./payments-types";

interface CashTerminalProps {
  open: boolean;
  onClose: () => void;
  residencialId: string;
  houses: HouseStatus[];
  onPaymentRegistered: () => void;
}

export default function CashTerminal({ open, onClose, residencialId, houses, onPaymentRegistered }: CashTerminalProps) {
  const [houseSearch, setHouseSearch] = useState("");
  const [selectedHouse, setSelectedHouse] = useState<HouseStatus | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{ folio: string; house: string; resident: string; amount: string; timestamp: string } | null>(null);

  const filteredHouses = houseSearch.length >= 1
    ? houses.filter(h => h.label.toLowerCase().includes(houseSearch.toLowerCase()) || h.residentName.toLowerCase().includes(houseSearch.toLowerCase())).slice(0, 8)
    : [];

  const handleSelectHouse = (h: HouseStatus) => {
    setSelectedHouse(h);
    setHouseSearch(h.label);
  };

  const handleSubmit = async () => {
    if (!selectedHouse || !amount) return;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) { toast.error("Monto inválido"); return; }

    setSubmitting(true);
    try {
      const res = await httpsCallable<any, any>(functions, "apiRegisterDirectCashPayment")({
        residencialId,
        data: {
          houseId: selectedHouse.houseId,
          amount: Math.round(amountNum * 100),
          notes: notes.trim() || undefined,
        },
      });
      const now = new Date();
      setReceipt({
        folio: res.data.folio || "---",
        house: selectedHouse.label,
        resident: selectedHouse.residentName,
        amount: fmtFull(Math.round(amountNum * 100)),
        timestamp: now.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) + " · " + now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
      });
      onPaymentRegistered();
    } catch (err: any) {
      toast.error(err?.message?.includes("]") ? err.message.split("]").pop() : "Error al registrar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewPayment = () => {
    setReceipt(null);
    setSelectedHouse(null);
    setHouseSearch("");
    setAmount("");
    setNotes("");
  };

  const handleClose = () => { handleNewPayment(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl bg-white p-0 overflow-hidden">
        {receipt ? (
          /* ═══════════ RECEIPT ═══════════ */
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3 ring-4 ring-emerald-100">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Pago registrado exitosamente</h3>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" /> Transacción verificada y registrada
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden">
              {/* Receipt header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-center">
                <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-[0.2em]">Comprobante de pago</p>
                <p className="text-xl font-mono font-black text-white mt-0.5">{receipt.folio}</p>
              </div>
              {/* Receipt body */}
              <div className="p-5 space-y-3 bg-slate-50/30">
                {[
                  { label: "Casa", value: receipt.house },
                  { label: "Residente", value: receipt.resident },
                  { label: "Monto", value: receipt.amount, bold: true },
                  { label: "Método", value: "Efectivo" },
                  { label: "Fecha", value: receipt.timestamp },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={`${row.bold ? "font-black text-lg text-emerald-700" : "font-bold text-slate-800"}`}>{row.value}</span>
                  </div>
                ))}
              </div>
              {/* Receipt footer */}
              <div className="px-5 py-3 border-t border-dashed border-slate-200 bg-slate-50/50 text-center">
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  <span>Registrado en sistema ERP · Folio único e irrepetible</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1 rounded-xl font-bold h-11" onClick={handleNewPayment}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo cobro
              </Button>
              <Button className="flex-1 rounded-xl font-bold h-11 bg-slate-900 hover:bg-slate-800" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        ) : (
          /* ═══════════ PAYMENT FORM ═══════════ */
          <>
            {/* Secure header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Terminal de cobro</h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Conexión segura
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Lock className="h-2.5 w-2.5" />
                      Cifrado E2E
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Fingerprint className="h-2.5 w-2.5" />
                      Auditable
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* House selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Vivienda</label>
                <div className="relative mt-1.5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por casa o residente..."
                    value={houseSearch}
                    onChange={e => { setHouseSearch(e.target.value); if (selectedHouse && e.target.value !== selectedHouse.label) setSelectedHouse(null); }}
                    className="pl-9 h-12 rounded-xl border-slate-200 font-medium text-sm"
                  />
                </div>
                {filteredHouses.length > 0 && !selectedHouse && (
                  <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden shadow-lg bg-white">
                    <ScrollArea className="max-h-[180px]">
                      {filteredHouses.map(h => (
                        <button key={h.houseId} onClick={() => handleSelectHouse(h)}
                          className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0">
                          <div>
                            <span className="font-bold text-sm text-slate-800">{h.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">{h.residentName}</span>
                          </div>
                          {h.deudaCents > 0 && <span className="text-[10px] font-bold text-red-500">Debe {fmtFull(h.deudaCents)}</span>}
                        </button>
                      ))}
                    </ScrollArea>
                  </div>
                )}
                {selectedHouse && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-emerald-800">{selectedHouse.label}</span>
                      <span className="text-xs text-emerald-600 ml-2">{selectedHouse.residentName}</span>
                    </div>
                    {selectedHouse.deudaCents > 0 && (
                      <span className="text-[10px] font-bold text-red-500 shrink-0">Deuda: {fmtFull(selectedHouse.deudaCents)}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Monto a cobrar</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-2xl">$</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    disabled={submitting}
                    className="h-16 rounded-xl border-slate-200 font-black text-3xl text-slate-900 pl-10 focus:ring-emerald-500/20 focus:border-emerald-400"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 ml-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Cuota mensual: $1,150
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Referencia <span className="text-slate-300">(opcional)</span></label>
                <Input
                  placeholder="Notas o referencia del pago"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  disabled={submitting}
                  className="mt-1.5 h-11 rounded-xl border-slate-200 font-medium text-sm"
                />
              </div>

              {/* Submit */}
              <Button
                className="w-full h-14 rounded-2xl font-black text-base bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20 transition-all"
                onClick={handleSubmit}
                disabled={submitting || !selectedHouse || !amount}
              >
                {submitting ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Procesando pago seguro...</>
                ) : (
                  <><Lock className="h-5 w-5 mr-2" />Registrar pago seguro</>
                )}
              </Button>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 pt-1">
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  <span>Folio automático</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <Fingerprint className="h-3 w-3 text-blue-500" />
                  <span>Registro auditable</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <Lock className="h-3 w-3 text-slate-400" />
                  <span>Datos protegidos</span>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
