import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Loader2, ArrowDownCircle, ArrowUpCircle, BookOpen, AlertTriangle, PenTool } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { PaymentValidationService } from '@/lib/services/payment-validation-service';

interface LedgerEntry {
    id: string;
    type: 'PAYMENT' | 'BILLING' | 'ADJUSTMENT' | 'PENALTY';
    subType: string;
    description: string;
    amount: number;
    currency: string;
    impact: 'INCREASE_DEBT' | 'DECREASE_DEBT';
    balanceAfter: number; // Snapshot of balance at the time
    timestamp: any;
    status: 'applied' | 'reversed';
    referenceId: string;
    houseId: string;
    residencialId: string;
}

interface HouseBalance {
    houseId: string;
    balance: number;
    lastUpdated: any;
}

export default function LedgerViewer({ residencialId }: { residencialId: string }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [houseId, setHouseId] = useState('');
    const [loading, setLoading] = useState(false);

    // Data
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [currentBalance, setCurrentBalance] = useState<HouseBalance | null>(null);

    // Adj State
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [adjustAmount, setAdjustAmount] = useState('');
    const [adjustReason, setAdjustReason] = useState('');
    const [isDecrease, setIsDecrease] = useState<boolean>(true); // true = Abono (resta a deuda), false = Cargo (aumenta deuda)
    const [isAdjusting, setIsAdjusting] = useState(false);

    const fetchHouseLedger = async (searchHouseId: string) => {
        if (!searchHouseId) return;

        setLoading(true);
        try {
            // 1. Fetch current global balance for the house
            const balanceRef = doc(db, `residenciales/${residencialId}/housePaymentBalance/${searchHouseId}`);
            const balanceSnap = await getDoc(balanceRef);

            if (balanceSnap.exists()) {
                const data = balanceSnap.data();
                const deuda = (data.deudaAcumulada || 0);
                const favor = (data.saldoAFavor || 0);
                setCurrentBalance({
                    houseId: searchHouseId,
                    balance: favor - deuda,
                    lastUpdated: data.updatedAt
                });
            } else {
                setCurrentBalance({ houseId: searchHouseId, balance: 0, lastUpdated: new Date() });
            }

            // 2. Fetch immutable ledger history
            const ledgerRef = collection(db, `residenciales/${residencialId}/houses/${searchHouseId}/ledger`);
            const ledgerQ = query(
                ledgerRef,
                orderBy('createdAt', 'desc'),
                limit(50)
            );

            const ledgerSnap = await getDocs(ledgerQ);
            const entries = ledgerSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    timestamp: data.createdAt // mapping for UI compatibility
                } as LedgerEntry;
            });
            setLedgerEntries(entries);

        } catch (error) {
            console.error("Error fetching ledger:", error);
            toast.error("Error al obtener el historial de movimientos");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm) {
            toast.warning("Ingresa un identificador de casa (Ej. Robles-12)");
            return;
        }
        const formattedHouseId = searchTerm.trim().replace(/\s+/g, '-');
        setHouseId(formattedHouseId);
        fetchHouseLedger(formattedHouseId);
    };

    const handleAdjustBalance = async () => {
        if (!adjustAmount || isNaN(Number(adjustAmount)) || Number(adjustAmount) <= 0) {
            toast.error("Ingresa un monto numérico mayor a cero");
            return;
        }
        if (adjustReason.trim().length === 0) {
            toast.error("Ingresa un motivo para el ajuste (Ej: Saldo basura)");
            return;
        }

        setIsAdjusting(true);
        try {
            await PaymentValidationService.adjustBalance(residencialId, houseId, Number(adjustAmount), isDecrease, adjustReason);
            toast.success("Ajuste de saldo aplicado correctamente.");
            setAdjustDialog(false);
            setAdjustAmount('');
            setAdjustReason('');
            fetchHouseLedger(houseId);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error interno al aplicar el ajuste manual");
        } finally {
            setIsAdjusting(false);
        }
    };

    const getFormatDate = (timestamp: any) => {
        if (!timestamp) return '---';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return format(date, "dd MMM yyyy, hh:mm a", { locale: es });
    };

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    return (
        <div className="space-y-6">
            <Card className="rounded-[2.5rem] shadow-sm border-none bg-white">
                <CardHeader className="p-8 pb-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                                <BookOpen className="h-6 w-6 mr-3 text-blue-600" />
                                Estado de Cuenta
                            </CardTitle>
                            <CardDescription className="text-base mt-2">
                                Consulta el historial de movimientos de cualquier vivienda.
                            </CardDescription>
                        </div>

                        <form onSubmit={handleSearch} className="flex relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Ej: Encino-4"
                                className="pl-12 h-14 rounded-l-2xl rounded-r-none border-r-0 bg-slate-50 font-bold text-lg focus-visible:ring-0 focus-visible:border-blue-500"
                            />
                            <Button type="submit" className="h-14 rounded-l-none rounded-r-2xl px-6 bg-blue-600 hover:bg-blue-700 font-bold transition-all">
                                Buscar
                            </Button>
                        </form>
                    </div>
                </CardHeader>

                {loading ? (
                    <CardContent className="p-16 flex flex-col items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                        <p className="text-slate-500 font-medium">Buscando movimientos...</p>
                    </CardContent>
                ) : houseId && currentBalance ? (
                    <CardContent className="p-8 pt-4">
                        {/* Header Saldo */}
                        <div className={`p-8 rounded-[2rem] border mb-8 flex flex-col md:flex-row justify-between items-center bg-gradient-to-br shadow-inner ${currentBalance.balance < 0
                            ? 'from-red-50 to-red-100/50 border-red-100' // Deuda
                            : currentBalance.balance > 0
                                ? 'from-green-50 to-green-100/50 border-green-100' // Saldo Favor
                                : 'from-slate-50 to-slate-100/50 border-slate-200' // Cero
                            }`}>
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                                    Saldo Actual de Vivienda
                                </p>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-4xl lg:text-5xl font-black text-slate-800 tracking-tight">
                                        {formatMoney(Math.abs(currentBalance.balance))}
                                    </h3>
                                    <Badge className={`text-sm px-4 py-1.5 rounded-full shadow-sm font-bold ${currentBalance.balance < 0 ? 'bg-red-500 text-white' : currentBalance.balance > 0 ? 'bg-green-500 text-white' : 'bg-slate-500'
                                        }`}>
                                        {currentBalance.balance < 0 ? 'DEUDA PENDIENTE' : currentBalance.balance > 0 ? 'SALDO A FAVOR' : 'SIN DEUDAS'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="mt-4 md:mt-0 text-right">
                                <p className="text-sm text-slate-500 font-medium">Ultima actualización</p>
                                <p className="font-bold text-slate-700">{getFormatDate(currentBalance.lastUpdated)}</p>
                                <p className="text-xs text-slate-400 mt-1 block">ID: {currentBalance.houseId}</p>
                            </div>
                        </div>

                        {/* Botón de Ajustes (Super Admin) */}
                        <div className="flex justify-end mb-8">
                            <Button variant="outline" className="border-slate-300 text-slate-600 font-semibold" onClick={() => setAdjustDialog(true)}>
                                <PenTool className="h-4 w-4 mr-2" />
                                Ajuste de saldo
                            </Button>
                        </div>

                        {/* Historial de Movimientos */}
                        <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                            Historial de Movimientos
                        </h4>

                        {ledgerEntries.length === 0 ? (
                            <div className="text-center p-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-500 font-medium text-lg">No hay movimientos registrados para esta casa.</p>
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="absolute left-8 top-0 bottom-0 w-1 bg-slate-100 rounded-full z-0"></div>
                                <div className="space-y-6 relative z-10">
                                    {ledgerEntries.map((entry) => {
                                        const isCredit = entry.impact === 'DECREASE_DEBT'; // En contabilidad (ERP) decrease_debt = abono/cobro
                                        return (
                                            <div key={entry.id} className="flex gap-6 items-start">
                                                {/* Icon Node */}
                                                <div className={`mt-1 h-16 w-16 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border-4 border-white ${entry.status === 'reversed' ? 'bg-slate-200 text-slate-500' :
                                                    isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    {entry.status === 'reversed' ? <AlertTriangle className="h-6 w-6" /> :
                                                        isCredit ? <ArrowDownCircle className="h-7 w-7" /> : <ArrowUpCircle className="h-7 w-7" />}
                                                </div>

                                                {/* Content Card */}
                                                <div className={`flex-1 rounded-2xl p-5 border shadow-sm transition-all hover:shadow-md ${entry.status === 'reversed' ? 'bg-slate-50 opacity-70 border-dashed' : 'bg-white'}`}>
                                                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Badge variant="outline" className="text-xs font-bold font-mono tracking-wider shadow-none bg-slate-50">
                                                                    {entry.type}
                                                                </Badge>
                                                                {entry.status === 'reversed' && (
                                                                    <Badge variant="destructive" className="text-xs">REVERTIDO</Badge>
                                                                )}
                                                                <span className="text-xs font-semibold text-slate-400">Ref: {entry.referenceId}</span>
                                                            </div>
                                                            <h5 className={`font-bold text-lg ${entry.status === 'reversed' ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                                                                {entry.description}
                                                            </h5>
                                                            <p className="text-sm text-slate-500 font-medium">
                                                                {getFormatDate(entry.timestamp)}
                                                            </p>
                                                        </div>

                                                        <div className="text-left lg:text-right">
                                                            <p className={`text-2xl font-black ${entry.status === 'reversed' ? 'text-slate-400' : isCredit ? 'text-green-600' : 'text-red-600'}`}>
                                                                {isCredit ? '+' : '-'}{formatMoney(entry.amount)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                ) : houseId ? (
                    <CardContent className="p-16 text-center">
                        <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-800">Esta vivienda no tiene registros</h3>
                        <p className="text-slate-500">¿Está bien escrito el identificador? Formato sugerido: NombreCalle-Numero (ej. encino-12)</p>
                    </CardContent>
                ) : null}
            </Card>

            {/* Ajuste Modal */}
            <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajuste de saldo</DialogTitle>
                        <DialogDescription>
                            Usa esta herramienta <strong>sólo para casos excepcionales</strong> (ej. saldos arrastrados de versiones anteriores, condonación de deuda, o correcciones de sistema).
                            Se registrará en el historial de movimientos.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Tipo de Movimiento</label>
                            <Select value={isDecrease ? "abono" : "cargo"} onValueChange={(val) => setIsDecrease(val === "abono")}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="abono"><span className="text-green-600 font-bold ml-1">Abono</span> (Resta deuda / Sube Saldo a Favor)</SelectItem>
                                    <SelectItem value="cargo"><span className="text-red-600 font-bold ml-1">Cargo</span> (Suma deuda / Baja Saldo a Favor)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Monto del ajuste (MXN)</label>
                            <Input
                                type="number"
                                placeholder="Ej. 350.50"
                                value={adjustAmount}
                                onChange={(e) => setAdjustAmount(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Motivo (Máx 50 carácteres)</label>
                            <Input
                                type="text"
                                placeholder="Ej. Perdón de deuda de prueba"
                                value={adjustReason}
                                onChange={(e) => setAdjustReason(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAdjustDialog(false)} disabled={isAdjusting}>Cancelar</Button>
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAdjustBalance} disabled={isAdjusting}>
                            {isAdjusting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Aplicar Ajuste Contable
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
