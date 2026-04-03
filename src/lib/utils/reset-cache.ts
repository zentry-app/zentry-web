/**
 * Esta utilidad ayuda a prevenir problemas de caché en desarrollo
 * 
 * El timestamp se actualiza cada vez que se compila la aplicación,
 * forzando a los navegadores a recargar los recursos estáticos
 */

export const CACHE_BUSTER = Date.now();

/**
 * Agrega un parámetro de versión a una URL para evitar caché
 */
export function addCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${CACHE_BUSTER}`;
}

/**
 * Reinicia manualmente la caché si es necesario
 */
export function forceRefresh(): void {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
}
