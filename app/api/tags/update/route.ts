import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function PUT(request: NextRequest) {
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

    // Obtener datos del request
    const {
      tagId,
      residencialId,
      casaId,
      plate,
      notes,
      status
    } = await request.json();

    // Validaciones
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
        { error: 'No tienes permisos para editar tags' },
        { status: 403 }
      );
    }

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

    // Obtener el tag actual
    const tagRef = adminDb.collection('residenciales').doc(residencialDocId).collection('tags').doc(tagId);
    const tagDoc = await tagRef.get();

    if (!tagDoc.exists) {
      return NextResponse.json(
        { error: 'Tag no encontrado' },
        { status: 404 }
      );
    }

    const currentTagData = tagDoc.data();

    // Preparar datos de actualización
    const updateData: any = {
      lastChangedBy: decodedToken.uid,
      lastChangedAt: new Date().toISOString()
    };

    // Solo actualizar campos que se proporcionaron
    if (casaId !== undefined) {
      updateData.ownerRef = casaId;
      updateData.residentId = casaId;
    }
    
    if (plate !== undefined) {
      updateData.plate = plate;
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    if (status !== undefined) {
      updateData.status = status;
    }

    // Actualizar el tag en Firestore
    await tagRef.update(updateData);

    // Crear log de auditoría
    const auditLogRef = adminDb.collection('residenciales').doc(residencialDocId).collection('auditLogs').doc();
    
    const auditData: any = {
      action: 'UPDATE_TAG',
      tagId: tagId,
      cardNumber: currentTagData?.cardNumberDec || null,
      userId: decodedToken.uid,
      userEmail: decodedToken.email || null,
      timestamp: new Date().toISOString(),
      residencialId: residencialId,
      changes: updateData,
      previousData: {
        ownerRef: currentTagData?.ownerRef,
        residentId: currentTagData?.residentId,
        plate: currentTagData?.plate,
        notes: currentTagData?.notes,
        status: currentTagData?.status
      },
      notes: `Tag actualizado por ${userData?.email || 'usuario desconocido'}`
    };
    
    await auditLogRef.set(auditData);

    console.log(`✅ Tag ${tagId} actualizado exitosamente por ${decodedToken.email}`);

    return NextResponse.json({
      success: true,
      message: 'Tag actualizado exitosamente',
      tagId: tagId,
      changes: updateData
    });

  } catch (error) {
    console.error('Error actualizando tag:', error);
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
