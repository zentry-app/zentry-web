'use client';

import { SupportTicket } from '@/types/support';
import { Timestamp } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle } from 'lucide-react';

interface TicketListProps {
  tickets: SupportTicket[];
  loading: boolean;
  onTicketSelect: (ticket: SupportTicket) => void;
  selectedTicketId?: string;
}

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'abierto':
      return 'bg-blue-500';
    case 'en_proceso':
      return 'bg-yellow-500';
    case 'resuelto':
      return 'bg-green-500';
    case 'cerrado':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
};

const getPrioridadColor = (prioridad: string) => {
  switch (prioridad) {
    case 'urgente':
      return 'bg-red-500';
    case 'alta':
      return 'bg-orange-500';
    case 'media':
      return 'bg-yellow-500';
    case 'baja':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

function toDate(value: Timestamp | Date | string | undefined | null): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value as string);
}

export function TicketList({
  tickets,
  loading,
  onTicketSelect,
  selectedTicketId,
}: TicketListProps) {
  const now = new Date();

  if (loading) {
    return (
      <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2">Tickets</CardTitle>
          <CardDescription>Cargando tickets...</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-xl font-bold">Tickets ({tickets.length})</CardTitle>
        <CardDescription className="text-slate-500">Lista de tickets de soporte</CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        {tickets.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-medium">
            No hay tickets disponibles. Los reportes creados desde la app aparecerán aquí.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/80 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Fecha prevista</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => {
                const fechaCreacion = toDate(ticket.fechaCreacion) ?? new Date();
                const fechaPrevista = toDate(ticket.fechaResolucionPrevista);
                const isVencido =
                  fechaPrevista &&
                  fechaPrevista < now &&
                  ticket.estado !== 'resuelto' &&
                  ticket.estado !== 'cerrado';

                return (
                  <TableRow
                    key={ticket.ticketId}
                    onClick={() => onTicketSelect(ticket)}
                    className={`cursor-pointer ${
                      selectedTicketId === ticket.ticketId ? 'bg-muted' : ''
                    } ${isVencido ? 'bg-red-50 dark:bg-red-950/20' : ''}`}
                  >
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {isVencido && (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 inline mr-1" />
                      )}
                      {ticket.titulo}
                    </TableCell>
                    <TableCell className="text-sm">{ticket.userName}</TableCell>
                    <TableCell>
                      <Badge className={getPrioridadColor(ticket.prioridad)}>
                        {ticket.prioridad}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getEstadoColor(ticket.estado)}>
                        {ticket.estado === 'en_proceso' ? 'En proceso' : ticket.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(fechaCreacion, 'dd/MM/yy', { locale: es })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {fechaPrevista ? (
                        <span className={isVencido ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                          {format(fechaPrevista, 'dd/MM/yy', { locale: es })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">--</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
