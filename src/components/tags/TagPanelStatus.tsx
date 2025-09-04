"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface PanelJob {
  id: string;
  tagId: string;
  panelId: string;
  action: string;
  desiredStatus: string;
  status: 'queued' | 'running' | 'done' | 'error';
  error?: string;
  createdAt: string;
  completedAt?: string;
}

interface TagPanelStatusProps {
  tagId: string;
  panels: string[];
  refreshInterval?: number;
}

export function TagPanelStatus({ 
  tagId, 
  panels, 
  refreshInterval = 10000 
}: TagPanelStatusProps) {
  const [panelJobs, setPanelJobs] = useState<Record<string, PanelJob>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchPanelJobs = async () => {
    if (!tagId || panels.length === 0) return;

    try {
      setLoading(true);
      const jobsRef = collection(db, 'panelJobs');
      const q = query(
        jobsRef,
        where('tagId', '==', tagId),
        orderBy('createdAt', 'desc'),
        limit(panels.length * 2) // Obtener los últimos jobs por panel
      );

      const snapshot = await getDocs(q);
      const jobs: Record<string, PanelJob> = {};

      snapshot.docs.forEach(doc => {
        const job = { id: doc.id, ...doc.data() } as PanelJob;
        // Mantener solo el job más reciente por panel
        if (!jobs[job.panelId] || new Date(job.createdAt) > new Date(jobs[job.panelId].createdAt)) {
          jobs[job.panelId] = job;
        }
      });

      setPanelJobs(jobs);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error al obtener panel jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPanelJobs();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchPanelJobs, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [tagId, panels, refreshInterval]);

  const getPanelStatus = (panelId: string) => {
    const job = panelJobs[panelId];
    if (!job) {
      return {
        status: 'pending',
        label: 'Pendiente',
        icon: Clock,
        variant: 'outline' as const,
        color: 'text-yellow-600'
      };
    }

    switch (job.status) {
      case 'queued':
        return {
          status: 'queued',
          label: 'En cola',
          icon: Clock,
          variant: 'secondary' as const,
          color: 'text-blue-600'
        };
      case 'running':
        return {
          status: 'running',
          label: 'Procesando',
          icon: RefreshCw,
          variant: 'default' as const,
          color: 'text-blue-600'
        };
      case 'done':
        return {
          status: 'done',
          label: 'Aplicado',
          icon: CheckCircle,
          variant: 'default' as const,
          color: 'text-green-600'
        };
      case 'error':
        return {
          status: 'error',
          label: 'Error',
          icon: XCircle,
          variant: 'destructive' as const,
          color: 'text-red-600'
        };
      default:
        return {
          status: 'unknown',
          label: 'Desconocido',
          icon: AlertCircle,
          variant: 'outline' as const,
          color: 'text-gray-600'
        };
    }
  };

  const handleRefresh = () => {
    fetchPanelJobs();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Estado en Paneles:</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-1">
        {panels.map(panelId => {
          const status = getPanelStatus(panelId);
          const StatusIcon = status.icon;
          
          return (
            <Badge
              key={panelId}
              variant={status.variant}
              className="flex items-center gap-1 text-xs"
              title={status.label}
            >
              <StatusIcon className="h-3 w-3" />
              {panelId}
            </Badge>
          );
        })}
      </div>
      
      {lastUpdate && (
        <p className="text-xs text-gray-500">
          Última actualización: {lastUpdate.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
