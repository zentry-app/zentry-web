import { useState, useEffect, useCallback } from 'react';
import { Usuario, Residencial, suscribirseAUsuarios, suscribirseAUsuariosPendientes, suscribirseAResidenciales } from '@/lib/firebase/firestore';

export const useOptimizedSubscriptions = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuariosPendientes, setUsuariosPendientes] = useState<Usuario[]>([]);
  const [residenciales, setResidenciales] = useState<Residencial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const unsubscribers: (() => void)[] = [];
    let retryTimeouts: NodeJS.Timeout[] = [];

    const setupSubscription = async () => {
      try {
        // Limpiar suscripciones y timeouts anteriores
        unsubscribers.forEach(unsub => unsub());
        retryTimeouts.forEach(timeout => clearTimeout(timeout));
        unsubscribers.length = 0;
        retryTimeouts.length = 0;

        // Suscripción a usuarios
        const unsubUsers = suscribirseAUsuarios((nuevosUsuarios) => {
          if (isMounted) {
            setUsuarios(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(nuevosUsuarios)) {
                setLastUpdate(new Date());
                return nuevosUsuarios;
              }
              return prev;
            });
          }
        });
        unsubscribers.push(unsubUsers);

        // Esperar antes de la siguiente suscripción
        await new Promise(resolve => setTimeout(resolve, 500));

        // Suscripción a usuarios pendientes
        const unsubPending = suscribirseAUsuariosPendientes((nuevosPendientes) => {
          if (isMounted) {
            setUsuariosPendientes(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(nuevosPendientes)) {
                setLastUpdate(new Date());
                return nuevosPendientes;
              }
              return prev;
            });
          }
        });
        unsubscribers.push(unsubPending);

        // Esperar antes de la última suscripción
        await new Promise(resolve => setTimeout(resolve, 500));

        // Suscripción a residenciales
        const unsubResidenciales = suscribirseAResidenciales((nuevosResidenciales) => {
          if (isMounted) {
            setResidenciales(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(nuevosResidenciales)) {
                setLastUpdate(new Date());
                return nuevosResidenciales;
              }
              return prev;
            });
          }
        });
        unsubscribers.push(unsubResidenciales);

        if (isMounted) {
          setIsLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error('Error en las suscripciones:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido');
          setIsLoading(false);
          
          // Reintentar después de un error
          const retryTimeout = setTimeout(() => {
            if (isMounted) {
              setupSubscription();
            }
          }, 5000);
          retryTimeouts.push(retryTimeout);
        }
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      unsubscribers.forEach(unsub => unsub());
      retryTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  return {
    usuarios,
    usuariosPendientes,
    residenciales,
    isLoading,
    lastUpdate,
    error
  };
}; 