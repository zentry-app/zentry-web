"use client";

import { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Search,
  Edit,
  Copy,
  Home,
  ChevronDown,
  Trash2
} from "lucide-react";
import { TagStatusToggle } from "./TagStatusToggle";
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
  calle?: string;
  houseNumber?: string;
  houseID?: string;
}

interface TagsTableProps {
  tags: Tag[];
  residenciales: Residencial[];
  casas: Casa[];
  loading: boolean;
  onEditTag: (tag: Tag) => void;
  onStatusChange: (tagId: string, newStatus: string) => void;
  onTagDeleted?: (tagId: string) => void;
  currentUserId: string;
  processingTagId?: string | null;
  zentryLinkOnline?: boolean;
}

export function TagsTable({
  tags,
  residenciales,
  casas,
  loading,

  onEditTag,
  onStatusChange,
  onTagDeleted,
  currentUserId,
  processingTagId,
  zentryLinkOnline = true,
}: TagsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'cardNumber'>('cardNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  const getCasaNombre = (id: string) => {
    // Buscar por ID directo primero
    let casa = casas.find(c => c.id === id);

    // Si no se encuentra, buscar por ownerRef (formato S9G7TL-BATEQUITOS-261)
    if (!casa && id.includes('-')) {
      const parts = id.split('-');
      if (parts.length >= 3) {
        const houseID = parts.slice(1).join('-');
        casa = casas.find(c => c.houseID === houseID || c.id === houseID);
      }
    }

    // Si aún no se encuentra, buscar por houseID
    if (!casa) {
      casa = casas.find(c => c.houseID === id);
    }

    // Si se encuentra la casa, mostrar calle + número si están disponibles
    if (casa) {
      if (casa.calle && casa.houseNumber) {
        return `${casa.calle} ${casa.houseNumber}`;
      } else if (casa.nombre) {
        return casa.nombre;
      } else if (casa.houseID) {
        return casa.houseID;
      }
    }

    return id || "Desconocido";
  };

  const formatRelativeDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `hace ${days}d`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

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

      await response.json();

      toast.success(`Tag ${tag.cardNumberDec} eliminado exitosamente`);

      if (onTagDeleted) {
        onTagDeleted(tag.id);
      } else {
        window.location.reload();
      }

    } catch (error) {
      console.error('Error eliminando tag:', error);
      toast.error(`Error eliminando tag: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const totalActive = tags.filter(t => t.status === 'active').length;
  const totalDisabled = tags.filter(t => t.status === 'disabled').length;
  const totalUnassigned = tags.filter(t => !t.casaId || t.casaId === '').length;

  const filteredTags = tags.filter(tag => {
    const matchesSearch =
      tag.cardNumberDec.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCasaNombre(tag.casaId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tag.plate && tag.plate.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEstado = estadoFilter === "todos" || tag.status === estadoFilter;
    const matchesUnassigned = !showUnassigned || !tag.casaId || tag.casaId === '';

    return matchesSearch && matchesEstado && matchesUnassigned;
  });

  const sortedTags = [...filteredTags].sort((a, b) => {
    if (sortBy === 'cardNumber') {
      const cardA = parseInt(a.cardNumberDec) || 0;
      const cardB = parseInt(b.cardNumberDec) || 0;
      return sortOrder === 'asc' ? cardA - cardB : cardB - cardA;
    } else {
      const aValue = a.lastChangedAt;
      const bValue = b.lastChangedAt;

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
      {/* Stats bar */}
      <div className="flex flex-wrap gap-2 mb-2">
        <button
          onClick={() => { setEstadoFilter('todos'); }}
          className={`text-sm px-3 py-1 rounded-full border font-medium transition-colors ${estadoFilter === 'todos' && !showUnassigned ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
        >
          {tags.length} total
        </button>
        <button
          onClick={() => { setEstadoFilter('active'); setShowUnassigned(false); }}
          className={`text-sm px-3 py-1 rounded-full border font-medium transition-colors ${estadoFilter === 'active' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'}`}
        >
          {totalActive} activos
        </button>
        <button
          onClick={() => { setEstadoFilter('disabled'); setShowUnassigned(false); }}
          className={`text-sm px-3 py-1 rounded-full border font-medium transition-colors ${estadoFilter === 'disabled' ? 'bg-slate-600 text-white border-slate-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
        >
          {totalDisabled} inactivos
        </button>
        <button
          onClick={() => setShowUnassigned(prev => !prev)}
          className={`text-sm px-3 py-1 rounded-full border font-medium transition-colors ${showUnassigned ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'}`}
        >
          {totalUnassigned} sin casa
        </button>
      </div>

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
              <TableHead>Placa</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Modificado</TableHead>
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
                        <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        {tag.casaId ? (
                          <span>{getCasaNombre(tag.casaId)}</span>
                        ) : (
                          <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Sin asignar</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {tag.plate ? (
                        <span className="font-mono text-sm bg-slate-100 px-2 py-0.5 rounded">{tag.plate.toUpperCase()}</span>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div
                        title={!zentryLinkOnline ? 'ZentryLink sin conexión' : undefined}
                      >
                        <TagStatusToggle
                          tagId={tag.id}
                          currentStatus={tag.status}
                          onStatusChange={onStatusChange}
                          isProcessing={processingTagId === tag.id || !zentryLinkOnline}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        title={`${tag.lastChangedAt ? new Date(tag.lastChangedAt).toLocaleString('es-MX') : ''} por ${tag.lastChangedBy}`}
                        className="text-sm text-slate-500"
                      >
                        {formatRelativeDate(tag.lastChangedAt)}
                      </span>
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
