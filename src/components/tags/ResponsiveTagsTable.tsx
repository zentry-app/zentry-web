"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronRight,
  Car,
  Home,
  Copy,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react";
import { TagStatusToggle } from "./TagStatusToggle";
import { TagPanelStatus } from "./TagPanelStatus";
import { StatusBadge } from "./TagValidationMessages";

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

interface ResponsiveTagsTableProps {
  tags: Tag[];
  residenciales: Residencial[];
  casas: Casa[];
  paneles: Panel[];
  loading: boolean;
  onEditTag: (tag: Tag) => void;
  onStatusChange: (tagId: string, newStatus: string) => void;
  currentUserId: string;
}

export function ResponsiveTagsTable({
  tags,
  residenciales,
  casas,
  paneles,
  loading,
  onEditTag,
  onStatusChange,
  currentUserId
}: ResponsiveTagsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (tagId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(tagId)) {
      newExpanded.delete(tagId);
    } else {
      newExpanded.add(tagId);
    }
    setExpandedRows(newExpanded);
  };

  const getResidencialNombre = (id: string) => {
    return residenciales.find(r => r.id === id)?.nombre || "Desconocido";
  };

  const getCasaNombre = (id: string) => {
    return casas.find(c => c.id === id)?.nombre || "Desconocido";
  };

  const getPanelNombre = (id: string) => {
    return paneles.find(p => p.id === id)?.nombre || id;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Mostrar toast de confirmación
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border rounded-lg p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay tags vehiculares</h3>
        <p className="text-gray-500">Comienza añadiendo tu primer tag vehicular.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vista de escritorio */}
      <div className="hidden lg:block">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número DEC</TableHead>
                <TableHead>Casa/Unidad</TableHead>
                <TableHead>Paneles</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Aplicado en paneles</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-mono">
                    <div className="flex items-center gap-2">
                      <span>{tag.cardNumberDec}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(tag.cardNumberDec)}
                        aria-label={`Copiar número ${tag.cardNumberDec}`}
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
                      {tag.panels.slice(0, 2).map(panelId => (
                        <Badge key={panelId} variant="secondary" className="text-xs">
                          {getPanelNombre(panelId)}
                        </Badge>
                      ))}
                      {tag.panels.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{tag.panels.length - 2} más
                        </Badge>
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
                    <TagPanelStatus
                      tagId={tag.id}
                      panels={tag.panels}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEditTag(tag)}
                      aria-label={`Editar tag ${tag.cardNumberDec}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Vista móvil */}
      <div className="lg:hidden space-y-4">
        {tags.map((tag) => {
          const isExpanded = expandedRows.has(tag.id);
          
          return (
            <div key={tag.id} className="bg-white border rounded-lg overflow-hidden">
              {/* Header de la tarjeta */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="font-mono text-sm font-medium truncate">
                        {tag.cardNumberDec}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => copyToClipboard(tag.cardNumberDec)}
                        aria-label={`Copiar número ${tag.cardNumberDec}`}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Home className="h-3 w-3" />
                      <span className="truncate">{getCasaNombre(tag.casaId)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <StatusBadge status={tag.status} size="sm" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleRow(tag.id)}
                      aria-label={isExpanded ? "Contraer detalles" : "Expandir detalles"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Contenido expandible */}
              <Collapsible open={isExpanded} onOpenChange={() => toggleRow(tag.id)}>
                <CollapsibleContent>
                  <div className="border-t bg-gray-50 p-4 space-y-4">
                    {/* Paneles */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Paneles asignados</h4>
                      <div className="flex flex-wrap gap-1">
                        {tag.panels.map(panelId => (
                          <Badge key={panelId} variant="secondary" className="text-xs">
                            {getPanelNombre(panelId)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Estado de aplicación */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Estado de aplicación</h4>
                      <TagPanelStatus
                        tagId={tag.id}
                        panels={tag.panels}
                      />
                    </div>

                    {/* Información adicional */}
                    {(tag.plate || tag.notes) && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Información adicional</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          {tag.plate && (
                            <div>Placa: {tag.plate}</div>
                          )}
                          {tag.notes && (
                            <div>Notas: {tag.notes}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditTag(tag)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <TagStatusToggle
                        tagId={tag.id}
                        currentStatus={tag.status}
                        onStatusChange={onStatusChange}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        })}
      </div>
    </div>
  );
}
