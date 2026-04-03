"use client";

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
import { Badge } from "@/components/ui/badge";
import { Eye, Home } from "lucide-react";
import { Ingreso } from "@/types/ingresos";

// Tipo para resumen de casas con ingresos
export type CasaResumenIngresos = {
  key: string; // Clave única: `${calle}#${houseNumber}`
  calle: string;
  houseNumber: string;
  residencialID: string;
  ingresos: Ingreso[];
  total: number;
  activos: number;
  completados: number;
  conVehiculo: number;
};

interface VistaPorCasaProps {
  casas: CasaResumenIngresos[];
  onVerDetalles: (casa: CasaResumenIngresos) => void;
  getResidencialNombre: (docId: string | undefined) => string;
}

// Función para capitalizar nombres
const capitalizeName = (name: string): string => {
  if (!name) return '';
  return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const VistaPorCasa: React.FC<VistaPorCasaProps> = ({
  casas,
  onVerDetalles,
  getResidencialNombre,
}) => {
  if (casas.length === 0) {
    return (
      <div className="text-center py-10">
        <Home className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">No hay casas con ingresos para mostrar</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px] text-center">#</TableHead>
            <TableHead>Casa</TableHead>
            <TableHead>Residencial</TableHead>
            <TableHead className="w-[120px] text-center">Total</TableHead>
            <TableHead className="w-[120px] text-center">Activos</TableHead>
            <TableHead className="w-[120px] text-center">Completados</TableHead>
            <TableHead className="w-[120px] text-center">Con Vehículo</TableHead>
            <TableHead className="w-[120px] text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {casas.map((casa, index) => (
            <TableRow key={casa.key}>
              <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
              <TableCell>
                {(casa.calle || casa.houseNumber) ? (
                  <div className="text-sm font-medium">
                    {capitalizeName(casa.calle || 'Calle s/d')} #{casa.houseNumber || ''}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Sin calle/número</div>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{casa.residencialID || 'N/A'}</Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary">{casa.total}</Badge>
              </TableCell>
              <TableCell className="text-center">
                {casa.activos > 0 ? (
                  <Badge variant="default" className="bg-green-500">{casa.activos}</Badge>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {casa.completados > 0 ? (
                  <Badge variant="default" className="bg-blue-500">{casa.completados}</Badge>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {casa.conVehiculo > 0 ? (
                  <Badge variant="outline">{casa.conVehiculo}</Badge>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <Button
                  size="sm"
                  variant="outline"
                  title="Ver ingresos de la casa"
                  onClick={() => onVerDetalles(casa)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default VistaPorCasa;
