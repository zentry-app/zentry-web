"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Link as ScrollLink, animateScroll as scroll } from 'react-scroll';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { UserRole } from '@/types/models';




// Icono Mac/Windows
const MacIcon = () => (
  <svg className="ml-1.5 h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
    <path d="M11.182.008C10.148-.03 9.07.23 8.174.819c-.86.59-1.6 1.415-2.198 2.363-.718 1.185-1.125 2.47-1.125 3.763 0 1.46.44 2.818 1.213 3.935.663.96 1.586 1.75 2.67 2.237.995.45 2.08.64 3.135.53 1.185-.12 2.34-.7 3.283-1.536.89-.79 1.52-1.81 1.777-2.967a.37.37 0 0 0-.357-.44h-1.99a.38.38 0 0 1-.379-.33c-.11-.36-.28-.705-.498-1.028-.21-.31-.48-.58-.79-.798-.52-.36-1.1-.58-1.7-.67-.58-.09-1.17-.06-1.74.08-.57.13-1.12.39-1.61.75-.49.36-.91.8-1.26 1.3z" />
  </svg>
);

// Icono de Mobile
const MobileIcon = () => (
  <svg className="ml-1.5 h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3.5" y="1" width="9" height="14" rx="2" />
    <path d="M8 12h.01" />
  </svg>
);

// Botón de Iniciar Sesión Premium
const LoginButton = ({ isScrolled }: { isScrolled: boolean }) => {
  return (
    <Link
      href="/login"
      className={`
        relative group flex items-center justify-center
        overflow-hidden rounded-2xl transition-all duration-500
        w-[160px] h-[48px] border
        ${isScrolled
          ? 'bg-white/10 backdrop-blur-md border-[#0070FF]/20 text-[#0070FF] shadow-sm hover:shadow-[#0070FF]/10'
          : 'bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20'}
      `}
    >
      <div className="flex items-center space-x-2.5 z-10 transition-transform duration-300 group-hover:scale-105">
        <svg
          className={`w-5 h-5 transition-colors duration-300 ${isScrolled ? 'text-[#0070FF]' : 'text-white'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        <span className="text-sm font-bold tracking-tight">Iniciar Sesión</span>
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine transition-transform duration-1000" />

      {/* Inner Glow when scrolled */}
      {isScrolled && (
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#0070FF]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </Link>
  );
};

const Navbar = ({ forceScrolled: propForceScrolled = false }: { forceScrolled?: boolean }) => {
  // Performance Optimization: Use boolean state instead of continuous number to prevent re-renders on every pixel
  const [isScrolledState, setIsScrolledState] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { user, userData } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isScrolled = propForceScrolled || isScrolledState;

  const scrollToTop = () => {
    scroll.scrollToTop();
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const handleScroll = () => {
      // Use a simple threshold of 50px instead of calculating element height every frame
      // This is much faster and cleaner for the browser
      const shouldBeScrolled = window.scrollY > 50;

      setIsScrolledState(prev => {
        if (prev !== shouldBeScrolled) {
          return shouldBeScrolled;
        }
        return prev;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);


  // Enlaces de navegación
  const navLinks = [
    { name: 'Inicio', to: 'inicio', isScroll: true },
    { name: 'Características', to: 'caracteristicas', isScroll: true },
    { name: 'Comparativa', to: 'comparativa', isScroll: true },
    { name: 'Funciones', to: 'funciones', isScroll: true },
    { name: 'Blog', href: '/blog' },
    { name: 'FAQ', to: 'faq', isScroll: true }
  ];

  // Estilos dinámicos unificados para móvil y escritorio
  const currentNavbarStyle = {
    backgroundColor: isScrolled
      ? 'rgba(255, 255, 255, 0.85)'
      : 'transparent',
    backdropFilter: isScrolled
      ? 'blur(16px) saturate(180%)'
      : 'blur(0px)',
    WebkitBackdropFilter: isScrolled
      ? 'blur(16px) saturate(180%)'
      : 'blur(0px)',
    boxShadow: isScrolled
      ? '0 10px 30px -10px rgba(0, 0, 0, 0.1), 0 1px 0 0 rgba(255, 255, 255, 0.1) inset'
      : 'none',
    border: isScrolled
      ? '1px solid rgba(255, 255, 255, 0.3)'
      : '1px solid transparent',
    height: isScrolled ? '64px' : '96px',
    // Arreglo para móvil: No dejar espacio arriba si es móvil para evitar la cinta blanca
    marginTop: isScrolled ? (isMobile ? '0px' : '12px') : '0px',
    // Si no tiene margen arriba, no necesitamos tanto redondeado arriba en móvil
    borderRadius: isScrolled ? (isMobile ? '0 0 24px 24px' : '24px') : '0px',
    width: isScrolled ? (isMobile ? '100%' : '90%') : '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out"
      style={currentNavbarStyle}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 h-full relative z-10">
        <div className="flex items-center h-full">
          {/* Logo y Nombre */}
          <div className="flex-shrink-0">
            <motion.button
              whileHover="hover"
              whileTap="tap"
              onClick={() => {
                if (pathname === '/') {
                  scrollToTop();
                } else {
                  if (user && userData) {
                    const dashboardPath = userData.role === UserRole.Guard ? '/dashboard/ingresos' : '/dashboard';
                    router.push(dashboardPath);
                  } else {
                    router.push('/');
                  }
                }
              }}
              className="relative flex items-center group focus:outline-none"
            >
              {/* Premium Background Glow Effect */}
              <motion.div
                variants={{
                  hover: { scale: 1.5, opacity: 0.15, filter: 'blur(20px)' },
                  tap: { scale: 1, opacity: 0 }
                }}
                className={`absolute inset-0 rounded-full transition-colors duration-500 ${isScrolled ? 'bg-[#0070FF]' : 'bg-white'} opacity-0`}
              />

              <motion.div
                variants={{
                  hover: { y: -2, scale: 1.05 },
                  tap: { y: 1, scale: 0.95 }
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`relative transition-all duration-500 ease-in-out ${isScrolled ? 'scale-90' : (pathname === '/' ? 'scale-100 brightness-0 invert' : 'scale-100')}`}
              >
                <div className="relative overflow-hidden rounded-sm">
                  <Image
                    src="/assets/logo/zentry-logo-new.png"
                    alt="Zentry Logo"
                    width={90}
                    height={32}
                    sizes="90px"
                    className="object-contain h-8 w-auto relative z-10"
                    priority
                  />

                  {/* Premium Shine Sweep Overlay */}
                  <motion.div
                    variants={{
                      hover: { x: ['-100%', '200%'] }
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      repeatDelay: 2,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-20 z-20 pointer-events-none"
                  />
                </div>
              </motion.div>
            </motion.button>
          </div>

          {/* Menu Items */}
          <div className="hidden md:flex items-center justify-center flex-1 space-x-2">
            {navLinks.map((link) => (
              pathname === '/' && link.isScroll ? (
                <ScrollLink
                  key={link.name}
                  to={link.to!}
                  spy={true}
                  smooth={true}
                  duration={500}
                  offset={-70}
                  className={`
                    cursor-pointer flex items-center font-semibold px-4 py-2 rounded-xl
                    transition-all duration-300 ease-in-out text-sm tracking-tight
                    ${isScrolled
                      ? 'text-grayscale-600 hover:text-[#0070FF] hover:bg-blue-50/50'
                      : 'text-white/80 hover:text-white hover:bg-white/10'}
                  `}
                  activeClass={isScrolled ? 'text-[#0070FF] bg-blue-50/80 shadow-[0_0_0_1px_rgba(0,112,255,0.1)]' : 'text-white bg-white/20'}
                >
                  {link.name}
                </ScrollLink>
              ) : (
                <Link
                  key={link.name}
                  href={link.href || `/#${link.to}`}
                  className={`
                    cursor-pointer flex items-center font-semibold px-4 py-2 rounded-xl
                    transition-all duration-300 ease-in-out text-sm tracking-tight
                    ${isScrolled
                      ? 'text-grayscale-600 hover:text-[#0070FF] hover:bg-blue-50/50'
                      : 'text-white/80 hover:text-white hover:bg-white/10'}
                  `}
                >
                  {link.name}
                </Link>
              )
            ))}
          </div>

          {/* Botón de Iniciar Sesión - Se oculta al hacer scroll */}
          <div className={`hidden md:flex items-center ml-auto transition-all duration-500 ease-in-out ${isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <LoginButton isScrolled={isScrolled} />
          </div>

          {/* Menu Hamburguesa (Mobile) */}
          <div className="md:hidden flex items-center ml-auto">
            <button
              className={`p-2 rounded-lg transition-all duration-300 ease-in-out focus:outline-none ${mobileMenuOpen || isScrolled ? 'text-grayscale-700 hover:bg-grayscale-100' : 'text-white hover:bg-white/20'
                }`}
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
          className="md:hidden bg-white/95 backdrop-blur-2xl border-t border-grayscale-100 shadow-2xl mt-2 rounded-3xl overflow-hidden mx-3"
        >
          <div className="px-6 py-6 space-y-1">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {pathname === '/' && link.isScroll ? (
                  <ScrollLink
                    to={link.to!}
                    spy={true}
                    smooth={true}
                    duration={500}
                    offset={-70}
                    className={`
                      block px-4 py-4 rounded-xl text-base font-semibold
                      transition-all duration-300 ease-in-out cursor-pointer
                      border border-transparent hover:border-grayscale-200
                      text-grayscale-800 hover:text-[#0070FF] hover:bg-grayscale-50
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
                ) : (
                  <Link
                    href={link.href || `/#${link.to}`}
                    className={`
                      block px-4 py-4 rounded-xl text-base font-semibold
                      transition-all duration-300 ease-in-out cursor-pointer
                      border border-transparent hover:border-grayscale-200
                      text-grayscale-800 hover:text-[#0070FF] hover:bg-grayscale-50
                    `}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{link.name}</span>
                      <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                )}
              </motion.div>
            ))}

            {/* Separador premium */}
            <div className="my-6 px-4">
              <div className="h-px bg-gradient-to-r from-transparent via-grayscale-200 to-transparent"></div>
            </div>

            {/* Botón de login premium en móvil */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link
                href="/login"
                className="block w-full text-center px-6 py-4 bg-[#0070FF] text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Iniciar Sesión</span>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 