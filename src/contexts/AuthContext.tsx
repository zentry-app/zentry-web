"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChangedSafe, getRedirectResultSafe } from '@/lib/firebase/config';
import { AuthService } from '@/lib/services/auth-service';
import { UserModel, UserRole } from '@/types/models';
import { toast } from 'sonner';
import RateLimitService from '@/lib/services/rate-limit-service';
import EmailService from '@/lib/services/email-service';
import StorageService from '@/lib/services/storage-service';
import RegistrationResidentialService from '@/lib/services/registration-residential-service';
import { RegistrationData } from '@/components/auth/MultiStepRegisterForm';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface UserClaims {
  role: UserRole;
  residencialId: string;
  isGlobalAdmin: boolean;
  isResidencialAdmin?: boolean;
  managedResidencialId?: string;
  managedResidencials: string[];
}

interface AuthContextType {
  user: any | null;
  userData: UserModel | null;
  userClaims: UserClaims | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  loginWithApple: () => Promise<any>;
  getGoogleUserInfo: () => Promise<any>;
  getAppleUserInfo: () => Promise<any>;
  logout: () => Promise<void>;
  registerUser: (userData: any) => Promise<void>;
  setUser: (user: any | null) => void; // Agregar setUser al contexto
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [userData, setUserData] = useState<UserModel | null>(null);
  const [userClaims, setUserClaims] = useState<UserClaims | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        // Intentar obtener el resultado de un redirect de Google (o Apple) al cargar la app
        const redirectResult = await getRedirectResultSafe();
        if (redirectResult && redirectResult.user) {
          console.error('[AuthContext] Usuario autenticado por redirect:', redirectResult.user);
          setUser(redirectResult.user);
          // Obtener datos del usuario desde Firestore
          try {
            const userData = await AuthService.getUserData(redirectResult.user.uid);
            if (userData) {
              setUserData(userData);
              setUserClaims({
                role: userData.role,
                residencialId: userData.residencialId,
                isGlobalAdmin: userData.isGlobalAdmin || false,
                managedResidencials: userData.managedResidencials || []
              });
            }
          } catch (error) {
            console.error('[AuthContext] Error al obtener datos del usuario tras redirect:', error);
          }
          setLoading(false);
          return;
        }
        unsubscribe = await onAuthStateChangedSafe(async (currentUser: any) => {
      console.log(`[AuthContext] Auth state change detected. User: ${currentUser?.uid || 'none'}`);
      
      if (currentUser) {
            setUser(currentUser);
            
            // Obtener datos del usuario desde Firestore
            try {
              const userData = await AuthService.getUserData(currentUser.uid);
              if (userData) {
                setUserData(userData);
                
                // Determinar si es administrador de residencial
                const isGlobalAdmin = userData.isGlobalAdmin || false;
                const isResidencialAdmin = userData.role === UserRole.Admin && 
                                         !isGlobalAdmin && 
                                         userData.residencialId && 
                                         userData.residencialId.trim() !== '';
                
                setUserClaims({
                  role: userData.role,
                  residencialId: userData.residencialId,
                  isGlobalAdmin,
                  isResidencialAdmin,
                  managedResidencialId: isResidencialAdmin ? userData.residencialId : undefined,
                  managedResidencials: userData.managedResidencials || []
                });
                
                console.log('[AuthContext] UserClaims configurados:', {
                  role: userData.role,
                  isGlobalAdmin,
                  isResidencialAdmin,
                  residencialId: userData.residencialId,
                  managedResidencialId: isResidencialAdmin ? userData.residencialId : undefined
                });
              }
            } catch (error) {
              console.error('[AuthContext] Error al obtener datos del usuario:', error);
            }
          } else {
            setUser(null);
            setUserData(null);
            setUserClaims(null);
          }
          
          setLoading(false);
        });
      } catch (error) {
        console.error('[AuthContext] Error al inicializar auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Efecto adicional para forzar redirección si el usuario está autenticado pero en página de login
  useEffect(() => {
    if (!loading && user && userData && userClaims) {
      const currentPath = window.location.pathname;
      
      // VALIDACIÓN CRÍTICA: Solo administradores y guardias pueden acceder a la plataforma web
      if (userData.role === UserRole.Resident) {
        console.log(`[AuthContext] 🚫 ACCESO DENEGADO: Usuario residente intentando acceder a plataforma web`);
        // Si está en la página de registro, NO redirigir, dejar que el registro muestre instrucciones personalizadas
        if (currentPath.startsWith('/register')) {
          // Aquí podrías setear un estado global o emitir un evento para que el registro muestre el modal adecuado
          // Por ahora, simplemente no redirigimos
          return;
        }
        // Si está en cualquier otra ruta, sí redirigir
        console.log(`[AuthContext] Redirigiendo usuario residente a página de acceso denegado`);
        router.push('/access-denied');
        return;
      }
      
      // Solo permitir admin y guard en la plataforma web
      if (userData.role !== UserRole.Admin && userData.role !== UserRole.Guard) {
        console.log(`[AuthContext] 🚫 ACCESO DENEGADO: Rol no autorizado (${userData.role}) para plataforma web`);
        router.push('/access-denied');
        return;
      }
      
      // Redirección para usuarios autorizados
      if (currentPath === '/login' || currentPath === '/login/' || currentPath === '/register' || currentPath === '/register/') {
        console.log(`[AuthContext] Usuario autorizado (${userData.role}) redirigiendo desde ${currentPath}`);
        const redirectTo = userData.role === UserRole.Guard ? '/dashboard/ingresos' : '/dashboard';
        console.log(`[AuthContext] Redirigiendo a ${redirectTo}...`);
        router.push(redirectTo);
      }
    }
  }, [loading, user, userData, userClaims, router]);

  const loginWithEmail = async (email: string, password: string) => {
    try {
      return await AuthService.loginWithEmail(email, password);
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      return await AuthService.loginWithGoogle();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const loginWithApple = async () => {
    try {
      return await AuthService.loginWithApple();
    } catch (error) {
      console.error('Error al iniciar sesión con Apple:', error);
      throw error;
    }
  };

  const getGoogleUserInfo = async () => {
    try {
      return await AuthService.getGoogleUserInfo();
    } catch (error) {
      console.error('Error getting Google user info:', error);
      throw error;
    }
  };

  const getAppleUserInfo = async () => {
    try {
      return await AuthService.getAppleUserInfo();
    } catch (error) {
      console.error('Error getting Apple user info:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };

  const registerUser = async (userData: any) => {
    try {
      await AuthService.registerUser(userData);
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userData,
    userClaims,
    loading,
    loginWithEmail,
    loginWithGoogle,
    loginWithApple,
    getGoogleUserInfo,
    getAppleUserInfo,
    logout,
    registerUser,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
