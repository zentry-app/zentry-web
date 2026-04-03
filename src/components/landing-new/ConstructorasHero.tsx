"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Lazy load Three.js shader (~600KB)
const InteractiveNebulaShader = dynamic(
    () => import('../ui/InteractiveNebulaShader').then((m) => m.InteractiveNebulaShader),
    { ssr: false, loading: () => null }
);

const ConstructorasHero = () => {
    return (
        <section className="relative overflow-hidden flex items-center justify-center min-h-[90vh] pt-24 pb-12 md:pt-32 md:pb-16 text-white">
            {/* Background with Interactive Shader - Darker/Premium feel for construction */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[#0B1120]" />
                <InteractiveNebulaShader className="opacity-80" disableCenterDimming={true} />
                {/* Overlay para dar profundidad y contraste */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-blue-900/20 to-slate-900/50" />
            </div>

            <div className="relative z-10 flex items-center justify-center w-full px-4 sm:px-6">
                <div className="container mx-auto max-w-7xl">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">

                        {/* Texto */}
                        <div className="text-center lg:text-left space-y-8 flex flex-col items-center lg:items-start">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <span className="inline-block px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-sm font-semibold tracking-wide uppercase mb-6 backdrop-blur-sm">
                                    Oferta Exclusiva para Constructoras
                                </span>

                                <h1 className="font-heading font-bold leading-tight">
                                    <span className="text-4xl md:text-6xl block text-white mb-2">
                                        Dale un <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Plus Inteligente</span>
                                    </span>
                                    <span className="text-3xl md:text-5xl block text-slate-300 font-light">
                                        a tus nuevos desarrollos.
                                    </span>
                                </h1>
                            </motion.div>

                            <motion.div
                                className="space-y-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <div className="flex flex-col md:flex-row items-center lg:items-start gap-4">
                                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transform hover:scale-105 transition-transform duration-300">
                                        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Precio Especial</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-bold text-white">$13</span>
                                            <span className="text-xl text-slate-300">MXN</span>
                                        </div>
                                        <p className="text-slate-400 text-sm mt-1">por casa / mes</p>
                                    </div>

                                    <div className="flex flex-col justify-center h-full py-2">
                                        <p className="text-lg text-slate-200 max-w-md">
                                            Equipa tus residenciales con la plataforma especializada en administración y seguridad.
                                        </p>
                                        <p className="text-sm text-blue-300 mt-2 font-medium">
                                            *Facturado mensualmente desde la entrega
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                            >
                                <a
                                    href="https://wa.me/526861106270?text=Hola,%20me%20interesa%20la%20oferta%20para%20constructoras%20de%20$13%20MXN%20por%20casa."
                                    target="_blank"
                                    className="bg-white text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20 text-center"
                                >
                                    Activar Oferta
                                </a>
                                <a
                                    href="/contacto"
                                    className="bg-transparent border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-colors text-center"
                                >
                                    Contactar Ventas
                                </a>
                            </motion.div>
                        </div>

                        {/* Imagen / Visual */}
                        <div className="flex justify-center lg:justify-end relative">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="relative rounded-2xl overflow-hidden shadow-2xl"
                            >
                                {/* Abstract building/growth graphic could go here, for now reusing Hero with a twist */}
                                <div className="absolute inset-0 bg-gradient-radial from-blue-500/20 to-transparent blur-3xl scale-150" />
                                <Image
                                    src="/assets/GuardiaImg.webp"
                                    alt="Guardia de Seguridad Zentry"
                                    width={800}
                                    height={800}
                                    className="relative z-10 w-full max-w-[600px] object-cover hover:scale-105 transition-transform duration-700"
                                />

                                {/* Floating badges specifically for construction value props */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute top-6 right-6 bg-white/90 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl z-20 hidden sm:block"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-slate-900 font-bold">Mayor Plusvalía</p>
                                            <p className="text-xs text-slate-600">Garantizada desde preventa</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    animate={{ y: [0, 10, 0] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                    className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl z-20 hidden sm:block"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-slate-900 font-bold">Entrega y Listo</p>
                                            <p className="text-xs text-slate-600">Configuración inmediata</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-slate-50 to-transparent" />
        </section>
    );
};

export default ConstructorasHero;
