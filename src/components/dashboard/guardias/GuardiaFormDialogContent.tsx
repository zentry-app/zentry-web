import React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogContent,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Guardia, Residencial } from "@/lib/firebase/firestore";

// Definición de GuardiaFormData (ajustar según sea necesario)
interface GuardiaFormData {
  usuarioId?: string;
  nombreGuardia: string;
  apellidoGuardia: string;
  horario: {
    dias: string[];
    horaEntrada: string;
    horaSalida: string;
  };
  estado?: 'activo' | 'inactivo' | 'vacaciones';
}

// Constantes para el formulario
const diasSemana = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];

const estadosGuardia = [
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
  { value: 'vacaciones', label: 'Vacaciones' }
];

interface GuardiaFormDialogContentProps {
  currentGuardia: (Guardia & { _residencialId?: string }) | null;
  formData: GuardiaFormData;
  // setFormData: React.Dispatch<React.SetStateAction<GuardiaFormData>>; // Se maneja a través de handlers específicos
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleDiaChange: (dia: string, checked: boolean) => void;
  handleSubmit: () => Promise<void>;
  setOpenDialog: (open: boolean) => void;
  loading: boolean;
  residenciales: Residencial[];
  selectedResidencialId: string;
  setSelectedResidencialId: (id: string) => void;
  esAdminDeResidencial: boolean;
  residencialIdDocDelAdmin: string | null;
}

const GuardiaFormDialogContent: React.FC<GuardiaFormDialogContentProps> = ({
  currentGuardia,
  formData,
  handleInputChange,
  handleSelectChange,
  handleDiaChange,
  handleSubmit,
  setOpenDialog,
  loading,
  residenciales,
  selectedResidencialId,
  setSelectedResidencialId,
  esAdminDeResidencial,
  residencialIdDocDelAdmin,
}) => {
  return (
    <DialogContent className="sm:max-w-[600px] rounded-[2rem] border-none shadow-2xl bg-white/95 backdrop-blur-3xl">
      <DialogHeader className="space-y-3 pb-6 border-b border-slate-100">
        <DialogTitle className="text-3xl font-black text-slate-900">
          {currentGuardia ? "✏️ Editar Guardia" : "➕ Añadir Guardia"}
        </DialogTitle>
        <DialogDescription className="text-base text-slate-600 font-medium">
          {currentGuardia
            ? "Actualiza la información del guardia seleccionado"
            : "Completa la información para registrar un nuevo guardia"
          }
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-6 py-6">
        {/* Residencial */}
        <div className="space-y-2">
          <Label htmlFor="residencialId" className="text-sm font-black uppercase tracking-wider text-slate-700">
            Residencial
          </Label>
          <Select
            value={selectedResidencialId}
            onValueChange={(value) => setSelectedResidencialId(value)}
            disabled={!!currentGuardia || esAdminDeResidencial}
          >
            <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl font-bold shadow-sm">
              <SelectValue placeholder="Selecciona un residencial" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-3xl">
              <div className="p-2">
                {residenciales
                  .filter(r => r.id && (!esAdminDeResidencial || r.id === residencialIdDocDelAdmin))
                  .map((residencial) => (
                    <SelectItem key={residencial.id} value={residencial.id!} className="font-bold mb-1 rounded-xl">
                      {residencial.nombre}
                    </SelectItem>
                  ))}
              </div>
            </SelectContent>
          </Select>
        </div>

        {/* Nombre y Apellido en dos columnas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombreGuardia" className="text-sm font-black uppercase tracking-wider text-slate-700">
              Nombre
            </Label>
            <Input
              id="nombreGuardia"
              value={formData.nombreGuardia}
              onChange={handleInputChange}
              name="nombreGuardia"
              placeholder="Nombre del guardia"
              className="h-12 bg-white border-slate-200 rounded-xl font-bold shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apellidoGuardia" className="text-sm font-black uppercase tracking-wider text-slate-700">
              Apellido
            </Label>
            <Input
              id="apellidoGuardia"
              value={formData.apellidoGuardia}
              onChange={handleInputChange}
              name="apellidoGuardia"
              placeholder="Apellido del guardia"
              className="h-12 bg-white border-slate-200 rounded-xl font-bold shadow-sm"
            />
          </div>
        </div>

        {/* Días de la semana */}
        <div className="space-y-3">
          <Label className="text-sm font-black uppercase tracking-wider text-slate-700">
            Días de Trabajo
          </Label>
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="todos-los-dias"
                  checked={formData.horario.dias.length === diasSemana.length}
                  onCheckedChange={(checked) =>
                    handleDiaChange("todos", checked as boolean)
                  }
                  className="rounded-md"
                />
                <Label htmlFor="todos-los-dias" className="font-bold text-slate-700 cursor-pointer">
                  Todos los días
                </Label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDiaChange("limpiar", false)}
                className="rounded-xl font-bold"
              >
                Limpiar
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {diasSemana.map((dia) => (
                <div key={dia.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={dia.id}
                    checked={formData.horario.dias.includes(dia.id)}
                    onCheckedChange={(checked) =>
                      handleDiaChange(dia.id, checked as boolean)
                    }
                    className="rounded-md"
                  />
                  <Label htmlFor={dia.id} className="font-bold text-slate-700 cursor-pointer">
                    {dia.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Horario en dos columnas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="horaEntrada" className="text-sm font-black uppercase tracking-wider text-slate-700">
              Hora Entrada
            </Label>
            <Input
              id="horaEntrada"
              name="horaEntrada"
              type="time"
              value={formData.horario.horaEntrada}
              onChange={handleInputChange}
              className="h-12 bg-white border-slate-200 rounded-xl font-bold shadow-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="horaSalida" className="text-sm font-black uppercase tracking-wider text-slate-700">
              Hora Salida
            </Label>
            <Input
              id="horaSalida"
              name="horaSalida"
              type="time"
              value={formData.horario.horaSalida}
              onChange={handleInputChange}
              className="h-12 bg-white border-slate-200 rounded-xl font-bold shadow-sm"
            />
          </div>
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <Label htmlFor="estado" className="text-sm font-black uppercase tracking-wider text-slate-700">
            Estado
          </Label>
          <Select
            value={formData.estado}
            onValueChange={(value) => handleSelectChange("estado", value)}
          >
            <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl font-bold shadow-sm">
              <SelectValue placeholder="Selecciona el estado" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-3xl">
              <div className="p-2">
                {estadosGuardia.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value} className="font-bold mb-1 rounded-xl">
                    {estado.label}
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter className="gap-3 pt-6 border-t border-slate-100">
        <Button
          variant="outline"
          onClick={() => setOpenDialog(false)}
          className="rounded-xl h-12 px-6 font-bold border-slate-200"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-xl h-12 px-8 font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </>
          ) : (
            'Guardar'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default GuardiaFormDialogContent; 