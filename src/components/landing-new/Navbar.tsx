"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Link as ScrollLink, animateScroll as scroll } from 'react-scroll';




// Icono Mac/Windows
const MacIcon = () => (
  <svg className="ml-1.5 h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
    <path d="M11.182.008C10.148-.03 9.07.23 8.174.819c-.86.59-1.6 1.415-2.198 2.363-.718 1.185-1.125 2.47-1.125 3.763 0 1.46.44 2.818 1.213 3.935.663.96 1.586 1.75 2.67 2.237.995.45 2.08.64 3.135.53 1.185-.12 2.34-.7 3.283-1.536.89-.79 1.52-1.81 1.777-2.967a.37.37 0 0 0-.357-.44h-1.99a.38.38 0 0 1-.379-.33c-.11-.36-.28-.705-.498-1.028-.21-.31-.48-.58-.79-.798-.52-.36-1.1-.58-1.7-.67-.58-.09-1.17-.06-1.74.08-.57.13-1.12.39-1.61.75-.49.36-.91.8-1.26 1.3z"/>
  </svg>
);

// Icono de Mobile
const MobileIcon = () => (
  <svg className="ml-1.5 h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3.5" y="1" width="9" height="14" rx="2" />
    <path d="M8 12h.01" />
  </svg>
);

// Botón de Iniciar Sesión
const LoginButton = ({ isScrolled }: { isScrolled: boolean }) => {
  return (
    <Link 
      href="/login"
      className="w-[160px] h-[50px] bg-white rounded-2xl shadow-lg flex items-center justify-center border border-grayscale-100 hover:shadow-xl transition-all duration-300 hover:scale-105 group"
    >
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-grayscale-600 group-hover:text-blue-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        <span className="text-sm font-semibold text-grayscale-800 group-hover:text-blue-600 transition-colors duration-300">Iniciar Sesión</span>
      </div>
    </Link>
  );
};

const Navbar = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const heroSectionRef = useRef<HTMLElement | null>(null);

  const scrollToTop = () => {
    scroll.scrollToTop();
  };

  useEffect(() => {
    // Detectar si es móvil
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Encontrar la sección hero para calcular el progreso del scroll
    const heroSection = document.getElementById('inicio');
    if (heroSection) {
      heroSectionRef.current = heroSection;
    }

    const handleScroll = () => {
      // Si no tenemos referencia a la sección hero, usar un valor fijo
      if (!heroSectionRef.current) {
        setScrollProgress(window.scrollY > 100 ? 1 : window.scrollY / 100);
        return;
      }

      // Calcular altura total de la sección hero
      const heroHeight = heroSectionRef.current.offsetHeight;
      // Usar el 80% de la altura como punto para completar la transición
      const transitionPoint = heroHeight * 0.8;
      
      // Calcular el progreso del scroll (0 a 1)
      const progress = Math.min(window.scrollY / transitionPoint, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Ejecutar inmediatamente para establecer el estado inicial
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Determinar si debe mostrar el estilo completo de scroll
  const isScrolled = scrollProgress > 0.1;

  // Enlaces de navegación
  const navLinks = [
    { name: 'Inicio', to: 'inicio' },
    { name: 'Características', to: 'caracteristicas' },
    { name: 'Comparativa', to: 'comparativa' },
    { name: 'Funciones', to: 'funciones' },
    { name: 'FAQ', to: 'faq' }
  ];

  // Estilos dinámicos basados en el progreso del scroll
  const navbarStyle = {
    backgroundColor: 'transparent',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
    boxShadow: 'none',
    backgroundImage: scrollProgress > 0
      ? `linear-gradient(to bottom,
          rgba(176, 147, 240, ${Math.min(0.65, scrollProgress * 0.4)}),
          rgba(176, 147, 240, 0.05),
          rgba(176, 147, 240, 0.02),
          rgba(176, 147, 240, 0.01),
          transparent)`
      : 'none',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 100%',
  };

  // Estilos específicos para móvil
  const mobileNavbarStyle = {
    backgroundColor: '#2563eb', // bg-blue-600
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    boxShadow: 'none',
    backgroundImage: 'none',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 100%',
  };

  return (
    <nav 
      className="md:fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out"
      style={isMobile ? mobileNavbarStyle : navbarStyle}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="flex items-center h-28">
          {/* Logo y Nombre */} 
          <div className="flex-shrink-0 w-40">
            <button onClick={scrollToTop} className="flex items-center space-x-2.5 group">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center overflow-hidden transition-colors duration-300 ease-in-out ${isScrolled ? 'bg-primary' : 'md:bg-white/15 bg-white/20 group-hover:bg-white/30'}`}>
                <Image 
                  src="/assets/logo/zentry-logo.png"
                  alt="Zentry Logo"
                  width={28} 
                  height={28}
                  className="object-contain" 
                  priority
                />
              </div>
              <span className={`font-heading text-xl font-bold transition-colors duration-300 ease-in-out ${isScrolled ? 'text-text' : 'md:text-white text-white'}`}>
                Zentry
              </span>
            </button>
          </div>

          {/* Menu Items */} 
          <div className="hidden md:flex items-center justify-center flex-1 pl-8 space-x-10">
            {navLinks.map((link) => (
              <ScrollLink 
                key={link.name} 
                to={link.to}
                spy={true}
                smooth={true}
                duration={500}
                offset={-70}
                className={`
                  cursor-pointer flex items-center font-medium px-4 py-2 rounded-lg 
                  transition-all duration-300 ease-in-out
                  ${isScrolled 
                    ? 'text-grayscale-700 hover:text-primary hover:bg-grayscale-100/70' 
                      : 'text-white/90 hover:text-white hover:bg-white/10'}
                `}
                activeClass={`${isScrolled ? 'bg-grayscale-100/80 text-primary' : 'bg-white/15 text-white'}`}
              >
                {link.name}
              </ScrollLink>
            ))}
          </div>

          {/* Botón de Iniciar Sesión - Se oculta al hacer scroll */}
          <div className={`hidden md:flex items-center ml-auto transition-all duration-500 ease-in-out ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <LoginButton isScrolled={isScrolled} />
          </div>

          {/* Menu Hamburguesa (Mobile) */}
          <div className="md:hidden flex items-center ml-auto">
            <button 
              className={`p-2 rounded-lg transition-all duration-300 ease-in-out focus:outline-none text-white hover:bg-white/20`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil desplegable premium */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden bg-blue-600 border-t border-blue-500"
        >
          <div className="px-6 py-6 space-y-1">
            {navLinks.map((link, index) => (
              <div
                key={link.name}
                className="animate-fadeIn"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: 'both'
                }}
              >
                <ScrollLink
                  to={link.to}
                  spy={true}
                  smooth={true}
                  duration={500}
                  offset={-70}
                  className={`
                    block px-4 py-4 rounded-xl text-base font-semibold
                    transition-all duration-300 ease-in-out cursor-pointer
                    border border-transparent hover:border-white/20
                    text-white hover:text-white hover:bg-white/10
                  `}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center justify-between">
                    <span>{link.name}</span>
                    <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </ScrollLink>
              </div>
            ))}
            
            {/* Separador premium */}
            <div className="my-6">
              <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            </div>
            
            {/* Botón de login premium en móvil */}
            <div className="animate-fadeIn" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
              <Link 
                href="/login"
                className="block w-full text-center px-6 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Iniciar Sesión</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 