'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, Shield, Users, FileText, CreditCard, Bell, LogOut, HelpCircle, HardDrive, AlertTriangle, RefreshCcw, Clock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/landing-new/Navbar';
import Footer from '@/components/landing-new/Footer';

const sections = [
  { id: 'que-es', title: '1. ¿Qué es Zentry?', icon: Globe },
  { id: 'bienvenido', title: '2. Bienvenido', icon: Shield },
  { id: 'funciones', title: '3. Funciones Residentes', icon: Users },
  { id: 'registro', title: '4. Registro y Cuentas', icon: FileText },
  { id: 'uso-adecuado', title: '5. Uso Adecuado', icon: Shield },
  { id: 'pagos', title: '6. Pagos y Comprobantes', icon: CreditCard },
  { id: 'reservas', title: '7. Reservas', icon: Users },
  { id: 'emergencias', title: '8. Emergencias', icon: AlertTriangle },
  { id: 'notificaciones', title: '9. Notificaciones', icon: Bell },
  { id: 'cancelacion', title: '10. Cancelación', icon: LogOut },
  { id: 'soporte', title: '11. Soporte', icon: HelpCircle },
  { id: 'propiedad', title: '12. Propiedad Intelectual', icon: HardDrive },
  { id: 'naturaleza', title: '13. Naturaleza del Servicio', icon: Shield },
  { id: 'limitacion', title: '14. Limitación Responsabilidad', icon: AlertTriangle },
  { id: 'transferencia', title: '15. Transferencia Cuenta', icon: RefreshCcw },
  { id: 'actualizaciones', title: '16. Actualizaciones', icon: RefreshCcw },
  { id: 'mantenimiento', title: '17. Mantenimiento', icon: Clock },
  { id: 'cambios', title: '18. Cambios Términos', icon: FileText },
];

export default function TermsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('que-es');

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
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse" />
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse delay-700" />
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
              Términos y <span className="text-blue-600">Condiciones</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              ZENTRY - Plataforma de Gestión Residencial<br />
              <span className="text-gray-400 text-sm">Última actualización: 20 de agosto de 2025</span>
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
                    {/* Active indicator bar */}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicatorTerms"
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

              <section id="que-es" className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">1. ¿Qué es Zentry?</h2>
                <p className="text-xl text-gray-600 leading-relaxed font-medium">
                  Zentry es una aplicación móvil y web diseñada para la gestión integral de fraccionamientos y condominios.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Permite a residentes y administradores generar códigos QR de acceso, registrar visitantes (esporádicos, frecuentes y eventos), subir comprobantes de pago de cuotas mensuales realizados por transferencia, reservar áreas comunes, usar el botón de pánico en emergencias, recibir comunicados y gestionar interacciones con administración, seguridad y constructores.
                </p>
              </section>

              <section id="bienvenido" className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">2. Bienvenido a Zentry</h2>
                <div className="p-8 bg-blue-50/50 rounded-3xl border border-blue-100/50 flex items-start gap-6">
                  <Shield className="w-8 h-8 text-blue-600 shrink-0 mt-1" />
                  <p className="text-lg text-blue-900 leading-relaxed">
                    Al registrarte y usar la app, aceptas estos Términos. Zentry busca facilitar la seguridad, organización y comunicación en tu comunidad.
                  </p>
                </div>
              </section>

              <section id="funciones" className="space-y-8">
                <h2 className="text-3xl font-bold text-gray-900">3. Funcionalidades para residentes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'Autorizar visitas (QR)',
                    'Subir comprobantes de pago',
                    'Consultar estatus de cuenta',
                    'Reservar áreas comunes',
                    'Reportar emergencias (Botón pánico)',
                    'Recibir comunicados oficiales',
                    'Participar en foros/encuestas'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center space-x-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-sm font-medium text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section id="registro" className="space-y-12">
                <h2 className="text-3xl font-bold text-gray-900">4. Registro, cuenta y documentos</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Durante el registro deberás subir documentos de verificación (INE, comprobante de domicilio, escrituras o contrato de arrendamiento). Esta información se utiliza únicamente para validar tu calidad de residente y garantizar el uso correcto de la plataforma.
                </p>

                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-2">4.1 Veracidad de datos</h3>
                    <p className="text-sm text-gray-600">El Usuario declara, bajo protesta de decir verdad, que la información y documentación que proporcione es cierta, exacta, completa y actualizada.</p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-2">4.2 Facultad de verificación</h3>
                    <p className="text-sm text-gray-600">Zentry y/o la Administración podrán verificar la autenticidad mediante padrones internos o terceros encargados de validación.</p>
                  </div>

                  <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                    <h3 className="font-bold text-amber-900 mb-2">4.10 Morosidad</h3>
                    <ul className="text-sm text-amber-800 space-y-2">
                      <li>• Se restringen funciones de visitas y reservas.</li>
                      <li>• Los códigos QR diarios se reducen a 5.</li>
                      <li>• Tags vehiculares podrán ser desactivados temporalmente.</li>
                    </ul>
                  </div>

                  <div className="p-6 bg-red-50/50 rounded-2xl border border-red-100/50 text-center">
                    <h3 className="font-bold text-red-900 mb-2 italic underline">Consecuencias Graves</h3>
                    <p className="text-sm text-red-800 leading-relaxed">
                      La falsedad, inconsistencia o suplantación de identidad faculta a Zentry y/o a la Administración a cancelar la cuenta y notificar a autoridades competentes.
                    </p>
                  </div>
                </div>
              </section>

              <section id="uso-adecuado" className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">5. Uso adecuado</h2>
                <div className="grid gap-4">
                  {[
                    'No compartas códigos QR fuera de la finalidad otorgada.',
                    'No subas contenido ofensivo o ilícito.',
                    'Usa el botón de pánico de manera responsable.',
                    'Mantén actualizados tus datos.'
                  ].map((text, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 text-sm">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">{i + 1}</div>
                      <p className="text-gray-700">{text}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="pagos" className="space-y-8">
                <h2 className="text-3xl font-bold text-gray-900">6. Pagos y comprobantes</h2>
                <div className="p-8 bg-indigo-900 rounded-[32px] text-white shadow-xl shadow-indigo-100">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="p-3 bg-white/10 rounded-2xl">
                      <CreditCard className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold">Zentry no procesa pagos</h3>
                  </div>
                  <p className="text-indigo-100 mb-6 leading-relaxed">
                    La función de Zentry es permitir la carga del comprobante de pago realizado por otros medios y notificar a la administración para su validación.
                  </p>
                  <div className="p-4 bg-amber-400 text-amber-950 rounded-xl text-xs font-bold text-center">
                    ⚠️ NO SOLICITAMOS NI ALMACENAMOS DATOS BANCARIOS O TARJETAS.
                  </div>
                </div>
              </section>

              <section id="reservas" className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">7. Reservas y áreas comunes</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Las reglas de uso son establecidas por la administración. Algunas áreas pueden requerir pago adicional y las penalizaciones se aplicarán según reglamento interno.
                </p>
              </section>

              <section id="emergencias" className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">8. Emergencias</h2>
                <div className="p-8 bg-red-600 rounded-[32px] text-white flex items-center gap-8 shadow-lg shadow-red-100">
                  <div className="p-4 bg-white/20 rounded-2xl">
                    <AlertTriangle className="w-10 h-10" />
                  </div>
                  <p className="text-xl font-bold">En emergencias reales, llama siempre al 911 de manera inmediata.</p>
                </div>
              </section>

              <section id="notificaciones" className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">9. Notificaciones</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Zentry envía notificaciones sobre accesos, pagos, reservaciones y emergencias. Las configuraciones de privacidad pueden ajustarse en la app.
                </p>
              </section>

              <section id="cancelacion" className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">10. Cancelación o baja</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Puedes solicitar tu baja notificando al administrador o soporte. Los datos se conservarán el tiempo necesario para cumplir obligaciones legales.
                </p>
              </section>

              <section id="soporte" className="space-y-8 text-center md:text-left">
                <h2 className="text-3xl font-bold text-gray-900">11. Soporte</h2>
                <div className="p-8 bg-gray-900 rounded-[32px] text-white flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 rounded-2xl">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">Email de Contacto</p>
                      <p className="text-xl font-bold">zentry.app.mx@gmail.com</p>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-sm font-medium opacity-60 italic">Respuesta en horario laboral (9AM - 6PM)</p>
                  </div>
                </div>
              </section>

              <section id="propiedad" className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">12. Propiedad intelectual</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  ZENTRY TECH GROUP S. DE R.L. de C.V. es titular único de los derechos de la plataforma y su contenido.
                </p>
              </section>

              <section id="naturaleza" className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">13. Naturaleza del servicio</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Zentry no sustituye a las autoridades de seguridad pública ni a las empresas de seguridad privada física contratadas por el fraccionamiento.
                </p>
              </section>

              <section id="limitacion" className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">14. Limitación de responsabilidad</h2>
                <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 text-sm text-gray-600 leading-relaxed space-y-4">
                  <p>Zentry no se hace responsable por:</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      'Uso indebido de códigos QR.',
                      'Conflictos legales entre particulares.',
                      'Fallas técnicas de terceros.',
                      'Incidentes físicos en el fraccionamiento.',
                      'Falsedad de información aportada por usuarios.'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
              <section id="transferencia" className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">15. Transferencia de cuenta</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Las cuentas de Zentry son personales e intransferibles. En caso de venta o arrendamiento de la propiedad, el titular actual debe notificar a la administración o soporte para dar de baja su acceso, y el nuevo residente deberá iniciar un proceso de registro independiente.
                </p>
              </section>

              <section id="actualizaciones" className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">16. Actualizaciones y compatibilidad</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Para garantizar la seguridad y el correcto funcionamiento de todas las características (especialmente códigos QR y botón de pánico), el usuario se compromete a mantener instalada la versión más reciente de la aplicación disponible en las tiendas oficiales (App Store / Play Store).
                </p>
              </section>

              <section id="mantenimiento" className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">17. Mantenimiento</h2>
                <p className="text-lg text-gray-600 leading-relaxed italic opacity-80">
                  Zentry opera 24/7, salvo mantenimientos programados informados previamente.
                </p>
              </section>

              <section id="cambios" className="pt-20 border-t border-gray-100">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">18. Cambios a los Términos</h2>
                <p className="text-lg text-gray-600 leading-relaxed italic">
                  Las actualizaciones se comunicarán con al menos 15 días de anticipación. El uso continuado implica la aceptación de los nuevos términos.
                </p>
              </section>

            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}