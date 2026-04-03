import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/models';
import { AuthorizationService } from '@/lib/services';
import { toast } from 'sonner';

/**
 * Hook que verifica si el usuario tiene rol de administrador
 * y redirige al dashboard si no lo tiene
 */
export function useAdminRequired(requireGlobalAdmin: boolean = false) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Esperar a que la autenticación termine de cargar
    if (!loading) {
      // Si no hay usuario o datos de usuario, redirigir al login
      if (!user || !userData) {
        console.log('No hay usuario autenticado, redirigiendo a login');
        toast.error('Debes iniciar sesión para acceder a esta página');
        router.push('/login');
        return;
      }
      
      // Si el usuario no es administrador, redirigir al login
      if (userData.role !== UserRole.Admin) {
        console.log('Usuario no es administrador, redirigiendo a login');
        toast.error('Acceso denegado. Esta sección es solo para administradores.');
        router.push('/dashboard');
        return;
      }
      
      // Si se requiere admin global, verificar que lo sea
      if (requireGlobalAdmin && !AuthorizationService.isGlobalAdmin(userData)) {
        console.log('Usuario no es administrador global, redirigiendo a login');
        toast.error('Acceso denegado. Esta sección es solo para administradores globales.');
        router.push('/dashboard');
        return;
      }
    }
  }, [user, userData, loading, router, requireGlobalAdmin]);
  
  return { 
    isAdmin: userData?.role === UserRole.Admin, 
    isGlobalAdmin: userData ? AuthorizationService.isGlobalAdmin(userData) : false,
    isUserLoading: loading 
  };
}

export default useAdminRequired; 