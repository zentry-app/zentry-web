import React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AreaComun } from "@/lib/firebase/firestore";
import { AlertTriangle, Trash2 } from "lucide-react";

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
    <DialogContent className="max-w-md p-0 overflow-hidden bg-white/95 backdrop-blur-xl rounded-[2rem] border-none shadow-2xl ring-1 ring-white/50">
      <div className="bg-red-50 p-8 flex flex-col items-center text-center border-b border-red-100">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-red-900 mb-2 text-center">
            ¿Eliminar Amenidad?
          </DialogTitle>
          <DialogDescription className="text-red-700/80 font-medium text-center text-base">
            Estás a punto de eliminar <span className="font-bold text-red-900">"{currentArea?.nombre}"</span>. <br />
            Esta acción es irreversible y eliminará todos los datos asociados.
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="p-6 bg-white space-y-3">
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
          className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-red-200 hover:shadow-red-300 transition-all hover:scale-[1.02] active:scale-95 bg-red-600 hover:bg-red-700"
        >
          {loading ? "Eliminando..." : (
            <span className="flex items-center justify-center gap-2">
              <Trash2 className="h-5 w-5" /> Sí, eliminar definitivamente
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={() => { console.log('[DialogFooter-Eliminar] Botón Cancelar clickeado'); setDeleteConfirmOpen(false); }}
          className="w-full h-12 rounded-xl text-slate-500 font-bold hover:bg-slate-50"
        >
          Cancelar
        </Button>
      </div>
    </DialogContent>
  );
};

export default ConfirmarEliminarAreaComunDialogContent;