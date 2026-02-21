import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// --- Types ---

export type ReporteEstado = 'pendiente' | 'en_revision' | 'en_proceso' | 'resuelto' | 'cerrado';
export type ReporteCategoria =
  | 'mantenimiento'
  | 'areas_comunes'
  | 'seguridad'
  | 'limpieza'
  | 'ruido'
  | 'sugerencia'
  | 'otro';

export interface ComentarioAdmin {
  uid: string;
  nombre: string;
  texto: string;
  fecha: Timestamp | Date;
}

export interface Reporte {
  reporteId: string;
  userId: string;
  userName: string;
  userEmail: string;
  domicilio: string;
  residencialId: string;
  categoria: ReporteCategoria;
  titulo: string;
  descripcion: string;
  ubicacionOpcional: string;
  fotos: string[];
  estado: ReporteEstado;
  fechaCreacion: Timestamp | Date;
  fechaActualizacion: Timestamp | Date;
  asignadoA: string | null;
  resolucion: string | null;
  fechaResolucion: Timestamp | Date | null;
  comentariosAdmin: ComentarioAdmin[];
  // Metadata added by service
  _residencialDocId?: string;
  _residencialNombre?: string;
}

export interface ReporteFilters {
  estado?: ReporteEstado[];
  categoria?: ReporteCategoria[];
  searchQuery?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
}

export interface ReporteStats {
  total: number;
  pendientes: number;
  enRevision: number;
  enProceso: number;
  resueltos: number;
  cerrados: number;
  porCategoria: Record<string, number>;
}

// --- Helpers ---

const CATEGORIAS_DISPLAY: Record<string, string> = {
  mantenimiento: 'Mantenimiento / Avería',
  areas_comunes: 'Áreas comunes',
  seguridad: 'Seguridad',
  limpieza: 'Limpieza',
  ruido: 'Ruido o convivencia',
  sugerencia: 'Sugerencia o mejora',
  otro: 'Otro',
};

const ESTADOS_DISPLAY: Record<string, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  en_proceso: 'En proceso',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
};

export function getCategoriaDisplay(cat: string): string {
  return CATEGORIAS_DISPLAY[cat] || cat;
}

export function getEstadoDisplay(estado: string): string {
  return ESTADOS_DISPLAY[estado] || estado;
}

/**
 * Resolve a residencial code (residencialID) to its Firestore document reference.
 */
async function getResidencialDocByCode(residencialCode: string) {
  const q = query(
    collection(db, 'residenciales'),
    where('residencialID', '==', residencialCode)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0];
}

// --- Service ---

export const ReportesService = {
  /**
   * Get all reportes, optionally filtered by residencial and other criteria.
   * If residencialId is provided, only returns reportes from that residencial.
   * If not provided, returns from ALL residenciales (global admin use case).
   */
  getReportes: async (
    residencialId?: string,
    filters?: ReporteFilters
  ): Promise<Reporte[]> => {
    try {
      const reportes: Reporte[] = [];

      if (residencialId) {
        const residencialDoc = await getResidencialDocByCode(residencialId);
        if (!residencialDoc) return [];

        const reportesQuery = query(
          collection(residencialDoc.ref, 'reportes'),
          orderBy('fechaCreacion', 'desc')
        );

        const snap = await getDocs(reportesQuery);
        snap.forEach((d) => {
          reportes.push({
            reporteId: d.id,
            ...d.data(),
            _residencialDocId: residencialDoc.id,
            _residencialNombre: residencialDoc.data().nombre || residencialId,
          } as Reporte);
        });
      } else {
        const residencialesSnap = await getDocs(collection(db, 'residenciales'));
        for (const residencialDoc of residencialesSnap.docs) {
          const reportesQuery = query(
            collection(residencialDoc.ref, 'reportes'),
            orderBy('fechaCreacion', 'desc')
          );
          const snap = await getDocs(reportesQuery);
          snap.forEach((d) => {
            reportes.push({
              reporteId: d.id,
              ...d.data(),
              _residencialDocId: residencialDoc.id,
              _residencialNombre: residencialDoc.data().nombre || '',
            } as Reporte);
          });
        }
      }

      let result = reportes;

      // Apply filters
      if (filters?.estado && filters.estado.length > 0) {
        result = result.filter((r) => filters.estado!.includes(r.estado));
      }
      if (filters?.categoria && filters.categoria.length > 0) {
        result = result.filter((r) => filters.categoria!.includes(r.categoria));
      }
      if (filters?.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        result = result.filter(
          (r) =>
            r.titulo.toLowerCase().includes(q) ||
            r.descripcion.toLowerCase().includes(q) ||
            r.userName.toLowerCase().includes(q) ||
            r.domicilio.toLowerCase().includes(q)
        );
      }
      if (filters?.fechaDesde || filters?.fechaHasta) {
        result = result.filter((r) => {
          const fecha =
            r.fechaCreacion instanceof Timestamp
              ? r.fechaCreacion.toDate()
              : new Date(r.fechaCreacion as any);
          if (filters?.fechaDesde && fecha < filters.fechaDesde) return false;
          if (filters?.fechaHasta && fecha > filters.fechaHasta) return false;
          return true;
        });
      }

      // Sort by date descending
      result.sort((a, b) => {
        const da =
          a.fechaCreacion instanceof Timestamp
            ? a.fechaCreacion.toDate().getTime()
            : new Date(a.fechaCreacion as any).getTime();
        const db2 =
          b.fechaCreacion instanceof Timestamp
            ? b.fechaCreacion.toDate().getTime()
            : new Date(b.fechaCreacion as any).getTime();
        return db2 - da;
      });

      return result;
    } catch (error) {
      console.error('Error obteniendo reportes:', error);
      throw error;
    }
  },

  /**
   * Get a single reporte by its ID within a residencial.
   */
  getReporte: async (
    residencialDocId: string,
    reporteId: string
  ): Promise<Reporte | null> => {
    try {
      const docRef = doc(db, 'residenciales', residencialDocId, 'reportes', reporteId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { reporteId: snap.id, ...snap.data() } as Reporte;
    } catch (error) {
      console.error('Error obteniendo reporte:', error);
      throw error;
    }
  },

  /**
   * Update a reporte's status, resolution, or add admin comment.
   */
  updateReporte: async (
    residencialDocId: string,
    reporteId: string,
    data: {
      estado?: ReporteEstado;
      resolucion?: string;
      comentarioAdmin?: { uid: string; nombre: string; texto: string };
    }
  ): Promise<void> => {
    try {
      const docRef = doc(db, 'residenciales', residencialDocId, 'reportes', reporteId);
      const currentDoc = await getDoc(docRef);

      if (!currentDoc.exists()) {
        throw new Error('Reporte no encontrado');
      }

      const updateData: Record<string, any> = {
        fechaActualizacion: serverTimestamp(),
      };

      if (data.estado) {
        updateData.estado = data.estado;
        if (data.estado === 'resuelto') {
          updateData.fechaResolucion = serverTimestamp();
        }
      }

      if (data.resolucion !== undefined) {
        updateData.resolucion = data.resolucion;
      }

      if (data.comentarioAdmin) {
        const currentData = currentDoc.data();
        const comentarios = currentData?.comentariosAdmin || [];
        comentarios.push({
          ...data.comentarioAdmin,
          fecha: new Date(),
        });
        updateData.comentariosAdmin = comentarios;
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error actualizando reporte:', error);
      throw error;
    }
  },

  /**
   * Calculate stats for reportes.
   */
  getStats: async (residencialId?: string): Promise<ReporteStats> => {
    try {
      const reportes = await ReportesService.getReportes(residencialId);

      const stats: ReporteStats = {
        total: reportes.length,
        pendientes: 0,
        enRevision: 0,
        enProceso: 0,
        resueltos: 0,
        cerrados: 0,
        porCategoria: {},
      };

      for (const r of reportes) {
        switch (r.estado) {
          case 'pendiente': stats.pendientes++; break;
          case 'en_revision': stats.enRevision++; break;
          case 'en_proceso': stats.enProceso++; break;
          case 'resuelto': stats.resueltos++; break;
          case 'cerrado': stats.cerrados++; break;
        }
        stats.porCategoria[r.categoria] =
          (stats.porCategoria[r.categoria] || 0) + 1;
      }

      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas de reportes:', error);
      throw error;
    }
  },
};
