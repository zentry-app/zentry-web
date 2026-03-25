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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Search, CreditCard, DollarSign, Clock, CheckCircle, XCircle, Eye, Wifi, Loader2, Calendar, Plus, FileText, Download, BookOpen, Settings2, ShieldCheck, BarChart3 } from "lucide-react";
import {
  Residencial,
  getResidenciales,
  getPagos,
  suscribirseAPagos
} from "@/lib/firebase/firestore";
import { AllPaymentsService, AllPayment } from "@/lib/services/all-payments-service";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { motion } from "framer-motion";
import TablaPagos from '@/components/dashboard/pagos/TablaPagos';
import { Pago, convertFirestoreTimestampToDate } from "@/types/pagos";

// Tipo para el reporte
interface ReportePago {
  usuario: string;
  email: string;
  monto: string;
  metodo: string;
  estado: string;
  fecha: string;
  residencial: string;
  direccion: string;
  concepto: string;
}

// Tipo combinado para pagos que pueden venir de diferentes servicios
interface PagoCombinado {
  id: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  paymentType?: string;
  timestamp?: any;
  fechaPago?: any;
  concept?: string;
  description?: string;
  userAddress: {
    calle: string;
    houseNumber: string;
  };
  _residencialNombre?: string;
}
import StripeConnectAlert from '@/components/dashboard/pagos/StripeConnectAlert';
import { PendingValidationBanner } from '@/components/dashboard/pagos/PendingValidationBanner';
import UnifiedPaymentsDashboard from '@/components/dashboard/pagos/UnifiedPaymentsDashboard';
import SimplifiedPaymentsDashboard from '@/components/dashboard/pagos/SimplifiedPaymentsDashboardV2';
import AccountingDashboard from '@/components/dashboard/pagos/AccountingDashboard';
import CatalogManagement from '@/components/dashboard/pagos/CatalogManagement';
import LedgerViewer from '@/components/dashboard/pagos/LedgerViewer';
import BillingPeriodManager from '@/components/billing/BillingPeriodManager';
import ReportingDashboard from '@/components/dashboard/pagos/ReportingDashboard';
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
  const [mapeoResidenciales, setMapeoResidenciales] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState<'unified' | 'all'>('unified');
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [allAvailablePagos, setAllAvailablePagos] = useState<Pago[]>([]);

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

        const mapeo = residencialesData.reduce<{ [key: string]: string }>((acc, r) => {
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
          setAllAvailablePagos(allPagos);

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
            setAllAvailablePagos(pagosConResidencial);
          } else {
            console.log(`⚠️ No se encontraron pagos para este residencial`);
            setPagos([]);
            setAllAvailablePagos([]);
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
            <Skeleton className="h-14 rounded-2xl" />
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
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      case 'failed': return 'Fallido';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  // Obtener color para el estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
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

  // Función para generar reporte de pagos
  const generateReport = async () => {
    setIsGeneratingReport(true);

    try {
      // Si no hay pagos filtrados pero es un admin de residencial, obtener datos directamente
      let pagosParaReporte: PagoCombinado[] = filteredPagos as PagoCombinado[];

      if (filteredPagos.length === 0 && esAdminDeResidencial && residencialFilter !== 'todos') {
        addLog(`🔄 Obteniendo todos los pagos para el reporte desde residencial: ${residencialFilter}`);
        try {
          // Usar el servicio correcto que maneja todos los pagos (efectivo y transferencias)
          // NO pasar parámetros de fecha para obtener TODOS los pagos como hace el dashboard
          const datosDirectos = await AllPaymentsService.getAllPayments(residencialFilter);

          const residencial = residenciales.find(r => r.id === residencialFilter);
          pagosParaReporte = datosDirectos.map(pago => ({
            ...(pago as PagoCombinado),
            _residencialNombre: residencial?.nombre || "Desconocido"
          }));

          addLog(`✅ Datos obtenidos exitosamente: ${pagosParaReporte.length} pagos`);

          // Mostrar cada pago en los logs para debugging
          datosDirectos.forEach((pago, index) => {
            addLog(`📋 Pago ${index + 1}: ${pago.userName} - $${pago.amount} - ${pago.paymentType}`);
          });

        } catch (error) {
          addLog(`❌ Error obteniendo datos directos: ${error}`);
          toast.error('Error obteniendo datos para el reporte');
          return;
        }
      }

      const reportData = {
        title: `Reporte de Pagos`,
        subtitle: residencialFilter === 'todos'
          ? 'Todos los Residenciales'
          : residenciales.find(r => r.id === residencialFilter)?.nombre || 'Residencial Seleccionado',
        fechaGeneracion: format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es }),
        totalPagos: pagosParaReporte.length,
        pagos: pagosParaReporte.map(pago => ({
          usuario: pago.userName || 'N/A',
          email: pago.userEmail || 'N/A',
          monto: formatAmount(pago.amount, 'MXN', pago.paymentMethod),
          metodo: pago.paymentType || pago.paymentMethod || 'N/A',
          estado: pago.status || 'N/A',
          fecha: pago.fechaPago ? formatDateFull(pago.fechaPago) : 'N/A',
          residencial: pago._residencialNombre || 'N/A',
          direccion: `${pago.userAddress?.calle || ''} ${pago.userAddress?.houseNumber || ''}`.trim() || 'N/A',
          concepto: pago.concept || 'N/A'
        })),
        estadisticas: {
          totalCompletados: pagosParaReporte.filter(p => p.status === 'completed').length,
          totalPendientes: pagosParaReporte.filter(p => p.status === 'pending').length,
          totalFallidos: pagosParaReporte.filter(p => p.status === 'failed').length,
          totalCancelados: pagosParaReporte.filter(p => p.status === 'cancelled').length,
          sumaTotal: pagosParaReporte
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => {
              const amount = p.paymentMethod === 'card' || p.paymentMethod === 'cash'
                ? p.amount / 100
                : p.amount;
              return sum + amount;
            }, 0)
        }
      };

      // Generar PDF usando la ventana de impresión del navegador
      const htmlReport = generateHTMLReport(reportData);

      // Crear ventana nueva para imprimir/guardar como PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlReport);
        printWindow.document.close();

        // Esperar un poco para que se cargue el contenido antes de imprimir
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      } else {
        // Fallback: mostrar el reporte en página completa para imprimir
        toast.info('Por favor usa Ctrl+P (Cmd+P en Mac) para imprimir/guardar como PDF');
      }

      toast.success('Reporte generado y listo para imprimir/guardar como PDF');
      addLog(`📄 Reporte generado con ${reportData.totalPagos} pagos`);

    } catch (error) {
      console.error('Error generando reporte:', error);
      toast.error('Error al generar el reporte');
      addLog(`❌ Error generando reporte: ${error}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Función para generar HTML formateado del reporte
  const generateHTMLReport = (data: any) => {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 300;
        }
        
        .header .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 20px;
        }
        
        .header .date {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .content {
            padding: 40px;
        }
        
        .summary {
            background: #f8f9ff;
            border-radius: 10px;
            padding: 30px;
            margin-bottom: 40px;
            border-left: 5px solid #667eea;
        }
        
        .summary h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.8rem;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            text-align: center;
            border-top: 4px solid #667eea;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .section h2 {
            color: #333;
            margin-bottom: 25px;
            font-size: 1.5rem;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        
        .payments-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        
        .payments-table th {
            background: #667eea;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 0.85rem;
        }
        
        .payments-table td {
            padding: 15px;
            border-bottom: 1px solid #eee;
        }
        
        .payments-table tr:hover {
            background: #f8f9ff;
        }
        
        .status-badge {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .status-succeeded { background: #d4edda; color: #155724; }
        .status-pendiente { background: #fff3cd; color: #856404; }
        .status-fallido { background: #f8d7da; color: #721c24; }
        .status-cancelado { background: #e2e3e5; color: #383d41; }
        
        .footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #666;
            border-top: 1px solid #eee;
        }
        
        .footer p {
            margin-bottom: 10px;
        }
        
        .total-amount {
            font-size: 2.5rem;
            font-weight: bold;
            color: #28a745;
            margin-top: 20px;
        }
        
        @media print {
            body { background: white !important; }
            .container { box-shadow: none !important; }
            .header { background: #667eea !important; }
        }
        
        @media (max-width: 768px) {
            .stats-grid { grid-template-columns: 1fr; }
            .payments-table { font-size: 0.9rem; }
            .payments-table th, .payments-table td { padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${data.title}</h1>
            <div class="subtitle">${data.subtitle}</div>
            <div class="date">Generado el ${data.fechaGeneracion}</div>
        </div>
        
        <div class="content">
            <div class="summary">
                <h2>📊 Resumen Ejecutivo</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${data.totalPagos}</div>
                        <div class="stat-label">Total Pagos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${data.estadisticas.totalCompletados}</div>
                        <div class="stat-label">Completados</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${data.estadisticas.totalPendientes}</div>
                        <div class="stat-label">Pendientes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${data.estadisticas.totalFallidos}</div>
                        <div class="stat-label">Fallidos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${data.estadisticas.totalCancelados}</div>
                        <div class="stat-label">Cancelados</div>
                    </div>
                    <div class="stat-card">
                        <div class="status-badge status-succeeded">${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.estadisticas.sumaTotal)}</div>
                        <div class="stat-label">Total Completados</div>
                    </div>
                </div>
            </div>
            
            <section class="section">
                <h2>📋 Detalle de Pagos</h2>
                <table class="payments-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Monto</th>
                            <th>Método</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                            <th>Residencial</th>
                            <th>Dirección</th>
                            <th>Concepto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.pagos.map((pago: ReportePago) => `
                            <tr>
                                <td><strong>${pago.usuario}</strong></td>
                                <td>${pago.email}</td>
                                <td style="font-weight: bold; color: #667eea;">${pago.monto}</td>
                                <td>${pago.metodo}</td>
                                <td><span class="status-badge status-${pago.estado.toLowerCase()}">${pago.estado}</span></td>
                                <td>${pago.fecha}</td>
                                <td>${pago.residencial}</td>
                                <td>${pago.direccion}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </section>
        </div>
        
        <div class="footer">
            <p><strong>Sistema de Gestión Zentry</strong></p>
            <p>Reporte generado automáticamente el ${data.fechaGeneracion}</p>
            <p>© ${new Date().getFullYear()} - Todos los derechos reservados</p>
        </div>
    </div>
</body>
</html>`;
  };


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
          <Badge className="bg-green-100 text-green-700 border-none font-black px-4 py-1 rounded-full flex gap-2 w-fit items-center shadow-sm">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Gestión Financiera
          </Badge>
          <h1 className="text-5xl font-extrabold tracking-tighter text-slate-900 flex items-center gap-3">
            <DollarSign className="h-12 w-12 text-green-500" />
            <span className="text-gradient-zentry">Pagos</span>
          </h1>
          <p className="text-slate-600 font-bold max-w-lg">
            Supervisa y administra los pagos de los residentes
          </p>
        </div>

        {/* Botón de generar reporte */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={generateReport}
                  disabled={isGeneratingReport || (!filteredPagos.length && !esAdminDeResidencial)}
                  className="rounded-2xl h-14 px-8 font-black shadow-zentry-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover-lift transition-all"
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-5 w-5" />
                      Generar Reporte
                    </>
                  )}
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              {!filteredPagos.length && !esAdminDeResidencial
                ? "No hay pagos para generar reporte"
                : esAdminDeResidencial
                  ? "Generar reporte del residencial asignado"
                  : "Generar reporte detallado de pagos"
              }
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>

      {/* Banner de comprobantes pendientes de validación — visible para admins */}
      {(esAdminDeResidencial && residencialIdDocDelAdmin) && (
        <PendingValidationBanner residencialId={residencialIdDocDelAdmin} />
      )}
      {(userClaims?.isGlobalAdmin && residencialFilter !== 'todos' && residencialFilter) && (
        <PendingValidationBanner residencialId={residencialFilter} />
      )}

      {/* Filtro de Residencial */}
      {userClaims?.isGlobalAdmin && (
        <Card className="border-none shadow-zentry-lg bg-white/80 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8">
            <CardTitle className="text-2xl font-black text-slate-900">Filtro de Residencial</CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <Select
              value={residencialFilter}
              onValueChange={(value) => {
                setResidencialFilter(value);
                if (value === "todos") {
                  // Lógica para cargar todos los pagos
                }
              }}
            >
              <SelectTrigger className="h-14 bg-white border-slate-200 rounded-xl font-bold shadow-sm">
                <SelectValue placeholder="Selecciona un residencial" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-3xl">
                <div className="p-2">
                  <SelectItem value="todos" className="font-bold mb-1 rounded-xl">Todos los Residenciales</SelectItem>
                  {residenciales.map(r => (
                    <SelectItem key={r.id} value={r.id!} className="font-bold mb-1 rounded-xl">
                      {r.nombre}
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Dashboard principal de pagos */}
      {residencialFilter !== 'todos' && residencialFilter ? (
        <Tabs defaultValue="pagos" className="space-y-6">
          <div className="flex overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
            <TabsList className="bg-slate-100/80 p-1 h-auto rounded-2xl inline-flex border border-slate-200/60 backdrop-blur-sm min-w-max mx-auto">
              <TabsTrigger value="pagos" className="rounded-xl px-4 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
                <CreditCard className="w-4 h-4 mr-2" />
                Operativa
              </TabsTrigger>
              <TabsTrigger value="periodos" className="rounded-xl px-4 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
                <Calendar className="w-4 h-4 mr-2 text-orange-500" />
                Gestión de Periodos
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-xl px-4 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
                <BarChart3 className="w-4 h-4 mr-2 text-blue-500" />
                Analytics & Tesorería
              </TabsTrigger>
              <TabsTrigger value="contabilidad" className="rounded-xl px-4 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
                <BookOpen className="w-4 h-4 mr-2 text-green-500" />
                Libro Mayor
              </TabsTrigger>
              <TabsTrigger value="estado_cuenta" className="rounded-xl px-4 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
                <ShieldCheck className="w-4 h-4 mr-2 text-indigo-500" />
                Edo. Cuenta
              </TabsTrigger>
              <TabsTrigger value="catalogos" className="rounded-xl px-4 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
                <Settings2 className="w-4 h-4 mr-2" />
                Catálogos
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pagos" className="mt-0 border-none p-0 outline-none">
            <SimplifiedPaymentsDashboard residencialId={residencialFilter} />
          </TabsContent>

          <TabsContent value="periodos" className="mt-0 border-none p-0 outline-none">
            <BillingPeriodManager residencialId={residencialFilter} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0 border-none p-0 outline-none">
            <ReportingDashboard residencialId={residencialFilter} />
          </TabsContent>

          <TabsContent value="contabilidad" className="mt-0 border-none p-0 outline-none">
            <AccountingDashboard residencialId={residencialFilter} />
          </TabsContent>

          <TabsContent value="estado_cuenta" className="mt-0 border-none p-0 outline-none">
            <LedgerViewer residencialId={residencialFilter} />
          </TabsContent>

          <TabsContent value="catalogos" className="mt-0 border-none p-0 outline-none">
            <CatalogManagement residencialId={residencialFilter} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="border-none shadow-zentry-lg bg-white/80 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
          <CardContent className="text-center py-12">
            <div className="space-y-4">
              <div className="mx-auto h-16 w-16 text-slate-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Selecciona un Residencial
                </h3>
                <p className="text-slate-600 font-medium">
                  Para ver y gestionar los pagos, primero selecciona un residencial específico.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de detalles */}
      {selectedPago && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl rounded-[2rem] border-none shadow-2xl bg-white/95 backdrop-blur-3xl">
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