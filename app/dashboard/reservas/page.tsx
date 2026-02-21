"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import {
  CalendarIcon,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MapPin,
  Calendar as CalendarIcon2,
  DollarSign,
  Eye,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Key,
  Trash,
  History
} from 'lucide-react';
import { ReservationAuditHistory } from '@/components/dashboard/ReservationAuditHistory';
import { format, addDays, isWithinInterval, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import type { DateRange } from 'react-day-picker';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  doc,
  onSnapshot
} from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';


interface Reservation {
  id: string;
  areaName: string;
  areaId?: string; // 🆕 ID del área común
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  duracion: string;
  personas: number;
  precio: number;
  status: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada' | 'en_curso' | 'finalizada';
  userName: string;
  userEmail: string;
  userId: string;
  residencialId: string;
  residencialNombre: string;
  userDomicilio: string;
  createdAt: Date;
  canceladaPor?: string;
  canceladaEn?: Date;
  motivoCancelacion?: string;
  isMoroso?: boolean;

  // 🗝️ NUEVO: Campos para sistema de llaves
  estadoLlaves?: 'pendiente' | 'entregadas' | 'recibidas' | 'retraso';
  fechaEntregaLlaves?: Date;
  entregadoPor?: string;
  fechaRecepcionLlaves?: Date;
  recibidoPor?: string;
  fechaLimiteDevolucion?: Date;
  // 🆕 NUEVO: Campos para reservas híbridas
  tipoReserva?: 'gratuita' | 'pago';
  canceladaPorReservaPago?: boolean;
}



const statusColors = {
  pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  aprobada: 'bg-green-100 text-green-800 border-green-300',
  rechazada: 'bg-red-100 text-red-800 border-red-300',
  cancelada: 'bg-gray-100 text-gray-800 border-gray-300',
  'en_curso': 'bg-blue-100 text-blue-800 border-blue-300',
  finalizada: 'bg-purple-100 text-purple-800 border-purple-300',
};

const statusLabels = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
  'en_curso': 'En Curso',
  finalizada: 'Finalizada',
};

// 🗝️ NUEVO: Etiquetas para el estado de las llaves
const keysStatusLabels = {
  pendiente: 'Pendiente',
  entregadas: 'Entregadas',
  recibidas: 'Recibidas',
  retraso: 'En Retraso',
};

// 🗝️ NUEVO: Colores para el estado de las llaves
const keysStatusColors = {
  pendiente: 'bg-gray-100 text-gray-800 border-gray-300',
  entregadas: 'bg-blue-100 text-blue-800 border-blue-300',
  recibidas: 'bg-green-100 text-green-800 border-green-300',
  retraso: 'bg-red-100 text-red-800 border-red-300',
};

// 🆕 FUNCIONES HELPER para calcular estados (similar a Flutter)
const isToday = (date: Date): boolean => {
  const today = new Date();
  return isSameDay(date, today);
};

const isUpcoming = (date: Date): boolean => {
  const now = new Date();
  return date > now;
};

const isActive = (date: Date, duracion: number): boolean => {
  const now = new Date();
  const endTime = new Date(date.getTime() + duracion * 60 * 60 * 1000);
  return now >= date && now <= endTime;
};

const isCompleted = (date: Date, duracion: number): boolean => {
  const now = new Date();
  const endTime = new Date(date.getTime() + duracion * 60 * 60 * 1000);
  return now > endTime;
};

const isAccessOpen = (date: Date, duracion: number): boolean => {
  const now = new Date();
  const startTime = new Date(date.getTime() - 15 * 60 * 1000); // 15 min antes
  const endTime = new Date(date.getTime() + duracion * 60 * 60 * 1000);
  return now >= startTime && now <= endTime;
};

// 🆕 FUNCIÓN para obtener el estado visual de acceso
const getAccessStatusText = (reservation: Reservation): string => {
  if (isAccessOpen(reservation.fecha, parseInt(reservation.duracion))) {
    return 'Acceso Abierto';
  } else if (reservation.status === 'en_curso') {
    return 'En curso';
  } else if (reservation.status === 'finalizada') {
    return 'Finalizada';
  } else if (isCompleted(reservation.fecha, parseInt(reservation.duracion))) {
    return 'Completada';
  } else if (isActive(reservation.fecha, parseInt(reservation.duracion))) {
    return 'Pendiente';
  } else if (isUpcoming(reservation.fecha)) {
    return 'Programada';
  } else {
    return 'Finalizada';
  }
};

// 🆕 FUNCIÓN para obtener el color del estado de acceso
const getAccessStatusColor = (reservation: Reservation): string => {
  if (isAccessOpen(reservation.fecha, parseInt(reservation.duracion))) {
    return 'bg-green-100 text-green-800 border-green-300';
  } else if (reservation.status === 'en_curso') {
    return 'bg-blue-100 text-blue-800 border-blue-300';
  } else if (reservation.status === 'finalizada') {
    return 'bg-purple-100 text-purple-800 border-purple-300';
  } else if (isCompleted(reservation.fecha, parseInt(reservation.duracion))) {
    return 'bg-gray-100 text-gray-800 border-gray-300';
  } else if (isActive(reservation.fecha, parseInt(reservation.duracion))) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  } else if (isUpcoming(reservation.fecha)) {
    return 'bg-blue-100 text-blue-800 border-blue-300';
  } else {
    return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// 🆕 NUEVO: Función para obtener texto descriptivo del estado de las llaves
const getKeysStatusDescription = (reservation: Reservation): string => {
  if (!reservation.estadoLlaves) {
    return 'Sin estado de llaves';
  }

  switch (reservation.estadoLlaves) {
    case 'pendiente':
      return 'Pendiente de entrega';
    case 'entregadas':
      if (reservation.status === 'finalizada') {
        return 'Entregadas (pendiente recepción)';
      }
      return 'Entregadas';
    case 'recibidas':
      return 'Recibidas (completado)';
    case 'retraso':
      return 'En retraso';
    default:
      return 'Estado desconocido';
  }
};

export default function ReservasPage() {
  const { user, userClaims } = useAuth();
  const { toast } = useToast();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [areas, setAreas] = useState<string[]>([]);
  const [residenciales, setResidenciales] = useState<{ id: string, nombre: string }[]>([]);
  const [residencialFilter, setResidencialFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'month'>('month');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreReservations, setHasMoreReservations] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [monthDate, setMonthDate] = useState<Date>(new Date());
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<Date | null>(null);
  const [modalAreaFilter, setModalAreaFilter] = useState<string | null>(null);
  const [modalAreas, setModalAreas] = useState<string[]>([]);
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());
  const [modalStatusFilter, setModalStatusFilter] = useState<'all' | 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada'>('all');
  const [modalSearch, setModalSearch] = useState('');
  const [hideEmptyBlocks, setHideEmptyBlocks] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [residencialDocIdCache, setResidencialDocIdCache] = useState<Record<string, string>>({});
  // Mantener IDs que se están actualizando para mostrar spinner y evitar cierres accidentales
  const [updatingReservationIds, setUpdatingReservationIds] = useState<Set<string>>(new Set());

  // 🆕 NUEVO: Estado para las pestañas
  const [activeTab, setActiveTab] = useState<'hoy' | 'proximas' | 'completadas' | 'todas'>('hoy');

  // 🗑️ Diálogo y objetivo de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // 🔍 DEBUG: Log después de que todas las variables estén declaradas
  console.log('🔍 [DEBUG] ReservasPage renderizando...', {
    dayDialogOpen,
    modalAreaFilter,
    modalStatusFilter,
    modalAreas: modalAreas.length,
    reservationsCount: reservations.length,
    isRealtimeActive
  });

  // 🔓 Asegurar que el scroll no queda bloqueado por portales o modales
  const unlockScroll = () => {
    try {
      const html = document.documentElement;
      const body = document.body;
      html.style.overflow = '';
      body.style.overflow = '';
      body.style.position = '';
      body.style.width = '';
      const ariaHiddenOverlays = document.querySelectorAll('[aria-hidden="true"]');
      ariaHiddenOverlays.forEach((el: Element) => {
        (el as HTMLElement).style.pointerEvents = '';
      });
    } catch (e) {
      // noop en SSR
    }
  };

  useEffect(() => {
    // si ningún diálogo está abierto, liberar scroll y limpiar overlays
    if (!dayDialogOpen && !rejectDialogOpen && !deleteDialogOpen) {
      unlockScroll();
      try {
        const portals = document.querySelectorAll('[data-radix-portal]');
        portals.forEach((p) => {
          if (p.parentElement === document.body && p.childElementCount === 0) {
            document.body.removeChild(p);
          }
        });
      } catch (_) { /* noop */ }
    }
  }, [dayDialogOpen, rejectDialogOpen, deleteDialogOpen]);

  // 🆕 DEBUG: Monitorear estado del diálogo de eliminación
  useEffect(() => {
    console.log('🔍 [DEBUG] Estado del diálogo de eliminación actualizado:', {
      deleteDialogOpen,
      deleteTargetId,
      timestamp: new Date().toISOString()
    });
  }, [deleteDialogOpen, deleteTargetId]);

  const resolveResidencialDocId = async (rawId: string): Promise<string> => {
    if (residencialDocIdCache[rawId]) return residencialDocIdCache[rawId];
    try {
      // 1) Buscar por campos 'codigo' o 'codigoAlfa' (preferido)
      const residencialesRef = collection(db, 'residenciales');
      const byCodigo = await getDocs(query(residencialesRef, where('codigo', '==', rawId)));
      if (!byCodigo.empty) {
        const docId = byCodigo.docs[0].id;
        setResidencialDocIdCache(prev => ({ ...prev, [rawId]: docId }));
        return docId;
      }
      const byCodigoAlfa = await getDocs(query(residencialesRef, where('codigoAlfa', '==', rawId)));
      if (!byCodigoAlfa.empty) {
        const docId = byCodigoAlfa.docs[0].id;
        setResidencialDocIdCache(prev => ({ ...prev, [rawId]: docId }));
        return docId;
      }
      // 1b) Otros posibles campos usados en docs
      const byResidencialID = await getDocs(query(residencialesRef, where('residencialID', '==', rawId)));
      if (!byResidencialID.empty) {
        const docId = byResidencialID.docs[0].id;
        setResidencialDocIdCache(prev => ({ ...prev, [rawId]: docId }));
        return docId;
      }
      const byResidencialId = await getDocs(query(residencialesRef, where('residencialId', '==', rawId)));
      if (!byResidencialId.empty) {
        const docId = byResidencialId.docs[0].id;
        setResidencialDocIdCache(prev => ({ ...prev, [rawId]: docId }));
        return docId;
      }
      const byCodigoResidencial = await getDocs(query(residencialesRef, where('codigoResidencial', '==', rawId)));
      if (!byCodigoResidencial.empty) {
        const docId = byCodigoResidencial.docs[0].id;
        setResidencialDocIdCache(prev => ({ ...prev, [rawId]: docId }));
        return docId;
      }
      const byShortCode = await getDocs(query(residencialesRef, where('shortCode', '==', rawId)));
      if (!byShortCode.empty) {
        const docId = byShortCode.docs[0].id;
        setResidencialDocIdCache(prev => ({ ...prev, [rawId]: docId }));
        return docId;
      }
      // 2) Intentar usar como docId directo (fallback)
      const directRef = doc(db, 'residenciales', rawId);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        setResidencialDocIdCache(prev => ({ ...prev, [rawId]: rawId }));
        return rawId;
      }
    } catch (e) {
      console.error('❌ [ReservasPage] Error resolviendo residencialDocId para', rawId, e);
    }
    // Fallback a rawId (puede no existir)
    return rawId;
  };

  // Función para procesar datos de reservas (usada por el listener en tiempo real)
  const processReservationsData = async (rawReservations: any[]) => {
    console.log('🔄 [ReservasPage] Procesando datos de reservas optimizado:', rawReservations.length);
    console.log('🔍 [DEBUG] processReservationsData - Estado actual:', {
      dayDialogOpen,
      reservationsCount: reservations.length,
      loading
    });

    try {
      setLoading(true);

      // 🚀 OPTIMIZACIÓN: Extraer IDs únicos para consultas en lote
      const userIds = Array.from(new Set(rawReservations.map(r => r.userId).filter(Boolean)));
      const residencialIds = Array.from(new Set(rawReservations.map(r => r.residencialId || userClaims?.residencialId).filter(Boolean)));

      console.log('📊 [ReservasPage] IDs únicos:', { userIds: userIds.length, residencialIds: residencialIds.length });

      // 🚀 CONSULTAS EN LOTE: Cargar todos los usuarios y residenciales de una vez
      const [usersData, residencialesData] = await Promise.all([
        // Cargar usuarios en lotes de 10 (límite de Firestore para 'in')
        Promise.all(
          Array.from({ length: Math.ceil(userIds.length / 10) }, (_, i) =>
            userIds.slice(i * 10, (i + 1) * 10)
          ).map(async (batch) => {
            if (batch.length === 0) return [];
            const usersRef = collection(db, 'usuarios');
            const usersQuery = query(usersRef, where('__name__', 'in', batch));
            const usersSnapshot = await getDocs(usersQuery);
            return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          })
        ).then(results => results.flat()),

        // Cargar residenciales
        Promise.all(
          residencialIds.map(async (id) => {
            try {
              const residencialRef = doc(db, 'residenciales', id);
              const residencialSnapshot = await getDoc(residencialRef);
              return residencialSnapshot.exists()
                ? { id: residencialSnapshot.id, ...residencialSnapshot.data() }
                : null;
            } catch (error) {
              console.warn('⚠️ Error cargando residencial:', id, error);
              return null;
            }
          })
        ).then(results => results.filter(Boolean))
      ]);

      // 🔍 Crear mapas para acceso rápido
      const usersMap = new Map(usersData.map((user: any) => [user.id, user]));
      const residencialesMap = new Map(residencialesData.filter((res): res is any => res !== null).map((res: any) => [res.id, res]));

      console.log('✅ [ReservasPage] Datos cargados:', { usuarios: usersMap.size, residenciales: residencialesMap.size });

      const reservationsData: Reservation[] = [];

      for (const data of rawReservations) {
        console.log('🔍 [ReservasPage] Procesando reserva en tiempo real:', {
          id: data.id,
          data: {
            ...data,
            fecha: data.fecha?.toDate(),
            createdAt: data.createdAt?.toDate()
          }
        });

        // 🚀 OPTIMIZACIÓN: Obtener información del usuario desde el mapa precargado
        let userName = 'Usuario sin nombre';
        let userEmail = data.userEmail || 'Sin email';
        let userDomicilio = 'Sin domicilio';
        let userIsMoroso = false;

        const userData = usersMap.get(data.userId) as any;

        if (userData) {
          // Construir nombre completo con fullName + apellidos
          let nombreCompleto = '';
          if (userData.fullName) {
            if (userData.paternalLastName && userData.maternalLastName) {
              nombreCompleto = `${userData.fullName} ${userData.paternalLastName} ${userData.maternalLastName}`;
            } else if (userData.paternalLastName) {
              nombreCompleto = `${userData.fullName} ${userData.paternalLastName}`;
            } else if (userData.maternalLastName) {
              nombreCompleto = `${userData.fullName} ${userData.maternalLastName}`;
            } else {
              nombreCompleto = userData.fullName;
            }
          }

          // Intentar obtener el nombre de múltiples campos
          const possibleNames = [
            nombreCompleto,
            userData.fullName,
            userData.nombre,
            userData.displayName,
            userData.firstName,
            userData.lastName,
            userData.name,
            userData.paternalLastName && userData.maternalLastName
              ? `${userData.paternalLastName} ${userData.maternalLastName}`
              : userData.paternalLastName || userData.maternalLastName,
            userData.email?.split('@')[0],
            data.userEmail?.split('@')[0]
          ].filter(name => name && name.trim() !== '');

          // Si encontramos un nombre real (no del email), usarlo
          const realName = possibleNames.find(name =>
            name &&
            name !== data.userEmail?.split('@')[0] &&
            name !== userData.email?.split('@')[0]
          );

          userName = realName || possibleNames[0] || 'Usuario sin nombre';
          userEmail = userData.email || data.userEmail || 'Sin email';
          userIsMoroso = Boolean((userData as any)?.isMoroso);

          // Obtener domicilio del usuario
          if (userData.calle && userData.houseNumber) {
            userDomicilio = `${userData.calle} ${userData.houseNumber}`;
          } else if (userData.calle) {
            userDomicilio = userData.calle;
          } else if (userData.houseNumber) {
            userDomicilio = `Casa ${userData.houseNumber}`;
          } else if (userData.houseID) {
            userDomicilio = `Casa ${userData.houseID}`;
          }
        } else {
          userName = data.userEmail?.split('@')[0] || 'Usuario sin nombre';
        }

        // 🚀 OPTIMIZACIÓN: Obtener información del residencial desde el mapa precargado
        let residencialNombre = 'Residencial sin nombre';
        const residencialData = residencialesMap.get(data.residencialId || userClaims?.residencialId) as any;

        if (residencialData) {
          residencialNombre = residencialData.nombre || residencialData.displayName || 'Residencial sin nombre';
        }

        // Procesar el horario
        let horaInicio = '';
        let horaFin = '';

        if (data.horario) {
          const horarioStr = data.horario;
          if (horarioStr.includes(' - ')) {
            const [inicio, fin] = horarioStr.split(' - ');
            horaInicio = inicio.trim();
            horaFin = fin.trim();
          } else {
            horaInicio = horarioStr;
            const duracion = data.duracion || 2;

            const horaInicioDate = new Date(`2000-01-01 ${horarioStr}`);
            if (!isNaN(horaInicioDate.getTime())) {
              const horaFinDate = new Date(horaInicioDate.getTime() + (duracion * 60 * 60 * 1000));
              horaFin = horaFinDate.toLocaleTimeString('es-ES', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
            } else {
              horaFin = `${duracion}h después`;
            }
          }
        } else {
          horaInicio = data.horaInicio || '';
          horaFin = data.horaFin || '';
        }

        const reservationData: Reservation = {
          id: data.id,
          areaName: data.areaName || 'Área sin nombre',
          areaId: data.areaId, // 🆕 ID del área común
          fecha: data.fecha?.toDate() || new Date(),
          horaInicio: horaInicio,
          horaFin: horaFin,
          duracion: data.duracion || '2',
          personas: data.personas || 1,
          precio: data.precio || 0,
          status: data.status || 'pendiente',
          userName: userName,
          userEmail: userEmail,
          userId: data.userId,
          residencialId: data.residencialId || userClaims?.residencialId,
          residencialNombre: residencialNombre,
          userDomicilio: userDomicilio,
          createdAt: data.createdAt?.toDate() || new Date(),
          canceladaPor: data.canceladaPor,
          canceladaEn: data.canceladaEn?.toDate(),
          motivoCancelacion: data.motivoCancelacion,
          isMoroso: typeof (userIsMoroso) === 'boolean' ? userIsMoroso : false,

          // 🗝️ NUEVO: Campos para sistema de llaves
          estadoLlaves: data.estadoLlaves,
          fechaEntregaLlaves: data.fechaEntregaLlaves?.toDate(),
          entregadoPor: data.entregadoPor,
          fechaRecepcionLlaves: data.fechaRecepcionLlaves?.toDate(),
          recibidoPor: data.recibidoPor,
          fechaLimiteDevolucion: data.fechaLimiteDevolucion?.toDate(),
          // 🆕 NUEVO: Campos para reservas híbridas
          tipoReserva: data.tipoReserva,
          canceladaPorReservaPago: data.canceladaPorReservaPago,
        };

        reservationsData.push(reservationData);
      }

      console.log('✅ [ReservasPage] Reservas procesadas en tiempo real:', reservationsData.length);
      console.log('🔍 [DEBUG] processReservationsData completado exitosamente');
      setReservations(reservationsData);
      setDebugInfo(`Actualizadas ${reservationsData.length} reservas en tiempo real`);

    } catch (error) {
      console.error('❌ [ReservasPage] Error procesando reservas en tiempo real:', error);
      toast({
        title: "Error",
        description: "Error al procesar las reservas en tiempo real",
        variant: "destructive",
      });
    } finally {
      console.log('🔍 [DEBUG] processReservationsData finalizando, setLoading(false)');
      setLoading(false);
    }
  };

  // Cargar reservas y áreas
  useEffect(() => {
    console.log('🔄 [ReservasPage] useEffect ejecutado');
    console.log('🔄 [ReservasPage] user:', user?.uid);
    console.log('🔍 [ReservasPage] claims:', userClaims);
    // Evitar ejecutar hasta que las claims estén listas (null/undefined)
    if (userClaims == null) {
      console.log('⏸️ [ReservasPage] claims no listas aún, difiriendo carga de áreas');
      return;
    }
    loadAreas();
    loadResidenciales();
  }, [user, userClaims]);

  // Listener en tiempo real para reservas
  useEffect(() => {
    if (!user) return;

    console.log('🔴 [ReservasPage] Configurando listener en tiempo real');

    const residencialId = userClaims?.residencialId || 'global';
    let unsubscribe: (() => void) | undefined;

    if (residencialId === 'global') {
      // Para admin global, escuchar cambios en todos los residenciales
      console.log('🌍 [ReservasPage] Configurando listener global para todos los residenciales');

      // Crear un listener compuesto para todos los residenciales
      const unsubscribeFunctions: (() => void)[] = [];

      // Listener principal para detectar cambios en la colección de residenciales
      const residencialesRef = collection(db, 'residenciales');
      const residencialesUnsubscribe = onSnapshot(residencialesRef, async (residencialesSnapshot) => {
        console.log('🔄 [ReservasPage] Cambio detectado en residenciales, reconfigurando listeners...');
        console.log(`🏢 [ReservasPage] Residenciales encontrados: ${residencialesSnapshot.docs.length}`);

        // Limpiar listeners anteriores
        unsubscribeFunctions.forEach(unsub => unsub());
        unsubscribeFunctions.length = 0;

        // Configurar nuevos listeners para cada residencial
        for (const residencialDoc of residencialesSnapshot.docs) {
          console.log(`🔴 [ReservasPage] Configurando listener para residencial: ${residencialDoc.id}`);
          const reservationsRef = collection(db, 'residenciales', residencialDoc.id, 'reservaciones');
          const reservationsQuery = query(reservationsRef, orderBy('fecha', 'desc'));

          const unsubscribe = onSnapshot(reservationsQuery, (snapshot) => {
            console.log(`🔄 [ReservasPage] Cambio detectado en reservas del residencial: ${residencialDoc.id}`);
            console.log(`📊 [ReservasPage] Nuevas reservas: ${snapshot.docs.length}`);
            console.log('🔍 [DEBUG] Listener ejecutándose, llamando a loadReservations...');
            // ⚠️ OPTIMIZACIÓN: Solo actualizar si el modal no está abierto para evitar conflictos
            if (!dayDialogOpen) {
              setIsRealtimeActive(true);
              loadReservations(); // Recargar todas las reservas cuando hay cambios

              // Resetear el indicador después de un tiempo
              setTimeout(() => setIsRealtimeActive(false), 2000);
            } else {
              console.log('🔍 [DEBUG] Modal abierto, omitiendo actualización automática para evitar conflictos');
            }
          }, (error) => {
            console.error(`❌ [ReservasPage] Error en listener del residencial ${residencialDoc.id}:`, error);
          });

          unsubscribeFunctions.push(unsubscribe);
        }

        console.log(`✅ [ReservasPage] Listeners configurados para ${unsubscribeFunctions.length} residenciales`);
      }, (error) => {
        console.error('❌ [ReservasPage] Error en listener de residenciales:', error);
      });

      unsubscribe = () => {
        residencialesUnsubscribe();
        unsubscribeFunctions.forEach(unsub => unsub());
      };

    } else {
      // Para admin de residencial específico, escuchar solo ese residencial
      console.log(`🏢 [ReservasPage] Configurando listener para residencial: ${residencialId}`);
      (async () => {
        const targetDocId = await resolveResidencialDocId(residencialId);
        const reservationsRef = collection(db, 'residenciales', targetDocId, 'reservaciones');
        // Listener sin orderBy para evitar problemas de campo/índices y asegurar datos
        unsubscribe = onSnapshot(reservationsRef, async (snapshot) => {
          console.log(`🔄 [ReservasPage] Cambio detectado en reservas del residencial: ${targetDocId}`);
          console.log(`📊 [ReservasPage] Nuevas reservas: ${snapshot.docs.length}`);
          setIsRealtimeActive(true);
          let sourceDocs = snapshot.docs;
          if (sourceDocs.length === 0) {
            try {
              const debugSnap = await getDocs(reservationsRef);
              console.log('🧪 [ReservasPage] Debug fetch directo sin orderBy, docs:', debugSnap.size);
              sourceDocs = debugSnap.docs;
            } catch (e) {
              console.error('❌ [ReservasPage] Error en debug fetch de reservaciones:', e);
            }
          }

          const reservationsData = sourceDocs.map(docSnap => ({
            ...docSnap.data(),
            id: docSnap.id,
            residencialId: targetDocId
          }));
          processReservationsData(reservationsData);
          setTimeout(() => setIsRealtimeActive(false), 2000);
        }, (error) => {
          console.error('❌ [ReservasPage] Error en listener del residencial:', error);
        });
      })();
    }

    // Cleanup function
    return () => {
      if (unsubscribe) {
        console.log('🔴 [ReservasPage] Desconectando listener en tiempo real');
        unsubscribe();
      }
    };
  }, [user, userClaims]);

  const loadReservations = async () => {
    console.log('🔍 [ReservasPage] loadReservations iniciado (carga manual)');
    console.log('🔍 [DEBUG] loadReservations - Estado actual:', {
      user: !!user,
      userClaims: !!userClaims,
      residencialId: userClaims?.residencialId,
      dayDialogOpen,
      reservationsCount: reservations.length
    });

    if (!user) {
      console.log('❌ [ReservasPage] No hay user');
      return;
    }

    const residencialIdRaw = userClaims?.residencialId || 'global';
    console.log('🏢 [ReservasPage] Usando residencialId (raw):', residencialIdRaw);

    try {
      setLoading(true);

      let rawReservations: any[] = [];

      if (residencialIdRaw === 'global') {
        console.log('🌍 [ReservasPage] Admin global - cargando todas las reservas');
        const residencialesRef = collection(db, 'residenciales');
        const residencialesSnapshot = await getDocs(residencialesRef);

        for (const residencialDoc of residencialesSnapshot.docs) {
          const reservationsRef = collection(db, 'residenciales', residencialDoc.id, 'reservaciones');
          // 🚀 OPTIMIZACIÓN: Limitar la carga inicial a las 100 reservas más recientes por residencial
          const reservationsQuery = query(reservationsRef, orderBy('fecha', 'desc'), limit(100));
          const residencialSnapshot = await getDocs(reservationsQuery);

          residencialSnapshot.docs.forEach(doc => {
            rawReservations.push({
              ...doc.data(),
              id: doc.id,
              residencialId: residencialDoc.id,
              residencialNombre: residencialDoc.data().nombre || residencialDoc.id
            });
          });
        }

        rawReservations.sort((a, b) => {
          const dateA = a.fecha?.toDate?.() || new Date(a.fecha);
          const dateB = b.fecha?.toDate?.() || new Date(b.fecha);
          return dateB.getTime() - dateA.getTime();
        });

      } else {
        const targetDocId = await resolveResidencialDocId(residencialIdRaw);
        console.log('🏢 [ReservasPage] Resolvido residencialDocId:', { raw: residencialIdRaw, docId: targetDocId });
        const reservationsRef = collection(db, 'residenciales', targetDocId, 'reservaciones');
        // 🚀 OPTIMIZACIÓN: Cargar solo las 200 reservas más recientes inicialmente
        const reservationsQuery = query(reservationsRef, orderBy('fecha', 'desc'), limit(200));
        const snapshot = await getDocs(reservationsQuery);

        rawReservations = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          residencialId: targetDocId
        }));
      }

      await processReservationsData(rawReservations);

    } catch (error) {
      console.error('❌ [ReservasPage] Error loading reservations:', error);
      toast({
        title: "Error",
        description: "Error al cargar las reservas",
        variant: "destructive",
      });
    }
  };

  const loadAreas = async (overrideResidencialId?: string | 'all') => {
    // Asegurar que claims estén disponibles, salvo que se fuerce por override
    if (!overrideResidencialId && !userClaims) {
      console.log('⏸️ [ReservasPage] loadAreas abortado: claims no disponibles');
      return;
    }

    const isGlobalAdmin = userClaims?.isGlobalAdmin === true;
    // Para admin de residencial: su claim puede traer código (p.ej. S9G7TL). Resolver a docId real.
    const rawResidencial = overrideResidencialId ?? (isGlobalAdmin ? 'global' : (userClaims!.residencialId as string));
    const residencialId = (rawResidencial && rawResidencial !== 'global' && rawResidencial !== 'all')
      ? await resolveResidencialDocId(rawResidencial)
      : rawResidencial;
    console.log('🏢 [ReservasPage] loadAreas - residencialId usado:', residencialId);

    // Admin global: puede ser "all" o un ID específico
    if (isGlobalAdmin && (residencialId === 'all' || residencialId === 'global')) {
      try {
        const residencialesRef = collection(db, 'residenciales');
        const residencialesSnapshot = await getDocs(residencialesRef);
        const allAreas: string[] = [];
        for (const residencialDoc of residencialesSnapshot.docs) {
          const areasRef = collection(db, 'residenciales', residencialDoc.id, 'areas');
          const areasSnapshot = await getDocs(areasRef);
          const areasData = areasSnapshot.docs.map(doc => doc.data().nombre || 'Sin nombre');
          allAreas.push(...areasData);
        }
        const unique = Array.from(new Set(allAreas));
        setAreas(unique);
        // reset área si ya no aplica
        setAreaFilter(prev => (prev === 'all' || unique.includes(prev) ? prev : 'all'));
        console.log('✅ [ReservasPage] Áreas cargadas (global all):', unique.length);
      } catch (error) {
        console.error('❌ [ReservasPage] Error cargando áreas (global all):', error);
      }
      return;
    }

    try {
      const targetResidencialRaw = isGlobalAdmin ? residencialId : (userClaims!.residencialId as string);
      const targetResidencial = (targetResidencialRaw && targetResidencialRaw !== 'global' && targetResidencialRaw !== 'all')
        ? await resolveResidencialDocId(targetResidencialRaw)
        : targetResidencialRaw;
      if (!targetResidencial || typeof targetResidencial !== 'string') {
        console.warn('⏭️ [ReservasPage] targetResidencial inválido, omitiendo carga de áreas');
        return;
      }
      const areasRef = collection(db, 'residenciales', targetResidencial, 'areas');
      const snapshot = await getDocs(areasRef);
      const areasData = snapshot.docs.map(doc => doc.data().nombre || 'Sin nombre');
      const unique = Array.from(new Set(areasData));
      setAreas(unique);
      setAreaFilter(prev => (prev === 'all' || unique.includes(prev) ? prev : 'all'));
      console.log('✅ [ReservasPage] Áreas cargadas para residencial específico:', targetResidencial, unique.length);
    } catch (error) {
      console.error('Error loading areas:', error);
    }
  };

  const loadResidenciales = async () => {
    console.log('🏢 [ReservasPage] loadResidenciales iniciado');

    try {
      const residencialesRef = collection(db, 'residenciales');
      const residencialesSnapshot = await getDocs(residencialesRef);
      const residencialesData = residencialesSnapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().nombre || doc.data().displayName || doc.id
      }));

      setResidenciales(residencialesData);
      console.log('✅ [ReservasPage] Residenciales cargados:', residencialesData.length);
    } catch (error) {
      console.error('❌ [ReservasPage] Error cargando residenciales:', error);
    }
  };

  // Si es admin global, actualizar áreas cuando cambia el filtro de residencial
  useEffect(() => {
    if (userClaims?.residencialId === 'global') {
      loadAreas(residencialFilter !== 'all' ? residencialFilter : 'all');
    }
  }, [residencialFilter, userClaims?.residencialId]);

  // Eliminado: la vista ahora deriva bloques directamente de las reservas del día

  // Filtrar reservas
  const filteredReservations = useMemo(() => {
    let filtered = reservations.filter(reservation => {
      // Filtro por búsqueda
      const searchMatch =
        reservation.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.areaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.id.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por estado
      const statusMatch = statusFilter === 'all' || reservation.status === statusFilter;

      // Filtro por área
      const areaMatch = areaFilter === 'all' || reservation.areaName === areaFilter;

      // Filtro por residencial (si admin global)
      const isGlobalAdmin = userClaims?.residencialId === 'global';
      const residencialMatch = !isGlobalAdmin || residencialFilter === 'all' || reservation.residencialId === residencialFilter;

      // Filtro por fecha
      let dateMatch = true;
      if (dateRange.from && dateRange.to) {
        dateMatch = isWithinInterval(reservation.fecha, {
          start: startOfDay(dateRange.from),
          end: endOfDay(dateRange.to)
        });
      }

      return searchMatch && statusMatch && areaMatch && residencialMatch && dateMatch;
    });

    // 🆕 NUEVO: Filtrado por pestañas (similar a Flutter)
    switch (activeTab) {
      case 'hoy':
        filtered = filtered.filter(r => isToday(r.fecha));
        break;
      case 'proximas':
        filtered = filtered.filter(r => isUpcoming(r.fecha) || isActive(r.fecha, parseInt(r.duracion)));
        break;
      case 'completadas':
        filtered = filtered.filter(r => isCompleted(r.fecha, parseInt(r.duracion)) || r.status === 'finalizada');
        break;
      case 'todas':
        // No aplicamos filtros adicionales por fecha/estado
        break;
    }

    // 🆕 DEBUG: Log para identificar discrepancias
    if (activeTab === 'completadas') {
      console.log('🔍 [DEBUG] Reservaciones en pestaña Completadas:');
      filtered.forEach(r => {
        console.log(`  - ID: ${r.id}`);
        console.log(`    Status: ${r.status}`);
        console.log(`    EstadoLlaves: ${r.estadoLlaves}`);
        console.log(`    Fecha: ${r.fecha}`);
        console.log(`    isCompleted: ${isCompleted(r.fecha, parseInt(r.duracion))}`);
        console.log(`    ---`);
      });
    }

    return filtered;
  }, [reservations, searchTerm, statusFilter, areaFilter, residencialFilter, dateRange, userClaims?.residencialId, activeTab]);

  // Orden ascendente para la tabla: por día y luego por hora de inicio
  const sortedTableReservations = useMemo(() => {
    const list = [...filteredReservations];
    const toMinutes = (timeStr?: string | null): number => {
      if (!timeStr) return 0;
      const trimmed = String(timeStr).trim();
      const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/);
      if (ampmMatch) {
        let hours = parseInt(ampmMatch[1], 10);
        const minutes = parseInt(ampmMatch[2], 10);
        const ampm = ampmMatch[3]?.toLowerCase();
        if (ampm) {
          if (ampm === 'pm' && hours < 12) hours += 12;
          if (ampm === 'am' && hours === 12) hours = 0;
        }
        return hours * 60 + minutes;
      }
      const d = new Date(`2000-01-01 ${trimmed}`);
      if (!isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes();
      return 0;
    };
    list.sort((a, b) => {
      const dayA = startOfDay(a.fecha).getTime();
      const dayB = startOfDay(b.fecha).getTime();
      if (dayA !== dayB) return dayA - dayB;
      return toMinutes(a.horaInicio) - toMinutes(b.horaInicio);
    });
    return list;
  }, [filteredReservations]);

  // Paginación
  const totalPages = Math.ceil(sortedTableReservations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReservations = sortedTableReservations.slice(startIndex, startIndex + itemsPerPage);

  // --------------------
  // Helpers Calendario Día
  // --------------------
  const parseTimeToMinutes = (timeStr?: string | null): number | null => {
    if (!timeStr) return null;
    const trimmed = String(timeStr).trim();
    // Admite formatos: "HH:mm", "H:mm", "h:mm AM/PM", "h:mmam"
    const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/);
    if (!ampmMatch) {
      // Intento con Date parsing como fallback
      const d = new Date(`2000-01-01 ${trimmed}`);
      if (!isNaN(d.getTime())) {
        return d.getHours() * 60 + d.getMinutes();
      }
      return null;
    }
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const ampm = ampmMatch[3]?.toLowerCase();
    if (ampm) {
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
    }
    return hours * 60 + minutes;
  };

  const dayReservations = useMemo(() => {
    // Tomamos las reservas ya filtradas y solo las del día seleccionado
    const dayList = filteredReservations.filter(r => isSameDay(r.fecha, selectedDate));
    // Agrupar por área
    const uniqueAreas = Array.from(new Set(dayList.map(r => r.areaName)));
    return { dayList, uniqueAreas };
  }, [filteredReservations, selectedDate]);

  // Formato 12h para mostrar horas (2:05 PM)
  const formatTime12 = (timeStr?: string | null) => {
    if (!timeStr) return '';
    const mins = parseTimeToMinutes(timeStr);
    if (mins == null) return timeStr;
    const hours24 = Math.floor(mins / 60);
    const minutes = mins % 60;
    const am = hours24 < 12;
    const hours12 = ((hours24 + 11) % 12) + 1; // 0->12, 13->1
    const mm = String(minutes).padStart(2, '0');
    return `${hours12}:${mm} ${am ? 'AM' : 'PM'}`;
  };

  // Agrupación por día (clave yyyy-MM-dd) para la vista mensual
  const reservationsByDay = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of filteredReservations) {
      const key = format(startOfDay(r.fecha), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }, [filteredReservations]);

  const openDayDialog = (date: Date) => {
    setDialogDate(date);
    // Derivar áreas presentes ese día para inicializar filtro
    const key = format(startOfDay(date), 'yyyy-MM-dd');
    const list = reservationsByDay.get(key) || [];
    const areas = Array.from(new Set(list.map(r => r.areaName)));
    setModalAreas(areas);
    setModalAreaFilter(areas[0] || null);
    setModalStatusFilter('all');
    setModalSearch('');
    setHideEmptyBlocks(true);
    setSelectedIds(new Set());
    setCollapsedBlocks(new Set());
    setDayDialogOpen(true);
  };

  const goToToday = () => setSelectedDate(new Date());
  const goToPrevDay = () => setSelectedDate(prev => addDays(prev, -1));
  const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1));

  // Actualizar estado de reserva
  const updateReservationStatus = async (reservationId: string, newStatus: string, reason?: string) => {
    console.log('🔍 [DEBUG] updateReservationStatus iniciado:', { reservationId, newStatus, reason });
    try {
      // Marcar como actualizando para este ID
      setUpdatingReservationIds(prev => {
        const next = new Set(prev);
        next.add(reservationId);
        return next;
      });
      // Encontrar la reserva
      const reservation = reservations.find(r => r.id === reservationId);
      if (!reservation) {
        console.log('❌ [DEBUG] Reserva no encontrada:', reservationId);
        return;
      }

      console.log('✅ [DEBUG] Reserva encontrada:', {
        id: reservation.id,
        currentStatus: reservation.status,
        newStatus,
        residencialId: reservation.residencialId,
        userId: reservation.userId
      });

      // Actualizar en ambos lugares
      const batch = writeBatch(db);

      // 1. En el residencial
      const residentialRef = doc(db, 'residenciales', reservation.residencialId, 'reservaciones', reservationId);

      // 2. En el usuario
      const userRef = doc(db, 'usuarios', reservation.userId, 'reservaciones', reservationId);

      const updateData: any = {
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: user?.uid,
      };
      if (newStatus === 'rechazada' && reason) {
        updateData.motivoCancelacion = reason;
      }

      console.log('📝 [DEBUG] Actualizando Firestore con datos:', updateData);

      batch.update(residentialRef, updateData);
      batch.update(userRef, updateData);

      // 🆕 Si se está aprobando una reserva de pago, cancelar automáticamente las reservas gratuitas del mismo día
      console.log('🔍 [CANCELACION] Verificando condiciones:', {
        newStatus,
        tipoReserva: reservation.tipoReserva,
        tipoReservaTipo: typeof reservation.tipoReserva,
        areaId: reservation.areaId,
        esAprobada: newStatus === 'aprobada',
        esPago: reservation.tipoReserva === 'pago',
        tieneAreaId: !!reservation.areaId,
        reservaCompleta: {
          id: reservation.id,
          areaName: reservation.areaName,
          areaId: reservation.areaId,
          tipoReserva: reservation.tipoReserva,
          status: reservation.status,
          fecha: reservation.fecha?.toString()
        }
      });

      if (newStatus === 'aprobada' && reservation.tipoReserva === 'pago' && reservation.areaId) {
        console.log('🔄 [CANCELACION] ✅ Condiciones cumplidas - Aprobando reserva de pago, buscando reservas gratuitas del mismo día para cancelar...');
        console.log('🔄 [CANCELACION] Datos de la reserva:', {
          areaId: reservation.areaId,
          residencialId: reservation.residencialId,
          fecha: reservation.fecha,
          tipoReserva: reservation.tipoReserva
        });

        try {
          // Obtener el inicio y fin del día de la reserva
          const reservationDate = reservation.fecha instanceof Date ? reservation.fecha : new Date(reservation.fecha);
          const startOfReservationDay = startOfDay(reservationDate);
          const endOfReservationDay = endOfDay(reservationDate);

          console.log('📅 [CANCELACION] Fechas calculadas:', {
            reservationDate: reservationDate.toISOString(),
            startOfReservationDay: startOfReservationDay.toISOString(),
            endOfReservationDay: endOfReservationDay.toISOString()
          });

          // Buscar todas las reservas del mismo día para el mismo área
          const sameDayReservationsRef = collection(db, 'residenciales', reservation.residencialId, 'reservaciones');
          const sameDayQuery = query(
            sameDayReservationsRef,
            where('areaId', '==', reservation.areaId),
            where('fecha', '>=', Timestamp.fromDate(startOfReservationDay)),
            where('fecha', '<=', Timestamp.fromDate(endOfReservationDay)),
            where('status', 'in', ['pendiente', 'aprobada'])
          );

          console.log('🔍 [CANCELACION] Consulta Firestore:', {
            residencialId: reservation.residencialId,
            areaId: reservation.areaId,
            fechaInicio: startOfReservationDay.toISOString(),
            fechaFin: endOfReservationDay.toISOString(),
            statuses: ['pendiente', 'aprobada']
          });

          const sameDaySnapshot = await getDocs(sameDayQuery);
          const freeReservationsToCancel: string[] = [];

          console.log(`🔄 [CANCELACION] Total de reservas encontradas del mismo día: ${sameDaySnapshot.docs.length}`);

          sameDaySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`🔍 [CANCELACION] Revisando reserva ${doc.id}:`, {
              id: doc.id,
              tipoReserva: data.tipoReserva,
              status: data.status,
              fecha: data.fecha?.toDate?.() || data.fecha,
              areaId: data.areaId,
              esGratuita: data.tipoReserva === 'gratuita',
              noEsLaActual: doc.id !== reservationId
            });

            // Cancelar solo las reservas gratuitas (no la que se está aprobando)
            if (data.tipoReserva === 'gratuita' && doc.id !== reservationId) {
              freeReservationsToCancel.push(doc.id);
              console.log(`✅ [CANCELACION] Reserva gratuita ${doc.id} agregada a la lista de cancelación`);
            }
          });

          console.log(`🔄 [CANCELACION] Encontradas ${freeReservationsToCancel.length} reservas gratuitas para cancelar`);

          // Cancelar las reservas gratuitas encontradas
          for (const freeReservationId of freeReservationsToCancel) {
            const freeReservationDoc = sameDaySnapshot.docs.find(d => d.id === freeReservationId);
            if (!freeReservationDoc) continue;

            const freeReservationData = freeReservationDoc.data();

            // Actualizar en el residencial
            const freeResidentialRef = doc(db, 'residenciales', reservation.residencialId, 'reservaciones', freeReservationId);
            const freeUserRef = doc(db, 'usuarios', freeReservationData.userId, 'reservaciones', freeReservationId);

            batch.update(freeResidentialRef, {
              status: 'cancelada',
              canceladaPor: 'Sistema',
              canceladaEn: new Date(),
              motivoCancelacion: 'Cancelada automáticamente porque se aprobó una reserva de pago para el mismo día',
              canceladaPorReservaPago: true,
              updatedAt: new Date(),
              updatedBy: user?.uid,
            });

            batch.update(freeUserRef, {
              status: 'cancelada',
              canceladaPor: 'Sistema',
              canceladaEn: new Date(),
              motivoCancelacion: 'Cancelada automáticamente porque se aprobó una reserva de pago para el mismo día',
              canceladaPorReservaPago: true,
              updatedAt: new Date(),
              updatedBy: user?.uid,
            });

            console.log(`✅ [CANCELACION] Reserva gratuita ${freeReservationId} marcada para cancelación`);

            // Enviar notificación al usuario afectado
            try {
              const { httpsCallable } = await import('firebase/functions');
              const { functions } = await import('@/lib/firebase/config');
              const sendNotification = httpsCallable(functions, 'sendReservationStatusNotification');

              // Convertir la fecha correctamente (puede ser Timestamp de Firestore o Date)
              let fechaParaNotificacion: string;
              if (freeReservationData.fecha?.toDate) {
                // Es un Timestamp de Firestore
                fechaParaNotificacion = freeReservationData.fecha.toDate().toISOString();
              } else if (freeReservationData.fecha instanceof Date) {
                // Ya es un Date
                fechaParaNotificacion = freeReservationData.fecha.toISOString();
              } else if (freeReservationData.fecha) {
                // Intentar convertir desde Timestamp
                const { Timestamp } = await import('firebase/firestore');
                if (freeReservationData.fecha instanceof Timestamp) {
                  fechaParaNotificacion = freeReservationData.fecha.toDate().toISOString();
                } else {
                  fechaParaNotificacion = new Date(freeReservationData.fecha).toISOString();
                }
              } else {
                // Fallback a la fecha de la reserva de pago
                fechaParaNotificacion = reservation.fecha instanceof Date
                  ? reservation.fecha.toISOString()
                  : new Date(reservation.fecha).toISOString();
              }

              console.log(`📧 [CANCELACION] Enviando notificación a usuario ${freeReservationData.userId}:`, {
                userId: freeReservationData.userId,
                areaName: freeReservationData.areaName || reservation.areaName,
                date: fechaParaNotificacion,
                status: 'cancelada'
              });

              const notificationResult = await sendNotification({
                userId: freeReservationData.userId,
                areaName: freeReservationData.areaName || reservation.areaName,
                date: fechaParaNotificacion,
                status: 'cancelada',
                reason: 'Tu reserva gratuita fue cancelada automáticamente porque se aprobó una reserva de pago para el mismo día',
              });

              console.log(`✅ [CANCELACION] Notificación enviada exitosamente:`, notificationResult.data);
            } catch (notificationError) {
              console.error(`❌ [CANCELACION] Error enviando notificación a usuario ${freeReservationData.userId}:`, notificationError);
              console.error(`❌ [CANCELACION] Detalles del error:`, {
                error: notificationError,
                message: notificationError instanceof Error ? notificationError.message : String(notificationError),
                stack: notificationError instanceof Error ? notificationError.stack : undefined
              });
            }
          }

          if (freeReservationsToCancel.length > 0) {
            console.log(`✅ [CANCELACION] ${freeReservationsToCancel.length} reservas gratuitas canceladas automáticamente`);
          }
        } catch (cancelError) {
          console.error('❌ [CANCELACION] Error cancelando reservas gratuitas:', cancelError);
          // No fallar la aprobación por error en cancelación
        }
      }

      console.log('🚀 [DEBUG] Ejecutando batch commit...');
      await batch.commit();
      console.log('✅ [DEBUG] Batch commit completado');

      // Enviar notificación al usuario
      try {
        console.log('📧 [DEBUG] Enviando notificación...');
        const { httpsCallable } = await import('firebase/functions');
        const { functions } = await import('@/lib/firebase/config');
        const sendNotification = httpsCallable(functions, 'sendReservationStatusNotification');

        await sendNotification({
          userId: reservation.userId,
          areaName: reservation.areaName,
          date: reservation.fecha.toISOString(),
          status: newStatus,
          reason: newStatus === 'rechazada' ? (reason || 'Rechazada desde panel administrativo') : null,
        });

        console.log('✅ [DEBUG] Notificación enviada al usuario');
      } catch (notificationError) {
        console.error('❌ [DEBUG] Error enviando notificación:', notificationError);
        // No fallar la actualización por error en notificaciones
      }

      // Actualizar estado local
      console.log('🔄 [DEBUG] Actualizando estado local...');
      setReservations(prev => {
        console.log('📊 [DEBUG] Estado anterior:', prev.length, 'reservas');
        // 🆕 Si se cancelaron reservas gratuitas, actualizarlas también en el estado local
        let updated = prev.map(r => {
          if (r.id === reservationId) {
            return { ...r, status: newStatus as any, ...(newStatus === 'rechazada' && reason ? { motivoCancelacion: reason } : {}) };
          }
          // Si esta reserva fue cancelada automáticamente por la aprobación de una de pago
          if (newStatus === 'aprobada' && reservation.tipoReserva === 'pago' &&
            r.areaId === reservation.areaId &&
            isSameDay(r.fecha, reservation.fecha) &&
            r.tipoReserva === 'gratuita' &&
            r.status !== 'cancelada' &&
            r.id !== reservationId) {
            console.log(`🔄 [CANCELACION] Actualizando estado local - Cancelando reserva gratuita ${r.id}`);
            return {
              ...r,
              status: 'cancelada' as any,
              canceladaPor: 'Sistema',
              canceladaEn: new Date(),
              motivoCancelacion: 'Cancelada automáticamente porque se aprobó una reserva de pago para el mismo día',
              canceladaPorReservaPago: true,
            };
          } else if (newStatus === 'aprobada' && reservation.tipoReserva === 'pago' && r.id !== reservationId) {
            // Log para depurar por qué no se está cancelando
            console.log(`🔍 [CANCELACION] Reserva ${r.id} NO cancelada - Verificando condiciones:`, {
              tieneAreaId: r.areaId === reservation.areaId,
              areaIdReserva: r.areaId,
              areaIdPago: reservation.areaId,
              mismoDia: isSameDay(r.fecha, reservation.fecha),
              fechaReserva: r.fecha,
              fechaPago: reservation.fecha,
              esGratuita: r.tipoReserva === 'gratuita',
              tipoReserva: r.tipoReserva,
              noEstaCancelada: r.status !== 'cancelada',
              status: r.status,
              noEsLaActual: r.id !== reservationId
            });
          }
          return r;
        });
        console.log('📊 [DEBUG] Estado actualizado:', updated.length, 'reservas');
        return updated;
      });

      console.log('🎉 [DEBUG] updateReservationStatus completado exitosamente');

      toast({
        title: "Éxito",
        description: `Reserva ${statusLabels[newStatus as keyof typeof statusLabels].toLowerCase()}`,
      });

    } catch (error) {
      console.error('❌ [DEBUG] Error en updateReservationStatus:', error);
      toast({
        title: "Error",
        description: "Error al actualizar la reserva",
        variant: "destructive",
      });
    } finally {
      // Desmarcar carga
      setUpdatingReservationIds(prev => {
        const next = new Set(prev);
        next.delete(reservationId);
        return next;
      });
    }
  };

  // 🗝️ NUEVO: Función segura para actualizar el estado de reservas basado en llaves
  // Esta función solo se debe llamar manualmente cuando sea necesario, no automáticamente
  const handleKeysStateUpdate = async (reservationId: string, newKeysState: string) => {
    try {
      const reservation = reservations.find(r => r.id === reservationId);
      if (!reservation) return;

      // Solo actualizar si el estado de llaves realmente cambió
      if (reservation.estadoLlaves === newKeysState) return;

      console.log(`🔄 [KEYS] Actualizando estado de llaves para reserva ${reservationId}: ${reservation.estadoLlaves} -> ${newKeysState}`);

      // Actualizar el estado de llaves en Firestore
      const batch = writeBatch(db);
      const residentialRef = doc(db, 'residenciales', reservation.residencialId, 'reservaciones', reservationId);
      const userRef = doc(db, 'usuarios', reservation.userId, 'reservaciones', reservationId);

      const updateData = {
        estadoLlaves: newKeysState,
        updatedAt: new Date(),
        updatedBy: user?.uid || 'Sistema',
      };

      batch.update(residentialRef, updateData);
      batch.update(userRef, updateData);
      await batch.commit();

      // Actualizar estado local de forma segura
      setReservations(prev =>
        prev.map(r =>
          r.id === reservationId
            ? {
              ...r,
              estadoLlaves: newKeysState as 'pendiente' | 'entregadas' | 'recibidas' | 'retraso',
              updatedAt: new Date()
            } as Reservation
            : r
        )
      );

      // Ahora actualizar el estado de la reserva si es necesario
      await updateReservationStatusByKeysState(reservationId, newKeysState);

    } catch (error) {
      console.error('❌ [KEYS] Error en handleKeysStateUpdate:', error);
    }
  };
  const updateReservationStatusByKeysState = async (reservationId: string, keysState: string) => {
    try {
      // Encontrar la reserva
      const reservation = reservations.find(r => r.id === reservationId);
      if (!reservation) return;

      let newStatus = reservation.status;

      // Lógica automática de estados según el estado de las llaves
      switch (keysState) {
        case 'entregadas':
          // Si las llaves se entregan, la reserva pasa a "En Curso"
          if (reservation.status === 'aprobada') {
            newStatus = 'en_curso';
          }
          break;
        case 'recibidas':
          // Si las llaves se reciben, la reserva pasa a "Finalizada"
          if (reservation.status === 'en_curso' || reservation.status === 'aprobada') {
            newStatus = 'finalizada';
          }
          break;
        case 'pendiente':
          // Si las llaves vuelven a pendiente, la reserva vuelve a "Aprobada"
          if (reservation.status === 'en_curso') {
            newStatus = 'aprobada';
          }
          break;
      }

      // Solo actualizar si el estado cambió
      if (newStatus !== reservation.status) {
        console.log(`🔄 [KEYS] Actualizando estado de reserva ${reservationId} de "${reservation.status}" a "${newStatus}" por estado de llaves: "${keysState}"`);

        // Actualizar en ambos lugares
        const batch = writeBatch(db);

        // 1. En el residencial
        const residentialRef = doc(db, 'residenciales', reservation.residencialId, 'reservaciones', reservationId);

        // 2. En el usuario
        const userRef = doc(db, 'usuarios', reservation.userId, 'reservaciones', reservationId);

        const updateData = {
          status: newStatus,
          updatedAt: new Date(),
          updatedBy: 'Sistema de Llaves',
          keysStateChangedAt: new Date(),
        };

        batch.update(residentialRef, updateData);
        batch.update(userRef, updateData);

        await batch.commit();

        // ⚠️ MEJORADO: Actualizar estado local de forma más controlada para evitar bucles
        setReservations(prev =>
          prev.map(r =>
            r.id === reservationId
              ? { ...r, status: newStatus as any, updatedAt: new Date() }
              : r
          )
        );

        console.log(`✅ [KEYS] Estado de reserva actualizado automáticamente a "${newStatus}"`);
      }

    } catch (error) {
      console.error('❌ [KEYS] Error actualizando estado de reserva por llaves:', error);
    }
  };

  // 🗝️ NUEVO: Efecto para detectar cambios en el estado de las llaves y actualizar automáticamente el estado de la reservación
  // ⚠️ COMENTADO: Este efecto estaba causando un bucle infinito al actualizar el estado de las reservas
  // La lógica de actualización automática se manejará de forma más controlada
  // 
  // SOLUCIÓN IMPLEMENTADA:
  // 1. Se eliminó el useEffect problemático que causaba bucles infinitos
  // 2. Se creó handleKeysStateUpdate() para manejar actualizaciones de forma controlada
  // 3. Las actualizaciones automáticas ahora solo ocurren cuando se llama manualmente
  // 4. Esto evita el freeze de la pantalla al cambiar el estado de las reservas
  /*
  useEffect(() => {
    if (reservations.length === 0) return;

    // Verificar cada reserva para cambios en el estado de las llaves
    reservations.forEach(reservation => {
      if (reservation.estadoLlaves) {
        // Ejecutar la actualización automática del estado
        updateReservationStatusByKeysState(reservation.id, reservation.estadoLlaves);
      }
    });
  }, [reservations.map(r => ({ id: r.id, estadoLlaves: r.estadoLlaves }))]);
  */

  // 🚀 CARGA INICIAL: Cargar reservas cuando el usuario y claims estén listos
  useEffect(() => {
    if (!user || userClaims === null || userClaims === undefined) {
      console.log('⏸️ [ReservasPage] Esperando usuario y claims para carga inicial');
      return;
    }

    console.log('🚀 [ReservasPage] Iniciando carga inicial de reservas');
    loadReservations();
  }, [user, userClaims]);

  const updateMultipleReservationsStatus = async (ids: string[], newStatus: string, reason?: string) => {
    console.log('🔍 [DEBUG] updateMultipleReservationsStatus iniciado:', { ids, newStatus, reason });
    for (const id of ids) {
      console.log('🔍 [DEBUG] Actualizando reserva individual:', id);
      // eslint-disable-next-line no-await-in-loop
      await updateReservationStatus(id, newStatus, reason);
    }
    console.log('🔍 [DEBUG] updateMultipleReservationsStatus completado, limpiando selección');
    setSelectedIds(new Set());
  };

  // Eliminar reserva (residencial y usuario) - VERSIÓN MEJORADA CON DEBUGGING
  const deleteReservation = async (reservationId: string) => {
    console.log('🔍 [DEBUG] Iniciando eliminación de reserva:', reservationId);

    try {
      const reservation = reservations.find(r => r.id === reservationId);
      if (!reservation) {
        console.error('❌ [DEBUG] Reserva no encontrada:', reservationId);
        toast({ title: 'Error', description: 'Reserva no encontrada.', variant: 'destructive' });
        return;
      }

      console.log('✅ [DEBUG] Reserva encontrada:', {
        id: reservation.id,
        residencialId: reservation.residencialId,
        userId: reservation.userId
      });

      // Verificar permisos de usuario
      if (!user || !userClaims) {
        console.error('❌ [DEBUG] Usuario no autenticado o sin claims');
        toast({ title: 'Error', description: 'No tienes permisos para eliminar reservas.', variant: 'destructive' });
        return;
      }

      console.log('✅ [DEBUG] Usuario autenticado:', user.email);

      const batch = writeBatch(db);
      const residentialRef = doc(db, 'residenciales', reservation.residencialId, 'reservaciones', reservationId);
      const userRef = doc(db, 'usuarios', reservation.userId, 'reservaciones', reservationId);

      console.log('📝 [DEBUG] Referencias creadas:', {
        residential: residentialRef.path,
        user: userRef.path
      });

      batch.delete(residentialRef);
      batch.delete(userRef);

      console.log('🔄 [DEBUG] Ejecutando batch de eliminación...');
      await batch.commit();

      console.log('✅ [DEBUG] Batch ejecutado exitosamente');

      setReservations(prev => {
        const filtered = prev.filter(r => r.id !== reservationId);
        console.log('📊 [DEBUG] Reservas actualizadas:', filtered.length);
        return filtered;
      });

      toast({ title: 'Eliminada', description: 'La reserva fue eliminada correctamente.' });
      console.log('🎉 [DEBUG] Eliminación completada exitosamente');

    } catch (error: any) {
      console.error('❌ [DEBUG] Error eliminando reserva:', error);

      // Proporcionar información más detallada del error
      if (error.code) {
        console.error('📋 [DEBUG] Código de error:', error.code);
      }
      if (error.message) {
        console.error('📋 [DEBUG] Mensaje de error:', error.message);
      }

      toast({
        title: 'Error',
        description: `No se pudo eliminar la reserva: ${error.message || 'Error desconocido'}`,
        variant: 'destructive'
      });
    }
  };

  const exportReservations = () => {
    const csvContent = [
      ['ID', 'Usuario', 'Email', 'Área', 'Fecha', 'Hora Inicio', 'Hora Fin', 'Duración', 'Personas', 'Precio', 'Estado'].join(','),
      ...filteredReservations.map(r => [
        r.id,
        r.userName,
        r.userEmail,
        r.areaName,
        format(r.fecha, 'dd/MM/yyyy'),
        r.horaInicio,
        r.horaFin,
        `${r.duracion} hora(s)`,
        r.personas,
        `$${r.precio}`,
        statusLabels[r.status]
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservas_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAreaFilter('all');
    setResidencialFilter('all');
    setDateRange({ from: undefined, to: undefined });
    setCurrentPage(1);
  };

  // 🚀 FUNCIÓN AUXILIAR PARA PROCESAR Y AGREGAR RESERVAS
  const processReservationsDataAppend = async (rawReservations: any[], existingReservations: Reservation[]) => {
    try {
      // Reutilizar la lógica optimizada de consultas en lote
      const userIds = Array.from(new Set(rawReservations.map(r => r.userId).filter(Boolean)));
      const residencialIds = Array.from(new Set(rawReservations.map(r => r.residencialId || userClaims?.residencialId).filter(Boolean)));

      const [usersData, residencialesData] = await Promise.all([
        Promise.all(
          Array.from({ length: Math.ceil(userIds.length / 10) }, (_, i) =>
            userIds.slice(i * 10, (i + 1) * 10)
          ).map(async (batch) => {
            if (batch.length === 0) return [];
            const usersRef = collection(db, 'usuarios');
            const usersQuery = query(usersRef, where('__name__', 'in', batch));
            const usersSnapshot = await getDocs(usersQuery);
            return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          })
        ).then(results => results.flat()),

        Promise.all(
          residencialIds.map(async (id) => {
            try {
              const residencialRef = doc(db, 'residenciales', id);
              const residencialSnapshot = await getDoc(residencialRef);
              return residencialSnapshot.exists()
                ? { id: residencialSnapshot.id, ...residencialSnapshot.data() }
                : null;
            } catch (error) {
              console.warn('⚠️ Error cargando residencial:', id, error);
              return null;
            }
          })
        ).then(results => results.filter(Boolean))
      ]);

      const usersMap = new Map(usersData.map((user: any) => [user.id, user]));
      const residencialesMap = new Map(residencialesData.filter((res): res is any => res !== null).map((res: any) => [res.id, res]));

      const processedReservations: Reservation[] = rawReservations.map(data => {
        const userData = usersMap.get(data.userId) as any;
        const residencialData = residencialesMap.get(data.residencialId || userClaims?.residencialId) as any;

        // Lógica simplificada para construcción de reserva
        let userName = 'Usuario sin nombre';
        let userEmail = data.userEmail || 'Sin email';
        let userDomicilio = 'Sin domicilio';
        let userIsMoroso = false;

        if (userData) {
          const nombreCompleto = userData.fullName || userData.nombre || userData.displayName || userData.firstName || '';
          userName = nombreCompleto || userData.email?.split('@')[0] || data.userEmail?.split('@')[0] || 'Usuario sin nombre';
          userEmail = userData.email || data.userEmail || 'Sin email';
          userIsMoroso = Boolean((userData as any)?.isMoroso);

          if (userData.calle && userData.houseNumber) {
            userDomicilio = `${userData.calle} ${userData.houseNumber}`;
          } else if (userData.calle) {
            userDomicilio = userData.calle;
          } else if (userData.houseNumber) {
            userDomicilio = `Casa ${userData.houseNumber}`;
          } else if (userData.houseID) {
            userDomicilio = `Casa ${userData.houseID}`;
          }
        }

        const residencialNombre = residencialData?.nombre || residencialData?.displayName || 'Residencial sin nombre';

        return {
          id: data.id,
          userId: data.userId,
          userEmail,
          userName,
          userDomicilio,
          userIsMoroso,
          fecha: data.fecha?.toDate() || new Date(),
          horaInicio: data.horaInicio || '',
          horaFin: data.horaFin || '',
          duracion: data.duracion || '',
          areaName: data.areaName || 'Área sin nombre',
          residencialNombre,
          residencialId: data.residencialId,
          personas: data.personas || data.huespedes || 1,
          precio: data.precio || data.costo || 0,
          status: data.status || 'pendiente',
          estadoLlaves: data.estadoLlaves || 'no_gestionadas',
          createdAt: data.createdAt?.toDate() || new Date(),
          motivo: data.motivo || '',
          huespedes: data.huespedes || 1,
          serviciosAdicionales: data.serviciosAdicionales || [],
          costo: data.costo || 0,
          notas: data.notas || '',
          revisadoPor: data.revisadoPor || '',
          motivoRechazo: data.motivoRechazo || '',
          fechaRevision: data.fechaRevision?.toDate(),
          fechaFinalizacion: data.fechaFinalizacion?.toDate(),
        } as Reservation;
      });

      // Combinar y actualizar las reservas
      const combinedReservations = [...existingReservations, ...processedReservations];
      setReservations(combinedReservations);

    } catch (error) {
      console.error('❌ Error procesando reservas adicionales:', error);
      throw error;
    }
  };

  // 🚀 FUNCIÓN PARA CARGAR MÁS RESERVAS
  const loadMoreReservations = async () => {
    if (!user || loadingMore || !hasMoreReservations) return;

    console.log('📈 [ReservasPage] Cargando más reservas...');
    setLoadingMore(true);

    try {
      const residencialIdRaw = userClaims?.residencialId || 'global';
      let additionalReservations: any[] = [];

      // Obtener la fecha de la última reserva cargada para paginación
      const lastReservation = reservations[reservations.length - 1];
      const lastDate = lastReservation?.fecha || new Date();

      if (residencialIdRaw === 'global') {
        const residencialesRef = collection(db, 'residenciales');
        const residencialesSnapshot = await getDocs(residencialesRef);

        for (const residencialDoc of residencialesSnapshot.docs) {
          const reservationsRef = collection(db, 'residenciales', residencialDoc.id, 'reservaciones');
          const reservationsQuery = query(
            reservationsRef,
            orderBy('fecha', 'desc'),
            where('fecha', '<', lastDate),
            limit(50)
          );
          const residencialSnapshot = await getDocs(reservationsQuery);

          residencialSnapshot.docs.forEach(doc => {
            additionalReservations.push({
              ...doc.data(),
              id: doc.id,
              residencialId: residencialDoc.id
            });
          });
        }
      } else {
        const targetDocId = await resolveResidencialDocId(residencialIdRaw);
        const reservationsRef = collection(db, 'residenciales', targetDocId, 'reservaciones');
        const reservationsQuery = query(
          reservationsRef,
          orderBy('fecha', 'desc'),
          where('fecha', '<', lastDate),
          limit(100)
        );
        const snapshot = await getDocs(reservationsQuery);

        additionalReservations = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          residencialId: targetDocId
        }));
      }

      if (additionalReservations.length === 0) {
        setHasMoreReservations(false);
        console.log('📈 [ReservasPage] No hay más reservas para cargar');
      } else {
        // Procesar las reservas adicionales y agregarlas a las existentes
        const currentReservations = [...reservations];
        await processReservationsDataAppend(additionalReservations, currentReservations);
        console.log(`📈 [ReservasPage] Cargadas ${additionalReservations.length} reservas adicionales`);
      }
    } catch (error) {
      console.error('❌ [ReservasPage] Error cargando más reservas:', error);
      toast({
        title: "Error",
        description: "Error al cargar más reservas",
        variant: "destructive",
      });
    } finally {
      setLoadingMore(false);
    }
  };

  // Skeleton de carga para una mejor experiencia
  const ReservationSkeleton = () => (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6 space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
        <div className="flex gap-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                </div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table skeleton */}
      <Card>
        <CardContent className="p-0">
          <div className="space-y-3 p-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Banner de carga para actualizaciones en tiempo real
  const loadingBanner = isRealtimeActive && (
    <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 mb-4">
      <RefreshCw className="h-3 w-3 animate-spin" /> Actualizando reservas en tiempo real...
    </div>
  );

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
            <span className="text-gradient-zentry">Reservas</span>
          </h1>
          <p className="text-slate-600 font-bold max-w-lg">
            {filteredReservations.length} de {reservations.length} reservas activas
          </p>

          {/* Indicadores de estado general */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-1.5 text-xs bg-green-50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-bold">
                {reservations.filter(r => r.status === 'aprobada').length} Aprobadas
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs bg-blue-50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-blue-700 font-bold">
                {reservations.filter(r => r.status === 'en_curso').length} En Curso
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs bg-purple-50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-purple-700 font-bold">
                {reservations.filter(r => r.status === 'finalizada').length} Finalizadas
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs bg-yellow-50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-yellow-700 font-bold">
                {reservations.filter(r => r.status === 'pendiente').length} Pendientes
              </span>
            </div>
          </div>
        </div>

        {/* Controles de vista */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'table' ? 'month' : 'table')}
            className="rounded-2xl h-14 px-8 font-black shadow-zentry-lg bg-white text-slate-900 hover:bg-slate-50 hover-lift transition-all border-slate-200"
          >
            <CalendarIcon2 className="mr-2 h-5 w-5" />
            {viewMode === 'table' ? 'Vista Calendario' : 'Vista Tabla'}
          </Button>
        </motion.div>
      </motion.div>

      {/* Banner de estado de tiempo real */}
      {loadingBanner}

      {/* Mostrar skeleton mientras carga o contenido cuando está listo */}
      {loading ? (
        <ReservationSkeleton />
      ) : (
        <>
          {/* Sistema de pestañas con diseño premium */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-xl p-2 rounded-3xl shadow-zentry border-none h-auto">
              <TabsTrigger
                value="hoy"
                className="flex items-center gap-2 rounded-2xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold transition-all h-12"
              >
                <CalendarIcon2 className="h-4 w-4" />
                Hoy
              </TabsTrigger>
              <TabsTrigger
                value="proximas"
                className="flex items-center gap-2 rounded-2xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold transition-all h-12"
              >
                <Clock className="h-4 w-4" />
                Próximas
              </TabsTrigger>
              <TabsTrigger
                value="completadas"
                className="flex items-center gap-2 rounded-2xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold transition-all h-12"
              >
                <CheckCircle className="h-4 w-4" />
                Completadas
              </TabsTrigger>
              <TabsTrigger
                value="todas"
                className="flex items-center gap-2 rounded-2xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold transition-all h-12"
              >
                <Filter className="h-4 w-4" />
                Todas
              </TabsTrigger>
            </TabsList>

            {/* Pestaña: Hoy */}
            <TabsContent value="hoy" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900">Reservaciones de Hoy</h2>
                <Badge className="bg-indigo-100 text-indigo-700 border-none font-black px-4 py-2 rounded-full text-sm">
                  {filteredReservations.filter(r => isToday(r.fecha)).length} reservaciones
                </Badge>
              </div>

              {/* Grid de estadísticas premium */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div whileHover={{ scale: 1.02 }} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-zentry border border-blue-100">
                  <div className="text-center">
                    <div className="text-4xl font-black text-blue-600 mb-2">
                      {filteredReservations.filter(r => isToday(r.fecha) && r.status === 'aprobada').length}
                    </div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Aprobadas</div>
                  </div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-zentry border border-blue-100">
                  <div className="text-center">
                    <div className="text-4xl font-black text-blue-600 mb-2">
                      {filteredReservations.filter(r => isToday(r.fecha) && r.status === 'en_curso').length}
                    </div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">En Curso</div>
                  </div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-zentry border border-green-100">
                  <div className="text-center">
                    <div className="text-4xl font-black text-green-600 mb-2">
                      {filteredReservations.filter(r => isToday(r.fecha) && r.estadoLlaves === 'entregadas').length}
                    </div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Llaves Entregadas</div>
                  </div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-zentry border border-purple-100">
                  <div className="text-center">
                    <div className="text-4xl font-black text-purple-600 mb-2">
                      {filteredReservations.filter(r => isToday(r.fecha) && r.status === 'finalizada').length}
                    </div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Finalizadas</div>
                  </div>
                </motion.div>
              </div>
            </TabsContent>

            {/* Pestaña: Próximas */}
            <TabsContent value="proximas" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900">Reservaciones Próximas</h2>
                <Badge className="bg-indigo-100 text-indigo-700 border-none font-black px-4 py-2 rounded-full text-sm">
                  {filteredReservations.filter(r => isUpcoming(r.fecha) || isActive(r.fecha, parseInt(r.duracion))).length} reservaciones
                </Badge>
              </div>

              {/* Grid de estadísticas premium */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div whileHover={{ scale: 1.02 }} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-zentry border border-green-100">
                  <div className="text-center">
                    <div className="text-4xl font-black text-green-600 mb-2">
                      {filteredReservations.filter(r => (isUpcoming(r.fecha) || isActive(r.fecha, parseInt(r.duracion))) && r.status === 'aprobada').length}
                    </div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Aprobadas</div>
                  </div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-zentry border border-yellow-100">
                  <div className="text-center">
                    <div className="text-4xl font-black text-yellow-600 mb-2">
                      {filteredReservations.filter(r => (isUpcoming(r.fecha) || isActive(r.fecha, parseInt(r.duracion))) && r.status === 'pendiente').length}
                    </div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Pendientes</div>
                  </div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-zentry border border-blue-100">
                  <div className="text-center">
                    <div className="text-4xl font-black text-blue-600 mb-2">
                      {filteredReservations.filter(r => (isUpcoming(r.fecha) || isActive(r.fecha, parseInt(r.duracion))) && r.status === 'en_curso').length}
                    </div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">En Curso</div>
                  </div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-zentry border border-slate-100">
                  <div className="text-center">
                    <div className="text-4xl font-black text-slate-600 mb-2">
                      {filteredReservations.filter(r => (isUpcoming(r.fecha) || isActive(r.fecha, parseInt(r.duracion))) && !r.estadoLlaves).length}
                    </div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Sin Llaves</div>
                  </div>
                </motion.div>
              </div>
            </TabsContent>

            {/* Pestaña: Completadas */}
            <TabsContent value="completadas" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900">Reservaciones Completadas</h2>
                <Badge className="bg-indigo-100 text-indigo-700 border-none font-black px-4 py-2 rounded-full text-sm">
                  {filteredReservations.filter(r => isCompleted(r.fecha, parseInt(r.duracion)) || r.status === 'finalizada').length} reservaciones
                </Badge>
              </div>
            </TabsContent>

            {/* Pestaña: Todas */}
            <TabsContent value="todas" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900">Todas las Reservaciones</h2>
                <Badge className="bg-indigo-100 text-indigo-700 border-none font-black px-4 py-2 rounded-full text-sm">
                  {filteredReservations.length} reservaciones
                </Badge>
              </div>

              {/* Grid de estadísticas premium */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div whileHover={{ scale: 1.02 }} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-zentry border border-blue-100">
                  <div className="text-center">
                    <div className="text-4xl font-black text-blue-600 mb-2">
                      {filteredReservations.filter(r => r.status === 'aprobada').length}
                    </div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Aprobadas</div>
                  </div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-zentry border border-yellow-100">
                  <div className="text-center">
                    <div className="text-4xl font-black text-yellow-600 mb-2">
                      {filteredReservations.filter(r => r.status === 'pendiente').length}
                    </div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Pendientes</div>
                  </div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-zentry border border-red-100">
                  <div className="text-center">
                    <div className="text-4xl font-black text-red-600 mb-2">
                      {filteredReservations.filter(r => r.status === 'cancelada' || r.status === 'rechazada').length}
                    </div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Canceladas/Rech.</div>
                  </div>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-zentry border border-purple-100">
                  <div className="text-center">
                    <div className="text-4xl font-black text-purple-600 mb-2">
                      {filteredReservations.filter(r => r.status === 'finalizada').length}
                    </div>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-500">Finalizadas</div>
                  </div>
                </motion.div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Filtros principales con diseño premium */}
          <Card className="border-none shadow-zentry-lg bg-white/80 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
            <div className="p-8 pb-4 border-b border-white/10 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Filter className="h-5 w-5 text-indigo-500" />
                  <h2 className="text-sm font-black uppercase tracking-widest mr-4 text-slate-800">Filtros y Búsqueda</h2>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setAreaFilter('all');
                      setResidencialFilter('all');
                      setDateRange({ from: undefined, to: undefined });
                    }}
                    className="rounded-2xl font-bold"
                  >
                    Limpiar filtros
                  </Button>

                  {hasMoreReservations && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMoreReservations}
                      disabled={loadingMore}
                      className="flex items-center gap-2 rounded-2xl font-bold"
                    >
                      {loadingMore ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Cargando...
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3" />
                          Cargar más
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Búsqueda */}
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

                {/* Filtro por Estado */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-14 bg-white border border-slate-200 shadow-sm rounded-2xl font-bold px-6 text-slate-900 focus:ring-indigo-500/20">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent className="rounded-3xl border-none shadow-2xl bg-white/95 backdrop-blur-3xl">
                    <div className="p-2">
                      <SelectItem value="all" className="font-bold mb-1 rounded-xl">Todos los estados</SelectItem>
                      <SelectItem value="pendiente" className="font-bold mb-1 rounded-xl">Pendiente</SelectItem>
                      <SelectItem value="aprobada" className="font-bold mb-1 rounded-xl">Aprobada</SelectItem>
                      <SelectItem value="rechazada" className="font-bold mb-1 rounded-xl">Rechazada</SelectItem>
                      <SelectItem value="cancelada" className="font-bold mb-1 rounded-xl">Cancelada</SelectItem>
                      <SelectItem value="en_curso" className="font-bold mb-1 rounded-xl">En Curso</SelectItem>
                      <SelectItem value="finalizada" className="font-bold rounded-xl">Finalizada</SelectItem>
                    </div>
                  </SelectContent>
                </Select>

                {/* Filtro por Área */}
                <Select value={areaFilter} onValueChange={setAreaFilter}>
                  <SelectTrigger className="h-14 bg-white border border-slate-200 shadow-sm rounded-2xl font-bold px-6 text-slate-900 focus:ring-indigo-500/20">
                    <SelectValue placeholder="Área" />
                  </SelectTrigger>
                  <SelectContent className="rounded-3xl border-none shadow-2xl bg-white/95 backdrop-blur-3xl">
                    <div className="p-2">
                      <SelectItem value="all" className="font-bold mb-1 rounded-xl">Todas las áreas</SelectItem>
                      {areas.map((area) => (
                        <SelectItem key={area} value={area} className="font-bold mb-1 rounded-xl">
                          {area}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>

                {/* Filtro por Residencial - Solo para admin globales */}
                {userClaims?.residencialId === 'global' && (
                  <Select value={residencialFilter} onValueChange={setResidencialFilter}>
                    <SelectTrigger className="h-14 bg-white border border-slate-200 shadow-sm rounded-2xl font-bold px-6 text-slate-900 focus:ring-indigo-500/20">
                      <SelectValue placeholder="Residencial" />
                    </SelectTrigger>
                    <SelectContent className="rounded-3xl border-none shadow-2xl bg-white/95 backdrop-blur-3xl">
                      <div className="p-2">
                        <SelectItem value="all" className="font-bold mb-1 rounded-xl">Todos los residenciales</SelectItem>
                        {residenciales.map((residencial) => (
                          <SelectItem key={residencial.id} value={residencial.id} className="font-bold mb-1 rounded-xl">
                            {residencial.nombre}
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                )}

                {/* Filtro por Fecha */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`h-14 justify-start text-left font-bold rounded-2xl border-slate-200 ${!dateRange.from && !dateRange.to ? "text-slate-400" : "text-slate-900"
                        }`}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yy", { locale: es })} -{" "}
                            {format(dateRange.to, "dd/MM/yy", { locale: es })}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yy", { locale: es })
                        )
                      ) : (
                        "Rango de fechas"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                      numberOfMonths={2}
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>

                {/* Botón de exportar */}
                <Button
                  variant="outline"
                  onClick={exportReservations}
                  disabled={filteredReservations.length === 0}
                  className="flex items-center gap-2 h-14 rounded-2xl font-bold border-slate-200"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </div>

              {/* Resumen de filtros activos */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold text-slate-600">Mostrando {filteredReservations.length} de {reservations.length} reservas</span>
                {searchTerm && (
                  <Badge className="bg-indigo-100 text-indigo-700 border-none font-bold px-3 py-1 rounded-full">
                    Búsqueda: "{searchTerm}"
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge className="bg-blue-100 text-blue-700 border-none font-bold px-3 py-1 rounded-full">
                    Estado: {statusFilter}
                  </Badge>
                )}
                {areaFilter !== 'all' && (
                  <Badge className="bg-green-100 text-green-700 border-none font-bold px-3 py-1 rounded-full">
                    Área: {areaFilter}
                  </Badge>
                )}
                {userClaims?.residencialId === 'global' && residencialFilter !== 'all' && (
                  <Badge className="bg-purple-100 text-purple-700 border-none font-bold px-3 py-1 rounded-full">
                    Residencial: {residenciales.find(r => r.id === residencialFilter)?.nombre || residencialFilter}
                  </Badge>
                )}
                {(dateRange.from || dateRange.to) && (
                  <Badge variant="secondary" className="text-xs">
                    Fechas: {dateRange.from ? format(dateRange.from, "dd/MM/yy", { locale: es }) : "..."} - {dateRange.to ? format(dateRange.to, "dd/MM/yy", { locale: es }) : "..."}
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          {viewMode === 'table' && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Usuario</TableHead>
                    <TableHead className="w-[150px]">Área</TableHead>
                    <TableHead className="w-[100px]">Fecha</TableHead>
                    <TableHead className="w-[150px]">Horario</TableHead>
                    <TableHead className="w-[120px]">Creada</TableHead>
                    <TableHead className="w-[80px]">Personas</TableHead>
                    <TableHead className="w-[80px]">Precio</TableHead>
                    <TableHead className="w-[100px]">Estado</TableHead>
                    <TableHead className="w-[120px]">Estado Llaves</TableHead>
                    <TableHead className="w-[60px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReservations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        No se encontraron reservas
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedReservations.map((reservation) => (
                      <TableRow key={reservation.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{reservation.userName}</div>
                            <div className="text-xs text-blue-600 font-medium">{reservation.userDomicilio}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm truncate">{reservation.areaName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(reservation.fecha, 'dd/MM/yy', { locale: es })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {reservation.horaInicio && reservation.horaFin && reservation.horaInicio !== reservation.horaFin
                                ? `${reservation.horaInicio} - ${reservation.horaFin}`
                                : reservation.horaInicio || 'Horario no especificado'
                              }
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {reservation.duracion}h
                            </div>
                            <div className="text-[11px] font-medium">
                              {reservation.isMoroso ? (
                                <span className="text-red-600">Moroso</span>
                              ) : (
                                <span className="text-green-600">Al día</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            {reservation.createdAt ? `${format(reservation.createdAt, "dd/MM/yyyy", { locale: es })} ${format(reservation.createdAt, "h:mm a", { locale: es })}` : 's/f'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{reservation.personas}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">${reservation.precio}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {/* Estado principal de la reservación */}
                            <Badge className={`text-xs ${statusColors[reservation.status]}`}>
                              {statusLabels[reservation.status]}
                            </Badge>

                            {/* 🆕 NUEVO: Estado de acceso dinámico (similar a Flutter) */}
                            <div className="mt-1">
                              <Badge className={`text-xs ${getAccessStatusColor(reservation)}`}>
                                {getAccessStatusText(reservation)}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {/* Estado de las llaves */}
                            {reservation.estadoLlaves ? (
                              <Badge className={`text-xs ${keysStatusColors[reservation.estadoLlaves]}`}>
                                <Key className="h-3 w-3 mr-1" />
                                {keysStatusLabels[reservation.estadoLlaves]}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-gray-500">
                                <Key className="h-3 w-3 mr-1" />
                                Sin Estado
                              </Badge>
                            )}

                            {/* 🆕 NUEVO: Descripción detallada del estado */}
                            <div className="text-xs text-muted-foreground">
                              {getKeysStatusDescription(reservation)}
                            </div>

                            {/* 🆕 NUEVO: Información adicional de llaves */}
                            {reservation.estadoLlaves === 'entregadas' && reservation.fechaEntregaLlaves && (
                              <div className="text-xs text-muted-foreground">
                                Entregada: {format(reservation.fechaEntregaLlaves, 'dd/MM HH:mm')}
                              </div>
                            )}

                            {reservation.estadoLlaves === 'recibidas' && reservation.fechaRecepcionLlaves && (
                              <div className="text-xs text-muted-foreground">
                                Recibida: {format(reservation.fechaRecepcionLlaves, 'dd/MM HH:mm')}
                              </div>
                            )}

                            {reservation.fechaLimiteDevolucion && (
                              <div className="text-xs text-muted-foreground">
                                Límite: {format(reservation.fechaLimiteDevolucion, 'dd/MM HH:mm')}
                              </div>
                            )}

                            {/* 🆕 NUEVO: Indicador de estado de recepción */}
                            {reservation.status === 'finalizada' && reservation.estadoLlaves === 'entregadas' && (
                              <div className="text-xs text-orange-600 font-medium">
                                ⚠️ Pendiente de recepción
                              </div>
                            )}

                            {reservation.status === 'finalizada' && !reservation.estadoLlaves && (
                              <div className="text-xs text-red-600 font-medium">
                                ❌ Sin entrega de llaves
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-7 w-7 p-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <ReservationAuditHistory
                                reservationId={reservation.id}
                                residencialId={user?.residencialID || userClaims?.residencialId || reservation.residencialId || ''}
                                trigger={
                                  <DropdownMenuItem onSelect={(e) => {
                                    e.preventDefault();
                                    console.log('🔍 [DEBUG] Abriendo historial para:', {
                                      reservationId: reservation.id,
                                      residencialId: user?.residencialID,
                                      userClaims_residencialId: userClaims?.residencialId,
                                      reservation_residencialId: reservation.residencialId,
                                      finalResidencialId: user?.residencialID || userClaims?.residencialId || reservation.residencialId || '',
                                      userObject: user,
                                      userClaims: userClaims,
                                      reservationData: reservation
                                    });
                                  }}>
                                    <History className="mr-2 h-3 w-3" />
                                    Ver Historial
                                  </DropdownMenuItem>
                                }
                              />
                              {reservation.status === 'pendiente' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => updateReservationStatus(reservation.id, 'aprobada')}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="mr-2 h-3 w-3" />
                                    Aprobar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updateReservationStatus(reservation.id, 'rechazada')}
                                    className="text-red-600"
                                  >
                                    <XCircle className="mr-2 h-3 w-3" />
                                    Rechazar
                                  </DropdownMenuItem>
                                </>
                              )}

                              {(reservation.status === 'aprobada' || reservation.status === 'en_curso') && (
                                <DropdownMenuItem
                                  onClick={() => updateReservationStatus(reservation.id, 'finalizada')}
                                  className="text-purple-600"
                                >
                                  <CheckCircle className="mr-2 h-3 w-3" />
                                  Marcar como Completada
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem>
                                <Eye className="mr-2 h-3 w-3" />
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={async () => {
                                console.log('🔍 [DEBUG] Clic en eliminar reserva:', reservation.id);

                                // SOLUCIÓN TEMPORAL: Usar confirm() nativo mientras se resuelve el problema del diálogo
                                const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar esta reserva?\n\nID: ${reservation.id}\n\nEsta acción no se puede deshacer.`);

                                if (confirmed) {
                                  console.log('✅ [DEBUG] Usuario confirmó eliminación');
                                  await deleteReservation(reservation.id);
                                } else {
                                  console.log('❌ [DEBUG] Usuario canceló eliminación');
                                }

                                // Código original comentado temporalmente
                                // setDeleteTargetId(reservation.id); 
                                // setDeleteDialogOpen(true);
                                // console.log('🔍 [DEBUG] Estado actualizado:', { deleteTargetId: reservation.id, deleteDialogOpen: true });
                              }}>
                                <Trash className="mr-2 h-3 w-3" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {viewMode === 'month' && (
            <div className="space-y-3">
              {/* Controles mes */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>Anterior</Button>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-center">
                  {format(monthDate, "MMMM yyyy", { locale: es })}
                </div>
                <div className="flex items-center gap-2">
                  {/* Selector de mes simple */}
                  <Select value={`${monthDate.getFullYear()}-${monthDate.getMonth()}`} onValueChange={(v) => {
                    const [y, m] = v.split('-').map(Number);
                    setMonthDate(new Date(y, m, 1));
                  }}>
                    <SelectTrigger className="h-8 w-[160px]"><SelectValue placeholder="Elegir mes" /></SelectTrigger>
                    <SelectContent className="max-h-64 overflow-auto">
                      {(() => {
                        const options: { label: string; value: string }[] = [];
                        const base = new Date();
                        base.setDate(1);
                        for (let i = -24; i <= 24; i++) {
                          const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
                          options.push({ label: format(d, 'MMMM yyyy', { locale: es }), value: `${d.getFullYear()}-${d.getMonth()}` });
                        }
                        return options.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => setMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>Siguiente</Button>
                </div>
              </div>

              {/* Calendario mensual (grid grande) */}
              <div className="rounded-md border overflow-hidden">
                {/* Encabezado sin leyenda: limpio */}
                {/* Encabezado de días */}
                <div
                  className="grid grid-cols-7 bg-muted/60 text-xs text-muted-foreground w-full"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
                >
                  {['Lun.', 'Mar.', 'Miérc.', 'Juev.', 'Vier.', 'Sáb.', 'Dom.'].map(d => (
                    <div key={d} className="p-2 border-b">{d}</div>
                  ))}
                </div>

                {/* Celdas */}
                <div
                  className="grid grid-cols-7 w-full"
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
                >
                  {(() => {
                    const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
                    const startWeekday = (firstOfMonth.getDay() + 6) % 7; // lunes=0
                    const startDate = addDays(firstOfMonth, -startWeekday);
                    return Array.from({ length: 42 }).map((_, i) => {
                      const day = addDays(startDate, i);
                      const inCurrentMonth = day.getMonth() === monthDate.getMonth();
                      const key = format(startOfDay(day), 'yyyy-MM-dd');
                      const list = reservationsByDay.get(key) || [];
                      const totalCount = list.length;
                      const pendingCount = list.filter(r => r.status === 'pendiente').length;
                      const approvedCount = list.filter(r => r.status === 'aprobada').length;
                      const rejectedCount = list.filter(r => r.status === 'rechazada').length;
                      const canceledCount = list.filter(r => r.status === 'cancelada').length;
                      const today = isSameDay(day, new Date());
                      return (
                        <div
                          key={i}
                          className={`min-h-[140px] p-2 border ${inCurrentMonth ? 'bg-background' : 'bg-muted/20'} cursor-pointer hover:bg-muted/50 transition-colors ${today ? 'ring-2 ring-primary/60' : ''}`}
                          onClick={() => openDayDialog(day)}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <span className={`font-semibold ${inCurrentMonth ? '' : 'text-muted-foreground'}`}>{format(day, 'd', { locale: es })}</span>
                              <span className={`uppercase tracking-wide text-[10px] ${inCurrentMonth ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>{format(day, 'EEE', { locale: es }).replace('.', '')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {pendingCount > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-300">{pendingCount} pend.</span>
                              )}
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">{totalCount}</span>
                            </div>
                          </div>
                          {/* Resumen por estado */}
                          <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                            {approvedCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-300">{approvedCount} apr.</span>
                            )}
                            {pendingCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-300">{pendingCount} pend.</span>
                            )}
                            {rejectedCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-300">{rejectedCount} rej.</span>
                            )}
                            {canceledCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-300">{canceledCount} canc.</span>
                            )}
                          </div>

                          {/* 🆕 NUEVO: Resumen por estado de llaves */}
                          {(() => {
                            const keysDeliveredCount = list.filter(r => r.estadoLlaves === 'entregadas').length;
                            const keysReceivedCount = list.filter(r => r.estadoLlaves === 'recibidas').length;
                            const keysPendingCount = list.filter(r => !r.estadoLlaves || r.estadoLlaves === 'pendiente').length;

                            return (
                              <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                                {keysDeliveredCount > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-300">
                                    <Key className="h-2 w-2 inline mr-1" />
                                    {keysDeliveredCount} entreg.
                                  </span>
                                )}
                                {keysReceivedCount > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-300">
                                    <Key className="h-2 w-2 inline mr-1" />
                                    {keysReceivedCount} recib.
                                  </span>
                                )}
                                {keysPendingCount > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-300">
                                    <Key className="h-2 w-2 inline mr-1" />
                                    {keysPendingCount} pend.
                                  </span>
                                )}
                              </div>
                            );
                          })()}

                          {/* Vista previa de eventos (máx 3) */}
                          {list.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {list
                                .slice()
                                .sort((a, b) => (parseTimeToMinutes(a.horaInicio) ?? 0) - (parseTimeToMinutes(b.horaInicio) ?? 0))
                                .slice(0, 3)
                                .map(ev => {
                                  const dotClass = ev.status === 'aprobada'
                                    ? 'bg-green-500'
                                    : ev.status === 'pendiente'
                                      ? 'bg-yellow-500'
                                      : ev.status === 'rechazada'
                                        ? 'bg-red-500'
                                        : 'bg-gray-400';

                                  // 🆕 NUEVO: Estado de las llaves
                                  const keysStatus = ev.estadoLlaves === 'entregadas'
                                    ? '🔑'
                                    : ev.estadoLlaves === 'recibidas'
                                      ? '✅'
                                      : '⏳';

                                  return (
                                    <div key={ev.id} className="flex items-center gap-2 text-[11px] truncate">
                                      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
                                      <span className="font-medium whitespace-nowrap">{formatTime12(ev.horaInicio)}</span>
                                      <span className="truncate">{ev.areaName}</span>
                                      <span className="text-xs">{keysStatus}</span>
                                    </div>
                                  );
                                })}
                              {list.length > 3 && (
                                <div className="text-[10px] text-muted-foreground">+{list.length - 3} más</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Diálogo por día */}
              {dayDialogOpen && (
                <Dialog modal={false} open={dayDialogOpen} onOpenChange={(open) => {
                  console.log('🔍 [DEBUG] dayDialogOpen cambiando:', { from: dayDialogOpen, to: open });
                  setDayDialogOpen(open);
                }}>
                  <DialogContent
                    aria-describedby="day-dialog-description"
                    className="max-w-3xl h-[85vh] sm:h-[85vh] p-0 flex flex-col"
                    onOpenAutoFocus={(e) => { try { e.preventDefault(); } catch (_) { } }}
                    onCloseAutoFocus={(e) => { try { e.preventDefault(); } catch (_) { } }}
                  >
                    <DialogHeader className="sticky top-0 z-10 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:px-6 py-3 border-b">
                      <div className="flex items-center justify-between gap-2">
                        <DialogTitle className="text-base">
                          {dialogDate ? format(dialogDate, "EEEE d 'de' MMMM yyyy", { locale: es }) : 'Reservas'}
                        </DialogTitle>
                        <DialogDescription id="day-dialog-description" className="sr-only">
                          Lista y filtros de reservas del día seleccionado.
                        </DialogDescription>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => dialogDate && setDialogDate(addDays(dialogDate, -1))}>Anterior</Button>
                          <Button variant="outline" size="sm" onClick={() => setDialogDate(new Date())}>Hoy</Button>
                          <Button variant="outline" size="sm" onClick={() => dialogDate && setDialogDate(addDays(dialogDate, 1))}>Siguiente</Button>
                        </div>
                      </div>
                      {/* Filtros inline */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {(() => {
                          const list = dialogDate ? (reservationsByDay.get(format(startOfDay(dialogDate), 'yyyy-MM-dd')) || []) : [];
                          const total = list.length;
                          const apr = list.filter(r => r.status === 'aprobada').length;
                          const pen = list.filter(r => r.status === 'pendiente').length;
                          const rej = list.filter(r => r.status === 'rechazada').length;
                          const can = list.filter(r => r.status === 'cancelada').length;
                          return (
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="px-1.5 py-0.5 rounded border bg-muted text-muted-foreground">{total} total</span>
                              <span className="px-1.5 py-0.5 rounded border bg-green-100 text-green-700">{apr} apr.</span>
                              <span className="px-1.5 py-0.5 rounded border bg-yellow-100 text-yellow-800">{pen} pend.</span>
                              <span className="px-1.5 py-0.5 rounded border bg-red-100 text-red-700">{rej} rej.</span>
                              <span className="px-1.5 py-0.5 rounded border bg-gray-100 text-gray-700">{can} canc.</span>
                            </div>
                          );
                        })()}
                        <div className="ml-auto flex items-center gap-2">
                          <Select value={modalAreaFilter || ''} onValueChange={setModalAreaFilter}>
                            <SelectTrigger className="h-8 w-[200px]"><SelectValue placeholder="Área" /></SelectTrigger>
                            <SelectContent>
                              {modalAreas.map(a => (<SelectItem key={a} value={a}>{a}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <Select value={modalStatusFilter || 'all'} onValueChange={(v: any) => setModalStatusFilter(v)}>
                            <SelectTrigger className="h-8 w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                              <SelectItem value="aprobada">Aprobada</SelectItem>
                              <SelectItem value="rechazada">Rechazada</SelectItem>
                              <SelectItem value="cancelada">Cancelada</SelectItem>
                              <SelectItem value="en_curso">En Curso</SelectItem>
                              <SelectItem value="finalizada">Finalizada</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="relative">
                            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input value={modalSearch} onChange={(e) => setModalSearch(e.target.value)} placeholder="Buscar..." className="h-8 pl-8 w-[200px]" />
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Checkbox id="hideEmpty" checked={hideEmptyBlocks} onCheckedChange={(v) => setHideEmptyBlocks(Boolean(v))} />
                            <label htmlFor="hideEmpty" className="text-muted-foreground">Ocultar bloques vacíos</label>
                          </div>
                        </div>
                      </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                      {(() => {
                        const list = dialogDate ? (reservationsByDay.get(format(startOfDay(dialogDate), 'yyyy-MM-dd')) || []) : [];
                        if (list.length === 0) {
                          return <div className="text-sm text-muted-foreground">No hay reservas en este día.</div>;
                        }
                        const areas = modalAreas.length ? modalAreas : Array.from(new Set(list.map(r => r.areaName)));
                        const area = modalAreaFilter && areas.includes(modalAreaFilter) ? modalAreaFilter : areas[0];

                        // Filtros in-modal
                        let listForArea = area ? list.filter(r => r.areaName === area) : list;
                        if (modalStatusFilter !== 'all') listForArea = listForArea.filter(r => r.status === modalStatusFilter);
                        if (modalSearch.trim()) {
                          const s = modalSearch.toLowerCase();
                          listForArea = listForArea.filter(r =>
                            r.userName.toLowerCase().includes(s) ||
                            r.userEmail.toLowerCase().includes(s) ||
                            r.areaName.toLowerCase().includes(s)
                          );
                        }

                        // Derivar bloques directamente de las reservas (inicio-fin exactos)
                        const blockMap = new Map<string, { start: number; end: number }>();
                        for (const ev of listForArea) {
                          const s = parseTimeToMinutes(ev.horaInicio) ?? null;
                          if (s == null) continue;
                          const e = parseTimeToMinutes(ev.horaFin) ?? (s + Number(ev.duracion || 1) * 60);
                          const key = `${s}-${e}`;
                          if (!blockMap.has(key)) blockMap.set(key, { start: s, end: e });
                        }
                        const blocks = Array.from(blockMap.values()).sort((a, b) => a.start - b.start);

                        return (
                          <div className="space-y-3">
                            {/* selector de área del día */}
                            {areas.length > 1 && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Área:</span>
                                <Select value={area || ''} onValueChange={setModalAreaFilter}>
                                  <SelectTrigger className="h-8 w-[220px]"><SelectValue placeholder="Seleccione área" /></SelectTrigger>
                                  <SelectContent>
                                    {areas.map(a => (<SelectItem key={a} value={a}>{a}</SelectItem>))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Bloques */}
                            <div className="space-y-2">
                              {blocks
                                .map((b, idx) => {
                                  const blockLabel = `${formatTime12(`${Math.floor(b.start / 60)}:${String(b.start % 60).padStart(2, '0')}`)} - ${formatTime12(`${Math.floor(b.end / 60)}:${String(b.end % 60).padStart(2, '0')}`)}`;
                                  // Solo las reservas que exactamente coinciden con el bloque (evita duplicados por traslape)
                                  const inBlock = listForArea.filter(ev => {
                                    const s = parseTimeToMinutes(ev.horaInicio) ?? null;
                                    if (s == null) return false;
                                    const e = parseTimeToMinutes(ev.horaFin) ?? (s + Number(ev.duracion || 1) * 60);
                                    return s === b.start && e === b.end;
                                  });
                                  const blockKey = `${Math.floor(b.start / 60)}:${String(b.start % 60).padStart(2, '0')}-${Math.floor(b.end / 60)}:${String(b.end % 60).padStart(2, '0')}`;
                                  const isCollapsed = collapsedBlocks.has(blockKey);
                                  return (
                                    <div key={idx} className="rounded-md border">
                                      <button
                                        type="button"
                                        className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
                                        onClick={() => setCollapsedBlocks(prev => {
                                          const n = new Set(prev);
                                          if (n.has(blockKey)) n.delete(blockKey); else n.add(blockKey);
                                          return n;
                                        })}
                                      >
                                        <div className="flex items-center gap-2">
                                          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                          <div className="text-sm font-medium">{blockLabel}</div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">{inBlock.length} reservas</div>
                                      </button>
                                      {inBlock.length > 0 && !isCollapsed && (
                                        <div className="px-3 py-2 space-y-2">
                                          {/* Acciones masivas si hay seleccionados */}
                                          {selectedIds.size > 0 && (
                                            <div className="flex items-center justify-between p-2 rounded border bg-muted/30">
                                              <div className="text-xs text-muted-foreground">{selectedIds.size} seleccionadas</div>
                                              <div className="flex items-center gap-2">
                                                <Button size="sm" className="h-7" onClick={() => {
                                                  console.log('🔍 [DEBUG] Botón Aprobar múltiples reservas clickeado:', Array.from(selectedIds));
                                                  updateMultipleReservationsStatus(Array.from(selectedIds), 'aprobada');
                                                }}>
                                                  <CheckCircle className="mr-2 h-3 w-3" /> Aprobar
                                                </Button>
                                                <Button size="sm" variant="destructive" className="h-7" onClick={() => setRejectDialogOpen(true)}>
                                                  <XCircle className="mr-2 h-3 w-3" /> Rechazar
                                                </Button>
                                              </div>
                                            </div>
                                          )}

                                          {inBlock
                                            .sort((a, b) => {
                                              const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                                              const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                                              const byCreated = ca - cb;
                                              if (byCreated !== 0) return byCreated;
                                              return (parseTimeToMinutes(a.horaInicio) ?? 0) - (parseTimeToMinutes(b.horaInicio) ?? 0);
                                            })
                                            .map(ev => {
                                              return (
                                                <div key={ev.id} className="p-2 rounded border group">
                                                  <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                      <div className="text-sm font-medium">{ev.userName}</div>
                                                      <div className="text-[11px] text-blue-600">{ev.userDomicilio}</div>
                                                      <div className="text-[11px] font-medium">
                                                        {ev.isMoroso ? (
                                                          <span className="text-red-600">Moroso</span>
                                                        ) : (
                                                          <span className="text-green-600">Al día</span>
                                                        )}
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                      <Badge className={`text-[11px] ${statusColors[ev.status]}`}>
                                                        {updatingReservationIds.has(ev.id) ? 'Actualizando…' : statusLabels[ev.status]}
                                                      </Badge>
                                                      <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                          <Button variant="ghost" className="h-7 w-7 p-0" title="Acciones">
                                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                                          </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                          <ReservationAuditHistory
                                                            reservationId={ev.id}
                                                            residencialId={user?.residencialID || userClaims?.residencialId || ev.residencialId || ''}
                                                            trigger={
                                                              <DropdownMenuItem onSelect={(e) => {
                                                                e.preventDefault();
                                                                console.log('🔍 [DEBUG] Abriendo historial para (vista calendario):', {
                                                                  reservationId: ev.id,
                                                                  residencialId: user?.residencialID,
                                                                  userClaims_residencialId: userClaims?.residencialId,
                                                                  ev_residencialId: ev.residencialId,
                                                                  finalResidencialId: user?.residencialID || userClaims?.residencialId || ev.residencialId || '',
                                                                  userObject: user,
                                                                  userClaims: userClaims,
                                                                  eventData: ev
                                                                });
                                                              }}>
                                                                <History className="mr-2 h-3 w-3" />
                                                                Ver Historial
                                                              </DropdownMenuItem>
                                                            }
                                                          />
                                                          {ev.status !== 'aprobada' && (
                                                            <DropdownMenuItem disabled={updatingReservationIds.has(ev.id)} onClick={() => {
                                                              console.log('🔍 [DEBUG] Botón Marcar como aprobada clickeado:', ev.id);
                                                              updateReservationStatus(ev.id, 'aprobada');
                                                            }} className="text-green-600">
                                                              <CheckCircle className="mr-2 h-3 w-3" /> Marcar como aprobada
                                                            </DropdownMenuItem>
                                                          )}
                                                          {ev.status !== 'finalizada' && (
                                                            <DropdownMenuItem disabled={updatingReservationIds.has(ev.id)} onClick={() => {
                                                              console.log('🔍 [DEBUG] Botón Marcar como completada clickeado:', ev.id);
                                                              updateReservationStatus(ev.id, 'finalizada');
                                                            }} className="text-purple-600">
                                                              <CheckCircle className="mr-2 h-3 w-3" /> Marcar como completada
                                                            </DropdownMenuItem>
                                                          )}
                                                          {ev.status !== 'rechazada' && (
                                                            <DropdownMenuItem onClick={() => { setRejectReason(''); setRejectDialogOpen(true); setSelectedIds(new Set([ev.id])); }} className="text-red-600">
                                                              <XCircle className="mr-2 h-3 w-3" /> Marcar como rechazada
                                                            </DropdownMenuItem>
                                                          )}
                                                          {ev.status !== 'pendiente' && (
                                                            <DropdownMenuItem disabled={updatingReservationIds.has(ev.id)} onClick={() => updateReservationStatus(ev.id, 'pendiente')}>
                                                              <Clock className="mr-2 h-3 w-3" /> Volver a pendiente
                                                            </DropdownMenuItem>
                                                          )}
                                                          <DropdownMenuItem onClick={async () => {
                                                            console.log('🔍 [DEBUG] Clic en eliminar reserva (calendario):', ev.id);

                                                            // SOLUCIÓN TEMPORAL: Usar confirm() nativo mientras se resuelve el problema del diálogo
                                                            const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar esta reserva?\n\nID: ${ev.id}\n\nEsta acción no se puede deshacer.`);

                                                            if (confirmed) {
                                                              console.log('✅ [DEBUG] Usuario confirmó eliminación');
                                                              await deleteReservation(ev.id);
                                                            } else {
                                                              console.log('❌ [DEBUG] Usuario canceló eliminación');
                                                            }

                                                            // Código original comentado temporalmente
                                                            // setDeleteTargetId(ev.id); 
                                                            // setDeleteDialogOpen(true);
                                                            // console.log('🔍 [DEBUG] Estado actualizado:', { deleteTargetId: ev.id, deleteDialogOpen: true });
                                                          }} className="text-red-600">
                                                            <Trash className="mr-2 h-3 w-3" /> Eliminar reserva
                                                          </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                      </DropdownMenu>
                                                    </div>
                                                  </div>
                                                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[13px]">
                                                    <div className="flex items-center gap-1"><CalendarIcon2 className="h-3 w-3" /> {formatTime12(ev.horaInicio)}{ev.horaFin ? ` - ${formatTime12(ev.horaFin)}` : ''}</div>
                                                    <div className="flex items-center gap-1"><Users className="h-3 w-3" /> {ev.personas}</div>
                                                    <div className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> ${ev.precio}</div>
                                                    <div className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {ev.createdAt ? `Reservado el ${format(ev.createdAt, "dd/MM/yyyy 'a las' h:mm a", { locale: es })}` : 'Reservado: s/f'}</div>

                                                    {/* 🗝️ NUEVO: Estado de las llaves */}
                                                    {ev.estadoLlaves && (
                                                      <div className="flex items-center gap-1">
                                                        <Key className="h-3 w-3" />
                                                        <Badge className={`text-[10px] ${keysStatusColors[ev.estadoLlaves]}`}>
                                                          {keysStatusLabels[ev.estadoLlaves]}
                                                        </Badge>
                                                      </div>
                                                    )}

                                                    {/* 🗝️ NUEVO: Información adicional de llaves */}
                                                    {ev.estadoLlaves === 'entregadas' && ev.fechaEntregaLlaves && (
                                                      <div className="flex items-center gap-1 text-blue-600">
                                                        <CheckCircle className="h-3 w-3" />
                                                        <span className="text-[10px]">Entregada {format(ev.fechaEntregaLlaves, "h:mm a", { locale: es })}</span>
                                                      </div>
                                                    )}

                                                    {ev.estadoLlaves === 'recibidas' && ev.fechaRecepcionLlaves && (
                                                      <div className="flex items-center gap-1 text-green-600">
                                                        <Key className="h-3 w-3" />
                                                        <span className="text-[10px]">Recibida {format(ev.fechaRecepcionLlaves, "h:mm a", { locale: es })}</span>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {rejectDialogOpen && (
                <Dialog open={rejectDialogOpen} onOpenChange={(o) => { setRejectDialogOpen(o); if (!o) setSelectedIds(new Set()); }}>
                  <DialogContent aria-describedby="reject-reason-description" className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Motivo de rechazo</DialogTitle>
                      <DialogDescription id="reject-reason-description" className="sr-only">Formulario para especificar el motivo de rechazo de la reserva.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Input placeholder="Escribe el motivo..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => { setRejectDialogOpen(false); setSelectedIds(new Set()); }}>Cancelar</Button>
                        <Button variant="destructive" onClick={async () => { await updateMultipleReservationsStatus(Array.from(selectedIds), 'rechazada', rejectReason.trim() || 'Rechazada desde panel administrativo'); setRejectDialogOpen(false); }}>Rechazar</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Confirmación de eliminación */}
              {deleteDialogOpen && (
                <Dialog open={deleteDialogOpen} onOpenChange={(o) => {
                  console.log('🔍 [DEBUG] Cambio de estado del diálogo:', o);
                  setDeleteDialogOpen(o);
                  if (!o) setDeleteTargetId(null);
                }}>
                  <DialogContent aria-describedby="delete-reservation-description" className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Eliminar reserva</DialogTitle>
                      <DialogDescription id="delete-reservation-description" className="sr-only">Confirmación para eliminar definitivamente la reserva seleccionada.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                      <p>¿Estás seguro de que deseas eliminar esta reserva? Esta acción no se puede deshacer.</p>
                      {deleteTargetId && (
                        <p className="text-xs text-muted-foreground">ID de reserva: {deleteTargetId}</p>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                        console.log('🔍 [DEBUG] Cancelando eliminación');
                        setDeleteDialogOpen(false);
                        setDeleteTargetId(null);
                      }}>Cancelar</Button>
                      <Button variant="destructive" onClick={async () => {
                        console.log('🔍 [DEBUG] Confirmando eliminación de:', deleteTargetId);
                        if (deleteTargetId) {
                          await deleteReservation(deleteTargetId);
                        }
                        setDeleteDialogOpen(false);
                        setDeleteTargetId(null);
                      }}>Eliminar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}

          {/* Paginación compacta (solo en tabla) */}
          {viewMode === 'table' && totalPages > 1 && (
            <div className="flex items-center justify-between py-3 border-t">
              <div className="text-xs text-muted-foreground">
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredReservations.length)} de {filteredReservations.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-7 px-2"
                >
                  ←
                </Button>
                <span className="text-xs px-2">
                  {currentPage}/{totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-7 px-2"
                >
                  →
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}