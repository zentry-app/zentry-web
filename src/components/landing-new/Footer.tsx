'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Facebook, ArrowUpRight, Globe } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Producto',
      links: [
        { name: 'Precios', href: '/precios' },
        { name: 'Seguridad', href: '/seguridad' },
      ]
    },
    {
      title: 'Empresa',
      links: [
        { name: 'Acerca de Zentry', href: '/acerca-de' },
        { name: 'Blog', href: '/blog' },
        { name: 'Contacto', href: '/contacto' },
        { name: 'Soporte', href: '/soporte' },
      ]
    }
  ];

  const socialLinks = [
    { icon: Facebook, href: 'https://www.facebook.com/people/Zentry/61576673336847/', label: 'Facebook' },
  ];

  const legalLinks = [
    { name: 'Privacidad', href: '/privacy' },
    { name: 'Términos', href: '/terms' },
    { name: 'Cookies', href: '/cookies-y-cumplimiento' },
  ];

  return (
    <footer className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white pt-16 pb-8 overflow-hidden">
      {/* Subtle Texture Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-5 space-y-6">
            <Link href="/" className="inline-block">
              <motion.div whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                <Image
                  src="/assets/logo/zentry-logo-new.png"
                  alt="Zentry Logo"
                  width={90}
                  height={32}
                  sizes="130px"
                  className="object-contain brightness-0 invert"
                  loading="lazy"
                />
              </motion.div>
            </Link>
            <p className="text-blue-100/80 text-sm leading-relaxed max-w-sm">
              La plataforma líder en administración residencial. Seguridad, transparencia y eficiencia en un solo lugar.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3, backgroundColor: 'rgba(255,255,255,0.15)' }}
                  className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center transition-colors text-white/80 hover:text-white"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              {footerLinks.map((column) => (
                <div key={column.title} className="space-y-5">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                    {column.title}
                  </h3>
                  <ul className="space-y-3">
                    {column.links.map((link) => (
                      <li key={link.name}>
                        <Link
                          href={link.href}
                          className="text-white/80 hover:text-white transition-colors text-sm font-medium inline-block"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Specialized Contact Column */}
              <div className="space-y-5">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                  Legal
                </h3>
                <ul className="space-y-3">
                  {legalLinks.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-white/80 hover:text-white transition-colors text-sm font-medium inline-block"
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

        {/* Bottom Bar Compact */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-blue-100/60 font-medium">
            <span>© {currentYear} Zentry Tech Group.</span>
            <span className="hidden sm:inline">•</span>
            <span>Hecho con precisión.</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs text-blue-100/60 font-medium">
              <Globe className="w-3 h-3" />
              <span>México</span>
            </div>
            <motion.button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.2)' }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all"
            >
              <ArrowUpRight className="w-4 h-4 -rotate-45" />
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

