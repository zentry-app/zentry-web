import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
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

    // Verificar que el usuario sea admin
    if (!decodedToken.admin && !decodedToken.superadmin) {
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

    // Actualizar el estado del tag
    await updateTagStatusDirect(tagId, status, uid);

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