import React from 'react';
import { Dialog as HeadlessDialog } from '@headlessui/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from 'lucide-react';
import { Usuario } from '@/lib/firebase/firestore'; // Asumiendo que la interfaz Usuario está aquí
import { Timestamp } from 'firebase/firestore'; // Para el tipo Timestamp

// Props que el componente DetallesUsuarioDialog necesitará
interface DetallesUsuarioDialogProps {
  usuarioSeleccionado: Usuario | null;
  showDialog: boolean;
  onClose: () => void;
  getResidencialNombre: (id: string) => string;
  getEstadoBadge: (estado: Usuario['status']) => React.ReactNode;
  getRolBadge: (rol: Usuario['role']) => React.ReactNode;
  mostrarDocumento: (ruta: string, nombre: string) => void;
}

const DetallesUsuarioDialog: React.FC<DetallesUsuarioDialogProps> = ({
  usuarioSeleccionado,
  showDialog,
  onClose,
  getResidencialNombre,
  getEstadoBadge,
  getRolBadge,
  mostrarDocumento,
}) => {
  if (!usuarioSeleccionado) return null;

  const formatearFecha = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return "No disponible";
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  const notificationSettings = usuarioSeleccionado.notificationSettings || {
    doNotDisturb: false,
    doNotDisturbEnd: "",
    doNotDisturbStart: "",
    emergencies: true,
    events: true,
    packages: true,
    visitors: true
  };

  return (
    <HeadlessDialog
      as="div"
      open={showDialog}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <HeadlessDialog.Panel className="mx-auto w-full max-w-3xl rounded-lg bg-white dark:bg-gray-800 p-4 shadow-xl h-[90vh] flex flex-col">
          <HeadlessDialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 mb-2">
            Detalles del Usuario
          </HeadlessDialog.Title>
          <div className="overflow-y-auto flex-1 pr-1 -mr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              {/* Información básica */}
              <Card className="col-span-1 md:col-span-2">
                <CardHeader className="p-3">
                  <CardTitle className="text-base">Información básica</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Nombre completo:</p>
                    <p className="text-sm">{usuarioSeleccionado.fullName || "No disponible"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Correo electrónico:</p>
                    <p className="text-sm break-all">{usuarioSeleccionado.email || "No disponible"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Apellido paterno:</p>
                    <p className="text-sm">{usuarioSeleccionado.paternalLastName || "No disponible"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Apellido materno:</p>
                    <p className="text-sm">{usuarioSeleccionado.maternalLastName || "No disponible"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Teléfono:</p>
                    <p className="text-sm">{usuarioSeleccionado.telefono || "No disponible"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Rol:</p>
                    <p className="text-sm">{getRolBadge(usuarioSeleccionado.role)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Estado:</p>
                    <p className="text-sm">{getEstadoBadge(usuarioSeleccionado.status)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Método de registro:</p>
                    <p className="text-sm">{usuarioSeleccionado.registrationMethod || "No disponible"}</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Información de residencia */}
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-base">Información de residencia</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Residencial:</p>
                    <p className="text-sm">{getResidencialNombre(usuarioSeleccionado.residencialID)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">ID Residencial:</p>
                    <p className="text-sm break-all">{usuarioSeleccionado.residencialID || "No disponible"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">ID de casa:</p>
                    <p className="text-sm">{usuarioSeleccionado.houseID || "No disponible"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Calle:</p>
                    <p className="text-sm">{usuarioSeleccionado.calle || "No disponible"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Número de casa:</p>
                    <p className="text-sm">{usuarioSeleccionado.houseNumber || "No disponible"}</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Información técnica */}
              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-base">Información técnica</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">UID:</p>
                    <p className="text-sm break-all">{usuarioSeleccionado.uid || "No disponible"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Biométrico habilitado:</p>
                    <p className="text-sm">{usuarioSeleccionado.biometricEnabled ? "Sí" : "No"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Token FCM:</p>
                    <p className="text-sm break-all line-clamp-2">{usuarioSeleccionado.fcmToken || "No disponible"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Última actualización del token:</p>
                    <p className="text-sm">{formatearFecha(usuarioSeleccionado.tokenUpdatedAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Notificaciones no leídas:</p>
                    <p className="text-sm">{usuarioSeleccionado.unreadNotifications?.toString() || "0"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Fecha de creación:</p>
                    <p className="text-sm">{formatearFecha(usuarioSeleccionado.createdAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Fecha de actualización:</p>
                    <p className="text-sm">{formatearFecha(usuarioSeleccionado.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Configuración de notificaciones */}
              <Card className="col-span-1 md:col-span-2">
                <CardHeader className="p-3">
                  <CardTitle className="text-base">Configuración de notificaciones</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">No molestar:</p>
                    <p className="text-sm">{notificationSettings.doNotDisturb ? "Activado" : "Desactivado"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Horario de no molestar:</p>
                    <p className="text-sm">
                      {notificationSettings.doNotDisturbStart && notificationSettings.doNotDisturbEnd 
                        ? `${notificationSettings.doNotDisturbStart} - ${notificationSettings.doNotDisturbEnd}` 
                        : "No configurado"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Emergencias:</p>
                    <p className="text-sm">{notificationSettings.emergencies ? "Activadas" : "Desactivadas"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Eventos:</p>
                    <p className="text-sm">{notificationSettings.events ? "Activados" : "Desactivados"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Paquetería:</p>
                    <p className="text-sm">{notificationSettings.packages ? "Activada" : "Desactivada"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Visitantes:</p>
                    <p className="text-sm">{notificationSettings.visitors ? "Activados" : "Desactivados"}</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Tópicos Suscritos */}
                <Card className="col-span-1 md:col-span-2">
                  <CardHeader className="p-3">
                    <CardTitle className="text-base">Tópicos Suscritos</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    {(usuarioSeleccionado as any)?.topics && (usuarioSeleccionado as any)?.topics.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {((usuarioSeleccionado as any)?.topics || []).map((topic: string, index: number) => (
                          <div key={index} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                            <p className="text-sm break-all">{topic}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground p-2">
                        No hay información de tópicos suscritos disponible
                      </div>
                    )}
                  </CardContent>
                </Card>

              {/* Documentos */}
              {(usuarioSeleccionado.identificacionUrl || usuarioSeleccionado.comprobanteUrl) && (
                <Card className="col-span-1 md:col-span-2">
                  <CardHeader className="p-3">
                    <CardTitle className="text-base">Documentos</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {usuarioSeleccionado.identificacionUrl && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Identificación:</p>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => mostrarDocumento(usuarioSeleccionado.identificacionUrl || "", "Identificación")}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver identificación
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {usuarioSeleccionado.comprobanteUrl && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Comprobante de domicilio:</p>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => mostrarDocumento(usuarioSeleccionado.comprobanteUrl || "", "Comprobante")}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver comprobante
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-2 border-t flex justify-end">
            <Button onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </HeadlessDialog.Panel>
      </div>
    </HeadlessDialog>
  );
};

export default DetallesUsuarioDialog; 