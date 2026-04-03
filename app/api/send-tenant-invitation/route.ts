import { NextRequest, NextResponse } from 'next/server';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase/config';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];
    if (!adminAuth) {
      return NextResponse.json({ error: 'Servicio de autenticación no disponible' }, { status: 500 });
    }

    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const { admin, superadmin, isAdmin, role } = decodedToken;

      // Verificar permisos: admins, superadmins o el dueño del residencial/unidad
      if (!admin && !superadmin && !isAdmin && role !== 'admin_residencial') {
        return NextResponse.json({ error: 'Permisos insuficientes para enviar invitaciones' }, { status: 403 });
      }
    } catch (authError) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }

    const body = await request.json();

    // Validar datos requeridos
    const requiredFields = [
      'ownerName', 'ownerEmail', 'tenantName', 'tenantEmail',
      'invitationCode', 'residencialName', 'calle', 'houseNumber'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo requerido faltante: ${field}` },
          { status: 400 }
        );
      }
    }

    // En desarrollo, simular el envío de correo
    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 [DEV] Simulando envío de correo de invitación:', {
        to: body.tenantEmail,
        invitationCode: body.invitationCode,
        ownerName: body.ownerName,
        tenantName: body.tenantName,
      });

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));

      return NextResponse.json({
        success: true,
        message: 'Correo de invitación enviado (simulado en desarrollo)',
        data: {
          invitationCode: body.invitationCode,
          tenantEmail: body.tenantEmail,
        }
      });
    }

    // En producción, llamar a Firebase Function
    try {
      const functions = getFunctions(app, 'us-central1');
      const sendTenantInvitationEmail = httpsCallable(functions, 'sendTenantInvitationEmail');

      const result = await sendTenantInvitationEmail({
        ownerName: body.ownerName,
        ownerEmail: body.ownerEmail,
        tenantName: body.tenantName,
        tenantEmail: body.tenantEmail,
        invitationCode: body.invitationCode,
        residencialName: body.residencialName,
        calle: body.calle,
        houseNumber: body.houseNumber,
        isPrimaryUser: body.isPrimaryUser || false,
      });

      return NextResponse.json({
        success: true,
        data: result.data
      });
    } catch (firebaseError: any) {
      console.error('Error en Firebase Function:', firebaseError);

      // Si falla Firebase Function, simular envío exitoso para desarrollo
      if (process.env.NODE_ENV !== 'production') {
        console.log('📧 [DEV] Firebase Function falló, simulando envío exitoso');
        return NextResponse.json({
          success: true,
          message: 'Correo enviado (simulado debido a error de Firebase)',
          data: {
            invitationCode: body.invitationCode,
            tenantEmail: body.tenantEmail,
          }
        });
      }

      throw firebaseError;
    }

  } catch (error: any) {
    console.error('Error en API route send-tenant-invitation:', error);

    return NextResponse.json(
      {
        error: 'Error enviando correo de invitación',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 