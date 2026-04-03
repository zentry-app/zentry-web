import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      authMethod, 
      personalInfo, 
      residential, 
      documents 
    } = body;

    console.log('🚀 [API Register] Iniciando registro:', { authMethod: authMethod.method });

    // Validar datos requeridos
    if (!personalInfo.email || !personalInfo.firstName || !residential.residentialId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Para registro público, usar una Cloud Function o crear el usuario de forma diferente
    // Por ahora, vamos a devolver los datos para que el frontend maneje la creación
    
    const userData = {
      email: personalInfo.email,
      fullName: personalInfo.firstName,
      paternalLastName: personalInfo.paternalLastName || '',
      maternalLastName: personalInfo.maternalLastName || '',
      role: 'resident',
      status: 'pending',
      residencialId: residential.residentialId,
      residencialDocId: residential.residentialId,
      houseNumber: residential.houseNumber,
      signInProvider: authMethod.method,
      registrationMethod: authMethod.method,
      // Agregar URLs de documentos si existen
      identificacionUrl: documents?.identification?.url || null,
      comprobanteUrl: documents?.proof?.url || null,
    };

    console.log('✅ [API Register] Datos preparados para registro:', userData);

    // Devolver los datos para que el frontend los use
    return NextResponse.json({
      success: true,
      userData,
      message: 'Datos de registro validados exitosamente'
    });

  } catch (error: any) {
    console.error('❌ [API Register] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 