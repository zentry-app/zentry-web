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
  FileText
} from 'lucide-react';
import {
  AccountingRecord,
  AccountingSummary,
  MonthlyReport,
  AccountingService
} from '@/lib/services/accounting-service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AccountingDashboardProps {
  residencialId: string;
}

const AccountingDashboard: React.FC<AccountingDashboardProps> = ({
  residencialId,
}) => {
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [records, setRecords] = useState<AccountingRecord[]>([]);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'ingreso' | 'egreso'>('todos');
  const [periodoFilter, setPeriodoFilter] = useState<'mes_actual' | 'ultimos_3_meses' | 'año_actual'>('mes_actual');
  const [newRecordDialog, setNewRecordDialog] = useState(false);
  const [newRecord, setNewRecord] = useState({
    tipo: 'ingreso' as 'ingreso' | 'egreso',
    categoria: '',
    concepto: '',
    monto: '',
    metodoPago: 'transferencia' as 'transferencia' | 'efectivo' | 'tarjeta',
    referencia: '',
    mesReferencia: format(new Date(), 'yyyy-MM'),
    observaciones: '',
  });

  const loadAccountingData = useCallback(async () => {
    try {
      setLoading(true);

      const ahora = new Date();
      const fechaInicio = (() => {
        switch (periodoFilter) {
          case 'mes_actual':
            return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
          case 'ultimos_3_meses':
            return new Date(ahora.getFullYear(), ahora.getMonth() - 3, 1);
          case 'año_actual':
            return new Date(ahora.getFullYear(), 0, 1);
          default:
            return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        }
      })();
      const fechaFin = new Date();

      const [summaryData, recordsData, reportsData] = await Promise.all([
        AccountingService.getAccountingSummary(residencialId, fechaInicio, fechaFin),
        AccountingService.getAccountingRecords(residencialId, fechaInicio, fechaFin),
        AccountingService.getMonthlyReports(residencialId)
      ]);

      setSummary(summaryData);
      setRecords(recordsData);
      setReports(reportsData);
    } catch (error) {
      console.error('Error al cargar datos contables:', error);
      toast.error('Error al cargar datos contables');
    } finally {
      setLoading(false);
    }
  }, [periodoFilter, residencialId]);

  useEffect(() => {
    loadAccountingData();
  }, [loadAccountingData]);

  const handleAddRecord = async () => {
    if (!newRecord.concepto || !newRecord.monto) {
      toast.warning('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      await AccountingService.recordAccountingEntry(residencialId, {
        residencialId,
        fecha: new Date(),
        tipo: newRecord.tipo,
        categoria: newRecord.categoria,
        concepto: newRecord.concepto,
        monto: parseFloat(newRecord.monto),
        currency: 'MXN',
        metodoPago: newRecord.metodoPago,
        referencia: newRecord.referencia || undefined,
        mesReferencia: newRecord.mesReferencia,
        observaciones: newRecord.observaciones || undefined,
      });

      toast.success('Movimiento contable registrado exitosamente');
      setNewRecordDialog(false);
      setNewRecord({
        tipo: 'ingreso',
        categoria: '',
        concepto: '',
        monto: '',
        metodoPago: 'transferencia',
        referencia: '',
        mesReferencia: format(new Date(), 'yyyy-MM'),
        observaciones: '',
      });
      await loadAccountingData();
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      toast.error('Error al registrar movimiento');
    }
  };

  const generateMonthlyReport = async () => {
    try {
      const ahora = new Date();
      const reporte = await AccountingService.generateMonthlyReport(
        residencialId,
        ahora.getFullYear(),
        ahora.getMonth() + 1
      );

      toast.success('Reporte mensual generado exitosamente');
      await loadAccountingData();
    } catch (error) {
      console.error('Error al generar reporte:', error);
      toast.error('Error al generar reporte mensual');
    }
  };

  const exportToCSV = async () => {
    try {
      const fechaInicio = getFechaInicio();
      const fechaFin = new Date();
      const csvContent = await AccountingService.exportAccountingData(residencialId, fechaInicio, fechaFin);

      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `contabilidad_${residencialId}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
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

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'ingreso': return 'bg-green-100 text-green-800';
      case 'egreso': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'ingreso': return 'Ingreso';
      case 'egreso': return 'Egreso';
      default: return tipo;
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesTipo = tipoFilter === 'todos' || record.tipo === tipoFilter;
    const matchesSearch =
      searchTerm === '' ||
      record.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.userName && record.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.referencia && record.referencia.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesTipo && matchesSearch;
  });

  return (
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
                <TrendingDown className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Egresos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatAmount(summary.totalEgresos)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Balance</p>
                  <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatAmount(summary.balance)}
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
        </div>
      )}

      {/* Estadísticas adicionales */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Promedio Mensual</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatAmount(summary.promedioMensual)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <PieChart className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Casas Pagadas</p>
                  <p className="text-xl font-bold text-green-600">
                    {summary.casasPagadas} / {summary.totalCasas}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reportes Generados</p>
                  <p className="text-xl font-bold text-orange-600">
                    {reports.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controles y acciones */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Sistema Contable</CardTitle>
              <CardDescription>
                Gestiona los movimientos contables y genera reportes
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={() => window.location.href = '/dashboard/pagos/carga-historica'}>
                Importar Saldos
              </Button>
              <Button onClick={() => setNewRecordDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Movimiento
              </Button>
              <Button onClick={generateMonthlyReport} variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Generar Reporte
              </Button>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por concepto, categoría..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="w-48">
              <Select value={tipoFilter} onValueChange={(value: any) => setTipoFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los Tipos</SelectItem>
                  <SelectItem value="ingreso">Ingresos</SelectItem>
                  <SelectItem value="egreso">Egresos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={periodoFilter} onValueChange={(value: any) => setPeriodoFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes_actual">Mes Actual</SelectItem>
                  <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
                  <SelectItem value="año_actual">Año Actual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={loadAccountingData} variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de movimientos */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
              <p className="mt-4 text-muted-foreground">Cargando datos contables...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center p-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay movimientos contables para mostrar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Mes Ref.</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Casa</TableHead>
                    <TableHead>Referencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(record.fecha)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTipoColor(record.tipo)}>
                          {getTipoLabel(record.tipo)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {record.categoria || 'Sin categoría'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={record.concepto}>
                          {record.concepto}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {record.mesReferencia || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-bold ${record.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                          {record.tipo === 'ingreso' ? '+' : '-'}{formatAmount(record.monto, record.currency)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm capitalize">
                          {record.metodoPago}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {record.houseId || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {record.referencia || 'N/A'}
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

      {/* Diálogo para nuevo movimiento */}
      <Dialog open={newRecordDialog} onOpenChange={setNewRecordDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuevo Movimiento Contable</DialogTitle>
            <DialogDescription>
              Registra un nuevo movimiento contable en el sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={newRecord.tipo} onValueChange={(value: any) => setNewRecord({ ...newRecord, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingreso">Ingreso</SelectItem>
                    <SelectItem value="egreso">Egreso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Input
                  id="categoria"
                  value={newRecord.categoria}
                  onChange={(e) => setNewRecord({ ...newRecord, categoria: e.target.value })}
                  placeholder="Ej: Mantenimiento, Servicios"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="concepto">Concepto *</Label>
              <Input
                id="concepto"
                value={newRecord.concepto}
                onChange={(e) => setNewRecord({ ...newRecord, concepto: e.target.value })}
                placeholder="Descripción del movimiento"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monto">Monto *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="monto"
                    type="number"
                    value={newRecord.monto}
                    onChange={(e) => setNewRecord({ ...newRecord, monto: e.target.value })}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="metodoPago">Método de Pago</Label>
                <Select value={newRecord.metodoPago} onValueChange={(value: any) => setNewRecord({ ...newRecord, metodoPago: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="referencia">Referencia</Label>
              <Input
                id="referencia"
                value={newRecord.referencia}
                onChange={(e) => setNewRecord({ ...newRecord, referencia: e.target.value })}
                placeholder="Número de movimiento, referencia, etc."
              />
            </div>

            <div>
              <Label htmlFor="mesReferencia">Mes de Referencia *</Label>
              <Input
                id="mesReferencia"
                type="month"
                value={newRecord.mesReferencia}
                onChange={(e) => setNewRecord({ ...newRecord, mesReferencia: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="observaciones">Observaciones</Label>
              <Input
                id="observaciones"
                value={newRecord.observaciones}
                onChange={(e) => setNewRecord({ ...newRecord, observaciones: e.target.value })}
                placeholder="Observaciones adicionales"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewRecordDialog(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddRecord}>
              Registrar Movimiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingDashboard;
