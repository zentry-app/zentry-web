import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Save, Lock, Settings } from 'lucide-react';
import { GlobalScreenRestrictions, Residencial } from '@/lib/firebase/firestore';
import { actualizarResidencial } from '@/lib/firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface GlobalScreenRestrictionsConfigProps {
  residencial: Residencial;
  onUpdate?: () => void;
}

const GlobalScreenRestrictionsConfig: React.FC<GlobalScreenRestrictionsConfigProps> = ({
  residencial,
  onUpdate
}) => {
  const [restrictions, setRestrictions] = useState<GlobalScreenRestrictions>({
    visitas: true,
    eventos: true,
    mensajes: true,
    reservas: true,
    encuestas: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (residencial.globalScreenRestrictions) {
      setRestrictions(residencial.globalScreenRestrictions);
    }
  }, [residencial.globalScreenRestrictions]);

  const handleFeatureChange = (featureName: keyof GlobalScreenRestrictions, value: boolean) => {
    setRestrictions(prev => ({
      ...prev,
      [featureName]: value,
    }));
  };

  const handleSave = async () => {
    if (!residencial.id) return;
    
    setIsSaving(true);
    try {
      await actualizarResidencial(residencial.id, {
        globalScreenRestrictions: restrictions
      });
      
      toast({
        title: "Configuración guardada",
        description: "Las restricciones globales se han aplicado a todos los residentes",
        variant: "default",
      });
      
      onUpdate?.();
      setIsOpen(false);
    } catch (error) {
      console.error('Error al guardar restricciones globales:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las restricciones globales",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const featureLabels: { key: keyof GlobalScreenRestrictions; label: string; description: string }[] = [
    { key: 'visitas', label: 'Visitas', description: 'Permitir registro de visitantes' },
    { key: 'eventos', label: 'Eventos', description: 'Permitir creación y participación en eventos' },
    { key: 'mensajes', label: 'Mensajes', description: 'Permitir envío de mensajes' },
    { key: 'reservas', label: 'Reservas', description: 'Permitir reservas de áreas comunes' },
    { key: 'encuestas', label: 'Encuestas', description: 'Permitir participación en encuestas' },
  ];

  const hasChanges = JSON.stringify(restrictions) !== JSON.stringify(residencial.globalScreenRestrictions || {
    visitas: true,
    eventos: true,
    mensajes: true,
    reservas: true,
    encuestas: true,
  });

  const hasActiveRestrictions = Object.values(restrictions).some(restriction => restriction === false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 px-2 text-xs border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/20 ${
            hasActiveRestrictions 
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' 
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <Settings className="w-3 h-3 mr-1" />
          {hasActiveRestrictions ? 'Restricciones Activas' : 'Configurar Acceso'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <Lock className="w-5 h-5" />
            Restricciones Globales para Residentes
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 overflow-y-auto flex-1 pr-2">
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-orange-700 dark:text-orange-300">
              <strong>⚠️ Importante:</strong> Estas configuraciones se aplican a <strong>TODOS</strong> los residentes del residencial <strong>{residencial.nombre}</strong>.
            </p>
          </div>

          <div className="space-y-3">
            {featureLabels.map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <Label htmlFor={`global-${key}`} className="text-sm font-medium cursor-pointer">
                    {label}
                  </Label>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</p>
                </div>
                <Switch
                  id={`global-${key}`}
                  checked={restrictions[key]}
                  onCheckedChange={(value) => handleFeatureChange(key, value)}
                  className={`${restrictions[key] ? 'bg-green-500' : 'bg-gray-300'}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isSaving ? (
                <>Guardando...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Aplicar a Todos
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalScreenRestrictionsConfig;
