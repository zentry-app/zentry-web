"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
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
  TableRow 
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  UserPlus, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash, 
  UserCog, 
  Mail, 
  Phone, 
  Home, 
  Clock,
  Shield,
  Users,
  Building,
  FileText,
  ExternalLink,
  Eye,
  Trash2,
  RefreshCcw,
  AlertTriangle,
  Percent,
  Info
} from "lucide-react";
import { getUsuarios, getUsuariosPendientes, getUsuariosPorResidencial, cambiarEstadoUsuario, cambiarEstadoMoroso, crearUsuario, eliminarUsuario, Usuario, getResidenciales, Residencial, suscribirseAUsuarios, suscribirseAUsuariosPendientes, suscribirseAResidenciales, cambiarMorosidadPorCasa } from "@/lib/firebase/firestore";
import { 
  documentExistsSimplificado, 
  getDocumentURLSimplificado, 
  eliminarDocumento // Añadir eliminarDocumento a la importación
} from '@/lib/firebase/storage';
import { usuarioToUserModel, userModelToUsuario } from "@/lib/utils/user-mappers";
import { toast as sonnerToast } from "sonner";
import Image from "next/image";
import { useAuth, UserClaims } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import GlobalScreenRestrictionsConfig from "@/components/dashboard/usuarios/GlobalScreenRestrictionsConfig";

import { auth, db } from '@/lib/firebase/config';
import { debounce } from "lodash";
import { Dialog as HeadlessDialog } from '@headlessui/react';
import { collection, doc, setDoc, updateDoc, Timestamp, getDoc } from "firebase/firestore";
import { useRef } from "react";
import { memo } from "react";
import { AuthService } from "@/lib/services/auth-service";
import { UserRole } from "@/types/models";
import dynamic from 'next/dynamic'; // Importar dynamic
import { Skeleton } from "@/components/ui/skeleton"; // Importar Skeleton

// Importar dinámicamente DetallesUsuarioDialog
const DetallesUsuarioDialog = dynamic(() => import('@/components/dashboard/usuarios/DetallesUsuarioDialog'), {
  suspense: true,
});

// Importar dinámicamente NuevoUsuarioDialogContent
const NuevoUsuarioDialogContent = dynamic(() => import('@/components/dashboard/usuarios/NuevoUsuarioDialogContent'), {
  suspense: true,
});

// Importar dinámicamente ConfirmarEliminarDialogContent
const ConfirmarEliminarDialogContent = dynamic(() => import('@/components/dashboard/usuarios/ConfirmarEliminarDialogContent'), {
  suspense: true,
});

// Importar dinámicamente MostrarDocumentoDialogContent
const MostrarDocumentoDialogContent = dynamic(() => import('@/components/dashboard/usuarios/MostrarDocumentoDialogContent'), {
  suspense: true,
});

// Importar dinámicamente ContenidoPestanaSeguridad
const ContenidoPestanaSeguridad = dynamic(() => import('@/components/dashboard/usuarios/ContenidoPestanaSeguridad'), {
  suspense: true,
});

// Importar dinámicamente ContenidoPestanaAdministradores
const ContenidoPestanaAdministradores = dynamic(() => import('@/components/dashboard/usuarios/ContenidoPestanaAdministradores'), {
  suspense: true,
});

// Importar dinámicamente ContenidoPestanaPendientes
const ContenidoPestanaPendientes = dynamic(() => import('@/components/dashboard/usuarios/ContenidoPestanaPendientes'), {
  suspense: true,
});

// Importar dinámicamente ContenidoPestanaResidentes
const ContenidoPestanaResidentes = dynamic(() => import('@/components/dashboard/usuarios/ContenidoPestanaResidentes'), {
  suspense: true,
  loading: () => <TableSkeleton />, // Añadir skeleton como fallback de carga
});

const EditarUsuarioDialog = dynamic(() => import('@/components/dashboard/usuarios/EditarUsuarioDialog'), {
  suspense: true,
});

// Importar dinámicamente ContenidoPestanaRechazados
const ContenidoPestanaRechazados = dynamic(() => import('@/components/dashboard/usuarios/ContenidoPestanaRechazados'), {
  suspense: true,
  loading: () => <TableSkeleton />,
});

// Componente de esqueleto para la tabla de usuarios
const TableSkeleton = () => (
  <div className="space-y-2 mt-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
);

// Componente wrapper que permite reiniciar el componente sin recargar la página
export default function UsuariosPage() {
  // Este key se usa para forzar un remontaje completo del componente
  const [componentKey, setComponentKey] = useState<number>(0);
  
  return (
    <UsuariosPageContent key={componentKey} onReset={() => setComponentKey(prev => prev + 1)} />
  );
}

// Componente interno que contiene toda la lógica
function UsuariosPageContent({ onReset }: { onReset: () => void }): JSX.Element {
  const router = useRouter();
  // Obtener userClaims del AuthContext
  const { user, userClaims, loading: authLoading } = useAuth(); 
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuariosPendientes, setUsuariosPendientes] = useState<Usuario[]>([]);
  const [residenciales, setResidenciales] = useState<Residencial[]>([]);
  const [residencialSeleccionado, setResidencialSeleccionado] = useState<string>("todos");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>('residentes');
  const [filterCalle, setFilterCalle] = useState("");
  const [filterNumero, setFilterNumero] = useState("");
  const [filterTipoUsuario, setFilterTipoUsuario] = useState<string>("todos"); // Nuevo filtro por tipo de usuario
  const [mapeoResidenciales, setMapeoResidenciales] = useState<{[key: string]: string}>({});
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<string | null>(null);
  const [documentoURL, setDocumentoURL] = useState<string | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [documentoNombre, setDocumentoNombre] = useState<string>("");
  const [lastNotifiedPendingCount, setLastNotifiedPendingCount] = useState<number>(0);
  const [actualizacionEnTiempoReal, setActualizacionEnTiempoReal] = useState(false);
  const [usuariosAprobando, setUsuariosAprobando] = useState<Set<string>>(new Set());
  const [showNuevoUsuarioDialog, setShowNuevoUsuarioDialog] = useState(false);
  const [nuevoUsuarioForm, setNuevoUsuarioForm] = useState({
    fullName: "",
    paternalLastName: "",
    maternalLastName: "",
    email: "",
    telefono: "",
    role: "resident" as Usuario['role'],
    residencialID: "",
    houseID: "",
    calle: "",
    houseNumber: "",
    password: ""
  });
  const [creandoUsuario, setCreandoUsuario] = useState(false);

  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [houseView, setHouseView] = useState(false); // Vista por casa para pestaña residentes
  const [typingSearchTerm, setTypingSearchTerm] = useState("");
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);
  const [eliminandoUsuario, setEliminandoUsuario] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [showDetallesUsuarioDialog, setShowDetallesUsuarioDialog] = useState(false);
  const [casaDetalles, setCasaDetalles] = useState<CasaResumen | null>(null);
  const [usuarioAEditar, setUsuarioAEditar] = useState<Usuario | null>(null);
  const [showEditarUsuarioDialog, setShowEditarUsuarioDialog] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    telefono: '',
    rol: 'resident' as Usuario['role'],
    residencialId: ''
  });
  const [callesDisponibles, setCallesDisponibles] = useState<string[]>([]);
  const [unsubscribeFunctions, setUnsubscribeFunctions] = useState<(Function | null)[]>([]);
  // Estado para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [elementosPorPagina, setElementosPorPagina] = useState(20);
  // Flag para evitar reconfiguraciones innecesarias
  const [suscripcionesConfiguradas, setSuscripcionesConfiguradas] = useState(false);

  // Determinar si el admin es solo de residencial o global
  const esAdminDeResidencial = useMemo(() =>
    !!userClaims && userClaims.role === 'admin' && !userClaims.isGlobalAdmin,
    [userClaims]
  );
  const residencialIdDelAdmin = useMemo(() => {
    if (!esAdminDeResidencial) return null;
    return userClaims?.managedResidencials?.[0] || userClaims?.residencialId || null;
  }, [esAdminDeResidencial, userClaims]);

  // Resolver a código de residencial (residencialID) usando mapeo si tenemos docId
  const codigoResidencialAdmin = useMemo(() => {
    if (!residencialIdDelAdmin) return null;
    // Si ya es un valor del mapeo (código), úsalo
    if (Object.values(mapeoResidenciales).includes(residencialIdDelAdmin)) {
      return residencialIdDelAdmin;
    }
    // Si coincide como clave (doc id), devolver el código mapeado
    if (mapeoResidenciales[residencialIdDelAdmin]) {
      return mapeoResidenciales[residencialIdDelAdmin];
    }
    // Fallback: devolver original
    return residencialIdDelAdmin;
  }, [residencialIdDelAdmin, mapeoResidenciales]);

  const handleEditarUsuario = (usuario: Usuario) => {
    setUsuarioAEditar(usuario);
    setShowEditarUsuarioDialog(true);
  };

  const handleUpdateUsuario = async (updatedData: Partial<Usuario>) => {
    if (!usuarioAEditar?.id) {
      sonnerToast.error("Error", { description: "No se ha seleccionado un usuario para actualizar." });
      return;
    }

    try {
      const userRef = doc(db, 'usuarios', usuarioAEditar.id);
      
      // Si se está cambiando el límite de códigos QR, eliminar el code_book existente
      // para forzar la regeneración inmediata con el nuevo límite
      if (updatedData.max_codigos_qr_diarios !== undefined) {
        // Agregar la eliminación del code_book al objeto de actualización
        const updateDataWithCodeBookRemoval = {
          ...updatedData,
          code_book: null // Esto eliminará el campo code_book
        };
        await updateDoc(userRef, updateDataWithCodeBookRemoval);
        
        sonnerToast.success("Usuario actualizado", {
          description: `Los permisos de ${usuarioAEditar.fullName} se han guardado correctamente. Los códigos QR se regenerarán automáticamente.`,
        });
      } else {
        // Si no se cambió el límite de códigos QR, actualizar normalmente
        await updateDoc(userRef, updatedData);
        sonnerToast.success("Usuario actualizado", {
          description: `Los permisos de ${usuarioAEditar.fullName} se han guardado correctamente.`,
        });
      }
    } catch (error) {
      console.error("Error al actualizar el usuario:", error);
      sonnerToast.error("Error al actualizar", {
        description: "No se pudieron guardar los cambios. Inténtalo de nuevo.",
      });
    } finally {
      setShowEditarUsuarioDialog(false);
      setUsuarioAEditar(null);
    }
  };

  // =================================================================================
  // REFACTORIZACIÓN: Lógica de carga de datos centralizada
  // =================================================================================
  
  // Función para cargar las calles cuando se selecciona un residencial
  const cargarCallesDelResidencial = useCallback(async (residencialId: string) => {
    try {
      if (!residencialId) {
        setCallesDisponibles([]);
        return;
      }
      
      console.log('🔍 Cargando calles para residencial ID:', residencialId);
      
      // Obtener el documento del residencial
      const residencialDoc = await getDoc(doc(db, 'residenciales', residencialId));
      
      if (residencialDoc.exists()) {
        const residencialData = residencialDoc.data();
        
        // Verificar si existe el campo calles y es un array
        if (residencialData.calles && Array.isArray(residencialData.calles)) {
          console.log('✅ Calles encontradas:', residencialData.calles);
          const callesFiltradas = residencialData.calles.filter((calle: string) => calle && calle.trim() !== '');
          setCallesDisponibles(callesFiltradas);
        } else {
          console.log('⚠️ No se encontraron calles en el residencial');
          setCallesDisponibles([]);
        }
      } else {
        console.log('❌ No se encontró el documento del residencial');
        setCallesDisponibles([]);
      }
    } catch (error) {
      console.error('Error al cargar calles:', error);
      setCallesDisponibles([]);
    }
  }, []);

  const cargarYActualizarUsuarios = useCallback(async (residencialId: string = "todos") => {
    setIsLoading(true);
    try {
      let fetchedUsuarios: Usuario[] = [];
      const fetchInitialData = residenciales.length === 0;

      // Si no tenemos el mapeo de residenciales, cargarlo primero
      if (Object.keys(mapeoResidenciales).length === 0) {
        console.log('🔍 No hay mapeo de residenciales, cargando...');
        const todosLosResidenciales = await getResidenciales();
        const mapeo: {[key: string]: string} = {};
        todosLosResidenciales.forEach(r => {
          if (r.id && r.residencialID) mapeo[r.id] = r.residencialID;
        });
        

        
        setMapeoResidenciales(mapeo);
        setResidenciales(todosLosResidenciales);
      }

      if (residencialId === 'todos') {
        // Carga para admin global, vista "Todos los residenciales"
        console.log('🔍 Cargando TODOS los usuarios para admin global...');
        fetchedUsuarios = await getUsuarios({ 
          getAll: true, // Usar la nueva opción para obtener todos los usuarios
          orderBy: 'createdAt', 
          orderDirection: 'desc',
          debug: true // Habilitar logging detallado
        });
        console.log(`✅ Total de usuarios cargados: ${fetchedUsuarios.length}`);
      } else if (codigoResidencialAdmin) {
        // Carga para admin de residencial (siempre su residencial)
        console.log(`🔍 Cargando usuarios del residencial del admin: ${codigoResidencialAdmin}`);
        fetchedUsuarios = await getUsuariosPorResidencial(codigoResidencialAdmin, { 
          getAll: true, 
          debug: true 
        });
        console.log(`✅ Usuarios del residencial del admin: ${fetchedUsuarios.length}`);
      } else {
        // Carga para admin global que selecciona un residencial específico
        const codigoResidencial = mapeoResidenciales[residencialId];
        if (codigoResidencial) {
          console.log(`🔍 Cargando usuarios del residencial seleccionado: ${codigoResidencial}`);
          fetchedUsuarios = await getUsuariosPorResidencial(codigoResidencial, { 
            getAll: true, 
            debug: true 
          });
          console.log(`✅ Usuarios del residencial seleccionado: ${fetchedUsuarios.length}`);
        } else {
          console.error('❌ No se encontró código de residencial para:', residencialId);
        }
      }
      
      setUsuarios(fetchedUsuarios);
      setLastUpdate(new Date());

      // Cargar datos secundarios solo en la primera carga para evitar llamadas innecesarias
      if (fetchInitialData) {
        const [pendientes] = await Promise.all([
          getUsuariosPendientes({ limit: 50 })
        ]);

        setUsuariosPendientes(pendientes);

        // Si es admin de residencial, preseleccionar su residencial
        if (codigoResidencialAdmin) {
          let idDocResidencialAdmin = Object.keys(mapeoResidenciales).find(key => mapeoResidenciales[key] === codigoResidencialAdmin) || null;
          if (!idDocResidencialAdmin) {
            try {
              const { collection, getDocs, query, where, limit } = await import('firebase/firestore');
              const { db } = await import('@/lib/firebase/config');
              const residencialesRef = collection(db, 'residenciales');
              const q = query(residencialesRef, where('residencialID', '==', codigoResidencialAdmin), limit(1));
              const snap = await getDocs(q);
              if (!snap.empty) {
                idDocResidencialAdmin = snap.docs[0].id;
              }
            } catch (e) {
              console.error('Error resolviendo docId del residencial del admin:', e);
            }
          }
          if (idDocResidencialAdmin) {
            setResidencialSeleccionado(idDocResidencialAdmin);
            cargarCallesDelResidencial(idDocResidencialAdmin);
          }
        }

        // Configurar suscripciones en tiempo real con delay para evitar interferencia
        setTimeout(() => {
          console.log('⏰ Activando suscripciones en tiempo real después de delay...');
          configurarSuscripcionesEnTiempoReal();
        }, 2000); // 2 segundos de delay
      }
    } catch (error) {
      console.error("Error al cargar y actualizar usuarios:", error);
      sonnerToast.error("Error al cargar la lista de usuarios");
    } finally {
      setIsLoading(false);
    }
  }, [residenciales.length, residencialIdDelAdmin, mapeoResidenciales, cargarCallesDelResidencial]);

  // Función para configurar suscripciones en tiempo real
  const configurarSuscripcionesEnTiempoReal = useCallback(() => {
    console.log('🔧 Configurando suscripciones en tiempo real...');

    // ✅ CORREGIDO: Configurar suscripciones siempre, independientemente del estado inicial
    // Esto asegura que las suscripciones estén activas para detectar cambios en tiempo real
    console.log(`✅ Configurando suscripciones en tiempo real (usuarios actuales: ${usuarios.length})`);

    // Limpiar suscripciones anteriores
    unsubscribeFunctions.forEach(unsubscribe => {
      if (unsubscribe) unsubscribe();
    });

    const nuevasSuscripciones: (Function | null)[] = [];

    // Suscripción para usuarios pendientes - SIEMPRE ACTIVA
    console.log('🔧 Configurando suscripción de usuarios pendientes...');
    const unsubscribePendientes = suscribirseAUsuariosPendientes(
      (usuariosPendientesActualizados) => {
        console.log('🔄 Usuarios pendientes actualizados en tiempo real:', usuariosPendientesActualizados.length);
        console.log('📊 IDs de usuarios pendientes:', usuariosPendientesActualizados.map(u => u.id));
        setUsuariosPendientes(usuariosPendientesActualizados);
        setActualizacionEnTiempoReal(true);
        
        // Ocultar el indicador de tiempo real después de 3 segundos
        setTimeout(() => setActualizacionEnTiempoReal(false), 3000);
      },
      { limit: 50 }
    );
    nuevasSuscripciones.push(unsubscribePendientes);

    // Suscripción para usuarios aprobados (solo si es admin global o de residencial específico)
    if (residencialIdDelAdmin || residencialSeleccionado === 'todos') {
      console.log('🔧 Configurando suscripción de usuarios aprobados...');
      const unsubscribeUsuarios = suscribirseAUsuarios(
        (usuariosActualizados) => {
          console.log('🔄 Usuarios actualizados en tiempo real:', usuariosActualizados.length);
          
          // ✅ CORREGIDO: Siempre actualizar cuando hay cambios en tiempo real
          // Esto permite que se actualice correctamente cuando se aprueban/rechazan usuarios
          console.log('✅ Suscripción en tiempo real: Actualizando usuarios');
          
          // Filtrar usuarios según el residencial seleccionado
          let usuariosFiltrados = usuariosActualizados;
          if (residencialIdDelAdmin) {
            usuariosFiltrados = usuariosActualizados.filter(u => u.residencialID === residencialIdDelAdmin);
          } else if (residencialSeleccionado !== 'todos') {
            const codigoResidencial = mapeoResidenciales[residencialSeleccionado];
            if (codigoResidencial) {
              usuariosFiltrados = usuariosActualizados.filter(u => u.residencialID === codigoResidencial);
            }
          }
          
          setUsuarios(usuariosFiltrados);
          setActualizacionEnTiempoReal(true);
          
          // Ocultar el indicador de tiempo real después de 3 segundos
          setTimeout(() => setActualizacionEnTiempoReal(false), 3000);
        },
        { 
          orderBy: 'createdAt', 
          orderDirection: 'desc', 
          limit: 1000 // Aumentar límite para evitar pérdida de usuarios
        }
      );
      nuevasSuscripciones.push(unsubscribeUsuarios);
    }

    // Suscripción para residenciales (solo para admin global)
    if (!residencialIdDelAdmin) {
      console.log('🔧 Configurando suscripción de residenciales...');
      const unsubscribeResidenciales = suscribirseAResidenciales(
        (residencialesActualizados) => {
          console.log('🔄 Residenciales actualizados en tiempo real:', residencialesActualizados.length);
          setResidenciales(residencialesActualizados);
          
          // Actualizar el mapeo de residenciales
          const mapeo: {[key: string]: string} = {};
          residencialesActualizados.forEach(r => {
            if (r.id && r.residencialID) mapeo[r.id] = r.residencialID;
          });
          setMapeoResidenciales(mapeo);
        }
      );
      nuevasSuscripciones.push(unsubscribeResidenciales);
    }

    setUnsubscribeFunctions(nuevasSuscripciones);
    console.log('✅ Suscripciones configuradas correctamente');
  }, [residenciales.length, isLoading, residencialIdDelAdmin, residencialSeleccionado, mapeoResidenciales]);

  // Función para manejar actualizaciones de usuarios
  const handleUsuarioActualizado = useCallback(() => {
    // Esta función se llama cuando se aprueba o rechaza un usuario
    // Por ahora, recargamos manualmente los datos
    console.log('🔄 Usuario actualizado, recargando datos...');
    cargarYActualizarUsuarios(residencialSeleccionado);
  }, [residencialSeleccionado, cargarYActualizarUsuarios]);

  // Manejar notificaciones de usuarios pendientes en un useEffect separado
  useEffect(() => {
    if (isLoading) return;
    
    if (usuariosPendientes.length > 0 && 
        activeTab !== "pendientes" && 
        usuariosPendientes.length > lastNotifiedPendingCount) {
      
      sonnerToast.info(`${usuariosPendientes.length} usuarios pendientes de aprobación`, {
        description: "Se actualizó automáticamente"
      });
      
      setLastNotifiedPendingCount(usuariosPendientes.length);
    } else if (usuariosPendientes.length !== lastNotifiedPendingCount) {
      setLastNotifiedPendingCount(usuariosPendientes.length);
    }
  }, [usuariosPendientes.length, activeTab, isLoading, lastNotifiedPendingCount]);

  // Limpiar suscripciones al desmontar el componente
  useEffect(() => {
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [unsubscribeFunctions]);

  // TEMPORAL: Deshabilitar suscripciones en tiempo real para evitar bucle infinito
  // TODO: Implementar suscripciones en tiempo real de forma más estable
  useEffect(() => {
    console.log('⚠️ Suscripciones en tiempo real deshabilitadas temporalmente para evitar bucle infinito');
    setActualizacionEnTiempoReal(false);
  }, []);

  // Efecto para la carga inicial de datos
  useEffect(() => {
    if (!authLoading && userClaims !== undefined) {
      const idParaCargar = residencialIdDelAdmin || "todos";
      cargarYActualizarUsuarios(idParaCargar);
    }
  }, [authLoading, userClaims, residencialIdDelAdmin, cargarYActualizarUsuarios]);
  
  // Efecto para resetear la página al cambiar de filtro o residencial
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, residencialSeleccionado, searchTerm]);

  useEffect(() => {
    if (isLoading) return;
    
    if (usuariosPendientes.length > 0) {
      usuariosPendientes.forEach(usuario => {
        const identificacionPath = (usuario as any).identificacionPath;
        const comprobantePath = (usuario as any).comprobantePath;
        
        if (identificacionPath || comprobantePath) {
          if (identificacionPath) console.log(`- Identificación: ${identificacionPath}`);
          if (comprobantePath) console.log(`- Comprobante: ${comprobantePath}`);
        }
      });
    }
  }, [usuariosPendientes]);

  const handleAprobarUsuario = async (id: string) => {
    try {
      // Marcar usuario como en proceso de aprobación
      setUsuariosAprobando(prev => new Set(prev).add(id));
      
      // Obtener los datos del usuario antes de aprobarlo para acceder a sus rutas de documentos
      const usuarioPendiente = usuariosPendientes.find(u => u.id === id);
      const identificacionPath = (usuarioPendiente as any)?.identificacionPath;
      const comprobantePath = (usuarioPendiente as any)?.comprobantePath;
      // Guardar rutas para registro
      const rutasDocumentos = {
        identificacion: identificacionPath,
        comprobante: comprobantePath
      };
      console.log("🔄 Aprobando usuario:", id, "con documentos:", rutasDocumentos);
      console.log("📊 Estado antes de aprobar - Usuarios pendientes:", usuariosPendientes.length);
      console.log("📊 Estado antes de aprobar - Usuarios totales:", usuarios.length);
      
      // Aprobar al usuario - las suscripciones en tiempo real manejarán la actualización automática
      await cambiarEstadoUsuario(id, "approved");
      sonnerToast.success("Usuario aprobado correctamente");
      // Mostrar mensaje sobre conservación de documentos
      sonnerToast.info("Los documentos de identificación y comprobante se conservarán en el sistema por protección legal y respaldo administrativo.", {
        description: "Solo el administrador del fraccionamiento o autoridades competentes podrán consultarlos.",
        duration: 6000
      });
      
      console.log("✅ Usuario aprobado exitosamente. Las suscripciones en tiempo real deberían actualizar automáticamente.");
      
      // ✅ RESPUESTA MANUAL: Recargar datos después de 1 segundo como respaldo
      setTimeout(() => {
        console.log("🔄 Recargando datos manualmente como respaldo...");
        cargarYActualizarUsuarios(residencialSeleccionado);
      }, 1000);
      
      // Las suscripciones en tiempo real actualizarán automáticamente las listas
    } catch (error) {
      console.error("Error al aprobar usuario:", error);
      sonnerToast.error("Error al aprobar el usuario");
    } finally {
      // Remover usuario del estado de aprobación
      setUsuariosAprobando(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleRechazarUsuario = async (id: string) => {
    try {
      // Obtener los datos del usuario antes de rechazarlo para acceder a sus rutas de documentos
      const usuarioPendiente = usuariosPendientes.find(u => u.id === id);
      const identificacionPath = (usuarioPendiente as any)?.identificacionPath;
      const comprobantePath = (usuarioPendiente as any)?.comprobantePath;
      
      // Guardar rutas para registro
      const rutasDocumentos = {
        identificacion: identificacionPath,
        comprobante: comprobantePath
      };
      
      console.log("🔄 Rechazando usuario:", id, "con documentos:", rutasDocumentos);
      
      // Primero rechazamos al usuario
      await cambiarEstadoUsuario(id, "rejected");
      sonnerToast.success("Usuario rechazado correctamente");
      
      // Luego intentamos eliminar los documentos
      let docsEliminados = 0;
      let docsFallidos = 0;
      
      if (identificacionPath) {
        const eliminado = await eliminarDocumento(identificacionPath);
        eliminado ? docsEliminados++ : docsFallidos++;
      }
      
      if (comprobantePath) {
        const eliminado = await eliminarDocumento(comprobantePath);
        eliminado ? docsEliminados++ : docsFallidos++;
      }
      
      // Informar al usuario sobre la eliminación de documentos
      if (docsEliminados > 0) {
        console.log(`✅ Se eliminaron ${docsEliminados} documentos asociados al usuario`);
        sonnerToast.success(`Se eliminaron ${docsEliminados} documentos del almacenamiento`, {
          description: "Los documentos rechazados son eliminados automáticamente",
          duration: 4000
        });
      }
      
      if (docsFallidos > 0) {
        console.warn(`⚠️ No se pudieron eliminar ${docsFallidos} documentos`);
        sonnerToast.warning(`No se pudieron eliminar ${docsFallidos} documentos`, {
          description: "Los documentos permanecerán en el almacenamiento",
          duration: 4000
        });
      }
      
      // Las suscripciones en tiempo real actualizarán automáticamente las listas
      
      // ✅ RESPUESTA MANUAL: Recargar datos después de 1 segundo como respaldo
      setTimeout(() => {
        console.log("🔄 Recargando datos manualmente como respaldo...");
        cargarYActualizarUsuarios(residencialSeleccionado);
      }, 1000);
    } catch (error) {
      console.error("Error al rechazar usuario:", error);
      sonnerToast.error("Error al rechazar el usuario");
    }
  };
  
  const handleCambiarEstado = async (id: string, nuevoEstado: Usuario['status']) => {
    try {
      await cambiarEstadoUsuario(id, nuevoEstado);
      
      if (nuevoEstado === "approved") {
        sonnerToast.success("Usuario activado correctamente");
      } else if (nuevoEstado === "inactive") {
        sonnerToast.success("Usuario desactivado correctamente");
      } else {
        sonnerToast.success(`Estado del usuario cambiado a ${nuevoEstado}`);
      }
      
      // Las suscripciones en tiempo real actualizarán automáticamente las listas
    } catch (error) {
      console.error(`Error al cambiar estado del usuario a ${nuevoEstado}:`, error);
      sonnerToast.error("Error al cambiar el estado del usuario");
    }
  };

  const getResidencialIdFromUser = (usuario: Usuario): string => {
    // Verificar las diferentes propiedades donde podría estar el ID del residencial
    if (usuario.residencialID) {
      console.log('🔍 getResidencialIdFromUser - usando residencialID:', {
        nombre: usuario.fullName,
        residencialID: usuario.residencialID
      });
      return usuario.residencialID;
    }
    
    if ((usuario as any)['residencialId']) {
      console.log('🔍 getResidencialIdFromUser - usando residencialId:', {
        nombre: usuario.fullName,
        residencialId: (usuario as any)['residencialId']
      });
      return (usuario as any)['residencialId'];
    }
    
    if ((usuario as any)['residencialDocId']) {
      const docId = (usuario as any)['residencialDocId'];
      // Intentar obtener el residencialID del mapeo
      if (mapeoResidenciales[docId]) {
        console.log('🔍 getResidencialIdFromUser - usando residencialDocId con mapeo:', {
          nombre: usuario.fullName,
          residencialDocId: docId,
          mapeado: mapeoResidenciales[docId]
        });
        return mapeoResidenciales[docId];
      }
      console.log('🔍 getResidencialIdFromUser - usando residencialDocId sin mapeo:', {
        nombre: usuario.fullName,
        residencialDocId: docId
      });
      return docId;
    }
    
    console.log('❌ getResidencialIdFromUser - no se encontró residencial para:', {
      nombre: usuario.fullName,
      usuario: usuario
    });
    return ""; // Valor por defecto vacío en lugar de undefined
  };

  // =============================
  // Agrupación por casa (house view)
  // =============================
  // type moved below to avoid duplicate identifier

  // casasResumen se define después de usuariosDelResidencial para evitar TDZ

  const filtrarUsuariosPorResidencial = (residencialId: string) => {
    if (residencialId === "todos") {
      return usuarios;
    }
    
    // Obtener el código del residencial del mapeo
    const codigoResidencial = mapeoResidenciales[residencialId];
    
    if (!codigoResidencial) {
      return [];
    }
    
    // Filtrar los usuarios que coinciden con el residencial
    const usuariosFiltrados = usuarios.filter(u => {
      const userResidencialId = getResidencialIdFromUser(u);
      // Solo filtrar por coincidencia de residencial, independientemente del rol
      return userResidencialId === codigoResidencial;
    });
    
    return usuariosFiltrados;
  };

  const filtrarUsuariosPorRol = (usuarios: Usuario[], rol: string) => {
    return usuarios.filter(u => {
      const coincideRol = u.role === rol;
      const estaAprobado = u.status === "approved";
      return coincideRol && estaAprobado;
    });
  };

  const filtrarUsuariosPorBusqueda = (usuarios: Usuario[]) => {
    if (!searchTerm) return usuarios;
    
    const termino = searchTerm.toLowerCase();
    return usuarios.filter(usuario => 
      (usuario.fullName || '').toLowerCase().includes(termino) ||
      (usuario.paternalLastName || '').toLowerCase().includes(termino) ||
      (usuario.maternalLastName || '').toLowerCase().includes(termino) ||
      (usuario.email || '').toLowerCase().includes(termino) ||
      (usuario.telefono || '').toLowerCase().includes(termino) ||
      (usuario.calle || '').toLowerCase().includes(termino) ||
      (usuario.houseNumber || '').toLowerCase().includes(termino) ||
      (usuario.houseID || '').toLowerCase().includes(termino)
    );
  };

  const filtrarUsuariosPorDireccion = (usuarios: Usuario[]) => {
    let usuariosFiltrados = usuarios;
    
    // Filtro por calle
    if (filterCalle && filterCalle.trim() && filterCalle !== "todas") {
      const calle = filterCalle.toLowerCase().trim();
      usuariosFiltrados = usuariosFiltrados.filter(usuario => 
        (usuario.calle || '').toLowerCase().includes(calle)
      );
    }
    
    // Filtro por número
    if (filterNumero.trim()) {
      const numero = filterNumero.toLowerCase().trim();
      usuariosFiltrados = usuariosFiltrados.filter(usuario => 
        (usuario.houseNumber || '').toLowerCase().includes(numero)
      );
    }
    
    return usuariosFiltrados;
  };

  const filtrarUsuariosPorTipo = (usuarios: Usuario[]) => {
    let usuariosFiltrados = usuarios;
    
    // Filtro por tipo de usuario
    if (filterTipoUsuario && filterTipoUsuario !== "todos") {
      if (filterTipoUsuario === "resident") {
        // Filtrar solo residentes
        usuariosFiltrados = usuariosFiltrados.filter(usuario => 
          usuario.role === 'resident'
        );
      } else if (filterTipoUsuario === "inquilino") {
        // Filtrar solo inquilinos (usuarios que NO son propietarios)
        usuariosFiltrados = usuariosFiltrados.filter(usuario => 
          !((usuario as any).isOwner === true || usuario.ownershipStatus === 'own')
        );
      }
    }
    
    return usuariosFiltrados;
  };

  // Usar useMemo para filtrar los usuarios por residencial
  const usuariosDelResidencial = useMemo(() => {
    if (codigoResidencialAdmin) {
      // Si es admin de residencial, filtrar por su residencial ID (usando el mapeo para ser consistentes)
      const idDocResidencialAdmin = Object.keys(mapeoResidenciales).find(key => mapeoResidenciales[key] === codigoResidencialAdmin);
      if (idDocResidencialAdmin) {
         return usuarios.filter(u => getResidencialIdFromUser(u) === codigoResidencialAdmin);
      }
      return []; // Si no se encuentra el residencial del admin, devolver lista vacía
    }
    
    // Si es admin global
    if (residencialSeleccionado === "todos") {
      return usuarios;
    }
    
    // IMPORTANTE: Si ya se filtró por residencial en cargarYActualizarUsuarios,
    // no aplicar filtro adicional aquí para evitar doble filtrado
    return usuarios;
  }, [usuarios, residencialSeleccionado, mapeoResidenciales, residencialIdDelAdmin]);

  // Usar useMemo para aplicar el filtro de búsqueda
  const usuariosBuscados = useMemo(() => {
    let usuarios = usuariosDelResidencial;
    
    // Aplicar filtro de búsqueda general
    if (searchTerm) {
      const termino = searchTerm.toLowerCase();
      usuarios = usuarios.filter(usuario => 
        usuario.fullName?.toLowerCase().includes(termino) ||
        usuario.paternalLastName?.toLowerCase().includes(termino) ||
        usuario.maternalLastName?.toLowerCase().includes(termino) ||
        usuario.email?.toLowerCase().includes(termino) ||
        usuario.telefono?.toLowerCase().includes(termino) ||
        (usuario.houseID && usuario.houseID.toLowerCase().includes(termino))
      );
    }
    
    // Aplicar filtros de dirección
    usuarios = filtrarUsuariosPorDireccion(usuarios);
    
    // Aplicar filtro por tipo de usuario
    usuarios = filtrarUsuariosPorTipo(usuarios);
    
    return usuarios;
  }, [usuariosDelResidencial, searchTerm, filterCalle, filterNumero, filterTipoUsuario, filtrarUsuariosPorDireccion, filtrarUsuariosPorTipo]);
  
  // Usar useMemo para calcular los usuarios filtrados por rol
  const residentes = useMemo(() => 
    filtrarUsuariosPorRol(usuariosBuscados, 'resident'),
    [usuariosBuscados]
  );
  
  const guardias = useMemo(() => 
    filtrarUsuariosPorRol(usuariosBuscados, 'security'),
    [usuariosBuscados]
  );
  
  const administradores = useMemo(() => {
    // Filtrar admins por rol y estado aprobado
    const adminsAprobados = filtrarUsuariosPorRol(usuariosBuscados, 'admin');
    // Excluir administradores globales de la lista y conteos
    return adminsAprobados.filter((u: any) => !u.isGlobalAdmin);
  }, [usuariosBuscados]);

  // Filtrar usuarios rechazados
  const usuariosRechazados = useMemo(() => {
    return usuariosBuscados.filter(u => u.status === 'rejected');
  }, [usuariosBuscados]);

  // Agrupación por casa (house view) - colocado después de usuariosDelResidencial
  type CasaResumen = {
    key: string;
    houseID?: string;
    calle?: string;
    houseNumber?: string;
    usuarios: Usuario[];
    total: number;
    aprobados: number;
    pendientes: number;
    morosos: number;
  };

  const casasResumen = useMemo<CasaResumen[]>(() => {
    if (!usuariosBuscados || usuariosBuscados.length === 0) return [];

    const sanitize = (s?: string) => (s || '')
      .toString()
      .replace(/[\u0000-\u001F\u007F-\u009F\u200B\u200C\u200D\uFEFF]/g, ''); // quita control chars/BOM/zero-width
    const normalize = (s?: string) => sanitize(s).trim().toUpperCase().replace(/\s+/g, ' ');
    const addrKey = (calle?: string, houseNumber?: string) => `ADDR::${normalize(calle)}#${normalize(houseNumber)}`;

    // Índices para detectar duplicados y para unificar address→key
    const hidIndex = new Map<string, string>();
    const addrIndex = new Map<string, string>();
    const dupLogs: { type: 'HID' | 'ADDR' | 'SAN'; hidNorm?: string; addrNorm?: string; existingKey?: string; newKey?: string; raw?: any }[] = [];

    // Solo residentes con referencia de casa
    const soloResidentes = usuariosBuscados.filter((u: any) => {
      const tieneCasa = u.houseID || u.houseId || u.houseNumber || u.calle;
      return u.role === 'resident' && !!tieneCasa;
    });

    const map = new Map<string, CasaResumen>();

    for (const u of soloResidentes) {
      const rawHid = ((u as any).houseID || (u as any).houseId || '').toString();
      const hidSanitized = sanitize(rawHid);
      if (rawHid && rawHid !== hidSanitized) {
        dupLogs.push({ type: 'SAN', raw: { rawHid, hidSanitized } });
      }
      const hidNorm = normalize(hidSanitized);
      const aKey = addrKey((u as any).calle, (u as any).houseNumber);

      // Elegir key preferente (HID si existe, sino dirección). Usamos valores normalizados para la key
      let chosenKey = hidNorm || aKey;

      // Si ya existe una key para esta dirección, forzar uso de esa para agrupar
      const addrExisting = addrIndex.get(aKey);
      if (addrExisting && addrExisting !== chosenKey) {
        dupLogs.push({ type: 'ADDR', addrNorm: aKey, existingKey: addrExisting, newKey: chosenKey, raw: { rawHid, calle: (u as any).calle, houseNumber: (u as any).houseNumber } });
        chosenKey = addrExisting;
      }

      // Registrar índices
      if (hidNorm) {
        const hidExisting = hidIndex.get(hidNorm);
        if (hidExisting && hidExisting !== chosenKey) {
          dupLogs.push({ type: 'HID', hidNorm, existingKey: hidExisting, newKey: chosenKey, raw: { rawHid } });
          // Preferimos el que ya esté usado
          chosenKey = hidExisting;
        } else if (!hidExisting) {
          hidIndex.set(hidNorm, chosenKey);
        }
      }
      if (!addrIndex.has(aKey)) addrIndex.set(aKey, chosenKey);

      if (!map.has(chosenKey)) {
        map.set(chosenKey, {
          key: chosenKey,
          houseID: hidSanitized || undefined,
          calle: (u as any).calle || undefined,
          houseNumber: (u as any).houseNumber || undefined,
          usuarios: [],
          total: 0,
          aprobados: 0,
          pendientes: 0,
          morosos: 0,
        });
      }
      const entry = map.get(chosenKey)!;
      entry.usuarios.push(u);
      entry.total += 1;
      if (u.status === 'approved') entry.aprobados += 1;
      if (u.status === 'pending') entry.pendientes += 1;
      if ((u as any).isMoroso) entry.morosos += 1;
    }

    // Logs de diagnóstico consolidados con throttling para evitar spam
    if (dupLogs.length > 0) {
      // Solo loggear una vez cada 3 segundos para evitar spam
      if (!(window as any).lastDupLogTime || Date.now() - (window as any).lastDupLogTime > 3000) {
        console.groupCollapsed(`[HouseView] Duplicados/Sanitización detectados (${dupLogs.length})`);
        dupLogs.slice(0, 5).forEach((d, i) => { // Solo mostrar los primeros 5
          if (d.type === 'HID') {
            console.warn(`#${i + 1} [HID] Mismo HID normalizado apuntaba a distintas keys`, d);
          } else if (d.type === 'ADDR') {
            console.warn(`#${i + 1} [ADDR] Misma dirección normalizada apuntaba a distintas keys`, d);
          } else {
            console.info(`#${i + 1} [SAN] HID contenía caracteres invisibles y fue saneado`, d);
          }
        });
        if (dupLogs.length > 5) {
          console.info(`... y ${dupLogs.length - 5} duplicados más (total: ${dupLogs.length})`);
        }
        console.groupEnd();
        (window as any).lastDupLogTime = Date.now();
      }
    }

    const result = Array.from(map.values()).sort((a, b) => (a.calle || '').localeCompare(b.calle || '') || (a.houseNumber || '').localeCompare(b.houseNumber || '') || (a.houseID || '').localeCompare(b.houseID || ''));
    
    // Solo loggear el resumen una vez cada 5 segundos para evitar spam
    if (!(window as any).lastSummaryLogTime || Date.now() - (window as any).lastSummaryLogTime > 5000) {
      console.debug('[HouseView] Resumen de casas agrupadas:', result.slice(0, 3).map(r => ({ key: r.key, houseID: r.houseID, calle: r.calle, houseNumber: r.houseNumber, total: r.total })));
      if (result.length > 3) {
        console.debug(`[HouseView] ... y ${result.length - 3} casas más (total: ${result.length})`);
      }
      (window as any).lastSummaryLogTime = Date.now();
    }
    
    return result;
  }, [usuariosBuscados]);

  // Función para manejar el cambio de estado moroso de usuarios individuales
  const handleCambiarEstadoMorosoIndividual = useCallback((usuarioId: string, nuevoEstado: boolean) => {
    console.log('🔄 Actualizando estado local para usuario individual:', { usuarioId, nuevoEstado });
    
    setUsuarios(prevUsuarios => 
      prevUsuarios.map(usuario => {
        const userId = usuario.id || usuario.uid;
        if (userId === usuarioId) {
          return { ...usuario, isMoroso: nuevoEstado } as Usuario;
        }
        return usuario;
      })
    );
  }, []);

  const handleMarcarCasaMorosa = async (casa: CasaResumen, value: boolean) => {
    try {
      console.log('🔍 [handleMarcarCasaMorosa] Iniciando proceso para casa:', casa);
      console.log('🔍 [handleMarcarCasaMorosa] Valor a aplicar (isMoroso):', value);
      console.log('🔍 [handleMarcarCasaMorosa] Usuarios en la casa:', casa.usuarios.length);
      
      // OPTIMIZACIÓN: Usar directamente los usuarios que ya tenemos en la casa
      // en lugar de buscarlos nuevamente en Firestore
      if (casa.usuarios.length === 0) {
        sonnerToast.error('No hay usuarios en esta casa para actualizar');
        return;
      }

      console.log('🔍 [handleMarcarCasaMorosa] IDs de usuarios a actualizar:', casa.usuarios.map(u => ({ id: u.id || u.uid, email: u.email })));
      
      let updated = 0;
      const errores: string[] = [];

      const usuariosActualizados: string[] = [];
      
      for (const usuario of casa.usuarios) {
        try {
          const userId = usuario.id || usuario.uid;
          if (!userId) {
            console.error('🔍 [handleMarcarCasaMorosa] Usuario sin ID:', usuario.email);
            errores.push(`Usuario ${usuario.email || 'sin email'} no tiene ID válido`);
            continue;
          }

          console.log(`🔍 [handleMarcarCasaMorosa] Actualizando usuario ${userId} (${usuario.email})`);
          await cambiarEstadoMoroso(userId, value);
          updated++;
          usuariosActualizados.push(userId);
          console.log(`✅ Usuario ${usuario.email} actualizado exitosamente`);
        } catch (error: any) {
          console.error(`❌ Error actualizando usuario ${usuario.email}:`, error);
          errores.push(`Error en ${usuario.email}: ${error.message}`);
        }
      }
      
      console.log('🔍 [handleMarcarCasaMorosa] Total usuarios actualizados:', updated);
      
      // ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE para evitar esperar la recarga
      if (usuariosActualizados.length > 0) {
        setUsuarios(prevUsuarios => 
          prevUsuarios.map(usuario => {
            const userId = usuario.id || usuario.uid;
            if (userId && usuariosActualizados.includes(userId)) {
              // Actualizar el estado isMoroso en el usuario
              return { ...usuario, isMoroso: value } as Usuario;
            }
            return usuario;
          })
        );
        
        console.log('🔄 Estado local actualizado inmediatamente para', usuariosActualizados.length, 'usuarios');
      }
      
      // Mostrar resultado
      if (updated > 0) {
        setTimeout(() => {
          sonnerToast.success(`${value ? 'Marcadas' : 'Desmarcadas'} ${updated} cuentas de la casa`);
        }, 0);
      }

      if (errores.length > 0) {
        setTimeout(() => {
          sonnerToast.error(`Errores en ${errores.length} usuarios: ${errores.slice(0, 2).join(', ')}${errores.length > 2 ? '...' : ''}`);
        }, 100);
      }
      
      if (updated === 0 && errores.length === 0) {
        setTimeout(() => {
          sonnerToast.error('No se pudieron actualizar usuarios');
        }, 0);
      }
    } catch (e: any) {
      console.error('Error cambiando morosidad por casa:', e);
      setTimeout(() => {
        sonnerToast.error(e?.message || 'Error al actualizar morosidad por casa');
      }, 0);
    }
  };

  // =================================================================================
  // REFACTORIZACIÓN: Lógica de selección de lista y paginación
  // =================================================================================

  // 1. Determinar la lista de usuarios activa según la pestaña
  const listaActiva = useMemo(() => {
    switch (activeTab) {
      case "residentes":
        return residentes;
      case "seguridad":
        return guardias;
      case "administradores":
        return administradores;
      case "pendientes":
        // Aplicar búsqueda también a los pendientes
        return filtrarUsuariosPorBusqueda(usuariosPendientes);
      case "rechazados":
        return usuariosRechazados;
      default:
        // Por defecto, mostrar residentes para evitar listas vacías inesperadas
        return residentes;
    }
  }, [activeTab, residentes, guardias, administradores, usuariosPendientes, searchTerm, filtrarUsuariosPorBusqueda]);

  // 2. Aplicar paginación a la lista activa
  const totalItems = listaActiva.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = useMemo(() => 
    listaActiva.slice(indexOfFirstItem, indexOfLastItem),
    [listaActiva, currentPage, itemsPerPage]
  );

  // =================================================================================
  // ESTADÍSTICAS DEL RESIDENCIAL
  // =================================================================================
  
  // Calcular estadísticas del residencial (unificando houseID con sanitización y dirección)
  const estadisticasResidencial = useMemo(() => {
    if (!usuariosDelResidencial.length) return null;

    const sanitize = (s?: string) => (s || '')
      .toString()
      .replace(/[\u0000-\u001F\u007F-\u009F\u200B\u200C\u200D\uFEFF]/g, '');
    const normalize = (s?: string) => sanitize(s).trim().toUpperCase().replace(/\s+/g, ' ');
    const addrKey = (calle?: string, houseNumber?: string) => `ADDR::${normalize(calle)}#${normalize(houseNumber)}`;

    const casasUnicas = new Set<string>();
    const casasConMorosos = new Set<string>();
    const hidIndex = new Map<string, string>();
    const addrIndex = new Map<string, string>();

    for (const usuario of usuariosDelResidencial) {
      // Solo considerar residentes con referencia de casa
      const tieneCasa = (usuario as any).houseID || (usuario as any).houseId || usuario.houseNumber || usuario.calle;
      if (usuario.role !== 'resident' || !tieneCasa) continue;

      const rawHid = ((usuario as any).houseID || (usuario as any).houseId || '').toString();
      const hidNorm = normalize(rawHid);
      const aKey = addrKey(usuario.calle, usuario.houseNumber);

      // Elegir key preferente
      let chosenKey = hidNorm || aKey;

      // Si ya existe una key asociada a esa dirección, usarla para agrupar
      const addrExisting = addrIndex.get(aKey);
      if (addrExisting && addrExisting !== chosenKey) {
        chosenKey = addrExisting;
      }

      // Registrar índices para mantener consistencia
      if (hidNorm) {
        const hidExisting = hidIndex.get(hidNorm);
        if (hidExisting && hidExisting !== chosenKey) {
          chosenKey = hidExisting;
        } else if (!hidExisting) {
          hidIndex.set(hidNorm, chosenKey);
        }
      }
      if (!addrIndex.has(aKey)) addrIndex.set(aKey, chosenKey);

      casasUnicas.add(chosenKey);
      if (usuario.isMoroso === true) casasConMorosos.add(chosenKey);
    }

    const totalCasas = casasUnicas.size;
    const casasMorosas = casasConMorosos.size;
    const porcentajeMorosidad = totalCasas > 0 ? Math.round((casasMorosas / totalCasas) * 100) : 0;

    return {
      totalCasas,
      casasMorosas,
      porcentajeMorosidad,
      casasAlDia: totalCasas - casasMorosas
    };
  }, [usuariosDelResidencial]);

  // Debug: Verificar que la paginación funcione correctamente
  useEffect(() => {
    console.log('🔍 DEBUG PAGINACIÓN PRINCIPAL:', {
      totalItems,
      itemsPerPage,
      totalPages,
      currentPage,
      indexOfFirstItem,
      indexOfLastItem,
      currentUsersLength: currentUsers.length,
      listaActivaLength: listaActiva.length,
      usuariosDelResidencialLength: usuariosDelResidencial.length,
      usuariosBuscadosLength: usuariosBuscados.length,
      residentesLength: residentes.length,
      guardiasLength: guardias.length,
      administradoresLength: administradores.length,
      usuariosPendientesLength: usuariosPendientes.length,
      usuariosRechazadosLength: usuariosRechazados.length,
      activeTab
    });
  }, [totalItems, itemsPerPage, totalPages, currentPage, indexOfFirstItem, indexOfLastItem, currentUsers.length, listaActiva.length, usuariosDelResidencial.length, usuariosBuscados.length, residentes.length, guardias.length, administradores.length, usuariosPendientes.length, usuariosRechazados.length, activeTab]);

  // Usar useMemo para determinar qué lista de usuarios mostrar según la pestaña activa
  const usuariosFiltrados = useMemo(() => {
    if (activeTab === "residentes") {
      return residentes;
    } else if (activeTab === "seguridad") {
      return guardias;
    } else if (activeTab === "administradores") {
      return administradores;
    } else if (activeTab === "pendientes") {
      return usuariosPendientes;
    } else if (activeTab === "rechazados") {
      return usuariosRechazados;
    }
    return [];
  }, [activeTab, residentes, guardias, administradores, usuariosBuscados, usuariosPendientes]);

  const getEstadoBadge = (estado: Usuario['status']) => {
    switch (estado) {
      case "approved":
        return <Badge variant="success">Activo</Badge>;
      case "pending":
        return <Badge variant="warning">Pendiente</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rechazado</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactivo</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getRolBadge = (rol: Usuario['role']) => {
    switch (rol) {
      case "admin":
        return <Badge variant="secondary">Administrador</Badge>;
      case "resident":
        return <Badge variant="outline">Residente</Badge>;
      case "security":
        return <Badge variant="outline">Guardia</Badge>;
      default:
        return <Badge variant="outline">{rol}</Badge>;
    }
  };

  const getResidencialNombre = (id: string) => {
    if (!id) return "No asignado";
    
    // Buscar primero por ID directo
    const porIdDirecto = residenciales.find(r => r.id === id);
    if (porIdDirecto) return porIdDirecto.nombre;
    
    // Buscar por residencialID
    const porResidencialID = residenciales.find(r => r.residencialID === id);
    if (porResidencialID) return porResidencialID.nombre;
    
    // Buscar en el mapeo inverso
    for (const [docId, residencialID] of Object.entries(mapeoResidenciales)) {
      if (residencialID === id) {
        const residencial = residenciales.find((r): r is Residencial => r.id === docId);
        if (residencial) return residencial.nombre;
      }
    }
    
    // Último intento: búsqueda insensible a mayúsculas/minúsculas
    const residencialCaseInsensitive = residenciales.find((r): r is Residencial => 
      (!!r.residencialID && r.residencialID.toLowerCase() === id.toLowerCase()) || 
      (!!r.id && r.id.toLowerCase() === id.toLowerCase())
    );
    
    if (residencialCaseInsensitive) return residencialCaseInsensitive.nombre;
    
    console.log(`⚠️ No se encontró nombre para residencial ID: ${id}`);
    return "Residencial ID: " + id.substring(0, 6) + "...";
  };

  const mostrarDocumento = async (ruta: string, nombre: string) => {
    try {
      // Logs detallados al inicio de la función
      const currentUser = user as any; // user viene de useAuth() y tiene uid/email
      console.log(
        '[DEBUG] Iniciando mostrarDocumento - Datos del solicitante y archivo:',
        {
          solicitanteUID: currentUser?.uid,
          solicitanteEmail: currentUser?.email,
          rutaArchivo: ruta,
          nombreArchivo: nombre,
        }
      );

      setIsLoadingDocument(true);
      setDocumentoSeleccionado(ruta);
      setDocumentoNombre(nombre);
      
      if (!ruta || ruta.trim() === '') {
        console.error('❌ Ruta del documento inválida');
        sonnerToast.error(`La ruta del documento ${nombre} no es válida`);
        setDocumentoSeleccionado(null);
        return;
      }
      
      console.log('[DEBUG] Antes de llamar a documentExists. Ruta:', ruta);
      const resultado = await documentExistsSimplificado(ruta);
      console.log('[DEBUG] Después de llamar a documentExists. Resultado:', resultado);
      
      if (!resultado.existe) {
        console.error('❌ Documento no encontrado o sin permisos:', ruta);
        sonnerToast.error(`No es posible acceder al documento "${nombre}". Verifica que tengas permisos de administrador para el residencial correspondiente.`);
        setDocumentoSeleccionado(null);
        return;
      }
      
      // Si documentExists ya devolvió la URL, usamos esa directamente
      if (resultado.url) {
        console.log('📥 URL obtenida directamente del verificador');
        setDocumentoURL(resultado.url);
        sonnerToast.success(`Documento ${nombre} cargado correctamente`);
        return;
      }
      
      // Si no tenemos URL, intentamos obtenerla con getDocumentURL como fallback
      console.log('[DEBUG] Antes de llamar a getDocumentURL. Ruta:', ruta);
      const url = await getDocumentURLSimplificado(ruta);
      console.log('[DEBUG] Después de llamar a getDocumentURL. URL obtenida:', url ? 'URL Presente' : 'URL Ausente');
      
      if (!url) {
        console.error('❌ No se pudo obtener la URL del documento');
        sonnerToast.error(`No se pudo obtener la URL del documento ${nombre}`);
        setDocumentoSeleccionado(null);
        return;
      }
      
      setDocumentoURL(url);
      sonnerToast.success(`Documento ${nombre} cargado correctamente`);
    } catch (error) {
      console.error('❌ Error al cargar documento:', {
        error,
        errorCode: (error as any)?.code,
        errorMessage: (error as Error).message
      });
      
      const errorCode = (error as any)?.code;
      const errorMessage = (error as Error).message || '';
      
      if (errorCode === 'storage/unauthorized' || errorMessage.includes('No tienes permiso')) {
        console.error('🚫 Error de permisos:', {
          userEmail: user?.email,
          userRole: (user as any)?.role,
          documentPath: ruta
        });
        
        sonnerToast.error(`No tienes permisos para acceder al documento ${nombre}`, {
          description: "Debes ser administrador del residencial o propietario del documento",
          duration: 5000
        });
      } else if (errorCode === 'storage/object-not-found') {
        sonnerToast.error(`El documento ${nombre} no existe en el servidor`);
      } else if (errorCode === 'storage/invalid-argument') {
        sonnerToast.error(`La ruta del documento ${nombre} no es válida`);
      } else if (errorMessage.includes('Usuario no autenticado')) {
        sonnerToast.error(`Debes iniciar sesión para acceder a este documento`, {
          description: "Tu sesión puede haber expirado. Intenta recargar la página.",
          duration: 5000
        });
      } else {
        sonnerToast.error(`Error al cargar el documento ${nombre}: ${errorMessage || 'Error desconocido'}`);
      }
      
      setDocumentoSeleccionado(null);
    } finally {
      setIsLoadingDocument(false);
    }
  };
  
  const cerrarModal = () => {
    setDocumentoSeleccionado(null);
    setDocumentoURL(null);
    setShowDetallesUsuarioDialog(false);
    setTimeout(() => {
      setUsuarioSeleccionado(null);
    }, 300);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNuevoUsuarioForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "role" && value === "security") {
      // Solo cambiar el rol, sin asignar email predeterminado
      setNuevoUsuarioForm({
        ...nuevoUsuarioForm,
        [name]: value,
        // No preestablecemos el email para permitir que el usuario ingrese su propio valor
      });
    } else if (name === "residencialID") {
      // Cuando se cambia el residencial, cargar las calles disponibles
      cargarCallesDelResidencial(value);
      
      setNuevoUsuarioForm({
        ...nuevoUsuarioForm,
        [name]: value,
        // Reiniciar la calle seleccionada
        calle: ""
      });
    } else {
      setNuevoUsuarioForm({
        ...nuevoUsuarioForm,
        [name]: value
      });
    }
  };

  const handleCrearUsuario = async (): Promise<void> => {
    setCreandoUsuario(true);
    
    try {
      // Validaciones del formulario
      const formToValidate = { ...nuevoUsuarioForm };
      if (!formToValidate.fullName && formToValidate.role !== 'security') {
        sonnerToast.error('El nombre es obligatorio');
        setCreandoUsuario(false);
        return;
      }
      
      if (!formToValidate.email) {
        sonnerToast.error('El correo electrónico es obligatorio');
        setCreandoUsuario(false);
        return;
      }
      
      if (!formToValidate.residencialID) {
        sonnerToast.error('Debe seleccionar un residencial');
        setCreandoUsuario(false);
        return;
      }
      
      if (!formToValidate.password) {
        sonnerToast.error('La contraseña es obligatoria');
        setCreandoUsuario(false);
        return;
      }
      
      try {
        // Obtener el residencialID correcto del documento de residencial
        let correctResidencialID = formToValidate.residencialID;
        
        try {
          // Intentar obtener el documento del residencial para extraer el residencialID correcto
          const residencialDoc = await getDoc(doc(db, 'residenciales', formToValidate.residencialID));
          
          if (residencialDoc.exists() && residencialDoc.data().residencialID) {
            correctResidencialID = residencialDoc.data().residencialID;
            console.log(`📌 Usando residencialID correcto: ${correctResidencialID}`);
          } else {
            console.warn('⚠️ No se pudo obtener el residencialID correcto, usando el ID del documento');
          }
        } catch (error) {
          console.error('Error al obtener residencialID:', error);
        }
        
        // SOLUCIÓN: Crear una instancia de Firebase completamente independiente
        // Esto evita completamente que se interfiera con la sesión del administrador
        
        // Convertir el rol a UserRole enum
        let userRole: UserRole;
        switch (formToValidate.role) {
          case 'admin':
            userRole = UserRole.Admin;
            break;
          case 'security':
            userRole = UserRole.Guard;
            break;
          case 'resident':
          default:
            userRole = UserRole.Resident;
            break;
        }

        // Usar Firebase Functions para crear el usuario de forma segura
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        
        const functions = getFunctions(undefined, 'us-central1'); // Especificar la región
        
        // Elegir la función correcta según el tipo de usuario
        const functionName = formToValidate.role === 'resident' ? 'createResidentUser' : 'createSecurityUser';
        const createUserFunction = httpsCallable(functions, functionName);
        
        console.log(`🔥 Llamando a Firebase Function ${functionName} con datos:`, {
          email: formToValidate.email,
          role: formToValidate.role,
          residencialId: correctResidencialID
        });
        
        // Preparar datos específicos según el tipo de usuario
        const userData: any = {
          email: formToValidate.email,
          password: formToValidate.password,
          fullName: formToValidate.role === 'security' ? 'Caseta de Seguridad' : formToValidate.fullName,
          paternalLastName: formToValidate.paternalLastName || '',
          maternalLastName: formToValidate.maternalLastName || '',
          role: formToValidate.role,
          residencialId: correctResidencialID,
          residencialDocId: formToValidate.residencialID,
          houseNumber: formToValidate.houseNumber || '0'
        };

        // Agregar campos específicos para residentes
        if (formToValidate.role === 'resident') {
          userData.street = formToValidate.calle || '';
          userData.houseId = formToValidate.houseID || generarHouseID();
        }
        
        const result = await createUserFunction(userData);
        
        console.log('🎉 Resultado de Firebase Function:', result);
        
        const resultData = result.data as { success: boolean; uid: string; message: string };
        
        console.log('✅ Usuario creado exitosamente:', resultData.uid);
        sonnerToast.success('Usuario creado exitosamente en Authentication y Firestore');
        
        // Resetear el formulario y cerrar el modal
        resetFormularioUsuario();
        setShowNuevoUsuarioDialog(false);
        
        // Recargar la lista de usuarios
        await cargarYActualizarUsuarios(residencialSeleccionado);
        
      } catch (authError: any) {
        console.error('Error al crear usuario:', authError);
        
        // Errores específicos de Firebase Auth
        if (authError.code === 'auth/email-already-in-use') {
          sonnerToast.error('El correo electrónico ya está en uso');
        } else if (authError.code === 'auth/invalid-email') {
          sonnerToast.error('El correo electrónico no es válido');
        } else if (authError.code === 'auth/weak-password') {
          sonnerToast.error('La contraseña es muy débil');
        } else if (authError.code === 'auth/api-key-not-valid') {
          sonnerToast.error('Error de configuración: La clave API de Firebase no es válida');
        } else {
          sonnerToast.error(`Error al crear usuario: ${authError.message}`);
        }
      }
    } catch (error) {
      console.error('Error general al crear usuario:', error);
      sonnerToast.error('Error al crear usuario');
    } finally {
      setCreandoUsuario(false);
    }
  };

  const resetFormularioUsuario = () => {
    setNuevoUsuarioForm({
      fullName: "",
      paternalLastName: "",
      maternalLastName: "",
      email: "",
      telefono: "",
      role: "resident",
      residencialID: residencialSeleccionado !== "todos" ? residencialSeleccionado : "",
      houseID: "",
      calle: "",
      houseNumber: "",
      password: ""
    });
  };
  
  // Función para generar el houseID automáticamente (4 caracteres alfanuméricos)
  const generarHouseID = (): string => {
    const caracteres = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let houseID = '';
    for (let i = 0; i < 4; i++) {
      houseID += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    console.log('🏠 House ID generado:', houseID);
    return houseID;
  };

  // Búsqueda optimizada con debounce
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTypingSearchTerm(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Limpiar recursos
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Función para renderizar la paginación
  const renderPagination = () => {
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-4">
          {/* Selector de elementos por página */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Mostrar:</span>
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={(value) => {
                console.log('Cambiando itemsPerPage de', itemsPerPage, 'a', value);
                setItemsPerPage(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">por página</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)} de {totalItems} usuarios
          </div>
        </div>

        {/* Paginación solo si hay más de una página */}
        {totalItems > itemsPerPage && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {getPageNumbers().map(number => (
                <PaginationItem key={number}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(number);
                    }}
                    isActive={currentPage === number}
                  >
                    {number}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    );
  };

  // Función para generar números de página
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Número máximo de páginas visibles
    
    if (totalPages <= maxVisible) {
      // Mostrar todas las páginas si son menos del máximo
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas relevantes alrededor de la actual
      let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let endPage = startPage + maxVisible - 1;
      
      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxVisible + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // Función para manejar la eliminación de usuarios
  const handleEliminarUsuario = async (usuario: Usuario) => {
    // Verificar si hay un ID válido
    if (!usuario.id) {
      // Es seguro mostrar un toast aquí porque estamos en un evento de usuario
      sonnerToast.error("No se puede eliminar el usuario: ID no válido");
      return;
    }
    
    // Mostrar diálogo de confirmación
    setUsuarioAEliminar(usuario);
  };
  
  // SOLUCIÓN FINAL: Un enfoque controlado manual para evitar congelamiento
  const confirmarEliminarUsuario = useCallback(() => {
    // Verificar que tenemos un usuario válido para eliminar
    if (!usuarioAEliminar || !usuarioAEliminar.id) {
      console.error("⚠️ No hay usuario válido para eliminar");
      return;
    }
    
    // Guardar datos importantes para uso posterior
    const userId = usuarioAEliminar.id;
    const userName = usuarioAEliminar.fullName || "Usuario";
    const esPendiente = usuarioAEliminar.status === 'pending';
    
    // Cerrar el diálogo inmediatamente
    setUsuarioAEliminar(null);
    
    // Mostrar toast de carga (sin referencias para evitar problemas)
    const toastId = sonnerToast.loading(`Eliminando usuario...`);
    
    // Activar estado de eliminación
    setEliminandoUsuario(true);
    
    // Eliminar usuario simplificado
    eliminarUsuario(userId)
      .then(() => {
        // Usar setTimeout para evitar problemas de renderizado
        setTimeout(() => {
          // Actualizar estado de forma sencilla, sin getUsuarios
          setUsuarios(prev => prev.filter(u => u.id !== userId));
          if (esPendiente) {
            setUsuariosPendientes(prev => prev.filter(u => u.id !== userId));
          }
          
          // Cerrar toast y mostrar confirmación
          sonnerToast.dismiss(toastId);
          sonnerToast.success(`Usuario ${userName} eliminado correctamente`);
        }, 300);
      })
      .catch(error => {
        console.error(`❌ Error eliminando usuario:`, error);
        sonnerToast.dismiss(toastId);
        sonnerToast.error(`Error al eliminar usuario: ${error.message || "Error desconocido"}`);
      })
      .finally(() => {
        setTimeout(() => setEliminandoUsuario(false), 300);
      });
  }, [usuarioAEliminar]);

  // Función para manejar eliminación múltiple
  const handleEliminarMultiplesUsuarios = useCallback(async (usuariosAEliminar: Usuario[]) => {
    if (usuariosAEliminar.length === 0) {
      return;
    }

    const toastId = sonnerToast.loading(`Eliminando ${usuariosAEliminar.length} usuarios...`);
    setEliminandoUsuario(true);

    try {
      // Eliminar usuarios en paralelo para mejor rendimiento
      const promesasEliminacion = usuariosAEliminar.map(async (usuario) => {
        if (!usuario.id) throw new Error(`Usuario sin ID válido: ${usuario.fullName}`);
        return await eliminarUsuario(usuario.id);
      });

      await Promise.all(promesasEliminacion);

      // Actualizar estado local removiendo los usuarios eliminados
      const idsEliminados = new Set(usuariosAEliminar.map(u => u.id).filter(Boolean));
      
      setTimeout(() => {
        setUsuarios(prev => prev.filter(u => !u.id || !idsEliminados.has(u.id)));
        setUsuariosPendientes(prev => prev.filter(u => !u.id || !idsEliminados.has(u.id)));
        
        sonnerToast.dismiss(toastId);
        sonnerToast.success(`${usuariosAEliminar.length} usuarios eliminados correctamente`);
      }, 300);

    } catch (error) {
      console.error('❌ Error eliminando usuarios múltiples:', error);
      sonnerToast.dismiss(toastId);
      sonnerToast.error(`Error al eliminar usuarios: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setTimeout(() => setEliminandoUsuario(false), 300);
    }
  }, []);

  // Función para manejar la vista de detalles
  const handleVerDetallesUsuario = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setShowDetallesUsuarioDialog(true);
  };



  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h2>
          <p className="text-muted-foreground">
            Administra los usuarios por residencial
            <span className="text-xs block mt-1 flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1 inline" />
              Última actualización: {lastUpdate.toLocaleTimeString()}
              {actualizacionEnTiempoReal && (
                <span className="flex items-center ml-2 text-green-500">
                  <RefreshCw className="h-3.5 w-3.5 mr-1 animate-pulse" />
                  En tiempo real
                </span>
              )}
            </span>
          </p>
          

        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {!esAdminDeResidencial && (
          <div className="flex flex-col w-[250px]">
            <Select
              value={residencialSeleccionado}
              onValueChange={(value) => {
                if (!esAdminDeResidencial) {
                  setResidencialSeleccionado(value);
                  cargarYActualizarUsuarios(value); // Cargar usuarios para el nuevo residencial
                  if (value !== "todos") {
                    cargarCallesDelResidencial(value);
                  }
                } else {
                  sonnerToast.info("Solo puedes ver usuarios de tu residencial asignado.");
                }
              }}
              disabled={!!esAdminDeResidencial}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar residencial" />
              </SelectTrigger>
              <SelectContent>
                {(!esAdminDeResidencial || userClaims?.isGlobalAdmin) && (
                <SelectItem value="todos">Todos los residenciales</SelectItem>
                )}
                {residenciales
                  .filter(residencial => !!residencial.id)
                  .filter(residencial => !esAdminDeResidencial || (residencial.residencialID === codigoResidencialAdmin) || (mapeoResidenciales[residencial.id!] === codigoResidencialAdmin) )
                  .map((residencial) => (
                    <SelectItem key={residencial.id} value={residencial.id!.toString()}>
                      {residencial.nombre}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
                Selecciona un residencial para filtrar usuarios.
            </p>
            
            {/* 🆕 NUEVO: Botón discreto para restricciones globales */}
            {!esAdminDeResidencial && residencialSeleccionado !== "todos" && userClaims?.isGlobalAdmin && (
              <div className="mt-2">
                <GlobalScreenRestrictionsConfig
                  residencial={(residenciales.find(r => r.id === residencialSeleccionado) as any) || ({
                    id: residencialSeleccionado,
                    nombre: getResidencialNombre(residencialSeleccionado),
                    direccion: '',
                    ciudad: '',
                    estado: '',
                    codigoPostal: '',
                    cuotaMantenimiento: 0
                  } as any)}
                  onUpdate={() => {
                    console.log('Restricciones globales actualizadas');
                  }}
                />
              </div>
            )}
            
            {/* 🆕 BOTÓN PARA RECARGAR TODOS LOS USUARIOS */}
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🔄 Recargando TODOS los usuarios...');
                  cargarYActualizarUsuarios(residencialSeleccionado);
                }}
                disabled={isLoading}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Recargando...' : 'Recargar usuarios'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Fuerza una recarga completa
              </p>
            </div>
          </div>
          )}

          {/* Selector de calle */}
          <div className="flex flex-col w-[200px]">
            <Select 
              value={filterCalle || "todas"} 
              onValueChange={(value) => setFilterCalle(value === "todas" ? "" : value)}
              disabled={callesDisponibles.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las calles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las calles</SelectItem>
                {callesDisponibles.map(calle => (
                  <SelectItem key={calle} value={calle}>{calle}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Filtrar por calle
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-[350px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre, email, teléfono..."
              className="pl-8 w-full"
              value={typingSearchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowNuevoUsuarioDialog(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Añadir Usuario
            </Button>
          </div>
        </div>
      </div>

      {/* Filtro por tipo de usuario */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtro por Tipo de Usuario
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="filter-tipo-usuario" className="text-sm font-medium">
              Tipo de Usuario:
            </Label>
            <Select 
              value={filterTipoUsuario} 
              onValueChange={setFilterTipoUsuario}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los usuarios</SelectItem>
                <SelectItem value="resident">Residentes</SelectItem>
                <SelectItem value="inquilino">Inquilinos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterTipoUsuario("todos")}
          >
            Limpiar Filtro
          </Button>
        </div>
      </div>

      {/* Estadísticas del Residencial - Solo mostrar cuando se selecciona un residencial específico */}
      {estadisticasResidencial && residencialSeleccionado !== "todos" && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3">
            <Building className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Estadísticas del Residencial: {residenciales.find(r => r.id === residencialSeleccionado)?.nombre || 'Seleccionado'}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total de Casas */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Casas</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-blue-600">
                {estadisticasResidencial.totalCasas}
              </div>
            </div>

            {/* Casas con Morosos */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-red-200 dark:border-red-700">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Casas con Morosos</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-red-600">
                {estadisticasResidencial.casasMorosas}
              </div>
            </div>

            {/* Casas al Día */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Casas al Día</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-green-600">
                {estadisticasResidencial.casasAlDia}
              </div>
            </div>

            {/* Porcentaje de Morosidad */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-orange-200 dark:border-orange-700">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">% Morosidad</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-orange-600">
                {estadisticasResidencial.porcentajeMorosidad}%
              </div>
              
              {/* Barra de progreso visual */}
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    estadisticasResidencial.porcentajeMorosidad >= 50 ? 'bg-red-500' : 
                    estadisticasResidencial.porcentajeMorosidad >= 25 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${estadisticasResidencial.porcentajeMorosidad}%` }}
                />
              </div>
              
              {/* Indicador de estado */}
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {estadisticasResidencial.porcentajeMorosidad === 0 ? 'Excelente' :
                 estadisticasResidencial.porcentajeMorosidad <= 10 ? 'Bueno' :
                 estadisticasResidencial.porcentajeMorosidad <= 25 ? 'Atención' :
                 estadisticasResidencial.porcentajeMorosidad <= 50 ? 'Crítico' : 'Muy Crítico'}
              </div>
            </div>
          </div>

          {/* Explicación de la lógica */}
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">Nota:</span> El porcentaje de morosidad se calcula por casa (houseID). 
            Si al menos un usuario de una casa está marcado como moroso, esa casa cuenta como "morosa" en el porcentaje.
          </div>
        </div>
      )}

      {/* Resumen cuando se seleccionan todos los residenciales */}
      {residencialSeleccionado === "todos" && (
        <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950 dark:to-slate-950 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <Building className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Vista General - Todos los Residenciales
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Usuarios</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-blue-600">
                {usuariosDelResidencial.length}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Residenciales</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-600">
                {residenciales.length}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Información</span>
              </div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Selecciona un residencial específico para ver estadísticas detalladas de morosidad por casa.
              </div>
            </div>
          </div>
        </div>
      )}



      <div className="border-b">
        <Tabs defaultValue="residentes" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="residentes" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span>Residentes</span>
              <Badge variant="secondary" className="ml-1 h-5">
                {residentes.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="seguridad" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Seguridad</span>
              <Badge variant="secondary" className="ml-1 h-5">
                {guardias.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="administradores" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              <span>Admins</span>
              <Badge variant="secondary" className="ml-1 h-5">
                {administradores.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pendientes" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Pendientes</span>
              <Badge variant="secondary" className="ml-1 h-5 text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-300">
                {usuariosPendientes.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="rechazados" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              <span>Rechazados</span>
              <Badge variant="secondary" className="ml-1 h-5 text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300">
                {usuariosRechazados.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="residentes">
            {/* Toggle vista casa/usuarios */}
            <div className="mb-2 flex items-center gap-2">
              <Button variant={houseView ? 'outline' : 'default'} size="sm" onClick={() => setHouseView(false)}>Usuarios</Button>
              <Button variant={houseView ? 'default' : 'outline'} size="sm" onClick={() => setHouseView(true)}>Vista por casa</Button>
            </div>
            {!houseView ? (
              <Suspense fallback={<TableSkeleton />}>
                <ContenidoPestanaResidentes
                  usuarios={currentUsers}
                  titulo={getTituloTabla("residentes")}
                  isLoading={isLoading}
                  onVerDetalles={handleVerDetallesUsuario}
                  onEditarUsuario={handleEditarUsuario}
                  onEliminarUsuario={handleEliminarUsuario}
                  onEliminarMultiplesUsuarios={handleEliminarMultiplesUsuarios}
                  actualizacionEnTiempoReal={actualizacionEnTiempoReal}
                  getRolBadge={getRolBadge}
                  getResidencialNombre={getResidencialNombre}
                  getEstadoBadge={getEstadoBadge}
                  renderPagination={renderPagination}
                  filterCalle={filterCalle}
                  onFilterCalleChange={setFilterCalle}
                  onCambiarEstadoMoroso={handleCambiarEstadoMorosoIndividual}
                  totalUsuarios={listaActiva.length}
                />
              </Suspense>
            ) : (
              <div className="rounded-md border">
                <Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-[60px] text-center">#</TableHead>
							<TableHead>Casa</TableHead>
							<TableHead>HouseID</TableHead>
							<TableHead className="w-[120px]">Usuarios</TableHead>
							<TableHead className="w-[180px]">Moroso</TableHead>
						</TableRow>
					</TableHeader>
                  <TableBody>
						{casasResumen.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay casas para mostrar</TableCell>
							</TableRow>
						) : (
							casasResumen.map((casa, index) => (
								<TableRow key={casa.key}>
									<TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
									<TableCell>
                            {(casa.calle || casa.houseNumber) ? (
                              <div className="text-sm font-medium">{casa.calle || 'Calle s/d'} {casa.houseNumber || ''}</div>
                            ) : (
                              <div className="text-sm text-muted-foreground">Sin calle/número</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-muted-foreground">{casa.houseID || '—'}</div>
                          </TableCell>
                          <TableCell>{casa.total}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${casa.morosos > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                              <Switch
                                checked={casa.morosos > 0}
                                onCheckedChange={(checked) => handleMarcarCasaMorosa(casa, checked as boolean)}
                                aria-label={`Cambiar estado de morosidad para la casa ${casa.calle || ''} ${casa.houseNumber || ''}`}
                                className={`${casa.morosos > 0 ? 'bg-red-500' : ''}`}
                              />
                              <Button size="sm" variant="outline" title="Ver detalles de la casa" onClick={() => setCasaDetalles(casa)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="seguridad">
            <Suspense fallback={<TableSkeleton />}>
              <ContenidoPestanaSeguridad
                usuarios={currentUsers}
                isLoading={isLoading} 
                onVerDetalles={handleVerDetallesUsuario}
                onEditarUsuario={handleEditarUsuario}
                onEliminarUsuario={handleEliminarUsuario}
                onEliminarMultiplesUsuarios={handleEliminarMultiplesUsuarios}
                actualizacionEnTiempoReal={actualizacionEnTiempoReal}
                getRolBadge={getRolBadge}
                getResidencialNombre={getResidencialNombre}
                getEstadoBadge={getEstadoBadge}
                titulo="Personal de Seguridad"
                renderPagination={renderPagination}
                filterCalle={filterCalle}
                onFilterCalleChange={setFilterCalle}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="administradores">
            <Suspense fallback={<TableSkeleton />}>
              <ContenidoPestanaAdministradores
                usuarios={currentUsers}
                isLoading={isLoading} 
                onVerDetalles={handleVerDetallesUsuario}
                onEditarUsuario={handleEditarUsuario}
                onEliminarUsuario={handleEliminarUsuario}
                onEliminarMultiplesUsuarios={handleEliminarMultiplesUsuarios}
                actualizacionEnTiempoReal={actualizacionEnTiempoReal}
                getRolBadge={getRolBadge}
                getResidencialNombre={getResidencialNombre}
                getEstadoBadge={getEstadoBadge}
                titulo="Administradores"
                renderPagination={renderPagination}
                filterCalle={filterCalle}
                onFilterCalleChange={setFilterCalle}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="pendientes">
            <Suspense fallback={<TableSkeleton />}>
              <ContenidoPestanaPendientes
                usuariosPendientes={currentUsers as Usuario[]}
                isLoading={isLoading}
                actualizacionEnTiempoReal={actualizacionEnTiempoReal}
                getResidencialIdFromUser={getResidencialIdFromUser}
                getResidencialNombre={getResidencialNombre}
                getRolBadge={getRolBadge}
                mostrarDocumento={mostrarDocumento}
                handleRechazarUsuario={handleRechazarUsuario}
                handleAprobarUsuario={handleAprobarUsuario}
                renderPagination={renderPagination}
                todosLosUsuarios={usuarios}
                onUsuarioActualizado={handleUsuarioActualizado}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="rechazados">
            <Suspense fallback={<TableSkeleton />}>
              <ContenidoPestanaRechazados
                usuariosRechazados={currentUsers as Usuario[]}
                isLoading={isLoading}
                actualizacionEnTiempoReal={actualizacionEnTiempoReal}
                getResidencialIdFromUser={getResidencialIdFromUser}
                getResidencialNombre={getResidencialNombre}
                getRolBadge={getRolBadge}
                mostrarDocumento={mostrarDocumento}
                handleEliminarUsuario={handleEliminarUsuario}
                onEliminarMultiplesUsuarios={handleEliminarMultiplesUsuarios}
                renderPagination={renderPagination}
                todosLosUsuarios={usuarios}
                onUsuarioActualizado={handleUsuarioActualizado}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!documentoSeleccionado || isLoadingDocument} onOpenChange={(open) => !open && cerrarModal()}>
        {(!!documentoSeleccionado || isLoadingDocument) && (
          <Suspense fallback={<div className="p-6 text-center">Cargando visor de documentos...</div>}>
            <MostrarDocumentoDialogContent
              documentoSeleccionado={documentoSeleccionado}
              documentoNombre={documentoNombre}
              documentoURL={documentoURL}
              isLoadingDocument={isLoadingDocument}
              onCloseDialog={cerrarModal} 
            />
          </Suspense>
        )}
      </Dialog>

      {/* Modal detalles de casa */}
      <Dialog open={!!casaDetalles} onOpenChange={(o)=>!o && setCasaDetalles(null)}>
        {!!casaDetalles && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalles de la casa</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {(casaDetalles.calle || casaDetalles.houseNumber) ? (
                  <>Casa: <span className="font-medium text-foreground">{casaDetalles.calle || 'Calle s/d'} {casaDetalles.houseNumber || ''}</span></>
                ) : 'Casa sin calle/número'}
                {casaDetalles.houseID && (
                  <span className="ml-2">(ID: {casaDetalles.houseID})</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div className="p-2 rounded border">Total: <span className="font-medium">{casaDetalles.total}</span></div>
                <div className="p-2 rounded border">Pendientes: <span className="font-medium">{casaDetalles.pendientes}</span></div>
                <div className="p-2 rounded border">Aprobados: <span className="font-medium">{casaDetalles.aprobados}</span></div>
                <div className="p-2 rounded border">Morosos: <span className="font-medium">{casaDetalles.morosos}</span></div>
              </div>
              <div className="rounded-md border p-2">
                <div className="text-xs text-muted-foreground mb-2">Usuarios</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Moroso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {casaDetalles.usuarios.map(u => (
                      <TableRow key={u.id || u.uid}>
                        <TableCell className="font-medium">{u.fullName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                        <TableCell>{getRolBadge(u.role)}</TableCell>
                        <TableCell>{getEstadoBadge(u.status)}</TableCell>
                        <TableCell><Badge variant={(u as any).isMoroso ? 'destructive' : 'secondary'}>{(u as any).isMoroso ? 'Sí' : 'No'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={() => casaDetalles && handleMarcarCasaMorosa(casaDetalles, true)}>Marcar morosa</Button>
                <Button size="sm" variant="outline" onClick={() => casaDetalles && handleMarcarCasaMorosa(casaDetalles, false)}>Quitar morosidad</Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={showNuevoUsuarioDialog} onOpenChange={setShowNuevoUsuarioDialog}>
        {showNuevoUsuarioDialog && ( 
          <Suspense fallback={<div className="p-6 text-center">Cargando formulario...</div>}>
            <NuevoUsuarioDialogContent
              nuevoUsuarioForm={nuevoUsuarioForm}
              handleInputChange={handleInputChange}
              handleSelectChange={handleSelectChange}
              residenciales={residenciales}
              residencialIdDelAdmin={residencialIdDelAdmin}
              mapeoResidenciales={mapeoResidenciales}
              callesDisponibles={callesDisponibles}
              creandoUsuario={creandoUsuario}
              handleCrearUsuario={handleCrearUsuario}
              setShowNuevoUsuarioDialog={setShowNuevoUsuarioDialog}
            />
          </Suspense>
        )}
      </Dialog>

      <Dialog open={!!usuarioAEliminar} onOpenChange={(open) => !open && setUsuarioAEliminar(null)}>
        {!!usuarioAEliminar && ( 
          <Suspense fallback={<div className="p-6 text-center">Cargando confirmación...</div>}>
            <ConfirmarEliminarDialogContent
              usuarioAEliminar={usuarioAEliminar}
              onCloseDialog={() => setUsuarioAEliminar(null)}
              onConfirmDelete={confirmarEliminarUsuario}
              eliminandoUsuario={eliminandoUsuario}
            />
          </Suspense>
        )}
      </Dialog>

      {showDetallesUsuarioDialog && usuarioSeleccionado && (
        <Suspense fallback={<div>Cargando detalles...</div>}>
          <DetallesUsuarioDialog
            usuarioSeleccionado={usuarioSeleccionado}
            showDialog={showDetallesUsuarioDialog}
            onClose={cerrarModal} 
            getResidencialNombre={getResidencialNombre}
            getEstadoBadge={getEstadoBadge}
            getRolBadge={getRolBadge}
            mostrarDocumento={mostrarDocumento}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <EditarUsuarioDialog
          usuario={usuarioAEditar}
          isOpen={showEditarUsuarioDialog}
          onClose={() => setShowEditarUsuarioDialog(false)}
          onUpdate={handleUpdateUsuario}
        />
      </Suspense>
    </div>
  );
}

const getTituloTabla = (activeTab: string) => {
  switch (activeTab) {
    case 'residentes':
      return 'Residentes';
    case 'seguridad':
      return 'Personal de Seguridad';
    case 'administradores':
      return 'Administradores';
    case 'pendientes':
      return 'Usuarios Pendientes de Aprobación';
    case 'rechazados':
      return 'Usuarios Rechazados';
    default:
      return 'Usuarios';
  }
}; 

