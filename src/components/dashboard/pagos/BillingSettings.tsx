"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Save,
  Loader2,
  DollarSign,
  Calendar,
  Clock,
  AlertTriangle,
  Zap,
  Landmark,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Eye,
  EyeOff,
  CreditCard,
  Settings2,
} from "lucide-react";

interface BankAccount {
  id: string;
  banco: string;
  titular: string;
  clabe: string;
  cuenta: string;
  alias: string;
  isActive: boolean;
}

/** Mask a number string: show only last 4 digits */
function maskNumber(value: string): string {
  if (value.length <= 4) return value;
  return (
    "\u2022\u2022\u2022\u2022 "
      .repeat(Math.ceil((value.length - 4) / 4))
      .trimEnd() +
    " " +
    value.slice(-4)
  );
}

export default function BillingSettings({
  residencialId,
}: {
  residencialId: string;
}) {
  // Active section
  const [activeSection, setActiveSection] = useState<
    "bank" | "billing" | "fiscal"
  >("bank");

  // Fiscal data
  const [fiscalData, setFiscalData] = useState({
    razonSocial: "",
    rfc: "",
    domicilioFiscal: "",
  });
  const [savingFiscal, setSavingFiscal] = useState(false);

  // Billing state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monthlyFee, setMonthlyFee] = useState(1150);
  const [billingDay, setBillingDay] = useState(1);
  const [dueDay, setDueDay] = useState(10);
  const [lateFeeType, setLateFeeType] = useState<"fixed" | "percentage">(
    "fixed",
  );
  const [lateFeeValue, setLateFeeValue] = useState(200);
  const [autoLateFee, setAutoLateFee] = useState(true);

  // Bank accounts state
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [editingAccount, setEditingAccount] =
    useState<Partial<BankAccount> | null>(null);
  const [savingAccount, setSavingAccount] = useState(false);
  const [revealedAccountId, setRevealedAccountId] = useState<string | null>(
    null,
  );

  // Load bank accounts
  useEffect(() => {
    getDocs(collection(db, `residenciales/${residencialId}/cuentas_bancarias`))
      .then((snap) => {
        setBankAccounts(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BankAccount),
        );
      })
      .catch(() => toast.error("Error al cargar cuentas bancarias"))
      .finally(() => setLoadingAccounts(false));
  }, [residencialId]);

  // Load billing settings
  useEffect(() => {
    getDoc(doc(db, `residenciales/${residencialId}/settings/billing`))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setMonthlyFee((d.defaultMonthlyFeeCents ?? 115000) / 100);
          setBillingDay(d.billingDayOfMonth ?? 1);
          setDueDay(d.dueDayOfMonth ?? 10);
          setLateFeeType(d.lateFeeType ?? "fixed");
          setLateFeeValue(
            d.lateFeeType === "percentage"
              ? (d.lateFeeValue ?? 0)
              : (d.lateFeeValue ?? 20000) / 100,
          );
          setAutoLateFee(d.applyLateFeeAutomatically ?? true);
        }
      })
      .catch(() => toast.error("Error al cargar configuración"))
      .finally(() => setLoading(false));
  }, [residencialId]);

  // Load fiscal data
  useEffect(() => {
    getDoc(doc(db, "residenciales", residencialId))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data().datosFiscales;
          if (d) {
            setFiscalData({
              razonSocial: d.razonSocial || "",
              rfc: d.rfc || "",
              domicilioFiscal: d.domicilioFiscal || "",
            });
          }
        }
      })
      .catch(() => {});
  }, [residencialId]);

  const handleSaveFiscal = async () => {
    setSavingFiscal(true);
    try {
      await updateDoc(doc(db, "residenciales", residencialId), {
        datosFiscales: fiscalData,
      });
      toast.success("Datos fiscales guardados");
    } catch {
      toast.error("Error al guardar datos fiscales");
    } finally {
      setSavingFiscal(false);
    }
  };

  const handleSaveBilling = async () => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, `residenciales/${residencialId}/settings/billing`),
        {
          defaultMonthlyFeeCents: Math.round(monthlyFee * 100),
          billingDayOfMonth: billingDay,
          dueDayOfMonth: dueDay,
          lateFeeType,
          lateFeeValue:
            lateFeeType === "percentage"
              ? lateFeeValue
              : Math.round(lateFeeValue * 100),
          applyLateFeeAutomatically: autoLateFee,
        },
        { merge: true },
      );
      toast.success("Configuración guardada");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!editingAccount?.banco?.trim() || !editingAccount?.clabe?.trim()) {
      toast.error("Banco y CLABE son obligatorios");
      return;
    }
    setSavingAccount(true);
    try {
      const data = {
        banco: editingAccount.banco?.trim() || "",
        titular: editingAccount.titular?.trim() || "",
        clabe: editingAccount.clabe?.trim() || "",
        cuenta: editingAccount.cuenta?.trim() || "",
        alias: editingAccount.alias?.trim() || "",
        isActive: editingAccount.isActive ?? true,
      };
      if (editingAccount.id) {
        await updateDoc(
          doc(
            db,
            `residenciales/${residencialId}/cuentas_bancarias/${editingAccount.id}`,
          ),
          data,
        );
        setBankAccounts((prev) =>
          prev.map((a) => (a.id === editingAccount.id ? { ...a, ...data } : a)),
        );
        toast.success("Cuenta actualizada");
      } else {
        const ref = await addDoc(
          collection(db, `residenciales/${residencialId}/cuentas_bancarias`),
          data,
        );
        setBankAccounts((prev) => [...prev, { id: ref.id, ...data }]);
        toast.success("Cuenta agregada");
      }
      setEditingAccount(null);
    } catch {
      toast.error("Error al guardar cuenta");
    } finally {
      setSavingAccount(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await deleteDoc(
        doc(db, `residenciales/${residencialId}/cuentas_bancarias/${id}`),
      );
      setBankAccounts((prev) => prev.filter((a) => a.id !== id));
      toast.success("Cuenta eliminada");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 grid-cols-2">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
        <button
          onClick={() => setActiveSection("bank")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            activeSection === "bank"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Cuentas Bancarias
        </button>
        <button
          onClick={() => setActiveSection("billing")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            activeSection === "billing"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Settings2 className="h-4 w-4" />
          Reglas de Cobro
        </button>
        <button
          onClick={() => setActiveSection("fiscal")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
            activeSection === "fiscal"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Landmark className="h-4 w-4" />
          Datos Fiscales
        </button>
      </div>

      {/* ═══════════ BANK ACCOUNTS SECTION ═══════════ */}
      {activeSection === "bank" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Cuentas Bancarias
              </h3>
              <p className="text-xs text-muted-foreground">
                Los residentes verán estas cuentas para transferir sus pagos
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() =>
                setEditingAccount({
                  banco: "",
                  titular: "",
                  clabe: "",
                  cuenta: "",
                  alias: "",
                  isActive: true,
                })
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>

          {/* Add/Edit form — appears at the TOP */}
          {editingAccount && (
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-white rounded-xl">
              <CardContent className="pt-5 pb-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Landmark className="h-4 w-4 text-white" />
                  </div>
                  <p className="font-black text-sm text-slate-900">
                    {editingAccount.id
                      ? "Editar cuenta"
                      : "Nueva cuenta bancaria"}
                  </p>
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      Banco *
                    </label>
                    <Input
                      placeholder="Ej: BBVA"
                      value={editingAccount.banco || ""}
                      onChange={(e) =>
                        setEditingAccount({
                          ...editingAccount,
                          banco: e.target.value,
                        })
                      }
                      className="h-10 rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      Titular
                    </label>
                    <Input
                      placeholder="Nombre del titular"
                      value={editingAccount.titular || ""}
                      onChange={(e) =>
                        setEditingAccount({
                          ...editingAccount,
                          titular: e.target.value,
                        })
                      }
                      className="h-10 rounded-xl mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    CLABE Interbancaria (18 dígitos) *
                  </label>
                  <Input
                    placeholder="012345678901234567"
                    value={editingAccount.clabe || ""}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount,
                        clabe: e.target.value,
                      })
                    }
                    className="h-10 rounded-xl mt-1 font-mono tracking-wider"
                    maxLength={18}
                  />
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      No. de Cuenta
                    </label>
                    <Input
                      placeholder="Número de cuenta"
                      value={editingAccount.cuenta || ""}
                      onChange={(e) =>
                        setEditingAccount({
                          ...editingAccount,
                          cuenta: e.target.value,
                        })
                      }
                      className="h-10 rounded-xl mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      Alias
                    </label>
                    <Input
                      placeholder="Ej: Cuenta principal"
                      value={editingAccount.alias || ""}
                      onChange={(e) =>
                        setEditingAccount({
                          ...editingAccount,
                          alias: e.target.value,
                        })
                      }
                      className="h-10 rounded-xl mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setEditingAccount(null)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSaveAccount}
                    disabled={savingAccount}
                  >
                    {savingAccount ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    {editingAccount.id ? "Actualizar" : "Guardar cuenta"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account list */}
          {loadingAccounts ? (
            <div className="space-y-3">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          ) : bankAccounts.length === 0 && !editingAccount ? null : (
            <div className="space-y-3">
              {bankAccounts.map((account) => {
                const isRevealed = revealedAccountId === account.id;
                return (
                  <Card
                    key={account.id}
                    className={`border-none shadow-sm rounded-xl overflow-hidden transition-opacity ${!account.isActive ? "opacity-50" : ""}`}
                  >
                    <CardContent className="p-0">
                      {/* Bank header strip */}
                      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                            <Landmark className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-black text-sm text-slate-900">
                              {account.banco}
                            </p>
                            {account.alias && (
                              <p className="text-[10px] text-blue-500 font-medium">
                                {account.alias}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              setRevealedAccountId(
                                isRevealed ? null : account.id,
                              )
                            }
                            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                            title={
                              isRevealed ? "Ocultar números" : "Ver números"
                            }
                          >
                            {isRevealed ? (
                              <EyeOff className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingAccount(account)}
                            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5 text-slate-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(account.id)}
                            className="h-8 w-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                      {/* Account details */}
                      <div className="px-4 py-3 space-y-2">
                        {account.titular && (
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide w-14 shrink-0">
                              Titular
                            </span>
                            <span className="text-sm text-slate-700 font-medium">
                              {account.titular}
                            </span>
                          </div>
                        )}
                        {account.clabe && (
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide w-14 shrink-0">
                              CLABE
                            </span>
                            <span className="text-sm font-mono text-slate-700 tracking-wider">
                              {isRevealed
                                ? account.clabe
                                : maskNumber(account.clabe)}
                            </span>
                          </div>
                        )}
                        {account.cuenta && (
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide w-14 shrink-0">
                              Cuenta
                            </span>
                            <span className="text-sm font-mono text-slate-700 tracking-wider">
                              {isRevealed
                                ? account.cuenta
                                : maskNumber(account.cuenta)}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ BILLING RULES SECTION ═══════════ */}
      {activeSection === "billing" && (
        <div className="space-y-5">
          {/* Main fee */}
          <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-white rounded-xl overflow-hidden">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-black text-slate-900">Cuota mensual</p>
                  <p className="text-xs text-muted-foreground">
                    Monto que se cobra a cada vivienda por mes
                  </p>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 font-black text-xl">
                  $
                </span>
                <Input
                  type="number"
                  min={0}
                  value={monthlyFee}
                  onChange={(e) =>
                    setMonthlyFee(parseFloat(e.target.value) || 0)
                  }
                  className="h-14 rounded-xl font-black text-2xl text-blue-700 pl-9 border-blue-200 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 ml-1">
                Equivalente a{" "}
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                }).format(monthlyFee)}{" "}
                MXN por vivienda
              </p>
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
                    <p className="font-bold text-sm text-slate-900">
                      Día de cobro
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Día del mes que se genera el cargo
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    value={billingDay}
                    onChange={(e) =>
                      setBillingDay(
                        Math.max(
                          1,
                          Math.min(28, parseInt(e.target.value) || 1),
                        ),
                      )
                    }
                    className="h-12 rounded-xl font-black text-lg text-center w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    de cada mes
                  </span>
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
                    <p className="font-bold text-sm text-slate-900">
                      Día de vencimiento
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Fecha límite para pagar sin recargo
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    value={dueDay}
                    onChange={(e) =>
                      setDueDay(
                        Math.max(
                          1,
                          Math.min(28, parseInt(e.target.value) || 1),
                        ),
                      )
                    }
                    className="h-12 rounded-xl font-black text-lg text-center w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    de cada mes
                  </span>
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
                  <p className="text-xs text-muted-foreground">
                    Penalización que se aplica después del vencimiento
                  </p>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-2 mb-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Tipo de recargo
                  </label>
                  <div className="flex gap-2 mt-1.5">
                    <button
                      onClick={() => setLateFeeType("fixed")}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        lateFeeType === "fixed"
                          ? "bg-red-600 text-white shadow-sm"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      $ Monto fijo
                    </button>
                    <button
                      onClick={() => setLateFeeType("percentage")}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        lateFeeType === "percentage"
                          ? "bg-red-600 text-white shadow-sm"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      % Porcentaje
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    {lateFeeType === "percentage"
                      ? "Porcentaje (%)"
                      : "Monto ($)"}
                  </label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      {lateFeeType === "percentage" ? "%" : "$"}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={lateFeeValue}
                      onChange={(e) =>
                        setLateFeeValue(parseFloat(e.target.value) || 0)
                      }
                      className="h-12 rounded-xl font-bold text-lg pl-8"
                    />
                  </div>
                </div>
              </div>

              {/* Auto toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Aplicar recargos automáticamente
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      El sistema aplicará el recargo el día 6 de cada mes
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAutoLateFee(!autoLateFee)}
                  className={`relative h-7 w-12 rounded-full transition-colors ${autoLateFee ? "bg-emerald-500" : "bg-slate-400"}`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full shadow-md transition-transform ${autoLateFee ? "translate-x-5 bg-white" : "translate-x-0.5 bg-slate-100"}`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Save billing config */}
          <Button
            className="w-full h-12 rounded-xl font-black text-base bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
            onClick={handleSaveBilling}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            {saving ? "Guardando..." : "Guardar configuración"}
          </Button>
        </div>
      )}
      {/* ─── FISCAL SECTION ─── */}
      {activeSection === "fiscal" && (
        <div className="space-y-4">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Landmark className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Datos Fiscales
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Informacion para recibos y comprobantes
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Razon Social
                </label>
                <Input
                  value={fiscalData.razonSocial}
                  onChange={(e) =>
                    setFiscalData((prev) => ({
                      ...prev,
                      razonSocial: e.target.value,
                    }))
                  }
                  placeholder="Ej: Asociacion de Vecinos AC"
                  className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    RFC
                  </label>
                  <Input
                    value={fiscalData.rfc}
                    onChange={(e) =>
                      setFiscalData((prev) => ({
                        ...prev,
                        rfc: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="ABC123456XY0"
                    maxLength={13}
                    className="h-12 rounded-xl bg-slate-50 border-slate-200 font-mono font-bold uppercase"
                  />
                  <p className="text-xs text-muted-foreground">
                    12 o 13 caracteres
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Domicilio Fiscal
                  </label>
                  <Input
                    value={fiscalData.domicilioFiscal}
                    onChange={(e) =>
                      setFiscalData((prev) => ({
                        ...prev,
                        domicilioFiscal: e.target.value,
                      }))
                    }
                    placeholder="Calle, Colonia, CP"
                    className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full h-12 rounded-xl font-black text-base bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
            onClick={handleSaveFiscal}
            disabled={savingFiscal}
          >
            {savingFiscal ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            {savingFiscal ? "Guardando..." : "Guardar datos fiscales"}
          </Button>
        </div>
      )}
    </div>
  );
}
