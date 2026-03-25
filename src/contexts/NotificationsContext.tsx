"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { collection, getDocs, query, where, orderBy, doc, getDoc, limit as fbLimit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getUsuariosPendientes, getAlertasPanicoActivas } from '@/lib/firebase/firestore';
import { MessageNotification, MessageNotificationsService } from '@/lib/services/message-notifications-service';
import { MessageListenerService } from '@/lib/services/message-listener-service';

interface NotificationsContextType {
  messageNotifications: MessageNotification[];
  unreadMessagesCount: number;
  panicAlertsCount: number;
  pendingReservationsCount: number;
  pendingUsersCount: number;
  pendingPaymentsCount: number;
  totalCount: number;
  isLoading: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, userClaims } = useAuth();
  const [messageNotifications, setMessageNotifications] = useState<MessageNotification[]>([]);
  const [panicAlertsCount, setPanicAlertsCount] = useState(0);
  const [pendingReservationsCount, setPendingReservationsCount] = useState(0);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Resolver docId del residencial a partir de código o docId
  const resolveResidencialDocId = async (residencialId: string): Promise<string | null> => {
    try {
      const snapById = await getDoc(doc(db, 'residenciales', residencialId));
      if (snapById.exists()) return residencialId;
    } catch { }
    try {
      const resRef = collection(db, 'residenciales');
      const qByCode = query(resRef, where('residencialID', '==', residencialId), fbLimit(1));
      const snap = await getDocs(qByCode);
      if (!snap.empty) return snap.docs[0].id;
    } catch { }
    return null;
  };

  // Suscribirse a las notificaciones de mensajes en tiempo real
  useEffect(() => {
    if (!user?.uid || !userClaims) {
      setMessageNotifications([]);
      return;
    }

    const setupSubscription = async () => {
      try {
        const esGlobal = userClaims.isGlobalAdmin === true;
        const esAdminResid = userClaims.role === 'admin' && !esGlobal;

        let residencialId: string | null = null;

        if (esAdminResid) {
          const codigoResidencial = userClaims.managedResidencials?.[0] || userClaims.residencialId;
          if (codigoResidencial) {
            residencialId = await resolveResidencialDocId(codigoResidencial);
          }
        } else if (userClaims.residencialId) {
          residencialId = await resolveResidencialDocId(userClaims.residencialId);
        }

        if (residencialId) {
          const unsubscribe = MessageNotificationsService.subscribeToNotifications(
            user.uid,
            residencialId,
            (notifications) => {
              setMessageNotifications(notifications);
            }
          );
          return unsubscribe;
        }
      } catch (error) {
        console.error('Error configurando suscripción de notificaciones:', error);
      }
    };

    const cleanup = setupSubscription();
    return () => {
      cleanup.then(unsub => unsub && unsub());
    };
  }, [user?.uid, userClaims]);

  // Iniciar listener automático de mensajes nuevos (para detectar mensajes de Flutter)
  useEffect(() => {
    if (!user?.uid || !userClaims) {
      return;
    }

    // Obtener el residencialId del usuario
    const getResidencialId = async () => {
      try {
        const esGlobal = userClaims.isGlobalAdmin === true;
        const esAdminResid = userClaims.role === 'admin' && !esGlobal;

        let residencialId: string | null = null;

        if (esAdminResid) {
          // Para admin de residencial
          const codigoResidencial = userClaims.managedResidencials?.[0] || userClaims.residencialId;
          if (codigoResidencial) {
            residencialId = await resolveResidencialDocId(codigoResidencial);
          }
        } else if (userClaims.residencialId) {
          // Para usuarios normales
          residencialId = await resolveResidencialDocId(userClaims.residencialId);
        }

        if (residencialId) {
          // Iniciar el listener automático
          const unsubscribe = MessageListenerService.startListening(user.uid, residencialId);
          return unsubscribe;
        }
      } catch (error) {
        console.error('Error iniciando listener de mensajes:', error);
      }
      return undefined;
    };

    let cleanup: (() => void) | undefined;
    getResidencialId().then((unsubscribe) => {
      cleanup = unsubscribe;
    });

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [user?.uid, userClaims]);

  // Cargar conteos críticos para admin de residencial
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const loadCounts = async () => {
      try {
        setIsLoading(true);

        if (!userClaims) {
          setPanicAlertsCount(0);
          setPendingReservationsCount(0);
          setPendingUsersCount(0);
          setPendingPaymentsCount(0);
          setIsLoading(false);
          return;
        }

        const esGlobal = userClaims.isGlobalAdmin === true;
        const esAdminResid = userClaims.role === 'admin' && !esGlobal;

        if (!esAdminResid) {
          setPanicAlertsCount(0);
          setPendingReservationsCount(0);
          setPendingUsersCount(0);
          setPendingPaymentsCount(0);
          setIsLoading(false);
          return;
        }

        const codigoResidencial = userClaims.managedResidencials?.[0] || userClaims.residencialId;
        if (!codigoResidencial) {
          setPanicAlertsCount(0);
          setPendingReservationsCount(0);
          setPendingUsersCount(0);
          setPendingPaymentsCount(0);
          setIsLoading(false);
          return;
        }

        const docId = await resolveResidencialDocId(codigoResidencial);

        // Conteo de alertas de pánico activas
        let panicCount = 0;
        if (docId) {
          try {
            const alertas = await getAlertasPanicoActivas(docId);
            panicCount = Array.isArray(alertas) ? alertas.length : 0;
          } catch { panicCount = 0; }
        }
        setPanicAlertsCount(panicCount);

        // Conteo de reservas pendientes
        let reservasCount = 0;
        if (docId) {
          try {
            const reservationsRef = collection(db, 'residenciales', docId, 'reservaciones');
            const qRes = query(reservationsRef, where('status', '==', 'pendiente'), orderBy('fecha', 'desc'));
            const snapRes = await getDocs(qRes);
            reservasCount = snapRes.size;
          } catch { reservasCount = 0; }
        }
        setPendingReservationsCount(reservasCount);

        // Conteo de usuarios pendientes (filtrar por código residencial)
        let usersCount = 0;
        try {
          const pend = await getUsuariosPendientes({ limit: 200 });
          usersCount = pend.filter((u: any) => u.residencialID === codigoResidencial).length;
        } catch { usersCount = 0; }
        setPendingUsersCount(usersCount);

        // Conteo de pagos pendientes de validación (desde paymentIntents SoT)
        let paymentsCount = 0;
        if (docId) {
          try {
            const pagosRef = collection(db, 'residenciales', docId, 'paymentIntents');
            const qPagos = query(pagosRef, where('status', '==', 'pending_validation'));
            const snapPagos = await getDocs(qPagos);
            paymentsCount = snapPagos.size;
          } catch { paymentsCount = 0; }
        }
        setPendingPaymentsCount(paymentsCount);


        setIsLoading(false);
      } catch (error) {
        console.error('Error loading notification counts:', error);
        setPanicAlertsCount(0);
        setPendingReservationsCount(0);
        setPendingUsersCount(0);
        setPendingPaymentsCount(0);
        setIsLoading(false);
      }
    };

    loadCounts();
    timer = setInterval(loadCounts, 60000); // Actualizar cada 60 segundos

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [userClaims]);

  const unreadMessagesCount = messageNotifications.filter(n => !n.read).length;
  const totalCount = unreadMessagesCount + panicAlertsCount + pendingReservationsCount + pendingUsersCount + pendingPaymentsCount;

  return (
    <NotificationsContext.Provider
      value={{
        messageNotifications,
        unreadMessagesCount,
        panicAlertsCount,
        pendingReservationsCount,
        pendingUsersCount,
        pendingPaymentsCount,
        totalCount,
        isLoading,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
