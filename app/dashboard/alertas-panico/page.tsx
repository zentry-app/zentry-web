"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import {
  Search,
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Info,
  PlusCircle,
  Eye,
  Loader2,
  Pencil,
  Trash2,
  Send,
  CalendarClock,
  Megaphone,
  ShieldAlert,
  History,
} from "lucide-react";
import { 
  AlertaPanico as BaseAlertaPanico, 
  Residencial, 
  getResidenciales, 
  getAlertasPanico, 
  actualizarEstadoAlertaPanico, 
  marcarAlertaPanicoComoLeida, 
  suscribirseAAlertasPanico, 
  getNotificaciones,
  suscribirseANotificaciones,
  NotificacionProgramada,
  RecurrenciaNotificacion,
  suscribirseANotificacionesProgramadas,
  actualizarNotificacionProgramada,
  eliminarNotificacionProgramada,
} from "@/lib/firebase/firestore";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  collection,
  getDocs,
  getFirestore,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/firebase/config";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AlertaPanico extends BaseAlertaPanico {
  _residencialNombre?: string;
  tipo?: string;
}

interface Usuario {
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  direccion?: string;
  role?: "admin" | "resident" | "security" | "guest";
  residencialID?: string;
}

export default function AlertasPanicoPage() {
  const router = useRouter();
  const { user, userClaims, loading: authLoading } = useAuth();

  const [residenciales, setResidenciales] = useState<Residencial[]>([]);
  const [residencialFilter, setResidencialFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [alertas, setAlertas] = useState<AlertaPanico[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAlerta, setSelectedAlerta] = useState<AlertaPanico | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [alertasActualizando, setAlertasActualizando] = useState<Record<string, boolean>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [newAlertaResidencial, setNewAlertaResidencial] = useState<string>("");
  const [newAlertaMensaje, setNewAlertaMensaje] = useState<string>("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [tipoAlerta, setTipoAlerta] = useState<string>("notificacion");
  const [activeTab, setActiveTab] = useState<string>("alertas");
  const [destinatariosTopic, setDestinatariosTopic] = useState<string>("todos");
  const [mapeoResidenciales, setMapeoResidenciales] = useState<{ [key: string]: string }>({});

  // Programar state
  const [isProgramada, setIsProgramada] = useState<boolean>(false);
  const [fechaEnvio, setFechaEnvio] = useState<string>("");
  const [horaEnvio, setHoraEnvio] = useState<string>("09:00");
  const [recurrenciaEnvio, setRecurrenciaEnvio] = useState<RecurrenciaNotificacion>("once");
  const [diaSemanaEnvio, setDiaSemanaEnvio] = useState<number>(1); // 0=Dom, 1=Lun, ..., 6=Sab
  const [diaMesEnvio, setDiaMesEnvio] = useState<number>(1); // 1-28

  // Notificaciones programadas
  const [notificacionesProgramadas, setNotificacionesProgramadas] = useState<NotificacionProgramada[]>([]);
  const [notifSubTab, setNotifSubTab] = useState<string>("enviadas");

  // Edit programada dialog
  const [isEditProgramadaOpen, setIsEditProgramadaOpen] = useState(false);
  const [editingProgramada, setEditingProgramada] = useState<NotificacionProgramada | null>(null);
  const [editProgramadaTitulo, setEditProgramadaTitulo] = useState("");
  const [editProgramadaMensaje, setEditProgramadaMensaje] = useState("");
  const [editProgramadaFecha, setEditProgramadaFecha] = useState("");
  const [editProgramadaHora, setEditProgramadaHora] = useState("");
  const [editProgramadaTipo, setEditProgramadaTipo] = useState("notificacion");
  const [editProgramadaDestinatarios, setEditProgramadaDestinatarios] = useState("todos");
  const [editProgramadaRecurrence, setEditProgramadaRecurrence] = useState<RecurrenciaNotificacion>("once");

  // Delete confirmation
  const [deleteProgramadaId, setDeleteProgramadaId] = useState<string | null>(null);
  const [deleteProgramadaResId, setDeleteProgramadaResId] = useState<string | null>(null);

  // Edit sent notification dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editingAlerta, setEditingAlerta] = useState<AlertaPanico | null>(null);
  const [editMensaje, setEditMensaje] = useState<string>("");
  const [editTipoAlerta, setEditTipoAlerta] = useState<string>("notificacion");

  const esAdminDeResidencial = useMemo(() => userClaims?.isResidencialAdmin && !userClaims?.isGlobalAdmin, [userClaims]);
  const residencialCodigoDelAdmin = useMemo(() => esAdminDeResidencial ? userClaims?.managedResidencialId : null, [esAdminDeResidencial, userClaims]);
  
  const residencialIdDocDelAdmin = useMemo(() => {
    if (!esAdminDeResidencial || !residencialCodigoDelAdmin || Object.keys(mapeoResidenciales).length === 0) return null;
    return Object.keys(mapeoResidenciales).find(
      (key) => mapeoResidenciales[key] === residencialCodigoDelAdmin
    ) || null;
  }, [esAdminDeResidencial, residencialCodigoDelAdmin, mapeoResidenciales]);

  const verificarYCorregirAlertas = useCallback((alertas: AlertaPanico[]): AlertaPanico[] => {
    return alertas.map((alerta) => {
      const alertaCorregida = { ...alerta };
      if (!alertaCorregida.id) alertaCorregida.id = `generado_${Date.now()}`;
      if (!alertaCorregida.message) alertaCorregida.message = "Sin mensaje";
      if (!alertaCorregida.title) alertaCorregida.title = "Alerta";
      const esAlertaAdmin =
        alertaCorregida.tipo === "anuncio" || alertaCorregida.tipo === "notificacion" ||
        alertaCorregida.type === "anuncio" || alertaCorregida.type === "notificacion";
      if (!alertaCorregida.userName && !esAlertaAdmin) alertaCorregida.userName = "Usuario desconocido";
      if (!alertaCorregida.timestamp) alertaCorregida.timestamp = Timestamp.now();
      if (typeof alertaCorregida.read !== "boolean") alertaCorregida.read = false;
      if (!["active", "in_progress", "resolved"].includes(alertaCorregida.status)) alertaCorregida.status = "active";
      return alertaCorregida;
    });
  }, []);

  // Load residenciales
  useEffect(() => {
    const fetchResidenciales = async () => {
      try {
        const residencialesData = await getResidenciales();
        setResidenciales(residencialesData);
        const mapeo = residencialesData.reduce<{ [key: string]: string }>((acc, r) => {
          if (r.id && r.residencialID) acc[r.id] = r.residencialID;
          return acc;
        }, {});
        setMapeoResidenciales(mapeo);
        if (esAdminDeResidencial) {
          const idDocAdmin = Object.keys(mapeo).find((key) => mapeo[key] === residencialCodigoDelAdmin);
          if (idDocAdmin) {
            setResidencialFilter(idDocAdmin);
            setNewAlertaResidencial(idDocAdmin);
          }
        }
      } catch {
        toast.error("Error al cargar residenciales");
      }
    };
    fetchResidenciales();
  }, [esAdminDeResidencial, residencialCodigoDelAdmin]);

  // Load users
  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const usuariosSnapshot = await getDocs(collection(db, "usuarios"));
        setUsuarios(usuariosSnapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Usuario[]);
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
      }
    };
    obtenerUsuarios();
  }, []);

  // Fetch alertas / notificaciones
  useEffect(() => {
    const fetchAlertas = async () => {
      if (authLoading) return;
      if ((residenciales.length === 0 && !esAdminDeResidencial) || (esAdminDeResidencial && !residencialIdDocDelAdmin)) return;
      setLoading(true);
      try {
        if (residencialFilter === "todos") {
          const allItems: AlertaPanico[] = [];
            for (const residencial of residenciales) {
              if (residencial.id) {
              let itemsRes: AlertaPanico[] = [];
                if (activeTab === "alertas") {
                itemsRes = await getAlertasPanico(residencial.id);
                } else {
                itemsRes = await getNotificaciones(residencial.id);
              }
              allItems.push(...itemsRes.map((item) => ({ ...item, _residencialNombre: residencial.nombre })));
            }
          }
          allItems.sort((a, b) => {
            if (!a.timestamp || !b.timestamp) return 0;
            try { return b.timestamp.toMillis() - a.timestamp.toMillis(); } catch { return 0; }
          });
          setAlertas(verificarYCorregirAlertas(allItems));
        } else {
          let itemsRes: AlertaPanico[] = [];
          if (activeTab === "alertas") {
            itemsRes = await getAlertasPanico(residencialFilter);
          } else {
            itemsRes = await getNotificaciones(residencialFilter);
          }
          const residencial = residenciales.find((r) => r.id === residencialFilter);
          const items = itemsRes.map((item: any) => ({ ...item, _residencialNombre: residencial?.nombre || "Desconocido" }));
          setAlertas(verificarYCorregirAlertas(items));
        }
      } catch {
        toast.error(`Error al cargar ${activeTab === "alertas" ? "alertas" : "notificaciones"}`);
      } finally {
        setLoading(false);
      }
    };
      fetchAlertas();
  }, [residenciales, residencialFilter, activeTab, authLoading, esAdminDeResidencial, residencialIdDocDelAdmin, verificarYCorregirAlertas]);

  // Realtime subscriptions
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    const setupSubscriptions = () => {
      if (residencialFilter === "todos") {
          for (const residencial of residenciales) {
          if (!residencial.id) continue;
          let unsub: () => void;
              if (activeTab === "alertas") {
            unsub = suscribirseAAlertasPanico(residencial.id, (alertasActualizadas) => {
              setAlertas((prev) => {
                const otros = prev.filter((a) => a.residencialID !== residencial.id);
                const nuevas = alertasActualizadas.map((a) => ({ ...a, _residencialNombre: residencial.nombre }));
                const todas = [...otros, ...nuevas];
                todas.sort((a, b) => {
                      if (!a.timestamp || !b.timestamp) return 0;
                  try { return b.timestamp.toMillis() - a.timestamp.toMillis(); } catch { return 0; }
                });
                return verificarYCorregirAlertas(todas);
                  });
                });
              } else {
            unsub = suscribirseANotificaciones(residencial.id, (notifs) => {
              setAlertas((prev) => {
                const otros = prev.filter((a) => a.residencialID !== residencial.id);
                const nuevas = notifs.map((n) => ({ ...n, _residencialNombre: residencial.nombre }));
                const todas = [...otros, ...nuevas];
                todas.sort((a, b) => {
                      if (!a.timestamp || !b.timestamp) return 0;
                  try { return b.timestamp.toMillis() - a.timestamp.toMillis(); } catch { return 0; }
                });
                return verificarYCorregirAlertas(todas);
                  });
                });
              }
          unsubscribes.push(unsub);
        }
      } else {
        let unsub: () => void;
        if (activeTab === "alertas") {
          unsub = suscribirseAAlertasPanico(residencialFilter, (alertasActualizadas) => {
            const residencial = residenciales.find((r) => r.id === residencialFilter);
            const items = alertasActualizadas.map((a: any) => ({ ...a, _residencialNombre: residencial?.nombre || "Desconocido" }));
            setAlertas(verificarYCorregirAlertas(items));
            setLoading(false);
          });
        } else {
          unsub = suscribirseANotificaciones(residencialFilter, (notifs) => {
            const residencial = residenciales.find((r) => r.id === residencialFilter);
            const items = notifs.map((n: any) => ({ ...n, _residencialNombre: residencial?.nombre || "Desconocido" }));
            setAlertas(verificarYCorregirAlertas(items));
            setLoading(false);
          });
        }
        unsubscribes.push(unsub);
      }
    };
    setupSubscriptions();
    return () => unsubscribes.forEach((u) => u());
  }, [residencialFilter, residenciales, activeTab, authLoading, esAdminDeResidencial, residencialIdDocDelAdmin, verificarYCorregirAlertas]);

  // Subscribe to scheduled notifications
  useEffect(() => {
    if (activeTab !== "notificaciones") return;
    const unsubscribes: (() => void)[] = [];

    if (residencialFilter === "todos") {
      for (const res of residenciales) {
        if (!res.id) continue;
        const unsub = suscribirseANotificacionesProgramadas(res.id, (items) => {
          setNotificacionesProgramadas((prev) => {
            const otrasRes = prev.filter((p) => p.residencialID !== (res as any).residencialID && p.residencialID !== res.id);
            const itemsConNombre = items.map((i) => ({ ...i, residencialNombre: res.nombre, residencialID: i.residencialID || res.id! }));
            return [...otrasRes, ...itemsConNombre].sort((a, b) => {
              try { return a.scheduledAt.toMillis() - b.scheduledAt.toMillis(); } catch { return 0; }
            });
          });
        });
        unsubscribes.push(unsub);
      }
    } else {
      const res = residenciales.find((r) => r.id === residencialFilter);
      const unsub = suscribirseANotificacionesProgramadas(residencialFilter, (items) => {
        setNotificacionesProgramadas(
          items.map((i) => ({ ...i, residencialNombre: res?.nombre, residencialID: i.residencialID || residencialFilter }))
            .sort((a, b) => { try { return a.scheduledAt.toMillis() - b.scheduledAt.toMillis(); } catch { return 0; } })
        );
      });
      unsubscribes.push(unsub);
    }

    return () => unsubscribes.forEach((u) => u());
  }, [activeTab, residencialFilter, residenciales]);

  const filteredAlertas = useMemo(
    () =>
      alertas.filter((alerta) => {
    const matchesTab = activeTab === "alertas" 
      ? (alerta.tipo || alerta.type) === "panic_alert" 
      : (alerta.tipo || alerta.type) !== "panic_alert";
    const matchesStatus = statusFilter === "todos" || alerta.status === statusFilter;
    const matchesSearch = 
      searchTerm === "" || 
      (alerta.userName && alerta.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (alerta.message && alerta.message.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesStatus && matchesSearch;
      }),
    [alertas, activeTab, statusFilter, searchTerm]
  );

  // --- Handlers ---

  const handleStatusChange = async (alertaId: string | undefined, residencialID: string | undefined, newStatus: AlertaPanico["status"], intentos = 1) => {
    if (!alertaId || !residencialID) { toast.error("Error al cambiar el estado"); return; }
    if (alertasActualizando[alertaId]) return;
    const alertaOriginal = alertas.find((a) => a.id === alertaId);
    const estadoOriginal = alertaOriginal?.status || "active";
    if (estadoOriginal === newStatus) return;

    let residencialDocId = residencialID;
    if (alertaOriginal && (alertaOriginal as any)._residencialDocId) {
      residencialDocId = (alertaOriginal as any)._residencialDocId;
    } else if (alertaOriginal && alertaOriginal._residencialNombre) {
      const found = residenciales.find((r) => r.nombre === alertaOriginal._residencialNombre);
      if (found?.id) residencialDocId = found.id;
    }

    try {
      setAlertasActualizando((prev) => ({ ...prev, [alertaId]: true }));
      setAlertas((prev) => prev.map((a) => (a.id === alertaId ? { ...a, status: newStatus } : a)));
      const ok = await actualizarEstadoAlertaPanico(residencialDocId, alertaId, newStatus);
      if (ok) {
          toast.success(`Estado cambiado a: ${getStatusLabel(newStatus)}`);
      } else if (intentos < 3) {
        setAlertasActualizando((prev) => ({ ...prev, [alertaId]: false }));
        setTimeout(() => handleStatusChange(alertaId, residencialID, newStatus, intentos + 1), 1000);
            return;
      } else {
        toast.warning("No se pudo actualizar en la base de datos.");
        setAlertas((prev) => prev.map((a) => (a.id === alertaId ? { ...a, status: estadoOriginal } : a)));
      }
      setAlertasActualizando((prev) => ({ ...prev, [alertaId]: false }));
    } catch {
        if (intentos < 3) {
        setAlertasActualizando((prev) => ({ ...prev, [alertaId]: false }));
        setTimeout(() => handleStatusChange(alertaId, residencialID, newStatus, intentos + 1), 1000);
          return;
        }
      toast.error("Error al cambiar el estado");
      setAlertasActualizando((prev) => ({ ...prev, [alertaId]: false }));
      setAlertas((prev) => prev.map((a) => (a.id === alertaId ? { ...a, status: estadoOriginal } : a)));
    }
  };

  const handleOpenDetails = async (alerta: AlertaPanico) => {
    setSelectedAlerta(alerta);
    setDetailsOpen(true);
    if (!alerta.read) {
      try { await marcarAlertaPanicoComoLeida(alerta.residencialID, alerta.id!); } catch {}
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Activa";
      case "resolved": return "Resuelta";
      case "in_progress": return "En proceso";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-red-100 text-red-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Fecha desconocida";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch {
      return "Fecha inválida";
    }
  };

  const formatFullDate = (timestamp: any) => {
    if (!timestamp) return "—";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, "dd/MM/yyyy hh:mm a", { locale: es });
    } catch {
      return "—";
    }
  };

  // --- Create notification ---
  const resetCreateForm = () => {
    setNewAlertaMensaje("");
    setTipoAlerta("notificacion");
    setDestinatariosTopic("todos");
    setIsProgramada(false);
    setFechaEnvio("");
    setHoraEnvio("09:00");
    setRecurrenciaEnvio("once");
    setDiaSemanaEnvio(1);
    setDiaMesEnvio(1);
  };

  const handleOpenCreateModal = () => {
    resetCreateForm();
    if (residencialFilter !== "todos") setNewAlertaResidencial(residencialFilter);
    setIsCreateDialogOpen(true);
  };

  /** Calcula la próxima fecha/hora programada según la recurrencia */
  const getNextScheduledDate = (): Date | null => {
    const [hour, minute] = horaEnvio.split(":").map(Number);
    const now = new Date();

    if (recurrenciaEnvio === "once") {
      if (!fechaEnvio) return null;
      const [y, m, d] = fechaEnvio.split("-").map(Number);
      return new Date(y, m - 1, d, hour, minute);
    }

    if (recurrenciaEnvio === "daily") {
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
      if (next <= now) next.setDate(next.getDate() + 1);
      return next;
    }

    if (recurrenciaEnvio === "weekly") {
      // diaSemanaEnvio: 0=Dom, 1=Lun, ..., 6=Sab
      let next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
      const currentDay = next.getDay();
      let daysToAdd = (diaSemanaEnvio - currentDay + 7) % 7;
      if (daysToAdd === 0 && next <= now) daysToAdd = 7;
      next.setDate(next.getDate() + daysToAdd);
      return next;
    }

    if (recurrenciaEnvio === "monthly") {
      let next = new Date(now.getFullYear(), now.getMonth(), 1, hour, minute);
      const lastDayThisMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(diaMesEnvio, lastDayThisMonth));
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
        const lastDayNext = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
        next.setDate(Math.min(diaMesEnvio, lastDayNext));
      }
      return next;
    }

    return null;
  };

  const crearNotificacion = async () => {
    const tipoLabel = tipoAlerta === "anuncio" ? "anuncio" : tipoAlerta === "evento" ? "evento" : tipoAlerta === "emergencia" ? "emergencia" : "notificacion";
    const targetResidencial = newAlertaResidencial || residencialFilter;

    if (!targetResidencial || targetResidencial === "todos") {
      toast.error("Selecciona un residencial");
      return;
    }
    if (!newAlertaMensaje.trim()) {
      toast.error("Escribe un mensaje");
      return;
    }
    if (isProgramada) {
      if (recurrenciaEnvio === "once" && !fechaEnvio) {
        toast.error("Selecciona fecha de envío");
        return;
      }
      const nextDate = getNextScheduledDate();
      if (!nextDate) {
        toast.error("Configuración de programación inválida");
        return;
      }
    }

    const toastId = toast.loading(isProgramada ? "Programando..." : "Enviando...");
    setIsCreateDialogOpen(false);

    try {
      const residencialDoc = await getDoc(doc(db, `residenciales/${targetResidencial}`));
      if (!residencialDoc.exists()) { toast.dismiss(toastId); toast.error("Residencial no encontrado"); return; }
      const residencialData = residencialDoc.data();
      const residencialNombre = residencialData.nombre || "Desconocido";
      const residencialCodigo = residencialData.residencialID || "";
      
      let titulo = "";
      switch (tipoAlerta) {
        case "anuncio": titulo = "Anuncio importante"; break;
        case "evento": titulo = "Evento programado"; break;
        case "emergencia": titulo = "Alerta de emergencia"; break;
        default: titulo = "Notificacion";
      }
      
      let fcmType = "";
      switch (tipoAlerta) {
        case "anuncio": fcmType = "announcement"; break;
        case "evento": fcmType = "event"; break;
        case "emergencia": fcmType = "emergency"; break;
        default: fcmType = "alert";
      }
      
      if (isProgramada) {
        const scheduledDate = getNextScheduledDate()!;

        await addDoc(collection(db, `residenciales/${targetResidencial}/notificacionesProgramadas`), {
          titulo,
          message: newAlertaMensaje,
          type: tipoAlerta,
          destinatarios: destinatariosTopic,
          scheduledAt: Timestamp.fromDate(scheduledDate),
          status: "pending",
          recurrence: recurrenciaEnvio,
          sendCount: 0,
          residencialID: residencialCodigo,
          residencialNombre,
          createdBy: user?.email || "admin",
          createdAt: Timestamp.now(),
          fcmType,
          topic: buildTopic(destinatariosTopic, residencialCodigo),
          _residencialDocId: targetResidencial,
        });

        toast.dismiss(toastId);
        toast.success("Notificacion programada exitosamente");
      } else {
      const nuevaNotificacion: Record<string, any> = {
        timestamp: Timestamp.fromDate(new Date()),
        status: "active",
          residencialID: residencialCodigo || targetResidencial,
        message: newAlertaMensaje,
        read: false,
        type: tipoAlerta,
          titulo,
        createdBy: "admin",
        userName: "Administrador",
          userEmail: user?.email || "admin@sistema.com",
        };

        const docRef = await addDoc(collection(db, `residenciales/${targetResidencial}/notificaciones`), nuevaNotificacion);

        // Save to user subcollections
        const usuariosQuery = query(collection(db, "usuarios"), where("residencialID", "==", targetResidencial));
        const usuariosSnap = await getDocs(usuariosQuery);
        const usuariosAfectados: any[] = [];
        usuariosSnap.forEach((d) => {
          const data = d.data();
          if (destinatariosTopic === "todos" ||
              (destinatariosTopic === "residentes" && data.role === "resident") ||
              (destinatariosTopic === "seguridad" && data.role === "security")) {
            usuariosAfectados.push({ id: d.id, ...data });
          }
        });

        await Promise.all(
          usuariosAfectados.map((u) =>
            addDoc(collection(db, `usuarios/${u.id}/notificaciones`), {
              ...nuevaNotificacion,
              notificationId: docRef.id,
            }).catch(() => null)
          )
        );

        // Send push via topic
        if (residencialCodigo) {
          try {
            const topic = buildTopic(destinatariosTopic, residencialCodigo);
            const fn = httpsCallable(functions, "handleTopicNotification");
            await fn({
              topic,
              notification: { title: titulo, body: newAlertaMensaje },
              data: { type: fcmType, priority: tipoAlerta === "emergencia" ? "high" : "normal", residentialId: residencialCodigo, residentialName: residencialNombre, message: newAlertaMensaje, notificationId: docRef.id },
            });
          } catch (e) {
            console.error("Error enviando push:", e);
          }
        }

        toast.dismiss(toastId);
        toast.success(`${tipoLabel.charAt(0).toUpperCase() + tipoLabel.slice(1)} enviada a "${residencialNombre}"`);
      }

      resetCreateForm();
        } catch (error) {
      console.error("Error:", error);
      toast.dismiss(toastId);
      toast.error("Error al crear la notificacion");
    }
  };

  const buildTopic = (dest: string, codigo: string) => {
    if (dest === "residentes") return `role_${codigo}_resident`;
    if (dest === "seguridad") return `role_${codigo}_security`;
    return `residential_${codigo}`;
  };

  // Edit sent notification
  const handleEditNotificacion = (alerta: AlertaPanico) => {
    setEditingAlerta(alerta);
    setEditMensaje(alerta.message || "");
    setEditTipoAlerta((alerta.tipo || alerta.type) === "anuncio" ? "anuncio" : "notificacion");
    setIsEditDialogOpen(true);
  };

  const guardarCambiosNotificacion = async () => {
    if (!editingAlerta?.id || !editingAlerta?.residencialID) { toast.error("Informacion incompleta"); return; }
    const toastId = toast.loading("Guardando...");
    try {
      await updateDoc(doc(db, `residenciales/${editingAlerta.residencialID}/notificaciones/${editingAlerta.id}`), {
        message: editMensaje,
        type: editTipoAlerta,
        tipo: editTipoAlerta,
      });
      toast.dismiss(toastId);
      toast.success("Notificacion actualizada");
      setIsEditDialogOpen(false);
    } catch {
      toast.dismiss(toastId);
      toast.error("Error al actualizar");
    }
  };

  const handleDeleteNotificacion = async (alerta: AlertaPanico) => {
    if (!alerta.id || !alerta.residencialID) { toast.error("ID no disponible"); return; }
    if (!confirm("Eliminar esta notificacion?")) return;
    const toastId = toast.loading("Eliminando...");
    try {
      await deleteDoc(doc(db, `residenciales/${alerta.residencialID}/notificaciones/${alerta.id}`));
      toast.dismiss(toastId);
      toast.success("Eliminada");
    } catch {
      toast.dismiss(toastId);
      toast.error("Error al eliminar");
    }
  };

  // Edit scheduled notification
  const handleEditProgramada = (item: NotificacionProgramada) => {
    setEditingProgramada(item);
    setEditProgramadaTitulo(item.titulo || "");
    setEditProgramadaMensaje(item.message || "");
    setEditProgramadaTipo(item.type || "notificacion");
    setEditProgramadaDestinatarios(item.destinatarios || "todos");
    setEditProgramadaRecurrence((item.recurrence as RecurrenciaNotificacion) || "once");
    try {
      const d = item.scheduledAt.toDate();
      setEditProgramadaFecha(format(d, "yyyy-MM-dd"));
      setEditProgramadaHora(format(d, "HH:mm"));
    } catch {
      setEditProgramadaFecha("");
      setEditProgramadaHora("09:00");
    }
    setIsEditProgramadaOpen(true);
  };

  const guardarCambiosProgramada = async () => {
    if (!editingProgramada) return;
    const resDocId = (editingProgramada as any)._residencialDocId || findResDocId(editingProgramada.residencialID);
    if (!resDocId) { toast.error("No se encontro el residencial"); return; }

    const [year, month, day] = editProgramadaFecha.split("-").map(Number);
    const [hour, minute] = editProgramadaHora.split(":").map(Number);
    const scheduledDate = new Date(year, month - 1, day, hour, minute);

    const toastId = toast.loading("Guardando...");
    try {
      const residencialCodigo = mapeoResidenciales[resDocId] || editingProgramada.residencialID;
      await actualizarNotificacionProgramada(resDocId, editingProgramada.id, {
        titulo: editProgramadaTitulo,
        message: editProgramadaMensaje,
        type: editProgramadaTipo,
        destinatarios: editProgramadaDestinatarios,
        scheduledAt: Timestamp.fromDate(scheduledDate),
        recurrence: editProgramadaRecurrence,
        topic: buildTopic(editProgramadaDestinatarios, residencialCodigo),
      } as any);
      toast.dismiss(toastId);
      toast.success("Notificacion programada actualizada");
      setIsEditProgramadaOpen(false);
    } catch {
      toast.dismiss(toastId);
      toast.error("Error al actualizar");
    }
  };

  const handleDeleteProgramada = async () => {
    if (!deleteProgramadaId || !deleteProgramadaResId) return;
    const resDocId = findResDocId(deleteProgramadaResId) || deleteProgramadaResId;
    const toastId = toast.loading("Eliminando...");
    try {
      await eliminarNotificacionProgramada(resDocId, deleteProgramadaId);
      toast.dismiss(toastId);
      toast.success("Notificacion programada eliminada");
    } catch {
      toast.dismiss(toastId);
      toast.error("Error al eliminar");
    }
    setDeleteProgramadaId(null);
    setDeleteProgramadaResId(null);
  };

  const findResDocId = (residencialID: string): string | null => {
    const found = Object.entries(mapeoResidenciales).find(([, code]) => code === residencialID);
    if (found) return found[0];
    if (residenciales.find((r) => r.id === residencialID)) return residencialID;
    return null;
  };

  // --- UI ---
  if (authLoading) {
    return (
      <div className="space-y-8 pb-20 p-2 sm:p-4">
        <Skeleton className="h-12 w-2/3 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-6" />
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userClaims?.isGlobalAdmin && !esAdminDeResidencial) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--navbar-height,4rem))] p-8">
        <Card className="w-full max-w-md text-center">
          <CardHeader><CardTitle>Acceso Denegado</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No tienes permisos para acceder a esta seccion.</p>
            <Button onClick={() => router.push("/dashboard")} className="mt-6">Volver al Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tipoIcon = (tipo: string) => {
    switch (tipo) {
      case "anuncio": return <Megaphone className="h-4 w-4 text-blue-500" />;
      case "evento": return <CalendarClock className="h-4 w-4 text-purple-500" />;
      case "emergencia": return <ShieldAlert className="h-4 w-4 text-red-500" />;
      default: return <Bell className="h-4 w-4 text-amber-500" />;
    }
  };

  const destLabel = (d: string) => {
    switch (d) {
      case "residentes": return "Residentes";
      case "seguridad": return "Seguridad";
      default: return "Todos";
    }
  };

  const recurrenceLabel = (r: RecurrenciaNotificacion | string) => {
    switch (r) {
      case "daily": return "Diaria";
      case "weekly": return "Semanal";
      case "monthly": return "Mensual";
      default: return "Una vez";
    }
  };

  return (
    <div className="space-y-8 pb-20 p-2 sm:p-4">
      {/* Premium Header */}
      <div className="flex flex-col xl:flex-row justify-between gap-6 items-start">
        <div className="space-y-2 max-w-2xl">
          <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-red-100 font-bold px-3 py-1 rounded-full shadow-sm mb-2 w-fit">
            <ShieldAlert className="w-3 h-3 mr-1" />
            Centro de Alertas
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Alertas y{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">
              Notificaciones
                </span>
          </h1>
          <p className="text-slate-500 font-medium text-lg leading-relaxed">
            Gestiona alertas de emergencia, envia notificaciones y programa comunicaciones para tu comunidad.
          </p>
        </div>
        
        <Button onClick={handleOpenCreateModal} size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/20 text-white rounded-full px-6">
          <PlusCircle className="h-5 w-5 mr-2" />
          Nueva notificacion
        </Button>
      </div>
      
      {/* Filters Card */}
      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold">Filtros</CardTitle>
          <CardDescription>{filteredAlertas.length} {activeTab === "alertas" ? "alertas" : "notificaciones"} encontradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-64">
              <Select
                value={residencialFilter}
                onValueChange={(v) => { if (!esAdminDeResidencial) setResidencialFilter(v); }}
                disabled={esAdminDeResidencial && !!residencialIdDocDelAdmin}
              >
                <SelectTrigger><SelectValue placeholder="Residencial" /></SelectTrigger>
                <SelectContent>
                  {userClaims?.isGlobalAdmin && <SelectItem value="todos">Todos los residenciales</SelectItem>}
                  {residenciales
                    .filter((r) => r.id && (!esAdminDeResidencial || r.id === residencialIdDocDelAdmin))
                    .map((r) => (
                      <SelectItem key={r.id} value={r.id!}>{r.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="resolved">Resueltas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                placeholder="Buscar por nombre o mensaje..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <TabsList className="bg-slate-100/60 p-1.5 h-auto rounded-full inline-flex border border-slate-200/60 backdrop-blur-sm">
            <TabsTrigger value="alertas" className="rounded-full px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-red-600 transition-all duration-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-semibold">Alertas de Panico</span>
                <Badge variant="secondary" className="ml-1 text-xs">{alertas.filter((a) => (a.tipo || a.type) === "panic_alert").length}</Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger value="notificaciones" className="rounded-full px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-amber-600 transition-all duration-300">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="font-semibold">Notificaciones</span>
                <Badge variant="secondary" className="ml-1 text-xs">{alertas.filter((a) => (a.tipo || a.type) !== "panic_alert").length}</Badge>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Alertas Tab */}
        <TabsContent value="alertas">
      <Card>
            <CardHeader>
              <CardTitle>Alertas de Panico</CardTitle>
              <CardDescription>Alertas de emergencia reportadas por usuarios</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead className="w-[130px]">Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Residencial</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filteredAlertas.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No se encontraron alertas</TableCell>
                  </TableRow>
                ) : (
                    filteredAlertas.map((alerta) => (
                      <TableRow key={alerta.id}>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(alerta.status || "active")}>
                            {getStatusLabel(alerta.status || "active")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(alerta.timestamp)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{alerta.userName || "Desconocido"}</div>
                          {alerta.userEmail && <div className="text-xs text-muted-foreground">{alerta.userEmail}</div>}
                        </TableCell>
                        <TableCell>{alerta._residencialNombre || "—"}</TableCell>
                        <TableCell className="text-right space-x-1">
                          {alertasActualizando[alerta.id || ""] ? (
                            <Loader2 className="h-4 w-4 animate-spin inline" />
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleOpenDetails(alerta)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {alerta.status === "active" && alerta.id && (
                                <Button variant="ghost" size="sm" className="text-yellow-600" onClick={() => handleStatusChange(alerta.id, alerta.residencialID, "in_progress")}>
                                  <Clock className="h-4 w-4" />
                                </Button>
                              )}
                              {(alerta.status === "active" || alerta.status === "in_progress") && alerta.id && (
                                <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleStatusChange(alerta.id, alerta.residencialID, "resolved")}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificaciones Tab */}
        <TabsContent value="notificaciones">
          <Tabs value={notifSubTab} onValueChange={setNotifSubTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="enviadas">
                <Send className="h-4 w-4 mr-1.5" />
                Enviadas
              </TabsTrigger>
              <TabsTrigger value="programadas">
                <CalendarClock className="h-4 w-4 mr-1.5" />
                Programadas
                {notificacionesProgramadas.filter((n) => n.status === "pending").length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs">
                    {notificacionesProgramadas.filter((n) => n.status === "pending").length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="enviadas">
              <Card>
                <CardHeader>
                  <CardTitle>Notificaciones Enviadas</CardTitle>
                  <CardDescription>Historial de notificaciones y anuncios</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Mensaje</TableHead>
                        <TableHead>Residencial</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                        </TableCell>
                        </TableRow>
                      ) : filteredAlertas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No hay notificaciones</TableCell>
                        </TableRow>
                      ) : (
                        filteredAlertas.map((alerta) => (
                          <TableRow key={alerta.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {tipoIcon(alerta.tipo || alerta.type || "notificacion")}
                                <span className="text-sm font-medium capitalize">{alerta.tipo || alerta.type || "Notificacion"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(alerta.timestamp)}</TableCell>
                            <TableCell className="max-w-xs truncate text-sm">{alerta.message || "—"}</TableCell>
                            <TableCell>{alerta._residencialNombre || "—"}</TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="ghost" size="sm" onClick={() => handleOpenDetails(alerta)}>
                                <Eye className="h-4 w-4" />
                                  </Button>
                              <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => handleEditNotificacion(alerta)}>
                                <Pencil className="h-4 w-4" />
                                    </Button>
                              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteNotificacion(alerta)}>
                                <Trash2 className="h-4 w-4" />
                                    </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="programadas">
              <Card>
                <CardHeader>
                  <CardTitle>Notificaciones Programadas</CardTitle>
                  <CardDescription>Pendientes de envío automático. Las recurrentes (diaria, semanal, mensual) se reprograman solas después de cada envío.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Título / Mensaje</TableHead>
                        <TableHead>Próxima ejecución</TableHead>
                        <TableHead>Recurrencia</TableHead>
                        <TableHead>Destinatarios</TableHead>
                        <TableHead>Envíos / Último</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Residencial</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notificacionesProgramadas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                            No hay notificaciones programadas
                          </TableCell>
                        </TableRow>
                      ) : (
                        notificacionesProgramadas.map((item) => (
                          <TableRow key={item.id} className={item.status === "sent" ? "opacity-60" : ""}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {tipoIcon(item.type)}
                                <span className="text-sm font-medium capitalize">{item.type || "Notificacion"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-sm">{item.titulo || "—"}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">{item.message}</div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <span className="text-sm font-medium">{formatFullDate(item.scheduledAt)}</span>
                                {(item.recurrence && item.recurrence !== "once") && (
                                  <p className="text-xs text-muted-foreground mt-0.5">Se repite automáticamente</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{recurrenceLabel(item.recurrence || "once")}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{destLabel(item.destinatarios)}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium">{(item.sendCount ?? 0)} envíos</span>
                                {(item.sendCount ?? 0) > 0 && item.lastSentAt && (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                                        <History className="h-3.5 w-3.5" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-72 p-3" align="start">
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Historial de envíos</p>
                                      <p className="text-xs text-muted-foreground mb-2">Último: {formatFullDate(item.lastSentAt)}</p>
                                      <ul className="max-h-40 overflow-y-auto space-y-1 text-xs">
                                        {(item.sendHistory || []).slice().reverse().map((h, i) => (
                                          <li key={i} className="text-muted-foreground">{formatFullDate(h.sentAt)}</li>
                                        ))}
                                      </ul>
                                    </PopoverContent>
                                  </Popover>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.status === "pending" && (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pendiente</Badge>
                              )}
                              {item.status === "sent" && (
                                <Badge className="bg-green-100 text-green-800 border-green-200">Enviada</Badge>
                              )}
                              {item.status === "failed" && (
                                <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{item.residencialNombre || "—"}</TableCell>
                            <TableCell className="text-right space-x-1">
                              {item.status === "pending" && (
                                <>
                                  <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => handleEditProgramada(item)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600"
                                    onClick={() => {
                                      setDeleteProgramadaId(item.id);
                                      setDeleteProgramadaResId((item as any)._residencialDocId || item.residencialID);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                        ))
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
      
      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles</DialogTitle>
            <DialogDescription>Informacion detallada</DialogDescription>
          </DialogHeader>
          {selectedAlerta && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant="outline" className={getStatusColor(selectedAlerta.status || "active")}>
                    {getStatusLabel(selectedAlerta.status || "active")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{formatDate(selectedAlerta.timestamp)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuario</p>
                {(selectedAlerta.tipo || selectedAlerta.type) === "panic_alert" ? (
                  <>
                    <p className="font-medium">{selectedAlerta.userName || "Desconocido"}</p>
                    {selectedAlerta.userEmail && <p className="text-sm text-muted-foreground">{selectedAlerta.userEmail}</p>}
                    {selectedAlerta.userPhone && <p className="text-sm text-muted-foreground">{selectedAlerta.userPhone}</p>}
                  </>
                ) : (
                  <p className="font-medium">Administrador</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Residencial</p>
                <p className="font-medium">{selectedAlerta._residencialNombre || "Desconocido"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mensaje</p>
                <p className="font-medium">{selectedAlerta.message || "Sin mensaje"}</p>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            {selectedAlerta?.status === "active" && (
              <Button variant="outline" className="border-yellow-600 text-yellow-600" onClick={() => { setDetailsOpen(false); handleStatusChange(selectedAlerta.id, selectedAlerta.residencialID, "in_progress"); }}>
                  En Progreso
                </Button>
              )}
            {selectedAlerta && (selectedAlerta.status === "active" || selectedAlerta.status === "in_progress") && (
              <Button variant="outline" className="border-green-600 text-green-600" onClick={() => { setDetailsOpen(false); handleStatusChange(selectedAlerta.id, selectedAlerta.residencialID, "resolved"); }}>
                  Resolver
                </Button>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Notification Dialog - Layout horizontal en pantallas grandes */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(o) => { if (!o) resetCreateForm(); setIsCreateDialogOpen(o); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl">Nueva notificación</DialogTitle>
            <DialogDescription>Configura destino, contenido y cuándo enviar.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna izquierda: Pasos 1 y 2 */}
            <div className="space-y-4">
              {/* Paso 1: Destinatarios */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
                  <h3 className="text-sm font-semibold text-slate-800">¿A quién?</h3>
                </div>
                <div className="rounded-lg border bg-slate-50/50 p-3 space-y-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Residencial</label>
                    <Select
                      value={newAlertaResidencial || residencialFilter}
                      onValueChange={(v) => { if (!esAdminDeResidencial) { setNewAlertaResidencial(v); setResidencialFilter(v); } }}
                      disabled={esAdminDeResidencial && !!residencialIdDocDelAdmin}
                    >
                      <SelectTrigger className="bg-white h-9"><SelectValue placeholder="Seleccionar residencial" /></SelectTrigger>
                      <SelectContent>
                        {residenciales.filter((r) => r.id && (!esAdminDeResidencial || r.id === residencialIdDocDelAdmin)).map((r) => (
                          <SelectItem key={r.id} value={r.id!}>{r.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Destinatarios</label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { val: "todos", label: "Todos", icon: "👥" },
                        { val: "residentes", label: "Residentes", icon: "🏠" },
                        { val: "seguridad", label: "Seguridad", icon: "👮" },
                      ].map((d) => (
                        <button
                          key={d.val}
                          type="button"
                          className={`cursor-pointer border-2 rounded-lg px-3 py-2 flex items-center gap-1.5 transition-all ${
                            destinatariosTopic === d.val ? "border-blue-500 bg-blue-50 shadow-sm" : "border-transparent bg-white hover:border-slate-300"
                          }`}
                          onClick={() => setDestinatariosTopic(d.val)}
                        >
                          <span>{d.icon}</span>
                          <span className="text-sm font-medium">{d.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Paso 2: Contenido */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
                  <h3 className="text-sm font-semibold text-slate-800">¿Qué enviar?</h3>
                </div>
                <div className="rounded-lg border bg-slate-50/50 p-3 space-y-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Tipo</label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { val: "anuncio", label: "Anuncio", icon: "📢" },
                        { val: "notificacion", label: "Notificación", icon: "🔔" },
                        { val: "evento", label: "Evento", icon: "📅" },
                        { val: "emergencia", label: "Emergencia", icon: "⚠️" },
                      ].map((t) => (
                        <button
                          key={t.val}
                          type="button"
                          className={`cursor-pointer border-2 rounded-lg px-2.5 py-2 flex items-center gap-1.5 transition-all ${
                            tipoAlerta === t.val ? "border-blue-500 bg-blue-50 shadow-sm" : "border-transparent bg-white hover:border-slate-300"
                          }`}
                          onClick={() => setTipoAlerta(t.val)}
                        >
                          <span className="text-base">{t.icon}</span>
                          <span className="text-xs font-medium">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Mensaje</label>
                    <Textarea
                      value={newAlertaMensaje}
                      onChange={(e) => setNewAlertaMensaje(e.target.value)}
                      placeholder="Escribe tu mensaje aquí..."
                      className="min-h-[80px] bg-white resize-none text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-0.5">{newAlertaMensaje.length} caracteres</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha: Paso 3 Cuándo */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</span>
                <h3 className="text-sm font-semibold text-slate-800">¿Cuándo enviar?</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center transition-all ${
                    !isProgramada ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  onClick={() => setIsProgramada(false)}
                >
                  <Send className="h-6 w-6 mb-1.5 text-blue-600" />
                  <span className="font-semibold text-sm">Enviar ahora</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Inmediato</span>
                </button>
                <button
                  type="button"
                  className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center transition-all ${
                    isProgramada ? "border-amber-500 bg-amber-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  onClick={() => setIsProgramada(true)}
                >
                  <CalendarClock className="h-6 w-6 mb-1.5 text-amber-600" />
                  <span className="font-semibold text-sm">Programar</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Fecha/hora o recurrencia</span>
                </button>
              </div>

              {isProgramada && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Recurrencia</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { val: "once" as const, label: "Una vez", icon: "1" },
                        { val: "daily" as const, label: "Diaria", icon: "📅" },
                        { val: "weekly" as const, label: "Semanal", icon: "📆" },
                        { val: "monthly" as const, label: "Mensual", icon: "🗓️" },
                      ].map((r) => (
                        <button
                          key={r.val}
                          type="button"
                          className={`cursor-pointer border-2 rounded-lg p-2.5 flex flex-col items-center transition-all ${
                            recurrenciaEnvio === r.val ? "border-amber-500 bg-amber-100" : "border-transparent bg-white hover:border-amber-200"
                          }`}
                          onClick={() => setRecurrenciaEnvio(r.val)}
                        >
                          <span className="text-lg mb-0.5">{r.icon}</span>
                          <span className="text-xs font-medium">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Campos según recurrencia: una vez = fecha + hora; diaria = solo hora; semanal = día + hora; mensual = día del mes + hora */}
                  {recurrenciaEnvio === "once" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Fecha</label>
                        <Input type="date" value={fechaEnvio} onChange={(e) => setFechaEnvio(e.target.value)} className="bg-white" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Hora</label>
                        <Input type="time" value={horaEnvio} onChange={(e) => setHoraEnvio(e.target.value)} className="bg-white" />
                      </div>
                    </div>
                  )}
                  {recurrenciaEnvio === "daily" && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Hora (todos los días)</label>
                      <Input type="time" value={horaEnvio} onChange={(e) => setHoraEnvio(e.target.value)} className="bg-white max-w-[140px]" />
                      <p className="text-xs text-muted-foreground mt-1">Se enviará todos los días a esta hora.</p>
                    </div>
                  )}
                  {recurrenciaEnvio === "weekly" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Día de la semana</label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { val: 0, label: "Dom" },
                            { val: 1, label: "Lun" },
                            { val: 2, label: "Mar" },
                            { val: 3, label: "Mié" },
                            { val: 4, label: "Jue" },
                            { val: 5, label: "Vie" },
                            { val: 6, label: "Sáb" },
                          ].map((d) => (
                            <button
                              key={d.val}
                              type="button"
                              className={`cursor-pointer border-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all ${
                                diaSemanaEnvio === d.val ? "border-amber-500 bg-amber-100" : "border-transparent bg-white hover:border-amber-200"
                              }`}
                              onClick={() => setDiaSemanaEnvio(d.val)}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Hora</label>
                        <Input type="time" value={horaEnvio} onChange={(e) => setHoraEnvio(e.target.value)} className="bg-white max-w-[140px]" />
                      </div>
                    </div>
                  )}
                  {recurrenciaEnvio === "monthly" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Día del mes (1-28)</label>
                        <Select value={String(diaMesEnvio)} onValueChange={(v) => setDiaMesEnvio(Number(v))}>
                          <SelectTrigger className="bg-white max-w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                              <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">Meses con menos de 28 días usarán el último día.</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">Hora</label>
                        <Input type="time" value={horaEnvio} onChange={(e) => setHoraEnvio(e.target.value)} className="bg-white max-w-[140px]" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>
            
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                  <Button 
              onClick={crearNotificacion}
              disabled={!newAlertaMensaje.trim() || (!newAlertaResidencial && residencialFilter === "todos") || (isProgramada && recurrenciaEnvio === "once" && !fechaEnvio)}
              className={isProgramada ? "bg-amber-600 hover:bg-amber-700" : ""}
            >
              {isProgramada ? (
                <>
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Programar envío
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar ahora
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Sent Notification Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Notificacion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Tipo</label>
              <Select value={editTipoAlerta} onValueChange={setEditTipoAlerta}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="notificacion">Notificacion</SelectItem>
                  <SelectItem value="anuncio">Anuncio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Mensaje</label>
              <Textarea value={editMensaje} onChange={(e) => setEditMensaje(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button disabled={!editMensaje.trim()} onClick={guardarCambiosNotificacion}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Scheduled Notification Dialog */}
      <Dialog open={isEditProgramadaOpen} onOpenChange={setIsEditProgramadaOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Notificacion Programada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Titulo</label>
              <Input value={editProgramadaTitulo} onChange={(e) => setEditProgramadaTitulo(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Mensaje</label>
              <Textarea value={editProgramadaMensaje} onChange={(e) => setEditProgramadaMensaje(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tipo</label>
              <Select value={editProgramadaTipo} onValueChange={setEditProgramadaTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="notificacion">Notificacion</SelectItem>
                  <SelectItem value="anuncio">Anuncio</SelectItem>
                  <SelectItem value="evento">Evento</SelectItem>
                  <SelectItem value="emergencia">Emergencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Destinatarios</label>
              <Select value={editProgramadaDestinatarios} onValueChange={setEditProgramadaDestinatarios}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="residentes">Residentes</SelectItem>
                  <SelectItem value="seguridad">Seguridad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Recurrencia</label>
              <Select value={editProgramadaRecurrence} onValueChange={(v) => setEditProgramadaRecurrence(v as RecurrenciaNotificacion)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Una vez</SelectItem>
                  <SelectItem value="daily">Diaria</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Fecha</label>
                <Input type="date" value={editProgramadaFecha} onChange={(e) => setEditProgramadaFecha(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Hora</label>
                <Input type="time" value={editProgramadaHora} onChange={(e) => setEditProgramadaHora(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProgramadaOpen(false)}>Cancelar</Button>
            <Button disabled={!editProgramadaMensaje.trim() || !editProgramadaFecha} onClick={guardarCambiosProgramada}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Scheduled Confirmation */}
      <AlertDialog open={!!deleteProgramadaId} onOpenChange={(o) => { if (!o) { setDeleteProgramadaId(null); setDeleteProgramadaResId(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar notificacion programada</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. La notificacion no sera enviada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProgramada} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 
