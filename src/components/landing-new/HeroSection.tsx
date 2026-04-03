"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import StoreBadges from './StoreBadges';
import { InteractiveNebulaShader } from '../ui/InteractiveNebulaShader';



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
    <span className="inline-block min-w-[140px] md:min-w-[160px]">
      <span className="italic bg-gradient-to-r from-sky-300 via-blue-200 to-sky-400 bg-clip-text text-transparent font-semibold">
        {currentText}
      </span>
      <span className="animate-pulse text-sky-300">|</span>
    </span>
  );
};

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden flex items-center justify-center min-h-screen pt-24 pb-4 md:pt-32 md:pb-8 text-white">
      {/* Background — shader loads as part of initial bundle, no flash */}
      <div className="absolute inset-0 z-0">
        <InteractiveNebulaShader className="opacity-90" disableCenterDimming={true} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white" />
      </div>

      {/* Contenido principal - Layout izquierda-derecha */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">

            {/* Columna izquierda - Texto - min-height evita CLS por fuentes/animación */}
            <div className="text-center lg:text-left space-y-6 lg:space-y-8 flex flex-col items-center lg:items-start">
              {/* Headline */}
              <h1 className="font-heading font-bold min-h-[4.5rem] md:min-h-[5.5rem] lg:min-h-[6.5rem]">
                <span className="text-4xl md:text-5xl lg:text-6xl block leading-[1.1] tracking-tight text-white">
                  La <span className="text-sky-300">App Residencial</span> más{' '}
                  <AnimatedWord words={['segura', 'moderna', 'eficiente', 'inteligente']} />
                  {' '}para administrar tu comunidad.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-lg text-center lg:text-left">
                Zentry conecta administradores, caseta y residentes en una sola plataforma.
                <br />
                Accesos rápidos, pagos claros y comunicación en tiempo real.
              </p>

              {/* Botones */}
              <StoreBadges className="justify-center lg:justify-start" variant="dark" />


            </div>

            {/* Columna derecha - Imagen Hero */}
            <div className="flex justify-center lg:justify-end order-first lg:order-last">
              <div className="relative">
                {/* Spotlight suave detrás de la imagen con colores de marca */}
                <div className="absolute inset-0 bg-gradient-radial from-blue-400/40 via-blue-500/20 to-transparent rounded-full blur-3xl scale-150"></div>

                {/* Imagen Hero con animación flotante (CSS puro) */}
                <div className="relative z-10 animate-float">
                  <Image
                    src="/assets/HeroImage.webp"
                    alt="Zentry App - La mejor aplicación para residenciales"
                    width={600}
                    height={600}
                    sizes="(max-width: 640px) 300px, (max-width: 768px) 400px, (max-width: 1024px) 500px, (max-width: 1280px) 750px, 850px"
                    className="w-[300px] sm:w-[400px] md:w-[500px] lg:w-[750px] xl:w-[850px] h-auto object-contain drop-shadow-2xl"
                    priority
                  />
                </div>
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