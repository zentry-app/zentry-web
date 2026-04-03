import React from 'react';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash } from "lucide-react";
import { Usuario } from "@/lib/firebase/firestore";

interface ConfirmarEliminarDialogContentProps {
  usuarioAEliminar: Usuario | null;
  onCloseDialog: () => void;
  onConfirmDelete: () => void;
  eliminandoUsuario: boolean;
}

const ConfirmarEliminarDialogContent: React.FC<ConfirmarEliminarDialogContentProps> = ({
  usuarioAEliminar,
  onCloseDialog,
  onConfirmDelete,
  eliminandoUsuario,
}) => {
  if (!usuarioAEliminar) return null;

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogDescription>
          ¿Estás seguro que deseas eliminar al usuario{" "}
          <strong>{usuarioAEliminar.fullName || "Usuario Desconocido"}</strong>?
          Esta acción no se puede deshacer.
        </DialogDescription>
      </DialogHeader>

      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md border border-amber-200 dark:border-amber-800 mt-2">
        <div className="flex items-start">
          <div className="mr-2 mt-0.5">⚠️</div>
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-medium">Advertencia:</p>
            <p>
              Esta acción eliminará permanentemente al usuario y todos sus datos asociados.
              El usuario no podrá iniciar sesión después de ser eliminado.
            </p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCloseDialog}>
          Cancelar
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirmDelete}
          disabled={eliminandoUsuario}
        >
          {eliminandoUsuario ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Eliminando...
            </>
          ) : (
            <>
              <Trash className="mr-2 h-4 w-4" />
              Eliminar Usuario
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ConfirmarEliminarDialogContent; 