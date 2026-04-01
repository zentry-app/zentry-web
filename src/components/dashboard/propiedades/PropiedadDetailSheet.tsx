"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PropiedadWeb,
  PropiedadesService,
} from "@/lib/services/propiedades-service";
import { cambiarEstadoMoroso } from "@/lib/firebase/firestore";
import { Home, Users, Info, Crown, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface UserDetail {
  uid: string;
  fullName: string;
  email: string;
}

interface PropiedadDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propiedad: PropiedadWeb | null;
  residencialDocId: string;
  onUpdate?: () => void;
}

const estadoBadge = (estado: PropiedadWeb["estadoOcupacion"]) => {
  if (estado === "ocupada")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
        Ocupada
      </Badge>
    );
  if (estado === "desocupada")
    return (
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800">
        Desocupada
      </Badge>
    );
  return (
    <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700">
      Exenta
    </Badge>
  );
};

const tipoLabel: Record<PropiedadWeb["tipo"], string> = {
  casa: "Casa",
  departamento: "Departamento",
  local: "Local",
  lote: "Lote",
};

const infoCardClass =
  "bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-white/5 p-4";

function UserInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
  return (
    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
      {initials || "?"}
    </div>
  );
}

export default function PropiedadDetailSheet({
  open,
  onOpenChange,
  propiedad,
  residencialDocId,
  onUpdate,
}: PropiedadDetailSheetProps) {
  const [userDetails, setUserDetails] = useState<UserDetail[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [morosaDialogOpen, setMorosaDialogOpen] = useState(false);
  const [togglingMorosa, setTogglingMorosa] = useState(false);

  useEffect(() => {
    if (!open || !propiedad) {
      setUserDetails([]);
      return;
    }
    if (propiedad.usuariosVinculados.length === 0) {
      setUserDetails([]);
      return;
    }
    setLoadingUsers(true);
    PropiedadesService.getUserDetails(propiedad.usuariosVinculados)
      .then(setUserDetails)
      .catch(() => setUserDetails([]))
      .finally(() => setLoadingUsers(false));
  }, [open, propiedad]);

  if (!propiedad) return null;

  const direccion = propiedad.interior
    ? `${propiedad.calle} ${propiedad.numero}, Int. ${propiedad.interior}`
    : `${propiedad.calle} ${propiedad.numero}`;

  const fechaCreacion = propiedad.creadoEn
    ? new Date(propiedad.creadoEn).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const isMorosa = propiedad.isMorosa === true;
  const userCount = propiedad.usuariosVinculados.length;

  const handleConfirmMorosa = async () => {
    setTogglingMorosa(true);
    const newValue = !isMorosa;
    try {
      await PropiedadesService.update({
        propiedadId: propiedad.propiedadId,
        residencialDocId,
        isMorosa: newValue,
      });

      if (propiedad.usuariosVinculados.length > 0) {
        await Promise.all(
          propiedad.usuariosVinculados.map((uid) =>
            cambiarEstadoMoroso(uid, newValue),
          ),
        );
      }

      if (newValue) {
        toast.error(
          `Propiedad ${propiedad.calle} ${propiedad.numero} marcada como morosa`,
        );
      } else {
        toast.success(
          `Morosidad removida de ${propiedad.calle} ${propiedad.numero}`,
        );
      }

      onUpdate?.();
    } catch (err) {
      console.error("Error toggling morosidad:", err);
      toast.error("Error al actualizar estado de morosidad");
    } finally {
      setTogglingMorosa(false);
      setMorosaDialogOpen(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="sm:max-w-lg bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl border-l border-slate-200 dark:border-white/10 overflow-y-auto"
          side="right"
        >
          <SheetHeader className="mb-6">
            <div className="flex items-start gap-3 pr-8">
              <div className="flex-shrink-0 inline-flex rounded-2xl p-3 bg-gradient-to-br from-slate-600 to-slate-400 shadow-md">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-xl font-extrabold dark:text-white leading-tight">
                  {propiedad.calle}{" "}
                  <span className="text-primary">{propiedad.numero}</span>
                  {propiedad.interior && (
                    <span className="text-slate-400 dark:text-slate-500 font-medium text-base ml-1">
                      Int. {propiedad.interior}
                    </span>
                  )}
                </SheetTitle>
                <div className="mt-1.5 flex items-center gap-2">
                  {estadoBadge(propiedad.estadoOcupacion)}
                  {isMorosa && (
                    <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 border-rose-200 dark:border-rose-800 gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Morosa
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-4">
            {/* Info general */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={infoCardClass}
            >
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-slate-400" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Información
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
                    Tipo
                  </p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">
                    {tipoLabel[propiedad.tipo] ?? propiedad.tipo}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
                    Ocupación
                  </p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">
                    {propiedad.estadoOcupacion}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
                    Cobro activo
                  </p>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        propiedad.participaEnBilling
                          ? "bg-emerald-500"
                          : "bg-rose-400"
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        propiedad.participaEnBilling
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {propiedad.participaEnBilling ? "Sí" : "No"}
                    </span>
                  </span>
                </div>
                {fechaCreacion !== "—" && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
                      Registrada
                    </p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {fechaCreacion}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Estado de Morosidad */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 }}
              className={
                isMorosa
                  ? "bg-rose-50/80 dark:bg-rose-950/30 backdrop-blur-sm rounded-2xl border border-rose-200 dark:border-rose-800/40 p-4"
                  : infoCardClass
              }
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle
                  className={`h-4 w-4 ${isMorosa ? "text-rose-500" : "text-slate-400"}`}
                />
                <span
                  className={`text-[11px] font-bold uppercase tracking-widest ${isMorosa ? "text-rose-500 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"}`}
                >
                  Estado de Morosidad
                </span>
              </div>

              {isMorosa ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                    <p className="text-sm font-bold text-rose-700 dark:text-rose-400">
                      Propiedad en morosidad
                    </p>
                  </div>
                  <p className="text-xs text-rose-600/80 dark:text-rose-400/70">
                    El acceso y funciones de los {userCount} residente
                    {userCount !== 1 ? "s" : ""} están restringidos.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMorosaDialogOpen(true)}
                    disabled={togglingMorosa}
                    className="w-full rounded-xl border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 font-semibold"
                  >
                    {togglingMorosa ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-2" />
                    )}
                    Quitar morosidad
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Esta propiedad está al corriente. Puedes marcarla como
                    morosa para restringir el acceso de sus residentes.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMorosaDialogOpen(true)}
                    disabled={togglingMorosa}
                    className="w-full rounded-xl border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                  >
                    {togglingMorosa ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                    )}
                    Marcar como morosa
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Usuarios vinculados */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className={infoCardClass}
            >
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Usuarios vinculados
                </span>
                {propiedad.usuariosVinculados.length > 0 && (
                  <span className="ml-auto text-[11px] font-bold text-slate-400 dark:text-slate-500">
                    {propiedad.usuariosVinculados.length}
                  </span>
                )}
              </div>

              {loadingUsers ? (
                <div className="flex items-center gap-2 py-4 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  <span className="text-sm text-slate-400">
                    Cargando usuarios...
                  </span>
                </div>
              ) : propiedad.usuariosVinculados.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    Sin usuarios vinculados
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {[...userDetails]
                      .sort((a, b) => {
                        const aOwner =
                          propiedad.propietarioUid === a.uid ? 0 : 1;
                        const bOwner =
                          propiedad.propietarioUid === b.uid ? 0 : 1;
                        return aOwner - bOwner;
                      })
                      .map((user, idx) => {
                        const isPropietario =
                          propiedad.propietarioUid === user.uid;
                        return (
                          <motion.div
                            key={user.uid}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.04 }}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-white/50 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5"
                          >
                            <UserInitials name={user.fullName} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                  {user.fullName}
                                </p>
                                {isPropietario && (
                                  <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                {user.email || "Sin email"}
                              </p>
                            </div>
                            {isPropietario && (
                              <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800 flex-shrink-0">
                                Propietario
                              </Badge>
                            )}
                          </motion.div>
                        );
                      })}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog */}
      <AlertDialog open={morosaDialogOpen} onOpenChange={setMorosaDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle
                className={`h-5 w-5 ${isMorosa ? "text-rose-500" : "text-amber-500"}`}
              />
              {isMorosa ? "Quitar morosidad" : "Marcar como morosa"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isMorosa
                ? "¿Quitar la morosidad de esta propiedad? Se restaurarán las funciones de todos los residentes."
                : `¿Marcar esta propiedad como morosa? Esto restringirá el acceso y funciones de TODOS los residentes de esta propiedad (${userCount} usuario${userCount !== 1 ? "s" : ""}).`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={togglingMorosa}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmMorosa}
              disabled={togglingMorosa}
              className={
                isMorosa
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              }
            >
              {togglingMorosa && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isMorosa ? "Quitar morosidad" : "Marcar como morosa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
