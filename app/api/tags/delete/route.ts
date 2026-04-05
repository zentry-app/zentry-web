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

    // Verificar el token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error('Error verificando token:', error);
      return NextResponse.json(
        { error: 'Token de autenticación inválido' },
        { status: 401 }
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

    // Verificar permisos del usuario
    const userDoc = await adminDb.collection('usuarios').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const isGlobalAdmin = userData?.role === 'admin';
    const isResidencialAdmin = userData?.role === 'admin' && userData?.residencialID === residencialId;

    if (!isGlobalAdmin && !isResidencialAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar tags' },
        { status: 403 }
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
