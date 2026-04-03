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
    const { uid, email, admin, superadmin, isAdmin } = decodedToken;

    // Log para debugging
    console.log('🔍 Usuario intentando crear tag:', {
      uid,
      email,
      admin: !!admin,
      superadmin: !!superadmin,
      isAdmin: !!isAdmin,
      claims: decodedToken
    });

    // Verificar que el usuario sea admin (usar isAdmin que es el claim correcto)
    if (!admin && !superadmin && !isAdmin) {
      console.log('⚠️ Usuario sin permisos de admin');
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
      panels,
      status,
      plate,
      notes,
      applyImmediately
    } = await request.json();

    // Validaciones
    if (!cardNumberDec || !residencialId || !casaId || !panels || !status) {
      return NextResponse.json(
        { error: 'cardNumberDec, residencialId, casaId, panels y status son requeridos' },
        { status: 400 }
      );
    }

    if (!Array.isArray(panels) || panels.length === 0) {
      return NextResponse.json(
        { error: 'Debe seleccionar al menos un panel' },
        { status: 400 }
      );
    }

    const validStatuses = ['active', 'disabled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}` },
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
    
    // Crear el tag
    const tagData = {
      type: "vehicular",
      ownerType: "unit",
      ownerRef: casaId,
      cardNumberDec: cardNumberDec,
      format: "W26", // Formato por defecto para ZKTeco
      facilityCode: null,
      residencialId: residencialId,
      panels: panels,
      status: status,
      plate: plate || null,
      notes: notes || null,
      lastChangedBy: uid,
      lastChangedAt: new Date().toISOString(),
      source: "Web",
      createdAt: new Date().toISOString(),
      // Campos adicionales para compatibilidad
      cardHex: null,
      holder: {
        name: `Tag Vehicular ${cardNumberDec}`,
        externalId: cardNumberDec
      },
      residentId: casaId,
      validFrom: null,
      validTo: null,
      // 🆕 Campos críticos de ZKTeco (para consistencia con tags importados)
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
      to: status,
      byUserId: uid,
      at: new Date().toISOString(),
      details: {
        cardNumberDec,
        residencialId,
        casaId,
        panels,
        plate,
        notes,
        applyImmediately
      },
      panelFanoutJobs: 0
    });

    // Si se debe aplicar inmediatamente y el estado es activo
    if (applyImmediately && status === 'active') {
      // Crear panelJobs para cada panel
      const panelJobsRef = adminDb!.collection('residenciales').doc(residencialDocId).collection('panelJobs');
      
      for (const panelId of panels) {
        await panelJobsRef.add({
          tagId: tagId,
          panelId: panelId,
          action: 'APPLY_TAG_STATUS',
          desiredStatus: status,
          attempts: 0,
          maxAttempts: 3,
          status: 'queued',
          createdAt: new Date().toISOString(),
          claimedBy: null,
          claimedAt: null,
          completedAt: null
        });
      }

      // Actualizar el auditLog con el número de jobs creados
      await adminDb!.collection('residenciales').doc(residencialDocId).collection('auditLogs')
        .where('tagId', '==', tagId)
        .where('type', '==', 'TAG_CREATED')
        .limit(1)
        .get()
        .then((snapshot: any) => {
          if (!snapshot.empty) {
            const auditLogId = snapshot.docs[0].id;
            adminDb!.collection('residenciales').doc(residencialDocId).collection('auditLogs')
              .doc(auditLogId)
              .update({ panelFanoutJobs: panels.length });
          }
        });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tag creado correctamente',
      tagId: tagId,
      tag: {
        id: tagId,
        ...tagData
      },
      panelJobsCreated: applyImmediately && status === 'active' ? panels.length : 0
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
