'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Cookie,
    ShieldCheck,
    Settings,
    Eye,
    Lock,
    FileText,
    Gavel,
    Info,
    ExternalLink,
    ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '../../src/components/landing-new/Navbar';
import Footer from '../../src/components/landing-new/Footer';

const sections = [
    { id: 'que-son', title: '1. ¿Qué son las cookies?', icon: Info },
    { id: 'tipos', title: '2. Tipos de cookies', icon: Cookie },
    { id: 'finalidad', title: '3. Finalidad', icon: Eye },
    { id: 'gestion', title: '4. Gestión de cookies', icon: Settings },
    { id: 'cumplimiento', title: '5. Cumplimiento Legal', icon: Gavel },
    { id: 'derechos', title: '6. Derechos del Usuario', icon: ShieldCheck },
    { id: 'actualizaciones', title: '7. Actualizaciones', icon: FileText },
];

export default function CookiesCompliancePage() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState('que-son');

    useEffect(() => {
        const handleScroll = () => {
            const sectionElements = sections.map(s => document.getElementById(s.id));
            const scrollPosition = window.scrollY + 200;

            for (let i = sectionElements.length - 1; i >= 0; i--) {
                const element = sectionElements[i];
                if (element && element.offsetTop <= scrollPosition) {
                    setActiveSection(sections[i].id);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            window.scrollTo({
                top: element.offsetTop - 120,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] selection:bg-blue-100">
            <Navbar forceScrolled={true} />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] mix-blend-multiply animate-pulse" />
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[120px] mix-blend-multiply animate-pulse delay-700" />
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
                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 tracking-tight mb-6 text-balance">
                            Cookies y <span className="text-blue-600">Cumplimiento</span>
                        </h1>
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                            Transparencia en el manejo de tu información y cumplimiento con los estándares de privacidad más exigentes.<br />
                            <span className="text-gray-400 text-sm">Última actualización: 5 de febrero de 2026</span>
                        </p>
                    </motion.div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                <div className="flex flex-col lg:flex-row gap-16">
                    {/* Sidebar Navigation */}
                    <div className="hidden lg:block w-72 shrink-0">
                        <div className="sticky top-28 space-y-1 pr-8 border-r border-gray-200/50">
                            <p className="text-[10px] font-extrabold text-blue-600/40 tracking-[0.3em] uppercase mb-8 ml-2">NAVEGACIÓN</p>
                            {sections.map((section) => {
                                const Icon = section.icon;
                                const isActive = activeSection === section.id;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className={`w-full flex items-center group relative py-3 pl-3 pr-4 rounded-xl transition-all duration-300 ${isActive
                                            ? 'text-blue-600 bg-blue-50/80 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.1)]'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                                            }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeIndicatorCookies"
                                                layout="position"
                                                className="absolute left-0 w-1 bg-blue-600 rounded-full h-5"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}

                                        <div className={`p-2 rounded-lg mr-4 transition-all duration-300 ${isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                            : 'bg-white border border-gray-100 group-hover:border-gray-300 text-gray-400 group-hover:text-gray-600 shadow-sm'
                                            }`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className={`truncate text-[13px] font-semibold transition-colors ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>
                                            {section.title}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Content */}
                    <main className="flex-1 max-w-3xl">
                        <div className="bg-white/40 backdrop-blur-md border border-white rounded-[32px] p-8 md:p-12 shadow-sm space-y-20">

                            <section id="que-son" className="space-y-6">
                                <div className="w-12 h-12 bg-blue-100/50 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
                                    <Cookie className="w-6 h-6" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900">1. ¿Qué son las cookies?</h2>
                                <p className="text-xl text-gray-600 leading-relaxed font-medium">
                                    Las cookies son pequeños archivos de texto que se almacenan en su navegador cuando visita nuestra plataforma.
                                </p>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    Estos archivos permiten que el sitio web "recuerde" información sobre su visita, como su idioma preferido y otras opciones, lo que puede facilitar su próxima visita y hacer que el sitio le resulte más útil.
                                </p>
                            </section>

                            <section id="tipos" className="space-y-12">
                                <h2 className="text-3xl font-bold text-gray-900">2. Tipos de cookies que utilizamos</h2>

                                <div className="grid gap-6">
                                    <div className="p-8 bg-blue-50/50 rounded-3xl border border-blue-100/30">
                                        <div className="flex items-center gap-4 mb-4">
                                            <Lock className="w-6 h-6 text-blue-600" />
                                            <h3 className="text-xl font-bold text-blue-900">Cookies Técnicas (Necesarias)</h3>
                                        </div>
                                        <p className="text-blue-800/80 leading-relaxed">
                                            Son fundamentales para el funcionamiento de la aplicación. Permiten la navegación, el control de tráfico y la comunicación de datos, el inicio de sesión y el acceso a áreas restringidas de seguridad.
                                        </p>
                                    </div>

                                    <div className="p-8 bg-purple-50/50 rounded-3xl border border-purple-100/30">
                                        <div className="flex items-center gap-4 mb-4">
                                            <Settings className="w-6 h-6 text-purple-600" />
                                            <h3 className="text-xl font-bold text-purple-900">Cookies de Preferencia</h3>
                                        </div>
                                        <p className="text-purple-800/80 leading-relaxed">
                                            Permiten recordar información para que el usuario acceda al servicio con determinadas características que pueden diferenciar su experiencia de la de otros usuarios (ej. el idioma).
                                        </p>
                                    </div>

                                    <div className="p-8 bg-amber-50/50 rounded-3xl border border-amber-100/30">
                                        <div className="flex items-center gap-4 mb-4">
                                            <Eye className="w-6 h-6 text-amber-600" />
                                            <h3 className="text-xl font-bold text-amber-900">Cookies de Análisis</h3>
                                        </div>
                                        <p className="text-amber-800/80 leading-relaxed">
                                            Utilizamos herramientas como Google Analytics para cuantificar el número de usuarios y realizar la medición y análisis estadístico de la utilización que hacen de Zentry.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section id="finalidad" className="space-y-6">
                                <h2 className="text-3xl font-bold text-gray-900">3. Finalidad del uso de cookies</h2>
                                <div className="bg-gray-50/50 rounded-[32px] p-8 border border-gray-100 space-y-4">
                                    <ul className="grid grid-cols-1 gap-4">
                                        {[
                                            'Autenticación de sesiones de usuario.',
                                            'Seguridad en la generación de códigos QR de acceso.',
                                            'Mejora de la velocidad de carga de la plataforma.',
                                            'Personalización de la interfaz según el residencial.',
                                            'Análisis anónimo de errores para soporte técnico.'
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-gray-700">
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                                                <span className="text-lg">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </section>

                            <section id="gestion" className="space-y-8">
                                <h2 className="text-3xl font-bold text-gray-900">4. Cómo gestionar las cookies</h2>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    Usted tiene la posibilidad de configurar su navegador para ser avisado en pantalla de la recepción de cookies y para impedir la instalación de cookies en su disco duro.
                                </p>
                                <div className="p-8 bg-gray-900 rounded-[32px] text-white space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-blue-400" />
                                        Configuración por Navegador
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {['Google Chrome', 'Firefox', 'Safari (Mac/iOS)', 'Microsoft Edge'].map((nav) => (
                                            <div key={nav} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors pointer-cursor">
                                                <span className="font-medium">{nav}</span>
                                                <ExternalLink className="w-4 h-4 opacity-40" />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-sm text-gray-400 italic">
                                        Nota: La desactivación de cookies técnicas puede limitar el funcionamiento de algunas características esenciales de Zentry.
                                    </p>
                                </div>
                            </section>

                            <section id="cumplimiento" className="space-y-12">
                                <h2 className="text-3xl font-bold text-gray-900">5. Cumplimiento Legal</h2>
                                <div className="p-8 bg-white border border-gray-100 rounded-[32px] shadow-sm space-y-8">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-green-50 rounded-2xl">
                                            <ShieldCheck className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Protección de Datos (LFPDPPP)</h3>
                                            <p className="text-gray-600 leading-relaxed">
                                                En cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, Zentry garantiza que el uso de cookies no compromete su privacidad ni seguridad de datos sensibles sin su consentimiento explícito.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-indigo-50 rounded-2xl">
                                            <Gavel className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">Estándares Internacionales</h3>
                                            <p className="text-gray-600 leading-relaxed">
                                                Seguimos las mejores prácticas dictadas por el GDPR y otras normativas internacionales para asegurar que la gestión de información sea transparente y auditable.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section id="derechos" className="space-y-6 text-center md:text-left">
                                <h2 className="text-3xl font-bold text-gray-900">6. Derechos del Usuario</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { title: 'Derecho de Acceso', desc: 'Saber qué datos se están recabando.' },
                                        { title: 'Derecho de Rectificación', desc: 'Corregir información inexacta.' },
                                        { title: 'Derecho de Oposición', desc: 'Negarse al uso de cookies no esenciales.' }
                                    ].map((derecho, i) => (
                                        <div key={i} className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                                            <h4 className="font-bold text-blue-600 mb-2">{derecho.title}</h4>
                                            <p className="text-sm text-gray-500">{derecho.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section id="actualizaciones" className="pt-20 border-t border-gray-100">
                                <div className="flex flex-col md:flex-row items-center gap-8 bg-blue-50/50 p-8 rounded-[32px] border border-blue-100/50">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm">
                                        <FileText className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-2">7. Cambios en la Política</h2>
                                        <p className="text-gray-600 leading-relaxed">
                                            Podemos actualizar esta Política de Cookies y Cumplimiento ocasionalmente para reflejar cambios en la tecnología o requisitos legales. Le recomendamos revisar esta página periódicamente.
                                        </p>
                                    </div>
                                </div>
                            </section>

                        </div>
                    </main>
                </div>
            </div>

            <Footer />
        </div>
    );
}
