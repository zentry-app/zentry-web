import React, { useState, useEffect } from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogContent,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X, Settings, Clock, Users, CreditCard, CalendarDays, ChevronLeft, ChevronRight, RotateCcw, Info, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { UserClaims } from "@/contexts/AuthContext";
import { Residencial, AreaComun } from "@/lib/firebase/firestore";
import HorasDeshabilitadasConfig from "./HorasDeshabilitadasConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Reglamento {
  maxHorasPorReserva: number;
  maxReservasPorDia: number;
  maxReservasPorSemana: number;
  maxReservasPorMes: number;
  antelacionMinima: number;
  antelacionMaxima: number;
  cancelacionMinima: number;
  permiteInvitados: boolean;
  maxInvitados: number;
  requiereAprobacion: boolean;
  permiteReservasSimultaneas: boolean;
  maxCasasSimultaneas: number;
  diasDeshabilitados: string[];
  diasSemanaDeshabilitados: string[];
  diasDesactivadosEspecificos: string[]; // Nuevos días desactivados específicos
  tipoReservas: 'bloques' | 'traslapes' | 'horarios_fijos';
  permiteTraslapes: boolean;
  // 🆕 NUEVA PROPIEDAD PARA HORARIOS FIJOS
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
  horasDeshabilitadas: {
    [diaSemana: string]: {
      inicio: string;
      fin: string;
      motivo?: string;
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

interface AreaComunFormDialogContentProps {
  currentArea: AreaComun | null;
  formData: AreaComunFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<AreaComunFormData>>;
  handleSelectChange: (name: string, value: string) => void;
  handleSubmit: () => Promise<void>;
  setOpenDialog: (open: boolean) => void;
  loading: boolean;
  userClaims: UserClaims | null;
  esAdminDeResidencial: boolean;
  selectedResidencialId: string;
  setSelectedResidencialId: (id: string) => void;
  residenciales: Residencial[];
}

const generarOpcionesHora = () => {
  const opciones = [];
  for (let i = 0; i < 24; i++) {
    const hora = i.toString().padStart(2, '0');
    const hora12 = i === 0 ? 12 : i > 12 ? i - 12 : i;
    const ampm = i >= 12 ? 'PM' : 'AM';
    const etiqueta = `${hora12}:00 ${ampm}`;
    opciones.push({ valor: `${hora}:00`, etiqueta });
    opciones.push({ valor: `${hora}:30`, etiqueta: `${hora12}:30 ${ampm}` });
  }
  return opciones;
};

const opcionesHora = generarOpcionesHora();

const AreaComunFormDialogContent: React.FC<AreaComunFormDialogContentProps> = ({
  currentArea,
  formData,
  handleInputChange,
  setFormData,
  handleSelectChange,
  handleSubmit,
  setOpenDialog,
  loading,
  userClaims,
  esAdminDeResidencial,
  selectedResidencialId,
  setSelectedResidencialId,
  residenciales,
}) => {
  const [activeTab, setActiveTab] = useState("general");
  const [showBloquesModal, setShowBloquesModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{
    numero: number;
    diaSemana: string;
    horario: { apertura: string; cierre: string };
    bloques: { inicio: string; fin: string }[];
  } | null>(null);
  
  // Estado para navegación de calendario
  const [fechaCalendario, setFechaCalendario] = useState(new Date());
  
  // Estado para días desactivados específicos - se inicializa desde formData
  const [diasDesactivadosEspecificos, setDiasDesactivadosEspecificos] = useState<Set<string>>(
    new Set(formData.reglamento?.diasDesactivadosEspecificos || [])
  );
  
  // Sincronizar estado local cuando cambie formData (ej: al cargar área existente)
  useEffect(() => {
    setDiasDesactivadosEspecificos(new Set(formData.reglamento?.diasDesactivadosEspecificos || []));
  }, [formData.reglamento?.diasDesactivadosEspecificos]);
  
  // 🆕 NUEVO: Sincronizar horarios individuales cuando se carga un área existente
  useEffect(() => {
    if (currentArea && currentArea.reglamento?.horarios) {
      // Asegurar que todos los días de la semana tengan horarios individuales
      const horariosExistentes = currentArea.reglamento.horarios.individuales || {};
      const horariosCompletos = {
        lunes: horariosExistentes.lunes || { apertura: "08:00", cierre: "22:00" },
        martes: horariosExistentes.martes || { apertura: "08:00", cierre: "22:00" },
        miercoles: horariosExistentes.miercoles || { apertura: "08:00", cierre: "22:00" },
        jueves: horariosExistentes.jueves || { apertura: "08:00", cierre: "22:00" },
        viernes: horariosExistentes.viernes || { apertura: "08:00", cierre: "22:00" },
        sabado: horariosExistentes.sabado || { apertura: "09:00", cierre: "23:00" },
        domingo: horariosExistentes.domingo || { apertura: "09:00", cierre: "23:00" }
      };
      
      // Actualizar formData con horarios completos
      setFormData(prev => ({
        ...prev,
        reglamento: {
          ...(prev.reglamento || {}),
          horarios: {
            ...(prev.reglamento?.horarios || {}),
            individuales: horariosCompletos
          }
        }
      }));
      
      console.log('🔄 [SYNC] Horarios individuales sincronizados:', horariosCompletos);
    }
  }, [currentArea, setFormData]);
  
  // Funciones para navegación de calendario
  const irMesAnterior = () => {
    setFechaCalendario(prev => {
      const nuevaFecha = new Date(prev);
      nuevaFecha.setMonth(nuevaFecha.getMonth() - 1);
      return nuevaFecha;
    });
  };
  
  const irMesSiguiente = () => {
    setFechaCalendario(prev => {
      const nuevaFecha = new Date(prev);
      nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
      return nuevaFecha;
    });
  };
  
  const irMesActual = () => {
    setFechaCalendario(new Date());
  };
  
  // Función para alternar estado de días específicos
  const alternarDiaEspecifico = (fecha: Date) => {
    const fechaString = fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    setDiasDesactivadosEspecificos(prev => {
      const nuevoSet = new Set(prev);
      if (nuevoSet.has(fechaString)) {
        nuevoSet.delete(fechaString);
      } else {
        nuevoSet.add(fechaString);
      }
      
      // Actualizar también el formData para persistir en la base de datos
      setFormData(prevFormData => ({
        ...prevFormData,
        reglamento: {
          ...(prevFormData.reglamento || {}),
          diasDesactivadosEspecificos: Array.from(nuevoSet)
        }
      }));
      
      return nuevoSet;
    });
  };
  
  // Validar que reglamento existe
  const reglamento = formData.reglamento || {
    maxHorasPorReserva: 4,
    maxReservasPorDia: 1,
    maxReservasPorSemana: 3,
    maxReservasPorMes: 10,
    antelacionMinima: 1,
    antelacionMaxima: 30,
    cancelacionMinima: 2,
    permiteInvitados: false,
    maxInvitados: 6,
    requiereAprobacion: false,
    permiteReservasSimultaneas: false,
    maxCasasSimultaneas: 1,
    diasSemanaDeshabilitados: [],
    diasDeshabilitados: [],
    diasDesactivadosEspecificos: [], // Inicializar array vacío
    horasDeshabilitadas: {},
    tipoReservas: 'bloques',
    permiteTraslapes: false,
    horarios: {
      entreSemana: { apertura: "08:00", cierre: "22:00" },
      finDeSemana: { apertura: "09:00", cierre: "23:00" },
      // Nuevo modelo de horarios individuales por día
      individuales: {
        lunes: { apertura: "08:00", cierre: "22:00" },
        martes: { apertura: "08:00", cierre: "22:00" },
        miercoles: { apertura: "08:00", cierre: "22:00" },
        jueves: { apertura: "08:00", cierre: "22:00" },
        viernes: { apertura: "08:00", cierre: "22:00" },
        sabado: { apertura: "09:00", cierre: "23:00" },
        domingo: { apertura: "09:00", cierre: "23:00" }
      }
    }
  };

  // Extraer horarios individuales o usar los tradicionales como fallback
  const horariosIndividuales = reglamento.horarios?.individuales || {
    lunes: reglamento.horarios?.entreSemana || { apertura: "08:00", cierre: "22:00" },
    martes: reglamento.horarios?.entreSemana || { apertura: "08:00", cierre: "22:00" },
    miercoles: reglamento.horarios?.entreSemana || { apertura: "08:00", cierre: "22:00" },
    jueves: reglamento.horarios?.entreSemana || { apertura: "08:00", cierre: "22:00" },
    viernes: reglamento.horarios?.entreSemana || { apertura: "08:00", cierre: "22:00" },
    sabado: reglamento.horarios?.finDeSemana || { apertura: "09:00", cierre: "23:00" },
    domingo: reglamento.horarios?.finDeSemana || { apertura: "09:00", cierre: "23:00" }
  };

  // Asegurar que todos los días tengan valores por defecto
  const horariosSeguros = {
    lunes: horariosIndividuales.lunes || { apertura: "08:00", cierre: "22:00" },
    martes: horariosIndividuales.martes || { apertura: "08:00", cierre: "22:00" },
    miercoles: horariosIndividuales.miercoles || { apertura: "08:00", cierre: "22:00" },
    jueves: horariosIndividuales.jueves || { apertura: "08:00", cierre: "22:00" },
    viernes: horariosIndividuales.viernes || { apertura: "08:00", cierre: "22:00" },
    sabado: horariosIndividuales.sabado || { apertura: "09:00", cierre: "23:00" },
    domingo: horariosIndividuales.domingo || { apertura: "09:00", cierre: "23:00" }
  };

  // Función para actualizar horario individual
  const actualizarHorarioIndividual = (dia: string, campo: 'apertura' | 'cierre', valor: string) => {
    console.log(`🕐 [HORARIO] Actualizando ${dia}.${campo} = ${valor}`);
    
    setFormData(prev => {
      const nuevoFormData = {
      ...prev,
      reglamento: {
        ...(prev.reglamento || {}),
        horarios: {
          ...(prev.reglamento?.horarios || {}),
          individuales: {
            ...(prev.reglamento?.horarios?.individuales || {}),
            [dia]: {
              ...(prev.reglamento?.horarios?.individuales?.[dia] || { apertura: "08:00", cierre: "22:00" }),
              [campo]: valor
            }
          }
          }
        }
      };
      
      console.log(`✅ [HORARIO] ${dia}.${campo} actualizado a ${valor}`);
      console.log(`📊 [HORARIO] Horarios individuales completos:`, nuevoFormData.reglamento?.horarios?.individuales);
      
      return nuevoFormData;
    });
  };
  
  // 🆕 NUEVO: Función para asegurar que todos los horarios individuales estén completos
  const asegurarHorariosCompletos = () => {
    const horariosActuales = formData.reglamento?.horarios?.individuales || {};
    const horariosCompletos = {
      lunes: horariosActuales.lunes || { apertura: "08:00", cierre: "22:00" },
      martes: horariosActuales.martes || { apertura: "08:00", cierre: "22:00" },
      miercoles: horariosActuales.miercoles || { apertura: "08:00", cierre: "22:00" },
      jueves: horariosActuales.jueves || { apertura: "08:00", cierre: "22:00" },
      viernes: horariosActuales.viernes || { apertura: "08:00", cierre: "22:00" },
      sabado: horariosActuales.sabado || { apertura: "09:00", cierre: "23:00" },
      domingo: horariosActuales.domingo || { apertura: "09:00", cierre: "23:00" }
    };
    
    // Actualizar formData con horarios completos
    setFormData(prev => ({
      ...prev,
      reglamento: {
        ...(prev.reglamento || {}),
        horarios: {
          ...(prev.reglamento?.horarios || {}),
          individuales: horariosCompletos
        }
      }
    }));
    
    console.log('🔒 [HORARIOS] Horarios completos asegurados:', horariosCompletos);
    return horariosCompletos;
  };

  // Función para convertir hora de 24h a 12h
  const formatearHora12 = (hora24: string) => {
    const [hora, minuto] = hora24.split(':');
    const horaNum = parseInt(hora);
    const ampm = horaNum >= 12 ? 'PM' : 'AM';
    const hora12 = horaNum === 0 ? 12 : horaNum > 12 ? horaNum - 12 : horaNum;
    return `${hora12}:${minuto} ${ampm}`;
  };

  // Función para obtener el nombre del mes actual
  const obtenerMesActual = () => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[fechaCalendario.getMonth()];
  };

  // Función para obtener el año actual
  const obtenerAñoActual = () => {
    return fechaCalendario.getFullYear();
  };

  // Función para obtener los días del mes actual
  const obtenerDiasDelMes = () => {
    const hoy = new Date();
    const año = fechaCalendario.getFullYear();
    const mes = fechaCalendario.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    
    const dias = [];
    
    // Agregar días vacíos al inicio si el mes no empieza en lunes
    for (let i = 0; i < (primerDiaSemana === 0 ? 6 : primerDiaSemana - 1); i++) {
      dias.push({ 
        numero: null, 
        diaSemana: null, 
        estaDeshabilitado: false, 
        horario: null,
        estado: 'vacio'
      });
    }
    
    // Agregar todos los días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fechaDia = new Date(año, mes, dia);
      const diaSemana = fechaDia.getDay();
      const nombreDiaSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][diaSemana];
      const horario = horariosSeguros[nombreDiaSemana as keyof typeof horariosSeguros];
      
      // Verificar si el día está deshabilitado por configuración
      const deshabilitadoPorConfiguracion = reglamento.diasSemanaDeshabilitados?.includes(nombreDiaSemana) || false;
      
      // Verificar si el día está desactivado específicamente
      const fechaString = fechaDia.toISOString().split('T')[0];
      const desactivadoEspecificamente = diasDesactivadosEspecificos.has(fechaString);
      
      // Calcular estado del día según los parámetros
      let estado = 'disponible';
      let estaDeshabilitado = deshabilitadoPorConfiguracion || desactivadoEspecificamente;
      
      // Verificar si ya pasó
      const fechaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const fechaComparar = new Date(año, mes, dia);
      
      if (fechaComparar < fechaHoy) {
        estado = 'pasado';
        estaDeshabilitado = true;
      } else if (desactivadoEspecificamente) {
        estado = 'desactivado_especifico';
        estaDeshabilitado = true;
      } else {
        // Verificar antelación mínima (no se puede reservar aún)
        const diasDeDiferencia = Math.ceil((fechaComparar.getTime() - fechaHoy.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasDeDiferencia < (reglamento.antelacionMinima || 0)) {
          estado = 'muy_temprano';
          estaDeshabilitado = true;
        } else if (diasDeDiferencia > (reglamento.antelacionMaxima || 30)) {
          // Verificar antelación máxima (fuera de ventana de reservas)
          estado = 'fuera_ventana';
          estaDeshabilitado = true;
        } else if (deshabilitadoPorConfiguracion) {
          estado = 'cerrado';
          estaDeshabilitado = true;
        }
      }
      
      dias.push({
        numero: dia,
        diaSemana: nombreDiaSemana,
        estaDeshabilitado,
        horario,
        estado,
        fecha: fechaDia
      });
    }
    
    return dias;
  };

  const calcularBloquesDelDia = (horario: { apertura: string; cierre: string }, duracionMaxima: number) => {
    const apertura = new Date(`2000-01-01T${horario.apertura}`);
    const cierre = new Date(`2000-01-01T${horario.cierre}`);
    const duracion = duracionMaxima || 4; // Usar el valor por defecto si es 0

    const bloques = [];
    let horaActual = new Date(apertura);

    while (horaActual < cierre) {
      const horaFin = new Date(horaActual.getTime() + (duracion * 60 * 60 * 1000));
      if (horaFin > cierre) break;
      
      bloques.push({
        inicio: horaActual.toTimeString().slice(0, 5),
        fin: horaFin.toTimeString().slice(0, 5)
      });
      
      horaActual = horaFin;
    }
    
    // Si no hay bloques completos, crear al menos uno parcial
    if (bloques.length === 0 && apertura < cierre) {
      const tiempoDisponible = cierre.getTime() - apertura.getTime();
      const horasDisponibles = Math.floor(tiempoDisponible / (60 * 60 * 1000));
      const minutosDisponibles = Math.floor((tiempoDisponible % (60 * 60 * 1000)) / (60 * 1000));
      
      if (horasDisponibles > 0 || minutosDisponibles > 0) {
        bloques.push({
          inicio: horario.apertura,
          fin: horario.cierre
        });
      }
    }
    
    return bloques;
  };

  // Función para mostrar modal de bloques
  const mostrarModalBloques = (dia: any) => {
    if (dia.estaDeshabilitado) return;
    
    const bloques = calcularBloquesDelDia(dia.horario, reglamento.maxHorasPorReserva);
    setSelectedDay({
      numero: dia.numero,
      diaSemana: dia.diaSemana,
      horario: dia.horario,
      bloques: bloques
    });
    setShowBloquesModal(true);
  };

  return (
    <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{currentArea ? "Editar Área Común" : "Añadir Área Común"}</DialogTitle>
        <DialogDescription>
          {currentArea ? "Modifica los detalles del área común." : `Añadiendo para ${selectedResidencialId ? (residenciales.find(r=>r.id === selectedResidencialId)?.nombre || 'residencial sel.') : 'selecciona un residencial'}`}
        </DialogDescription>
      </DialogHeader>
      
      <div className="py-4">
        {/* Residencial Selector */}
        {userClaims?.isGlobalAdmin && !esAdminDeResidencial && !currentArea && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Label htmlFor="residencialParaCrear" className="text-sm font-medium text-blue-800">Residencial</Label>
            <Select 
              value={selectedResidencialId} 
              onValueChange={(value) => setSelectedResidencialId(value)} 
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecciona un residencial" />
              </SelectTrigger>
              <SelectContent>
                {residenciales.filter(r => r.id).map(r => (
                  <SelectItem key={r.id!} value={r.id!}>{r.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="reservas" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Reservas
            </TabsTrigger>
            <TabsTrigger value="horarios" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horarios
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="avanzado" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Avanzado
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: General */}
          <TabsContent value="general" className="space-y-6">
            <div className="space-y-6">
        {/* Información Básica */}
        <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Información Básica
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-sm font-medium">Nombre del Área</Label>
              <Input 
                id="nombre" 
                name="nombre" 
                value={formData.nombre} 
                onChange={handleInputChange}
                placeholder="Ej: Casa Club, Alberca, Gimnasio"
              />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="capacidad" className="text-sm font-medium">Capacidad Máxima</Label>
                    <Input 
                      id="capacidad" 
                      name="capacidad" 
                      type="number" 
                      value={formData.capacidad} 
                      onChange={handleInputChange}
                      placeholder="50"
                    />
                  </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descripcion" className="text-sm font-medium">Descripción</Label>
              <Textarea 
                id="descripcion" 
                name="descripcion" 
                value={formData.descripcion} 
                onChange={handleInputChange}
                placeholder="Describe las características del área"
                rows={3}
              />
            </div>
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="activa" className="text-sm font-medium">Estado del Área</Label>
                <Select 
                  value={formData.activa ? "true" : "false"} 
                  onValueChange={(value) => handleSelectChange("activa", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activa</SelectItem>
                    <SelectItem value="false">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>
        </div>

        {/* Configuración de Pago */}
        <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  Configuración de Pago
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="esDePago" className="text-sm font-medium">¿Es de Pago?</Label>
              <Select 
                value={formData.esDePago ? "true" : "false"} 
                onValueChange={(value) => handleSelectChange("esDePago", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sí, requiere pago</SelectItem>
                  <SelectItem value="false">No, es gratuita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.esDePago && (
              <div className="space-y-2">
                <Label htmlFor="precio" className="text-sm font-medium">Precio por Reserva</Label>
                <Input 
                  id="precio" 
                  name="precio" 
                  type="number" 
                  value={formData.precio || 0} 
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            )}
            
            {formData.esDePago && (
              <div className="space-y-2">
                <Label htmlFor="requiereDeposito" className="text-sm font-medium">¿Requiere Depósito?</Label>
                <Select 
                  value={formData.requiereDeposito ? "true" : "false"} 
                  onValueChange={(value) => handleSelectChange("requiereDeposito", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sí, requiere depósito</SelectItem>
                    <SelectItem value="false">No, no requiere depósito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {formData.esDePago && formData.requiereDeposito && (
              <div className="space-y-2">
                <Label htmlFor="deposito" className="text-sm font-medium">Monto del Depósito</Label>
                <Input 
                  id="deposito" 
                  name="deposito" 
                  type="number" 
                  value={formData.deposito || 0} 
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
        </div>
          </div>
          </TabsContent>

          {/* Tab 2: Reservas */}
          <TabsContent value="reservas" className="space-y-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                Reglas de Reserva
              </h3>
          
          {/* Límites de Reservas */}
          <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700">Límites de Reservas</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxHorasPorReserva" className="text-sm font-medium">Máximo Horas por Reserva</Label>
                <Input 
                  id="maxHorasPorReserva" 
                  name="maxHorasPorReserva" 
                  type="number" 
                  value={reglamento.maxHorasPorReserva} 
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    reglamento: { 
                      ...(prev.reglamento || {}), 
                      maxHorasPorReserva: parseInt(e.target.value) 
                    } 
                  }))} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxReservasPorDia" className="text-sm font-medium">Máximo Reservas por Día por Casa</Label>
                <Input 
                  id="maxReservasPorDia" 
                  name="maxReservasPorDia" 
                  type="number" 
                  value={reglamento.maxReservasPorDia} 
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    reglamento: { 
                      ...(prev.reglamento || {}), 
                      maxReservasPorDia: parseInt(e.target.value) 
                    } 
                  }))} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxReservasPorSemana" className="text-sm font-medium">Máximo Reservas por Semana</Label>
                <Input 
                  id="maxReservasPorSemana" 
                  name="maxReservasPorSemana" 
                  type="number" 
                  value={reglamento.maxReservasPorSemana} 
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    reglamento: { 
                      ...(prev.reglamento || {}), 
                      maxReservasPorSemana: parseInt(e.target.value) 
                    } 
                  }))} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxReservasPorMes" className="text-sm font-medium">Máximo Reservas por Mes</Label>
                <Input 
                  id="maxReservasPorMes" 
                  name="maxReservasPorMes" 
                  type="number" 
                  value={reglamento.maxReservasPorMes} 
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    reglamento: { 
                      ...(prev.reglamento || {}), 
                      maxReservasPorMes: parseInt(e.target.value) 
                    } 
                  }))} 
                />
              </div>
            </div>
          </div>
          
              {/* Configuración de Reservas */}
          <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700">Configuración de Reservas</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                    <Label htmlFor="antelacionMinima" className="text-sm font-medium">Reservar desde (días antes)</Label>
                <Input 
                  id="antelacionMinima" 
                  name="antelacionMinima" 
                  type="number" 
                      placeholder="1"
                  value={reglamento.antelacionMinima} 
                      onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      reglamento: { 
                        ...(prev.reglamento || {}), 
                          antelacionMinima: parseInt(e.target.value) 
                      } 
                      }))} 
                />
                    <p className="text-xs text-gray-500">Ej: 1 = reservar desde mañana</p>
              </div>
              <div className="space-y-2">
                    <Label htmlFor="ventanaReservas" className="text-sm font-medium">Mostrar calendario (días)</Label>
                <Input 
                  id="ventanaReservas" 
                  name="ventanaReservas" 
                  type="number" 
                      placeholder="30"
                  value={reglamento.antelacionMaxima} 
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    reglamento: { 
                      ...(prev.reglamento || {}), 
                      antelacionMaxima: parseInt(e.target.value) 
                    } 
                  }))} 
                />
                    <p className="text-xs text-gray-500">Ej: 30 = mostrar 30 días</p>
              </div>
              <div className="space-y-2">
                    <Label htmlFor="cancelacionHasta" className="text-sm font-medium">Cancelar hasta (horas antes)</Label>
                <Input 
                  id="cancelacionHasta" 
                  name="cancelacionHasta" 
                  type="number" 
                      placeholder="2"
                  value={reglamento.cancelacionMinima} 
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    reglamento: { 
                      ...(prev.reglamento || {}), 
                      cancelacionMinima: parseInt(e.target.value) 
                    } 
                  }))} 
                />
                    <p className="text-xs text-gray-500">Ej: 2 = cancelar hasta 2h antes</p>
              </div>
            </div>
          </div>
          
              {/* Tipo de Reservas */}
          <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700">Tipo de Reservas</h4>
            
            {/* Información de ayuda */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs text-blue-700 space-y-1">
                    <p><strong>Por Bloques:</strong> Horarios fijos basados en la duración máxima. Ej: bloques de 4 horas (8:00-12:00, 12:00-16:00, etc.)</p>
                    <p><strong>Con Traslapes:</strong> Horarios flexibles por hora. Permite múltiples reservas simultáneas según configuración.</p>
                    <p><strong>Horarios Fijos:</strong> Ventanas de tiempo específicas donde los usuarios eligen cuándo empezar. Ej: Mañana (9:00-12:00) y Tarde (15:00-20:00)</p>
              </div>
            </div>
            
            <div className="space-y-2">
                  <Label className="text-sm font-medium">Seleccionar Tipo</Label>
              <Select 
                value={reglamento.tipoReservas || 'bloques'} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  reglamento: { 
                    ...(prev.reglamento || {}), 
                        tipoReservas: value as 'bloques' | 'traslapes' | 'horarios_fijos',
                        // Automáticamente establecer permiteTraslapes basado en la selección
                        permiteTraslapes: value === 'traslapes'
                  } 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                      <SelectItem value="bloques">Por Bloques (horarios fijos)</SelectItem>
                      <SelectItem value="traslapes">Con Traslapes (horarios flexibles)</SelectItem>
                      <SelectItem value="horarios_fijos">Horarios Fijos (ventanas específicas)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
                {/* Información adicional para traslapes */}
            {reglamento.tipoReservas === 'traslapes' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-800">
                        ✅ Traslapes Automáticamente Habilitados
                      </span>
                    </div>
                    <p className="text-xs text-green-700 mt-2">
                      Al seleccionar "Con Traslapes", el sistema automáticamente permite que múltiples reservas se superpongan en tiempo según la configuración de "Reservas Simultáneas por Casa".
                    </p>
                  </div>
                )}
              </div>

              {/* Configuración de Horarios Fijos */}
              {reglamento.tipoReservas === 'horarios_fijos' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-800">
                      ⚙️ Configuración de Horarios Fijos
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    La configuración de ventanas de tiempo se encuentra en la pestaña <strong>"Horarios"</strong>. 
                    Allí podrás configurar las ventanas específicas por día de la semana.
                  </p>
                </div>
              )}

                            {/* Reservas Simultáneas */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700">Reservas Simultáneas por Casa</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="permiteReservasSimultaneas" className="text-sm font-medium">¿Permite Reservas Simultáneas?</Label>
                    <Select 
                      value={reglamento.permiteReservasSimultaneas ? "true" : "false"} 
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        reglamento: { 
                          ...(prev.reglamento || {}), 
                          permiteReservasSimultaneas: value === "true" 
                        } 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sí, múltiples casas pueden reservar</SelectItem>
                        <SelectItem value="false">No, solo una casa por horario</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {reglamento.permiteReservasSimultaneas && (
                    <div className="space-y-2">
                      <Label htmlFor="maxCasasSimultaneas" className="text-sm font-medium">Máximo Casas Simultáneas</Label>
                      <Input 
                        id="maxCasasSimultaneas" 
                        name="maxCasasSimultaneas" 
                        type="number" 
                        value={reglamento.maxCasasSimultaneas} 
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      reglamento: { 
                        ...(prev.reglamento || {}), 
                            maxCasasSimultaneas: parseInt(e.target.value) 
                      } 
                    }))}
                        placeholder="Ej: 5 para alberca"
                      />
              </div>
            )}
          </div>
              </div>
            </div>
          </TabsContent>

                      {/* Tab 3: Horarios */}
            <TabsContent value="horarios" className="space-y-6">
              {reglamento.tipoReservas === 'horarios_fijos' ? (
                // 🆕 UI SIMPLE PARA HORARIOS FIJOS
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-center gap-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      Configuración de Horarios Especiales
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Define los períodos donde los usuarios pueden hacer reservas
                    </p>
                  </div>

                  {/* Configuración Simple */}
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* Intervalos */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Frecuencia de Horarios</Label>
                      <Select 
                        value={(reglamento.intervalosDisponibles || 30).toString()} 
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          reglamento: { 
                            ...(prev.reglamento || {}), 
                            intervalosDisponibles: parseInt(value)
                          } 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">Cada hora (ej: 3:00, 4:00, 5:00)</SelectItem>
                          <SelectItem value="30">Cada 30 minutos</SelectItem>
                          <SelectItem value="15">Cada 15 minutos</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">Define cada cuánto tiempo se pueden hacer reservas</p>
                    </div>

                    {/* Configuración por Día */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Configuración por Día</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Aplicar configuración base a todos los días
                            const diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
                            const nuevasVentanas = diasSemana.map(dia => ({
                              dia,
                              ventanas: [{
                                nombre: 'Mañana',
                                inicio: '09:00',
                                fin: '12:00',
                                duracionMaxima: 3
                              }]
                            }));
                            setFormData(prev => ({ 
                              ...prev, 
                              reglamento: { 
                                ...(prev.reglamento || {}), 
                                ventanasHorariosFijos: nuevasVentanas
                              } 
                            }));
                            toast.success("Configuración base aplicada a todos los días");
                          }}
                        >
                          🚀 Aplicar a todos
                        </Button>
                      </div>

                      {/* Grid de días */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dia) => (
                          <div key={dia} className="border border-gray-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`disable-${dia}`}
                                  checked={!reglamento.diasSemanaDeshabilitados?.includes(dia)}
                                  onChange={(e) => {
                                    const diasDeshabilitados = [...(reglamento.diasSemanaDeshabilitados || [])];
                                    if (e.target.checked) {
                                      // Habilitar día - remover de la lista de deshabilitados
                                      const index = diasDeshabilitados.indexOf(dia);
                                      if (index > -1) {
                                        diasDeshabilitados.splice(index, 1);
                                      }
                                    } else {
                                      // Deshabilitar día - agregar a la lista
                                      if (!diasDeshabilitados.includes(dia)) {
                                        diasDeshabilitados.push(dia);
                                      }
                                    }
                                    setFormData(prev => ({ 
                                      ...prev, 
                                      reglamento: { 
                                        ...(prev.reglamento || {}), 
                                        diasSemanaDeshabilitados: diasDeshabilitados
                                      } 
                                    }));
                                  }}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <Label 
                                  htmlFor={`disable-${dia}`} 
                                  className={`text-sm font-medium capitalize ${!reglamento.diasSemanaDeshabilitados?.includes(dia) ? 'text-gray-800' : 'text-gray-400 line-through'}`}
                                >
                                  {dia}
                                </Label>
                              </div>
                              {!reglamento.diasSemanaDeshabilitados?.includes(dia) && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const diaActual = reglamento.ventanasHorariosFijos?.find(v => v.dia === dia);
                                    const ventanasActuales = diaActual?.ventanas || [];
                                                              const nuevasVentanas = [...ventanasActuales, {
                            nombre: `Horario ${ventanasActuales.length + 1}`,
                            inicio: '09:00',
                            fin: '12:00',
                            duracionMaxima: 3
                          }];
                                    
                                    const todasLasVentanas = [...(reglamento.ventanasHorariosFijos || [])];
                                    const indexDia = todasLasVentanas.findIndex(v => v.dia === dia);
                                    
                                    if (indexDia >= 0) {
                                      todasLasVentanas[indexDia] = { dia, ventanas: nuevasVentanas };
                                    } else {
                                      todasLasVentanas.push({ dia, ventanas: nuevasVentanas });
                                    }
                                    
                                    setFormData(prev => ({ 
                                      ...prev, 
                                      reglamento: { 
                                        ...(prev.reglamento || {}), 
                                        ventanasHorariosFijos: todasLasVentanas
                                      } 
                                    }));
                                  }}
                                >
                                                                  <Plus className="w-4 h-4 mr-1" />
                                Agregar Horario
                                </Button>
                              )}
                            </div>

                            {/* Horarios del día */}
                            {!reglamento.diasSemanaDeshabilitados?.includes(dia) && (
                              <div className="space-y-2">
                                {(reglamento.ventanasHorariosFijos?.find(v => v.dia === dia)?.ventanas || []).map((ventana, index) => (
                                <div key={index} className="border border-gray-100 rounded p-2 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Input 
                                      value={ventana.nombre} 
                                      onChange={(e) => {
                                        const todasLasVentanas = [...(reglamento.ventanasHorariosFijos || [])];
                                        const indexDia = todasLasVentanas.findIndex(v => v.dia === dia);
                                        if (indexDia >= 0) {
                                          const ventanasDia = [...todasLasVentanas[indexDia].ventanas];
                                          ventanasDia[index] = { ...ventana, nombre: e.target.value };
                                          todasLasVentanas[indexDia] = { ...todasLasVentanas[indexDia], ventanas: ventanasDia };
                                          setFormData(prev => ({ 
                                            ...prev, 
                                            reglamento: { 
                                              ...(prev.reglamento || {}), 
                                              ventanasHorariosFijos: todasLasVentanas
                                            } 
                                          }));
                                        }
                                      }}
                                      placeholder="Ej: Mañana"
                                      className="text-xs"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const todasLasVentanas = [...(reglamento.ventanasHorariosFijos || [])];
                                        const indexDia = todasLasVentanas.findIndex(v => v.dia === dia);
                                        if (indexDia >= 0) {
                                          const ventanasDia = todasLasVentanas[indexDia].ventanas.filter((_, i) => i !== index);
                                          if (ventanasDia.length === 0) {
                                            todasLasVentanas.splice(indexDia, 1);
                                          } else {
                                            todasLasVentanas[indexDia] = { ...todasLasVentanas[indexDia], ventanas: ventanasDia };
                                          }
                                          setFormData(prev => ({ 
                                            ...prev, 
                                            reglamento: { 
                                              ...(prev.reglamento || {}), 
                                              ventanasHorariosFijos: todasLasVentanas
                                            } 
                                          }));
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Inicio</Label>
                                      <Input 
                                        type="time"
                                        value={ventana.inicio} 
                                        onChange={(e) => {
                                          const todasLasVentanas = [...(reglamento.ventanasHorariosFijos || [])];
                                          const indexDia = todasLasVentanas.findIndex(v => v.dia === dia);
                                          if (indexDia >= 0) {
                                            const ventanasDia = [...todasLasVentanas[indexDia].ventanas];
                                            ventanasDia[index] = { ...ventana, inicio: e.target.value };
                                            todasLasVentanas[indexDia] = { ...todasLasVentanas[indexDia], ventanas: ventanasDia };
                                            setFormData(prev => ({ 
                                              ...prev, 
                                              reglamento: { 
                                                ...(prev.reglamento || {}), 
                                                ventanasHorariosFijos: todasLasVentanas
                                              } 
                                            }));
                                          }
                                        }}
                                        className="text-xs"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Fin</Label>
                                      <Input 
                                        type="time"
                                        value={ventana.fin} 
                                        onChange={(e) => {
                                          const todasLasVentanas = [...(reglamento.ventanasHorariosFijos || [])];
                                          const indexDia = todasLasVentanas.findIndex(v => v.dia === dia);
                                          if (indexDia >= 0) {
                                            const ventanasDia = [...todasLasVentanas[indexDia].ventanas];
                                            ventanasDia[index] = { ...ventana, fin: e.target.value };
                                            todasLasVentanas[indexDia] = { ...todasLasVentanas[indexDia], ventanas: ventanasDia };
                                            setFormData(prev => ({ 
                                              ...prev, 
                                              reglamento: { 
                                                ...(prev.reglamento || {}), 
                                                ventanasHorariosFijos: todasLasVentanas
                                              } 
                                            }));
                                          }
                                        }}
                                        className="text-xs"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Máx (h)</Label>
                                      <Input 
                                        type="number"
                                        value={ventana.duracionMaxima} 
                                        onChange={(e) => {
                                          const todasLasVentanas = [...(reglamento.ventanasHorariosFijos || [])];
                                          const indexDia = todasLasVentanas.findIndex(v => v.dia === dia);
                                          if (indexDia >= 0) {
                                            const ventanasDia = [...todasLasVentanas[indexDia].ventanas];
                                            ventanasDia[index] = { ...ventana, duracionMaxima: parseInt(e.target.value) || 1 };
                                            todasLasVentanas[indexDia] = { ...todasLasVentanas[indexDia], ventanas: ventanasDia };
                                            setFormData(prev => ({ 
                                              ...prev, 
                                              reglamento: { 
                                                ...(prev.reglamento || {}), 
                                                ventanasHorariosFijos: todasLasVentanas
                                              } 
                                            }));
                                          }
                                        }}
                                        min="1"
                                        max="24"
                                        className="text-xs"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                            {/* Mensaje cuando no hay horarios para este día */}
                            {!reglamento.diasSemanaDeshabilitados?.includes(dia) && (reglamento.ventanasHorariosFijos?.find(v => v.dia === dia)?.ventanas || []).length === 0 && (
                              <div className="text-center py-4 text-gray-400">
                                <p className="text-xs">Sin horarios</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Información de ayuda */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <div className="text-xs text-purple-700 space-y-1">
                        <p><strong>Ejemplo:</strong></p>
                        <p>• Mañana: 9:00 AM - 12:00 PM (hasta 3h)</p>
                        <p>• Tarde: 3:00 PM - 8:00 PM (hasta 5h)</p>
                        <p>• Los usuarios elegirán cuándo empezar dentro de cada período</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // UI ORIGINAL PARA HORARIOS NORMALES
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Horarios de Operación
                  </h3>

              {/* Horarios por Día - UI Individual Integrada */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-700">Horarios por Día</h4>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Aplicar horario base a todos los días
                        const horarioBase = { apertura: "08:00", cierre: "22:00" };
                        setFormData(prev => ({
                      ...prev, 
                      reglamento: { 
                        ...(prev.reglamento || {}), 
                        horarios: { 
                          ...(prev.reglamento?.horarios || {}), 
                              entreSemana: horarioBase,
                              finDeSemana: horarioBase,
                              diasDisponibles: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
                              individuales: {
                                lunes: horarioBase,
                                martes: horarioBase,
                                miercoles: horarioBase,
                                jueves: horarioBase,
                                viernes: horarioBase,
                                sabado: { apertura: "09:00", cierre: "23:00" },
                                domingo: { apertura: "09:00", cierre: "23:00" }
                              }
                            }
                          }
                        }));
                        toast.success("Horario base aplicado a todos los días");
                      }}
                      className="text-xs"
                    >
                      🚀 Aplicar a todos
                    </Button>
                  </div>
                </div>

                {/* Grid de Horarios por Día Individual */}
                <div className="space-y-3">
                  {/* Lunes */}
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-20 text-sm font-medium text-gray-700">Lunes</div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600">Apertura</Label>
                      <Select 
                        value={horariosSeguros.lunes.apertura} 
                        onValueChange={(value) => actualizarHorarioIndividual('lunes', 'apertura', value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {opcionesHora.map(opc => (
                        <SelectItem key={opc.valor} value={opc.valor}>
                          {opc.etiqueta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                    
                    <div className="text-gray-400">─</div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600">Cierre</Label>
                  <Select 
                        value={horariosSeguros.lunes.cierre} 
                        onValueChange={(value) => actualizarHorarioIndividual('lunes', 'cierre', value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {opcionesHora.map(opc => (
                            <SelectItem key={opc.valor} value={opc.valor}>
                              {opc.etiqueta}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="lunes-deshabilitado"
                          checked={reglamento.diasSemanaDeshabilitados?.includes('lunes') || false}
                          onChange={(e) => {
                            const diasActuales = reglamento.diasSemanaDeshabilitados || [];
                            let nuevosDias;
                            
                            if (e.target.checked) {
                              nuevosDias = [...diasActuales, 'lunes'];
                            } else {
                              nuevosDias = diasActuales.filter(d => d !== 'lunes');
                            }
                            
                            setFormData(prev => ({
                      ...prev, 
                      reglamento: { 
                        ...(prev.reglamento || {}), 
                                diasSemanaDeshabilitados: nuevosDias
                              }
                            }));
                          }}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <Label htmlFor="lunes-deshabilitado" className="text-xs text-red-600 cursor-pointer">
                          Deshabilitar
                        </Label>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${reglamento.diasSemanaDeshabilitados?.includes('lunes') ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    </div>
                  </div>

                  {/* Martes */}
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-20 text-sm font-medium text-gray-700">Martes</div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600">Apertura</Label>
                      <Select 
                        value={horariosSeguros.martes.apertura} 
                        onValueChange={(value) => actualizarHorarioIndividual('martes', 'apertura', value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {opcionesHora.map(opc => (
                        <SelectItem key={opc.valor} value={opc.valor}>
                          {opc.etiqueta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
            </div>
            
                    <div className="text-gray-400">─</div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600">Cierre</Label>
                  <Select 
                        value={horariosSeguros.martes.cierre} 
                        onValueChange={(value) => actualizarHorarioIndividual('martes', 'cierre', value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {opcionesHora.map(opc => (
                            <SelectItem key={opc.valor} value={opc.valor}>
                              {opc.etiqueta}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="martes-deshabilitado"
                          checked={reglamento.diasSemanaDeshabilitados?.includes('martes') || false}
                          onChange={(e) => {
                            const diasActuales = reglamento.diasSemanaDeshabilitados || [];
                            let nuevosDias;
                            
                            if (e.target.checked) {
                              nuevosDias = [...diasActuales, 'martes'];
                            } else {
                              nuevosDias = diasActuales.filter(d => d !== 'martes');
                            }
                            
                            setFormData(prev => ({
                      ...prev, 
                      reglamento: { 
                        ...(prev.reglamento || {}), 
                                diasSemanaDeshabilitados: nuevosDias
                              }
                            }));
                          }}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <Label htmlFor="martes-deshabilitado" className="text-xs text-red-600 cursor-pointer">
                          Deshabilitar
                        </Label>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${reglamento.diasSemanaDeshabilitados?.includes('martes') ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    </div>
                  </div>

                  {/* Miércoles */}
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-20 text-sm font-medium text-gray-700">Miércoles</div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600">Apertura</Label>
                      <Select 
                        value={horariosSeguros.miercoles.apertura} 
                        onValueChange={(value) => actualizarHorarioIndividual('miercoles', 'apertura', value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {opcionesHora.map(opc => (
                        <SelectItem key={opc.valor} value={opc.valor}>
                          {opc.etiqueta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                    
                    <div className="text-gray-400">─</div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600">Cierre</Label>
                  <Select 
                        value={horariosSeguros.miercoles.cierre} 
                        onValueChange={(value) => actualizarHorarioIndividual('miercoles', 'cierre', value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {opcionesHora.map(opc => (
                            <SelectItem key={opc.valor} value={opc.valor}>
                              {opc.etiqueta}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="miercoles-deshabilitado"
                          checked={reglamento.diasSemanaDeshabilitados?.includes('miercoles') || false}
                          onChange={(e) => {
                            const diasActuales = reglamento.diasSemanaDeshabilitados || [];
                            let nuevosDias;
                            
                            if (e.target.checked) {
                              nuevosDias = [...diasActuales, 'miercoles'];
                            } else {
                              nuevosDias = diasActuales.filter(d => d !== 'miercoles');
                            }
                            
                            setFormData(prev => ({
                      ...prev, 
                      reglamento: { 
                        ...(prev.reglamento || {}), 
                                diasSemanaDeshabilitados: nuevosDias
                              }
                            }));
                          }}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <Label htmlFor="miercoles-deshabilitado" className="text-xs text-red-600 cursor-pointer">
                          Deshabilitar
                        </Label>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${reglamento.diasSemanaDeshabilitados?.includes('miercoles') ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    </div>
                  </div>

                  {/* Jueves */}
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-20 text-sm font-medium text-gray-700">Jueves</div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600">Apertura</Label>
                      <Select 
                        value={horariosSeguros.jueves.apertura} 
                        onValueChange={(value) => actualizarHorarioIndividual('jueves', 'apertura', value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {opcionesHora.map(opc => (
                        <SelectItem key={opc.valor} value={opc.valor}>
                          {opc.etiqueta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
          </div>
          
                    <div className="text-gray-400">─</div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600">Cierre</Label>
                <Select 
                        value={horariosSeguros.jueves.cierre} 
                        onValueChange={(value) => actualizarHorarioIndividual('jueves', 'cierre', value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                          {opcionesHora.map(opc => (
                            <SelectItem key={opc.valor} value={opc.valor}>
                              {opc.etiqueta}
                            </SelectItem>
                          ))}
                  </SelectContent>
                </Select>
              </div>
              
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="jueves-deshabilitado"
                          checked={reglamento.diasSemanaDeshabilitados?.includes('jueves') || false}
                          onChange={(e) => {
                            const diasActuales = reglamento.diasSemanaDeshabilitados || [];
                            let nuevosDias;
                            
                            if (e.target.checked) {
                              nuevosDias = [...diasActuales, 'jueves'];
                            } else {
                              nuevosDias = diasActuales.filter(d => d !== 'jueves');
                            }
                            
                            setFormData(prev => ({
                      ...prev, 
                      reglamento: { 
                        ...(prev.reglamento || {}), 
                                diasSemanaDeshabilitados: nuevosDias
                      } 
                            }));
                          }}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                        <Label htmlFor="jueves-deshabilitado" className="text-xs text-red-600 cursor-pointer">
                          Deshabilitar
                        </Label>
                </div>
                      <div className={`w-2 h-2 rounded-full ${reglamento.diasSemanaDeshabilitados?.includes('jueves') ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        </div>
          </div>
          
                  {/* Viernes */}
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-20 text-sm font-medium text-gray-700">Viernes</div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600">Apertura</Label>
                      <Select 
                        value={horariosSeguros.viernes.apertura} 
                        onValueChange={(value) => actualizarHorarioIndividual('viernes', 'apertura', value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {opcionesHora.map(opc => (
                            <SelectItem key={opc.valor} value={opc.valor}>
                              {opc.etiqueta}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="text-gray-400">─</div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600">Cierre</Label>
                      <Select 
                        value={horariosSeguros.viernes.cierre} 
                        onValueChange={(value) => actualizarHorarioIndividual('viernes', 'cierre', value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {opcionesHora.map(opc => (
                            <SelectItem key={opc.valor} value={opc.valor}>
                              {opc.etiqueta}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="viernes-deshabilitado"
                          checked={reglamento.diasSemanaDeshabilitados?.includes('viernes') || false}
                          onChange={(e) => {
                            const diasActuales = reglamento.diasSemanaDeshabilitados || [];
                            let nuevosDias;
                            
                            if (e.target.checked) {
                              nuevosDias = [...diasActuales, 'viernes'];
                            } else {
                              nuevosDias = diasActuales.filter(d => d !== 'viernes');
                            }
                            
                    setFormData(prev => ({
                      ...prev,
                      reglamento: {
                        ...(prev.reglamento || {}),
                                diasSemanaDeshabilitados: nuevosDias
                      }
                    }));
                          }}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <Label htmlFor="viernes-deshabilitado" className="text-xs text-red-600 cursor-pointer">
                          Deshabilitar
                        </Label>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${reglamento.diasSemanaDeshabilitados?.includes('viernes') ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    </div>
                  </div>

                  {/* Sábado */}
                  <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="w-20 text-sm font-medium text-blue-700">Sábado</div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-blue-600">Apertura</Label>
                      <Select 
                        value={horariosSeguros.sabado.apertura} 
                        onValueChange={(value) => actualizarHorarioIndividual('sabado', 'apertura', value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {opcionesHora.map(opc => (
                            <SelectItem key={opc.valor} value={opc.valor}>
                              {opc.etiqueta}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
            </div>
            
                    <div className="text-blue-400">─</div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-blue-600">Cierre</Label>
                      <Select 
                        value={horariosSeguros.sabado.cierre} 
                        onValueChange={(value) => actualizarHorarioIndividual('sabado', 'cierre', value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {opcionesHora.map(opc => (
                            <SelectItem key={opc.valor} value={opc.valor}>
                              {opc.etiqueta}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>
                    
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                          id="sabado-deshabilitado"
                          checked={reglamento.diasSemanaDeshabilitados?.includes('sabado') || false}
                            onChange={(e) => {
                              const diasActuales = reglamento.diasSemanaDeshabilitados || [];
                              let nuevosDias;
                              
                              if (e.target.checked) {
                              nuevosDias = [...diasActuales, 'sabado'];
                              } else {
                              nuevosDias = diasActuales.filter(d => d !== 'sabado');
                              }
                              
                              setFormData(prev => ({
                                ...prev,
                                reglamento: {
                                  ...(prev.reglamento || {}),
                                  diasSemanaDeshabilitados: nuevosDias
                                }
                              }));
                            }}
                          className="rounded border-blue-300 text-red-600 focus:ring-red-500"
                          />
                        <Label htmlFor="sabado-deshabilitado" className="text-xs text-red-600 cursor-pointer">
                          Deshabilitar
                          </Label>
                        </div>
                      <div className={`w-2 h-2 rounded-full ${reglamento.diasSemanaDeshabilitados?.includes('sabado') ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  </div>
                </div>

                  {/* Domingo */}
                  <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="w-20 text-sm font-medium text-blue-700">Domingo</div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-blue-600">Apertura</Label>
                      <Select 
                        value={horariosSeguros.domingo.apertura} 
                        onValueChange={(value) => actualizarHorarioIndividual('domingo', 'apertura', value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {opcionesHora.map(opc => (
                            <SelectItem key={opc.valor} value={opc.valor}>
                              {opc.etiqueta}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                  </div>
                    
                    <div className="text-blue-400">─</div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-blue-600">Cierre</Label>
                      <Select 
                        value={horariosSeguros.domingo.cierre} 
                        onValueChange={(value) => actualizarHorarioIndividual('domingo', 'cierre', value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {opcionesHora.map(opc => (
                            <SelectItem key={opc.valor} value={opc.valor}>
                              {opc.etiqueta}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="domingo-deshabilitado"
                          checked={reglamento.diasSemanaDeshabilitados?.includes('domingo') || false}
                          onChange={(e) => {
                            const diasActuales = reglamento.diasSemanaDeshabilitados || [];
                            let nuevosDias;
                            
                            if (e.target.checked) {
                              nuevosDias = [...diasActuales, 'domingo'];
                            } else {
                              nuevosDias = diasActuales.filter(d => d !== 'domingo');
                            }
                            
                              setFormData(prev => ({
                                ...prev,
                                reglamento: {
                                  ...(prev.reglamento || {}),
                                diasSemanaDeshabilitados: nuevosDias
                                }
                              }));
                          }}
                          className="rounded border-blue-300 text-red-600 focus:ring-red-500"
                        />
                        <Label htmlFor="domingo-deshabilitado" className="text-xs text-red-600 cursor-pointer">
                          Deshabilitar
                        </Label>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${reglamento.diasSemanaDeshabilitados?.includes('domingo') ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    </div>
                  </div>
                </div>
                


                {/* Información de Ayuda */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-xs text-gray-600 space-y-2">
                    <p><strong>💡 Consejo:</strong> Cada día tiene su propio horario independiente configurable.</p>
                    <p><strong>🚀 Aplicar a todos:</strong> Establece el mismo horario base para todos los días de la semana.</p>
                    <p><strong>🔴 Deshabilitar:</strong> Marca días específicos como no disponibles para reservas.</p>
                    <p><strong>✅ Días Activos:</strong> Muestran solo el horario de apertura y cierre.</p>
                    <p><strong>🖱️ Click en día:</strong> Haz clic en cualquier día activo para ver sus bloques de horarios.</p>
                    <p><strong>📋 Ver Bloques:</strong> Usa el botón azul para ver todos los bloques de horarios disponibles.</p>
                  </div>
                </div>
          </div>
            </div>
                )}
          </TabsContent>

          {/* Tab 4: Preview del Calendario */}
          <TabsContent value="preview" className="space-y-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-600" />
                Preview del Calendario
              </h3>

              {/* Preview del Calendario */}
                <div className="space-y-4">
                                  <div className="flex items-center gap-2">
                  <h4 className="text-md font-medium text-gray-700">📅 Vista Previa del Calendario</h4>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-4 text-xs" side="bottom" align="start">
                      <div className="text-blue-600 space-y-2">
                        <p><strong>📅 Vista Previa Realista:</strong> Esta simulación muestra exactamente cómo se verá el calendario para los usuarios finales.</p>
                        <p><strong>◀️ ▶️ Navegación:</strong> Use las flechas para navegar entre meses y ver cómo afecta la ventana de reservas.</p>
                        <p><strong>🔄 Botón "Hoy":</strong> Regresa rápidamente al mes actual para ver el estado presente.</p>
                        <p><strong>🔴 Ya Pasó:</strong> Días anteriores a hoy están bloqueados automáticamente.</p>
                        <p><strong>🟠 Muy Pronto:</strong> Días que aún no se pueden reservar según antelación mínima ({reglamento.antelacionMinima || 0} días).</p>
                        <p><strong>🟣 Fuera Ventana:</strong> Días fuera del rango de reservas permitido ({reglamento.antelacionMaxima || 30} días máximo).</p>
                        <p><strong>⚫ Cerrado:</strong> Días deshabilitados por configuración de horarios.</p>
                        <p><strong>🟢 Disponible:</strong> Días que los usuarios pueden reservar efectivamente.</p>
                        <p><strong>🟡 Desactivado:</strong> Días desactivados manualmente (click derecho para alternar).</p>
                        <p><strong>🖱️ Click Izquierdo:</strong> En días disponibles (verdes) para ver bloques de horarios.</p>
                        <p><strong>🖱️ Click Derecho:</strong> En días disponibles para desactivarlos, en días desactivados para reactivarlos.</p>
                        <p><strong>💾 Persistencia:</strong> Los días desactivados se guardan automáticamente y se mantienen al cerrar/abrir.</p>
                        <p><strong>🔄 Tiempo Real:</strong> Los cambios en configuración se reflejan inmediatamente en esta vista.</p>
                      </div>
                    </PopoverContent>
                  </Popover>
                  </div>
                  
                {/* Indicador discreto de funcionalidad */}
                <div className="flex items-center justify-center">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-500">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    <span>Click derecho en días para desactivar/reactivar</span>
                      </div>
                      </div>
                  <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  {/* Header del calendario con navegación */}
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={irMesAnterior}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-3">
                      <h5 className="text-lg font-semibold text-gray-800">
                        {obtenerMesActual()} {obtenerAñoActual()}
                      </h5>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={irMesActual}
                        className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        title="Volver al mes actual"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Hoy
                      </Button>
                  </div>
                  
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={irMesSiguiente}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    </div>
                    
                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
                        <div key={dia} className="text-center text-xs font-medium text-gray-500 p-2">
                          {dia}
                        </div>
                      ))}
                    </div>
                    
                    {/* Días del mes */}
                    <div className="grid grid-cols-7 gap-2">
                      {obtenerDiasDelMes().map((dia, index) => {
                        if (dia.numero === null) {
                          return <div key={index} className="h-32"></div>;
                        }
                        
                        const estaDeshabilitado = dia.estaDeshabilitado;
                        const horario = dia.horario;
                      const estado = dia.estado;
                        const bloques = calcularBloquesDelDia(horario, reglamento.maxHorasPorReserva);
                      
                      // Estilos y contenido según el estado
                      let estilosClase = '';
                      let icono = '';
                      let etiqueta = '';
                      let titulo = '';
                      let colorTexto = '';
                      
                      switch (estado) {
                        case 'pasado':
                          estilosClase = 'bg-red-50 border-red-200 hover:bg-red-100';
                          icono = '🚫';
                          etiqueta = 'Pasó';
                          titulo = 'Este día ya pasó';
                          colorTexto = 'text-red-400';
                          break;
                        case 'desactivado_especifico':
                          estilosClase = 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100';
                          icono = '🚧';
                          etiqueta = 'Desactivado';
                          titulo = 'Día desactivado manualmente (click derecho para reactivar)';
                          colorTexto = 'text-yellow-600';
                          break;
                        case 'muy_temprano':
                          estilosClase = 'bg-orange-50 border-orange-200 hover:bg-orange-100';
                          icono = '⏳';
                          etiqueta = 'Muy pronto';
                          titulo = `No se puede reservar hasta ${reglamento.antelacionMinima} día(s) antes`;
                          colorTexto = 'text-orange-400';
                          break;
                        case 'fuera_ventana':
                          estilosClase = 'bg-purple-50 border-purple-200 hover:bg-purple-100';
                          icono = '📅';
                          etiqueta = 'Fuera ventana';
                          titulo = `Fuera de la ventana de reservas (${reglamento.antelacionMaxima} días)`;
                          colorTexto = 'text-purple-400';
                          break;
                        case 'cerrado':
                          estilosClase = 'bg-gray-100 border-gray-200 hover:bg-gray-200';
                          icono = '❌';
                          etiqueta = 'Cerrado';
                          titulo = 'Día cerrado por configuración';
                          colorTexto = 'text-gray-400';
                          break;
                        case 'disponible':
                        default:
                          estilosClase = 'bg-green-50 border-green-200 hover:bg-green-100';
                          icono = '✅';
                          etiqueta = 'Disponible';
                          titulo = `Horarios de ${dia.diaSemana} (click derecho para desactivar)`;
                          colorTexto = 'text-green-700';
                          break;
                      }
                        
                        return (
                          <div 
                            key={index} 
                          className={`h-32 border rounded-lg p-2 transition-all hover:shadow-md overflow-hidden relative flex flex-col cursor-pointer ${estilosClase}`}
                            onClick={() => {
                              if (!estaDeshabilitado) {
                                // Mostrar modal con bloques del día específico
                                const bloques = calcularBloquesDelDia(horario, reglamento.maxHorasPorReserva);
                                setSelectedDay({
                                  numero: dia.numero,
                                  diaSemana: dia.diaSemana,
                                  horario: horario,
                                  bloques: bloques
                                });
                                setShowBloquesModal(true);
                              }
                            }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            // Solo permitir desactivar/reactivar días que no hayan pasado
                            if (estado !== 'pasado') {
                              alternarDiaEspecifico(dia.fecha);
                            }
                          }}
                          title={titulo}
                          >
                            {/* Número del día */}
                          <div className={`text-sm font-bold text-center mb-2 flex-shrink-0 ${colorTexto}`}>
                              {dia.numero}
                            </div>
                            
                            {estaDeshabilitado ? (
                              <div className="text-center flex-shrink-0">
                              <div className="text-lg mb-1">{icono}</div>
                              <div className={`text-xs font-medium ${colorTexto}`}>{etiqueta}</div>
                              </div>
                            ) : (
                              <div className="text-center">
                              {/* Ícono de disponible */}
                              <div className="text-xs mb-1">{icono}</div>
                              {/* Horario de apertura y cierre */}
                                <div className="text-xs text-green-600 font-medium">
                                  {formatearHora12(horario.apertura)}
                                </div>
                                <div className="text-xs text-green-500">─</div>
                                <div className="text-xs text-green-600 font-medium">
                                  {formatearHora12(horario.cierre)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Leyenda */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
                      <span className="text-green-700">✅ Disponible</span>
                      </div>
                      <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-50 border border-yellow-300 rounded"></div>
                      <span className="text-yellow-600">🚧 Desactivado</span>
                      </div>
                      <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
                      <span className="text-red-600">🚫 Ya Pasó</span>
                      </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-50 border border-orange-200 rounded"></div>
                      <span className="text-orange-600">⏳ Muy Pronto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-2 bg-purple-50 border border-purple-200 rounded"></div>
                      <span className="text-purple-600">📅 Fuera Ventana</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                      <span className="text-gray-500">❌ Cerrado</span>
                  </div>
                </div>

                  {/* Indicador discreto adicional en la leyenda */}
                  <div className="flex items-center justify-center mt-3">
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <span>💡</span>
                      <span>Días disponibles: click izquierdo para bloques, click derecho para desactivar</span>
                  </div>
                </div>
          </div>
            </div>

                
          </div>
          </TabsContent>

          {/* Tab 5: Avanzado */}
          <TabsContent value="avanzado" className="space-y-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Configuraciones Avanzadas
              </h3>
          
          {/* Invitados y Aprobación */}
          <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700">Invitados y Aprobación</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="permiteInvitados" className="text-sm font-medium">¿Permite Invitados?</Label>
                <Select 
                  value={reglamento.permiteInvitados ? "true" : "false"} 
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    reglamento: { 
                      ...(prev.reglamento || {}), 
                      permiteInvitados: value === "true" 
                    } 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sí, permite invitados</SelectItem>
                    <SelectItem value="false">No, solo residentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="requiereAprobacion" className="text-sm font-medium">¿Requiere Aprobación?</Label>
                <Select 
                  value={reglamento.requiereAprobacion ? "true" : "false"} 
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    reglamento: { 
                      ...(prev.reglamento || {}), 
                      requiereAprobacion: value === "true" 
                    } 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Sí, requiere aprobación</SelectItem>
                    <SelectItem value="false">No, aprobación automática</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {reglamento.permiteInvitados && (
              <div className="space-y-2">
                <Label htmlFor="maxInvitados" className="text-sm font-medium">Máximo Personas por Casa</Label>
                <Input 
                  id="maxInvitados" 
                  name="maxInvitados" 
                  type="number" 
                  value={reglamento.maxInvitados} 
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    reglamento: { 
                      ...(prev.reglamento || {}), 
                      maxInvitados: parseInt(e.target.value) 
                    } 
                  }))} 
                  placeholder="Ej: 6"
                />
                <p className="text-xs text-gray-500">
                  Número total de personas por reserva (incluye al residente + invitados)
                </p>
              </div>
            )}
          </div>

              {/* Botón para restaurar valores recomendados */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700">Configuración Rápida</h4>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    ¿No estás seguro de qué configurar? Usa estos valores recomendados:
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        reglamento: {
                          ...(prev.reglamento || {}),
                          maxHorasPorReserva: 4,
                          maxReservasPorDia: 1,
                          maxReservasPorSemana: 3,
                          maxReservasPorMes: 10,
                          antelacionMinima: 1,
                          antelacionMaxima: 30,
                          cancelacionMinima: 2,
                          permiteInvitados: true,
                          maxInvitados: 10,
                          requiereAprobacion: false,
                          permiteReservasSimultaneas: false,
                          maxCasasSimultaneas: 1,
                          diasDesactivadosEspecificos: [], // Inicializar array vacío
                          tipoReservas: 'bloques',
                          permiteTraslapes: false,
                          horarios: {
                            entreSemana: { apertura: "08:00", cierre: "22:00" },
                            finDeSemana: { apertura: "09:00", cierre: "23:00" },
                            diasDisponibles: ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"],
                            individuales: {
                              lunes: { apertura: "08:00", cierre: "22:00" },
                              martes: { apertura: "08:00", cierre: "22:00" },
                              miercoles: { apertura: "08:00", cierre: "22:00" },
                              jueves: { apertura: "08:00", cierre: "22:00" },
                              viernes: { apertura: "08:00", cierre: "22:00" },
                              sabado: { apertura: "09:00", cierre: "23:00" },
                              domingo: { apertura: "09:00", cierre: "23:00" }
                            }
                          }
                        }
                      }));
                      toast.success("Valores recomendados aplicados");
                    }}
                    className="w-full"
                  >
                    🚀 Aplicar Configuración Recomendada
                  </Button>
        </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
                </div>

      {/* Modal de Bloques del Día - Compacto */}
      {showBloquesModal && selectedDay && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4" 
          style={{ margin: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowBloquesModal(false);
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-auto border border-gray-200 overflow-hidden" style={{ maxHeight: '90vh' }}>
            {/* Header compacto */}
            <div className="bg-blue-500 text-white p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                  <div>
                  <span className="font-medium text-sm">
                      {selectedDay.diaSemana.charAt(0).toUpperCase() + selectedDay.diaSemana.slice(1)} {selectedDay.numero}
                  </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBloquesModal(false)}
                className="h-6 w-6 p-0 hover:bg-white hover:bg-opacity-20 text-white"
                >
                <X className="h-3 w-3" />
                </Button>
            </div>
            
            {/* Contenido compacto */}
            <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 60px)' }}>
              {/* Horario */}
              <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                <div className="text-sm font-medium text-green-700">
                    {formatearHora12(selectedDay.horario.apertura)} - {formatearHora12(selectedDay.horario.cierre)}
                  </div>
                <div className="text-xs text-green-600">
                  Bloques de {reglamento.maxHorasPorReserva}h
                </div>
              </div>
              
              {/* Bloques compactos */}
                {selectedDay.bloques.length > 0 ? (
                <div className="space-y-2">
                    {selectedDay.bloques.map((bloque, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                              {idx + 1}
                            </div>
                        <span className="text-sm text-blue-800">
                                {formatearHora12(bloque.inicio)} - {formatearHora12(bloque.fin)}
                        </span>
                              </div>
                      <span className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded">
                        Libre
                      </span>
                      </div>
                    ))}
                  </div>
                ) : (
                <div className="text-center p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="text-gray-400 text-sm">⚠️ Sin bloques</div>
                  <div className="text-xs text-gray-500">Revisa duración/horarios</div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
      
      <DialogFooter>
        <Button variant="outline" onClick={() => { console.log('[DialogFooter-EditarCrear] Botón Cancelar clickeado'); setOpenDialog(false); }}>Cancelar</Button>
        <Button 
          onClick={() => {
            // 🆕 NUEVO: Asegurar que todos los horarios individuales estén completos antes de guardar
            asegurarHorariosCompletos();
            handleSubmit();
          }} 
          disabled={loading || (!currentArea && userClaims?.isGlobalAdmin && !esAdminDeResidencial && !selectedResidencialId)}
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default AreaComunFormDialogContent; 