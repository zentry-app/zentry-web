'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Code2, Terminal, Cpu, Database, Globe2, Layers, BookOpen, Copy, Check, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/landing-new/Navbar';
import Footer from '@/components/landing-new/Footer';

export default function DocumentationPage() {
    const router = useRouter();

    const sections = [
        { icon: Globe2, title: 'Introducción API', desc: 'Conceptos básicos, autenticación y manejo de peticiones REST.' },
        { icon: Database, title: 'Modelos de Datos', desc: 'Esquema de las base de datos para residentes, visitas y pagos.' },
        { icon: Cpu, title: 'Webhooks', desc: 'Configura eventos en tiempo real para integraciones de terceros.' },
        { icon: Terminal, title: 'SDKs & Librerías', desc: 'Implementaciones oficiales para JavaScript, Python y más.' }
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] selection:bg-blue-100">
            <Navbar forceScrolled={true} />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px] mix-blend-multiply" />
                    <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[120px] mix-blend-multiply" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center"
                    >
                        <button
                            onClick={() => router.push('/ayuda')}
                            className="inline-flex items-center space-x-2 text-blue-600 font-medium mb-8 hover:translate-x-[-4px] transition-transform group"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Volver a Ayuda</span>
                        </button>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-6 border border-blue-100">
                            <Code2 className="w-4 h-4" />
                            <span>Developer Central</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight mb-6">
                            Documentación <span className="text-blue-600">Técnica</span>
                        </h1>
                        <p className="text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
                            Guías completas, referencias de API y recursos para desarrolladores que buscan integrar o extender Zentry.
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                <div className="flex flex-col lg:flex-row gap-16">

                    {/* Sidebar */}
                    <aside className="lg:w-64 shrink-0 space-y-12">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] ml-2">EMPEZANDO</h3>
                            <ul className="space-y-1">
                                {['Instalación', 'Autenticación', 'Endpoints Globales', 'Códigos de Error'].map((item, i) => (
                                    <li key={i}>
                                        <button className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${i === 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-100/50 hover:text-gray-900'}`}>
                                            {item}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] ml-2">RECURSOS</h3>
                            <ul className="space-y-1">
                                {['SDK JavaScript', 'Plantillas Postman', 'Changelog de API'].map((item, i) => (
                                    <li key={i}>
                                        <button className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100/50 hover:text-gray-900 transition-all flex justify-between items-center group">
                                            <span>{item}</span>
                                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>

                    {/* Content Area */}
                    <main className="flex-1 space-y-20">
                        <div className="bg-white/60 backdrop-blur-md border border-white rounded-[40px] p-8 md:p-16 shadow-sm space-y-12">
                            <section className="space-y-6">
                                <h2 className="text-4xl font-bold text-gray-900">Autenticación</h2>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    Zentry utiliza un esquema de autenticación basado en Bearer Tokens generados mediante OAuth 2.0. Todas las peticiones a la API deben realizarse sobre HTTPS.
                                </p>

                                <div className="bg-gray-900 rounded-3xl p-6 md:p-8 space-y-4 shadow-2xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex space-x-2">
                                            <div className="w-3 h-3 rounded-full bg-red-400" />
                                            <div className="w-3 h-3 rounded-full bg-amber-400" />
                                            <div className="w-3 h-3 rounded-full bg-green-400" />
                                        </div>
                                        <button className="text-gray-400 hover:text-white transition-colors">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <pre className="text-blue-400 font-mono text-sm overflow-x-auto">
                                        <code>{`curl -X GET "https://api.zentry.mx/v1/residencial" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</code>
                                    </pre>
                                </div>
                            </section>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {sections.map((sec, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 hover:border-blue-200 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <sec.icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{sec.title}</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">{sec.desc}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Botones de acción */}
                            <div className="pt-12 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                                        <Check className="w-5 h-5" />
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium">Última actualización: Hace 2 días</p>
                                </div>
                                <div className="flex gap-4">
                                    <button className="flex items-center space-x-2 px-6 py-3 bg-gray-50 rounded-xl text-gray-700 font-bold text-sm hover:bg-gray-100 transition-all">
                                        <span>Exportar PDF</span>
                                    </button>
                                    <button className="flex items-center space-x-2 px-6 py-3 bg-blue-600 rounded-xl text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                                        <span>Generar API Key</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Comunidad / Soporte */}
                        <div className="bg-indigo-600 rounded-[40px] p-8 md:p-16 text-white text-center space-y-8 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                            <Layers className="w-16 h-16 text-indigo-100 mx-auto" />
                            <h2 className="text-3xl md:text-5xl font-bold">¿Necesitas una integración personalizada?</h2>
                            <p className="text-indigo-100 max-w-2xl mx-auto text-lg leading-relaxed">
                                Nuestro equipo de ingeniería puede ayudarte a construir flujos de trabajo personalizados o integrar Zentry con tus sistemas actuales.
                            </p>
                            <button
                                onClick={() => router.push('/contacto')}
                                className="px-10 py-5 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-2xl shadow-black/20"
                            >
                                Contactar a Ingeniería
                            </button>
                        </div>
                    </main>

                </div>
            </div>

            <Footer />
        </div>
    );
}
