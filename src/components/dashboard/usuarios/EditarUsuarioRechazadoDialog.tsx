import React, { useState, useEffect, useCallback } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Usuario, actualizarUsuario, getResidenciales, Residencial } from '@/lib/firebase/firestore';
import { subirDocumento, getDocumentURLSimplificado, eliminarDocumento } from '@/lib/firebase/storage';
import { doc, getDoc, deleteField } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import RegistrationResidentialService from '@/lib/services/registration-residential-service';
import { toast as sonnerToast } from 'sonner';
import { 
  User, 
  Mail, 
  Phone, 
  Home, 
  Building, 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Save, 
  RefreshCw,
  AlertTriangle,
  Star,
  Users,
  MapPin,
  Hash,
  Info
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

interface EditarUsuarioRechazadoDialogProps {
  usuario: Usuario;
  onClose: () => void;
  todosLosUsuarios: Usuario[];
  getResidencialNombre: (id: string) => string;
  onUsuarioActualizado: () => void;
}

interface FormData {
  fullName: string;
  paternalLastName: string;
  maternalLastName: string;
  email: string;
  telefono: string;
  calle: string;
  houseNumber: string;
  houseID: string;
  isPrimaryUser: boolean;
  ownershipStatus: 'own' | 'rent';
  residencialID: string;
  isOwner: boolean;
}

const EditarUsuarioRechazadoDialog: React.FC<EditarUsuarioRechazadoDialogProps> = ({ 
  usuario, 
  onClose, 
  todosLosUsuarios, 
  getResidencialNombre,
  onUsuarioActualizado 
}) => {
  const [activeTab, setActiveTab] = useState('datos');
  const [loading, setLoading] = useState(false);
  const [residenciales, setResidenciales] = useState<Residencial[]>([]);
  const [callesDisponibles, setCallesDisponibles] = useState<string[]>([]);
  
  // Estado del formulario
  const [formData, setFormData] = useState<FormData>({
    fullName: usuario.fullName || '',
    paternalLastName: usuario.paternalLastName || '',
    maternalLastName: usuario.maternalLastName || '',
    email: usuario.email || '',
    telefono: usuario.telefono || '',
    calle: usuario.calle || '',
    houseNumber: usuario.houseNumber || '',
    houseID: usuario.houseID || '',
    isPrimaryUser: usuario.isPrimaryUser || false,
    ownershipStatus: usuario.ownershipStatus || 'rent',
    residencialID: usuario.residencialID || '',
    isOwner: (usuario as any).isOwner || false
  });

  // Estado de documentos
  const [identificacionFile, setIdentificacionFile] = useState<File | null>(null);
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  
  // Historial completo de documentos (arrays)
  const [identificacionHistorial, setIdentificacionHistorial] = useState<string[]>([]);
  const [comprobanteHistorial, setComprobanteHistorial] = useState<string[]>([]);
  
  const [subiendoDocumentos, setSubiendoDocumentos] = useState(false);
  
  // URLs de previsualización para archivos nuevos
  const [identificacionPreview, setIdentificacionPreview] = useState<string | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);
  
  // Estado de carga de documentos
  const [cargandoDocumentos, setCargandoDocumentos] = useState(true);
  
  // Estados para mostrar/ocultar historial
  const [mostrarHistorialId, setMostrarHistorialId] = useState(false);
  const [mostrarHistorialComp, setMostrarHistorialComp] = useState(false);

  // Cargar calles del residencial
  const cargarCallesDelResidencial = useCallback(async (residencialID: string) => {
    try {
      if (!residencialID) {
        setCallesDisponibles([]);
        return;
      }
      
      console.log('🔍 Cargando calles para residencial ID:', residencialID);
      
      // Buscar el residencial por residencialID (código)
      const residencialesData = await getResidenciales();
      const residencial = residencialesData.find(r => r.residencialID === residencialID);
      
      if (residencial && residencial.id) {
        // Obtener el documento del residencial usando el ID del documento
        const residencialDoc = await getDoc(doc(db, 'residenciales', residencial.id));
        
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
      } else {
        console.log('❌ No se encontró el residencial con ID:', residencialID);
        setCallesDisponibles([]);
      }
    } catch (error) {
      console.error('Error al cargar calles:', error);
      setCallesDisponibles([]);
    }
  }, []);

  // Cargar residenciales, calles y URLs de documentos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargandoDocumentos(true);
        const residencialesData = await getResidenciales();
        setResidenciales(residencialesData);

        // Cargar calles del residencial del usuario
        if (usuario.residencialID) {
          await cargarCallesDelResidencial(usuario.residencialID);
        }

        // Generar houseID con estructura correcta si no la tiene
        if (usuario.residencialID && usuario.calle && usuario.houseNumber) {
          const houseIDCorrect = RegistrationResidentialService.generateHouseId(
            usuario.residencialID,
            usuario.calle,
            usuario.houseNumber
          );
          
          // Solo actualizar si el formato actual es diferente
          if (usuario.houseID !== houseIDCorrect) {
            setFormData(prev => ({
              ...prev,
              houseID: houseIDCorrect
            }));
          }
        }

        // Cargar URLs de documentos existentes con manejo de errores mejorado
        await cargarDocumentosExistentes();
      } catch (error) {
        console.error('Error cargando datos:', error);
        sonnerToast.error('Error al cargar datos del usuario');
      } finally {
        setCargandoDocumentos(false);
      }
    };

    cargarDatos();
  }, [usuario, cargarCallesDelResidencial]);

  // Función separada para cargar documentos existentes
  const cargarDocumentosExistentes = async () => {
    try {
      const usuarioData = usuario as any;
      
      // Arrays para almacenar URLs de documentos
      const identificacionUrls: string[] = [];
      const comprobanteUrls: string[] = [];

      // **COMPATIBILIDAD**: Manejar estructura antigua (campos únicos)
      const identificacionPath = usuarioData.identificacionPath;
      const comprobantePath = usuarioData.comprobantePath;
      
      // **NUEVA ESTRUCTURA**: Manejar arrays de documentos
      const identificacionPaths = usuarioData.identificacionPaths || [];
      const comprobantePaths = usuarioData.comprobantePaths || [];

      // Cargar documentos de identificación
      console.log('🔍 Cargando historial de identificación...');
      
      // Si existe estructura antigua, migrarla
      if (identificacionPath && !identificacionPaths.length) {
        console.log('📦 Migrando estructura antigua de identificación');
        try {
          const idUrl = await getDocumentURLSimplificado(identificacionPath);
          if (idUrl) {
            identificacionUrls.push(idUrl);
            console.log('✅ Identificación antigua cargada:', identificacionPath);
          }
        } catch (error) {
          console.warn('⚠️ Error al cargar identificación antigua:', error);
        }
      }
      
      // Cargar todas las identificaciones del historial
      for (const path of identificacionPaths) {
        try {
          const idUrl = await getDocumentURLSimplificado(path);
          if (idUrl) {
            identificacionUrls.push(idUrl);
            console.log('✅ Identificación del historial cargada:', path);
          }
        } catch (error) {
          console.warn('⚠️ Error al cargar identificación del historial:', error);
        }
      }

      // Cargar documentos de comprobante
      console.log('🔍 Cargando historial de comprobante...');
      
      // Si existe estructura antigua, migrarla
      if (comprobantePath && !comprobantePaths.length) {
        console.log('📦 Migrando estructura antigua de comprobante');
        try {
          const compUrl = await getDocumentURLSimplificado(comprobantePath);
          if (compUrl) {
            comprobanteUrls.push(compUrl);
            console.log('✅ Comprobante antiguo cargado:', comprobantePath);
          }
        } catch (error) {
          console.warn('⚠️ Error al cargar comprobante antiguo:', error);
        }
      }
      
      // Cargar todos los comprobantes del historial
      for (const path of comprobantePaths) {
        try {
          const compUrl = await getDocumentURLSimplificado(path);
          if (compUrl) {
            comprobanteUrls.push(compUrl);
            console.log('✅ Comprobante del historial cargado:', path);
          }
        } catch (error) {
          console.warn('⚠️ Error al cargar comprobante del historial:', error);
        }
      }

      // Establecer los historiales
      setIdentificacionHistorial(identificacionUrls);
      setComprobanteHistorial(comprobanteUrls);
      
      console.log(`📋 Historial cargado - ID: ${identificacionUrls.length} docs, Comp: ${comprobanteUrls.length} docs`);
      
    } catch (error) {
      console.error('Error general al cargar documentos:', error);
      sonnerToast.warning('Error al cargar algunos documentos del historial');
    }
  };

  // Manejar cambios en inputs
  const handleInputChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Generar nuevo houseID cuando cambian calle o número usando la estructura correcta
      if (field === 'calle' || field === 'houseNumber') {
        if (newData.calle && newData.houseNumber && newData.residencialID) {
          newData.houseID = RegistrationResidentialService.generateHouseId(
            newData.residencialID,
            newData.calle,
            newData.houseNumber
          );
        }
      }
      
      return newData;
    });
  }, []);

  // Manejar selección de archivos
  const handleFileSelect = useCallback((tipo: 'identificacion' | 'comprobante', file: File | null) => {
    if (tipo === 'identificacion') {
      setIdentificacionFile(file);
      // Limpiar preview anterior
      if (identificacionPreview) {
        URL.revokeObjectURL(identificacionPreview);
      }
      // Crear preview del nuevo archivo
      if (file) {
        const previewUrl = URL.createObjectURL(file);
        setIdentificacionPreview(previewUrl);
      } else {
        setIdentificacionPreview(null);
      }
    } else {
      setComprobanteFile(file);
      // Limpiar preview anterior
      if (comprobantePreview) {
        URL.revokeObjectURL(comprobantePreview);
      }
      // Crear preview del nuevo archivo
      if (file) {
        const previewUrl = URL.createObjectURL(file);
        setComprobantePreview(previewUrl);
      } else {
        setComprobantePreview(null);
      }
    }
  }, [identificacionPreview, comprobantePreview]);

  // Limpiar URLs de preview cuando se desmonta el componente
  useEffect(() => {
    return () => {
      if (identificacionPreview) {
        URL.revokeObjectURL(identificacionPreview);
      }
      if (comprobantePreview) {
        URL.revokeObjectURL(comprobantePreview);
      }
    };
  }, [identificacionPreview, comprobantePreview]);

  // Subir documentos (AGREGAR al historial, no reemplazar)
  const subirDocumentos = async () => {
    if (!identificacionFile && !comprobanteFile) return {};

    setSubiendoDocumentos(true);
    const documentos: any = {};
    const errores: string[] = [];

    try {
      const usuarioData = usuario as any;
      
      // Obtener arrays existentes o crear nuevos
      const identificacionPathsExistentes = usuarioData.identificacionPaths || [];
      const comprobantePathsExistentes = usuarioData.comprobantePaths || [];
      
      // Migrar estructura antigua si existe
      if (usuarioData.identificacionPath && !identificacionPathsExistentes.length) {
        identificacionPathsExistentes.push(usuarioData.identificacionPath);
      }
      if (usuarioData.comprobantePath && !comprobantePathsExistentes.length) {
        comprobantePathsExistentes.push(usuarioData.comprobantePath);
      }

      // Subir identificación si hay archivo nuevo
      if (identificacionFile) {
        try {
          console.log('📤 Subiendo nueva identificación:', identificacionFile.name);
          const extension = identificacionFile.name.split('.').pop()?.toLowerCase();
          if (!extension || !['jpg', 'jpeg', 'png', 'pdf'].includes(extension)) {
            throw new Error('Formato de archivo no válido para identificación');
          }
          
          const timestamp = Date.now();
          const identificacionPath = `usuarios/${usuario.id}/identificacion_${timestamp}.${extension}`;
          await subirDocumento(identificacionFile, identificacionPath);
          
          // AGREGAR al historial (no reemplazar)
          const nuevosIdentificacionPaths = [...identificacionPathsExistentes, identificacionPath];
          documentos.identificacionPaths = nuevosIdentificacionPaths;
          
          // Mantener compatibilidad con estructura antigua
          documentos.identificacionPath = identificacionPath;
          
          console.log('✅ Identificación agregada al historial:', identificacionPath);
          console.log('📋 Total documentos de identificación:', nuevosIdentificacionPaths.length);
          sonnerToast.success(`Identificación agregada al historial (${nuevosIdentificacionPaths.length} documentos)`);
        } catch (error) {
          console.error('❌ Error al subir identificación:', error);
          errores.push('Error al subir identificación');
        }
      }

      // Subir comprobante si hay archivo nuevo
      if (comprobanteFile) {
        try {
          console.log('📤 Subiendo nuevo comprobante:', comprobanteFile.name);
          const extension = comprobanteFile.name.split('.').pop()?.toLowerCase();
          if (!extension || !['jpg', 'jpeg', 'png', 'pdf'].includes(extension)) {
            throw new Error('Formato de archivo no válido para comprobante');
          }
          
          const timestamp = Date.now();
          const comprobantePath = `usuarios/${usuario.id}/comprobante_${timestamp}.${extension}`;
          await subirDocumento(comprobanteFile, comprobantePath);
          
          // AGREGAR al historial (no reemplazar)
          const nuevosComprobantePaths = [...comprobantePathsExistentes, comprobantePath];
          documentos.comprobantePaths = nuevosComprobantePaths;
          
          // Mantener compatibilidad con estructura antigua
          documentos.comprobantePath = comprobantePath;
          
          console.log('✅ Comprobante agregado al historial:', comprobantePath);
          console.log('📋 Total documentos de comprobante:', nuevosComprobantePaths.length);
          sonnerToast.success(`Comprobante agregado al historial (${nuevosComprobantePaths.length} documentos)`);
        } catch (error) {
          console.error('❌ Error al subir comprobante:', error);
          errores.push('Error al subir comprobante');
        }
      }

      // Si hay errores pero se subió al menos un documento, mostrar advertencia
      if (errores.length > 0) {
        sonnerToast.warning(`Algunos documentos no se pudieron subir: ${errores.join(', ')}`);
      }

      return documentos;
    } catch (error) {
      console.error('❌ Error general al subir documentos:', error);
      sonnerToast.error('Error al subir documentos');
      throw error;
    } finally {
      setSubiendoDocumentos(false);
    }
  };

  // Guardar cambios
  const handleGuardarCambios = async () => {
    if (!usuario.id) return;

    setLoading(true);
    try {
      // Subir documentos nuevos si los hay
      const documentosActualizados = await subirDocumentos();

      // Preparar datos para actualizar
      const datosActualizados = {
        ...formData,
        ...documentosActualizados,
        updatedAt: new Date()
      };

      await actualizarUsuario(usuario.id, datosActualizados);
      sonnerToast.success('Usuario actualizado correctamente');
      onUsuarioActualizado();
      onClose();
    } catch (error) {
      sonnerToast.error('Error al actualizar usuario');
    } finally {
      setLoading(false);
    }
  };

  // Aprobar usuario después de correcciones
  const handleAprobarUsuario = async () => {
    if (!usuario.id) return;

    setLoading(true);
    console.log('🟢 [AprobarUsuario] INICIO proceso de aprobación para usuario:', usuario.id);
    try {
      // Primero guardar los cambios
      console.log('🟢 [AprobarUsuario] Subiendo documentos nuevos (si hay)...');
      const documentosActualizados = await subirDocumentos();
      console.log('🟢 [AprobarUsuario] Documentos subidos:', documentosActualizados);
      
      const datosActualizados = {
        ...formData,
        ...documentosActualizados,
        status: 'approved' as const,
        rejectionReason: deleteField(), // Eliminar completamente el campo rejectionReason
        updatedAt: new Date()
      };
      console.log('🟢 [AprobarUsuario] Datos a guardar en Firestore:', datosActualizados);

      await actualizarUsuario(usuario.id, datosActualizados);
      console.log('✅ [AprobarUsuario] Usuario aprobado correctamente en Firestore');
      sonnerToast.success('Usuario aprobado correctamente');
      onUsuarioActualizado();
      onClose();
    } catch (error) {
      console.error('❌ [AprobarUsuario] Error al aprobar usuario:', error);
      sonnerToast.error('Error al aprobar usuario');
    } finally {
      setLoading(false);
      console.log('🟡 [AprobarUsuario] FIN proceso de aprobación para usuario:', usuario.id);
    }
  };

  // Usuarios ligados al mismo houseID
  const usuariosMismaCasa = formData.houseID 
    ? todosLosUsuarios.filter(u => u.houseID === formData.houseID && u.id !== usuario.id && u.status === 'approved')
    : [];

  const principalYaExiste = usuariosMismaCasa.some(u => u.isPrimaryUser);

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Editar Usuario Rechazado
        </DialogTitle>
        <DialogDescription>
          Corrige los datos del usuario para poder aprobar su solicitud
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {/* Información del rechazo */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-red-700">
              <XCircle className="h-4 w-4" />
              Motivo del rechazo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-red-600">
              {usuario.rejectionReason || 'Sin motivo especificado'}
            </p>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="datos">Datos Personales</TabsTrigger>
            <TabsTrigger value="direccion">Dirección</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="datos" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Nombre(s) *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <Label htmlFor="paternalLastName">Apellido Paterno *</Label>
                <Input
                  id="paternalLastName"
                  value={formData.paternalLastName}
                  onChange={(e) => handleInputChange('paternalLastName', e.target.value)}
                  placeholder="Apellido paterno"
                />
              </div>
              <div>
                <Label htmlFor="maternalLastName">Apellido Materno</Label>
                <Input
                  id="maternalLastName"
                  value={formData.maternalLastName}
                  onChange={(e) => handleInputChange('maternalLastName', e.target.value)}
                  placeholder="Apellido materno"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed text-gray-500"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  placeholder="555-123-4567"
                />
              </div>
              <div>
                <Label htmlFor="ownershipStatus">Tipo de Propiedad</Label>
                <Select
                  value={formData.ownershipStatus}
                  onValueChange={(value: 'own' | 'rent') => handleInputChange('ownershipStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="own">Propietario</SelectItem>
                    <SelectItem value="rent">Rentero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tipo de usuario - Detección automática */}
            <div className="space-y-2">
              <Label>Tipo de Usuario</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {/* Indicador automático de tipo de usuario */}
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${
                    formData.isPrimaryUser 
                      ? 'bg-blue-50 border-blue-200 text-blue-800' 
                      : 'bg-green-50 border-green-200 text-green-800'
                  }`}>
                    {formData.isPrimaryUser ? (
                      <>
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium text-sm">Usuario Principal</span>
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-sm">Usuario Secundario</span>
                      </>
                    )}
                  </div>
                  
                  {/* Badge de información */}
                  <div className="text-xs text-muted-foreground">
                    {formData.isPrimaryUser 
                      ? "Responsable de la aplicación" 
                      : "Usuario autorizado"
                    }
                  </div>
                </div>
                
                {/* Información adicional */}
                {principalYaExiste && !formData.isPrimaryUser && (
                  <div className="text-xs text-blue-600 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    <span>Principal ya existe en esta dirección</span>
                  </div>
                )}
              </div>
              
              {/* Información sobre detección automática */}
              <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                <Info className="h-3 w-3 inline mr-1" />
                El tipo de usuario se determina automáticamente según el orden de registro. 
                El primer inquilino registrado es el principal.
              </div>
            </div>
          </TabsContent>

          <TabsContent value="direccion" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="residencialID">Residencial *</Label>
                <Input
                  id="residencialID"
                  value={getResidencialNombre(formData.residencialID) || 'No asignado'}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed text-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="calle">Calle *</Label>
                {callesDisponibles.length > 0 ? (
                  <Select
                    value={formData.calle}
                    onValueChange={(value) => handleInputChange('calle', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una calle" />
                    </SelectTrigger>
                    <SelectContent>
                      {callesDisponibles.map((calle) => (
                        <SelectItem key={calle} value={calle}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            {calle}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="calle"
                    value={formData.calle}
                    onChange={(e) => handleInputChange('calle', e.target.value)}
                    placeholder="Nombre de la calle (sin calles predefinidas)"
                  />
                )}
                {callesDisponibles.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {callesDisponibles.length} calles disponibles en este residencial
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="houseNumber">Número de Casa *</Label>
                <Input
                  id="houseNumber"
                  value={formData.houseNumber}
                  onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                  placeholder="123"
                />
              </div>
              <div>
                <Label htmlFor="houseID">House ID (generado automáticamente)</Label>
                <Input
                  id="houseID"
                  value={formData.houseID}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>

            {/* Usuarios ligados a esta dirección */}
            {usuariosMismaCasa.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Usuarios ligados a esta dirección ({usuariosMismaCasa.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {usuariosMismaCasa.map(u => (
                      <div key={u.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>{u.fullName?.charAt(0)}{u.paternalLastName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{u.fullName} {u.paternalLastName}</span>
                        {u.isPrimaryUser && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Principal
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">{u.email}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documentos" className="space-y-4">
            {/* Badge informativo sobre tipo de usuario */}
            <div className="mb-4 flex items-center gap-2">
              {(formData.isOwner === true || formData.ownershipStatus === 'own') ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <Building className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Propietario</span>
                  <span className="text-xs text-blue-600">Requiere identificación + comprobante</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <Home className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Inquilino</span>
                  <span className="text-xs text-green-600">Solo requiere identificación</span>
                </div>
              )}
            </div>

            {cargandoDocumentos ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Cargando documentos...</span>
              </div>
            ) : (
              <div className={`grid gap-6 ${(formData.isOwner === true || formData.ownershipStatus === 'own') ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'}`}>
                {/* Identificación */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Identificación Oficial
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Formatos permitidos: JPG, PNG, PDF (máx. 10MB)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Historial de documentos de identificación */}
                    {identificacionHistorial.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">
                            Historial de identificaciones ({identificacionHistorial.length}):
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setMostrarHistorialId(!mostrarHistorialId)}
                            className="h-auto p-1 text-xs"
                          >
                            {mostrarHistorialId ? 'Ocultar' : 'Ver todos'}
                          </Button>
                        </div>
                        
                        {/* Documento más reciente (siempre visible) */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="text-xs">Más reciente</Badge>
                            <span className="text-xs text-green-600">
                              Documento {identificacionHistorial.length}
                            </span>
                          </div>
                          <div className="border-2 border-green-200 rounded-lg overflow-hidden bg-green-50">
                            <TransformWrapper>
                              <TransformComponent>
                                <img 
                                  src={identificacionHistorial[identificacionHistorial.length - 1]} 
                                  alt="Identificación más reciente"
                                  className="w-full h-40 object-contain"
                                  onError={(e) => {
                                    console.error('Error al cargar imagen de identificación');
                                    (e.target as HTMLImageElement).src = '/images/document-error.png';
                                  }}
                                />
                              </TransformComponent>
                            </TransformWrapper>
                          </div>
                        </div>
                        
                        {/* Historial completo (expandible) */}
                        {mostrarHistorialId && identificacionHistorial.length > 1 && (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            <Label className="text-xs text-muted-foreground">Documentos anteriores:</Label>
                            {identificacionHistorial.slice(0, -1).reverse().map((url, index) => (
                              <div key={index} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Documento {identificacionHistorial.length - 1 - index}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    (Anterior)
                                  </span>
                                </div>
                                <div className="border rounded-lg overflow-hidden bg-gray-50">
                                  <TransformWrapper>
                                    <TransformComponent>
                                      <img 
                                        src={url} 
                                        alt={`Identificación anterior ${index + 1}`}
                                        className="w-full h-32 object-contain"
                                        onError={(e) => {
                                          console.error('Error al cargar imagen de identificación anterior');
                                          (e.target as HTMLImageElement).src = '/images/document-error.png';
                                        }}
                                      />
                                    </TransformComponent>
                                  </TransformWrapper>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Preview del nuevo documento */}
                    {identificacionPreview && (
                      <div className="space-y-2">
                        <Label className="text-xs text-blue-600 font-medium">Nuevo documento (pendiente de guardar):</Label>
                        <div className="border-2 border-blue-200 rounded-lg overflow-hidden bg-blue-50">
                          <TransformWrapper>
                            <TransformComponent>
                              <img 
                                src={identificacionPreview} 
                                alt="Nueva identificación"
                                className="w-full h-40 object-contain"
                              />
                            </TransformComponent>
                          </TransformWrapper>
                        </div>
                        <p className="text-xs text-blue-600">
                          Este documento se agregará al historial al guardar (será el documento #{identificacionHistorial.length + 1})
                        </p>
                      </div>
                    )}
                    
                    {/* Input para subir nuevo archivo */}
                    <div className="space-y-2">
                                          <Label htmlFor="identificacion">
                      {identificacionHistorial.length > 0 ? 'Agregar nueva identificación al historial' : 'Subir primera identificación'}
                    </Label>
                      <Input
                        id="identificacion"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        onChange={(e) => handleFileSelect('identificacion', e.target.files?.[0] || null)}
                        className="cursor-pointer"
                      />
                      {identificacionFile && (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Archivo seleccionado: {identificacionFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileSelect('identificacion', null)}
                            className="h-auto p-1 text-red-500 hover:text-red-700"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Comprobante (solo para propietarios) */}
                {(formData.isOwner === true || formData.ownershipStatus === 'own') ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Comprobante de Domicilio
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Formatos permitidos: JPG, PNG, PDF (máx. 10MB)
                      </CardDescription>
                    </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Historial de documentos de comprobante */}
                    {comprobanteHistorial.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">
                            Historial de comprobantes ({comprobanteHistorial.length}):
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setMostrarHistorialComp(!mostrarHistorialComp)}
                            className="h-auto p-1 text-xs"
                          >
                            {mostrarHistorialComp ? 'Ocultar' : 'Ver todos'}
                          </Button>
                        </div>
                        
                        {/* Documento más reciente (siempre visible) */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="text-xs">Más reciente</Badge>
                            <span className="text-xs text-green-600">
                              Documento {comprobanteHistorial.length}
                            </span>
                          </div>
                          <div className="border-2 border-green-200 rounded-lg overflow-hidden bg-green-50">
                            <TransformWrapper>
                              <TransformComponent>
                                <img 
                                  src={comprobanteHistorial[comprobanteHistorial.length - 1]} 
                                  alt="Comprobante más reciente"
                                  className="w-full h-40 object-contain"
                                  onError={(e) => {
                                    console.error('Error al cargar imagen de comprobante');
                                    (e.target as HTMLImageElement).src = '/images/document-error.png';
                                  }}
                                />
                              </TransformComponent>
                            </TransformWrapper>
                          </div>
                        </div>
                        
                        {/* Historial completo (expandible) */}
                        {mostrarHistorialComp && comprobanteHistorial.length > 1 && (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            <Label className="text-xs text-muted-foreground">Documentos anteriores:</Label>
                            {comprobanteHistorial.slice(0, -1).reverse().map((url, index) => (
                              <div key={index} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Documento {comprobanteHistorial.length - 1 - index}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    (Anterior)
                                  </span>
                                </div>
                                <div className="border rounded-lg overflow-hidden bg-gray-50">
                                  <TransformWrapper>
                                    <TransformComponent>
                                      <img 
                                        src={url} 
                                        alt={`Comprobante anterior ${index + 1}`}
                                        className="w-full h-32 object-contain"
                                        onError={(e) => {
                                          console.error('Error al cargar imagen de comprobante anterior');
                                          (e.target as HTMLImageElement).src = '/images/document-error.png';
                                        }}
                                      />
                                    </TransformComponent>
                                  </TransformWrapper>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Preview del nuevo documento */}
                    {comprobantePreview && (
                      <div className="space-y-2">
                        <Label className="text-xs text-blue-600 font-medium">Nuevo documento (pendiente de guardar):</Label>
                        <div className="border-2 border-blue-200 rounded-lg overflow-hidden bg-blue-50">
                          <TransformWrapper>
                            <TransformComponent>
                              <img 
                                src={comprobantePreview} 
                                alt="Nuevo comprobante"
                                className="w-full h-40 object-contain"
                              />
                            </TransformComponent>
                          </TransformWrapper>
                        </div>
                        <p className="text-xs text-blue-600">
                          Este documento se agregará al historial al guardar (será el documento #{comprobanteHistorial.length + 1})
                        </p>
                      </div>
                    )}
                    
                    {/* Input para subir nuevo archivo */}
                    <div className="space-y-2">
                      <Label htmlFor="comprobante">
                        {comprobanteHistorial.length > 0 ? 'Agregar nuevo comprobante al historial' : 'Subir primer comprobante'}
                      </Label>
                      <Input
                        id="comprobante"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        onChange={(e) => handleFileSelect('comprobante', e.target.files?.[0] || null)}
                        className="cursor-pointer"
                      />
                      {comprobanteFile && (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Archivo seleccionado: {comprobanteFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileSelect('comprobante', null)}
                            className="h-auto p-1 text-red-500 hover:text-red-700"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                ) : (
                  /* Mensaje informativo para inquilinos */
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-800">Documentos completos</p>
                          <p className="text-xs text-green-600 mt-1">
                            Los inquilinos solo requieren identificación oficial. 
                            No es necesario subir comprobante de domicilio.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Validación de email para inquilinos */}
            {(formData.isOwner === false || formData.ownershipStatus === 'rent') && !formData.email && (
              <div className="mt-4">
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Email requerido</p>
                        <p className="text-xs text-red-600 mt-1">
                          Los inquilinos deben tener un email válido para recibir invitaciones.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Información adicional */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Instrucciones para los documentos:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Los documentos deben ser legibles y estar completos</li>
                      <li>La identificación debe mostrar claramente el nombre y foto</li>
                      <li>El comprobante debe mostrar la dirección que coincida con el registro</li>
                      <li>✨ <strong>Nuevo:</strong> Los documentos se agregan al historial, no se reemplazan</li>
                      <li>📋 Puedes ver todos los documentos anteriores expandiendo el historial</li>
                      <li>🔍 El documento más reciente siempre se muestra primero</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botones de acción */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleGuardarCambios}
              disabled={loading || subiendoDocumentos}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
            <Button
              onClick={handleAprobarUsuario}
              disabled={loading || subiendoDocumentos}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Aprobando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Corregir y Aprobar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  );
};

export default EditarUsuarioRechazadoDialog; 