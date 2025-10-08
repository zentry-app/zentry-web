import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function PATCH(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get('surveyId');
    const status = searchParams.get('status') as 'pending' | 'concluida';
    const residencialDocId = searchParams.get('residencialDocId');

    if (!surveyId || !status) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    if (residencialDocId) {
      // Actualizar encuesta específica de un residencial
      await adminDb
        .collection('residenciales')
        .doc(residencialDocId)
        .collection('encuestas')
        .doc(surveyId)
        .update({
          status,
          updatedAt: FieldValue.serverTimestamp()
        });
    } else {
      // Buscar encuesta en todos los residenciales
      const residencialesSnapshot = await adminDb.collection('residenciales').get();
      
      for (const residencialDoc of residencialesSnapshot.docs) {
        const encuestaDoc = await residencialDoc.ref
          .collection('encuestas')
          .doc(surveyId)
          .get();
        
        if (encuestaDoc.exists) {
          await encuestaDoc.ref.update({
            status,
            updatedAt: FieldValue.serverTimestamp()
          });
          break;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating survey status:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el estado de la encuesta' },
      { status: 500 }
    );
  }
}
