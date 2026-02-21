import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Importaciones opcionales para servicios de cliente
let getMessaging: any;
let getAnalytics: any;
let isSupportedMessaging: any;
let isSupportedAnalytics: any;

if (typeof window !== 'undefined') {
  try {
    const messagingModule = require('firebase/messaging');
    getMessaging = messagingModule.getMessaging;
    isSupportedMessaging = messagingModule.isSupported;
  } catch (e) {
    // Messaging module not found or failed to load
  }

  try {
    const analyticsModule = require('firebase/analytics');
    getAnalytics = analyticsModule.getAnalytics;
    isSupportedAnalytics = analyticsModule.isSupported;
  } catch (e) {
    // Analytics module not found
  }
}

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: "G-DK611Z8182"
};

console.log('=== CONFIGURACIÓN DE FIREBASE ===');
console.log('Project ID:', firebaseConfig.projectId);
console.log('API Key:', firebaseConfig.apiKey);
console.log('Auth Domain:', firebaseConfig.authDomain);

// Inicializar Firebase
let app: any;

// Verificar configuración crítica
if (!firebaseConfig.apiKey) {
  console.error('[Firebase Config] CRITICAL: Missing API Key. Check your environment variables (NEXT_PUBLIC_FIREBASE_API_KEY).');
  // En producción, esto debería fallar para evitar comportamiento indefinido
  if (process.env.NODE_ENV === 'production') {
    console.error('[Firebase Config] Running in production without API Key. App will likely crash.');
  }
}

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
} catch (error) {
  console.error('[Firebase Config] Error initializing app:', error);
  // Re-lanzar para que Next.js capture el error 500 si es crítico
  throw error;
}

// Inicializar servicios principales
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = (typeof window !== 'undefined') ? getStorage(app) : null;

// Inicializar Analytics con delay y chequeo de soporte
let analytics: any = null;
if (typeof window !== 'undefined' && getAnalytics && isSupportedAnalytics) {
  isSupportedAnalytics().then((supported: boolean) => {
    if (supported) {
      setTimeout(() => {
        try {
          analytics = getAnalytics(app);
        } catch (e: any) {
          // "Component analytics has not been registered yet" es común al cargar; no loguear
          if (!e?.message?.includes('not been registered')) {
            console.warn('[Firebase Config] Error al inicializar Analytics:', e);
          }
        }
      }, 2000);
    }
  }).catch(() => {
    // Silently fail if check fails
  });
}

// Inicializar Messaging con delay y chequeo de soporte
let messaging: any = null;
if (typeof window !== 'undefined' && getMessaging && isSupportedMessaging) {
  isSupportedMessaging().then((supported: boolean) => {
    if (supported) {
      setTimeout(() => {
        try {
          messaging = getMessaging(app);
        } catch (e: any) {
          // No loguear si es navegador no soportado o servicio no disponible (común en dev)
          const msg = e?.message ?? '';
          const code = e?.code ?? '';
          if (code !== 'messaging/unsupported-browser' && !msg.includes('not available')) {
            console.warn('[Firebase Config] Messaging no disponible:', e);
          }
        }
      }, 3000);
    }
  }).catch(() => {
    // Silently fail if check fails (common in Brave/Firefox privacy mode)
  });
}

console.log('[Firebase Config] Inicialización completada');

// Exportar servicios
export { app, db, storage, functions };

// Exportación legacy para compatibilidad con archivos existentes
export const auth = {
  get currentUser() {
    // Esta es una implementación simplificada para compatibilidad
    // En archivos nuevos, usar getAuthSafe() directamente
    return null;
  }
};

// Para nuevos archivos, usar esta función async
export async function getAuthSafe() {
  if (typeof window === 'undefined') return null;
  try {
    const mod = await import('firebase/auth') as any;
    const getAuth = mod.getAuth || mod.default?.getAuth;
    return getAuth ? getAuth(app) : null;
  } catch (e) {
    return null;
  }
}

// Funciones de utilidad para operaciones de Auth
export async function signInWithEmailAndPasswordSafe(email: string, password: string) {
  if (typeof window === 'undefined') throw new Error('Auth solo disponible en el cliente');
  try {
    const mod = await import('firebase/auth') as any;
    const auth = await getAuthSafe();
    if (!auth) throw new Error('Firebase Auth no disponible');
    return await mod.signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    throw e;
  }
}

export async function createUserWithEmailAndPasswordSafe(email: string, password: string) {
  if (typeof window === 'undefined') throw new Error('Auth solo disponible en el cliente');
  try {
    const mod = await import('firebase/auth') as any;
    const auth = await getAuthSafe();
    if (!auth) throw new Error('Firebase Auth no disponible');
    return await mod.createUserWithEmailAndPassword(auth, email, password);
  } catch (e) {
    throw e;
  }
}

export async function signOutSafe() {
  if (typeof window === 'undefined') throw new Error('Auth solo disponible en el cliente');
  try {
    const mod = await import('firebase/auth') as any;
    const auth = await getAuthSafe();
    if (!auth) throw new Error('Firebase Auth no está disponible');
    return await mod.signOut(auth);
  } catch (e) {
    console.error('Error en signOutSafe:', e);
    throw e;
  }
}

export async function sendPasswordResetEmailSafe(email: string) {
  if (typeof window === 'undefined') throw new Error('Auth solo disponible en el cliente');
  try {
    const mod = await import('firebase/auth') as any;
    const auth = await getAuthSafe();
    if (!auth) throw new Error('Firebase Auth no disponible');
    return await mod.sendPasswordResetEmail(auth, email);
  } catch (e) {
    throw e;
  }
}

export async function signInWithPopupSafe(provider: any) {
  if (typeof window === 'undefined') throw new Error('Auth solo disponible en el cliente');
  try {
    const mod = await import('firebase/auth') as any;
    const auth = await getAuthSafe();
    if (!auth) throw new Error('Firebase Auth no disponible');
    return await mod.signInWithPopup(auth, provider);
  } catch (e) {
    throw e;
  }
}

export async function createGoogleProvider() {
  if (typeof window === 'undefined') throw new Error('Auth solo disponible en el cliente');
  try {
    const mod = await import('firebase/auth') as any;
    const provider = new mod.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    return provider;
  } catch (e) {
    throw e;
  }
}

export async function createAppleProvider() {
  if (typeof window === 'undefined') throw new Error('Auth solo disponible en el cliente');
  try {
    const mod = await import('firebase/auth') as any;
    const provider = new mod.OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    return provider;
  } catch (e) {
    throw e;
  }
}

export async function onAuthStateChangedSafe(callback: (user: any) => void) {
  if (typeof window === 'undefined') return () => { };
  try {
    const mod = await import('firebase/auth') as any;
    const auth = await getAuthSafe();
    if (!auth) return () => { };
    return mod.onAuthStateChanged(auth, callback);
  } catch (e) {
    return () => { };
  }
}

export async function updateProfileSafe(user: any, profile: { displayName?: string; photoURL?: string }) {
  if (typeof window === 'undefined') throw new Error('Auth solo disponible en el cliente');
  try {
    const mod = await import('firebase/auth') as any;
    return await mod.updateProfile(user, profile);
  } catch (e) {
    throw e;
  }
}

export async function signInWithRedirectSafe(provider: any) {
  if (typeof window === 'undefined') throw new Error('Auth solo disponible en el cliente');
  try {
    const mod = await import('firebase/auth') as any;
    const auth = await getAuthSafe();
    if (!auth) throw new Error('Firebase Auth no disponible');
    return await mod.signInWithRedirect(auth, provider);
  } catch (e) {
    throw e;
  }
}

export async function getRedirectResultSafe() {
  if (typeof window === 'undefined') return null;
  try {
    const mod = await import('firebase/auth') as any;
    const auth = await getAuthSafe();
    if (!auth) return null;
    return await mod.getRedirectResult(auth);
  } catch (e) {
    return null;
  }
} 