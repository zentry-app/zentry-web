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
  Plus, 
  DollarSign, 
  Home, 
  Calendar, 
  User, 
  Search,
  Filter,
  Loader2,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { CashPayment, CashPaymentService } from '@/lib/services/cash-payment-service';
import { getUsuariosPorResidencial, Usuario } from '@/lib/firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

interface CashPaymentManagementProps {
  residencialId: string;
}

const CashPaymentManagement: React.FC<CashPaymentManagementProps> = ({
  residencialId,
}) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<CashPayment[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [usuariosLoading, setUsuariosLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<CashPayment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [montoEsperado, setMontoEsperado] = useState('');

  useEffect(() => {
    loadPayments();
    loadUsuarios();
  }, [residencialId]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const paymentsData = await CashPaymentService.getCashPayments(residencialId);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error al cargar pagos en efectivo:', error);
      toast.error('Error al cargar pagos en efectivo');
    } finally {
      setLoading(false);
    }
  };

  const loadUsuarios = async () => {
    try {
      setUsuariosLoading(true);
      const usuariosData = await getUsuariosPorResidencial(residencialId);
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setUsuariosLoading(false);
    }
  };

  const openDialog = (payment?: CashPayment) => {
    if (payment) {
      setSelectedPayment(payment);
      setSelectedUser(payment.userId);
      setAmount(payment.amount.toString());
      setConcept(payment.concept);
      setObservaciones(payment.observaciones || '');
      setMontoEsperado(payment.montoEsperado?.toString() || '');
    } else {
      setSelectedPayment(null);
      setSelectedUser('');
      setAmount('');
      setConcept('');
      setObservaciones('');
      setMontoEsperado('');
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedUser || !amount || !concept) {
      toast.warning('Por favor completa todos los campos requeridos');
      return;
    }

    const selectedUsuario = usuarios.find(u => u.uid === selectedUser);
    if (!selectedUsuario) {
      toast.error('Usuario seleccionado no válido');
      return;
    }

    try {
      setDialogLoading(true);
      
      const paymentData = {
        residencialId,
        userId: selectedUser,
        userName: selectedUsuario.fullName,
        userEmail: selectedUsuario.email,
        userAddress: selectedUsuario.domicilio || {
          calle: '',
          houseNumber: '',
          pais: '',
          residencialID: residencialId,
        },
        amount: parseFloat(amount),
        currency: 'MXN',
        concept,
        paymentMethod: 'cash' as const,
        status: 'completed' as const,
        observaciones: observaciones.trim() || undefined,
        montoEsperado: montoEsperado ? parseFloat(montoEsperado) : undefined,
      };

      if (selectedPayment) {
        // Actualizar pago existente
        await CashPaymentService.updateCashPayment(
          residencialId,
          selectedPayment.id!,
          paymentData
        );
        toast.success('Pago en efectivo actualizado exitosamente');
      } else {
        // Crear nuevo pago
        await CashPaymentService.registerCashPayment(residencialId, paymentData);
        toast.success('Pago en efectivo registrado exitosamente');
      }

      setDialogOpen(false);
      await loadPayments();
    } catch (error) {
      console.error('Error al guardar pago:', error);
      toast.error('Error al guardar pago');
    } finally {
      setDialogLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha desconocida';
    
    try {
      const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
      return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
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
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      searchTerm === '' ||
      payment.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.userAddress?.calle && payment.userAddress.calle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.userAddress?.houseNumber && payment.userAddress.houseNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const totalRecaudado = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Recaudado</p>
                <p className="text-2xl font-bold">{formatAmount(totalRecaudado)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Home className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pagos</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <User className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Casas con Pagos</p>
                <p className="text-2xl font-bold">
                  {new Set(payments.map(p => `${p.userAddress?.calle}-${p.userAddress?.houseNumber}`)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Este Mes</p>
                <p className="text-2xl font-bold">
                  {payments.filter(p => {
                    const fechaPago = p.fechaPago instanceof Date ? p.fechaPago : p.fechaPago.toDate();
                    const ahora = new Date();
                    return fechaPago.getMonth() === ahora.getMonth() && fechaPago.getFullYear() === ahora.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y acciones */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Pagos en Efectivo</CardTitle>
              <CardDescription>
                Gestiona los pagos en efectivo por casa
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Pago
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, casa, concepto..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={loadPayments} variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de pagos */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
              <p className="mt-4 text-muted-foreground">Cargando pagos...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center p-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay pagos en efectivo registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Casa</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Registrado por</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {formatDate(payment.fechaPago)}
                          </div>
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
                        <Badge className={getStatusColor(payment.status)}>
                          {getStatusLabel(payment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{payment.registradoPor}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog(payment)}
                            className="flex items-center space-x-1"
                          >
                            <Edit className="h-4 w-4" />
                            <span>Editar</span>
                          </Button>
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

      {/* Diálogo de registro/edición */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPayment ? 'Editar Pago en Efectivo' : 'Registrar Pago en Efectivo'}
            </DialogTitle>
            <DialogDescription>
              {selectedPayment 
                ? 'Modifica los detalles del pago en efectivo.'
                : 'Registra un nuevo pago en efectivo recibido.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="usuario">Residente *</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un residente" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.map((usuario) => (
                      <SelectItem key={usuario.uid} value={usuario.uid}>
                        {usuario.fullName} ({usuario.domicilio?.calle} #{usuario.domicilio?.houseNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="monto">Monto *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="monto"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="concepto">Concepto *</Label>
              <Input
                id="concepto"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Ej: Mantenimiento Enero 2024"
              />
            </div>
            
            <div>
              <Label htmlFor="montoEsperado">Monto Esperado</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="montoEsperado"
                  type="number"
                  value={montoEsperado}
                  onChange={(e) => setMontoEsperado(e.target.value)}
                  placeholder="0.00"
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={dialogLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={dialogLoading}
            >
              {dialogLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedPayment ? 'Actualizar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashPaymentManagement;
