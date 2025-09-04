import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { HoraDeshabilitada } from '@/lib/firebase/firestore';

interface HorasDeshabilitadasConfigProps {
  horasDeshabilitadas: { [diaSemana: string]: HoraDeshabilitada[] };
  onHorasDeshabilitadasChange: (horasDeshabilitadas: { [diaSemana: string]: HoraDeshabilitada[] }) => void;
}

const DIAS_SEMANA = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' }
];

export default function HorasDeshabilitadasConfig({ 
  horasDeshabilitadas, 
  onHorasDeshabilitadasChange 
}: HorasDeshabilitadasConfigProps) {
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>('lunes');
  const [nuevaHora, setNuevaHora] = useState<HoraDeshabilitada>({
    inicio: '08:00',
    fin: '12:00',
    motivo: ''
  });

  const agregarHoraDeshabilitada = () => {
    if (!nuevaHora.inicio || !nuevaHora.fin) return;
    
    // Validar que la hora de inicio sea menor que la de fin
    if (nuevaHora.inicio >= nuevaHora.fin) {
      alert('La hora de inicio debe ser menor que la hora de fin');
      return;
    }

    const horasActuales = horasDeshabilitadas[diaSeleccionado] || [];
    const horasActualizadas = [...horasActuales, { ...nuevaHora }];
    
    const nuevasHorasDeshabilitadas = {
      ...horasDeshabilitadas,
      [diaSeleccionado]: horasActualizadas
    };
    
    onHorasDeshabilitadasChange(nuevasHorasDeshabilitadas);
    
    // Resetear el formulario
    setNuevaHora({
      inicio: '08:00',
      fin: '12:00',
      motivo: ''
    });
  };

  const eliminarHoraDeshabilitada = (dia: string, index: number) => {
    const horasActuales = horasDeshabilitadas[dia] || [];
    const horasActualizadas = horasActuales.filter((_, i) => i !== index);
    
    const nuevasHorasDeshabilitadas = {
      ...horasDeshabilitadas,
      [dia]: horasActualizadas
    };
    
    onHorasDeshabilitadasChange(nuevasHorasDeshabilitadas);
  };

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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-600" />
          Horas Deshabilitadas por Día
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Horas Deshabilitadas</span>
            </div>
            <div className="mt-1 text-2xl font-bold text-orange-600">
              {getTotalHorasDeshabilitadas().toFixed(1)}h
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">Días Afectados</span>
            </div>
            <div className="mt-1 text-2xl font-bold text-red-600">
              {getDiasConHorasDeshabilitadas().length}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Configuraciones</span>
            </div>
            <div className="mt-1 text-2xl font-bold text-blue-600">
              {Object.values(horasDeshabilitadas).reduce((total, horas) => total + (horas?.length || 0), 0)}
            </div>
          </div>
        </div>

        {/* Formulario para agregar nueva hora deshabilitada */}
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          <h4 className="font-medium mb-3">Agregar Nueva Hora Deshabilitada</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label htmlFor="dia-semana">Día de la Semana</Label>
              <Select value={diaSeleccionado} onValueChange={setDiaSeleccionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map(dia => (
                    <SelectItem key={dia.value} value={dia.value}>
                      {dia.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hora-inicio">Hora Inicio</Label>
              <Input
                id="hora-inicio"
                type="time"
                value={nuevaHora.inicio}
                onChange={(e) => setNuevaHora(prev => ({ ...prev, inicio: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="hora-fin">Hora Fin</Label>
              <Input
                id="hora-fin"
                type="time"
                value={nuevaHora.fin}
                onChange={(e) => setNuevaHora(prev => ({ ...prev, fin: e.target.value }))}
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={agregarHoraDeshabilitada}
                className="w-full"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
          </div>

          <div className="mt-3">
            <Label htmlFor="motivo">Motivo (Opcional)</Label>
            <Input
              id="motivo"
              placeholder="Ej: Mantenimiento, Limpieza, etc."
              value={nuevaHora.motivo}
              onChange={(e) => setNuevaHora(prev => ({ ...prev, motivo: e.target.value }))}
            />
          </div>
        </div>

        {/* Lista de horas deshabilitadas por día */}
        <div className="space-y-4">
          {DIAS_SEMANA.map(dia => {
            const horasDelDia = horasDeshabilitadas[dia.value] || [];
            if (horasDelDia.length === 0) return null;

            return (
              <div key={dia.value} className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300">
                  {dia.label} - {horasDelDia.length} hora(s) deshabilitada(s)
                </h4>
                
                <div className="space-y-2">
                  {horasDelDia.map((hora, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-3">
                        <Badge variant="destructive" className="text-xs">
                          {hora.inicio} - {hora.fin}
                        </Badge>
                        {hora.motivo && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {hora.motivo}
                          </span>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarHoraDeshabilitada(dia.value, index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mensaje cuando no hay horas deshabilitadas */}
        {getDiasConHorasDeshabilitadas().length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No hay horas deshabilitadas configuradas</p>
            <p className="text-sm">Agrega horas deshabilitadas para días específicos arriba</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
