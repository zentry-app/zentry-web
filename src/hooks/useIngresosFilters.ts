import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { debounce } from 'lodash';
import { Ingreso } from '@/types/ingresos';
import { startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';

export interface IngresosFilters {
  searchText: string;
  placa: string;
  category: string;
  status: string;
  residencialId: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  sortBy: 'timestamp' | 'exitTimestamp' | 'category' | 'status';
  sortOrder: 'asc' | 'desc';
  pageSize: number;
  currentPage: number;
}

const defaultFilters: IngresosFilters = {
  searchText: '',
  placa: '',
  category: 'all',
  status: 'all',
  residencialId: 'all',
  dateFrom: null,
  dateTo: null,
  sortBy: 'timestamp',
  sortOrder: 'desc',
  pageSize: 50,
  currentPage: 1,
};

export const useIngresosFilters = (ingresos: Ingreso[]) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<IngresosFilters>(defaultFilters);
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [debouncedPlaca, setDebouncedPlaca] = useState('');

  // Debounced search functions
  const debouncedSetSearchText = useMemo(
    () => debounce((text: string) => setDebouncedSearchText(text), 300),
    []
  );

  const debouncedSetPlaca = useMemo(
    () => debounce((placa: string) => setDebouncedPlaca(placa), 300),
    []
  );

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters: Partial<IngresosFilters> = {};
    
    if (searchParams.get('search')) urlFilters.searchText = searchParams.get('search')!;
    if (searchParams.get('placa')) urlFilters.placa = searchParams.get('placa')!;
    if (searchParams.get('category')) urlFilters.category = searchParams.get('category')!;
    if (searchParams.get('status')) urlFilters.status = searchParams.get('status')!;
    if (searchParams.get('residencial')) urlFilters.residencialId = searchParams.get('residencial')!;
    if (searchParams.get('sortBy')) urlFilters.sortBy = searchParams.get('sortBy') as any;
    if (searchParams.get('sortOrder')) urlFilters.sortOrder = searchParams.get('sortOrder') as any;
    if (searchParams.get('pageSize')) urlFilters.pageSize = parseInt(searchParams.get('pageSize')!);
    if (searchParams.get('page')) urlFilters.currentPage = parseInt(searchParams.get('page')!);
    
    if (searchParams.get('dateFrom')) {
      try {
        urlFilters.dateFrom = parseISO(searchParams.get('dateFrom')!);
      } catch (e) {
        console.warn('Invalid dateFrom in URL');
      }
    }
    
    if (searchParams.get('dateTo')) {
      try {
        urlFilters.dateTo = parseISO(searchParams.get('dateTo')!);
      } catch (e) {
        console.warn('Invalid dateTo in URL');
      }
    }

    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }));
    }
  }, [searchParams]);

  // Update debounced values when filters change
  useEffect(() => {
    debouncedSetSearchText(filters.searchText);
  }, [filters.searchText, debouncedSetSearchText]);

  useEffect(() => {
    debouncedSetPlaca(filters.placa);
  }, [filters.placa, debouncedSetPlaca]);

  // Update URL when filters change
  const updateURL = useCallback((newFilters: IngresosFilters) => {
    const params = new URLSearchParams();
    
    if (newFilters.searchText) params.set('search', newFilters.searchText);
    if (newFilters.placa) params.set('placa', newFilters.placa);
    if (newFilters.category !== 'all') params.set('category', newFilters.category);
    if (newFilters.status !== 'all') params.set('status', newFilters.status);
    if (newFilters.residencialId !== 'all') params.set('residencial', newFilters.residencialId);
    if (newFilters.dateFrom) params.set('dateFrom', newFilters.dateFrom.toISOString());
    if (newFilters.dateTo) params.set('dateTo', newFilters.dateTo.toISOString());
    if (newFilters.sortBy !== 'timestamp') params.set('sortBy', newFilters.sortBy);
    if (newFilters.sortOrder !== 'desc') params.set('sortOrder', newFilters.sortOrder);
    if (newFilters.pageSize !== 50) params.set('pageSize', newFilters.pageSize.toString());
    if (newFilters.currentPage !== 1) params.set('page', newFilters.currentPage.toString());

    const newURL = `${window.location.pathname}?${params.toString()}`;
    router.replace(newURL, { scroll: false });
  }, [router]);

  // Filter and sort ingresos
  const filteredIngresos = useMemo(() => {
    let filtered = [...ingresos];

    // Text search (name, address, etc.)
    if (debouncedSearchText) {
      const searchLower = debouncedSearchText.toLowerCase();
      filtered = filtered.filter(ingreso => {
        const visitanteName = ingreso.visitData?.name?.toLowerCase() || '';
        const address = `${ingreso.domicilio.calle} ${ingreso.domicilio.houseNumber}`.toLowerCase();
        const residencialName = ingreso._residencialNombre?.toLowerCase() || '';
        const codigoAcceso = ingreso.codigoAcceso?.toLowerCase() || '';
        
        return visitanteName.includes(searchLower) ||
               address.includes(searchLower) ||
               residencialName.includes(searchLower) ||
               codigoAcceso.includes(searchLower);
      });
    }

    // Placa search
    if (debouncedPlaca) {
      const placaLower = debouncedPlaca.toLowerCase();
      filtered = filtered.filter(ingreso => 
        ingreso.vehicleInfo?.placa?.toLowerCase().includes(placaLower)
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(ingreso => ingreso.category === filters.category);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(ingreso => ingreso.status === filters.status);
    }

    // Residencial filter
    if (filters.residencialId !== 'all') {
      filtered = filtered.filter(ingreso => ingreso._residencialDocId === filters.residencialId);
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(ingreso => {
        const ingresoDate = new Date(
          typeof ingreso.timestamp === 'string' 
            ? ingreso.timestamp 
            : ingreso.timestamp.seconds 
              ? ingreso.timestamp.seconds * 1000 
              : ingreso.timestamp
        );

        if (filters.dateFrom && filters.dateTo) {
          return isWithinInterval(ingresoDate, {
            start: startOfDay(filters.dateFrom),
            end: endOfDay(filters.dateTo)
          });
        } else if (filters.dateFrom) {
          return ingresoDate >= startOfDay(filters.dateFrom);
        } else if (filters.dateTo) {
          return ingresoDate <= endOfDay(filters.dateTo);
        }
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case 'timestamp':
          aValue = new Date(typeof a.timestamp === 'string' ? a.timestamp : a.timestamp.seconds ? a.timestamp.seconds * 1000 : a.timestamp);
          bValue = new Date(typeof b.timestamp === 'string' ? b.timestamp : b.timestamp.seconds ? b.timestamp.seconds * 1000 : b.timestamp);
          break;
        case 'exitTimestamp':
          aValue = a.exitTimestamp ? new Date(typeof a.exitTimestamp === 'string' ? a.exitTimestamp : a.exitTimestamp.seconds ? a.exitTimestamp.seconds * 1000 : a.exitTimestamp) : new Date(0);
          bValue = b.exitTimestamp ? new Date(typeof b.exitTimestamp === 'string' ? b.exitTimestamp : b.exitTimestamp.seconds ? b.exitTimestamp.seconds * 1000 : b.exitTimestamp) : new Date(0);
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [ingresos, debouncedSearchText, debouncedPlaca, filters]);

  // Paginated results
  const paginatedIngresos = useMemo(() => {
    const startIndex = (filters.currentPage - 1) * filters.pageSize;
    const endIndex = startIndex + filters.pageSize;
    return filteredIngresos.slice(startIndex, endIndex);
  }, [filteredIngresos, filters.currentPage, filters.pageSize]);

  // Update filters function
  const updateFilters = useCallback((newFilters: Partial<IngresosFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    
    // Reset page when filters change (except when changing page itself)
    if (!('currentPage' in newFilters)) {
      updatedFilters.currentPage = 1;
    }
    
    setFilters(updatedFilters);
    updateURL(updatedFilters);
  }, [filters, updateURL]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    updateURL(defaultFilters);
  }, [updateURL]);

  // Quick filter presets
  const setQuickFilter = useCallback((preset: string) => {
    const now = new Date();
    let dateFrom: Date | null = null;
    let dateTo: Date | null = null;

    switch (preset) {
      case 'today':
        dateFrom = startOfDay(now);
        dateTo = endOfDay(now);
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFrom = startOfDay(yesterday);
        dateTo = endOfDay(yesterday);
        break;
      case 'last7days':
        dateFrom = new Date(now);
        dateFrom.setDate(dateFrom.getDate() - 7);
        dateTo = endOfDay(now);
        break;
      case 'last30days':
        dateFrom = new Date(now);
        dateFrom.setDate(dateFrom.getDate() - 30);
        dateTo = endOfDay(now);
        break;
      case 'thisMonth':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        dateTo = endOfDay(now);
        break;
    }

    updateFilters({ dateFrom, dateTo });
  }, [updateFilters]);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const categories = [...new Set(ingresos.map(i => i.category))];
    const statuses = [...new Set(ingresos.map(i => i.status))];
    const residenciales = [...new Set(ingresos.map(i => i._residencialDocId).filter(Boolean))];
    const placas = [...new Set(ingresos.map(i => i.vehicleInfo?.placa).filter(Boolean))];

    return {
      categories,
      statuses,
      residenciales,
      placas
    };
  }, [ingresos]);

  const totalPages = Math.ceil(filteredIngresos.length / filters.pageSize);
  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof IngresosFilters];
    const defaultValue = defaultFilters[key as keyof IngresosFilters];
    return JSON.stringify(value) !== JSON.stringify(defaultValue);
  });

  return {
    filters,
    filteredIngresos,
    paginatedIngresos,
    updateFilters,
    resetFilters,
    setQuickFilter,
    filterOptions,
    totalPages,
    hasActiveFilters,
    totalResults: filteredIngresos.length,
    currentResults: paginatedIngresos.length
  };
}; 