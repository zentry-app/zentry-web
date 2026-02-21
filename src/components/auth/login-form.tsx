"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, ShieldAlert, Shield, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoginForm() {
  const { loginWithEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await loginWithEmail(formData.email, formData.password);
      toast.success('Inicio de sesión exitoso');
    } catch (error) {
      console.error('Error en login:', error);
      toast.error('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = formData.email.includes('@') && formData.email.includes('.');
  const isValidPassword = formData.password.length >= 6;

  return (
    <motion.div 
      className="space-y-4 sm:space-y-5 md:space-y-6" 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Campo de Email */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.9 }}
          className="space-y-1.5 sm:space-y-2"
        >
          <Label htmlFor="email" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2">
            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            Correo electrónico
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              required
              className={cn(
                "h-11 sm:h-12 pl-10 sm:pl-11 pr-9 sm:pr-10 text-sm sm:text-base transition-all duration-300",
                focusedField === 'email' && "ring-2 ring-primary/50 border-primary/50",
                isValidEmail && formData.email && "border-green-500/50"
              )}
              disabled={isLoading}
            />
            <Mail className={cn(
              "absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors duration-300",
              focusedField === 'email' ? "text-primary" : "text-muted-foreground",
              isValidEmail && formData.email && "text-green-500"
            )} />
            <AnimatePresence>
              {isValidEmail && formData.email && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Campo de Contraseña */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 1 }}
          className="space-y-1.5 sm:space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password" className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2">
              <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              Contraseña
            </Label>
            <Button 
              type="button"
              variant="link" 
              className="px-0 font-normal h-auto text-[10px] sm:text-xs text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
            >
              ¿Olvidaste?
            </Button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              required
              className={cn(
                "h-11 sm:h-12 pl-10 sm:pl-11 pr-10 sm:pr-11 text-sm sm:text-base transition-all duration-300",
                focusedField === 'password' && "ring-2 ring-primary/50 border-primary/50",
                isValidPassword && formData.password && "border-green-500/50"
              )}
              disabled={isLoading}
            />
            <Lock className={cn(
              "absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors duration-300",
              focusedField === 'password' ? "text-primary" : "text-muted-foreground",
              isValidPassword && formData.password && "text-green-500"
            )} />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </button>
            <AnimatePresence>
              {isValidPassword && formData.password && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute right-9 sm:right-10 top-1/2 -translate-y-1/2"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Botón de Submit */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.1 }}
          className="pt-1 sm:pt-2"
        >
          <Button 
            type="submit" 
            className={cn(
              "w-full h-11 sm:h-12 text-sm sm:text-base font-semibold relative overflow-hidden group",
              "bg-[#0D8BFF] hover:bg-[#0B7AE6] active:bg-[#0969CC]",
              "shadow-lg shadow-[#0D8BFF]/30 hover:shadow-xl hover:shadow-[#0D8BFF]/40",
              "transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]",
              "touch-manipulation" // Mejora la respuesta táctil en móvil
            )}
            disabled={isLoading || !isValidEmail || !isValidPassword}
          >
            <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
              {isLoading ? (
                <>
                  <motion.div
                    className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-r-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span className="text-sm sm:text-base">Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Iniciar sesión</span>
                </>
              )}
            </span>
            {/* Efecto de brillo animado */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              animate={isLoading ? { x: '200%' } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </Button>
        </motion.div>
      </form>

      {/* Mensaje de seguridad - Compacto en móvil */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        className="flex items-center justify-center gap-1.5 sm:gap-2 pt-3 sm:pt-4 border-t"
      >
        <ShieldAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
        <span className="text-[10px] sm:text-xs text-muted-foreground text-center">
          Conexión segura cifrada con SSL/TLS
        </span>
      </motion.div>
    </motion.div>
  );
} 