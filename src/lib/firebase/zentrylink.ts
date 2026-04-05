import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';

// ─── Types ────────────────────────────────────────────────

export interface ZentryLinkStatus {
  online: boolean;
  lastSeen: Timestamp | null;
  agentVersion: string;
  zkteco: {
    connected: boolean;
    serialNumber: string;
    firmware: string;
  };
  firebase: {
    connected: boolean;
  };
  stats: {
    tagsActive: number;
    tagsTotal: number;
    lastAccess: {
      pin: number;
      cardNo: string;
      door: string;
      eventName: string;
      at: Timestamp;
    } | null;
  };
}

export interface TagCommandResult {
  ok: boolean;
  cardNo?: string;
  pin?: number;
  notInHardware?: boolean;
}

export type TagCommandOp = 'activate' | 'deactivate';

// ─── Functions ────────────────────────────────────────────

/**
 * Suscribirse al estado de ZentryLink en tiempo real.
 * Devuelve una función para cancelar la suscripción.
 */
export function watchZentryLinkStatus(
  residencialDocId: string,
  callback: (status: ZentryLinkStatus | null) => void
): () => void {
  const statusRef = doc(
    db,
    'residenciales',
    residencialDocId,
    'zentryLinkStatus',
    'current'
  );

  return onSnapshot(
    statusRef,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback(snap.data() as ZentryLinkStatus);
    },
    () => callback(null)
  );
}

/**
 * Determina si ZentryLink está online basado en lastSeen.
 * Considera offline si lastSeen es >90 segundos atrás o null.
 */
export function isZentryLinkOnline(status: ZentryLinkStatus | null): boolean {
  if (!status || !status.lastSeen) return false;
  const lastSeenMs = status.lastSeen.toMillis();
  return Date.now() - lastSeenMs < 90_000;
}

/**
 * Formatea cuánto tiempo hace que se vio ZentryLink.
 * Ej: "hace 12s", "hace 2m", "hace 5m"
 */
export function formatLastSeen(lastSeen: Timestamp | null): string {
  if (!lastSeen) return 'nunca';
  const seconds = Math.floor((Date.now() - lastSeen.toMillis()) / 1000);
  if (seconds < 60) return `hace ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `hace ${minutes}m`;
}

/**
 * Envía un comando de activar/desactivar tag a ZentryLink via Firestore.
 * Espera a que ZentryLink procese el comando (máximo 30 segundos).
 * Resuelve con el resultado o rechaza con error.
 */
export async function sendTagCommand(
  residencialDocId: string,
  op: TagCommandOp,
  tagId: string,
  requestedBy: string
): Promise<TagCommandResult> {
  const cmdRef = await addDoc(
    collection(db, 'residenciales', residencialDocId, 'tagCommands'),
    {
      op,
      tagId,
      requestedBy,
      requestedAt: serverTimestamp(),
      status: 'pending',
    }
  );

  return new Promise<TagCommandResult>((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error('ZentryLink no responde — tiempo de espera agotado (30s)'));
    }, 30_000);

    const unsubscribe = onSnapshot(cmdRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.status === 'pending' || data.status === 'processing') return;

      clearTimeout(timeout);
      unsubscribe();

      if (data.status === 'done') {
        resolve(data.result as TagCommandResult);
      } else {
        reject(new Error(data.error || 'Error desconocido en ZentryLink'));
      }
    });
  });
}
