import React from 'react';
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, XCircle, ExternalLink } from "lucide-react";

interface MostrarDocumentoDialogContentProps {
  documentoSeleccionado: string | null;
  documentoNombre: string;
  documentoURL: string | null;
  isLoadingDocument: boolean;
  onCloseDialog: () => void;
}

const MostrarDocumentoDialogContent: React.FC<MostrarDocumentoDialogContentProps> = ({
  documentoSeleccionado,
  documentoNombre,
  documentoURL,
  isLoadingDocument,
  onCloseDialog,
}) => {
  if (!documentoSeleccionado && !isLoadingDocument) return null; // No mostrar si no hay doc y no está cargando

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Documento: {documentoNombre}</DialogTitle>
        <div className="text-sm text-muted-foreground">
          <span>Ruta: {documentoSeleccionado}</span>
          {documentoSeleccionado && documentoSeleccionado.startsWith('public_registration') && (
            <div className="mt-2 p-2 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200">
              <div className="font-medium">Permisos requeridos:</div>
              <div>Para ver este documento, debes ser administrador del residencial o el propietario del documento.</div>
            </div>
          )}
        </div>
      </DialogHeader>

      <div className="w-full h-[70vh] relative flex items-center justify-center bg-muted rounded-md overflow-hidden">
        {isLoadingDocument ? (
          <div className="flex flex-col items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p>Cargando documento...</p>
          </div>
        ) : documentoURL ? (
          <>
            <img
              src={documentoURL}
              alt={documentoNombre}
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => window.open(documentoURL, '_blank')}
              title="Abrir en nueva pestaña"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <XCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-muted-foreground mb-2">No se pudo cargar el documento</p>

            <div className="max-w-md text-sm bg-red-50 text-red-700 p-3 rounded-md border border-red-200">
              <p className="font-medium mb-1">Posibles causas:</p>
              <ul className="list-disc pl-5">
                <li>No tienes permisos para ver este documento</li>
                <li>El documento ya no existe en el servidor</li>
                <li>La ruta del documento es incorrecta</li>
                <li>Tu sesión ha expirado</li>
              </ul>
              <p className="mt-2">Intenta iniciar sesión nuevamente o contacta al administrador del sistema.</p>
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCloseDialog}>Cerrar</Button>
        {documentoURL && (
          <Button onClick={() => window.open(documentoURL, '_blank')}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir en nueva ventana
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
};

export default MostrarDocumentoDialogContent; 