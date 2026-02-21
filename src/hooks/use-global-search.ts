import { useState, useEffect, useCallback, useRef } from 'react';
import { GlobalSearchService } from '@/lib/services/global-search-service';
import { SearchResponse } from '@/types/search';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook personalizado para búsqueda global con debounce
 */
export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { userClaims } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Función de búsqueda con debounce
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await GlobalSearchService.search(searchQuery, {
        residencialId: userClaims?.residencialId
      });
      setResults(response);
    } catch (error) {
      console.error('Error performing search:', error);
      setResults(null);
    } finally {
      setIsSearching(false);
    }
  }, [userClaims]);

  // Effect para manejar el debounce
  useEffect(() => {
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Si la query está vacía, limpiar resultados inmediatamente
    if (!query || query.length < 2) {
      setResults(null);
      setIsSearching(false);
      return;
    }

    // Configurar nuevo timeout para debounce (300ms)
    setIsSearching(true);
    timeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, performSearch]);

  // Función para limpiar búsqueda
  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    setIsSearching(false);
    setIsOpen(false);
  }, []);

  // Función para actualizar query
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    if (newQuery.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, []);

  return {
    query,
    setQuery: updateQuery,
    results,
    isSearching,
    isOpen,
    setIsOpen,
    clearSearch
  };
}
