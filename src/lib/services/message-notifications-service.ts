import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface MessageNotification {
  id: string;
  userId: string; // Usuario que recibe la notificación
  senderId: string; // Usuario que envió el mensaje
  senderName: string; // Nombre del remitente
  chatId: string;
  residencialId: string;
  message: string; // Contenido del mensaje
  read: boolean;
  createdAt: Timestamp;
}

export class MessageNotificationsService {
  /**
   * Crea una notificación de mensaje
   */
  static async createNotification(
    residencialId: string,
    chatId: string,
    recipientId: string,
    senderId: string,
    senderName: string,
    messageText: string
  ): Promise<void> {
    try {
      const notificationsRef = collection(db, 'residenciales', residencialId, 'messageNotifications');
      await addDoc(notificationsRef, {
        userId: recipientId,
        senderId,
        senderName,
        chatId,
        message: messageText,
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creando notificación:', error);
      throw error;
    }
  }

  /**
   * Obtiene las notificaciones no leídas de un usuario
   */
  static async getUnreadNotifications(userId: string, residencialId: string): Promise<MessageNotification[]> {
    try {
      const notificationsRef = collection(db, 'residenciales', residencialId, 'messageNotifications');
      const q = query(
        notificationsRef, 
        where('userId', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const notifications: MessageNotification[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          userId: data.userId,
          senderId: data.senderId,
          senderName: data.senderName,
          chatId: data.chatId,
          residencialId: residencialId,
          message: data.message,
          read: data.read,
          createdAt: data.createdAt || Timestamp.now()
        });
      });

      return notifications;
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      return [];
    }
  }

  /**
   * Obtiene todas las notificaciones de un usuario (leídas y no leídas)
   */
  static async getAllNotifications(userId: string, residencialId: string, limit: number = 50): Promise<MessageNotification[]> {
    try {
      const notificationsRef = collection(db, 'residenciales', residencialId, 'messageNotifications');
      const q = query(
        notificationsRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const notifications: MessageNotification[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          userId: data.userId,
          senderId: data.senderId,
          senderName: data.senderName,
          chatId: data.chatId,
          residencialId: residencialId,
          message: data.message,
          read: data.read,
          createdAt: data.createdAt || Timestamp.now()
        });
      });

      return notifications.slice(0, limit);
    } catch (error) {
      console.error('Error obteniendo todas las notificaciones:', error);
      return [];
    }
  }

  /**
   * Marca una notificación como leída
   */
  static async markAsRead(notificationId: string, residencialId: string): Promise<void> {
    try {
      const notifRef = doc(db, 'residenciales', residencialId, 'messageNotifications', notificationId);
      await updateDoc(notifRef, {
        read: true
      });
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      throw error;
    }
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  static async markAllAsRead(userId: string, residencialId: string): Promise<void> {
    try {
      const notificationsRef = collection(db, 'residenciales', residencialId, 'messageNotifications');
      const q = query(
        notificationsRef, 
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
      throw error;
    }
  }

  /**
   * Elimina una notificación
   */
  static async deleteNotification(notificationId: string, residencialId: string): Promise<void> {
    try {
      const notifRef = doc(db, 'residenciales', residencialId, 'messageNotifications', notificationId);
      await deleteDoc(notifRef);
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      throw error;
    }
  }

  /**
   * Elimina todas las notificaciones de un usuario
   */
  static async deleteAllNotifications(userId: string, residencialId: string): Promise<void> {
    try {
      const notificationsRef = collection(db, 'residenciales', residencialId, 'messageNotifications');
      const q = query(notificationsRef, where('userId', '==', userId));
      
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error eliminando todas las notificaciones:', error);
      throw error;
    }
  }

  /**
   * Escucha cambios en las notificaciones en tiempo real
   */
  static subscribeToNotifications(
    userId: string,
    residencialId: string,
    onUpdate: (notifications: MessageNotification[]) => void
  ): () => void {
    const notificationsRef = collection(db, 'residenciales', residencialId, 'messageNotifications');
    const q = query(
      notificationsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: MessageNotification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          userId: data.userId,
          senderId: data.senderId,
          senderName: data.senderName,
          chatId: data.chatId,
          residencialId: residencialId,
          message: data.message,
          read: data.read,
          createdAt: data.createdAt || Timestamp.now()
        });
      });
      onUpdate(notifications);
    }, (error) => {
      console.error('Error en suscripción de notificaciones:', error);
    });

    return unsubscribe;
  }
}
