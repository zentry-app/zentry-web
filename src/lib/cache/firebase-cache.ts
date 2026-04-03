/**
 * Firebase Cache Service
 * Implementa caché en memoria y sessionStorage para queries de Firebase
 * Reduce tiempo de carga de 2.5s+ a <500ms
 */

import { UserModel } from "@/types/models";
import { getDocs, collection, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// Configuración de caché
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const SESSION_STORAGE_PREFIX = "zentry_cache_";

// Caché en memoria para datos de usuario
const userDataCache = new Map<string, { data: UserModel; timestamp: number }>();

// Caché en memoria para queries generales
const queryCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Obtener datos de usuario con caché
 */
export const getCachedUserData = async (
  uid: string,
  fetchFn: () => Promise<UserModel | null>,
): Promise<UserModel | null> => {
  // 1. Verificar caché en memoria
  const cached = userDataCache.get(uid);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("[Cache] User data from memory cache:", uid);
    return cached.data;
  }

  // 2. Verificar sessionStorage
  const sessionKey = `${SESSION_STORAGE_PREFIX}user_${uid}`;
  try {
    const sessionData = sessionStorage.getItem(sessionKey);
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        console.log("[Cache] User data from sessionStorage:", uid);
        userDataCache.set(uid, {
          data: parsed.data,
          timestamp: parsed.timestamp,
        });
        return parsed.data;
      }
    }
  } catch (error) {
    console.warn("[Cache] Error reading from sessionStorage:", error);
  }

  // 3. Fetch de Firebase
  console.log("[Cache] Fetching user data from Firebase:", uid);
  const userData = await fetchFn();

  if (userData) {
    const cacheEntry = { data: userData, timestamp: Date.now() };

    // Guardar en memoria
    userDataCache.set(uid, cacheEntry);

    // Guardar en sessionStorage
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn("[Cache] Error writing to sessionStorage:", error);
    }
  }

  return userData;
};

/**
 * Obtener datos de query con caché
 */
export const getCachedQuery = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL,
): Promise<T> => {
  // 1. Verificar caché en memoria
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    console.log("[Cache] Query data from memory cache:", key);
    return cached.data as T;
  }

  // 2. Verificar sessionStorage
  const sessionKey = `${SESSION_STORAGE_PREFIX}query_${key}`;
  try {
    const sessionData = sessionStorage.getItem(sessionKey);
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      if (Date.now() - parsed.timestamp < ttl) {
        console.log("[Cache] Query data from sessionStorage:", key);
        queryCache.set(key, { data: parsed.data, timestamp: parsed.timestamp });
        return parsed.data as T;
      }
    }
  } catch (error) {
    console.warn("[Cache] Error reading from sessionStorage:", error);
  }

  // 3. Fetch de Firebase
  console.log("[Cache] Fetching query data from Firebase:", key);
  const data = await fetchFn();

  const cacheEntry = { data, timestamp: Date.now() };

  // Guardar en memoria
  queryCache.set(key, cacheEntry);

  // Guardar en sessionStorage
  try {
    sessionStorage.setItem(sessionKey, JSON.stringify(cacheEntry));
  } catch (error) {
    console.warn("[Cache] Error writing to sessionStorage:", error);
  }

  return data;
};

/**
 * Invalidar caché de usuario
 */
export const invalidateUserCache = (uid: string) => {
  userDataCache.delete(uid);
  const sessionKey = `${SESSION_STORAGE_PREFIX}user_${uid}`;
  try {
    sessionStorage.removeItem(sessionKey);
  } catch (error) {
    console.warn("[Cache] Error removing from sessionStorage:", error);
  }
  console.log("[Cache] Invalidated user cache:", uid);
};

/**
 * Invalidar caché de query
 */
export const invalidateQueryCache = (key: string) => {
  queryCache.delete(key);
  const sessionKey = `${SESSION_STORAGE_PREFIX}query_${key}`;
  try {
    sessionStorage.removeItem(sessionKey);
  } catch (error) {
    console.warn("[Cache] Error removing from sessionStorage:", error);
  }
  console.log("[Cache] Invalidated query cache:", key);
};

/**
 * Limpiar todo el caché
 */
export const clearAllCache = () => {
  userDataCache.clear();
  queryCache.clear();

  // Limpiar sessionStorage
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach((key) => {
      if (key.startsWith(SESSION_STORAGE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn("[Cache] Error clearing sessionStorage:", error);
  }

  console.log("[Cache] Cleared all cache");
};

/**
 * Obtener estadísticas del caché
 */
export const getCacheStats = () => {
  return {
    userDataCacheSize: userDataCache.size,
    queryCacheSize: queryCache.size,
    totalCacheSize: userDataCache.size + queryCache.size,
  };
};

// Cached residenciales list — avoids 7+ full collection reads per admin session
let residencialesCache: {
  docs: QueryDocumentSnapshot[];
  timestamp: number;
} | null = null;
const RESIDENCIALES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedResidenciales(): Promise<
  QueryDocumentSnapshot[]
> {
  if (
    residencialesCache &&
    Date.now() - residencialesCache.timestamp < RESIDENCIALES_CACHE_TTL
  ) {
    return residencialesCache.docs;
  }
  const snap = await getDocs(collection(db, "residenciales"));
  residencialesCache = { docs: snap.docs, timestamp: Date.now() };
  return snap.docs;
}

export function invalidateResidencialesCache(): void {
  residencialesCache = null;
}
