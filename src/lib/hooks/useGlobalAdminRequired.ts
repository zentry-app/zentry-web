import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserClaims } from '@/contexts/AuthContext'; // Asegúrate que UserClaims se exporte
import { toast } from 'sonner';

/**
 * Hook que verifica si el usuario tiene el claim 'isGlobalAdmin'.
 * Redirige si el usuario no es un administrador global o no está autenticado.
 */
export function useGlobalAdminRequired() {
  const { user, userClaims, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Si no hay usuario de Firebase, ya debería ser manejado por AuthContext para redirigir a login
        // Pero podemos añadir una capa extra por si acaso o si el flujo cambia.
        console.log('[useGlobalAdminRequired] No hay usuario autenticado, esperando redirección de AuthContext o redirigiendo a /login.');
        // router.push('/login'); // AuthContext debería manejar esto.
        return;
      }

      if (!userClaims || userClaims.isGlobalAdmin !== true) {
        console.log('[useGlobalAdminRequired] Usuario no es Administrador Global. Claims:', userClaims);
        toast.error('Acceso denegado. Esta sección es solo para Administradores Globales.');
        router.push('/dashboard'); // Redirige a una página segura por defecto para no globales
      }
    }
  }, [user, userClaims, authLoading, router]);

  return {
    isGlobalAdminAllowed: userClaims?.isGlobalAdmin === true,
    isGlobalAdminLoading: authLoading,
  };
}

export default useGlobalAdminRequired; 