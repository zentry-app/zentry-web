import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Footer } from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header className="bg-background border-b">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">TramiteListo</h1>
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Optimiza tu Pensión IMSS
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Calcula y mejora tu pensión bajo la Ley 73 con nuestra plataforma especializada
            y asesoría personalizada.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="#features">
              <Button size="lg" className="gap-2">
                Conoce más <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#contact">
              <Button size="lg" variant="outline">
                Contáctanos
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-muted/50 py-20">
          {/* ... contenido existente de features ... */}
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          {/* ... contenido existente de CTA ... */}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted/50 py-12">
        <Footer />
      </footer>
    </div>
  );
}