"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase/config';
import {
  collection, getDocs, addDoc, query, orderBy, limit,
  Timestamp, serverTimestamp,
} from 'firebase/firestore';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, TrendingUp, TrendingDown, DollarSign, Loader2 } from 'lucide-react';

interface AdministrativeMovement {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amountCents: number;
  date: Timestamp;
  method: 'cash' | 'transfer' | 'card' | 'check';
  supplier?: string;
  reference?: string;
  createdBy: string;
  createdAt: Timestamp;
}

const EXPENSE_CATEGORIES = [
  'Mantenimiento', 'Servicios (agua/luz/gas)', 'Proveedor',
  'Seguridad', 'Limpieza', 'Administrativo', 'Otro',
];
const INCOME_CATEGORIES = [
  'Donación', 'Renta', 'Evento', 'Multa cobrada', 'Intereses', 'Otro',
];
const METHODS: { value: AdministrativeMovement['method']; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'check', label: 'Cheque' },
];

const formatMXN = (cents: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);

const methodLabel = (m: string) =>
  METHODS.find((x) => x.value === m)?.label ?? m;

export default function MovementsManager({ residencialId }: { residencialId: string }) {
  const [movements, setMovements] = useState<AdministrativeMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    method: 'cash' as AdministrativeMovement['method'],
    supplier: '',
    reference: '',
  });

  const colRef = collection(db, `residenciales/${residencialId}/administrativeMovements`);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(colRef, orderBy('date', 'desc'), limit(50));
      const snap = await getDocs(q);
      setMovements(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdministrativeMovement)));
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  }, [residencialId]);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  const openDialog = (type: 'income' | 'expense') => {
    setForm({
      type,
      category: '',
      description: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      method: 'cash',
      supplier: '',
      reference: '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.category || !form.description || !form.amount) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    setSaving(true);
    try {
      const amountCents = Math.round(parseFloat(form.amount) * 100);
      if (isNaN(amountCents) || amountCents <= 0) {
        toast.error('Monto inválido');
        setSaving(false);
        return;
      }
      await addDoc(colRef, {
        type: form.type,
        category: form.category,
        description: form.description,
        amountCents,
        date: Timestamp.fromDate(new Date(form.date + 'T12:00:00')),
        method: form.method,
        ...(form.type === 'expense' && form.supplier ? { supplier: form.supplier } : {}),
        ...(form.reference ? { reference: form.reference } : {}),
        createdBy: 'admin',
        createdAt: serverTimestamp(),
      });
      toast.success(form.type === 'income' ? 'Ingreso registrado' : 'Egreso registrado');
      setDialogOpen(false);
      fetchMovements();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const categories = form.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <Card className="shadow-zentry rounded-[2rem] bg-white/80">
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Movimientos Administrativos
        </CardTitle>
        <div className="flex gap-2">
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => openDialog('income')}>
            <Plus className="h-4 w-4 mr-1" /> Ingreso
          </Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => openDialog('expense')}>
            <Plus className="h-4 w-4 mr-1" /> Egreso
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : movements.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Sin movimientos registrados</p>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <div className="space-y-2">
              {movements.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-4 rounded-xl border p-3 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {m.type === 'income' ? (
                      <TrendingUp className="h-4 w-4 shrink-0 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 shrink-0 text-red-600" />
                    )}
                    <Badge variant={m.type === 'income' ? 'default' : 'destructive'} className="shrink-0">
                      {m.type === 'income' ? 'Ingreso' : 'Egreso'}
                    </Badge>
                    <span className="text-muted-foreground shrink-0">
                      {m.date?.toDate?.().toLocaleDateString('es-MX') ?? '—'}
                    </span>
                    <span className="font-medium truncate">{m.category}</span>
                    <span className="text-muted-foreground truncate hidden sm:inline">{m.description}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">{methodLabel(m.method)}</span>
                    <span className={`font-semibold ${m.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {m.type === 'income' ? '+' : '-'}{formatMXN(m.amountCents)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>
              {form.type === 'income' ? 'Registrar Ingreso' : 'Registrar Egreso'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Descripción"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <Input
              type="number"
              placeholder="Monto (pesos)"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />

            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />

            <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v as AdministrativeMovement['method'] })}>
              <SelectTrigger><SelectValue placeholder="Método de pago" /></SelectTrigger>
              <SelectContent>
                {METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {form.type === 'expense' && (
              <Input
                placeholder="Proveedor"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              />
            )}

            <Input
              placeholder="Referencia (opcional)"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
            />

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
