'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, MapPin, Send, Globe, MessageSquare, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/landing-new/Navbar';
import Footer from '@/components/landing-new/Footer';
import { toast } from 'sonner';

export default function ContactPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simular envío
        setTimeout(() => {
            setIsSubmitting(false);
            toast.success('Mensaje enviado correctamente. Nos pondremos en contacto pronto.');
        }, 1500);
    };

    const contactInfo = [
        { icon: Mail, title: 'Correo Electrónico', value: 'zentry.app.mx@gmail.com', sub: 'Soporte y ventas 24/7' },
        { icon: Phone, title: 'Teléfono', value: '+52 (686) 110-6270', sub: 'Lun-Vie: 9am - 6pm' },
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] selection:bg-blue-100">
            <Navbar forceScrolled={true} />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse" />
                    <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-400/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse delay-700" />
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
                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight mb-6">
                            Hablemos <span className="text-blue-600">Zentry</span>
                        </h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                            ¿Tienes dudas, sugerencias o quieres implementar Zentry en tu residencial? Estamos aquí para escucharte y ayudarte.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Columna de Información */}
                    <div className="space-y-8 lg:mt-8">
                        <h2 className="text-3xl font-bold text-gray-900">Información de Contacto</h2>
                        <p className="text-gray-500 leading-relaxed">
                            Nuestro equipo está comprometido a brindarte la mejor atención. Elige el medio que prefieras.
                        </p>

                        <div className="space-y-6">
                            {contactInfo.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-start space-x-5 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                                        <p className="text-blue-600 font-medium text-sm md:text-base mb-1">{item.value}</p>
                                        <p className="text-gray-400 text-xs">{item.sub}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="p-8 bg-gray-900 rounded-[32px] text-white space-y-4">
                            <div className="flex items-center space-x-3 mb-2">
                                <Clock className="w-5 h-5 text-blue-400" />
                                <h3 className="font-bold">Horarios de Atención</h3>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li className="flex justify-between">
                                    <span>Lunes - Viernes</span>
                                    <span className="text-white font-medium">9:00 AM - 6:00 PM</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Sábados</span>
                                    <span className="text-white font-medium">10:00 AM - 2:00 PM</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Domíngos</span>
                                    <span className="text-blue-400 font-medium italic">Soporte Crítico 24/7</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Columna de Formulario */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white/40 backdrop-blur-md border border-white rounded-[40px] p-8 md:p-12 shadow-sm"
                        >
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Nombre Completo</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Ej. Juan Pérez"
                                            className="w-full bg-white border border-gray-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Correo Electrónico</label>
                                        <input
                                            required
                                            type="email"
                                            placeholder="ejemplo@email.com"
                                            className="w-full bg-white border border-gray-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Teléfono (opcional)</label>
                                        <input
                                            type="tel"
                                            placeholder="+52 (...) ..."
                                            className="w-full bg-white border border-gray-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Asunto</label>
                                        <select
                                            className="w-full bg-white border border-gray-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm appearance-none"
                                        >
                                            <option>Informes para mi residencial</option>
                                            <option>Soporte técnico</option>
                                            <option>Alianzas comerciales</option>
                                            <option>Otro</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Mensaje</label>
                                    <textarea
                                        required
                                        rows={6}
                                        placeholder="¿Cómo podemos ayudarte?"
                                        className="w-full bg-white border border-gray-100 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-sm resize-none"
                                    ></textarea>
                                </div>

                                <button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] py-5 font-bold transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-3 group disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>Enviar Mensaje</span>
                                            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>

                </div>
            </div>

            <Footer />
        </div>
    );
}
