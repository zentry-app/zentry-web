import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

const ComparisonSection = () => {
  return (
    <section className="w-full py-16 md:py-24 bg-gradient-to-b from-white to-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Título y subtítulo */}
        <div className="text-center mb-16">
          <motion.h2 
            className="text-4xl md:text-5xl font-heading font-bold mb-6 text-gray-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Administra tu residencial con transparencia y control.
          </motion.h2>
          <motion.p 
            className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Todo en un solo lugar, sin complicaciones.
          </motion.p>
        </div>

        {/* Cards principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Card 1 - Gestión Financiera Transparente */}
          <motion.div 
            className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-100"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Gestión Financiera Transparente
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Reportes claros, pagos al instante.
              </p>
            </div>

            {/* Imagen del card */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-blue-50 to-blue-100">
              <Image
                src="/assets/StatsImg.webp"
                alt="Estadísticas y reportes financieros"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            {/* Características - Bullets simples */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📊</span>
                </div>
                <span className="text-gray-700 font-medium">Reportes en tiempo real</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">💳</span>
                </div>
                <span className="text-gray-700 font-medium">Pagos y comprobantes fáciles</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm">🔍</span>
                </div>
                <span className="text-gray-700 font-medium">Transparencia para todos</span>
              </div>
            </div>
          </motion.div>

          {/* Card 2 - Comunicación y Control en Tiempo Real */}
          <motion.div 
            className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-100"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Comunicación y control sin interrupciones
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Todo el residencial en un solo panel.
              </p>
            </div>

            {/* Imagen del card */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-green-50 to-green-100">
              <Image
                src="/assets/NotificationImg.webp"
                alt="Notificaciones y comunicación"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            {/* Características - Bullets simples */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">📨</span>
                </div>
                <span className="text-gray-700 font-medium">Avisos en un clic</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">🏠</span>
                </div>
                <span className="text-gray-700 font-medium">Reservas al instante</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm">🔐</span>
                </div>
                <span className="text-gray-700 font-medium">Control de accesos en vivo</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Beneficio destacado ultra sobrio */}
        <motion.div 
          className="relative text-center rounded-3xl p-8 md:p-12 bg-gray-50 border overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{
            background: 'linear-gradient(#f9fafb, #f9fafb) padding-box, linear-gradient(45deg, #3b82f6, #06b6d4, #8b5cf6, #ec4899, #f59e0b, #ef4444) border-box',
            border: '1px solid transparent',
            animation: 'gradient-border 4s ease-in-out infinite'
          }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="text-4xl mb-4">💡</div>
            <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">
              Zentry le da al comité el control y la confianza que siempre buscaron.
            </h3>
            
            {/* Botón rainbow simple */}
            <motion.button 
              className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b, #ef4444, #06b6d4)',
                backgroundSize: '300% 300%',
                animation: 'rainbow-gradient 3s ease-in-out infinite'
              }}
            >
              <span>⚡ Probar Zentry Ahora</span>
            </motion.button>
            
            <p className="text-gray-600 text-sm mt-4">
              100% transparente. Sin complicaciones.
            </p>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes gradient-border {
          0%, 100% {
            background: linear-gradient(#f9fafb, #f9fafb) padding-box, linear-gradient(45deg, #3b82f6, #06b6d4, #8b5cf6, #ec4899, #f59e0b, #ef4444) border-box;
          }
          50% {
            background: linear-gradient(#f9fafb, #f9fafb) padding-box, linear-gradient(225deg, #ef4444, #f59e0b, #ec4899, #8b5cf6, #06b6d4, #3b82f6) border-box;
          }
        }
        
        @keyframes rainbow-gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </section>
  );
};

export default ComparisonSection; 