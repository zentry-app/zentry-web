'use client';

import { TicketFilters as TicketFiltersType } from '@/types/support';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface TicketFiltersProps {
  filters: TicketFiltersType;
  onFiltersChange: (filters: TicketFiltersType) => void;
}

export function TicketFilters({ filters, onFiltersChange }: TicketFiltersProps) {
  const updateFilter = (key: keyof TicketFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Filtros</CardTitle>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-xl text-slate-600 hover:text-slate-900">
            <X className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label>Búsqueda</Label>
            <Input
              placeholder="Buscar por texto..."
              value={filters.searchQuery || ''}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
            />
          </div>

          <div>
            <Label>Estado</Label>
            <Select
              value={filters.estado?.[0] || 'all'}
              onValueChange={(value) =>
                updateFilter('estado', value === 'all' ? undefined : [value as any])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="abierto">Abierto</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="resuelto">Resuelto</SelectItem>
                <SelectItem value="cerrado">Cerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Categoría</Label>
            <Select
              value={filters.categoria?.[0] || 'all'}
              onValueChange={(value) =>
                updateFilter('categoria', value === 'all' ? undefined : [value as any])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="facturacion">Facturación</SelectItem>
                <SelectItem value="acceso">Acceso</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Prioridad</Label>
            <Select
              value={filters.prioridad?.[0] || 'all'}
              onValueChange={(value) =>
                updateFilter('prioridad', value === 'all' ? undefined : [value as any])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end pb-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="vencidos"
                checked={filters.soloVencidos || false}
                onCheckedChange={(checked) =>
                  updateFilter('soloVencidos', checked === true ? true : undefined)
                }
              />
              <label
                htmlFor="vencidos"
                className="text-sm font-medium leading-none cursor-pointer text-red-600 dark:text-red-400"
              >
                Solo vencidos
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
