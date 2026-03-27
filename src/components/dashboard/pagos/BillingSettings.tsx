"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings, Save, Loader2, DollarSign, Calendar, Clock, AlertTriangle, Shield, Zap,
} from "lucide-react";

export default function BillingSettings({ residencialId }: { residencialId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monthlyFee, setMonthlyFee] = useState(1150);
  const [billingDay, setBillingDay] = useState(1);
  const [dueDay, setDueDay] = useState(10);
  const [lateFeeType, setLateFeeType] = useState<"fixed" | "percentage">("fixed");
  const [lateFeeValue, setLateFeeValue] = useState(200);
  const [autoLateFee, setAutoLateFee] = useState(true);

  useEffect(() => {
    getDoc(doc(db, `residenciales/${residencialId}/settings/billing`))
      .then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          setMonthlyFee((d.defaultMonthlyFeeCents ?? 115000) / 100);
          setBillingDay(d.billingDayOfMonth ?? 1);
          setDueDay(d.dueDayOfMonth ?? 10);
          setLateFeeType(d.lateFeeType ?? "fixed");
          setLateFeeValue(d.lateFeeType === "percentage" ? (d.lateFeeValue ?? 0) : (d.lateFeeValue ?? 20000) / 100);
          setAutoLateFee(d.applyLateFeeAutomatically ?? true);
        }
      })
      .catch(() => toast.error("Error al cargar configuración"))
      .finally(() => setLoading(false));
  }, [residencialId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, `residenciales/${residencialId}/settings/billing`), {
        defaultMonthlyFeeCents: Math.round(monthlyFee * 100),
        billingDayOfMonth: billingDay,
        dueDayOfMonth: dueDay,
        lateFeeType,
        lateFeeValue: lateFeeType === "percentage" ? lateFeeValue : Math.round(lateFeeValue * 100),
        applyLateFeeAutomatically: autoLateFee,
      }, { merge: true });
      toast.success("Configuración guardada");
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 grid-cols-2"><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-32 rounded-xl" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-black text-slate-900">Configuración de Cobros</h3>
        <p className="text-sm text-muted-foreground">Variables del sistema de cobro de la comunidad</p>
      </div>

      {/* Main fee */}
      <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-white rounded-xl overflow-hidden">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-black text-slate-900">Cuota mensual</p>
              <p className="text-xs text-muted-foreground">Monto que se cobra a cada vivienda por mes</p>
            </div>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 font-black text-xl">$</span>
            <Input type="number" min={0} value={monthlyFee} onChange={e => setMonthlyFee(parseFloat(e.target.value) || 0)}
              className="h-14 rounded-xl font-black text-2xl text-blue-700 pl-9 border-blue-200 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 ml-1">Equivalente a {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(monthlyFee)} MXN por vivienda</p>
        </CardContent>
      </Card>

      {/* Billing days */}
      <div className="grid gap-4 grid-cols-2">
        <Card className="border-none shadow-sm bg-white rounded-xl">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">Día de cobro</p>
                <p className="text-[10px] text-muted-foreground">Día del mes que se genera el cargo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" min={1} max={28} value={billingDay}
                onChange={e => setBillingDay(Math.max(1, Math.min(28, parseInt(e.target.value) || 1)))}
                className="h-12 rounded-xl font-black text-lg text-center w-20" />
              <span className="text-sm text-muted-foreground">de cada mes</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-xl">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900">Día de vencimiento</p>
                <p className="text-[10px] text-muted-foreground">Fecha límite para pagar sin recargo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" min={1} max={28} value={dueDay}
                onChange={e => setDueDay(Math.max(1, Math.min(28, parseInt(e.target.value) || 1)))}
                className="h-12 rounded-xl font-black text-lg text-center w-20" />
              <span className="text-sm text-muted-foreground">de cada mes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Late fees */}
      <Card className="border-none shadow-sm bg-white rounded-xl">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-black text-slate-900">Recargos por mora</p>
              <p className="text-xs text-muted-foreground">Penalización que se aplica después del vencimiento</p>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 mb-4">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tipo de recargo</label>
              <div className="flex gap-2 mt-1.5">
                <button onClick={() => setLateFeeType("fixed")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    lateFeeType === "fixed" ? "bg-red-600 text-white shadow-sm" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}>$ Monto fijo</button>
                <button onClick={() => setLateFeeType("percentage")}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    lateFeeType === "percentage" ? "bg-red-600 text-white shadow-sm" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}>% Porcentaje</button>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                {lateFeeType === "percentage" ? "Porcentaje (%)" : "Monto ($)"}
              </label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  {lateFeeType === "percentage" ? "%" : "$"}
                </span>
                <Input type="number" min={0} value={lateFeeValue}
                  onChange={e => setLateFeeValue(parseFloat(e.target.value) || 0)}
                  className="h-12 rounded-xl font-bold text-lg pl-8" />
              </div>
            </div>
          </div>

          {/* Auto toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-sm font-bold text-slate-800">Aplicar recargos automáticamente</p>
                <p className="text-[10px] text-muted-foreground">El sistema aplicará el recargo el día 6 de cada mes</p>
              </div>
            </div>
            <button onClick={() => setAutoLateFee(!autoLateFee)}
              className={`relative h-7 w-12 rounded-full transition-colors ${autoLateFee ? "bg-emerald-500" : "bg-slate-300"}`}>
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${autoLateFee ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Button className="w-full h-12 rounded-xl font-black text-base bg-slate-900 hover:bg-slate-800 shadow-sm"
        onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
        {saving ? "Guardando..." : "Guardar configuración"}
      </Button>
    </div>
  );
}
