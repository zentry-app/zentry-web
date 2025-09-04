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
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2, DollarSign, CreditCard, MapPin, Home } from "lucide-react";
import { Pago } from "@/types/pagos"; // Importar desde tipos actualizados

interface TablaPagosProps {
  loading: boolean;
  filteredPagos: Pago[];
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  formatDate: (timestamp: any) => string;
  formatAmount: (amount: number, currency?: string, paymentMethod?: string) => string;
  handleOpenDetails: (pago: Pago) => void;
}

const TablaPagos: React.FC<TablaPagosProps> = ({
  loading,
  filteredPagos,
  getStatusColor,
  getStatusLabel,
  formatDate,
  formatAmount,
  handleOpenDetails,
}) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[120px]">Estado</TableHead>
            <TableHead className="min-w-[140px]">Fecha</TableHead>
            <TableHead className="min-w-[200px]">Usuario</TableHead>
            <TableHead className="min-w-[180px]">Domicilio</TableHead>
            <TableHead className="min-w-[120px]">Monto</TableHead>
            <TableHead className="min-w-[160px]">Método de Pago</TableHead>
            <TableHead className="min-w-[200px]">Descripción</TableHead>
            <TableHead className="min-w-[120px]">Residencial</TableHead>
            <TableHead className="min-w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                <div className="flex justify-center items-center">
                  <Loader2 className="h-6 w-6 text-primary animate-spin mr-2" />
                  <span>Cargando pagos...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : filteredPagos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                No se encontraron pagos
              </TableCell>
            </TableRow>
          ) : (
            filteredPagos.map((pago) => (
              <TableRow key={pago.id} className="hover:bg-muted/50">
                <TableCell>
                  <Badge className={getStatusColor(pago.status)}>
                    {getStatusLabel(pago.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="font-medium">
                    {formatDate(pago.timestamp)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{pago.userName || "Sin nombre"}</div>
                    <div className="text-xs text-muted-foreground">{pago.userEmail || "Sin email"}</div>
                    <div className="text-xs text-muted-foreground">ID: {pago.userId ? pago.userId.substring(0, 8) + "..." : "Sin ID"}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1 text-sm font-medium">
                      <Home className="h-3 w-3 text-blue-500" />
                      <span>
                        {pago.userAddress?.calle || "Sin calle"} #{pago.userAddress?.houseNumber || "S/N"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{pago.userAddress?.pais || "Sin país"}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Res: {pago.userAddress?.residencialID || "Sin residencial"}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="font-bold text-green-600">
                        {formatAmount(pago.amount, pago.currency, pago.paymentMethod)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {pago.currency || "MXN"}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-blue-500" />
                      <div className="font-medium text-sm">{pago.paymentMethod || "Sin método"}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pago.paymentMethodDetails?.brand || "Sin marca"} •••• {pago.paymentMethodDetails?.last4 || "0000"}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {pago.paymentMethodDetails?.funding || "Sin tipo"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <div className="text-sm truncate" title={pago.description}>
                      {pago.description || "Sin descripción"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      ID: {pago.paymentIntentId ? pago.paymentIntentId.substring(0, 12) + "..." : "Sin ID"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">
                      {pago._residencialNombre || "Desconocido"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pago.residentialId || "Sin ID"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDetails(pago)}
                    className="flex items-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Ver</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TablaPagos; 