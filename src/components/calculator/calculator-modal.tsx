"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface CalculatorModalProps {
  onClose: () => void;
}

interface FormData {
  edad: string;
  salarioPromedio: string;
  semanasCotizadas: string;
}

interface ValidationErrors {
  edad?: string;
  salarioPromedio?: string;
  semanasCotizadas?: string;
}

export function CalculatorModal({ onClose }: CalculatorModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    edad: '',
    salarioPromedio: '',
    semanasCotizadas: '',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    // Validar edad (entre 55 y 100 años)
    const edad = parseInt(formData.edad);
    if (!edad || edad < 55 || edad > 100) {
      newErrors.edad = 'La edad debe estar entre 55 y 100 años';
      isValid = false;
    }

    // Validar salario promedio (mayor a 0)
    const salario = parseFloat(formData.salarioPromedio);
    if (!salario || salario <= 0) {
      newErrors.salarioPromedio = 'El salario debe ser mayor a 0';
      isValid = false;
    }

    // Validar semanas cotizadas (mínimo 500 para Ley 73)
    const semanas = parseInt(formData.semanasCotizadas);
    if (!semanas || semanas < 500) {
      newErrors.semanasCotizadas = 'Debe tener al menos 500 semanas cotizadas';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija los errores antes de continuar');
      return;
    }

    setIsLoading(true);
    try {
      // Aquí iría la lógica de cálculo
      // Por ahora solo simulamos un delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Cálculo realizado correctamente');
      onClose();
    } catch (error) {
      console.error('Error al calcular:', error);
      toast.error('Error al realizar el cálculo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, '');
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      >
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-lg rounded-lg border bg-background shadow-lg max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-2">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                  Calculadora de Pensión
                </h1>
                <p className="text-sm text-muted-foreground">
                  Ingrese sus datos para calcular su pensión bajo la Ley 73
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-muted shrink-0"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Contenido scrolleable */}
            <ScrollArea className="flex-1 px-6">
              <form onSubmit={handleSubmit} className="space-y-6 pb-6">
                <div className="space-y-2">
                  <Label htmlFor="edad">
                    Edad
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="edad"
                      placeholder="Ej: 60"
                      value={formData.edad}
                      onChange={handleInputChange('edad')}
                      className={`pr-10 h-11 ${errors.edad ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                    />
                  </div>
                  {errors.edad && (
                    <p className="text-sm text-red-500">{errors.edad}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salarioPromedio">
                    Salario Promedio Últimas 250 Semanas
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="salarioPromedio"
                      placeholder="Ej: 15000"
                      value={formData.salarioPromedio}
                      onChange={handleInputChange('salarioPromedio')}
                      className={`pr-10 h-11 ${errors.salarioPromedio ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                    />
                  </div>
                  {errors.salarioPromedio && (
                    <p className="text-sm text-red-500">{errors.salarioPromedio}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semanasCotizadas">
                    Semanas Cotizadas
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="semanasCotizadas"
                      placeholder="Ej: 750"
                      value={formData.semanasCotizadas}
                      onChange={handleInputChange('semanasCotizadas')}
                      className={`pr-10 h-11 ${errors.semanasCotizadas ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                    />
                  </div>
                  {errors.semanasCotizadas && (
                    <p className="text-sm text-red-500">{errors.semanasCotizadas}</p>
                  )}
                </div>
              </form>
            </ScrollArea>

            {/* Footer con botones */}
            <div className="border-t bg-muted/10 p-4 space-y-4">
              <div className="flex justify-end gap-4">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  type="button"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  form="calculator-form"
                  className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-lg shadow-primary-500/20 transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                      Calculando...
                    </div>
                  ) : (
                    'Calcular Pensión'
                  )}
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Este cálculo es un estimado basado en la Ley 73 del IMSS.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 