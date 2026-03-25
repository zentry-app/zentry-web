import React, { useState } from 'react';
import { WebERPService } from '@/lib/services/WebERPService';

interface ReconciliationExportPanelProps {
    service: WebERPService;
    residencialId: string;
}

export const ReconciliationExportPanel: React.FC<ReconciliationExportPanelProps> = ({ service, residencialId }) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleExportCsv = async () => {
        setIsExporting(true);
        try {
            const transactions = await service.getReconciledBankTransactions(residencialId);

            if (transactions.length === 0) {
                alert('No hay transacciones conciliadas para exportar.');
                setIsExporting(false);
                return;
            }

            const headers = ['ID_Transacción', 'Fecha', 'Descripción', 'Monto_Pesos', 'Referencia_Bancaria', 'ID_Intención_Pago_Match'];
            const rows = transactions.map(tx => [
                tx.id,
                new Date(tx.date).toLocaleDateString(),
                `"${tx.description}"`,
                (tx.amountCents / 100).toFixed(2),
                `"${tx.referenceKey}"`,
                tx.matchedPaymentIntentId || ''
            ]);

            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.setAttribute('download', `Conciliaciones_Completas_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Error exporting CSV:', error);
            alert('Ocurrió un error al intentar exportar el reporte.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold mb-1">Exportador Contable</h2>
                    <p className="text-gray-500 text-sm">Descarga el reporte de todas las transacciones bancarias que ya han sido conciliadas con éxito.</p>
                </div>
                <button
                    onClick={handleExportCsv}
                    disabled={isExporting}
                    className="bg-green-600 text-white px-6 py-3 rounded font-bold hover:bg-green-700 disabled:opacity-50"
                >
                    {isExporting ? 'Generando CSV...' : 'Exportar CSV'}
                </button>
            </div>
        </div>
    );
};
