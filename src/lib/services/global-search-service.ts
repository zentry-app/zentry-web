import { collection, query, where, getDocs, limit as fbLimit, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { SearchResult, SearchResponse, SearchOptions, SearchCategory } from '@/types/search';

// Cache simple para búsquedas recientes
const searchCache = new Map<string, { data: SearchResponse; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 segundos

/**
 * Normaliza un término de búsqueda eliminando acentos y convirtiendo a minúsculas
 */
function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Verifica si un texto contiene el término de búsqueda (normalizado)
 */
function matchesSearch(text: string, searchTerm: string): boolean {
  const normalizedText = normalizeSearchTerm(text);
  const normalizedSearch = normalizeSearchTerm(searchTerm);
  return normalizedText.includes(normalizedSearch);
}

/**
 * Servicio de búsqueda global para el dashboard
 */
export class GlobalSearchService {
  /**
   * Buscar en usuarios por nombre, email, casa
   */
  static async searchUsuarios(searchQuery: string, residencialId?: string): Promise<SearchResult[]> {
    try {
      const usuariosRef = collection(db, 'usuarios');
      let q = query(usuariosRef, fbLimit(100)); // Traer más para filtrar client-side
      
      if (residencialId) {
        q = query(usuariosRef, where('residencialID', '==', residencialId), fbLimit(100));
      }
      
      const snapshot = await getDocs(q);
      const results: SearchResult[] = [];
      const normalizedQuery = normalizeSearchTerm(searchQuery);
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const fullName = `${data.fullName || ''} ${data.paternalLastName || ''} ${data.maternalLastName || ''}`.trim();
        const email = data.email || '';
        const houseNumber = data.houseNumber?.toString() || '';
        
        // Buscar en múltiples campos
        if (
          matchesSearch(fullName, searchQuery) ||
          matchesSearch(email, searchQuery) ||
          matchesSearch(houseNumber, searchQuery)
        ) {
          results.push({
            id: doc.id,
            type: 'usuarios',
            title: fullName,
            subtitle: email,
            metadata: houseNumber ? `Casa ${houseNumber}` : undefined,
            icon: 'Users',
            href: `/dashboard/usuarios?id=${doc.id}`,
            residencialId: data.residencialID
          });
        }
      });
      
      return results.slice(0, 5);
    } catch (error) {
      console.error('Error searching usuarios:', error);
      return [];
    }
  }

  /**
   * Buscar en áreas comunes por nombre
   */
  static async searchAreasComunes(searchQuery: string, residencialId?: string): Promise<SearchResult[]> {
    try {
      if (!residencialId) return [];
      
      const areasRef = collection(db, 'residenciales', residencialId, 'areas_comunes');
      const snapshot = await getDocs(query(areasRef, fbLimit(50)));
      const results: SearchResult[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const nombre = data.nombre || '';
        
        if (matchesSearch(nombre, searchQuery)) {
          results.push({
            id: doc.id,
            type: 'areas_comunes',
            title: nombre,
            subtitle: data.tipo || 'Área Común',
            metadata: data.activa ? 'Activa' : 'Inactiva',
            icon: 'Map',
            href: `/dashboard/areas-comunes?id=${doc.id}`,
            residencialId
          });
        }
      });
      
      return results.slice(0, 5);
    } catch (error) {
      console.error('Error searching areas comunes:', error);
      return [];
    }
  }

  /**
   * Buscar en reservas por usuario o área
   */
  static async searchReservas(searchQuery: string, residencialId?: string): Promise<SearchResult[]> {
    try {
      if (!residencialId) return [];
      
      const reservasRef = collection(db, 'residenciales', residencialId, 'reservaciones');
      const q = query(reservasRef, orderBy('fecha', 'desc'), fbLimit(100));
      const snapshot = await getDocs(q);
      const results: SearchResult[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const nombreReservante = data.nombreReservante || data.nombreCompleto || '';
        const areaComun = data.areaComun || '';
        
        if (
          matchesSearch(nombreReservante, searchQuery) ||
          matchesSearch(areaComun, searchQuery)
        ) {
          const fecha = data.fecha?.toDate?.();
          const fechaStr = fecha ? fecha.toLocaleDateString('es-MX') : '';
          
          results.push({
            id: doc.id,
            type: 'reservas',
            title: areaComun,
            subtitle: nombreReservante,
            metadata: fechaStr,
            icon: 'BookOpen',
            href: `/dashboard/reservas?id=${doc.id}`,
            residencialId
          });
        }
      });
      
      return results.slice(0, 5);
    } catch (error) {
      console.error('Error searching reservas:', error);
      return [];
    }
  }

  /**
   * Buscar en tags por código o nombre
   */
  static async searchTags(searchQuery: string, residencialId?: string): Promise<SearchResult[]> {
    try {
      if (!residencialId) return [];
      
      const tagsRef = collection(db, 'residenciales', residencialId, 'tags');
      const snapshot = await getDocs(query(tagsRef, fbLimit(100)));
      const results: SearchResult[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const tagCode = data.tagCode?.toString() || '';
        const nombre = data.nombre || '';
        const apellido = data.apellidoPaterno || '';
        const houseNumber = data.houseNumber?.toString() || '';
        
        if (
          matchesSearch(tagCode, searchQuery) ||
          matchesSearch(nombre, searchQuery) ||
          matchesSearch(apellido, searchQuery) ||
          matchesSearch(houseNumber, searchQuery)
        ) {
          results.push({
            id: doc.id,
            type: 'tags',
            title: `Tag ${tagCode}`,
            subtitle: `${nombre} ${apellido}`.trim(),
            metadata: houseNumber ? `Casa ${houseNumber}` : undefined,
            icon: 'Tag',
            href: `/dashboard/tags?id=${doc.id}`,
            residencialId
          });
        }
      });
      
      return results.slice(0, 5);
    } catch (error) {
      console.error('Error searching tags:', error);
      return [];
    }
  }

  /**
   * Buscar en ingresos por visitante o residente
   */
  static async searchIngresos(searchQuery: string, residencialId?: string): Promise<SearchResult[]> {
    try {
      if (!residencialId) return [];
      
      const ingresosRef = collection(db, 'residenciales', residencialId, 'ingresos');
      const q = query(ingresosRef, orderBy('timestamp', 'desc'), fbLimit(100));
      const snapshot = await getDocs(q);
      const results: SearchResult[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const nombreCompleto = data.nombreCompleto || '';
        const visitante = data.visitante || '';
        const tipoIngreso = data.tipoIngreso || '';
        
        if (
          matchesSearch(nombreCompleto, searchQuery) ||
          matchesSearch(visitante, searchQuery)
        ) {
          const timestamp = data.timestamp?.toDate?.();
          const timestampStr = timestamp ? timestamp.toLocaleString('es-MX') : '';
          
          results.push({
            id: doc.id,
            type: 'ingresos',
            title: visitante || nombreCompleto,
            subtitle: tipoIngreso,
            metadata: timestampStr,
            icon: 'ClipboardList',
            href: `/dashboard/ingresos?id=${doc.id}`,
            residencialId
          });
        }
      });
      
      return results.slice(0, 5);
    } catch (error) {
      console.error('Error searching ingresos:', error);
      return [];
    }
  }

  /**
   * Buscar en residenciales por nombre o dirección
   */
  static async searchResidenciales(searchQuery: string): Promise<SearchResult[]> {
    try {
      const residencialesRef = collection(db, 'residenciales');
      const snapshot = await getDocs(query(residencialesRef, fbLimit(50)));
      const results: SearchResult[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const nombre = data.nombre || '';
        const direccion = data.direccion || '';
        
        if (
          matchesSearch(nombre, searchQuery) ||
          matchesSearch(direccion, searchQuery)
        ) {
          results.push({
            id: doc.id,
            type: 'residenciales',
            title: nombre,
            subtitle: direccion,
            metadata: data.ciudad || '',
            icon: 'Building',
            href: `/dashboard/residenciales?id=${doc.id}`,
            residencialId: doc.id
          });
        }
      });
      
      return results.slice(0, 5);
    } catch (error) {
      console.error('Error searching residenciales:', error);
      return [];
    }
  }

  /**
   * Método principal que ejecuta todas las búsquedas en paralelo
   */
  static async search(searchQuery: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const startTime = Date.now();
    
    // Verificar cache
    const cacheKey = `${searchQuery}-${options.residencialId || 'all'}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    
    // Si el query es muy corto, devolver respuesta vacía
    if (!searchQuery || searchQuery.length < 2) {
      return {
        results: [],
        resultsByCategory: {} as Record<SearchCategory, SearchResult[]>,
        totalResults: 0,
        searchTime: 0
      };
    }
    
    const { residencialId, limit = 5, categories } = options;
    
    // Ejecutar búsquedas en paralelo
    const searchPromises: Promise<SearchResult[]>[] = [];
    
    if (!categories || categories.includes('usuarios')) {
      searchPromises.push(this.searchUsuarios(searchQuery, residencialId));
    }
    if (!categories || categories.includes('residenciales')) {
      searchPromises.push(this.searchResidenciales(searchQuery));
    }
    if (!categories || categories.includes('areas_comunes')) {
      searchPromises.push(this.searchAreasComunes(searchQuery, residencialId));
    }
    if (!categories || categories.includes('reservas')) {
      searchPromises.push(this.searchReservas(searchQuery, residencialId));
    }
    if (!categories || categories.includes('tags')) {
      searchPromises.push(this.searchTags(searchQuery, residencialId));
    }
    if (!categories || categories.includes('ingresos')) {
      searchPromises.push(this.searchIngresos(searchQuery, residencialId));
    }
    
    const resultsArrays = await Promise.all(searchPromises);
    const allResults = resultsArrays.flat();
    
    // Agrupar por categoría
    const resultsByCategory: Record<SearchCategory, SearchResult[]> = {
      usuarios: [],
      residenciales: [],
      areas_comunes: [],
      reservas: [],
      tags: [],
      ingresos: [],
      pagos: [],
      guardias: []
    };
    
    allResults.forEach((result) => {
      if (resultsByCategory[result.type]) {
        resultsByCategory[result.type].push(result);
      }
    });
    
    const searchTime = Date.now() - startTime;
    
    const response: SearchResponse = {
      results: allResults.slice(0, 30), // Máximo 30 resultados totales
      resultsByCategory,
      totalResults: allResults.length,
      searchTime
    };
    
    // Guardar en cache
    searchCache.set(cacheKey, { data: response, timestamp: Date.now() });
    
    // Limpiar cache antiguo
    if (searchCache.size > 50) {
      const oldestKey = Array.from(searchCache.keys())[0];
      searchCache.delete(oldestKey);
    }
    
    return response;
  }
}
