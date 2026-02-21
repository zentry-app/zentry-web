"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// Tipos para las pestañas
type TabType = 'accesos' | 'pagos' | 'reservas' | 'emergencias';

const BrowseForMeSection = () => {
  // Estado para controlar la pestaña activa
  const [activeTab, setActiveTab] = useState<TabType>('accesos');

  return (
    <section className="relative py-8 pb-16 md:py-12 md:pb-16 overflow-hidden">
      <div className="container mx-auto px-6 relative">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          {/* Columna izquierda - Texto */}
          <div className="w-full lg:w-1/3 mb-12 lg:mb-0 text-left">
            <motion.h2
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-2xl md:text-3xl font-medium text-gray-700 mb-4 leading-snug"
            >
              {activeTab === 'accesos' && "Todo lo que necesitas, en un solo lugar."}
              {activeTab === 'pagos' && "El acceso inteligente empieza aquí."}
              {activeTab === 'reservas' && "Organiza tus espacios comunes sin complicaciones."}
              {activeTab === 'emergencias' && "La seguridad de tu familia, a un toque de distancia."}
            </motion.h2>
          </div>

          {/* Columna central - Solo la imagen */}
          <div className="w-full lg:w-1/3 flex justify-center mb-12 lg:mb-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="relative w-[280px] h-[560px]"
              >
                {activeTab === 'accesos' && (
                  <Image
                    src="/assets/HomeImg.webp"
                    alt="Pantalla principal de Zentry"
                    fill
                    sizes="280px"
                    className="object-cover rounded-[40px]"
                    loading="lazy"
                  />
                )}
                {activeTab === 'pagos' && (
                  <Image
                    src="/assets/QRImg.webp"
                    alt="Generación de códigos QR"
                    fill
                    sizes="280px"
                    className="object-cover rounded-[40px]"
                    loading="lazy"
                  />
                )}
                {activeTab === 'reservas' && (
                  <Image
                    src="/assets/ReservaImg.webp"
                    alt="Sistema de reservas"
                    fill
                    sizes="280px"
                    className="object-cover rounded-[40px]"
                    loading="lazy"
                  />
                )}
                {activeTab === 'emergencias' && (
                  <Image
                    src="/assets/PanicImg.webp"
                    alt="Botón de pánico y emergencias"
                    fill
                    sizes="280px"
                    className="object-cover rounded-[40px]"
                    loading="lazy"
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Columna derecha - Descripciones de venta */}
          <div className="w-full lg:w-1/3 pl-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                {activeTab === 'accesos' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800">Pantalla Principal</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Accede a todo lo que necesitas en un solo vistazo. Con un diseño moderno e intuitivo, Zentry reduce hasta en un 70% el tiempo de navegación, haciendo la administración más fácil que nunca.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium">
                        💡 <strong>Beneficio clave:</strong> Los residentes resuelven lo que buscan en segundos, sin perder tiempo.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'pagos' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800">Códigos QR Inteligentes</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Invitar a tus visitantes nunca fue tan sencillo. Genera códigos QR únicos e inmediatos que agilizan el acceso, eliminan filas en la caseta y garantizan seguridad total.
                    </p>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">
                        🚀 <strong>Beneficio clave:</strong> Zero esperas, máxima satisfacción para ti y tus invitados.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'reservas' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800">Sistema de Reservas</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Gestiona tus espacios comunes de forma inteligente. Con un solo toque, reservas áreas compartidas, evitas conflictos y aseguras un uso óptimo de cada espacio.
                    </p>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-800 font-medium">
                        ⏰ <strong>Beneficio clave:</strong> Más organización, menos discusiones y mayor disfrute para todos.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'emergencias' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800">Botón de Pánico</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Tu seguridad, a un toque de distancia. En caso de emergencia, el Botón de Pánico conecta al instante con seguridad y comparte tu ubicación exacta para una respuesta inmediata.
                    </p>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-red-800 font-medium">
                        🆘 <strong>Beneficio clave:</strong> Hasta 3 veces más rápido que los métodos tradicionales: salva vidas, protege hogares.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Tabs en la parte inferior */}
      <div className="mt-8 w-full flex justify-center">
        <div className="grid grid-cols-2 md:flex md:space-x-4 md:space-x-8 gap-2 md:gap-0 px-4 md:px-0">
          <button
            onClick={() => setActiveTab('accesos')}
            className={`font-medium rounded-full px-3 py-2 text-xs md:text-sm transition-colors ${activeTab === 'accesos'
                ? 'bg-gray-200 text-primary'
                : 'bg-white text-gray-500 shadow-sm hover:bg-gray-50'
              }`}
          >
            PANTALLA PRINCIPAL
          </button>
          <button
            onClick={() => setActiveTab('pagos')}
            className={`font-medium rounded-full px-3 py-2 text-xs md:text-sm transition-colors ${activeTab === 'pagos'
                ? 'bg-gray-200 text-primary'
                : 'bg-white text-gray-500 shadow-sm hover:bg-gray-50'
              }`}
          >
            CÓDIGOS QR
          </button>
          <button
            onClick={() => setActiveTab('reservas')}
            className={`font-medium rounded-full px-3 py-2 text-xs md:text-sm transition-colors ${activeTab === 'reservas'
                ? 'bg-gray-200 text-primary'
                : 'bg-white text-gray-500 shadow-sm hover:bg-gray-50'
              }`}
          >
            RESERVAS
          </button>
          <button
            onClick={() => setActiveTab('emergencias')}
            className={`font-medium rounded-full px-3 py-2 text-xs md:text-sm transition-colors ${activeTab === 'emergencias'
                ? 'bg-gray-200 text-primary'
                : 'bg-white text-gray-500 shadow-sm hover:bg-gray-50 border border-gray-100'
              }`}
          >
            BOTÓN DE PÁNICO
          </button>
        </div>
      </div>
    </section>
  );
};

export default BrowseForMeSection; 