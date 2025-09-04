import React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Car, Clock, User, Calendar, Home, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ingreso, Timestamp as IngresoTimestamp } from "@/types/ingresos";

interface DetallesIngresoDialogContentProps {
  selectedIngreso: Ingreso | null;
  formatDateToFull: (timestamp: IngresoTimestamp | Date | string) => string;
}

// Helper para capitalizar nombres
const capitalizeName = (name: string): string => {
  if (!name) return '';
  return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Helper para obtener la etiqueta de categoría
const getCategoryLabel = (category: string): string => {
  switch (category) {
    case 'temporal': return 'Acceso Temporal';
    case 'evento': return 'Invitado de Evento';
    default: return category;
  }
};

const DetallesIngresoDialogContent: React.FC<DetallesIngresoDialogContentProps> = ({
  selectedIngreso,
  formatDateToFull,
}) => {
  if (!selectedIngreso) return null;

  const { visitData, vehicleInfo, exitDetails, status } = selectedIngreso;

  // =================================================================
  // Componente de Alertas de Seguridad
  // =================================================================
  const SecurityAlerts = () => {
    const alerts: React.ReactNode[] = [];

    if (exitDetails?.suspiciousCargo) {
      alerts.push(<li key="cargo">Carga sospechosa reportada en la salida.</li>);
    }
    if (exitDetails?.passReturned === false) {
      alerts.push(<li key="pass">Pase físico de visitante no fue devuelto.</li>);
    }
    if (exitDetails?.samePersonExit === false) {
      alerts.push(<li key="person">La persona que salió es DIFERENTE a la que ingresó.</li>);
    }
    if (exitDetails?.exitInSameVehicle === false) {
      alerts.push(<li key="vehicle">El vehículo de salida es DIFERENTE al de entrada.</li>);
    }

    if (alerts.length === 0) {
      return (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardHeader className="flex-row items-center gap-3 space-y-0 pb-3">
            <ShieldCheck className="h-6 w-6 text-green-600" />
            <CardTitle className="text-green-800 dark:text-green-300">Sin Alertas de Seguridad</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700 dark:text-green-400">
              El ciclo de ingreso y salida se completó sin discrepancias de seguridad reportadas.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700">
        <CardHeader className="flex-row items-center gap-3 space-y-0 pb-3">
          <ShieldAlert className="h-6 w-6 text-red-600" />
          <CardTitle className="text-red-800 dark:text-red-300">¡Alertas de Seguridad Detectadas!</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm font-medium text-red-700 dark:text-red-400">
            {alerts}
          </ul>
        </CardContent>
      </Card>
    );
  };

  // =================================================================
  // Componente de Comparativa Entrada vs Salida
  // =================================================================
  const ComparisonCard = ({ title, entryData, exitData, isMismatch }: {
    title: string;
    entryData: React.ReactNode;
    exitData: React.ReactNode;
    isMismatch?: boolean;
  }) => (
    <div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className={`grid grid-cols-2 gap-4 rounded-lg border p-4 ${isMismatch ? 'border-red-500 bg-red-50 dark:bg-red-950/50' : ''}`}>
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Entrada</p>
          <div className="text-sm">{entryData}</div>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Salida</p>
          <div className="text-sm font-semibold">{exitData}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-h-[85vh] overflow-y-auto pr-4 -mr-4">
      <DialogHeader className="mb-4">
        <DialogTitle className="text-2xl font-bold">
          Detalles de Acceso: {capitalizeName(visitData.name)}
        </DialogTitle>
        <DialogDescription>
          Auditoría completa del ciclo de visita. ID: <span className="font-mono">{selectedIngreso.id}</span>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* SECCIÓN DE ALERTAS (SOLO SI EL INGRESO ESTÁ COMPLETO) */}
        {status === 'completed' && <SecurityAlerts />}
        
        {/* SECCIÓN COMPARATIVA */}
        <Card>
          <CardHeader>
            <CardTitle>Auditoría de Ingreso y Salida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ComparisonCard
              title="Persona"
              isMismatch={exitDetails?.samePersonExit === false}
              entryData={<p className="font-bold text-base">{capitalizeName(visitData.name)}</p>}
              exitData={
                status === 'completed' ?
                  exitDetails?.samePersonExit === false ?
                    <p className="font-bold text-base text-red-600">{capitalizeName(exitDetails.differentPersonName || 'Desconocido')}</p>
                    : <p>La misma persona</p>
                  : <p className="text-muted-foreground">Salida pendiente</p>
              }
            />

            <Separator />
            
            <ComparisonCard
              title="Vehículo"
              isMismatch={exitDetails?.exitInSameVehicle === false}
              entryData={
                vehicleInfo?.placa ?
                  <div>
                    <p className="font-bold text-base">{vehicleInfo.placa.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">{capitalizeName(vehicleInfo.marca)} {vehicleInfo.modelo} ({capitalizeName(vehicleInfo.color)})</p>
                  </div>
                  : <p className="text-muted-foreground">Ingreso peatonal</p>
              }
              exitData={
                status === 'completed' ?
                  exitDetails?.exitInSameVehicle === false ?
                    <div className="text-red-600">
                      <p className="font-bold text-base">{(exitDetails.exitVehicleInfo?.placa || 'Placa no registrada').toUpperCase()}</p>
                      {exitDetails.exitVehicleInfo && <p className="text-xs">{capitalizeName(exitDetails.exitVehicleInfo.marca)} {exitDetails.exitVehicleInfo.modelo}</p>}
                    </div>
                    : <p>Mismo vehículo / Salida peatonal</p>
                  : <p className="text-muted-foreground">Salida pendiente</p>
              }
            />
          </CardContent>
        </Card>

        {/* LÍNEA DE TIEMPO Y DATOS DEL ANFITRIÓN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg"><Clock className="h-5 w-5 mr-2" />Línea de Tiempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white mr-3 mt-1">
                    <Car className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="font-semibold">Ingreso Registrado</p>
                    <p className="text-sm text-muted-foreground">{formatDateToFull(selectedIngreso.timestamp)}</p>
                  </div>
                </li>
                {status === 'completed' && selectedIngreso.exitTimestamp && (
                  <li className="flex items-start">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white mr-3 mt-1">
                      <Car className="h-3 w-3" style={{ transform: 'scaleX(-1)' }}/>
                    </div>
                    <div>
                      <p className="font-semibold">Salida Registrada</p>
                      <p className="text-sm text-muted-foreground">{formatDateToFull(selectedIngreso.exitTimestamp)}</p>
                    </div>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
          
          {/* Host Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg"><Home className="h-5 w-5 mr-2" />Anfitrión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Residencial</p>
                <p className="font-semibold">{selectedIngreso._residencialNombre}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Domicilio</p>
                <p className="font-semibold">
                  {capitalizeName(selectedIngreso.domicilio.calle)} #{selectedIngreso.domicilio.houseNumber}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DetallesIngresoDialogContent; 