"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Check, Trash2, X, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  MessageNotification, 
  MessageNotificationsService 
} from "@/lib/services/message-notifications-service";
import { useToast } from "@/components/ui/use-toast";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: MessageNotification[];
  onUpdate: () => void;
}

export function NotificationsDialog({
  open,
  onOpenChange,
  notifications,
  onUpdate
}: NotificationsDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleMarkAsRead = async (notificationId: string, residencialId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMarkingIds(prev => new Set(prev).add(notificationId));
    try {
      await MessageNotificationsService.markAsRead(notificationId, residencialId);
      onUpdate();
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
      onUpdate();
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
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    try {
      const userId = unreadNotifications[0].userId;
      const residencialId = unreadNotifications[0].residencialId;
      await MessageNotificationsService.markAllAsRead(userId, residencialId);
      onUpdate();
      toast({
        title: "✓ Todas marcadas como leídas",
        description: `Se marcaron ${unreadNotifications.length} notificaciones como leídas`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron marcar las notificaciones",
        variant: "destructive",
      });
    }
  };

  const handleNotificationClick = (notification: MessageNotification) => {
    // Marcar como leída si no lo está
    if (!notification.read) {
      MessageNotificationsService.markAsRead(notification.id, notification.residencialId).catch(console.error);
    }
    
    // Cerrar el diálogo
    onOpenChange(false);
    
    // Redirigir a la página de mensajes con el chat seleccionado
    router.push(`/dashboard/mensajes?chatId=${notification.chatId}`);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Notificaciones de Mensajes</DialogTitle>
                <DialogDescription className="text-sm">
                  {unreadCount > 0 
                    ? `Tienes ${unreadCount} mensaje${unreadCount > 1 ? 's' : ''} sin leer` 
                    : 'No tienes mensajes sin leer'}
                </DialogDescription>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Marcar todas
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(80vh-120px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-20"></div>
                <div className="relative p-4 bg-primary/10 rounded-full">
                  <MessageSquare className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">
                No hay notificaciones
              </h3>
              <p className="text-sm text-muted-foreground">
                Cuando recibas nuevos mensajes aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const isDeleting = deletingIds.has(notification.id);
                const isMarking = markingIds.has(notification.id);
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "px-6 py-4 hover:bg-muted/50 cursor-pointer transition-all duration-200",
                      !notification.read && "bg-primary/5",
                      (isDeleting || isMarking) && "opacity-50 pointer-events-none"
                    )}
                  >
                    <div className="flex gap-4">
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-12 w-12 shadow-md border-2 border-background">
                          <AvatarFallback className={cn("text-white font-semibold", getAvatarColor(notification.senderId))}>
                            {getInitials(notification.senderName)}
                          </AvatarFallback>
                        </Avatar>
                        {!notification.read && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full border-2 border-background" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-foreground truncate">
                              {notification.senderName}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {format(notification.createdAt.toDate(), "PPp", { locale: es })}
                            </p>
                          </div>
                          {!notification.read && (
                            <Badge variant="default" className="flex-shrink-0 text-xs">
                              Nuevo
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-foreground line-clamp-2 mb-3">
                          {notification.message}
                        </p>

                        <div className="flex gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleMarkAsRead(notification.id, notification.residencialId, e)}
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
                            onClick={(e) => handleDelete(notification.id, notification.residencialId, e)}
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
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
