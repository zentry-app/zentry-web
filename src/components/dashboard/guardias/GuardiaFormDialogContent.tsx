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
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>
          {currentGuardia ? "Editar Guardia" : "Añadir Guardia"}
        </DialogTitle>
        <DialogDescription>
          {currentGuardia 
            ? "Actualiza la información del guardia seleccionado"
            : "Completa la información para registrar un nuevo guardia"
          }
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        {/* Residencial */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="residencialId" className="text-right">
            Residencial
          </Label>
          <Select
            value={selectedResidencialId}
            onValueChange={(value) => setSelectedResidencialId(value)}
            disabled={!!currentGuardia || esAdminDeResidencial} // Deshabilitar si es edición O si es admin de residencial
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Selecciona un residencial" />
            </SelectTrigger>
            <SelectContent>
              { residenciales
                  .filter(r => r.id && (!esAdminDeResidencial || r.id === residencialIdDocDelAdmin)) // Mostrar solo su residencial si es admin de res
                  .map((residencial) => (
                    <SelectItem key={residencial.id} value={residencial.id!}>
                      {residencial.nombre}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
        </div>

        {/* Nombre del Guardia */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="nombreGuardia" className="text-right">
            Nombre
          </Label>
          <Input
            id="nombreGuardia"
            className="col-span-3"
            value={formData.nombreGuardia}
            onChange={handleInputChange}
            name="nombreGuardia"
            placeholder="Nombre del guardia"
          />
        </div>

        {/* Apellido del Guardia */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="apellidoGuardia" className="text-right">
            Apellido
          </Label>
          <Input
            id="apellidoGuardia"
            className="col-span-3"
            value={formData.apellidoGuardia}
            onChange={handleInputChange}
            name="apellidoGuardia"
            placeholder="Apellido del guardia"
          />
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="dias" className="text-right">
            Días
          </Label>
          <div className="col-span-3 space-y-2">
            <div className="flex justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="todos-los-dias"
                  checked={formData.horario.dias.length === diasSemana.length}
                  onCheckedChange={(checked) => 
                    handleDiaChange("todos", checked as boolean)
                  }
                />
                <Label htmlFor="todos-los-dias">Todos los días</Label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDiaChange("limpiar", false) } // Usar handleDiaChange para limpiar
              >
                Limpiar selección
              </Button>
            </div>
            {diasSemana.map((dia) => (
              <div key={dia.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={dia.id}
                  checked={formData.horario.dias.includes(dia.id)}
                  onCheckedChange={(checked) => 
                    handleDiaChange(dia.id, checked as boolean)
                  }
                />
                <Label htmlFor={dia.id}>{dia.label}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Horario */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="horaEntrada" className="text-right">
            Hora Entrada
          </Label>
          <Input
            id="horaEntrada"
            name="horaEntrada"
            type="time"
            value={formData.horario.horaEntrada}
            onChange={handleInputChange}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="horaSalida" className="text-right">
            Hora Salida
          </Label>
          <Input
            id="horaSalida"
            name="horaSalida"
            type="time"
            value={formData.horario.horaSalida}
            onChange={handleInputChange}
            className="col-span-3"
          />
        </div>

        {/* Estado */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="estado" className="text-right">
            Estado
          </Label>
          <Select
            value={formData.estado}
            onValueChange={(value) => handleSelectChange("estado", value)}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Selecciona el estado" />
            </SelectTrigger>
            <SelectContent>
              {estadosGuardia.map((estado) => (
                <SelectItem key={estado.value} value={estado.value}>
                  {estado.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setOpenDialog(false)}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
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