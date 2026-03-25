"use client";

import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import {
    ArrowUpCircle,
    ArrowDownCircle,
    RefreshCcw,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Home,
    TrendingDown,
    TrendingUp,
    Clock,
    FileText,
    Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─── tipos locales ────────────────────────────────────────────────────────────
interface LedgerEntry {
    id: string;
    type: "CHARGE" | "PAYOUT" | "ADJUSTMENT" | "REVERSAL";
    subType: string;
    description: string;
    amount: number;         // centavos
    amountInCents: number;
    impact: "INCREASE_DEBT" | "DECREASE_DEBT";
    status: "applied" | "reversed";
    folio?: string;
    periodKey?: string;
    createdAt: any;
    createdBy: string;
    metadata?: Record<string, any>;
}

interface HouseBalance {
    deudaAcumulada: number;   // centavos
    saldoAFavor: number;      // centavos
    estadoMorosidad: string;
    diasAtrasoMayorDeuda: number;
    updatedAt: any;
}

interface EstadoCuentaProps {
    residencialId: string;
    houseId: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt$ = (cents: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
        cents / 100
    );

const fmtDate = (ts: any) => {
    if (!ts) return "—";
    try {
        const d = ts?.toDate ? ts.toDate() : new Date(ts);
        return format(d, "dd MMM yyyy", { locale: es });
    } catch { return "—"; }
};

const fmtRelative = (ts: any) => {
    if (!ts) return "—";
    try {
        const d = ts?.toDate ? ts.toDate() : new Date(ts);
        return formatDistanceToNow(d, { addSuffix: true, locale: es });
    } catch { return "—"; }
};

const subTypeLabel: Record<string, string> = {
    monthly_fee: "Cuota mensual",
    extraordinary_fee: "Cuota extraordinaria",
    fine: "Multa",
    product_charge: "Producto/Servicio",
    late_fee: "Recargo por mora",
    cash_payment: "Pago en efectivo",
    transfer_payment: "Transferencia bancaria",
    balance_adjustment_manual: "Ajuste de balance",
    debt_forgiven: "Condonación de deuda",
    partial_payment: "Pago parcial",
    overpayment_credit: "Saldo a favor",
};

const MOROSIDAD_CONFIG: Record<string, { label: string; className: string }> = {
    al_dia: { label: "Al corriente", className: "bg-emerald-100 text-emerald-800" },
    pendiente: { label: "Pendiente", className: "bg-amber-100 text-amber-800" },
    moroso: { label: "Moroso", className: "bg-orange-100 text-orange-800" },
    critico: { label: "Crítico", className: "bg-red-100 text-red-800" },
    legal: { label: "En proceso legal", className: "bg-purple-100 text-purple-800" },
};

// ─── componente principal ─────────────────────────────────────────────────────
export function EstadoCuenta({ residencialId, houseId }: EstadoCuentaProps) {
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [balance, setBalance] = useState<HouseBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [houseName, setHouseName] = useState<string>(houseId);

    // Cargar nombre de la casa
    useEffect(() => {
        const fetchHouseName = async () => {
            try {
                const houseDoc = await getDoc(
                    doc(db, "residenciales", residencialId, "houses", houseId)
                );
                if (houseDoc.exists()) {
                    const d = houseDoc.data();
                    const name = d?.calle
                        ? `${d.calle} ${d.numero || d.houseNumber || ""}`.trim()
                        : houseId;
                    setHouseName(name);
                }
            } catch { /* silencioso */ }
        };
        fetchHouseName();
    }, [residencialId, houseId]);

    // Real-time ledger entries
    useEffect(() => {
        const ledgerRef = collection(
            db,
            "residenciales",
            residencialId,
            "houses",
            houseId,
            "ledger"
        );
        const q = query(ledgerRef, orderBy("createdAt", "desc"));

        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as LedgerEntry));
            setEntries(data);
            setLoading(false);
        });

        return () => unsub();
    }, [residencialId, houseId]);

    // Real-time balance
    useEffect(() => {
        const balanceRef = doc(
            db,
            "residenciales",
            residencialId,
            "housePaymentBalance",
            houseId
        );
        const unsub = onSnapshot(balanceRef, (snap) => {
            if (snap.exists()) setBalance(snap.data() as HouseBalance);
        });
        return () => unsub();
    }, [residencialId, houseId]);

    const charges = entries.filter((e) => e.impact === "INCREASE_DEBT" && e.status === "applied");
    const payments = entries.filter((e) => e.impact === "DECREASE_DEBT" && e.status === "applied");
    const reversals = entries.filter((e) => e.status === "reversed");

    const totalCharged = charges.reduce((s, e) => s + (e.amountInCents ?? e.amount), 0);
    const totalPaid = payments.reduce((s, e) => s + (e.amountInCents ?? e.amount), 0);

    const morosidadInfo = MOROSIDAD_CONFIG[balance?.estadoMorosidad ?? "al_dia"] ??
        MOROSIDAD_CONFIG["al_dia"];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Header / Balance ── */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <Home className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-white/60 uppercase tracking-wider">Estado de Cuenta</p>
                            <p className="text-lg font-bold">{houseName}</p>
                        </div>
                    </div>
                    <Badge className={`${morosidadInfo.className} border-transparent`}>
                        {morosidadInfo.label}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                    {/* Deuda actual */}
                    <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-white/50 mb-1">Saldo pendiente</p>
                        <p className={`text-2xl font-black ${(balance?.deudaAcumulada ?? 0) > 0 ? "text-red-400" : "text-emerald-400"}`}>
                            {fmt$(balance?.deudaAcumulada ?? 0)}
                        </p>
                        {(balance?.diasAtrasoMayorDeuda ?? 0) > 0 && (
                            <p className="text-xs text-red-300 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {balance!.diasAtrasoMayorDeuda} días de atraso
                            </p>
                        )}
                    </div>

                    {/* Saldo a favor */}
                    <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-white/50 mb-1">Saldo a favor</p>
                        <p className="text-2xl font-black text-emerald-400">
                            {fmt$(balance?.saldoAFavor ?? 0)}
                        </p>
                        <p className="text-xs text-white/40 mt-1">
                            Actualizado {fmtRelative(balance?.updatedAt)}
                        </p>
                    </div>
                </div>

                {/* Totales */}
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <div>
                            <p className="text-xs text-white/50">Total facturado</p>
                            <p className="text-sm font-bold">{fmt$(totalCharged)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <div>
                            <p className="text-xs text-white/50">Total cobrado</p>
                            <p className="text-sm font-bold">{fmt$(totalPaid)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Historial de movimientos ── */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Historial de Movimientos</h3>
                    <span className="text-xs text-gray-400">{entries.length} registros</span>
                </div>

                {entries.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <FileText className="w-8 h-8 mx-auto mb-3 opacity-40" />
                        <p>Sin movimientos registrados</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {entries.map((entry) => {
                            const isCharge = entry.impact === "INCREASE_DEBT";
                            const isReversed = entry.status === "reversed";
                            const cents = entry.amountInCents ?? entry.amount;

                            return (
                                <div
                                    key={entry.id}
                                    className={`flex items-center gap-4 px-5 py-4 ${isReversed ? "opacity-50" : "hover:bg-slate-50 dark:hover:bg-slate-900/50"} transition-colors`}
                                >
                                    {/* Icon */}
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isReversed ? "bg-gray-100" :
                                            entry.type === "REVERSAL" ? "bg-purple-100" :
                                                isCharge ? "bg-red-50" : "bg-emerald-50"
                                        }`}>
                                        {isReversed || entry.type === "REVERSAL" ? (
                                            <RefreshCcw className="w-4 h-4 text-gray-400" />
                                        ) : isCharge ? (
                                            <ArrowUpCircle className="w-4 h-4 text-red-500" />
                                        ) : (
                                            <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                {subTypeLabel[entry.subType] ?? entry.subType}
                                            </p>
                                            {isReversed && (
                                                <Badge className="bg-gray-100 text-gray-500 text-[10px] border-transparent">
                                                    Revertido
                                                </Badge>
                                            )}
                                            {entry.folio && (
                                                <Badge className="bg-blue-50 text-blue-600 text-[10px] border-transparent font-mono">
                                                    {entry.folio}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5 truncate">{entry.description}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-gray-400">{fmtDate(entry.createdAt)}</span>
                                            {entry.periodKey && (
                                                <span className="text-xs text-gray-400">· Periodo {entry.periodKey}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="text-right flex-shrink-0">
                                        <p className={`text-sm font-bold ${isReversed ? "text-gray-400 line-through" :
                                                entry.type === "REVERSAL" ? "text-purple-600" :
                                                    isCharge ? "text-red-600" : "text-emerald-600"
                                            }`}>
                                            {isCharge ? "+" : "−"}{fmt$(cents)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
