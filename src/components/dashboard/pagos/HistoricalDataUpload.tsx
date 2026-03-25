"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/lib/firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { UploadCloud, FileType, CheckCircle, AlertCircle, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import * as xlsx from 'xlsx';

interface ParsedRecord {
    identificador_casa: string;
    monto: number;
    tipo: 'deuda' | 'a_favor';
    concepto: string;
    isValid: boolean;
    houseId?: string; // Resolved from Firestore
    errorMsg?: string;
}

interface HistoricalDataUploadProps {
    residencialId: string;
}

export function HistoricalDataUpload({ residencialId }: HistoricalDataUploadProps) {
    const [fileData, setFileData] = useState<ParsedRecord[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0 });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resolveHouseIds = async (records: Pick<ParsedRecord, 'identificador_casa' | 'monto' | 'tipo' | 'concepto'>[]) => {
        setIsProcessing(true);
        const newRecords: ParsedRecord[] = [];
        const houseMap = new Map<string, string>(); // To cache found houses

        try {
            for (const row of records) {
                let isValid = true;
                let errorMsg = '';
                let houseId = '';

                if (!row.identificador_casa) {
                    isValid = false;
                    errorMsg = 'Falta identificador';
                } else if (isNaN(row.monto) || row.monto <= 0) {
                    isValid = false;
                    errorMsg = 'Monto inválido';
                } else if (row.tipo !== 'deuda' && row.tipo !== 'a_favor') {
                    isValid = false;
                    errorMsg = 'Tipo debe ser "deuda" o "a_favor"';
                }

                if (isValid) {
                    const houseIdentifier = String(row.identificador_casa).trim();
                    if (houseMap.has(houseIdentifier)) {
                        houseId = houseMap.get(houseIdentifier)!;
                    } else {
                        // Buscamos doc en la colección usuarios (casas)
                        const q = query(
                            collection(db, 'usuarios'),
                            where('residencialID', '==', residencialId),
                            where('houseNumber', '==', houseIdentifier)
                        );
                        const snapshot = await getDocs(q);

                        if (snapshot.empty) {
                            isValid = false;
                            errorMsg = `Casa ${houseIdentifier} no encontrada`;
                        } else {
                            // Asumimos que la casa pertenece al primer habitante principal encontrado
                            houseId = snapshot.docs[0].data().houseId;
                            if (!houseId) {
                                // Si la estructura legacy no tenía houseId, usamos la combinación
                                houseId = `house_${houseIdentifier}`;
                            }
                            houseMap.set(houseIdentifier, houseId);
                        }
                    }
                }

                newRecords.push({
                    ...row,
                    monto: Number(row.monto),
                    isValid,
                    houseId,
                    errorMsg
                });
            }

            setFileData(newRecords);
            setStats({
                total: newRecords.length,
                valid: newRecords.filter(r => r.isValid).length,
                invalid: newRecords.filter(r => !r.isValid).length,
            });

        } catch (error) {
            console.error('Error resolving houses:', error);
            toast.error('Error al procesar el archivo o buscar las casas.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setFileData([]);

        const fileExt = file.name.split('.').pop()?.toLowerCase();

        if (fileExt === 'csv') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const rawRecords = results.data.map((row: any) => ({
                        identificador_casa: row.identificador_casa || row.casa || '',
                        monto: parseFloat(row.monto) || 0,
                        tipo: (row.tipo || '').toLowerCase(),
                        concepto: row.concepto || 'Saldo inicial histórico',
                    }));
                    resolveHouseIds(rawRecords as any);
                },
                error: () => toast.error('Error al leer el archivo CSV')
            });
        } else if (fileExt === 'xlsx' || fileExt === 'xls') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = xlsx.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

                const rawRecords = jsonData.map((row: any) => ({
                    identificador_casa: row.identificador_casa || row.casa || row.Casa || '',
                    monto: parseFloat(row.monto || row.Monto) || 0,
                    tipo: String(row.tipo || row.Tipo || '').toLowerCase(),
                    concepto: row.concepto || row.Concepto || 'Saldo inicial histórico',
                }));

                resolveHouseIds(rawRecords as any);
            };
            reader.readAsArrayBuffer(file);
        } else {
            toast.error('Formato no soportado. Sube CSV o Excel (.xlsx)');
        }
    };

    const procesarCarga = async () => {
        const validRecords = fileData.filter(r => r.isValid);
        if (validRecords.length === 0) {
            toast.warning('No hay registros válidos para subir.');
            return;
        }

        setIsUploading(true);
        let successCount = 0;

        try {
            const functions = getFunctions();
            const apiAdjustBalance = httpsCallable(functions, 'apiAdjustBalance');

            for (const record of validRecords) {
                if (!record.houseId) continue;

                await apiAdjustBalance({
                    residencialId,
                    houseId: record.houseId,
                    amount: record.monto,
                    impact: record.tipo === 'deuda' ? 'INCREASE_DEBT' : 'DECREASE_DEBT',
                    subType: 'balance_adjustment_manual',
                    description: record.concepto || 'Migración de Saldo Histórico'
                });
                successCount++;
            }
            toast.success(`Se importaron ${successCount} saldos iniciales exitosamente.`);
            setFileData([]);
            setFileName('');
            setStats({ total: 0, valid: 0, invalid: 0 });
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error: any) {
            console.error('Error al subir saldos:', error);
            toast.error(`Error al importar saldos: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Importar Saldos Históricos</CardTitle>
                <CardDescription>
                    Carga un archivo de Excel (.xlsx) o CSV con el saldo anterior de cada casa para iniciar el nuevo Ledger o Libro Mayor inmutable. <br />
                    <strong>Formato requerido de columnas:</strong> <code className="bg-muted px-1 rounded">identificador_casa</code>, <code className="bg-muted px-1 rounded">monto</code>, <code className="bg-muted px-1 rounded">tipo (deuda o a_favor)</code>, <code className="bg-muted px-1 rounded">concepto</code>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col mb-6 space-y-4">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isProcessing || isUploading}>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Seleccionar Archivo
                        </Button>
                        <input
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />
                        {fileName && (
                            <span className="text-sm font-medium flex items-center text-muted-foreground">
                                <FileType className="mr-2 h-4 w-4" /> {fileName}
                            </span>
                        )}
                    </div>

                    {stats.total > 0 && (
                        <div className="flex items-center space-x-6 bg-slate-50 p-4 rounded-lg border">
                            <div className="flex flex-col">
                                <span className="text-sm text-slate-500 font-medium">Total Registros</span>
                                <span className="text-2xl font-bold">{stats.total}</span>
                            </div>
                            <div className="flex flex-col text-green-600">
                                <span className="text-sm font-medium">Válidos (Listos)</span>
                                <span className="text-2xl font-bold flex items-center"><CheckCircle className="h-5 w-5 mr-1" /> {stats.valid}</span>
                            </div>
                            <div className="flex flex-col text-red-600">
                                <span className="text-sm font-medium">Con Errores</span>
                                <span className="text-2xl font-bold flex items-center"><AlertCircle className="h-5 w-5 mr-1" /> {stats.invalid}</span>
                            </div>
                        </div>
                    )}
                </div>

                {isProcessing ? (
                    <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                        <RefreshCw className="h-8 w-8 animate-spin mb-4" />
                        <p>Verificando casas y validando datos...</p>
                    </div>
                ) : fileData.length > 0 ? (
                    <div className="border rounded-md overflow-hidden max-h-[400px] overflow-y-auto">
                        <Table>
                            <TableHeader className="bg-slate-100">
                                <TableRow>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Casa</TableHead>
                                    <TableHead>Concepto</TableHead>
                                    <TableHead>Tipo de Saldo</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                    <TableHead>Observaciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fileData.map((row, idx) => (
                                    <TableRow key={idx} className={row.isValid ? '' : 'bg-red-50'}>
                                        <TableCell>
                                            {row.isValid ? (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <AlertCircle className="h-5 w-5 text-red-500" />
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{row.identificador_casa}</TableCell>
                                        <TableCell>{row.concepto}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.tipo === 'deuda' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {row.tipo.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-bold w-[120px]">
                                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.monto)}
                                        </TableCell>
                                        <TableCell className="text-sm text-red-600 font-medium">
                                            {!row.isValid && row.errorMsg}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-10 border-2 border-dashed rounded-lg text-slate-400">
                        <FileType className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Sube tu archivo para previsualizar los datos aquí.</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-end bg-slate-50 border-t py-4">
                <Button
                    disabled={stats.valid === 0 || isUploading || isProcessing}
                    onClick={procesarCarga}
                    className="w-full sm:w-auto"
                >
                    {isUploading ? (
                        <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Importando Saldos...</>
                    ) : (
                        <><Save className="mr-2 h-4 w-4" /> Importar {stats.valid} registros válidos al ERP</>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
