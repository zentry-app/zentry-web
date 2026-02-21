"use client";

import React from 'react';
import { motion } from 'framer-motion';

const features = [
    {
        title: "Plusvalía Inmediata",
        description: "Un desarrollo con tecnología de punta se vende mejor y más rápido. Zentry añade valor tangible a cada m².",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
        ),
        color: "bg-green-100 text-green-600",
    },
    {
        title: "Entrega 'Llave en Mano'",
        description: "Olvídate de problemas en la transición. Entregas el desarrollo con un sistema de administración ya funcionando.",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
        ),
        color: "bg-blue-100 text-blue-600",
    },
    {
        title: "Control Total de Accesos",
        description: "Seguridad desde el primer día. Controla quién entra y sale durante la etapa de venta y construcción final.",
        icon: (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        color: "bg-purple-100 text-purple-600",
    }
];

const ConstructorasBenefits = () => {
    return (
        <section className="py-24 bg-slate-50 relative overflow-hidden">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 mb-6">
                        Más que una app, una <span className="text-blue-600">Amenidad Premium</span>
                    </h2>
                    <p className="text-lg text-slate-600">
                        Zentry no es solo software, es un argumento de venta poderoso para tus clientes.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.2 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 border border-slate-100 group"
                        >
                            <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                            <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Simple Pricing Card Highlight */}
                <div className="mt-20 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden text-center max-w-4xl mx-auto">
                    <div className="absolute inset-0 bg-[url('/assets/pattern.png')] opacity-10" />
                    <div className="relative z-10">
                        <h3 className="text-3xl font-bold mb-4">Plan Constructoras: $13 MXN <span className="text-blue-200 text-xl font-normal">/ casa</span></h3>
                        <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                            Sin costos ocultos. Facturación mensual simple. Incluye soporte prioritario para la implementación.
                        </p>
                        <a href="#contacto" className="bg-white text-blue-700 font-bold py-3 px-8 rounded-full hover:bg-blue-50 transition-colors inline-block">
                            Lo quiero para mi desarrollo
                        </a>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default ConstructorasBenefits;
