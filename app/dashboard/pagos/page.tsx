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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, CreditCard, DollarSign, Clock, CheckCircle, XCircle, Eye, Wifi, Loader2, Calendar, Plus } from "lucide-react";
import { 
  Residencial, 
  getResidenciales, 
  getPagos, 
  suscribirseAPagos
} from "@/lib/firebase/firestore";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import TablaPagos from '@/components/dashboard/pagos/TablaPagos';
import { Pago, convertFirestoreTimestampToDate } from "@/types/pagos";
import StripeConnectAlert from '@/components/dashboard/pagos/StripeConnectAlert';
import UnifiedPaymentsDashboard from '@/components/dashboard/pagos/UnifiedPaymentsDashboard';
import SimplifiedPaymentsDashboard from '@/components/dashboard/pagos/SimplifiedPaymentsDashboardV2';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Importar dinámicamente DetallesPagoDialogContent
const DetallesPagoDialogContent = dynamic(() => import('@/components/dashboard/pagos/DetallesPagoDialogContent'), {
  suspense: true,
});

export default function PagosPage() {
  const router = useRouter();
  const { user, userClaims, loading: authLoading } = useAuth();

  const [residenciales, setResidenciales] = useState<Residencial[]>([]);
  const [residencialFilter, setResidencialFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [mapeoResidenciales, setMapeoResidenciales] = useState<{[key: string]: string}>({});
  const [activeTab, setActiveTab] = useState<'unified' | 'all'>('unified');

  const esAdminDeResidencial = useMemo(() => userClaims?.isResidencialAdmin && !userClaims?.isGlobalAdmin, [userClaims]);
  const residencialCodigoDelAdmin = useMemo(() => esAdminDeResidencial ? userClaims?.managedResidencialId : null, [esAdminDeResidencial, userClaims]);
  
  const residencialIdDocDelAdmin = useMemo(() => {
    if (!esAdminDeResidencial || !residencialCodigoDelAdmin || Object.keys(mapeoResidenciales).length === 0) return null;
    return Object.keys(mapeoResidenciales).find(
      key => mapeoResidenciales[key] === residencialCodigoDelAdmin
    ) || null;
  }, [esAdminDeResidencial, residencialCodigoDelAdmin, mapeoResidenciales]);

  const puedeRegistrarPagos = useMemo(() => {
    return (userClaims?.isGlobalAdmin && residencialFilter !== 'todos') || esAdminDeResidencial;
  }, [userClaims, residencialFilter, esAdminDeResidencial]);

  const addLog = useCallback((message: string) => { 
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prevLogs => [logMessage, ...prevLogs.slice(0, 99)]);
    console.log(message);
  }, [setLogs]);

  useEffect(() => {
    const fetchResidenciales = async () => {
      try {
        addLog("🏢 Cargando residenciales...");
        const residencialesData = await getResidenciales();
        setResidenciales(residencialesData);
        
        const mapeo = residencialesData.reduce<{[key: string]: string}>((acc, r) => {
          if (r.id && r.nombre) acc[r.id] = r.nombre;
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
    const fetchPagos = async () => {
      if (authLoading) return;
      
      if ((residenciales.length === 0 && !esAdminDeResidencial) || (esAdminDeResidencial && !residencialIdDocDelAdmin)) {
        if (residenciales.length === 0) addLog("⏳ Esperando carga de residenciales para fetchPagos...");
        if (esAdminDeResidencial && !residencialIdDocDelAdmin) addLog("⏳ Admin de Res: Esperando residencialIdDocDelAdmin para fetchPagos...");
        return; 
      }

      setLoading(true);
      const logMessages: string[] = [];
      try {
        logMessages.push(`🔍 Iniciando fetchPagos con filtro: ${residencialFilter}`);
        logMessages.push(`🏢 Residenciales disponibles: ${residenciales.map(r => r.nombre).join(', ')}`);
        
        if (residencialFilter === "todos") {
          logMessages.push(`📋 Cargando pagos de TODOS los residenciales`);
          const allPagos: Pago[] = [];
          
          for (const residencial of residenciales) {
            if (residencial.id) {
              logMessages.push(`🔄 Obteniendo pagos para residencial: ${residencial.nombre} (ID: ${residencial.id})`);
              const pagosResidencial = await getPagos(residencial.id);
              logMessages.push(`✅ Pagos obtenidos para ${residencial.nombre}: ${pagosResidencial.length}`);
              const pagosConResidencial = pagosResidencial.map(pago => ({
                ...pago,
                _residencialNombre: residencial.nombre
              }));
              allPagos.push(...pagosConResidencial);
            }
          }
          
          // Ordenar por timestamp
          allPagos.sort((a, b) => {
            const dateA = convertFirestoreTimestampToDate(a.timestamp).getTime();
            const dateB = convertFirestoreTimestampToDate(b.timestamp).getTime();
            return dateB - dateA;
          });
          
          logMessages.push(`📊 Total de pagos encontrados: ${allPagos.length}`);
          setPagos(allPagos);
          
        } else {
          logMessages.push(`📋 Cargando pagos para residencial específico: ${residencialFilter}`);
          const pagosResidencial = await getPagos(residencialFilter);
          logMessages.push(`✅ Pagos obtenidos: ${pagosResidencial.length}`);
          
          const residencial = residenciales.find(r => r.id === residencialFilter);
          logMessages.push(`🏢 Residencial encontrado: ${residencial?.nombre || "No encontrado"}`);
          
          if (pagosResidencial.length > 0) {
            const pagosConResidencial = pagosResidencial.map(pago => ({
              ...pago,
              _residencialNombre: residencial?.nombre || "Desconocido"
            }));
            setPagos(pagosConResidencial);
          } else {
            console.log(`⚠️ No se encontraron pagos para este residencial`);
            setPagos([]);
          }
        }
      } catch (error) {
        logMessages.push(`❌ Error al cargar pagos: ${error}`);
        toast.error("Error al cargar pagos");
      } finally {
        setLoading(false);
        setTimeout(() => {
          logMessages.forEach(msg => addLog(msg));
        }, 0);
      }
    };

    if (residenciales.length > 0) {
      fetchPagos();
    } else {
      fetchPagos();
    }
  }, [residenciales, residencialFilter, authLoading, esAdminDeResidencial, residencialIdDocDelAdmin, addLog]);

  useEffect(() => {
    let unsubscribes: (() => void)[] = [];
    const setupSubscriptions = async () => {
      addLog(`🔔 Configurando suscripciones en tiempo real para pagos`);
      if (residencialFilter === "todos") {
        if (residenciales.length > 0) {
          for (const residencial of residenciales) {
            if (residencial.id) {
              addLog(`🔔 Suscribiéndose a pagos en tiempo real para: ${residencial.nombre}`);
              const unsubscribe = suscribirseAPagos(residencial.id, (pagosActualizados) => {
                addLog(`📣 Recibida actualización en tiempo real de pagos para ${residencial.nombre}. Pagos: ${pagosActualizados.length}`);
                setPagos(prevPagos => {
                  const pagosDeOtrosResidenciales = prevPagos.filter(
                    pago => pago._residencialDocId !== residencial.id
                  );
                  const nuevosPagosConResidencial = pagosActualizados.map(pago => ({
                    ...pago,
                    _residencialNombre: residencial.nombre
                  }));
                  const todosLosPagos = [...pagosDeOtrosResidenciales, ...nuevosPagosConResidencial];
                  // Ordenar por timestamp
                  todosLosPagos.sort((a, b) => {
                    const dateA = convertFirestoreTimestampToDate(a.timestamp).getTime();
                    const dateB = convertFirestoreTimestampToDate(b.timestamp).getTime();
                    return dateB - dateA;
                  });
                  return todosLosPagos;
                });
              });
              unsubscribes.push(unsubscribe);
            }
          }
        }
      } else {
        addLog(`🔔 Suscribiéndose a pagos en tiempo real para: ${residencialFilter}`);
        const unsubscribe = suscribirseAPagos(residencialFilter, (pagosActualizados) => {
          addLog(`📣 Recibida actualización en tiempo real de pagos. Pagos: ${pagosActualizados.length}`);
          if (pagosActualizados.length > 0) {
            const residencial = residenciales.find(r => r.id === residencialFilter);
            const pagosConResidencial = pagosActualizados.map(pago => ({
              ...pago,
              _residencialNombre: residencial?.nombre || "Desconocido"
            }));
            setPagos(pagosConResidencial);
          } else {
            console.log("⚠️ No se encontraron pagos");
            setPagos([]);
          }
          setLoading(false);
        });
        unsubscribes.push(unsubscribe);
      }
    };
    setupSubscriptions();
    return () => {
      addLog(`🛑 Cancelando todas las suscripciones de pagos`);
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [residencialFilter, residenciales, authLoading, esAdminDeResidencial, residencialIdDocDelAdmin, addLog]);

  const filteredPagos = useMemo(() => pagos.filter(pago => {
    const matchesStatus = statusFilter === "todos" || pago.status === statusFilter;
    const matchesSearch = 
      searchTerm === "" || 
      (pago.userName && pago.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (pago.userEmail && pago.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (pago.description && pago.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (pago.paymentMethod && pago.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (pago.userAddress.calle && pago.userAddress.calle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (pago.userAddress.houseNumber && pago.userAddress.houseNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  }), [pagos, statusFilter, searchTerm]);

  useEffect(() => {
    if (pagos.length > 0) {
      setTimeout(() => {
        addLog(`📊 Total pagos: ${pagos.length}, Filtrados: ${filteredPagos.length}`);
      }, 0);
    }
  }, [pagos.length, filteredPagos.length, addLog]);
  
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
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
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

  // Abrir detalles de pago
  const handleOpenDetails = async (pago: Pago) => {
    setSelectedPago(pago);
    setDetailsOpen(true);
  };

  // Obtener etiqueta para el estado
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'succeeded': return 'Completado';
      case 'pending': return 'Pendiente';
      case 'failed': return 'Fallido';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  // Obtener color para el estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Formatear fecha usando la función helper
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Fecha desconocida";
    
    try {
      const date = convertFirestoreTimestampToDate(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "Fecha inválida";
    }
  };

  // Formatear fecha completa
  const formatDateFull = (timestamp: any) => {
    if (!timestamp) return "Fecha desconocida";
    
    try {
      const date = convertFirestoreTimestampToDate(timestamp);
      return format(date, "P h:mm aa", { locale: es });
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "Fecha inválida";
    }
  };

  // Formatear monto con soporte para moneda y tipo de pago
  const formatAmount = (amount: number, currency: string = 'MXN', paymentMethod?: string) => {
    // Los pagos con tarjeta o efectivo se guardan en centavos. Los antiguos pueden no tener método.
    const shouldDivide = paymentMethod === 'card' || paymentMethod === 'cash';
    const finalAmount = shouldDivide ? amount / 100 : amount;

    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
    }).format(finalAmount);
  };


  return (
    <div className="flex flex-col h-full">
      <header className="bg-white p-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Pagos</h1>
            <p className="text-gray-600">Supervisa y administra los pagos de los residentes.</p>
          </div>
        </div>
        
      </header>

      {/* Alerta de Stripe Connect */}
      {residencialFilter !== 'todos' && residencialFilter && (
        <StripeConnectAlert />
      )}

      <main className="flex-1 p-4 bg-gray-50 overflow-auto">
              {/* Filtro de Residencial */}
              {userClaims?.isGlobalAdmin && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtro de Residencial</CardTitle>
            </CardHeader>
            <CardContent>
                <Select
                  value={residencialFilter}
                  onValueChange={(value) => {
                    setResidencialFilter(value);
                    if (value === "todos") {
                      // Lógica para cargar todos los pagos
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un residencial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los Residenciales</SelectItem>
                    {residenciales.map(r => (
                      <SelectItem key={r.id} value={r.id!}>
                        {r.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </CardContent>
          </Card>
        )}

        {/* Dashboard principal de pagos */}
        {residencialFilter !== 'todos' && residencialFilter ? (
          <SimplifiedPaymentsDashboard residencialId={residencialFilter} />
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="space-y-4">
                <div className="mx-auto h-16 w-16 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Selecciona un Residencial
                  </h3>
                  <p className="text-gray-500">
                    Para ver y gestionar los pagos, primero selecciona un residencial específico.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </main>
      
      {selectedPago && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <Suspense fallback={<p>Cargando detalles...</p>}>
              <DetallesPagoDialogContent 
                selectedPago={selectedPago} 
                getStatusLabel={getStatusLabel}
                getStatusColor={getStatusColor}
                formatDate={formatDateFull}
                formatAmount={formatAmount}
              />
            </Suspense>
          </DialogContent>
        </Dialog>
      )}


    </div>
  );
} 