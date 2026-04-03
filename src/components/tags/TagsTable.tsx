"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { 
  Search, 
  Edit, 
  Copy,
  Car,
  Home,
  ChevronDown,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Trash2
} from "lucide-react";
import { TagStatusToggle } from "./TagStatusToggle";
import { TagPanelStatus } from "./TagPanelStatus";
import { getAuthSafe } from "@/lib/firebase/config";

interface Tag {
  id: string;
  cardNumberDec: string;
  residencialId: string;
  casaId: string;
  panels: string[];
  status: 'active' | 'disabled';
  plate?: string;
  notes?: string;
  validFrom?: string;
  validTo?: string;
  lastChangedBy: string;
  lastChangedAt: string;
  source: string;
}

interface Residencial {
  id: string;
  nombre: string;
}

interface Casa {
  id: string;
  nombre: string;
  residencialId: string;
}

interface Panel {
  id: string;
  nombre: string;
  tipo: 'vehicular' | 'peatonal';
  residencialId: string;
}

interface TagsTableProps {
  tags: Tag[];
  residenciales: Residencial[];
  casas: Casa[];
  paneles: Panel[];
  loading: boolean;
  onEditTag: (tag: Tag) => void;
  onStatusChange: (tagId: string, newStatus: string) => void;
  onTagDeleted?: (tagId: string) => void; // 🆕 Nueva prop para manejar eliminación
  currentUserId: string;
}

interface PanelJob {
  id: string;
  tagId: string;
  panelId: string;
  status: 'queued' | 'running' | 'done' | 'error';
  error?: string;
  completedAt?: string;
}

export function TagsTable({
  tags,
  residenciales,
  casas,
  paneles,
  loading,
  onEditTag,
  onStatusChange,
  onTagDeleted, // 🆕 Nueva prop
  currentUserId
}: TagsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [panelFilter, setPanelFilter] = useState<string>("todos");
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'cardNumber'>('cardNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [panelJobs, setPanelJobs] = useState<PanelJob[]>([]);

  // Cargar panelJobs para mostrar estados de aplicación
  useEffect(() => {
    const fetchPanelJobs = async () => {
      try {
        // TODO: Implementar llamada real a la API
        // const response = await fetch('/api/tags/panel-jobs');
        // const data = await response.json();
        // setPanelJobs(data.jobs || []);
        
        // Placeholder para desarrollo
        setPanelJobs([]);
      } catch (error) {
        console.error("Error al cargar panelJobs:", error);
      }
    };

    fetchPanelJobs();
    
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchPanelJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  const getResidencialNombre = (id: string) => {
    return residenciales.find(r => r.id === id)?.nombre || "Desconocido";
  };

  const getCasaNombre = (id: string) => {
    console.log(`🏠 [getCasaNombre] Buscando casa para ID: ${id}`);
    console.log(`🏠 [getCasaNombre] Casas disponibles:`, casas.map(c => ({ 
      id: c.id, 
      houseID: c.houseID, 
      calle: c.calle, 
      houseNumber: c.houseNumber,
      nombre: c.nombre 
    })));
    
    // 🆕 Buscar por ID directo primero
    let casa = casas.find(c => c.id === id);
    console.log(`🏠 [getCasaNombre] Búsqueda por ID directo:`, casa ? 'encontrada' : 'no encontrada');
    
    // 🆕 Si no se encuentra, buscar por ownerRef (formato S9G7TL-BATEQUITOS-261)
    if (!casa && id.includes('-')) {
      // Extraer el houseID del ownerRef (ej: S9G7TL-BATEQUITOS-261 -> BATEQUITOS-261)
      const parts = id.split('-');
      if (parts.length >= 3) {
        const houseID = parts.slice(1).join('-'); // BATEQUITOS-261
        console.log(`🏠 [getCasaNombre] Extrayendo houseID del ownerRef: ${houseID}`);
        casa = casas.find(c => c.houseID === houseID || c.id === houseID);
        console.log(`🏠 [getCasaNombre] Búsqueda por houseID extraído:`, casa ? 'encontrada' : 'no encontrada');
      }
    }
    
    // 🆕 Si aún no se encuentra, buscar por houseID
    if (!casa) {
      casa = casas.find(c => c.houseID === id);
      console.log(`🏠 [getCasaNombre] Búsqueda por houseID directo:`, casa ? 'encontrada' : 'no encontrada');
    }
    
    // 🆕 Si se encuentra la casa, mostrar calle + número si están disponibles
    if (casa) {
      console.log(`🏠 [getCasaNombre] Casa encontrada:`, casa);
      if (casa.calle && casa.houseNumber) {
        const resultado = `${casa.calle} ${casa.houseNumber}`;
        console.log(`🏠 [getCasaNombre] Retornando calle + número: ${resultado}`);
        return resultado;
      } else if (casa.nombre) {
        console.log(`🏠 [getCasaNombre] Retornando nombre: ${casa.nombre}`);
        return casa.nombre;
      } else if (casa.houseID) {
        console.log(`🏠 [getCasaNombre] Retornando houseID: ${casa.houseID}`);
        return casa.houseID;
      }
    }
    
    // 🆕 Fallback: mostrar el ID original si no se encuentra
    console.log(`🏠 [getCasaNombre] No se encontró casa, retornando ID original: ${id}`);
    return id || "Desconocido";
  };

  const getPanelNombre = (id: string) => {
    return paneles.find(p => p.id === id)?.nombre || id;
  };

  const getPanelStatus = (tagId: string, panelId: string) => {
    const jobs = panelJobs.filter(job => 
      job.tagId === tagId && job.panelId === panelId
    );
    
    if (jobs.length === 0) return null;
    
    // Obtener el job más reciente
    const latestJob = jobs.sort((a, b) => 
      new Date(b.completedAt || b.id).getTime() - new Date(a.completedAt || a.id).getTime()
    )[0];
    
    return latestJob.status;
  };

  const getOverallPanelStatus = (tag: Tag) => {
    if (tag.panels.length === 0) return null;
    
    const statuses = tag.panels.map(panelId => getPanelStatus(tag.id, panelId));
    
    // Si hay algún error y no hay jobs pendientes
    if (statuses.some(status => status === 'error') && 
        !statuses.some(status => status === 'queued' || status === 'running')) {
      return 'error';
    }
    
    // Si hay algún job pendiente
    if (statuses.some(status => status === 'queued' || status === 'running')) {
      return 'pending';
    }
    
    // Si todos están completados
    if (statuses.every(status => status === 'done')) {
      return 'done';
    }
    
    return null;
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'done':
        return 'Aplicado';
      case 'pending':
        return 'Pendiente';
      case 'error':
        return 'Error';
      default:
        return 'Sin datos';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  // 🆕 FUNCIÓN PARA ELIMINAR TAG
  const handleDeleteTag = async (tag: Tag) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el tag ${tag.cardNumberDec}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const auth = await getAuthSafe();
      if (!auth) {
        toast.error("No hay sesión activa");
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        toast.error("Usuario no autenticado");
        return;
      }

      const token = await user.getIdToken();
      
      const response = await fetch(`/api/tags/delete?tagId=${tag.id}&residencialId=${tag.residencialId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.details || errorData.error || 'Error eliminando tag');
      }

      const result = await response.json();
      
      toast.success(`Tag ${tag.cardNumberDec} eliminado exitosamente`);
      
      // Recargar la lista de tags
      if (onTagDeleted) {
        onTagDeleted(tag.id);
      } else {
        // Si no hay callback, recargar la página
        window.location.reload();
      }
      
    } catch (error) {
      console.error('Error eliminando tag:', error);
      toast.error(`Error eliminando tag: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const filteredTags = tags.filter(tag => {
    const matchesSearch = 
      tag.cardNumberDec.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCasaNombre(tag.casaId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tag.plate && tag.plate.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesEstado = estadoFilter === "todos" || tag.status === estadoFilter;
    const matchesPanel = panelFilter === "todos" || tag.panels.includes(panelFilter);
    
    return matchesSearch && matchesEstado && matchesPanel;
  });

  const sortedTags = [...filteredTags].sort((a, b) => {
    if (sortBy === 'cardNumber') {
      const cardA = parseInt(a.cardNumberDec) || 0;
      const cardB = parseInt(b.cardNumberDec) || 0;
      return sortOrder === 'asc' ? cardA - cardB : cardB - cardA;
    } else {
      const aValue = sortBy === 'createdAt' ? a.lastChangedAt : a.lastChangedAt;
      const bValue = sortBy === 'createdAt' ? b.lastChangedAt : b.lastChangedAt;
      
      if (sortOrder === 'asc') {
        return new Date(aValue).getTime() - new Date(bValue).getTime();
      } else {
        return new Date(bValue).getTime() - new Date(aValue).getTime();
      }
    }
  });

  const totalPages = Math.ceil(sortedTags.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTags = sortedTags.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: 'createdAt' | 'updatedAt' | 'cardNumber') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'cardNumber' ? 'asc' : 'desc');
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por DEC, casa o placa..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          
          <Select
            value={estadoFilter}
            onValueChange={(value) => setEstadoFilter(value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="disabled">Desactivado</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={panelFilter}
            onValueChange={(value) => setPanelFilter(value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Panel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los paneles</SelectItem>
              {paneles
                .filter(p => p.tipo === 'vehicular')
                .map((panel) => (
                <SelectItem key={panel.id} value={panel.id}>
                  {panel.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('cardNumber')}
              >
                <div className="flex items-center gap-1">
                  Número DEC
                  <ChevronDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Casa/Unidad</TableHead>
              <TableHead>Paneles</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Aplicado en paneles</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron tags
                </TableCell>
              </TableRow>
            ) : (
              paginatedTags.map((tag, index) => {
                const overallStatus = getOverallPanelStatus(tag);
                const numeroTag = (currentPage - 1) * itemsPerPage + index + 1;
                return (
                  <TableRow key={tag.id}>
                    <TableCell className="text-center font-medium">
                      {numeroTag}
                    </TableCell>
                    <TableCell className="font-mono">
                      <div className="flex items-center gap-2">
                        <span>{tag.cardNumberDec}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(tag.cardNumberDec)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span>{getCasaNombre(tag.casaId)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {tag.panels.length > 3 ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="h-6 text-xs">
                                +{tag.panels.length - 3} más
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">Paneles asignados</h4>
                                {tag.panels.map(panelId => (
                                  <div key={panelId} className="flex items-center gap-2 text-sm">
                                    <Car className="h-3 w-3 text-blue-500" />
                                    <span>{getPanelNombre(panelId)}</span>
                                  </div>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          tag.panels.map(panelId => (
                            <Badge key={panelId} variant="secondary" className="text-xs">
                              {getPanelNombre(panelId)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TagStatusToggle
                        tagId={tag.id}
                        currentStatus={tag.status}
                        onStatusChange={onStatusChange}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(overallStatus)}
                        <span className="text-sm">{getStatusText(overallStatus)}</span>
                      </div>
                      {overallStatus === 'error' && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 text-xs text-red-600">
                              Ver errores
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Errores por panel</h4>
                              {tag.panels.map(panelId => {
                                const status = getPanelStatus(tag.id, panelId);
                                if (status === 'error') {
                                  const job = panelJobs.find(j => 
                                    j.tagId === tag.id && j.panelId === panelId && j.status === 'error'
                                  );
                                  return (
                                    <div key={panelId} className="text-sm">
                                      <div className="font-medium">{getPanelNombre(panelId)}</div>
                                      <div className="text-red-600 text-xs">
                                        {job?.error || 'Error desconocido'}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEditTag(tag)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteTag(tag)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, sortedTags.length)} de {sortedTags.length} tags
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
