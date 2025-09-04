"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, ShieldAlert, Shield } from 'lucide-react';

export function LoginForm() {
  const { loginWithEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
      {/* Información de seguridad */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">🔒 Acceso Seguro a Zentry</p>
            <p>Esta es la plataforma oficial de Zentry para gestión residencial. Tus datos están protegidos con encriptación SSL.</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center">
            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
            Correo electrónico de Zentry
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="h-11"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="flex items-center">
              <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
              Contraseña
            </Label>
            <Button variant="link" className="px-0 font-normal h-auto text-sm">
              ¿Olvidaste tu contraseña?
            </Button>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="h-11"
            disabled={isLoading}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 text-white shadow-lg shadow-blue-600/20 bg-gradient-to-b from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              Iniciando sesión...
            </div>
          ) : (
            'Iniciar sesión'
          )}
        </Button>
      </form>
      <div className="text-center text-xs text-muted-foreground flex items-center justify-center">
        <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
        Tu información está segura con nosotros. Conexión cifrada.
      </div>
    </motion.div>
  );
} 