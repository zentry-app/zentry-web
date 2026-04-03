import React, { useState, useCallback, useMemo } from 'react';
import { eliminarUsuario } from '@/lib/firebase/firestore';
import { toast as sonnerToast } from 'sonner';
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
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Usuario } from '@/lib/firebase/firestore';
import {
  RefreshCw, 
  Wifi, 
  Mail, 
  Phone, 
  Building, 
  Home, 
  FileText, 
  XCircle, 
  Clock, 
  CheckCircle, 
  MoreHorizontal, 
  Trash,
  Trash2,
  AlertTriangle,
  Edit
} from "lucide-react";
import RevisarDocumentosDialog from './RevisarDocumentosDialog';
import ActualizarDocumentosDialog from './ActualizarDocumentosDialog';
import { Dialog } from "@/components/ui/dialog";

interface ContenidoPestanaPendientesProps {
  usuariosPendientes: Usuario[];
  isLoading: boolean;
  actualizacionEnTiempoReal: boolean;
  getResidencialIdFromUser: (usuario: Usuario) => string;
  getResidencialNombre: (id: string) => string;
  getRolBadge: (rol: Usuario['role']) => React.ReactNode;
  mostrarDocumento: (ruta: string, nombre: string) => void;
  handleRechazarUsuario: (id: string) => Promise<void>;
  handleAprobarUsuario: (id: string) => Promise<void>;
  handleEliminarUsuario?: (usuario: Usuario) => void; // Ahora opcional, no lo usamos
  onEliminarMultiplesUsuarios?: (usuarios: Usuario[]) => void; // Opcional, no lo usamos
  renderPagination: () => React.ReactNode;
  todosLosUsuarios: Usuario[]; // <-- nuevo prop
  onUsuarioActualizado?: () => void; // Callback para refrescar la lista después de aprobar/rechazar
}

const ContenidoPestanaPendientes: React.FC<ContenidoPestanaPendientesProps> = ({
  usuariosPendientes,
  isLoading,
  actualizacionEnTiempoReal,
  getResidencialIdFromUser,
  getResidencialNombre,
  getRolBadge,
  mostrarDocumento,
  handleRechazarUsuario,
  handleAprobarUsuario,
  handleEliminarUsuario,
  onEliminarMultiplesUsuarios,
  renderPagination,
  todosLosUsuarios, // <-- nuevo prop
  onUsuarioActualizado // <-- nuevo prop
}) => {
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<Set<string>>(new Set());
  const [mostrarDialogoEliminarMultiples, setMostrarDialogoEliminarMultiples] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);
  const [eliminandoUsuario, setEliminandoUsuario] = useState(false);

  // 1. Estado para el modal de revisión de documentos
  const [usuarioParaRevision, setUsuarioParaRevision] = useState<Usuario | null>(null);
  const [mostrarRevisionDocumentos, setMostrarRevisionDocumentos] = useState(false);

  // 2. Estado para el modal de actualización de documentos
  const [usuarioParaActualizar, setUsuarioParaActualizar] = useState<Usuario | null>(null);
  const [mostrarActualizarDocumentos, setMostrarActualizarDocumentos] = useState(false);

  // Manejar selección individual
  const handleSeleccionarUsuario = useCallback((usuarioId: string, seleccionado: boolean) => {
    setUsuariosSeleccionados(prev => {
      const nuevo = new Set(prev);
      if (seleccionado) {
        nuevo.add(usuarioId);
      } else {
        nuevo.delete(usuarioId);
      }
      return nuevo;
    });
  }, []);

  // Manejar seleccionar todos
  const handleSeleccionarTodos = useCallback((seleccionado: boolean) => {
    if (seleccionado) {
      const todosLosIds = new Set(usuariosPendientes.map(u => u.id!).filter(Boolean));
      setUsuariosSeleccionados(todosLosIds);
    } else {
      setUsuariosSeleccionados(new Set());
    }
  }, [usuariosPendientes]);

  // Verificar si todos están seleccionados
  const todosSonSeleccionados = useMemo(() => {
    return usuariosPendientes.length > 0 && 
           usuariosPendientes.every(u => u.id && usuariosSeleccionados.has(u.id));
  }, [usuariosPendientes, usuariosSeleccionados]);

  // Verificar si algunos están seleccionados
  const algunosSonSeleccionados = useMemo(() => {
    return usuariosSeleccionados.size > 0 && !todosSonSeleccionados;
  }, [usuariosSeleccionados.size, todosSonSeleccionados]);

  // Obtener usuarios seleccionados
  const obtenerUsuariosSeleccionados = useCallback(() => {
    return usuariosPendientes.filter(u => u.id && usuariosSeleccionados.has(u.id));
  }, [usuariosPendientes, usuariosSeleccionados]);

  // Manejar eliminación múltiple
  const handleEliminarSeleccionados = useCallback(() => {
    setMostrarDialogoEliminarMultiples(true);
  }, []);

  const confirmarEliminarMultiples = useCallback(async () => {
    const usuariosAEliminar = obtenerUsuariosSeleccionados();
    
    if (usuariosAEliminar.length === 0) {
      setMostrarDialogoEliminarMultiples(false);
      return;
    }

    const toastId = sonnerToast.loading(`Eliminando ${usuariosAEliminar.length} solicitudes...`);
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
        setUsuariosSeleccionados(new Set()); // Limpiar selección
        
        sonnerToast.dismiss(toastId);
        sonnerToast.success(`${usuariosAEliminar.length} solicitudes eliminadas correctamente`);
      }, 300);

    } catch (error) {
      console.error('❌ Error eliminando solicitudes múltiples:', error);
      sonnerToast.dismiss(toastId);
      sonnerToast.error(`Error al eliminar solicitudes: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setTimeout(() => setEliminandoUsuario(false), 300);
    }

    setMostrarDialogoEliminarMultiples(false);
  }, [obtenerUsuariosSeleccionados]);

  // Función optimizada para eliminación individual sin trabarse
  const handleEliminarUsuarioLocal = useCallback((usuario: Usuario) => {
    if (!usuario.id) {
      sonnerToast.error("No se puede eliminar el usuario: ID no válido");
      return;
    }
    setUsuarioAEliminar(usuario);
  }, []);

  const confirmarEliminarUsuario = useCallback(() => {
    if (!usuarioAEliminar || !usuarioAEliminar.id) {
      console.error("⚠️ No hay usuario válido para eliminar");
      return;
    }
    
    const userId = usuarioAEliminar.id;
    const userName = usuarioAEliminar.fullName || "Usuario";
    const usuarioCompleto = { ...usuarioAEliminar }; // Clonar para evitar referencias perdidas
    
    // Cerrar el diálogo inmediatamente
    setUsuarioAEliminar(null);
    
    // Mostrar toast de carga
    const toastId = sonnerToast.loading(`Eliminando solicitud...`);
    setEliminandoUsuario(true);
    
    // Eliminar usuario de forma optimizada con mejor manejo de errores
    eliminarUsuario(userId)
      .then(() => {
        console.log(`✅ Usuario ${userId} eliminado exitosamente`);
        
        setTimeout(() => {
          try {
            // Actualizar estado local inmediatamente, sin recargar desde servidor
            setUsuariosSeleccionados(prev => {
              const nuevo = new Set(prev);
              nuevo.delete(userId);
              return nuevo;
            });
            
                      // No notificar al componente padre ya que manejamos la eliminación localmente
          // La eliminación exitosa se refleja automáticamente por los listeners en tiempo real
            
            sonnerToast.dismiss(toastId);
            sonnerToast.success(`Solicitud de ${userName} eliminada correctamente`);
          } catch (stateError) {
            console.error("❌ Error actualizando estado local:", stateError);
            sonnerToast.dismiss(toastId);
            sonnerToast.success(`Solicitud eliminada (actualiza la página si no se refleja)`);
          }
        }, 300);
      })
      .catch(error => {
        console.error(`❌ Error eliminando solicitud:`, error);
        sonnerToast.dismiss(toastId);
        
        // Manejo de errores específicos
        if (error.message && error.message.includes("no encontrado")) {
          sonnerToast.warning(`La solicitud ya fue eliminada por otro usuario`);
          
                     // Actualizar estado local para reflejar que el usuario ya no existe
           setTimeout(() => {
             setUsuariosSeleccionados(prev => {
               const nuevo = new Set(prev);
               nuevo.delete(userId);
               return nuevo;
             });
             
             // No notificar al componente padre - el usuario ya no existe
           }, 100);
        } else {
          sonnerToast.error(`Error al eliminar solicitud: ${error.message || "Error desconocido"}`);
        }
      })
      .finally(() => {
        setTimeout(() => setEliminandoUsuario(false), 300);
      });
  }, [usuarioAEliminar]);

  // Limpiar selección cuando cambian los usuarios
  React.useEffect(() => {
    setUsuariosSeleccionados(new Set());
  }, [usuariosPendientes]);

  return (
    <>
      <Card>
        <CardHeader className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Solicitudes Pendientes</CardTitle>
              <CardDescription>
                {usuariosPendientes.length} solicitudes requieren tu aprobación
                {usuariosSeleccionados.size > 0 && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    • {usuariosSeleccionados.size} seleccionado{usuariosSeleccionados.size !== 1 ? 's' : ''}
                  </span>
                )}
                {actualizacionEnTiempoReal && (
                  <span className="flex items-center text-xs text-green-500 mt-1">
                    <Wifi className="h-3 w-3 mr-1 animate-pulse" />
                    Actualizado en tiempo real
                  </span>
                )}
              </CardDescription>
            </div>
            
            {/* Controles de selección múltiple */}
            {usuariosSeleccionados.size > 0 && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleEliminarSeleccionados}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar seleccionados ({usuariosSeleccionados.size})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={todosSonSeleccionados}
                      onCheckedChange={handleSeleccionarTodos}
                      ref={(ref) => {
                        if (ref && 'indeterminate' in ref) {
                          (ref as any).indeterminate = algunosSonSeleccionados;
                        }
                      }}
                      aria-label="Seleccionar todas las solicitudes"
                    />
                  </TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Información de Contacto</TableHead>
                  <TableHead>Residencial</TableHead>
                  <TableHead>Domicilio / Casa</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha de Solicitud</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Cargando solicitudes...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : usuariosPendientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      <p className="text-muted-foreground">No hay solicitudes pendientes</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  usuariosPendientes.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <Checkbox
                          checked={usuario.id ? usuariosSeleccionados.has(usuario.id) : false}
                          onCheckedChange={(checked) => {
                            if (usuario.id) {
                              handleSeleccionarUsuario(usuario.id, checked as boolean);
                            }
                          }}
                          aria-label={`Seleccionar solicitud de ${usuario.fullName}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" />
                            <AvatarFallback>
                              {usuario.fullName?.charAt(0)}{usuario.paternalLastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{usuario.fullName} {usuario.paternalLastName} {usuario.maternalLastName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{usuario.email}</span>
                          </div>
                          {usuario.telefono && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{usuario.telefono}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getResidencialIdFromUser(usuario) ? (
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span>{getResidencialNombre(getResidencialIdFromUser(usuario))}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No asignado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {(usuario as any).calle ? (
                            <div className="flex items-center gap-1">
                              <Home className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {(usuario as any).calle}
                                {(usuario as any).houseNumber ? ` #${(usuario as any).houseNumber}` : ''}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Dirección no disponible</span>
                          )}
                          {usuario.houseID && (
                            <span className="text-sm text-muted-foreground">Casa: {usuario.houseID}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getRolBadge(usuario.role)}</TableCell>
                      <TableCell>
                        {usuario.createdAt ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {usuario.createdAt.toDate().toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No disponible</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 gap-1"
                            onClick={() => {
                              setUsuarioParaRevision(usuario);
                              setMostrarRevisionDocumentos(true);
                            }}
                          >
                            <FileText className="h-3 w-3" />
                            Revisar solicitud
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => {
                                  setUsuarioParaActualizar(usuario);
                                  setMostrarActualizarDocumentos(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Actualizar Documentos
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleEliminarUsuarioLocal(usuario)}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {renderPagination()}

      {/* Diálogo de confirmación para eliminación individual */}
      <AlertDialog open={!!usuarioAEliminar} onOpenChange={() => setUsuarioAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar eliminación de solicitud
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar la solicitud pendiente de{' '}
              <strong>{usuarioAEliminar?.fullName || 'este usuario'}</strong>?
              <br />
              <br />
              Esta acción no se puede deshacer y la solicitud se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminandoUsuario}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmarEliminarUsuario}
              disabled={eliminandoUsuario}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminandoUsuario ? "Eliminando..." : "Eliminar solicitud"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación para eliminación múltiple */}
      <AlertDialog open={mostrarDialogoEliminarMultiples} onOpenChange={setMostrarDialogoEliminarMultiples}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar eliminación múltiple de solicitudes
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar {usuariosSeleccionados.size} solicitud{usuariosSeleccionados.size !== 1 ? 'es' : ''} pendiente{usuariosSeleccionados.size !== 1 ? 's' : ''}?
              <br />
              <br />
              <strong>Solicitudes a eliminar:</strong>
              <ul className="mt-2 space-y-1">
                {obtenerUsuariosSeleccionados().map(usuario => (
                  <li key={usuario.id} className="text-sm">
                    • {usuario.fullName || 'Sin nombre'} {usuario.paternalLastName || ''} ({usuario.email || 'Sin email'})
                  </li>
                ))}
              </ul>
              <br />
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmarEliminarMultiples}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar {usuariosSeleccionados.size} solicitud{usuariosSeleccionados.size !== 1 ? 'es' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL DE REVISIÓN DE DOCUMENTOS */}
      {mostrarRevisionDocumentos && usuarioParaRevision && (
        <Dialog open={mostrarRevisionDocumentos} onOpenChange={(open) => {
          if (!open) {
            setMostrarRevisionDocumentos(false);
            setUsuarioParaRevision(null);
          }
        }}>
          <RevisarDocumentosDialog
            usuario={usuarioParaRevision}
            onClose={() => {
              setMostrarRevisionDocumentos(false);
              setUsuarioParaRevision(null);
            }}
            todosLosUsuarios={todosLosUsuarios}
            getResidencialNombre={getResidencialNombre}
            onAprobarUsuario={async (usuario) => {
              await handleAprobarUsuario(usuario.id!);
              onUsuarioActualizado?.();
            }}
            onRechazarUsuario={async (usuario, motivo) => {
              await handleRechazarUsuario(usuario.id!);
              onUsuarioActualizado?.();
            }}
          />
        </Dialog>
      )}

      {/* MODAL DE ACTUALIZACIÓN DE DOCUMENTOS */}
      {mostrarActualizarDocumentos && usuarioParaActualizar && (
        <Dialog open={mostrarActualizarDocumentos} onOpenChange={(open) => {
          if (!open) {
            setMostrarActualizarDocumentos(false);
            setUsuarioParaActualizar(null);
          }
        }}>
          <ActualizarDocumentosDialog
            usuario={usuarioParaActualizar}
            onClose={() => {
              setMostrarActualizarDocumentos(false);
              setUsuarioParaActualizar(null);
            }}
            onUsuarioActualizado={() => {
              onUsuarioActualizado?.();
            }}
          />
        </Dialog>
      )}
    </>
  );
};

export default ContenidoPestanaPendientes; 