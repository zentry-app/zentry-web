"use client";


import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Bell,
  MessageSquare,
  Calendar,
  Users,
  DollarSign,
  Shield,
  Check,
  Trash2,
  CheckCheck,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/contexts/NotificationsContext';
import { MessageNotificationsService, MessageNotification } from '@/lib/services/message-notifications-service';
import { useToast } from '@/components/ui/use-toast';

// Importar dinámicamente el componente del monitor global
const GlobalNotificationsMonitor = dynamic(
  () => import('@/components/dashboard/notificaciones/GlobalNotificationsMonitor'),
  { ssr: false }
);

type NotificationFilter = 'all' | 'messages' | 'reservations' | 'users' | 'payments' | 'alerts';

export default function NotificacionesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userClaims } = useAuth(); // Obtener claims del usuario
  const {
    messageNotifications,
    unreadMessagesCount,
    panicAlertsCount,
    pendingReservationsCount,
    pendingUsersCount,
    pendingPaymentsCount,
    totalCount,
    isLoading
  } = useNotifications();

  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());

  const unreadMessages = messageNotifications.filter(n => !n.read);

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-orange-500",
      "bg-indigo-500",
    ];
    return colors[parseInt(id.slice(-1), 16) % colors.length];
  };

  const handleMarkAsRead = async (notificationId: string, residencialId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMarkingIds(prev => new Set(prev).add(notificationId));
    try {
      await MessageNotificationsService.markAsRead(notificationId, residencialId);
      toast({
        title: "✓ Marcado como leído",
        description: "La notificación se marcó como leída",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo marcar la notificación como leída",
        variant: "destructive",
      });
    } finally {
      setMarkingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleDelete = async (notificationId: string, residencialId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingIds(prev => new Set(prev).add(notificationId));
    try {
      await MessageNotificationsService.deleteNotification(notificationId, residencialId);
      toast({
        title: "✓ Notificación eliminada",
        description: "La notificación se eliminó correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la notificación",
        variant: "destructive",
      });
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = unreadMessages;
    if (unread.length === 0) return;

    try {
      const promises = unread.map(notif =>
        MessageNotificationsService.markAsRead(notif.id, notif.residencialId)
      );
      await Promise.all(promises);
      toast({
        title: "✓ Todas marcadas como leídas",
        description: `Se marcaron ${unread.length} notificaciones como leídas`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron marcar las notificaciones",
        variant: "destructive",
      });
    }
  };

  const handleMessageClick = async (notif: MessageNotification) => {
    try {
      if (!notif.read) {
        await MessageNotificationsService.markAsRead(notif.id, notif.residencialId);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
    router.push(`/dashboard/mensajes?chatId=${notif.chatId}`);
  };

  // Si es administrador global, mostrar el monitor de notificaciones
  if (userClaims?.isGlobalAdmin) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center p-8">Cargando monitor...</div>}>
        <GlobalNotificationsMonitor />
      </Suspense>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            Notificaciones
          </h1>
          <p className="text-muted-foreground">
            {totalCount === 0
              ? 'No tienes notificaciones pendientes'
              : `${totalCount} notificación${totalCount !== 1 ? 'es' : ''} pendiente${totalCount !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        {unreadMessages.length > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            variant="outline"
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Tabs/Filtros */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as NotificationFilter)} className="mb-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all" className="gap-2">
            <Bell className="h-4 w-4" />
            Todas
            {totalCount > 0 && (
              <Badge variant="secondary" className="ml-1 bg-red-500 text-white">
                {totalCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Mensajes
            {unreadMessagesCount > 0 && (
              <Badge variant="secondary" className="ml-1 bg-red-500 text-white">
                {unreadMessagesCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reservations" className="gap-2">
            <Calendar className="h-4 w-4" />
            Reservas
            {pendingReservationsCount > 0 && (
              <Badge variant="secondary" className="ml-1 bg-orange-500 text-white">
                {pendingReservationsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Usuarios
            {pendingUsersCount > 0 && (
              <Badge variant="secondary" className="ml-1 bg-green-500 text-white">
                {pendingUsersCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Pagos
            {pendingPaymentsCount > 0 && (
              <Badge variant="secondary" className="ml-1 bg-purple-500 text-white">
                {pendingPaymentsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Shield className="h-4 w-4" />
            Alertas
            {panicAlertsCount > 0 && (
              <Badge variant="secondary" className="ml-1 bg-red-500 text-white">
                {panicAlertsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Contenido - Todos */}
        <TabsContent value="all" className="mt-6">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="space-y-4">
              {/* Mensajes */}
              {unreadMessages.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-red-500" />
                      Mensajes ({unreadMessages.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {unreadMessages.map((notif) => {
                      const isDeleting = deletingIds.has(notif.id);
                      const isMarking = markingIds.has(notif.id);

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleMessageClick(notif)}
                          className={cn(
                            "p-4 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-all duration-200",
                            !notif.read && "bg-red-50/50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20",
                            (isDeleting || isMarking) && "opacity-50 pointer-events-none"
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12 flex-shrink-0">
                              <AvatarFallback className={cn("text-white font-semibold", getAvatarColor(notif.senderId))}>
                                {getInitials(notif.senderName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex-1">
                                  <p className="font-bold text-foreground">
                                    Nuevo mensaje de {notif.senderName}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {format(notif.createdAt.toDate(), "PPp", { locale: es })}
                                  </p>
                                </div>
                                {!notif.read && (
                                  <Badge variant="destructive" className="flex-shrink-0">
                                    Nuevo
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {notif.message}
                              </p>
                              <div className="flex gap-2">
                                {!notif.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleMarkAsRead(notif.id, notif.residencialId, e)}
                                    disabled={isMarking}
                                    className="h-8 gap-2 text-xs"
                                  >
                                    <Check className="h-3 w-3" />
                                    Marcar como leído
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => handleDelete(notif.id, notif.residencialId, e)}
                                  disabled={isDeleting}
                                  className="h-8 gap-2 text-xs text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Eliminar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Reservas Pendientes */}
              {pendingReservationsCount > 0 && (
                <Card
                  className="cursor-pointer hover:bg-muted/50 transition-all duration-200"
                  onClick={() => router.push('/dashboard/reservas')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-xl flex-shrink-0">
                        <Calendar className="h-6 w-6 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-bold text-foreground text-lg">
                              Reservas Pendientes
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {pendingReservationsCount === 1
                                ? '1 reserva esperando aprobación'
                                : `${pendingReservationsCount} reservas esperando aprobación`
                              }
                            </p>
                          </div>
                          <Badge className="bg-orange-500 text-white">
                            {pendingReservationsCount}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Requiere revisión y aprobación
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Usuarios Nuevos */}
              {pendingUsersCount > 0 && (
                <Card
                  className="cursor-pointer hover:bg-muted/50 transition-all duration-200"
                  onClick={() => router.push('/dashboard/usuarios')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-green-500/10 rounded-xl flex-shrink-0">
                        <Users className="h-6 w-6 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-bold text-foreground text-lg">
                              Nuevos Usuarios
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {pendingUsersCount === 1
                                ? '1 usuario esperando aprobación'
                                : `${pendingUsersCount} usuarios esperando aprobación`
                              }
                            </p>
                          </div>
                          <Badge className="bg-green-500 text-white">
                            {pendingUsersCount}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Requiere validación de registro
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pagos Pendientes */}
              {pendingPaymentsCount > 0 && (
                <Card
                  className="cursor-pointer hover:bg-muted/50 transition-all duration-200"
                  onClick={() => router.push('/dashboard/pagos')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-500/10 rounded-xl flex-shrink-0">
                        <DollarSign className="h-6 w-6 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-bold text-foreground text-lg">
                              Pagos por Validar
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {pendingPaymentsCount === 1
                                ? '1 pago esperando validación'
                                : `${pendingPaymentsCount} pagos esperando validación`
                              }
                            </p>
                          </div>
                          <Badge className="bg-purple-500 text-white">
                            {pendingPaymentsCount}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Transferencias y efectivo pendientes
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Alertas de Pánico */}
              {panicAlertsCount > 0 && (
                <Card
                  className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 border-red-200 dark:border-red-500/20"
                  onClick={() => router.push('/dashboard/alertas-panico')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-red-500/10 rounded-xl flex-shrink-0">
                        <Shield className="h-6 w-6 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-bold text-foreground text-lg">
                              🚨 Alertas de Pánico Activas
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {panicAlertsCount === 1
                                ? '1 alerta de pánico activa'
                                : `${panicAlertsCount} alertas de pánico activas`
                              }
                            </p>
                          </div>
                          <Badge variant="destructive" className="bg-red-500 text-white">
                            {panicAlertsCount}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-xs text-red-500 font-semibold">
                            Requiere atención inmediata
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Estado Vacío */}
              {totalCount === 0 && (
                <Card>
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="relative inline-block mb-4">
                        <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-20"></div>
                        <div className="relative p-4 bg-primary/10 rounded-full">
                          <Bell className="h-12 w-12 text-primary" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        No hay notificaciones
                      </h3>
                      <p className="text-muted-foreground">
                        Cuando recibas nuevas notificaciones aparecerán aquí.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Contenido - Mensajes */}
        <TabsContent value="messages" className="mt-6">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="space-y-4">
              {unreadMessages.length > 0 ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-red-500" />
                      Mensajes ({unreadMessages.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {unreadMessages.map((notif) => {
                      const isDeleting = deletingIds.has(notif.id);
                      const isMarking = markingIds.has(notif.id);

                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleMessageClick(notif)}
                          className={cn(
                            "p-4 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-all duration-200",
                            !notif.read && "bg-red-50/50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20",
                            (isDeleting || isMarking) && "opacity-50 pointer-events-none"
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12 flex-shrink-0">
                              <AvatarFallback className={cn("text-white font-semibold", getAvatarColor(notif.senderId))}>
                                {getInitials(notif.senderName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex-1">
                                  <p className="font-bold text-foreground">
                                    Nuevo mensaje de {notif.senderName}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {format(notif.createdAt.toDate(), "PPp", { locale: es })}
                                  </p>
                                </div>
                                {!notif.read && (
                                  <Badge variant="destructive" className="flex-shrink-0">
                                    Nuevo
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {notif.message}
                              </p>
                              <div className="flex gap-2">
                                {!notif.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleMarkAsRead(notif.id, notif.residencialId, e)}
                                    disabled={isMarking}
                                    className="h-8 gap-2 text-xs"
                                  >
                                    <Check className="h-3 w-3" />
                                    Marcar como leído
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => handleDelete(notif.id, notif.residencialId, e)}
                                  disabled={isDeleting}
                                  className="h-8 gap-2 text-xs text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Eliminar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        No hay mensajes pendientes
                      </h3>
                      <p className="text-muted-foreground">
                        No tienes mensajes sin leer.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Contenido - Reservas */}
        <TabsContent value="reservations" className="mt-6">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="space-y-4">
              {pendingReservationsCount > 0 ? (
                <Card
                  className="cursor-pointer hover:bg-muted/50 transition-all duration-200"
                  onClick={() => router.push('/dashboard/reservas')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-xl flex-shrink-0">
                        <Calendar className="h-6 w-6 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-bold text-foreground text-lg">
                              Reservas Pendientes
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {pendingReservationsCount === 1
                                ? '1 reserva esperando aprobación'
                                : `${pendingReservationsCount} reservas esperando aprobación`
                              }
                            </p>
                          </div>
                          <Badge className="bg-orange-500 text-white">
                            {pendingReservationsCount}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Requiere revisión y aprobación
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        No hay reservas pendientes
                      </h3>
                      <p className="text-muted-foreground">
                        Todas las reservas están procesadas.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Contenido - Usuarios */}
        <TabsContent value="users" className="mt-6">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="space-y-4">
              {pendingUsersCount > 0 ? (
                <Card
                  className="cursor-pointer hover:bg-muted/50 transition-all duration-200"
                  onClick={() => router.push('/dashboard/usuarios')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-green-500/10 rounded-xl flex-shrink-0">
                        <Users className="h-6 w-6 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-bold text-foreground text-lg">
                              Nuevos Usuarios
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {pendingUsersCount === 1
                                ? '1 usuario esperando aprobación'
                                : `${pendingUsersCount} usuarios esperando aprobación`
                              }
                            </p>
                          </div>
                          <Badge className="bg-green-500 text-white">
                            {pendingUsersCount}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Requiere validación de registro
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        No hay usuarios pendientes
                      </h3>
                      <p className="text-muted-foreground">
                        Todos los usuarios están aprobados.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Contenido - Pagos */}
        <TabsContent value="payments" className="mt-6">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="space-y-4">
              {pendingPaymentsCount > 0 ? (
                <Card
                  className="cursor-pointer hover:bg-muted/50 transition-all duration-200"
                  onClick={() => router.push('/dashboard/pagos')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-500/10 rounded-xl flex-shrink-0">
                        <DollarSign className="h-6 w-6 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-bold text-foreground text-lg">
                              Pagos por Validar
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {pendingPaymentsCount === 1
                                ? '1 pago esperando validación'
                                : `${pendingPaymentsCount} pagos esperando validación`
                              }
                            </p>
                          </div>
                          <Badge className="bg-purple-500 text-white">
                            {pendingPaymentsCount}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Transferencias y efectivo pendientes
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <DollarSign className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        No hay pagos pendientes
                      </h3>
                      <p className="text-muted-foreground">
                        Todos los pagos están validados.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Contenido - Alertas */}
        <TabsContent value="alerts" className="mt-6">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="space-y-4">
              {panicAlertsCount > 0 ? (
                <Card
                  className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 border-red-200 dark:border-red-500/20"
                  onClick={() => router.push('/dashboard/alertas-panico')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-red-500/10 rounded-xl flex-shrink-0">
                        <Shield className="h-6 w-6 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-bold text-foreground text-lg">
                              🚨 Alertas de Pánico Activas
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {panicAlertsCount === 1
                                ? '1 alerta de pánico activa'
                                : `${panicAlertsCount} alertas de pánico activas`
                              }
                            </p>
                          </div>
                          <Badge variant="destructive" className="bg-red-500 text-white">
                            {panicAlertsCount}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-xs text-red-500 font-semibold">
                            Requiere atención inmediata
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Shield className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        No hay alertas activas
                      </h3>
                      <p className="text-muted-foreground">
                        No hay alertas de pánico activas en este momento.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
