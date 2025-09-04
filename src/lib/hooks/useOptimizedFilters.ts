import { useState, useMemo, useCallback } from 'react';
import { Usuario } from '@/lib/firebase/firestore';
import { debounce } from 'lodash';

interface FilterState {
  searchTerm: string;
  residencialId: string;
  role: string;
  status: string;
}

export const useOptimizedFilters = (
  allUsers: Usuario[],
  pendingUsers: Usuario[],
  activeTab: string,
  getResidencialIdFromUser: (user: Usuario) => string | null
) => {
  const [filterState, setFilterState] = useState<FilterState>({
    searchTerm: '',
    residencialId: 'todos',
    role: 'todos',
    status: 'todos'
  });

  const [typingSearchTerm, setTypingSearchTerm] = useState('');

  // Memoizar la función de filtrado
  const filteredUsers = useMemo(() => {
    let result = [...allUsers];

    // Filtrar por residencial
    if (filterState.residencialId !== 'todos') {
      result = result.filter(user => 
        getResidencialIdFromUser(user) === filterState.residencialId
      );
    }

    // Filtrar por rol
    if (filterState.role !== 'todos') {
      result = result.filter(user => user.role === filterState.role);
    }

    // Filtrar por estado
    if (filterState.status !== 'todos') {
      result = result.filter(user => user.status === filterState.status);
    }

    // Filtrar por término de búsqueda
    if (filterState.searchTerm) {
      const searchLower = filterState.searchTerm.toLowerCase();
      result = result.filter(user => 
        user.fullName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.telefono?.toLowerCase().includes(searchLower) ||
        user.houseID?.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar según la pestaña activa
    switch (activeTab) {
      case 'residentes':
        return result.filter(u => u.role === 'resident' && u.status === 'approved');
      case 'seguridad':
        return result.filter(u => u.role === 'security' && u.status === 'approved');
      case 'administradores':
        return result.filter(u => u.role === 'admin' && u.status === 'approved');
      case 'invitados':
        return result.filter(u => u.role === 'guest' && u.status === 'approved');
      case 'pendientes':
        return pendingUsers;
      default:
        return result;
    }
  }, [allUsers, pendingUsers, filterState, activeTab, getResidencialIdFromUser]);

  // Debounce para la búsqueda
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setFilterState(prev => ({ ...prev, searchTerm: term }));
    }, 300),
    []
  );

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTypingSearchTerm(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilterState(prev => ({ ...prev, [key]: value }));
  }, []);

  // Limpiar el debounce al desmontar
  const cleanup = useCallback(() => {
    debouncedSearch.cancel();
  }, [debouncedSearch]);

  return {
    filteredUsers,
    filterState,
    typingSearchTerm,
    handleSearchChange,
    handleFilterChange,
    cleanup
  };
}; 