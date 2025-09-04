import React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AreaComun } from "@/lib/firebase/firestore"; // Asumiendo tipo

interface ConfirmarEliminarAreaComunDialogContentProps {
  currentArea: AreaComun | null;
  handleDelete: () => Promise<void>;
  setDeleteConfirmOpen: (open: boolean) => void;
  loading: boolean;
}

const ConfirmarEliminarAreaComunDialogContent: React.FC<ConfirmarEliminarAreaComunDialogContentProps> = ({
  currentArea,
  handleDelete,
  setDeleteConfirmOpen,
  loading,
}) => {
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogDescription>
          ¿Seguro que quieres eliminar "{currentArea?.nombre}"? Esta acción no se puede deshacer.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => { console.log('[DialogFooter-Eliminar] Botón Cancelar clickeado'); setDeleteConfirmOpen(false); }}>Cancelar</Button>
        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
          {loading ? "Eliminando..." : "Eliminar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ConfirmarEliminarAreaComunDialogContent; 