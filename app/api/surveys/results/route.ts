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

    if (!surveyId || !residencialDocId) {
      return NextResponse.json({ 
        error: 'Parámetros requeridos: surveyId, residencialDocId' 
      }, { status: 400 });
    }

    // Obtener la encuesta
    const surveyDoc = await adminDb
      .collection('residenciales')
      .doc(residencialDocId)
      .collection('encuestas')
      .doc(surveyId)
      .get();

    if (!surveyDoc.exists) {
      return NextResponse.json(
        { error: 'Encuesta no encontrada' },
        { status: 404 }
      );
    }

    const surveyData = surveyDoc.data()!;
    const survey = {
      id: surveyDoc.id,
      titulo: surveyData.titulo || 'Sin título',
      descripcion: surveyData.descripcion || '',
      fechaCreacion: surveyData.fechaCreacion || new Date().toISOString(),
      fechaFin: surveyData.fechaFin || new Date().toISOString(),
      status: surveyData.status || 'pending',
      totalRespuestas: surveyData.totalRespuestas || 0,
      preguntas: surveyData.preguntas || [],
      creadorUid: surveyData.creadorUid || '',
      residencialId: surveyData.residencialId || '',
      residencialDocId
    };

    // Obtener todas las respuestas con información de usuarios
    const responses = [];
    const respuestas = surveyData.respuestas || {};
    
    // Obtener información de usuarios en paralelo
    const userIds = Object.keys(respuestas);
    const userPromises = userIds.map(async (userId) => {
      try {
        const userDoc = await adminDb.collection('usuarios').doc(userId).get();
        const userData = userDoc.data();
        return {
          userId,
          userName: userData?.nombre || userData?.displayName || 'Usuario',
          userEmail: userData?.email || '',
          userRole: userData?.rol || 'residente'
        };
      } catch (error) {
        console.error(`Error getting user ${userId}:`, error);
        return {
          userId,
          userName: 'Usuario',
          userEmail: '',
          userRole: 'residente'
        };
      }
    });

    const userInfos = await Promise.all(userPromises);
    const userMap = new Map(userInfos.map(info => [info.userId, info]));
    
    for (const [userId, responseData] of Object.entries(respuestas)) {
      const userInfo = userMap.get(userId);
      responses.push({
        userId,
        userName: userInfo?.userName || 'Usuario',
        userEmail: userInfo?.userEmail || '',
        userRole: userInfo?.userRole || 'residente',
        submittedAt: (responseData as any).submittedAt,
        answers: (responseData as any).answers || []
      });
    }

    // Calcular estadísticas básicas
    const totalResponses = responses.length;
    const questionResults = survey.preguntas.map((question, index) => {
      const questionResponses = responses
        .map(response => response.answers[index])
        .filter(answer => answer !== null && answer !== undefined);

      // Calcular estadísticas específicas por tipo de pregunta
      let results: any = {
        type: question.tipo,
        responses: questionResponses,
        total: questionResponses.length
      };

      switch (question.tipo) {
        case 'textoLibre':
          // Para texto libre, procesar las respuestas para extraer el texto
          results.responses = questionResponses.map((response: any) => {
            if (typeof response === 'string') {
              return response;
            } else if (response && typeof response === 'object') {
              // Si es un objeto con 'value', extraer el valor
              return response.value || response.text || JSON.stringify(response);
            } else {
              return String(response || '');
            }
          });
          break;

        case 'siNo':
          const siNoCounts = questionResponses.reduce((acc: any, response: any) => {
            const value = response?.toString().toLowerCase() || '';
            acc[value] = (acc[value] || 0) + 1;
            return acc;
          }, {});
          results.counts = siNoCounts;
          break;

        case 'opcionUnica':
          const singleOptionCounts = questionResponses.reduce((acc: any, response: any) => {
            let option = '';
            if (typeof response === 'string') {
              option = response;
            } else if (response && typeof response === 'object') {
              // Si es un objeto con 'value', extraer el valor
              option = response.value || response.text || '';
            } else {
              option = String(response || '');
            }
            
            if (option) {
              acc[option] = (acc[option] || 0) + 1;
            }
            return acc;
          }, {});
          results.counts = singleOptionCounts;
          results.options = question.opciones || [];
          break;

        case 'opcionMultiple':
          const multipleOptionCounts = questionResponses.reduce((acc: any, response: any) => {
            let options: any[] = [];
            
            if (Array.isArray(response)) {
              // Si es un array directo
              options = response;
            } else if (response && typeof response === 'object') {
              // Si es un objeto con 'selectedOptions' o 'value'
              if (response.selectedOptions && Array.isArray(response.selectedOptions)) {
                options = response.selectedOptions;
              } else if (response.value && Array.isArray(response.value)) {
                options = response.value;
              } else if (response.value && typeof response.value === 'string') {
                options = [response.value];
              }
            } else if (typeof response === 'string') {
              options = [response];
            }
            
            // Contar cada opción seleccionada
            options.forEach((option: any) => {
              const optionStr = String(option || '');
              if (optionStr) {
                acc[optionStr] = (acc[optionStr] || 0) + 1;
              }
            });
            
            return acc;
          }, {});
          results.counts = multipleOptionCounts;
          results.options = question.opciones || [];
          break;

        case 'escalaLikert':
          const likertValues = questionResponses.map((r: any) => parseInt(r) || 0).filter((v: number) => v >= 1 && v <= 5);
          const distribution = likertValues.reduce((acc: any, value: number) => {
            acc[value] = (acc[value] || 0) + 1;
            return acc;
          }, {});
          const average = likertValues.length > 0 ? likertValues.reduce((sum: number, val: number) => sum + val, 0) / likertValues.length : 0;
          results.distribution = distribution;
          results.average = average;
          break;

        case 'escalaNumero':
          const numericValues = questionResponses.map((r: any) => parseFloat(r) || 0);
          const numericAverage = numericValues.length > 0 ? numericValues.reduce((sum: number, val: number) => sum + val, 0) / numericValues.length : 0;
          const min = numericValues.length > 0 ? Math.min(...numericValues) : 0;
          const max = numericValues.length > 0 ? Math.max(...numericValues) : 0;
          results.average = numericAverage;
          results.min = min;
          results.max = max;
          break;

        case 'deslizante':
          const sliderValues = questionResponses.map((r: any) => parseFloat(r) || 0);
          const sliderAverage = sliderValues.length > 0 ? sliderValues.reduce((sum: number, val: number) => sum + val, 0) / sliderValues.length : 0;
          results.average = sliderAverage;
          results.minValue = question.minValue || 0;
          results.maxValue = question.maxValue || 100;
          break;
      }

      return {
        questionIndex: index,
        question: question.pregunta,
        type: question.tipo,
        results
      };
    });

    // Calcular tasa de respuesta
    const residencialDoc = await adminDb.collection('residenciales').doc(residencialDocId).get();
    const residencialData = residencialDoc.data();
    const residencialCode = residencialData?.residencialID;
    
    let totalUsers = 0;
    if (residencialCode) {
      const usersSnapshot = await adminDb
        .collection('usuarios')
        .where('residencialID', '==', residencialCode)
        .where('rol', '==', 'residente')
        .get();
      totalUsers = usersSnapshot.size;
    }

    const responseRate = totalUsers > 0 ? (totalResponses / totalUsers) * 100 : 0;

    const results = {
      survey,
      responses,
      stats: {
        totalResponses,
        responseRate,
        questionResults
      }
    };

    return NextResponse.json(results);

  } catch (error: any) {
    console.error('Error getting survey results:', error);
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 });
  }
}
