"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  suscribirseAIngresos
} from "@/lib/firebase/firestore";
import { Ingreso, Timestamp as IngresoTimestamp } from "@/types/ingresos";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useIngresosFilters } from "@/hooks/useIngresosFilters";
import AdvancedFiltersBar from "@/components/dashboard/ingresos/AdvancedFiltersBar";
import PaginationControls from "@/components/dashboard/ingresos/PaginationControls";
import { exportToCSV, getExportStats } from "@/lib/utils/exportUtils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Importar dinámicamente TablaIngresos y DetallesIngresoDialogContent
const TablaIngresos = dynamic(() => import("@/components/dashboard/ingresos/TablaIngresos"), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false
});

const DetallesIngresoDialogContent = dynamic(() => import("@/components/dashboard/ingresos/DetallesIngresoDialogContent"), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false
});

// Función para convertir timestamp de Firestore a Date
const convertFirestoreTimestampToDate = (timestamp: IngresoTimestamp | Date | string): Date => {
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') return new Date(timestamp);
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date(); 
};

// Función para capitalizar nombres
const capitalizeName = (name: string): string => {
  return name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

export default function IngresosPage() {
  const router = useRouter();
  const { user, userClaims, loading: authLoading } = useAuth();

  // Estados principales
  const [residenciales, setResidenciales] = useState<Residencial[]>([]);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIngreso, setSelectedIngreso] = useState<Ingreso | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [mapeoResidenciales, setMapeoResidenciales] = useState<{[key: string]: string}>({});
  const [residencialFilter, setResidencialFilter] = useState<string>("todos");
  const initialFilterSetRef = useRef<boolean>(false);

  // Hook de filtros avanzados - DEBE estar antes de cualquier return condicional
  const {
    filters,
    filteredIngresos,
    paginatedIngresos,
    updateFilters,
    resetFilters,
    setQuickFilter,
    filterOptions,
    totalPages,
    hasActiveFilters,
    totalResults,
    currentResults
  } = useIngresosFilters(ingresos);

  // Verificar permisos de usuario
  const esAdminDeResidencial = useMemo(() => 
    userClaims?.isResidencialAdmin === true, 
    [userClaims]
  );
  
  const residencialCodigoDelAdmin = useMemo(() => 
    esAdminDeResidencial ? userClaims?.managedResidencialId || userClaims?.residencialId : null, 
    [esAdminDeResidencial, userClaims]
  );
  
  const residencialIdDocDelAdmin = useMemo(() => {
    if (!esAdminDeResidencial || !residencialCodigoDelAdmin || Object.keys(mapeoResidenciales).length === 0) return null;
    const idDoc = Object.keys(mapeoResidenciales).find(
      key => residenciales.find(r => r.id === key)?.residencialID === residencialCodigoDelAdmin
    );
    return idDoc || null;
  }, [esAdminDeResidencial, residencialCodigoDelAdmin, mapeoResidenciales, residenciales]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = ingresos.length;
    const activos = ingresos.filter(i => i.status === 'active').length;
    const completados = ingresos.filter(i => i.status === 'completed').length;
    const conVehiculo = ingresos.filter(i => i.vehicleInfo).length;
    
    return { total, activos, completados, conVehiculo };
  }, [ingresos]);

  // =====================
  // Pestañas Vehicular/Peatonal
  // =====================
  const isVehicular = useCallback((i: Ingreso) => {
    const method = (i.entryMethod || '').toLowerCase();
    return (
      !!i.vehicleInfo ||
      method.includes('vehicular') ||
      method === 'qr_with_physical_pass' ||
      method.includes('with_new_vehicle') ||
      method.includes('with_physical_pass') && !!i.vehicleInfo
    );
  }, []);

  const isPedestrian = useCallback((i: Ingreso) => {
    const method = (i.entryMethod || '').toLowerCase();
    return (
      method.startsWith('pedestrian') ||
      (!i.vehicleInfo && !method.includes('vehicular'))
    );
  }, []);

  const vehicularList = useMemo(() => {
    return filteredIngresos.filter(isVehicular);
  }, [filteredIngresos, isVehicular]);

  const pedestrianList = useMemo(() => {
    return filteredIngresos.filter(isPedestrian);
  }, [filteredIngresos, isPedestrian]);

  const startIndex = useMemo(() => (filters.currentPage - 1) * filters.pageSize, [filters.currentPage, filters.pageSize]);
  const endIndex = useMemo(() => startIndex + filters.pageSize, [startIndex, filters.pageSize]);
  const vehicularPage = useMemo(() => vehicularList.slice(startIndex, endIndex), [vehicularList, startIndex, endIndex]);
  const pedestrianPage = useMemo(() => pedestrianList.slice(startIndex, endIndex), [pedestrianList, startIndex, endIndex]);
    
  // Función para obtener nombre del residencial
  const getResidencialNombre = useCallback((docId: string | undefined): string => {
    if (!docId) return "Desconocido";
    return mapeoResidenciales[docId] || 
           residenciales.find(r => r.id === docId)?.nombre || 
           "Desconocido";
  }, [mapeoResidenciales, residenciales]);
    
  // Función para abrir detalles
  const handleOpenDetails = useCallback((ingreso: Ingreso) => {
    setSelectedIngreso(ingreso);
    setDetailsOpen(true);
  }, []);

  // Función para exportar datos
  const handleExport = useCallback(() => {
    const dataToExport = hasActiveFilters ? filteredIngresos : ingresos;
    exportToCSV(dataToExport, getResidencialNombre);
    toast.success(`Exportados ${dataToExport.length} registros a CSV`);
  }, [filteredIngresos, ingresos, hasActiveFilters, getResidencialNombre]);
      
  // Función para formatear fechas
  const formatDateToRelative = useCallback((timestamp: IngresoTimestamp | Date | string) => {
    try {
      const date = convertFirestoreTimestampToDate(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
        } catch (error) {
      return "Fecha inválida";
        }
  }, []);

  const formatDateToFull = useCallback((timestamp: IngresoTimestamp | Date | string) => {
    try {
      const date = convertFirestoreTimestampToDate(timestamp);
      return format(date, "dd/MM/yyyy, h:mm:ss a", { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  }, []);

  // Cargar residenciales
  useEffect(() => {
    const fetchResidenciales = async () => {
      try {
        setLoading(true);
        const residencialesData = await getResidenciales();
        setResidenciales(residencialesData);
        
        const mapeo = residencialesData.reduce<{[key: string]: string}>((acc, r) => {
          if (r.id && r.nombre) acc[r.id] = r.nombre;
          return acc;
        }, {});
        setMapeoResidenciales(mapeo);

        // Configurar filtro para admin de residencial (solo una vez)
        if (!initialFilterSetRef.current && userClaims?.isResidencialAdmin && residencialCodigoDelAdmin) {
          const idDocAdmin = residencialesData.find(r => r.residencialID === residencialCodigoDelAdmin)?.id;
          if (idDocAdmin) {
            setResidencialFilter(idDocAdmin);
            updateFilters({ residencialId: idDocAdmin });
            initialFilterSetRef.current = true;
          }
        }
      } catch (error) {
        toast.error("Error al cargar residenciales");
      } finally {
        setLoading(false);
      }
    };

    if (userClaims?.isGlobalAdmin || userClaims?.isResidencialAdmin) {
        fetchResidenciales();
    }
  }, [userClaims]);

  // Calcular una clave estable para la suscripción y evitar re-suscripciones innecesarias
  const subscriptionKey = useMemo(() => {
    if (userClaims?.isGlobalAdmin && residencialFilter === "todos") {
      return `todos:${residenciales.length}`;
    }
    if (residencialFilter !== "todos") {
      const targetResidencialId = userClaims?.isResidencialAdmin ? residencialIdDocDelAdmin : residencialFilter;
      return targetResidencialId ? `one:${targetResidencialId}` : null;
    }
    return null;
  }, [userClaims?.isGlobalAdmin, userClaims?.isResidencialAdmin, residencialFilter, residencialIdDocDelAdmin, residenciales.length]);

  // Configurar suscripciones a ingresos
  useEffect(() => {
    let unsubscribes: (() => void)[] = [];

    const setupSubscriptions = async () => {
      if (authLoading) {
        return;
      }
      
      if (!userClaims?.isGlobalAdmin && !userClaims?.isResidencialAdmin) {
        setLoading(false);
        return;
      }

      if (Object.keys(mapeoResidenciales).length === 0 && userClaims?.isResidencialAdmin && residencialFilter !== "todos") {
         return;
      }

      if (userClaims?.isResidencialAdmin && !residencialIdDocDelAdmin) {
        return;
      }

      if (!subscriptionKey) {
        return;
      }

      setLoading(true);

      // Limpiar suscripciones anteriores
      unsubscribes.forEach(unsub => unsub());
      unsubscribes = [];
      setIngresos([]);

      const handleNewIngresos = (nuevosIngresos: Ingreso[], residencialDocId: string, nombreResidencial?: string) => {
        const ingresosConMetadata = nuevosIngresos.map(ing => ({
          ...ing,
          _residencialDocId: residencialDocId,
          _residencialNombre: nombreResidencial || mapeoResidenciales[residencialDocId] || "Desconocido"
        }));

        setIngresos(prevIngresos => {
          const otrosIngresos = prevIngresos.filter(i => i._residencialDocId !== residencialDocId);
          const todos = [...otrosIngresos, ...ingresosConMetadata];
          todos.sort((a, b) => {
            const dateA = convertFirestoreTimestampToDate(a.timestamp).getTime();
            const dateB = convertFirestoreTimestampToDate(b.timestamp).getTime();
            return dateB - dateA;
          });
          return todos;
        });
        setLoading(false);
      };
      
      // Suscripción global (admin global)
      if (subscriptionKey.startsWith("todos:") && userClaims?.isGlobalAdmin) {
        if (residenciales.length === 0) {
          setLoading(false);
            return;
        }
        
        residenciales.forEach(residencial => {
          if (residencial.id) {
            const unsubscribe = suscribirseAIngresos(residencial.id, (nuevosIngresos) => {
              handleNewIngresos(nuevosIngresos, residencial.id!, residencial.nombre);
            });
            unsubscribes.push(unsubscribe);
          }
        });
      } else if (subscriptionKey.startsWith("one:")) {
        const targetResidencialId = subscriptionKey.replace("one:", "");
        if (targetResidencialId) {
          const nombreRes = mapeoResidenciales[targetResidencialId] || residenciales.find(r => r.id === targetResidencialId)?.nombre || "Desconocido";
          const unsubscribe = suscribirseAIngresos(targetResidencialId, (nuevosIngresos) => {
            handleNewIngresos(nuevosIngresos, targetResidencialId, nombreRes);
          });
          unsubscribes.push(unsubscribe);
        } else {
            setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    setupSubscriptions();

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [subscriptionKey, residenciales, authLoading, userClaims]);

  // Mostrar loading durante autenticación
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
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
            </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar permisos
  if (!userClaims?.isGlobalAdmin && !userClaims?.isResidencialAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Building className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Acceso Denegado</h2>
        <p className="text-muted-foreground text-center max-w-md">
          No tienes permisos para ver los ingresos. Contacta al administrador si crees que esto es un error.
        </p>
        <div className="text-xs text-muted-foreground/70 bg-muted/30 p-3 rounded mt-4">
          <strong>Información de depuración:</strong><br/>
          Role: {userClaims?.role || 'No definido'}<br/>
          Global Admin: {userClaims?.isGlobalAdmin ? 'Sí' : 'No'}<br/>
          Residencial Admin: {userClaims?.isResidencialAdmin ? 'Sí' : 'No'}<br/>
          Residencial ID: {userClaims?.residencialId || 'No definido'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Gestión de Ingresos</h1>
          <p className="text-muted-foreground">
          Monitorea y gestiona todos los ingresos del sistema en tiempo real
        </p>
      </div>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {currentResults} filtrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activos}</div>
            <p className="text-xs text-muted-foreground">
              En el residencial
            </p>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completados}</div>
            <p className="text-xs text-muted-foreground">
              Han salido
            </p>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Vehículo</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conVehiculo}</div>
            <p className="text-xs text-muted-foreground">
              Registraron vehículo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros Avanzados */}
      <AdvancedFiltersBar
        filters={filters}
        updateFilters={updateFilters}
        resetFilters={resetFilters}
        setQuickFilter={setQuickFilter}
        filterOptions={filterOptions}
        hasActiveFilters={hasActiveFilters}
        totalResults={totalResults}
        currentResults={currentResults}
        onExport={handleExport}
        getResidencialNombre={getResidencialNombre}
      />

      {/* Tabla de Ingresos con Pestañas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Ingresos</span>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Actualizando...
              </div>
            )}
          </CardTitle>
          <CardDescription>
            Gestiona los ingresos con filtros avanzados y búsqueda en tiempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="vehicular" className="w-full">
            <TabsList>
              <TabsTrigger value="vehicular">Vehicular ({vehicularList.length})</TabsTrigger>
              <TabsTrigger value="peatonal">Peatonal ({pedestrianList.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="vehicular">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <TablaIngresos 
                  ingresos={vehicularPage}
                  onOpenDetails={handleOpenDetails}
                  loading={loading}
                  formatDateToRelative={formatDateToRelative}
                  formatDateToFull={formatDateToFull}
                  getResidencialNombre={getResidencialNombre}
                  showVehicleColumn={true}
                />
              </Suspense>
            </TabsContent>
            <TabsContent value="peatonal">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <TablaIngresos 
                  ingresos={pedestrianPage}
                  onOpenDetails={handleOpenDetails}
                  loading={loading}
                  formatDateToRelative={formatDateToRelative}
                  formatDateToFull={formatDateToFull}
                  getResidencialNombre={getResidencialNombre}
                  showVehicleColumn={false}
                />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Paginación */}
      <PaginationControls
        currentPage={filters.currentPage}
        totalPages={totalPages}
        pageSize={filters.pageSize}
        totalResults={totalResults}
        currentResults={currentResults}
        onPageChange={(page) => updateFilters({ currentPage: page })}
        onPageSizeChange={(pageSize) => updateFilters({ pageSize })}
      />

      {/* Dialog de Detalles */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Ingreso</DialogTitle>
            <DialogDescription>
              Información completa del registro de ingreso
            </DialogDescription>
          </DialogHeader>
          {selectedIngreso && (
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <DetallesIngresoDialogContent 
              selectedIngreso={selectedIngreso}
              formatDateToFull={formatDateToFull}
            />
          </Suspense>
        )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 