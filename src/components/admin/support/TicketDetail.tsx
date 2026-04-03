'use client';

import { useState, useEffect, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { SupportTicket } from '@/types/support';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircle2,
  User,
  Mail,
  Calendar,
  FileText,
  Clock,
  CalendarClock,
  AlertTriangle,
  MessageSquare,
  Send,
  ImagePlus,
  X,
} from 'lucide-react';
import { SupportService } from '@/lib/services/support-service';
import { TicketRespuesta } from '@/types/support';

interface TicketDetailProps {
  ticket: SupportTicket;
  onUpdate: (ticketId: string, estado: string, resolucion?: string) => void;
  onAssign: (ticketId: string, adminId: string) => void;
  onUpdateFechaResolucionPrevista?: (ticketId: string, fecha: Date | null) => void;
  onAddRespuesta?: (ticketId: string, texto: string, archivos?: File[]) => Promise<void>;
}

function toDate(value: Timestamp | Date | string | undefined | null): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value as string);
}

function formatDuration(hours: number): string {
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins} min`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)} h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return remainingHours > 0 ? `${days} d ${remainingHours} h` : `${days} d`;
}

export function TicketDetail({
  ticket,
  onUpdate,
  onAssign,
  onUpdateFechaResolucionPrevista,
  onAddRespuesta,
}: TicketDetailProps) {
  const [resolucion, setResolucion] = useState('');
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [respuestas, setRespuestas] = useState<TicketRespuesta[]>([]);
  const [loadingRespuestas, setLoadingRespuestas] = useState(false);
  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [respuestaArchivos, setRespuestaArchivos] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  const puedeResponder = ticket.estado !== 'resuelto' && ticket.estado !== 'cerrado';

  const loadRespuestas = useCallback(async () => {
    setLoadingRespuestas(true);
    try {
      const list = await SupportService.getTicketRespuestas(ticket.residencialId, ticket.ticketId);
      setRespuestas(list);
    } catch {
      setRespuestas([]);
    } finally {
      setLoadingRespuestas(false);
    }
  }, [ticket.residencialId, ticket.ticketId]);

  useEffect(() => {
    loadRespuestas();
  }, [loadRespuestas]);

  const handleSendRespuesta = async () => {
    if (!respuestaTexto.trim() || !onAddRespuesta || !puedeResponder) return;
    setSending(true);
    try {
      await onAddRespuesta(ticket.ticketId, respuestaTexto, respuestaArchivos.length > 0 ? respuestaArchivos : undefined);
      setRespuestaTexto('');
      setRespuestaArchivos([]);
      await loadRespuestas();
    } finally {
      setSending(false);
    }
  };
  const [fechaPrevistaInput, setFechaPrevistaInput] = useState<string>(
    (() => {
      const d = toDate(ticket.fechaResolucionPrevista);
      return d ? format(d, 'yyyy-MM-dd') : '';
    })()
  );
  const [savingFecha, setSavingFecha] = useState(false);

  const fechaCreacion = toDate(ticket.fechaCreacion) ?? new Date();
  const fechaResolucion = toDate(ticket.fechaResolucion);
  const fechaPrimeraRespuesta = toDate(ticket.fechaPrimeraRespuesta);
  const fechaResolucionPrevista = toDate(ticket.fechaResolucionPrevista);

  const now = new Date();
  const isVencido =
    fechaResolucionPrevista &&
    fechaResolucionPrevista < now &&
    ticket.estado !== 'resuelto' &&
    ticket.estado !== 'cerrado';

  const tiempoPrimeraRespuestaHoras = fechaPrimeraRespuesta
    ? (fechaPrimeraRespuesta.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60)
    : null;

  const handleResolve = () => {
    if (resolucion.trim()) {
      onUpdate(ticket.ticketId, 'resuelto', resolucion);
      setShowResolveDialog(false);
      setResolucion('');
    }
  };

  const handleSaveFechaPrevista = async () => {
    if (!onUpdateFechaResolucionPrevista) return;
    setSavingFecha(true);
    try {
      const fecha = fechaPrevistaInput ? new Date(fechaPrevistaInput + 'T23:59:59') : null;
      await onUpdateFechaResolucionPrevista(ticket.ticketId, fecha);
    } finally {
      setSavingFecha(false);
    }
  };

  const handleClearFechaPrevista = async () => {
    if (!onUpdateFechaResolucionPrevista) return;
    setSavingFecha(true);
    try {
      setFechaPrevistaInput('');
      await onUpdateFechaResolucionPrevista(ticket.ticketId, null);
    } finally {
      setSavingFecha(false);
    }
  };

  return (
    <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <div className="flex justify-between items-start gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-xl font-bold truncate">{ticket.titulo}</CardTitle>
            <CardDescription className="text-slate-500 text-xs mt-1">ID: {ticket.ticketId}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isVencido && (
              <Badge className="bg-red-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Vencido
              </Badge>
            )}
            <Badge
              className={
                ticket.estado === 'resuelto'
                  ? 'bg-green-500'
                  : ticket.estado === 'en_proceso'
                  ? 'bg-yellow-500'
                  : ticket.estado === 'cerrado'
                  ? 'bg-gray-500'
                  : 'bg-blue-500'
              }
            >
              {ticket.estado === 'en_proceso' ? 'En proceso' : ticket.estado}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-8 pb-8 space-y-5">
        {/* Info del usuario */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{ticket.userName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{ticket.userEmail}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Creado: {format(fechaCreacion, 'dd/MM/yyyy HH:mm', { locale: es })}
            </span>
          </div>
        </div>

        {/* Primera respuesta (solo lectura) */}
        <div className="p-3 rounded-md bg-muted/50 border">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Primera respuesta</Label>
          </div>
          {tiempoPrimeraRespuestaHoras !== null ? (
            <p className="text-sm text-muted-foreground ml-6">
              Respondido en{' '}
              <span className="font-semibold text-foreground">
                {formatDuration(tiempoPrimeraRespuestaHoras)}
              </span>
              {' '}
              <span className="text-xs">
                ({format(fechaPrimeraRespuesta!, 'dd/MM/yyyy HH:mm', { locale: es })})
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground ml-6">
              {ticket.estado === 'abierto'
                ? 'Pendiente de primera respuesta'
                : 'Sin registro'}
            </p>
          )}
        </div>

        {/* Fecha prevista de resolución */}
        {ticket.estado !== 'resuelto' && ticket.estado !== 'cerrado' && onUpdateFechaResolucionPrevista && (
          <div className="p-3 rounded-md border bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Fecha prevista de resolución</Label>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <Input
                type="date"
                value={fechaPrevistaInput}
                onChange={(e) => setFechaPrevistaInput(e.target.value)}
                className="w-44 h-8 text-sm"
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveFechaPrevista}
                disabled={savingFecha || !fechaPrevistaInput}
                className="h-8"
              >
                {savingFecha ? 'Guardando...' : 'Guardar'}
              </Button>
              {fechaResolucionPrevista && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleClearFechaPrevista}
                  disabled={savingFecha}
                  className="h-8 text-xs text-muted-foreground"
                >
                  Quitar
                </Button>
              )}
            </div>
            {isVencido && (
              <p className="text-xs text-red-500 ml-6 mt-1">
                La fecha prevista ya venció ({format(fechaResolucionPrevista!, 'dd/MM/yyyy', { locale: es })})
              </p>
            )}
          </div>
        )}

        {/* Fecha prevista (solo lectura si resuelto/cerrado) */}
        {(ticket.estado === 'resuelto' || ticket.estado === 'cerrado') && fechaResolucionPrevista && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            Fecha prevista fue: {format(fechaResolucionPrevista, 'dd/MM/yyyy', { locale: es })}
          </div>
        )}

        <div className="flex gap-4">
          <div>
            <Label>Categoría</Label>
            <Badge variant="outline" className="mt-1 block w-fit">
              {ticket.categoria}
            </Badge>
          </div>
          <div>
            <Label>Prioridad</Label>
            <Badge
              className={`mt-1 block w-fit ${
                ticket.prioridad === 'urgente'
                  ? 'bg-red-500'
                  : ticket.prioridad === 'alta'
                  ? 'bg-orange-500'
                  : ticket.prioridad === 'media'
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
            >
              {ticket.prioridad}
            </Badge>
          </div>
        </div>

        <div>
          <Label>Descripción</Label>
          <div className="mt-1 p-3 bg-muted rounded-md">
            <p className="text-sm whitespace-pre-wrap">{ticket.descripcion}</p>
          </div>
        </div>

        {/* Respuestas / Responder al usuario - visible justo después de la descripción */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4 text-primary" />
            <Label className="text-sm font-semibold">Responder al usuario</Label>
          </div>
          {loadingRespuestas ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : respuestas.length > 0 ? (
            <div className="space-y-3 mb-4 max-h-36 overflow-y-auto">
              {respuestas.map((r) => {
                const fechaR = toDate(r.fecha);
                return (
                  <div
                    key={r.respuestaId}
                    className={`p-3 rounded-xl text-sm ${
                      r.enviadoPor === 'admin'
                        ? 'bg-primary/10 ml-4 border-l-2 border-primary'
                        : 'bg-slate-100 mr-4 border-r-2 border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-medium text-xs text-slate-600">
                        {r.nombre} {r.enviadoPor === 'admin' && '(Admin)'}
                      </span>
                      {fechaR && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(fechaR, 'dd/MM HH:mm', { locale: es })}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap">{r.texto}</p>
                    {r.archivos && r.archivos.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {r.archivos.map((a, i) => (
                          <a
                            key={i}
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            {a.nombre}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">
              Escribe un mensaje para comunicarte con el usuario.
            </p>
          )}
          {!puedeResponder ? (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Este ticket está cerrado. El usuario debe crear un nuevo reporte para más ayuda.
              </p>
            </div>
          ) : onAddRespuesta ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Escribe tu respuesta al usuario..."
                  value={respuestaTexto}
                  onChange={(e) => setRespuestaTexto(e.target.value)}
                  rows={3}
                  className="resize-none flex-1"
                  disabled={sending}
                />
                <Button
                  size="icon"
                  className="shrink-0 h-[72px] w-12"
                  onClick={handleSendRespuesta}
                  disabled={sending || !respuestaTexto.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files ? Array.from(e.target.files) : [];
                      setRespuestaArchivos((prev) => [...prev, ...files]);
                      e.target.value = '';
                    }}
                  />
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm">
                    <ImagePlus className="h-4 w-4" />
                    Adjuntar imágenes
                  </span>
                </label>
                {respuestaArchivos.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs"
                  >
                    {f.name}
                    <button
                      type="button"
                      onClick={() => setRespuestaArchivos((p) => p.filter((_, j) => j !== i))}
                      className="text-slate-500 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {ticket.archivos && ticket.archivos.length > 0 && (
          <div>
            <Label>Archivos adjuntos</Label>
            <div className="mt-1 space-y-1">
              {ticket.archivos.map((archivo, index) => (
                <a
                  key={index}
                  href={archivo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  {archivo.nombre}
                </a>
              ))}
            </div>
          </div>
        )}

        {ticket.resolucion && (
          <div>
            <Label>Resolución</Label>
            <div className="mt-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
              <p className="text-sm whitespace-pre-wrap">{ticket.resolucion}</p>
              {fechaResolucion && (
                <p className="text-xs text-muted-foreground mt-2">
                  Resuelto el {format(fechaResolucion, 'dd/MM/yyyy HH:mm', { locale: es })}
                </p>
              )}
            </div>
          </div>
        )}

        {ticket.estado !== 'resuelto' && ticket.estado !== 'cerrado' && (
          <div className="flex gap-2 pt-4 border-t">
            <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
              <DialogTrigger asChild>
                <Button className="flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Resolver
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Resolver Ticket</DialogTitle>
                  <DialogDescription>
                    Proporciona una descripción de la resolución
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Resolución</Label>
                    <Textarea
                      value={resolucion}
                      onChange={(e) => setResolucion(e.target.value)}
                      placeholder="Describe cómo se resolvió el problema..."
                      rows={5}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleResolve} disabled={!resolucion.trim()}>
                    Resolver Ticket
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Select
              value={ticket.estado}
              onValueChange={(value) => onUpdate(ticket.ticketId, value)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="abierto">Abierto</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="resuelto">Resuelto</SelectItem>
                <SelectItem value="cerrado">Cerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
