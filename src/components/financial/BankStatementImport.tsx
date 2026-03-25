import React, { useState } from 'react';
import Papa from 'papaparse';
import { BankImportPayload, WebERPService } from '@/lib/services/WebERPService';

interface BankStatementImportProps {
    service: WebERPService;
    residencialId: string;
    accountId: string;
    onImportComplete?: () => void;
}

interface ParsedRow {
    raw: any;
    payload?: BankImportPayload;
    status: 'valid' | 'invalid';
    error?: string;
}

export const BankStatementImport: React.FC<BankStatementImportProps> = ({ service, residencialId, accountId, onImportComplete }) => {
    const [parsedData, setParsedData] = useState<ParsedRow[] | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{
        processed: number;
        duplicates: number;
        invalid: number;
    } | null>(null);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rows: ParsedRow[] = results.data.map((row: any) => {
                    try {
                        // Expecting generic columns: date, description, amount, reference
                        if (!row.date || !row.amount || !row.reference) {
                            return { raw: row, status: 'invalid', error: 'Missing required columns (date, amount, reference)' };
                        }

                        // Basic mapping
                        const amountCents = Math.round(parseFloat(row.amount.replace(/[^0-9.-]+/g, "")) * 100);
                        if (isNaN(amountCents)) {
                            return { raw: row, status: 'invalid', error: 'Invalid amount format' };
                        }

                        const payload: BankImportPayload = {
                            dateStr: new Date(row.date).toISOString().split('T')[0],
                            description: row.description || '',
                            amountCents,
                            referenceKey: row.reference,
                            type: amountCents > 0 ? 'deposit' : 'withdrawal'
                        };

                        return { raw: row, payload, status: 'valid' };
                    } catch (e: any) {
                        return { raw: row, status: 'invalid', error: e.message };
                    }
                });

                setParsedData(rows);
                setImportResult(null); // Reset
            }
        });
    };

    const handleImport = async () => {
        if (!parsedData) return;

        const validPayloads = parsedData
            .filter(r => r.status === 'valid' && r.payload)
            .map(r => r.payload!);

        if (validPayloads.length === 0) return;

        setIsImporting(true);
        try {
            const res = await service.importBankTransactions(residencialId, accountId, validPayloads);
            if (res.success) {
                setImportResult({
                    processed: res.stats.processed,
                    duplicates: res.stats.duplicates,
                    invalid: parsedData.filter(r => r.status === 'invalid').length + res.stats.invalid
                });
                setParsedData(null); // Clear preview on success
                if (onImportComplete) onImportComplete();
            }
        } catch (error) {
            console.error('Import failed', error);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Importar Estado de Cuenta</h2>

            {!importResult && !parsedData && (
                <div className="border-2 border-dashed border-gray-300 rounded p-10 text-center">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="mb-4 block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                    />
                    <p className="text-gray-500 text-sm">Sube tu archivo CSV bancario. Columnas esperadas: <code>date</code>, <code>description</code>, <code>amount</code>, <code>reference</code>.</p>
                </div>
            )}

            {parsedData && (
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg">Previsualización de Filas</h3>
                        <div className="flex gap-4 items-center">
                            <span className="text-sm">
                                <span className="text-green-600 font-bold">{parsedData.filter(r => r.status === 'valid').length}</span> Válidas |
                                <span className="text-red-600 font-bold ml-1">{parsedData.filter(r => r.status === 'invalid').length}</span> Inválidas
                            </span>
                            <button
                                onClick={handleImport}
                                disabled={isImporting || parsedData.filter(r => r.status === 'valid').length === 0}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isImporting ? 'Procesando...' : 'Confirmar Importación'}
                            </button>
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto border rounded">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left font-semibold">Estado</th>
                                    <th className="px-3 py-2 text-left font-semibold">Fecha</th>
                                    <th className="px-3 py-2 text-left font-semibold">Descripción</th>
                                    <th className="px-3 py-2 text-right font-semibold">Monto</th>
                                    <th className="px-3 py-2 text-left font-semibold">Referencia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {parsedData.map((row, idx) => (
                                    <tr key={idx} className={row.status === 'invalid' ? 'bg-red-50' : 'hover:bg-gray-50'}>
                                        <td className="px-3 py-2">
                                            {row.status === 'valid' ?
                                                <span className="text-green-600">✓ Listo</span> :
                                                <span className="text-red-600 font-semibold" title={row.error}>⚠ Inválido</span>}
                                        </td>
                                        <td className="px-3 py-2">{row.payload?.dateStr || row.raw.date}</td>
                                        <td className="px-3 py-2 truncate max-w-xs">{row.payload?.description || row.raw.description}</td>
                                        <td className="px-3 py-2 text-right font-medium">
                                            {row.payload ? `$${(row.payload.amountCents / 100).toFixed(2)}` : row.raw.amount}
                                        </td>
                                        <td className="px-3 py-2 font-mono text-xs">{row.payload?.referenceKey || row.raw.reference}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {importResult && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded p-6 text-center">
                    <h3 className="text-xl font-bold text-green-800 mb-2">¡Importación Exitosa!</h3>
                    <div className="flex justify-center gap-8 mt-4 text-green-900">
                        <div>
                            <p className="text-3xl font-black">{importResult.processed}</p>
                            <p className="text-sm">Nuevas Registradas</p>
                        </div>
                        <div>
                            <p className="text-3xl font-black">{importResult.duplicates}</p>
                            <p className="text-sm">Duplicadas Evitadas</p>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-red-600">{importResult.invalid}</p>
                            <p className="text-sm">Inválidas / Ignoradas</p>
                        </div>
                    </div>
                    <div className="mt-6">
                        <button className="text-blue-600 font-bold hover:underline">
                            Ir a Conciliación Filtrada →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
