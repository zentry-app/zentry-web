'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, HelpCircle, Book, MessageSquare, Phone, LifeBuoy, ArrowRight, UserPlus, Key, CreditCard, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/landing-new/Navbar';
import Footer from '@/components/landing-new/Footer';

export default function HelpCenterPage() {
    const router = useRouter();

    const categories = [
        { icon: UserPlus, title: 'Primeros Pasos', desc: 'Aprende a configurar tu cuenta y navegar por la plataforma.' },
        { icon: Key, title: 'Accesos y Seguridad', desc: 'Gestión de códigos QR, TAGs vehiculares y control de visitas.' },
        { icon: Bell, title: 'Notificaciones', desc: 'Configura cómo y cuándo recibir alertas en tu dispositivo.' },
        { icon: CreditCard, title: 'Pagos y Finanzas', desc: 'Información sobre cuotas, estados de cuenta y comprobantes.' }
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] selection:bg-blue-100">
            <Navbar forceScrolled={true} />

            {/* Hero Section */}
            <section className="relative pt-32 pb-32 overflow-hidden bg-white">
                <div className="absolute inset-0 z-0">
                    <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[100px]" />
                    <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[100px]" />
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
                            <span>Volver a la plataforma</span>
                        </button>
                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight mb-12">
                            Centro de <span className="text-blue-600">Ayuda</span>
                        </h1>

                        {/* Buscador Premium */}
                        <div className="max-w-3xl mx-auto relative group">
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-[32px] opacity-20 blur-xl group-focus-within:opacity-40 transition-opacity" />
                            <div className="relative flex items-center bg-white border border-gray-100 rounded-[28px] p-2 shadow-sm focus-within:shadow-xl focus-within:border-blue-200 transition-all">
                                <div className="pl-6 pr-4">
                                    <Search className="w-6 h-6 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Busca respuestas, guías o solución a problemas..."
                                    className="w-full py-4 text-lg focus:outline-none text-gray-700 bg-transparent"
                                />
                                <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all mr-1 shadow-lg shadow-blue-600/20">
                                    Buscar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 -mt-16 relative z-20">
                    {categories.map((cat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + idx * 0.1 }}
                            className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-gray-200/50 hover:translate-y-[-8px] hover:shadow-blue-500/10 transition-all cursor-pointer group"
                        >
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <cat.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{cat.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{cat.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Sección de Recursos Populares */}
                <div className="mt-32 grid grid-cols-1 lg:grid-cols-3 gap-16">
                    <div className="lg:col-span-2 space-y-12">
                        <h2 className="text-3xl font-bold text-gray-900">Artículos Destacados</h2>
                        <div className="space-y-6">
                            {[
                                { title: '¿Cómo dar de alta un nuevo residente?', cat: 'Administración' },
                                { title: 'Solución a problemas frecuentes con el código QR', cat: 'Accesos' },
                                { title: 'Configurando el botón de pánico en iOS/Android', cat: 'Seguridad' },
                                { title: 'Guía rápida para administradores de residenciales', cat: 'General' },
                                { title: 'Cómo exportar reportes de acceso a Excel', cat: 'Operación' }
                            ].map((article, i) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 transition-all cursor-pointer group">
                                    <div className="flex items-center space-x-6">
                                        <div className="text-4xl font-black text-gray-50 opacity-100 group-hover:text-blue-50 transition-colors">0{i + 1}</div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{article.title}</h4>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{article.cat}</span>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-gray-900 rounded-[40px] p-10 text-white space-y-8">
                            <LifeBuoy className="w-12 h-12 text-blue-400 animate-spin-slow" />
                            <h3 className="text-3xl font-bold leading-tight">¿No encuentras lo que buscas?</h3>
                            <p className="text-gray-400">Nuestro equipo de soporte humano está listo para ayudarte con cualquier duda técnica o administrativa.</p>
                            <div className="space-y-4 pt-4">
                                <button className="w-full py-4 bg-blue-600 rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center space-x-2">
                                    <MessageSquare className="w-5 h-5" />
                                    <span>Chat en vivo</span>
                                </button>
                                <button className="w-full py-4 bg-white/10 rounded-2xl font-bold hover:bg-white/20 transition-all flex items-center justify-center space-x-2 border border-white/10">
                                    <Phone className="w-5 h-5" />
                                    <span>Llamar a soporte</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-8 bg-blue-50 rounded-[32px] border border-blue-100 text-center space-y-4">
                            <Book className="w-8 h-8 text-blue-600 mx-auto" />
                            <h4 className="font-bold text-blue-900">Documentación Técnica</h4>
                            <p className="text-xs text-blue-800/60 leading-relaxed">Consulta nuestra documentación técnica para integraciones API y configuraciones avanzadas de hardware.</p>
                            <button
                                onClick={() => router.push('/documentacion')}
                                className="text-blue-600 font-bold text-sm hover:underline"
                            >
                                Ver documentación →
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
