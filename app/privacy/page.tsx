'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CTASection from '@/components/landing-new/CTASection';
import Footer from '@/components/landing-new/Footer';

export default function PrivacyPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Gradiente que se funde con blanco */}
      <section className="relative py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-600 via-green-700 via-green-600 to-white"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Botón integrado en el hero */}
          <div className="flex justify-start mb-8">
            <button onClick={handleBack} className="group">
              <div className="flex items-center gap-3 group-hover:scale-105 transition-transform duration-300">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-white" />
              </div>
                <span className="text-white font-medium group-hover:text-green-100 transition-colors">
                  Volver al inicio
                </span>
              </div>
            </button>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Aviso de Privacidad
            </h1>
            <p className="text-xl text-green-100 leading-relaxed max-w-2xl mx-auto">
              Zentry Tech Group S. de R.L. de C.V. - Fecha de última actualización: 20 de agosto de 2025
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content - Estilo FeatureSection limpio */}
      <section className="w-full py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
          {/* Introducción */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <p className="text-lg text-gray-700 leading-relaxed">
                Zentry Tech Group S. de R.L. de C.V. ("Zentry"), con domicilio en Mexicali, Baja California, México, es responsable del tratamiento de sus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y su Reglamento.
              </p>
            </motion.div>

            {/* Sección 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                1. Datos personales que tratamos
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Dependiendo de su relación con la plataforma (residente, propietario, inquilino, visitante/invitado), Zentry podrá tratar:
              </p>
              
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
                  <h3 className="text-xl font-semibold text-blue-900 mb-4">Identificación y contacto:</h3>
                  <ul className="space-y-3 text-blue-800">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Nombre(s) y apellidos, correo electrónico, teléfono.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Domicilio y ID del fraccionamiento.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Identificación oficial (INE o licencia) y comprobante de domicilio (para verificación de propiedad/ocupación).</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-4 bg-blue-100 rounded-xl">
                    <p className="text-blue-900 font-semibold">
                      Estos documentos se consideran datos personales sensibles y su tratamiento requiere su consentimiento expreso, otorgado al momento de cargarlos en la plataforma.
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 rounded-2xl p-8 border border-green-100">
                  <h3 className="text-xl font-semibold text-green-900 mb-4">Operación y seguridad:</h3>
                  <ul className="space-y-3 text-green-800">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Placas e información vehicular (marca, modelo, color).</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Códigos de acceso (QR de una sola ocasión, QR de eventos), tags vehiculares.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Log de accesos (fechas/horas de entrada y salida) y bitácoras de eventos.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Mensajes enviados a caseta/administración (autorizaciones de salida, carga, vehículo distinto, etc.).</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Datos de reservaciones (área, fecha/hora, invitados).</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Estatus de pagos/morosidad (solo para control de funciones y acceso).</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Botón de pánico y comunicaciones.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Tokens de notificaciones push y preferencias de notificación.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Archivos y evidencias (fotografías, videos o documentos) que se generen o carguen dentro de la app.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Metadatos técnicos del dispositivo (sistema operativo, modelo) y registros de uso necesarios para la prestación del servicio.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-yellow-50 rounded-2xl p-8 border border-yellow-100">
                  <h3 className="text-xl font-semibold text-yellow-900 mb-4">Datos de terceros (visitantes/invitados):</h3>
                  <p className="text-yellow-800 leading-relaxed mb-4">
                    Nombre, identificación, datos vehiculares y registro de acceso.
                  </p>
                  <div className="p-4 bg-yellow-100 rounded-xl">
                    <p className="text-yellow-900 font-semibold">
                      Si usted registra a terceros (p. ej., invitados a un evento), declara que cuenta con su consentimiento para compartir y/o registrar sus datos para los fines operativos descritos.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Sección 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                2. Finalidades del tratamiento
              </h2>
              
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
                  <h3 className="text-xl font-semibold text-blue-900 mb-4">Finalidades primarias (necesarias para el servicio):</h3>
                  <ul className="space-y-3 text-blue-800">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Registro y verificación de residentes/propietarios/ inquilinos (validación de identidad y domicilio).</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Control de accesos al fraccionamiento.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Gestión de visitas e invitados a eventos.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Mensajería operativa con caseta/administración.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Botón de pánico (atención a emergencias).</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Reservas de áreas comunes.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Gestión de pagos y administración de morosidad.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Comunicados del comité/administración.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Seguridad del sistema, prevención de fraude y soporte técnico.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 rounded-2xl p-8 border border-green-100">
                  <h3 className="text-xl font-semibold text-green-900 mb-4">Finalidades secundarias (optativas):</h3>
                  <ul className="space-y-3 text-green-800">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Estadística y mejora de producto.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Encuestas internas y de satisfacción.</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-4 bg-green-100 rounded-xl">
                    <p className="text-green-900 font-semibold">
                      Usted puede oponerse en cualquier momento al tratamiento de sus datos para finalidades secundarias, sin que ello afecte la prestación de los servicios esenciales de la plataforma.
                  </p>
                </div>
                </div>
              </div>
            </motion.div>

            {/* Sección 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                3. Base jurídica y consentimiento
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Tratamos sus datos con base en:
              </p>
              <div className="bg-gray-50 rounded-2xl p-8">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Consentimiento del titular.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Relación jurídica derivada de su registro y uso de la plataforma.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Interés legítimo del responsable/administración del fraccionamiento.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Obligaciones legales aplicables.</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Sección 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                4. Transferencias, remisiones y destinatarios
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                No realizamos transferencias de datos a terceros sin su consentimiento, salvo las excepciones de ley. Realizamos remisiones a encargados con contratos de confidencialidad y seguridad de datos, tales como:
              </p>
              <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
                <ul className="space-y-3 text-blue-800">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Infraestructura en la nube y base de datos (Google Firebase).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Notificaciones push (Apple/Google).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Soporte y correo.</span>
                  </li>
                </ul>
                <div className="mt-4 p-4 bg-blue-100 rounded-xl">
                  <p className="text-blue-900 font-semibold">
                    Para la operación diaria, cierta información operativa será accesible para administradores del fraccionamiento y personal de seguridad con perfiles autorizados.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Sección 5 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                5. Conservación de datos
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Conservamos sus datos mientras su cuenta esté activa y por el tiempo necesario para cumplir las finalidades descritas. Los registros de acceso se conservan por un periodo razonable para investigación de incidentes. Los comprobantes de pago se conservan conforme a las obligaciones fiscales. Concluidos dichos periodos, los datos se eliminarán o disociarán de forma segura.
              </p>
            </motion.div>

            {/* Sección 6 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                6. Derechos ARCO y revocación del consentimiento
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Usted puede acceder, rectificar, cancelar u oponerse al tratamiento de sus datos (Derechos ARCO), así como revocar su consentimiento mediante solicitud a: <strong>zentry.app.mx@gmail.com</strong> o desde Soporte en la app.
              </p>
              <div className="bg-green-50 rounded-2xl p-8 border border-green-100">
                <p className="text-green-800 leading-relaxed mb-4">
                  <strong>Plazos de respuesta:</strong> Zentry comunicará la determinación dentro de 20 días hábiles y, de resultar procedente, la hará efectiva dentro de los 15 días hábiles siguientes.
                </p>
              </div>
            </motion.div>

            {/* Sección 7 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                7. Limitación de uso y divulgación; preferencias
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Puede desactivar notificaciones no esenciales. Para encuestas u otras comunicaciones secundarias, puede solicitar su baja al correo <strong>zentry.app.mx@gmail.com</strong>.
              </p>
            </motion.div>

            {/* Sección 8 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                8. Tratamiento de datos de terceros (visitantes e invitados)
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Si usted registra datos de visitantes/invitados, se compromete a informarles sobre este Aviso y obtener su consentimiento para fines de control de acceso y seguridad del fraccionamiento.
              </p>
            </motion.div>

            {/* Sección 9 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                9. Código peatonal, tags y morosidad
              </h2>
              <div className="bg-gray-50 rounded-2xl p-8">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>El código peatonal se publica en Comunicados y puede rotarse periódicamente por seguridad.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Los tags de residentes pueden desactivarse por morosidad; durante ese periodo, el ingreso vehicular se realizará con QR de un solo uso.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>El estatus de morosidad será visible al personal autorizado solo para fines operativos.</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Sección 10 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                10. Menores de edad
              </h2>
              <div className="bg-red-50 rounded-2xl p-8 border border-red-100">
                <p className="text-red-800 leading-relaxed">
                  La plataforma no está dirigida a menores de 18 años como titulares de cuenta de residente. Si identificamos un registro de menor sin autorización válida, procederemos a cancelarlo.
                </p>
              </div>
            </motion.div>

            {/* Sección 11 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                11. Cambios al Aviso
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Podremos actualizar este Aviso para reflejar cambios regulatorios o de operación. Cualquier modificación se publicará en la app y entrará en vigor desde su publicación.
              </p>
            </motion.div>

            {/* Sección 12 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                12. Medidas de seguridad y notificación de incidentes
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Zentry aplica medidas de seguridad administrativas (accesos restringidos a personal autorizado), técnicas (cifrado en bases de datos y comunicaciones, reglas de acceso en Firebase) y físicas (control de acceso a servidores/documentos) para proteger los datos personales contra daño, pérdida, alteración, destrucción o uso no autorizado.
              </p>
              <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
                <p className="text-blue-800 leading-relaxed">
                  En caso de una vulneración de seguridad que afecte de forma significativa sus derechos patrimoniales o morales, Zentry le notificará de manera inmediata a través de la app y/o correo electrónico.
                </p>
              </div>
            </motion.div>

            {/* Sección 13 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                13. Declaración de veracidad
              </h2>
              <div className="bg-red-50 rounded-2xl p-8 border border-red-100">
                <p className="text-red-800 leading-relaxed">
                  El usuario declara bajo protesta de decir verdad que los datos y documentos proporcionados son auténticos y corresponden a su persona o vivienda. Zentry y la administración del fraccionamiento se deslindan de cualquier responsabilidad legal derivada de la falsedad de la información proporcionada.
                </p>
              </div>
            </motion.div>

            {/* Contacto */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                Contacto del responsable
              </h2>
              <div className="bg-green-50 rounded-2xl p-8 border border-green-100">
                <div className="space-y-2">
                  <p className="text-green-800 font-semibold"><strong>Zentry Tech Group S. de R.L. de C.V.</strong></p>
                  <p className="text-green-800"><strong>Correo:</strong> zentry.app.mx@gmail.com</p>
                  <p className="text-green-800"><strong>Domicilio:</strong> Mexicali, Baja California, México</p>
                </div>
              </div>
            </motion.div>
              </div>
        </div>
      </section>

      {/* CTA Section de la landing */}
      <CTASection />
      
      {/* Footer */}
      <Footer />
    </div>
  );
} 