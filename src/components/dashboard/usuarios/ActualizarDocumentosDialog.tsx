import React, { useState, useEffect, useCallback } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Usuario, actualizarUsuario } from '@/lib/firebase/firestore';
import { subirDocumento, getDocumentURLSimplificado, eliminarDocumento } from '@/lib/firebase/storage';
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
  Info,
  Edit,
  Camera,
  FileImage
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

interface ActualizarDocumentosDialogProps {
  usuario: Usuario;
  onClose: () => void;
  onUsuarioActualizado: () => void;
}

const ActualizarDocumentosDialog: React.FC<ActualizarDocumentosDialogProps> = ({ 
  usuario, 
  onClose, 
  onUsuarioActualizado 
}) => {
  const [loading, setLoading] = useState(false);
  const [subiendoDocumentos, setSubiendoDocumentos] = useState(false);
  
  // Estado de documentos
  const [identificacionFile, setIdentificacionFile] = useState<File | null>(null);
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  
  // URLs de previsualización para archivos nuevos
  const [identificacionPreview, setIdentificacionPreview] = useState<string | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);
  
  // Estado de carga de documentos
  const [cargandoDocumentos, setCargandoDocumentos] = useState(true);
  
  // URLs de documentos actuales
  const [identificacionUrl, setIdentificacionUrl] = useState<string | null>(null);
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);

  // Cargar documentos existentes
  useEffect(() => {
    const cargarDocumentos = async () => {
      try {
        setCargandoDocumentos(true);
        
        // Cargar identificación
        if (usuario.identificacionUrl) {
          try {
            const url = await getDocumentURLSimplificado(usuario.identificacionUrl);
            setIdentificacionUrl(url);
          } catch (error) {
            console.error('Error cargando identificación:', error);
            setIdentificacionUrl(null);
          }
        }
        
        // Cargar comprobante (solo para propietarios)
        if ((usuario as any).isOwner || usuario.ownershipStatus === 'own') {
          if (usuario.comprobanteUrl) {
            try {
              const url = await getDocumentURLSimplificado(usuario.comprobanteUrl);
              setComprobanteUrl(url);
            } catch (error) {
              console.error('Error cargando comprobante:', error);
              setComprobanteUrl(null);
            }
          }
        }
      } catch (error) {
        console.error('Error cargando documentos:', error);
        sonnerToast.error('Error al cargar documentos existentes');
      } finally {
        setCargandoDocumentos(false);
      }
    };

    cargarDocumentos();
  }, [usuario]);

  // Manejar selección de archivos
  const handleFileChange = (field: 'identificacion' | 'comprobante', file: File | null) => {
    if (field === 'identificacion') {
      setIdentificacionFile(file);
      if (file) {
        const url = URL.createObjectURL(file);
        setIdentificacionPreview(url);
      } else {
        setIdentificacionPreview(null);
      }
    } else if (field === 'comprobante') {
      setComprobanteFile(file);
      if (file) {
        const url = URL.createObjectURL(file);
        setComprobantePreview(url);
      } else {
        setComprobantePreview(null);
      }
    }
  };

  // Subir documentos
  const subirDocumentos = async () => {
    if (!identificacionFile && !comprobanteFile) {
      sonnerToast.error('Por favor selecciona al menos un documento para actualizar');
      return;
    }

    setSubiendoDocumentos(true);
    const toastId = sonnerToast.loading('Actualizando documentos...');

    try {
      const actualizaciones: any = {};

      // Subir identificación si se seleccionó
      if (identificacionFile) {
        const rutaIdentificacion = `usuarios/${usuario.id}/identificacion_${Date.now()}.jpg`;
        const urlIdentificacion = await subirDocumento(identificacionFile, rutaIdentificacion);
        actualizaciones.identificacionUrl = urlIdentificacion;
        
        // Eliminar documento anterior si existe
        if (usuario.identificacionUrl) {
          try {
            await eliminarDocumento(usuario.identificacionUrl);
          } catch (error) {
            console.warn('No se pudo eliminar documento anterior:', error);
          }
        }
      }

      // Subir comprobante si se seleccionó (solo para propietarios)
      if (comprobanteFile && ((usuario as any).isOwner || usuario.ownershipStatus === 'own')) {
        const rutaComprobante = `usuarios/${usuario.id}/comprobante_${Date.now()}.jpg`;
        const urlComprobante = await subirDocumento(comprobanteFile, rutaComprobante);
        actualizaciones.comprobanteUrl = urlComprobante;
        
        // Eliminar documento anterior si existe
        if (usuario.comprobanteUrl) {
          try {
            await eliminarDocumento(usuario.comprobanteUrl);
          } catch (error) {
            console.warn('No se pudo eliminar documento anterior:', error);
          }
        }
      }

      // Actualizar usuario en Firestore
      if (Object.keys(actualizaciones).length > 0) {
        await actualizarUsuario(usuario.id!, actualizaciones);
      }

      sonnerToast.dismiss(toastId);
      sonnerToast.success('Documentos actualizados correctamente');
      
      // Limpiar archivos seleccionados
      setIdentificacionFile(null);
      setComprobanteFile(null);
      setIdentificacionPreview(null);
      setComprobantePreview(null);
      
      // Recargar documentos
      onUsuarioActualizado();
      
    } catch (error) {
      console.error('Error subiendo documentos:', error);
      sonnerToast.dismiss(toastId);
      sonnerToast.error('Error al actualizar documentos');
    } finally {
      setSubiendoDocumentos(false);
    }
  };

  // Aprobar usuario después de actualizar documentos
  const handleAprobarUsuario = async () => {
    setLoading(true);
    const toastId = sonnerToast.loading('Aprobando usuario...');

    try {
      await actualizarUsuario(usuario.id!, { status: 'approved' });
      
      sonnerToast.dismiss(toastId);
      sonnerToast.success('Usuario aprobado correctamente');
      
      onUsuarioActualizado();
      onClose();
      
    } catch (error) {
      console.error('Error aprobando usuario:', error);
      sonnerToast.dismiss(toastId);
      sonnerToast.error('Error al aprobar usuario');
    } finally {
      setLoading(false);
    }
  };

  const isOwner = (usuario as any).isOwner || usuario.ownershipStatus === 'own';

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5 text-blue-600" />
          Actualizar Documentos
        </DialogTitle>
        <DialogDescription>
          Actualiza los documentos del usuario pendiente y aprueba su solicitud
        </DialogDescription>
      </DialogHeader>

      {/* Información del usuario */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información del Usuario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {usuario.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">
                {usuario.fullName} {usuario.paternalLastName} {usuario.maternalLastName}
              </h3>
              <p className="text-sm text-gray-600">{usuario.email}</p>
              <Badge variant={isOwner ? "default" : "secondary"}>
                {isOwner ? "Propietario" : "Inquilino"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentos actuales */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos Actuales
          </CardTitle>
          <CardDescription>
            Documentos que el usuario subió originalmente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Identificación */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileImage className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium">Identificación Oficial</h4>
              </div>
              {cargandoDocumentos ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Cargando...</span>
                </div>
              ) : identificacionUrl ? (
                <div className="space-y-2">
                  <TransformWrapper initialScale={1} minScale={1} maxScale={3}>
                    {({ zoomIn, zoomOut, resetTransform }) => (
                      <>
                        <div className="flex gap-1 justify-end">
                          <Button variant="outline" size="sm" onClick={() => zoomIn()}>+</Button>
                          <Button variant="outline" size="sm" onClick={() => zoomOut()}>-</Button>
                          <Button variant="outline" size="sm" onClick={() => resetTransform()}>⟳</Button>
                        </div>
                        <div className="max-h-48 overflow-hidden rounded border">
                          <TransformComponent>
                            <img
                              src={identificacionUrl}
                              alt="Identificación actual"
                              className="w-full h-auto object-contain"
                            />
                          </TransformComponent>
                        </div>
                      </>
                    )}
                  </TransformWrapper>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <XCircle className="h-8 w-8" />
                  <span className="ml-2">No disponible</span>
                </div>
              )}
            </div>

            {/* Comprobante (solo para propietarios) */}
            {isOwner && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium">Comprobante de Domicilio</h4>
                </div>
                {cargandoDocumentos ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Cargando...</span>
                  </div>
                ) : comprobanteUrl ? (
                  <div className="space-y-2">
                    <TransformWrapper initialScale={1} minScale={1} maxScale={3}>
                      {({ zoomIn, zoomOut, resetTransform }) => (
                        <>
                          <div className="flex gap-1 justify-end">
                            <Button variant="outline" size="sm" onClick={() => zoomIn()}>+</Button>
                            <Button variant="outline" size="sm" onClick={() => zoomOut()}>-</Button>
                            <Button variant="outline" size="sm" onClick={() => resetTransform()}>⟳</Button>
                          </div>
                          <div className="max-h-48 overflow-hidden rounded border">
                            <TransformComponent>
                              <img
                                src={comprobanteUrl}
                                alt="Comprobante actual"
                                className="w-full h-auto object-contain"
                              />
                            </TransformComponent>
                          </div>
                        </>
                      )}
                    </TransformWrapper>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <XCircle className="h-8 w-8" />
                    <span className="ml-2">No disponible</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subir nuevos documentos */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Nuevos Documentos
          </CardTitle>
          <CardDescription>
            Selecciona los documentos corregidos para reemplazar los actuales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nueva identificación */}
            <div className="space-y-3">
              <Label htmlFor="identificacion">Nueva Identificación</Label>
              <Input
                id="identificacion"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('identificacion', e.target.files?.[0] || null)}
              />
              {identificacionPreview && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-2">Vista previa:</p>
                  <img
                    src={identificacionPreview}
                    alt="Vista previa identificación"
                    className="max-h-32 rounded border"
                  />
                </div>
              )}
            </div>

            {/* Nuevo comprobante (solo para propietarios) */}
            {isOwner && (
              <div className="space-y-3">
                <Label htmlFor="comprobante">Nuevo Comprobante de Domicilio</Label>
                <Input
                  id="comprobante"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('comprobante', e.target.files?.[0] || null)}
                />
                {comprobantePreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Vista previa:</p>
                    <img
                      src={comprobantePreview}
                      alt="Vista previa comprobante"
                      className="max-h-32 rounded border"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Button 
              onClick={subirDocumentos}
              disabled={subiendoDocumentos || (!identificacionFile && !comprobanteFile)}
              className="flex items-center gap-2"
            >
              {subiendoDocumentos ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {subiendoDocumentos ? 'Actualizando...' : 'Actualizar Documentos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={handleAprobarUsuario}
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          {loading ? 'Aprobando...' : 'Aprobar Usuario'}
        </Button>
      </div>
    </DialogContent>
  );
};

export default ActualizarDocumentosDialog; 