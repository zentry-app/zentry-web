import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2 } from "lucide-react";
import { AreaComun } from "@/lib/firebase/firestore"; // Asumiendo tipo
import { UserClaims } from "@/contexts/AuthContext"; // Asumiendo tipo
import HorasDeshabilitadasDisplay from "./HorasDeshabilitadasDisplay";

interface TablaAreasComunesProps {
  loading: boolean;
  filteredAreas: AreaComun[];
  esAdminDeResidencial: boolean;
  userClaims: UserClaims | null; // Ajustar si es necesario
  getResidencialNombre: (area: AreaComun) => string;
  convertirHora: (hora24: string) => string;
  handleOpenDialog: (area: AreaComun) => void;
  handleDeleteConfirm: (area: AreaComun) => void;
}

const TablaAreasComunes: React.FC<TablaAreasComunesProps> = ({
  loading,
  filteredAreas,
  esAdminDeResidencial,
  userClaims,
  getResidencialNombre,
  convertirHora,
  handleOpenDialog,
  handleDeleteConfirm,
}) => {
  if (loading && filteredAreas.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            {(!esAdminDeResidencial || userClaims?.isGlobalAdmin) && <TableHead>Residencial</TableHead>}
            <TableHead>Capacidad</TableHead>
            <TableHead>Horario</TableHead>
            <TableHead>Horas Deshabilitadas</TableHead>
            <TableHead>Reservación</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAreas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={esAdminDeResidencial || !userClaims?.isGlobalAdmin ? 5 : 6} className="h-24 text-center">
                {loading ? "Cargando..." : "No se encontraron áreas comunes"}
              </TableCell>
            </TableRow>
          ) : (
            filteredAreas.map((area) => (
              <TableRow key={area.id}>
                <TableCell className="font-medium">{area.nombre}</TableCell>
                {(!esAdminDeResidencial || userClaims?.isGlobalAdmin) && <TableCell>{getResidencialNombre(area)}</TableCell>}
                <TableCell>{area.capacidad} personas</TableCell>
                <TableCell>{formatHorarioForDisplay(area)}</TableCell>
                <TableCell>
                  <HorasDeshabilitadasDisplay 
                    horasDeshabilitadas={area.reglamento?.horasDeshabilitadas || {}} 
                    compact={true} 
                  />
                </TableCell>
                <TableCell>
                  <Badge variant={area.reglamento ? "warning" : "success"}>
                    {area.reglamento ? "Requiere" : "Libre"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleOpenDialog(area)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive" onClick={() => handleDeleteConfirm(area)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

// Función para formatear horarios para mostrar en la tabla
const formatHorarioForDisplay = (area: AreaComun): string => {
  try {
    // Si tiene reglamento con horarios
    if (area.reglamento?.horarios) {
      const horarios = area.reglamento.horarios;
      
      // Mostrar horarios entre semana y fin de semana
      const entreSemana = horarios.entreSemana;
      const finDeSemana = horarios.finDeSemana;
      
      if (entreSemana && finDeSemana) {
        const convertirHora = (hora: string) => {
          const [hour, minute] = hora.split(':');
          const hourNum = parseInt(hour);
          const period = hourNum < 12 ? 'AM' : 'PM';
          const displayHour = hourNum === 0 ? 12 : (hourNum > 12 ? hourNum - 12 : hourNum);
          return `${displayHour}:${minute} ${period}`;
        };
        
        return `L-V: ${convertirHora(entreSemana.apertura)}-${convertirHora(entreSemana.cierre)} | S-D: ${convertirHora(finDeSemana.apertura)}-${convertirHora(finDeSemana.cierre)}`;
      }
    }
    
    // Fallback para estructura antigua
    if (area.horario) {
      const convertirHora = (hora: string) => {
        const [hour, minute] = hora.split(':');
        const hourNum = parseInt(hour);
        const period = hourNum < 12 ? 'AM' : 'PM';
        const displayHour = hourNum === 0 ? 12 : (hourNum > 12 ? hourNum - 12 : hourNum);
        return `${displayHour}:${minute} ${period}`;
      };
      
      return `${convertirHora(area.horario.apertura)} - ${convertirHora(area.horario.cierre)}`;
    }
    
    return "Horario no disponible";
  } catch (error) {
    return "Horario no disponible";
  }
};

export default TablaAreasComunes; 