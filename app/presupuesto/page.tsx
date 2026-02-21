"use client";

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PresupuestoPage = () => {
    const printRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownloadPdf = async () => {
        if (!printRef.current) return;

        setIsGenerating(true);

        try {
            const element = printRef.current;

            // Capture the element with high quality
            const canvas = await html2canvas(element, {
                scale: 2, // Higher scale for better resolution
                useCORS: true, // Handle images from external domains if any (though ours are local/next/image)
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');

            // A4 dimensions in mm
            const pdfWidth = 210;
            const pdfHeight = 297;

            const pdf = new jsPDF('p', 'mm', 'a4');

            // Add image to PDF, keeping aspect ratio but fitting to width
            const imgProps = pdf.getImageProperties(imgData);
            const imgWidth = pdfWidth;
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

            // Since we want it on one page, we check if height > a4 height
            // But our CSS enforces A4 max-height style, so it should fit closely.
            // If it's slightly taller due to calculation, we can scale down to fit height.

            let finalWidth = imgWidth;
            let finalHeight = imgHeight;

            if (imgHeight > pdfHeight) {
                finalHeight = pdfHeight;
                finalWidth = (imgProps.width * finalHeight) / imgProps.height;
            }

            // Center horizontally if scaled by height
            const x = (pdfWidth - finalWidth) / 2;
            const y = 0; // Start at top

            pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
            pdf.save('Presupuesto-Zentry-AriaLife-18.pdf');

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Hubo un error al generar el PDF. Por favor intenta de nuevo.');
        } finally {
            setIsGenerating(false);
        }
    };

    const currentDate = new Date().toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const cantidadCasas = 280;
    const precioUnitario = 13.00;
    const subtotalMensual = cantidadCasas * precioUnitario;
    const iva = subtotalMensual * 0.08; // 8% IVA
    const totalMensual = subtotalMensual + iva;

    return (
        <div className="min-h-screen bg-gray-100 py-10 px-4 font-sans text-slate-800">
            {/* Toolbar */}
            <div className="max-w-[21cm] mx-auto mb-6 flex justify-between items-center">
                <h1 className="text-xl font-bold text-slate-700">Vista Previa de Propuesta</h1>
                <button
                    onClick={handleDownloadPdf}
                    disabled={isGenerating}
                    className={`
                        bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold 
                        hover:bg-blue-700 transition shadow-md flex items-center gap-2
                        ${isGenerating ? 'opacity-70 cursor-wait' : ''}
                    `}
                >
                    {isGenerating ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generando PDF...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Descargar PDF
                        </>
                    )}
                </button>
            </div>

            {/* Hoja A4 - Visualmente ajustada para que quepa todo en una sola vista sin scroll excesivo en el PDF */}
            <div
                ref={printRef}
                className="max-w-[21cm] mx-auto bg-white shadow-2xl p-[2cm] relative"
                style={{
                    width: '210mm',
                    minHeight: '297mm', // Force A4 Height
                    height: '297mm',
                    overflow: 'hidden' // Ensure nothing spills out to a second page visually
                }}
            >
                {/* Header Compacto */}
                <header className="flex justify-between items-end border-b-2 border-slate-100 pb-4 mb-8">
                    <div>
                        {/* Logo */}
                        <div className="relative mb-1">
                            {/* Usamos img normal para mejor compatibilidad con html2canvas y control de tamaño */}
                            <img
                                src="/assets/logo/zentry-logo-new.png"
                                alt="Zentry Logo"
                                className="h-8 w-auto object-contain object-left brightness-0 invert"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Tecnología para Comunidades Inteligentes</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-light text-slate-300 tracking-tight">PRESUPUESTO</h2>
                        <p className="text-slate-500 font-medium mt-1">#0018</p>
                        <p className="text-slate-500 text-xs mt-1">{currentDate}</p>
                    </div>
                </header>

                {/* Cliente Info Compacto */}
                <div className="flex justify-between gap-8 mb-10 text-sm">
                    <div className="w-1/2">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Preparado para:</h3>
                        <div className="text-slate-800">
                            <p className="font-bold text-lg mb-0.5">Aria Life SA de CV</p>
                            <p className="text-slate-600 text-xs">Atn: Dirección de Proyectos</p>
                            <p className="text-slate-600 text-xs">Proyecto Residencial (280 Unidades)</p>
                        </div>
                    </div>
                    <div className="w-1/2 text-right">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">De:</h3>
                        <div className="text-slate-800">
                            <p className="font-bold text-base">Zentry Tech Group S. de R.L. de C.V.</p>
                            <p className="text-slate-600 text-xs">zentry.app.mx@gmail.com</p>
                            <p className="text-slate-600 text-xs">+52 686 110 6270</p>
                        </div>
                    </div>
                </div>

                {/* Introducción */}
                <div className="mb-8">
                    <h3 className="text-base font-bold text-blue-900 mb-2">Propuesta de Valor</h3>
                    <p className="text-slate-600 leading-relaxed text-justify text-xs">
                        Gracias por considerar a Zentry para su nuevo desarrollo. Nuestra plataforma no solo moderniza la gestión administrativa, sino que se convierte en un activo de venta tangible al ofrecer a sus futuros residentes un entorno seguro, conectado y plusvalizado desde el primer día.
                    </p>
                </div>

                {/* Tabla de Precios */}
                <div className="mb-8">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-1/2">Descripción</th>
                                <th className="py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Cantidad</th>
                                <th className="py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Precio Unit.</th>
                                <th className="py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            <tr className="border-b border-slate-50">
                                <td className="py-3 pr-4">
                                    <p className="font-bold text-slate-800 text-sm">Licencia Zentry App Residencial - Constructoras</p>
                                    <p className="text-slate-500 text-[10px] mt-0.5">
                                        Incluye: Módulo de Seguridad (QR), Administración, Reservas, Finanzas y App para Residentes (iOS/Android).
                                    </p>
                                </td>
                                <td className="py-3 text-right font-medium text-slate-700">{cantidadCasas}</td>
                                <td className="py-3 text-right font-medium text-slate-700">${precioUnitario.toFixed(2)}</td>
                                <td className="py-3 text-right font-bold text-slate-800">${subtotalMensual.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tbody>
                        <tfoot className="text-sm">
                            <tr>
                                <td colSpan={3} className="pt-4 text-right font-medium text-slate-500">Subtotal Mensual:</td>
                                <td className="pt-4 text-right font-medium text-slate-800">${subtotalMensual.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td colSpan={3} className="py-1 text-right font-medium text-slate-500">IVA (8%):</td>
                                <td className="py-1 text-right font-medium text-slate-800">${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                                <td colSpan={3} className="pt-3 text-right">
                                    <span className="bg-blue-50 text-blue-900 font-bold px-3 py-1.5 rounded-lg text-xs">Total Mensual Neto:</span>
                                </td>
                                <td className="pt-3 text-right">
                                    <span className="font-bold text-lg text-blue-900">${totalMensual.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Alcance y Condiciones Compacto */}
                <div className="grid grid-cols-2 gap-8 mb-10 text-xs">
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">Incluye</h4>
                        <ul className="space-y-1.5 text-slate-600">
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 font-bold">✓</span> Cuentas ilimitadas para Admin y Seguridad.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 font-bold">✓</span> Capacitación inicial a personal de caseta.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 font-bold">✓</span> Soporte técnico prioritario.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 font-bold">✓</span> Actualizaciones automáticas y gratuitas.
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">Condiciones Comerciales</h4>
                        <ul className="space-y-1.5 text-slate-600">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500">•</span> Facturación mensual recurrente.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500">•</span> Precio garantizado por 12 meses.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500">•</span> Activación inmediata post-firma.
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer Fijo al fondo */}
                <div className="absolute bottom-[2cm] left-[2cm] right-[2cm] border-t border-slate-100 pt-4 text-center">
                    <p className="text-slate-400 text-[10px] mb-1">
                        Presupuesto válido por 30 días a partir de la fecha de emisión.
                    </p>
                    <p className="text-slate-800 font-bold text-xs uppercase">
                        Zentry Tech Group S. de R.L. de C.V.
                    </p>
                    <p className="text-slate-500 text-[10px]">
                        www.zentrymx.com.mx
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PresupuestoPage;
