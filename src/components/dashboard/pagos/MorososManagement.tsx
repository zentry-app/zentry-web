import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Home, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Search,
  Filter,
  Loader2,
  Eye,
  Calendar,
  User
} from 'lucide-react';
import { 
  HousePaymentStatus, 
  HousePaymentStatusService 
} from '@/lib/services/house-payment-status-service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MorososManagementProps {
  residencialId: string;
}

const MorososManagement: React.FC<MorososManagementProps> = ({
  residencialId,
}) => {
  const [houseStatuses, setHouseStatuses] = useState<HousePaymentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'al_dia' | 'pendiente' | 'moroso'>('todos');
  const [stats, setStats] = useState({
    totalCasas: 0,
    casasAlDia: 0,
    casasPendientes: 0,
    casasMorosas: 0,
    porcentajeMorosidad: 0,
    montoTotalAdeudado: 0,
  });

  useEffect(() => {
    loadHouseStatuses();
  }, [residencialId]);

  const loadHouseStatuses = async () => {
    try {
      setLoading(true);
      const [estados, estadisticas] = await Promise.all([
        HousePaymentStatusService.getHousePaymentStatuses(residencialId),
        HousePaymentStatusService.getMorosidadStats(residencialId)
      ]);
      
      setHouseStatuses(estados);
      setStats(estadisticas);
    } catch (error) {
      console.error('Error al cargar estados de casas:', error);
      toast.error('Error al cargar estados de casas');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Sin fecha';
    
    try {
      const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
      return format(date, 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatAmount = (amount: number, currency: string = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'al_dia': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'moroso': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'al_dia': return 'Al Día';
      case 'pendiente': return 'Pendiente';
      case 'moroso': return 'Moroso';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'al_dia': return CheckCircle;
      case 'pendiente': return Clock;
      case 'moroso': return AlertTriangle;
      default: return Home;
    }
  };

  const filteredHouses = houseStatuses.filter(house => {
    const matchesStatus = statusFilter === 'todos' || house.status === statusFilter;
    const matchesSearch = 
      searchTerm === '' ||
      house.calle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      house.houseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (house.userName && house.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (house.userEmail && house.userEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Home className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Casas</p>
                <p className="text-2xl font-bold">{stats.totalCasas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Al Día</p>
                <p className="text-2xl font-bold text-green-600">{stats.casasAlDia}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.casasPendientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Morosos</p>
                <p className="text-2xl font-bold text-red-600">{stats.casasMorosas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">%</span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">% Morosidad</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.porcentajeMorosidad.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Adeudado</p>
                <p className="text-lg font-bold text-red-600">
                  {formatAmount(stats.montoTotalAdeudado)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Pagos por Casa</CardTitle>
          <CardDescription>
            Gestiona el estado de pagos de cada casa del residencial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por casa, residente..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los Estados</SelectItem>
                  <SelectItem value="al_dia">Al Día</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                  <SelectItem value="moroso">Morosos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={loadHouseStatuses} variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de casas */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
              <p className="mt-4 text-muted-foreground">Cargando estados de casas...</p>
            </div>
          ) : filteredHouses.length === 0 ? (
            <div className="text-center p-8">
              <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay casas para mostrar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Casa</TableHead>
                    <TableHead>Residente</TableHead>
                    <TableHead>Último Pago</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Meses Moroso</TableHead>
                    <TableHead>Monto Adeudado</TableHead>
                    <TableHead>Próximo Vencimiento</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHouses.map((house) => {
                    const StatusIcon = getStatusIcon(house.status);
                    
                    return (
                      <TableRow key={house.houseId}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <StatusIcon className="h-4 w-4" />
                            <Badge className={getStatusColor(house.status)}>
                              {getStatusLabel(house.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1 text-sm font-medium">
                              <Home className="h-3 w-3 text-blue-500" />
                              <span>
                                {house.calle} #{house.houseNumber}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {house.houseId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">
                              {house.userName || 'Sin residente'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {house.userEmail || 'Sin email'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">
                              {formatDate(house.ultimoPago)}
                            </div>
                            {house.conceptoUltimoPago && (
                              <div className="text-xs text-muted-foreground">
                                {house.conceptoUltimoPago}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <div className="font-bold text-green-600">
                              {house.montoUltimoPago ? formatAmount(house.montoUltimoPago) : 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            {house.mesesMoroso ? (
                              <Badge variant="outline" className="text-red-600 border-red-200">
                                {house.mesesMoroso} meses
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            {house.montoAdeudado ? (
                              <div className="font-bold text-red-600">
                                {formatAmount(house.montoAdeudado)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-gray-500" />
                              <span>{formatDate(house.fechaVencimiento)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center space-x-1"
                            >
                              <Eye className="h-4 w-4" />
                              <span>Ver</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MorososManagement;
