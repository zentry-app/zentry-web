import React, { useState, useEffect, useCallback } from 'react';
import { onSnapshot, collection, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
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
  Filter,
  RefreshCw,
  Settings,
} from 'lucide-react';
import PaymentConfigurationDialog from './PaymentConfigurationDialog';
import {
  AccountingSummary,
  AccountingService
} from '@/lib/services/accounting-service';
import { PaymentValidationService, PaymentReceipt } from '@/lib/services/payment-validation-service';
import { CashPaymentService, CashPayment } from '@/lib/services/cash-payment-service';
import { AllPaymentsService, AllPayment } from '@/lib/services/all-payments-service';
import { HousePaymentStatusService, HousePaymentStatus } from '@/lib/services/house-payment-status-service';
import { CasasResidencialService, CasaResidencial } from '@/lib/services/casas-residencial-service';
import { UnifiedPaymentsService, UnifiedPayment } from '@/lib/services/unified-payments-service';
import { CatalogService, Product } from '@/lib/services/catalog-service';
import UnifiedPaymentsTable from './UnifiedPaymentsTable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SimplifiedPaymentsDashboardProps {
  residencialId: string;
}

const SimplifiedPaymentsDashboard: React.FC<SimplifiedPaymentsDashboardProps> = ({
  residencialId,
}) => {
  const [loading, setLoading] = useState(true);

  // Estados para datos
  const [unifiedPayments, setUnifiedPayments] = useState<UnifiedPayment[]>([]);
  const [houseStatuses, setHouseStatuses] = useState<HousePaymentStatus[]>([]);
  const [casas, setCasas] = useState<CasaResidencial[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Estados para modales
  const [cashPaymentDialog, setCashPaymentDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [configDialog, setConfigDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState<CashPayment | null>(null);
  const [newCashPayment, setNewCashPayment] = useState({
    casaId: '',
    amount: '',
    concept: '',
    paymentDate: new Date().toISOString().split('T')[0],
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
  });
  const [casaSearchTerm, setCasaSearchTerm] = useState('');

  const loadAllData = useCallback(async () => {
    if (!residencialId) return;

    setLoading(true);
    try {
      console.log(`📊 [LOAD] Cargando datos para residencial: ${residencialId}`);

      // Cargar datos usando los servicios originales
      const [allPayments, cashPayments, houseStatusesData, casasData, productosData] = await Promise.all([
        AllPaymentsService.getAllPayments(residencialId),
        CashPaymentService.getCashPayments(residencialId),
        HousePaymentStatusService.getHousePaymentStatuses(residencialId),
        CasasResidencialService.getCasasPorResidencial(residencialId),
        CatalogService.getProducts(residencialId),
      ]);

      console.log(`📊 [LOAD] Datos cargados:`, {
        allPayments: allPayments.length,
        cashPayments: cashPayments.length,
        houseStatuses: houseStatusesData.length,
        casas: casasData.length,
        productos: productosData.length,
      });

      // Convertir a formato unificado usando AllPaymentsService
      const unifiedPaymentsData: UnifiedPayment[] = allPayments.map(payment =>
        UnifiedPaymentsService.convertAllPaymentToUnified(payment)
      );

      // Ordenar por fecha (más recientes primero)
      unifiedPaymentsData.sort((a, b) => {
        const dateA = a.fechaPago?.toDate ? a.fechaPago.toDate() : new Date(a.fechaPago);
        const dateB = b.fechaPago?.toDate ? b.fechaPago.toDate() : new Date(b.fechaPago);
        return dateB.getTime() - dateA.getTime();
      });

      setUnifiedPayments(unifiedPaymentsData);
      setHouseStatuses(houseStatusesData);
      setCasas(casasData);
      setProductos(productosData);

    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error cargando datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, [residencialId]);

  useEffect(() => {
    console.log(`🏠 [EFFECT] ResidencialId recibido: ${residencialId}`);
    if (residencialId) {
      loadAllData();
    }
  }, [loadAllData, residencialId]);

  // Listener en tiempo real para pagos
  useEffect(() => {
    if (!residencialId) return;

    console.log(`🔄 [REALTIME] Configurando listener para residencial: ${residencialId}`);

    const paymentsRef = collection(db, 'residenciales', residencialId, 'paymentIntents');
    const q = query(paymentsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`🔄 [REALTIME] Cambio detectado: ${snapshot.docs.length} documentos`);

      if (snapshot.docs.length > 0) {
        console.log('🔄 [REALTIME] Recargando datos automáticamente...');
        loadAllData();
      }
    }, (error) => {
      console.error('❌ [REALTIME] Error en listener:', error);
    });

    return () => {
      console.log('🔄 [REALTIME] Limpiando listener');
      unsubscribe();
    };
  }, [loadAllData, residencialId]);

  // Filtrar pagos unificados
  const filteredPayments = UnifiedPaymentsService.filterPayments(unifiedPayments, {
    searchTerm,
    statusFilter,
    typeFilter,
    dateFilter,
  });

  // Obtener estadísticas de pagos
  const paymentStats = UnifiedPaymentsService.getPaymentStats(unifiedPayments);

  // Filtrar casas para el modal
  const filteredCasas = casas.filter(casa =>
    casaSearchTerm === '' ||
    casa.calle.toLowerCase().includes(casaSearchTerm.toLowerCase()) ||
    casa.houseNumber.toLowerCase().includes(casaSearchTerm.toLowerCase()) ||
    casa.usuarios.some(usuario =>
      usuario.fullName.toLowerCase().includes(casaSearchTerm.toLowerCase())
    )
  );

  // Funciones de utilidad
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatDateInput = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM yyyy', { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatTimestampForInput = (timestamp: any) => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'yyyy-MM-dd');
    } catch {
      return '';
    }
  };

  const formatPeriod = (monthString: string) => {
    try {
      const [year, month] = monthString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return format(date, 'MMMM yyyy', { locale: es });
    } catch {
      return monthString;
    }
  };

  // Manejar validación de pagos
  const handleValidatePayment = async (paymentId: string, validation: 'approved' | 'rejected', reason?: string) => {
    try {
      await PaymentValidationService.validatePayment(residencialId, paymentId, {
        pagoId: paymentId,
        status: validation === 'approved' ? 'validated' : 'rejected',
        validadoPor: 'admin',
        observaciones: reason || '',
      });

      toast.success(validation === 'approved' ? 'Pago aprobado y saldo actualizado' : 'Pago rechazado');
      loadAllData(); // Recargar datos
    } catch (error) {
      console.error('Error validando pago:', error);
      toast.error('Error al validar el pago');
    }
  };

  // Manejar edición de pagos
  const handleEditPayment = (payment: UnifiedPayment) => {
    if (payment.type === 'cash') {
      // Convertir a CashPayment para edición
      const cashPayment: CashPayment = {
        id: payment.id,
        amount: payment.amount,
        concept: payment.concept,
        currency: payment.currency || 'MXN',
        fechaPago: payment.fechaPago,
        paymentMethod: 'cash',
        status: payment.status as 'completed' | 'pending' | 'cancelled',
        registradoPor: payment.registradoPor || 'admin',
        residencialId: payment.residencialId,
        userId: payment.userId || '',
        userName: payment.userName || '',
        userEmail: payment.userEmail || '',
        userAddress: {
          calle: payment.houseAddress || '',
          houseNumber: payment.houseNumber || '',
          pais: 'México',
          residencialID: payment.residencialId,
        },
      };
      setEditingPayment(cashPayment);
      setEditDialog(true);
    }
  };

  // Manejar eliminación o reversión de pagos
  const handleDeletePayment = async (payment: UnifiedPayment) => {
    try {
      if (['validated', 'completed', 'paid'].includes(payment.status)) {
        // En lugar de borrarlo de Firestore, pedimos al LedgerEngine que genere un REVERSAL contable
        const reason = payment.concept || 'Reversión solicitada por administrador';
        await PaymentValidationService.reversePayment(residencialId, payment.id, reason);
        toast.success(`Pago revertido exitosamente. La deuda ha sido devuelta al residente.`);
      } else {
        // Si el pago no había tocado el Ledger (efectivo ingresado por error o transferencia rechazada)
        if (payment.type === 'cash') {
          // El servicio puede borrar el draft
          await CashPaymentService.deleteCashPayment(residencialId, payment.id);
        } else {
          // Si es transferencia y está pediente, simplemente lo rechazamos (soft-delete visual)
          await PaymentValidationService.validatePayment(residencialId, payment.id, {
            pagoId: payment.id,
            status: 'rejected',
            validadoPor: 'admin',
            observaciones: 'Cancelado por el administrador antes de su validación.'
          });
        }
        toast.success('Pago eliminado');
      }

      loadAllData(); // Recargar datos
    } catch (error: any) {
      console.error('Error eliminando/revirtiendo pago:', error);
      toast.error(error.message || 'Error al procesar la cancelación del pago');
    }
  };

  // Manejar visualización de comprobantes
  const handleViewReceipt = (payment: UnifiedPayment) => {
    if (payment.imageUrl) {
      window.open(payment.imageUrl, '_blank');
    }
  };

  // Manejar agregar pago en efectivo
  const handleAddCashPayment = () => {
    if (!newCashPayment.casaId || !newCashPayment.amount || !newCashPayment.concept) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }
    setConfirmDialog(true);
  };

  // Función para notificar a todos los usuarios de la casa sobre el pago en efectivo
  const notifyAllHouseUsersCashPayment = async (paymentData: any, selectedCasa: any) => {
    try {
      if (!selectedCasa.usuarios || selectedCasa.usuarios.length === 0) {
        console.log('⚠️ No hay usuarios en la casa, saltando notificaciones');
        return;
      }

      console.log(`🔔 Creando notificaciones para ${selectedCasa.usuarios.length} usuarios de la casa`);

      // Crear notificaciones para cada usuario de la casa
      for (const usuario of selectedCasa.usuarios) {
        await addDoc(collection(db, 'usuarios', usuario.uid, 'notificaciones'), {
          title: 'Pago en Efectivo Registrado',
          message: `Tu ${paymentData.concept} de $${paymentData.amount.toFixed(2)} del mes ${paymentData.mes} ha sido registrado en efectivo por el administrador.`,
          type: 'payment_cash_registered',
          priority: 'normal',
          read: false,
          timestamp: serverTimestamp(),
          data: {
            paymentId: paymentData.paymentId,
            amount: paymentData.amount,
            mes: paymentData.mes,
            concept: paymentData.concept,
            status: 'completed',
            residencialId: paymentData.residencialId,
            paymentMethod: 'cash',
            registradoPor: paymentData.registradoPor,
            calle: paymentData.calle,
            houseNumber: paymentData.houseNumber,
          },
          titleColor: '#000000',
        });

        console.log(`✅ Notificación creada para usuario: ${usuario.fullName} (${usuario.email})`);
      }

      console.log(`✅ ${selectedCasa.usuarios.length} notificaciones de pago en efectivo creadas exitosamente`);
    } catch (error) {
      console.error('❌ Error al crear notificaciones de pago en efectivo:', error);
      toast.error('Error al crear notificaciones');
    }
  };

  // Confirmar pago en efectivo
  const confirmCashPayment = async () => {
    try {
      const selectedCasa = casas.find(c => c.houseId === newCashPayment.casaId);
      if (!selectedCasa) {
        toast.error('Casa no encontrada');
        return;
      }

      // Buscar si el concepto es un producto para pasar sus metadatos
      const selectedProduct = productos.find(p => p.name === newCashPayment.concept);

      // Registrar el pago en efectivo
      const docId = await CashPaymentService.registerCashPayment(residencialId, {
        amount: parseFloat(newCashPayment.amount),
        concept: newCashPayment.concept,
        currency: 'MXN',
        paymentMethod: 'cash',
        status: 'pending_validation',
        residencialId: residencialId,
        userId: selectedCasa.usuarios[0]?.uid || '',
        userName: selectedCasa.usuarios[0]?.fullName || '',
        userEmail: selectedCasa.usuarios[0]?.email || '',
        userAddress: {
          calle: selectedCasa.calle,
          houseNumber: selectedCasa.houseNumber,
          pais: 'México',
          residencialID: residencialId,
        },
        // 🆕 Campos adicionales para compatibilidad con Flutter y ERP v2
        houseId: selectedCasa.houseId,
        mes: newCashPayment.month,
        concepto: newCashPayment.concept,
        isProduct: !!selectedProduct && selectedProduct.id !== 'default_cuota',
        productId: selectedProduct?.id || undefined,
        productPrice: selectedProduct?.priceCents || 0
      });

      // 🆕 Crear notificaciones para TODOS los usuarios de la casa
      const paymentData = {
        paymentId: docId, // Usar el ID real
        amount: parseFloat(newCashPayment.amount),
        concept: newCashPayment.concept,
        mes: newCashPayment.month,
        residencialId: residencialId,
        registradoPor: 'Administrador',
        calle: selectedCasa.calle,
        houseNumber: selectedCasa.houseNumber,
      };

      await notifyAllHouseUsersCashPayment(paymentData, selectedCasa);

      toast.success('Pago en efectivo registrado exitosamente');
      setConfirmDialog(false);
      setCashPaymentDialog(false);
      resetCashPaymentForm();
      loadAllData(); // Recargar datos
    } catch (error) {
      console.error('Error registrando pago:', error);
      toast.error('Error al registrar el pago');
    }
  };

  // Resetear formulario
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

  // Manejar actualización de pago
  const handleUpdatePayment = async () => {
    if (!editingPayment) return;

    try {
      // Aquí implementarías la lógica de actualización
      toast.success('Pago actualizado');
      setEditDialog(false);
      setEditingPayment(null);
      loadAllData();
    } catch (error) {
      console.error('Error actualizando pago:', error);
      toast.error('Error al actualizar el pago');
    }
  };

  // Manejar gatillo de facturación
  const handleTriggerBilling = async () => {
    try {
      setLoading(true);
      await PaymentValidationService.triggerManualBilling(residencialId);
      toast.success('Facturación mensual iniciada con éxito');
      loadAllData();
    } catch (error: any) {
      console.error('Error disparando facturación:', error);
      toast.error(error.message || 'Error al disparar facturación');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando datos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pagos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {formatAmount(paymentStats.totalAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{paymentStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Requieren validación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paymentStats.validated}</div>
            <p className="text-xs text-muted-foreground">
              Pagos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Casas</CardTitle>
            <Home className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{houseStatuses.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de casas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros y Búsqueda</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Usuario, casa, concepto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por estado */}
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending_validation">Pendiente</SelectItem>
                  <SelectItem value="validated">Validado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por tipo */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por fecha */}
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las fechas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fechas</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="this_week">Esta semana</SelectItem>
                  <SelectItem value="this_month">Este mes</SelectItem>
                  <SelectItem value="last_month">Mes pasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla unificada de pagos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span>Todos los Pagos</span>
                <Badge variant="secondary">{filteredPayments.length}</Badge>
              </CardTitle>
              <CardDescription>
                Lista completa de pagos (efectivo y transferencias)
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {process.env.NODE_ENV !== 'production' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTriggerBilling}
                  disabled={loading}
                  className="text-[10px] text-muted-foreground opacity-30 hover:opacity-100 h-8 px-2"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Gatillo Facturación (Dev)
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfigDialog(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar Pagos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAllData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button
                onClick={() => setCashPaymentDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Pago en Efectivo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UnifiedPaymentsTable
            payments={filteredPayments}
            loading={loading}
            onValidatePayment={handleValidatePayment}
            onEditPayment={handleEditPayment}
            onDeletePayment={handleDeletePayment}
            onViewReceipt={handleViewReceipt}
          />
        </CardContent>
      </Card>

      {/* Modal de pago en efectivo */}
      <Dialog open={cashPaymentDialog} onOpenChange={setCashPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Pago en Efectivo</DialogTitle>
            <DialogDescription>
              Registra un pago en efectivo realizado por un residente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Selección de casa */}
            <div className="space-y-2">
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

              {/* Lista de casas */}
              <div className="max-h-64 overflow-y-auto border rounded-lg bg-gray-50">
                {filteredCasas.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    {casaSearchTerm ? 'No se encontraron casas' : 'No hay casas disponibles'}
                  </div>
                ) : (
                  filteredCasas.map((casa) => (
                    <div
                      key={casa.houseId}
                      className={`p-4 cursor-pointer hover:bg-white transition-colors border-b last:border-b-0 ${newCashPayment.casaId === casa.houseId ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      onClick={() => {
                        setNewCashPayment({ ...newCashPayment, casaId: casa.houseId });
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
                        </div>
                        {newCashPayment.casaId === casa.houseId && (
                          <Badge variant="default" className="text-xs bg-green-600">
                            Seleccionada
                          </Badge>
                        )}
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
                    onChange={(e) => setNewCashPayment({ ...newCashPayment, amount: e.target.value })}
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
                  onChange={(e) => setNewCashPayment({ ...newCashPayment, paymentDate: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>

            {/* Concepto del pago */}
            <div className="space-y-2">
              <Label htmlFor="concept" className="text-sm font-medium">Concepto del Pago *</Label>
              <Select
                value={newCashPayment.concept}
                onValueChange={(value) => {
                  const prod = productos.find(p => p.name === value);
                  const newAmount = prod && prod.priceCents > 0 && (!newCashPayment.amount || newCashPayment.amount === '0')
                    ? (prod.priceCents / 100).toString()
                    : newCashPayment.amount;

                  setNewCashPayment({
                    ...newCashPayment,
                    concept: value,
                    amount: newAmount
                  });
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecciona un concepto" />
                </SelectTrigger>
                <SelectContent>
                  {/* Inyectar Cuota Mensual si no está en productos */}
                  {(!productos.some(p => p.name.toLowerCase().includes('cuota') || p.name.toLowerCase().includes('mantenimiento'))) && (
                    <SelectItem value="Cuota Mensual">
                      Cuota Mensual
                    </SelectItem>
                  )}
                  {productos.map((prod) => (
                    <SelectItem key={prod.id} value={prod.name}>
                      {prod.name} {prod.priceCents > 0 ? `(${formatAmount(prod.priceCents / 100)})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Resumen del pago */}
            {newCashPayment.casaId && newCashPayment.amount && newCashPayment.concept && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Resumen del Pago</h4>
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
                    <span className="text-muted-foreground">Monto:</span>
                    <span className="font-bold text-green-600">{formatAmount(parseFloat(newCashPayment.amount))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha:</span>
                    <span className="font-medium">{formatDateInput(newCashPayment.paymentDate)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCashPaymentDialog(false);
                resetCashPaymentForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddCashPayment}
              disabled={!newCashPayment.casaId || !newCashPayment.amount || !newCashPayment.concept}
              className="bg-green-600 hover:bg-green-700"
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
              ¿Estás seguro de que quieres registrar este pago?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
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
                <span className="text-muted-foreground">Monto:</span>
                <span className="font-bold text-green-600">{formatAmount(parseFloat(newCashPayment.amount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha:</span>
                <span className="font-medium">{formatDateInput(newCashPayment.paymentDate)}</span>
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
                    defaultValue={formatTimestampForInput(editingPayment.fechaPago)}
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
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de configuración de pagos */}
      <PaymentConfigurationDialog
        open={configDialog}
        onOpenChange={setConfigDialog}
        residencialId={residencialId}
        residencialName="Residencial" // Aquí podrías obtener el nombre real del residencial
      />
    </div>
  );
};

export default SimplifiedPaymentsDashboard;
