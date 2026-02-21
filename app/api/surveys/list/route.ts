import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

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

    // Verificar que adminAuth y adminDb estén disponibles
    if (!adminAuth || !adminDb) {
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
    const residencialId = searchParams.get('residencialId');

    let surveys = [];
    let stats = null;

    if (residencialId) {
      // Obtener encuestas de un residencial específico
      const encuestasSnapshot = await adminDb
        .collection('residenciales')
        .doc(residencialId)
        .collection('encuestas')
        .orderBy('fechaCreacion', 'desc')
        .get();

      surveys = encuestasSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          titulo: data.titulo || 'Sin título',
          descripcion: data.descripcion || '',
          fechaCreacion: data.fechaCreacion || new Date().toISOString(),
          fechaFin: data.fechaFin || new Date().toISOString(),
          status: data.status || 'pending',
          totalRespuestas: data.totalRespuestas || 0,
          preguntas: data.preguntas || [],
          creadorUid: data.creadorUid || '',
          residencialId: data.residencialId || '',
          residencialDocId: residencialId
        };
      });
    } else {
      // Obtener todas las encuestas de todos los residenciales
      const residencialesSnapshot = await adminDb.collection('residenciales').get();
      let totalResponses = 0;

      for (const residencialDoc of residencialesSnapshot.docs) {
        const encuestasSnapshot = await residencialDoc.ref.collection('encuestas').get();

        for (const encuestaDoc of encuestasSnapshot.docs) {
          const data = encuestaDoc.data();
          const survey = {
            id: encuestaDoc.id,
            titulo: data.titulo || 'Sin título',
            descripcion: data.descripcion || '',
            fechaCreacion: data.fechaCreacion || new Date().toISOString(),
            fechaFin: data.fechaFin || new Date().toISOString(),
            status: data.status || 'pending',
            totalRespuestas: data.totalRespuestas || 0,
            preguntas: data.preguntas || [],
            creadorUid: data.creadorUid || '',
            residencialId: data.residencialId || '',
            residencialDocId: residencialDoc.id
          };

          surveys.push(survey);
          totalResponses += survey.totalRespuestas;
        }
      }

      // Ordenar por fecha de creación (más recientes primero)
      surveys.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());

      // Calcular estadísticas
      const now = new Date();
      const activeSurveys = surveys.filter(survey => {
        const endDate = new Date(survey.fechaFin);
        return survey.status === 'pending' && endDate > now;
      }).length;

      const completedSurveys = surveys.filter(survey => {
        const endDate = new Date(survey.fechaFin);
        return survey.status === 'concluida' || endDate <= now;
      }).length;

      stats = {
        totalSurveys: surveys.length,
        activeSurveys,
        completedSurveys,
        totalResponses
      };
    }

    return NextResponse.json({
      success: true,
      surveys,
      stats
    });

  } catch (error: any) {
    console.error('Error getting surveys:', error);
    return NextResponse.json({
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}
