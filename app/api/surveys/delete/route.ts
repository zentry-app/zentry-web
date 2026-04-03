import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function DELETE(request: NextRequest) {
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

    // Verificar que el usuario sea admin
    if (!admin && !superadmin && !isAdmin) {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Se requiere rol de administrador.' },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get('surveyId');
    const residencialDocId = searchParams.get('residencialDocId');

    if (!surveyId) {
      return NextResponse.json({ 
        error: 'Parámetro requerido: surveyId' 
      }, { status: 400 });
    }

    // Eliminar la encuesta
    if (residencialDocId) {
      // Eliminar encuesta específica de un residencial
      await adminDb
        .collection('residenciales')
        .doc(residencialDocId)
        .collection('encuestas')
        .doc(surveyId)
        .delete();
    } else {
      // Buscar y eliminar encuesta en todos los residenciales
      const residencialesSnapshot = await adminDb.collection('residenciales').get();
      
      for (const residencialDoc of residencialesSnapshot.docs) {
        const encuestaDoc = await residencialDoc.ref
          .collection('encuestas')
          .doc(surveyId)
          .get();
        
        if (encuestaDoc.exists) {
          await encuestaDoc.ref.delete();
          break;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Encuesta eliminada exitosamente' 
    });

  } catch (error: any) {
    console.error('Error deleting survey:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}
