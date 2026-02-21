import React from 'react';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, UserPlus } from "lucide-react";
import { Usuario, Residencial } from "@/lib/firebase/firestore"; // Asumiendo que Residencial también está aquí

interface NuevoUsuarioForm {
  fullName: string;
  paternalLastName: string;
  maternalLastName: string;
  email: string;
  telefono: string;
  role: Usuario['role'];
  residencialID: string;
  houseID: string;
  calle: string;
  houseNumber: string;
  password: string;
}

interface NuevoUsuarioDialogContentProps {
  nuevoUsuarioForm: NuevoUsuarioForm;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  residenciales: Residencial[];
  residencialIdDelAdmin: string | null;
  mapeoResidenciales: { [key: string]: string };
  callesDisponibles: string[];
  creandoUsuario: boolean;
  handleCrearUsuario: () => Promise<void>;
  setShowNuevoUsuarioDialog: (show: boolean) => void;
}

const NuevoUsuarioDialogContent: React.FC<NuevoUsuarioDialogContentProps> = ({
  nuevoUsuarioForm,
  handleInputChange,
  handleSelectChange,
  residenciales,
  residencialIdDelAdmin,
  mapeoResidenciales,
  callesDisponibles,
  creandoUsuario,
  handleCrearUsuario,
  setShowNuevoUsuarioDialog,
}) => {
  return (
    <DialogContent className="sm:max-w-[500px] border-none shadow-2xl bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-0 overflow-hidden">
      {/* Decorative Header Background */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 -z-10" />

      <div className="p-8 pb-0">
        <DialogHeader className="mb-6 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-2 shadow-sm border border-slate-200">
            <UserPlus className="h-6 w-6 text-slate-900" />
          </div>
          <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">Nuevo Usuario</DialogTitle>
          <DialogDescription className="text-base text-slate-500 font-medium">
            {nuevoUsuarioForm.role === "security"
              ? "Configura el acceso para el personal de seguridad."
              : "Ingresa los datos para registrar un nuevo residente o administrador."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
          {/* Role Selection - Visual Cards */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Rol de Usuario</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'resident', label: 'Residente', icon: '🏠' },
                { id: 'admin', label: 'Admin', icon: '⚡' },
                { id: 'security', label: 'Seguridad', icon: '🛡️' }
              ].map((role) => (
                <div
                  key={role.id}
                  onClick={() => handleSelectChange("role", role.id)}
                  className={`cursor-pointer rounded-2xl border p-3 flex flex-col items-center gap-2 transition-all duration-200 ${nuevoUsuarioForm.role === role.id ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.02]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'}`}
                >
                  <span className="text-xl">{role.icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide">{role.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Conditional Fields */}
          <div className="space-y-5">
            {nuevoUsuarioForm.role !== "security" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label className="text-xs font-bold text-slate-500 ml-1">Nombre</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={nuevoUsuarioForm.fullName}
                    onChange={handleInputChange}
                    className="rounded-xl h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all font-medium"
                    placeholder="Ej. Juan"
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label className="text-xs font-bold text-slate-500 ml-1">Apellido Paterno</Label>
                  <Input
                    id="paternalLastName"
                    name="paternalLastName"
                    value={nuevoUsuarioForm.paternalLastName}
                    onChange={handleInputChange}
                    className="rounded-xl h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all font-medium"
                    placeholder="Ej. Pérez"
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold text-slate-500 ml-1">Apellido Materno (Opcional)</Label>
                  <Input
                    id="maternalLastName"
                    name="maternalLastName"
                    value={nuevoUsuarioForm.maternalLastName}
                    onChange={handleInputChange}
                    className="rounded-xl h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all font-medium"
                    placeholder="Ej. López"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 ml-1">Correo Electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={nuevoUsuarioForm.email}
                onChange={handleInputChange}
                className="rounded-xl h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all font-medium"
                placeholder="usuario@ejemplo.com"
                required
              />
            </div>

            {nuevoUsuarioForm.role !== "security" && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 ml-1">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  value={nuevoUsuarioForm.telefono}
                  onChange={handleInputChange}
                  className="rounded-xl h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all font-medium"
                  placeholder="+52 555 555 5555"
                />
              </div>
            )}

            {nuevoUsuarioForm.role === "security" && (
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 text-amber-800 text-xs leading-relaxed font-medium">
                <strong className="block mb-1 text-amber-900">✨ Cuenta de Seguridad Simplificada</strong>
                Se creará un acceso limitado para operaciones de control de acceso. Solo requiere correo y asignación de residencial.
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 ml-1">Residencial Asignado</Label>
              <Select
                value={nuevoUsuarioForm.residencialID}
                onValueChange={(value) => handleSelectChange("residencialID", value)}
                disabled={!!residencialIdDelAdmin}
              >
                <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all font-medium">
                  <SelectValue placeholder="Seleccione un residencial" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl bg-white/90 backdrop-blur-xl">
                  {residenciales
                    .filter(residencial => !!residencial.id)
                    .filter(residencial =>
                      !residencialIdDelAdmin ||
                      (residencial.residencialID === residencialIdDelAdmin) ||
                      (mapeoResidenciales[residencial.id!] === residencialIdDelAdmin)
                    )
                    .map(residencial => (
                      <SelectItem key={residencial.id} value={residencial.id!} className="font-medium">
                        {residencial.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {nuevoUsuarioForm.role === "resident" && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold text-slate-500 ml-1">Calle</Label>
                  <Select
                    value={nuevoUsuarioForm.calle}
                    onValueChange={(value) => handleSelectChange("calle", value)}
                    disabled={callesDisponibles.length === 0}
                  >
                    <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all font-medium">
                      <SelectValue placeholder={callesDisponibles.length > 0 ? "Seleccionar calle" : "Seleccione residencial"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl bg-white/90 backdrop-blur-xl max-h-[200px]">
                      {callesDisponibles
                        .filter(calle => calle && calle.trim() !== '')
                        .map(calle => (
                          <SelectItem key={calle} value={calle} className="font-medium">
                            {calle}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 ml-1">Número</Label>
                  <Input
                    id="houseNumber"
                    name="houseNumber"
                    value={nuevoUsuarioForm.houseNumber}
                    onChange={handleInputChange}
                    className="rounded-xl h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all font-medium text-center"
                    placeholder="#"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 ml-1">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={nuevoUsuarioForm.password}
                onChange={handleInputChange}
                className="rounded-xl h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 transition-all font-medium tracking-widest"
                required
              />
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100 mt-2">
        <Button
          variant="ghost"
          onClick={() => setShowNuevoUsuarioDialog(false)}
          className="rounded-xl h-12 px-6 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleCrearUsuario}
          disabled={creandoUsuario}
          className="rounded-xl h-12 px-8 font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20"
        >
          {creandoUsuario ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Procesando
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-5 w-5" />
              Crear Usuario
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default NuevoUsuarioDialogContent; 