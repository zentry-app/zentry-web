import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserModel, UserRole } from '../../types/models';
import { Usuario } from '../firebase/firestore';
import { usuarioToUserModel, userModelToUsuario } from '../utils/user-mappers';

/**
 * Servicio para la gestión de usuarios
 * Refleja la funcionalidad del servicio UserService en la app móvil
 */
export const UserService = {
  /**
   * Obtiene todos los usuarios de un residencial específico
   */
  getUsersByResidencial: async (residencialId: string): Promise<UserModel[]> => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('residencialId', '==', residencialId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Crear objeto Usuario con los datos de Firestore
        const usuario: Usuario = {
          id: doc.id,
          uid: doc.id,
          email: data.email || '',
          fullName: data.fullName || '',
          paternalLastName: data.paternalLastName || data.apellidoPaterno || '',
          maternalLastName: data.maternalLastName || data.apellidoMaterno || '',
          telefono: data.telefono || '',
          role: data.role?.toLowerCase() as 'admin' | 'resident' | 'security' | 'guest',
          residencialID: data.residencialID || data.residencialId || '',
          houseNumber: data.houseNumber?.toString() || '',
          status: data.status as 'pending' | 'approved' | 'rejected' | 'inactive',
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
          lastSignInTime: null,
          lastRefreshTime: null,
          signInProvider: data.signInProvider || ''
        };
        
        // Usar la función de mapeo para convertir a UserModel
        return usuarioToUserModel(usuario);
      });
    } catch (error: any) {
      console.error('Error al obtener usuarios por residencial:', error.message);
      throw error;
    }
  },

  /**
   * Obtiene los usuarios con estado pendiente
   */
  getPendingUsers: async (): Promise<UserModel[]> => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convertir los Timestamp a Date
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : undefined;
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined;

        // Mapear el rol string al enum
        let role: UserRole;
        switch (data.role?.toLowerCase()) {
          case 'admin':
            role = UserRole.Admin;
            break;
          case 'guard':
          case 'security':
            role = UserRole.Guard;
            break;
          case 'developer':
            role = UserRole.Developer;
            break;
          case 'resident':
          default:
            role = UserRole.Resident;
        }

        return {
          uid: doc.id,
          email: data.email || '',
          fullName: data.fullName || '',
          role,
          status: data.status || 'pending',
          residencialId: data.residencialID || '',
          residencialDocId: data.residencialDocId || '',
          houseNumber: data.houseNumber?.toString() || '',
          createdAt,
          updatedAt,
          paternalLastName: data.paternalLastName || data.apellidoPaterno,
          maternalLastName: data.maternalLastName || data.apellidoMaterno,
        } as UserModel;
      });
    } catch (error: any) {
      console.error('Error al obtener usuarios pendientes:', error.message);
      throw error;
    }
  },

  /**
   * Actualiza los datos de un usuario
   */
  updateUser: async (uid: string, userData: Partial<UserModel>): Promise<void> => {
    try {
      const userDocRef = doc(db, 'users', uid);
      
      // Preparar los datos para Firestore
      const dataToUpdate: Record<string, any> = {
        ...userData,
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      // Convertir el rol de enum a string si está presente
      if (userData.role !== undefined) {
        dataToUpdate.role = userData.role.toString();
      }
      
      // Convertir fechas a Timestamp
      if (userData.doNotDisturbStart) {
        dataToUpdate.doNotDisturbStart = Timestamp.fromDate(userData.doNotDisturbStart);
      }
      
      if (userData.doNotDisturbEnd) {
        dataToUpdate.doNotDisturbEnd = Timestamp.fromDate(userData.doNotDisturbEnd);
      }
      
      await updateDoc(userDocRef, dataToUpdate);
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error.message);
      throw error;
    }
  },

  /**
   * Elimina un usuario
   */
  deleteUser: async (uid: string): Promise<void> => {
    try {
      const userDocRef = doc(db, 'users', uid);
      await deleteDoc(userDocRef);
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error.message);
      throw error;
    }
  },

  /**
   * Obtiene un usuario por su ID
   */
  getUserById: async (uid: string): Promise<UserModel | null> => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userDocRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      
      // Crear objeto Usuario con los datos de Firestore
      const usuario: Usuario = {
        id: docSnap.id,
        uid: docSnap.id,
        email: data.email || '',
        fullName: data.fullName || '',
        paternalLastName: data.paternalLastName || data.apellidoPaterno || '',
        maternalLastName: data.maternalLastName || data.apellidoMaterno || '',
        telefono: data.telefono || '',
        role: data.role?.toLowerCase() as 'admin' | 'resident' | 'security' | 'guest',
        residencialID: data.residencialID || data.residencialId || '',
        houseNumber: data.houseNumber?.toString() || '',
        status: data.status as 'pending' | 'approved' | 'rejected' | 'inactive',
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
        lastSignInTime: null,
        lastRefreshTime: null,
        signInProvider: data.signInProvider || '',
        notificationSettings: {
          doNotDisturb: data.doNotDisturb || false,
          doNotDisturbStart: '',
          doNotDisturbEnd: '',
          emergencies: true,
          events: true,
          packages: true,
          visitors: true
        }
      };
      
      // Usar la función de mapeo para convertir a UserModel
      return usuarioToUserModel(usuario);
    } catch (error: any) {
      console.error('Error al obtener usuario por ID:', error.message);
      throw error;
    }
  },

  /**
   * Suscribe a cambios en usuarios de un residencial
   */
  subscribeToResidencialUsers: (residencialId: string, callback: (users: UserModel[]) => void) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('residencialId', '==', residencialId));
    
    return onSnapshot(q, (querySnapshot) => {
      const users = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Crear objeto Usuario con los datos de Firestore
        const usuario: Usuario = {
          id: doc.id,
          uid: doc.id,
          email: data.email || '',
          fullName: data.fullName || '',
          paternalLastName: data.paternalLastName || data.apellidoPaterno || '',
          maternalLastName: data.maternalLastName || data.apellidoMaterno || '',
          telefono: data.telefono || '',
          role: data.role?.toLowerCase() as 'admin' | 'resident' | 'security' | 'guest',
          residencialID: data.residencialID || data.residencialId || '',
          houseNumber: data.houseNumber?.toString() || '',
          status: data.status as 'pending' | 'approved' | 'rejected' | 'inactive',
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
          lastSignInTime: null,
          lastRefreshTime: null,
          signInProvider: data.signInProvider || '',
          notificationSettings: {
            doNotDisturb: data.doNotDisturb || false,
            doNotDisturbStart: '',
            doNotDisturbEnd: '',
            emergencies: true,
            events: true,
            packages: true,
            visitors: true
          }
        };
        
        // Usar la función de mapeo para convertir a UserModel
        return usuarioToUserModel(usuario);
      });
      
      callback(users);
    });
  },

  /**
   * Suscribe a cambios en usuarios pendientes
   */
  subscribeToPendingUsers: (callback: (users: UserModel[]) => void) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('status', '==', 'pending'));
    
    return onSnapshot(q, (querySnapshot) => {
      const users = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Crear objeto Usuario con los datos de Firestore
        const usuario: Usuario = {
          id: doc.id,
          uid: doc.id,
          email: data.email || '',
          fullName: data.fullName || '',
          paternalLastName: data.paternalLastName || data.apellidoPaterno || '',
          maternalLastName: data.maternalLastName || data.apellidoMaterno || '',
          telefono: data.telefono || '',
          role: data.role?.toLowerCase() as 'admin' | 'resident' | 'security' | 'guest',
          residencialID: data.residencialID || data.residencialId || '',
          houseNumber: data.houseNumber?.toString() || '',
          status: data.status as 'pending' | 'approved' | 'rejected' | 'inactive',
          createdAt: data.createdAt || null,
          updatedAt: data.updatedAt || null,
          lastSignInTime: null,
          lastRefreshTime: null,
          signInProvider: data.signInProvider || ''
        };
        
        // Usar la función de mapeo para convertir a UserModel
        return usuarioToUserModel(usuario);
      });
      
      callback(users);
    });
  }
};

export default UserService; 