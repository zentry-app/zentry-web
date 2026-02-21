"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getResidenciales,
  getAreasComunes,
  crearAreaComun,
  actualizarAreaComun,
  eliminarAreaComun,
  suscribirseAAreasComunes,
  Residencial,
  AreaComun as FirebaseAreaComun
} from "@/lib/firebase/firestore";
import {
  Search,
  Plus,
  Users,
  Building,
  Palmtree,
  Filter,
  RefreshCw,
  Home,
  CheckCircle,
  XCircle,
  Clock,
  Zap
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth, UserClaims } from "@/contexts/AuthContext";
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

// Importar dinámicamente AreaComunFormDialogContent
const AreaComunFormDialogContent = dynamic(() => import('@/components/dashboard/areas-comunes/AreaComunFormDialogContent'), {
  suspense: true,
});

// Importar dinámicamente ConfirmarEliminarAreaComunDialogContent
const ConfirmarEliminarAreaComunDialogContent = dynamic(() => import('@/components/dashboard/areas-comunes/ConfirmarEliminarAreaComunDialogContent'), {
  suspense: true,
});

// Importar TablaAreasComunes
import TablaAreasComunes from "@/components/dashboard/areas-comunes/TablaAreasComunes";

interface AreaComun extends FirebaseAreaComun {
  _residencialIdDoc?: string;
}

interface Reglamento {
  maxHorasPorReserva: number;
  maxReservasPorDia: number;
  maxReservasPorSemana: number;
  maxReservasPorMes: number;
  antelacionMinima: number; // horas
  antelacionMaxima: number; // días
  cancelacionMinima: number; // horas antes
  permiteInvitados: boolean;
  maxInvitados: number; // Número total de personas por casa (residente + invitados)
  requiereAprobacion: boolean;
  permiteReservasSimultaneas: boolean; // Permite que múltiples casas reserven al mismo tiempo
  maxCasasSimultaneas: number; // Máximo número de casas que pueden reservar simultáneamente
  diasDeshabilitados: string[]; // Fechas específicas deshabilitadas en formato YYYY-MM-DD
  diasSemanaDeshabilitados: string[]; // Días de la semana deshabilitados permanentemente
  diasDesactivadosEspecificos: string[]; // Nuevos días desactivados específicos
  // 🆕 NUEVAS PROPIEDADES PARA CONTROL DE RESERVAS
  tipoReservas: 'bloques' | 'traslapes' | 'horarios_fijos' | 'hibrida'; // Tipo de reservas: por bloques fijos o con traslapes
  permiteTraslapes: boolean; // Permite que las reservas se superpongan en tiempo
  // 🆕 PROPIEDADES PARA RESERVAS HÍBRIDAS (Gratuita + Pago)
  maxHorasGratuitas?: number; // Máximo horas para reservas gratuitas (default: 3)
  maxHorasPago?: number; // Máximo horas para reservas de pago (default: 5)
  maxPersonasGratuitas?: number; // Máximo personas para reservas gratuitas (default: 6)
  maxPersonasPago?: number; // Máximo personas para reservas de pago (default: 50)
  antelacionMinimaPago?: number; // Antelación mínima en días para reservas de pago (default: 7)
  antelacionMinimaGratuita?: number; // Antelación mínima en días para reservas gratuitas (default: 0)
  permiteReservasPagoSimultaneas?: boolean; // Permite múltiples reservas de pago por día
  maxReservasPagoPorDia?: number; // Máximo reservas de pago por día (default: 1)
  ventanaHorarioPago?: {
    inicio: string; // formato "HH:MM"
    fin: string;   // formato "HH:MM"
  };
  // 🆕 NUEVA PROPIEDAD PARA HORARIOS FIJOS POR DÍA
  ventanasHorariosFijos?: {
    dia: string; // día de la semana
    ventanas: {
      nombre: string;
      inicio: string; // formato "HH:MM"
      fin: string;   // formato "HH:MM"
      duracionMaxima: number; // horas máximas por reserva
    }[];
  }[];
  intervalosDisponibles?: number; // minutos entre reservas
  // 🆕 NUEVA PROPIEDAD PARA HORAS DESHABILITADAS EN DÍAS ESPECÍFICOS
  horasDeshabilitadas: {
    [diaSemana: string]: {
      inicio: string; // formato "HH:MM"
      fin: string;   // formato "HH:MM"
      motivo?: string; // motivo opcional de la deshabilitación
    }[];
  };

  horarios: {
    entreSemana: {
      apertura: string;
      cierre: string;
    };
    finDeSemana: {
      apertura: string;
      cierre: string;
    };
    diasDisponibles: string[];
    individuales?: {
      [dia: string]: {
        apertura: string;
        cierre: string;
      };
    };
  };
}

interface AreaComunFormData {
  nombre: string;
  descripcion: string;
  capacidad: number;
  esDePago: boolean;
  precio?: number;
  requiereDeposito?: boolean;
  deposito?: number;
  activa: boolean;
  reglamento: Reglamento;
}

export default function AreasComunesPage() {
  const router = useRouter();
  const { user, userClaims, loading: authLoading } = useAuth();

  const [areasComunes, setAreasComunes] = useState<AreaComun[]>([]);
  const [residenciales, setResidenciales] = useState<Residencial[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [residencialFilter, setResidencialFilter] = useState<string>("todos");
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [currentArea, setCurrentArea] = useState<AreaComun | null>(null);
  const [selectedResidencialId, setSelectedResidencialId] = useState<string>("");
  const [formData, setFormData] = useState<AreaComunFormData>({
    nombre: "",
    descripcion: "",
    capacidad: 50,
    esDePago: false,
    precio: 0,
    requiereDeposito: false,
    deposito: 0,
    activa: true,
    reglamento: {
      maxHorasPorReserva: 4,
      maxReservasPorDia: 1,
      maxReservasPorSemana: 3,
      maxReservasPorMes: 10,
      antelacionMinima: 24,
      antelacionMaxima: 30,
      cancelacionMinima: 2,
      permiteInvitados: true,
      maxInvitados: 6,
      requiereAprobacion: false,
      permiteReservasSimultaneas: false,
      maxCasasSimultaneas: 1,
      diasDeshabilitados: [],
      diasSemanaDeshabilitados: [],
      diasDesactivadosEspecificos: [],
      // 🆕 NUEVAS PROPIEDADES PARA CONTROL DE RESERVAS
      tipoReservas: 'bloques' as const,
      permiteTraslapes: false,
      // 🆕 NUEVA PROPIEDAD PARA HORARIOS FIJOS
      ventanasHorariosFijos: [],
      intervalosDisponibles: 30,
      // 🆕 NUEVA PROPIEDAD PARA HORAS DESHABILITADAS
      horasDeshabilitadas: {},
      horarios: {
        entreSemana: {
          apertura: "08:00",
          cierre: "22:00"
        },
        finDeSemana: {
          apertura: "09:00",
          cierre: "23:00"
        },
        diasDisponibles: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
      }
    }
  });
  const [mapeoResidenciales, setMapeoResidenciales] = useState<{ [key: string]: string }>({});

  const esAdminDeResidencial = useMemo(() => (
    !!userClaims && userClaims.role === 'admin' && !userClaims.isGlobalAdmin &&
    ((userClaims as any).managedResidencials?.length > 0 || !!(userClaims as any).residencialId)
  ), [userClaims]);
  const residencialCodigoDelAdmin = useMemo(() => {
    if (!esAdminDeResidencial) return null;
    return (userClaims as any)?.managedResidencials?.[0] || (userClaims as any)?.residencialId || null;
  }, [esAdminDeResidencial, userClaims]);

  const convertirHora = useCallback((hora24: string): string => {
    const [hour, minute] = hora24.split(':');
    const hora = parseInt(hour);
    if (hora === 0) return `12:${minute} AM`;
    if (hora === 12) return `12:${minute} PM`;
    if (hora > 12) return `${hora - 12}:${minute} PM`;
    return `${hora}:${minute} AM`;
  }, []);

  const cargarTodosLosResidenciales = useCallback(async () => {
    try {
      const residencialesData = await getResidenciales();
      setResidenciales(residencialesData);
      const mapeo: { [key: string]: string } = {};
      residencialesData.forEach(r => {
        if (r.id && r.residencialID) {
          mapeo[r.id] = r.residencialID;
        }
      });
      setMapeoResidenciales(mapeo);
      return residencialesData;
    } catch (error) {
      console.error("Error al cargar todos los residenciales:", error);
      toast.error("Error al cargar lista de residenciales");
      return [];
    }
  }, []);

  const cargarAreasDeResidencial = useCallback(async (idDocResidencial: string): Promise<AreaComun[]> => {
    if (!idDocResidencial) return [];
    try {
      const areas = await getAreasComunes(idDocResidencial);
      return areas.map(area => ({ ...area, _residencialIdDoc: idDocResidencial }));
    } catch (error) {
      console.error(`Error al cargar áreas para ${idDocResidencial}:`, error);
      toast.error(`Error al cargar áreas de un residencial`);
      return [];
    }
  }, []);

  const cargarAreasDeTodosLosResidenciales = useCallback(async (listaResidenciales: Residencial[]): Promise<AreaComun[]> => {
    const todasLasAreasPromises = listaResidenciales
      .filter(r => r.id)
      .map(r => cargarAreasDeResidencial(r.id!));
    const arraysDeAreas = await Promise.all(todasLasAreasPromises);
    return arraysDeAreas.flat();
  }, [cargarAreasDeResidencial]);

  useEffect(() => {
    const cargarDatosAreas = async () => {
      if (authLoading || !userClaims) {
        setAreasComunes([]);
        setLoadingData(userClaims === undefined);
        return;
      }
      setLoadingData(true);

      const todosLosResidenciales = await cargarTodosLosResidenciales();

      if (esAdminDeResidencial && residencialCodigoDelAdmin) {
        const idDocResidencialAdmin = Object.keys(mapeoResidenciales).find(
          key => mapeoResidenciales[key] === residencialCodigoDelAdmin
        );
        if (idDocResidencialAdmin) {
          if (residencialFilter !== idDocResidencialAdmin) setResidencialFilter(idDocResidencialAdmin);
          if (selectedResidencialId !== idDocResidencialAdmin) setSelectedResidencialId(idDocResidencialAdmin);

          const areas = await cargarAreasDeResidencial(idDocResidencialAdmin);
          setAreasComunes(areas);
        } else {
          console.warn("Admin de residencial pero no se encontró su ID de documento para cargar áreas:", residencialCodigoDelAdmin);
          setAreasComunes([]);
        }
      } else if (userClaims.isGlobalAdmin) {
        if (residencialFilter === "todos") {
          const areas = await cargarAreasDeTodosLosResidenciales(todosLosResidenciales);
          setAreasComunes(areas);
        } else {
          const areas = await cargarAreasDeResidencial(residencialFilter);
          setAreasComunes(areas);
          if (selectedResidencialId !== residencialFilter) setSelectedResidencialId(residencialFilter);
        }
      } else {
        setAreasComunes([]);
        toast.error("No tienes permisos para ver esta sección.");
      }
      setLoadingData(false);
    };

    cargarDatosAreas();
  }, [
    authLoading,
    userClaims,
    residencialFilter,
    esAdminDeResidencial,
    residencialCodigoDelAdmin,
    cargarTodosLosResidenciales,
    cargarAreasDeResidencial,
    cargarAreasDeTodosLosResidenciales,
    mapeoResidenciales
  ]);

  const currentResIdForSubscriptionMemoized = useMemo(() => {
    if (esAdminDeResidencial && residencialCodigoDelAdmin) {
      return Object.keys(mapeoResidenciales).find(
        key => mapeoResidenciales[key] === residencialCodigoDelAdmin
      ) || null;
    } else if (userClaims?.isGlobalAdmin && residencialFilter !== "todos") {
      return residencialFilter;
    }
    return null;
  }, [esAdminDeResidencial, residencialCodigoDelAdmin, mapeoResidenciales, userClaims?.isGlobalAdmin, residencialFilter]);

  useEffect(() => {
    if (authLoading || !userClaims) return;

    let unsubscribe: (() => void) | null = null;
    const idParaSuscribir = currentResIdForSubscriptionMemoized;

    if (idParaSuscribir) {
      unsubscribe = suscribirseAAreasComunes(idParaSuscribir, (areasActualizadas) => {
        // Solo actualizar si no estamos en medio de una operación manual
        if (!loadingSubmit && !loadingDelete) {
          setAreasComunes(areasActualizadas.map(area => ({ ...area, _residencialIdDoc: idParaSuscribir })));
        }
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [authLoading, userClaims, currentResIdForSubscriptionMemoized, loadingSubmit, loadingDelete]);

  const handleOpenDialog = useCallback((area?: AreaComun) => {
    if (area) {
      setCurrentArea(area);
      setSelectedResidencialId(area._residencialIdDoc || "");

      // Migrar estructura antigua de ventanas a nueva estructura por día
      let ventanasMigradas: any[] = [];
      if (area.reglamento?.ventanasHorariosFijos) {
        // Si tiene la estructura antigua, migrar a la nueva
        const ventanasAntiguas = area.reglamento.ventanasHorariosFijos;
        if (ventanasAntiguas.length > 0 && !ventanasAntiguas[0].dia) {
          // Es estructura antigua, migrar
          const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
          ventanasMigradas = diasSemana.map(dia => ({
            dia,
            ventanas: ventanasAntiguas
          }));
        } else {
          // Ya es estructura nueva
          ventanasMigradas = ventanasAntiguas;
        }
      }

      setFormData({
        nombre: area.nombre,
        descripcion: area.descripcion,
        capacidad: area.capacidad,
        esDePago: area.esDePago || false,
        precio: area.precio || 0,
        requiereDeposito: area.requiereDeposito || false,
        deposito: area.deposito || 0,
        activa: area.activa || true,
        reglamento: {
          // Valores por defecto
          maxHorasPorReserva: 4,
          maxReservasPorDia: 1,
          maxReservasPorSemana: 3,
          maxReservasPorMes: 10,
          antelacionMinima: 24,
          antelacionMaxima: 30,
          cancelacionMinima: 2,
          permiteInvitados: true,
          maxInvitados: 6,
          requiereAprobacion: false,
          permiteReservasSimultaneas: false,
          maxCasasSimultaneas: 1,
          diasDeshabilitados: [],
          diasSemanaDeshabilitados: [],
          diasDesactivadosEspecificos: [],
          tipoReservas: 'bloques' as const,
          permiteTraslapes: false,
          intervalosDisponibles: 30,
          horasDeshabilitadas: {},
          horarios: {
            entreSemana: {
              apertura: "08:00",
              cierre: "22:00"
            },
            finDeSemana: {
              apertura: "09:00",
              cierre: "23:00"
            },
            diasDisponibles: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
          },
          // Sobrescribir con los valores existentes
          ...area.reglamento,
          // Asegurar que las ventanas migradas tengan prioridad
          ventanasHorariosFijos: ventanasMigradas
        }
      });
    } else {
      setCurrentArea(null);
      setFormData({
        nombre: "",
        descripcion: "",
        capacidad: 0,
        esDePago: false,
        precio: 0,
        activa: true,
        reglamento: {
          maxHorasPorReserva: 4,
          maxReservasPorDia: 1,
          maxReservasPorSemana: 3,
          maxReservasPorMes: 10,
          antelacionMinima: 24,
          antelacionMaxima: 30,
          cancelacionMinima: 2,
          permiteInvitados: true,
          maxInvitados: 6,
          requiereAprobacion: false,
          permiteReservasSimultaneas: false,
          maxCasasSimultaneas: 1,
          diasDeshabilitados: [],
          diasSemanaDeshabilitados: [],
          diasDesactivadosEspecificos: [],
          // 🆕 NUEVAS PROPIEDADES PARA CONTROL DE RESERVAS
          tipoReservas: 'bloques' as const,
          permiteTraslapes: false,
          ventanasHorariosFijos: [], // Nueva estructura: array vacío por defecto
          intervalosDisponibles: 30,
          horasDeshabilitadas: {},
          horarios: {
            entreSemana: {
              apertura: "08:00",
              cierre: "22:00"
            },
            finDeSemana: {
              apertura: "09:00",
              cierre: "23:00"
            },
            diasDisponibles: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]
          }
        }
      });
    }
    setOpenDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback((area: AreaComun) => {
    setCurrentArea(area);
    setSelectedResidencialId(area._residencialIdDoc || "");
    setDeleteConfirmOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!currentArea || !currentArea.id || !selectedResidencialId) {
      toast.error("No se pudo determinar el área o el residencial para eliminar.");
      return;
    }
    setLoadingDelete(true);
    try {
      await eliminarAreaComun(selectedResidencialId, currentArea.id);
      toast.success("Área común eliminada correctamente");

      setDeleteConfirmOpen(false);
      setCurrentArea(null);

      // No recargar manualmente los datos - confiar en la suscripción en tiempo real

    } catch (error) {
      console.error("Error al eliminar área común:", error);
      toast.error("Error al eliminar el área común");
    } finally {
      setLoadingDelete(false);
    }
  }, [currentArea, selectedResidencialId]);

  const handleSubmit = useCallback(async () => {
    if (!selectedResidencialId) {
      toast.error("Por favor selecciona un residencial.");
      return;
    }
    setLoadingSubmit(true);
    try {
      const areaData = { ...formData };

      if (currentArea && currentArea.id) {
        await actualizarAreaComun(selectedResidencialId, currentArea.id, areaData);
        toast.success("Área común actualizada correctamente");
      } else {
        await crearAreaComun(selectedResidencialId, areaData);
        toast.success("Área común añadida correctamente");
      }

      setOpenDialog(false);
      setCurrentArea(null);

      // No recargar manualmente los datos - confiar en la suscripción en tiempo real

    } catch (error) {
      console.error("Error al guardar área común:", error);
      toast.error("Error al guardar el área común");
    } finally {
      setLoadingSubmit(false);
    }
  }, [selectedResidencialId, formData, currentArea]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => {
      // 🆕 Manejar campos numéricos
      if (type === "number") {
        const numValue = value === '' ? 0 : parseFloat(value) || 0;
        return {
          ...prev,
          [name]: numValue
        };
      }
      // Manejar campos de texto normales
      return {
        ...prev,
        [name]: value
      };
    });
  }, []);

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value === "true"
    }));
  }, []);

  const handleResidencialFilterChange = useCallback((value: string) => {
    if (esAdminDeResidencial) return;
    setResidencialFilter(value);
  }, [esAdminDeResidencial]);

  const filteredAreas = useMemo(() => areasComunes.filter(area => {
    if (!area || !area.nombre) return false;
    const matchesSearch = searchTerm === "" ||
      area.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (area.descripcion && area.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  }), [areasComunes, searchTerm]);

  const getResidencialNombre = useCallback((area: AreaComun) => {
    if (!area._residencialIdDoc) return "Desconocido";
    const residencialEncontrado = residenciales.find(r => r.id === area._residencialIdDoc);
    return residencialEncontrado ? residencialEncontrado.nombre : `ID: ${area._residencialIdDoc.substring(0, 6)}...`;
  }, [residenciales]);

  // Stats Logic
  const stats = useMemo(() => ({
    total: areasComunes.length,
    activas: areasComunes.filter(a => a.activa).length,
    mantenimiento: areasComunes.filter(a => !a.activa).length,
    dePago: areasComunes.filter(a => a.esDePago).length
  }), [areasComunes]);


  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-premium">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="font-black text-primary tracking-widest uppercase">Cargando Zentry...</p>
        </div>
      </div>
    );
  }

  if (!userClaims?.isGlobalAdmin && !esAdminDeResidencial) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--navbar-height,4rem))] p-8 bg-premium">
        <Card className="w-full max-w-md text-center bg-white/95 backdrop-blur-2xl rounded-[2.5rem] border-none shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-black text-slate-800">Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 font-medium">No tienes los permisos necesarios para acceder a esta sección.</p>
            <Button onClick={() => router.push('/dashboard')} className="mt-8 rounded-2xl h-12 px-8 bg-slate-900 text-white font-bold hover:bg-slate-800">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-premium p-4 lg:p-10 space-y-8 pb-20">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row justify-between gap-6 items-start"
      >
        <div className="space-y-2">
          <Badge className="bg-indigo-100 text-indigo-700 border-none font-black px-4 py-1 rounded-full flex gap-2 w-fit items-center shadow-sm">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            Gestión de Espacios
          </Badge>
          <h1 className="text-5xl font-extrabold tracking-tighter text-slate-900">
            Áreas <span className="text-gradient-zentry">Comunes</span>
          </h1>
          <p className="text-slate-600 font-bold max-w-lg">
            Administra las amenidades, reglas de reserva y disponibilidad de espacios compartidos.
          </p>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => handleOpenDialog()}
            disabled={(userClaims?.isGlobalAdmin && !esAdminDeResidencial && residencialFilter === "todos")}
            className="rounded-2xl h-14 px-8 font-black shadow-zentry-lg bg-indigo-600 text-white hover:bg-indigo-700 hover-lift transition-all"
          >
            <Plus className="mr-2 h-5 w-5" /> NUEVA AMENIDAD
          </Button>
        </motion.div>
      </motion.div>

      {/* Grid de Estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatTile
          icon={<Palmtree />}
          label="Total Amenidades"
          value={stats.total}
          color="blue"
          description="Espacios registrados"
        />
        <StatTile
          icon={<CheckCircle />}
          label="Disponibles"
          value={stats.activas}
          color="green"
          description="Listas para reservar"
        />
        <StatTile
          icon={<Home />}
          label="De Pago"
          value={stats.dePago}
          color="purple"
          description="Generan ingresos"
        />
        <StatTile
          icon={<XCircle />}
          label="Mantenimiento"
          value={stats.mantenimiento}
          color="orange"
          description="Fuera de servicio"
        />
      </div>


      {/* Main Content Card - Smart Filters Style */}
      <Card className="border-none shadow-zentry-lg bg-white/80 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
        <div className="p-8 pb-4 border-b border-white/10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="h-5 w-5 text-indigo-500" />
              <h2 className="text-sm font-black uppercase tracking-widest mr-4 text-slate-800">Directorio y Control</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                type="search"
                placeholder="Buscar por nombre..."
                className="pl-12 h-14 bg-white border border-slate-200 shadow-sm rounded-2xl font-bold focus-visible:ring-indigo-500/20 text-slate-900 placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtro Residencial (si aplica) */}
            {!esAdminDeResidencial && (
              <div className="relative">
                <Select
                  value={residencialFilter}
                  onValueChange={handleResidencialFilterChange}
                >
                  <SelectTrigger className="h-14 bg-white border border-slate-200 shadow-sm rounded-2xl font-bold px-6 text-slate-900 focus:ring-indigo-500/20">
                    <Building className="mr-2 h-5 w-5 text-indigo-500" />
                    <SelectValue placeholder="Filtrar residencial" />
                  </SelectTrigger>
                  <SelectContent className="rounded-3xl border-none shadow-2xl bg-white/95 backdrop-blur-3xl">
                    <div className="p-2">
                      {userClaims?.isGlobalAdmin && (
                        <SelectItem value="todos" className="font-bold mb-1 rounded-xl">
                          Todas las propiedades
                        </SelectItem>
                      )}
                      {residenciales
                        .filter(r => r.id)
                        .map((residencial) => (
                          <SelectItem key={residencial.id!} value={residencial.id!} className="font-bold rounded-xl">
                            {residencial.nombre}
                          </SelectItem>
                        ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <CardContent className="p-8 bg-slate-50/30 min-h-[400px]">
          <TablaAreasComunes
            loading={loadingData}
            filteredAreas={filteredAreas}
            esAdminDeResidencial={esAdminDeResidencial}
            userClaims={userClaims}
            getResidencialNombre={getResidencialNombre}
            convertirHora={convertirHora}
            handleOpenDialog={handleOpenDialog}
            handleDeleteConfirm={handleDeleteConfirm}
          />
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        {openDialog && (
          <Suspense fallback={<div className="p-12 text-center text-slate-400 font-medium">Cargando formulario...</div>}>
            <AreaComunFormDialogContent
              currentArea={currentArea}
              formData={formData}
              handleInputChange={handleInputChange}
              setFormData={setFormData}
              handleSelectChange={handleSelectChange}
              handleSubmit={handleSubmit}
              setOpenDialog={setOpenDialog}
              loading={loadingSubmit}
              userClaims={userClaims}
              esAdminDeResidencial={esAdminDeResidencial}
              selectedResidencialId={selectedResidencialId}
              setSelectedResidencialId={setSelectedResidencialId}
              residenciales={residenciales}
            />
          </Suspense>
        )}
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        {deleteConfirmOpen && (
          <Suspense fallback={<div className="p-12 text-center text-slate-400 font-medium">Cargando confirmación...</div>}>
            <ConfirmarEliminarAreaComunDialogContent
              currentArea={currentArea}
              handleDelete={handleDelete}
              setDeleteConfirmOpen={setDeleteConfirmOpen}
              loading={loadingDelete}
            />
          </Suspense>
        )}
      </Dialog>
    </div>
  );
}

// Sub-componentes Especializados para la UI Premium (alineados con Ingresos)
function StatTile({ icon, label, value, color, description }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200"
  };
  return (
    <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-2xl rounded-[2.2rem] p-6 group hover:translate-y-[-4px] hover:shadow-2xl transition-all duration-300 ring-1 ring-slate-100">
      <div className="flex items-start gap-5">
        <div className={`h-14 w-14 rounded-2xl ${colors[color]} border flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm`}>
          {React.cloneElement(icon, { size: 28 })}
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{label}</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
          </div>
          <p className="text-[10px] font-bold text-slate-500 truncate mt-1">{description}</p>
        </div>
      </div>
    </Card>
  );
}