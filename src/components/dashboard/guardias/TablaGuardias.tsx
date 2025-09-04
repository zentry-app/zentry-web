import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2 } from "lucide-react";
import { Guardia } from "@/lib/firebase/firestore"; // Asumiendo tipo Guardia

interface TablaGuardiasProps {
  loading: boolean;
  filteredGuardias: (Guardia & { _residencialId?: string })[];
  getUsuarioPhoto: (id: string | undefined | null) => string;
  getUsuarioInitials: (id: string | undefined | null) => string;
  getUsuarioNombre: (id: string | undefined | null) => string;
  getResidencialNombre: (id: string | undefined | null) => string;
  formatDias: (dias: string[] | undefined | null) => string;
  formatHora: (hora24: string | undefined | null) => string;
  handleOpenDialog: (guardia: Guardia & { _residencialId?: string }) => void;
  handleDeleteConfirm: (guardia: Guardia & { _residencialId?: string }) => void;
}

const TablaGuardias: React.FC<TablaGuardiasProps> = ({
  loading,
  filteredGuardias,
  getUsuarioPhoto,
  getUsuarioInitials,
  getUsuarioNombre,
  getResidencialNombre,
  formatDias,
  formatHora,
  handleOpenDialog,
  handleDeleteConfirm,
}) => {
  if (loading) { // Mostrar esqueletos si está cargando, independientemente de si hay guardias o no
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Guardia</TableHead>
            <TableHead>Residencial</TableHead>
            <TableHead>Días</TableHead>
            <TableHead>Horario</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredGuardias.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No se encontraron guardias
              </TableCell>
            </TableRow>
          ) : (
            filteredGuardias.map((guardia) => (
              <TableRow key={guardia.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={getUsuarioPhoto(guardia.usuarioId)} />
                      <AvatarFallback>{getUsuarioInitials(guardia.usuarioId)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{getUsuarioNombre(guardia.usuarioId)}</p>
                      {!guardia.usuarioId?.startsWith("guardia-") && guardia.usuarioId && (
                        <p className="text-xs text-muted-foreground">
                          ID: {guardia.usuarioId.substring(0, 8)}...
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getResidencialNombre(guardia._residencialId || "")}</TableCell>
                <TableCell>{formatDias(guardia.horario?.dias)}</TableCell>
                <TableCell>{guardia.horario ? `${formatHora(guardia.horario.horaEntrada)} - ${formatHora(guardia.horario.horaSalida)}` : 'N/A'}</TableCell>
                <TableCell>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    !guardia.estado || guardia.estado === 'activo' 
                      ? 'bg-green-100 text-green-800' 
                      : guardia.estado === 'inactivo' 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {!guardia.estado || guardia.estado === 'activo' 
                      ? 'Activo' 
                      : guardia.estado === 'inactivo' 
                        ? 'Inactivo' 
                        : 'Vacaciones'}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenDialog(guardia)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeleteConfirm(guardia)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TablaGuardias; 