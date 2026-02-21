"use client";

import Navbar from "@/components/landing-new/Navbar";
import Footer from "@/components/landing-new/Footer";
import ConstructorasHero from "@/components/landing-new/ConstructorasHero";
import ConstructorasBenefits from "@/components/landing-new/ConstructorasBenefits";
import Image from "next/image";
import { motion } from "framer-motion";

export default function ConstructorasPage() {
    return (
        <div className="relative min-h-screen font-sans">
            <Navbar forceScrolled={true} />

            <main>
                <ConstructorasHero />

                <ConstructorasBenefits />

                {/* Sección de Seguridad/Tecnología Visual */}
                <section className="py-24 bg-white relative overflow-hidden">
                    <div className="container mx-auto px-4 max-w-6xl">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div className="order-2 md:order-1 relative">
                                <div className="absolute inset-0 bg-blue-100/50 rounded-full blur-3xl transform -translate-x-10 translate-y-10" />
                                <Image
                                    src="/assets/LoginBG.png"
                                    alt="Zentry App Control"
                                    width={600}
                                    height={600}
                                    className="relative z-10 w-full drop-shadow-2xl transform hover:scale-[1.02] transition-transform duration-500 rounded-2xl"
                                />
                            </div>
                            <div className="order-1 md:order-2">
                                <span className="text-blue-600 font-bold uppercase tracking-wider text-sm mb-4 block">Seguridad Total</span>
                                <h2 className="text-4xl font-heading font-bold text-slate-900 mb-6">
                                    El argumento de venta que faltaba
                                </h2>
                                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                    Tus clientes buscan seguridad y modernidad. Al entregar con Zentry, les das el control total de sus visitas, pagos y áreas comunes desde una sola app.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        "Accesos con código QR para visitas",
                                        "Reservas de amenidades en tiempo real",
                                        "Chat directo con caseta/administración",
                                        "Reportes de incidencias con foto"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                            <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action Final */}
                <section id="contacto" className="py-24 bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] opacity-5" />
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-900/20 to-transparent" />

                    <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
                        <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
                            ¿Listo para cerrar el trato?
                        </h2>
                        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                            Aprovecha el precio de apertura de <span className="text-white font-bold">$13 MXN por casa</span> y equipa tus desarrollos con la mejor tecnología.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="https://wa.me/526861106270?text=Hola,%20me%20interesa%20la%20oferta%20para%20constructoras%20de%20$13%20MXN%20por%20casa."
                                target="_blank"
                                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/20"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                </svg>
                                WhatsApp Directo
                            </a>
                            <a
                                href="/contacto"
                                className="bg-transparent border border-white/20 text-white hover:bg-white/10 px-8 py-4 rounded-xl font-semibold text-lg transition-colors text-center"
                            >
                                Más Información
                            </a>
                        </div>
                        <p className="mt-8 text-sm text-slate-500">
                            *Oferta válida por tiempo limitado. Sujeto a términos y condiciones.
                        </p>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
