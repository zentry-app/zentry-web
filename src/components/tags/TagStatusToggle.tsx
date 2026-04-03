"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ToggleLeft, 
  ToggleRight, 
  Loader2,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { toast } from "sonner";

interface TagStatusToggleProps {
  tagId: string;
  currentStatus: 'active' | 'disabled' | 'lost' | 'stolen';
  onStatusChange: (tagId: string, newStatus: string) => Promise<void>;
  isProcessing?: boolean;
}

export function TagStatusToggle({ 
  tagId, 
  currentStatus, 
  onStatusChange, 
  isProcessing = false 
}: TagStatusToggleProps) {
  const [isChanging, setIsChanging] = useState(false);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Activo',
          variant: 'default' as const,
          icon: CheckCircle,
          color: 'text-green-600'
        };
      case 'disabled':
        return {
          label: 'Desactivado',
          variant: 'secondary' as const,
          icon: XCircle,
          color: 'text-gray-600'
        };
      case 'lost':
        return {
          label: 'Perdido',
          variant: 'destructive' as const,
          icon: XCircle,
          color: 'text-red-600'
        };
      case 'stolen':
        return {
          label: 'Robado',
          variant: 'destructive' as const,
          icon: XCircle,
          color: 'text-red-600'
        };
      default:
        return {
          label: 'Desconocido',
          variant: 'outline' as const,
          icon: Clock,
          color: 'text-gray-600'
        };
    }
  };

  const handleToggle = async () => {
    if (isChanging || isProcessing) return;

    try {
      setIsChanging(true);
      
      // Determinar nuevo estado
      let newStatus: string;
      if (currentStatus === 'active') {
        newStatus = 'disabled';
      } else {
        newStatus = 'active';
      }

      await onStatusChange(tagId, newStatus);
      
      toast.success(`Tag ${newStatus === 'active' ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error('Error al cambiar estado del tag:', error);
      toast.error('Error al cambiar el estado del tag');
    } finally {
      setIsChanging(false);
    }
  };

  const statusConfig = getStatusConfig(currentStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge variant={statusConfig.variant} className="flex items-center gap-1">
        <StatusIcon className="h-3 w-3" />
        {statusConfig.label}
      </Badge>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        disabled={isChanging || isProcessing}
        className="h-8 w-8 p-0"
      >
        {isChanging ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : currentStatus === 'active' ? (
          <ToggleRight className="h-4 w-4 text-green-600" />
        ) : (
          <ToggleLeft className="h-4 w-4 text-gray-400" />
        )}
      </Button>
    </div>
  );
}
