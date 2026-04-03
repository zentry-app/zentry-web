import React, { useEffect, useState } from 'react';
import { WebERPService, WebPaymentIntent } from '@/lib/services/WebERPService';
import { ValidationDetailSlideOver } from './ValidationDetailSlideOver';

interface PaymentValidationQueueProps {
    service: WebERPService;
    residencialId: string;
}

export const PaymentValidationQueue: React.FC<PaymentValidationQueueProps> = ({ service, residencialId }) => {
    const [intents, setIntents] = useState<WebPaymentIntent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIntent, setSelectedIntent] = useState<WebPaymentIntent | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await service.getPendingValidations(residencialId);
            setIntents(data);
        } catch (error) {
            console.error('Failed to load intents:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [residencialId]);

    const handleValidate = async (id: string) => {
        await service.validatePayment(residencialId, id);
        await loadData();
    };

    const handleReject = async (id: string, reason: string) => {
        await service.rejectPayment(residencialId, id, reason);
        await loadData();
    };

    const handleReverse = async (id: string, reason: string) => {
        await service.reversePayment(residencialId, id, reason);
        await loadData();
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Payment Validation Queue</h2>

            {loading ? (
                <div className="p-8 text-center text-gray-500">Cargando validaciones...</div>
            ) : intents.length === 0 ? (
                <div className="p-8 text-center text-gray-500 bg-gray-50 rounded">
                    No hay pagos pendientes de validación.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-left">
                            <tr>
                                <th className="px-3 py-2 font-semibold">Fecha</th>
                                <th className="px-3 py-2 font-semibold">Casa</th>
                                <th className="px-3 py-2 font-semibold">Residente</th>
                                <th className="px-3 py-2 font-semibold text-right">Monto</th>
                                <th className="px-3 py-2 font-semibold">Método</th>
                                <th className="px-3 py-2 font-semibold">Referencia</th>
                                <th className="px-3 py-2 font-semibold text-center">Estado</th>
                                <th className="px-3 py-2 font-semibold text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {intents.map(intent => (
                                <tr key={intent.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        {new Date(intent.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-3 py-2 font-medium">{intent.houseLabel}</td>
                                    <td className="px-3 py-2">{intent.residentName}</td>
                                    <td className="px-3 py-2 text-right font-medium">
                                        ${(intent.amountCents / 100).toFixed(2)}
                                    </td>
                                    <td className="px-3 py-2 capitalize">{intent.method}</td>
                                    <td className="px-3 py-2 font-mono text-xs">{intent.referenceNumber || '-'}</td>
                                    <td className="px-3 py-2 text-center text-yellow-600 font-medium">
                                        {intent.status}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <button
                                            onClick={() => setSelectedIntent(intent)}
                                            className="text-blue-600 hover:underline font-semibold"
                                        >
                                            Revisar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ValidationDetailSlideOver
                intent={selectedIntent}
                open={!!selectedIntent}
                onClose={() => setSelectedIntent(null)}
                onValidate={handleValidate}
                onReject={handleReject}
                onReverse={handleReverse}
            />
        </div>
    );
};
