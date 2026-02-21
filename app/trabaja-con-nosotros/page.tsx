'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Rocket, Heart, Code, Briefcase, Globe, Star, Sparkles, ArrowRight, Zap, Coffee } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/landing-new/Navbar';
import Footer from '@/components/landing-new/Footer';

export default function CareersPage() {
    const router = useRouter();

    const benefits = [
        { icon: Globe, title: 'Trabajo Remoto', desc: 'Flexibilidad total para trabajar desde donde seas más productivo.' },
        { icon: Zap, title: 'Impacto Real', desc: 'Tu código y tus ideas transformarán la vida de miles de familias.' },
        { icon: Coffee, title: 'Cultura Zentry', desc: 'Ambiente dinámico, colaborativo y enfocado en el crecimiento personal.' },
        { icon: Heart, title: 'Salud y Bienestar', desc: 'Planes de salud competitivos y enfoque en el balance vida-trabajo.' },
    ];

    const positions = [
        { title: 'Senior Full Stack Engineer', dept: 'Ingeniería', type: 'Remoto' },
        { title: 'Product UI/UX Designer', dept: 'Producto', type: 'Remoto' },
        { title: 'Customer Success Manager', dept: 'Operaciones', type: 'Híbrido (Mexicali)' },
        { title: 'Business Development Representative', dept: 'Ventas', type: 'Remoto' },
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] selection:bg-blue-100">
            <Navbar forceScrolled={true} />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[150px] mix-blend-multiply" />
                    <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[150px] mix-blend-multiply" />
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
                            <span>Crecimiento Exponencial</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight mb-6">
                            Sé parte del <span className="text-blue-600">Futuro</span>
                        </h1>
                        <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
                            En Zentry no solo construimos software, construimos comunidades más seguras y felices. Únete a nuestro equipo de visionarios.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                <div className="space-y-24">

                    {/* Nuestra Cultura */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <h2 className="text-4xl font-bold text-gray-900 leading-tight">¿Por qué <br /><span className="text-blue-600">Trabajar en Zentry?</span></h2>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Somos una startup mexicana con ambición global. Valoramos la curiosidad, la proactividad y el deseo de crear algo que realmente importe. En Zentry, tú tienes el control de tu carrera.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {benefits.map((benefit, idx) => (
                                    <div key={idx} className="space-y-3">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                            <benefit.icon className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-bold text-gray-900">{benefit.title}</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">{benefit.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="relative p-8 md:p-12 bg-gray-900 rounded-[40px] text-white overflow-hidden shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 p-8">
                                <Star className="w-12 h-12 text-blue-400 rotate-12" />
                            </div>
                            <div className="relative z-10 space-y-8">
                                <Rocket className="w-12 h-12 text-blue-500" />
                                <h3 className="text-3xl font-bold">Nuestra Mentalidad</h3>
                                <ul className="space-y-6">
                                    <li className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">1</div>
                                        <p className="text-gray-300"><span className="text-white font-bold">Resuelve con ingenio:</span> No buscamos soluciones fáciles, buscamos soluciones brillantes.</p>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">2</div>
                                        <p className="text-gray-300"><span className="text-white font-bold">Obsesión por el usuario:</span> Cada línea de código debe mejorar la vida de un residente.</p>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">3</div>
                                        <p className="text-gray-300"><span className="text-white font-bold">Aprende y comparte:</span> Compartimos el conocimiento para que todos crezcamos juntos.</p>
                                    </li>
                                </ul>
                            </div>
                        </motion.div>
                    </div>

                    {/* Vacantes Disponibles */}
                    <div className="space-y-12">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                            <div className="space-y-4">
                                <h2 className="text-4xl font-bold text-gray-900">Vacantes Disponibles</h2>
                                <p className="text-gray-500 text-lg">¿No ves tu puesto ideal? Envíanos tu CV de todas formas.</p>
                            </div>
                            <div className="px-6 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm font-bold text-blue-600 flex items-center space-x-2">
                                <Briefcase className="w-4 h-4" />
                                <span>4 Posiciones Abiertas</span>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {positions.map((pos, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white/60 backdrop-blur-md border border-gray-100 rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row justify-between items-center group hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
                                >
                                    <div className="flex items-center space-x-6 w-full md:w-auto mb-4 md:mb-0">
                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <Code className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{pos.title}</h3>
                                            <div className="flex items-center space-x-4 mt-1">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{pos.dept}</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                <span className="text-xs font-bold text-blue-600/60 uppercase tracking-widest">{pos.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="w-full md:w-auto px-8 py-4 bg-gray-50 group-hover:bg-blue-600 group-hover:text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center space-x-2">
                                        <span>Ver Detalles</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Candidatura Espontánea */}
                    <div className="relative group overflow-hidden rounded-[40px]">
                        <div className="absolute inset-0 bg-blue-600 transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none">
                            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                                <filter id="noise">
                                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                                </filter>
                                <rect width="100%" height="100%" filter="url(#noise)" />
                            </svg>
                        </div>

                        <div className="relative z-10 p-8 md:p-16 text-center text-white space-y-8">
                            <h2 className="text-3xl md:text-4xl font-bold">¿Tienes un talento único?</h2>
                            <p className="text-blue-100 max-w-2xl mx-auto text-lg leading-relaxed">
                                Estamos en constante búsqueda de mentes brillantes. Si no encontraste el puesto ideal pero crees que puedes aportar algo extraordinario a Zentry, ¡queremos conocerte!
                            </p>
                            <button
                                onClick={() => router.push('/contacto')}
                                className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-xl shadow-black/10"
                            >
                                Envíanos tu portafolio o CV
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            <Footer />
        </div>
    );
}
