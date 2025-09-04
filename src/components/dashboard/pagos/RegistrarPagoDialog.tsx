import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { DollarSign, User, Calendar, FileText, Loader2 } from 'lucide-react';
import { getUsuariosPorResidencial, registrarPagoEfectivo, Usuario } from '@/lib/firebase/firestore';
import { Combobox } from '@/components/ui/combobox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface RegistrarPagoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentRegistered: () => void;
  residencialId: string;
}

const RegistrarPagoDialog: React.FC<RegistrarPagoDialogProps> = ({
  open,
  onOpenChange,
  onPaymentRegistered,
  residencialId,
}) => {
  const [usuarios, setUsuarios] = useState<{ value: string; label: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (open && residencialId) {
      setLoadingUsers(true);
      getUsuariosPorResidencial(residencialId)
        .then((users) => {
          const formattedUsers = users.map((u) => ({
            value: u.uid,
            label: `${u.fullName} (${u.domicilio?.calle || ''} #${u.domicilio?.houseNumber || ''})`,
          }));
          setUsuarios(formattedUsers);
        })
        .catch((err) => {
          toast.error('Error al cargar la lista de residentes.');
          console.error(err);
        })
        .finally(() => setLoadingUsers(false));
    }
  }, [open, residencialId]);

  const handleSubmit = async () => {
    if (!selectedUserId || !amount || !concept || !paymentDate) {
      toast.warning('Por favor, completa todos los campos.');
      return;
    }

    const selectedUser = usuarios.find(u => u.value === selectedUserId);
    if (!selectedUser) {
        toast.error('Usuario seleccionado no es válido.');
        return;
    }

    setLoading(true);
    try {
      await registrarPagoEfectivo({
        residencialId,
        userId: selectedUserId,
        userName: selectedUser.label.split('(')[0].trim(),
        amount: parseFloat(amount),
        concept,
        paymentDate,
      });
      toast.success('Pago en efectivo registrado correctamente.');
      onPaymentRegistered();
      onOpenChange(false);
      // Reset form
      setSelectedUserId('');
      setAmount('');
      setConcept('');
      setPaymentDate(new Date());
    } catch (error) {
      toast.error('Hubo un error al registrar el pago.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Pago en Efectivo</DialogTitle>
          <DialogDescription>
            Completa los detalles para registrar un nuevo pago recibido en efectivo.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="resident" className="text-right">
              Residente
            </Label>
            <div className="col-span-3">
              <Combobox
                options={usuarios}
                value={selectedUserId}
                onChange={setSelectedUserId}
                placeholder="Busca un residente..."
                loading={loadingUsers}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Monto
            </Label>
            <div className="relative col-span-3">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-8"
                />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="concept" className="text-right">
              Concepto
            </Label>
            <Input
              id="concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="col-span-3"
              placeholder="Ej. Mantenimiento de Junio"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Fecha
            </Label>
             <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={paymentDate}
                    onSelect={setPaymentDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar Pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrarPagoDialog; 