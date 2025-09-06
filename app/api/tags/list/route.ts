import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

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

    // Verificar que adminAuth esté disponible
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin no está configurado correctamente' },
        { status: 500 }
      );
    }

    // Verificar el token
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Verificar que el usuario sea admin
    if (!decodedToken.admin && !decodedToken.superadmin) {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Se requiere rol de administrador.' },
        { status: 403 }
      );
    }

    // Obtener parámetros de query
    const url = new URL(request.url);
    const residencialId = url.searchParams.get('residencialId') || 'S9G7TL';
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Obtener tags del residencial
    const residencialDocId = 'mCTs294LGLkGvL9TTvaQ'; // Residencial S9G7TL actual
    const tagsRef = adminDb!.collection('residenciales').doc(residencialDocId).collection('tags');
    
    let query = tagsRef.orderBy('createdAt', 'desc').limit(limit);
    
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const tags = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Obtener información de casas para enriquecer los datos
    const casasRef = adminDb!.collection('residenciales').doc(residencialDocId).collection('casas');
    const casasSnapshot = await casasRef.get();
    const casasMap = new Map();
    casasSnapshot.docs.forEach((doc: any) => {
      casasMap.set(doc.id, doc.data());
    });

    // Obtener información de paneles para enriquecer los datos
    const panelesRef = adminDb!.collection('residenciales').doc(residencialDocId).collection('paneles');
    const panelesSnapshot = await panelesRef.get();
    const panelesMap = new Map();
    panelesSnapshot.docs.forEach((doc: any) => {
      panelesMap.set(doc.id, doc.data());
    });

    // Enriquecer los tags con información de casas y paneles
    const enrichedTags = tags.map((tag: any) => {
      const casaInfo = casasMap.get(tag.ownerRef);
      const panelesInfo = tag.panels.map((panelId: any) => panelesMap.get(panelId)).filter(Boolean);
      
      return {
        ...tag,
        casaInfo: casaInfo ? {
          id: tag.ownerRef,
          nombre: casaInfo.nombre
        } : null,
        panelesInfo: panelesInfo.map((panel: any) => ({
          id: panel.id,
          nombre: panel.nombre,
          tipo: panel.tipo
        }))
      };
    });

    return NextResponse.json({
      success: true,
      tags: enrichedTags,
      total: enrichedTags.length,
      residencialId,
      filters: {
        status: status || 'todos',
        limit
      }
    });

  } catch (error) {
    console.error('Error en /api/tags/list:', error);
    
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
