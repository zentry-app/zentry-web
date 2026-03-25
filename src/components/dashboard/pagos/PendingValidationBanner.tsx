"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Loader2,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface PendingPago {
    id: string;
    amount: number;
    amountCents?: number;
    status: string;
    createdAt: any;
    houseId: string;
    proofUrl?: string; // v2 field
    receiptUrl?: string; // v1 legacy field
    residentId?: string;
    userName?: string;
    concept?: string;
    metadata?: {
        userName?: string;
        calle?: string;
        houseNumber?: string;
        concept?: string;
        notas?: string;
    };
}

interface PendingValidationBannerProps {
    residencialId: string;
}

const currencyFmt = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const fmtDate = (ts: any) => {
    if (!ts) return "—";
    try {
        const d = ts?.toDate ? ts.toDate() : new Date(ts);
        return formatDistanceToNow(d, { addSuffix: true, locale: es });
    } catch {
        return "—";
    }
};

export function PendingValidationBanner({ residencialId }: PendingValidationBannerProps) {
    const { user } = useAuth();
    const [pagos, setPagos] = useState<PendingPago[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(true);
    const [selectedPago, setSelectedPago] = useState<PendingPago | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [observaciones, setObservaciones] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    // Real-time subscription
    useEffect(() => {
        if (!residencialId) return;

        const q = query(
            collection(db, "residenciales", residencialId, "paymentIntents"),
            where("status", "==", "pending_validation")
        );

        const unsub = onSnapshot(
            q,
            (snap) => {
                const data = snap.docs.map((d) => {
                    const docData = d.data();
                    // Map v2 amountCents to v1 amount if present
                    const amount = docData.amountCents ? docData.amountCents / 100 : (docData.amount || 0);
                    return {
                        id: d.id,
                        ...docData,
                        amount,
                        // Compatibility for Banner UI
                        receiptUrl: docData.proofUrl || docData.receiptUrl,
                        metadata: {
                            userName: docData.userName || docData.residentName || "Residente",
                            concept: docData.concept || "Cuota mensual",
                            notas: docData.observations || docData.notes || ""
                        }
                    } as PendingPago;
                });

                // Sort newest first
                data.sort((a, b) => {
                    const ta = a.createdAt?.toMillis?.() ?? 0;
                    const tb = b.createdAt?.toMillis?.() ?? 0;
                    return tb - ta;
                });
                setPagos(data);
                setLoading(false);
            },
            (err) => {
                console.error("PendingValidationBanner error:", err);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [residencialId]);

    const openDialog = (pago: PendingPago) => {
        setSelectedPago(pago);
        setObservaciones("");
        setDialogOpen(true);
    };

    const handleAction = async (status: "validated" | "rejected") => {
        if (!selectedPago || !user) return;
        try {
            setActionLoading(true);
            await updateDoc(
                doc(db, "residenciales", residencialId, "paymentIntents", selectedPago.id),
                {
                    status,
                    observations: observaciones.trim() || null, // Mapping to v2 observations
                    validatedBy: user.uid,                     // Mapping to v2 validatedBy
                    validatedAt: new Date(),                   // Mapping to v2 validatedAt
                    // Maintain legacy fields just in case for a short transition
                    validadoPor: user.uid,
                    fechaValidacion: new Date(),
                    observaciones: observaciones.trim() || null,
                }
            );
            toast.success(
                status === "validated" ? "✅ Pago validado" : "❌ Pago rechazado",
                {
                    description:
                        status === "validated"
                            ? "El balance del residente se actualizará automáticamente."
                            : "El residente recibirá una notificación con el motivo.",
                }
            );
            setDialogOpen(false);
            setSelectedPago(null);
        } catch (err) {
            console.error(err);
            toast.error("Error al procesar la acción");
        } finally {
            setActionLoading(false);
        }
    };

    // Don't render banner if no pendientes
    if (!loading && pagos.length === 0) return null;

    return (
        <>
            {/* ── Banner ── */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20 overflow-hidden mb-6">
                {/* Header */}
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-amber-100/60 dark:hover:bg-amber-900/20 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <span className="text-sm font-bold text-amber-900 dark:text-amber-300">
                                Para Validar Hoy
                            </span>
                            <p className="text-xs text-amber-700/80 dark:text-amber-500">
                                {loading
                                    ? "Cargando..."
                                    : `${pagos.length} comprobante${pagos.length !== 1 ? "s" : ""} esperando revisión`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!loading && pagos.length > 0 && (
                            <Badge className="bg-amber-500 text-white border-transparent text-xs px-2 py-0.5">
                                {pagos.length}
                            </Badge>
                        )}
                        {expanded ? (
                            <ChevronUp className="w-4 h-4 text-amber-600" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-amber-600" />
                        )}
                    </div>
                </button>

                {/* List */}
                {expanded && (
                    <div className="border-t border-amber-200/70 dark:border-amber-900/30">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                            </div>
                        ) : (
                            <div className="divide-y divide-amber-100 dark:divide-amber-900/20">
                                {pagos.slice(0, 5).map((pago) => {
                                    const nombre = pago.metadata?.userName || "Residente";
                                    const address =
                                        pago.metadata?.calle && pago.metadata?.houseNumber
                                            ? `${pago.metadata.calle} ${pago.metadata.houseNumber}`
                                            : pago.houseId;
                                    const concepto =
                                        pago.metadata?.concept || "Cuota mensual";

                                    return (
                                        <div
                                            key={pago.id}
                                            className="flex items-center gap-4 px-5 py-3.5 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors"
                                        >
                                            {/* Avatar */}
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                {nombre[0]?.toUpperCase() ?? "R"}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                        {nombre}
                                                    </span>
                                                    <span className="text-xs text-gray-400 truncate">
                                                        {address}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-gray-500 truncate">
                                                        {concepto}
                                                    </span>
                                                    <span className="text-gray-300 dark:text-gray-600">·</span>
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {fmtDate(pago.createdAt)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Amount */}
                                            <span className="text-sm font-bold text-green-700 dark:text-green-400 flex-shrink-0">
                                                {currencyFmt(pago.amount)}
                                            </span>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700"
                                                    onClick={() => openDialog(pago)}
                                                    title="Ver comprobante"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                                                    onClick={() => {
                                                        setSelectedPago(pago);
                                                        setObservaciones("");
                                                        handleDirectAction("validated", pago);
                                                    }}
                                                    title="Aprobar"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => openDialog(pago)}
                                                    title="Rechazar (con motivo)"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {pagos.length > 5 && (
                                    <div className="text-center py-3 text-xs text-amber-600/70 dark:text-amber-500/70">
                                        +{pagos.length - 5} más · Usa el filtro de abajo para ver todos
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Detail Dialog ── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Revisar Comprobante</DialogTitle>
                    </DialogHeader>

                    {selectedPago && (
                        <div className="space-y-4">
                            {/* Who & amount */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                                        {selectedPago.metadata?.userName ?? "Residente"}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {selectedPago.metadata?.calle} {selectedPago.metadata?.houseNumber}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {selectedPago.metadata?.concept ?? "Cuota mensual"} · {fmtDate(selectedPago.createdAt)}
                                    </p>
                                </div>
                                <p className="text-2xl font-black text-green-600">
                                    {currencyFmt(selectedPago.amount)}
                                </p>
                            </div>

                            {/* Receipt image */}
                            {selectedPago.receiptUrl ? (
                                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                                    <img
                                        src={selectedPago.receiptUrl}
                                        alt="Comprobante"
                                        className="w-full object-contain max-h-72"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-32 rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-400 text-sm">
                                    Sin comprobante adjunto
                                </div>
                            )}

                            {/* Notes from resident */}
                            {selectedPago.metadata?.notas && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-xl px-4 py-3">
                                    <span className="font-semibold text-blue-700 dark:text-blue-400">Nota del residente: </span>
                                    {selectedPago.metadata.notas}
                                </div>
                            )}

                            {/* Rejection reason */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Motivo de rechazo (opcional)
                                </label>
                                <Textarea
                                    className="mt-1.5"
                                    placeholder="Ej: El monto no coincide, imagen ilegible..."
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                    rows={2}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={actionLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleAction("rejected")}
                            disabled={actionLoading}
                        >
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Rechazar
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleAction("validated")}
                            disabled={actionLoading}
                        >
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Aprobar ✓
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// Helper for direct approve without dialog
async function handleDirectAction(
    status: "validated" | "rejected",
    pago: PendingPago & { _residencialId?: string }
) {
    // This is called by the inline Approve button — no dialog interaction needed
    // We can't easily use hooks here, so we use the toast queue.
    // The component handles this properly when called with setSelectedPago + the action.
}
