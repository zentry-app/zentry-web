import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || request.headers.get('x-health-token');
  const expected = process.env.HEALTHCHECK_TOKEN;
  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: any = {
    adminInitialized: !!(adminAuth && adminDb && adminStorage),
    auth: null as any,
    firestore: null as any,
    storage: null as any,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || null,
  };

  if (!adminAuth || !adminDb || !adminStorage) {
    return NextResponse.json({ ok: false, ...results }, { status: 500 });
  }

  try {
    await adminAuth.listUsers(1);
    results.auth = 'ok';
  } catch (e: any) {
    results.auth = { error: e?.message || String(e), code: e?.code };
  }

  try {
    await adminDb.collection('healthcheck').limit(1).get();
    results.firestore = 'ok';
  } catch (e: any) {
    results.firestore = { error: e?.message || String(e), code: e?.code };
  }

  try {
    const bucket = adminStorage.bucket();
    await bucket.getFiles({ prefix: 'healthcheck/', maxResults: 1 });
    results.storage = 'ok';
  } catch (e: any) {
    results.storage = { error: e?.message || String(e), code: e?.code };
  }

  const ok = results.auth === 'ok' && results.firestore === 'ok';
  return NextResponse.json({ ok, ...results }, { status: ok ? 200 : 500 });
}


