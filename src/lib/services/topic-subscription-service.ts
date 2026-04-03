import { getToken, onMessage, getMessaging, isSupported } from 'firebase/messaging';
import { doc, updateDoc, getDoc, setDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { db, messaging } from '../firebase/config';
import { auth } from '../firebase/config';

// Categorías de notificaciones disponibles
const categories: Record<string, string[]> = {
  'panic': ['resident', 'guard', 'admin'], // Quién recibe alertas de pánico
  'event': ['resident', 'admin'],          // Quién recibe eventos
  'announcement': ['resident', 'admin'],    // Quién recibe anuncios
  'alert': ['resident', 'guard', 'admin'], // Quién recibe alertas generales
};

/**
 * Servicio para gestionar las suscripciones a tópicos de FCM
 */
export const TopicSubscriptionService = {
  /**
   * Actualiza los tópicos del usuario en Firestore
   */
  async _updateUserTopics(topic: string, subscribe: boolean): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userRef = doc(db, 'usuarios', userId);
      
      if (subscribe) {
        await updateDoc(userRef, {
          topics: arrayUnion(topic)
        });
      } else {
        await updateDoc(userRef, {
          topics: arrayRemove(topic)
        });
      }
      
      console.log(`Topics actualizados para el usuario ${userId}: ${subscribe ? 'suscrito a' : 'desuscrito de'} ${topic}`);
    } catch (e) {
      console.error('Error actualizando topics del usuario:', e);
      throw e;
    }
  },

  /**
   * Obtiene los tópicos del usuario actual
   */
  async getUserTopics(): Promise<string[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return [];

      const userDoc = await getDoc(doc(db, 'usuarios', userId));

      const topics = userDoc.data()?.topics || [];
      return topics;
    } catch (e) {
      console.error('Error obteniendo topics del usuario:', e);
      return [];
    }
  },

  /**
   * Verifica si el usuario está suscrito a un tópico
   */
  async isSubscribedToTopic(topic: string): Promise<boolean> {
    try {
      const topics = await this.getUserTopics();
      return topics.includes(topic);
    } catch (e) {
      console.error('Error verificando suscripción al tópico:', e);
      return false;
    }
  },

  /**
   * Suscribe al usuario a tópicos de un residencial
   */
  async subscribeToResidentialTopics(residentialId: string, role: string): Promise<void> {
    try {
      console.log(`[TopicSubscriptionService] Iniciando suscripción a tópicos para ${residentialId} con rol ${role}`);
      
      let correctResidentialId = residentialId;
      
      // Si es un ID de documento (generalmente más largo), intentar obtener el residencialID correcto
      if (residentialId.length > 10 && (role === 'security' || role === 'guard')) {
        console.log(`[TopicSubscriptionService] Verificando si es un ID de documento: ${residentialId}`);
        try {
          const docSnapshot = await getDoc(doc(db, 'residenciales', residentialId));
              
          if (docSnapshot.exists() && docSnapshot.data()?.residencialID) {
            correctResidentialId = docSnapshot.data()?.residencialID;
            console.log(`[TopicSubscriptionService] Se encontró el residencialID correcto: ${correctResidentialId}`);
          }
        } catch (e) {
          console.error(`[TopicSubscriptionService] Error obteniendo residencialID: ${e}`);
          // Continuamos con el ID original si hay un error
        }
      }
      
      // Para los administradores, actualizar sólo en Firestore, no en el cliente
      // ya que en la web no necesitan recibir push notifications
      
      // Actualizar tópico general del residencial
      await this._updateUserTopics(`residential_${correctResidentialId}`, true);
      
      // Actualizar tópico de rol
      await this._updateUserTopics(`role_${correctResidentialId}_${role}`, true);
      
      // Actualizar tópicos de categorías
      for (const category of Object.keys(categories)) {
        if (categories[category].includes(role)) {
          await this._updateUserTopics(`category_${correctResidentialId}_${category}`, true);
        }
      }
      
      // Asegurar que usuarios de seguridad y admin siempre se suscriban al tópico de pánico
      if (role === 'security' || role === 'guard' || role === 'admin') {
        const panicTopic = `category_${correctResidentialId}_panic`;
        console.log(`[TopicSubscriptionService] Asegurando suscripción al tópico de pánico: ${panicTopic}`);
        await this._updateUserTopics(panicTopic, true);
      }
      
      console.log(`[TopicSubscriptionService] Suscrito a todos los tópicos del residencial ${correctResidentialId} con rol ${role}`);
    } catch (e) {
      console.error(`[TopicSubscriptionService] Error al suscribirse a los tópicos: ${e}`);
      throw e;
    }
  },
  
  /**
   * Método específico para asegurar la suscripción al tópico de pánico
   */
  async ensurePanicSubscription(residentialId: string): Promise<void> {
    try {
      console.log(`[TopicSubscriptionService] Asegurando suscripción a pánico para ${residentialId}`);
      
      let correctResidentialId = residentialId;
      
      // Verificar si es un ID de documento
      if (residentialId.length > 10) {
        try {
          const docSnapshot = await getDoc(doc(db, 'residenciales', residentialId));
              
          if (docSnapshot.exists() && docSnapshot.data()?.residencialID) {
            correctResidentialId = docSnapshot.data()?.residencialID;
            console.log(`[TopicSubscriptionService] ID corregido para pánico: ${correctResidentialId}`);
          }
        } catch (e) {
          console.error(`[TopicSubscriptionService] Error obteniendo ID: ${e}`);
        }
      }
      
      const panicTopic = `category_${correctResidentialId}_panic`;
      
      // Verificar si ya está suscrito
      const isSubscribed = await this.isSubscribedToTopic(panicTopic);
      
      if (!isSubscribed) {
        await this._updateUserTopics(panicTopic, true);
        console.log(`[TopicSubscriptionService] Suscrito al tópico de pánico: ${panicTopic}`);
      } else {
        console.log(`[TopicSubscriptionService] Ya está suscrito al tópico: ${panicTopic}`);
      }
    } catch (e) {
      console.error(`[TopicSubscriptionService] Error en suscripción pánico: ${e}`);
    }
  }
};

export default TopicSubscriptionService; 