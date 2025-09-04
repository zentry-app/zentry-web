import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  addDoc, 
  Timestamp,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserModel, Residencial, UserRole } from '../../types/models';

/**
 * Servicio para operaciones de administrador global
 * Proporciona funciones específicas que solo puede realizar un administrador global
 */
export const AdminService = {
  /**
   * Obtener estadísticas generales del sistema
   */
  getSystemStats: async () => {
    try {
      console.log('[AdminService] Iniciando obtención de estadísticas del sistema');
      
      // Consultas a Firestore
      const usersRef = collection(db, 'usuarios');
      const residencialesRef = collection(db, 'residenciales');
      
      // Query para administradores - solo usar Admin ya que Developer puede no existir
      const adminsQuery = query(usersRef, 
        where('role', '==', 'admin')
      );
      // Query para administradores globales
      const globalAdminsQuery = query(usersRef,
        where('isGlobalAdmin', '==', true)
      );
      
      // Query para usuarios pendientes - usar status en lugar de isActive
      const pendingUsersQuery = query(usersRef, where('status', '==', 'pending'));
      // Query para usuarios residentes (todos los estados)
      const residentesQuery = query(usersRef, where('role', '==', 'resident'));
      
      console.log('[AdminService] Ejecutando consultas para obtener estadísticas');
      
      // Ejecutar todas las consultas en paralelo
      const [
        residencialesSnap,
        adminsSnap,
        globalAdminsSnap,
        pendingUsersSnap,
        residentesSnap
      ] = await Promise.all([
        getDocs(residencialesRef),
        getDocs(adminsQuery),
        getDocs(globalAdminsQuery),
        getDocs(pendingUsersQuery),
        getDocs(residentesQuery)
      ]);
      
      const stats = {
        totalResidentes: residentesSnap.size,
        totalResidenciales: residencialesSnap.size,
        totalAdmins: adminsSnap.size,
        globalAdmins: globalAdminsSnap.size,
        pendingUsers: pendingUsersSnap.size
      };
      
      console.log('[AdminService] Estadísticas obtenidas:', stats);
      return stats;
    } catch (error: any) {
      console.error('[AdminService] Error al obtener estadísticas del sistema:', error.message);
      // Devolver datos de fallback para evitar errores en la UI
      return {
        totalResidentes: 0,
        totalResidenciales: 0,
        totalAdmins: 0,
        pendingUsers: 0
      };
    }
  },

  /**
   * Obtener todos los administradores del sistema
   */
  getAllAdmins: async (): Promise<UserModel[]> => {
    try {
      console.log('[AdminService] Obteniendo listado de administradores');
      const usersRef = collection(db, 'usuarios');
      const q = query(usersRef, where('role', '==', 'admin'));
      const querySnapshot = await getDocs(q);
      
      const admins = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email || '',
          fullName: data.fullName || '',
          role: data.role || UserRole.Admin,
          status: data.status || 'active',
          residencialId: data.residencialId || '',
          residencialDocId: data.residencialDocId || '',
          houseNumber: data.houseNumber?.toString() || '',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : undefined,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
          paternalLastName: data.paternalLastName || '',
          maternalLastName: data.maternalLastName || '',
          isGlobalAdmin: data.isGlobalAdmin || false,
          managedResidencials: data.managedResidencials || []
        } as UserModel;
      });
      
      console.log(`[AdminService] Se encontraron ${admins.length} administradores`);
      return admins;
    } catch (error: any) {
      console.error('[AdminService] Error al obtener administradores:', error.message);
      return [];
    }
  },

  /**
   * Configurar un usuario como administrador global
   */
  setUserAsGlobalAdmin: async (userId: string, isGlobalAdmin: boolean): Promise<void> => {
    try {
      console.log(`[AdminService] Configurando usuario ${userId} como admin global: ${isGlobalAdmin}`);
      const userRef = doc(db, 'usuarios', userId);
      
      // Primero verificar que el usuario existe
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error(`El usuario con ID ${userId} no existe`);
      }
      
      // Actualizar el campo isGlobalAdmin
      await updateDoc(userRef, {
        isGlobalAdmin: isGlobalAdmin,
        updatedAt: Timestamp.fromDate(new Date())
      });
      
      console.log(`[AdminService] Usuario actualizado correctamente como admin global: ${isGlobalAdmin}`);
    } catch (error: any) {
      console.error('[AdminService] Error al configurar admin global:', error.message);
      throw error;
    }
  },

  /**
   * Asignar un administrador a un residencial específico
   */
  assignAdminToResidencial: async (adminId: string, residencialId: string): Promise<void> => {
    try {
      console.log(`[AdminService] Asignando admin ${adminId} al residencial ${residencialId}`);
      // Actualizar el residencial para añadir el admin a la lista de admins
      const residencialRef = doc(db, 'residenciales', residencialId);
      await updateDoc(residencialRef, {
        adminIds: arrayUnion(adminId),
        updatedAt: Timestamp.fromDate(new Date())
      });
      
      // Actualizar el usuario para añadir el residencial a su lista
      const userRef = doc(db, 'usuarios', adminId);
      await updateDoc(userRef, {
        managedResidencials: arrayUnion(residencialId),
        updatedAt: Timestamp.fromDate(new Date())
      });
      
      console.log(`[AdminService] Administrador asignado correctamente al residencial`);
    } catch (error: any) {
      console.error('[AdminService] Error al asignar administrador a residencial:', error.message);
      throw error;
    }
  },

  /**
   * Eliminar asignación de administrador a un residencial
   */
  removeAdminFromResidencial: async (adminId: string, residencialId: string): Promise<void> => {
    try {
      console.log(`[AdminService] Eliminando admin ${adminId} del residencial ${residencialId}`);
      // Actualizar el residencial para quitar el admin de la lista
      const residencialRef = doc(db, 'residenciales', residencialId);
      await updateDoc(residencialRef, {
        adminIds: arrayRemove(adminId),
        updatedAt: Timestamp.fromDate(new Date())
      });
      
      // Actualizar el usuario para quitar el residencial de su lista
      const userRef = doc(db, 'usuarios', adminId);
      await updateDoc(userRef, {
        managedResidencials: arrayRemove(residencialId),
        updatedAt: Timestamp.fromDate(new Date())
      });
      
      console.log(`[AdminService] Administrador eliminado correctamente del residencial`);
    } catch (error: any) {
      console.error('[AdminService] Error al eliminar administrador de residencial:', error.message);
      throw error;
    }
  },

  /**
   * Suscribirse a actualizaciones en tiempo real de las estadísticas del sistema
   */
  subscribeToSystemStats: (onUpdate: (stats: any) => void) => {
    console.log('[AdminService] Creando suscripción a estadísticas en tiempo real');
    
    // Consultas a Firestore
    const usersRef = collection(db, 'usuarios');
    const residencialesRef = collection(db, 'residenciales');
    
    const adminsQuery = query(usersRef, 
      where('role', '==', 'admin')
    );
    
    const pendingUsersQuery = query(usersRef, where('status', '==', 'pending'));
    const residentesQuery = query(usersRef, where('role', '==', 'resident'));
    
    // Mantener un estado local de las estadísticas
    const localStats: any = {
      totalResidentes: 0,
      totalResidenciales: 0,
      totalAdmins: 0,
      pendingUsers: 0
    };
    
    // Función para actualizar una estadística y notificar
    const updateStats = (key: string, value: number) => {
      localStats[key] = value;
      onUpdate({...localStats});
    };
    
    // Crear suscripciones a cada colección/consulta
    const unsubResidentes = onSnapshot(residentesQuery, snap => {
      console.log(`[AdminService] Actualización de residentes totales: ${snap.size}`);
      updateStats('totalResidentes', snap.size);
    });
    
    const unsubResidenciales = onSnapshot(residencialesRef, snap => {
      console.log(`[AdminService] Actualización de residenciales totales: ${snap.size}`);
      updateStats('totalResidenciales', snap.size);
    });
    
    const unsubAdmins = onSnapshot(adminsQuery, snap => {
      console.log(`[AdminService] Actualización de administradores totales: ${snap.size}`);
      updateStats('totalAdmins', snap.size);
    });
    
    const unsubPendingUsers = onSnapshot(pendingUsersQuery, snap => {
      console.log(`[AdminService] Actualización de usuarios pendientes: ${snap.size}`);
      updateStats('pendingUsers', snap.size);
    });
    
    // Devolver función para cancelar todas las suscripciones
    return () => {
      console.log('[AdminService] Cancelando suscripciones de estadísticas');
      unsubResidentes();
      unsubResidenciales();
      unsubAdmins();
      unsubPendingUsers();
    };
  }
};

export default AdminService; 