"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Bell, 
  MessageSquare, 
  Shield, 
  Users, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageNotification, MessageNotificationsService } from "@/lib/services/message-notifications-service";

interface NotificationsDropdownProps {
  messageNotifications: MessageNotification[];
  systemNotificationsCount: number;
  panicAlertsCount: number;
  pendingReservationsCount: number;
  pendingUsersCount: number;
  pendingPaymentsCount: number;
}

export function NotificationsDropdownContent({ 
  messageNotifications, 
  systemNotificationsCount,
  panicAlertsCount,
  pendingReservationsCount,
  pendingUsersCount,
  pendingPaymentsCount
}: NotificationsDropdownProps) {
  const router = useRouter();

  const unreadMessages = messageNotifications.filter(n => !n.read);
  const totalNotifications = unreadMessages.length + systemNotificationsCount;

  const handleMessageClick = async (notif: MessageNotification) => {
    try {
      await MessageNotificationsService.markAsRead(notif.id, notif.residencialId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
    router.push(`/dashboard/mensajes?chatId=${notif.chatId}`);
  };

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-card to-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-bold text-base text-foreground">Notificaciones</h3>
          </div>
          {totalNotifications > 0 && (
            <Badge className="bg-primary text-primary-foreground px-2.5 py-0.5 text-xs font-bold">
              {totalNotifications}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[450px] overflow-y-auto">
        {/* Mensajes Nuevos */}
        {unreadMessages.length > 0 && (
          <>
            <div className="px-4 py-2.5 bg-red-50/50 dark:bg-red-500/5 sticky top-0 z-10 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-red-500" />
                <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
                  Mensajes ({unreadMessages.length})
                </p>
              </div>
            </div>
            {unreadMessages.slice(0, 5).map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMessageClick(notif)}
                className="px-4 py-3 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-all duration-200 border-b border-border/50 group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-500/10 group-hover:bg-red-500/20 rounded-xl flex-shrink-0 transition-colors">
                    <MessageSquare className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-bold text-foreground truncate">
                        Nuevo mensaje de {notif.senderName}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {format(notif.createdAt.toDate(), 'HH:mm', { locale: es })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  <span className="h-2 w-2 bg-red-500 rounded-full flex-shrink-0 mt-2" />
                </div>
              </div>
            ))}
            {unreadMessages.length > 5 && (
              <div className="px-4 py-2 text-center border-b border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard/mensajes')}
                  className="text-xs text-primary hover:text-primary font-semibold"
                >
                  Ver {unreadMessages.length - 5} mensajes más
                </Button>
              </div>
            )}
          </>
        )}

        {/* 🚨 Alertas de Pánico */}
        {panicAlertsCount > 0 && (
          <>
            <div className="px-4 py-2.5 bg-muted/30 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-red-500" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Alertas de Pánico ({panicAlertsCount})
                </p>
              </div>
            </div>
            <div 
              onClick={() => router.push('/dashboard/alertas-panico')}
              className="px-4 py-3 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-all duration-200 border-b border-border/50 group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-500/10 group-hover:bg-red-500/20 rounded-xl flex-shrink-0 transition-colors">
                  <Shield className="h-4 w-4 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground mb-1">
                    🚨 Alerta Activa
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {panicAlertsCount === 1 
                      ? '1 alerta de pánico activa'
                      : `${panicAlertsCount} alertas de pánico activas`
                    }
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    <span className="text-[10px] text-red-500 font-semibold">
                      Requiere atención inmediata
                    </span>
                  </div>
                </div>
                <Badge variant="destructive" className="flex-shrink-0 mt-0.5 animate-pulse">
                  {panicAlertsCount}
                </Badge>
              </div>
            </div>
          </>
        )}

        {/* 📅 Reservas Pendientes */}
        {pendingReservationsCount > 0 && (
          <>
            <div className="px-4 py-2.5 bg-muted/30 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Reservas ({pendingReservationsCount})
                </p>
              </div>
            </div>
            <div 
              onClick={() => router.push('/dashboard/reservas')}
              className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer transition-all duration-200 border-b border-border/50 group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/10 group-hover:bg-blue-500/20 rounded-xl flex-shrink-0 transition-colors">
                  <Calendar className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground mb-1">
                    Reservas Pendientes
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pendingReservationsCount === 1 
                      ? '1 reserva esperando aprobación'
                      : `${pendingReservationsCount} reservas esperando aprobación`
                    }
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      Pendiente de revisión
                    </span>
                  </div>
                </div>
                <Badge className="flex-shrink-0 mt-0.5 bg-blue-500 text-white">
                  {pendingReservationsCount}
                </Badge>
              </div>
            </div>
          </>
        )}

        {/* 👥 Nuevos Usuarios */}
        {pendingUsersCount > 0 && (
          <>
            <div className="px-4 py-2.5 bg-muted/30 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-green-500" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Nuevos Usuarios ({pendingUsersCount})
                </p>
              </div>
            </div>
            <div 
              onClick={() => router.push('/dashboard/usuarios')}
              className="px-4 py-3 hover:bg-green-50 dark:hover:bg-green-500/10 cursor-pointer transition-all duration-200 border-b border-border/50 group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-500/10 group-hover:bg-green-500/20 rounded-xl flex-shrink-0 transition-colors">
                  <Users className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground mb-1">
                    Usuarios por Aprobar
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pendingUsersCount === 1 
                      ? '1 usuario esperando aprobación'
                      : `${pendingUsersCount} usuarios esperando aprobación`
                    }
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      Solicitudes de registro
                    </span>
                  </div>
                </div>
                <Badge className="flex-shrink-0 mt-0.5 bg-green-500 text-white">
                  {pendingUsersCount}
                </Badge>
              </div>
            </div>
          </>
        )}

        {/* 💰 Pagos Pendientes */}
        {pendingPaymentsCount > 0 && (
          <>
            <div className="px-4 py-2.5 bg-muted/30 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-purple-500" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Pagos ({pendingPaymentsCount})
                </p>
              </div>
            </div>
            <div 
              onClick={() => router.push('/dashboard/pagos')}
              className="px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-500/10 cursor-pointer transition-all duration-200 border-b border-border/50 group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-500/10 group-hover:bg-purple-500/20 rounded-xl flex-shrink-0 transition-colors">
                  <DollarSign className="h-4 w-4 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground mb-1">
                    Pagos por Validar
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pendingPaymentsCount === 1 
                      ? '1 pago esperando validación'
                      : `${pendingPaymentsCount} pagos esperando validación`
                    }
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      Transferencias y efectivo
                    </span>
                  </div>
                </div>
                <Badge className="flex-shrink-0 mt-0.5 bg-purple-500 text-white">
                  {pendingPaymentsCount}
                </Badge>
              </div>
            </div>
          </>
        )}

        {/* Estado vacío */}
        {totalNotifications === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-20 animate-pulse" />
              <div className="relative w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
            </div>
            <p className="text-sm font-bold text-foreground mb-1">
              ¡Todo al día!
            </p>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              No tienes notificaciones pendientes en este momento
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {totalNotifications > 0 && (
        <div className="p-3 border-t border-border bg-gradient-to-r from-muted/20 to-card">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs font-bold hover:bg-primary/10 hover:text-primary transition-all"
            onClick={() => router.push('/dashboard/notificaciones')}
          >
            <Bell className="h-3.5 w-3.5 mr-2" />
            Ver todas las notificaciones
          </Button>
        </div>
      )}
    </>
  );
}
