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
  XCircle, 
  Clock, 
  CheckCircle, 
  MoreHorizontal, 
  Trash,
  Trash2,
  AlertTriangle,
  Edit,
  Eye,
  FileText
} from "lucide-react";
import EditarUsuarioRechazadoDialog from './EditarUsuarioRechazadoDialog';
import { Dialog } from "@/components/ui/dialog";

interface ContenidoPestanaRechazadosProps {
  usuariosRechazados: Usuario[];
  isLoading: boolean;
  actualizacionEnTiempoReal: boolean;
  getResidencialIdFromUser: (usuario: Usuario) => string;
  getResidencialNombre: (id: string) => string;
  getRolBadge: (rol: Usuario['role']) => React.ReactNode;
  mostrarDocumento: (ruta: string, nombre: string) => void;
  handleEliminarUsuario?: (usuario: Usuario) => void;
  onEliminarMultiplesUsuarios?: (usuarios: Usuario[]) => void;
  renderPagination: () => React.ReactNode;
  todosLosUsuarios: Usuario[];
  onUsuarioActualizado: () => void; // Callback para refrescar la lista después de editar
}

const ContenidoPestanaRechazados: React.FC<ContenidoPestanaRechazadosProps> = ({
  usuariosRechazados,
  isLoading,
  actualizacionEnTiempoReal,
  getResidencialIdFromUser,
  getResidencialNombre,
  getRolBadge,
  mostrarDocumento,
  handleEliminarUsuario,
  onEliminarMultiplesUsuarios,
  renderPagination,
  todosLosUsuarios,
  onUsuarioActualizado
}) => {
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<Set<string>>(new Set());
  const [mostrarDialogoEliminarMultiples, setMostrarDialogoEliminarMultiples] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);
  const [eliminandoUsuario, setEliminandoUsuario] = useState(false);

  // Estado para el modal de edición
  const [usuarioParaEdicion, setUsuarioParaEdicion] = useState<Usuario | null>(null);
  const [mostrarEdicionUsuario, setMostrarEdicionUsuario] = useState(false);

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
      const todosLosIds = new Set(usuariosRechazados.map(u => u.id!).filter(Boolean));
      setUsuariosSeleccionados(todosLosIds);
    } else {
      setUsuariosSeleccionados(new Set());
    }
  }, [usuariosRechazados]);

  // Verificar si todos están seleccionados
  const todosSonSeleccionados = useMemo(() => {
    return usuariosRechazados.length > 0 && 
           usuariosRechazados.every(u => u.id && usuariosSeleccionados.has(u.id));
  }, [usuariosRechazados, usuariosSeleccionados]);

  // Verificar si algunos están seleccionados
  const algunosSonSeleccionados = useMemo(() => {
    return usuariosSeleccionados.size > 0 && !todosSonSeleccionados;
  }, [usuariosSeleccionados.size, todosSonSeleccionados]);

  // Obtener usuarios seleccionados
  const obtenerUsuariosSeleccionados = useCallback(() => {
    return usuariosRechazados.filter(u => u.id && usuariosSeleccionados.has(u.id));
  }, [usuariosRechazados, usuariosSeleccionados]);

  // Manejar eliminación múltiple
  const handleEliminarSeleccionados = useCallback(() => {
    setMostrarDialogoEliminarMultiples(true);
  }, []);

  const confirmarEliminarMultiples = useCallback(async () => {
    const usuariosAEliminar = obtenerUsuariosSeleccionados();
    if (usuariosAEliminar.length > 0) {
      try {
        for (const usuario of usuariosAEliminar) {
          if (usuario.id) {
            await eliminarUsuario(usuario.id);
          }
        }
        sonnerToast.success(`${usuariosAEliminar.length} usuario${usuariosAEliminar.length !== 1 ? 's' : ''} eliminado${usuariosAEliminar.length !== 1 ? 's' : ''} correctamente`);
        setUsuariosSeleccionados(new Set());
        onUsuarioActualizado(); // Refrescar la lista
      } catch (error) {
        sonnerToast.error('Error al eliminar usuarios');
      }
    }
    setMostrarDialogoEliminarMultiples(false);
  }, [obtenerUsuariosSeleccionados, onUsuarioActualizado]);

  // Manejar eliminación individual
  const handleEliminarIndividual = useCallback(async (usuario: Usuario) => {
    if (!usuario.id) return;
    
    setEliminandoUsuario(true);
    try {
      await eliminarUsuario(usuario.id);
      sonnerToast.success('Usuario eliminado correctamente');
      onUsuarioActualizado(); // Refrescar la lista
    } catch (error) {
      sonnerToast.error('Error al eliminar usuario');
    } finally {
      setEliminandoUsuario(false);
      setUsuarioAEliminar(null);
    }
  }, [onUsuarioActualizado]);

  // Abrir modal de edición
  const handleEditarUsuario = useCallback((usuario: Usuario) => {
    setUsuarioParaEdicion(usuario);
    setMostrarEdicionUsuario(true);
  }, []);

  // Cerrar modal de edición
  const handleCerrarEdicion = useCallback(() => {
    setUsuarioParaEdicion(null);
    setMostrarEdicionUsuario(false);
  }, []);

  // Formatear fecha
  const formatearFecha = (timestamp: any) => {
    if (!timestamp) return "No disponible";
    const fecha = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Limpiar selección cuando cambian los usuarios
  React.useEffect(() => {
    setUsuariosSeleccionados(new Set());
  }, [usuariosRechazados]);

  return (
    <>
      <Card>
        <CardHeader className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Solicitudes Rechazadas</CardTitle>
              <CardDescription>
                {usuariosRechazados.length} solicitudes rechazadas que pueden ser corregidas
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
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : usuariosRechazados.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground">No hay solicitudes rechazadas</p>
              <p className="text-xs text-muted-foreground mt-1">¡Todas las solicitudes han sido procesadas correctamente!</p>
            </div>
          ) : (
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
                        aria-label="Seleccionar todas las solicitudes rechazadas"
                      />
                    </TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Información de Contacto</TableHead>
                    <TableHead>Residencial</TableHead>
                    <TableHead>Domicilio / Casa</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Motivo de Rechazo</TableHead>
                    <TableHead>Fecha de Rechazo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosRechazados.map((usuario) => (
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
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[200px]" title={usuario.email}>{usuario.email}</span>
                          </div>
                          {usuario.telefono && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{usuario.telefono}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Building className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[150px]" title={getResidencialNombre(getResidencialIdFromUser(usuario))}>
                            {getResidencialNombre(getResidencialIdFromUser(usuario))}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Home className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {usuario.calle ? `${usuario.calle} ` : ''}
                            {usuario.houseNumber ? `#${usuario.houseNumber}` : 'Sin número'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getRolBadge(usuario.role)}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                            {usuario.rejectionReason || 'Sin motivo especificado'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatearFecha(usuario.updatedAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditarUsuario(usuario)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar y corregir
                            </DropdownMenuItem>
                            {(usuario as any).identificacionPath && (
                              <DropdownMenuItem onClick={() => mostrarDocumento((usuario as any).identificacionPath, 'Identificación')}>
                                <FileText className="mr-2 h-4 w-4" />
                                Ver identificación
                              </DropdownMenuItem>
                            )}
                            {(usuario as any).comprobantePath && (
                              <DropdownMenuItem onClick={() => mostrarDocumento((usuario as any).comprobantePath, 'Comprobante')}>
                                <FileText className="mr-2 h-4 w-4" />
                                Ver comprobante
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => setUsuarioAEliminar(usuario)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {renderPagination()}

      {/* Modal de edición */}
      <Dialog open={mostrarEdicionUsuario} onOpenChange={setMostrarEdicionUsuario}>
        {usuarioParaEdicion && (
          <EditarUsuarioRechazadoDialog
            usuario={usuarioParaEdicion}
            onClose={handleCerrarEdicion}
            todosLosUsuarios={todosLosUsuarios}
            getResidencialNombre={getResidencialNombre}
            onUsuarioActualizado={onUsuarioActualizado}
          />
        )}
      </Dialog>

      {/* Diálogo de confirmación para eliminación múltiple */}
      <AlertDialog open={mostrarDialogoEliminarMultiples} onOpenChange={setMostrarDialogoEliminarMultiples}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar eliminación múltiple
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar {usuariosSeleccionados.size} usuario{usuariosSeleccionados.size !== 1 ? 's' : ''} rechazado{usuariosSeleccionados.size !== 1 ? 's' : ''}?
              <br />
              <br />
              <strong>Usuarios a eliminar:</strong>
              <ul className="mt-2 space-y-1">
                {obtenerUsuariosSeleccionados().map(usuario => (
                  <li key={usuario.id} className="text-sm">
                    • {usuario.fullName || 'Sin nombre'} ({usuario.email || 'Sin email'})
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
              Eliminar {usuariosSeleccionados.size} usuario{usuariosSeleccionados.size !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación para eliminación individual */}
      <AlertDialog open={!!usuarioAEliminar} onOpenChange={() => setUsuarioAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar eliminación
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a <strong>{usuarioAEliminar?.fullName}</strong>?
              <br />
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => usuarioAEliminar && handleEliminarIndividual(usuarioAEliminar)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={eliminandoUsuario}
            >
              {eliminandoUsuario ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ContenidoPestanaRechazados; 