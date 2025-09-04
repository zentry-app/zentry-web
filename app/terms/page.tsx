'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import CTASection from '@/components/landing-new/CTASection';
import Footer from '@/components/landing-new/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Gradiente que se funde con blanco */}
      <section className="relative py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600 via-blue-700 via-blue-600 to-white"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Botón integrado en el hero */}
          <div className="flex justify-start mb-8">
            <Link href="/" className="group">
              <div className="flex items-center gap-3 group-hover:scale-105 transition-transform duration-300">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl group-hover:bg-white/30 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-white" />
              </div>
                <span className="text-white font-medium group-hover:text-blue-100 transition-colors">
                  Volver al inicio
                </span>
              </div>
            </Link>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Términos y Condiciones de Uso
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto">
              ZENTRY - Última actualización: 20 de agosto de 2025
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content - Estilo FeatureSection limpio */}
      <section className="w-full py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {/* Sección 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                1. ¿Qué es Zentry?
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Zentry es una aplicación móvil y web diseñada para la gestión integral de fraccionamientos y condominios. Permite a residentes y administradores: generar códigos QR de acceso, registrar visitantes (esporádicos, frecuentes y eventos), subir comprobantes de pago de cuotas mensuales realizadas por transferencia, reservar áreas comunes, usar el botón de pánico en emergencias, recibir comunicados y gestionar interacciones con administración, seguridad y constructores.
              </p>
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
                2. Bienvenido a Zentry
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Al registrarte y usar la app, aceptas estos Términos. Zentry busca facilitar la seguridad, organización y comunicación en tu comunidad.
              </p>
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
                3. Funcionalidades para residentes
              </h2>
              <div className="bg-gray-50 rounded-2xl p-8">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Autorizar visitas (esporádicas, frecuentes o de eventos).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Subir comprobantes de pago de cuotas mensuales realizadas por fuera de la app.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Consultar estatus de cuenta y descargar recibos.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Reservar áreas comunes bajo las reglas internas del fraccionamiento.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Reportar emergencias con el botón de pánico.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Recibir comunicados y notificaciones.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Participar en foros, encuestas y otras funciones comunitarias (cuando estén habilitadas).</span>
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
                4. Registro, cuenta y documentos
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Durante el registro deberás subir documentos de verificación (INE, comprobante de domicilio, escrituras o contrato de arrendamiento). Esta información se utiliza únicamente para validar tu calidad de residente y garantizar el uso correcto de la plataforma.
              </p>
              
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
                  <h3 className="text-xl font-semibold text-blue-900 mb-4">4.1 Veracidad y actualización de datos</h3>
                  <p className="text-blue-800 leading-relaxed">
                    El Usuario declara, bajo protesta de decir verdad, que la información y documentación que proporcione es cierta, exacta, completa y actualizada, y se compromete a mantenerla al día.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">4.2 Documentación soporte y facultad de verificación</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Zentry y/o la Administración podrán solicitar documentación adicional y verificar la autenticidad de la información mediante padrones internos, constancias del comité o terceros encargados de validación. Podrán suspender, limitar o revocar el acceso cuando existan indicios de falsedad, inconsistencia o suplantación.
                  </p>
                </div>

                <div className="bg-green-50 rounded-2xl p-8 border border-green-100">
                  <h3 className="text-xl font-semibold text-green-900 mb-4">4.3 Conservación y protección de documentos</h3>
                  <p className="text-green-800 leading-relaxed">
                    Los documentos cargados se almacenan en Firebase Storage bajo medidas de seguridad administrativas, técnicas y físicas.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">4.4 Usuario principal y cuentas vinculadas</h3>
              <p className="text-gray-700 leading-relaxed">
                    El propietario o arrendatario autorizado es el responsable principal de cada casa. Puede autorizar cuentas adicionales (ej. inquilinos) y será responsable de su uso.
                  </p>
                </div>

                <div className="bg-yellow-50 rounded-2xl p-8 border border-yellow-100">
                  <h3 className="text-xl font-semibold text-yellow-900 mb-4">4.5 Inquilinos</h3>
                  <p className="text-yellow-800 leading-relaxed">
                    El propietario puede autorizar inquilinos. Al finalizar el arrendamiento, ambos deben notificar la baja.
                  </p>
                </div>

                <div className="bg-red-50 rounded-2xl p-8 border border-red-100">
                  <h3 className="text-xl font-semibold text-red-900 mb-4">4.6 Responsabilidad por terceros (invitados/visitantes)</h3>
                  <p className="text-red-800 leading-relaxed">
                    Si el Usuario registra datos de terceros (ej. invitados a eventos o visitas), declara que cuenta con su consentimiento y que los datos son veraces. El Usuario asume la responsabilidad por la información de terceros que capture.
                  </p>
                </div>

                <div className="bg-red-50 rounded-2xl p-8 border border-red-100">
                  <h3 className="text-xl font-semibold text-red-900 mb-4">4.7 Consecuencias por información falsa</h3>
                  <p className="text-red-800 leading-relaxed">
                    La falsedad, inconsistencia o suplantación de identidad faculta a Zentry y/o a la Administración a cancelar la cuenta, bloquear accesos, invalidar reservas y, en su caso, notificar a las autoridades competentes. El Usuario será responsable de los daños y perjuicios que dicha conducta cause a Zentry, a la Administración o a terceros.
                  </p>
                </div>

                <div className="bg-red-50 rounded-2xl p-8 border border-red-100">
                  <h3 className="text-xl font-semibold text-red-900 mb-4">4.8 Indemnidad</h3>
                  <p className="text-red-800 leading-relaxed">
                    El Usuario se obliga a sacar en paz y a salvo a Zentry y a la Administración frente a reclamaciones, multas o procedimientos derivados de información falsa, uso indebido de la plataforma o de los datos de terceros que capture, incluyendo honorarios razonables de abogados.
                  </p>
                </div>

                <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
                  <h3 className="text-xl font-semibold text-blue-900 mb-4">4.9 Evidencia electrónica</h3>
                  <p className="text-blue-800 leading-relaxed">
                    Las aceptaciones en pantalla, registros de actividad (logs), marcas de tiempo, direcciones IP, metadatos y hashes de archivos generados por Zentry constituyen prueba válida de las operaciones realizadas por el Usuario.
                  </p>
                </div>

                <div className="bg-orange-50 rounded-2xl p-8 border border-orange-100">
                  <h3 className="text-xl font-semibold text-orange-900 mb-4">4.10 Morosidad</h3>
                  <p className="text-orange-800 leading-relaxed mb-4">En caso de adeudos:</p>
                  <ul className="space-y-2 text-orange-800">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Se restringen funciones (visitas, reservas, foros, eventos).</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Los códigos QR diarios se reducen de 10 a 5.</span>
                  </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Tags vehiculares podrán ser desactivados temporalmente (acceso solo con QR).</span>
                  </li>
                  </ul>
                  <p className="text-orange-800 leading-relaxed mt-4">
                    Las funciones se restauran automáticamente al regularizar pagos.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">4.11 Reposición de pase físico</h3>
                  <p className="text-gray-700 leading-relaxed">
                    La reposición de pases físicos (ej. tarjetas, tags) tendrá un costo definido por la administración, actualmente $150 MXN.
                  </p>
                </div>

                <div className="bg-red-50 rounded-2xl p-8 border border-red-100">
                  <h3 className="text-xl font-semibold text-red-900 mb-4">4.12 Menores de edad</h3>
                  <p className="text-red-800 leading-relaxed">
                    No se permite el registro de menores de 18 años como titulares de cuenta de residente.
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
                5. Uso adecuado
              </h2>
              <div className="bg-gray-50 rounded-2xl p-8">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>No compartas códigos QR fuera de la finalidad otorgada.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>No subas contenido ofensivo o ilícito.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Usa el botón de pánico de manera responsable.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Mantén actualizados tus datos.</span>
                  </li>
                </ul>
              </div>
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
                6. Pagos y comprobantes
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Los pagos de cuotas mensuales se realizan fuera de la app, por medios definidos por la administración del fraccionamiento (ej. transferencia bancaria). La función de Zentry es únicamente:
              </p>
              <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
                <ul className="space-y-3 text-blue-800">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Permitir la carga del comprobante de pago en la aplicación.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Notificar a la administración para su validación.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Mostrar al residente el estatus de su cuenta (al corriente, pendiente, vencida).</span>
                  </li>
                </ul>
                <div className="mt-6 p-4 bg-yellow-100 rounded-xl">
                  <p className="text-yellow-900 font-semibold">
                    ⚠️ Zentry no procesa pagos, no solicita ni almacena datos bancarios o tarjetas, ni funge como intermediario financiero.
                  </p>
                </div>
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
                7. Reservas y áreas comunes
              </h2>
              <div className="bg-gray-50 rounded-2xl p-8">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Las reglas de uso son establecidas por la administración.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Algunas áreas pueden requerir pago adicional.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Cancelaciones y penalizaciones se aplicarán según reglamento interno.</span>
                  </li>
                </ul>
              </div>
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
                8. Emergencias y seguridad
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                El botón de pánico genera una alerta inmediata a caseta y administración, pero no garantiza una respuesta inmediata. En emergencias, llama directamente al 911.
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
                9. Notificaciones
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Zentry envía notificaciones sobre accesos, pagos, reservaciones, comunicados y emergencias. Puedes limitar notificaciones no esenciales desde la configuración de la app.
              </p>
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
                10. Cancelación o baja
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Puedes solicitar tu baja notificando al administrador o soporte. Los datos se conservarán solo el tiempo necesario para cumplir obligaciones legales o fiscales.
              </p>
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
                11. Soporte
              </h2>
              <div className="bg-gray-50 rounded-2xl p-8">
                <div className="space-y-2">
                  <p className="text-gray-800 font-semibold"><strong>Correo:</strong> zentry.app.mx@gmail.com</p>
                  <p className="text-gray-800"><strong>Horario:</strong> Lunes a viernes de 9:00 a.m. a 6:00 p.m.</p>
                </div>
              </div>
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
                12. Propiedad intelectual
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                ZENTRY TECH GROUP S. DE R.L. de C.V. es titular de todos los derechos de la plataforma, incluyendo software, logotipos, interfaces y documentación.
              </p>
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
                13. Naturaleza del servicio
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Zentry no es una empresa de seguridad privada. La responsabilidad de la seguridad física es de la administración y autoridades correspondientes.
              </p>
            </motion.div>

            {/* Sección 14 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                14. Limitación de responsabilidad
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Zentry no se hace responsable por:
              </p>
              <div className="bg-red-50 rounded-2xl p-8 border border-red-100">
                <ul className="space-y-3 text-red-800">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Uso indebido de códigos QR.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Conflictos legales entre vecinos o arrendadores/inquilinos.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Fallas de internet, energía o dispositivos del usuario.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Accidentes o incidentes en áreas comunes.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Retrasos de respuesta en emergencias.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Decisiones tomadas por la Administración con base en información falsa aportada por usuarios o visitantes.</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Sección 15 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                15. Transferencia de cuenta
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Al vender, ceder o abandonar el inmueble, debes dar de baja tu cuenta. Los nuevos residentes deben registrarse con sus propios datos.
              </p>
            </motion.div>

            {/* Sección 16 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                16. Actualizaciones
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Es obligatorio mantener la app actualizada. Requisitos mínimos: Android 8 o iOS 13.
              </p>
            </motion.div>

            {/* Sección 17 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                17. Mantenimiento del servicio
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Zentry opera 24/7, salvo mantenimientos programados, los cuales serán notificados previamente.
              </p>
            </motion.div>

            {/* Sección 18 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
                18. Cambios a los Términos
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Zentry podrá modificar estos Términos en cualquier momento. Los cambios relevantes serán notificados con al menos 15 días de anticipación a su entrada en vigor.
              </p>
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