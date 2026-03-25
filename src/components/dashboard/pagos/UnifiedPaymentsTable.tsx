/* eslint-disable @next/next/no-img-element */
import React from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Eye,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  MoreHorizontal,
  Banknote,
  CreditCard,
  Clock,
  AlertTriangle,
  Home,
  User,
  Calendar,
  DollarSign,
  X
} from "lucide-react";
import { PaymentReceipt } from '@/lib/services/payment-validation-service';
import { CashPayment } from '@/lib/services/cash-payment-service';
import { AllPayment } from '@/lib/services/all-payments-service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipo unificado para todos los pagos
export type UnifiedPayment = {
  id: string;
  type: 'transfer' | 'cash';
  status: string;
  fechaPago: any; // Timestamp o Date
  amount: number;
  concept: string;
  currency?: string;
  // Datos del usuario/casa
  userName?: string;
  userEmail?: string;
  houseAddress?: string;
  houseNumber?: string;
  // Datos específicos de transferencia
  numeroMovimiento?: string;
  bancoOrigen?: string;
  imageUrl?: string;
  // Datos específicos de efectivo
  registradoPor?: string;
  // Metadatos
  residencialId: string;
  userId?: string;
  casaId?: string;
};

interface UnifiedPaymentsTableProps {
  payments: UnifiedPayment[];
  loading: boolean;
  onValidatePayment?: (paymentId: string, validation: 'approved' | 'rejected', reason?: string) => void;
  onEditPayment?: (payment: UnifiedPayment) => void;
  onDeletePayment?: (payment: UnifiedPayment) => void;
  onViewReceipt?: (payment: UnifiedPayment) => void;
}

const UnifiedPaymentsTable: React.FC<UnifiedPaymentsTableProps> = ({
  payments,
  loading,
  onValidatePayment,
  onEditPayment,
  onDeletePayment,
  onViewReceipt,
}) => {
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean;
    payment: UnifiedPayment | null;
  }>({ open: false, payment: null });

  const [validationDialog, setValidationDialog] = React.useState<{
    open: boolean;
    payment: UnifiedPayment | null;
    action: 'approved' | 'rejected';
  }>({ open: false, payment: null, action: 'approved' });

  const [rejectionReason, setRejectionReason] = React.useState('');
  const [deleteReason, setDeleteReason] = React.useState('');

  const [zoomModal, setZoomModal] = React.useState<{
    open: boolean;
    imageUrl: string;
  }>({ open: false, imageUrl: '' });

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending_validation':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'paid':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Función para obtener el label del estado
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'validated':
      case 'completed':
        return 'Validado';
      case 'pendingValidation':
      case 'pending_validation':
        return 'Por Validar';
      case 'rejected':
        return 'Rechazado';
      case 'paid':
        return 'Pagado';
      default:
        return status;
    }
  };

  // Función para obtener el icono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending_validation':
        return <Clock className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'paid':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Función para obtener el icono del tipo de pago
  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Banknote className="h-4 w-4 text-green-600" />;
      case 'transfer':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  // Función para obtener el label del tipo de pago
  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'cash':
        return 'Efectivo';
      case 'transfer':
        return 'Transferencia';
      default:
        return type;
    }
  };

  // Función para formatear fecha
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'dd MMM yyyy', { locale: es });
    } catch (error) {
      return 'N/A';
    }
  };

  // Función para formatear monto
  const formatAmount = (amount: number, currency: string = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Función para obtener iniciales del usuario
  const getUserInitials = (userName?: string) => {
    if (!userName) return 'N/A';
    return userName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Función para manejar eliminación
  const handleDelete = (payment: UnifiedPayment) => {
    setDeleteDialog({ open: true, payment });
    setDeleteReason('');
  };

  // Función para confirmar eliminación
  const confirmDelete = () => {
    if (deleteDialog.payment && onDeletePayment) {
      // Si el pago está validado, forzamos a que tenga motivo para pasarlo en lugar del paymentId normal o dentro del objeto
      // Podemos pasarlo inyectándolo mutuamente. Por compatibilidad, dejaremos que SimplifiedPaymentsDashboardV2 
      // resuelva qué hacer con payment y deleteReason. Pasaremos deleteReason como propiedad temporal
      onDeletePayment({ ...deleteDialog.payment, concept: deleteReason ? deleteReason : deleteDialog.payment.concept } as any);
      setDeleteDialog({ open: false, payment: null });
      setDeleteReason('');
    }
  };

  // Función para manejar validación
  const handleValidation = (payment: UnifiedPayment, action: 'approved' | 'rejected') => {
    setValidationDialog({ open: true, payment, action });
    setRejectionReason('');
  };

  // Función para confirmar validación
  const confirmValidation = () => {
    if (validationDialog.payment && onValidatePayment) {
      onValidatePayment(
        validationDialog.payment.id,
        validationDialog.action,
        validationDialog.action === 'rejected' ? rejectionReason : undefined
      );
      setValidationDialog({ open: false, payment: null, action: 'approved' });
      setRejectionReason('');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos registrados</h3>
        <p className="text-gray-500">Los pagos aparecerán aquí cuando se registren.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Estado</TableHead>
              <TableHead className="min-w-[100px]">Tipo</TableHead>
              <TableHead className="min-w-[120px]">Fecha</TableHead>
              <TableHead className="min-w-[200px]">Usuario</TableHead>
              <TableHead className="min-w-[180px]">Casa</TableHead>
              <TableHead className="min-w-[120px]">Monto</TableHead>
              <TableHead className="min-w-[200px]">Concepto</TableHead>
              <TableHead className="min-w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id} className="hover:bg-gray-50">
                {/* Estado */}
                <TableCell>
                  <Badge className={`${getStatusColor(payment.status)} border`}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(payment.status)}
                      <span>{getStatusLabel(payment.status)}</span>
                    </div>
                  </Badge>
                </TableCell>

                {/* Tipo de Pago */}
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getPaymentTypeIcon(payment.type)}
                    <span className="text-sm font-medium">
                      {getPaymentTypeLabel(payment.type)}
                    </span>
                  </div>
                </TableCell>

                {/* Fecha */}
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{formatDate(payment.fechaPago)}</span>
                  </div>
                </TableCell>

                {/* Usuario */}
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getUserInitials(payment.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {payment.userName || 'N/A'}
                      </div>
                      {payment.userEmail && (
                        <div className="text-xs text-gray-500">
                          {payment.userEmail}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Casa */}
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Home className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">
                        {payment.houseAddress || payment.houseNumber
                          ? `${payment.houseAddress || ''} ${payment.houseNumber || ''}`.trim()
                          : (payment as any).casaId || 'N/A'
                        }
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Monto */}
                <TableCell>
                  <div className="font-semibold text-green-600">
                    {formatAmount(payment.amount, payment.currency)}
                  </div>
                </TableCell>

                {/* Concepto */}
                <TableCell>
                  <div className="text-sm">
                    {payment.concept || 'N/A'}
                  </div>
                </TableCell>

                {/* Acciones */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Ver comprobante (solo para transferencias) */}
                      {payment.type === 'transfer' && payment.imageUrl && (
                        <DropdownMenuItem onClick={() => onViewReceipt?.(payment)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Comprobante
                        </DropdownMenuItem>
                      )}

                      {/* Validar pago (solo para transferencias pendientes) */}
                      {payment.type === 'transfer' && (payment.status === 'pending_validation' || payment.status === 'pendingValidation') && (
                        <DropdownMenuItem
                          onClick={() => handleValidation(payment, 'approved')}
                          className="text-blue-600"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Validar Pago
                        </DropdownMenuItem>
                      )}

                      {/* Editar pago (solo para efectivo) */}
                      {payment.type === 'cash' && (
                        <DropdownMenuItem onClick={() => onEditPayment?.(payment)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      )}

                      {/* Eliminar pago */}
                      <DropdownMenuItem
                        onClick={() => handleDelete(payment)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de eliminación */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) =>
        setDeleteDialog({ open, payment: deleteDialog.payment })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-sm text-gray-500 mt-2">
                <p>
                  Esta acción no se puede deshacer. Se eliminará o revertirá el pago de{' '}
                  <strong>{formatAmount(deleteDialog.payment?.amount || 0)}</strong> de{' '}
                  <strong>{deleteDialog.payment?.userName}</strong>.
                </p>
                {deleteDialog.payment && ['validated', 'completed', 'paid'].includes(deleteDialog.payment.status) && (
                  <div className="space-y-2">
                    <label className="text-gray-900 font-medium font-semibold">
                      Motivo de la reversión (obligatorio)
                    </label>
                    <textarea
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="Ej. Pago duplicado, error en monto, etc."
                      className="w-full border rounded-md p-2 h-20 bg-white"
                      required
                    />
                    <p className="text-xs text-red-500 font-medium">Este pago ya impactó el Libro Mayor. Al eliminarlo, se creará un registro de reversión contable.</p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={!!deleteDialog.payment && ['validated', 'completed', 'paid'].includes(deleteDialog.payment.status) && deleteReason.trim().length === 0}
            >
              Confirmar Eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de validación mejorado */}
      <AlertDialog open={validationDialog.open} onOpenChange={(open) =>
        setValidationDialog({ open, payment: validationDialog.payment, action: validationDialog.action })
      }>
        <AlertDialogContent className="max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <span>Validar Pago</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Revisa los detalles del pago y toma una decisión
            </AlertDialogDescription>
          </AlertDialogHeader>

          {validationDialog.payment && (
            <div className="space-y-6">
              {/* Layout principal: Info a la izquierda, Comprobante a la derecha */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Columna izquierda: Información */}
                <div className="space-y-6">
                  {/* Datos del usuario */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center space-x-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <span>Información del Usuario</span>
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nombre:</span>
                        <span className="font-medium">{validationDialog.payment.userName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-sm">{validationDialog.payment.userEmail || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Casa:</span>
                        <span className="font-medium">
                          {validationDialog.payment.houseAddress && validationDialog.payment.houseNumber
                            ? `${validationDialog.payment.houseAddress} ${validationDialog.payment.houseNumber}`
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Datos del pago */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span>Detalles del Pago</span>
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monto:</span>
                        <span className="font-bold text-green-600 text-xl">
                          {formatAmount(validationDialog.payment.amount, validationDialog.payment.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Concepto:</span>
                        <span className="font-medium">{validationDialog.payment.concept || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Referencia:</span>
                        <span className="font-medium">{validationDialog.payment.numeroMovimiento || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Banco Origen:</span>
                        <span className="font-medium">{validationDialog.payment.bancoOrigen || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fecha:</span>
                        <span className="font-medium">{formatDate(validationDialog.payment.fechaPago)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Estado:</span>
                        <Badge className={`${getStatusColor(validationDialog.payment.status)} border`}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(validationDialog.payment.status)}
                            <span>{getStatusLabel(validationDialog.payment.status)}</span>
                          </div>
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Campo de motivo para rechazo */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Motivo del rechazo (opcional)</label>
                    <textarea
                      className="w-full p-3 border rounded-md resize-none"
                      placeholder="Ej: Comprobante no válido, monto incorrecto, información faltante..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Columna derecha: Comprobante */}
                {validationDialog.payment.imageUrl && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center space-x-2">
                      <Eye className="h-5 w-5 text-purple-600" />
                      <span>Comprobante</span>
                    </h3>
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <div className="relative">
                        <img
                          src={validationDialog.payment.imageUrl}
                          alt="Comprobante de pago"
                          className="w-full h-auto max-h-[500px] rounded-lg shadow-sm cursor-zoom-in hover:opacity-90 transition-opacity"
                          onClick={() => setZoomModal({
                            open: true,
                            imageUrl: validationDialog.payment?.imageUrl || ''
                          })}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden text-center text-gray-500 py-8">
                          <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                          <p>No se pudo cargar el comprobante</p>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          Haz clic para ampliar
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <AlertDialogFooter className="flex space-x-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (validationDialog.payment && onValidatePayment) {
                  onValidatePayment(
                    validationDialog.payment.id,
                    'rejected',
                    rejectionReason || 'Pago rechazado por el administrador'
                  );
                  setValidationDialog({ open: false, payment: null, action: 'approved' });
                  setRejectionReason('');
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Rechazar
            </AlertDialogAction>
            <AlertDialogAction
              onClick={confirmValidation}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Aprobar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de zoom para imagen */}
      <AlertDialog open={zoomModal.open} onOpenChange={(open) =>
        setZoomModal({ open, imageUrl: zoomModal.imageUrl })
      }>
        <AlertDialogContent className="max-w-6xl max-h-[90vh] p-0">
          <div className="relative">
            <img
              src={zoomModal.imageUrl}
              alt="Comprobante ampliado"
              className="w-full h-auto max-h-[85vh] rounded-lg"
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100"
              onClick={() => setZoomModal({ open: false, imageUrl: '' })}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UnifiedPaymentsTable;
