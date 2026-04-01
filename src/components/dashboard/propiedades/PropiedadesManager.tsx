"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Users,
  Home,
  Building2,
  Search,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Key,
} from "lucide-react";
import {
  PropiedadesService,
  PropiedadWeb,
  PropiedadesStats,
} from "@/lib/services/propiedades-service";
import AddPropiedadDialog from "./AddPropiedadDialog";
import AddBatchDialog from "./AddBatchDialog";
import PropiedadDetailSheet from "./PropiedadDetailSheet";

interface PropiedadesManagerProps {
  residencialDocId: string;
}

const ITEMS_PER_PAGE = 20;

const cardClass =
  "border-none shadow-zentry dark:shadow-none bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden group dark:ring-1 dark:ring-white/5";

const statCards = [
  {
    key: "total" as const,
    label: "Total",
    icon: Home,
    gradient: "from-slate-600 to-slate-400",
    textColor: "text-slate-700 dark:text-slate-200",
  },
  {
    key: "ocupadas" as const,
    label: "Ocupadas",
    icon: Users,
    gradient: "from-emerald-500 to-teal-400",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "desocupadas" as const,
    label: "Desocupadas",
    icon: Home,
    gradient: "from-amber-500 to-orange-400",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "exentas" as const,
    label: "Exentas",
    icon: Building2,
    gradient: "from-slate-400 to-slate-300",
    textColor: "text-slate-500 dark:text-slate-400",
  },
  {
    key: "enBilling" as const,
    label: "En Cobro",
    icon: DollarSign,
    gradient: "from-blue-600 to-sky-400",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "morosas" as const,
    label: "Morosas",
    icon: AlertTriangle,
    gradient: "from-rose-500 to-red-400",
    textColor: "text-rose-600 dark:text-rose-400",
  },
];

const estadoDot = (estado: PropiedadWeb["estadoOcupacion"]) => {
  if (estado === "ocupada")
    return (
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
          Ocupada
        </span>
      </span>
    );
  if (estado === "desocupada")
    return (
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
          Desocupada
        </span>
      </span>
    );
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
        Exenta
      </span>
    </span>
  );
};

/** Small user avatars (initials) for the Residentes column */
function UserAvatars({ uids }: { uids: string[] }) {
  if (uids.length === 0) {
    return (
      <span className="text-slate-400 dark:text-slate-600 font-medium text-sm select-none">
        —
      </span>
    );
  }
  const visible = uids.slice(0, 3);
  const extra = uids.length - visible.length;
  const colors = [
    "from-slate-600 to-slate-400",
    "from-emerald-500 to-teal-400",
    "from-blue-500 to-sky-400",
  ];
  return (
    <div className="flex items-center gap-1">
      <div className="flex -space-x-1.5">
        {visible.map((uid, idx) => {
          const initials = uid.slice(0, 2).toUpperCase();
          return (
            <div
              key={uid}
              title={uid}
              className={`w-6 h-6 rounded-full bg-gradient-to-br ${colors[idx % colors.length]} flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-white dark:ring-slate-900`}
            >
              {initials}
            </div>
          );
        })}
      </div>
      {extra > 0 && (
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 ml-0.5">
          +{extra}
        </span>
      )}
    </div>
  );
}

export default function PropiedadesManager({
  residencialDocId,
}: PropiedadesManagerProps) {
  const [propiedades, setPropiedades] = useState<PropiedadWeb[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [calleFilter, setCalleFilter] = useState("__all__");
  const [addOpen, setAddOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [selectedPropiedad, setSelectedPropiedad] =
    useState<PropiedadWeb | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadPropiedades = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PropiedadesService.getAll(residencialDocId);
      setPropiedades(data);
    } catch (err) {
      console.error("Error loading propiedades:", err);
      toast.error("Error al cargar propiedades");
    } finally {
      setLoading(false);
    }
  }, [residencialDocId]);

  useEffect(() => {
    loadPropiedades();
  }, [loadPropiedades]);

  const stats: PropiedadesStats = useMemo(
    () => PropiedadesService.computeStats(propiedades),
    [propiedades],
  );

  const calles = useMemo(() => {
    const set = new Set(propiedades.map((p) => p.calle));
    return Array.from(set).sort();
  }, [propiedades]);

  const filtered = useMemo(() => {
    return propiedades.filter((p) => {
      const matchesCalle = calleFilter === "__all__" || p.calle === calleFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        p.calle.toLowerCase().includes(q) ||
        p.numero.toLowerCase().includes(q) ||
        (p.interior ?? "").toLowerCase().includes(q);
      return matchesCalle && matchesSearch;
    });
  }, [propiedades, searchQuery, calleFilter]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, calleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);

  const paginatedItems = useMemo(() => {
    const start = safePage * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, safePage]);

  const isFiltered = searchQuery.trim() !== "" || calleFilter !== "__all__";

  const handleEstadoChange = async (
    propiedad: PropiedadWeb,
    nuevoEstado: PropiedadWeb["estadoOcupacion"],
  ) => {
    setUpdatingId(propiedad.propiedadId);
    try {
      await PropiedadesService.update({
        propiedadId: propiedad.propiedadId,
        residencialDocId,
        estadoOcupacion: nuevoEstado,
      });
      setPropiedades((prev) =>
        prev.map((p) =>
          p.propiedadId === propiedad.propiedadId
            ? { ...p, estadoOcupacion: nuevoEstado }
            : p,
        ),
      );
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al actualizar estado");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBillingToggle = async (
    propiedad: PropiedadWeb,
    valor: boolean,
  ) => {
    setUpdatingId(propiedad.propiedadId);
    try {
      await PropiedadesService.update({
        propiedadId: propiedad.propiedadId,
        residencialDocId,
        participaEnBilling: valor,
      });
      setPropiedades((prev) =>
        prev.map((p) =>
          p.propiedadId === propiedad.propiedadId
            ? { ...p, participaEnBilling: valor }
            : p,
        ),
      );
    } catch {
      toast.error("Error al actualizar cobro");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRowClick = (p: PropiedadWeb) => {
    setSelectedPropiedad(p);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Gestión de Propiedades
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold dark:text-white">
          Propiedades del{" "}
          <span className="text-gradient-zentry">Residencial</span>
        </h2>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          const value = stats[card.key];
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 * i }}
              className={cardClass}
            >
              <div className="relative p-5">
                {/* Background blob */}
                <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                  <Icon className="w-full h-full" />
                </div>
                {/* Icon box */}
                <div
                  className={`inline-flex rounded-xl p-3 bg-gradient-to-br ${card.gradient} mb-3 shadow-md`}
                >
                  <Icon className="h-5 w-5 text-white group-hover:rotate-6 transition-all duration-300" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                  {card.label}
                </p>
                <p className={`text-3xl font-extrabold ${card.textColor}`}>
                  {loading ? (
                    <span className="inline-block w-8 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  ) : (
                    value
                  )}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.45 }}
        className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
      >
        <div className="flex gap-2 flex-1 flex-wrap items-center">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por calle o número..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/40"
            />
          </div>
          <Select value={calleFilter} onValueChange={setCalleFilter}>
            <SelectTrigger className="w-48 rounded-xl border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/40">
              <SelectValue placeholder="Todas las calles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas las calles</SelectItem>
              {calles.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Result count */}
          {!loading && (
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {isFiltered
                ? `${filtered.length} de ${propiedades.length} propiedades`
                : `${propiedades.length} propiedades`}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setAddOpen(true)}
            size="sm"
            className="rounded-xl shadow-zentry font-bold"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
          <Button
            onClick={() => setBatchOpen(true)}
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-200 dark:border-white/10"
          >
            <Building2 className="h-4 w-4 mr-1" />
            Rango
          </Button>
        </div>
      </motion.div>

      {/* Table / Empty / Loading */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`${cardClass} p-6 space-y-3 opacity-50`}
        >
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse"
              style={{ opacity: 1 - i * 0.15 }}
            />
          ))}
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className={`${cardClass} flex flex-col items-center justify-center py-20 text-center px-6`}
        >
          <div className="inline-flex rounded-2xl p-5 bg-gradient-to-br from-slate-600 to-slate-400 mb-5 shadow-lg">
            <Home className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-xl font-extrabold dark:text-white mb-1">
            Sin propiedades
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mb-6">
            Agrega propiedades individualmente o por rango de número.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setAddOpen(true)}
              size="sm"
              className="rounded-xl shadow-zentry font-bold"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
            <Button
              onClick={() => setBatchOpen(true)}
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 dark:border-white/10"
            >
              <Building2 className="h-4 w-4 mr-1" />
              Rango
            </Button>
          </div>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className={cardClass}
          >
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 dark:border-white/5">
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Calle
                  </TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Número
                  </TableHead>
                  <TableHead className="hidden sm:table-cell text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Tipo
                  </TableHead>
                  <TableHead className="hidden lg:table-cell text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    <div className="flex items-center gap-1">
                      <Key className="h-3.5 w-3.5" />
                      Tenencia
                    </div>
                  </TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Estado
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      Residentes
                    </div>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Morosidad
                    </div>
                  </TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Cobro
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((p, i) => (
                  <motion.tr
                    key={p.propiedadId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.03 * i }}
                    onClick={() => handleRowClick(p)}
                    className={`hover:bg-white/50 dark:hover:bg-white/5 transition-all border-b border-slate-100/60 dark:border-white/[0.03] last:border-0 cursor-pointer${p.isMorosa ? " bg-rose-50/50 dark:bg-rose-950/20" : ""}`}
                  >
                    <TableCell className="font-semibold text-slate-800 dark:text-slate-100 py-3.5">
                      {p.calle}
                    </TableCell>
                    <TableCell className="py-3.5">
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {p.numero}
                        </span>
                        {p.isMorosa && (
                          <AlertTriangle
                            className="h-3.5 w-3.5 text-rose-500 shrink-0"
                            title="Morosa"
                          />
                        )}
                        {p.interior && (
                          <span className="text-slate-400 dark:text-slate-500 text-xs">
                            Int. {p.interior}
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell capitalize text-slate-500 dark:text-slate-400 text-sm py-3.5">
                      {p.tipo}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-3.5">
                      {p.usuariosVinculados.length === 0 ? (
                        <span className="text-slate-400 dark:text-slate-600 font-medium text-sm select-none">
                          —
                        </span>
                      ) : p.tieneInquilinos ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-orange-400 shrink-0" />
                          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                            Inquilinos
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                            Propia
                          </span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className="py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Select
                        value={p.estadoOcupacion}
                        onValueChange={(val) =>
                          handleEstadoChange(
                            p,
                            val as PropiedadWeb["estadoOcupacion"],
                          )
                        }
                        disabled={updatingId === p.propiedadId}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs rounded-xl border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-900/40">
                          <SelectValue>
                            {estadoDot(p.estadoOcupacion)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ocupada">
                            {estadoDot("ocupada")}
                          </SelectItem>
                          <SelectItem value="desocupada">
                            {estadoDot("desocupada")}
                          </SelectItem>
                          <SelectItem value="exenta">
                            {estadoDot("exenta")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-3.5">
                      <UserAvatars uids={p.usuariosVinculados} />
                    </TableCell>
                    <TableCell
                      className="hidden sm:table-cell py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {p.isMorosa === true ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                          <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                            Morosa
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            Al día
                          </span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className="py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Switch
                        checked={p.participaEnBilling}
                        onCheckedChange={(val) => handleBillingToggle(p, val)}
                        disabled={
                          updatingId === p.propiedadId ||
                          p.estadoOcupacion === "exenta"
                        }
                        className={
                          p.participaEnBilling
                            ? "data-[state=checked]:bg-emerald-500"
                            : ""
                        }
                      />
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1"
            >
              {/* Info label */}
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Mostrando{" "}
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {safePage * ITEMS_PER_PAGE + 1}–
                  {Math.min((safePage + 1) * ITEMS_PER_PAGE, filtered.length)}
                </span>{" "}
                de{" "}
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {filtered.length}
                </span>{" "}
                propiedades
              </span>

              {/* Page controls */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="rounded-xl border-slate-200 dark:border-white/10 h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i).map((i) => {
                  // Show first, last, current, and neighbors
                  const show =
                    i === 0 ||
                    i === totalPages - 1 ||
                    Math.abs(i - safePage) <= 1;
                  const showEllipsisBefore = i === safePage - 2 && safePage > 3;
                  const showEllipsisAfter =
                    i === safePage + 2 && safePage < totalPages - 4;

                  if (!show) {
                    if (showEllipsisBefore || showEllipsisAfter) {
                      return (
                        <span
                          key={`ellipsis-${i}`}
                          className="text-slate-400 dark:text-slate-600 text-sm px-1 select-none"
                        >
                          …
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <Button
                      key={i}
                      variant={safePage === i ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(i)}
                      className={`rounded-xl h-8 w-8 p-0 text-xs font-bold ${
                        safePage === i
                          ? "shadow-zentry"
                          : "border-slate-200 dark:border-white/10"
                      }`}
                    >
                      {i + 1}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={safePage === totalPages - 1}
                  className="rounded-xl border-slate-200 dark:border-white/10 h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </>
      )}

      <AddPropiedadDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        residencialDocId={residencialDocId}
        calles={calles}
        onSuccess={loadPropiedades}
      />

      <AddBatchDialog
        open={batchOpen}
        onOpenChange={setBatchOpen}
        residencialDocId={residencialDocId}
        calles={calles}
        onSuccess={loadPropiedades}
      />

      <PropiedadDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        propiedad={selectedPropiedad}
        residencialDocId={residencialDocId}
        onUpdate={loadPropiedades}
      />
    </div>
  );
}
