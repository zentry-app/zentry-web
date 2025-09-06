import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Obtener el token de autorización
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }

    const idToken = authorization.split('Bearer ')[1];

    // Verificar que adminAuth esté disponible
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin no está configurado correctamente' },
        { status: 500 }
      );
    }

    // Verificar el token y obtener las claims del usuario
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email, admin, superadmin, isAdmin } = decodedToken;

    // Log para debugging
    console.log('🔍 Usuario validando tarjeta:', {
      uid,
      email,
      admin: !!admin,
      superadmin: !!superadmin,
      isAdmin: !!isAdmin
    });

    // Verificar que el usuario sea admin (usar isAdmin que es el claim correcto)
    if (!admin && !superadmin && !isAdmin) {
      console.log('⚠️ Usuario sin permisos de admin');
      return NextResponse.json(
        { error: 'Permisos insuficientes. Se requiere rol de administrador.' },
        { status: 403 }
      );
    }

    // Obtener parámetros de query
    const url = new URL(request.url);
    const cardNumberDec = url.searchParams.get('cardNumberDec');
    const residencialId = url.searchParams.get('residencialId');

    if (!cardNumberDec || !residencialId) {
      return NextResponse.json(
        { error: 'cardNumberDec y residencialId son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato del número DEC
    if (!/^\d{1,20}$/.test(cardNumberDec)) {
      return NextResponse.json(
        { error: 'El número de tarjeta debe contener solo dígitos (1-20 caracteres)' },
        { status: 400 }
      );
    }

    // Buscar si el número DEC ya existe en el residencial
    const residencialDocId = 'mCTs294LGLkGvL9TTvaQ'; // Residencial S9G7TL actual
    const tagsRef = adminDb!.collection('residenciales').doc(residencialDocId).collection('tags');
    
    const existingTagQuery = await tagsRef
      .where('cardNumberDec', '==', cardNumberDec)
      .where('residencialId', '==', residencialId)
      .get();

    const exists = !existingTagQuery.empty;
    
    if (exists) {
      const existingTag = existingTagQuery.docs[0].data();
      return NextResponse.json({
        valid: false,
        exists: true,
        message: 'Este número de tarjeta ya existe en el residencial',
        existingTag: {
          id: existingTagQuery.docs[0].id,
          cardNumberDec: existingTag.cardNumberDec,
          status: existingTag.status,
          casaId: existingTag.ownerRef,
          panels: existingTag.panels,
          createdAt: existingTag.createdAt,
          lastChangedAt: existingTag.lastChangedAt
        }
      });
    }

    return NextResponse.json({
      valid: true,
      exists: false,
      message: 'Número de tarjeta disponible',
      cardNumberDec,
      residencialId
    });

  } catch (error) {
    console.error('Error en /api/tags/validate-card:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
