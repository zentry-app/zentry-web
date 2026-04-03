"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getGuardias,
  getResidenciales,
  getUsuariosPorResidencial,
  crearGuardia,
  actualizarGuardia,
  eliminarGuardia,
  suscribirseAGuardias,
  Guardia,
  Residencial,
  Usuario
} from "@/lib/firebase/firestore";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  Clock,
  Calendar,
  User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, UserClaims } from "@/contexts/AuthContext";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";


// Importar dinámicamente GuardiaFormDialogContent
const GuardiaFormDialogContent = dynamic(() => import('@/components/dashboard/guardias/GuardiaFormDialogContent'), {
  suspense: true,
});

// Importar dinámicamente ConfirmarEliminarGuardiaDialogContent
const ConfirmarEliminarGuardiaDialogContent = dynamic(() => import('@/components/dashboard/guardias/ConfirmarEliminarGuardiaDialogContent'), {
  suspense: true,
});

// Importar TablaGuardias (no dinámico por ahora)
import TablaGuardias from "@/components/dashboard/guardias/TablaGuardias";

interface GuardiaFormData {
  usuarioId?: string;
  nombreGuardia: string;
  apellidoGuardia: string;
  horario: {
    dias: string[];
    horaEntrada: string;
    horaSalida: string;
  };
  estado?: 'activo' | 'inactivo' | 'vacaciones';
}

// Reintroducir diasSemana y estadosGuardia ya que se usan en otras partes de page.tsx
const diasSemana = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];

const estadosGuardia = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'vacaciones', label: 'Vacaciones' }
];

export default function GuardiasPage() {
  const router = useRouter();
  const { user, userClaims, loading: authLoading } = useAuth();

  const [guardias, setGuardias] = useState<(Guardia & { _residencialId?: string })[]>([]);
  const [residenciales, setResidenciales] = useState<Residencial[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [residencialFilter, setResidencialFilter] = useState<string>("todos");
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [currentGuardia, setCurrentGuardia] = useState<(Guardia & { _residencialId?: string }) | null>(null);
  const [selectedResidencialId, setSelectedResidencialId] = useState<string>("");
  const [formData, setFormData] = useState<GuardiaFormData>({
    usuarioId: "",
    nombreGuardia: "",
    apellidoGuardia: "",
    horario: {
      dias: [],
      horaEntrada: "08:00",
      horaSalida: "20:00",
    },
    estado: "activo"
  });
  const [mapeoResidenciales, setMapeoResidenciales] = useState<{ [key: string]: string }>({});

  const esAdminDeResidencial = useMemo(() => !!(userClaims?.isResidencialAdmin && !userClaims?.isGlobalAdmin), [userClaims]);
  const residencialCodigoDelAdmin = useMemo(() => esAdminDeResidencial ? userClaims?.managedResidencialId : null, [esAdminDeResidencial, userClaims]);

  const residencialIdDocDelAdmin = useMemo(() => {
    if (!esAdminDeResidencial || !residencialCodigoDelAdmin || Object.keys(mapeoResidenciales).length === 0) return null;
    return Object.keys(mapeoResidenciales).find(
      key => mapeoResidenciales[key] === residencialCodigoDelAdmin
    ) || null;
  }, [esAdminDeResidencial, residencialCodigoDelAdmin, mapeoResidenciales]);

  const fetchAllGuardias = useCallback(async (residencialesList: Residencial[]) => {
    try {
      const todosLosGuardias = [];
      for (const residencial of residencialesList) {
        if (residencial.id) {
          try {
            const guardias = await getGuardias(residencial.id);
            todosLosGuardias.push(...guardias.map(guardia => ({
              ...guardia,
              _residencialId: residencial.id // Campo temporal para identificar el residencial
            })));
          } catch (error) {
            console.error(`Error al cargar guardias del residencial ${residencial.id}:`, error);
          }
        }
      }
      setGuardias(todosLosGuardias);
      return todosLosGuardias;
    } catch (error) {
      console.error("Error al cargar guardias:", error);
      toast.error("Error al cargar los guardias");
      return [];
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;
      setLoading(true);

      if (!userClaims?.isGlobalAdmin && !esAdminDeResidencial) {
        setGuardias([]);
        setResidenciales([]);
        setUsuarios([]);
        setLoading(false);
        return;
      }

      try {
        const residencialesData = await getResidenciales();
        setResidenciales(residencialesData);

        const mapeo = residencialesData.reduce<{ [key: string]: string }>((acc, r) => {
          if (r.id && r.residencialID) acc[r.id] = r.residencialID;
          return acc;
        }, {});
        setMapeoResidenciales(mapeo);

        let usuariosAGuardar: Usuario[] = [];
        let guardiasACargar: (Guardia & { _residencialId?: string })[] = [];

        if (esAdminDeResidencial) {
          const idDocAdmin = Object.keys(mapeo).find(key => mapeo[key] === residencialCodigoDelAdmin);
          if (idDocAdmin) {
            const usuariosResidencialAdmin = await getUsuariosPorResidencial(idDocAdmin);
            usuariosAGuardar = usuariosResidencialAdmin.filter(u => u.role === 'security');

            const guardiasResidencialAdmin = await getGuardias(idDocAdmin);
            guardiasACargar = guardiasResidencialAdmin.map(g => ({ ...g, _residencialId: idDocAdmin }));

            setResidencialFilter(idDocAdmin);
            setSelectedResidencialId(idDocAdmin);
          } else {
            toast.error("No se pudo encontrar el residencial asignado.");
          }
        } else if (userClaims?.isGlobalAdmin) {
          // Cargar todos los usuarios con rol de guardia
          for (const residencial of residencialesData) {
            if (residencial.id) {
              const usuariosResidencial = await getUsuariosPorResidencial(residencial.id);
              usuariosAGuardar.push(...usuariosResidencial.filter(u => u.role === 'security'));
            }
          }
          // Cargar todos los guardias
          guardiasACargar = await fetchAllGuardias(residencialesData);
          setResidencialFilter("todos");
          setSelectedResidencialId("");
        }

        setUsuarios(usuariosAGuardar);
        setGuardias(guardiasACargar);

      } catch (error) {
        console.error("Error al cargar datos iniciales de guardias:", error);
        toast.error("Error al cargar los datos de guardias");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, userClaims, esAdminDeResidencial, residencialCodigoDelAdmin, fetchAllGuardias]);

  // Manejar el cambio de residencial para filtrar guardias
  useEffect(() => {
    const fetchGuardiasPorFiltro = async () => {
      if (!userClaims?.isGlobalAdmin || esAdminDeResidencial) return; // Solo para admin global

      try {
        setLoading(true);
        if (residencialFilter === "todos") {
          const todosLosGuardias = await fetchAllGuardias(residenciales);
          setGuardias(todosLosGuardias);
        } else {
          const guardiasFiltrados = await getGuardias(residencialFilter);
          setGuardias(guardiasFiltrados.map(guardia => ({
            ...guardia,
            _residencialId: residencialFilter
          })));
        }
      } catch (error) {
        console.error("Error al cargar guardias por filtro:", error);
        toast.error("Error al cargar los guardias");
      } finally {
        setLoading(false);
      }
    };

    if (userClaims?.isGlobalAdmin && !esAdminDeResidencial) { // Asegurarse de que solo se ejecute si es admin global
      fetchGuardiasPorFiltro();
    }
  }, [residencialFilter, residenciales, userClaims, esAdminDeResidencial, fetchAllGuardias]);

  // Suscripción a cambios en guardias
  useEffect(() => {
    if (authLoading) return;
    let unsubscribe: (() => void) | null = null;
    let idParaSuscribir: string | null = null;

    if (esAdminDeResidencial && residencialIdDocDelAdmin) {
      idParaSuscribir = residencialIdDocDelAdmin;
    } else if (userClaims?.isGlobalAdmin && residencialFilter !== "todos") {
      idParaSuscribir = residencialFilter;
    }

    if (idParaSuscribir) {
      unsubscribe = suscribirseAGuardias(idParaSuscribir, (guardiasActualizados) => {
        console.log("Guardias actualizados por suscripción:", guardiasActualizados, "para residencial:", idParaSuscribir);
        // Al actualizar por suscripción, asegurarse de mantener consistencia en la lista global de guardias
        // si el admin global está viendo "todos" pero la suscripción es de un residencial específico (no debería pasar con la lógica actual)
        // o si el admin de residencial actualiza su propia lista.
        setGuardias(prevGuardias => {
          const otrosGuardias = prevGuardias.filter(g => g._residencialId !== idParaSuscribir);
          const guardiasNuevosConId = guardiasActualizados.map(guardia => ({ ...guardia, _residencialId: idParaSuscribir! }));
          return [...otrosGuardias, ...guardiasNuevosConId];
        });
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [authLoading, userClaims, esAdminDeResidencial, residencialIdDocDelAdmin, residencialFilter]);

  const handleOpenDialog = (guardia?: Guardia & { _residencialId?: string }) => {
    if (guardia) {
      setCurrentGuardia(guardia);
      setSelectedResidencialId(guardia._residencialId || "");

      const usuario = usuarios.find(u => u.id === guardia.usuarioId);

      setFormData({
        usuarioId: guardia.usuarioId,
        nombreGuardia: guardia.nombreGuardia || (usuario ? usuario.fullName : ""),
        apellidoGuardia: guardia.apellidoGuardia || (usuario ? usuario.paternalLastName || "" : ""),
        horario: {
          dias: guardia.horario.dias,
          horaEntrada: guardia.horario.horaEntrada,
          horaSalida: guardia.horario.horaSalida,
        },
        estado: guardia.estado || 'activo'
      });
    } else {
      setCurrentGuardia(null);
      if (esAdminDeResidencial && residencialIdDocDelAdmin) {
        setSelectedResidencialId(residencialIdDocDelAdmin);
      } else if (userClaims?.isGlobalAdmin) {
        setSelectedResidencialId(residencialFilter !== "todos" ? residencialFilter : (residenciales.length > 0 ? residenciales[0].id || "" : ""));
      } else {
        setSelectedResidencialId(""); // No debería llegar aquí si el acceso está denegado
      }
      setFormData({
        usuarioId: "",
        nombreGuardia: "",
        apellidoGuardia: "",
        horario: {
          dias: [],
          horaEntrada: "08:00",
          horaSalida: "20:00",
        },
        estado: 'activo'
      });
    }
    setOpenDialog(true);
  };

  const handleDeleteConfirm = (guardia: Guardia & { _residencialId?: string }) => {
    setCurrentGuardia(guardia);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!currentGuardia || !currentGuardia.id || !currentGuardia._residencialId) {
      toast.error("No se puede eliminar el guardia: faltan datos");
      return;
    }

    try {
      await eliminarGuardia(currentGuardia._residencialId, currentGuardia.id);

      // Si no estamos usando suscripción en tiempo real (cuando es "todos"),
      // o si estamos viendo un residencial diferente del que estamos eliminando,
      // actualizamos manualmente la lista
      if (residencialFilter === "todos" || residencialFilter !== currentGuardia._residencialId) {
        setGuardias(guardias.filter(g => !(g.id === currentGuardia.id && g._residencialId === currentGuardia._residencialId)));
      }
      // Si es el mismo residencial, la suscripción se encargará de actualizar

      toast.success("Guardia eliminado correctamente");
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error("Error al eliminar guardia:", error);
      toast.error("Error al eliminar el guardia");
    }
  };

  const handleSubmit = async () => {
    try {
      if (!selectedResidencialId) {
        toast.error("Debes seleccionar un residencial");
        return;
      }

      if (!formData.nombreGuardia.trim()) {
        toast.error("El nombre del guardia es obligatorio");
        return;
      }

      if (formData.horario.dias.length === 0) {
        toast.error("Debes seleccionar al menos un día");
        return;
      }

      setLoading(true);

      // Crear un ID de usuario temporal si no existe
      const guardiaData = {
        ...formData,
        usuarioId: formData.usuarioId || `guardia-${Date.now()}`,
      };

      if (currentGuardia && currentGuardia.id) {
        // Actualizar guardia existente
        await actualizarGuardia(
          currentGuardia._residencialId || selectedResidencialId,
          currentGuardia.id,
          guardiaData
        );

        toast.success("Guardia actualizado correctamente");
      } else {
        // Añadir nuevo guardia
        await crearGuardia(selectedResidencialId, guardiaData);
        toast.success("Guardia añadido correctamente");

        // Si no estamos usando suscripción en tiempo real (cuando es "todos"),
        // recargamos manualmente los guardias
        if (residencialFilter === "todos") {
          await fetchAllGuardias(residenciales);
        } else {
          // Recargar los guardias del residencial seleccionado
          const guardias = await getGuardias(selectedResidencialId);
          const guardiasConResidencial = guardias.map(guardia => ({
            ...guardia,
            _residencialId: selectedResidencialId
          }));
          setGuardias(prevGuardias => {
            // Filtrar los guardias que no son del residencial seleccionado
            const otrosGuardias = prevGuardias.filter(g => g._residencialId !== selectedResidencialId);
            return [...otrosGuardias, ...guardiasConResidencial];
          });
        }
      }

      setOpenDialog(false);
      setFormData({
        usuarioId: "",
        nombreGuardia: "",
        apellidoGuardia: "",
        horario: {
          dias: [],
          horaEntrada: "08:00",
          horaSalida: "20:00",
        },
        estado: 'activo'
      });
    } catch (error) {
      console.error("Error al guardar guardia:", error);
      toast.error("Error al guardar el guardia");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "horaEntrada" || name === "horaSalida") {
      setFormData(prev => ({
        ...prev,
        horario: {
          ...prev.horario,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDiaChange = (dia: string, checked: boolean) => {
    if (dia === "todos") {
      // Si se selecciona "todos", añadir todos los días o limpiar la selección
      if (checked) {
        setFormData({
          ...formData,
          horario: {
            ...formData.horario,
            dias: diasSemana.map(d => d.id)
          }
        });
      } else {
        setFormData({
          ...formData,
          horario: {
            ...formData.horario,
            dias: []
          }
        });
      }
    } else {
      // Comportamiento normal para días individuales
      if (checked) {
        setFormData({
          ...formData,
          horario: {
            ...formData.horario,
            dias: [...formData.horario.dias, dia]
          }
        });
      } else {
        setFormData({
          ...formData,
          horario: {
            ...formData.horario,
            dias: formData.horario.dias.filter(d => d !== dia)
          }
        });
      }
    }
  };

  const handleResidencialChange = (value: string) => {
    if (value === "todos") {
      setSelectedResidencialId("");
    } else {
      setSelectedResidencialId(value);
    }
    setResidencialFilter(value);
  };

  // Funciones auxiliares
  const getResidencialNombre = (id: string | undefined | null) => {
    if (!id) return "Desconocido";
    const residencial = residenciales.find(r => r.id === id);
    return residencial ? residencial.nombre : "Desconocido";
  };

  const getUsuarioNombre = (id: string | undefined | null) => {
    if (!id) return "Desconocido";

    // Si es un ID generado para un guardia (comienza con "guardia-")
    if (id.startsWith("guardia-")) {
      // Buscar el guardia en la lista de guardias
      const guardia = guardias.find(g => g.usuarioId === id);
      if (guardia && guardia.nombreGuardia) {
        return `${guardia.nombreGuardia || ''} ${guardia.apellidoGuardia || ''}`.trim() || "Guardia";
      }
    }

    // Buscar en la lista de usuarios normales
    const usuario = usuarios.find(u => u.id === id);
    return usuario ? `${usuario.fullName} ${usuario.paternalLastName || ''}` : "Guardia";
  };

  const getUsuarioInitials = (id: string | undefined | null) => {
    if (!id) return "??";

    // Si es un ID generado para un guardia
    if (id.startsWith("guardia-")) {
      const guardia = guardias.find(g => g.usuarioId === id);
      if (guardia && guardia.nombreGuardia) {
        const nombre = guardia.nombreGuardia || '';
        const apellido = guardia.apellidoGuardia || '';
        return `${nombre.charAt(0) || '?'}${apellido.charAt(0) || '?'}`;
      }
    }

    // Buscar en la lista de usuarios normales
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) return "GD";
    return `${usuario.fullName.charAt(0)}${usuario.paternalLastName ? usuario.paternalLastName.charAt(0) : ''}`;
  };

  const getUsuarioPhoto = (id: string | undefined | null) => {
    if (!id) return "";
    // Aquí podrías implementar la lógica para obtener la foto del usuario
    return "";
  };

  const formatDias = (dias: string[] | undefined | null) => {
    if (!dias || dias.length === 0) return "Sin días";
    return dias.map(dia => diasSemana.find(d => d.id === dia)?.label.substring(0, 3) || dia).join(", ");
  };

  // Función para convertir formato de 24 horas a 12 horas
  const formatHora = (hora24: string | undefined | null) => {
    if (!hora24) return "N/A";

    // Dividir la hora en horas y minutos
    const [horas, minutos] = hora24.split(':').map(Number);

    // Determinar si es AM o PM
    const periodo = horas >= 12 ? 'PM' : 'AM';

    // Convertir a formato de 12 horas
    const horas12 = horas % 12 || 12;

    // Formatear la hora con dos dígitos para los minutos
    return `${horas12}:${minutos.toString().padStart(2, '0')} ${periodo}`;
  };

  // Filtrado de guardias
  const filteredGuardias = guardias.filter((guardia) => {
    if (!guardia) return false;

    const matchesResidencial = residencialFilter === "todos" || guardia._residencialId === residencialFilter;

    const usuarioNombre = getUsuarioNombre(guardia.usuarioId).toLowerCase();
    const matchesSearch = searchTerm === "" || usuarioNombre.includes(searchTerm.toLowerCase());

    const matchesEstado = estadoFilter === "todos" || guardia.estado === estadoFilter;

    return matchesResidencial && matchesSearch && matchesEstado;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-premium p-4 lg:p-10 space-y-8 pb-20">
        <div className="flex flex-col lg:flex-row justify-between gap-6 items-start">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="h-14 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Skeleton className="h-14 w-48 rounded-2xl" />
        </div>
        <Card className="border-none shadow-zentry-lg bg-white/80 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
          <div className="p-8 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-14 rounded-2xl" />
              <Skeleton className="h-14 rounded-2xl" />
              <Skeleton className="h-14 rounded-2xl" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!userClaims?.isGlobalAdmin && !esAdminDeResidencial) { // Mostrar AccesoDenegado si no tiene permisos
    return <AccesoDenegado onVolver={() => router.push('/dashboard')} />;
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
            Seguridad
          </Badge>
          <h1 className="text-5xl font-extrabold tracking-tighter text-slate-900">
            <span className="text-gradient-zentry">Guardias</span>
          </h1>
          <p className="text-slate-600 font-bold max-w-lg">
            Gestiona los guardias de seguridad y sus horarios
          </p>
        </div>

        {/* Botón de añadir guardia */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => handleOpenDialog()}
            disabled={esAdminDeResidencial && !residencialIdDocDelAdmin}
            className="rounded-2xl h-14 px-8 font-black shadow-zentry-lg bg-indigo-600 text-white hover:bg-indigo-700 hover-lift transition-all"
          >
            <Plus className="mr-2 h-5 w-5" />
            Añadir Guardia
          </Button>
        </motion.div>
      </motion.div>

      {/* Card principal con diseño premium */}
      <Card className="border-none shadow-zentry-lg bg-white/80 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
        <div className="p-8 pb-4 border-b border-white/10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <Shield className="h-5 w-5 text-indigo-500" />
              <h2 className="text-sm font-black uppercase tracking-widest mr-4 text-slate-800">Filtros y Búsqueda</h2>
            </div>
          </div>

          {/* Filtros renovados */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por Residencial */}
            <Select
              value={residencialFilter}
              onValueChange={setResidencialFilter}
              disabled={esAdminDeResidencial}
            >
              <SelectTrigger className="h-14 bg-white border border-slate-200 shadow-sm rounded-2xl font-bold px-6 text-slate-900 focus:ring-indigo-500/20">
                <SelectValue placeholder="Filtrar por residencial" />
              </SelectTrigger>
              <SelectContent className="rounded-3xl border-none shadow-2xl bg-white/95 backdrop-blur-3xl">
                <div className="p-2">
                  {userClaims?.isGlobalAdmin && !esAdminDeResidencial && (
                    <SelectItem value="todos" className="font-bold mb-1 rounded-xl">Todos los residenciales</SelectItem>
                  )}
                  {residenciales
                    .filter(r => r.id && (!esAdminDeResidencial || r.id === residencialIdDocDelAdmin))
                    .map((residencial) => (
                      <SelectItem key={residencial.id} value={residencial.id!} className="font-bold mb-1 rounded-xl">
                        {residencial.nombre}
                      </SelectItem>
                    ))}
                </div>
              </SelectContent>
            </Select>

            {/* Filtro por Estado */}
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="h-14 bg-white border border-slate-200 shadow-sm rounded-2xl font-bold px-6 text-slate-900 focus:ring-indigo-500/20">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent className="rounded-3xl border-none shadow-2xl bg-white/95 backdrop-blur-3xl">
                <div className="p-2">
                  <SelectItem value="todos" className="font-bold mb-1 rounded-xl">Todos los estados</SelectItem>
                  <SelectItem value="activo" className="font-bold mb-1 rounded-xl">Activo</SelectItem>
                  <SelectItem value="inactivo" className="font-bold mb-1 rounded-xl">Inactivo</SelectItem>
                  <SelectItem value="vacaciones" className="font-bold rounded-xl">Vacaciones</SelectItem>
                </div>
              </SelectContent>
            </Select>

            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                type="search"
                placeholder="Buscar guardia..."
                className="pl-12 h-14 bg-white border border-slate-200 shadow-sm rounded-2xl font-bold focus-visible:ring-indigo-500/20 text-slate-900 placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabla de guardias */}
        <CardContent className="p-8">
          <TablaGuardias
            loading={loading}
            filteredGuardias={filteredGuardias}
            getUsuarioPhoto={getUsuarioPhoto}
            getUsuarioInitials={getUsuarioInitials}
            getUsuarioNombre={getUsuarioNombre}
            getResidencialNombre={getResidencialNombre}
            formatDias={formatDias}
            formatHora={formatHora}
            handleOpenDialog={handleOpenDialog}
            handleDeleteConfirm={handleDeleteConfirm}
          />
        </CardContent>
      </Card>

      {/* Diálogo para añadir/editar guardia */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        {openDialog && (
          <Suspense fallback={<div className="p-6 text-center">Cargando formulario...</div>}>
            <GuardiaFormDialogContent
              currentGuardia={currentGuardia}
              formData={formData}
              handleInputChange={handleInputChange}
              handleSelectChange={handleSelectChange}
              handleDiaChange={handleDiaChange}
              handleSubmit={handleSubmit}
              setOpenDialog={setOpenDialog}
              loading={loading} // O un estado de loading específico para el form
              residenciales={residenciales}
              selectedResidencialId={selectedResidencialId}
              setSelectedResidencialId={setSelectedResidencialId}
              esAdminDeResidencial={esAdminDeResidencial}
              residencialIdDocDelAdmin={residencialIdDocDelAdmin}
            // diasSemana y estadosGuardia ya no se pasan como props
            />
          </Suspense>
        )}
      </Dialog>

      {/* Diálogo de confirmación para eliminar guardia */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        {deleteConfirmOpen && (
          <Suspense fallback={<div className="p-6 text-center">Cargando confirmación...</div>}>
            <ConfirmarEliminarGuardiaDialogContent
              currentGuardia={currentGuardia}
              handleDelete={handleDelete}
              setDeleteConfirmOpen={setDeleteConfirmOpen}
              loading={loading} // O un estado de loading específico
              getUsuarioNombre={getUsuarioNombre} // Pasar la función requerida
            />
          </Suspense>
        )}
      </Dialog>
    </div>
  );
}

// Componente de Acceso Denegado (puede ir al final o en un archivo separado)
function AccesoDenegado({ onVolver }: { onVolver: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--navbar-height,4rem))] p-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Acceso Denegado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No tienes los permisos necesarios para acceder a esta sección.</p>
          <Button onClick={onVolver} className="mt-6">
            Volver al Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 
