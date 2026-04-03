'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { QuoteFormData, QuoteTerm } from '@/types/quotes';
import { QuotesService } from '@/lib/services/quotes-service';

interface QuotePreviewProps {
    formData: QuoteFormData;
    folio?: string;
    terms: QuoteTerm[];
    showDownloadButton?: boolean;
    previewMode?: boolean;
}

export function QuotePreview({
    formData,
    folio = '#XXXX',
    terms,
    showDownloadButton = false,
    previewMode = true,
}: QuotePreviewProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const calcs = QuotesService.calculateTotals(formData.items, formData.ivaType);
    const ivaPercent = formData.ivaType === '8' ? '8%' : '16%';

    const currentDate = formData.fecha ? new Date(formData.fecha + 'T12:00:00Z').toLocaleDateString('es-MX', {
        day: 'numeric', month: 'long', year: 'numeric',
    }) : new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

    const monthlyItems = formData.items.filter((i) => i.tipoCobro === 'mensual');
    const oneTimeItems = formData.items.filter((i) => i.tipoCobro === 'unico');

    const selectedTerms = terms.filter((t) => formData.terminosIds.includes(t.id));
    const incluye = [
        ...selectedTerms.filter((t) => t.categoria === 'incluye'),
        ...formData.terminosPersonalizados.filter((t) => t.categoria === 'incluye'),
    ];
    const condiciones = [
        ...selectedTerms.filter((t) => t.categoria === 'condicion'),
        ...formData.terminosPersonalizados.filter((t) => t.categoria === 'condicion'),
    ];
    const clausulas = [
        ...selectedTerms.filter((t) => t.categoria === 'clausula'),
        ...formData.terminosPersonalizados.filter((t) => t.categoria === 'clausula'),
    ];

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

            const safeName = formData.clienteEmpresa.replace(/[^a-zA-Z0-9]/g, '-') || 'Cotizacion';
            pdf.save(`Cotizacion-Zentry-${safeName}-${folio.replace('#', '')}.pdf`);
        } catch (error) {
            console.error('Error:', error);
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
                        className="bg-[#0066FF] text-white px-8 py-2.5 rounded-full font-bold hover:bg-blue-700 transition shadow-lg flex items-center gap-2 text-sm uppercase tracking-widest leading-none"
                    >
                        {isGenerating ? 'Generando...' : 'Descargar PDF'}
                    </button>
                </div>
            )}

            <div className={previewMode ? 'overflow-hidden border border-slate-100 rounded-3xl' : ''} style={previewMode ? { height: isGenerating ? 'auto' : '700px' } : {}}>
                <div className={isGenerating ? '' : scale}>
                    <div
                        ref={printRef}
                        className="bg-white p-[2cm] relative font-sans text-[#1E293B]"
                        style={{ width: '210mm', minHeight: '297mm' }}
                    >
                        {/* Header Minimalista */}
                        <header className="flex justify-between items-start mb-16 border-b border-slate-100 pb-10">
                            <div>
                                <div className="relative h-9 w-32 mb-4">
                                    <Image
                                        src="/assets/logo/zentry-logo-new.png"
                                        alt="Zentry Logo"
                                        fill
                                        className="object-contain"
                                        sizes="128px"
                                    />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0066FF]">Propuesta Comercial Zentry</p>
                                    <p className="text-[10px] text-slate-400 font-bold">Zentry Tech Group S. de R.L. de C.V.</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="inline-flex items-center justify-center bg-[#1E293B] text-white px-3 py-1.5 rounded-full text-[8.5px] font-black uppercase tracking-widest leading-none mb-3">
                                    {formData.tipoCotizacion === 'nuevo' ? 'Presupuesto' :
                                        formData.tipoCotizacion === 'mensual' ? 'Licencia SaaS' :
                                            formData.tipoCotizacion === 'integracion' ? 'Integración' : 'Cotización'}
                                </span>
                                <h2 className="text-4xl font-black text-[#1E293B] tracking-tighter italic leading-none">{folio}</h2>
                                <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-widest">{currentDate}</p>
                            </div>
                        </header>

                        {/* Info Cliente */}
                        <div className="flex gap-20 mb-16">
                            <div className="flex-1">
                                <h3 className="text-[10px] font-black text-[#0066FF] uppercase tracking-widest mb-4">Emitido para</h3>
                                <p className="font-extrabold text-2xl text-[#1E293B] leading-tight mb-2">{formData.clienteEmpresa || 'Empresa'}</p>
                                <p className="text-slate-500 font-bold text-sm italic">Atn: {formData.clienteNombre || 'Nombre'}</p>
                                <p className="text-slate-400 text-[10px] mt-2 font-bold uppercase tracking-widest">{formData.clienteProyecto || 'Proyecto'} · {formData.clienteUnidades || 0} Unidades</p>
                            </div>
                            <div className="text-right">
                                <h3 className="text-[10px] font-black text-[#0066FF] uppercase tracking-widest mb-4">Información de Contacto</h3>
                                <p className="font-black text-[#1E293B] text-sm uppercase italic mb-1 leading-none">zentry.app.mx@gmail.com</p>
                                <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">+52 686 110 6270</p>
                            </div>
                        </div>

                        {/* Tablas Minimalistas */}
                        <div className="space-y-12 mb-16">
                            {monthlyItems.length > 0 && (
                                <div>
                                    <h4 className="text-[11px] font-black text-[#1E293B] uppercase tracking-[0.2em] mb-4 pb-2 border-b-2 border-slate-900 w-fit">Inversión Mensual</h4>
                                    <table className="w-full text-[12px]">
                                        <tbody className="divide-y divide-slate-100">
                                            {monthlyItems.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="py-6 pr-8 w-[65%]">
                                                        <p className="font-extrabold text-[#1E293B] mb-1">{item.nombre}</p>
                                                        {item.descripcion && <p className="text-slate-400 text-[11px] italic leading-tight">{item.descripcion}</p>}
                                                    </td>
                                                    <td className="py-6 text-right font-black text-[#1E293B] text-base italic">{formatMXN(item.cantidad * item.precioUnitario)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {oneTimeItems.length > 0 && (
                                <div>
                                    <h4 className="text-[11px] font-black text-[#1E293B] uppercase tracking-[0.2em] mb-4 pb-2 border-b-2 border-slate-900 w-fit">Inversión Inicial</h4>
                                    <table className="w-full text-[12px]">
                                        <tbody className="divide-y divide-slate-100">
                                            {oneTimeItems.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="py-6 pr-8 w-[65%]">
                                                        <p className="font-extrabold text-[#1E293B] mb-1">{item.nombre}</p>
                                                        {item.descripcion && <p className="text-slate-400 text-[11px] italic leading-tight">{item.descripcion}</p>}
                                                    </td>
                                                    <td className="py-6 text-right font-black text-[#1E293B] text-base italic">{formatMXN(item.cantidad * item.precioUnitario)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Terms */}
                        <div className="grid grid-cols-2 gap-12 mb-20 border-t border-slate-100 pt-16">
                            {(incluye.length > 0 || condiciones.length > 0) && (
                                <div className="space-y-8">
                                    {incluye.length > 0 && (
                                        <div>
                                            <h4 className="text-[10px] font-black text-[#0066FF] uppercase tracking-widest mb-4">Lo que incluye</h4>
                                            <ul className="space-y-2 text-slate-500 text-[10px] font-bold">
                                                {incluye.map((t, i) => <li key={i} className="flex gap-2"><span>•</span> {t.contenido}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {condiciones.length > 0 && (
                                        <div>
                                            <h4 className="text-[10px] font-black text-[#0066FF] uppercase tracking-widest mb-4">Condiciones</h4>
                                            <ul className="space-y-2 text-slate-500 text-[10px] font-bold">
                                                {condiciones.map((t, i) => <li key={i} className="flex gap-2"><span>•</span> {t.contenido}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                            {clausulas.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-black text-[#0066FF] uppercase tracking-widest mb-4">Cláusulas Legales</h4>
                                    <div className="space-y-3">
                                        {clausulas.map((t, i) => <p key={i} className="text-slate-400 text-[9px] text-justify italic italic-none leading-relaxed leading-tight">{t.contenido}</p>)}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Final */}
                        <div className="flex justify-between items-end border-t border-slate-100 pt-10">
                            <div>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 italic">Validez de la oferta: {formData.validezDias} días</p>
                                <p className="text-[#1E293B] font-black text-sm uppercase tracking-tighter">Zentry Tech Group S. de R.L. de C.V.</p>
                                <p className="text-[#0066FF] font-black text-[10px] tracking-[0.2em] uppercase mt-2">www.zentry.app</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="inline-flex items-center justify-center bg-[#0066FF] text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest leading-none mb-2">Total Inversión</span>
                                <p className="text-5xl font-black text-[#1E293B] tracking-tighter italic leading-none">{formatMXN(calcs.totalUnico || calcs.totalMensual)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuotePreview;
