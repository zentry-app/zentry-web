'use client';

import { LoginForm } from '@/components/auth/login-form';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function LoginPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Imagen de fondo con overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/LoginBG.png"
          alt="Zentry Background"
          fill
          priority
          className="object-cover"
          quality={90}
        />
        {/* Overlay oscuro elegante con gradiente - Más oscuro en móvil */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/75 to-black/85 md:from-black/70 md:via-black/60 md:to-black/80" />
        {/* Overlay azul sutil de la marca */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
      </div>

      {/* Botón para regresar - Optimizado para móvil */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 left-4 md:top-6 md:left-6 z-50"
      >
        <Button 
          variant="ghost" 
          size="icon" 
          asChild 
          className="h-9 w-9 md:h-10 md:w-10 backdrop-blur-sm bg-white/10 hover:bg-white/20 text-white border border-white/20"
        >
          <Link href="/" aria-label="Regresar a inicio">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </motion.div>

      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-16 items-center">
          
          {/* Panel izquierdo - Branding (Oculto en móvil, visible desde md) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="hidden md:block space-y-6 lg:space-y-8 text-white"
          >
            {/* Logo animado */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <Image 
                src="/assets/logo/ZentryLogo.png" 
                alt="Zentry Logo"
                width={200}
                height={67}
                className="h-14 lg:h-16 w-auto brightness-0 invert"
                priority
              />
            </motion.div>

            {/* Título principal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="space-y-3 lg:space-y-4"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight">
                Gestión Residencial
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary">
                  {' '}Inteligente
                </span>
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-white/90 leading-relaxed max-w-lg">
                Transforma la administración de tu residencial con tecnología de vanguardia. 
                Seguridad, eficiencia y control en un solo lugar.
              </p>
            </motion.div>

            {/* Features destacadas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 pt-2 lg:pt-4"
            >
              <div className="flex items-start gap-2.5 lg:gap-3 p-3 lg:p-4 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="p-1.5 lg:p-2 rounded-lg bg-primary/20 flex-shrink-0">
                  <ShieldCheck className="h-4 w-4 lg:h-5 lg:w-5 text-primary-300" />
                </div>
                <div>
                  <p className="font-semibold text-white mb-0.5 lg:mb-1 text-sm lg:text-base">Seguridad Avanzada</p>
                  <p className="text-xs lg:text-sm text-white/80">Encriptación de nivel empresarial</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 lg:gap-3 p-3 lg:p-4 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="p-1.5 lg:p-2 rounded-lg bg-primary/20 flex-shrink-0">
                  <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-primary-300" />
                </div>
                <div>
                  <p className="font-semibold text-white mb-0.5 lg:mb-1 text-sm lg:text-base">Monitoreo 24/7</p>
                  <p className="text-xs lg:text-sm text-white/80">Control en tiempo real</p>
                </div>
              </div>
            </motion.div>

            {/* Elementos decorativos animados */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="flex items-center gap-2 pt-2 lg:pt-4"
            >
              <Sparkles className="h-4 w-4 lg:h-5 lg:w-5 text-primary-300 animate-pulse" />
              <span className="text-xs lg:text-sm text-white/70">Plataforma certificada y confiable</span>
            </motion.div>
          </motion.div>

          {/* Panel derecho - Formulario de Login */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex justify-center lg:justify-end w-full"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="w-full max-w-[440px]"
            >
              {/* Card del formulario con glassmorphism */}
              <div className="relative">
                {/* Efecto de brillo animado - Reducido en móvil */}
                <motion.div
                  className="absolute -inset-0.5 bg-gradient-to-r from-primary via-primary-300 to-primary rounded-xl md:rounded-2xl opacity-15 md:opacity-20 blur-lg md:blur-xl"
                  animate={{
                    opacity: [0.15, 0.25, 0.15],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                <div className="relative backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 rounded-xl md:rounded-2xl border border-white/20 shadow-2xl p-5 sm:p-6 md:p-8 lg:p-10">
                  {/* Logo pequeño en el card - Más pequeño en móvil */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.6 }}
                    className="flex justify-center mb-4 sm:mb-5 md:mb-6"
                  >
                    <Image 
                      src="/assets/logo/ZentryLogo.png" 
                      alt="Zentry Logo"
                      width={160}
                      height={53}
                      className="h-10 sm:h-11 md:h-12 w-auto"
                    />
                  </motion.div>

                  {/* Título del formulario - Ajustado para móvil */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="text-center mb-6 sm:mb-7 md:mb-8 space-y-1.5 sm:space-y-2"
                  >
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                      Bienvenido de nuevo
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Inicia sesión para continuar
                    </p>
                  </motion.div>

                  {/* Formulario */}
                  <LoginForm />

                  {/* Footer del formulario - Compacto en móvil */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.9 }}
                    className="mt-4 sm:mt-5 md:mt-6 space-y-3 sm:space-y-4 pt-4 sm:pt-5 md:pt-6 border-t"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
                        <span className="bg-white dark:bg-gray-900 px-2 text-muted-foreground">
                          ¿No tienes una cuenta?
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <Link 
                        href="/register" 
                        className="text-sm sm:text-base font-medium text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-colors"
                      >
                        Regístrate aquí
                      </Link>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 