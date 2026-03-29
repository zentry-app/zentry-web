"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  DollarSign,
  Loader2,
  CheckCircle,
  Printer,
  ShieldCheck,
  Search,
  Plus,
  Lock,
  Fingerprint,
  Clock,
  Send,
  Bell,
} from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { HouseStatus } from "./payments-types";
import { fmtFull } from "./payments-types";
import { Tag } from "lucide-react";

interface Product {
  id: string;
  name: string;
  priceCents: number;
  category: string;
}

interface CashTerminalProps {
  open: boolean;
  onClose: () => void;
  residencialId: string;
  houses: HouseStatus[];
  onPaymentRegistered: () => void;
}

type TerminalState = "form" | "processing" | "success";

export default function CashTerminal({
  open,
  onClose,
  residencialId,
  houses,
  onPaymentRegistered,
}: CashTerminalProps) {
  const [houseSearch, setHouseSearch] = useState("");
  const [selectedHouse, setSelectedHouse] = useState<HouseStatus | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<TerminalState>("form");
  const [receipt, setReceipt] = useState<{
    folio: string;
    house: string;
    resident: string;
    amount: string;
    timestamp: string;
    concept: string;
  } | null>(null);
  const [processingStep, setProcessingStep] = useState(0);

  // Payment type: fee (cuota) or product
  const [paymentType, setPaymentType] = useState<"fee" | "product">("fee");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Payment method: cash or transfer
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">(
    "cash",
  );
  const [transferRef, setTransferRef] = useState("");

  // Load products when switching to product mode
  useEffect(() => {
    if (paymentType !== "product" || products.length > 0) return;
    setLoadingProducts(true);
    getDocs(
      query(
        collection(db, `residenciales/${residencialId}/productos`),
        orderBy("name"),
      ),
    )
      .then((snap) =>
        setProducts(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product),
        ),
      )
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, [paymentType, residencialId, products.length]);

  const filteredHouses =
    houseSearch.length >= 1
      ? houses
          .filter(
            (h) =>
              h.label.toLowerCase().includes(houseSearch.toLowerCase()) ||
              h.residentName.toLowerCase().includes(houseSearch.toLowerCase()),
          )
          .slice(0, 8)
      : [];

  const handleSelectHouse = (h: HouseStatus) => {
    setSelectedHouse(h);
    setHouseSearch(h.label);
  };

  // Processing animation steps
  useEffect(() => {
    if (state !== "processing") return;
    const steps = [1, 2, 3, 4];
    const timers = steps.map((step, i) =>
      setTimeout(() => setProcessingStep(step), (i + 1) * 600),
    );
    return () => timers.forEach(clearTimeout);
  }, [state]);

  const handleSubmit = async () => {
    if (!selectedHouse || !amount) return;
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Monto inválido");
      return;
    }

    setState("processing");
    setProcessingStep(0);

    try {
      const concept =
        paymentType === "product" && selectedProduct
          ? selectedProduct.name
          : "Cuota mensual";
      const fullNotes =
        [
          notes.trim(),
          paymentMethod === "transfer" && transferRef.trim()
            ? `Ref: ${transferRef.trim()}`
            : "",
        ]
          .filter(Boolean)
          .join(" · ") || undefined;

      const res = await httpsCallable<any, any>(
        functions,
        "apiRegisterDirectCashPayment",
      )({
        residencialId,
        data: {
          houseId: selectedHouse.houseId,
          amount: Math.round(amountNum * 100),
          paymentType,
          method: paymentMethod === "transfer" ? "transfer" : "cash",
          productId:
            paymentType === "product" && selectedProduct
              ? selectedProduct.id
              : undefined,
          productName:
            paymentType === "product" && selectedProduct
              ? selectedProduct.name
              : undefined,
          concept,
          notes: fullNotes,
        },
      });
      const now = new Date();
      setReceipt({
        folio: res.data.folio || "---",
        house: selectedHouse.label,
        resident: selectedHouse.residentName,
        amount: fmtFull(Math.round(amountNum * 100)),
        concept,
        timestamp:
          now.toLocaleDateString("es-MX", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }) +
          " · " +
          now.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          }),
      });
      // Small delay for the last animation step to show
      setTimeout(() => setState("success"), 800);
      onPaymentRegistered();
    } catch (err: any) {
      setState("form");
      toast.error(
        err?.message?.includes("]")
          ? err.message.split("]").pop()
          : "Error al registrar",
      );
    }
  };

  const handleNewPayment = () => {
    setReceipt(null);
    setSelectedHouse(null);
    setHouseSearch("");
    setAmount("");
    setNotes("");
    setPaymentType("fee");
    setSelectedProduct(null);
    setPaymentMethod("cash");
    setTransferRef("");
    setState("form");
    setProcessingStep(0);
  };

  const handleClose = () => {
    handleNewPayment();
    onClose();
  };

  const processingSteps = [
    { label: "Verificando datos", icon: ShieldCheck },
    { label: "Generando folio", icon: Lock },
    { label: "Registrando pago", icon: DollarSign },
    { label: "Notificando residente", icon: Bell },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && state !== "processing") handleClose();
      }}
    >
      <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl bg-white p-0 overflow-hidden">
        {/* ═══════════ PROCESSING ANIMATION ═══════════ */}
        {state === "processing" && (
          <div className="p-10 text-center">
            {/* Animated circles */}
            <div className="relative h-24 w-24 mx-auto mb-8">
              <div
                className="absolute inset-0 rounded-full border-4 border-emerald-100 animate-ping"
                style={{ animationDuration: "1.5s" }}
              />
              <div
                className="absolute inset-2 rounded-full border-4 border-emerald-200 animate-ping"
                style={{ animationDuration: "2s" }}
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Lock className="h-10 w-10 text-white animate-pulse" />
              </div>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              Procesando pago seguro
            </h3>
            <p className="text-xs text-muted-foreground mb-8">
              No cierres esta ventana
            </p>

            {/* Steps */}
            <div className="space-y-3 text-left max-w-[260px] mx-auto">
              {processingSteps.map((step, i) => {
                const isActive = processingStep === i + 1;
                const isDone = processingStep > i + 1;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 transition-all duration-300 ${isDone ? "opacity-50" : isActive ? "opacity-100" : "opacity-20"}`}
                  >
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isDone
                          ? "bg-emerald-100"
                          : isActive
                            ? "bg-emerald-500 shadow-md shadow-emerald-500/30"
                            : "bg-slate-100"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : isActive ? (
                        <step.icon className="h-4 w-4 text-white animate-pulse" />
                      ) : (
                        <step.icon className="h-4 w-4 text-slate-300" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-bold ${isDone ? "text-emerald-600" : isActive ? "text-slate-900" : "text-slate-300"}`}
                    >
                      {step.label}
                      {isActive && (
                        <span className="inline-block ml-1 animate-pulse">
                          ...
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════ RECEIPT ═══════════ */}
        {state === "success" && receipt && (
          <div className="p-8 animate-fadeIn">
            {/* Success animation */}
            <div className="text-center mb-6">
              <div className="relative h-20 w-20 mx-auto mb-4">
                <div
                  className="absolute inset-0 rounded-full bg-emerald-100 animate-ping"
                  style={{
                    animationDuration: "1s",
                    animationIterationCount: "2",
                  }}
                />
                <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Pago registrado
              </h3>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" /> Transacción verificada y registrada
              </p>
            </div>

            {/* Receipt ticket */}
            <div className="border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-center">
                <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-[0.2em]">
                  Comprobante de pago
                </p>
                <p className="text-xl font-mono font-black text-white mt-0.5">
                  {receipt.folio}
                </p>
              </div>
              <div className="p-5 space-y-3 bg-slate-50/30">
                {[
                  { label: "Casa", value: receipt.house },
                  { label: "Residente", value: receipt.resident },
                  { label: "Concepto", value: receipt.concept },
                  { label: "Monto", value: receipt.amount, bold: true },
                  { label: "Método", value: "Efectivo" },
                  { label: "Fecha", value: receipt.timestamp },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span
                      className={
                        row.bold
                          ? "font-black text-lg text-emerald-700"
                          : "font-bold text-slate-800"
                      }
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-dashed border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  <span>Folio único e irrepetible · Registrado en ERP</span>
                </div>
              </div>
            </div>

            {/* Auto-notification banner */}
            <div className="mt-4 flex items-center gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                <Send className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-800">
                  Recibo enviado automáticamente
                </p>
                <p className="text-[10px] text-blue-600">
                  El residente recibirá una notificación con el comprobante
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <Button
                variant="outline"
                className="flex-1 rounded-xl font-bold h-11"
                onClick={handleNewPayment}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo cobro
              </Button>
              <Button
                className="flex-1 rounded-xl font-bold h-11 bg-slate-900 hover:bg-slate-800 text-white"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        )}

        {/* ═══════════ PAYMENT FORM ═══════════ */}
        {state === "form" && (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Terminal de cobro
                  </h3>
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
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Vivienda
                </label>
                <div className="relative mt-1.5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por casa o residente..."
                    value={houseSearch}
                    onChange={(e) => {
                      setHouseSearch(e.target.value);
                      if (
                        selectedHouse &&
                        e.target.value !== selectedHouse.label
                      )
                        setSelectedHouse(null);
                    }}
                    className="pl-9 h-12 rounded-xl border-slate-200 font-medium text-sm"
                  />
                </div>
                {filteredHouses.length > 0 && !selectedHouse && (
                  <div className="mt-1 border border-slate-200 rounded-xl overflow-hidden shadow-lg bg-white">
                    <ScrollArea className="max-h-[180px]">
                      {filteredHouses.map((h) => (
                        <button
                          key={h.houseId}
                          onClick={() => handleSelectHouse(h)}
                          className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
                        >
                          <div>
                            <span className="font-bold text-sm text-slate-800">
                              {h.label}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {h.residentName}
                            </span>
                          </div>
                          {h.deudaCents > 0 && (
                            <span className="text-[10px] font-bold text-red-500">
                              Debe {fmtFull(h.deudaCents)}
                            </span>
                          )}
                        </button>
                      ))}
                    </ScrollArea>
                  </div>
                )}
                {selectedHouse && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-emerald-800">
                        {selectedHouse.label}
                      </span>
                      <span className="text-xs text-emerald-600 ml-2">
                        {selectedHouse.residentName}
                      </span>
                    </div>
                    {selectedHouse.deudaCents > 0 && (
                      <span className="text-[10px] font-bold text-red-500 shrink-0">
                        Deuda: {fmtFull(selectedHouse.deudaCents)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Payment type selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  ¿Qué estás cobrando?
                </label>
                <div className="flex gap-2 mt-1.5">
                  <button
                    onClick={() => {
                      setPaymentType("fee");
                      setSelectedProduct(null);
                      setAmount("");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      paymentType === "fee"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    Cuota mensual
                  </button>
                  <button
                    onClick={() => {
                      setPaymentType("product");
                      setAmount("");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      paymentType === "product"
                        ? "bg-purple-600 text-white shadow-md"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    <Tag className="h-4 w-4" />
                    Producto
                  </button>
                </div>

                {/* Product selector */}
                {paymentType === "product" && (
                  <div className="mt-2">
                    {loadingProducts ? (
                      <p className="text-xs text-muted-foreground py-2">
                        Cargando productos...
                      </p>
                    ) : products.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        No hay productos configurados
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                        {products.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setSelectedProduct(p);
                              setAmount(String(p.priceCents / 100));
                            }}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all ${
                              selectedProduct?.id === p.id
                                ? "bg-purple-50 border-2 border-purple-300"
                                : "bg-slate-50 border border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div>
                              <span className="font-bold text-xs text-slate-800">
                                {p.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground ml-2">
                                {p.category}
                              </span>
                            </div>
                            <span className="font-black text-xs text-purple-600">
                              {fmtFull(p.priceCents)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Monto a cobrar
                </label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-2xl">
                    $
                  </span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-16 rounded-xl border-slate-200 font-black text-3xl text-slate-900 pl-10 focus:ring-emerald-500/20 focus:border-emerald-400"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 ml-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Cuota mensual: $1,150
                </p>
              </div>

              {/* Payment method */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Método de pago
                </label>
                <div className="flex gap-2 mt-1.5">
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      paymentMethod === "cash"
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    Efectivo
                  </button>
                  <button
                    onClick={() => setPaymentMethod("transfer")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      paymentMethod === "transfer"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    <Send className="h-4 w-4" />
                    Transferencia
                  </button>
                </div>
              </div>

              {/* Transfer reference (only for transfers) */}
              {paymentMethod === "transfer" && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Referencia de transferencia{" "}
                    <span className="text-slate-300">(opcional)</span>
                  </label>
                  <Input
                    placeholder="Ej: ZEN-A101 o número de operación"
                    value={transferRef}
                    onChange={(e) => setTransferRef(e.target.value)}
                    className="mt-1.5 h-11 rounded-xl border-blue-200 font-mono text-sm focus:ring-blue-500/20 focus:border-blue-400"
                  />
                  <p className="text-[10px] text-blue-500 mt-1 ml-1">
                    Referencia o concepto que el residente usó en su
                    transferencia
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Notas <span className="text-slate-300">(opcional)</span>
                </label>
                <Input
                  placeholder="Notas adicionales del pago"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1.5 h-11 rounded-xl border-slate-200 font-medium text-sm"
                />
              </div>

              {/* Submit */}
              <Button
                className="w-full h-14 rounded-2xl font-black text-base text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20 transition-all"
                onClick={handleSubmit}
                disabled={!selectedHouse || !amount}
              >
                <Lock className="h-5 w-5 mr-2" />
                {paymentMethod === "transfer"
                  ? "Registrar transferencia"
                  : "Registrar pago en efectivo"}
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
                  <Send className="h-3 w-3 text-slate-400" />
                  <span>Recibo automático</span>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
