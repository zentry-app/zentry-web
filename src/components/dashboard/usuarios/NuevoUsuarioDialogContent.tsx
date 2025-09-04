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
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Añadir Nuevo Usuario</DialogTitle>
        <DialogDescription>
          {nuevoUsuarioForm.role === "security"
            ? "Complete el formulario para crear un usuario de seguridad."
            : "Complete el formulario para crear un nuevo usuario."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        {/* Campos comunes para todos los tipos de usuarios */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="role" className="text-right">
            Rol*
          </Label>
          <Select
            value={nuevoUsuarioForm.role}
            onValueChange={(value) => handleSelectChange("role", value)}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Seleccione un rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="resident">Residente</SelectItem>
              <SelectItem value="security">Seguridad</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campos para todos los usuarios excepto seguridad */}
        {nuevoUsuarioForm.role !== "security" && (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullName" className="text-right">
                Nombre*
              </Label>
              <Input
                id="fullName"
                name="fullName"
                value={nuevoUsuarioForm.fullName}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="paternalLastName" className="text-right">
                Apellido Paterno*
              </Label>
              <Input
                id="paternalLastName"
                name="paternalLastName"
                value={nuevoUsuarioForm.paternalLastName}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maternalLastName" className="text-right">
                Apellido Materno
              </Label>
              <Input
                id="maternalLastName"
                name="maternalLastName"
                value={nuevoUsuarioForm.maternalLastName}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Correo*
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={nuevoUsuarioForm.email}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefono" className="text-right">
                Teléfono
              </Label>
              <Input
                id="telefono"
                name="telefono"
                type="tel"
                value={nuevoUsuarioForm.telefono}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </>
        )}

        {/* Campos específicos para usuarios de seguridad */}
        {nuevoUsuarioForm.role === "security" && (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Correo*
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={nuevoUsuarioForm.email}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>

            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-900">
              <p className="text-xs text-yellow-800 dark:text-yellow-400">
                El usuario de seguridad tendrá acceso a la app de seguridad con las siguientes características:
              </p>
              <ul className="text-xs text-yellow-700 dark:text-yellow-500 list-disc list-inside mt-1">
                <li>Acceso a registro de entradas y salidas</li>
                <li>Acceso a lista de residentes e invitados</li>
                <li>Estado "Aprobado" automáticamente</li>
                <li>Solo se requiere correo y residencial - sin datos personales</li>
              </ul>
            </div>
          </>
        )}

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="residencialID" className="text-right">
            Residencial*
          </Label>
          <Select
            value={nuevoUsuarioForm.residencialID}
            onValueChange={(value) => handleSelectChange("residencialID", value)}
            disabled={!!residencialIdDelAdmin} // Deshabilitar si es admin de residencial y ya tiene uno asignado
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Seleccione un residencial" />
            </SelectTrigger>
            <SelectContent>
              {residenciales
                .filter(residencial => !!residencial.id)
                .filter(residencial => 
                  !residencialIdDelAdmin || 
                  (residencial.residencialID === residencialIdDelAdmin) || 
                  (mapeoResidenciales[residencial.id!] === residencialIdDelAdmin)
                 )
                .map(residencial => (
                  <SelectItem key={residencial.id} value={residencial.id!}>
                    {residencial.nombre}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {nuevoUsuarioForm.role === "resident" && (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="calle" className="text-right">
                Calle*
              </Label>
              <Select
                value={nuevoUsuarioForm.calle}
                onValueChange={(value) => handleSelectChange("calle", value)}
                disabled={callesDisponibles.length === 0}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={callesDisponibles.length > 0 ? "Seleccione una calle" : "Seleccione primero un residencial"} />
                </SelectTrigger>
                <SelectContent>
                  {callesDisponibles
                    .filter(calle => calle && calle.trim() !== '') // Filtrar calles vacías o solo espacios
                    .map(calle => (
                    <SelectItem key={calle} value={calle}>
                      {calle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="houseNumber" className="text-right">
                Número*
              </Label>
              <Input
                id="houseNumber"
                name="houseNumber"
                value={nuevoUsuarioForm.houseNumber}
                onChange={handleInputChange}
                className="col-span-3"
                required
              />
            </div>
          </>
        )}

        {/* Campo de contraseña para todos los usuarios */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="password" className="text-right">
            Contraseña*
          </Label>
          <div className="col-span-3 space-y-2">
            <Input
              id="password"
              name="password"
              type="password"
              value={nuevoUsuarioForm.password}
              onChange={handleInputChange}
              required
            />
            <p className="text-xs text-muted-foreground">
              Ingrese una contraseña segura para el usuario.
            </p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setShowNuevoUsuarioDialog(false)}>
          Cancelar
        </Button>
        <Button onClick={handleCrearUsuario} disabled={creandoUsuario}>
          {creandoUsuario ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Crear Usuario
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default NuevoUsuarioDialogContent; 