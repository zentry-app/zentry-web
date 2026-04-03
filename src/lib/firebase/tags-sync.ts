import { 
  collection, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './config';

export interface Tag {
  id?: string;
  cardNumberDec: string;
  cardHex?: string | null;
  facilityCode?: number | null;
  format?: string;
  holder?: {
    name: string;
    externalId?: string | null;
  };
  residentId?: string;
  status: 'active' | 'disabled' | 'lost' | 'stolen';
  validFrom?: string | null;
  validTo?: string | null;
  panels: string[];
  lastChangedBy: string;
  lastChangedAt: string;
  source: string;
  // 🆕 Campos adicionales del documento real
  createdAt?: string;
  notes?: string | null;
  ownerRef?: string;
  ownerType?: string;
  plate?: string;
  residencialId?: string;
  type?: string;
  // 🆕 Campos críticos de ZKTeco
  zktecoUserId?: number;
  zktecoBadgeNumber?: string;
  zktecoAccGroup?: number;
}

export interface PanelJob {
  id?: string;
  tagId: string;
  panelId: string;
  action: 'APPLY_TAG_STATUS';
  desiredStatus: string;
  attempts: number;
  maxAttempts: number;
  status: 'queued' | 'running' | 'done' | 'error';
  error?: string;
  createdAt: string;
  claimedBy?: string;
  claimedAt?: string;
  completedAt?: string;
}

export interface AuditLog {
  id?: string;
  type: 'TAG_STATUS_CHANGE';
  tagId: string;
  from: string;
  to: string;
  byUserId: string;
  at: string;
  panelFanoutJobs: number;
}

/**
 * Actualiza el estado de un tag usando el endpoint API
 */
export async function updateTagStatus(
  tagId: string, 
  newStatus: string, 
  userId: string
): Promise<void> {
  try {
    // Obtener token de autenticación
    const { getAuthSafe } = await import('./config');
    const auth = await getAuthSafe();
    const user = auth?.currentUser;
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const token = await user.getIdToken();

    const response = await fetch('/api/tags/update-status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tagId,
        status: newStatus
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al actualizar estado del tag');
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Error al actualizar estado del tag:', error);
    throw error;
  }
}

/**
 * Actualiza el estado de un tag directamente en Firestore (para uso interno)
 */
export async function updateTagStatusDirect(
  tagId: string, 
  newStatus: string, 
  userId: string
): Promise<void> {
  try {
    const residencialDocId = 'mCTs294LGLkGvL9TTvaQ'; // Residencial S9G7TL actual
    const tagRef = doc(db, 'residenciales', residencialDocId, 'tags', tagId);
    
    // Actualizar el tag
    await updateDoc(tagRef, {
      status: newStatus,
      lastChangedBy: userId,
      lastChangedAt: new Date().toISOString()
    });

    // Registrar en auditLogs
    await addDoc(collection(db, 'residenciales', residencialDocId, 'auditLogs'), {
      type: 'TAG_STATUS_CHANGE',
      tagId: tagId,
      from: 'unknown', // Se puede obtener del tag actual si es necesario
      to: newStatus,
      byUserId: userId,
      at: new Date().toISOString(),
      panelFanoutJobs: 0 // Se actualizará cuando se creen los panelJobs
    });

  } catch (error) {
    console.error('Error al actualizar estado del tag:', error);
    throw error;
  }
}

/**
 * Obtiene los tags con filtros opcionales
 */
export async function getTags(
  residencialId?: string,
  status?: string
): Promise<Tag[]> {
  try {
    const residencialDocId = 'mCTs294LGLkGvL9TTvaQ'; // Residencial S9G7TL actual
    const tagsRef = collection(db, 'residenciales', residencialDocId, 'tags');
    let q = query(tagsRef);

    if (residencialId) {
      q = query(q, where('residencialId', '==', residencialId));
    }

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Tag[];

  } catch (error) {
    console.error('Error al obtener tags:', error);
    throw error;
  }
}

/**
 * 🆕 Obtiene los tags de un residencial específico
 */
export async function getTagsSync(residencialDocId: string): Promise<Tag[]> {
  try {
    console.log(`🏷️ [getTagsSync] Obteniendo tags del residencialDocId: ${residencialDocId}`);
    
    const tagsRef = collection(db, 'residenciales', residencialDocId, 'tags');
    
    // 🆕 Intentar con orderBy por cardNumberDec, si falla usar consulta simple
    let snapshot;
    try {
      const q = query(tagsRef, orderBy('cardNumberDec', 'asc'));
      snapshot = await getDocs(q);
      console.log(`🏷️ [getTagsSync] Consulta con orderBy por cardNumberDec exitosa`);
    } catch (orderByError) {
      console.log(`🏷️ [getTagsSync] Error con orderBy, usando consulta simple:`, orderByError);
      snapshot = await getDocs(tagsRef);
      console.log(`🏷️ [getTagsSync] Consulta simple exitosa`);
    }
    
    console.log(`🏷️ [getTagsSync] Documentos encontrados: ${snapshot.docs.length}`);
    
    const tags = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`🏷️ [getTagsSync] Tag ${doc.id}:`, {
        cardNumberDec: data.cardNumberDec,
        status: data.status,
        plate: data.plate,
        ownerRef: data.ownerRef,
        panels: data.panels,
        lastChangedAt: data.lastChangedAt,
        createdAt: data.createdAt,
        residencialId: data.residencialId,
        source: data.source
      });
      return {
        id: doc.id,
        ...data
      };
    }) as Tag[];
    
    // 🆕 Ordenar manualmente por cardNumberDec (ascendente)
    tags.sort((a, b) => {
      const cardA = parseInt(a.cardNumberDec) || 0;
      const cardB = parseInt(b.cardNumberDec) || 0;
      return cardA - cardB; // Ascendente (menor número primero)
    });
    
    console.log(`🏷️ [getTagsSync] Tags procesados y ordenados: ${tags.length}`);
    console.log(`🏷️ [getTagsSync] Primeros 3 tags:`, tags.slice(0, 3).map(t => ({
      id: t.id,
      cardNumberDec: t.cardNumberDec,
      status: t.status,
      source: t.source
    })));
    return tags;
  } catch (error) {
    console.error(`🏷️ [getTagsSync] Error obteniendo tags del residencialDocId ${residencialDocId}:`, error);
    throw error;
  }
}

/**
 * Obtiene los panelJobs de un tag específico
 */
export async function getTagPanelJobs(tagId: string): Promise<PanelJob[]> {
  try {
    const residencialDocId = 'mCTs294LGLkGvL9TTvaQ'; // Residencial S9G7TL actual
    const jobsRef = collection(db, 'residenciales', residencialDocId, 'panelJobs');
    const q = query(
      jobsRef,
      where('tagId', '==', tagId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PanelJob[];

  } catch (error) {
    console.error('Error al obtener panel jobs:', error);
    throw error;
  }
}

/**
 * Obtiene el historial de auditoría de un tag
 */
export async function getTagAuditHistory(tagId: string): Promise<AuditLog[]> {
  try {
    const residencialDocId = 'mCTs294LGLkGvL9TTvaQ'; // Residencial S9G7TL actual
    const auditRef = collection(db, 'residenciales', residencialDocId, 'auditLogs');
    const q = query(
      auditRef,
      where('tagId', '==', tagId),
      where('type', 'in', ['TAG_STATUS_CHANGE', 'TAG_CREATED', 'TAG_REPLACED']),
      orderBy('at', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AuditLog[];

  } catch (error) {
    console.error('Error al obtener historial de auditoría:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de panelJobs
 */
export async function getPanelJobsStats(): Promise<{
  queued: number;
  running: number;
  done: number;
  error: number;
}> {
  try {
    const residencialDocId = 'mCTs294LGLkGvL9TTvaQ'; // Residencial S9G7TL actual
    const jobsRef = collection(db, 'residenciales', residencialDocId, 'panelJobs');
    const stats = { queued: 0, running: 0, done: 0, error: 0 };

    // Obtener jobs de las últimas 24 horas
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const q = query(
      jobsRef,
      where('createdAt', '>=', yesterday.toISOString()),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
      const job = doc.data() as PanelJob;
      if (job.status in stats) {
        stats[job.status as keyof typeof stats]++;
      }
    });

    return stats;

  } catch (error) {
    console.error('Error al obtener estadísticas de panel jobs:', error);
    throw error;
  }
}
