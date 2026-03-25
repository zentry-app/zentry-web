import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Home, 
  Calendar, 
  Download,
  Plus,
  Search,
  Filter,
  Loader2,
  BarChart3,
  PieChart,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Banknote,
  AlertTriangle
} from 'lucide-react';
import { 
  AccountingRecord, 
  AccountingSummary, 
  MonthlyReport,
  AccountingService 
} from '@/lib/services/accounting-service';
import { PaymentValidationService, PaymentReceipt } from '@/lib/services/payment-validation-service';
import { CashPaymentService, CashPayment } from '@/lib/services/cash-payment-service';
import { HousePaymentStatusService, HousePaymentStatus } from '@/lib/services/house-payment-status-service';
import { CasasResidencialService, CasaResidencial } from '@/lib/services/casas-residencial-service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UnifiedPaymentsDashboardProps {
  residencialId: string;
}

const UnifiedPaymentsDashboard: React.FC<UnifiedPaymentsDashboardProps> = ({
  residencialId,
}) => {
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'overview' | 'payments' | 'reports'>('overview');
  
  // Estados para datos
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PaymentReceipt[]>([]);
  const [cashPayments, setCashPayments] = useState<CashPayment[]>([]);
  const [houseStatuses, setHouseStatuses] = useState<HousePaymentStatus[]>([]);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [casas, setCasas] = useState<CasaResidencial[]>([]);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'validated' | 'moroso'>('all');
  
  // Estados para modales
  const [cashPaymentDialog, setCashPaymentDialog] = useState(false);
  const [newCashPayment, setNewCashPayment] = useState({
    casaId: '',
    amount: '',
    concept: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });
  const [casaSearchTerm, setCasaSearchTerm] = useState('');

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      const fechaInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const fechaFin = new Date();
      
      const [
        summaryData,
        pendingData,
        cashData,
        houseData,
        reportsData,
        casasData
      ] = await Promise.all([
        AccountingService.getAccountingSummary(residencialId, fechaInicio, fechaFin),
        PaymentValidationService.getPendingPayments(residencialId),
        CashPaymentService.getCashPayments(residencialId),
        HousePaymentStatusService.getHousePaymentStatuses(residencialId),
        AccountingService.getMonthlyReports(residencialId),
        CasasResidencialService.getCasasPorResidencial(residencialId)
      ]);
      
      setSummary(summaryData);
      setPendingPayments(pendingData);
      setCashPayments(cashData);
      setHouseStatuses(houseData);
      setReports(reportsData);
      setCasas(casasData);
      
      console.log(`🏠 [LOAD] Casas cargadas: ${casasData.length}`, casasData);
      console.log(`💰 [LOAD] Pagos en efectivo cargados: ${cashData.length}`, cashData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [residencialId]);

  useEffect(() => {
    console.log(`🏠 [EFFECT] ResidencialId recibido: ${residencialId}`);
    loadAllData();
    
    const handleOpenCashPaymentModal = () => {
      setCashPaymentDialog(true);
    };
    
    window.addEventListener('openCashPaymentModal', handleOpenCashPaymentModal);
    
    return () => {
      window.removeEventListener('openCashPaymentModal', handleOpenCashPaymentModal);
    };
  }, [loadAllData, residencialId]);

  const handleValidatePayment = async (paymentId: string, action: 'approve' | 'reject', comment?: string) => {
    try {
      const validation = {
        pagoId: paymentId,
        status: action === 'approve' ? 'validated' as const : 'rejected' as const,
        observaciones: comment || '',
        validadoPor: 'admin', // TODO: Obtener UID del admin actual
      };
      
      await PaymentValidationService.validatePayment(residencialId, paymentId, validation);
      
      if (action === 'approve') {
        toast.success('Pago validado exitosamente');
      } else {
        toast.success('Pago rechazado');
      }
      await loadAllData();
    } catch (error) {
      console.error('Error al procesar pago:', error);
      toast.error('Error al procesar pago');
    }
  };

  const handleAddCashPayment = async () => {
    if (!newCashPayment.casaId || !newCashPayment.amount || !newCashPayment.concept) {
      toast.warning('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      // Encontrar la casa seleccionada
      const casaSeleccionada = casas.find(casa => casa.houseId === newCashPayment.casaId);
      if (!casaSeleccionada) {
        toast.error('Casa no encontrada');
        return;
      }

      // Usar el primer usuario de la casa como referencia
      const primerUsuario = casaSeleccionada.usuarios[0];
      if (!primerUsuario) {
        toast.error('No hay usuarios en esta casa');
        return;
      }

      await CashPaymentService.registerCashPayment(residencialId, {
        residencialId,
        userId: primerUsuario.uid,
        userName: primerUsuario.fullName,
        userEmail: primerUsuario.email,
        userAddress: {
          calle: casaSeleccionada.calle,
          houseNumber: casaSeleccionada.houseNumber,
          pais: 'México',
          residencialID: residencialId,
        },
        amount: parseFloat(newCashPayment.amount),
        currency: 'MXN',
        concept: newCashPayment.concept,
        paymentMethod: 'cash',
        status: 'completed',
      });

      toast.success('Pago en efectivo registrado exitosamente');
      setCashPaymentDialog(false);
      setNewCashPayment({
        casaId: '',
        amount: '',
        concept: '',
        paymentDate: new Date().toISOString().split('T')[0],
      });
      setCasaSearchTerm('');
      await loadAllData();
    } catch (error) {
      console.error('Error al registrar pago:', error);
      toast.error('Error al registrar pago');
    }
  };

  const generateMonthlyReport = async () => {
    try {
      const ahora = new Date();
      await AccountingService.generateMonthlyReport(
        residencialId,
        ahora.getFullYear(),
        ahora.getMonth() + 1
      );
      
      toast.success('Reporte mensual generado exitosamente');
      await loadAllData();
    } catch (error) {
      console.error('Error al generar reporte:', error);
      toast.error('Error al generar reporte mensual');
    }
  };

  const exportToCSV = async () => {
    try {
      const fechaInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const fechaFin = new Date();
      const csvContent = await AccountingService.exportAccountingData(residencialId, fechaInicio, fechaFin);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pagos_${residencialId}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Datos exportados exitosamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar datos');
    }
  };

  const formatAmount = (amount: number, currency: string = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
    }).format(amount);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated':
      case 'paid':
      case 'al_dia': return 'bg-green-100 text-green-800';
      case 'pending_validation':
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
      case 'moroso': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'validated': return 'Validado';
      case 'pending_validation': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      case 'paid': return 'Pagado';
      case 'al_dia': return 'Al Día';
      case 'pendiente': return 'Pendiente';
      case 'moroso': return 'Moroso';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated':
      case 'paid':
      case 'al_dia': return <CheckCircle className="h-4 w-4" />;
      case 'pending_validation':
      case 'pendiente': return <Clock className="h-4 w-4" />;
      case 'rejected':
      case 'moroso': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredHouseStatuses = houseStatuses.filter(house => {
    const matchesStatus = statusFilter === 'all' || house.status === statusFilter;
    const matchesSearch = 
      searchTerm === '' ||
      house.calle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      house.houseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      house.houseId.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const filteredCasas = casas.filter(casa => {
    const searchLower = casaSearchTerm.toLowerCase();
    const matchesSearch = casaSearchTerm === '' ||
      (casa.calle && casa.calle.toLowerCase().includes(searchLower)) ||
      (casa.houseNumber && casa.houseNumber.toLowerCase().includes(searchLower)) ||
      (casa.houseId && casa.houseId.toLowerCase().includes(searchLower)) ||
      casa.usuarios.some(usuario => 
        usuario.fullName && usuario.fullName.toLowerCase().includes(searchLower)
      );
    
    console.log(`🏠 [FILTER] Casa: ${casa.calle} ${casa.houseNumber} (${casa.houseId}) - Matches: ${matchesSearch}`);
    return matchesSearch;
  });

  // Log para debuggear las casas
  console.log(`🏠 [RENDER] Total casas: ${casas.length}, Filtered: ${filteredCasas.length}`, casas);
  console.log(`💰 [RENDER] Pagos en efectivo: ${cashPayments.length}`, cashPayments);

  const filteredPendingPayments = pendingPayments.filter(payment => {
    const matchesSearch = 
      searchTerm === '' ||
      payment.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.userName && payment.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.numeroMovimiento && payment.numeroMovimiento.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="text-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
        <p className="mt-4 text-muted-foreground">Cargando datos de pagos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navegación simplificada */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveSection('overview')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'overview'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Resumen
        </button>
        <button
          onClick={() => setActiveSection('payments')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'payments'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pagos
        </button>
        <button
          onClick={() => setActiveSection('reports')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === 'reports'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Reportes
        </button>
      </div>

      {/* Sección de Resumen */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Estadísticas principales */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Ingresos</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatAmount(summary.totalIngresos)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Home className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">% Cobranza</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {summary.porcentajeCobranza.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <PieChart className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Casas Pagadas</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {summary.casasPagadas} / {summary.totalCasas}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Casas Morosas</p>
                      <p className="text-2xl font-bold text-red-600">
                        {summary.casasMorosas}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Acciones rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>
                Funciones más utilizadas para gestionar pagos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => setActiveSection('payments')} className="h-20">
                  <div className="text-center">
                    <Clock className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Validar Pagos</div>
                    <div className="text-xs text-muted-foreground">
                      {pendingPayments.length} pendientes
                    </div>
                  </div>
                </Button>
                
                <Button onClick={() => setCashPaymentDialog(true)} className="h-20">
                  <div className="text-center">
                    <Banknote className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Pago en Efectivo</div>
                    <div className="text-xs text-muted-foreground">
                      Registrar pago manual
                    </div>
                  </div>
                </Button>
                
                <Button onClick={generateMonthlyReport} className="h-20">
                  <div className="text-center">
                    <FileText className="h-6 w-6 mx-auto mb-2" />
                    <div className="text-sm font-medium">Generar Reporte</div>
                    <div className="text-xs text-muted-foreground">
                      Reporte mensual
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resumen de casas */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Casas</CardTitle>
              <CardDescription>
                Resumen del estado de pagos por casa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {houseStatuses.slice(0, 5).map((house) => (
                  <div key={house.houseId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Home className="h-5 w-5 text-gray-500" />
                      <div>
                        <div className="font-medium">{house.calle} {house.houseNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {house.ultimoPago ? 
                            `Último pago: ${formatDate(house.ultimoPago)}` : 
                            'Sin pagos registrados'
                          }
                        </div>
                      </div>
                    </div>
                    <Badge className={getStatusColor(house.status)}>
                      {getStatusIcon(house.status)}
                      <span className="ml-1">{getStatusLabel(house.status)}</span>
                    </Badge>
                  </div>
                ))}
                {houseStatuses.length > 5 && (
                  <div className="text-center pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveSection('payments')}
                      className="text-sm"
                    >
                      Ver todas las casas ({houseStatuses.length})
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sección de Pagos */}
      {activeSection === 'payments' && (
        <div className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por casa, usuario, concepto..."
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
                      <SelectItem value="all">Todos los Estados</SelectItem>
                      <SelectItem value="pending">Pendientes</SelectItem>
                      <SelectItem value="validated">Validados</SelectItem>
                      <SelectItem value="moroso">Morosos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={loadAllData} variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Actualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pagos pendientes de validación */}
          {filteredPendingPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span>Pagos Pendientes de Validación</span>
                  <Badge variant="secondary">{filteredPendingPayments.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Comprobantes de pago que requieren validación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredPendingPayments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="font-medium">{payment.concept}</div>
                              <div className="text-sm text-muted-foreground">
                                {payment.userName} • {payment.houseId} • {formatAmount(payment.amount)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(payment.fechaSubida)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleValidatePayment(payment.id!, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleValidatePayment(payment.id!, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagos en efectivo registrados */}
          {cashPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <span>Pagos en Efectivo Registrados</span>
                  <Badge variant="secondary">{cashPayments.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Pagos en efectivo registrados manualmente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cashPayments.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="font-medium">{payment.concept}</div>
                              <div className="text-sm text-muted-foreground">
                                {payment.userName} • {payment.userAddress.calle} {payment.userAddress.houseNumber} • {formatAmount(payment.amount)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Registrado el {formatDate(payment.fechaPago)} por {payment.registradoPor}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Completado
                          </Badge>
                          <span className="text-lg font-semibold text-green-600">
                            {formatAmount(payment.amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estado de casas */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Casas</CardTitle>
              <CardDescription>
                Estado de pagos de todas las casas del residencial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Casa</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Último Pago</TableHead>
                      <TableHead>Monto Esperado</TableHead>
                      <TableHead>Monto Pagado</TableHead>
                      <TableHead>Diferencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHouseStatuses.map((house) => (
                      <TableRow key={house.houseId}>
                        <TableCell>
                          <div className="font-medium">
                            {house.calle} {house.houseNumber}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {house.houseId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(house.status)}>
                            {getStatusIcon(house.status)}
                            <span className="ml-1">{getStatusLabel(house.status)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {house.ultimoPago ? formatDate(house.ultimoPago) : 'Sin pagos'}
                        </TableCell>
                        <TableCell>
                          {house.montoUltimoPago ? formatAmount(house.montoUltimoPago) : '$0.00'}
                        </TableCell>
                        <TableCell>
                          {house.montoUltimoPago ? formatAmount(house.montoUltimoPago) : '$0.00'}
                        </TableCell>
                        <TableCell>
                          <span className={house.status === 'al_dia' ? 'text-green-600' : 'text-red-600'}>
                            {house.status === 'al_dia' ? 'Al día' : 'Moroso'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sección de Reportes */}
      {activeSection === 'reports' && (
        <div className="space-y-6">
          {/* Acciones de reportes */}
          <Card>
            <CardHeader>
              <CardTitle>Generar Reportes</CardTitle>
              <CardDescription>
                Genera reportes mensuales y exporta datos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button onClick={generateMonthlyReport}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Generar Reporte Mensual
                </Button>
                <Button onClick={exportToCSV} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reportes existentes */}
          {reports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Reportes Generados</CardTitle>
                <CardDescription>
                  Historial de reportes mensuales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.mes} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            Reporte {report.mes}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Generado: {formatDate(report.fechaGeneracion)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            {formatAmount(report.totalIngresos)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {report.casasPagadas} / {report.totalCasas} casas
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Modal para pago en efectivo */}
      <Dialog open={cashPaymentDialog} onOpenChange={setCashPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pago en Efectivo</DialogTitle>
            <DialogDescription>
              Registra un pago en efectivo realizado por un residente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="casa">Casa *</Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Busca una casa..."
                    value={casaSearchTerm}
                    onChange={(e) => setCasaSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border rounded-md">
                  {filteredCasas.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      {casaSearchTerm ? 'No se encontraron casas' : 'No hay casas disponibles'}
                    </div>
                  ) : (
                    filteredCasas.map((casa) => (
                      <div
                        key={casa.houseId}
                        className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                          newCashPayment.casaId === casa.houseId ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => {
                          setNewCashPayment({...newCashPayment, casaId: casa.houseId});
                          setCasaSearchTerm('');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">
                              {casa.calle} {casa.houseNumber}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {casa.usuarios.length} usuario{casa.usuarios.length !== 1 ? 's' : ''}
                              {casa.morosos > 0 && (
                                <span className="ml-2 text-red-600">
                                  • {casa.morosos} moroso{casa.morosos !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge 
                            variant={casa.status === 'moroso' ? 'destructive' : 
                                   casa.status === 'al_dia' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {casa.status === 'moroso' ? 'Moroso' : 
                             casa.status === 'al_dia' ? 'Al Día' : 'Sin Usuarios'}
                          </Badge>
                        </div>
                        {casa.usuarios.length > 0 && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {casa.usuarios.map(usuario => usuario.fullName).join(', ')}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {newCashPayment.casaId && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    ✓ Casa seleccionada: {casas.find(c => c.houseId === newCashPayment.casaId)?.calle} {casas.find(c => c.houseId === newCashPayment.casaId)?.houseNumber}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="amount">Monto</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  value={newCashPayment.amount}
                  onChange={(e) => setNewCashPayment({...newCashPayment, amount: e.target.value})}
                  placeholder="0.00"
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="concept">Concepto</Label>
              <Input
                id="concept"
                value={newCashPayment.concept}
                onChange={(e) => setNewCashPayment({...newCashPayment, concept: e.target.value})}
                placeholder="Descripción del pago"
              />
            </div>
            
            <div>
              <Label htmlFor="paymentDate">Fecha de Pago</Label>
              <Input
                id="paymentDate"
                type="date"
                value={newCashPayment.paymentDate}
                onChange={(e) => setNewCashPayment({...newCashPayment, paymentDate: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCashPaymentDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddCashPayment}>
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedPaymentsDashboard;
