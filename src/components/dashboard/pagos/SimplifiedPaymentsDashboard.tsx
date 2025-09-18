import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  DollarSign, 
  TrendingUp, 
  Home, 
  Clock,
  AlertTriangle,
  Banknote,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
} from 'lucide-react';
import { 
  AccountingSummary, 
  AccountingService 
} from '@/lib/services/accounting-service';
import { PaymentValidationService, PaymentReceipt } from '@/lib/services/payment-validation-service';
import { CashPaymentService, CashPayment } from '@/lib/services/cash-payment-service';
import { AllPaymentsService, AllPayment } from '@/lib/services/all-payments-service';
import { HousePaymentStatusService, HousePaymentStatus } from '@/lib/services/house-payment-status-service';
import { CasasResidencialService, CasaResidencial } from '@/lib/services/casas-residencial-service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SimplifiedPaymentsDashboardProps {
  residencialId: string;
}

// Conceptos predefinidos para pagos
const PREDEFINED_CONCEPTS = [
  'Cuota Mensual',
  'Reserva',
  'Otros'
];

const SimplifiedPaymentsDashboard: React.FC<SimplifiedPaymentsDashboardProps> = ({
  residencialId,
}) => {
  const [loading, setLoading] = useState(true);
  
  // Estados para datos
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PaymentReceipt[]>([]);
  const [cashPayments, setCashPayments] = useState<CashPayment[]>([]);
  const [allPayments, setAllPayments] = useState<AllPayment[]>([]);
  const [houseStatuses, setHouseStatuses] = useState<HousePaymentStatus[]>([]);
  const [casas, setCasas] = useState<CasaResidencial[]>([]);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [conceptFilter, setConceptFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Estados para modales
  const [cashPaymentDialog, setCashPaymentDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState<CashPayment | null>(null);
  const [newCashPayment, setNewCashPayment] = useState({
    casaId: '',
    amount: '',
    concept: '',
    paymentDate: new Date().toISOString().split('T')[0],
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
  });
  const [casaSearchTerm, setCasaSearchTerm] = useState('');

  useEffect(() => {
    console.log(`🏠 [EFFECT] ResidencialId recibido: ${residencialId}`);
    loadAllData();
    
    // Escuchar el evento para abrir el modal de pago en efectivo
    const handleOpenCashPaymentModal = () => {
      setCashPaymentDialog(true);
    };
    
    window.addEventListener('openCashPaymentModal', handleOpenCashPaymentModal);
    
    return () => {
      window.removeEventListener('openCashPaymentModal', handleOpenCashPaymentModal);
    };
  }, [residencialId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      const fechaInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const fechaFin = new Date();
      
      const [
        summaryData,
        pendingData,
        cashData,
        houseData,
        casasData,
        allPaymentsData
      ] = await Promise.all([
        AccountingService.getAccountingSummary(residencialId, fechaInicio, fechaFin),
        PaymentValidationService.getPendingPayments(residencialId),
        CashPaymentService.getCashPayments(residencialId),
        HousePaymentStatusService.getHousePaymentStatuses(residencialId),
        CasasResidencialService.getCasasPorResidencial(residencialId),
        AllPaymentsService.getAllPayments(residencialId, fechaInicio, fechaFin)
      ]);
      
      setSummary(summaryData);
      setPendingPayments(pendingData);
      setCashPayments(cashData);
      setHouseStatuses(houseData);
      setCasas(casasData);
      setAllPayments(allPaymentsData);
      
      console.log(`🏠 [LOAD] Casas cargadas: ${casasData.length}`, casasData);
      console.log(`💰 [LOAD] Pagos en efectivo cargados: ${cashData.length}`, cashData);
      console.log(`📊 [LOAD] Summary cargado:`, summaryData);
      console.log(`📋 [LOAD] Pagos pendientes: ${pendingData.length}`, pendingData);
      console.log(`🏘️ [LOAD] Estados de casas: ${houseData.length}`, houseData);
      console.log(`💳 [LOAD] Todos los pagos: ${allPaymentsData.length}`, allPaymentsData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleValidatePayment = async (paymentId: string, action: 'approve' | 'reject') => {
    try {
      await PaymentValidationService.validatePayment(residencialId, paymentId, {
        pagoId: paymentId,
        status: action === 'approve' ? 'validated' as const : 'rejected' as const,
        observaciones: action === 'approve' ? 'Pago aprobado' : 'Pago rechazado',
        validadoPor: 'admin', // TODO: Obtener del contexto de auth
      });
      
      toast.success(`Pago ${action === 'approve' ? 'aprobado' : 'rechazado'} exitosamente`);
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

    // Mostrar diálogo de confirmación
    setCashPaymentDialog(false);
    setConfirmDialog(true);
  };

  const confirmCashPayment = async () => {
    try {
      // Encontrar la casa seleccionada
      const casaSeleccionada = casas.find(casa => casa.houseId === newCashPayment.casaId);
      if (!casaSeleccionada) {
        toast.error('Casa no encontrada');
        return;
      }

      // Obtener el primer usuario de la casa
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
        concept: `${newCashPayment.concept} - ${formatPeriod(newCashPayment.month)}`,
        paymentMethod: 'cash',
        status: 'completed',
      });

      toast.success('Pago en efectivo registrado exitosamente');
      setConfirmDialog(false);
      resetCashPaymentForm();
      await loadAllData();
    } catch (error) {
      console.error('Error al registrar pago:', error);
      toast.error('Error al registrar pago');
    }
  };

  const resetCashPaymentForm = () => {
    setNewCashPayment({
      casaId: '',
      amount: '',
      concept: '',
      paymentDate: new Date().toISOString().split('T')[0],
      month: new Date().toISOString().slice(0, 7),
    });
    setCasaSearchTerm('');
  };

  const handleEditPayment = (payment: CashPayment) => {
    setEditingPayment(payment);
    setEditDialog(true);
  };

  const handleUpdatePayment = async () => {
    if (!editingPayment) return;

    try {
      // TODO: Implementar actualización de pago
      toast.success('Pago actualizado exitosamente');
      setEditDialog(false);
      setEditingPayment(null);
      await loadAllData();
    } catch (error) {
      console.error('Error al actualizar pago:', error);
      toast.error('Error al actualizar pago');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      await CashPaymentService.deleteCashPayment(residencialId, paymentId);
      toast.success('Pago eliminado exitosamente');
      await loadAllData();
    } catch (error) {
      console.error('Error al eliminar pago:', error);
      toast.error('Error al eliminar pago');
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
      return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Función para formatear fecha en formato dd/mm/yyyy
  const formatDateInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy', { locale: es });
  };

  // Función para formatear período en formato mm-yyyy
  const formatPeriod = (monthString: string) => {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthNames[parseInt(month) - 1]}-${year}`;
  };


  // Filtrar casas para el modal
  const filteredCasas = casas.filter(casa => {
    const searchLower = casaSearchTerm.toLowerCase();
    const matchesSearch = casaSearchTerm === '' ||
      (casa.calle && casa.calle.toLowerCase().includes(searchLower)) ||
      (casa.houseNumber && casa.houseNumber.toLowerCase().includes(searchLower)) ||
      (casa.houseId && casa.houseId.toLowerCase().includes(searchLower)) ||
      casa.usuarios.some(usuario => 
        usuario.fullName && usuario.fullName.toLowerCase().includes(searchLower)
      );
    
    return matchesSearch;
  });

  // Filtrar pagos pendientes
  const filteredPendingPayments = pendingPayments.filter(payment => {
    const matchesSearch = 
      searchTerm === '' ||
      payment.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.userName && payment.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.numeroMovimiento && payment.numeroMovimiento.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // Filtrar pagos en efectivo con filtros avanzados
  const filteredCashPayments = cashPayments.filter(payment => {
    const matchesSearch = 
      searchTerm === '' ||
      payment.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.userAddress.calle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.userAddress.houseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesConcept = 
      conceptFilter === 'all' || 
      payment.concept.toLowerCase().includes(conceptFilter.toLowerCase());
    
    const matchesDate = 
      dateFilter === 'all' ||
      (dateFilter === 'today' && isToday(payment.fechaPago)) ||
      (dateFilter === 'week' && isThisWeek(payment.fechaPago)) ||
      (dateFilter === 'month' && isThisMonth(payment.fechaPago));
    
    return matchesSearch && matchesConcept && matchesDate;
  });

  // Filtrar casas por búsqueda
  const filteredHouseStatuses = houseStatuses.filter(house => {
    const matchesSearch = 
      searchTerm === '' ||
      house.calle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      house.houseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      house.houseId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      house.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Funciones auxiliares para filtros de fecha
  const isToday = (date: any) => {
    const today = new Date();
    const paymentDate = date instanceof Date ? date : date.toDate();
    return paymentDate.toDateString() === today.toDateString();
  };

  const isThisWeek = (date: any) => {
    const today = new Date();
    const paymentDate = date instanceof Date ? date : date.toDate();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return paymentDate >= weekAgo && paymentDate <= today;
  };

  const isThisMonth = (date: any) => {
    const today = new Date();
    const paymentDate = date instanceof Date ? date : date.toDate();
    return paymentDate.getMonth() === today.getMonth() && 
           paymentDate.getFullYear() === today.getFullYear();
  };

  return (
    <div className="space-y-6">
      {/* Header simplificado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Pagos</h1>
          <p className="text-muted-foreground">Supervisa y administra los pagos de los residentes</p>
        </div>
        <Button 
          onClick={() => setCashPaymentDialog(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Banknote className="mr-2 h-4 w-4" />
          Pago en Efectivo
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando datos...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Ingresos */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Ingresos</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatAmount(summary?.totalIngresos || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Este mes</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            {/* Casas al Día */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Casas al Día</p>
                    <p className="text-2xl font-bold text-green-600">
                      {houseStatuses.filter(h => h.status === 'al_dia').length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      de {houseStatuses.length} total
                    </p>
                  </div>
                  <Home className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            {/* Casas Pendientes */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Casas Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {houseStatuses.filter(h => h.status === 'pendiente').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Requieren atención</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            {/* Casas Morosas */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Casas Morosas</p>
                    <p className="text-2xl font-bold text-red-600">
                      {houseStatuses.filter(h => h.status === 'moroso').length}
                    </p>
                    <p className="text-xs text-muted-foreground">Acción requerida</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Búsqueda y Filtros Mejorados */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Búsqueda principal */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por casa, usuario, concepto..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Filtros avanzados */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Filtro por estado de casa */}
                  <div>
                    <Label className="text-sm font-medium">Estado de Casa</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los Estados</SelectItem>
                        <SelectItem value="al_dia">Al Día</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="moroso">Moroso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Filtro por concepto */}
                  <div>
                    <Label className="text-sm font-medium">Concepto</Label>
                    <Select value={conceptFilter} onValueChange={setConceptFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los conceptos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los Conceptos</SelectItem>
                        <SelectItem value="cuota mensual">Cuota Mensual</SelectItem>
                        <SelectItem value="reserva">Reserva</SelectItem>
                        <SelectItem value="otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Filtro por fecha */}
                  <div>
                    <Label className="text-sm font-medium">Período</Label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los períodos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los Períodos</SelectItem>
                        <SelectItem value="today">Hoy</SelectItem>
                        <SelectItem value="week">Esta Semana</SelectItem>
                        <SelectItem value="month">Este Mes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Botón de limpiar filtros */}
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setConceptFilter('all');
                      setDateFilter('all');
                    }}
                  >
                    Limpiar Filtros
                  </Button>
                </div>
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
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredPendingPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{payment.concept}</div>
                        <div className="text-sm text-muted-foreground">
                          {payment.userName} • {payment.houseId} • {formatAmount(payment.amount)}
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
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagos en efectivo registrados */}
          {filteredCashPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <span>Pagos en Efectivo Registrados</span>
                  <Badge variant="secondary">{filteredCashPayments.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredCashPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{payment.concept}</div>
                        <div className="text-sm text-muted-foreground">
                          {payment.userName} • {payment.userAddress.calle} {payment.userAddress.houseNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Registrado el {formatDate(payment.fechaPago)} por {payment.registradoPor}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Completado
                        </Badge>
                        <span className="text-lg font-semibold text-green-600">
                          {formatAmount(payment.amount)}
                        </span>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPayment(payment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (payment.id && confirm('¿Estás seguro de que quieres eliminar este pago?')) {
                                handleDeletePayment(payment.id);
                              }
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Todos los Pagos (Efectivo + Transferencias) */}
          {allPayments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <span>Todos los Pagos</span>
                  <Badge variant="secondary">{allPayments.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Lista completa de pagos (efectivo y transferencias)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-medium">{payment.userName}</div>
                            <div className="text-sm text-muted-foreground">
                              {payment.userAddress.calle} {payment.userAddress.houseNumber}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {payment.concept} • {formatDate(payment.fechaPago)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="font-medium text-lg">
                            ${payment.amount.toLocaleString('es-MX')}
                          </div>
                          <Badge 
                            variant={payment.paymentMethod === 'cash' ? 'default' : 'secondary'}
                            className={payment.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                          >
                            {payment.paymentType}
                          </Badge>
                        </div>
                        <div className="flex space-x-1">
                          <Badge variant="outline">
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de casas con estado */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Casas</CardTitle>
              <CardDescription>
                Lista completa de casas y su estado de pagos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredHouseStatuses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay casas registradas
                  </div>
                ) : (
                  filteredHouseStatuses.map((house) => (
                    <div key={house.houseId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
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
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant={house.status === 'al_dia' ? 'default' : 
                                  house.status === 'pendiente' ? 'secondary' : 'destructive'}
                          className={
                            house.status === 'al_dia' ? 'bg-green-100 text-green-800' :
                            house.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }
                        >
                          {house.status === 'al_dia' ? 'Al Día' :
                           house.status === 'pendiente' ? 'Pendiente' : 'Moroso'}
                        </Badge>
                        {house.montoUltimoPago && (
                          <span className="text-sm font-medium text-green-600">
                            {formatAmount(house.montoUltimoPago)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal para pago en efectivo - MEJORADO */}
      <Dialog open={cashPaymentDialog} onOpenChange={setCashPaymentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Registrar Pago en Efectivo</DialogTitle>
            <DialogDescription>
              Registra un pago en efectivo realizado por un residente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Selección de Casa */}
            <div className="space-y-3">
              <Label htmlFor="casa" className="text-sm font-medium">Casa *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Busca una casa..."
                  value={casaSearchTerm}
                  onChange={(e) => setCasaSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              
              {/* Lista de casas mejorada */}
              <div className="max-h-64 overflow-y-auto border rounded-lg bg-gray-50">
                {filteredCasas.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    {casaSearchTerm ? 'No se encontraron casas' : 'No hay casas disponibles'}
                  </div>
                ) : (
                  filteredCasas.map((casa) => (
                    <div
                      key={casa.houseId}
                      className={`p-4 cursor-pointer hover:bg-white transition-colors border-b last:border-b-0 ${
                        newCashPayment.casaId === casa.houseId ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => {
                        setNewCashPayment({...newCashPayment, casaId: casa.houseId});
                        setCasaSearchTerm('');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {casa.calle} {casa.houseNumber}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {casa.usuarios.map(usuario => usuario.fullName).join(', ')}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {casa.usuarios.length} usuario{casa.usuarios.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          {casa.morosos > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {casa.morosos} moroso{casa.morosos !== 1 ? 's' : ''}
                            </Badge>
                          )}
                          {newCashPayment.casaId === casa.houseId && (
                            <Badge variant="default" className="text-xs bg-green-600">
                              Seleccionada
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Información del pago */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Monto */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">Monto *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={newCashPayment.amount}
                    onChange={(e) => setNewCashPayment({...newCashPayment, amount: e.target.value})}
                    placeholder="0.00"
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              {/* Fecha de Pago */}
              <div className="space-y-2">
                <Label htmlFor="paymentDate" className="text-sm font-medium">Fecha de Pago</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={newCashPayment.paymentDate}
                  onChange={(e) => setNewCashPayment({...newCashPayment, paymentDate: e.target.value})}
                  className="h-11"
                />
              </div>
            </div>

            {/* Concepto del pago */}
            <div className="space-y-2">
              <Label htmlFor="concept" className="text-sm font-medium">Concepto del Pago *</Label>
              <Select 
                value={newCashPayment.concept} 
                onValueChange={(value) => setNewCashPayment({...newCashPayment, concept: value})}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecciona un concepto" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_CONCEPTS.map((concept) => (
                    <SelectItem key={concept} value={concept}>
                      {concept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período del pago */}
            <div className="space-y-2">
              <Label htmlFor="month" className="text-sm font-medium">Período del Pago</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="month"
                  type="month"
                  value={newCashPayment.month}
                  onChange={(e) => setNewCashPayment({...newCashPayment, month: e.target.value})}
                  className="h-11"
                />
                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded">
                  {formatPeriod(newCashPayment.month)}
                </div>
              </div>
            </div>

            {/* Resumen del pago */}
            {newCashPayment.casaId && newCashPayment.amount && newCashPayment.concept && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Resumen del Pago</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Casa:</span>
                    <span className="ml-2 text-blue-900">
                      {casas.find(c => c.houseId === newCashPayment.casaId)?.calle} {casas.find(c => c.houseId === newCashPayment.casaId)?.houseNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Monto:</span>
                    <span className="ml-2 text-blue-900 font-bold">
                      {formatAmount(parseFloat(newCashPayment.amount))}
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Concepto:</span>
                    <span className="ml-2 text-blue-900">{newCashPayment.concept}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Período:</span>
                    <span className="ml-2 text-blue-900">{formatPeriod(newCashPayment.month)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setCashPaymentDialog(false);
                resetCashPaymentForm();
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddCashPayment}
              disabled={!newCashPayment.casaId || !newCashPayment.amount || !newCashPayment.concept}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Registrar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Pago en Efectivo</DialogTitle>
            <DialogDescription>
              Revisa los datos antes de registrar el pago
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Resumen del Pago</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Casa:</span>
                  <span className="font-medium">
                    {casas.find(c => c.houseId === newCashPayment.casaId)?.calle} {casas.find(c => c.houseId === newCashPayment.casaId)?.houseNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Concepto:</span>
                  <span className="font-medium">{newCashPayment.concept}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Período:</span>
                  <span className="font-medium">{formatPeriod(newCashPayment.month)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto:</span>
                  <span className="font-bold text-green-600">{formatAmount(parseFloat(newCashPayment.amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span className="font-medium">{formatDateInput(newCashPayment.paymentDate)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialog(false);
                setCashPaymentDialog(true);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={confirmCashPayment} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de edición */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Pago en Efectivo</DialogTitle>
            <DialogDescription>
              Modifica los datos del pago seleccionado
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {editingPayment && (
              <>
                <div>
                  <Label htmlFor="edit-concept">Concepto</Label>
                  <Input
                    id="edit-concept"
                    defaultValue={editingPayment.concept}
                    placeholder="Descripción del pago"
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-amount">Monto</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="edit-amount"
                      type="number"
                      defaultValue={editingPayment.amount}
                      placeholder="0.00"
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="edit-date">Fecha de Pago</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    defaultValue={formatDate(editingPayment.fechaPago).split(' ')[0]}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialog(false);
                setEditingPayment(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdatePayment} className="bg-blue-600 hover:bg-blue-700">
              <Edit className="mr-2 h-4 w-4" />
              Actualizar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SimplifiedPaymentsDashboard;