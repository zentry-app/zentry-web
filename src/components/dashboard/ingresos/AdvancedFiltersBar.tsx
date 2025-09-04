import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Search, 
  Car, 
  Calendar as CalendarIcon, 
  Filter, 
  X, 
  Download,
  RotateCcw,
  Clock,
  ArrowUpDown
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { IngresosFilters } from "@/hooks/useIngresosFilters";

interface AdvancedFiltersBarProps {
  filters: IngresosFilters;
  updateFilters: (filters: Partial<IngresosFilters>) => void;
  resetFilters: () => void;
  setQuickFilter: (preset: string) => void;
  filterOptions: {
    categories: string[];
    statuses: string[];
    residenciales: string[];
    placas: string[];
  };
  hasActiveFilters: boolean;
  totalResults: number;
  currentResults: number;
  onExport?: () => void;
  getResidencialNombre: (docId: string) => string;
}

const AdvancedFiltersBar: React.FC<AdvancedFiltersBarProps> = ({
  filters,
  updateFilters,
  resetFilters,
  setQuickFilter,
  filterOptions,
  hasActiveFilters,
  totalResults,
  currentResults,
  onExport,
  getResidencialNombre
}) => {
  const quickFilterButtons = [
    { key: 'today', label: 'Hoy', icon: Clock },
    { key: 'yesterday', label: 'Ayer', icon: Clock },
    { key: 'last7days', label: 'Últimos 7 días', icon: Clock },
    { key: 'last30days', label: 'Últimos 30 días', icon: Clock },
    { key: 'thisMonth', label: 'Este mes', icon: Clock },
  ];

  const categoryLabels: { [key: string]: string } = {
    'temporal': 'Temporal',
    'evento': 'Evento',
    'visita': 'Visita',
    'paquete': 'Paquete',
    'servicio': 'Servicio',
    'delivery': 'Delivery',
    'mantenimiento': 'Mantenimiento',
  };

  const statusLabels: { [key: string]: string } = {
    'active': 'Activo',
    'completed': 'Completado',
    'pending': 'Pendiente',
    'cancelled': 'Cancelado',
    'rejected': 'Rechazado',
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        {/* Primera fila: Búsquedas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Búsqueda general */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, dirección..."
              value={filters.searchText}
              onChange={(e) => updateFilters({ searchText: e.target.value })}
              className="pl-10"
            />
          </div>

          {/* Búsqueda por placa */}
          <div className="relative">
            <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por placa..."
              value={filters.placa}
              onChange={(e) => updateFilters({ placa: e.target.value.toUpperCase() })}
              className="pl-10 font-mono"
            />
          </div>

          {/* Fecha desde */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !filters.dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFrom ? (
                  format(filters.dateFrom, "dd/MM/yyyy", { locale: es })
                ) : (
                  "Fecha desde"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateFrom || undefined}
                onSelect={(date) => updateFilters({ dateFrom: date || null })}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>

          {/* Fecha hasta */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !filters.dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateTo ? (
                  format(filters.dateTo, "dd/MM/yyyy", { locale: es })
                ) : (
                  "Fecha hasta"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateTo || undefined}
                onSelect={(date) => updateFilters({ dateTo: date || null })}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Segunda fila: Filtros de selección */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* Categoría */}
          <Select value={filters.category} onValueChange={(value) => updateFilters({ category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {filterOptions.categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {categoryLabels[category] || category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Estado */}
          <Select value={filters.status} onValueChange={(value) => updateFilters({ status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {filterOptions.statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status] || status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Residencial */}
          <Select value={filters.residencialId} onValueChange={(value) => updateFilters({ residencialId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Residencial" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los residenciales</SelectItem>
              {filterOptions.residenciales.map((residencialId) => (
                <SelectItem key={residencialId} value={residencialId}>
                  {getResidencialNombre(residencialId)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Ordenamiento */}
          <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value as any })}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="timestamp">Fecha de ingreso</SelectItem>
              <SelectItem value="exitTimestamp">Fecha de salida</SelectItem>
              <SelectItem value="category">Categoría</SelectItem>
              <SelectItem value="status">Estado</SelectItem>
            </SelectContent>
          </Select>

          {/* Dirección de ordenamiento */}
          <Button
            variant="outline"
            onClick={() => updateFilters({ 
              sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
            })}
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            {filters.sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
          </Button>
        </div>

        {/* Tercera fila: Filtros rápidos de tiempo */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm text-muted-foreground self-center mr-2">Filtros rápidos:</span>
          {quickFilterButtons.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => setQuickFilter(key)}
              className="h-8"
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>

        {/* Cuarta fila: Controles y estadísticas */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Estadísticas */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>
                Mostrando {currentResults} de {totalResults} registros
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {Object.values(filters).filter(v => 
                      v !== '' && v !== 'all' && v !== null && v !== 1 && v !== 50 && v !== 'timestamp' && v !== 'desc'
                    ).length} filtros activos
                  </Badge>
                )}
              </span>
            </div>

            {/* Tamaño de página */}
            <Select 
              value={filters.pageSize.toString()} 
              onValueChange={(value) => updateFilters({ pageSize: parseInt(value) })}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón de exportar */}
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="h-8"
              >
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
            )}

            {/* Botón de reset */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="h-8"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Quinta fila: Filtros activos (badges) */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {filters.searchText && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Texto: "{filters.searchText}"
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilters({ searchText: '' })}
                />
              </Badge>
            )}
            {filters.placa && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Placa: {filters.placa}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilters({ placa: '' })}
                />
              </Badge>
            )}
            {filters.category !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Categoría: {categoryLabels[filters.category] || filters.category}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilters({ category: 'all' })}
                />
              </Badge>
            )}
            {filters.status !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Estado: {statusLabels[filters.status] || filters.status}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilters({ status: 'all' })}
                />
              </Badge>
            )}
            {filters.dateFrom && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Desde: {format(filters.dateFrom, "dd/MM/yyyy", { locale: es })}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilters({ dateFrom: null })}
                />
              </Badge>
            )}
            {filters.dateTo && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Hasta: {format(filters.dateTo, "dd/MM/yyyy", { locale: es })}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilters({ dateTo: null })}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedFiltersBar; 