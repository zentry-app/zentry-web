import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { updateTagStatusDirect } from '@/lib/firebase/tags-sync';

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
    const { uid } = decodedToken;

    // Verificar permisos del usuario
    const userDoc = await adminDb!.collection('usuarios').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const isGlobalAdmin = userData?.role === 'admin';

    if (!isGlobalAdmin) {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Se requiere rol de administrador.' },
        { status: 403 }
      );
    }

    // Obtener datos del request
    const { tagId, status } = await request.json();

    // Validaciones
    if (!tagId || !status) {
      return NextResponse.json(
        { error: 'tagId y status son requeridos' },
        { status: 400 }
      );
    }

    const validStatuses = ['active', 'disabled', 'lost', 'stolen'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Buscar el residencial correcto usando el residencialDocId
    let residencialDocId = 'mCTs294LGLkGvL9TTvaQ'; // Residencial S9G7TL actual
    
    // Actualizar el tag directamente usando Admin SDK
    const tagRef = adminDb!.collection('residenciales').doc(residencialDocId).collection('tags').doc(tagId);
    
    // Verificar que el tag existe
    const tagDoc = await tagRef.get();
    if (!tagDoc.exists) {
      return NextResponse.json(
        { error: 'Tag no encontrado' },
        { status: 404 }
      );
    }
    
    // Actualizar el tag
    await tagRef.update({
      status: status,
      lastChangedBy: uid,
      lastChangedAt: new Date().toISOString()
    });
    
    // Crear log de auditoría
    const auditLogRef = adminDb!.collection('residenciales').doc(residencialDocId).collection('auditLogs').doc();
    await auditLogRef.set({
      action: 'UPDATE_TAG_STATUS',
      tagId: tagId,
      cardNumber: tagDoc.data()?.cardNumberDec || null,
      previousStatus: tagDoc.data()?.status || null,
      newStatus: status,
      userId: uid,
      userEmail: userData?.email || null,
      timestamp: new Date().toISOString(),
      residencialId: 'S9G7TL',
      notes: `Estado del tag actualizado por ${userData?.email || 'usuario desconocido'}`
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Estado del tag actualizado correctamente',
      tagId,
      newStatus: status
    });

  } catch (error) {
    console.error('Error en /api/tags/update-status:', error);
    
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