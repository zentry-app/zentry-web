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
  cardHex?: string;
  facilityCode?: number;
  format: string;
  holder: {
    name: string;
    externalId?: string;
  };
  residentId?: string;
  status: 'active' | 'disabled' | 'lost' | 'stolen';
  validFrom?: string;
  validTo?: string;
  panels: string[];
  lastChangedBy: string;
  lastChangedAt: string;
  source: string;
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
    const response = await fetch('/api/tags/update-status', {
      method: 'POST',
      headers: {
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
    const tagRef = doc(db, 'tags', tagId);
    
    // Actualizar el tag
    await updateDoc(tagRef, {
      status: newStatus,
      lastChangedBy: userId,
      lastChangedAt: new Date().toISOString()
    });

    // Registrar en auditLogs
    await addDoc(collection(db, 'auditLogs'), {
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
    const tagsRef = collection(db, 'tags');
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
 * Obtiene los panelJobs de un tag específico
 */
export async function getTagPanelJobs(tagId: string): Promise<PanelJob[]> {
  try {
    const jobsRef = collection(db, 'panelJobs');
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
    const auditRef = collection(db, 'auditLogs');
    const q = query(
      auditRef,
      where('tagId', '==', tagId),
      where('type', '==', 'TAG_STATUS_CHANGE'),
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
    const jobsRef = collection(db, 'panelJobs');
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
