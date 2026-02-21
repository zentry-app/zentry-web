'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Target, Eye, Shield, Rocket, Users, Award, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/landing-new/Navbar';
import Footer from '@/components/landing-new/Footer';

export default function AboutPage() {
    const router = useRouter();

    const milestones = [
        { year: '2023', title: 'Fundación', desc: 'Zentry nace con la visión de digitalizar la vida en comunidad.' },
        { year: '2024', title: 'Expansión', desc: 'Lanzamiento de nuestra plataforma v2 y llegada a más de 50 residenciales.' },
        { year: '2025', title: 'Innovación IA', desc: 'Integración de inteligencia artificial para una gestión predictiva y eficiente.' },
    ];

    const values = [
        { icon: Shield, title: 'Seguridad', desc: 'Protegemos lo que más importa con tecnología de punta.' },
        { icon: Zap, title: 'Eficiencia', desc: 'Optimizamos procesos para ahorrar tiempo a todos.' },
        { icon: Users, title: 'Comunidad', desc: 'Fomentamos la armonía y comunicación entre vecinos.' },
        { icon: Award, title: 'Transparencia', desc: 'Gestión clara y auditable para una confianza total.' },
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] selection:bg-blue-100">
            <Navbar forceScrolled={true} />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse" />
                    <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-indigo-400/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse delay-700" />
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
                            Acerca de <span className="text-blue-600">Zentry</span>
                        </h1>
                        <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
                            Estamos redefiniendo la forma en que las personas viven y se relacionan en sus comunidades residenciales a través de tecnología inteligente y humana.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                <div className="bg-white/40 backdrop-blur-md border border-white rounded-[40px] p-8 md:p-16 shadow-sm space-y-24">

                    {/* Misión y Visión */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                <Target className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">Nuestra Misión</h2>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Empoderar a los administradores y residentes con herramientas digitales que faciliten la gestión, aumenten la seguridad y mejoren la calidad de vida en cada comunidad residencial.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <Eye className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900">Nuestra Visión</h2>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Convertirnos en el estándar de oro para la administración inteligente de residenciales en Latinoamérica, creando espacios más seguros, conectados y felices para vivir.
                            </p>
                        </motion.div>
                    </div>

                    {/* Nuestros Valores */}
                    <div className="space-y-12">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl font-bold text-gray-900">Valores que nos Guían</h2>
                            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                                Nuestra cultura se basa en principios sólidos que reflejan nuestro compromiso con la excelencia y la comunidad.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {values.map((value, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-8 bg-white rounded-[32px] border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
                                >
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <value.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                                    <p className="text-gray-500 leading-relaxed text-sm">{value.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Historia / Milestone Timeline */}
                    <div className="space-y-12">
                        <h2 className="text-3xl font-bold text-gray-900 text-center">Nuestra Trayectoria</h2>
                        <div className="relative">
                            {/* Line */}
                            <div className="absolute left-8 md:left-1/2 h-full w-px bg-gray-200 -translate-x-1/2 hidden md:block" />

                            <div className="space-y-12">
                                {milestones.map((ms, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        className={`flex flex-col md:flex-row items-center gap-8 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                                    >
                                        <div className="flex-1 text-center md:text-left space-y-2">
                                            <div className={`text-6xl font-black ${idx % 2 === 0 ? 'md:text-left' : 'md:text-right'} text-gray-200`}>{ms.year}</div>
                                            <h3 className={`text-2xl font-bold text-gray-900 ${idx % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>{ms.title}</h3>
                                            <p className={`text-gray-500 max-w-sm mx-auto ${idx % 2 === 0 ? 'md:ml-0 md:mr-auto md:text-left' : 'md:mr-0 md:ml-auto md:text-right'}`}>{ms.desc}</p>
                                        </div>

                                        <div className="relative z-10 w-16 h-16 bg-blue-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white shrink-0">
                                            <Rocket className="w-6 h-6" />
                                        </div>

                                        <div className="flex-1 hidden md:block" />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Call to Action */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-gray-900 rounded-[40px] p-8 md:p-16 text-center text-white relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px]" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px]" />

                        <div className="relative z-10 space-y-8">
                            <h2 className="text-3xl md:text-5xl font-bold">Únete a la Revolución Residencial</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                                Descubre cómo Zentry puede transformar la vida en tu comunidad. Estamos listos para ayudarte a dar el siguiente paso.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={() => router.push('/contacto')}
                                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/25"
                                >
                                    Contáctanos hoy
                                </button>
                                <button
                                    onClick={() => router.push('/trabaja-con-nosotros')}
                                    className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold backdrop-blur-md transition-all border border-white/10"
                                >
                                    Ver vacantes
                                </button>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>

            <Footer />
        </div>
    );
}
