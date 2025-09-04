import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Eye, 
  User, 
  Car, 
  Home, 
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRightLeft,
  AlertTriangle,
  Shield,
  Star,
  Timer,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Ingreso, IngresoTemporal, IngresoEvento, Timestamp as IngresoTimestamp } from "@/types/ingresos";
import DetallesVehiculoDialogContent from "./DetallesVehiculoDialogContent";
import { cn } from "@/lib/utils";

interface TablaIngresosProps {
  loading: boolean;
  ingresos: Ingreso[];
  formatDateToRelative: (timestamp: IngresoTimestamp | Date | string) => string;
  formatDateToFull: (timestamp: IngresoTimestamp | Date | string) => string; 
  onOpenDetails: (ingreso: Ingreso) => void;
  getResidencialNombre: (docId: string | undefined) => string;
  showVehicleColumn?: boolean; // 🆕 Controla si mostrar columna de vehículo
}

// Función para capitalizar nombres
const capitalizeName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Sistema de categorías críticas
const getCriticalPriority = (category: string, entryMethod?: string, timestamp?: any) => {
  // Categorías críticas
  const criticalCategories: Record<string, { level: 'critical' | 'high' | 'watch', label: string, icon: any }> = {
    'emergencia_medica': { level: 'critical', label: 'Emergencia Médica', icon: AlertTriangle },
    'alerta_seguridad': { level: 'critical', label: 'Alerta Seguridad', icon: Shield },
    'evacuacion': { level: 'critical', label: 'Evacuación', icon: AlertTriangle },
    'incidente': { level: 'critical', label: 'Incidente', icon: AlertCircle },
    
    'vip': { level: 'high', label: 'VIP', icon: Star },
    'mantenimiento_critico': { level: 'high', label: 'Mant. Crítico', icon: AlertTriangle },
    'entrega_urgente': { level: 'high', label: 'Urgente', icon: Timer },
    
    'visitante_frecuente': { level: 'watch', label: 'Frecuente', icon: Eye },
    'vehiculo_sospechoso': { level: 'watch', label: 'Sospechoso', icon: AlertCircle },
    'horario_inusual': { level: 'watch', label: 'Horario Inusual', icon: Clock },
  };

  return criticalCategories[category] || null;
};

const getPriorityBadge = (ingreso: Ingreso) => {
  const priority = getCriticalPriority(ingreso.category, ingreso.entryMethod, ingreso.timestamp);
  
  if (!priority) return null;

  const configs: Record<'critical' | 'high' | 'watch', { className: string, icon: any }> = {
    critical: {
      className: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
      icon: priority.icon,
    },
    high: {
      className: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: priority.icon,
    },
    watch: {
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: priority.icon,
    }
  };

  const config = configs[priority.level];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      <Icon className="h-3 w-3 mr-1" />
      {priority.label}
    </Badge>
  );
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'completed':
      return {
        variant: 'secondary' as const,
        icon: CheckCircle2,
        label: 'Completado',
        className: 'text-green-700 bg-green-50 border-green-200'
      };
    case 'active':
      return {
        variant: 'default' as const,
        icon: Clock,
        label: 'Activo',
        className: 'text-blue-700 bg-blue-50 border-blue-200'
      };
    case 'pending':
      return {
        variant: 'secondary' as const,
        icon: Timer,
        label: 'Pendiente',
        className: 'text-yellow-700 bg-yellow-50 border-yellow-200'
      };
    case 'cancelled':
      return {
        variant: 'outline' as const,
        icon: XCircle,
        label: 'Cancelado',
        className: 'text-red-700 bg-red-50 border-red-200'
      };
    default:
      return {
        variant: 'secondary' as const,
        icon: AlertCircle,
        label: status,
        className: 'text-gray-700 bg-gray-50 border-gray-200'
      };
  }
};

const renderVisitanteName = (ingreso: Ingreso) => {
  const visitData = ingreso.visitData;
  
  if (!visitData || !visitData.name) {
    return <span className="text-muted-foreground">Sin nombre</span>;
  }

  const priorityBadge = getPriorityBadge(ingreso);

  return (
    <div className="space-y-1">
      <p className="font-medium">{capitalizeName(visitData.name)}</p>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">{ingreso.category}</span>
        {priorityBadge}
      </div>
    </div>
  );
};

// Función para obtener colores de vehículo
const getColorStyle = (colorName: string): { backgroundColor: string; borderColor: string } => {
  const color = colorName?.toLowerCase() || '';
  
  const colorMap: { [key: string]: { backgroundColor: string; borderColor: string } } = {
    'rojo': { backgroundColor: '#ef4444', borderColor: '#dc2626' },
    'red': { backgroundColor: '#ef4444', borderColor: '#dc2626' },
    'azul': { backgroundColor: '#3b82f6', borderColor: '#2563eb' },
    'blue': { backgroundColor: '#3b82f6', borderColor: '#2563eb' },
    'verde': { backgroundColor: '#10b981', borderColor: '#059669' },
    'green': { backgroundColor: '#10b981', borderColor: '#059669' },
    'amarillo': { backgroundColor: '#f59e0b', borderColor: '#d97706' },
    'yellow': { backgroundColor: '#f59e0b', borderColor: '#d97706' },
    'negro': { backgroundColor: '#1f2937', borderColor: '#111827' },
    'black': { backgroundColor: '#1f2937', borderColor: '#111827' },
    'blanco': { backgroundColor: '#f9fafb', borderColor: '#d1d5db' },
    'white': { backgroundColor: '#f9fafb', borderColor: '#d1d5db' },
    'gris': { backgroundColor: '#6b7280', borderColor: '#4b5563' },
    'gray': { backgroundColor: '#6b7280', borderColor: '#4b5563' },
    'plata': { backgroundColor: '#c0c0c0', borderColor: '#a0a0a0' },
    'silver': { backgroundColor: '#c0c0c0', borderColor: '#a0a0a0' },
    'dorado': { backgroundColor: '#fbbf24', borderColor: '#f59e0b' },
    'gold': { backgroundColor: '#fbbf24', borderColor: '#f59e0b' },
    'cafe': { backgroundColor: '#92400e', borderColor: '#78350f' },
    'brown': { backgroundColor: '#92400e', borderColor: '#78350f' },
    'naranja': { backgroundColor: '#f97316', borderColor: '#ea580c' },
    'orange': { backgroundColor: '#f97316', borderColor: '#ea580c' },
    'morado': { backgroundColor: '#8b5cf6', borderColor: '#7c3aed' },
    'purple': { backgroundColor: '#8b5cf6', borderColor: '#7c3aed' },
    'rosa': { backgroundColor: '#ec4899', borderColor: '#db2777' },
    'pink': { backgroundColor: '#ec4899', borderColor: '#db2777' },
  };

  return colorMap[color] || { backgroundColor: '#6b7280', borderColor: '#4b5563' };
};

const renderVehicleComplete = (ingreso: Ingreso, onPlacaClick?: (placa: string) => void) => {
  if (!ingreso.vehicleInfo) {
    return (
      <div className="text-center text-muted-foreground py-2">
        <Car className="h-4 w-4 mx-auto mb-1 opacity-50" />
        <span className="text-xs">Sin vehículo</span>
      </div>
    );
  }

  const { placa, marca, modelo, color } = ingreso.vehicleInfo;
  const colorStyle = getColorStyle(color);

  return (
    <div className="space-y-2">
      {/* Placa prominente */}
      <div className="text-center">
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-blue-50 transition-colors font-mono font-bold"
          onClick={() => onPlacaClick?.(placa)}
          title="Ver historial del vehículo"
        >
          {placa.toUpperCase()}
        </Badge>
      </div>
      
      {/* Información del vehículo compacta */}
      <div className="text-center space-y-1">
        <p className="text-xs font-medium text-gray-700">
          {capitalizeName(marca)} {capitalizeName(modelo)}
        </p>
        
        {/* Color compacto */}
        <div className="flex items-center justify-center space-x-1">
          <div
            className="w-3 h-3 rounded-full border"
            style={colorStyle}
            title={`Color: ${capitalizeName(color)}`}
          />
          <span className="text-xs text-muted-foreground">{capitalizeName(color)}</span>
        </div>
      </div>
    </div>
  );
};

const renderSecurityAlerts = (ingreso: Ingreso) => {
  if (ingreso.status !== 'completed') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Shield className="h-5 w-5 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent>
            <p>El ciclo de visita aún no ha finalizado.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const alerts: string[] = [];
  if (ingreso.exitDetails?.samePersonExit === false) {
    alerts.push("La persona en la salida no coincide con la del ingreso.");
  }
  if (ingreso.exitDetails?.exitInSameVehicle === false) {
    alerts.push("El vehículo de salida no coincide con el de ingreso.");
  }
  if (ingreso.exitDetails?.suspiciousCargo) {
    alerts.push("Se reportó carga sospechosa en la salida.");
  }
  if (ingreso.exitDetails?.passReturned === false) {
    alerts.push("El pase de visitante no fue devuelto.");
  }

  if (alerts.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <ShieldAlert className="h-6 w-6 text-red-500 animate-pulse" />
          </TooltipTrigger>
          <TooltipContent className="bg-red-600 text-white border-red-700">
            <ul className="list-disc list-inside">
              {alerts.map((alert, index) => <li key={index}>{alert}</li>)}
            </ul>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <ShieldCheck className="h-5 w-5 text-green-500" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Visita completada sin alertas de seguridad.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const renderDomicilio = (ingreso: Ingreso, getResidencialNombre: (docId: string | undefined) => string) => {
  const domicilio = ingreso.domicilio;
  
  if (!domicilio) {
    return <span className="text-muted-foreground">Sin domicilio</span>;
  }

  const { calle, houseNumber } = domicilio;

  return (
    <div className="flex items-center space-x-1">
      <Home className="h-3 w-3 text-gray-500" />
      <span className="text-sm">
        {capitalizeName(calle)} #{houseNumber}
      </span>
    </div>
  );
};

const renderTemporalStatus = (ingreso: Ingreso, formatDateToRelative: Function, formatDateToFull: Function) => {
  const isActive = ingreso.status === 'active';
  
  if (isActive) {
    return (
      <div className="text-center">
        <Badge variant="default" className="bg-blue-50 text-blue-700 border-blue-200 mb-1">
          <Clock className="h-3 w-3 mr-1" />
          Activo
        </Badge>
        <div 
          className="text-xs text-muted-foreground cursor-help"
          title={`Ingresó: ${formatDateToFull(ingreso.timestamp)}`}
        >
          Desde: {formatDateToRelative(ingreso.timestamp)}
        </div>
      </div>
    );
  } else {
    return (
      <div className="text-center">
        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 mb-1">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completado
        </Badge>
        {ingreso.exitTimestamp && (
          <div 
            className="text-xs text-muted-foreground cursor-help"
            title={`Salió: ${formatDateToFull(ingreso.exitTimestamp)}`}
          >
            Salió: {formatDateToRelative(ingreso.exitTimestamp)}
          </div>
        )}
      </div>
    );
  }
};

const TablaIngresos: React.FC<TablaIngresosProps> = ({
  loading,
  ingresos,
  formatDateToRelative,
  formatDateToFull,
  onOpenDetails,
  getResidencialNombre,
  showVehicleColumn = true, // Default to true
}) => {
  const [selectedPlaca, setSelectedPlaca] = useState<string | null>(null);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  const handlePlacaClick = (placa: string) => {
    setSelectedPlaca(placa);
    setVehicleModalOpen(true);
  };

  const closeVehicleModal = () => {
    setVehicleModalOpen(false);
    setSelectedPlaca(null);
  };

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <div className="overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px] text-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Shield className="h-5 w-5 mx-auto" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Alertas de Seguridad</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableHead>
            <TableHead className="min-w-[200px]">Visitante</TableHead>
            {showVehicleColumn && <TableHead className="min-w-[180px]">Vehículo</TableHead>}
            <TableHead>Residencia</TableHead>
            <TableHead className="w-[180px]">Registro</TableHead>
            <TableHead className="w-[140px] text-center">Estado</TableHead>
            <TableHead className="w-[80px] text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 10 }).map((_, index) => (
              <TableRow key={`sk-${index}`}>
                <TableCell><Skeleton className="h-6 w-6 rounded-full mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                {showVehicleColumn && <TableCell><Skeleton className="h-5 w-24" /></TableCell>}
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                <TableCell><Skeleton className="h-8 w-16" /></TableCell>
              </TableRow>
            ))
          ) : ingresos.length === 0 ? (
            <TableRow>
                <TableCell colSpan={showVehicleColumn ? 6 : 5} className="h-24 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <ArrowRightLeft className="h-8 w-8 text-gray-400" />
                    <p className="text-muted-foreground">No se encontraron registros</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              ingresos.map((ingreso) => {
                const priority = getCriticalPriority(ingreso.category);
                const rowClassName = priority?.level === 'critical' 
                  ? 'hover:bg-red-50 bg-red-25 border-l-4 border-l-red-400' 
                  : priority?.level === 'high'
                  ? 'hover:bg-orange-50 bg-orange-25 border-l-4 border-l-orange-400'
                  : priority?.level === 'watch'
                  ? 'hover:bg-yellow-50 bg-yellow-25 border-l-4 border-l-yellow-400'
                  : 'hover:bg-gray-50';

                return (
                  <TableRow key={ingreso.id} className={cn("transition-colors", rowClassName)}>
                    <TableCell className="text-center">
                      {renderSecurityAlerts(ingreso)}
                    </TableCell>
                    <TableCell>
                      {renderVisitanteName(ingreso)}
                    </TableCell>
                    {showVehicleColumn && (
                      <TableCell className="text-center">
                        {renderVehicleComplete(ingreso, handlePlacaClick)}
                      </TableCell>
                    )}
                    <TableCell>
                      {renderDomicilio(ingreso, getResidencialNombre)}
                    </TableCell>
                    <TableCell>
                      <div 
                        className="text-sm cursor-help" 
                        title={formatDateToFull(ingreso.timestamp)}
                      >
                        {formatDateToRelative(ingreso.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {renderTemporalStatus(ingreso, formatDateToRelative, formatDateToFull)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenDetails(ingreso)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
          )}
        </TableBody>
      </Table>
      </div>

      {/* Modal de detalles del vehículo */}
      <Dialog open={vehicleModalOpen} onOpenChange={setVehicleModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Historial del Vehículo</DialogTitle>
            <DialogDescription>
              Mostrando todos los registros de entrada y salida para la placa: {selectedPlaca}
            </DialogDescription>
          </DialogHeader>
          {selectedPlaca && (
            <DetallesVehiculoDialogContent
              placa={selectedPlaca}
              onClose={closeVehicleModal}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TablaIngresos; 