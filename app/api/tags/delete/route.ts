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

    // Obtener el tag antes de eliminarlo para crear el panelJob
    // Buscar el residencial correcto usando el residencialDocId
    let residencialDocId = residencialId;
    
    // Si residencialId es un residencialID (como "S9G7TL"), buscar el docId correspondiente
    if (residencialId && !residencialId.includes('-')) {
      try {
        const residencialesSnapshot = await adminDb.collection('residenciales')
          .where('residencialID', '==', residencialId)
          .limit(1)
          .get();
        
        if (!residencialesSnapshot.empty) {
          residencialDocId = residencialesSnapshot.docs[0].id;
          console.log(`Residencial encontrado: ${residencialId} -> ${residencialDocId}`);
        } else {
          console.log(`Residencial no encontrado: ${residencialId}`);
        }
      } catch (error) {
        console.error('Error buscando residencial:', error);
      }
    }
    
    const tagRef = adminDb.collection('residenciales').doc(residencialDocId).collection('tags').doc(tagId);
    const tagDoc = await tagRef.get();

    if (!tagDoc.exists) {
      return NextResponse.json(
        { error: 'Tag no encontrado' },
        { status: 404 }
      );
    }

    const tagData = tagDoc.data();

    // Crear panelJob para eliminar el tag de la controladora
    const panelJobRef = adminDb.collection('residenciales').doc(residencialDocId).collection('panelJobs').doc();
    await panelJobRef.set({
      tagId: tagId,
      cardNumber: tagData?.cardNumberDec,
      action: 'DELETE_TAG',
      status: 'queued',
      createdAt: new Date().toISOString(),
      createdBy: decodedToken.uid,
      residencialId: residencialId
    });

    // Eliminar el tag de Firestore
    await tagRef.delete();

    // Crear log de auditoría
    const auditLogRef = adminDb.collection('residenciales').doc(residencialDocId).collection('auditLogs').doc();
    
    // Preparar datos del log de auditoría, filtrando valores undefined
    const auditData: any = {
      action: 'DELETE_TAG',
      tagId: tagId,
      cardNumber: tagData?.cardNumberDec || null,
      panels: tagData?.panels || [],
      previousStatus: tagData?.status || null,
      newStatus: 'deleted',
      userId: decodedToken.uid,
      userEmail: decodedToken.email || null,
      timestamp: new Date().toISOString(),
      residencialId: residencialId,
      notes: `Tag eliminado por ${userData?.email || 'usuario desconocido'}`
    };
    
    // Solo agregar casaId si no es undefined
    if (tagData?.casaId !== undefined) {
      auditData.casaId = tagData.casaId;
    }
    
    await auditLogRef.set(auditData);

    console.log(`✅ Tag ${tagId} eliminado exitosamente por ${decodedToken.email}`);

    return NextResponse.json({
      success: true,
      message: 'Tag eliminado exitosamente',
      tagId: tagId,
      cardNumber: tagData?.cardNumberDec,
      panelJobId: panelJobRef.id
    });

  } catch (error) {
    console.error('Error eliminando tag:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
