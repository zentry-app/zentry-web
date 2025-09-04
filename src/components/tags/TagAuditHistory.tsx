"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  History, 
  RefreshCw, 
  User, 
  Clock, 
  Tag,
  ArrowUpDown
} from "lucide-react";
import { getTagAuditHistory } from "@/lib/firebase/tags-sync";

interface AuditLog {
  id: string;
  type: string;
  tagId: string;
  from: string;
  to: string;
  byUserId: string;
  at: string;
  panelFanoutJobs: number;
}

interface TagAuditHistoryProps {
  tagId: string;
  refreshInterval?: number;
}

export function TagAuditHistory({ tagId, refreshInterval = 0 }: TagAuditHistoryProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchAuditHistory = async () => {
    if (!tagId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/tags/audit-history?tagId=${tagId}&limit=20`);
      if (!response.ok) {
        throw new Error('Error al obtener historial de auditoría');
      }
      
      const data = await response.json();
      setAuditLogs(data.data);
      
    } catch (error) {
      console.error('Error al obtener historial de auditoría:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditHistory();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchAuditHistory, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [tagId, refreshInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'disabled': return 'bg-gray-500';
      case 'lost': return 'bg-yellow-500';
      case 'stolen': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'disabled': return 'Desactivado';
      case 'lost': return 'Perdido';
      case 'stolen': return 'Robado';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('es-MX'),
      time: date.toLocaleTimeString('es-MX')
    };
  };

  const sortedLogs = [...auditLogs].sort((a, b) => {
    const dateA = new Date(a.at).getTime();
    const dateB = new Date(b.at).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  if (!tagId) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Auditoría
          </CardTitle>
          <CardDescription>
            Selecciona un tag para ver su historial de cambios
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Auditoría
            </CardTitle>
            <CardDescription>
              Registro de cambios para el tag seleccionado
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAuditHistory}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {error ? (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Cargando historial...</span>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay historial de auditoría para este tag</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedLogs.map((log) => {
              const { date, time } = formatDate(log.at);
              
              return (
                <div key={log.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Tag className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">Cambio de Estado</span>
                      <Badge variant="outline" className="text-xs">
                        {log.type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        className={`text-white ${getStatusColor(log.from)}`}
                        variant="default"
                      >
                        {getStatusLabel(log.from)}
                      </Badge>
                      <span className="text-gray-400">→</span>
                      <Badge 
                        className={`text-white ${getStatusColor(log.to)}`}
                        variant="default"
                      >
                        {getStatusLabel(log.to)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{log.byUserId}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{date} {time}</span>
                      </div>
                      {log.panelFanoutJobs > 0 && (
                        <div className="flex items-center gap-1">
                          <span>Jobs: {log.panelFanoutJobs}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
