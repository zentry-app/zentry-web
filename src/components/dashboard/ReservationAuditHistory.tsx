"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  History,
  Clock,
  User,
  FileText,
  ChevronRight,
  Key,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs, where, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';

interface AuditEvent {
  id: string;
  reservationId: string;
  residencialId: string;
  eventType: string;
  description: string;
  timestamp: Date;
  performedBy?: string;
  performedByName?: string;
  performedByRole?: string;
  previousData?: Record<string, any>;
  newData?: Record<string, any>;
  reason?: string;
  metadata?: Record<string, any>;
}

interface ReservationAuditHistoryProps {
  reservationId: string;
  residencialId: string;
  trigger?: React.ReactNode;
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'created':
      return <FileText className="h-4 w-4 text-blue-500" />;
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'keys_delivered':
      return <Key className="h-4 w-4 text-orange-500" />;
    case 'keys_received':
      return <Key className="h-4 w-4 text-purple-500" />;
    case 'cancelled_by_user':
      return <XCircle className="h-4 w-4 text-gray-500" />;
    case 'deleted_by_user':
      return <Trash2 className="h-4 w-4 text-red-600" />;
    case 'keys_correction':
      return <Settings className="h-4 w-4 text-yellow-500" />;
    case 'status_changed':
      return <AlertTriangle className="h-4 w-4 text-cyan-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

const getEventColor = (eventType: string) => {
  switch (eventType) {
    case 'created':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'keys_delivered':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'keys_received':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'cancelled_by_user':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'deleted_by_user':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'keys_correction':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'status_changed':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'Hace unos segundos';
  } else if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  } else if (diffInMinutes < 1440) { // 24 horas
    const hours = Math.floor(diffInMinutes / 60);
    return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  } else if (diffInMinutes < 10080) { // 7 días
    const days = Math.floor(diffInMinutes / 1440);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  } else {
    return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
  }
};

export function ReservationAuditHistory({ 
  reservationId, 
  residencialId, 
  trigger 
}: ReservationAuditHistoryProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Función para formatear cambios de manera amigable
  const formatChanges = (data: any) => {
    if (!data) return 'Sin datos';
    
    const friendlyLabels: { [key: string]: string } = {
      status: 'Estado',
      estadoLlaves: 'Estado de llaves',
      entregadoPor: 'Entregado por',
      recibidoPor: 'Recibido por',
      fechaEntregaLlaves: 'Fecha entrega',
      fechaRecepcionLlaves: 'Fecha recepción',
      aprobada: 'Aprobada',
      pendiente: 'Pendiente',
      en_curso: 'En curso',
      finalizado: 'Finalizado',
      cancelada: 'Cancelada',
      rechazada: 'Rechazada',
      entregadas: 'Entregadas',
      recibidas: 'Recibidas',
      retraso: 'En retraso'
    };

    if (typeof data === 'string') {
      return friendlyLabels[data] || data;
    }

    if (typeof data === 'object') {
      return Object.entries(data).map(([key, value]) => {
        const friendlyKey = friendlyLabels[key] || key;
        const friendlyValue = typeof value === 'string' 
          ? (friendlyLabels[value] || value)
          : String(value);
        return `${friendlyKey}: ${friendlyValue}`;
      }).join('\n');
    }

    return String(data);
  };

  const loadAuditHistory = async () => {
    if (!reservationId) {
      console.log('❌ [AUDIT] Falta reservationId:', { reservationId, residencialId });
      return;
    }
    
    console.log('🔍 [AUDIT] Cargando historial para:', { reservationId, residencialId });
    console.log('🔍 [AUDIT] Verificando si residencialId es global:', residencialId === 'global');
    
    setLoading(true);
    try {
      let actualResidencialId = residencialId;
      
      // Si el residencialId es 'global', necesitamos encontrar el residencial real de la reserva
      if (residencialId === 'global' || !residencialId) {
        console.log('🔍 [AUDIT] Buscando residencial real para la reserva...');
        
        // Buscar la reserva en todos los residenciales
        const residencialesSnapshot = await getDocs(collection(db, 'residenciales'));
        
        for (const residencialDoc of residencialesSnapshot.docs) {
          if (residencialDoc.id === 'global') continue; // Saltar el documento global
          
          const reservationRef = doc(db, 'residenciales', residencialDoc.id, 'reservaciones', reservationId);
          const reservationSnap = await getDoc(reservationRef);
          
          if (reservationSnap.exists()) {
            actualResidencialId = residencialDoc.id;
            console.log('✅ [AUDIT] Reserva encontrada en residencial:', actualResidencialId);
            break;
          }
        }
        
        if (actualResidencialId === 'global' || !actualResidencialId) {
          console.error('❌ [AUDIT] No se pudo encontrar la reserva en ningún residencial');
          setEvents([]);
          return;
        }
      }
      
      const historialRef = collection(
        db,
        'residenciales',
        actualResidencialId,
        'reservaciones',
        reservationId,
        'historial'
      );
      
      console.log('📍 [AUDIT] Ruta de consulta:', `residenciales/${actualResidencialId}/reservaciones/${reservationId}/historial`);
      
      const q = query(historialRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      
      console.log('📊 [AUDIT] Documentos encontrados:', snapshot.docs.length);
      
      const auditEvents: AuditEvent[] = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 [AUDIT] Evento encontrado:', { id: doc.id, eventType: data.eventType, description: data.description });
        return {
          id: doc.id,
          reservationId: data.reservationId,
          residencialId: data.residencialId,
          eventType: data.eventType,
          description: data.description,
          timestamp: data.timestamp?.toDate() || new Date(),
          performedBy: data.performedBy,
          performedByName: data.performedByName,
          performedByRole: data.performedByRole,
          previousData: data.previousData,
          newData: data.newData,
          reason: data.reason,
          metadata: data.metadata,
        };
      });
      
      console.log('✅ [AUDIT] Eventos procesados:', auditEvents.length);
      setEvents(auditEvents);
    } catch (error) {
      console.error('❌ [AUDIT] Error cargando historial de auditoría:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRetroactiveHistory = async () => {
    if (!reservationId) return;
    
    console.log('🔄 [AUDIT] Generando historial retroactivo...');
    
    // Verificar si ya existen eventos para evitar duplicación
    if (events.length > 0) {
      const confirmGenerate = window.confirm(
        `Ya existen ${events.length} eventos en el historial. ¿Estás seguro de que quieres generar eventos adicionales? Esto podría crear duplicados.`
      );
      if (!confirmGenerate) return;
    }
    
    setLoading(true);
    try {
      let actualResidencialId = residencialId;
      
      // Si el residencialId es 'global', buscar el residencial real
      if (residencialId === 'global' || !residencialId) {
        console.log('🔍 [AUDIT] Buscando residencial real para generar historial...');
        
        const residencialesSnapshot = await getDocs(collection(db, 'residenciales'));
        
        for (const residencialDoc of residencialesSnapshot.docs) {
          if (residencialDoc.id === 'global') continue;
          
          const reservationRef = doc(db, 'residenciales', residencialDoc.id, 'reservaciones', reservationId);
          const reservationSnap = await getDoc(reservationRef);
          
          if (reservationSnap.exists()) {
            actualResidencialId = residencialDoc.id;
            console.log('✅ [AUDIT] Reserva encontrada en residencial:', actualResidencialId);
            break;
          }
        }
        
        if (actualResidencialId === 'global' || !actualResidencialId) {
          console.error('❌ [AUDIT] No se pudo encontrar la reserva para generar historial');
          return;
        }
      }
      
      // Obtener datos de la reserva
      const reservationRef = doc(db, 'residenciales', actualResidencialId, 'reservaciones', reservationId);
      const reservationSnap = await getDoc(reservationRef);
      
      if (!reservationSnap.exists()) {
        console.error('❌ [AUDIT] Reserva no encontrada');
        return;
      }
      
      const reservationData = reservationSnap.data();
      console.log('📄 [AUDIT] Datos de reserva:', reservationData);
      
      // Crear evento de creación retroactivo
      const historialRef = collection(db, 'residenciales', actualResidencialId, 'reservaciones', reservationId, 'historial');
      
      const createdEvent = {
        reservationId: reservationId,
        residencialId: actualResidencialId,
        eventType: 'created',
        description: `Reserva creada por ${reservationData.userName || 'Usuario'}`,
        timestamp: reservationData.createdAt || serverTimestamp(),
        performedBy: reservationData.userId,
        performedByName: reservationData.userName || 'Usuario',
        performedByRole: 'residente',
        previousData: null,
        newData: {
          status: 'pendiente',
          areaName: reservationData.areaName,
          fecha: reservationData.fecha,
          duracion: reservationData.duracion,
        },
      };
      
      await addDoc(historialRef, createdEvent);
      console.log('✅ [AUDIT] Evento de creación generado');
      
      // Si está aprobada, crear evento de aprobación
      if (reservationData.status === 'aprobada' || reservationData.status === 'en_curso' || reservationData.status === 'finalizado') {
        const approvedEvent = {
          reservationId: reservationId,
          residencialId: actualResidencialId,
          eventType: 'approved',
          description: `Reserva aprobada por ${reservationData.aprobadoPor || 'Administrador'}`,
          timestamp: reservationData.aprobadoEn || reservationData.createdAt || serverTimestamp(),
          performedBy: reservationData.aprobadoPor || 'admin',
          performedByName: reservationData.aprobadoPor || 'Administrador',
          performedByRole: 'admin',
          previousData: { status: 'pendiente' },
          newData: { status: 'aprobada' },
        };
        
        await addDoc(historialRef, approvedEvent);
        console.log('✅ [AUDIT] Evento de aprobación generado');
      }
      
      // Si tiene llaves entregadas, crear evento de entrega
      if (reservationData.estadoLlaves === 'entregadas' || reservationData.estadoLlaves === 'recibidas') {
        const deliveredEvent = {
          reservationId: reservationId,
          residencialId: actualResidencialId,
          eventType: 'keys_delivered',
          description: `Llaves entregadas por ${reservationData.entregadoPor || 'Guardia'}`,
          timestamp: reservationData.fechaEntregaLlaves || reservationData.createdAt || serverTimestamp(),
          performedBy: reservationData.entregadoPor || 'guard',
          performedByName: reservationData.entregadoPor || 'Guardia',
          performedByRole: 'security',
          previousData: { status: 'aprobada', estadoLlaves: 'pendiente' },
          newData: { status: 'en_curso', estadoLlaves: 'entregadas' },
        };
        
        await addDoc(historialRef, deliveredEvent);
        console.log('✅ [AUDIT] Evento de entrega de llaves generado');
      }
      
      // Si tiene llaves recibidas, crear evento de recepción
      if (reservationData.estadoLlaves === 'recibidas') {
        const receivedEvent = {
          reservationId: reservationId,
          residencialId: actualResidencialId,
          eventType: 'keys_received',
          description: `Llaves recibidas por ${reservationData.recibidoPor || 'Guardia'}`,
          timestamp: reservationData.fechaRecepcionLlaves || reservationData.createdAt || serverTimestamp(),
          performedBy: reservationData.recibidoPor || 'guard',
          performedByName: reservationData.recibidoPor || 'Guardia',
          performedByRole: 'security',
          previousData: { status: 'en_curso', estadoLlaves: 'entregadas' },
          newData: { status: 'finalizado', estadoLlaves: 'recibidas' },
        };
        
        await addDoc(historialRef, receivedEvent);
        console.log('✅ [AUDIT] Evento de recepción de llaves generado');
      }
      
      console.log('🎉 [AUDIT] Historial retroactivo generado completamente');
      
      // Recargar el historial
      await loadAuditHistory();
      
    } catch (error) {
      console.error('❌ [AUDIT] Error generando historial retroactivo:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadAuditHistory();
    }
  }, [open, reservationId, residencialId]);

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <History className="h-4 w-4" />
      Historial
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Auditoría
          </DialogTitle>
          <DialogDescription>
            Registro cronológico de todos los eventos relacionados con esta reserva
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay eventos registrados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={event.id} className="relative">
                  {/* Línea de tiempo */}
                  {index < events.length - 1 && (
                    <div className="absolute left-6 top-12 w-px h-8 bg-gray-200"></div>
                  )}
                  
                  <div className="flex gap-4 p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors">
                    {/* Icono del evento */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 flex items-center justify-center">
                      {getEventIcon(event.eventType)}
                    </div>
                    
                    {/* Contenido del evento */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-1">
                            {event.description}
                          </p>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <User className="h-3 w-3" />
                            <span>{event.performedByName || 'Sistema'}</span>
                            {event.performedByRole && (
                              <Badge variant="outline" className="text-xs">
                                {event.performedByRole}
                              </Badge>
                            )}
                          </div>
                          
                          {event.reason && (
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Razón:</strong> {event.reason}
                            </p>
                          )}
                          
                          {/* Cambios de datos */}
                          {(event.previousData || event.newData) && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-md">
                              <p className="text-xs font-medium text-gray-700 mb-2">Cambios:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                {event.previousData && (
                                  <div>
                                    <span className="font-medium text-red-600">Anterior:</span>
                                    <div className="mt-1 text-gray-600 whitespace-pre-wrap bg-red-50 p-2 rounded">
                                      {formatChanges(event.previousData)}
                                    </div>
                                  </div>
                                )}
                                {event.newData && (
                                  <div>
                                    <span className="font-medium text-green-600">Nuevo:</span>
                                    <div className="mt-1 text-gray-600 whitespace-pre-wrap bg-green-50 p-2 rounded">
                                      {formatChanges(event.newData)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={getEventColor(event.eventType)}>
                            {event.eventType}
                          </Badge>
                          <div className="text-xs text-gray-500 text-right">
                            <div>{formatRelativeTime(event.timestamp)}</div>
                            <div>{format(event.timestamp, 'dd/MM/yyyy HH:mm', { locale: es })}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="flex justify-between gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={generateRetroactiveHistory}
            disabled={loading}
            className="gap-2 text-xs"
          >
            <Settings className="h-3 w-3" />
            Generar Historial
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={loadAuditHistory} disabled={loading} className="gap-2">
              <History className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
