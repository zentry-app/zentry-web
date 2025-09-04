import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: Timestamp;
  lastMessageSender: string;
  unreadCount: Record<string, number>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface User {
  uid: string;
  fullName: string;
  email: string;
  role: string;
  calle: string;
  houseNumber: string;
  residencialID: string;
  // Campos adicionales para nombres
  nombre?: string;
  name?: string;
  firstName?: string;
  apellidoPaterno?: string;
  paternalLastName?: string;
  apellidoMaterno?: string;
  maternalLastName?: string;
  lastName?: string;
}

export class MessagesService {
  /**
   * Obtiene todos los chats de un residencial
   */
  static async getChats(residencialId: string, participantId?: string): Promise<Chat[]> {
    try {
      const chatsRef = collection(db, 'residenciales', residencialId, 'chats');
      const qRef = participantId 
        ? query(chatsRef, where('participants', 'array-contains', participantId))
        : chatsRef;
      const querySnapshot = await getDocs(qRef);
      
      const chats: Chat[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        chats.push({
          id: doc.id,
          participants: data.participants || [],
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime || Timestamp.now(),
          lastMessageSender: data.lastMessageSender || '',
          unreadCount: data.unreadCount || {},
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now(),
        });
      });

      // Ordenar por último mensaje
      return chats.sort((a, b) => b.lastMessageTime.toMillis() - a.lastMessageTime.toMillis());
    } catch (error) {
      console.error('Error obteniendo chats:', error);
      throw error;
    }
  }

  /**
   * Obtiene los mensajes de un chat específico
   */
  static async getMessages(residencialId: string, chatId: string): Promise<Message[]> {
    try {
      const messagesRef = collection(db, 'residenciales', residencialId, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const messages: Message[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          text: data.text || '',
          senderId: data.senderId || '',
          timestamp: data.timestamp || Timestamp.now(),
        });
      });

      return messages;
    } catch (error) {
      console.error('Error obteniendo mensajes:', error);
      throw error;
    }
  }

  /**
   * Envía un mensaje a un chat
   */
  static async sendMessage(
    residencialId: string, 
    chatId: string, 
    text: string, 
    senderId: string
  ): Promise<void> {
    try {
      const chatRef = doc(db, 'residenciales', residencialId, 'chats', chatId);
      const messagesRef = collection(db, 'residenciales', residencialId, 'chats', chatId, 'messages');

      // Agregar el mensaje
      await addDoc(messagesRef, {
        text,
        senderId,
        timestamp: serverTimestamp(),
      });

      // Actualizar el chat con el último mensaje
      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        lastMessageSender: senderId,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      throw error;
    }
  }

  /**
   * Marca los mensajes como leídos para un usuario
   */
  static async markAsRead(
    residencialId: string, 
    chatId: string, 
    userId: string
  ): Promise<void> {
    try {
      const chatRef = doc(db, 'residenciales', residencialId, 'chats', chatId);
      await updateDoc(chatRef, {
        [`unreadCount.${userId}`]: 0,
      });
    } catch (error) {
      console.error('Error marcando como leído:', error);
      throw error;
    }
  }

  /**
   * Obtiene el document ID de un residencial usando su residencialID
   */
  static async getResidencialDocId(residencialID: string): Promise<string | null> {
    try {
      const residencialesRef = collection(db, 'residenciales');
      const q = query(residencialesRef, where('residencialID', '==', residencialID));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo document ID del residencial:', error);
      throw error;
    }
  }

  /**
   * Obtiene el primer residencial disponible para admin global
   */
  static async getFirstResidencialDocId(): Promise<string | null> {
    try {
      const residencialesRef = collection(db, 'residenciales');
      const querySnapshot = await getDocs(residencialesRef);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo primer residencial:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los residenciales del sistema
   */
  static async getAllResidenciales(): Promise<Array<{id: string, nombre: string, residencialID: string}>> {
    try {
      const residencialesRef = collection(db, 'residenciales');
      const querySnapshot = await getDocs(residencialesRef);
      
      const residenciales: Array<{id: string, nombre: string, residencialID: string}> = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        residenciales.push({
          id: doc.id,
          nombre: data.nombre || 'Sin nombre',
          residencialID: data.residencialID || ''
        });
      });

      return residenciales;
    } catch (error) {
      console.error('Error obteniendo residenciales:', error);
      throw error;
    }
  }

  /**
   * Obtiene TODOS los chats de un residencial (para admin global)
   */
  static async getAllChats(residencialId: string): Promise<Chat[]> {
    try {
      const chatsRef = collection(db, 'residenciales', residencialId, 'chats');
      const q = query(chatsRef, orderBy('lastMessageTimestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const chats: Chat[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        chats.push({
          id: doc.id,
          participants: data.participants || [],
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTimestamp?.toDate() || new Date(),
          lastMessageSender: data.lastMessageSender || '',
          unreadCount: data.unreadCount || {}
        });
      });

      console.log(`Chats obtenidos para residencial ${residencialId}:`, chats.length);
      return chats;
    } catch (error) {
      console.error('Error obteniendo todos los chats:', error);
      throw error;
    }
  }

  /**
   * Elimina un chat y todos sus mensajes
   */
  static async deleteChat(residencialId: string, chatId: string): Promise<void> {
    try {
      const chatDocRef = doc(db, 'residenciales', residencialId, 'chats', chatId);
      
      // Eliminar todos los mensajes del chat
      const messagesRef = collection(chatDocRef, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      
      const batch = writeBatch(db);
      messagesSnapshot.docs.forEach((messageDoc) => {
        batch.delete(messageDoc.ref);
      });
      
      // Eliminar el chat
      batch.delete(chatDocRef);
      
      await batch.commit();
      console.log('Chat eliminado exitosamente:', chatId);
    } catch (error) {
      console.error('Error eliminando chat:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los usuarios del sistema para admin global
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      const usersRef = collection(db, 'usuarios');
      const q = query(usersRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();

        const firstName = data.fullName || data.nombre || data.name || data.firstName || '';
        const paternalLastName = data.paternalLastName || data.apellidoPaterno || '';
        const maternalLastName = data.maternalLastName || data.apellidoMaterno || '';
        
        const fullNameParts = [
          firstName,
          paternalLastName,
          maternalLastName
        ].filter((part: string) => Boolean(part && String(part).trim()));
        
        const computedFullName = fullNameParts.join(' ');

        users.push({
          uid: doc.id,
          fullName: computedFullName || '',
          email: data.email || '',
          role: data.role || 'resident',
          calle: data.calle || '',
          houseNumber: data.houseNumber || '',
          residencialID: data.residencialID || '',
          // Campos adicionales para nombres
          nombre: data.nombre || '',
          name: data.name || '',
          firstName: data.firstName || '',
          apellidoPaterno: data.apellidoPaterno || '',
          paternalLastName: data.paternalLastName || '',
          apellidoMaterno: data.apellidoMaterno || '',
          maternalLastName: data.maternalLastName || '',
          lastName: data.lastName || '',
        });
      });

      return users;
    } catch (error) {
      console.error('Error obteniendo todos los usuarios:', error);
      throw error;
    }
  }

  /**
   * Obtiene los usuarios de un residencial
   */
  static async getUsers(residencialId: string): Promise<User[]> {
    try {
      const usersRef = collection(db, 'usuarios');
      const q = query(
        usersRef, 
        // Muchos documentos traen ambos campos; priorizamos residencialDocId
        where('residencialDocId', '==', residencialId),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();

        /**
         * Construir nombre completo siguiendo la estructura de la base de datos:
         * - fullName: Nombre del residente (ej: "Ana Betsy")
         * - paternalLastName: Apellido paterno (ej: "Lara") 
         * - maternalLastName: Apellido materno (ej: "Espinoza")
         * 
         * Resultado: "Ana Betsy Lara Espinoza"
         */
        const firstName = data.fullName || data.nombre || data.name || data.firstName || '';
        const paternalLastName = data.paternalLastName || data.apellidoPaterno || '';
        const maternalLastName = data.maternalLastName || data.apellidoMaterno || '';
        
        const fullNameParts = [
          firstName,
          paternalLastName,
          maternalLastName
        ].filter((part: string) => Boolean(part && String(part).trim()));
        
        const computedFullName = fullNameParts.join(' ');

        users.push({
          uid: doc.id,
          fullName: computedFullName || '',
          email: data.email || '',
          role: data.role || 'resident',
          calle: data.calle || '',
          houseNumber: data.houseNumber || '',
          residencialID: data.residencialID || '',
          // Campos adicionales para nombres
          nombre: data.nombre || '',
          name: data.name || '',
          firstName: data.firstName || '',
          apellidoPaterno: data.apellidoPaterno || '',
          paternalLastName: data.paternalLastName || '',
          apellidoMaterno: data.apellidoMaterno || '',
          maternalLastName: data.maternalLastName || '',
          lastName: data.lastName || '',
        });
      });

      return users;
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo chat entre dos usuarios
   */
  static async createChat(
    residencialId: string, 
    participant1: string, 
    participant2: string
  ): Promise<string> {
    try {
      const chatId = [participant1, participant2].sort().join('_');
      const chatRef = doc(db, 'residenciales', residencialId, 'chats', chatId);
      
      const chatData = {
        participants: [participant1, participant2],
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        lastMessageSender: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadCount: { [participant1]: 0, [participant2]: 0 },
      };

      await setDoc(chatRef, chatData, { merge: true });
      return chatId;
    } catch (error) {
      console.error('Error creando chat:', error);
      throw error;
    }
  }

  /**
   * Suscribe a cambios en tiempo real de los chats
   */
  static subscribeToChats(
    residencialId: string,
    callback: (chats: Chat[]) => void,
    participantId?: string
  ): () => void {
    const chatsRef = collection(db, 'residenciales', residencialId, 'chats');
    const qRef = participantId 
      ? query(chatsRef, where('participants', 'array-contains', participantId))
      : chatsRef;

    const unsubscribe = onSnapshot(qRef, (querySnapshot) => {
      const chats: Chat[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        chats.push({
          id: doc.id,
          participants: data.participants || [],
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime || Timestamp.now(),
          lastMessageSender: data.lastMessageSender || '',
          unreadCount: data.unreadCount || {},
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now(),
        });
      });
      // Ordenamos client-side
      callback(chats.sort((a, b) => b.lastMessageTime.toMillis() - a.lastMessageTime.toMillis()));
    });

    return unsubscribe;
  }

  /**
   * Suscribe a cambios en tiempo real de los mensajes de un chat
   */
  static subscribeToMessages(
    residencialId: string, 
    chatId: string, 
    callback: (messages: Message[]) => void
  ): () => void {
    const messagesRef = collection(db, 'residenciales', residencialId, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages: Message[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          text: data.text || '',
          senderId: data.senderId || '',
          timestamp: data.timestamp || Timestamp.now(),
        });
      });
      callback(messages);
    });

    return unsubscribe;
  }
}
