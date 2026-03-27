"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, addDoc, doc, updateDoc, query, orderBy, limit, Timestamp, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, TrendingUp, TrendingDown, DollarSign, Loader2, Search,
  Receipt, Wallet, Building2, Zap, ShieldCheck, Trash2, Calendar,
  Check, Pencil, RotateCcw, Ban,
} from "lucide-react";
import { CatalogService, Supplier, SUPPLIER_CATEGORY_LABELS } from "@/lib/services/catalog-service";

interface Movement {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amountCents: number;
  date: Timestamp;
  method: "cash" | "transfer" | "card" | "check";
  supplier?: string;
  supplierId?: string;
  supplierName?: string;
  reference?: string;
  createdBy: string;
  createdAt: Timestamp;
  status?: "active" | "voided";
  voidedReason?: string;
  voidedAt?: Timestamp;
  voidedBy?: string;
}

const EXPENSE_CATEGORIES = [
  { value: "maintenance", label: "Mantenimiento", icon: Building2 },
  { value: "utilities", label: "Servicios (agua/luz/gas)", icon: Zap },
  { value: "supplier", label: "Proveedor", icon: Receipt },
  { value: "security", label: "Seguridad", icon: ShieldCheck },
  { value: "cleaning", label: "Limpieza", icon: Trash2 },
  { value: "admin", label: "Administrativo", icon: Wallet },
  { value: "other", label: "Otro", icon: DollarSign },
];

const INCOME_CATEGORIES = [
  { value: "donation", label: "Donación", icon: DollarSign },
  { value: "rental", label: "Renta", icon: Building2 },
  { value: "event", label: "Evento", icon: Calendar },
  { value: "penalty", label: "Multa cobrada", icon: ShieldCheck },
  { value: "interest", label: "Intereses", icon: TrendingUp },
  { value: "other", label: "Otro", icon: Wallet },
];

const METHODS = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "card", label: "Tarjeta" },
  { value: "check", label: "Cheque" },
];

const fmtMXN = (cents: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(cents / 100);

const fmtDate = (ts: any) => {
  const d = ts?.toDate?.() ?? (ts?.seconds ? new Date(ts.seconds * 1000) : null);
  return d ? d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "—";
};

export default function MovementsManager({ residencialId }: { residencialId: string }) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [search, setSearch] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierMode, setSupplierMode] = useState<"catalog" | "custom">("catalog");
  const [voidTarget, setVoidTarget] = useState<Movement | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);
  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    category: "",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    method: "cash" as Movement["method"],
    supplierId: "",
    supplierName: "",
    reference: "",
  });

  const colRef = collection(db, `residenciales/${residencialId}/administrativeMovements`);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(colRef, orderBy("date", "desc"), limit(100));
      const snap = await getDocs(q);
      setMovements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Movement)));
    } catch { toast.error("Error al cargar movimientos"); }
    finally { setLoading(false); }
  }, [residencialId]);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  // Load suppliers catalog
  useEffect(() => {
    setLoadingSuppliers(true);
    CatalogService.getSuppliers(residencialId)
      .then(all => setSuppliers(all.filter(s => s.active)))
      .catch(() => {})
      .finally(() => setLoadingSuppliers(false));
  }, [residencialId]);

  const activeSuppliers = suppliers;

  const openDialog = (type: "income" | "expense") => {
    setForm({ type, category: "", description: "", amount: "", date: new Date().toISOString().slice(0, 10), method: "cash", supplierId: "", supplierName: "", reference: "" });
    setSupplierMode("catalog");
    setDialogOpen(true);
    // Refresh suppliers each time dialog opens (in case new ones were added in Administración)
    if (type === "expense") {
      CatalogService.getSuppliers(residencialId)
        .then(all => setSuppliers(all.filter(s => s.active)))
        .catch(() => {});
    }
  };

  const handleSave = async () => {
    if (!form.category || !form.description || !form.amount) { toast.error("Completa los campos obligatorios"); return; }
    const amountCents = Math.round(parseFloat(form.amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) { toast.error("Monto inválido"); return; }
    setSaving(true);
    try {
      const supplierFields: Record<string, string> = {};
      if (form.type === "expense" && form.supplierName) {
        supplierFields.supplierName = form.supplierName;
        if (form.supplierId) supplierFields.supplierId = form.supplierId;
        // Backwards compat: also write the old `supplier` field
        supplierFields.supplier = form.supplierName;
      }

      await addDoc(colRef, {
        type: form.type, category: form.category, description: form.description, amountCents,
        date: Timestamp.fromDate(new Date(form.date + "T12:00:00")),
        method: form.method,
        ...supplierFields,
        ...(form.reference ? { reference: form.reference } : {}),
        createdBy: "admin", createdAt: serverTimestamp(), status: "active",
      });
      toast.success(form.type === "income" ? "Ingreso registrado" : "Egreso registrado");
      setDialogOpen(false);
      fetchMovements();
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const handleVoid = async () => {
    if (!voidTarget || !voidReason.trim()) { toast.error("Ingresa un motivo"); return; }
    setVoiding(true);
    try {
      const ref = doc(db, `residenciales/${residencialId}/administrativeMovements/${voidTarget.id}`);
      await updateDoc(ref, {
        status: "voided",
        voidedReason: voidReason.trim(),
        voidedAt: serverTimestamp(),
        voidedBy: "admin",
      });
      toast.success("Movimiento anulado");
      setVoidTarget(null); setVoidReason("");
      fetchMovements();
    } catch { toast.error("Error al anular"); }
    finally { setVoiding(false); }
  };

  // Computed
  const filtered = useMemo(() => {
    let list = movements;
    if (filter !== "all") list = list.filter(m => m.type === filter);
    if (search) { const q = search.toLowerCase(); list = list.filter(m => m.description.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || (m.supplierName || m.supplier || "").toLowerCase().includes(q)); }
    return list;
  }, [movements, filter, search]);

  const totals = useMemo(() => {
    const active = movements.filter(m => m.status !== "voided");
    const inc = active.filter(m => m.type === "income").reduce((s, m) => s + m.amountCents, 0);
    const exp = active.filter(m => m.type === "expense").reduce((s, m) => s + m.amountCents, 0);
    return { income: inc, expense: exp, balance: inc - exp };
  }, [movements]);

  const categories = form.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const selectSupplier = (s: Supplier) => {
    setForm({ ...form, supplierId: s.id, supplierName: s.name });
    setSupplierMode("catalog");
  };

  const selectCustomSupplier = () => {
    setForm({ ...form, supplierId: "", supplierName: "" });
    setSupplierMode("custom");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-xl font-black text-slate-900">Movimientos Administrativos</h3>
        <p className="text-sm text-muted-foreground">Ingresos y egresos de la comunidad</p>
      </div>

      {/* KPI summary */}
      <div className="grid gap-3 grid-cols-3">
        <Card className="border-none shadow-sm bg-emerald-50 rounded-xl">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Ingresos</span>
            </div>
            <div className="text-lg font-black text-emerald-700">{fmtMXN(totals.income)}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-red-50 rounded-xl">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-red-600" />
              <span className="text-[10px] font-bold text-red-600 uppercase">Egresos</span>
            </div>
            <div className="text-lg font-black text-red-700">{fmtMXN(totals.expense)}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-blue-50 rounded-xl">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-[10px] font-bold text-blue-600 uppercase">Balance</span>
            </div>
            <div className={`text-lg font-black ${totals.balance >= 0 ? "text-blue-700" : "text-red-700"}`}>{fmtMXN(totals.balance)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="border-none shadow-sm bg-white rounded-xl">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Action buttons */}
            <Button size="sm" className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 shadow-sm" onClick={() => openDialog("income")}>
              <Plus className="h-4 w-4 mr-1.5" />Ingreso
            </Button>
            <Button size="sm" className="rounded-xl font-bold bg-red-600 hover:bg-red-700 shadow-sm" onClick={() => openDialog("expense")}>
              <Plus className="h-4 w-4 mr-1.5" />Egreso
            </Button>

            <div className="flex-1" />

            {/* Filters */}
            <div className="flex items-center gap-1.5">
              {[
                { key: "all", label: "Todos" },
                { key: "income", label: "Ingresos" },
                { key: "expense", label: "Egresos" },
              ].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === f.key ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  }`}>{f.label}</button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 w-40 text-sm rounded-lg border-slate-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements table */}
      <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-sm text-slate-500">{movements.length === 0 ? "Sin movimientos registrados" : "Sin resultados"}</p>
              <p className="text-xs text-muted-foreground mt-1">Registra ingresos y egresos con los botones de arriba</p>
            </div>
          ) : (
            <ScrollArea className="h-[450px]">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b bg-slate-50/80 sticky top-0">
                    <th className="text-left py-3 pl-4">Fecha</th>
                    <th className="text-left py-3">Tipo</th>
                    <th className="text-left py-3">Categoría</th>
                    <th className="text-left py-3">Descripción</th>
                    <th className="text-left py-3">Método</th>
                    <th className="text-right py-3">Monto</th>
                    <th className="py-3 pr-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => {
                    const isIncome = m.type === "income";
                    const isVoided = m.status === "voided";
                    const displaySupplier = m.supplierName || m.supplier;
                    return (
                      <tr key={m.id} className={`group border-b border-slate-50 transition-colors text-xs ${isVoided ? "opacity-50" : "hover:bg-slate-50/50"}`}>
                        <td className="py-2.5 pl-4 text-muted-foreground whitespace-nowrap">{fmtDate(m.date)}</td>
                        <td className="py-2.5">
                          {isVoided ? (
                            <Badge className="text-[10px] font-bold border-0 rounded-md bg-slate-200 text-slate-500">Anulado</Badge>
                          ) : (
                            <Badge className={`text-[10px] font-bold border-0 rounded-md ${isIncome ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                              {isIncome ? "Ingreso" : "Egreso"}
                            </Badge>
                          )}
                        </td>
                        <td className={`py-2.5 font-medium ${isVoided ? "text-slate-400 line-through" : "text-slate-700"}`}>{m.category}</td>
                        <td className={`py-2.5 truncate max-w-[200px] ${isVoided ? "text-slate-400 line-through" : "text-slate-600"}`}>
                          {m.description}
                          {displaySupplier && <span className="text-muted-foreground ml-1">· {displaySupplier}</span>}
                          {isVoided && m.voidedReason && <span className="text-amber-500 ml-1 no-underline">({m.voidedReason})</span>}
                        </td>
                        <td className="py-2.5 text-muted-foreground">{METHODS.find(x => x.value === m.method)?.label || m.method}</td>
                        <td className={`py-2.5 pr-4 text-right font-black ${isVoided ? "text-slate-400 line-through" : isIncome ? "text-emerald-600" : "text-red-600"}`}>
                          {isIncome ? "+" : "-"}{fmtMXN(m.amountCents)}
                        </td>
                        <td className="py-2.5 pr-2 w-8">
                          {!isVoided && (
                            <button onClick={() => { setVoidTarget(m); setVoidReason(""); }}
                              className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-md bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-all"
                              title="Anular movimiento">
                              <Ban className="h-3 w-3 text-amber-700" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t text-xs text-muted-foreground text-right">
                {filtered.length} movimientos
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${form.type === "income" ? "bg-emerald-100" : "bg-red-100"}`}>
                {form.type === "income" ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
              </div>
              {form.type === "income" ? "Registrar ingreso" : "Registrar egreso"}
            </DialogTitle>
            <DialogDescription>
              {form.type === "income" ? "Ingreso no relacionado a cuotas mensuales" : "Gasto administrativo de la comunidad"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Category as cards */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Categoría</label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {categories.map(c => (
                  <button key={c.value} onClick={() => setForm({ ...form, category: c.label })}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-center transition-all ${
                      form.category === c.label
                        ? (form.type === "income" ? "bg-emerald-50 border-2 border-emerald-300 text-emerald-700" : "bg-red-50 border-2 border-red-300 text-red-700")
                        : "bg-slate-50 border border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}>
                    <c.icon className="h-4 w-4" />
                    <span className="text-[10px] font-bold leading-tight">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Descripción</label>
              <Input placeholder="Ej: Pago mensual de jardinería" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="mt-1.5 h-11 rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Monto ($)</label>
                <Input type="number" placeholder="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="mt-1.5 h-11 rounded-xl font-bold text-lg" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Fecha</label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="mt-1.5 h-11 rounded-xl" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Método de pago</label>
              <div className="flex gap-2 mt-1.5">
                {METHODS.map(m => (
                  <button key={m.value} onClick={() => setForm({ ...form, method: m.value as Movement["method"] })}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      form.method === m.value ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}>{m.label}</button>
                ))}
              </div>
            </div>

            {/* Supplier picker — expenses only */}
            {form.type === "expense" && (
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Proveedor <span className="text-slate-300">(opcional)</span></label>
                <div className="mt-1.5 rounded-xl border border-slate-200 overflow-hidden">
                  {loadingSuppliers ? (
                    <div className="p-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando proveedores...
                    </div>
                  ) : (
                    <div className="max-h-[160px] overflow-y-auto">
                      {activeSuppliers.map(s => {
                        const isSelected = supplierMode === "catalog" && form.supplierId === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => selectSupplier(s)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all border-b border-slate-100 last:border-b-0 ${
                              isSelected
                                ? "bg-emerald-50"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div className={`h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                              isSelected ? "bg-emerald-500 text-white" : "bg-slate-100 text-transparent"
                            }`}>
                              <Check className="h-3 w-3" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={`text-xs font-bold truncate ${isSelected ? "text-emerald-700" : "text-slate-700"}`}>
                                {s.name}
                              </div>
                              <div className={`text-[10px] ${isSelected ? "text-emerald-500" : "text-muted-foreground"}`}>
                                {SUPPLIER_CATEGORY_LABELS[s.category] || s.category}
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      {/* "Otro" option */}
                      <button
                        onClick={selectCustomSupplier}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all ${
                          supplierMode === "custom"
                            ? "bg-amber-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className={`h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                          supplierMode === "custom" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400"
                        }`}>
                          <Pencil className="h-3 w-3" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`text-xs font-bold ${supplierMode === "custom" ? "text-amber-700" : "text-slate-500"}`}>
                            Otro (escribir)
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Custom supplier text input */}
                {supplierMode === "custom" && (
                  <Input
                    placeholder="Nombre del proveedor"
                    value={form.supplierName}
                    onChange={e => setForm({ ...form, supplierId: "", supplierName: e.target.value })}
                    className="mt-2 h-10 rounded-xl"
                    autoFocus
                  />
                )}
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Referencia <span className="text-slate-300">(opcional)</span></label>
              <Input placeholder="No. de factura, recibo, etc." value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })}
                className="mt-1.5 h-10 rounded-xl" />
            </div>

            <Button className={`w-full h-12 rounded-xl font-black text-base ${
              form.type === "income" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
            }`} onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              {form.type === "income" ? "Registrar ingreso" : "Registrar egreso"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Void Dialog */}
      {voidTarget && (
        <Dialog open={!!voidTarget} onOpenChange={(o) => { if (!o) { setVoidTarget(null); setVoidReason(""); } }}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-black flex items-center gap-2 text-amber-700">
                <Ban className="h-5 w-5" />
                Anular movimiento
              </DialogTitle>
              <DialogDescription>Esta acción es permanente y quedará registrada.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-amber-600">Tipo</span>
                  <span className="font-bold text-amber-800">{voidTarget.type === "income" ? "Ingreso" : "Egreso"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-600">Monto</span>
                  <span className="font-black text-amber-800">{fmtMXN(voidTarget.amountCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-600">Descripción</span>
                  <span className="font-bold text-amber-800 text-right max-w-[180px] truncate">{voidTarget.description}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase">Motivo de anulación *</label>
                <Input placeholder="Ej: Registro duplicado" value={voidReason}
                  onChange={e => setVoidReason(e.target.value)} className="mt-1 h-10 rounded-xl" />
              </div>
              <Button className="w-full h-11 rounded-xl font-black bg-amber-600 hover:bg-amber-700"
                onClick={handleVoid} disabled={voiding || !voidReason.trim()}>
                {voiding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Ban className="h-4 w-4 mr-2" />}
                Confirmar anulación
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
