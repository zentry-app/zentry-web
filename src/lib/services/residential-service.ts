import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Residencial } from '../../types/models';

/**
 * Servicio para gestionar residenciales
 */
export const ResidentialService = {
  /**
   * Obtiene todos los residenciales
   */
  getAllResidentials: async (): Promise<Residencial[]> => {
    try {
      const residencialesRef = collection(db, 'residenciales');
      const querySnapshot = await getDocs(residencialesRef);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convertir los Timestamp a Date
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : undefined;
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined;

        return {
          id: doc.id,
          name: data.name || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          postalCode: data.postalCode || '',
          country: data.country || 'México',
          totalHouses: data.totalHouses || 0,
          createdAt,
          updatedAt,
          adminIds: data.adminIds || []
        } as Residencial;
      });
    } catch (error: any) {
      console.error('Error al obtener residenciales:', error.message);
      throw error;
    }
  },

  /**
   * Obtiene un residencial por su ID
   */
  getResidentialById: async (residentialId: string): Promise<Residencial | null> => {
    try {
      const residentialRef = doc(db, 'residenciales', residentialId);
      const residentialSnap = await getDoc(residentialRef);
      
      if (!residentialSnap.exists()) {
        return null;
      }
      
      const data = residentialSnap.data();
      
      // Convertir los Timestamp a Date
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : undefined;
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined;

      return {
        id: residentialSnap.id,
        name: data.name || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        postalCode: data.postalCode || '',
        country: data.country || 'México',
        totalHouses: data.totalHouses || 0,
        createdAt,
        updatedAt,
        adminIds: data.adminIds || []
      } as Residencial;
    } catch (error: any) {
      console.error('Error al obtener residencial:', error.message);
      throw error;
    }
  },

  /**
   * Crea un nuevo residencial
   */
  createResidential: async (residentialData: {
    name: string;
    address: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    totalHouses?: number;
  }): Promise<string> => {
    try {
      const now = Timestamp.fromDate(new Date());
      
      const residentialRef = collection(db, 'residenciales');
      const docRef = await addDoc(residentialRef, {
        ...residentialData,
        createdAt: now,
        updatedAt: now,
        adminIds: []
      });
      
      return docRef.id;
    } catch (error: any) {
      console.error('Error al crear residencial:', error.message);
      throw error;
    }
  },

  /**
   * Actualiza un residencial existente
   */
  updateResidential: async (
    residentialId: string, 
    residentialData: {
      name?: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      totalHouses?: number;
    }
  ): Promise<void> => {
    try {
      const residentialRef = doc(db, 'residenciales', residentialId);
      
      // Verificar que el residencial existe
      const residentialSnap = await getDoc(residentialRef);
      if (!residentialSnap.exists()) {
        throw new Error('El residencial no existe');
      }
      
      // Actualizar solo los campos proporcionados
      await updateDoc(residentialRef, {
        ...residentialData,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error: any) {
      console.error('Error al actualizar residencial:', error.message);
      throw error;
    }
  },

  /**
   * Elimina un residencial
   */
  deleteResidential: async (residentialId: string): Promise<void> => {
    try {
      const residentialRef = doc(db, 'residenciales', residentialId);
      
      // Verificar que el residencial existe
      const residentialSnap = await getDoc(residentialRef);
      if (!residentialSnap.exists()) {
        throw new Error('El residencial no existe');
      }
      
      // Eliminamos el residencial
      await deleteDoc(residentialRef);
    } catch (error: any) {
      console.error('Error al eliminar residencial:', error.message);
      throw error;
    }
  },

  /**
   * Obtiene los residenciales administrados por un usuario específico
   */
  getResidentialsByAdminId: async (adminId: string): Promise<Residencial[]> => {
    try {
      const residencialesRef = collection(db, 'residenciales');
      const q = query(residencialesRef, where('adminIds', 'array-contains', adminId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convertir los Timestamp a Date
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : undefined;
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined;

        return {
          id: doc.id,
          name: data.name || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          postalCode: data.postalCode || '',
          country: data.country || 'México',
          totalHouses: data.totalHouses || 0,
          createdAt,
          updatedAt,
          adminIds: data.adminIds || []
        } as Residencial;
      });
    } catch (error: any) {
      console.error('Error al obtener residenciales por administrador:', error.message);
      throw error;
    }
  }
};

export default ResidentialService; 