import { 
  collection, 
  query, 
  where,
  onSnapshot,
  getDocs,
  getDoc,
  doc,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { MessageNotificationsService } from './message-notifications-service';

/**
 * Servicio para escuchar mensajes nuevos en tiempo real y crear notificaciones automáticamente
 * Esto funciona incluso cuando los mensajes son creados desde Flutter
 */
export class MessageListenerService {
  private static unsubscribers: Map<string, () => void> = new Map();

  /**
   * Obtiene el nombre completo de un usuario
   */
  private static async getUserName(userId: string, residencialId: string): Promise<string> {
    try {
      // Intentar obtener de la colección global de usuarios
      const userDoc = await getDoc(doc(db, 'usuarios', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.fullName) return data.fullName;
        if (data.nombre) {
          const nombre = data.nombre || '';
          const apellidoPaterno = data.apellidoPaterno || '';
          const apellidoMaterno = data.apellidoMaterno || '';
          return `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim();
        }
      }

      // Intentar obtener de usuarios del residencial
      const residencialUserDoc = await getDoc(doc(db, 'residenciales', residencialId, 'usuarios', userId));
      if (residencialUserDoc.exists()) {
        const data = residencialUserDoc.data();
        if (data.fullName) return data.fullName;
        if (data.nombre) {
          const nombre = data.nombre || '';
          const apellidoPaterno = data.apellidoPaterno || '';
          const apellidoMaterno = data.apellidoMaterno || '';
          return `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim();
        }
      }

      return 'Usuario';
    } catch (error) {
      console.error('Error obteniendo nombre de usuario:', error);
      return 'Usuario';
    }
  }

  /**
   * Verifica si ya existe una notificación para un mensaje específico
   */
  private static async notificationExists(
    recipientId: string,
    chatId: string,
    senderId: string,
    messageText: string,
    timestamp: Timestamp,
    residencialId: string
  ): Promise<boolean> {
    try {
      const notificationsRef = collection(
        db,
        'residenciales',
        residencialId,
        'messageNotifications'
      );
      const q = query(
        notificationsRef,
        where('userId', '==', recipientId),
        where('chatId', '==', chatId),
        where('senderId', '==', senderId),
        where('message', '==', messageText),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      
      // Si existe una notificación con el mismo contenido en los últimos 5 segundos, considerarla duplicada
      if (!snapshot.empty) {
        const notif = snapshot.docs[0].data();
        const notifTime = notif.createdAt as Timestamp;
        const timeDiff = Math.abs(timestamp.toMillis() - notifTime.toMillis());
        return timeDiff < 5000; // 5 segundos
      }
      
      return false;
    } catch (error) {
      console.error('Error verificando existencia de notificación:', error);
      return false; // En caso de error, asumir que no existe para intentar crearla
    }
  }

  /**
   * Inicia la escucha de mensajes nuevos para un usuario en todos sus chats
   */
  static startListening(userId: string, residencialId: string): () => void {
    const listenerId = `${userId}-${residencialId}`;
    
    // Si ya existe un listener, detenerlo primero
    if (this.unsubscribers.has(listenerId)) {
      const existingUnsubscriber = this.unsubscribers.get(listenerId);
      if (existingUnsubscriber) {
        existingUnsubscriber();
      }
    }

    // Obtener todos los chats del usuario
    const chatsRef = collection(db, 'residenciales', residencialId, 'chats');
    const chatsQuery = query(chatsRef, where('participants', 'array-contains', userId));

    const unsubscribeChats = onSnapshot(chatsQuery, async (chatsSnapshot) => {
      // Para cada chat, escuchar los mensajes nuevos
      chatsSnapshot.forEach((chatDoc) => {
        const chatId = chatDoc.id;
        const chatData = chatDoc.data();
        const participants = chatData.participants || [];
        const otherParticipantId = participants.find((p: string) => p !== userId);

        if (!otherParticipantId) return;

        // Escuchar mensajes del último minuto
        const messagesRef = collection(db, 'residenciales', residencialId, 'chats', chatId, 'messages');
        const oneMinuteAgo = Timestamp.fromMillis(Date.now() - 60000);
        const messagesQuery = query(
          messagesRef,
          where('timestamp', '>=', oneMinuteAgo),
          where('senderId', '==', otherParticipantId),
          orderBy('timestamp', 'desc')
        );

        const messageListenerId = `${listenerId}-${chatId}`;
        
        // Si ya existe un listener para este chat, detenerlo
        if (this.unsubscribers.has(messageListenerId)) {
          const existingUnsubscriber = this.unsubscribers.get(messageListenerId);
          if (existingUnsubscriber) {
            existingUnsubscriber();
          }
        }

        const unsubscribeMessages = onSnapshot(messagesQuery, async (messagesSnapshot) => {
          messagesSnapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              const messageData = change.doc.data();
              const messageText = messageData.text;
              const senderId = messageData.senderId;
              const timestamp = messageData.timestamp;

              // Solo crear notificación si es un mensaje de otra persona
              if (senderId !== userId && timestamp) {
                // Verificar si ya existe la notificación (Cloud Function puede haberla creado)
                const exists = await this.notificationExists(
                  userId,
                  chatId,
                  senderId,
                  messageText,
                  timestamp,
                  residencialId
                );

                if (!exists) {
                  // Obtener el nombre del remitente
                  const senderName = await this.getUserName(senderId, residencialId);

                  // Crear la notificación
                  try {
                    await MessageNotificationsService.createNotification(
                      residencialId,
                      chatId,
                      userId,
                      senderId,
                      senderName,
                      messageText
                    );
                  } catch (error) {
                    console.error('Error creando notificación automática:', error);
                  }
                }
              }
            }
          });
        });

        this.unsubscribers.set(messageListenerId, unsubscribeMessages);
      });
    });

    this.unsubscribers.set(listenerId, unsubscribeChats);

    // Retornar función para detener todos los listeners
    return () => {
      this.stopListening(userId, residencialId);
    };
  }

  /**
   * Detiene la escucha de mensajes para un usuario
   */
  static stopListening(userId: string, residencialId: string): void {
    const listenerId = `${userId}-${residencialId}`;
    
    // Detener el listener de chats
    if (this.unsubscribers.has(listenerId)) {
      const unsubscriber = this.unsubscribers.get(listenerId);
      if (unsubscriber) {
        unsubscriber();
      }
      this.unsubscribers.delete(listenerId);
    }

    // Detener todos los listeners de mensajes de este usuario
    const messageListenersToRemove: string[] = [];
    this.unsubscribers.forEach((_, key) => {
      if (key.startsWith(`${listenerId}-`)) {
        messageListenersToRemove.push(key);
      }
    });

    messageListenersToRemove.forEach((key) => {
      const unsubscriber = this.unsubscribers.get(key);
      if (unsubscriber) {
        unsubscriber();
      }
      this.unsubscribers.delete(key);
    });
  }

  /**
   * Detiene todos los listeners activos
   */
  static stopAll(): void {
    this.unsubscribers.forEach((unsubscriber) => {
      unsubscriber();
    });
    this.unsubscribers.clear();
  }
}
