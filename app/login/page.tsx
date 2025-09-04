import { LoginForm } from '@/components/auth/login-form';
import { type Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Iniciar Sesión | Zentry',
  description: 'Inicia sesión en Zentry para acceder a todas las funcionalidades.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 relative">
      {/* Botón para regresar (visible en todas las pantallas) */}
      <Button 
        variant="ghost" 
        size="icon" 
        asChild 
        className="absolute top-4 left-4 z-50"
      >
        <Link href="/" aria-label="Regresar a inicio">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>

      {/* Panel de Branding/Imagen (Primero en móvil, a la izquierda en LG) */}
      <div className="order-1 lg:order-1 lg:col-span-1 flex flex-col items-center justify-center relative overflow-hidden bg-premium dark:from-slate-800 dark:via-slate-900 dark:to-black p-6 sm:p-12">
        <div className="w-full max-w-md xl:max-w-lg space-y-6 sm:space-y-8 text-center lg:text-left">
          {/* Logo y Zentry de esta sección ELIMINADOS */}
          
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Gestión y Seguridad Residencial, Simplificada.
            </h2>
            <p className="text-md sm:text-lg text-muted-foreground">
              Tu tranquilidad es nuestra prioridad. Accede a Zentry para una experiencia de administración residencial moderna y segura.
            </p>
          </div>

          {/* Imagen decorativa */}
          <div className="relative w-full mt-6 sm:mt-8 flex justify-center items-center">
            <Image
              src="/images/Login.png"
              alt="Plataforma Zentry en acción"
              width={450} // Ajustado para mejor proporción y espacio
              height={360}
              className="object-contain max-w-xs sm:max-w-sm md:max-w-md lg:max-w-none"
              priority // Cargar esta imagen con prioridad ya que es LCP en esta vista
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 rounded-xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/5 shadow-[0_10px_40px_-12px_rgba(0,0,0,.25)] mt-6 sm:mt-8">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <ShieldCheck className="h-7 w-7 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                {/* <p className="text-xl font-bold text-blue-700">+10,000</p> */}
                <p className="text-sm text-muted-foreground">Transformando la forma de gestionar residenciales</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:gap-3">
              <Clock className="h-7 w-7 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-400">24/7</p>
                <p className="text-sm text-muted-foreground">Monitoreo en tiempo real</p>
              </div>
            </div>
          </div>
        </div>
        {/* Patrón decorativo solo para LG y superior */}
        <div className="hidden lg:block absolute inset-0 bg-[url('/images/grid.svg')] opacity-10 dark:opacity-5 -z-10" /> 
      </div>

      {/* Panel de Login (Segundo en móvil, a la derecha en LG) */}
      <div className="order-2 lg:order-2 lg:col-span-1 flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="space-y-2 text-center">
            <div className="flex justify-center mb-4 sm:mb-6">
              <Image 
                src="/images/logos/Logo version azul.png" 
                alt="Zentry Logo"
                width={80} // Reducido un poco para móvil, era 100
                height={80}
                className="h-20 w-auto" // Reducido un poco, era h-24
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Bienvenido a Zentry
            </h1>
            <p className="text-sm text-muted-foreground">
              Accede a tu residencial de forma inteligente y segura.
            </p>
          </div>

          <LoginForm />

          <div className="space-y-4 pt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  ¿No tienes una cuenta?
                </span>
              </div>
            </div>
            <div className="text-center">
              <Link 
                href="/register" 
                className="font-medium text-primary hover:text-primary/80 hover:underline underline-offset-4"
              >
                Regístrate aquí
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 