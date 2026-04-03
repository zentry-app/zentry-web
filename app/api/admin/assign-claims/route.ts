import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminAuth } from '@/lib/firebase/admin';

const SUPER_ADMIN_UID = "dpEPYUcuMYc7WgFM06iF6HY25rp2";

// URLs de las Cloud Functions
const SET_RESIDENCIAL_ADMIN_URL = "https://us-central1-zentryapp-949f4.cloudfunctions.net/setResidencialAdminStatus";

/**
 * API route para asignar automáticamente claims a un usuario basado en su rol y residencial.
 * Solo puede ser llamada por el superadministrador o internamente por el sistema.
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar si Firebase Admin está inicializado
    if (!adminAuth) {
      return NextResponse.json(
        { 
          error: 'Firebase Admin no está configurado',
          message: 'Las variables de entorno de Firebase no están configuradas'
        },
        { status: 500 }
      );
    }

    const authorization = request.headers.get('authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización ausente o inválido.' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const requesterRole = decodedToken.role;

    // 1. Verificar que quien llama es un administrador
    if (requesterRole !== 'admin' && requesterRole !== 'global_admin') {
      return NextResponse.json({ error: 'Acceso denegado. Se requiere rol de administrador.' }, { status: 403 });
    }

    const { targetUid, role } = await request.json();

    // 2. Validar parámetros requeridos
    if (!targetUid || !role) {
      return NextResponse.json({ error: 'targetUid y role son requeridos' }, { status: 400 });
    }

    // 3. Asignar claims basado en el rol
    if (role === 'security') {
      await getAuth().setCustomUserClaims(targetUid, { role: 'security' });
      console.log(`Claims { role: 'security' } asignados exitosamente a ${targetUid} por ${decodedToken.uid}`);
      
      return NextResponse.json({
        success: true,
        message: `Claims de seguridad asignados correctamente al usuario ${targetUid}.`
      });

    } else if (role === 'admin') {
      // Aquí iría la lógica para administradores de residencial si es diferente
      // Por ahora, es un ejemplo
      await getAuth().setCustomUserClaims(targetUid, { role: 'admin' });
      console.log(`Claims { role: 'admin' } asignados a ${targetUid} por ${decodedToken.uid}`);

      return NextResponse.json({
        success: true,
        message: `Claims de administrador asignados correctamente al usuario ${targetUid}.`
      });

    } else {
      return NextResponse.json({ error: `El rol '${role}' no es válido para asignar claims.` }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error in assign-claims API route:', error);
    // Manejo de errores específicos de Firebase
    if (error.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'El token ha expirado. Por favor, inicie sesión de nuevo.' }, { status: 401 });
    }
    if (error.code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Token de sesión inválido o malformado.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error interno del servidor', details: error.message }, { status: 500 });
  }
} 