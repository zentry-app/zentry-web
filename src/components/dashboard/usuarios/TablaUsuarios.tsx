import React, { memo, useMemo, useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Usuario, cambiarEstadoMoroso } from '@/lib/firebase/firestore';
import { Eye, RefreshCcw, RefreshCw, Trash2, Users, AlertTriangle, Edit, Home, Building, User, ArrowUpDown, ArrowUp, ArrowDown, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
import { Dialog } from "@/components/ui/dialog";
import VerDetallesUsuarioAprobadoDialog from './VerDetallesUsuarioAprobadoDialog';

interface TablaUsuariosProps {
  usuarios: Usuario[];
  titulo: string;
  isLoading: boolean;
  onVerDetalles: (usuario: Usuario) => void;
  onEditarUsuario: (usuario: Usuario) => void;
  onEliminarUsuario: (usuario: Usuario) => void;
  onEliminarMultiplesUsuarios?: (usuarios: Usuario[]) => void;
  actualizacionEnTiempoReal: boolean;
  getRolBadge: (rol: Usuario['role']) => React.ReactNode;
  getResidencialNombre: (id: string) => string;
  getEstadoBadge: (estado: Usuario['status']) => React.ReactNode;
  disableInternalPagination?: boolean;
  filterCalle?: string;
  onFilterCalleChange?: (value: string) => void;
  mostrarColumnaMoroso?: boolean;
  onCambiarEstadoMoroso?: (usuarioId: string, nuevoEstado: boolean) => void;
  totalUsuarios?: number; // Total de usuarios sin paginación para mostrar "X de Y usuarios"
  tipoVista?: 'residentes' | 'seguridad' | 'administradores'; // Controla qué columnas mostrar
}

type SortField = 'nombre' | 'email' | 'residencial' | 'direccion' | 'rol' | 'estado' | 'moroso';
type SortDirection = 'asc' | 'desc';

const TablaUsuarios: React.FC<TablaUsuariosProps> = memo(({
  usuarios,
  titulo,
  isLoading,
  onVerDetalles,
  onEditarUsuario,
  onEliminarUsuario,
  onEliminarMultiplesUsuarios,
  actualizacionEnTiempoReal,
  getRolBadge,
  getResidencialNombre,
  getEstadoBadge,
  disableInternalPagination,
  filterCalle,
  onFilterCalleChange,
  mostrarColumnaMoroso = false,
  onCambiarEstadoMoroso,
  totalUsuarios,
  tipoVista = 'residentes'
}) => {
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<Set<string>>(new Set());
  const [mostrarDialogoEliminarMultiples, setMostrarDialogoEliminarMultiples] = useState(false);
  
  // Estado para el modal de detalles de usuario aprobado
  const [usuarioParaDetalles, setUsuarioParaDetalles] = useState<Usuario | null>(null);
  const [mostrarDetallesUsuario, setMostrarDetallesUsuario] = useState(false);

  // Estados para filtros y ordenamiento
  const [sortField, setSortField] = useState<SortField>('nombre');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filtroMorosos, setFiltroMorosos] = useState<'todos' | 'morosos' | 'noMorosos'>('todos');

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Función para obtener nombre completo
  const getNombreCompleto = (usuario: Usuario): string => {
    const nombre = usuario.fullName || '';
    const apellidoPaterno = usuario.paternalLastName || '';
    const apellidoMaterno = usuario.maternalLastName || '';
    
    const nombreCompleto = `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim();
    return nombreCompleto || 'Sin nombre';
  };

  // Función para obtener dirección formateada
  const getDireccionFormateada = (usuario: Usuario): string => {
    const calle = usuario.calle || '';
    const numero = usuario.houseNumber || '';
    
    if (calle && numero) {
      return `${calle} #${numero}`;
    } else if (calle) {
      return calle;
    } else if (numero) {
      return `#${numero}`;
    }
    return 'Sin dirección';
  };

  // Función para obtener tipo de usuario
  const getTipoUsuario = (usuario: Usuario): string => {
    if ((usuario as any).isOwner === true || usuario.ownershipStatus === 'own') {
      return 'Propietario';
    } else if (usuario.isPrimaryUser) {
      return 'Inquilino Principal';
    } else {
      return 'Inquilino Secundario';
    }
  };

  // Obtener calles únicas disponibles
  const callesDisponibles = useMemo(() => {
    const callesSet = new Set<string>();
    
    usuarios.forEach(usuario => {
      const calle = usuario.calle;
      if (calle && typeof calle === 'string' && calle.trim() !== '') {
        callesSet.add(calle);
      }
    });
    
    return Array.from(callesSet).sort();
  }, [usuarios]);

  // Función para manejar ordenamiento
  const handleSort = (field: SortField) => {
    // No permitir ordenamiento por campos que no están visibles según el tipo de vista
    if (field === 'moroso' && (!mostrarColumnaMoroso || tipoVista !== 'residentes')) {
      return;
    }
    if (field === 'direccion' && tipoVista !== 'residentes') {
      return;
    }
    if (field === 'rol' && tipoVista !== 'residentes') {
      return;
    }
    
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Función para obtener el ícono de ordenamiento
  const getSortIcon = (field: SortField) => {
    // No mostrar ícono de ordenamiento para campos que no están visibles según el tipo de vista
    if (field === 'moroso' && (!mostrarColumnaMoroso || tipoVista !== 'residentes')) {
      return null;
    }
    if (field === 'direccion' && tipoVista !== 'residentes') {
      return null;
    }
    if (field === 'rol' && tipoVista !== 'residentes') {
      return null;
    }
    
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  // Filtrar y ordenar usuarios
  const usuariosFiltradosYOrdenados = useMemo(() => {
    let usuariosFiltrados = usuarios;

    // Aplicar filtro de morosos - solo si mostrarColumnaMoroso es true
    if (mostrarColumnaMoroso) {
      if (filtroMorosos === 'morosos') {
        usuariosFiltrados = usuariosFiltrados.filter(usuario => usuario.isMoroso === true);
      } else if (filtroMorosos === 'noMorosos') {
        usuariosFiltrados = usuariosFiltrados.filter(usuario => usuario.isMoroso !== true);
      }
    }

    // Ordenar usuarios
    return usuariosFiltrados.sort((a, b) => {
      let aValue: string | boolean;
      let bValue: string | boolean;

      switch (sortField) {
        case 'nombre':
          aValue = getNombreCompleto(a).toLowerCase();
          bValue = getNombreCompleto(b).toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'residencial':
          aValue = getResidencialNombre(a.residencialID).toLowerCase();
          bValue = getResidencialNombre(b.residencialID).toLowerCase();
          break;
        case 'direccion':
          // Solo permitir ordenamiento por dirección si es vista de residentes
          if (tipoVista !== 'residentes') {
            aValue = '';
            bValue = '';
            break;
          }
          aValue = getDireccionFormateada(a).toLowerCase();
          bValue = getDireccionFormateada(b).toLowerCase();
          break;
        case 'rol':
          // Solo permitir ordenamiento por rol si es vista de residentes
          if (tipoVista !== 'residentes') {
            aValue = '';
            bValue = '';
            break;
          }
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        case 'estado':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'moroso':
          // Solo permitir ordenamiento por moroso si mostrarColumnaMoroso es true Y es vista de residentes
          if (!mostrarColumnaMoroso || tipoVista !== 'residentes') {
            aValue = '';
            bValue = '';
            break;
          }
          aValue = a.isMoroso || false;
          bValue = b.isMoroso || false;
          break;
        default:
          aValue = '';
          bValue = '';
      }

      // Manejar comparación especial para booleanos (moroso)
      if (sortField === 'moroso' && mostrarColumnaMoroso) {
        if (aValue === bValue) return 0;
        if (aValue === true) return sortDirection === 'asc' ? -1 : 1;
        return sortDirection === 'asc' ? 1 : -1;
      }

      // Comparación normal para strings
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [usuarios, sortField, sortDirection, filtroMorosos, getResidencialNombre]);

  // Calcular paginación
  const totalItems = usuariosFiltradosYOrdenados.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  // Si disableInternalPagination está habilitado, usar directamente los usuarios recibidos
  // Si no, aplicar paginación interna (SOLO para mostrar en la tabla)
  const currentUsers = disableInternalPagination 
    ? usuariosFiltradosYOrdenados 
    : usuariosFiltradosYOrdenados.slice(startIndex, endIndex);

  // Debug: Verificar que la paginación funcione correctamente
  useEffect(() => {
    console.log('🔍 DEBUG TABLA USUARIOS:', {
      disableInternalPagination,
      totalItems,
      itemsPerPage,
      totalPages,
      currentPage,
      startIndex,
      endIndex,
      currentUsersLength: currentUsers.length,
      usuariosFiltradosYOrdenadosLength: usuariosFiltradosYOrdenados.length,
      usuariosRecibidosLength: usuarios.length
    });
  }, [disableInternalPagination, totalItems, itemsPerPage, totalPages, currentPage, startIndex, endIndex, currentUsers.length, usuariosFiltradosYOrdenados.length, usuarios.length]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [sortField, sortDirection, filtroMorosos]);

  // Resetear ordenamiento cuando cambia el tipo de vista para evitar ordenar por campos no visibles
  useEffect(() => {
    if (tipoVista !== 'residentes') {
      if (sortField === 'direccion' || sortField === 'rol' || sortField === 'moroso') {
        setSortField('nombre');
        setSortDirection('asc');
      }
    }
  }, [tipoVista, sortField]);

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
      const todosLosIds = new Set(currentUsers.map(u => u.id!).filter(Boolean));
      setUsuariosSeleccionados(todosLosIds);
    } else {
      setUsuariosSeleccionados(new Set());
    }
  }, [currentUsers]);

  // Verificar si todos están seleccionados
  const todosSonSeleccionados = useMemo(() => {
    return currentUsers.length > 0 && 
           currentUsers.every(u => u.id && usuariosSeleccionados.has(u.id));
  }, [currentUsers, usuariosSeleccionados]);

  // Verificar si algunos están seleccionados
  const algunosSonSeleccionados = useMemo(() => {
    return usuariosSeleccionados.size > 0 && !todosSonSeleccionados;
  }, [usuariosSeleccionados.size, todosSonSeleccionados]);

  // Obtener usuarios seleccionados
  const obtenerUsuariosSeleccionados = useCallback(() => {
    return currentUsers.filter(u => u.id && usuariosSeleccionados.has(u.id));
  }, [currentUsers, usuariosSeleccionados]);

  // Manejar eliminación múltiple
  const handleEliminarSeleccionados = useCallback(() => {
    setMostrarDialogoEliminarMultiples(true);
  }, []);

  const confirmarEliminarMultiples = useCallback(() => {
    const usuariosAEliminar = obtenerUsuariosSeleccionados();
    if (usuariosAEliminar.length > 0 && onEliminarMultiplesUsuarios) {
      onEliminarMultiplesUsuarios(usuariosAEliminar);
      setUsuariosSeleccionados(new Set()); // Limpiar selección
    }
    setMostrarDialogoEliminarMultiples(false);
  }, [obtenerUsuariosSeleccionados, onEliminarMultiplesUsuarios]);

  // Limpiar selección cuando cambian los usuarios
  useEffect(() => {
    setUsuariosSeleccionados(new Set());
  }, [usuarios]);

  // Manejar clic en "Ver detalles"
  const handleVerDetalles = useCallback((usuario: Usuario) => {
    setUsuarioParaDetalles(usuario);
    setMostrarDetallesUsuario(true);
  }, []);

  // Cerrar modal de detalles
  const handleCerrarDetalles = useCallback(() => {
    setUsuarioParaDetalles(null);
    setMostrarDetallesUsuario(false);
  }, []);

  return (
    <>
    <Card className="mb-6">
      <CardHeader className="p-4">
          <div className="flex justify-between items-start">
            <div>
        <CardTitle className="text-xl">
          {titulo}
          {filtroMorosos !== 'todos' && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              • {filtroMorosos === 'morosos' ? 'Solo morosos' : 'No morosos'}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {totalUsuarios ? 
            `${usuarios.length} de ${totalUsuarios} usuarios` : 
            `${usuariosFiltradosYOrdenados.length} usuarios encontrados`
          }
          {usuariosSeleccionados.size > 0 && (
            <span className="ml-2 text-blue-600 dark:text-blue-400">
              • {usuariosSeleccionados.size} seleccionado{usuariosSeleccionados.size !== 1 ? 's' : ''}
            </span>
          )}
          {actualizacionEnTiempoReal && (
            <span className="ml-2 inline-flex items-center text-xs text-green-600 dark:text-green-500">
              <RefreshCcw className="h-3 w-3 inline mr-1" />
              Actualización en tiempo real
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
      <CardContent>
        {/* Estadísticas y Filtros */}
        <div className="mb-4 space-y-4">
          {/* Estadísticas - Basadas en TODOS los usuarios filtrados (no solo la página actual) */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 group relative">
              <span className="font-medium">Total usuarios:</span>
              <span className="text-muted-foreground">
                {totalUsuarios || usuariosFiltradosYOrdenados.length}
              </span>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {totalUsuarios ? 'Total de usuarios en el sistema' : 'Total de usuarios que coinciden con los filtros aplicados'}
              </div>
            </div>

          </div>
          
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
          
            {/* Filtro de restricciones - solo mostrar si mostrarColumnaMoroso es true */}
            {mostrarColumnaMoroso && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Estado de restricciones:</span>
                <Select value={filtroMorosos} onValueChange={(value: 'todos' | 'morosos' | 'noMorosos') => setFiltroMorosos(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">
                      <div className="flex items-center justify-between w-full">
                        <span>Todos los usuarios</span>
                        <span className="text-xs text-muted-foreground ml-2">({usuariosFiltradosYOrdenados.length})</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="morosos">
                      <div className="flex items-center justify-between w-full">
                        <span>Con restricciones</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="noMorosos">
                      <div className="flex items-center justify-between w-full">
                        <span>Sin restricciones</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Información de resultados */}
            <div className="ml-auto flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Página {currentPage} de {totalPages}</span>
                <span className="mx-2">•</span>
                <span>Mostrando {currentUsers.length} de {totalItems} usuarios</span>
                {filtroMorosos !== 'todos' && (
                  <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                    Filtro: {filtroMorosos === 'morosos' ? 'Con restricciones' : 'Sin restricciones'}
                  </span>
                )}
              </div>
              
              {/* Botón para limpiar filtros */}
              {((mostrarColumnaMoroso && filtroMorosos !== 'todos') || sortField !== 'nombre' || sortDirection !== 'asc') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFiltroMorosos('todos');
                    setSortField('nombre');
                    setSortDirection('asc');
                    setCurrentPage(1);
                  }}
                  className="flex items-center gap-1 text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : currentUsers.length === 0 ? (
          <div className="text-center py-10">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              {filtroMorosos !== 'todos' 
                ? `No se encontraron usuarios ${filtroMorosos === 'morosos' ? 'con restricciones' : 'sin restricciones'}`
                : filterCalle 
                  ? 'No se encontraron usuarios en esa calle' 
                  : 'No se encontraron usuarios'
              }
            </p>
            {filtroMorosos !== 'todos' && (
              <p className="text-sm text-muted-foreground mt-2">
                Intenta cambiar el filtro o limpiar los filtros aplicados
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                    <th className="py-2 px-4 text-left w-12">
                      <Checkbox
                        checked={todosSonSeleccionados}
                        onCheckedChange={handleSeleccionarTodos}
                        ref={(ref) => {
                          if (ref && 'indeterminate' in ref) {
                            (ref as any).indeterminate = algunosSonSeleccionados;
                          }
                        }}
                        aria-label="Seleccionar todos los usuarios"
                      />
                    </th>
                  <th className="py-2 px-4 text-left">
                    <button
                      onClick={() => handleSort('nombre')}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                      title="Ordenar por nombre"
                    >
                      Nombre Completo {getSortIcon('nombre')}
                    </button>
                  </th>
                  <th className="py-2 px-4 text-left">
                    <button
                      onClick={() => handleSort('email')}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                      title="Ordenar por email"
                    >
                      Email {getSortIcon('email')}
                    </button>
                  </th>
                  <th className="py-2 px-4 text-left">
                    <button
                      onClick={() => handleSort('residencial')}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                      title="Ordenar por residencial"
                    >
                      Residencial {getSortIcon('residencial')}
                    </button>
                  </th>
                  {/* Columna de dirección - solo mostrar para residentes */}
                  {tipoVista === 'residentes' && (
                    <th className="py-2 px-4 text-left">
                      <button
                        onClick={() => handleSort('direccion')}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                        title="Ordenar por dirección"
                      >
                        Dirección {getSortIcon('direccion')}
                      </button>
                    </th>
                  )}
                  {/* Columna de tipo de usuario - solo mostrar para residentes */}
                  {tipoVista === 'residentes' && (
                    <th className="py-2 px-4 text-left">
                      <button
                        onClick={() => handleSort('rol')}
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                        title="Ordenar por tipo"
                      >
                        Tipo {getSortIcon('rol')}
                      </button>
                    </th>
                  )}
                  <th className="py-2 px-4 text-left">
                    <button
                      onClick={() => handleSort('estado')}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                      title="Ordenar por estado"
                    >
                      Estado {getSortIcon('estado')}
                    </button>
                  </th>
                  {/* Columna de moroso - solo mostrar para residentes si mostrarColumnaMoroso es true */}
                  {mostrarColumnaMoroso && tipoVista === 'residentes' && (
                    <th className="py-2 px-4 text-left">
                      <button
                        onClick={() => handleSort('moroso')}
                        className="flex items-center gap-1 hover:text-primary transition-colors group"
                        title="Haz clic para ordenar por estado de moroso (morosos primero/último)"
                      >
                        <span className="group-hover:text-primary">Moroso</span>
                        {getSortIcon('moroso')}
                      </button>
                    </th>
                  )}
                  <th className="py-2 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((usuario) => (
                  <tr key={usuario.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4">
                        <Checkbox
                          checked={usuario.id ? usuariosSeleccionados.has(usuario.id) : false}
                          onCheckedChange={(checked) => {
                            if (usuario.id) {
                              handleSeleccionarUsuario(usuario.id, checked as boolean);
                            }
                          }}
                          aria-label={`Seleccionar usuario ${getNombreCompleto(usuario)}`}
                        />
                      </td>
                    <td className="py-2 px-4">
                      <div className="font-medium">{getNombreCompleto(usuario)}</div>
                    </td>
                    <td className="py-2 px-4">{usuario.email || "Sin email"}</td>
                    <td className="py-2 px-4">{getResidencialNombre(usuario.residencialID)}</td>
                    {/* Celda de dirección - solo mostrar para residentes */}
                    {tipoVista === 'residentes' && (
                      <td className="py-2 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Home className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{getDireccionFormateada(usuario)}</span>
                          </div>
                          {usuario.houseID && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">ID:</span>
                              <span className="text-xs font-mono bg-muted px-1 py-0.5 rounded">
                                {usuario.houseID}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                    {/* Celda de tipo de usuario - solo mostrar para residentes */}
                    {tipoVista === 'residentes' && (
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-1">
                          {getTipoUsuario(usuario) === 'Propietario' ? (
                            <Building className="h-3 w-3 text-blue-600" />
                          ) : (
                            <User className="h-3 w-3 text-purple-600" />
                          )}
                          <span className="text-xs font-medium">
                            {getTipoUsuario(usuario)}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="py-2 px-4">{getEstadoBadge(usuario.status)}</td>
                    {/* Celda de moroso - solo mostrar para residentes si mostrarColumnaMoroso es true */}
                    {mostrarColumnaMoroso && tipoVista === 'residentes' && (
                      <td className="py-2 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Indicador visual del estado */}
                          <div className={`w-3 h-3 rounded-full ${
                            usuario.isMoroso ? 'bg-red-500' : 'bg-green-500'
                          }`} />
                          
                          {/* Switch para cambiar estado */}
                          <Switch
                            checked={usuario.isMoroso || false}
                            onCheckedChange={async (checked) => {
                              if (usuario.id) {
                                try {
                                  await cambiarEstadoMoroso(usuario.id, checked);
                                  
                                  // Si hay callback disponible, notificar al componente padre
                                  if (onCambiarEstadoMoroso) {
                                    onCambiarEstadoMoroso(usuario.id, checked);
                                  }
                                  
                                  console.log(`✅ Estado moroso actualizado para ${usuario.email}: ${checked}`);
                                } catch (error) {
                                  console.error('Error al cambiar estado de restricciones:', error);
                                  // Aquí podrías mostrar un toast de error
                                }
                              }
                            }}
                            aria-label={`Cambiar estado de restricciones para ${getNombreCompleto(usuario)}`}
                            className={`${usuario.isMoroso ? 'bg-red-500' : ''}`}
                          />
                          

                        </div>
                      </td>
                    )}
                    <td className="py-2 px-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleVerDetalles(usuario)}
                          className="p-1 hover:bg-muted rounded-full transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditarUsuario(usuario)}
                          className="p-1 hover:bg-muted rounded-full transition-colors"
                          title="Editar usuario"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEliminarUsuario(usuario)}
                          className="p-1 hover:bg-muted rounded-full text-destructive transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>

      {/* Controles de paginación */}
      {!disableInternalPagination && (
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

          {/* Navegación de páginas */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm">
                Página {currentPage} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Diálogo de confirmación para eliminación múltiple */}
      <AlertDialog open={mostrarDialogoEliminarMultiples} onOpenChange={setMostrarDialogoEliminarMultiples}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar eliminación múltiple
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar {usuariosSeleccionados.size} usuario{usuariosSeleccionados.size !== 1 ? 's' : ''}?
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

      {/* MODAL DE DETALLES DE USUARIO APROBADO */}
      {mostrarDetallesUsuario && usuarioParaDetalles && (
        <Dialog open={mostrarDetallesUsuario} onOpenChange={(open) => {
          if (!open) {
            handleCerrarDetalles();
          }
        }}>
          <VerDetallesUsuarioAprobadoDialog
            usuario={usuarioParaDetalles}
            onClose={handleCerrarDetalles}
            todosLosUsuarios={usuarios}
            getResidencialNombre={getResidencialNombre}
            tipoVista={tipoVista}
          />
        </Dialog>
      )}
    </>
  );
});

export default TablaUsuarios; 