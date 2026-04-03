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
  User,
  Calendar,
  Tag,
  Crown,
} from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { HouseStatus } from "./payments-types";
import { fmtFull } from "./payments-types";
import { generateReceiptPDF } from "@/lib/utils/generate-receipt-pdf";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Product {
  id: string;
  name: string;
  priceCents: number;
  category: string;
}

interface HouseUser {
  uid: string;
  fullName: string;
  paternalLastName: string;
  maternalLastName: string;
  email: string;
  isOwner: boolean;
}

interface CashTerminalProps {
  open: boolean;
  onClose: () => void;
  residencialId: string;
  houses: HouseStatus[];
  onPaymentRegistered: () => void;
}

type TerminalState = "form" | "processing" | "success";

const MONTH_NAMES_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
const MONTH_NAMES_FULL = [
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
const CUOTA_MENSUAL = 1150;

/** Returns options for last 12 months + next 1 month, newest first */
function getMonthOptions(): { label: string; value: string }[] {
  const options: { label: string; value: string }[] = [];
  const now = new Date();
  // start from next month going back 12 months (13 total)
  for (let i = -1; i <= 11; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-indexed
    const value = `${year}-${String(month + 1).padStart(2, "0")}`;
    const label = `${MONTH_NAMES_FULL[month]} ${year}`;
    options.push({ label, value });
  }
  return options;
}

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Parse "2026-04" → { year: 2026, month: 3 } (month 0-indexed) */
function parseMonthValue(v: string): { year: number; month: number } {
  const [y, m] = v.split("-").map(Number);
  return { year: y, month: m - 1 };
}

/** Get all month values between rangeFrom and rangeTo (inclusive), sorted asc */
function getMonthsBetween(from: string, to: string): string[] {
  if (!from || !to) return [];
  const f = parseMonthValue(from);
  const t = parseMonthValue(to);
  const result: string[] = [];
  let year = f.year;
  let month = f.month;
  const endYear = t.year;
  const endMonth = t.month;
  while (year < endYear || (year === endYear && month <= endMonth)) {
    result.push(`${year}-${String(month + 1).padStart(2, "0")}`);
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }
  return result;
}

function monthValueToLabel(v: string): string {
  const { year, month } = parseMonthValue(v);
  return `${MONTH_NAMES_FULL[month]} ${year}`;
}

function buildPeriodLabel(
  multiMonth: boolean,
  singleMonth: string,
  rangeFrom: string,
  rangeTo: string,
): string {
  if (!multiMonth) {
    return singleMonth ? monthValueToLabel(singleMonth) : "";
  }
  const months = getMonthsBetween(rangeFrom, rangeTo);
  if (months.length === 0) return "";
  if (months.length === 1) return monthValueToLabel(months[0]);
  const first = parseMonthValue(months[0]);
  const last = parseMonthValue(months[months.length - 1]);
  if (first.year === last.year) {
    return `${MONTH_NAMES_FULL[first.month]} - ${MONTH_NAMES_FULL[last.month]} ${last.year}`;
  }
  return `${MONTH_NAMES_SHORT[first.month]} ${first.year} - ${MONTH_NAMES_SHORT[last.month]} ${last.year}`;
}

function buildConceptLabelNew(
  multiMonth: boolean,
  singleMonth: string,
  rangeFrom: string,
  rangeTo: string,
): string {
  const period = buildPeriodLabel(multiMonth, singleMonth, rangeFrom, rangeTo);
  if (!period) return "Cuota Ordinaria";
  return `Cuota Ordinaria ${period}`;
}

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
    payerName?: string;
    period?: string;
    method?: string;
  } | null>(null);
  const [processingStep, setProcessingStep] = useState(0);

  // Fiscal data from residencial
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

  // Payment type: fee (cuota) or product
  const [paymentType, setPaymentType] = useState<"fee" | "product">("fee");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Payer — house users
  const [houseUsers, setHouseUsers] = useState<HouseUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedPayerUid, setSelectedPayerUid] = useState<string | null>(null);
  const [showCustomPayer, setShowCustomPayer] = useState(false);
  const [customPayerName, setCustomPayerName] = useState("");

  // Derived payer name for payload
  const payerName = (() => {
    if (showCustomPayer) return customPayerName;
    if (selectedPayerUid) {
      const u = houseUsers.find((u) => u.uid === selectedPayerUid);
      if (u) return `${u.fullName} ${u.paternalLastName}`.trim();
    }
    return "";
  })();

  // Paid months — to disable already paid checkboxes
  const [paidMonths, setPaidMonths] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!selectedHouse || !residencialId) {
      setPaidMonths(new Set());
      return;
    }
    getDocs(
      query(
        collection(
          db,
          "residenciales",
          residencialId,
          "houses",
          selectedHouse.houseId,
          "fees",
        ),
        where("status", "==", "paid"),
      ),
    )
      .then((snap) => {
        const paid = new Set<string>();
        snap.docs.forEach((d) => {
          const data = d.data();
          const due = data.dueDate?.toDate
            ? data.dueDate.toDate()
            : new Date(
                data.dueDate?.seconds
                  ? data.dueDate.seconds * 1000
                  : data.dueDate,
              );
          if (due && !isNaN(due.getTime())) {
            paid.add(
              `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}`,
            );
          }
        });
        setPaidMonths(paid);
        // Remove already-paid months from current selection
        setCheckedMonths((prev) => prev.filter((m) => !paid.has(m)));
      })
      .catch(() => setPaidMonths(new Set()));
  }, [selectedHouse?.houseId, residencialId]);

  // Period selector — checkbox grid
  const [checkedMonths, setCheckedMonths] = useState<string[]>([
    currentMonthValue(),
  ]);
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear()),
  );

  // Derive legacy values for concept/label builders
  const multiMonth = checkedMonths.length > 1;
  const singleMonth =
    checkedMonths.length === 1 ? checkedMonths[0] : currentMonthValue();
  const rangeFrom =
    checkedMonths.length > 0 ? checkedMonths[0] : currentMonthValue();
  const rangeTo =
    checkedMonths.length > 0
      ? checkedMonths[checkedMonths.length - 1]
      : currentMonthValue();

  // Derived: month count for amount calculation
  const selectedMonthCount =
    checkedMonths.length > 0 ? checkedMonths.length : singleMonth ? 1 : 0;

  // Payment method: cash or transfer
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">(
    "cash",
  );
  const [transferRef, setTransferRef] = useState("");

  // House label formatter
  function formatHouseLabel(houseId: string): string {
    if (!houseId) return "";
    const parts = houseId.split("-");
    if (parts.length >= 3) {
      const street = parts
        .slice(1, -1)
        .join(" ")
        .replace(/_/g, " ")
        .toLowerCase()
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      return `${street} ${parts[parts.length - 1]}`;
    }
    return houseId;
  }

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

  // Load house users when a house is selected
  useEffect(() => {
    if (!selectedHouse) {
      setHouseUsers([]);
      setSelectedPayerUid(null);
      setShowCustomPayer(false);
      setCustomPayerName("");
      return;
    }
    setLoadingUsers(true);
    getDocs(
      query(
        collection(db, "usuarios"),
        where("houseID", "==", selectedHouse.houseId),
        where("role", "==", "resident"),
      ),
    )
      .then((snap) => {
        const users = snap.docs.map((d) => ({
          uid: d.id,
          ...(d.data() as Omit<HouseUser, "uid">),
        }));
        setHouseUsers(users);
        // Auto-select owner if present
        const owner = users.find((u) => u.isOwner);
        if (owner) {
          setSelectedPayerUid(owner.uid);
        } else if (users.length > 0) {
          setSelectedPayerUid(users[0].uid);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  }, [selectedHouse?.houseId]);

  // Auto-fill amount when month selection changes and paymentType is fee
  useEffect(() => {
    if (paymentType === "fee" && selectedMonthCount > 0) {
      setAmount(String(selectedMonthCount * CUOTA_MENSUAL));
    }
  }, [
    selectedMonthCount,
    paymentType,
    multiMonth,
    singleMonth,
    rangeFrom,
    rangeTo,
  ]);

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
          : paymentType === "fee" && checkedMonths.length > 0
            ? checkedMonths
                .map((m) => {
                  const [y, mo] = m.split("-");
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
                  return `Cuota Ordinaria ${meses[parseInt(mo) - 1]} ${y}`;
                })
                .join(", ")
            : "Cuota Ordinaria";

      const periodLabel =
        paymentType === "fee" && checkedMonths.length > 0
          ? checkedMonths
              .map((m) => {
                const [y, mo] = m.split("-");
                const meses = [
                  "Ene",
                  "Feb",
                  "Mar",
                  "Abr",
                  "May",
                  "Jun",
                  "Jul",
                  "Ago",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dic",
                ];
                return `${meses[parseInt(mo) - 1]} ${y}`;
              })
              .join(", ")
          : undefined;

      const fullNotes =
        [
          notes.trim(),
          paymentMethod === "transfer" && transferRef.trim()
            ? `Ref: ${transferRef.trim()}`
            : "",
        ]
          .filter(Boolean)
          .join(" · ") || undefined;

      const selectedUser = selectedPayerUid
        ? houseUsers.find((u) => u.uid === selectedPayerUid)
        : null;

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
          months:
            paymentType === "fee" && checkedMonths.length > 0
              ? checkedMonths
              : undefined,
          notes: fullNotes,
          userName: payerName.trim() || undefined,
          userId: selectedUser?.uid || undefined,
        },
      });
      const now = new Date();
      setReceipt({
        folio: res.data.folio || "---",
        house: formatHouseLabel(selectedHouse.houseId) || selectedHouse.label,
        resident: selectedHouse.residentName,
        amount: fmtFull(Math.round(amountNum * 100)),
        concept,
        payerName: payerName.trim() || undefined,
        period: periodLabel,
        method: paymentMethod === "transfer" ? "Transferencia" : "Efectivo",
        timestamp:
          now.toLocaleDateString("es-MX", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }) +
          " · " +
          `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      });
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
    setHouseUsers([]);
    setSelectedPayerUid(null);
    setShowCustomPayer(false);
    setCustomPayerName("");
    setCheckedMonths([currentMonthValue()]);
    setSelectedYear(String(new Date().getFullYear()));
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
    { label: "Notificando residente", icon: Send },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && state !== "processing") handleClose();
      }}
    >
      <DialogContent className="max-w-md md:max-w-2xl rounded-[2rem] border-none shadow-2xl bg-white p-0 overflow-hidden">
        {/* ═══════════ PROCESSING ANIMATION ═══════════ */}
        {state === "processing" && (
          <div className="p-10 text-center">
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

            <div className="border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden">
              <div className="flex justify-center pt-3 pb-0 bg-slate-50/50">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">
                  <Printer className="h-2.5 w-2.5" />
                  Copia Administración
                </span>
              </div>
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-center mt-2">
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
                  ...(receipt.payerName &&
                  receipt.payerName !== receipt.resident
                    ? [{ label: "Pagó", value: receipt.payerName }]
                    : []),
                  { label: "Concepto", value: receipt.concept },
                  ...(receipt.period
                    ? [{ label: "Periodo", value: receipt.period }]
                    : []),
                  { label: "Monto", value: receipt.amount, bold: true },
                  { label: "Método", value: receipt.method ?? "Efectivo" },
                  { label: "Fecha", value: receipt.timestamp },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span
                      className={
                        (row as any).bold
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
                onClick={async () => {
                  if (!receipt) return;
                  await generateReceiptPDF({
                    folio: receipt.folio,
                    houseId: selectedHouse?.houseId || "",
                    payerName: receipt.payerName || receipt.resident || "",
                    concept: receipt.concept,
                    amountCents: Math.round(parseFloat(amount) * 100),
                    method:
                      paymentMethod === "transfer"
                        ? "Transferencia"
                        : "Efectivo",
                    timestamp: receipt.timestamp,
                    isAdmin: true,
                    residencialName: fiscalInfo.nombre,
                    residencialAddress: fiscalInfo.direccion,
                    razonSocial: fiscalInfo.razonSocial,
                    rfc: fiscalInfo.rfc,
                    domicilioFiscal: fiscalInfo.domicilioFiscal,
                  });
                }}
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

            <ScrollArea className="max-h-[calc(100vh-180px)]">
              <div className="p-6 space-y-5">
                {/* ── House selector ── */}
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
                          {formatHouseLabel(selectedHouse.houseId) ||
                            selectedHouse.label}
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

                {/* ── Payer selector ── */}
                {selectedHouse && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <User className="h-3 w-3" />
                      ¿Quién paga?
                    </label>
                    {loadingUsers ? (
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground py-3">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Cargando residentes...
                      </div>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {houseUsers.map((u) => {
                          const name =
                            `${u.fullName} ${u.paternalLastName}`.trim();
                          const isSelected =
                            !showCustomPayer && selectedPayerUid === u.uid;
                          return (
                            <button
                              key={u.uid}
                              onClick={() => {
                                setSelectedPayerUid(u.uid);
                                setShowCustomPayer(false);
                              }}
                              className={`flex flex-col items-start px-3 py-2 rounded-xl text-left transition-all border text-xs ${
                                isSelected
                                  ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                              }`}
                            >
                              <span className="flex items-center gap-1 font-bold">
                                {name}
                                {u.isOwner && (
                                  <Crown
                                    className={`h-3 w-3 ${isSelected ? "text-emerald-100" : "text-amber-500"}`}
                                  />
                                )}
                              </span>
                              <span
                                className={`text-[10px] mt-0.5 ${isSelected ? "text-emerald-100" : "text-muted-foreground"}`}
                              >
                                {u.email}
                              </span>
                            </button>
                          );
                        })}
                        {/* Otra persona button */}
                        <button
                          onClick={() => {
                            setShowCustomPayer(true);
                            setSelectedPayerUid(null);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                            showCustomPayer
                              ? "bg-slate-700 border-slate-700 text-white shadow-md"
                              : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Otra persona
                        </button>
                      </div>
                    )}
                    {showCustomPayer && (
                      <Input
                        placeholder="Nombre completo de quien paga"
                        value={customPayerName}
                        onChange={(e) => setCustomPayerName(e.target.value)}
                        className="mt-2 h-11 rounded-xl border-slate-200 font-medium text-sm"
                        autoFocus
                      />
                    )}
                  </div>
                )}

                {/* ── Payment type + Amount (2-col on tablet) ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ── Payment type selector ── */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      ¿Qué estás cobrando?
                    </label>
                    <div className="flex gap-2 mt-1.5">
                      <button
                        onClick={() => {
                          setPaymentType("fee");
                          setSelectedProduct(null);
                          setAmount(String(selectedMonthCount * CUOTA_MENSUAL));
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

                  {/* ── Amount ── */}
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
                    {paymentType === "fee" && selectedMonthCount > 0 && (
                      <p className="text-[10px] text-emerald-600 font-semibold mt-1.5 ml-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {selectedMonthCount}{" "}
                        {selectedMonthCount === 1 ? "mes" : "meses"} × $
                        {CUOTA_MENSUAL.toLocaleString("es-MX")} = $
                        {(selectedMonthCount * CUOTA_MENSUAL).toLocaleString(
                          "es-MX",
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Period selector (checkbox grid) ── */}
                {paymentType === "fee" && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Periodo de pago
                    </label>
                    <p className="text-[10px] text-slate-400 mt-0.5 mb-2">
                      Selecciona los meses que se están pagando
                    </p>

                    {/* Year selector */}
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <button
                        type="button"
                        onClick={() => {
                          const y = parseInt(selectedYear) - 1;
                          setSelectedYear(String(y));
                        }}
                        className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm transition-colors"
                      >
                        ‹
                      </button>
                      <span className="text-sm font-bold text-slate-700 min-w-[50px] text-center">
                        {selectedYear}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const y = parseInt(selectedYear) + 1;
                          if (y <= new Date().getFullYear() + 1)
                            setSelectedYear(String(y));
                        }}
                        className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm transition-colors"
                      >
                        ›
                      </button>
                    </div>

                    {/* Month grid with checkboxes */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        "Ene",
                        "Feb",
                        "Mar",
                        "Abr",
                        "May",
                        "Jun",
                        "Jul",
                        "Ago",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dic",
                      ].map((mes, idx) => {
                        const monthValue = `${selectedYear}-${String(idx + 1).padStart(2, "0")}`;
                        const isChecked = checkedMonths.includes(monthValue);
                        const isPaid = paidMonths.has(monthValue);
                        return (
                          <button
                            key={monthValue}
                            type="button"
                            disabled={isPaid}
                            onClick={() => {
                              if (isPaid) return;
                              setCheckedMonths((prev) =>
                                prev.includes(monthValue)
                                  ? prev.filter((m) => m !== monthValue)
                                  : [...prev, monthValue].sort(),
                              );
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all border ${
                              isPaid
                                ? "bg-blue-50 border-blue-200 text-blue-400 cursor-not-allowed opacity-75"
                                : isChecked
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                            }`}
                          >
                            <div
                              className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                isPaid
                                  ? "bg-blue-400 border-blue-400"
                                  : isChecked
                                    ? "bg-emerald-500 border-emerald-500"
                                    : "border-slate-300"
                              }`}
                            >
                              {(isChecked || isPaid) && (
                                <CheckCircle className="h-3 w-3 text-white" />
                              )}
                            </div>
                            {mes}
                            {isPaid && (
                              <span className="text-[9px] ml-0.5">✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected months summary */}
                    {checkedMonths.length > 0 && (
                      <div className="mt-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-700">
                            {checkedMonths.length}{" "}
                            {checkedMonths.length === 1 ? "mes" : "meses"}{" "}
                            seleccionado{checkedMonths.length > 1 ? "s" : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCheckedMonths([])}
                            className="text-[10px] text-emerald-600 hover:text-emerald-800 font-medium"
                          >
                            Limpiar
                          </button>
                        </div>
                        <p className="text-[10px] text-emerald-600 mt-0.5">
                          {checkedMonths
                            .map((m) => {
                              const [y, mo] = m.split("-");
                              const meses = [
                                "Ene",
                                "Feb",
                                "Mar",
                                "Abr",
                                "May",
                                "Jun",
                                "Jul",
                                "Ago",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dic",
                              ];
                              return `${meses[parseInt(mo) - 1]} ${y}`;
                            })
                            .join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Payment method ── */}
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

                {/* Transfer reference */}
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
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
