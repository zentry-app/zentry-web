'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { SaleNoteFormData } from '@/types/sales-notes';
import { SaleNotesService } from '@/lib/services/sales-notes-service';

interface SaleNotePreviewProps {
    formData: SaleNoteFormData;
    folio?: string;
    showDownloadButton?: boolean;
    previewMode?: boolean;
}

const PAYMENT_LABELS: Record<string, string> = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia Bancaria',
    tarjeta: 'Tarjeta de Crédito/Débito',
    cheque: 'Cheque',
    otro: 'Otro',
};

// Zentry Brand Colors
const ZENTRY_BLUE = '#0066FF'; // Match the logo blue
const TEXT_SLATE = '#1E293B';
const LIGHT_SLATE = '#64748B';

export function SaleNotePreview({
    formData,
    folio = '#NV-XXXX',
    showDownloadButton = false,
    previewMode = true,
}: SaleNotePreviewProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const totals = SaleNotesService.calculateTotals(formData.items, formData.ivaType);
    const ivaLabel = formData.ivaType === 'exento' ? 'Exento' : `${formData.ivaType}%`;

    const currentDate = formData.fecha
        ? new Date(formData.fecha + 'T12:00:00Z').toLocaleDateString('es-MX', {
            day: 'numeric', month: 'long', year: 'numeric',
        })
        : new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

    const formatMXN = (val: number) =>
        `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const handleDownloadPdf = async () => {
        if (!printRef.current) return;
        setIsGenerating(true);
        await new Promise((r) => setTimeout(r, 200));
        try {
            const element = printRef.current;
            const canvas = await html2canvas(element, {
                scale: 1.5,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                scrollX: 0,
                scrollY: 0,
            });

            const pdf = new jsPDF('p', 'mm', 'a4');
            const PAGE_W = 210;
            const PAGE_H = 297;

            const imgData = canvas.toDataURL('image/jpeg', 0.98);
            const imgHeightMm = (canvas.height * PAGE_W) / canvas.width;

            let remainingMm = imgHeightMm;
            let yOffset = 0;
            while (remainingMm > 0) {
                if (yOffset > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, -yOffset, PAGE_W, imgHeightMm);
                yOffset += PAGE_H;
                remainingMm -= PAGE_H;
            }

            const safeName = formData.clienteEmpresa.replace(/[^a-zA-Z0-9]/g, '-') || 'NotaVenta';
            pdf.save(`NotaVenta-Zentry-${safeName}-${folio.replace('#', '')}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const scale = previewMode ? 'scale-[0.55] origin-top-left' : '';

    return (
        <div className={previewMode ? 'relative' : ''}>
            {showDownloadButton && (
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isGenerating}
                        className="bg-[#0066FF] text-white px-8 py-2.5 rounded-full font-bold hover:bg-blue-700 transition shadow-lg flex items-center gap-2 text-sm uppercase tracking-widest"
                    >
                        {isGenerating ? 'Generando...' : 'Descargar PDF'}
                    </button>
                </div>
            )}

            <div className={previewMode ? 'overflow-hidden border border-slate-100 rounded-3xl' : ''} style={previewMode ? { height: isGenerating ? 'auto' : '700px' } : {}}>
                <div className={isGenerating ? '' : scale}>
                    <div
                        ref={printRef}
                        className="bg-white font-sans text-slate-800 leading-normal"
                        style={{ width: '210mm', minHeight: '297mm', padding: '1.5cm 2cm' }}
                    >
                        {/* HEADER MINIMALISTA */}
                        <header className="flex justify-between items-start mb-16">
                            <div>
                                <div className="relative h-10 w-32 mb-4">
                                    <Image
                                        src="/assets/logo/zentry-logo-new.png"
                                        alt="Zentry Logo"
                                        fill
                                        className="object-contain"
                                        sizes="128px"
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Propuesta Comercial Zentry</p>
                                    <p className="text-[10px] text-slate-400">Zentry Tech Group S. de R.L. de C.V.</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="inline-flex items-center justify-center bg-[#0066FF] text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest leading-none">
                                    Nota de Venta
                                </div>
                                <h2 className="text-4xl font-black text-[#1E293B] tracking-tighter italic leading-none">{folio}</h2>
                                <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-widest">{currentDate}</p>
                            </div>
                        </header>

                        {/* INFO CLIENTE Y PAGO */}
                        <div className="flex gap-20 mb-16 border-t border-slate-100 pt-10">
                            <div className="flex-1">
                                <h3 className="text-[10px] font-black text-[#0066FF] uppercase tracking-widest mb-4">Cliente</h3>
                                <p className="font-extrabold text-2xl text-[#1E293B] leading-tight mb-2">
                                    {formData.clienteEmpresa || 'Empresa del Cliente'}
                                </p>
                                <p className="text-slate-500 font-bold text-sm italic">
                                    Atn. {formData.clienteNombre || 'Nombre del Cliente'}
                                </p>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <h3 className="text-[10px] font-black text-[#0066FF] uppercase tracking-widest mb-4">Detalles del Pago</h3>
                                <p className="font-black text-[#1E293B] text-lg uppercase italic tracking-tight mb-1">
                                    {PAYMENT_LABELS[formData.metodoPago] || 'No definido'}
                                </p>
                                {formData.referenciaPago && (
                                    <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">REF: {formData.referenciaPago}</p>
                                )}
                            </div>
                        </div>

                        {/* TABLA MINIMALISTA */}
                        <div className="mb-12">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-2 border-slate-900">
                                        <th className="py-4 text-left text-[11px] font-black text-[#1E293B] uppercase tracking-widest w-[60%]">Descripción del Servicio</th>
                                        <th className="py-4 text-center text-[11px] font-black text-[#1E293B] uppercase tracking-widest px-4">Cant.</th>
                                        <th className="py-4 text-right text-[11px] font-black text-[#1E293B] uppercase tracking-widest">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[12px]">
                                    {formData.items.map((item, idx) => (
                                        <tr key={idx} className="border-b border-slate-100">
                                            <td className="py-6 pr-8">
                                                <p className="font-extrabold text-[#1E293B] text-sm mb-1">{item.nombre}</p>
                                                {item.descripcion && (
                                                    <p className="text-slate-400 text-[11px] leading-relaxed italic line-clamp-2">{item.descripcion}</p>
                                                )}
                                            </td>
                                            <td className="py-6 text-center">
                                                <span className="font-black text-[#1E293B]">{item.cantidad}</span>
                                            </td>
                                            <td className="py-6 text-right font-black text-[#1E293B] text-base tracking-tighter">
                                                {formatMXN(item.cantidad * item.precioUnitario)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* TOTALES */}
                        <div className="flex justify-between items-start mb-24">
                            <div className="max-w-[50%]">
                                {formData.notas && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Información Adicional</p>
                                        <p className="text-slate-400 text-[11px] leading-relaxed border-l-2 border-slate-100 pl-4 italic">{formData.notas}</p>
                                    </div>
                                )}
                            </div>
                            <div className="w-64 space-y-3">
                                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                                    <span className="uppercase tracking-widest">Subtotal</span>
                                    <span className="font-black text-[#1E293B]">{formatMXN(totals.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                                    <span className="uppercase tracking-widest">I.V.A. ({ivaLabel})</span>
                                    <span className="font-black text-[#1E293B]">{formatMXN(totals.iva)}</span>
                                </div>
                                <div className="pt-4 border-t-2 border-slate-900 mt-2 flex justify-between items-end">
                                    <div className="inline-flex items-center justify-center bg-[#0066FF] text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest leading-none">
                                        Total
                                    </div>
                                    <p className="text-4xl font-black text-[#1E293B] tracking-tighter italic leading-none">
                                        {formatMXN(totals.total)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <footer className="mt-auto border-t border-slate-100 pt-8 flex justify-between items-end italic">
                            <div>
                                <p className="text-[#1E293B] font-black text-sm uppercase tracking-tighter not-italic">Zentry Tech Group</p>
                                <p className="text-slate-400 text-[9px] font-medium leading-relaxed mt-1">Este documento es una confirmación de venta. <br /> No sustituye al comprobante fiscal.</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[#0066FF] font-black text-[10px] tracking-[0.2em] uppercase mb-1">www.zentry.app</p>
                                <p className="text-slate-300 text-[8px] font-medium">© 2026 Zentry Tech. Todos los derechos reservados.</p>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SaleNotePreview;
