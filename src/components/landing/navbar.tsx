"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { scrollToSection } from "@/lib/scroll-utils";
import { colors } from "@/lib/colors";

const navigation = [
  { name: "Características", href: "#caracteristicas" },
  { name: "Cómo funciona", href: "#como-funciona" },
  { name: "Precios", href: "#precios" },
  { name: "Testimonios", href: "#testimonios" },
  { name: "Contacto", href: "#contacto" },
];

export function Navbar() {
  const [activeSection, setActiveSection] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      // Suavizar la transición del navbar
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 20);

      // Detectar dirección del scroll para animaciones
      const scrollingDown = currentScrollY > lastScrollY;
      lastScrollY = currentScrollY;

      // Detectar sección activa con un pequeño debounce
      const sections = navigation.map(nav => nav.href.replace("#", ""));
      const scrollPosition = currentScrollY + 100;

      // Encontrar la sección más cercana al viewport
      let minDistance = Infinity;
      let closestSection = "";

      sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
          const { top } = element.getBoundingClientRect();
          const distance = Math.abs(top - 100); // 100px offset
          if (distance < minDistance) {
            minDistance = distance;
            closestSection = section;
          }
        }
      });

      if (closestSection && closestSection !== activeSection) {
        setActiveSection(closestSection);
      }
    };

    const throttledScroll = throttle(handleScroll, 100);
    window.addEventListener("scroll", throttledScroll);
    return () => window.removeEventListener("scroll", throttledScroll);
  }, [activeSection]);

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      initial={{ y: -100 }}
      animate={{ 
        y: 0,
        backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0)",
        backdropFilter: isScrolled ? "blur(10px)" : "blur(0px)",
        borderBottom: isScrolled ? `1px solid ${colors.primary[100]}` : "1px solid transparent"
      }}
      transition={{ type: "spring", stiffness: 50, damping: 15 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary-50/50 via-transparent to-accent-50/50 opacity-50" />
      
      <nav className="container mx-auto px-4 relative">
        <div className="flex h-16 items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Link href="/" className="font-bold text-2xl bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
              ZENTRY
            </Link>
          </motion.div>

          <div className="hidden md:flex md:gap-x-8">
            {navigation.map((item) => (
              <div key={item.name} className="relative">
                <motion.button
                  onClick={() => scrollToSection(item.href.replace("#", ""))}
                  className={`text-sm py-1 transition-colors ${
                    activeSection === item.href.replace("#", "") 
                      ? "text-primary-600 font-medium" 
                      : "text-muted-foreground hover:text-primary-500"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {item.name}
                </motion.button>
                <AnimatePresence>
                  {activeSection === item.href.replace("#", "") && (
                    <motion.div
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500"
                      layoutId="activeSection"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </nav>
    </motion.header>
  );
}

// Utilidad para throttle usando arrow functions
const throttle = (func: (...args: any[]) => void, limit: number) => {
  let inThrottle = false;
  
  return (...args: any[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}; 