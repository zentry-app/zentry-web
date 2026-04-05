import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function DELETE(request: NextRequest) {
  try {
    // Verificar que Firebase Admin esté configurado
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin no está configurado correctamente' },
        { status: 500 }
      );
    }

    // Obtener el token de autenticación del header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];

    // Verificar el token y leer claims
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json(
        { error: 'Token de autenticación inválido' },
        { status: 401 }
      );
    }

    const { uid, admin: isAdmin, superadmin, isAdmin: isAdminClaim } = decodedToken;

    if (!isAdmin && !superadmin && !isAdminClaim) {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Se requiere rol de administrador.' },
        { status: 403 }
      );
    }

    // Obtener parámetros de la URL
    const url = new URL(request.url);
    const tagId = url.searchParams.get('tagId');
    const residencialId = url.searchParams.get('residencialId');

    if (!tagId || !residencialId) {
      return NextResponse.json(
        { error: 'tagId y residencialId son requeridos' },
        { status: 400 }
      );
    }

    // Residencial docId hardcodeado — v1 single-site
    const residencialDocId = 'mCTs294LGLkGvL9TTvaQ';

    const tagRef = adminDb.collection('residenciales').doc(residencialDocId).collection('tags').doc(tagId);
    const tagDoc = await tagRef.get();

    if (!tagDoc.exists) {
      return NextResponse.json(
        { error: 'Tag no encontrado' },
        { status: 404 }
      );
    }

    const tagData = tagDoc.data();

    // Eliminar el tag de Firestore
    await tagRef.delete();

    // Crear log de auditoría
    await adminDb.collection('residenciales').doc(residencialDocId).collection('auditLogs').add({
      action: 'DELETE_TAG',
      tagId: tagId,
      cardNumber: tagData?.cardNumberDec || null,
      casaId: tagData?.casaId || null,
      previousStatus: tagData?.status || null,
      newStatus: 'deleted',
      userId: decodedToken.uid,
      userEmail: decodedToken.email || null,
      timestamp: new Date().toISOString(),
      residencialId: residencialId,
    });

    return NextResponse.json({
      success: true,
      message: 'Tag eliminado exitosamente',
      tagId: tagId,
      cardNumber: tagData?.cardNumberDec,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[DELETE /api/tags/delete]', msg);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: msg },
      { status: 500 }
    );
  }
}
