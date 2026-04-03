'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Server, HardDrive, Smartphone, FileCheck, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/landing-new/Navbar';
import Footer from '@/components/landing-new/Footer';

export default function SecurityPage() {
    const router = useRouter();

    const securityFeatures = [
        {
            icon: Lock,
            title: 'Encriptación de Datos',
            desc: 'Toda la información personal y bitácoras están protegidas con cifrado AES-256 de grado militar en reposo y tránsito.'
        },
        {
            icon: Server,
            title: 'Infraestructura Cloud',
            desc: 'Utilizamos Google Cloud para garantizar una disponibilidad del 99.9% y redundancia de datos a nivel global.'
        },
        {
            icon: EyeOff,
            title: 'Privacidad Total',
            desc: 'Control estricto de accesos. Solo el personal autorizado por el residencial puede consultar la información operativa.'
        },
        {
            icon: ShieldCheck,
            title: 'Validación de Acceso',
            desc: 'Códigos QR dinámicos y únicos que expiran automáticamente para prevenir el mal uso de accesos por visitantes.'
        },
        {
            icon: HardDrive,
            title: 'Backup Automático',
            desc: 'Copias de seguridad diarias y almacenamiento seguro de evidencias para garantizar la integridad histórica del residencial.'
        },
        {
            icon: Smartphone,
            title: 'Autenticación Segura',
            desc: 'Soporte para autenticación biométrica y verificación en dos pasos (2FA) para proteger la cuenta de cada residente.'
        }
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] selection:bg-blue-100">
            <Navbar forceScrolled={true} />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[120px] mix-blend-multiply" />
                    <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-[120px] mix-blend-multiply" />
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
                        <div className="inline-flex items-center space-x-2 mb-6 bg-green-50 px-4 py-2 rounded-full border border-green-100">
                            <ShieldCheck className="w-5 h-5 text-green-600" />
                            <span className="text-green-600 text-sm font-bold tracking-tight">Compromiso con tu Seguridad</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight mb-6">
                            Privacidad y <span className="text-blue-600">Protección</span>
                        </h1>
                        <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
                            En Zentry, la seguridad no es una característica opcional, es el cimiento de cada herramienta que construimos para tu comunidad.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                <div className="bg-white/40 backdrop-blur-md border border-white rounded-[40px] p-8 md:p-16 shadow-sm space-y-24">

                    {/* Grid de Características */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {securityFeatures.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05 }}
                                className="space-y-4"
                            >
                                <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200">
                                    <feature.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Sección de Cumplimiento */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center border-t border-gray-100 pt-24">
                        <div className="space-y-8">
                            <div className="inline-block p-4 bg-blue-50 rounded-2xl">
                                <FileCheck className="w-10 h-10 text-blue-600" />
                            </div>
                            <h2 className="text-4xl font-bold text-gray-900 leading-tight">Cumplimiento Legal y Normativo</h2>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Operamos bajo estricto cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP). Tus datos son tuyos, y nosotros somos sus custodios responsables.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <div className="px-6 py-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-100">
                                    GDPR Ready
                                </div>
                                <div className="px-6 py-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-100">
                                    LFPDPPP Compliant
                                </div>
                                <div className="px-6 py-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-widest border border-gray-100">
                                    ISO 27001 Allied
                                </div>
                            </div>
                        </div>

                        <div className="p-8 md:p-12 bg-blue-600 rounded-[40px] text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                            <div className="relative z-10 space-y-6">
                                <ShieldAlert className="w-14 h-14 text-blue-100" />
                                <h3 className="text-3xl font-bold">Respuesta a Incidentes</h3>
                                <p className="text-blue-50 opacity-90 leading-relaxed">
                                    Contamos con un equipo de respuesta 24/7 dedicado exclusivamente a monitorear la integridad de la plataforma y prevenir cualquier intento de acceso no autorizado.
                                </p>
                                <div className="pt-4 border-t border-white/20">
                                    <p className="text-sm font-medium">Tiempo de respuesta ante alertas críticas:</p>
                                    <p className="text-2xl font-black mt-1">&lt; 15 Minutos</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Botón de Ayuda Profesional */}
                    <div className="text-center pt-12">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">¿Tienes dudas técnicas sobre nuestra seguridad?</h3>
                        <button
                            onClick={() => router.push('/contacto')}
                            className="px-10 py-5 bg-gray-900 text-white rounded-3xl font-bold hover:bg-black transition-all shadow-xl"
                        >
                            Hablar con nuestro equipo de TI
                        </button>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
