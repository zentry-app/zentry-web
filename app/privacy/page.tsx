'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Shield, Lock, Eye, FileText, Mail, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/landing-new/Navbar';
import Footer from '@/components/landing-new/Footer';

const sections = [
  { id: 'intro', title: 'Introducción', icon: Shield },
  { id: 'datos', title: '1. Datos personales', icon: FileText },
  { id: 'finalidades', title: '2. Finalidades', icon: Eye },
  { id: 'base-juridica', title: '3. Base jurídica', icon: Lock },
  { id: 'transferencias', title: '4. Transferencias', icon: ChevronRight },
  { id: 'conservacion', title: '5. Conservación', icon: FileText },
  { id: 'derechos-arco', title: '6. Derechos ARCO', icon: Lock },
  { id: 'limitacion', title: '7. Limitación', icon: Eye },
  { id: 'terceros', title: '8. Datos de terceros', icon: Shield },
  { id: 'seguridad-caseta', title: '9. Código y tags', icon: Lock },
  { id: 'menores', title: '10. Menores de edad', icon: Shield },
  { id: 'cambios', title: '11. Cambios al aviso', icon: FileText },
  { id: 'seguridad', title: '12. Seguridad', icon: Lock },
  { id: 'veracidad', title: '13. Veracidad', icon: Shield },
  { id: 'contacto', title: 'Contacto', icon: Mail },
];

export default function PrivacyPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('intro');

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
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse" />
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse delay-700" />
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
              Aviso de <span className="text-blue-600">Privacidad</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Zentry Tech Group S. de R.L. de C.V.<br />
              <span className="text-gray-400 text-sm">Fecha de última actualización: 20 de agosto de 2025</span>
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Sidebar Navigation */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-28 space-y-1 pr-8 border-r border-gray-200/50">
              <p className="text-[10px] font-extrabold text-blue-600/40 tracking-[0.3em] uppercase mb-8 ml-2">CONTENIDO</p>
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
                        layoutId="activeIndicator"
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

              <section id="intro">
                <p className="text-xl text-gray-600 leading-relaxed font-medium italic border-l-4 border-blue-500 pl-6 py-2">
                  Zentry Tech Group S. de R.L. de C.V. (&quot;Zentry&quot;), con domicilio en Mexicali, Baja California, México, es responsable del tratamiento de sus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y su Reglamento.
                </p>
              </section>

              <section id="datos" className="space-y-8">
                <h2 className="text-3xl font-bold text-gray-900">1. Datos personales que tratamos</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Dependiendo de su relación con la plataforma (residente, propietario, inquilino, visitante/invitado), Zentry podrá tratar:
                </p>

                <div className="grid gap-6">
                  <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <h3 className="font-bold text-blue-900 mb-4 flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Identificación y contacto:</span>
                    </h3>
                    <ul className="space-y-3 text-blue-800">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2.5 shrink-0" />
                        <span>Nombre(s) y apellidos, correo electrónico, teléfono.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2.5 shrink-0" />
                        <span>Domicilio y ID del fraccionamiento.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2.5 shrink-0" />
                        <span>Identificación oficial (INE o licencia) y comprobante de domicilio.</span>
                      </li>
                    </ul>
                    <div className="mt-6 p-4 bg-white/60 rounded-xl text-sm text-blue-900 font-medium">
                      ⚠️ Estos documentos se consideran datos personales sensibles y su tratamiento requiere su consentimiento expreso.
                    </div>
                  </div>

                  <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                    <h3 className="font-bold text-indigo-900 mb-4 flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Operación y seguridad:</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-indigo-800 text-sm">
                      {[
                        'Placas e información vehicular',
                        'Códigos de acceso (QR)',
                        'Log de accesos y bitácoras',
                        'Mensajes a caseta/administración',
                        'Datos de reservaciones',
                        'Estatus de pagos/morosidad',
                        'Botón de pánico',
                        'Tokens de notificaciones',
                        'Archivos y evidencias',
                        'Metadatos técnicos'
                      ].map((item, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-indigo-400 rounded-full" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section id="finalidades" className="space-y-8">
                <h2 className="text-3xl font-bold text-gray-900">2. Finalidades del tratamiento</h2>
                <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
                  <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100/50">
                    <h3 className="font-bold text-gray-900 mb-6 uppercase tracking-widest text-xs">Finalidades Primarias</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        'Registro y verificación',
                        'Control de accesos',
                        'Gestión de visitas',
                        'Mensajería operativa',
                        'Botón de pánico',
                        'Reservas de áreas comunes',
                        'Gestión de pagos',
                        'Comunicados oficiales',
                        'Seguridad del sistema'
                      ].map((item, i) => (
                        <li key={i} className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-sm">
                          <ChevronRight className="w-4 h-4 text-blue-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section id="base-juridica" className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">3. Base jurídica y consentimiento</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Tratamos sus datos con base en el consentimiento del titular, la relación jurídica derivada de su registro y uso de la plataforma, el interés legítimo del responsable y obligaciones legales aplicables.
                </p>
              </section>

              <section id="transferencias" className="space-y-8">
                <h2 className="text-3xl font-bold text-gray-900">4. Transferencias y remisiones</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  No realizamos transferencias de datos a terceros sin su consentimiento, salvo las excepciones de ley. Realizamos remisiones a encargados con contratos de confidencialidad y seguridad de datos.
                </p>
                <div className="flex flex-wrap gap-4">
                  {['Google Firebase', 'Apple/Google Push', 'Soporte y Correo'].map((provider, i) => (
                    <div key={i} className="px-6 py-3 bg-gray-50 rounded-2xl border border-gray-100 text-gray-900 font-semibold text-sm">
                      {provider}
                    </div>
                  ))}
                </div>
              </section>

              <section id="conservacion" className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">5. Conservación de datos</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Conservamos sus datos mientras su cuenta esté activa y por el tiempo necesario para cumplir las finalidades descritas. Los registros de acceso se conservan por un periodo razonable para investigación de incidentes.
                </p>
              </section>

              <section id="derechos-arco" className="space-y-8">
                <h2 className="text-3xl font-bold text-gray-900">6. Derechos ARCO</h2>
                <div className="p-8 bg-blue-600 rounded-[32px] text-white shadow-xl shadow-blue-200">
                  <p className="text-lg mb-6 leading-relaxed">
                    Usted puede acceder, rectificar, cancelar u oponerse al tratamiento de sus datos, así como revocar su consentimiento.
                  </p>
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-6 bg-white/10 rounded-2xl border border-white/20">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-6 h-6" />
                      <span className="font-bold">zentry.app.mx@gmail.com</span>
                    </div>
                    <p className="text-sm opacity-80 font-medium">Respuesta en 20 días hábiles</p>
                  </div>
                </div>
              </section>

              <section id="limitacion" className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">7. Limitación de uso</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Puede desactivar notificaciones no esenciales. Para encuestas u otras comunicaciones secundarias, puede solicitar su baja al correo oficial.
                </p>
              </section>

              <section id="terceros" className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">8. Datos de terceros</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Si registra datos de visitantes/invitados, se compromete a informarles sobre este Aviso y obtener su consentimiento para fines de control de acceso.
                </p>
              </section>

              <section id="seguridad-caseta" className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">9. Código peatonal y tags</h2>
                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-6 items-start">
                  <div className="p-3 bg-amber-100 rounded-2xl">
                    <Lock className="w-6 h-6 text-amber-700" />
                  </div>
                  <div className="text-amber-900 text-sm leading-relaxed space-y-4">
                    <p>• El código peatonal se publica en Comunicados y puede rotarse periódicamente.</p>
                    <p>• Los tags pueden desactivarse por morosidad; el ingreso vehicular se realizará con QR de un solo uso.</p>
                    <p>• El estatus de morosidad será visible solo para fines operativos.</p>
                  </div>
                </div>
              </section>

              <section id="menores" className="space-y-4 text-center">
                <div className="p-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">10. Menores de edad</h2>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    La plataforma no está dirigida a menores de 18 años como titulares de cuenta. Los registros sin autorización válida serán cancelados.
                  </p>
                </div>
              </section>

              <section id="cambios" className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-900">11. Cambios al Aviso</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Podremos actualizar este Aviso para reflejar cambios regulatorios o de operación. Cualquier modificación se publicará en la app.
                </p>
              </section>

              <section id="seguridad" className="space-y-8">
                <h2 className="text-3xl font-bold text-gray-900">12. Medidas de seguridad</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: 'Administrativas', desc: 'Accesos restringidos a personal autorizado.' },
                    { title: 'Técnicas', desc: 'Cifrado en bases de datos y comunicaciones.' },
                    { title: 'Físicas', desc: 'Control de acceso a infraestructuras.' }
                  ].map((item, i) => (
                    <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                      <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="veracidad" className="pt-20">
                <div className="p-8 bg-red-50 rounded-[32px] border border-red-100">
                  <h2 className="text-2xl font-bold text-red-900 mb-4">13. Declaración de veracidad</h2>
                  <p className="text-red-800 leading-relaxed">
                    El usuario declara que los datos y documentos proporcionados son auténticos. Zentry se deslinda de responsabilidad derivada de la falsedad de la información.
                  </p>
                </div>
              </section>

              <section id="contacto" className="pt-10">
                <div className="p-8 bg-gray-900 rounded-[32px] text-white">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold">Contacto Responsable</h3>
                      <p className="text-sm opacity-60">Zentry Tech Group S. de R.L. de C.V.</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm opacity-90">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span>Mexicali, Baja California, México</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-blue-400" />
                      <span>zentry.app.mx@gmail.com</span>
                    </div>
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
