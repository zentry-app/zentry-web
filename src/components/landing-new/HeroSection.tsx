"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Iconos SVG mejorados para las tiendas de aplicaciones
const AppleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" className="h-5 w-5">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
  </svg>
);

const GooglePlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="h-5 w-5">
    <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
  </svg>
);

// Componente de texto animado con degradado
const AnimatedWord = ({ words }: { words: string[] }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    
    if (!isDeleting) {
      // Escribiendo
      if (currentText.length < currentWord.length) {
        const timeout = setTimeout(() => {
          setCurrentText(currentWord.slice(0, currentText.length + 1));
        }, 80); // Más rápido
        return () => clearTimeout(timeout);
      } else {
        // Pausa antes de borrar
        const timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 1200); // Pausa más corta
        return () => clearTimeout(timeout);
      }
    } else {
      // Borrando
      if (currentText.length > 0) {
        const timeout = setTimeout(() => {
          setCurrentText(currentWord.slice(0, currentText.length - 1));
        }, 60); // Borrado más rápido
        return () => clearTimeout(timeout);
      } else {
        // Cambiar a la siguiente palabra
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }
    }
  }, [currentText, isDeleting, currentWordIndex, words]);

  return (
    <span className="inline-block">
      <span className="italic bg-gradient-to-r from-sky-300 via-blue-200 to-sky-400 bg-clip-text text-transparent font-semibold">
        {currentText}
      </span>
      <span className="animate-pulse text-sky-300">|</span>
    </span>
  );
};

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden flex items-center justify-center min-h-screen pt-32 pb-4 md:pt-40 md:pb-8 text-white">
      {/* Fondo con colores de marca Zentry */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800"></div>
      
      {/* Efecto spotlight con colores de marca */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/30 via-blue-600/20 to-transparent bg-[length:200%_200%] animate-gradient-x"></div>
      
      {/* Overlay adicional para reforzar el efecto en forma de V */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white"></div>
      
      {/* Contenido principal - Layout izquierda-derecha */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            
            {/* Columna izquierda - Texto */}
            <div className="text-center lg:text-left space-y-6 lg:space-y-8 flex flex-col items-center lg:items-start">
              {/* Headline */}
              <h1 className="font-heading font-bold">
                <span className="text-4xl md:text-5xl lg:text-6xl block leading-[1.1] tracking-tight text-white">
                  La forma más{' '}
                  <AnimatedWord words={['segura', 'moderna', 'eficiente', 'inteligente']} />
                  {' '}de administrar tu residencial.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-lg text-center lg:text-left">
                Zentry conecta administradores, caseta y residentes en una sola plataforma.
                <br />
                Accesos rápidos, pagos claros y comunicación en tiempo real.
              </p>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  href="https://apps.apple.com/app/id6740782605" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 bg-black text-white font-medium py-3 px-6 rounded-full transition-transform duration-200 ease-in-out hover:scale-105 shadow-md w-[280px] sm:w-[200px] h-[52px] group"
                  aria-label="Disponible en App Store"
                >
                  <span className="flex items-center justify-center bg-white text-black rounded-full p-1.5 w-7 h-7">
                    <AppleIcon />
                  </span>
                  <div className="flex flex-col items-center">
                    <span className="text-xs leading-tight">DISPONIBLE EN</span>
                    <span className="font-semibold text-base">App Store</span>
                  </div>
                </Link>
                
                <Link 
                  href="https://play.google.com/store/apps/details?id=com.gerardo.zentry" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 bg-black text-white font-medium py-3 px-6 rounded-full transition-transform duration-200 ease-in-out hover:scale-105 shadow-md w-[280px] sm:w-[200px] h-[52px] group"
                  aria-label="Disponible en Google Play"
                >
                  <span className="flex items-center justify-center w-7 h-7">
                    <GooglePlayIcon />
                  </span>
                  <div className="flex flex-col items-center">
                    <span className="text-xs leading-tight">DISPONIBLE EN</span>
                    <span className="font-semibold text-base">Google Play</span>
                  </div>
                </Link>
              </div>


            </div>

            {/* Columna derecha - Imagen Hero */}
            <div className="flex justify-center lg:justify-end order-first lg:order-last">
              <div className="relative">
                {/* Spotlight suave detrás de la imagen con colores de marca */}
                <div className="absolute inset-0 bg-gradient-radial from-blue-400/40 via-blue-500/20 to-transparent rounded-full blur-3xl scale-150"></div>
                
                {/* Imagen Hero con animación flotante */}
                <motion.div
                  className="relative z-10"
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Image 
                    src="/assets/HeroImage.webp"
                    alt="Zentry App"
                    width={1000}
                    height={1200}
                    className="w-[300px] sm:w-[400px] md:w-[500px] lg:w-[750px] xl:w-[850px] h-auto object-contain drop-shadow-2xl"
                    priority
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Difuminador inferior para conectar con la siguiente sección */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
    </section>
  );
};

export default HeroSection; 