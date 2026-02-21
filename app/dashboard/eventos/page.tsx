"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import {
  Search, Plus, Pencil, Trash2, Calendar, MapPin, Clock,
  CalendarDays, Users, Loader2, ShieldCheck, RefreshCw, Eye,
} from "lucide-react";
import {
  Evento, Residencial, AsistenteEvento,
  getResidenciales, crearEvento, actualizarEvento, eliminarEvento,
  suscribirseAEventos, getAsistentesEvento,
} from "@/lib/firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

interface EventoFormData {
  titulo: string;
  descripcion: string;
  fechaInicio: string;
  horaInicio: string;
  fechaFin: string;
  horaFin: string;
  ubicacion: string;
  organizador: string;
  residencialId: string;
  estado: "programado" | "en_curso" | "finalizado" | "cancelado";
  capacidadMaxima: string;
}

const EMPTY_FORM: EventoFormData = {
  titulo: "", descripcion: "", fechaInicio: "", horaInicio: "09:00",
  fechaFin: "", horaFin: "18:00", ubicacion: "", organizador: "",
  residencialId: "", estado: "programado", capacidadMaxima: "",
};

export default function EventosPage() {
  const { user, userClaims, loading: authLoading } = useAuth();

  const [residenciales, setResidenciales] = useState<Residencial[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [residencialFilter, setResidencialFilter] = useState("todos");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [mapeoResidenciales, setMapeoResidenciales] = useState<Record<string, string>>({});

  const [openDialog, setOpenDialog] = useState(false);
  const [currentEvento, setCurrentEvento] = useState<Evento | null>(null);
  const [formData, setFormData] = useState<EventoFormData>(EMPTY_FORM);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [asistentesMap, setAsistentesMap] = useState<Record<string, AsistenteEvento[]>>({});
  const [viewAsistentesEvento, setViewAsistentesEvento] = useState<Evento | null>(null);
  const [loadingAsistentes, setLoadingAsistentes] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const esAdminDeResidencial = useMemo(
    () => userClaims?.isResidencialAdmin && !userClaims?.isGlobalAdmin,
    [userClaims],
  );
  const residencialCodigoDelAdmin = useMemo(
    () => (esAdminDeResidencial ? userClaims?.managedResidencialId : null),
    [esAdminDeResidencial, userClaims],
  );
  const residencialIdDocDelAdmin = useMemo(() => {
    if (!esAdminDeResidencial || !residencialCodigoDelAdmin || Object.keys(mapeoResidenciales).length === 0) return null;
    return Object.keys(mapeoResidenciales).find((k) => mapeoResidenciales[k] === residencialCodigoDelAdmin) || null;
  }, [esAdminDeResidencial, residencialCodigoDelAdmin, mapeoResidenciales]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getResidenciales();
        setResidenciales(data);
        const map: Record<string, string> = {};
        data.forEach((r) => { if (r.id && r.residencialID) map[r.id] = r.residencialID; });
        setMapeoResidenciales(map);
        if (esAdminDeResidencial && residencialCodigoDelAdmin) {
          const docId = Object.keys(map).find((k) => map[k] === residencialCodigoDelAdmin);
          if (docId) setResidencialFilter(docId);
        }
      } catch (e) {
        console.error("Error cargando residenciales:", e);
      }
    };
    load();
  }, [esAdminDeResidencial, residencialCodigoDelAdmin]);

  useEffect(() => {
    if (residenciales.length === 0) return;
    setLoading(true);

    const unsubscribers: (() => void)[] = [];
    const residencialesList = esAdminDeResidencial && residencialIdDocDelAdmin
      ? residenciales.filter((r) => r.id === residencialIdDocDelAdmin)
      : residencialFilter !== "todos"
        ? residenciales.filter((r) => r.id === residencialFilter)
        : residenciales;

    let allEventos: Evento[] = [];

    residencialesList.forEach((r) => {
      if (!r.id) return;
      const unsub = suscribirseAEventos(r.id, (evts) => {
        const withNombre = evts.map((e) => ({ ...e, residencialNombre: r.nombre }));
        allEventos = [...allEventos.filter((e) => e.residencialId !== r.id), ...withNombre];
        allEventos.sort((a, b) => {
          try { return b.fechaInicio.toMillis() - a.fechaInicio.toMillis(); } catch { return 0; }
        });
        setEventos([...allEventos]);
        setLoading(false);
        setLastUpdate(new Date());
      });
      unsubscribers.push(unsub);
    });

    const timer = setTimeout(() => setLoading(false), 4000);
    return () => { unsubscribers.forEach((u) => u()); clearTimeout(timer); };
  }, [residenciales, residencialFilter, esAdminDeResidencial, residencialIdDocDelAdmin]);

  useEffect(() => {
    if (eventos.length === 0) return;
    eventos.forEach(async (e) => {
      if (!e.id || asistentesMap[e.id]) return;
      try {
        const a = await getAsistentesEvento(e.id);
        setAsistentesMap((prev) => ({ ...prev, [e.id!]: a }));
      } catch { /* ignore */ }
    });
  }, [eventos]);

  const filteredEventos = useMemo(() => {
    return eventos.filter((e) => {
      const matchSearch = !searchTerm || e.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.ubicacion.toLowerCase().includes(searchTerm.toLowerCase());
      const matchEstado = estadoFilter === "todos" || e.estado === estadoFilter;
      return matchSearch && matchEstado;
    });
  }, [eventos, searchTerm, estadoFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: eventos.length,
      programados: eventos.filter((e) => e.estado === "programado").length,
      enCurso: eventos.filter((e) => e.estado === "en_curso").length,
      finalizados: eventos.filter((e) => e.estado === "finalizado").length,
    };
  }, [eventos]);

  const formatFecha = (ts: Timestamp) => {
    try { return format(ts.toDate(), "dd/MM/yyyy hh:mm a", { locale: es }); }
    catch { return "—"; }
  };

  const getEstadoBadge = (estado: string) => {
    const base = "border-none px-4 py-1.5 rounded-full font-black text-[9px] tracking-widest shadow-sm";
    switch (estado) {
      case "programado":
        return <Badge className={`${base} bg-blue-100 text-blue-700`}>Programado</Badge>;
      case "en_curso":
        return <Badge className={`${base} bg-emerald-600 text-white`}>En curso</Badge>;
      case "finalizado":
        return <Badge className={`${base} bg-slate-200 text-slate-600`}>Finalizado</Badge>;
      case "cancelado":
        return <Badge className={`${base} bg-red-100 text-red-700`}>Cancelado</Badge>;
      default:
        return <Badge variant="outline" className={base}>{estado}</Badge>;
    }
  };

  const getResidencialNombre = (id: string) => residenciales.find((r) => r.id === id)?.nombre || "—";

  const handleOpenCreate = () => {
    const hoy = new Date();
    const manana = new Date(); manana.setDate(hoy.getDate() + 1);
    const defaultRes = esAdminDeResidencial && residencialIdDocDelAdmin ? residencialIdDocDelAdmin : (residencialFilter !== "todos" ? residencialFilter : (residenciales[0]?.id || ""));
    setCurrentEvento(null);
    setFormData({
      ...EMPTY_FORM,
      fechaInicio: format(hoy, "yyyy-MM-dd"),
      fechaFin: format(manana, "yyyy-MM-dd"),
      residencialId: defaultRes,
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (evento: Evento) => {
    setCurrentEvento(evento);
    const fi = evento.fechaInicio.toDate();
    const ff = evento.fechaFin.toDate();
    setFormData({
      titulo: evento.titulo, descripcion: evento.descripcion,
      fechaInicio: format(fi, "yyyy-MM-dd"), horaInicio: format(fi, "HH:mm"),
      fechaFin: format(ff, "yyyy-MM-dd"), horaFin: format(ff, "HH:mm"),
      ubicacion: evento.ubicacion, organizador: evento.organizador,
      residencialId: evento.residencialId, estado: evento.estado,
      capacidadMaxima: evento.capacidadMaxima ? String(evento.capacidadMaxima) : "",
    });
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.titulo.trim()) { toast.error("El título es obligatorio"); return; }
    if (!formData.residencialId) { toast.error("Selecciona un residencial"); return; }
    const fechaInicioObj = new Date(`${formData.fechaInicio}T${formData.horaInicio}`);
    const fechaFinObj = new Date(`${formData.fechaFin}T${formData.horaFin}`);
    if (fechaFinObj < fechaInicioObj) { toast.error("La fecha de fin debe ser posterior al inicio"); return; }

    const residencialDoc = residenciales.find((r) => r.id === formData.residencialId);
    const residencialCodigo = residencialDoc?.residencialID || mapeoResidenciales[formData.residencialId] || "";
    const residencialNombre = residencialDoc?.nombre || "";

    // Texto de fecha/hora tal como lo ve el admin (evita desfases por zona horaria en notificaciones)
    const fechaInicioTexto = format(fechaInicioObj, "d MMM yyyy hh:mm a", { locale: es });
    const fechaFinTexto = format(fechaFinObj, "d MMM yyyy hh:mm a", { locale: es });

    const payload: Record<string, any> = {
      titulo: formData.titulo, descripcion: formData.descripcion,
      fechaInicio: Timestamp.fromDate(fechaInicioObj),
      fechaFin: Timestamp.fromDate(fechaFinObj),
      fechaInicioTexto,
      fechaFinTexto,
      ubicacion: formData.ubicacion, organizador: formData.organizador,
      residencialId: formData.residencialId, estado: formData.estado,
      residencialCodigo, residencialNombre,
    };
    if (formData.capacidadMaxima) payload.capacidadMaxima = Number(formData.capacidadMaxima);
    if (!currentEvento) payload.createdBy = user?.email || "admin";

    const toastId = toast.loading(currentEvento ? "Actualizando..." : "Creando evento...");
    setOpenDialog(false);

    try {
      if (currentEvento) {
        await actualizarEvento(currentEvento.id!, payload);
        toast.dismiss(toastId); toast.success("Evento actualizado");
      } else {
        await crearEvento(payload as any);
        toast.dismiss(toastId); toast.success("Evento creado — los residentes recibirán notificación");
      }
    } catch (e: any) {
      toast.dismiss(toastId); toast.error(e.message || "Error al guardar");
    }
  };

  const handleDelete = async () => {
    if (!currentEvento?.id) return;
    const toastId = toast.loading("Eliminando...");
    setDeleteConfirmOpen(false);
    try {
      await eliminarEvento(currentEvento.id);
      toast.dismiss(toastId); toast.success("Evento eliminado");
    } catch (e: any) {
      toast.dismiss(toastId); toast.error(e.message || "Error al eliminar");
    }
  };

  const handleViewAsistentes = async (evento: Evento) => {
    setViewAsistentesEvento(evento);
    setLoadingAsistentes(true);
    try {
      const a = await getAsistentesEvento(evento.id!);
      setAsistentesMap((prev) => ({ ...prev, [evento.id!]: a }));
    } catch { /* ignore */ }
    setLoadingAsistentes(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  if (!userClaims?.isGlobalAdmin && !esAdminDeResidencial) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-2">
          <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold">Acceso restringido</h2>
          <p className="text-muted-foreground">Solo administradores pueden acceder a la gestión de eventos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-premium p-4 lg:p-10 space-y-8 pb-20">
      {/* Header Premium — alineado con Ingresos / Reportes */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between gap-6 items-start"
      >
        <div className="space-y-2">
          <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1 rounded-full flex gap-2 w-fit items-center shadow-sm">
            <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
            Gestión de Eventos
          </Badge>
          <h1 className="text-5xl font-extrabold tracking-tighter text-slate-900">
            Eventos del <span className="text-gradient-zentry">Residencial</span>
          </h1>
          <p className="text-slate-600 font-bold max-w-lg">
            Crea eventos, notifica a tus residentes y gestiona asistencia en tiempo real.
          </p>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Actualizado: {lastUpdate.toLocaleTimeString()}
            <span className="flex items-center text-emerald-500 animate-pulse">
              <RefreshCw className="h-3 w-3 mr-1" />
              Live Sync
            </span>
          </p>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
          <Button
            onClick={handleOpenCreate}
            className="rounded-2xl h-14 px-8 font-black shadow-zentry-lg bg-slate-900 text-white hover:bg-slate-800 hover-lift transition-all shrink-0"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nuevo Evento
          </Button>
        </div>
      </motion.div>

      {/* Stats cards — estilo Ingresos (StatTile) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatTile icon={<CalendarDays className="h-6 w-6" />} label="Total" value={stats.total} color="blue" description="Eventos registrados" />
        <StatTile icon={<Calendar className="h-6 w-6" />} label="Programados" value={stats.programados} color="purple" description="Por iniciar" />
        <StatTile icon={<Clock className="h-6 w-6" />} label="En curso" value={stats.enCurso} color="green" description="Activos ahora" />
        <StatTile icon={<Eye className="h-6 w-6" />} label="Finalizados" value={stats.finalizados} color="orange" description="Completados" />
      </motion.div>

      {/* Filtros — Card premium como Ingresos */}
      <Card className="border-none shadow-zentry-lg bg-white/80 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
        <div className="p-8 pb-4 border-b border-slate-100/80 space-y-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <Search className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-widest mr-4 text-slate-800">Filtrado</h2>
              <div className="relative w-full md:w-[320px]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600" />
                <Input
                  type="search"
                  placeholder="Buscar por título, ubicación..."
                  className="pl-12 h-14 bg-white border border-slate-300 shadow-sm rounded-2xl font-bold focus-visible:ring-primary/20 text-slate-900 placeholder:text-slate-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {!esAdminDeResidencial && (
                <Select value={residencialFilter} onValueChange={setResidencialFilter}>
                  <SelectTrigger className="h-14 bg-white border border-slate-300 shadow-sm rounded-2xl font-bold px-6 text-slate-900 min-w-[200px]">
                    <SelectValue placeholder="Residencial" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-3xl">
                    <SelectItem value="todos" className="font-bold">Todos los residenciales</SelectItem>
                    {residenciales.filter((r) => r.id).map((r) => (
                      <SelectItem key={r.id} value={r.id!} className="font-bold">{r.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex bg-slate-200/50 p-1.5 rounded-2xl shadow-inner gap-1.5 overflow-x-auto">
              {[
                { value: "todos", label: "Todos", icon: <CalendarDays className="h-3 w-3" /> },
                { value: "programado", label: "Programados", icon: <Calendar className="h-3 w-3" /> },
                { value: "en_curso", label: "En curso", icon: <Clock className="h-3 w-3" /> },
                { value: "finalizado", label: "Finalizados", icon: <Eye className="h-3 w-3" /> },
                { value: "cancelado", label: "Cancelados", icon: <Trash2 className="h-3 w-3" /> },
              ].map((f) => (
                <FilterChip
                  key={f.value}
                  active={estadoFilter === f.value}
                  onClick={() => setEstadoFilter(f.value)}
                  label={f.label}
                  icon={f.icon}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Table Card — mismo Card, contenido tabla abajo */}
        <div className="p-6 pt-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest">Listado de eventos</h2>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                {filteredEventos.length} evento{filteredEventos.length !== 1 ? "s" : ""} encontrado{filteredEventos.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div>
            {loading ? (
              <div className="space-y-3">
                {Array(6).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-100/50">
                    <TableRow className="border-none">
                      <TableHead className="py-6 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Evento</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Residencial</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Inicio</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Fin</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Ubicación</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Asistentes</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Estado</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 text-right px-6">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEventos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                              <CalendarDays className="h-8 w-8 text-slate-400" />
                            </div>
                            <p className="text-xl font-black text-slate-600">No se encontraron eventos</p>
                            <p className="text-sm font-bold text-slate-500">Crea un nuevo evento para empezar.</p>
                            <Button onClick={handleOpenCreate} variant="outline" className="rounded-2xl font-black mt-2 text-slate-700 border-slate-300">
                              <Plus className="h-4 w-4 mr-2" /> Nuevo evento
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredEventos.map((evento) => {
                      const asistentes = evento.id ? (asistentesMap[evento.id] || []) : [];
                      return (
                        <TableRow key={evento.id} className="group border-white/10 hover:bg-slate-50 transition-all">
                          <TableCell className="py-6 px-6">
                            <div className="min-w-0">
                              <p className="font-black text-slate-900 truncate max-w-[220px]">{evento.titulo}</p>
                              <p className="text-[10px] font-bold text-slate-500 truncate max-w-[220px]">{evento.descripcion || "—"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-black text-slate-700">{evento.residencialNombre || getResidencialNombre(evento.residencialId)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700 shrink-0 border border-indigo-100">
                                <Calendar className="h-4 w-4" />
                              </div>
                              <p className="text-sm font-black text-slate-900">{formatFecha(evento.fechaInicio)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-700 shrink-0 border border-violet-100">
                                <Clock className="h-4 w-4" />
                              </div>
                              <p className="text-sm font-black text-slate-900">{formatFecha(evento.fechaFin)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                              <span className="text-sm font-bold text-slate-700">{evento.ubicacion || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleViewAsistentes(evento)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-primary/10 hover:text-primary transition-all text-sm font-black text-slate-700 border border-slate-200/80"
                            >
                              <Users className="h-4 w-4" />
                              {asistentes.length}
                              {evento.capacidadMaxima ? <span className="text-slate-500 font-medium">/ {evento.capacidadMaxima}</span> : null}
                            </button>
                          </TableCell>
                          <TableCell>{getEstadoBadge(evento.estado)}</TableCell>
                          <TableCell className="text-right px-6">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl text-slate-500 hover:text-primary hover:bg-primary/10 transition-all"
                                onClick={() => handleOpenEdit(evento)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
                                onClick={() => { setCurrentEvento(evento); setDeleteConfirmOpen(true); }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Modal Crear / Editar evento — Premium */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl bg-white p-0 overflow-hidden">
          <div className="p-8 pb-6 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                {currentEvento ? "Editar evento" : "Nuevo evento"}
              </DialogTitle>
              <DialogDescription className="text-slate-600 font-bold mt-1">
                {currentEvento ? "Modifica los detalles del evento." : "Completa los datos para crear un nuevo evento."}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 block">Título</label>
                  <Input name="titulo" value={formData.titulo} onChange={handleInputChange} placeholder="Ej: Junta de vecinos" className="h-14 rounded-2xl border-slate-300 font-bold text-slate-900 shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 block">Descripción</label>
                  <Textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} placeholder="Detalles del evento..." className="min-h-[100px] resize-none rounded-2xl border-slate-300 font-medium text-slate-900 shadow-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 block">Residencial</label>
                  <Select value={formData.residencialId} onValueChange={(v) => setFormData((p) => ({ ...p, residencialId: v }))} disabled={!!esAdminDeResidencial}>
                    <SelectTrigger className="h-14 rounded-2xl border-slate-300 font-bold bg-white shadow-sm">
                      <SelectValue placeholder="Seleccionar residencial" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl bg-white/95">
                      {residenciales.filter((r) => r.id && (!esAdminDeResidencial || r.id === residencialIdDocDelAdmin)).map((r) => (
                        <SelectItem key={r.id} value={r.id!} className="font-bold">{r.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 block">Ubicación</label>
                  <Input name="ubicacion" value={formData.ubicacion} onChange={handleInputChange} placeholder="Ej: Salón de eventos" className="h-14 rounded-2xl border-slate-300 font-bold text-slate-900 shadow-sm" />
                </div>
              </div>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 block">Fecha inicio</label>
                    <Input type="date" name="fechaInicio" value={formData.fechaInicio} onChange={handleInputChange} className="h-14 rounded-2xl border-slate-300 font-bold shadow-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 block">Hora inicio</label>
                    <Input type="time" name="horaInicio" value={formData.horaInicio} onChange={handleInputChange} className="h-14 rounded-2xl border-slate-300 font-bold shadow-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 block">Fecha fin</label>
                    <Input type="date" name="fechaFin" value={formData.fechaFin} onChange={handleInputChange} className="h-14 rounded-2xl border-slate-300 font-bold shadow-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 block">Hora fin</label>
                    <Input type="time" name="horaFin" value={formData.horaFin} onChange={handleInputChange} className="h-14 rounded-2xl border-slate-300 font-bold shadow-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 block">Organizador</label>
                  <Input name="organizador" value={formData.organizador} onChange={handleInputChange} placeholder="Nombre del organizador" className="h-14 rounded-2xl border-slate-300 font-bold text-slate-900 shadow-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 block">Estado</label>
                    <Select value={formData.estado} onValueChange={(v) => setFormData((p) => ({ ...p, estado: v as any }))}>
                      <SelectTrigger className="h-14 rounded-2xl border-slate-300 font-bold bg-white shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl bg-white/95">
                        <SelectItem value="programado" className="font-bold">Programado</SelectItem>
                        <SelectItem value="en_curso" className="font-bold">En curso</SelectItem>
                        <SelectItem value="finalizado" className="font-bold">Finalizado</SelectItem>
                        <SelectItem value="cancelado" className="font-bold">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2 block">Capacidad</label>
                    <Input name="capacidadMaxima" type="number" min="0" value={formData.capacidadMaxima} onChange={handleInputChange} placeholder="Opcional" className="h-14 rounded-2xl border-slate-300 font-bold shadow-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 pt-0 gap-4 flex-row-reverse sm:flex-row-reverse">
            <Button
              onClick={handleSubmit}
              disabled={!formData.titulo.trim() || !formData.residencialId}
              className="rounded-2xl h-14 px-8 font-black shadow-zentry-lg bg-slate-900 text-white hover:bg-slate-800 hover-lift transition-all"
            >
              {currentEvento ? "Guardar cambios" : "Crear evento"}
            </Button>
            <Button variant="outline" onClick={() => setOpenDialog(false)} className="rounded-2xl h-14 px-6 font-bold border-slate-300 text-slate-700 bg-white">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation — Premium */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl bg-white p-8 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-slate-900">Eliminar evento</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 font-medium">
              ¿Estás seguro de que deseas eliminar &quot;{currentEvento?.titulo}&quot;? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-4">
            <AlertDialogCancel className="rounded-2xl h-12 font-bold border-slate-300">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700 rounded-2xl h-12 font-black shadow-lg">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Asistentes dialog — Premium */}
      <Dialog open={!!viewAsistentesEvento} onOpenChange={(o) => { if (!o) setViewAsistentesEvento(null); }}>
        <DialogContent className="max-w-lg rounded-[2.5rem] border-none shadow-2xl bg-white p-0 overflow-hidden">
          <div className="p-8 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-900">Asistentes — {viewAsistentesEvento?.titulo}</DialogTitle>
              <DialogDescription className="text-slate-600 font-bold mt-1">
                {viewAsistentesEvento?.id && asistentesMap[viewAsistentesEvento.id]
                  ? `${asistentesMap[viewAsistentesEvento.id].length} confirmado${asistentesMap[viewAsistentesEvento.id].length !== 1 ? "s" : ""}`
                  : "Cargando..."}
              </DialogDescription>
            </DialogHeader>
          </div>
          {loadingAsistentes ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="p-6 max-h-80 overflow-y-auto">
              {viewAsistentesEvento?.id && (asistentesMap[viewAsistentesEvento.id] || []).length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Users className="h-7 w-7 text-slate-400" />
                  </div>
                  <p className="font-black text-slate-600">Aún no hay asistentes confirmados</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-100/50">
                    <TableRow className="border-none">
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Nombre</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Email</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Confirmado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewAsistentesEvento?.id && (asistentesMap[viewAsistentesEvento.id] || []).map((a) => (
                      <TableRow key={a.userId} className="border-slate-100 hover:bg-slate-50/80">
                        <TableCell className="font-black text-sm text-slate-900">{a.userName}</TableCell>
                        <TableCell className="text-sm font-bold text-slate-600">{a.userEmail || "—"}</TableCell>
                        <TableCell className="text-xs font-bold text-slate-500">
                          {a.respondedAt ? format(a.respondedAt.toDate(), "dd/MM/yyyy hh:mm a", { locale: es }) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ——— Componentes premium (mismo estilo que Ingresos) ———
function StatTile({
  icon,
  label,
  value,
  color,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "blue" | "purple" | "green" | "orange";
  description: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
  };
  return (
    <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-2xl rounded-[2.2rem] p-6 group hover:translate-y-[-4px] hover:shadow-2xl transition-all duration-300 ring-1 ring-slate-100">
      <div className="flex items-start gap-5">
        <div className={`h-14 w-14 rounded-2xl ${colors[color]} border flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm`}>
          {icon}
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{label}</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
            <span className="text-emerald-500 font-black text-[10px] animate-pulse">●</span>
          </div>
          <p className="text-[10px] font-bold text-slate-500 truncate mt-1">{description}</p>
        </div>
      </div>
    </Card>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
        active ? "bg-slate-900 text-white shadow-xl shadow-slate-200 scale-105" : "text-slate-700 hover:text-slate-950 hover:bg-white/60"
      }`}
    >
      {icon && <span className={active ? "text-white" : "text-slate-500"}>{icon}</span>}
      {label}
    </button>
  );
}
