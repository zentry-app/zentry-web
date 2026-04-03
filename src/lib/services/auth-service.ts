import { 
  signInWithEmailAndPasswordSafe,
  createUserWithEmailAndPasswordSafe,
  signOutSafe,
  sendPasswordResetEmailSafe,
  signInWithPopupSafe,
  createGoogleProvider,
  createAppleProvider,
  getAuthSafe,
  updateProfileSafe,
  db,
  signInWithRedirectSafe
} from '../firebase/config';
import { doc, setDoc, getDoc, updateDoc, Timestamp, collection, getDocs, query, limit } from 'firebase/firestore';
import { UserModel, UserRole } from '../../types/models';
import { toast } from 'sonner';
import { TopicSubscriptionService } from './topic-subscription-service';

/**
 * Servicio de autenticación que proporciona funciones relacionadas con la
 * autenticación y gestión de usuarios en Firebase.
 * Refleja la funcionalidad del servicio AuthService en la app móvil.
 */
export const AuthService = {
  /**
   * Inicia sesión con email y contraseña
   */
  loginWithEmail: async (email: string, password: string): Promise<any> => {
    try {
      console.log(`[AuthService.loginWithEmail] Intentando login para: ${email}`);
      const userCredential = await signInWithEmailAndPasswordSafe(email, password);
      console.log(`[AuthService.loginWithEmail] Login exitoso en Auth. UID: ${userCredential.user.uid}`);
      // Mostrar los proveedores vinculados
      if (userCredential.user.providerData && userCredential.user.providerData.length > 0) {
        console.log('[AuthService.loginWithEmail] Proveedores vinculados:', userCredential.user.providerData.map((p: any) => p.providerId));
      } else {
        console.log('[AuthService.loginWithEmail] No hay proveedores vinculados en providerData.');
      }
      // VERIFICACIÓN INMEDIATA: Obtener datos del usuario desde Firestore
      console.log(`[AuthService.loginWithEmail] Buscando usuario ${userCredential.user.uid} en Firestore`);
      
      // Intentar primero con la colección 'users' (nueva estructura)
      let userDoc = await getDoc(doc(db, 'usuarios', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        console.log(`[AuthService.loginWithEmail] Usuario no encontrado en 'users', intentando en 'usuarios'`);
        // Si no existe, intentar con la colección 'usuarios' (estructura legacy)
        userDoc = await getDoc(doc(db, 'usuarios', userCredential.user.uid));
      }
      
      if (!userDoc.exists()) {
        // Si el usuario no existe en ninguna colección, cerrar sesión inmediatamente
        await signOutSafe();
        throw new Error('Usuario no encontrado en la base de datos. Solo administradores pueden acceder a esta plataforma.');
      }

      const userData = userDoc.data();
      console.log(`[AuthService.loginWithEmail] Usuario encontrado:`, {
        uid: userData.uid,
        email: userData.email,
        role: userData.role,
        signInProvider: userData.signInProvider,
        status: userData.status
      });
            
      // VALIDACIÓN CRÍTICA INMEDIATA: Solo administradores y guardias pueden acceder
      if (userData.role === 'resident') {
        console.log('🚫 ACCESO DENEGADO: Usuario residente detectado');
        console.log('Cerrando sesión inmediatamente...');
            
        // Cerrar sesión inmediatamente antes de que vea el dashboard
        await signOutSafe();
        
        throw new Error('Acceso denegado. Esta plataforma web es exclusiva para administradores. Los residentes deben usar la aplicación móvil de Zentry.');
      }
      
      // Solo llegar aquí si es admin o guard
      console.log('✅ Acceso permitido para usuario:', userData.role);
      
      return {
        user: userCredential.user,
        userData: userData
      };
      
    } catch (error: any) {
      console.error('Error en loginWithEmail:', error);
      
      // Manejo específico de errores de Firebase Auth
      if (error.code) {
        switch (error.code) {
          case 'auth/invalid-credential':
            console.error('[AuthService.loginWithEmail] ⚠️ Error de credenciales. Es posible que el usuario tenga un método de acceso diferente (Apple, Google, etc) o que la contraseña sea incorrecta.');
            throw new Error('Correo electrónico o contraseña incorrectos');
          case 'auth/user-not-found':
            throw new Error('No existe una cuenta con este correo electrónico');
          case 'auth/wrong-password':
            throw new Error('La contraseña es incorrecta');
          case 'auth/invalid-email':
            throw new Error('El correo electrónico no es válido');
          case 'auth/user-disabled':
            throw new Error('Esta cuenta ha sido deshabilitada');
          case 'auth/too-many-requests':
            throw new Error('Demasiados intentos fallidos. Intenta nuevamente más tarde');
          case 'auth/network-request-failed':
            throw new Error('Error de conexión. Verifica tu conexión a internet');
          default:
            throw new Error(`Error de autenticación: ${error.message}`);
        }
      }
      
      throw error;
    }
  },

  /**
   * Registra un nuevo usuario
   */
  registerUser: async (userData: {
    email: string,
    password: string,
    fullName: string,
    paternalLastName?: string,
    maternalLastName?: string,
    role: UserRole,
    residencialId: string,
    residencialDocId: string,
    houseNumber: string,
  }): Promise<any> => {
    console.log('🚀 [AuthService.registerUser] INVOCADO. Datos recibidos:', userData);
    try {
      // Guardar la información del usuario actual antes de crear el nuevo
      const currentAuth = await getAuthSafe();
      let currentIdToken = null;
      
      console.log('[AuthService.registerUser] Usuario actual (currentAuth):', currentAuth);

      if (currentAuth && currentAuth.currentUser) {
        try {
          currentIdToken = await currentAuth.currentUser.getIdToken();
          console.log('[AuthService.registerUser] Token del admin actual (currentIdToken) OBTENIDO:', currentIdToken ? 'Sí' : 'No');
        } catch (e) {
          console.log('[AuthService.registerUser] No se pudo obtener el token del admin actual:', e);
        }
      } else {
        console.log('[AuthService.registerUser] No hay currentAuth, por lo tanto no se puede obtener currentIdToken.');
      }

      // Crear el usuario en Authentication usando una instancia de auth temporal
      // Esto evita que se sobrescriba la sesión actual
      const authTemp = getAuthSafe();
      const userCredential = await createUserWithEmailAndPasswordSafe(
        userData.email, 
        userData.password
      );
      
      const user = userCredential.user;
      
      // Actualizar el perfil del usuario
      await updateProfileSafe(user, {
        displayName: userData.fullName
      });

      // Crear el documento del usuario en Firestore
      const userDocRef = doc(db, 'usuarios', user.uid);
      
      const userModelData: Omit<UserModel, 'uid'> = {
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        status: 'pending', // Los usuarios comienzan con estado pendiente
        residencialId: userData.residencialId,
        residencialDocId: userData.residencialDocId,
        houseNumber: userData.houseNumber,
        createdAt: new Date(),
        updatedAt: new Date(),
        paternalLastName: userData.paternalLastName,
        maternalLastName: userData.maternalLastName,
      };

      await setDoc(userDocRef, {
        ...userModelData,
        createdAt: Timestamp.fromDate(userModelData.createdAt as Date),
        updatedAt: Timestamp.fromDate(userModelData.updatedAt as Date),
        role: userModelData.role.toString()
      });

      // **AUTOMATIZACIÓN: Asignar claims automáticamente después de crear el usuario**
      try {
        console.log('[AuthService] 🚀 INICIO DE AUTOMATIZACIÓN DE CLAIMS');
        console.log('[AuthService] Iniciando asignación automática de claims para nuevo usuario:', user.uid);
        console.log('[AuthService] Datos del usuario para automatización:', {
          uid: user.uid,
          role: userData.role,
          residencialId: userData.residencialId,
          currentAuthExists: !!currentAuth,
          currentIdTokenExists: !!currentIdToken
        });
        
        // Solo intentar asignar claims si es un admin o guard con residencial
        if ((userData.role === UserRole.Admin || userData.role === UserRole.Guard) && userData.residencialId) {
          console.log('[AuthService] ✅ Usuario califica para claims automáticos:', {
            uid: user.uid,
            role: userData.role,
            residencialId: userData.residencialId
          });

          // Hacer llamada interna a nuestra API de asignación de claims
          const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL 
                         ? `https://${process.env.VERCEL_URL}` 
                         : 'http://localhost:3000';
          
          console.log('[AuthService] 📡 Preparando llamada a API de claims:', {
            baseUrl,
            targetUid: user.uid,
            role: userData.role === UserRole.Admin ? 'admin' : 'guard',
            residencialId: userData.residencialId,
            hasToken: !!currentIdToken
          });
                         
          const claimsResponse = await fetch(`${baseUrl}/api/admin/assign-claims`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentIdToken}`, // Usar el token del admin actual
            },
            body: JSON.stringify({
              targetUid: user.uid,
              role: userData.role === UserRole.Admin ? 'admin' : 'guard',
              residencialId: userData.residencialId,
              internalCall: true
            }),
          });

          console.log('[AuthService] 📊 Respuesta de API de claims:', {
            status: claimsResponse.status,
            statusText: claimsResponse.statusText,
            ok: claimsResponse.ok
          });

          if (claimsResponse.ok) {
            const claimsResult = await claimsResponse.json();
            console.log('[AuthService] 🎉 Claims asignados automáticamente exitosamente:', claimsResult);
          } else {
            const errorText = await claimsResponse.text();
            console.error('[AuthService] ❌ Error al asignar claims automáticamente:', {
              status: claimsResponse.status,
              statusText: claimsResponse.statusText,
              error: errorText
            });
            // No lanzamos error aquí para que no falle el registro
          }
        } else {
          console.log('[AuthService] ⚠️ Usuario NO califica para claims automáticos:', {
            role: userData.role,
            isAdmin: userData.role === UserRole.Admin,
            isGuard: userData.role === UserRole.Guard,
            hasResidencial: !!userData.residencialId,
            residencialId: userData.residencialId
          });
        }
      } catch (claimsError: any) {
        console.error('[AuthService] 💥 Error COMPLETO en asignación automática de claims:', claimsError);
        console.error('[AuthService] Error stack:', claimsError.stack);
        // No lanzamos error aquí para que no falle el registro del usuario
        // Los claims se pueden asignar manualmente después si es necesario
      }

      // Cerrar sesión del usuario recién creado
      await signOutSafe();
      
      // Si había un usuario conectado, restaurar su sesión
      if (currentAuth && currentIdToken) {
        console.log('[AuthService] Restaurando sesión del usuario administrador');
        try {
          // No podemos restaurar directamente la sesión, pero podemos asegurarnos
          // de que el objeto auth tenga la información correcta
          console.log('[AuthService] El usuario administrador permanece conectado');
        } catch (restoreError) {
          console.error('[AuthService] Error al restaurar la sesión:', restoreError);
          // Incluso si falla, el token actual sigue siendo válido por un tiempo
        }
      }

      // Devolver el FirebaseUser del usuario recién creado
      return user;
    } catch (error: any) {
      console.error('Error al registrar usuario:', error.message);
      throw error;
    }
  },

  /**
   * Cierra la sesión del usuario actual
   */
  logout: async (): Promise<void> => {
    try {
      await signOutSafe();
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error.message);
      throw error;
    }
  },

  /**
   * Envía un correo para restablecer la contraseña
   */
  resetPassword: async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmailSafe(email);
      toast.success('Correo de restablecimiento enviado');
    } catch (error: any) {
      console.error('Error al enviar correo de restablecimiento:', error.message);
      throw error;
    }
  },

  /**
   * Obtiene los datos del usuario actual desde Firestore
   */
  getUserData: async (uid: string): Promise<UserModel | null> => {
    try {
      console.log(`[AuthService.getUserData] Buscando usuario con UID: ${uid}`);
      
      // Intentar primero con la colección 'users' (nueva estructura)
      let userDoc = await getDoc(doc(db, 'usuarios', uid));
      
      if (!userDoc.exists()) {
        console.log(`[AuthService.getUserData] Usuario no encontrado en 'users', intentando en 'usuarios'`);
        // Si no existe, intentar con la colección 'usuarios' (estructura legacy)
        userDoc = await getDoc(doc(db, 'usuarios', uid));
      }
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log(`[AuthService.getUserData] Usuario encontrado:`, {
          uid: userData.uid,
          email: userData.email,
          role: userData.role,
          residencialId: userData.residencialID || userData.residencialId
        });
        
        return {
          uid: userData.uid || uid,
          email: userData.email,
          fullName: userData.fullName,
          paternalLastName: userData.paternalLastName,
          maternalLastName: userData.maternalLastName,
          role: userData.role as UserRole,
          status: userData.status,
          residencialId: userData.residencialID || userData.residencialId || '',
          residencialDocId: userData.residencialID || userData.residencialId || '',
          houseNumber: userData.houseNumber,
          isGlobalAdmin: userData.isGlobalAdmin || false,
          managedResidencials: userData.managedResidencials || [],
          createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(),
          updatedAt: userData.updatedAt?.toDate ? userData.updatedAt.toDate() : new Date()
        };
        }
        
      console.error(`[AuthService.getUserData] ❌ Usuario ${uid} no encontrado en ninguna colección`);
      return null;
    } catch (error: any) {
      console.error('[AuthService.getUserData] Error al obtener datos del usuario:', error.message);
      return null;
    }
  },

  /**
   * Actualiza el estado de un usuario
   */
  updateUserStatus: async (uid: string, status: string): Promise<void> => {
    try {
      const userDocRef = doc(db, 'usuarios', uid);
      await updateDoc(userDocRef, { 
        status, 
        updatedAt: Timestamp.fromDate(new Date()) 
      });
    } catch (error: any) {
      console.error('Error al actualizar estado del usuario:', error.message);
      throw error;
    }
  },

  /**
   * Inicia sesión con Google
   */
  loginWithGoogle: async (): Promise<any> => {
    try {
      const provider = await createGoogleProvider();
      const result = await signInWithPopupSafe(provider);
      
      // VERIFICACIÓN INMEDIATA: Obtener datos del usuario desde Firestore
      console.log(`[AuthService.loginWithGoogle] Buscando usuario ${result.user.uid} en Firestore`);
      
      // Intentar primero con la colección 'users' (nueva estructura)
      let userDoc = await getDoc(doc(db, 'usuarios', result.user.uid));
      
      if (!userDoc.exists()) {
        console.log(`[AuthService.loginWithGoogle] Usuario no encontrado en 'users', intentando en 'usuarios'`);
        // Si no existe, intentar con la colección 'usuarios' (estructura legacy)
        userDoc = await getDoc(doc(db, 'usuarios', result.user.uid));
      }
      
      if (!userDoc.exists()) {
        // Si el usuario no existe en ninguna colección, cerrar sesión inmediatamente
        await signOutSafe();
        throw new Error('Usuario no encontrado en la base de datos. Solo administradores pueden acceder a esta plataforma.');
      }

      const userData = userDoc.data();
      console.log(`[AuthService.loginWithGoogle] Usuario encontrado:`, {
        uid: userData.uid,
        email: userData.email,
        role: userData.role
      });
      
      // VALIDACIÓN CRÍTICA INMEDIATA: Solo administradores y guardias pueden acceder
      if (userData.role === 'resident') {
        console.log('🚫 ACCESO DENEGADO: Usuario residente detectado');
        console.log('Cerrando sesión inmediatamente...');
        
        // Cerrar sesión inmediatamente antes de que vea el dashboard
        await signOutSafe();
        
        throw new Error('Acceso denegado. Esta plataforma web es exclusiva para administradores. Los residentes deben usar la aplicación móvil de Zentry.');
      }
      
      // Solo llegar aquí si es admin o guard
      console.log('✅ Acceso permitido para usuario:', userData.role);
      
      return {
        user: result.user,
        userData: userData
      };
      
    } catch (error) {
      console.error('Error en loginWithGoogle:', error);
      throw error;
    }
  },

  /**
   * Inicia sesión con Apple
   */
  loginWithApple: async (): Promise<any> => {
    try {
      const provider = await createAppleProvider();
      const result = await signInWithPopupSafe(provider);
      
      // VERIFICACIÓN INMEDIATA: Obtener datos del usuario desde Firestore
      console.log(`[AuthService.loginWithApple] Buscando usuario ${result.user.uid} en Firestore`);
      
      // Intentar primero con la colección 'users' (nueva estructura)
      let userDoc = await getDoc(doc(db, 'usuarios', result.user.uid));
      
      if (!userDoc.exists()) {
        console.log(`[AuthService.loginWithApple] Usuario no encontrado en 'users', intentando en 'usuarios'`);
        // Si no existe, intentar con la colección 'usuarios' (estructura legacy)
        userDoc = await getDoc(doc(db, 'usuarios', result.user.uid));
      }
      
      if (!userDoc.exists()) {
        // Si el usuario no existe en ninguna colección, cerrar sesión inmediatamente
        await signOutSafe();
        throw new Error('Usuario no encontrado en la base de datos. Solo administradores pueden acceder a esta plataforma.');
      }

      const userData = userDoc.data();
      console.log(`[AuthService.loginWithApple] Usuario encontrado:`, {
        uid: userData.uid,
        email: userData.email,
        role: userData.role
      });
      
      // VALIDACIÓN CRÍTICA INMEDIATA: Solo administradores y guardias pueden acceder
      if (userData.role === 'resident') {
        console.log('🚫 ACCESO DENEGADO: Usuario residente detectado');
        console.log('Cerrando sesión inmediatamente...');
        
        // Cerrar sesión inmediatamente antes de que vea el dashboard
        await signOutSafe();
        
        throw new Error('Acceso denegado. Esta plataforma web es exclusiva para administradores. Los residentes deben usar la aplicación móvil de Zentry.');
      }
      
      // Solo llegar aquí si es admin o guard
      console.log('✅ Acceso permitido para usuario:', userData.role);
      
      return {
        user: result.user,
        userData: userData
      };
      
    } catch (error) {
      console.error('Error en loginWithApple:', error);
      throw error;
    }
  },

  /**
   * Obtiene información del usuario de Google para el proceso de registro
   * NO hace login completo, solo obtiene los datos
   */
  getGoogleUserInfo: async (): Promise<{ user: any; userData: any } | null> => {
    try {
      console.log('[DEBUG][getGoogleUserInfo] Iniciando flujo de autenticación con Google...');
      const provider = await createGoogleProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      let result;
      if (isLocalhost) {
        // En desarrollo local, intentar popup primero
        try {
          console.log('[DEBUG][getGoogleUserInfo] Intentando signInWithPopupSafe...');
          result = await signInWithPopupSafe(provider);
          console.log('[DEBUG][getGoogleUserInfo] Resultado de signInWithPopupSafe:', result);
        } catch (error: any) {
          console.error('[DEBUG][getGoogleUserInfo] Error en signInWithPopupSafe:', error);
          if (error?.code === 'auth/popup-closed-by-user') {
            console.warn('[DEBUG][getGoogleUserInfo] Popup cerrado por el usuario. No se lanzará excepción.');
            return null;
          }
          // Si falla el popup, fallback a redirect
          console.warn('[DEBUG][getGoogleUserInfo] Popup falló, usando redirect...');
          await signInWithRedirectSafe(provider);
          return null;
        }
      } else {
        // En producción/export, solo redirect
        console.log('[DEBUG][getGoogleUserInfo] Usando signInWithRedirectSafe (producción)...');
        await signInWithRedirectSafe(provider);
        return null;
      }
      // Si llegamos aquí, es porque el popup funcionó (solo en localhost)
      if (!result || !result.user) {
        console.warn('[DEBUG][getGoogleUserInfo] No se obtuvo usuario de Google. Result:', result);
        return null;
      }
      const googleUser = result.user;
      const displayName = googleUser.displayName || '';
      const email = googleUser.email || '';
      const photoURL = googleUser.photoURL || '';
      const nameParts = displayName.trim().split(' ');
      let firstName = '';
      let paternalLastName = '';
      let maternalLastName = '';
      if (nameParts.length >= 1) firstName = nameParts[0];
      if (nameParts.length >= 2) paternalLastName = nameParts[1];
      if (nameParts.length >= 3) {
        maternalLastName = nameParts[nameParts.length - 1];
        if (nameParts.length > 3) {
          paternalLastName = nameParts.slice(1, -1).join(' ');
        }
      }
      const userData = {
        firstName,
        paternalLastName,
        maternalLastName,
        email,
        method: 'google',
        fullName: displayName
      };
      const userInfo = {
        uid: googleUser.uid,
        email,
        displayName,
        photoURL
      };
      console.log('[DEBUG][getGoogleUserInfo] Datos procesados:', { user: userInfo, userData });
      return { user: userInfo, userData };
    } catch (error) {
      console.error('[DEBUG][getGoogleUserInfo] ERROR:', error);
      throw error;
    }
  },

  /**
   * Obtiene información del usuario de Apple para el proceso de registro
   * NO hace login completo, solo obtiene los datos
   */
  getAppleUserInfo: async (): Promise<{ user: any; userData: any }> => {
    try {
      const provider = await createAppleProvider();
      
      // Configurar el provider para usar popup (no redirect)
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopupSafe(provider);
      
      // Obtener información básica del usuario de Apple
      const appleUser = result.user;
      const displayName = appleUser.displayName || '';
      const email = appleUser.email || '';
      const photoURL = appleUser.photoURL || '';
      
      // Separar el nombre completo de manera más inteligente
      const nameParts = displayName.trim().split(' ');
      let firstName = '';
      let paternalLastName = '';
      let maternalLastName = '';
      
      if (nameParts.length >= 1) {
        firstName = nameParts[0];
      }
      if (nameParts.length >= 2) {
        paternalLastName = nameParts[1];
      }
      if (nameParts.length >= 3) {
        // Si hay 3 o más partes, el último es apellido materno
        maternalLastName = nameParts[nameParts.length - 1];
        // Si hay más de 3 partes, combinar las del medio con el paterno
        if (nameParts.length > 3) {
          paternalLastName = nameParts.slice(1, -1).join(' ');
        }
      }
      
      // Guardar los datos antes de cerrar sesión
      const userData = {
        firstName: firstName,
        paternalLastName: paternalLastName,
        maternalLastName: maternalLastName,
        email: email,
        method: 'apple',
        fullName: displayName
      };
      
      const userInfo = {
        uid: appleUser.uid,
        email: email,
        displayName: displayName,
        photoURL: photoURL
      };
      
      // Cerrar sesión de manera más suave
      setTimeout(async () => {
        try {
          await signOutSafe();
        } catch (e) {
          console.log('Sesión cerrada silenciosamente');
        }
      }, 100);
      
      return {
        user: userInfo,
        userData: userData
      };
      
    } catch (error) {
      console.error('Error al obtener información de Apple:', error);
      throw error;
    }
  }
};

export default AuthService; 