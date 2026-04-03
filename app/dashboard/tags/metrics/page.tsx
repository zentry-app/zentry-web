"use client";

import { TagMetrics } from "@/components/tags/TagMetrics";
import { TagAuditHistory } from "@/components/tags/TagAuditHistory";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  History, 
  Search,
  Tag
} from "lucide-react";

export default function TagMetricsPage() {
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [searchTagId, setSearchTagId] = useState<string>("");

  const handleSearch = () => {
    setSelectedTagId(searchTagId);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Métricas y Auditoría de Tags</h1>
      </div>

      {/* Métricas generales */}
      <TagMetrics refreshInterval={30000} />

      {/* Búsqueda de tag para auditoría */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Historial de Tag
          </CardTitle>
          <CardDescription>
            Ingresa el ID de un tag para ver su historial de auditoría
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="tagId">ID del Tag</Label>
              <Input
                id="tagId"
                placeholder="Ingresa el ID del tag..."
                value={searchTagId}
                onChange={(e) => setSearchTagId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={!searchTagId.trim()}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historial de auditoría */}
      <TagAuditHistory 
        tagId={selectedTagId} 
        refreshInterval={0} 
      />

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Métricas</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Se actualizan cada 30 segundos</li>
                <li>• Muestran datos de las últimas 24-48 horas</li>
                <li>• Incluyen tasa de éxito y error</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Auditoría</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Registra todos los cambios de estado</li>
                <li>• Incluye usuario y timestamp</li>
                <li>• Muestra jobs generados por panel</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
