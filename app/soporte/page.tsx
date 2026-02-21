'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, HelpCircle, BookOpen, MessageCircle, FileQuestion, LifeBuoy, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/landing-new/Navbar';
import Footer from '@/components/landing-new/Footer';

export default function SupportPage() {
    const router = useRouter();

    const supportChannels = [
        {
            icon: BookOpen,
            title: 'Centro de Ayuda',
            desc: 'Tutoriales paso a paso y guías detalladas para usar Zentry.',
            linkText: 'Ir a documentación',
            href: '/documentacion'
        },
        {
            icon: HelpCircle,
            title: 'Preguntas Frecuentes',
            desc: 'Respuestas rápidas a las dudas comunes sobre la plataforma.',
            linkText: 'Ver FAQ',
            href: '/#faq'
        },
        {
            icon: MessageCircle,
            title: 'Chat de Soporte',
            desc: 'Habla con nuestro asistente inteligente o un agente en vivo.',
            linkText: 'Abrir Chat',
            href: '/'
        },
    ];

    const commonIssues = [
        '¿Cómo recuperar mi contraseña?',
        'Problemas con el código QR de acceso',
        'Configuración de notificaciones',
        'Reporte de fallas en áreas comunes',
        'Registro de nuevos residentes',
        'Validación de comprobantes de pago'
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] selection:bg-blue-100">
            <Navbar forceScrolled={true} />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[120px] mix-blend-multiply" />
                    <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-[120px] mix-blend-multiply" />
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
                        <div className="inline-flex items-center space-x-3 mb-6 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                            <LifeBuoy className="w-5 h-5 text-blue-600 animate-spin-slow" />
                            <span className="text-blue-600 text-sm font-bold tracking-tight">Centro de Soporte Zentry</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight mb-6">
                            ¿Cómo podemos <span className="text-blue-600">ayudarte?</span>
                        </h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                            Resuelve tus dudas, reporta problemas técnicos o aprende a sacar el máximo provecho de tu plataforma.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                <div className="space-y-16">

                    {/* Canales de Soporte */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {supportChannels.map((channel, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white/40 backdrop-blur-md border border-white rounded-[32px] p-10 shadow-sm hover:shadow-xl hover:translate-y-[-8px] transition-all flex flex-col items-center text-center group"
                            >
                                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform shadow-lg shadow-blue-200">
                                    <channel.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">{channel.title}</h3>
                                <p className="text-gray-500 leading-relaxed mb-8 flex-grow">{channel.desc}</p>
                                <button
                                    onClick={() => router.push(channel.href)}
                                    className="w-full py-4 bg-gray-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded-xl font-bold transition-all border border-blue-100/50 flex items-center justify-center space-x-2"
                                >
                                    <span>{channel.linkText}</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}
                    </div>

                    {/* Dudas Frecuentes */}
                    <div className="bg-white/40 backdrop-blur-md border border-white rounded-[40px] p-8 md:p-16 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-12 items-center">
                            <div className="flex-1 space-y-6">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                    <FileQuestion className="w-6 h-6" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">Temas más buscados</h2>
                                <p className="text-gray-500 text-lg">
                                    ¿No tienes tiempo? Estos son los temas que otros residentes y administradores consultan con más frecuencia.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {commonIssues.map((issue, i) => (
                                        <div key={i} className="flex items-center space-x-3 p-4 bg-white/60 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all cursor-pointer group">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-150 transition-transform" />
                                            <span className="text-sm font-medium text-gray-700">{issue}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="relative p-1 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-[44px]">
                                    <div className="bg-gray-900 rounded-[40px] p-8 md:p-12 text-white space-y-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                                        <ShieldCheck className="w-12 h-12 text-blue-400" />
                                        <h3 className="text-3xl font-bold leading-tight">¿Tienes una falla crítica?</h3>
                                        <p className="text-gray-400 leading-relaxed">
                                            Si tu problema afecta la seguridad o el acceso principal de tu residencial, nuestro equipo de guardia está disponible las 24 horas del día.
                                        </p>
                                        <button
                                            onClick={() => router.push('/contacto')}
                                            className="inline-flex items-center space-x-3 text-blue-400 font-bold hover:text-white transition-colors group"
                                        >
                                            <Mail className="w-5 h-5" />
                                            <span>Contactar Soporte Urgente</span>
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tips de Seguridad */}
                    <div className="text-center space-y-8 py-8">
                        <h2 className="text-2xl font-bold text-gray-900">Tu seguridad es nuestra prioridad</h2>
                        <div className="max-w-4xl mx-auto p-8 rounded-[32px] bg-blue-50/50 border border-blue-100 flex flex-col md:flex-row items-center gap-6">
                            <ShieldCheck className="w-12 h-12 text-blue-600 shrink-0" />
                            <p className="text-blue-900 font-medium text-left leading-relaxed">
                                Recuerda que Zentry nunca te pedirá contraseñas, datos bancarios o información confidencial por correo o chat. Siempre verifica que estés interactuando con nuestros canales oficiales.
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            <Footer />
        </div>
    );
}
