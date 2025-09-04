"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { getPanelJobsStats } from "@/lib/firebase/tags-sync";

interface PanelJobsStats {
  queued: number;
  running: number;
  done: number;
  error: number;
}

interface TagMetricsProps {
  refreshInterval?: number;
}

export function TagMetrics({ refreshInterval = 30000 }: TagMetricsProps) {
  const [stats, setStats] = useState<PanelJobsStats>({ queued: 0, running: 0, done: 0, error: 0 });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/tags/panel-jobs?stats=true');
      if (!response.ok) {
        throw new Error('Error al obtener estadísticas');
      }
      
      const data = await response.json();
      setStats(data.data);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const getTotalJobs = () => stats.queued + stats.running + stats.done + stats.error;
  
  const getSuccessRate = () => {
    const total = getTotalJobs();
    if (total === 0) return 0;
    return Math.round((stats.done / total) * 100);
  };

  const getErrorRate = () => {
    const total = getTotalJobs();
    if (total === 0) return 0;
    return Math.round((stats.error / total) * 100);
  };

  const getStatusColor = (status: keyof PanelJobsStats) => {
    switch (status) {
      case 'queued': return 'bg-blue-500';
      case 'running': return 'bg-yellow-500';
      case 'done': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: keyof PanelJobsStats) => {
    switch (status) {
      case 'queued': return Clock;
      case 'running': return RefreshCw;
      case 'done': return CheckCircle;
      case 'error': return XCircle;
      default: return AlertCircle;
    }
  };

  const getStatusLabel = (status: keyof PanelJobsStats) => {
    switch (status) {
      case 'queued': return 'En Cola';
      case 'running': return 'Procesando';
      case 'done': return 'Completados';
      case 'error': return 'Errores';
      default: return 'Desconocido';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Métricas de Tags
            </CardTitle>
            <CardDescription>
              Estadísticas de procesamiento de tags en las últimas 24-48 horas
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {error ? (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Métricas principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['queued', 'running', 'done', 'error'] as const).map((status) => {
                const Icon = getStatusIcon(status);
                const value = stats[status];
                const percentage = getTotalJobs() > 0 ? Math.round((value / getTotalJobs()) * 100) : 0;
                
                return (
                  <div key={status} className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{getStatusLabel(status)}</span>
                    </div>
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="text-xs text-gray-500">{percentage}%</div>
                  </div>
                );
              })}
            </div>

            {/* Barras de progreso */}
            <div className="space-y-2">
              {(['queued', 'running', 'done', 'error'] as const).map((status) => {
                const value = stats[status];
                const percentage = getTotalJobs() > 0 ? (value / getTotalJobs()) * 100 : 0;
                
                return (
                  <div key={status} className="flex items-center gap-2">
                    <span className="text-sm w-20">{getStatusLabel(status)}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getStatusColor(status)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm w-12 text-right">{value}</span>
                  </div>
                );
              })}
            </div>

            {/* Métricas de rendimiento */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Tasa de Éxito</span>
                </div>
                <div className="text-xl font-bold text-green-600">{getSuccessRate()}%</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Tasa de Error</span>
                </div>
                <div className="text-xl font-bold text-red-600">{getErrorRate()}%</div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="text-xs text-gray-500 text-center">
              Total de jobs: {getTotalJobs()} | Última actualización: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
