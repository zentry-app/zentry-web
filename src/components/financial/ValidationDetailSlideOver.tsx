/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { WebPaymentIntent } from '@/lib/services/WebERPService';

interface ValidationDetailSlideOverProps {
    intent: WebPaymentIntent | null;
    open: boolean;
    onClose: () => void;
    onValidate: (id: string) => Promise<void>;
    onReject: (id: string, reason: string) => Promise<void>;
    onReverse: (id: string, reason: string) => Promise<void>;
}

export const ValidationDetailSlideOver: React.FC<ValidationDetailSlideOverProps> = ({
    intent,
    open,
    onClose,
    onValidate,
    onReject,
    onReverse
}) => {
    const [actionState, setActionState] = useState<'view' | 'rejecting' | 'reversing'>('view');
    const [reason, setReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    if (!intent || !open) return null;

    const handleAction = async (action: 'validate' | 'reject' | 'reverse') => {
        setIsProcessing(true);
        try {
            if (action === 'validate') await onValidate(intent.id);
            else if (action === 'reject') await onReject(intent.id, reason);
            else if (action === 'reverse') await onReverse(intent.id, reason);

            setActionState('view');
            setReason('');
            onClose();
        } catch (error) {
            console.error(error);
            // In a real app we would show a toast error here
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50">
            <div className="w-96 h-full bg-white shadow-xl flex flex-col p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Detalle de Validación</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-black font-bold text-xl">
                        &times;
                    </button>
                </div>

                <div className="space-y-4 flex-1">
                    <div className="bg-gray-100 p-4 rounded text-sm">
                        <p><strong>Folio Intent:</strong> {intent.id}</p>
                        <p><strong>Casa:</strong> {intent.houseLabel}</p>
                        <p><strong>Residente:</strong> {intent.residentName}</p>
                        <p><strong>Monto:</strong> ${(intent.amountCents / 100).toFixed(2)}</p>
                        <p><strong>Método:</strong> {intent.method}</p>
                        <p><strong>Referencia:</strong> {intent.referenceNumber || 'N/A'}</p>
                        <p><strong>Estado:</strong> <span className={`font-semibold ${intent.status === 'pending_validation' ? 'text-yellow-600' :
                                intent.status === 'validated' ? 'text-green-600' : 'text-red-600'
                            }`}>{intent.status}</span></p>
                    </div>

                    {intent.proofUrl && (
                        <div className="border rounded p-2">
                            <p className="font-semibold mb-2">Comprobante Adjunto</p>
                            <img src={intent.proofUrl} alt="Comprobante" className="w-full h-auto object-contain max-h-64" />
                        </div>
                    )}

                    {actionState === 'rejecting' && (
                        <div className="mt-4 border-l-4 border-red-500 pl-4 py-2">
                            <label className="block text-sm font-bold mb-1">Motivo de Rechazo</label>
                            <input
                                placeholder="Motivo"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                className="w-full border p-2 mb-2 rounded"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAction('reject')}
                                    disabled={!reason || isProcessing}
                                    className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-50"
                                >
                                    Confirmar Rechazo
                                </button>
                                <button onClick={() => setActionState('view')} className="px-3 py-1 bg-gray-200 rounded">Cancelar</button>
                            </div>
                        </div>
                    )}

                    {actionState === 'reversing' && (
                        <div className="mt-4 border-l-4 border-orange-500 pl-4 py-2">
                            <label className="block text-sm font-bold mb-1">Motivo de reversa</label>
                            <input
                                placeholder="Motivo de reversa"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                className="w-full border p-2 mb-2 rounded"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAction('reverse')}
                                    disabled={!reason || isProcessing}
                                    className="bg-orange-600 text-white px-3 py-1 rounded disabled:opacity-50"
                                >
                                    Confirmar Reversa
                                </button>
                                <button onClick={() => setActionState('view')} className="px-3 py-1 bg-gray-200 rounded">Cancelar</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t pt-4 flex gap-2 justify-end mt-4">
                    {actionState === 'view' && intent.status === 'pending_validation' && (
                        <>
                            <button
                                onClick={() => setActionState('rejecting')}
                                className="border border-red-600 text-red-600 px-4 py-2 rounded hover:bg-red-50"
                            >
                                Rechazar
                            </button>
                            <button
                                onClick={() => handleAction('validate')}
                                disabled={isProcessing}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            >
                                Aprobar Pago
                            </button>
                        </>
                    )}

                    {actionState === 'view' && intent.status === 'validated' && intent.reconciliationStatus !== 'reconciled' && (
                        <button
                            onClick={() => setActionState('reversing')}
                            className="border border-orange-600 text-orange-600 px-4 py-2 rounded hover:bg-orange-50"
                        >
                            Revertir
                        </button>
                    )}

                    {actionState === 'view' && intent.reconciliationStatus === 'reconciled' && (
                        <p className="text-sm text-gray-500 italic">Pago conciliado. No editable.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
