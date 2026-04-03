/**
 * Dashboard Cache Service
 * Caché especializado para queries del dashboard
 */

import { getCachedQuery } from './firebase-cache';
import { AdminService, DashboardService } from '@/lib/services';
import { collection, getDocs, query, where, limit as fbLimit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// TTL específicos para diferentes tipos de datos
const STATS_TTL = 2 * 60 * 1000; // 2 minutos para stats
const HEALTH_TTL = 5 * 60 * 1000; // 5 minutos para health
const INGRESOS_TTL = 1 * 60 * 1000; // 1 minuto para ingresos (más dinámico)

/**
 * Obtener estadísticas del sistema con caché
 */
export const getCachedSystemStats = async () => {
    return getCachedQuery(
        'system-stats',
        () => AdminService.getSystemStats(),
        STATS_TTL
    );
};

/**
 * Obtener salud del sistema con caché
 */
export const getCachedSystemHealth = async () => {
    return getCachedQuery(
        'system-health',
        () => DashboardService.getSystemHealth(),
        HEALTH_TTL
    );
};

/**
 * Obtener datos de residencial con caché
 */
export const getCachedResidencialData = async (residencialId: string) => {
    return getCachedQuery(
        `residencial-${residencialId}`,
        async () => {
            const residencialesRef = collection(db, 'residenciales');
            const qByCode = query(
                residencialesRef,
                where('residencialID', '==', residencialId),
                fbLimit(1)
            );
            const snapByCode = await getDocs(qByCode);

            if (!snapByCode.empty) {
                return {
                    id: snapByCode.docs[0].id,
                    data: snapByCode.docs[0].data()
                };
            }
            return null;
        },
        STATS_TTL
    );
};

/**
 * Obtener usuarios de residencial con caché
 */
export const getCachedResidencialUsers = async (residencialId: string, role?: string) => {
    const cacheKey = role
        ? `users-${residencialId}-${role}`
        : `users-${residencialId}`;

    return getCachedQuery(
        cacheKey,
        async () => {
            const usersRef = collection(db, 'usuarios');
            const constraints = [
                where('residencialID', '==', residencialId),
                fbLimit(500) // Límite de seguridad
            ];

            if (role) {
                constraints.push(where('role', '==', role));
            }

            const q = query(usersRef, ...constraints);
            const snap = await getDocs(q);

            return snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        },
        STATS_TTL
    );
};

/**
 * Obtener ingresos de residencial con caché
 */
export const getCachedIngresos = async (
    residencialDocId: string,
    startDate: Date,
    endDate?: Date
) => {
    const cacheKey = `ingresos-${residencialDocId}-${startDate.getTime()}`;

    return getCachedQuery(
        cacheKey,
        async () => {
            const ingresosRef = collection(db, 'residenciales', residencialDocId, 'ingresos');
            const constraints = [
                where('timestamp', '>=', startDate),
                orderBy('timestamp', 'desc'),
                fbLimit(1000) // Límite de seguridad
            ];

            if (endDate) {
                constraints.splice(1, 0, where('timestamp', '<=', endDate));
            }

            const q = query(ingresosRef, ...constraints);
            const snap = await getDocs(q);

            return snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        },
        INGRESOS_TTL
    );
};

/**
 * Obtener pases activos con caché
 */
export const getCachedActivePasses = async (residencialDocId: string) => {
    return getCachedQuery(
        `active-passes-${residencialDocId}`,
        async () => {
            const ingresosRef = collection(db, 'residenciales', residencialDocId, 'ingresos');
            const q = query(
                ingresosRef,
                where('status', '==', 'active'),
                fbLimit(100)
            );
            const snap = await getDocs(q);

            return snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        },
        INGRESOS_TTL
    );
};

/**
 * Obtener reservas pendientes con caché
 */
export const getCachedPendingReservations = async (residencialDocId: string) => {
    return getCachedQuery(
        `pending-reservations-${residencialDocId}`,
        async () => {
            const reservationsRef = collection(db, 'residenciales', residencialDocId, 'reservaciones');
            const q = query(
                reservationsRef,
                where('status', '==', 'pendiente'),
                fbLimit(100)
            );
            const snap = await getDocs(q);

            return snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        },
        STATS_TTL
    );
};
