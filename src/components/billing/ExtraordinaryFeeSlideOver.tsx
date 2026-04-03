import React, { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Zap,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { WebERPService } from '@/lib/services/WebERPService';

interface ExtraordinaryFeeSlideOverProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    residencialId: string;
    houseId: string;
}

const ExtraordinaryFeeSlideOver: React.FC<ExtraordinaryFeeSlideOverProps> = ({
    isOpen,
    onClose,
    onSuccess,
    residencialId,
    houseId
}) => {
    const [amount, setAmount] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const erpService = new WebERPService();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amountCents = Math.round(parseFloat(amount) * 100);

        if (isNaN(amountCents) || amountCents <= 0) {
            setError('El monto debe ser mayor a 0.');
            return;
        }

        if (!description.trim()) {
            setError('La descripción es obligatoria.');
            return;
        }

        try {
            setIsProcessing(true);
            setError(null);
            const res = await erpService.createExtraordinaryFee(residencialId, houseId, amountCents, description);
            if (res.success) {
                onSuccess();
                onClose();
                // Reset form
                setAmount('');
                setDescription('');
            } else {
                setError('No se pudo crear el cargo extraordinario.');
            }
        } catch (err) {
            setError('Error de conexión al procesar el cargo.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="sm:max-w-md bg-slate-950 border-slate-800 text-slate-100">
                <SheetHeader className="mb-8">
                    <SheetTitle className="text-2xl font-bold flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                            <Zap className="w-5 h-5" />
                        </div>
                        Cargo Extraordinario
                    </SheetTitle>
                    <SheetDescription className="text-slate-400">
                        Inyecta un cargo manual para la casa {houseId}. Este cargo afectará el balance inmediatamente.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Monto (MXN)</Label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-slate-900 border-slate-800 pl-8 text-white text-lg font-bold"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción / Motivo</Label>
                        <Textarea
                            id="description"
                            placeholder="Ej. Multa por ruido, Tag adicional, Reparación área común..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-slate-900 border-slate-800 text-white min-h-[120px]"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-900/20 border border-red-800/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full h-12 bg-amber-600 hover:bg-amber-500 text-amber-50 font-bold text-lg"
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
                            Generar Cargo
                        </Button>
                    </div>
                </form>

                <SheetFooter className="mt-8">
                    <p className="text-xs text-slate-500 text-center w-full">
                        Al generar este cargo, se creará un registro de tipo `extraordinary` en el historial de la casa.
                    </p>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default ExtraordinaryFeeSlideOver;
