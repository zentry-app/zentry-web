import React from 'react';
import { motion } from 'framer-motion';

const CTASection = () => {
  return (
    <section className="w-full py-20 md:py-28 bg-gradient-to-b from-white to-gray-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2 
          className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6 text-gray-900"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          ¿Quieres llevar tu residencial al siguiente nivel?
        </motion.h2>
        
        <motion.p 
          className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Contáctanos y descubre cómo Zentry puede adaptarse a las necesidades de tu comunidad.
        </motion.p>

        {/* Botón premium estilo rainbow/glowy */}
        <motion.button 
          className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold px-10 py-5 rounded-full transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 flex items-center gap-3 mx-auto text-lg md:text-xl"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{
            background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b, #ef4444, #06b6d4)',
            backgroundSize: '300% 300%',
            animation: 'rainbow-gradient 3s ease-in-out infinite',
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.4), 0 0 60px rgba(59, 130, 246, 0.2)'
          }}
        >
          <span>⚡ Hablar con un asesor</span>
        </motion.button>

        {/* Copy adicional pequeño y sobrio */}
        <motion.p 
          className="text-gray-500 text-sm mt-6 opacity-80"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          Sin compromiso. Resolvemos todas tus dudas.
        </motion.p>
      </div>

      <style jsx>{`
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

export default CTASection;
