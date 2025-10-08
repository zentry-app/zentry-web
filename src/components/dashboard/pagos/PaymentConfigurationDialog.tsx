import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Settings, 
  CreditCard, 
  Banknote, 
  Save, 
  Loader2,
  Calendar,
  DollarSign,
  Clock,
  Building2
} from 'lucide-react';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface PaymentConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residencialId: string;
  residencialName: string;
}

interface PaymentConfig {
  fechaCorte: number;
  fechaVencimiento: number;
  periodoGracia: number;
  cuotaMensual: number;
  activo: boolean;
  // 🆕 Configuración de pagos retroactivos
  permitePagosRetroactivos: boolean;
  mesesMaximosRetroactivos: number;
  recargoPorMesVencido: number;
  fechaInicioSistema: string;
  mesesExcluidos: string[];
}

interface BankInfo {
  banco: string;
  cuenta: string;
  clabe: string;
  titular: string;
  tipoCuenta: string;
  referencia: string;
  instrucciones: string;
  metodosPago: string[];
  contacto: string;
}

const PaymentConfigurationDialog: React.FC<PaymentConfigurationDialogProps> = ({
  open,
  onOpenChange,
  residencialId,
  residencialName,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estados para configuración de pagos
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    fechaCorte: 15,
    fechaVencimiento: 25,
    periodoGracia: 5,
    cuotaMensual: 1150,
    activo: true,
    // 🆕 Valores por defecto para pagos retroactivos
    permitePagosRetroactivos: false,
    mesesMaximosRetroactivos: 6,
    recargoPorMesVencido: 0.05, // 5%
    fechaInicioSistema: '2024-01-01',
    mesesExcluidos: [],
  });
  
  // Estados para información bancaria
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    banco: '',
    cuenta: '',
    clabe: '',
    titular: '',
    tipoCuenta: 'corriente',
    referencia: '',
    instrucciones: 'Usar como referencia: ',
    metodosPago: ['transferencia', 'deposito', 'app_bancaria'],
    contacto: '',
  });
  
  // Estado para controlar si se usa información bancaria
  const [useBankInfo, setUseBankInfo] = useState(false);

  // Cargar configuración existente
  useEffect(() => {
    if (open && residencialId) {
      loadConfiguration();
    }
  }, [open, residencialId]);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      const residencialRef = doc(db, 'residenciales', residencialId);
      const residencialDoc = await getDoc(residencialRef);
      
      if (residencialDoc.exists()) {
        const data = residencialDoc.data();
        
        // Cargar configuración de pagos
        if (data.configuracionPagos) {
          setPaymentConfig({
            fechaCorte: data.configuracionPagos.fechaCorte || 15,
            fechaVencimiento: data.configuracionPagos.fechaVencimiento || 25,
            periodoGracia: data.configuracionPagos.periodoGracia || 5,
            cuotaMensual: data.configuracionPagos.cuotaMensual || data.cuotaMantenimiento || 1150,
            activo: data.configuracionPagos.activo !== false,
            // 🆕 Campos de pagos retroactivos
            permitePagosRetroactivos: data.configuracionPagos.permitePagosRetroactivos || false,
            mesesMaximosRetroactivos: data.configuracionPagos.mesesMaximosRetroactivos || 6,
            recargoPorMesVencido: data.configuracionPagos.recargoPorMesVencido || 0.05,
            fechaInicioSistema: data.configuracionPagos.fechaInicioSistema 
              ? (data.configuracionPagos.fechaInicioSistema.toDate ? 
                  data.configuracionPagos.fechaInicioSistema.toDate().toISOString().split('T')[0] :
                  data.configuracionPagos.fechaInicioSistema)
              : '2024-01-01',
            mesesExcluidos: data.configuracionPagos.mesesExcluidos || [],
          });
        }
        
        // Cargar información bancaria
        if (data.informacionBancaria) {
          const hasBankData = data.informacionBancaria.banco || data.informacionBancaria.cuenta || data.informacionBancaria.clabe;
          setUseBankInfo(!!hasBankData);
          
          setBankInfo({
            banco: data.informacionBancaria.banco || '',
            cuenta: data.informacionBancaria.cuenta || '',
            clabe: data.informacionBancaria.clabe || '',
            titular: data.informacionBancaria.titular || '',
            tipoCuenta: data.informacionBancaria.tipoCuenta || 'corriente',
            referencia: data.informacionBancaria.referencia || '',
            instrucciones: data.informacionBancaria.instrucciones || 'Usar como referencia: ',
            metodosPago: data.informacionBancaria.metodosPago || ['transferencia', 'deposito', 'app_bancaria'],
            contacto: data.informacionBancaria.contacto || '',
          });
        }
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentConfigChange = (field: keyof PaymentConfig, value: any) => {
    setPaymentConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBankInfoChange = (field: keyof BankInfo, value: any) => {
    setBankInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateConfiguration = () => {
    // Validar fechas
    if (paymentConfig.fechaCorte < 1 || paymentConfig.fechaCorte > 31) {
      toast.error('La fecha de corte debe estar entre 1 y 31');
      return false;
    }
    
    if (paymentConfig.fechaVencimiento < 1 || paymentConfig.fechaVencimiento > 31) {
      toast.error('La fecha de vencimiento debe estar entre 1 y 31');
      return false;
    }
    
    if (paymentConfig.fechaVencimiento <= paymentConfig.fechaCorte) {
      toast.error('La fecha de vencimiento debe ser posterior a la fecha de corte');
      return false;
    }
    
    if (paymentConfig.periodoGracia < 0) {
      toast.error('El período de gracia no puede ser negativo');
      return false;
    }
    
    if (paymentConfig.cuotaMensual <= 0) {
      toast.error('La cuota mensual debe ser mayor a 0');
      return false;
    }
    
    // 🆕 Validar configuración de pagos retroactivos
    if (paymentConfig.permitePagosRetroactivos) {
      if (paymentConfig.mesesMaximosRetroactivos < 1 || paymentConfig.mesesMaximosRetroactivos > 24) {
        toast.error('Los meses máximos retroactivos deben estar entre 1 y 24');
        return false;
      }
      
      if (paymentConfig.recargoPorMesVencido < 0 || paymentConfig.recargoPorMesVencido > 1) {
        toast.error('El recargo por mes vencido debe estar entre 0% y 100%');
        return false;
      }
      
      if (!paymentConfig.fechaInicioSistema) {
        toast.error('La fecha de inicio del sistema es requerida');
        return false;
      }
    }
    
    // Validar información bancaria solo si está habilitada
    if (paymentConfig.activo && useBankInfo) {
      if (!bankInfo.banco.trim()) {
        toast.error('El nombre del banco es requerido');
        return false;
      }
      
      if (!bankInfo.cuenta.trim()) {
        toast.error('El número de cuenta es requerido');
        return false;
      }
      
      if (!bankInfo.clabe.trim()) {
        toast.error('La CLABE es requerida');
        return false;
      }
      
      if (!bankInfo.titular.trim()) {
        toast.error('El titular de la cuenta es requerido');
        return false;
      }
    }
    
    return true;
  };

  const saveConfiguration = async () => {
    if (!validateConfiguration()) {
      return;
    }
    
    setSaving(true);
    try {
      const residencialRef = doc(db, 'residenciales', residencialId);
      
      const updateData: any = {
        configuracionPagos: {
          ...paymentConfig,
          // Convertir fechaInicioSistema de String a Timestamp
          fechaInicioSistema: paymentConfig.fechaInicioSistema 
            ? Timestamp.fromDate(new Date(paymentConfig.fechaInicioSistema))
            : Timestamp.fromDate(new Date('2024-01-01')),
          fechaActualizacion: serverTimestamp(),
        },
        // Mantener compatibilidad con cuotaMantenimiento
        cuotaMantenimiento: paymentConfig.cuotaMensual,
      };
      
      // Solo agregar información bancaria si está habilitada
      if (useBankInfo) {
        updateData.informacionBancaria = {
          ...bankInfo,
          fechaActualizacion: serverTimestamp(),
        };
      } else {
        // Si no se usa información bancaria, limpiar los datos existentes
        updateData.informacionBancaria = {
          banco: '',
          cuenta: '',
          clabe: '',
          titular: '',
          tipoCuenta: 'corriente',
          referencia: '',
          instrucciones: '',
          metodosPago: [],
          contacto: '',
          fechaActualizacion: serverTimestamp(),
        };
      }
      
      await updateDoc(residencialRef, updateData);
      
      toast.success('Configuración de pagos guardada correctamente');
      onOpenChange(false);
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración de Pagos - {residencialName}
          </DialogTitle>
          <DialogDescription>
            Configura las fechas, montos e información bancaria para el sistema de pagos
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando configuración...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Configuración de Pagos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Configuración de Pagos
                </CardTitle>
                <CardDescription>
                  Define las fechas y montos para el sistema de pagos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="activo">Sistema de Pagos Activo</Label>
                    <p className="text-sm text-muted-foreground">
                      Habilita o deshabilita el sistema de pagos para este residencial
                    </p>
                  </div>
                  <Switch
                    id="activo"
                    checked={paymentConfig.activo}
                    onCheckedChange={(checked) => handlePaymentConfigChange('activo', checked)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fechaCorte">Fecha de Corte</Label>
                    <Input
                      id="fechaCorte"
                      type="number"
                      min="1"
                      max="31"
                      value={paymentConfig.fechaCorte}
                      onChange={(e) => handlePaymentConfigChange('fechaCorte', parseInt(e.target.value))}
                      placeholder="15"
                    />
                    <p className="text-sm text-muted-foreground">
                      Día del mes para el corte de pagos (1-31)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
                    <Input
                      id="fechaVencimiento"
                      type="number"
                      min="1"
                      max="31"
                      value={paymentConfig.fechaVencimiento}
                      onChange={(e) => handlePaymentConfigChange('fechaVencimiento', parseInt(e.target.value))}
                      placeholder="25"
                    />
                    <p className="text-sm text-muted-foreground">
                      Día del mes para el vencimiento (1-31)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="periodoGracia">Período de Gracia (días)</Label>
                    <Input
                      id="periodoGracia"
                      type="number"
                      min="0"
                      value={paymentConfig.periodoGracia}
                      onChange={(e) => handlePaymentConfigChange('periodoGracia', parseInt(e.target.value))}
                      placeholder="5"
                    />
                    <p className="text-sm text-muted-foreground">
                      Días adicionales después del vencimiento
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cuotaMensual">Cuota Mensual</Label>
                    <Input
                      id="cuotaMensual"
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentConfig.cuotaMensual}
                      onChange={(e) => handlePaymentConfigChange('cuotaMensual', parseFloat(e.target.value))}
                      placeholder="1150"
                    />
                    <p className="text-sm text-muted-foreground">
                      Monto de la cuota mensual en pesos mexicanos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* 🆕 Configuración de Pagos Retroactivos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pagos Retroactivos
                </CardTitle>
                <CardDescription>
                  Configuración para permitir pagos de meses anteriores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="permitePagosRetroactivos">Permitir Pagos Retroactivos</Label>
                    <p className="text-sm text-muted-foreground">
                      Habilita que los residentes puedan pagar meses anteriores
                    </p>
                  </div>
                  <Switch
                    id="permitePagosRetroactivos"
                    checked={paymentConfig.permitePagosRetroactivos}
                    onCheckedChange={(checked) => handlePaymentConfigChange('permitePagosRetroactivos', checked)}
                  />
                </div>

                {paymentConfig.permitePagosRetroactivos && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mesesMaximosRetroactivos">Meses Máximos Retroactivos</Label>
                      <Input
                        id="mesesMaximosRetroactivos"
                        type="number"
                        min="1"
                        max="24"
                        value={paymentConfig.mesesMaximosRetroactivos}
                        onChange={(e) => handlePaymentConfigChange('mesesMaximosRetroactivos', parseInt(e.target.value))}
                        placeholder="6"
                      />
                      <p className="text-sm text-muted-foreground">
                        Máximo número de meses que se pueden pagar retroactivamente (1-24)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recargoPorMesVencido">Recargo por Mes Vencido (%)</Label>
                      <Input
                        id="recargoPorMesVencido"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={paymentConfig.recargoPorMesVencido * 100}
                        onChange={(e) => handlePaymentConfigChange('recargoPorMesVencido', parseFloat(e.target.value) / 100)}
                        placeholder="5"
                      />
                      <p className="text-sm text-muted-foreground">
                        Porcentaje de recargo por cada mes vencido (0-100%)
                      </p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="fechaInicioSistema">Fecha de Inicio del Sistema</Label>
                      <Input
                        id="fechaInicioSistema"
                        type="date"
                        value={paymentConfig.fechaInicioSistema}
                        onChange={(e) => handlePaymentConfigChange('fechaInicioSistema', e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Fecha desde la cual se pueden calcular pagos retroactivos
                      </p>
                    </div>
                  </div>
                )}

                {!paymentConfig.permitePagosRetroactivos && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      ⚠️ Los pagos retroactivos están deshabilitados. Los residentes solo podrán pagar el mes actual.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Información Bancaria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Información Bancaria
                </CardTitle>
                <CardDescription>
                  Datos bancarios que verán los residentes para realizar pagos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="useBankInfo">Usar Información Bancaria</Label>
                    <p className="text-sm text-muted-foreground">
                      Habilita la configuración de datos bancarios para pagos
                    </p>
                  </div>
                  <Switch
                    id="useBankInfo"
                    checked={useBankInfo}
                    onCheckedChange={setUseBankInfo}
                  />
                </div>
                
                {!useBankInfo && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      ℹ️ Sin información bancaria configurada. Los residentes no podrán ver datos bancarios para realizar pagos.
                    </p>
                  </div>
                )}
                
                {useBankInfo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="banco">Banco</Label>
                    <Input
                      id="banco"
                      value={bankInfo.banco}
                      onChange={(e) => handleBankInfoChange('banco', e.target.value)}
                      placeholder="BBVA, Santander, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cuenta">Número de Cuenta</Label>
                    <Input
                      id="cuenta"
                      value={bankInfo.cuenta}
                      onChange={(e) => handleBankInfoChange('cuenta', e.target.value)}
                      placeholder="1234567890"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clabe">CLABE</Label>
                    <Input
                      id="clabe"
                      value={bankInfo.clabe}
                      onChange={(e) => handleBankInfoChange('clabe', e.target.value)}
                      placeholder="012345678901234567"
                      maxLength={18}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="titular">Titular de la Cuenta</Label>
                    <Input
                      id="titular"
                      value={bankInfo.titular}
                      onChange={(e) => handleBankInfoChange('titular', e.target.value)}
                      placeholder="Coto Sur Administración"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipoCuenta">Tipo de Cuenta</Label>
                    <Input
                      id="tipoCuenta"
                      value={bankInfo.tipoCuenta}
                      onChange={(e) => handleBankInfoChange('tipoCuenta', e.target.value)}
                      placeholder="corriente"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referencia">Referencia</Label>
                    <Input
                      id="referencia"
                      value={bankInfo.referencia}
                      onChange={(e) => handleBankInfoChange('referencia', e.target.value)}
                      placeholder="COTO-SUR-MANTENIMIENTO"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="instrucciones">Instrucciones para Residentes</Label>
                    <Input
                      id="instrucciones"
                      value={bankInfo.instrucciones}
                      onChange={(e) => handleBankInfoChange('instrucciones', e.target.value)}
                      placeholder="Usar como referencia: COTO-SUR-MANTENIMIENTO"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="contacto">Contacto para Dudas</Label>
                    <Input
                      id="contacto"
                      type="email"
                      value={bankInfo.contacto}
                      onChange={(e) => handleBankInfoChange('contacto', e.target.value)}
                      placeholder="admin@cotosur.com"
                    />
                  </div>
                </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={saveConfiguration} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Configuración
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentConfigurationDialog;
