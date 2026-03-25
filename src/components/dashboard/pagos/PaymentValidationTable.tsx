/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  DollarSign, 
  User, 
  Home, 
  Calendar,
  Loader2,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { PaymentReceipt, PaymentValidationService } from '@/lib/services/payment-validation-service';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentValidationTableProps {
  residencialId: string;
}

const PaymentValidationTable: React.FC<PaymentValidationTableProps> = ({
  residencialId,
}) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentReceipt | null>(null);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending_validation');
  const [searchTerm, setSearchTerm] = useState('');

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const paymentsData = await PaymentValidationService.getAllPayments(
        residencialId,
        statusFilter
      );
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      toast.error('Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  }, [residencialId, statusFilter]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleValidatePayment = async (status: 'validated' | 'rejected') => {
    if (!selectedPayment || !user) return;

    try {
      setValidationLoading(true);
      
      await PaymentValidationService.validatePayment(residencialId, selectedPayment.id, {
        pagoId: selectedPayment.id,
        status,
        observaciones: observaciones.trim() || undefined,
        validadoPor: user.uid,
      });

      toast.success(`Pago ${status === 'validated' ? 'validado' : 'rechazado'} exitosamente`);
      setValidationDialogOpen(false);
      setObservaciones('');
      setSelectedPayment(null);
      await loadPayments();
    } catch (error) {
      console.error('Error al validar pago:', error);
      toast.error('Error al validar pago');
    } finally {
      setValidationLoading(false);
    }
  };

  const openValidationDialog = (payment: PaymentReceipt) => {
    setSelectedPayment(payment);
    setValidationDialogOpen(true);
    setObservaciones('');
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha desconocida';
    
    try {
      const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
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
      case 'validated': return 'bg-green-100 text-green-800';
      case 'pending_validation': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'validated': return 'Validado';
      case 'pending_validation': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      case 'paid': return 'Pagado';
      default: return status;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      searchTerm === '' ||
      payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.numeroMovimiento && payment.numeroMovimiento.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.userAddress?.calle && payment.userAddress.calle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.userAddress?.houseNumber && payment.userAddress.houseNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status-filter">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_validation">Pendientes</SelectItem>
                  <SelectItem value="validated">Validados</SelectItem>
                  <SelectItem value="rejected">Rechazados</SelectItem>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search">Búsqueda</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre, concepto..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={loadPayments} variant="outline" className="w-full">
                <Filter className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de pagos */}
      <Card>
        <CardHeader>
          <CardTitle>Pagos {statusFilter === 'pending_validation' ? 'Pendientes' : 'Validados'}</CardTitle>
          <CardDescription>
            {filteredPayments.length} pagos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
              <p className="mt-4 text-muted-foreground">Cargando pagos...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center p-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay pagos para mostrar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Domicilio</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <Badge className={getStatusColor(payment.status)}>
                          {getStatusLabel(payment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {formatDate(payment.fechaSubida)}
                          </div>
                          {payment.fechaValidacion && (
                            <div className="text-xs text-muted-foreground">
                              Validado: {formatDate(payment.fechaValidacion)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{payment.userName}</div>
                          <div className="text-xs text-muted-foreground">{payment.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1 text-sm font-medium">
                            <Home className="h-3 w-3 text-blue-500" />
                            <span>
                              {payment.userAddress?.calle || 'Sin calle'} #{payment.userAddress?.houseNumber || 'S/N'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {payment.userAddress?.pais || 'Sin país'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <div>
                            <div className="font-bold text-green-600">
                              {formatAmount(payment.amount, payment.currency)}
                            </div>
                            {payment.montoEsperado && payment.montoEsperado !== payment.amount && (
                              <div className="text-xs text-muted-foreground">
                                Esperado: {formatAmount(payment.montoEsperado, payment.currency)}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="text-sm truncate" title={payment.concept}>
                            {payment.concept}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {payment.numeroMovimiento ? (
                            <div>
                              <div className="font-medium">{payment.numeroMovimiento}</div>
                              {payment.bancoOrigen && (
                                <div className="text-xs text-muted-foreground">
                                  {payment.bancoOrigen}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin referencia</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openValidationDialog(payment)}
                            className="flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Ver</span>
                          </Button>
                          {payment.status === 'pending_validation' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleValidatePayment('validated')}
                                className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span>Validar</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleValidatePayment('rejected')}
                                className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                                <span>Rechazar</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de validación */}
      <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Validar Pago</DialogTitle>
            <DialogDescription>
              Revisa los detalles del pago y decide si validarlo o rechazarlo.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-6">
              {/* Información del pago */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Usuario</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="font-medium">{selectedPayment.userName}</div>
                    <div className="text-sm text-muted-foreground">{selectedPayment.userEmail}</div>
                  </div>
                </div>
                <div>
                  <Label>Domicilio</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="font-medium">
                      {selectedPayment.userAddress?.calle} #{selectedPayment.userAddress?.houseNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedPayment.userAddress?.pais}
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Monto</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="font-medium text-lg">
                      {formatAmount(selectedPayment.amount, selectedPayment.currency)}
                    </div>
                    {selectedPayment.montoEsperado && (
                      <div className="text-sm text-muted-foreground">
                        Esperado: {formatAmount(selectedPayment.montoEsperado, selectedPayment.currency)}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Concepto</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="font-medium">{selectedPayment.concept}</div>
                  </div>
                </div>
              </div>

              {/* Comprobante */}
              {selectedPayment.comprobanteUrl && (
                <div>
                  <Label>Comprobante</Label>
                  <div className="mt-2">
                    <img
                      src={selectedPayment.comprobanteUrl}
                      alt="Comprobante de pago"
                      className="max-w-full h-auto rounded-md border"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>
                </div>
              )}

              {/* Referencia */}
              {(selectedPayment.numeroMovimiento || selectedPayment.bancoOrigen) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedPayment.numeroMovimiento && (
                    <div>
                      <Label>Número de Movimiento</Label>
                      <div className="p-3 bg-muted rounded-md">
                        <div className="font-medium">{selectedPayment.numeroMovimiento}</div>
                      </div>
                    </div>
                  )}
                  {selectedPayment.bancoOrigen && (
                    <div>
                      <Label>Banco Origen</Label>
                      <div className="p-3 bg-muted rounded-md">
                        <div className="font-medium">{selectedPayment.bancoOrigen}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Observaciones */}
              <div>
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Agrega observaciones sobre la validación..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setValidationDialogOpen(false)}
              disabled={validationLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => handleValidatePayment('rejected')}
              disabled={validationLoading}
              className="text-red-600 hover:text-red-700"
            >
              {validationLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rechazar
            </Button>
            <Button
              onClick={() => handleValidatePayment('validated')}
              disabled={validationLoading}
            >
              {validationLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Validar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentValidationTable;
