"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Car, 
  Calendar, 
  User, 
  Hash, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  Users,
  Activity,
  Eye,
  Shield,
  MapPin
} from 'lucide-react';
import { VehicleHistory, PersonaVehiculo } from '@/types/vehicle-history';
import { getVehicleHistory } from '@/lib/firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Función para capitalizar nombres
const capitalizeName = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Función para obtener el estilo del color del vehículo
const getColorStyle = (color: string) => {
  if (!color) return { backgroundColor: '#9CA3AF', borderColor: '#6B7280' };
  
  const colorLower = color.toLowerCase();
  const colorMap: { [key: string]: { backgroundColor: string; borderColor: string } } = {
    'rojo': { backgroundColor: '#EF4444', borderColor: '#DC2626' },
    'red': { backgroundColor: '#EF4444', borderColor: '#DC2626' },
    'azul': { backgroundColor: '#3B82F6', borderColor: '#2563EB' },
    'blue': { backgroundColor: '#3B82F6', borderColor: '#2563EB' },
    'verde': { backgroundColor: '#10B981', borderColor: '#059669' },
    'green': { backgroundColor: '#10B981', borderColor: '#059669' },
    'amarillo': { backgroundColor: '#F59E0B', borderColor: '#D97706' },
    'yellow': { backgroundColor: '#F59E0B', borderColor: '#D97706' },
    'negro': { backgroundColor: '#1F2937', borderColor: '#111827' },
    'black': { backgroundColor: '#1F2937', borderColor: '#111827' },
    'blanco': { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
    'white': { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
    'gris': { backgroundColor: '#6B7280', borderColor: '#4B5563' },
    'gray': { backgroundColor: '#6B7280', borderColor: '#4B5563' },
    'grey': { backgroundColor: '#6B7280', borderColor: '#4B5563' },
    'plata': { backgroundColor: '#9CA3AF', borderColor: '#6B7280' },
    'silver': { backgroundColor: '#9CA3AF', borderColor: '#6B7280' },
    'dorado': { backgroundColor: '#F59E0B', borderColor: '#D97706' },
    'gold': { backgroundColor: '#F59E0B', borderColor: '#D97706' },
    'café': { backgroundColor: '#92400E', borderColor: '#78350F' },
    'brown': { backgroundColor: '#92400E', borderColor: '#78350F' },
    'naranja': { backgroundColor: '#F97316', borderColor: '#EA580C' },
    'orange': { backgroundColor: '#F97316', borderColor: '#EA580C' },
    'morado': { backgroundColor: '#8B5CF6', borderColor: '#7C3AED' },
    'purple': { backgroundColor: '#8B5CF6', borderColor: '#7C3AED' },
    'rosa': { backgroundColor: '#EC4899', borderColor: '#DB2777' },
    'pink': { backgroundColor: '#EC4899', borderColor: '#DB2777' }
  };

  return colorMap[colorLower] || { backgroundColor: '#9CA3AF', borderColor: '#6B7280' };
};

interface DetallesVehiculoDialogContentProps {
  placa: string;
  onClose: () => void;
}

const DetallesVehiculoDialogContent: React.FC<DetallesVehiculoDialogContentProps> = ({
  placa,
  onClose
}) => {
  const { user } = useAuth();
  const [vehicleHistory, setVehicleHistory] = useState<VehicleHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicleHistory = async () => {
      if (!user?.residencialID || !placa) {
        setError('Información insuficiente para cargar el historial');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const history = await getVehicleHistory(user.residencialID, placa);
        setVehicleHistory(history);
        setError(null);
      } catch (err) {
        console.error('Error al cargar historial del vehículo:', err);
        setError('Error al cargar el historial del vehículo');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleHistory();
  }, [user?.residencialID, placa]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No disponible';
    try {
      const date = parseISO(dateString);
      return format(date, "d 'de' MMMM 'de' yyyy, h:mm a", { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch {
      return null;
    }
  };

  const analyzeSecurityPatterns = (personas: PersonaVehiculo[]) => {
    const alerts = [];
    
    // Verificar si hay demasiadas personas usando el mismo vehículo
    if (personas.length > 5) {
      alerts.push({
        type: 'warning',
        message: `Múltiples usuarios (${personas.length}) han usado este vehículo`
      });
    }
    
    // Verificar usuarios con muchos ingresos
    const highFrequencyUsers = personas.filter(p => p.totalEntries > 50);
    if (highFrequencyUsers.length > 0) {
      alerts.push({
        type: 'info',
        message: `${highFrequencyUsers.length} usuario(s) con alta frecuencia de uso`
      });
    }
    
    // Verificar usuarios recientes vs antiguos
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentUsers = personas.filter(p => {
      try {
        return parseISO(p.lastEntry) > oneMonthAgo;
      } catch {
        return false;
      }
    });
    
    if (recentUsers.length < personas.length / 2 && personas.length > 2) {
      alerts.push({
        type: 'warning',
        message: 'Posible vehículo inactivo o transferido'
      });
    }
    
    return alerts;
  };

  const renderLiveHistory = () => {
    if (!vehicleHistory?._rawIngresos) return (
      <Card>
        <CardContent className="p-8 text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No se encontraron registros de ingresos para este vehículo.</p>
        </CardContent>
      </Card>
    );

    return (
      <div className="space-y-4">
        {vehicleHistory._rawIngresos.map((ingreso) => (
          <Card key={ingreso.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  {capitalizeName(ingreso.visitData.name)}
                </CardTitle>
                <Badge variant={ingreso.status === 'completed' ? 'secondary' : 'default'}>
                  {ingreso.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">{formatDate(ingreso.timestamp.toString())}</div>
              <div className="text-xs text-gray-500">{getRelativeTime(ingreso.timestamp.toString())}</div>
              <Separator className="my-2" />
              <div className="text-sm">
                <p><strong>Destino:</strong> {ingreso.domicilio.calle} #{ingreso.domicilio.houseNumber}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderPersonaCard = (persona: PersonaVehiculo, index: number) => (
    <Card key={index} className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            {capitalizeName(persona.nombre)}
          </CardTitle>
          <Badge 
            variant="outline" 
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
          >
            {persona.totalEntries} ingresos
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-gray-500" />
            <span className="font-medium">ID:</span>
            <span>{persona.idNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-500" />
            <span className="font-medium">Tipo:</span>
            <span>{persona.idType}</span>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <span className="font-medium text-green-700">Primer ingreso:</span>
              <div className="text-gray-600">{formatDate(persona.firstEntry)}</div>
              {getRelativeTime(persona.firstEntry) && (
                <div className="text-xs text-gray-500">
                  {getRelativeTime(persona.firstEntry)}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <span className="font-medium text-blue-700">Último ingreso:</span>
              <div className="text-gray-600">{formatDate(persona.lastEntry)}</div>
              {getRelativeTime(persona.lastEntry) && (
                <div className="text-xs text-gray-500">
                  {getRelativeTime(persona.lastEntry)}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  const renderSummaryCard = () => {
      if (!vehicleHistory) return null;
      const securityAlerts = vehicleHistory._isLive ? [] : analyzeSecurityPatterns(vehicleHistory.personas);
      const colorStyle = getColorStyle(vehicleHistory.vehicleInfo.color);
      
      return (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Car className="h-5 w-5" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm border">
                <div className="text-sm text-gray-600">Marca y Modelo</div>
                <div className="font-semibold text-gray-900">
                  {capitalizeName(vehicleHistory.vehicleInfo.marca) || 'N/A'} {capitalizeName(vehicleHistory.vehicleInfo.modelo) || ''}
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm border">
                <div className="text-sm text-gray-600">Color</div>
                <div className="font-semibold text-gray-900 flex items-center justify-center gap-2">
                   <div className="w-4 h-4 rounded-full border shadow-sm" style={colorStyle} />
                   {capitalizeName(vehicleHistory.vehicleInfo.color) || 'N/A'}
                 </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Estadísticas</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <div className="text-xl font-bold">{vehicleHistory._totalPersonas || (vehicleHistory._isLive ? 'N/A' : 0)}</div>
                <div className="text-xs text-gray-600">Personas</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <div className="text-xl font-bold">{vehicleHistory._totalIngresos || 0}</div>
                <div className="text-xs text-gray-600">Ingresos</div>
              </div>
            </CardContent>
          </Card>

          {securityAlerts.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Alertas de Seguridad</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {securityAlerts.map((alert, index) => (
                  <Alert key={index} variant={alert.type === 'warning' ? 'destructive' : 'default'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{alert.message}</AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
           )}
        </>
      );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 h-full">
        <div className="lg:col-span-1 space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (error || !vehicleHistory) {
    return (
      <div className="p-6 text-center space-y-4 h-full flex flex-col justify-center items-center">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h3 className="text-xl font-semibold">Error al Cargar Historial</h3>
        <p className="text-muted-foreground">{error || 'No se encontró historial para este vehículo.'}</p>
        <Button onClick={onClose}>Cerrar</Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[85vh]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        <div className="lg:col-span-1 space-y-6">
          {renderSummaryCard()}
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                {vehicleHistory._isLive ? "Historial de Ingresos" : `Personas Asociadas (${vehicleHistory.personas.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vehicleHistory._isLive ? renderLiveHistory() : (
                vehicleHistory.personas.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No se encontraron registros de personas para este vehículo.</p>
                </CardContent>
              </Card>
            ) : (
                  vehicleHistory.personas
                  .sort((a, b) => b.totalEntries - a.totalEntries)
                    .map(renderPersonaCard)
                )
            )}
            </CardContent>
          </Card>
          </div>
        </div>
      </ScrollArea>
  );
};

export default DetallesVehiculoDialogContent; 