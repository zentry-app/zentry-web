import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoraDeshabilitada } from '@/lib/firebase/firestore';

interface HorasDeshabilitadasDisplayProps {
  horasDeshabilitadas: { [diaSemana: string]: HoraDeshabilitada[] };
  compact?: boolean; // Para mostrar en modo compacto en tablas
}

const DIAS_SEMANA_LABELS: { [key: string]: string } = {
  'lunes': 'Lun',
  'martes': 'Mar',
  'miercoles': 'Mié',
  'jueves': 'Jue',
  'viernes': 'Vie',
  'sabado': 'Sáb',
  'domingo': 'Dom'
};

export default function HorasDeshabilitadasDisplay({ 
  horasDeshabilitadas, 
  compact = false 
}: HorasDeshabilitadasDisplayProps) {
  const getTotalHorasDeshabilitadas = () => {
    let total = 0;
    Object.values(horasDeshabilitadas).forEach(horas => {
      horas.forEach(hora => {
        const inicio = new Date(`2000-01-01T${hora.inicio}:00`);
        const fin = new Date(`2000-01-01T${hora.fin}:00`);
        const diferencia = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60); // en horas
        total += diferencia;
      });
    });
    return total;
  };

  const getDiasConHorasDeshabilitadas = () => {
    return Object.keys(horasDeshabilitadas).filter(dia => 
      horasDeshabilitadas[dia] && horasDeshabilitadas[dia].length > 0
    );
  };

  const totalHoras = getTotalHorasDeshabilitadas();
  const diasAfectados = getDiasConHorasDeshabilitadas();

  // Si no hay horas deshabilitadas, no mostrar nada
  if (totalHoras === 0) {
    return null;
  }

  if (compact) {
    // Modo compacto para tablas
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-orange-600" />
              <Badge variant="outline" className="text-xs px-2 py-1">
                {totalHoras.toFixed(1)}h
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <div className="font-medium">Horas Deshabilitadas</div>
              <div className="text-sm">
                {diasAfectados.map(dia => {
                  const horasDelDia = horasDeshabilitadas[dia];
                  return (
                    <div key={dia} className="mb-1">
                      <span className="font-medium">{DIAS_SEMANA_LABELS[dia]}:</span>
                      {horasDelDia.map((hora, index) => (
                        <span key={index} className="ml-2 text-xs bg-red-100 dark:bg-red-900 px-1 py-0.5 rounded">
                          {hora.inicio}-{hora.fin}
                        </span>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Modo completo para formularios
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Horas Deshabilitadas Configuradas
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">Total Horas</div>
          <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
            {totalHoras.toFixed(1)}h
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-xs text-red-600 dark:text-red-400 font-medium">Días Afectados</div>
          <div className="text-lg font-bold text-red-700 dark:text-red-300">
            {diasAfectados.length}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Configuraciones</div>
          <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
            {Object.values(horasDeshabilitadas).reduce((total, horas) => total + (horas?.length || 0), 0)}
          </div>
        </div>
      </div>

      {/* Lista detallada por día */}
      <div className="space-y-2">
        {diasAfectados.map(dia => {
          const horasDelDia = horasDeshabilitadas[dia];
          return (
            <div key={dia} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                  {DIAS_SEMANA_LABELS[dia]}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {horasDelDia.length} hora(s)
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {horasDelDia.map((hora, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      {hora.inicio} - {hora.fin}
                    </Badge>
                    {hora.motivo && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        ({hora.motivo})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

