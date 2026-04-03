import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Asumiendo que tienes un archivo de inicialización para firebase-admin similar a src/lib/firebase/admin.ts
// y que exporta adminAuth.
// Ajusta la ruta de importación según tu estructura.
import { adminAuth } from '@/lib/firebase/admin'; 

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    // Verificar que adminAuth esté disponible
    if (!adminAuth) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 500 });
    }

    // El tiempo de expiración de la cookie. Firebase ID tokens duran 1 hora.
    // Puedes hacerla coincidir o establecer una duración diferente para la cookie de sesión.
    // 5 días de ejemplo para la cookie de sesión.
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 días en milisegundos

    // Verificar el ID token con Firebase Admin SDK.
    // Esto también decodifica el token.
    const decodedIdToken = await adminAuth.verifyIdToken(idToken, true /** checkRevoked */);

    if (!decodedIdToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Crear una cookie de sesión (si no vas a usar Firebase Session Cookies)
    // Si usas Firebase Session Cookies (recomendado para mayor control y revocación del lado del servidor),
    // el proceso es un poco diferente: usarías adminAuth.createSessionCookie().
    // Por ahora, usaremos el idToken directamente en la cookie para simplicidad, 
    // pero ten en cuenta las implicaciones de seguridad y la vida útil del token.

    const response = NextResponse.json({ success: true, uid: decodedIdToken.uid }, { status: 200 });

    response.cookies.set('session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: expiresIn / 1000, // maxAge está en segundos
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Error setting session:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 