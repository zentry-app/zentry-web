"use client";

import Navbar from "@/components/landing-new/Navbar";
import HeroSection from "@/components/landing-new/HeroSection";
import BrowseForMeSection from "@/components/landing-new/BrowseForMeSection";
import ComparisonSection from "@/components/landing-new/ComparisonSection";
import FeatureCarousel from "@/components/landing-new/FeatureCarousel";
import FAQSection from "@/components/landing-new/FAQSection";
import Footer from "@/components/landing-new/Footer";
import AudienceSection from "@/components/landing-new/AudienceSection";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* El navbar debe estar fuera de cualquier contenedor para posicionarse correctamente */}
      <Navbar />
      
      {/* Contenedor principal */}
      <main>
        {/* Hero section con efecto spotlight/cono */}
        <section id="inicio">
        <HeroSection />
        </section>
        
                {/* Contenido con fondo blanco - sin z-index ni margin-top para una transición perfecta */}
        <div className="relative bg-white">
          {/* Sección Para quién es Zentry */}
          <section id="audiencia">
            <AudienceSection />
          </section>

          {/* Sección Arc Search contenida en un contenedor redondeado */}
          <section id="caracteristicas">
          <div className="relative mx-4 md:mx-8 xl:mx-auto max-w-7xl mt-8 mb-16 md:mt-16 md:mb-24 bg-gradient-to-b from-white via-white to-purple-50/40 overflow-hidden rounded-[40px] shadow-lg">
            {/* Browse for Me Section con pestañas interactivas */}
            <BrowseForMeSection />
            </div>
          </section>
          
          <section id="comparativa">
          <ComparisonSection />
          </section>
          
          <section id="funciones">
          <FeatureCarousel />
          </section>
          
          <section id="faq">
          <FAQSection />
        </section>
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
