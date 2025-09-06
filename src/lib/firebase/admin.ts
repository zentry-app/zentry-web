import * as admin from 'firebase-admin';
import 'firebase-admin/storage';

type ServiceAccountLike = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function parseServiceAccountFromEnv(): ServiceAccountLike | null {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (jsonEnv) {
    try {
      // Soportar JSON directo o base64
      const jsonString = jsonEnv.trim().startsWith('{')
        ? jsonEnv
        : Buffer.from(jsonEnv, 'base64').toString('utf-8');
      const obj = JSON.parse(jsonString);
      const sa = {
        projectId: obj.project_id || obj.projectId,
        clientEmail: obj.client_email || obj.clientEmail,
        privateKey: (obj.private_key || obj.privateKey || '').replace(/\\n/g, '\n'),
      } as ServiceAccountLike;
      if (sa.projectId && sa.clientEmail && sa.privateKey) return sa;
    } catch (e) {
      console.error('No se pudo parsear FIREBASE_SERVICE_ACCOUNT:', e);
    }
  }
  return null;
}

function buildServiceAccountFromVars(): ServiceAccountLike | null {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = privateKeyRaw ? privateKeyRaw.replace(/\\n/g, '\n') : undefined;
  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey } as ServiceAccountLike;
  }
  return null;
}

function ensureAdminInitialized(): void {
  if (admin.apps.length) return;

  const fromJson = parseServiceAccountFromEnv();
  const fromVars = buildServiceAccountFromVars();
  const sa = fromJson || fromVars;

  if (!sa) {
    console.error('Firebase Admin: variables no configuradas. Revise FIREBASE_SERVICE_ACCOUNT o (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).');
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: sa.projectId,
        clientEmail: sa.clientEmail,
        privateKey: sa.privateKey,
      }),
      projectId: sa.projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${sa.projectId}.appspot.com`,
    });
    // eslint-disable-next-line no-console
    console.log('Firebase Admin SDK inicializado.');
  } catch (error) {
    console.error('Error al inicializar Firebase Admin:', error);
  }
}

ensureAdminInitialized();

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminStorage = admin.apps.length ? admin.storage() : null;