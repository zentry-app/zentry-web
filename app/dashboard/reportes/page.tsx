"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  User,
  MapPin,
  Image as ImageIcon,
  MessageSquare,
  Send,
  Filter,
} from "lucide-react";
import { useAdminRequired } from "@/lib/hooks";
import { useAuth } from "@/contexts/AuthContext";
import {
  ReportesService,
  getCategoriaDisplay,
  getEstadoDisplay,
  type Reporte,
  type ReporteEstado,
  type ReporteStats,
} from "@/lib/services/reportes-service";
import { toast } from "sonner";

const ESTADO_OPTIONS: { value: ReporteEstado | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "en_revision", label: "En revisión" },
  { value: "en_proceso", label: "En proceso" },
  { value: "resuelto", label: "Resuelto" },
  { value: "cerrado", label: "Cerrado" },
];

const CATEGORIA_OPTIONS = [
  "mantenimiento",
  "areas_comunes",
  "seguridad",
  "limpieza",
  "ruido",
  "sugerencia",
  "otro",
] as const;

function formatFecha(val: Date | import("firebase/firestore").Timestamp | undefined): string {
  if (!val) return "—";
  const d = val instanceof Date ? val : (val as { toDate: () => Date }).toDate?.();
  if (!d) return "—";
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReportesPage() {
  const { isAdmin, isUserLoading } = useAdminRequired();
  const { userData, userClaims } = useAuth();

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [stats, setStats] = useState<ReporteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEstado, setFilterEstado] = useState<ReporteEstado | "todos">("todos");
  const [filterCategoria, setFilterCategoria] = useState<string>("todos");
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const residencialId = useMemo(() => {
    const esGlobal = userClaims?.isGlobalAdmin === true;
    if (esGlobal) return undefined;
    return userClaims?.managedResidencials?.[0] || userClaims?.residencialId || undefined;
  }, [userClaims]);

  const fetchReportes = async () => {
    try {
      setLoading(true);
      const [list, statsData] = await Promise.all([
        ReportesService.getReportes(residencialId, {
          estado: filterEstado === "todos" ? undefined : [filterEstado],
          categoria:
            filterCategoria === "todos"
              ? undefined
              : [filterCategoria as Reporte["categoria"]],
          searchQuery: searchQuery.trim() || undefined,
        }),
        ReportesService.getStats(residencialId),
      ]);
      setReportes(list);
      setStats(statsData);
    } catch (err: any) {
      console.error("Error cargando reportes:", err);
      toast.error(err?.message || "Error al cargar reportes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchReportes();
  }, [isAdmin, residencialId, filterEstado, filterCategoria]);

  useEffect(() => {
    if (!isAdmin) return;
    const t = setTimeout(() => {
      fetchReportes();
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReportes();
  };

  if (isUserLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-premium">
        <div className="text-center">
          <div className="relative h-20 w-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
            <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />
          </div>
          <p className="text-primary font-bold animate-pulse text-lg">
            Sincronizando Zentry...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-premium px-4 lg:px-10 py-8 relative">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.2em]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Reportes de residentes
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Reportes{" "}
            <span className="text-gradient-zentry">
              {residencialId ? "del residencial" : "globales"}
            </span>
          </h1>
          <p className="text-slate-500 font-medium text-lg">
            Gestiona y da seguimiento a los reportes enviados por los residentes.
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          size="lg"
          className="bg-white border-primary/20 text-primary hover:bg-white shadow-zentry hover-lift rounded-2xl h-14 px-8 font-bold"
        >
          <RefreshCw
            className={`mr-2 h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Actualizando..." : "Actualizar"}
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-6 grid-cols-2 sm:grid-cols-4 mb-10">
        {[
          {
            label: "Total",
            value: stats?.total ?? 0,
            icon: FileText,
            gradient: "from-blue-600 to-sky-400",
          },
          {
            label: "Pendientes",
            value: stats?.pendientes ?? 0,
            icon: Clock,
            gradient: "from-amber-500 to-orange-400",
          },
          {
            label: "En proceso",
            value: (stats?.enRevision ?? 0) + (stats?.enProceso ?? 0),
            icon: AlertCircle,
            gradient: "from-purple-600 to-fuchsia-500",
          },
          {
            label: "Resueltos",
            value: (stats?.resueltos ?? 0) + (stats?.cerrados ?? 0),
            icon: CheckCircle2,
            gradient: "from-emerald-500 to-teal-400",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="relative border-none shadow-zentry bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group h-full">
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${s.gradient} opacity-[0.06] group-hover:scale-125 transition-transform duration-700`}
              />
              <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">
                  {s.label}
                </CardTitle>
                <div
                  className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg`}
                >
                  <s.icon className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-10 w-20" />
                ) : (
                  <p className="text-3xl font-black text-slate-900">
                    {s.value}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filtros y búsqueda */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <Card className="border-none shadow-zentry bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por título, descripción, usuario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 rounded-xl border-slate-200 bg-white/80"
              />
            </div>
            <Select
              value={filterEstado}
              onValueChange={(v) => setFilterEstado(v as ReporteEstado | "todos")}
            >
              <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                {ESTADO_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterCategoria}
              onValueChange={setFilterCategoria}
            >
              <SelectTrigger className="w-full sm:w-[200px] rounded-xl">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {CATEGORIA_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {getCategoriaDisplay(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      </motion.div>

      {/* Lista de reportes */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Listado de reportes
            </CardTitle>
            <p className="text-slate-500 font-medium">
              {reportes.length} resultado{reportes.length !== 1 ? "s" : ""}
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
            ) : reportes.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-slate-50/80 border border-slate-100">
                <FileText className="h-14 w-14 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-semibold text-lg">
                  No hay reportes
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  Los reportes de los residentes aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {reportes.map((r, i) => (
                    <motion.div
                      key={r.reporteId}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="group flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border border-slate-100 bg-white/60 hover:bg-white hover:border-primary/20 hover:shadow-zentry transition-all cursor-pointer"
                      onClick={() => setSelectedReporte(r)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-slate-900 truncate">
                            {r.titulo || "Sin título"}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold uppercase shrink-0"
                          >
                            {getCategoriaDisplay(r.categoria)}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2">
                          {r.descripcion}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {r.userName}
                          </span>
                          {r.domicilio && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {r.domicilio}
                            </span>
                          )}
                          {r._residencialNombre && (
                            <span>{r._residencialNombre}</span>
                          )}
                          <span>{formatFecha(r.fechaCreacion)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
                          className={
                            r.estado === "pendiente"
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : r.estado === "resuelto" || r.estado === "cerrado"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : "bg-blue-100 text-blue-700 border-blue-200"
                          }
                        >
                          {getEstadoDisplay(r.estado)}
                        </Badge>
                        <span className="text-slate-400 group-hover:text-primary transition-colors text-xs font-bold">
                          Ver →
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Sheet detalle */}
      <DetalleReporteSheet
        reporte={selectedReporte}
        open={!!selectedReporte}
        onClose={() => setSelectedReporte(null)}
        onUpdated={() => {
          setSelectedReporte(null);
          fetchReportes();
        }}
        loading={detailLoading}
        setLoading={setDetailLoading}
      />
    </div>
  );
}

function DetalleReporteSheet({
  reporte,
  open,
  onClose,
  onUpdated,
  loading,
  setLoading,
}: {
  reporte: Reporte | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [estado, setEstado] = useState<ReporteEstado | "">("");
  const [resolucion, setResolucion] = useState("");
  const [comentario, setComentario] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (reporte) {
      setEstado(reporte.estado);
      setResolucion(reporte.resolucion || "");
      setComentario("");
    }
  }, [reporte]);

  const handleSaveEstado = async () => {
    if (!reporte?.reporteId || !reporte._residencialDocId || !estado) return;
    setSaving(true);
    try {
      await ReportesService.updateReporte(reporte._residencialDocId, reporte.reporteId, {
        estado: estado as ReporteEstado,
      });
      toast.success("Estado actualizado");
      onUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveResolucion = async () => {
    if (!reporte?.reporteId || !reporte._residencialDocId) return;
    setSaving(true);
    try {
      await ReportesService.updateReporte(reporte._residencialDocId, reporte.reporteId, {
        resolucion: resolucion.trim() || undefined,
        estado: "resuelto",
      });
      toast.success("Resolución guardada");
      onUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleAddComentario = async () => {
    if (!reporte?.reporteId || !reporte._residencialDocId || !comentario.trim()) return;
    setSaving(true);
    try {
      await ReportesService.updateReporte(reporte._residencialDocId, reporte.reporteId, {
        comentarioAdmin: {
          uid: "", // opcional en tu backend
          nombre: "Administración",
          texto: comentario.trim(),
        },
      });
      toast.success("Comentario agregado");
      setComentario("");
      setLoading(true);
      onUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Error al agregar comentario");
    } finally {
      setSaving(false);
    }
  };

  if (!reporte) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white/95 backdrop-blur-xl border-slate-200">
        <SheetHeader>
          <SheetTitle className="text-xl font-black text-slate-900">
            {reporte.titulo || "Detalle del reporte"}
          </SheetTitle>
          <SheetDescription>
            {getCategoriaDisplay(reporte.categoria)} · {formatFecha(reporte.fechaCreacion)}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div>
            <Label className="text-slate-500 font-bold text-xs uppercase tracking-widest">
              Descripción
            </Label>
            <p className="mt-2 text-slate-800 rounded-xl bg-slate-50 p-4 border border-slate-100">
              {reporte.descripcion}
            </p>
          </div>
          {reporte.ubicacionOpcional && (
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{reporte.ubicacionOpcional}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {reporte.userName}
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {reporte.domicilio}
            </span>
            {reporte._residencialNombre && (
              <Badge variant="outline" className="text-xs">
                {reporte._residencialNombre}
              </Badge>
            )}
          </div>

          {/* Fotos */}
          {reporte.fotos?.length ? (
            <div>
              <Label className="text-slate-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Fotos
              </Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {reporte.fotos.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-24 h-24 rounded-xl overflow-hidden border border-slate-200 hover:opacity-90"
                  >
                    <img
                      src={url}
                      alt={`Adjunto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {/* Estado */}
          <div>
            <Label className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2 block">
              Estado
            </Label>
            <div className="flex gap-2 flex-wrap">
              <Select value={estado} onValueChange={(v) => setEstado(v as ReporteEstado)}>
                <SelectTrigger className="w-[180px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADO_OPTIONS.filter((o) => o.value !== "todos").map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleSaveEstado}
                disabled={saving}
                className="rounded-xl"
              >
                Guardar estado
              </Button>
            </div>
          </div>

          {/* Resolución */}
          <div>
            <Label className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2 block">
              Resolución
            </Label>
            <Textarea
              value={resolucion}
              onChange={(e) => setResolucion(e.target.value)}
              placeholder="Describe la resolución o cierre del reporte..."
              className="min-h-[100px] rounded-xl border-slate-200"
            />
            <Button
              size="sm"
              onClick={handleSaveResolucion}
              disabled={saving}
              className="mt-2 rounded-xl"
            >
              Guardar resolución y marcar resuelto
            </Button>
          </div>

          {/* Comentarios admin */}
          {reporte.comentariosAdmin?.length ? (
            <div>
              <Label className="text-slate-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4" />
                Comentarios de administración
              </Label>
              <ul className="space-y-2">
                {reporte.comentariosAdmin.map((c, i) => (
                  <li
                    key={i}
                    className="text-sm p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <span className="font-semibold text-slate-700">{c.nombre}</span>
                    <span className="text-slate-500 text-xs ml-2">
                      {formatFecha(c.fecha)}
                    </span>
                    <p className="mt-1 text-slate-700">{c.texto}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <Label className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2 block">
              Agregar comentario
            </Label>
            <div className="flex gap-2">
              <Textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Escribe un comentario interno..."
                className="min-h-[80px] rounded-xl flex-1 border-slate-200"
              />
              <Button
                size="icon"
                onClick={handleAddComentario}
                disabled={saving || !comentario.trim()}
                className="rounded-xl shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
