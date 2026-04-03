import React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Guardia } from "@/lib/firebase/firestore";

interface ConfirmarEliminarGuardiaDialogContentProps {
  currentGuardia: (Guardia & { _residencialId?: string }) | null;
  handleDelete: () => Promise<void>;
  setDeleteConfirmOpen: (open: boolean) => void;
  loading: boolean;
  getUsuarioNombre: (id: string | undefined | null) => string;
}

const ConfirmarEliminarGuardiaDialogContent: React.FC<ConfirmarEliminarGuardiaDialogContentProps> = ({
  currentGuardia,
  handleDelete,
  setDeleteConfirmOpen,
  loading,
  getUsuarioNombre,
}) => {
  return (
    <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl bg-white/95 backdrop-blur-3xl">
      <DialogHeader className="space-y-3 pb-6 border-b border-slate-100">
        <DialogTitle className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <span className="text-4xl">⚠️</span>
          Confirmar eliminación
        </DialogTitle>
        <DialogDescription className="text-base text-slate-600 font-medium leading-relaxed">
          ¿Estás seguro de que quieres eliminar al guardia{' '}
          <span className="font-black text-slate-900">
            {currentGuardia ? getUsuarioNombre(currentGuardia.usuarioId) : ''}
          </span>
          ?
          <br />
          <span className="text-red-600 font-bold">Esta acción no se puede deshacer.</span>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="gap-3 pt-6 border-t border-slate-100">
        <Button
          variant="outline"
          onClick={() => setDeleteConfirmOpen(false)}
          className="rounded-xl h-12 px-6 font-bold border-slate-200"
        >
          Cancelar
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
          className="rounded-xl h-12 px-8 font-bold shadow-lg"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Eliminando...
            </>
          ) : (
            'Eliminar'
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default ConfirmarEliminarGuardiaDialogContent; 