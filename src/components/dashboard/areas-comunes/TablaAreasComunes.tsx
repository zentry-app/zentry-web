import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, Clock, Users, Calendar, AlertCircle } from "lucide-react";
import { AreaComun } from "@/lib/firebase/firestore";
import { UserClaims } from "@/contexts/AuthContext";
import HorasDeshabilitadasDisplay from "./HorasDeshabilitadasDisplay";

interface TablaAreasComunesProps {
  loading: boolean;
  filteredAreas: AreaComun[];
  esAdminDeResidencial: boolean;
  userClaims: UserClaims | null;
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded-lg" />
                <Skeleton className="h-3 w-20 rounded-lg" />
              </div>
            </div>
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  if (filteredAreas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white/50 rounded-[2.5rem] border border-dashed border-slate-200">
        <div className="bg-slate-50 p-6 rounded-full mb-4">
          <Calendar className="h-10 w-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-700">No se encontraron áreas comunes</h3>
        <p className="text-slate-400 font-medium mt-1 text-center max-w-md">
          No hay amenidades registradas con los filtros actuales. Intenta cambiar la búsqueda o añade una nueva área.
        </p>
      </div>
    );
  }

  // Transformar lista a grid de cards para diseño premium
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {filteredAreas.map((area) => (
        <div
          key={area.id}
          className="group relative bg-white hover:bg-gradient-to-br hover:from-white hover:to-indigo-50/30 p-6 rounded-[2rem] border border-slate-100 hover:border-indigo-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
        >
          {/* Header Card */}
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex gap-2">
                <div
                  onClick={() => handleOpenDialog(area)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </div>
                <div
                  onClick={() => handleDeleteConfirm(area)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </div>
              </div>
            </div>

            <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight mb-1 group-hover:text-indigo-900 transition-colors">
              {area.nombre}
            </h3>

            {(!esAdminDeResidencial || userClaims?.isGlobalAdmin) && (
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 truncate">
                {getResidencialNombre(area)}
              </p>
            )}

            <div className="space-y-3 mb-6">
              {/* Capacidad */}
              <div className="flex items-center gap-3 text-sm font-medium text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100/50">
                <Users className="h-4 w-4 text-indigo-400" />
                <span>Capacidad: <span className="font-bold text-slate-800">{area.capacidad} personas</span></span>
              </div>

              {/* Horario */}
              <div className="flex items-start gap-3 text-sm font-medium text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100/50">
                <Clock className="h-4 w-4 text-emerald-400 mt-0.5" />
                <span className="text-xs leading-relaxed">{formatHorarioForDisplay(area)}</span>
              </div>

              {/* Horas Deshabilitadas (si existen) */}
              {area.reglamento?.horasDeshabilitadas && Object.keys(area.reglamento.horasDeshabilitadas).length > 0 && (
                <div className="mt-2">
                  <HorasDeshabilitadasDisplay
                    horasDeshabilitadas={area.reglamento.horasDeshabilitadas}
                    compact={true}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Card */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${area.activa ? 'bg-emerald-500 shadow-emerald-200 shadow-[0_0_8px]' : 'bg-slate-300'}`}></span>
                <span className={`text-xs font-bold ${area.activa ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {area.activa ? 'Disponible' : 'Inactiva'}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reservación</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg mt-1 ${area.reglamento ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                {area.reglamento ? 'Requiere' : 'Libre'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Función para formatear horarios para mostrar en la tabla (optimizada)
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
          if (!hora) return "??";
          const [hour, minute] = hora.split(':');
          const hourNum = parseInt(hour) || 0;
          const period = hourNum < 12 ? 'AM' : 'PM';
          const displayHour = hourNum === 0 ? 12 : (hourNum > 12 ? hourNum - 12 : hourNum);
          return `${displayHour}:${minute} ${period}`;
        };

        return `L-V: ${convertirHora(entreSemana.apertura)}-${convertirHora(entreSemana.cierre)} · S-D: ${convertirHora(finDeSemana.apertura)}-${convertirHora(finDeSemana.cierre)}`;
      }
    }

    // Fallback para estructura antigua
    if (area.horario) {
      const convertirHora = (hora: string) => {
        if (!hora) return "??";
        const [hour, minute] = hora.split(':');
        const hourNum = parseInt(hour) || 0;
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