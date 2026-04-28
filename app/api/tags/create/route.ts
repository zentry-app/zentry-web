import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
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
    const { uid, admin, superadmin, isAdmin } = decodedToken;

    // Verificar que el usuario sea admin (usar isAdmin que es el claim correcto)
    if (!admin && !superadmin && !isAdmin) {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Se requiere rol de administrador.' },
        { status: 403 }
      );
    }

    // Obtener datos del request
    const {
      cardNumberDec,
      residencialId,
      casaId,
      plate,
      notes,
    } = await request.json();

    // Validaciones
    if (!cardNumberDec || !residencialId) {
      return NextResponse.json(
        { error: 'cardNumberDec y residencialId son requeridos' },
        { status: 400 }
      );
    }

    // Validar unicidad del número DEC en el residencial
    const residencialDocId = 'mCTs294LGLkGvL9TTvaQ'; // Residencial S9G7TL actual
    const tagsRef = adminDb!.collection('residenciales').doc(residencialDocId).collection('tags');
    
    const existingTagQuery = await tagsRef
      .where('cardNumberDec', '==', cardNumberDec)
      .where('residencialId', '==', residencialId)
      .get();

    if (!existingTagQuery.empty) {
      return NextResponse.json(
        { error: 'Este número de tarjeta ya existe en el residencial' },
        { status: 409 }
      );
    }

    // Generar ID único para ZKTeco (usando timestamp + random)
    const zktecoUserId = Date.now() + Math.floor(Math.random() * 1000);
    
    // Crear el tag — status siempre 'disabled' al crear (ZentryLink lo activa después)
    const tagData = {
      type: "vehicular",
      ownerType: "unit",
      ownerRef: casaId || null,
      cardNumberDec: cardNumberDec,
      format: "W26",
      facilityCode: null,
      residencialId: residencialId,
      panels: [],
      status: 'disabled',
      plate: plate || null,
      notes: notes || null,
      lastChangedBy: uid,
      lastChangedAt: new Date().toISOString(),
      source: "Web",
      createdAt: new Date().toISOString(),
      cardHex: null,
      holder: {
        name: `Tag Vehicular ${cardNumberDec}`,
        externalId: cardNumberDec
      },
      residentId: casaId || null,
      validFrom: null,
      validTo: null,
      zktecoUserId: zktecoUserId,
      zktecoBadgeNumber: cardNumberDec,
      zktecoAccGroup: 0
    };

    // Guardar el tag
    const tagRef = await tagsRef.add(tagData);
    const tagId = tagRef.id;

    // Crear registro de auditoría
    await adminDb!.collection('residenciales').doc(residencialDocId).collection('auditLogs').add({
      type: 'TAG_CREATED',
      tagId: tagId,
      from: null,
      to: 'disabled',
      byUserId: uid,
      at: new Date().toISOString(),
      details: {
        cardNumberDec,
        residencialId,
        casaId,
        plate,
        notes,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Tag creado correctamente',
      tagId: tagId,
      tag: {
        id: tagId,
        ...tagData
      },
    });

  } catch (error) {
    console.error('Error en /api/tags/create:', error);
    
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
