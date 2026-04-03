'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Zap, Shield, Building, Rocket, Sparkles, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/landing-new/Navbar';
import Footer from '@/components/landing-new/Footer';

export default function PricingPage() {
    const router = useRouter();

    const tiers = [
        {
            name: 'Plan Único',
            price: '35',
            unit: 'por casa',
            desc: 'Acceso total a todas las herramientas de la plataforma sin restricciones.',
            features: [
                'Control de acceso con QR ilimitado',
                'App para todos los residentes',
                'Reservas de áreas comunes',
                'Gestión de pagos y finanzas',
                'Módulo de comunicados oficial',
                'Soporte prioritario 24/7',
                'Botón de pánico integrado'
            ],
            cta: 'Aprovechar promoción',
            highlight: true,
            isPromo: true
        },
        {
            name: 'Corporativo',
            price: 'Custom',
            unit: '',
            desc: 'Para constructoras o grupos residenciales con múltiples desarrollos.',
            features: [
                'Múltiples fraccionamientos',
                'Panel administrativo unificado',
                'API de integración personalizada',
                'Capacitación presencial',
                'Servidor dedicado (opcional)',
                'Personalización de marca blanca'
            ],
            cta: 'Hablar con ventas',
            highlight: false
        }
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] selection:bg-blue-100">
            <Navbar forceScrolled={true} />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse" />
                    <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-400/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center"
                    >
                        <button
                            onClick={() => router.push('/')}
                            className="inline-flex items-center space-x-2 text-blue-600 font-medium mb-8 hover:translate-x-[-4px] transition-transform group"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Volver al inicio</span>
                        </button>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-6 border border-blue-100">
                            <Sparkles className="w-4 h-4" />
                            <span>Planes Flexibles</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight mb-6">
                            Inversión en <span className="text-blue-600">Comunidad</span>
                        </h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                            Elige el plan que mejor se adapte a las necesidades de tu residencial. Sin letras chiquitas ni cargos ocultos.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {tiers.map((tier: any, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative bg-white rounded-[40px] p-8 md:p-10 border transition-all ${tier.highlight
                                ? 'border-blue-200 shadow-2xl shadow-blue-500/10 scale-105 z-10'
                                : 'border-gray-100 hover:border-blue-100 hover:shadow-xl shadow-sm'
                                }`}
                        >
                            {tier.highlight && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg whitespace-nowrap">
                                    {tier.isPromo ? 'Promoción por Apertura' : 'Recomendado'}
                                </div>
                            )}

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
                                    <p className="text-gray-500 text-sm mt-2">{tier.desc}</p>
                                </div>

                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-gray-900">{tier.price === 'Custom' ? '' : '$'}</span>
                                    <span className="text-5xl font-black text-gray-900">{tier.price}</span>
                                    {tier.price !== 'Custom' && (
                                        <div className="flex flex-col ml-2">
                                            <span className="text-blue-600 font-bold text-sm leading-none">{tier.unit}</span>
                                            <span className="text-gray-400 font-medium text-xs leading-none mt-1">mensual</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 pt-4">
                                    {tier.features.map((feature: string, fIdx: number) => (
                                        <div key={fIdx} className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                                <Check className="w-3 h-3" />
                                            </div>
                                            <span className="text-sm text-gray-600 font-medium">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => router.push('/contacto')}
                                    className={`w-full py-4 rounded-2xl font-bold transition-all ${tier.highlight
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25'
                                        : 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-100'
                                        }`}
                                >
                                    {tier.cta}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Info adicional */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                >
                    <div className="space-y-4 text-center lg:text-left">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto lg:mx-0">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-gray-900">Seguro y Encriptado</h4>
                        <p className="text-gray-500 text-sm">Protección de datos de nivel bancario en todos los planes.</p>
                    </div>
                    <div className="space-y-4 text-center lg:text-left">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto lg:mx-0">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-gray-900">Implementación Veloz</h4>
                        <p className="text-gray-500 text-sm">Configuración inicial en menos de 48 horas.</p>
                    </div>
                    <div className="space-y-4 text-center lg:text-left">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mx-auto lg:mx-0">
                            <Building className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-gray-900">Escalable</h4>
                        <p className="text-gray-500 text-sm">Tu plataforma crece conforme crece tu residencial.</p>
                    </div>
                    <div className="space-y-4 text-center lg:text-left">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto lg:mx-0">
                            <Star className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-gray-900">Soporte Humano</h4>
                        <p className="text-gray-500 text-sm">Agentes reales listos para ayudarte en cualquier momento.</p>
                    </div>
                </motion.div>
            </div>

            <Footer />
        </div>
    );
}
