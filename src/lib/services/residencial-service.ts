import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp, 
  query, 
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Residencial } from '../../types/models';

/**
 * Servicio para la gestión de residenciales
 */
export const ResidencialService = {
  /**
   * Obtiene todos los residenciales
   */
  getAllResidenciales: async (): Promise<Residencial[]> => {
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
          nombre: data.nombre || '',
          direccion: data.direccion || '',
          codigoPostal: data.codigoPostal || '',
          ciudad: data.ciudad || '',
          estado: data.estado || '',
          pais: data.pais || '',
          administradorId: data.administradorId,
          residencialID: data.residencialID || '',
          createdAt,
          updatedAt,
          logo: data.logo,
          numeroViviendas: data.numeroViviendas,
          latitud: data.latitud,
          longitud: data.longitud
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
  getResidencialById: async (id: string): Promise<Residencial | null> => {
    try {
      const residencialDocRef = doc(db, 'residenciales', id);
      const docSnap = await getDoc(residencialDocRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      
      // Convertir los Timestamp a Date
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : undefined;
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined;

      return {
        id: docSnap.id,
        nombre: data.nombre || '',
        direccion: data.direccion || '',
        codigoPostal: data.codigoPostal || '',
        ciudad: data.ciudad || '',
        estado: data.estado || '',
        pais: data.pais || '',
        administradorId: data.administradorId,
        residencialID: data.residencialID || '',
        createdAt,
        updatedAt,
        logo: data.logo,
        numeroViviendas: data.numeroViviendas,
        latitud: data.latitud,
        longitud: data.longitud
      } as Residencial;
    } catch (error: any) {
      console.error('Error al obtener residencial:', error.message);
      throw error;
    }
  },

  /**
   * Crea un nuevo residencial
   */
  createResidencial: async (residencialData: Omit<Residencial, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const residencialesRef = collection(db, 'residenciales');
      
      const dataToAdd = {
        ...residencialData,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      const docRef = await addDoc(residencialesRef, dataToAdd);
      return docRef.id;
    } catch (error: any) {
      console.error('Error al crear residencial:', error.message);
      throw error;
    }
  },

  /**
   * Actualiza un residencial existente
   */
  updateResidencial: async (id: string, residencialData: Partial<Residencial>): Promise<void> => {
    try {
      const residencialDocRef = doc(db, 'residenciales', id);
      
      const dataToUpdate = {
        ...residencialData,
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      await updateDoc(residencialDocRef, dataToUpdate);
    } catch (error: any) {
      console.error('Error al actualizar residencial:', error.message);
      throw error;
    }
  },

  /**
   * Elimina un residencial
   */
  deleteResidencial: async (id: string): Promise<void> => {
    try {
      const residencialDocRef = doc(db, 'residenciales', id);
      await deleteDoc(residencialDocRef);
    } catch (error: any) {
      console.error('Error al eliminar residencial:', error.message);
      throw error;
    }
  },

  /**
   * Obtiene residenciales por administrador
   */
  getResidencialesByAdmin: async (adminId: string): Promise<Residencial[]> => {
    try {
      const residencialesRef = collection(db, 'residenciales');
      const q = query(residencialesRef, where('administradorId', '==', adminId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convertir los Timestamp a Date
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : undefined;
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined;

        return {
          id: doc.id,
          nombre: data.nombre || '',
          direccion: data.direccion || '',
          codigoPostal: data.codigoPostal || '',
          ciudad: data.ciudad || '',
          estado: data.estado || '',
          pais: data.pais || '',
          administradorId: data.administradorId,
          residencialID: data.residencialID || '',
          createdAt,
          updatedAt,
          logo: data.logo,
          numeroViviendas: data.numeroViviendas,
          latitud: data.latitud,
          longitud: data.longitud
        } as Residencial;
      });
    } catch (error: any) {
      console.error('Error al obtener residenciales por administrador:', error.message);
      throw error;
    }
  },

  /**
   * Suscribe a cambios en residenciales
   */
  subscribeToResidenciales: (callback: (residenciales: Residencial[]) => void) => {
    const residencialesRef = collection(db, 'residenciales');
    
    return onSnapshot(residencialesRef, (querySnapshot) => {
      const residenciales = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convertir los Timestamp a Date
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : undefined;
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined;

        return {
          id: doc.id,
          nombre: data.nombre || '',
          direccion: data.direccion || '',
          codigoPostal: data.codigoPostal || '',
          ciudad: data.ciudad || '',
          estado: data.estado || '',
          pais: data.pais || '',
          administradorId: data.administradorId,
          residencialID: data.residencialID || '',
          createdAt,
          updatedAt,
          logo: data.logo,
          numeroViviendas: data.numeroViviendas,
          latitud: data.latitud,
          longitud: data.longitud
        } as Residencial;
      });
      
      callback(residenciales);
    });
  },
  
  /**
   * Suscribe a cambios en residenciales por administrador
   */
  subscribeToResidencialesByAdmin: (adminId: string, callback: (residenciales: Residencial[]) => void) => {
    const residencialesRef = collection(db, 'residenciales');
    const q = query(residencialesRef, where('administradorId', '==', adminId));
    
    return onSnapshot(q, (querySnapshot) => {
      const residenciales = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convertir los Timestamp a Date
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : undefined;
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined;

        return {
          id: doc.id,
          nombre: data.nombre || '',
          direccion: data.direccion || '',
          codigoPostal: data.codigoPostal || '',
          ciudad: data.ciudad || '',
          estado: data.estado || '',
          pais: data.pais || '',
          administradorId: data.administradorId,
          residencialID: data.residencialID || '',
          createdAt,
          updatedAt,
          logo: data.logo,
          numeroViviendas: data.numeroViviendas,
          latitud: data.latitud,
          longitud: data.longitud
        } as Residencial;
      });
      
      callback(residenciales);
    });
  }
};

export default ResidencialService; 