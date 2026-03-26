import dynamic from "next/dynamic";
import Navbar from "@/components/landing-new/Navbar";
import HeroSection from "@/components/landing-new/HeroSection";
import Footer from "@/components/landing-new/Footer";

// Lazy load componentes no críticos para mejorar FCP y LCP
const BrowseForMeSection = dynamic(() => import("@/components/landing-new/BrowseForMeSection"), {
  loading: () => <div className="min-h-[400px] animate-pulse bg-gray-100" />,
});

const ComparisonSection = dynamic(() => import("@/components/landing-new/ComparisonSection"), {
  loading: () => <div className="min-h-[400px] animate-pulse bg-gray-100" />,
});

const FeatureCarousel = dynamic(() => import("@/components/landing-new/FeatureCarousel"), {
  loading: () => <div className="min-h-[400px] animate-pulse bg-gray-100" />,
});

const FAQSection = dynamic(() => import("@/components/landing-new/FAQSection"), {
  loading: () => <div className="min-h-[400px] animate-pulse bg-gray-100" />,
});

const AudienceSection = dynamic(() => import("@/components/landing-new/AudienceSection"), {
  loading: () => <div className="min-h-[400px] animate-pulse bg-gray-100" />,
});

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Zentry",
    "operatingSystem": "Web, iOS, Android",
    "applicationCategory": "BusinessApplication, LifestyleApplication",
    "description": "Zentry es la plataforma integral para la administración y seguridad de residenciales.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "120"
    },
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "MXN"
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
