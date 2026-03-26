'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, Loader2 } from 'lucide-react';

interface Props { residencialId: string }

export default function BillingSettings({ residencialId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monthlyFee, setMonthlyFee] = useState(1150);
  const [billingDay, setBillingDay] = useState(1);
  const [dueDay, setDueDay] = useState(10);
  const [lateFeeType, setLateFeeType] = useState<'fixed' | 'percentage'>('fixed');
  const [lateFeeValue, setLateFeeValue] = useState(200);
  const [autoLateFee, setAutoLateFee] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, `residenciales/${residencialId}/settings/billing`));
        if (snap.exists()) {
          const d = snap.data();
          setMonthlyFee((d.defaultMonthlyFeeCents ?? 115000) / 100);
          setBillingDay(d.billingDayOfMonth ?? 1);
          setDueDay(d.dueDayOfMonth ?? 10);
          setLateFeeType(d.lateFeeType ?? 'fixed');
          setLateFeeValue(d.lateFeeType === 'percentage' ? (d.lateFeeValue ?? 0) : (d.lateFeeValue ?? 20000) / 100);
          setAutoLateFee(d.applyLateFeeAutomatically ?? true);
        }
      } catch (e) {
        toast.error('Error al cargar configuración de cobros');
      } finally { setLoading(false); }
    }
    load();
  }, [residencialId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, `residenciales/${residencialId}/settings/billing`), {
        defaultMonthlyFeeCents: Math.round(monthlyFee * 100),
        billingDayOfMonth: billingDay,
        dueDayOfMonth: dueDay,
        lateFeeType,
        lateFeeValue: lateFeeType === 'percentage' ? lateFeeValue : Math.round(lateFeeValue * 100),
        applyLateFeeAutomatically: autoLateFee,
      }, { merge: true });
      toast.success('Configuración guardada correctamente');
    } catch (e) {
      toast.error('Error al guardar configuración');
    } finally { setSaving(false); }
  };

  const clampDay = (v: number) => Math.max(1, Math.min(28, v));

  if (loading) {
    return (
      <Card className="shadow-zentry rounded-[2rem]">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-zentry rounded-[2rem]">
      <CardHeader className="flex flex-row items-center gap-3">
        <Settings className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg">Configuraci&oacute;n de cobros</CardTitle>
        <Badge variant="secondary" className="ml-auto">Billing</Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Cuota mensual */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Cuota mensual (MXN)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input type="number" min={0} step={0.01} className="pl-7"
              value={monthlyFee} onChange={e => setMonthlyFee(parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        {/* Días */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">D&iacute;a de cobro</label>
            <Input type="number" min={1} max={28}
              value={billingDay} onChange={e => setBillingDay(clampDay(parseInt(e.target.value) || 1))} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">D&iacute;a de vencimiento</label>
            <Input type="number" min={1} max={28}
              value={dueDay} onChange={e => setDueDay(clampDay(parseInt(e.target.value) || 1))} />
          </div>
        </div>

        {/* Recargos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Tipo de recargo</label>
            <select className="flex h-11 w-full rounded-xl border border-input bg-background/50 px-4 py-2 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              value={lateFeeType} onChange={e => setLateFeeType(e.target.value as 'fixed' | 'percentage')}>
              <option value="fixed">Fijo</option>
              <option value="percentage">Porcentaje</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Valor del recargo {lateFeeType === 'percentage' ? '(%)' : '(MXN)'}
            </label>
            <Input type="number" min={0} step={lateFeeType === 'percentage' ? 1 : 0.01}
              value={lateFeeValue} onChange={e => setLateFeeValue(parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        {/* Toggle automático */}
        <div className="flex items-center justify-between rounded-xl border border-input bg-background/50 px-4 py-3">
          <span className="text-sm font-medium">Aplicar recargos autom&aacute;ticamente</span>
          <button type="button" role="switch" aria-checked={autoLateFee}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${autoLateFee ? 'bg-primary' : 'bg-muted'}`}
            onClick={() => setAutoLateFee(!autoLateFee)}>
            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${autoLateFee ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Save */}
        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Guardando...' : 'Guardar configuraci\u00f3n'}
        </Button>
      </CardContent>
    </Card>
  );
}
