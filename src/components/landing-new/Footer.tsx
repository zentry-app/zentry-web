import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  const productLinks = [
    { name: 'Características', href: '/caracteristicas' },
    { name: 'Precios', href: '/precios' },
    { name: 'Seguridad', href: '/seguridad' },
    { name: 'Integraciones', href: '/integraciones' },
    { name: 'API', href: '/api' },
    { name: 'Actualizaciones', href: '/actualizaciones' },
  ];

  const resourceLinks = [
    { name: 'Centro de Ayuda', href: '/ayuda' },
    { name: 'Documentación', href: '/documentacion' },
    { name: 'Blog', href: '/blog' },
    { name: 'Casos de Éxito', href: '/casos-exito' },
    { name: 'Comunidad', href: '/comunidad' },
  ];

  const companyLinks = [
    { name: 'Acerca de Zentry', href: '/acerca-de' },
    { name: 'Contacto', href: '/contacto' },
    { name: 'Soporte', href: '/soporte' },
    { name: 'Trabaja con Nosotros', href: '/trabaja-con-nosotros' },
  ];

  const legalLinks = [
    { name: 'Política de Privacidad', href: '/privacy' },
    { name: 'Términos de Servicio', href: '/terms' },
    { name: 'Cookies', href: '/cookies' },
    { name: 'Cumplimiento', href: '/cumplimiento' },
  ];

  return (
    <footer className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white py-8 md:py-12 overflow-hidden">
      {/* Textura granulada con SVG en línea para mayor compatibilidad */}
      <div 
        className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none" 
      >
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" version="1.1">
          <defs>
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>
          <rect width="100%" height="100%" filter="url(#noise)" opacity="0.5" />
        </svg>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header con firma de compañía */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 text-center md:text-left">
          <div className="text-white font-heading text-sm mb-4 md:mb-0">
            <p className="uppercase tracking-wider font-bold">ZENTRY</p>
            <p className="italic text-blue-100">Administración Inteligente de Residenciales</p>
          </div>
          
          <div className="text-white font-heading text-xs">
            <p className="uppercase tracking-wider font-bold">LA PLATAFORMA</p>
            <p className="italic text-blue-100">que transforma residenciales</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Columna izquierda - Logo, descripción y enlaces principales */}
          <div className="text-center md:text-left">
            <div className="mb-4">
              <Link href="/" className="inline-block">
                <Image 
                  src="/assets/logo/zentry-logo.png"
                  alt="Zentry Logo"
                  width={80} 
                  height={32}
                  className="object-contain" 
                />
              </Link>
            </div>
            <p className="text-blue-100 text-sm leading-relaxed mb-4">
              La plataforma integral que simplifica la administración de residenciales con transparencia, seguridad y eficiencia.
            </p>
            <div className="flex justify-center md:justify-start space-x-4 mb-6">
              <a href="#" className="text-blue-100 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-blue-100 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                </svg>
              </a>
              <a href="#" className="text-blue-100 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>

            {/* Enlaces principales en dos columnas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-white uppercase text-xs font-bold mb-3 tracking-wider">PRODUCTO</h3>
                <ul className="space-y-1">
                  {productLinks.slice(0, 3).map((link) => (
                    <li key={link.name}>
                      <Link 
                        href={link.href}
                        className="text-blue-100 hover:text-white transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-white uppercase text-xs font-bold mb-3 tracking-wider">RECURSOS</h3>
                <ul className="space-y-1">
                  {resourceLinks.slice(0, 3).map((link) => (
                    <li key={link.name}>
                      <Link 
                        href={link.href}
                        className="text-blue-100 hover:text-white transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Columna derecha - Enlaces adicionales y empresa */}
          <div className="text-center md:text-left">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-white uppercase text-xs font-bold mb-3 tracking-wider">EMPRESA</h3>
                <ul className="space-y-1">
                  {companyLinks.map((link) => (
                    <li key={link.name}>
                      <Link 
                        href={link.href}
                        className="text-blue-100 hover:text-white transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-white uppercase text-xs font-bold mb-3 tracking-wider">MÁS</h3>
                <ul className="space-y-1">
                  {productLinks.slice(3).map((link) => (
                    <li key={link.name}>
                      <Link 
                        href={link.href}
                        className="text-blue-100 hover:text-white transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                  {resourceLinks.slice(3).map((link) => (
                    <li key={link.name}>
                      <Link 
                        href={link.href}
                        className="text-blue-100 hover:text-white transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-blue-500 pt-4 md:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-blue-100 text-sm text-center md:text-left">
              © 2024 Zentry. Todos los derechos reservados.
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-6">
              {legalLinks.map((link) => (
                <Link 
                  key={link.name}
                  href={link.href}
                  className="text-blue-100 hover:text-white transition-colors text-sm"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 