import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getTagAuditHistory } from '@/lib/firebase/tags-sync';

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
    const tagId = url.searchParams.get('tagId');

    if (!tagId) {
      return NextResponse.json(
        { error: 'tagId es requerido' },
        { status: 400 }
      );
    }

    // Obtener historial de auditoría
    const auditHistory = await getTagAuditHistory(tagId);

    return NextResponse.json({ 
      success: true, 
      auditHistory 
    });

  } catch (error) {
    console.error('Error en /api/tags/audit-history:', error);
    
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
