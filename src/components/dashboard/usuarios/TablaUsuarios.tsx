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
  }, [usuarios, sortField, sortDirection, filtroMorosos, getResidencialNombre, mostrarColumnaMoroso, tipoVista]);

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
      <div className="relative border-none shadow-zentry-lg bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden transition-all duration-300">
        <div className="p-8 pb-4 border-b border-slate-100/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                {titulo}
                {filtroMorosos !== 'todos' && (
                  <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border ${filtroMorosos === 'morosos'
                      ? 'bg-rose-50 text-rose-600 border-rose-100'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                    {filtroMorosos === 'morosos' ? 'Restringidos' : 'Sin Restricciones'}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider">
                <span>{totalUsuarios || usuariosFiltradosYOrdenados.length} Registros</span>
                {usuariosSeleccionados.size > 0 && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="text-blue-600">
                      {usuariosSeleccionados.size} Seleccionados
                    </span>
                  </>
                )}
                {actualizacionEnTiempoReal && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="inline-flex items-center text-emerald-600 animate-pulse">
                      <RefreshCcw className="h-3 w-3 mr-1" />
                      Live
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Controles de selección múltiple */}
            {usuariosSeleccionados.size > 0 && (
              <Button
                onClick={handleEliminarSeleccionados}
                className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 shadow-sm rounded-xl font-black text-xs uppercase tracking-widest px-6 h-10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar ({usuariosSeleccionados.size})
              </Button>
            )}
          </div>
        </div>

        <div className="p-0">
          {/* Estadísticas y Filtros */}
          <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100/50 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                <Filter className="h-4 w-4 text-slate-400" />
              </div>

              {/* Filtro de restricciones - solo mostrar si mostrarColumnaMoroso es true */}
              {mostrarColumnaMoroso && (
                <Select value={filtroMorosos} onValueChange={(value: 'todos' | 'morosos' | 'noMorosos') => setFiltroMorosos(value)}>
                  <SelectTrigger className="w-48 h-10 rounded-xl border-none bg-white shadow-sm font-bold text-xs text-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl bg-white/90 backdrop-blur-xl">
                    <SelectItem value="todos" className="font-bold text-xs">Todos los usuarios</SelectItem>
                    <SelectItem value="morosos" className="font-bold text-xs text-rose-600">Con restricciones</SelectItem>
                    <SelectItem value="noMorosos" className="font-bold text-xs text-emerald-600">Sin restricciones</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Información de resultados y Limpiar */}
            <div className="flex items-center gap-3">
              {((mostrarColumnaMoroso && filtroMorosos !== 'todos') || sortField !== 'nombre' || sortDirection !== 'asc') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFiltroMorosos('todos');
                    setSortField('nombre');
                    setSortDirection('asc');
                    setCurrentPage(1);
                  }}
                  className="text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest hover:bg-transparent"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reset Filtros
                </Button>
              )}
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 bg-slate-900/5 px-3 py-1 rounded-lg">
                Página {currentPage} / {totalPages}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col justify-center items-center min-h-[300px] gap-4">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin"></div>
              </div>
              <p className="font-black text-slate-300 text-xs uppercase tracking-[0.2em] animate-pulse">Cargando Usuarios...</p>
            </div>
          ) : currentUsers.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="bg-slate-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform rotate-12 shadow-inner">
                <Users className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">No se encontraron usuarios</h3>
              <p className="text-slate-500 font-medium max-w-xs mx-auto">
                {filtroMorosos !== 'todos'
                  ? `No hay usuarios coincidiendo con el filtro de ${filtroMorosos === 'morosos' ? 'restricciones' : 'sin restricciones'}.`
                  : 'Intenta ajustar los términos de búsqueda o filtros.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="py-4 px-6 text-left w-16">
                      <Checkbox
                        checked={todosSonSeleccionados}
                        onCheckedChange={handleSeleccionarTodos}
                        ref={(ref) => {
                          if (ref && 'indeterminate' in ref) {
                            (ref as any).indeterminate = algunosSonSeleccionados;
                          }
                        }}
                        className="rounded-lg data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </th>
                    <th className="py-4 px-4 text-left">
                      <button
                        onClick={() => handleSort('nombre')}
                        className="flex items-center gap-2 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 w-full"
                      >
                        Usuario {getSortIcon('nombre')}
                      </button>
                    </th>
                    <th className="py-4 px-4 text-left">
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center gap-2 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 w-full"
                      >
                        Contacto {getSortIcon('email')}
                      </button>
                    </th>
                    <th className="py-4 px-4 text-left">
                      <button
                        onClick={() => handleSort('residencial')}
                        className="flex items-center gap-2 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 w-full"
                      >
                        Comunidad {getSortIcon('residencial')}
                      </button>
                    </th>
                    {/* Columna de dirección */}
                    {tipoVista === 'residentes' && (
                      <th className="py-4 px-4 text-left">
                        <button
                          onClick={() => handleSort('direccion')}
                          className="flex items-center gap-2 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 w-full"
                        >
                          Dirección {getSortIcon('direccion')}
                        </button>
                      </th>
                    )}
                    {/* Columna de tipo */}
                    {tipoVista === 'residentes' && (
                      <th className="py-4 px-4 text-left">
                        <button
                          onClick={() => handleSort('rol')}
                          className="flex items-center gap-2 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 w-full"
                        >
                          Rol {getSortIcon('rol')}
                        </button>
                      </th>
                    )}
                    <th className="py-4 px-4 text-left">
                      <button
                        onClick={() => handleSort('estado')}
                        className="flex items-center gap-2 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 w-full"
                      >
                        Status {getSortIcon('estado')}
                      </button>
                    </th>
                    {/* Columna de moroso */}
                    {mostrarColumnaMoroso && tipoVista === 'residentes' && (
                      <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                        Restricción
                      </th>
                    )}
                    <th className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentUsers.map((usuario) => (
                    <tr key={usuario.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                      <td className="py-4 px-6">
                        <Checkbox
                          checked={usuario.id ? usuariosSeleccionados.has(usuario.id) : false}
                          onCheckedChange={(checked) => {
                            if (usuario.id) {
                              handleSeleccionarUsuario(usuario.id, checked as boolean);
                            }
                          }}
                          className="rounded-lg border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-100 to-white border border-slate-200 flex items-center justify-center text-slate-500 font-black text-xs shadow-sm">
                            {getNombreCompleto(usuario).charAt(0)}
                          </div>
                          <div className="font-bold text-slate-900 text-sm">{getNombreCompleto(usuario)}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-xs font-semibold text-slate-500">{usuario.email || "---"}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-xs text-slate-700">{getResidencialNombre(usuario.residencialID)}</span>
                      </td>
                      {/* Celda de dirección */}
                      {tipoVista === 'residentes' && (
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            <div className="text-xs font-bold text-slate-600">{getDireccionFormateada(usuario)}</div>
                            {usuario.houseID && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">HID</span>
                                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                  {usuario.houseID}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      {/* Celda de tipo */}
                      {tipoVista === 'residentes' && (
                        <td className="py-4 px-4">
                          {getTipoUsuario(usuario) === 'Propietario' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold uppercase tracking-wide">
                              <Building className="h-3 w-3" /> Prop.
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold uppercase tracking-wide">
                              <User className="h-3 w-3" /> Inq.
                            </span>
                          )}
                        </td>
                      )}
                      <td className="py-4 px-4">{getEstadoBadge(usuario.status)}</td>
                      {/* Celda de moroso */}
                      {mostrarColumnaMoroso && tipoVista === 'residentes' && (
                        <td className="py-4 px-4">
                          {/* Switch para cambiar estado */}
                          <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                            <Switch
                              checked={usuario.isMoroso || false}
                              onCheckedChange={async (checked) => {
                                if (usuario.id) {
                                  try {
                                    await cambiarEstadoMoroso(usuario.id, checked);
                                    if (onCambiarEstadoMoroso) {
                                      onCambiarEstadoMoroso(usuario.id, checked);
                                    }
                                  } catch (error) {
                                    console.error('Error al cambiar estado:', error);
                                  }
                                }
                              }}
                              className={`${usuario.isMoroso ? 'bg-rose-500' : 'bg-slate-200'}`}
                            />
                          </div>
                        </td>
                      )}
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleVerDetalles(usuario)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onEditarUsuario(usuario)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-all"
                            title="Editar usuario"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onEliminarUsuario(usuario)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
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
        </div>
      </div>

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

TablaUsuarios.displayName = 'TablaUsuarios';

export default TablaUsuarios;
