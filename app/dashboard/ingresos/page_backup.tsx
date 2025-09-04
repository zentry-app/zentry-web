"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TrendingUp, Users, Calendar, Building, Car, Download, FileSpreadsheet } from "lucide-react";
import { 
  Residencial, 
  getResidenciales,
  getIngresos,
  suscribirseAIngresos
} from "@/lib/firebase/firestore";
import { Ingreso, Timestamp as IngresoTimestamp } from "@/types/ingresos";
import { formatDistanceToNow, format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ArrowRightLeft, Clock, Search, Filter, Wifi, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useIngresosFilters } from "@/hooks/useIngresosFilters";
import AdvancedFiltersBar from "@/components/dashboard/ingresos/AdvancedFiltersBar";
import PaginationControls from "@/components/dashboard/ingresos/PaginationControls";
import { exportToCSV, getExportStats } from "@/lib/utils/exportUtils";

// Importar dinámicamente TablaIngresos y DetallesIngresoDialogContent
const TablaIngresos = dynamic(() => import('@/components/dashboard/ingresos/TablaIngresos'), {
  suspense: true,
  ssr: false,
});

const DetallesIngresoDialogContent = dynamic(() => import('@/components/dashboard/ingresos/DetallesIngresoDialogContent'), {
  suspense: true,
});

// Helper para convertir Timestamp de Firestore a Date
const convertFirestoreTimestampToDate = (timestamp: IngresoTimestamp | Date | string): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  if (timestamp && typeof timestamp.seconds === 'number' && typeof timestamp.nanoseconds === 'number') {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  }
  // Fallback si el formato no es el esperado
  console.warn("Timestamp inesperado, usando fecha actual como fallback:", timestamp)
  return new Date(); 
};

// Función para capitalizar nombres
const capitalizeName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function IngresosPage() {
  const router = useRouter();
  const { user, userClaims, loading: authLoading } = useAuth();

  const [residenciales, setResidenciales] = useState<Residencial[]>([]);
  const [residencialFilter, setResidencialFilter] = useState<string>("todos");
  const [tipoIngresoFilter, setTipoIngresoFilter] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [plateFilter, setPlateFilter] = useState<string>("");
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIngreso, setSelectedIngreso] = useState<Ingreso | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [mapeoResidenciales, setMapeoResidenciales] = useState<{[key: string]: string}>({}); // docId: nombre

  const esAdminDeResidencial = useMemo(() => userClaims?.isResidencialAdmin && !userClaims?.isGlobalAdmin, [userClaims]);
  const residencialCodigoDelAdmin = useMemo(() => esAdminDeResidencial ? userClaims?.managedResidencialId : null, [esAdminDeResidencial, userClaims]);
  
  const residencialIdDocDelAdmin = useMemo(() => {
    if (!esAdminDeResidencial || !residencialCodigoDelAdmin || Object.keys(mapeoResidenciales).length === 0) return null;
    const idDoc = Object.keys(mapeoResidenciales).find(
      key => residenciales.find(r => r.id === key)?.residencialID === residencialCodigoDelAdmin
    );
    return idDoc || null;
  }, [esAdminDeResidencial, residencialCodigoDelAdmin, mapeoResidenciales, residenciales]);

  const addLog = useCallback((message: string) => { 
    const timestampLog = new Date().toLocaleTimeString();
    const logMessage = `[${timestampLog}] ${message}`;
    setLogs(prevLogs => [logMessage, ...prevLogs.slice(0, 199)]); // Guardar hasta 200 logs
    // console.log(logMessage); // Descomentar para depuración en consola
  }, []);

  // Función avanzada de búsqueda
  const advancedSearch = useCallback((ingreso: Ingreso, searchTerms: string) => {
    const terms = searchTerms.toLowerCase();
    
    // Búsqueda por nombre (con capitalización)
    const nameMatch = ingreso.visitData?.name && 
      capitalizeName(ingreso.visitData.name).toLowerCase().includes(terms);
    
    // Búsqueda por placa (más prominente)
    const plateMatch = ingreso.vehicleInfo?.placa && 
      ingreso.vehicleInfo.placa.toLowerCase().includes(terms);
    
    // Búsqueda por domicilio
    const addressMatch = 
      (ingreso.domicilio?.calle && capitalizeName(ingreso.domicilio.calle).toLowerCase().includes(terms)) ||
      (ingreso.domicilio?.houseNumber && ingreso.domicilio.houseNumber.toLowerCase().includes(terms));
    
    // Búsqueda por vehículo (marca, modelo, color)
    const vehicleMatch = ingreso.vehicleInfo && (
      capitalizeName(ingreso.vehicleInfo.marca).toLowerCase().includes(terms) ||
      capitalizeName(ingreso.vehicleInfo.modelo).toLowerCase().includes(terms) ||
      capitalizeName(ingreso.vehicleInfo.color).toLowerCase().includes(terms)
    );
    
    // Búsqueda por códigos y IDs
    const codeMatch = 
      (ingreso.codigoAcceso && ingreso.codigoAcceso.toLowerCase().includes(terms)) ||
      (ingreso.userId && ingreso.userId.toLowerCase().includes(terms)) ||
      (ingreso.registradoPor && ingreso.registradoPor.toLowerCase().includes(terms));
    
    // Búsqueda por residencial
    const residentialMatch = ingreso._residencialNombre && 
      ingreso._residencialNombre.toLowerCase().includes(terms);
    
    // Búsqueda por estado y categoría
    const statusMatch = 
      (ingreso.status && ingreso.status.toLowerCase().includes(terms)) ||
      (ingreso.category && ingreso.category.toLowerCase().includes(terms)) ||
      (ingreso.entryMethod && ingreso.entryMethod.toLowerCase().includes(terms));

    return nameMatch || plateMatch || addressMatch || vehicleMatch || 
           codeMatch || residentialMatch || statusMatch;
  }, []);

  const filteredIngresos = useMemo(() => {
    return ingresos.filter(ingreso => {
      // Filtro por tipo
      const matchesTipo = tipoIngresoFilter === "todos" || ingreso.category === tipoIngresoFilter;
      
      // Búsqueda general
      const matchesSearch = searchTerm === "" || advancedSearch(ingreso, searchTerm);
      
      // Filtro por fecha
      let matchesDate = true;
      if (dateFilter) {
        try {
          const targetDate = parseISO(dateFilter);
          const ingresoDate = convertFirestoreTimestampToDate(ingreso.timestamp);
          matchesDate = isWithinInterval(ingresoDate, {
            start: startOfDay(targetDate),
            end: endOfDay(targetDate)
          });
        } catch (error) {
          console.warn("Error parsing date filter:", error);
        }
      }
      
      // Filtro específico por placa
      let matchesPlate = true;
      if (plateFilter) {
        matchesPlate = Boolean(ingreso.vehicleInfo?.placa && 
          ingreso.vehicleInfo.placa.toLowerCase().includes(plateFilter.toLowerCase()));
      }

      return matchesTipo && matchesSearch && matchesDate && matchesPlate;
    });
  }, [ingresos, tipoIngresoFilter, searchTerm, dateFilter, plateFilter, advancedSearch]);

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("");
    setPlateFilter("");
    setTipoIngresoFilter("todos");
  };

  const hasActiveFilters = Boolean(searchTerm || dateFilter || plateFilter || tipoIngresoFilter !== "todos");

  useEffect(() => {
    const fetchResidenciales = async () => {
      try {
        addLog("🏢 Cargando residenciales...");
        const residencialesData = await getResidenciales();
        setResidenciales(residencialesData);
        
        const mapeo = residencialesData.reduce<{[key: string]: string}>((acc, r) => {
          if (r.id && r.nombre) acc[r.id] = r.nombre; // Mapea docId a nombre
          return acc;
        }, {});
        setMapeoResidenciales(mapeo);
        addLog(`✅ ${residencialesData.length} residenciales cargados y mapeo creado.`);

        if (esAdminDeResidencial && residencialCodigoDelAdmin) {
           const idDocAdmin = residencialesData.find(r => r.residencialID === residencialCodigoDelAdmin)?.id;
          if (idDocAdmin) {
            setResidencialFilter(idDocAdmin);
            addLog(`👤 Admin de Residencial detectado (${residencialCodigoDelAdmin}). Filtro preseleccionado a ID: ${idDocAdmin}`);
          } else {
            addLog(`⚠️ Admin de Residencial (${residencialCodigoDelAdmin}), pero no se encontró el ID de documento para su residencial.`);
            toast.error("No se pudo encontrar tu residencial asignado.");
          }
        } else if (!esAdminDeResidencial && residencialesData.length > 0 && residencialFilter === "todos") {
          // Si es admin global y el filtro es "todos", no preseleccionar nada específico.
        } else if (residencialesData.length > 0) {
          // Para otros casos o si el filtro inicial no es "todos", no se cambia el filtro.
        }

      } catch (error) {
        addLog(`❌ Error al cargar residenciales: ${error}`);
        toast.error("Error al cargar residenciales");
      }
    };

    if (userClaims?.isGlobalAdmin || esAdminDeResidencial) {
        fetchResidenciales();
    }
  }, [userClaims, esAdminDeResidencial, residencialCodigoDelAdmin, addLog]);


  useEffect(() => {
    let unsubscribes: (() => void)[] = [];

    const setupSubscriptions = async () => {
      if (authLoading) {
        addLog("⏳ Autenticación en curso, esperando para configurar suscripciones de ingresos.");
        return;
      }
      if (!userClaims?.isGlobalAdmin && !esAdminDeResidencial) {
        addLog("🚫 Usuario no autorizado para ver ingresos, no se configuran suscripciones.");
        setLoading(false);
        return;
      }
      if (Object.keys(mapeoResidenciales).length === 0 && !esAdminDeResidencial && residencialFilter !== "todos") {
         addLog("⏳ Esperando carga de mapeoResidenciales para fetchIngresos...");
         return;
      }
      if (esAdminDeResidencial && !residencialIdDocDelAdmin) {
        addLog("⏳ Admin de Res: Esperando residencialIdDocDelAdmin para suscripciones de ingresos...");
        return;
      }


      setLoading(true);
      addLog(`🔔 Configurando suscripciones en tiempo real para ingresos. Filtro Residencial: ${residencialFilter}`);

      // Limpiar suscripciones anteriores
      unsubscribes.forEach(unsub => unsub());
      unsubscribes = [];
      setIngresos([]); // Limpiar ingresos al cambiar de filtro de residencial

      const handleNewIngresos = (nuevosIngresos: Ingreso[], residencialDocId: string, nombreResidencial?: string) => {
        const ingresosConNombreRes = nuevosIngresos.map(ing => ({
          ...ing,
          _residencialDocId: residencialDocId,
          _residencialNombre: nombreResidencial || mapeoResidenciales[residencialDocId] || "Desconocido"
        }));

        setIngresos(prevIngresos => {
          const otrosIngresos = prevIngresos.filter(i => i._residencialDocId !== residencialDocId);
          const todos = [...otrosIngresos, ...ingresosConNombreRes];
          todos.sort((a, b) => {
            const dateA = convertFirestoreTimestampToDate(a.timestamp).getTime();
            const dateB = convertFirestoreTimestampToDate(b.timestamp).getTime();
            return dateB - dateA;
          });
          return todos;
        });
        setLoading(false);
      };
      
      if (residencialFilter === "todos" && userClaims?.isGlobalAdmin) {
        addLog("🌎 Admin Global: Suscribiéndose a ingresos de todos los residenciales.");
        if (residenciales.length === 0) {
            addLog("⏳ Admin Global: No hay residenciales cargados aún para 'todos'. Esperando...");
            setLoading(false); // Podríamos mantener loading true si esperamos que se carguen pronto
            return;
        }
        residenciales.forEach(residencial => {
          if (residencial.id) {
            addLog(`🔔 Suscribiéndose a ingresos para: ${residencial.nombre} (ID: ${residencial.id})`);
            const unsubscribe = suscribirseAIngresos(residencial.id, (nuevosIngresos) => {
              addLog(`📣 Actualización de ingresos para ${residencial.nombre}: ${nuevosIngresos.length}`);
              handleNewIngresos(nuevosIngresos, residencial.id!, residencial.nombre);
            });
            unsubscribes.push(unsubscribe);
          }
        });
      } else if (residencialFilter !== "todos") {
        const targetResidencialId = esAdminDeResidencial ? residencialIdDocDelAdmin : residencialFilter;
        if (targetResidencialId) {
          const nombreRes = mapeoResidenciales[targetResidencialId] || residenciales.find(r=>r.id === targetResidencialId)?.nombre;
          addLog(`🔔 Suscribiéndose a ingresos para residencial específico: ${nombreRes} (ID: ${targetResidencialId})`);
          const unsubscribe = suscribirseAIngresos(targetResidencialId, (nuevosIngresos) => {
            addLog(`📣 Actualización de ingresos para ${nombreRes}: ${nuevosIngresos.length}`);
            handleNewIngresos(nuevosIngresos, targetResidencialId, nombreRes);
          });
          unsubscribes.push(unsubscribe);
        } else {
            addLog("⚠️ No se pudo determinar el ID del residencial para la suscripción.");
            setLoading(false);
        }
      } else {
        addLog("🚫 No hay filtro de residencial seleccionado o no es admin global. No se suscribirá.");
        setLoading(false);
      }
    };

    setupSubscriptions();

    return () => {
      addLog(`🛑 Cancelando ${unsubscribes.length} suscripciones de ingresos.`);
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [residencialFilter, residenciales, authLoading, userClaims, esAdminDeResidencial, residencialIdDocDelAdmin, mapeoResidenciales, addLog]);


  useEffect(() => {
    if (ingresos.length > 0 || !loading) {
      addLog(`📊 Total ingresos: ${ingresos.length}, Filtrados: ${filteredIngresos.length}. Carga: ${loading ? 'ON' : 'OFF'}`);
    }
  }, [ingresos.length, filteredIngresos.length, loading, addLog]);
  
  if (authLoading) {
    return (
      <div className="space-y-6 p-4 md:p-8">
        <Skeleton className="h-10 w-2/3 mb-4" />
        <Skeleton className="h-8 w-1/3 mb-6" />
        <div className="flex flex-col md:flex-row gap-4 mb-6">
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
                    <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
                    <Button onClick={() => router.push('/dashboard')} className="mt-6">Volver al Dashboard</Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  const handleOpenDetails = (ingreso: Ingreso) => {
    setSelectedIngreso(ingreso);
    setDetailsOpen(true);
  };

  const formatDateToRelative = (timestamp: IngresoTimestamp | Date | string) => {
    if (!timestamp) return "Fecha desconocida";
    try {
      const date = convertFirestoreTimestampToDate(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch (error) {
      addLog(`Error formateando fecha relativa: ${error}`);
      return "Fecha inválida";
    }
  };
  
  const formatDateToFull = (timestamp: IngresoTimestamp | Date | string) => {
    if (!timestamp) return "Fecha desconocida";
    try {
      const date = convertFirestoreTimestampToDate(timestamp);
      return format(date, "P h:mm aa", { locale: es }); // ej: 31 de may. de 2024 6:00 p.m.
    } catch (error) {
      addLog(`Error formateando fecha completa: ${error}`);
      return "Fecha inválida";
    }
  };

  const tiposDeIngreso = [
    { value: "todos", label: "Todos los tipos" },
    { value: "temporal", label: "Accesos Temporales" },
    { value: "evento", label: "Eventos" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center">
            <ArrowRightLeft className="mr-2 h-6 w-6" /> Gestión de Ingresos y Salidas
          </h2>
          <p className="text-muted-foreground">
            Historial y seguimiento de todos los accesos al residencial.
            <span className="text-xs block mt-1 flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1 inline" />
              Última actualización: {new Date().toLocaleTimeString()}
              {ingresos.length > 0 && !loading && (
                <span className="flex items-center ml-2 text-green-500">
                  <Wifi className="h-3.5 w-3.5 mr-1 animate-pulse" />
                  En tiempo real
                </span>
              )}
            </span>
          </p>
        </div>
      </div>
      
      {/* Búsqueda Principal */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Búsqueda Inteligente
          </CardTitle>
          <CardDescription>
            Busca por nombre, placa, fecha, domicilio, o cualquier información del ingreso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Búsqueda principal */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre, placa, domicilio, código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-base h-12"
            />
          </div>
          
          {/* Filtros específicos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Car className="h-4 w-4 mr-1" />
                Buscar por Placa
              </label>
              <Input
                type="text"
                placeholder="Ej: ABC123"
                value={plateFilter}
                onChange={(e) => setPlateFilter(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Buscar por Fecha
              </label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Filter className="h-4 w-4 mr-1" />
                Tipo de Acceso
              </label>
              <Select value={tipoIngresoFilter} onValueChange={setTipoIngresoFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposDeIngreso.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Indicadores de filtros activos */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Búsqueda: "{searchTerm}"
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm("")} />
                </Badge>
              )}
              {plateFilter && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Placa: {plateFilter}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setPlateFilter("")} />
                </Badge>
              )}
              {dateFilter && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Fecha: {format(parseISO(dateFilter), "PPP", { locale: es })}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setDateFilter("")} />
                </Badge>
              )}
              {tipoIngresoFilter !== "todos" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Tipo: {tiposDeIngreso.find(t => t.value === tipoIngresoFilter)?.label}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setTipoIngresoFilter("todos")} />
                </Badge>
              )}
            </div>
            
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground">
            {loading ? "Cargando ingresos..." : `${filteredIngresos.length} de ${ingresos.length} registros mostrados`}
          </div>
        </CardContent>
      </Card>
      
      {/* Filtro de Residencial */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-lg">Filtros por Residencial</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="w-full max-w-md">
            <label htmlFor="residencial" className="block text-sm font-medium mb-2">
              <Building className="h-4 w-4 mr-1 inline-block" />Residencial
            </label>
            <Select
              value={residencialFilter}
              onValueChange={(value) => {
                if (!esAdminDeResidencial) {
                  setResidencialFilter(value);
                  setIngresos([]);
                  addLog(`🔄 Filtro de residencial cambiado a: ${value}`)
                }
              }}
              disabled={esAdminDeResidencial && !!residencialIdDocDelAdmin}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar residencial" />
              </SelectTrigger>
              <SelectContent>
                {userClaims?.isGlobalAdmin && !esAdminDeResidencial && (
                  <SelectItem value="todos">Todos los residenciales</SelectItem>
                )}
                {residenciales
                  .filter(r => !esAdminDeResidencial || r.id === residencialIdDocDelAdmin)
                  .map((residencial) => (
                    <SelectItem key={residencial.id} value={residencial.id!}>
                      {residencial.nombre}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-xl flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Historial de Ingresos
          </CardTitle>
          <CardDescription>
            Registros ordenados por fecha (más recientes primero)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense fallback={
            <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          }>
            <TablaIngresos 
              loading={loading && ingresos.length === 0}
              ingresos={filteredIngresos}
              formatDateToRelative={formatDateToRelative}
              formatDateToFull={formatDateToFull}
              onOpenDetails={handleOpenDetails}
              getResidencialNombre={(docId) => docId ? (mapeoResidenciales[docId] || "Desconocido") : "No asignado"}
            />
          </Suspense>
        </CardContent>
      </Card>
      
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        {detailsOpen && (
          <Suspense fallback={<div className="p-6 text-center">Cargando detalles...</div>}>
            <DetallesIngresoDialogContent 
              selectedIngreso={selectedIngreso}
              formatDateToFull={formatDateToFull}
            />
          </Suspense>
        )}
      </Dialog>

      {/* Logs de desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Logs de Carga (Desarrollo)</CardTitle>
          </CardHeader>
          <CardContent className="max-h-60 overflow-y-auto bg-muted/30 p-4 rounded-md">
            {logs.length === 0 ? <p className="text-sm text-muted-foreground">No hay logs.</p> :
              logs.map((log, index) => (
                <p key={index} className="text-xs font-mono whitespace-pre-wrap">{log}</p>
              ))
            }
          </CardContent>
        </Card>
      )}
    </div>
  );
} 