import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

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

    const body = await request.json();
    const { titulo, descripcion, fechaFin, preguntas, residencialId, creadorUid } = body;

    // Validar datos requeridos
    if (!titulo || !descripcion || !fechaFin || !preguntas || !residencialId || !creadorUid) {
      return NextResponse.json({
        error: 'Faltan datos requeridos: titulo, descripcion, fechaFin, preguntas, residencialId, creadorUid'
      }, { status: 400 });
    }

    // Validar que haya al menos una pregunta
    if (!Array.isArray(preguntas) || preguntas.length === 0) {
      return NextResponse.json({
        error: 'Debe haber al menos una pregunta'
      }, { status: 400 });
    }

    // Validar estructura de preguntas
    for (let i = 0; i < preguntas.length; i++) {
      const pregunta = preguntas[i];
      if (!pregunta.pregunta || !pregunta.tipo) {
        return NextResponse.json({
          error: `Pregunta ${i + 1}: falta texto o tipo`
        }, { status: 400 });
      }

      // Validar opciones para preguntas de selección
      if (['opcionUnica', 'opcionMultiple'].includes(pregunta.tipo)) {
        if (!pregunta.opciones || pregunta.opciones.length < 2) {
          return NextResponse.json({
            error: `Pregunta ${i + 1}: debe tener al menos 2 opciones`
          }, { status: 400 });
        }
      }
    }

    // Validar fecha límite
    const fechaFinDate = new Date(fechaFin);
    const now = new Date();
    // Permitir fechas futuras con un margen de 1 minuto para evitar problemas de timing
    const oneMinuteFromNow = new Date(now.getTime() + 60000);

    if (isNaN(fechaFinDate.getTime()) || fechaFinDate <= oneMinuteFromNow) {
      return NextResponse.json({
        error: 'La fecha límite debe ser válida y al menos 1 minuto en el futuro'
      }, { status: 400 });
    }

    // Buscar el documento del residencial por código o ID
    let residencialDoc;
    let residencialData;
    let residencialCode;

    // Primero intentar buscar por ID del documento
    residencialDoc = await adminDb.collection('residenciales').doc(residencialId).get();

    if (residencialDoc.exists) {
      residencialData = residencialDoc.data();
      residencialCode = residencialData?.residencialID;
    } else {
      // Si no existe por ID, buscar por código
      const residencialesSnapshot = await adminDb
        .collection('residenciales')
        .where('residencialID', '==', residencialId)
        .limit(1)
        .get();

      if (residencialesSnapshot.empty) {
        return NextResponse.json(
          { error: 'Residencial no encontrado' },
          { status: 404 }
        );
      }

      residencialDoc = residencialesSnapshot.docs[0];
      residencialData = residencialDoc.data();
      residencialCode = residencialData?.residencialID;
    }

    if (!residencialCode) {
      return NextResponse.json(
        { error: 'Código de residencial no encontrado' },
        { status: 400 }
      );
    }

    // Crear la encuesta usando el ID del documento del residencial
    const residencialDocId = residencialDoc.id;
    const surveyRef = await adminDb
      .collection('residenciales')
      .doc(residencialDocId)
      .collection('encuestas')
      .add({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fechaFin: fechaFinDate.toISOString(),
        preguntas,
        residencialId: residencialCode,
        creadorUid,
        fechaCreacion: new Date().toISOString(),
        status: 'pending',
        totalRespuestas: 0,
        respuestas: {},
        residencialDocId: residencialDocId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

    // Enviar notificaciones usando Cloud Function (mismo patrón que comunicados)
    console.log('🔔 [SURVEY] Enviando notificaciones usando Cloud Function');
    try {
      // Importar Firebase Admin SDK para llamar Cloud Functions
      const admin = require('firebase-admin');

      // Preparar los datos para la Cloud Function
      const surveyNotificationData = {
        residencialId: residencialCode,
        surveyId: surveyRef.id,
        titulo: titulo.trim(),
        fechaFin: fechaFinDate.toISOString()
      };

      console.log('🔔 [SURVEY] Llamando a sendSurveyNotification con:', surveyNotificationData);

      // Nota: En un entorno de producción, esto debería ser llamado desde el cliente
      // usando Firebase Functions httpsCallable. Aquí lo hacemos directamente
      // desde el servidor usando el Admin SDK.

      // Por ahora, crearemos las notificaciones locales directamente
      const usersSnapshot = await adminDb
        .collection('usuarios')
        .where('residencialID', '==', residencialCode)
        .get();

      console.log(`🔔 [SURVEY] Encontrados ${usersSnapshot.docs.length} usuarios para notificar`);

      const batch = adminDb.batch();
      for (const userDoc of usersSnapshot.docs) {
        const notifRef = adminDb
          .collection('usuarios')
          .doc(userDoc.id)
          .collection('notificaciones')
          .doc();

        batch.set(notifRef, {
          title: 'Nueva encuesta disponible',
          body: `Hay una nueva encuesta: "${titulo.trim()}" (Vence: ${fechaFinDate.toLocaleDateString('es-ES')})`,
          message: `Hay una nueva encuesta: "${titulo.trim()}" (Vence: ${fechaFinDate.toLocaleDateString('es-ES')})`,
          type: 'new_survey',
          icon: 'poll',
          data: {
            surveyId: surveyRef.id,
            surveyTitle: titulo.trim(),
            deadline: fechaFinDate.toISOString(),
            residencialId: residencialCode
          },
          timestamp: FieldValue.serverTimestamp(),
          read: false,
        });
      }
      await batch.commit();
      console.log(`✅ [SURVEY] ${usersSnapshot.docs.length} notificaciones locales creadas`);

      // Generar trackingId único
      const trackingId = adminDb.collection('notification_logs').doc().id;

      // Definir el tópico para las notificaciones push
      const topic = `category_${residencialCode}_announcement`;

      // Crear registro de log
      await adminDb.collection('notification_logs').doc(trackingId).set({
        trackingId: trackingId,
        type: 'new_survey',
        status: 'sent',
        userId: 'topic (' + topic + ')',
        title: '📊 Nueva Encuesta Disponible',
        body: `Hay una nueva encuesta: "${titulo.trim()}". ¡Comparte tu opinión!`,
        metadata: {
          type: 'new_survey',
          surveyId: surveyRef.id,
          surveyTitle: titulo.trim(),
          deadline: fechaFinDate.toISOString(),
          residencialId: residencialCode
        },
        sentAt: FieldValue.serverTimestamp(),
        platform: 'topic_push',
        topic: topic
      });

      // Enviar notificación push por tópico
      const message = {
        notification: {
          title: '📊 Nueva Encuesta Disponible',
          body: `Hay una nueva encuesta: "${titulo.trim()}". ¡Comparte tu opinión!`
        },
        data: {
          type: 'new_survey',
          surveyId: surveyRef.id,
          surveyTitle: titulo.trim(),
          deadline: fechaFinDate.toISOString(),
          residencialId: residencialCode,
          saveToUserCollection: 'true',
          trackingId: trackingId
        },
        topic: topic,
        apns: {
          payload: {
            aps: {
              sound: 'default',
              'content-available': 1,
            },
          },
          headers: {
            'apns-priority': '10',
          },
        },
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'high_importance_channel',
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log(`✅ [SURVEY] Notificación push enviada al tópico ${topic}. Message ID: ${response} (TrackingId: ${trackingId})`);

      // Actualizar log con messageId
      await adminDb.collection('notification_logs').doc(trackingId).update({
        messageId: response
      });

    } catch (notificationError) {
      console.error('❌ [SURVEY] Error enviando notificaciones:', notificationError);
      // No fallar la creación de la encuesta si falla el envío de notificaciones
    }

    return NextResponse.json({
      success: true,
      surveyId: surveyRef.id,
      message: 'Encuesta creada exitosamente'
    });

  } catch (error: any) {
    console.error('Error creating survey:', error);
    return NextResponse.json({
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}
