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
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Bell, CheckCircle, AlertCircle, Clock, Info, PlusCircle, Eye, Wifi, Loader2, Pencil, Trash } from "lucide-react";
import { 
  AlertaPanico as BaseAlertaPanico, 
  Residencial, 
  getResidenciales, 
  getAlertasPanico, 
  actualizarEstadoAlertaPanico, 
  marcarAlertaPanicoComoLeida, 
  suscribirseAAlertasPanico, 
  getNotificaciones,
  suscribirseANotificaciones
} from "@/lib/firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { collection, getDocs, getFirestore, addDoc, serverTimestamp, query, where, getDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/firebase/config";
import { GeoPoint } from "firebase/firestore";
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
import { useAuth, UserClaims } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

// Extender la interfaz AlertaPanico para incluir el nombre del residencial y tipo
interface AlertaPanico extends BaseAlertaPanico {
  _residencialNombre?: string;
  tipo?: string;
}

// Añadir la interfaz para Usuario
interface Usuario {
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  direccion?: string;
  role?: 'admin' | 'resident' | 'security' | 'guest';
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
  const [logs, setLogs] = useState<string[]>([]);
  const [alertasActualizando, setAlertasActualizando] = useState<Record<string, boolean>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [newAlertaResidencial, setNewAlertaResidencial] = useState<string>("");
  const [newAlertaMensaje, setNewAlertaMensaje] = useState<string>("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [tipoAlerta, setTipoAlerta] = useState<string>("notificacion");
  const [activeTab, setActiveTab] = useState<string>("alertas");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editingAlerta, setEditingAlerta] = useState<AlertaPanico | null>(null);
  const [editMensaje, setEditMensaje] = useState<string>("");
  const [editTipoAlerta, setEditTipoAlerta] = useState<string>("notificacion");
  const [destinatariosTopic, setDestinatariosTopic] = useState<string>("todos");
  const [notificacionPriority, setNotificacionPriority] = useState<string>("normal");
  const [notificacionTipo, setNotificacionTipo] = useState<string>("announcement");
  const [isProgramada, setIsProgramada] = useState<boolean>(false);
  const [frecuenciaProgramacion, setFrecuenciaProgramacion] = useState<string>("semanal");
  const [diasSemana, setDiasSemana] = useState<string[]>([]);
  const [fechaEnvio, setFechaEnvio] = useState<string>("");
  const [horaEnvio, setHoraEnvio] = useState<string>("09:00");
  const [mapeoResidenciales, setMapeoResidenciales] = useState<{[key: string]: string}>({});

  const esAdminDeResidencial = useMemo(() => userClaims?.isResidencialAdmin && !userClaims?.isGlobalAdmin, [userClaims]);
  const residencialCodigoDelAdmin = useMemo(() => esAdminDeResidencial ? userClaims?.managedResidencialId : null, [esAdminDeResidencial, userClaims]);
  
  const residencialIdDocDelAdmin = useMemo(() => {
    if (!esAdminDeResidencial || !residencialCodigoDelAdmin || Object.keys(mapeoResidenciales).length === 0) return null;
    return Object.keys(mapeoResidenciales).find(
      key => mapeoResidenciales[key] === residencialCodigoDelAdmin
    ) || null;
  }, [esAdminDeResidencial, residencialCodigoDelAdmin, mapeoResidenciales]);

  const addLog = useCallback((message: string) => { 
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prevLogs => [logMessage, ...prevLogs.slice(0, 99)]);
    console.log(message);
  }, [setLogs]);

  const verificarYCorregirAlertas = useCallback((alertas: AlertaPanico[]): AlertaPanico[] => {
    const logMessagesLocales: string[] = [];
    logMessagesLocales.push(`🔍 Verificando ${alertas.length} alertas...`);
    
    const alertasCorregidas = alertas.map(alerta => {
      const correcciones: string[] = [];
      let alertaCorregida = { ...alerta };
      
      if (!alertaCorregida.id) {
        alertaCorregida.id = `generado_${Date.now()}`;
        correcciones.push("- Se generó un ID temporal");
      }
      
      if (!alertaCorregida.message) {
        alertaCorregida.message = "Sin mensaje";
        correcciones.push("- Se agregó un mensaje predeterminado");
      }
      
      if (!alertaCorregida.title) {
        alertaCorregida.title = "Alerta";
        correcciones.push("- Se agregó un título predeterminado");
      }
      
      const esAlertaAdmin = (alertaCorregida.tipo === "anuncio" || alertaCorregida.tipo === "notificacion" || 
                            alertaCorregida.type === "anuncio" || alertaCorregida.type === "notificacion");
      
      if (!alertaCorregida.userName && !esAlertaAdmin) {
        alertaCorregida.userName = "Usuario desconocido";
        correcciones.push("- Se agregó un nombre de usuario predeterminado");
      }
      
      if (!alertaCorregida.timestamp) {
        alertaCorregida.timestamp = Timestamp.now();
        correcciones.push("- Se agregó una marca de tiempo actual");
      }
      
      if (typeof alertaCorregida.read !== 'boolean') {
        alertaCorregida.read = false;
        correcciones.push("- Se corrigió el campo 'read' a false");
      }
      
      if (!['active', 'in_progress', 'resolved'].includes(alertaCorregida.status)) {
        alertaCorregida.status = 'active';
        correcciones.push("- Se corrigió el estado a 'active'");
      }
      
      if (correcciones.length > 0) {
        logMessagesLocales.push(`⚠️ Alerta ${alertaCorregida.id} corregida:`);
        correcciones.forEach(correccion => {
          logMessagesLocales.push(`   ${correccion}`);
        });
      }
      
      return alertaCorregida;
    });
    
    setTimeout(() => {
      logMessagesLocales.forEach(msg => addLog(msg));
    }, 0);
    
    return alertasCorregidas;
  }, [addLog]);

  useEffect(() => {
    const fetchResidenciales = async () => {
      try {
        addLog("🏢 Cargando residenciales...");
        const residencialesData = await getResidenciales();
        setResidenciales(residencialesData);
        
        const mapeo = residencialesData.reduce<{[key: string]: string}>((acc, r) => {
          if (r.id && r.residencialID) acc[r.id] = r.residencialID;
          return acc;
        }, {});
        setMapeoResidenciales(mapeo);
        addLog(`✅ ${residencialesData.length} residenciales cargados y mapeo creado`);

        if (esAdminDeResidencial) {
          const idDocAdmin = Object.keys(mapeo).find(key => mapeo[key] === residencialCodigoDelAdmin);
          if (idDocAdmin) {
            setResidencialFilter(idDocAdmin);
            setNewAlertaResidencial(idDocAdmin);
            addLog(`👤 Admin de Residencial detectado. Filtro preseleccionado a: ${idDocAdmin}`);
          } else {
            addLog(`⚠️ Admin de Residencial, pero no se encontró el ID de documento para su residencial: ${residencialCodigoDelAdmin}`);
          }
        }

      } catch (error) {
        addLog(`❌ Error al cargar residenciales: ${error}`);
        toast.error("Error al cargar residenciales");
      }
    };

    fetchResidenciales();
  }, [esAdminDeResidencial, residencialCodigoDelAdmin, addLog]);

  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const usuariosSnapshot = await getDocs(collection(db, "usuarios"));
        const usuariosData = usuariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Usuario[];
        setUsuarios(usuariosData);
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
      }
    };

    obtenerUsuarios();
  }, []);

  useEffect(() => {
    const fetchAlertas = async () => {
      if (authLoading) return;
      
      if ((residenciales.length === 0 && !esAdminDeResidencial) || (esAdminDeResidencial && !residencialIdDocDelAdmin)) {
        if (residenciales.length === 0) addLog("⏳ Esperando carga de residenciales para fetchAlertas...");
        if (esAdminDeResidencial && !residencialIdDocDelAdmin) addLog("⏳ Admin de Res: Esperando residencialIdDocDelAdmin para fetchAlertas...");
        return; 
      }

      setLoading(true);
      const logMessages: string[] = [];
      try {
        logMessages.push(`🔍 Iniciando fetchAlertas con filtro: ${residencialFilter}`);
        logMessages.push(`🏢 Residenciales disponibles: ${residenciales.map(r => r.nombre).join(', ')}`);
        
        if (residencialFilter === "todos") {
          logMessages.push(`📋 Cargando ${activeTab === "alertas" ? "alertas de pánico" : "notificaciones"} de TODOS los residenciales`);
          const allItems: AlertaPanico[] = [];
          
          if (residenciales.length === 0) {
            logMessages.push("⚠️ No hay residenciales en la lista, intentando buscar en todas las colecciones");
            const db = getFirestore();
            const residencialesRef = collection(db, 'residenciales');
            const residencialesSnapshot = await getDocs(residencialesRef);
            logMessages.push(`📊 Encontrados ${residencialesSnapshot.docs.length} residenciales en Firestore`);
            
            for (const residencialDoc of residencialesSnapshot.docs) {
              logMessages.push(`🔄 Buscando ${activeTab === "alertas" ? "alertas de pánico" : "notificaciones"} en residencial: ${residencialDoc.id}`);
              let itemsResidencial: AlertaPanico[] = [];
              if (activeTab === "alertas") {
                itemsResidencial = await getAlertasPanico(residencialDoc.id);
              } else {
                itemsResidencial = await getNotificaciones(residencialDoc.id);
              }
              logMessages.push(`✅ ${activeTab === "alertas" ? "Alertas de pánico" : "Notificaciones"} encontradas en ${residencialDoc.id}: ${itemsResidencial.length}`);
              const itemsConResidencial = itemsResidencial.map(item => ({
                ...item,
                _residencialNombre: residencialDoc.data().nombre || residencialDoc.id
              }));
              allItems.push(...itemsConResidencial);
            }
          } else {
            for (const residencial of residenciales) {
              if (residencial.id) {
                logMessages.push(`🔄 Obteniendo ${activeTab === "alertas" ? "alertas de pánico" : "notificaciones"} para residencial: ${residencial.nombre} (ID: ${residencial.id})`);
                let itemsResidencial: AlertaPanico[] = [];
                if (activeTab === "alertas") {
                  itemsResidencial = await getAlertasPanico(residencial.id);
                } else {
                  itemsResidencial = await getNotificaciones(residencial.id);
                }
                logMessages.push(`✅ ${activeTab === "alertas" ? "Alertas de pánico" : "Notificaciones"} obtenidas para ${residencial.nombre}: ${itemsResidencial.length}`);
                const itemsConResidencial = itemsResidencial.map((item: any) => ({
                  ...item,
                  _residencialNombre: residencial.nombre
                }));
                allItems.push(...itemsConResidencial);
              }
            }
          }
          
          allItems.sort((a, b) => {
            if (!a.timestamp || !b.timestamp) return 0;
            try {
              return b.timestamp.toMillis() - a.timestamp.toMillis();
            } catch (error) {
              return 0;
            }
          });
          
          logMessages.push(`📊 Total de ${activeTab === "alertas" ? "alertas de pánico" : "notificaciones"} encontradas: ${allItems.length}`);
          if (allItems.length > 0) {
            logMessages.push(`📝 Primer item: ${JSON.stringify(allItems[0])}`);
          }
          
          const itemsCorregidos = verificarYCorregirAlertas(allItems);
          logMessages.push("🔍 DEBUGGING: Estado de los items antes de mostrarlos:");
          logMessages.push(`- Total de items cargados: ${itemsCorregidos.length}`);
          if (itemsCorregidos.length > 0) {
            itemsCorregidos.slice(0, 3).forEach((item: AlertaPanico, index: number) => {
              logMessages.push(`- Item ${index + 1}:`);
              logMessages.push(`  - ID: ${item.id}`);
              logMessages.push(`  - Status: ${item.status}`);
              logMessages.push(`  - Timestamp: ${item.timestamp ? 'Válido' : 'Inválido'}`);
              logMessages.push(`  - Usuario: ${item.userName}`);
              logMessages.push(`  - Residencial: ${item._residencialNombre}`);
            });
          }
          setAlertas(itemsCorregidos);
          
        } else {
          logMessages.push(`📋 Cargando ${activeTab === "alertas" ? "alertas de pánico" : "notificaciones"} para residencial específico: ${residencialFilter}`);
          let itemsResidencial: AlertaPanico[] = [];
          if (activeTab === "alertas") {
            itemsResidencial = await getAlertasPanico(residencialFilter);
          } else {
            itemsResidencial = await getNotificaciones(residencialFilter);
          }
          logMessages.push(`✅ ${activeTab === "alertas" ? "Alertas de pánico" : "Notificaciones"} obtenidas: ${itemsResidencial.length}`);
          if (itemsResidencial.length > 0) {
            logMessages.push(`📝 Primer item: ${JSON.stringify(itemsResidencial[0])}`);
          }
          const residencial = residenciales.find(r => r.id === residencialFilter);
          logMessages.push(`🏢 Residencial encontrado: ${residencial?.nombre || "No encontrado"}`);
          if (itemsResidencial.length > 0) {
            const itemsConResidencial = itemsResidencial.map((item: any) => ({
              ...item,
              _residencialNombre: residencial?.nombre || "Desconocido"
            }));
            const itemsCorregidos = verificarYCorregirAlertas(itemsConResidencial);
            setAlertas(itemsCorregidos);
          } else {
            console.log(`⚠️ No se encontraron ${activeTab === "alertas" ? "alertas de pánico" : "notificaciones"} para este residencial`);
            setAlertas([]);
          }
        }
      } catch (error) {
        logMessages.push(`❌ Error al cargar ${activeTab === "alertas" ? "alertas de pánico" : "notificaciones"}: ${error}`);
        toast.error(`Error al cargar ${activeTab === "alertas" ? "alertas de pánico" : "notificaciones"}`);
      } finally {
        setLoading(false);
        setTimeout(() => {
          logMessages.forEach(msg => addLog(msg));
        }, 0);
      }
    };

    if (residenciales.length > 0) {
      fetchAlertas();
    } else {
      fetchAlertas();
    }
  }, [residenciales, residencialFilter, activeTab, authLoading, esAdminDeResidencial, residencialIdDocDelAdmin, addLog, verificarYCorregirAlertas]);

  useEffect(() => {
    let unsubscribes: (() => void)[] = [];
    const setupSubscriptions = async () => {
      addLog(`🔔 Configurando suscripciones en tiempo real para ${activeTab === "alertas" ? "alertas de pánico" : "notificaciones"}`);
      if (residencialFilter === "todos") {
        if (residenciales.length > 0) {
          for (const residencial of residenciales) {
            if (residencial.id) {
              addLog(`🔔 Suscribiéndose a ${activeTab === "alertas" ? "alertas de pánico" : "notificaciones"} en tiempo real para: ${residencial.nombre}`);
              let unsubscribe: () => void;
              if (activeTab === "alertas") {
                unsubscribe = suscribirseAAlertasPanico(residencial.id, (alertasActualizadas) => {
                  addLog(`📣 Recibida actualización en tiempo real de alertas de pánico para ${residencial.nombre}. Alertas: ${alertasActualizadas.length}`);
                  setAlertas(prevAlertas => {
                    const alertasDeOtrosResidenciales = prevAlertas.filter(
                      alerta => alerta.residencialID !== residencial.id
                    );
                    const nuevasAlertasConResidencial = alertasActualizadas.map(alerta => ({
                      ...alerta,
                      _residencialNombre: residencial.nombre
                    }));
                    const todasLasAlertas = [...alertasDeOtrosResidenciales, ...nuevasAlertasConResidencial];
                    todasLasAlertas.sort((a, b) => {
                      if (!a.timestamp || !b.timestamp) return 0;
                      try {
                        return b.timestamp.toMillis() - a.timestamp.toMillis();
                      } catch (error) {
                        return 0;
                      }
                    });
                    return verificarYCorregirAlertas(todasLasAlertas);
                  });
                });
              } else {
                unsubscribe = suscribirseANotificaciones(residencial.id, (notificaciones) => {
                  addLog(`📣 Recibida actualización en tiempo real de notificaciones para ${residencial.nombre}. Notificaciones: ${notificaciones.length}`);
                  setAlertas(prevAlertas => {
                    const notificacionesDeOtrosResidenciales = prevAlertas.filter(
                      alerta => alerta.residencialID !== residencial.id
                    );
                    const nuevasNotificacionesConResidencial = notificaciones.map(notif => ({
                      ...notif,
                      _residencialNombre: residencial.nombre
                    }));
                    const todasLasNotificaciones = [...notificacionesDeOtrosResidenciales, ...nuevasNotificacionesConResidencial];
                    todasLasNotificaciones.sort((a, b) => {
                      if (!a.timestamp || !b.timestamp) return 0;
                      try {
                        return b.timestamp.toMillis() - a.timestamp.toMillis();
                      } catch (error) {
                        return 0;
                      }
                    });
                    return verificarYCorregirAlertas(todasLasNotificaciones);
                  });
                });
              }
              unsubscribes.push(unsubscribe);
            }
          }
        }
      } else {
        addLog(`🔔 Suscribiéndose a ${activeTab === "alertas" ? "alertas de pánico" : "notificaciones"} en tiempo real para: ${residencialFilter}`);
        let unsubscribe: () => void;
        if (activeTab === "alertas") {
          unsubscribe = suscribirseAAlertasPanico(residencialFilter, (alertasActualizadas) => {
            addLog(`📣 Recibida actualización en tiempo real de alertas de pánico. Alertas: ${alertasActualizadas.length}`);
            if (alertasActualizadas.length > 0) {
              const residencial = residenciales.find(r => r.id === residencialFilter);
              const alertasConResidencial = alertasActualizadas.map((alerta: any) => ({
                ...alerta,
                _residencialNombre: residencial?.nombre || "Desconocido"
              }));
              const alertasCorregidas = verificarYCorregirAlertas(alertasConResidencial);
              setAlertas(alertasCorregidas);
            } else {
              console.log("⚠️ No se encontraron alertas de pánico");
              setAlertas([]);
            }
            setLoading(false);
          });
        } else {
          unsubscribe = suscribirseANotificaciones(residencialFilter, (notificaciones) => {
            addLog(`📣 Recibida actualización en tiempo real de notificaciones. Notificaciones: ${notificaciones.length}`);
            if (notificaciones.length > 0) {
              const residencial = residenciales.find(r => r.id === residencialFilter);
              const notificacionesConResidencial = notificaciones.map((notif: any) => ({
                ...notif,
                _residencialNombre: residencial?.nombre || "Desconocido"
              }));
              const notificacionesCorregidas = verificarYCorregirAlertas(notificacionesConResidencial);
              setAlertas(notificacionesCorregidas);
            } else {
              console.log("⚠️ No se encontraron notificaciones");
              setAlertas([]);
            }
            setLoading(false);
          });
        }
        unsubscribes.push(unsubscribe);
      }
    };
    setupSubscriptions();
    return () => {
      addLog(`🛑 Cancelando todas las suscripciones de ${activeTab === "alertas" ? "alertas de pánico" : "notificaciones"}`);
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [residencialFilter, residenciales, activeTab, authLoading, esAdminDeResidencial, residencialIdDocDelAdmin, addLog, verificarYCorregirAlertas]);

  const filteredAlertas = useMemo(() => alertas.filter(alerta => {
    const matchesTab = activeTab === "alertas" 
      ? (alerta.tipo || alerta.type) === "panic_alert" 
      : (alerta.tipo || alerta.type) !== "panic_alert";
    const matchesStatus = statusFilter === "todos" || alerta.status === statusFilter;
    const matchesSearch = 
      searchTerm === "" || 
      (alerta.userName && alerta.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (alerta.message && alerta.message.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesStatus && matchesSearch;
  }), [alertas, activeTab, statusFilter, searchTerm]);

  useEffect(() => {
    if (alertas.length > 0) {
      setTimeout(() => {
        addLog(`📊 Total alertas: ${alertas.length}, Filtradas: ${filteredAlertas.length}`);
      }, 0);
    }
  }, [alertas.length, filteredAlertas.length, addLog]);
  
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

  // Manejar cambio de estado de alerta
  const handleStatusChange = async (alertaId: string | undefined, residencialID: string | undefined, newStatus: AlertaPanico['status'], intentos = 1) => {
    if (!alertaId || !residencialID) {
      console.error("No se puede cambiar el estado: ID de alerta o residencial indefinido");
      
      setTimeout(() => {
        toast.error("Error al cambiar el estado");
      }, 0);
      return;
    }
    
    // Verificar si ya está en proceso de actualización para evitar doble click
    if (alertasActualizando[alertaId]) {
      console.log(`⚠️ La alerta ${alertaId} ya está siendo actualizada, ignorando solicitud`);
      return;
    }
    
    // Guardar el estado original de la alerta antes de actualizarla (fuera del try para accesibilidad en el catch)
    const alertaOriginal = alertas.find(a => a.id === alertaId);
    const estadoOriginal = alertaOriginal?.status || 'active';
    console.log(`🔍 Estado original de la alerta ${alertaId}: ${estadoOriginal}`);
    
    // Si ya tiene el estado que queremos, no hacer nada
    if (estadoOriginal === newStatus) {
      console.log(`ℹ️ La alerta ${alertaId} ya tiene el estado ${newStatus}, no se hace nada`);
      return;
    }
    
    // Determinar el ID correcto del residencial para la actualización
    // Primero intentamos usar el ID del documento si está disponible
    let residencialDocId = residencialID;
    
    // Si la alerta tiene un campo _residencialDocId, usarlo como prioridad
    if (alertaOriginal && (alertaOriginal as any)._residencialDocId) {
      residencialDocId = (alertaOriginal as any)._residencialDocId;
      console.log(`ℹ️ Usando _residencialDocId encontrado en la alerta: ${residencialDocId}`);
    } else if (alertaOriginal && alertaOriginal._residencialNombre) {
      // Si tenemos el nombre del residencial, intentar encontrar su ID
      console.log(`ℹ️ Buscando ID de documento para residencial: ${alertaOriginal._residencialNombre}`);
      
      // Buscar en la lista de residenciales por nombre
      const residencialEncontrado = residenciales.find(r => 
        r.nombre === alertaOriginal._residencialNombre
      );
      
      if (residencialEncontrado && residencialEncontrado.id) {
        residencialDocId = residencialEncontrado.id;
        console.log(`✅ Encontrado ID de documento para ${alertaOriginal._residencialNombre}: ${residencialDocId}`);
      }
    }
    
    // Si encontramos un ID corto, intentar obtener el documento correcto del residencial
    if (residencialDocId === "3C45M1") {
      console.log(`ℹ️ Detectado ID corto 3C45M1, buscando ID de documento correcto`);
      
      // Buscar el residencial por residencialID en lugar de usar ID hardcodeado
      try {
        const residencialesSnapshot = await getDocs(collection(db, 'residenciales'));
        const residencialEncontrado = residencialesSnapshot.docs.find(doc => {
          const data = doc.data();
          return data.residencialID === "3C45M1";
        });
        
        if (residencialEncontrado) {
          residencialDocId = residencialEncontrado.id;
          console.log(`✅ ID de documento encontrado dinámicamente: ${residencialDocId}`);
        } else {
          console.warn(`⚠️ No se encontró residencial con residencialID: 3C45M1`);
        }
      } catch (error) {
        console.error('❌ Error buscando residencial dinámicamente:', error);
      }
    }
    
    console.log(`🔄 ID de residencial para actualización: ${residencialDocId} (original: ${residencialID})`);
    
    try {
      // En lugar de setLoading(true) global, marcamos solo esta alerta como en actualización
      setAlertasActualizando(prev => ({
        ...prev,
        [alertaId]: true
      }));
      
      console.log(`🔄 Iniciando cambio de estado para alerta ${alertaId} a ${newStatus} (intento ${intentos}/3)`);
      
      // Actualizar el estado en el array local primero para mayor reactividad
      setAlertas(prev => 
        prev.map(alerta => 
          alerta.id === alertaId 
            ? { ...alerta, status: newStatus }
            : alerta
        )
      );
      
      // Luego intentar actualizar en Firestore y verificar si tuvo éxito
      const actualizadoEnFirestore = await actualizarEstadoAlertaPanico(residencialDocId, alertaId, newStatus);
      
      setTimeout(() => {
        if (actualizadoEnFirestore) {
          console.log(`✅ Alerta ${alertaId} actualizada correctamente en Firestore (intento ${intentos}/3)`);
          toast.success(`Estado cambiado a: ${getStatusLabel(newStatus)}`);
          
          // Añadir log indicando que la tabla se actualizará automáticamente
          addLog(`✅ Estado de alerta cambiado a: ${getStatusLabel(newStatus)}. La tabla se actualizará automáticamente.`);
        } else {
          console.error(`❌ No se pudo actualizar la alerta ${alertaId} en Firestore (intento ${intentos}/3)`);
          
          // Si aún no hemos alcanzado el máximo de intentos, intentar nuevamente
          if (intentos < 3) {
            console.log(`🔄 Reintentando actualizar alerta ${alertaId} (intento ${intentos + 1}/3)`);
            
            // Desmarcar la alerta como actualizando para el próximo intento
            setAlertasActualizando(prev => ({
              ...prev,
              [alertaId]: false
            }));
            
            // Reintentar después de un pequeño retraso
            setTimeout(() => {
              handleStatusChange(alertaId, residencialID, newStatus, intentos + 1);
            }, 1000); // Esperar 1 segundo antes de reintentar
            return;
          }
          
          // Si llegamos aquí, todos los intentos fallaron
          toast.warning(`No se pudo actualizar en la base de datos. Se revirtió el cambio.`);
          
          // Revertir el cambio en el estado local
          setAlertas(prev => 
            prev.map(alerta => 
              alerta.id === alertaId 
                ? { ...alerta, status: estadoOriginal }
                : alerta
            )
          );
        }
        
        // Marcar la alerta como ya no actualizándose
        setAlertasActualizando(prev => ({
          ...prev,
          [alertaId]: false
        }));
      }, 0);
    } catch (error) {
      console.error(`Error al cambiar estado (intento ${intentos}/3):`, error);
      
      // Usando setTimeout para evitar problemas con setState durante la renderización
      setTimeout(() => {
        // Si aún no hemos alcanzado el máximo de intentos, intentar nuevamente
        if (intentos < 3) {
          console.log(`🔄 Reintentando después de error (intento ${intentos + 1}/3)`);
          
          // Desmarcar la alerta como actualizando para el próximo intento
          setAlertasActualizando(prev => ({
            ...prev,
            [alertaId]: false
          }));
          
          // Reintentar después de un pequeño retraso
          setTimeout(() => {
            handleStatusChange(alertaId, residencialID, newStatus, intentos + 1);
          }, 1000); // Esperar 1 segundo antes de reintentar
          return;
        }
        
        // Si llegamos aquí, todos los intentos fallaron
        toast.error("Error al cambiar el estado después de varios intentos");
        
        // Marcar la alerta como ya no actualizándose
        setAlertasActualizando(prev => ({
          ...prev,
          [alertaId]: false
        }));
        
        // Revertir el cambio en el estado local usando el estado original guardado
        setAlertas(prev => 
          prev.map(alerta => 
            alerta.id === alertaId 
              ? { ...alerta, status: estadoOriginal }
              : alerta
          )
        );
      }, 0);
    }
  };

  // Abrir detalles de alerta
  const handleOpenDetails = async (alerta: AlertaPanico) => {
    setSelectedAlerta(alerta);
    setDetailsOpen(true);
    
    // Marcar como leída si no lo está
    if (!alerta.read) {
      try {
        await marcarAlertaPanicoComoLeida(alerta.residencialID, alerta.id!);
      } catch (error) {
        console.error("Error al marcar alerta como leída:", error);
      }
    }
  };

  // Obtener etiqueta para el estado
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'resolved': return 'Resuelta';
      case 'in_progress': return 'En proceso';
      default: return status;
    }
  };

  // Obtener color para el estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener icono para el estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertCircle className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      default: return null;
    }
  };

  // Formatear fecha
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Fecha desconocida";
    
    try {
      // Convertir a Date si es un Timestamp de Firestore
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      // Formatear como "hace X tiempo" (ej: "hace 5 minutos")
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "Fecha inválida";
    }
  };

  // Función para limpiar el formulario cuando se cierra el modal
  const resetCreateAlertForm = () => {
    setNewAlertaMensaje("");
    // No reseteamos residencialFilter aquí porque afectaría también al filtro de la tabla
  };

  // Función para manejar la apertura del modal
  const handleOpenCreateModal = () => {
    resetCreateAlertForm();
    setIsCreateDialogOpen(true);
  };

  // Función para manejar el cierre del modal
  const handleCloseCreateModal = (open: boolean) => {
    if (!open) {
      resetCreateAlertForm();
    }
    setIsCreateDialogOpen(open);
  };

  // Función para editar una notificación
  const handleEditNotificacion = (alerta: AlertaPanico) => {
    setEditingAlerta(alerta);
    setEditMensaje(alerta.message || "");
    setEditTipoAlerta((alerta.tipo || alerta.type) === "anuncio" ? "anuncio" : "notificacion");
    setIsEditDialogOpen(true);
  };

  // Función para guardar los cambios de una notificación
  const guardarCambiosNotificacion = async () => {
    if (!editingAlerta || !editingAlerta.id || !editingAlerta.residencialID) {
      toast.error("No se puede editar la notificación: información incompleta");
      return;
    }
    
    const toastId = toast.loading("Guardando cambios...");
    
    try {
      // Ruta del documento a actualizar (en la subcolección notificaciones)
      const rutaDocumento = `residenciales/${editingAlerta.residencialID}/notificaciones/${editingAlerta.id}`;
      console.log(`✏️ Actualizando notificación: ${rutaDocumento}`);
      
      // Actualizar el documento
      await updateDoc(doc(db, rutaDocumento), {
        message: editMensaje,
        type: editTipoAlerta,
        // Actualizar también el campo tipo para compatibilidad
        tipo: editTipoAlerta
      });
      
      // Cerrar el toast de carga
      toast.dismiss(toastId);
      
      // Mostrar mensaje de éxito
      toast.success("Notificación actualizada con éxito");
      
      // Cerrar el modal
      setIsEditDialogOpen(false);
      
      addLog(`✅ Notificación actualizada con éxito. La tabla se actualizará automáticamente.`);
    } catch (error) {
      console.error("Error al actualizar notificación:", error);
      toast.dismiss(toastId);
      setTimeout(() => {
        toast.error("Error al actualizar la notificación");
      }, 100);
    }
  };

  // Función para eliminar una notificación
  const handleDeleteNotificacion = async (alerta: AlertaPanico) => {
    if (!alerta.id || !alerta.residencialID) {
      toast.error("No se puede eliminar la notificación: ID no disponible");
      return;
    }
    
    try {
      // Mostrar confirmación antes de eliminar
      if (!confirm("¿Está seguro que desea eliminar esta notificación?")) {
        return;
      }
      
      const toastId = toast.loading("Eliminando notificación...");
      
      // Ruta del documento a eliminar (en la subcolección notificaciones)
      const rutaDocumento = `residenciales/${alerta.residencialID}/notificaciones/${alerta.id}`;
      console.log(`🗑️ Eliminando notificación: ${rutaDocumento}`);
      
      // Eliminar el documento
      await deleteDoc(doc(db, rutaDocumento));
      
      toast.dismiss(toastId);
      setTimeout(() => {
        toast.success("Notificación eliminada con éxito");
      }, 100);
      
      addLog(`✅ Notificación eliminada con éxito. La tabla se actualizará automáticamente.`);
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
      toast.error("Error al eliminar la notificación");
    }
  };

  // Función para verificar la estructura de Firestore
  const verificarEstructuraFirestore = async () => {
    const logMessages: string[] = [];
    logMessages.push("🔍 Verificando estructura de Firestore...");
    setLoading(true);
    
    try {
      const db = getFirestore();
      
      logMessages.push("🔍 Verificando colección 'residenciales'...");
      const residencialesRef = collection(db, 'residenciales');
      const residencialesSnapshot = await getDocs(residencialesRef);
      
      logMessages.push(`📊 Encontrados ${residencialesSnapshot.docs.length} residenciales`);
      
      if (residencialesSnapshot.docs.length > 0) {
        for (const residencialDoc of residencialesSnapshot.docs) {
          const residencialID = residencialDoc.id;
          const residencialData = residencialDoc.data();
          logMessages.push(`\n🏢 Residencial: ${residencialData.nombre || residencialID}`);
          
          const coleccionesPosibles = ['alertas', 'alertasPanico', 'panicAlerts'];
          
          for (const nombreColeccion of coleccionesPosibles) {
            const coleccionRef = collection(db, `residenciales/${residencialID}/${nombreColeccion}`);
            const snapshot = await getDocs(coleccionRef);
            
            if (snapshot.docs.length > 0) {
              logMessages.push(`✅ Subcolección '${nombreColeccion}': ${snapshot.docs.length} documentos`);
              
              if (snapshot.docs.length > 0) {
                const primerDoc = snapshot.docs[0];
                const data = primerDoc.data();
                
                logMessages.push(`📝 Ejemplo de alerta (ID: ${primerDoc.id}):`);
                logMessages.push(`   - Título: ${data.title || data.titulo || 'No disponible'}`);
                logMessages.push(`   - Estado: ${data.status || data.estado || 'No disponible'}`);
                logMessages.push(`   - Usuario: ${data.userName || data.nombreUsuario || 'No disponible'}`);
                logMessages.push(`   - ResidencialID: ${data.residencialID || 'No disponible'}`);
              }
            } else {
              logMessages.push(`❌ Subcolección '${nombreColeccion}': No hay documentos`);
            }
          }
        }
      }
      
      for (const nombreColeccion of ['alertas', 'alertasPanico', 'panicAlerts']) {
        logMessages.push(`\n🔍 Verificando colección raíz '${nombreColeccion}'...`);
        const coleccionRef = collection(db, nombreColeccion);
        const snapshot = await getDocs(coleccionRef);
        
        if (snapshot.docs.length > 0) {
          logMessages.push(`✅ Colección raíz '${nombreColeccion}': ${snapshot.docs.length} documentos`);
          
          const alertasPorResidencial: Record<string, number> = {};
          
          for (const doc of snapshot.docs) {
            const data = doc.data();
            const residencialID = data.residencialID || 'desconocido';
            
            if (!alertasPorResidencial[residencialID]) {
              alertasPorResidencial[residencialID] = 0;
            }
            
            alertasPorResidencial[residencialID]++;
          }
          
          for (const [residencialID, count] of Object.entries(alertasPorResidencial)) {
            logMessages.push(`   - ResidencialID '${residencialID}': ${count} alertas`);
          }
        } else {
          logMessages.push(`❌ Colección raíz '${nombreColeccion}': No hay documentos`);
        }
      }
      
      setTimeout(() => {
        logMessages.forEach(msg => addLog(msg));
        setLoading(false);
      }, 0);
    } catch (error) {
      logMessages.push(`❌ Error al verificar estructura: ${error}`);
      
      setTimeout(() => {
        logMessages.forEach(msg => addLog(msg));
        setLoading(false);
      }, 0);
    }
  };

  // Función para crear una notificación o anuncio
  const crearNotificacion = async () => {
    let tipoMensaje = "";
    switch(tipoAlerta) {
      case 'anuncio': tipoMensaje = "anuncio"; break;
      case 'evento': tipoMensaje = "evento"; break;
      case 'emergencia': tipoMensaje = "emergencia"; break;
      default: tipoMensaje = "notificación";
    }
    
    const toastId = toast.loading(`Creando ${tipoMensaje}...`);
    setIsCreateDialogOpen(false);
    
    if (!residencialFilter || residencialFilter === "todos") {
      toast.dismiss(toastId);
      setTimeout(() => {
        toast.error("Por favor seleccione un residencial específico");
      }, 100);
      return;
    }
    
    if (!newAlertaMensaje?.trim()) {
      toast.dismiss(toastId);
      setTimeout(() => {
        toast.error("Por favor ingrese un mensaje");
      }, 100);
      return;
    }
    
    try {
      console.log(`Buscando residencial con ID: ${residencialFilter}`);
      const residencialDoc = await getDoc(doc(db, `residenciales/${residencialFilter}`));
      
      if (!residencialDoc.exists()) {
        toast.dismiss(toastId);
        setTimeout(() => {
          toast.error(`No se encontró el residencial con ID: ${residencialFilter}`);
        }, 100);
        return;
      }
      
      const residencialData = residencialDoc.data();
      const residencialNombre = residencialData.nombre || "Desconocido";
      console.log(`Residencial encontrado: ${residencialNombre}`);
      
      console.log(`Buscando usuarios con residencialID=${residencialFilter}`);
      console.log("🔍 Comprobando si hay usuarios con ese residencialID...");
      const usuariosResidencialQuery = query(
        collection(db, "usuarios"),
        where("residencialID", "==", residencialFilter)
      );
      const usuariosResidencialSnapshot = await getDocs(usuariosResidencialQuery);
      console.log(`📊 Usuarios totales con residencialID=${residencialFilter}: ${usuariosResidencialSnapshot.size}`);
      
      let titulo = "";
      switch(tipoAlerta) {
        case 'anuncio': titulo = "Anuncio importante"; break;
        case 'evento': titulo = "Evento programado"; break;
        case 'emergencia': titulo = "Alerta de emergencia"; break;
        default: titulo = "Notificación";
      }
      
      let fcmType = "";
      switch(tipoAlerta) {
        case 'anuncio': fcmType = "announcement"; break;
        case 'evento': fcmType = "event"; break;
        case 'emergencia': fcmType = "emergency"; break;
        default: fcmType = "alert";
      }
      
      const nuevaNotificacion: Record<string, any> = {
        timestamp: Timestamp.fromDate(new Date()),
        status: "active",
        residencialID: residencialData.residencialID || residencialFilter,
        message: newAlertaMensaje,
        read: false,
        type: tipoAlerta,
        titulo: titulo,
        createdBy: "admin",
        userName: "Administrador",
        userEmail: usuarios.find(user => user.role === 'admin')?.email || "admin@sistema.com"
      };
      
      if (isProgramada) {
        nuevaNotificacion.isProgramada = true;
        nuevaNotificacion.frecuenciaProgramacion = frecuenciaProgramacion;
        
        if (frecuenciaProgramacion === "semanal" && diasSemana.length > 0) {
          nuevaNotificacion.diasSemana = diasSemana;
        }
        
        if (fechaEnvio) {
          nuevaNotificacion.fechaEnvio = fechaEnvio;
        }
        
        nuevaNotificacion.horaEnvio = horaEnvio || "09:00";
        console.log(`🔄 Programando ${tipoMensaje} con frecuencia ${frecuenciaProgramacion}`);
      }
      
      const rutaNotificacionResidencial = `residenciales/${residencialFilter}/notificaciones`;
      console.log(`💾 Guardando ${tipoMensaje} en: ${rutaNotificacionResidencial}`);
      const docRef = await addDoc(collection(db, rutaNotificacionResidencial), nuevaNotificacion);
      console.log(`✅ ${tipoMensaje} creada con ID: ${docRef.id} en la subcolección del residencial`);
      
      if (isProgramada) {
        try {
          console.log("⏰ Guardando en la subcolección de notificaciones programadas del residencial...");
          await addDoc(collection(db, `residenciales/${residencialFilter}/notificacionesProgramadas`), {
            ...nuevaNotificacion,
            notificationId: docRef.id
          });
          console.log("✅ Notificación programada guardada correctamente en la subcolección del residencial");
        } catch (error) {
          console.error("❌ Error al guardar notificación programada:", error);
        }
      }
      
      if (usuariosResidencialSnapshot.size > 0) {
        console.log(`📱 Guardando notificación en la subcolección de cada usuario afectado...`);
        const usuariosAfectados: any[] = [];
        
        if (destinatariosTopic === 'todos') {
          usuariosResidencialSnapshot.forEach(userDoc => {
            usuariosAfectados.push({id: userDoc.id, ...userDoc.data()});
          });
        } else if (destinatariosTopic === 'residentes') {
          usuariosResidencialSnapshot.forEach(userDoc => {
            const userData = userDoc.data();
            if (userData.role === 'resident') {
              usuariosAfectados.push({id: userDoc.id, ...userData});
            }
          });
        } else if (destinatariosTopic === 'seguridad') {
          usuariosResidencialSnapshot.forEach(userDoc => {
            const userData = userDoc.data();
            if (userData.role === 'security') {
              usuariosAfectados.push({id: userDoc.id, ...userData});
            }
          });
        }
        
        console.log(`👥 Número de usuarios que recibirán la notificación: ${usuariosAfectados.length}`);
        const notificacionesGuardadas = await Promise.all(
          usuariosAfectados.map(async usuario => {
            try {
              const rutaNotificacionUsuario = `usuarios/${usuario.id}/notificaciones`;
              const userNotificationRef = await addDoc(collection(db, rutaNotificacionUsuario), {
                ...nuevaNotificacion,
                notificationId: docRef.id,
                sourceCollection: rutaNotificacionResidencial
              });
              console.log(`✅ Notificación guardada para usuario ${usuario.id || 'desconocido'}`);
              return userNotificationRef.id;
            } catch (error) {
              console.error(`❌ Error al guardar notificación para usuario ${usuario.id || 'desconocido'}:`, error);
              return null;
            }
          })
        );
        
        const notificacionesExitosas = notificacionesGuardadas.filter(id => id !== null);
        console.log(`📊 Notificaciones guardadas con éxito: ${notificacionesExitosas.length} de ${usuariosAfectados.length}`);
      } else {
        console.log("⚠️ No se encontraron usuarios para este residencial, no se guardaron notificaciones para usuarios");
      }
      
      if (!isProgramada) {
        let topic = '';
        const residencialCodigo = residencialData.residencialID || '';
        console.log(`🔑 Código de residencial para tópicos: ${residencialCodigo}`);
        
        if (!residencialCodigo) {
          console.error('No se encontró el código de residencial para crear el tópico');
          throw new Error('Código de residencial no encontrado');
        }
        
        if (destinatariosTopic === 'todos') {
          topic = `residential_${residencialCodigo}`;
        } else if (destinatariosTopic === 'residentes') {
          topic = `role_${residencialCodigo}_resident`;
        } else if (destinatariosTopic === 'seguridad') {
          topic = `role_${residencialCodigo}_security`;
        }
        
        console.log(`📣 Tópico final construido para envío: ${topic}`);
        let fcmPriority = notificacionPriority;
        if (notificacionPriority === 'urgent' || tipoAlerta === 'emergencia') {
          fcmPriority = 'high';
        }
        
        try {
          const handleTopicNotificationFunction = httpsCallable(functions, 'handleTopicNotification');
          const notificationData = {
            topic: topic,
            notification: {
              title: titulo,
              body: newAlertaMensaje
            },
            data: {
              type: fcmType,
              priority: fcmPriority,
              residentialId: residencialCodigo,
              residentialName: residencialNombre,
              message: newAlertaMensaje,
              notificationId: docRef.id,
              saveToUserCollection: "true",
              saveToResidentialCollection: "true"
            }
          };
          console.log(`📲 Enviando notificación al tópico: ${topic}`, JSON.stringify(notificationData, null, 2));
          const result = await handleTopicNotificationFunction(notificationData);
          console.log('✅ Notificación enviada correctamente:', result);
        } catch (error) {
          console.error('❌ Error al enviar notificación a tópico:', error);
        }
      }
      
      toast.dismiss(toastId);
      setTimeout(() => {
        if (isProgramada) {
          toast.success(`${tipoAlerta === 'anuncio' ? 'Anuncio' : tipoAlerta === 'evento' ? 'Evento' : tipoAlerta === 'emergencia' ? 'Emergencia' : 'Notificación'} programado(a) con éxito`);
        } else {
          toast.success(`${tipoAlerta === 'anuncio' ? 'Anuncio' : tipoAlerta === 'evento' ? 'Evento' : tipoAlerta === 'emergencia' ? 'Emergencia' : 'Notificación'} creado(a) con éxito en residencial "${residencialNombre}"`);
        }
      }, 100);
      
      setNewAlertaMensaje("");
      setIsProgramada(false);
      setFrecuenciaProgramacion("semanal");
      setDiasSemana([]);
      setFechaEnvio("");
      setHoraEnvio("09:00");
      
      if (isProgramada) {
        addLog(`⏰ ${tipoAlerta === 'anuncio' ? 'Anuncio' : tipoAlerta === 'evento' ? 'Evento' : tipoAlerta === 'emergencia' ? 'Emergencia' : 'Notificación'} programado(a) con éxito.`);
      } else {
        addLog(`✅ ${tipoAlerta === 'anuncio' ? 'Anuncio' : tipoAlerta === 'evento' ? 'Evento' : tipoAlerta === 'emergencia' ? 'Emergencia' : 'Notificación'} creado(a) con éxito. La tabla se actualizará automáticamente.`);
      }
    } catch (error) {
      console.error(`Error al crear ${tipoMensaje}:`, error);
      toast.dismiss(toastId);
      setTimeout(() => {
        toast.error(`Error al crear ${tipoMensaje}. Consulte la consola para más detalles.`);
      }, 100);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Centro de Alertas y Notificaciones</h2>
          <p className="text-muted-foreground">
            Gestiona alertas de emergencia y notificaciones para residentes
            <span className="text-xs block mt-1 flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1 inline" />
              Última actualización: {new Date().toLocaleTimeString()}
              {alertas.length > 0 && (
                <span className="flex items-center ml-2 text-green-500">
                  <Wifi className="h-3.5 w-3.5 mr-1 animate-pulse" />
                  En tiempo real
                </span>
              )}
            </span>
          </p>
        </div>
        
        <Button onClick={handleOpenCreateModal}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Crear notificación
        </Button>
      </div>
      
      {/* Pestañas para separar alertas y notificaciones */}
      <div className="flex items-center justify-between mt-4 mb-6">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <Button 
            variant={activeTab === "alertas" ? "default" : "ghost"} 
            className={activeTab === "alertas" ? "bg-background shadow-sm" : ""}
            onClick={() => setActiveTab("alertas")}
            size="sm"
          >
            <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
            Alertas de Pánico
          </Button>
          <Button 
            variant={activeTab === "notificaciones" ? "default" : "ghost"} 
            className={activeTab === "notificaciones" ? "bg-background shadow-sm" : ""}
            onClick={() => setActiveTab("notificaciones")}
            size="sm"
          >
            <Bell className="h-4 w-4 mr-2 text-amber-500" />
            Notificaciones
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-xl">Filtros</CardTitle>
          <CardDescription>
            {filteredAlertas.length} {activeTab === "alertas" ? "alertas" : "notificaciones"} encontradas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="w-full md:w-64">
              <label htmlFor="residencial" className="block text-sm font-medium mb-1">
                Residencial
              </label>
              <Select
                value={residencialFilter}
                onValueChange={(value) => {
                  if (!esAdminDeResidencial) {
                    setResidencialFilter(value);
                  }
                }}
                disabled={esAdminDeResidencial && !!residencialIdDocDelAdmin} // Deshabilitar si es admin de res y su ID está determinado
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar residencial" />
                </SelectTrigger>
                <SelectContent>
                  {userClaims?.isGlobalAdmin && !esAdminDeResidencial && (
                    <SelectItem value="todos">Todos los residenciales</SelectItem>
                  )}
                  {residenciales
                    .filter(r => r.id && (!esAdminDeResidencial || r.id === residencialIdDocDelAdmin))
                    .map((residencial) => (
                      <SelectItem key={residencial.id} value={residencial.id!}>
                        {residencial.nombre}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-64">
              <label htmlFor="estado" className="block text-sm font-medium mb-1">
                Estado
              </label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="resolved">Resueltas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full">
              <label htmlFor="search" className="block text-sm font-medium mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Buscar por nombre, dirección o teléfono"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-xl">
            Listado de {activeTab === "alertas" ? "Alertas de Pánico" : "Notificaciones"}
          </CardTitle>
          <CardDescription>
            {activeTab === "alertas" 
              ? "Alertas ordenadas por fecha (más recientes primero)" 
              : "Notificaciones y anuncios ordenados por fecha (más recientes primero)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Residencial</TableHead>
                  <TableHead className="w-[150px]">
                    {activeTab === "alertas" ? "Tipo" : "Prioridad"}
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 text-primary animate-spin mr-2" />
                        <span>Cargando {activeTab === "alertas" ? "alertas de pánico" : "notificaciones"}...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAlertas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No se encontraron {activeTab === "alertas" ? "alertas de pánico" : "notificaciones"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlertas.map((alerta) => {
                    const id = alerta.id;
                    const resId = alerta.residencialID;
                    const estaSiendoActualizada = alertasActualizando[alerta.id || ''];
                    
                    return (
                      <TableRow key={alerta.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`mr-2 h-3 w-3 rounded-full ${getStatusColor(alerta.status || 'active')}`} />
                            <span>{getStatusLabel(alerta.status || 'active')}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(alerta.timestamp)}</TableCell>
                        <TableCell>
                          {/* Mostrar información del usuario según el tipo de alerta */}
                          {(alerta.tipo || alerta.type) === "panic_alert" ? (
                            // Para alertas de pánico, mostrar toda la información del usuario
                            <>
                              <div className="font-medium">{alerta.userName || "Usuario desconocido"}</div>
                              <div className="text-sm text-gray-500">{alerta.userEmail}</div>
                              <div className="text-sm text-gray-500">{alerta.userPhone}</div>
                            </>
                          ) : (
                            // Para notificaciones, mostrar solo "Administrador"
                            <div className="font-medium">Administrador</div>
                          )}
                        </TableCell>
                        <TableCell>{alerta._residencialNombre || "Desconocido"}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            {(alerta.tipo || alerta.type) === "panic_alert" ? (
                              <>
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                {activeTab === "alertas" ? (
                                  <span className="font-semibold">Alerta de Pánico</span>
                                ) : (
                                  <span className="font-semibold">Pánico</span>
                                )}
                              </>
                            ) : (alerta.tipo || alerta.type) === "anuncio" ? (
                              <>
                                <Info className="h-5 w-5 text-blue-500" />
                                <span className="font-semibold">Anuncio</span>
                              </>
                            ) : (
                              <>
                                <Bell className="h-5 w-5 text-amber-500" />
                                <span className="font-semibold">Notificación</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {estaSiendoActualizada ? (
                            <div className="flex items-center justify-end">
                              <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                              <span className="text-sm">Actualizando...</span>
                            </div>
                          ) : (
                            <>
                              {/* Mostrar diferentes botones según el tipo de alerta */}
                              {(alerta.tipo || alerta.type) === "panic_alert" ? (
                                // Botones para alertas de pánico
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mr-2"
                                    onClick={() => handleOpenDetails(alerta)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Detalles
                                  </Button>
                                  {alerta.status === 'active' && id && resId && (
                                    <Button
                                      variant="outline" 
                                      size="sm"
                                      className="mr-2 text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                                      onClick={() => {
                                        setTimeout(() => {
                                          handleStatusChange(id, resId, 'in_progress', 1);
                                        }, 0);
                                      }}
                                    >
                                      <Clock className="h-4 w-4 mr-1" />
                                      En Progreso
                                    </Button>
                                  )}
                                  {(alerta.status === 'active' || alerta.status === 'in_progress') && alerta.id && alerta.residencialID && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-green-600 border-green-600 hover:bg-green-50"
                                      onClick={() => {
                                        setTimeout(() => {
                                          handleStatusChange(id, resId, 'resolved', 1);
                                        }, 0);
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Resolver
                                    </Button>
                                  )}
                                </>
                              ) : (
                                // Botones para notificaciones y anuncios
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mr-2"
                                    onClick={() => handleOpenDetails(alerta)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Ver
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mr-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                                    onClick={() => handleEditNotificacion(alerta)}
                                  >
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Editar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteNotificacion(alerta)}
                                  >
                                    <Trash className="h-4 w-4 mr-1" />
                                    Eliminar
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Modal para ver detalles de alerta */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Detalles
            </DialogTitle>
            <DialogDescription>
              Información detallada
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlerta && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Estado</h3>
                  <div className="mt-1 flex items-center">
                    <div className={`mr-2 h-3 w-3 rounded-full ${getStatusColor(selectedAlerta.status || 'active')}`} />
                    <span>{getStatusLabel(selectedAlerta.status || 'active')}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fecha</h3>
                  <p className="mt-1">{formatDate(selectedAlerta.timestamp)}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Usuario</h3>
                {(selectedAlerta.tipo || selectedAlerta.type) === "panic_alert" ? (
                  // Para alertas de pánico, mostrar toda la información del usuario
                  <>
                    <p className="mt-1 font-medium">{selectedAlerta.userName || "Usuario desconocido"}</p>
                    <p className="text-sm text-gray-500">{selectedAlerta.userEmail}</p>
                    <p className="text-sm text-gray-500">{selectedAlerta.userPhone}</p>
                  </>
                ) : (
                  // Para notificaciones, mostrar solo "Administrador"
                  <p className="mt-1 font-medium">Administrador</p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Residencial</h3>
                <p className="mt-1">{selectedAlerta._residencialNombre || "Desconocido"}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Mensaje</h3>
                <p className="mt-1">{selectedAlerta.message || "Sin mensaje"}</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <div className="flex gap-2">
              {selectedAlerta && selectedAlerta.status === 'active' && (
                <Button
                  variant="outline"
                  className="border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                  onClick={() => {
                    const id = selectedAlerta.id;
                    const resId = selectedAlerta.residencialID;
                    setDetailsOpen(false);
                    setTimeout(() => {
                      handleStatusChange(id, resId, 'in_progress', 1);
                    }, 0);
                  }}
                >
                  En Progreso
                </Button>
              )}
              {selectedAlerta && (selectedAlerta.status === 'active' || selectedAlerta.status === 'in_progress') && (
                <Button
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                  onClick={() => {
                    const id = selectedAlerta.id;
                    const resId = selectedAlerta.residencialID;
                    setDetailsOpen(false);
                    setTimeout(() => {
                      handleStatusChange(id, resId, 'resolved', 1);
                    }, 0);
                  }}
                >
                  Resolver
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de creación de notificaciones */}
      <Dialog open={isCreateDialogOpen} onOpenChange={handleCloseCreateModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Notificación para Residentes</DialogTitle>
            <DialogDescription>
              Envía notificaciones o anuncios informativos a los usuarios del residencial seleccionado
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Selector de residencial */}
            <div>
              <label htmlFor="residencial" className="block text-sm font-medium mb-2">
                Residencial
              </label>
              <Select
                value={newAlertaResidencial} 
                onValueChange={(value) => {
                  if (!esAdminDeResidencial) {
                    setNewAlertaResidencial(value);
                    setResidencialFilter(value); 
                  }
                }}
                disabled={esAdminDeResidencial && !!residencialIdDocDelAdmin}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar residencial" />
                </SelectTrigger>
                <SelectContent>
                  {residenciales
                    .filter(r => r.id && (!esAdminDeResidencial || r.id === residencialIdDocDelAdmin)) 
                    .map((residencial) => (
                      <SelectItem key={residencial.id} value={residencial.id!}>
                        {residencial.nombre}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Selector visual de destinatarios (PRIMERO) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Destinatarios
              </label>
              <div className="grid grid-cols-4 gap-4">
                <div 
                  className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center transition-all ${destinatariosTopic === 'todos' && 'border-blue-500 bg-blue-50 shadow-sm'}`}
                  onClick={() => setDestinatariosTopic('todos')}
                >
                  <div className="text-3xl mb-2">👥</div>
                  <div className="text-sm font-medium text-center">Todos</div>
                </div>
                
                <div 
                  className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center transition-all ${destinatariosTopic === 'residentes' && 'border-green-500 bg-green-50 shadow-sm'}`}
                  onClick={() => setDestinatariosTopic('residentes')}
                >
                  <div className="text-3xl mb-2">🏠</div>
                  <div className="text-sm font-medium text-center">Residentes</div>
                </div>
                
                <div 
                  className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center transition-all ${destinatariosTopic === 'seguridad' && 'border-orange-500 bg-orange-50 shadow-sm'}`}
                  onClick={() => setDestinatariosTopic('seguridad')}
                >
                  <div className="text-3xl mb-2">👮</div>
                  <div className="text-sm font-medium text-center">Seguridad</div>
                </div>
              </div>
            </div>
            
            {/* Selector visual de tipo de notificación (UNIFICADO) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Tipo de notificación
              </label>
              <div className="grid grid-cols-4 gap-4">
                <div 
                  className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center transition-all ${tipoAlerta === 'anuncio' && 'border-blue-500 bg-blue-50 shadow-sm'}`}
                  onClick={() => {
                    setTipoAlerta('anuncio');
                    setNotificacionTipo('announcement');
                  }}
                >
                  <div className="text-3xl mb-2">📢</div>
                  <div className="text-sm font-medium text-center">Anuncio</div>
                </div>
                
                <div 
                  className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center transition-all ${tipoAlerta === 'notificacion' && 'border-amber-500 bg-amber-50 shadow-sm'}`}
                  onClick={() => {
                    setTipoAlerta('notificacion');
                    setNotificacionTipo('alert');
                  }}
                >
                  <div className="text-3xl mb-2">🔔</div>
                  <div className="text-sm font-medium text-center">Notificación</div>
                </div>

                <div 
                  className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center transition-all ${tipoAlerta === 'evento' && 'border-purple-500 bg-purple-50 shadow-sm'}`}
                  onClick={() => {
                    setTipoAlerta('evento');
                    setNotificacionTipo('event');
                  }}
                >
                  <div className="text-3xl mb-2">📅</div>
                  <div className="text-sm font-medium text-center">Evento</div>
                </div>

                <div 
                  className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center transition-all ${tipoAlerta === 'emergencia' && 'border-red-500 bg-red-50 shadow-sm'}`}
                  onClick={() => {
                    setTipoAlerta('emergencia');
                    setNotificacionTipo('emergency');
                  }}
                >
                  <div className="text-3xl mb-2">⚠️</div>
                  <div className="text-sm font-medium text-center">Emergencia</div>
                </div>
              </div>
            </div>
            
            {/* Selector visual de prioridad */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Prioridad
              </label>
              <div className="flex space-x-4">
                <div 
                  className={`cursor-pointer flex-1 border rounded-lg p-3 flex flex-col items-center justify-center transition-all ${notificacionPriority === 'normal' && 'border-gray-400 bg-gray-50 shadow-sm'}`}
                  onClick={() => setNotificacionPriority('normal')}
                >
                  <div className="text-2xl mb-1">⚪</div>
                  <div className="text-sm font-medium text-center">Normal</div>
                </div>
                
                <div 
                  className={`cursor-pointer flex-1 border rounded-lg p-3 flex flex-col items-center justify-center transition-all ${notificacionPriority === 'high' && 'border-blue-500 bg-blue-50 shadow-sm'}`}
                  onClick={() => setNotificacionPriority('high')}
                >
                  <div className="text-2xl mb-1">🔵</div>
                  <div className="text-sm font-medium text-center">Importante</div>
                </div>
                
                <div 
                  className={`cursor-pointer flex-1 border rounded-lg p-3 flex flex-col items-center justify-center transition-all ${notificacionPriority === 'urgent' && 'border-red-500 bg-red-50 shadow-sm'}`}
                  onClick={() => setNotificacionPriority('urgent')}
                >
                  <div className="text-2xl mb-1">🔴</div>
                  <div className="text-sm font-medium text-center">Urgente</div>
                </div>
              </div>
            </div>
            
            {/* Previsualización de la notificación */}
            <div className="p-4 border rounded-lg">
              <h3 className="text-sm font-medium mb-2">Vista previa de la notificación</h3>
              <div className={`border rounded-lg p-4 mb-4 ${
                tipoAlerta === 'anuncio' ? 'border-blue-200 bg-blue-50' : 
                tipoAlerta === 'emergencia' ? 'border-red-200 bg-red-50' : 
                tipoAlerta === 'evento' ? 'border-purple-200 bg-purple-50' : 
                'border-amber-200 bg-amber-50'
              }`}>
                <div className="flex items-center">
                  <div className="mr-3 text-xl">
                    {tipoAlerta === 'anuncio' ? '📢' : 
                     tipoAlerta === 'emergencia' ? '⚠️' : 
                     tipoAlerta === 'evento' ? '📅' : '🔔'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {tipoAlerta === 'anuncio' ? 'Anuncio importante' : 
                       tipoAlerta === 'emergencia' ? 'Alerta de emergencia' : 
                       tipoAlerta === 'evento' ? 'Evento programado' : 'Notificación'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {residenciales.find(r => r.id === residencialFilter)?.nombre || 'Residencial seleccionado'}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">Ahora</div>
                </div>
                <div className="mt-2 text-sm">
                  {newAlertaMensaje || 'Tu mensaje aparecerá aquí...'}
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center">
                  <span className="mr-2">Enviado a:</span>
                  {destinatariosTopic === 'todos' && <span className="flex items-center"><span className="mr-1">👥</span> Todos los usuarios</span>}
                  {destinatariosTopic === 'residentes' && <span className="flex items-center"><span className="mr-1">🏠</span> Solo residentes</span>}
                  {destinatariosTopic === 'seguridad' && <span className="flex items-center"><span className="mr-1">👮</span> Personal de seguridad</span>}
                </div>
                {isProgramada && (
                  <div className="mt-2 text-xs bg-gray-100 p-2 rounded-md border border-gray-200">
                    <div className="flex items-center text-gray-600">
                      <span className="mr-1">⏰</span> Notificación programada: 
                      {frecuenciaProgramacion === "semanal" && diasSemana.length > 0 && (
                        <span className="ml-1">
                          {diasSemana.map(dia => {
                            switch(dia) {
                              case "lunes": return "Lun";
                              case "martes": return "Mar";
                              case "miercoles": return "Mié";
                              case "jueves": return "Jue";
                              case "viernes": return "Vie";
                              case "sabado": return "Sáb";
                              case "domingo": return "Dom";
                              default: return dia;
                            }
                          }).join(", ")}
                          {horaEnvio && ` a las ${horaEnvio}`}
                        </span>
                      )}
                      {frecuenciaProgramacion === "diaria" && (
                        <span className="ml-1">
                          Todos los días
                          {horaEnvio && ` a las ${horaEnvio}`}
                        </span>
                      )}
                      {frecuenciaProgramacion === "mensual" && fechaEnvio && (
                        <span className="ml-1">
                          El día {new Date(fechaEnvio).getDate()} de cada mes
                          {horaEnvio && ` a las ${horaEnvio}`}
                        </span>
                      )}
                      {frecuenciaProgramacion === "unica" && fechaEnvio && (
                        <span className="ml-1">
                          El {new Date(fechaEnvio).toLocaleDateString()}
                          {horaEnvio && ` a las ${horaEnvio}`}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Configuración de programación */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="programacionCheck" 
                    checked={isProgramada}
                    onChange={(e) => setIsProgramada(e.target.checked)}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="programacionCheck" className="block text-sm font-medium">
                    Programar envío recurrente
                  </label>
                </div>
                {isProgramada && (
                  <div className="text-xs text-blue-600 flex items-center">
                    <span className="mr-1">⏰</span> La notificación se enviará según la programación
                  </div>
                )}
              </div>
              
              {isProgramada && (
                <div className="pl-6 space-y-4 border-l-2 border-blue-100">
                  {/* Selector de frecuencia */}
                  <div>
                    <label htmlFor="frecuencia" className="block text-sm font-medium mb-1">
                      Frecuencia
                    </label>
                    <Select
                      value={frecuenciaProgramacion}
                      onValueChange={(value) => setFrecuenciaProgramacion(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar frecuencia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diaria">Diaria</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="mensual">Mensual</SelectItem>
                        <SelectItem value="unica">Fecha específica (una vez)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Selector de días de la semana (solo para frecuencia semanal) */}
                  {frecuenciaProgramacion === "semanal" && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Días de la semana
                      </label>
                      <div className="grid grid-cols-7 gap-1">
                        {["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"].map((dia) => (
                          <div 
                            key={dia}
                            className={`cursor-pointer text-center p-2 rounded-md text-sm ${
                              diasSemana.includes(dia) 
                                ? 'bg-blue-100 border border-blue-300' 
                                : 'bg-gray-50 border border-gray-200'
                            }`}
                            onClick={() => {
                              if (diasSemana.includes(dia)) {
                                setDiasSemana(diasSemana.filter(d => d !== dia));
                              } else {
                                setDiasSemana([...diasSemana, dia]);
                              }
                            }}
                          >
                            {dia === "lunes" ? "L" : 
                             dia === "martes" ? "M" : 
                             dia === "miercoles" ? "X" : 
                             dia === "jueves" ? "J" : 
                             dia === "viernes" ? "V" : 
                             dia === "sabado" ? "S" : "D"}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Selector de fecha específica */}
                  {(frecuenciaProgramacion === "mensual" || frecuenciaProgramacion === "unica") && (
                    <div>
                      <label htmlFor="fechaEnvio" className="block text-sm font-medium mb-1">
                        {frecuenciaProgramacion === "mensual" ? "Día del mes" : "Fecha"}
                      </label>
                      <Input
                        id="fechaEnvio"
                        type="date"
                        value={fechaEnvio}
                        onChange={(e) => setFechaEnvio(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {/* Selector de hora */}
                  <div>
                    <label htmlFor="horaEnvio" className="block text-sm font-medium mb-1">
                      Hora de envío
                    </label>
                    <Input
                      id="horaEnvio"
                      type="time"
                      value={horaEnvio}
                      onChange={(e) => setHoraEnvio(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Editor de mensaje con plantillas */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="mensaje" className="block text-sm font-medium">
                  Mensaje
                </label>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setNewAlertaMensaje("Estimados usuarios, les informamos que...")}
                  >
                    Anuncio
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setNewAlertaMensaje("Se le recuerda a todos los residentes que...")}
                  >
                    Recordatorio
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setNewAlertaMensaje("Por motivos de seguridad, se solicita a todos los residentes...")}
                  >
                    Seguridad
                  </Button>
                </div>
              </div>
              <Textarea
                id="mensaje"
                value={newAlertaMensaje}
                onChange={(e) => setNewAlertaMensaje(e.target.value)}
                placeholder="Escriba su mensaje aquí..."
                className="min-h-[100px]"
              />
              <div className="text-xs text-gray-500 flex justify-between">
                <span>Caracteres: {newAlertaMensaje.length}</span>
                {newAlertaMensaje.length > 0 && <span className="text-green-600">✓ Mensaje listo para enviar</span>}
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={crearNotificacion} disabled={!newAlertaMensaje.trim() || !residencialFilter || residencialFilter === "todos"}>
              <span className="mr-2">Enviar notificación</span>
              {tipoAlerta === 'anuncio' ? '📢' : 
               tipoAlerta === 'emergencia' ? '⚠️' : 
               tipoAlerta === 'evento' ? '📅' : '🔔'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para editar notificación */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Notificación</DialogTitle>
            <DialogDescription>
              Modifica los detalles de la notificación seleccionada
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="editTipoAlerta" className="block text-sm font-medium mb-1">
                Tipo de notificación
              </label>
              <Select
                value={editTipoAlerta}
                onValueChange={(value) => setEditTipoAlerta(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notificacion">
                    Notificación general
                  </SelectItem>
                  <SelectItem value="anuncio">
                    Anuncio informativo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="editMensaje" className="block text-sm font-medium mb-1">
                Mensaje
              </label>
              <Textarea
                id="editMensaje"
                placeholder="Contenido de la notificación"
                value={editMensaje}
                onChange={(e) => setEditMensaje(e.target.value)}
                className="resize-none"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button" 
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              disabled={!editMensaje?.trim()}
              onClick={guardarCambiosNotificacion}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 