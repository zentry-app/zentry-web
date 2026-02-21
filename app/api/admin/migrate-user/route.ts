import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

interface ValidationResult {
  found: boolean;
  user: {
    uid: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
    residencialID: string;
    residencialName?: string;
    houseNumber: string;
    isActive: boolean;
    createdAt?: string;
  } | null;
  relatedData: {
    pagos: number;
    reservaciones: number;
    ingresos: number;
    tags: number;
    chats: number;
    messageNotifications: number;
    supportTickets: number;
    supportConversations: number;
  } | null;
}

interface MigrationResult {
  success: boolean;
  migratedData: {
    pagos: number;
    reservaciones: number;
    ingresos: number;
    tags: number;
    chats: number;
    messageNotifications: number;
    supportTickets: number;
    supportConversations: number;
  };
  sourceDeactivated: boolean;
  errors: string[];
}

async function validateUser(email: string): Promise<ValidationResult> {
  console.log(`🔍 [Migrate User] Validando usuario: ${email}`);

  const result: ValidationResult = {
    found: false,
    user: null,
    relatedData: null
  };

  try {
    // Buscar usuario en Firebase Auth
    const auth = adminAuth;
    const db = adminDb;
    if (!auth || !db) {
      throw new Error('Firebase Admin no inicializado');
    }
    const authUser = await auth.getUserByEmail(email);
    console.log(`✅ [Migrate User] Usuario encontrado en Auth: ${authUser.uid}`);

    // Buscar documento en Firestore
    const userDoc = await db.collection('usuarios').doc(authUser.uid).get();

    if (!userDoc.exists) {
      console.log(`⚠️ [Migrate User] Usuario no encontrado en Firestore`);
      return result;
    }

    const userData = userDoc.data()!;
    const residencialId = userData.residencialID || userData.residencialDocId;

    // Obtener nombre del residencial
    let residencialName = '';
    if (residencialId) {
      try {
        const residencialDoc = await db.collection('residenciales').doc(residencialId).get();
        if (residencialDoc.exists) {
          residencialName = residencialDoc.data()?.nombre || residencialDoc.data()?.name || '';
        }
      } catch (e) {
        console.log(`⚠️ [Migrate User] No se pudo obtener nombre del residencial`);
      }
    }

    result.found = true;
    result.user = {
      uid: authUser.uid,
      email: authUser.email || email,
      fullName: userData.fullName || userData.nombre || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      role: userData.role || 'resident',
      status: userData.status || 'pending',
      residencialID: residencialId || '',
      residencialName: residencialName,
      houseNumber: userData.houseNumber || userData.numeroCasa || '',
      isActive: userData.isActive !== false,
      createdAt: userData.createdAt?.toDate?.()?.toISOString() || undefined
    };

    // Contar datos relacionados - Las subcolecciones están dentro del documento del usuario
    const userRef = db.collection('usuarios').doc(authUser.uid);

    const [
      historialIngresosSnap,
      historialSalidasSnap,
      reservacionesSnap,
      notificacionesSnap
    ] = await Promise.all([
      userRef.collection('historialIngresos').count().get(),
      userRef.collection('historialSalidas').count().get(),
      userRef.collection('reservaciones').count().get(),
      userRef.collection('notificaciones').count().get()
    ]);

    // También buscar en colecciones del residencial si existe
    let residencialData = {
      pagos: 0,
      tags: 0,
      chats: 0,
      messageNotifications: 0,
      supportTickets: 0,
      supportConversations: 0
    };

    if (residencialId && adminDb) {
      try {
        const residencialRef = db.collection('residenciales').doc(residencialId);
        const [
          pagosSnap,
          tagsSnap,
          chatsSnap,
          messageNotificationsSnap,
          supportTicketsSnap,
          supportConversationsSnap
        ] = await Promise.all([
          residencialRef.collection('pagos').where('userId', '==', authUser.uid).count().get(),
          residencialRef.collection('tags').where('userId', '==', authUser.uid).count().get(),
          residencialRef.collection('chats').where('participants', 'array-contains', authUser.uid).count().get(),
          residencialRef.collection('messageNotifications').where('userId', '==', authUser.uid).count().get(),
          residencialRef.collection('supportTickets').where('userId', '==', authUser.uid).count().get(),
          residencialRef.collection('supportConversations').where('userId', '==', authUser.uid).count().get()
        ]);
        residencialData = {
          pagos: pagosSnap.data().count,
          tags: tagsSnap.data().count,
          chats: chatsSnap.data().count,
          messageNotifications: messageNotificationsSnap.data().count,
          supportTickets: supportTicketsSnap.data().count,
          supportConversations: supportConversationsSnap.data().count
        };
      } catch (e) {
        console.log(`⚠️ [Migrate User] Error contando datos del residencial:`, e);
      }
    }

    result.relatedData = {
      pagos: residencialData.pagos,
      reservaciones: reservacionesSnap.data().count,
      ingresos: historialIngresosSnap.data().count + historialSalidasSnap.data().count,
      tags: residencialData.tags,
      chats: residencialData.chats,
      messageNotifications: notificacionesSnap.data().count + residencialData.messageNotifications,
      supportTickets: residencialData.supportTickets,
      supportConversations: residencialData.supportConversations
    };

    console.log(`📊 [Migrate User] Datos relacionados:`, result.relatedData);

  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log(`ℹ️ [Migrate User] Usuario NO encontrado en Auth`);
    } else {
      console.error(`❌ [Migrate User] Error validando usuario:`, error);
      throw error;
    }
  }

  return result;
}

async function getMigrationHistory(): Promise<any[]> {
  console.log(`📋 [Migrate User] Obteniendo historial de migraciones...`);

  try {
    if (!adminDb) {
      throw new Error('Firestore admin no inicializado');
    }
    const historySnap = await adminDb.collection('migrationHistory')
      .orderBy('migratedAt', 'desc')
      .limit(50)
      .get();

    const history = historySnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      migratedAt: doc.data().migratedAt?.toDate?.()?.toISOString() || null
    }));

    console.log(`📋 [Migrate User] ${history.length} registros encontrados`);
    return history;
  } catch (error) {
    console.error(`❌ [Migrate User] Error obteniendo historial:`, error);
    return [];
  }
}

async function migrateUser(
  sourceUid: string,
  destUid: string,
  residencialId: string,
  performedBy?: string
): Promise<MigrationResult> {
  console.log(`🔄 [Migrate User] Iniciando migración: ${sourceUid} -> ${destUid}`);

  const db = adminDb;
  if (!db) {
    throw new Error('Firestore admin no inicializado');
  }

  const result: MigrationResult = {
    success: false,
    migratedData: {
      pagos: 0,
      reservaciones: 0,
      ingresos: 0,
      tags: 0,
      chats: 0,
      messageNotifications: 0,
      supportTickets: 0,
      supportConversations: 0
    },
    sourceDeactivated: false,
    errors: []
  };

  const sourceUserRef = db.collection('usuarios').doc(sourceUid);
  const destUserRef = db.collection('usuarios').doc(destUid);
  const residencialRef = db.collection('residenciales').doc(residencialId);

  let batch = db.batch();
  let operationsCount = 0;
  const MAX_BATCH_SIZE = 450; // Firestore limit is 500, leaving margin

  // Helper to commit batch when it gets large
  const commitBatchIfNeeded = async () => {
    if (operationsCount >= MAX_BATCH_SIZE) {
      await batch.commit();
      batch = db.batch(); // Create new batch
      operationsCount = 0;
      console.log(`📦 [Migrate User] Batch committed`);
    }
  };

  // Helper to copy a subcollection from source user to dest user
  const copySubcollection = async (collectionName: string): Promise<number> => {
    let count = 0;
    const sourceCollection = await sourceUserRef.collection(collectionName).get();

    for (const doc of sourceCollection.docs) {
      const destDocRef = destUserRef.collection(collectionName).doc(doc.id);
      batch.set(destDocRef, {
        ...doc.data(),
        migratedFrom: sourceUid,
        migratedAt: FieldValue.serverTimestamp()
      });
      // Mark source as migrated (optional: could delete instead)
      batch.update(doc.ref, {
        migratedTo: destUid,
        migratedAt: FieldValue.serverTimestamp()
      });
      operationsCount += 2;
      count++;
      await commitBatchIfNeeded();
    }
    return count;
  };

  try {
    // 1. Migrar subcolecciones del usuario
    console.log(`📋 [Migrate User] Migrando historialIngresos...`);
    const historialIngresosCount = await copySubcollection('historialIngresos');
    result.migratedData.ingresos += historialIngresosCount;

    console.log(`📋 [Migrate User] Migrando historialSalidas...`);
    const historialSalidasCount = await copySubcollection('historialSalidas');
    result.migratedData.ingresos += historialSalidasCount;

    console.log(`📅 [Migrate User] Migrando reservaciones del usuario...`);
    const reservacionesUserCount = await copySubcollection('reservaciones');
    result.migratedData.reservaciones += reservacionesUserCount;

    console.log(`🔔 [Migrate User] Migrando notificaciones del usuario...`);
    const notificacionesCount = await copySubcollection('notificaciones');
    result.migratedData.messageNotifications += notificacionesCount;

    // 2. Migrar datos en colecciones del residencial (si existen)
    // Pagos
    console.log(`💰 [Migrate User] Migrando pagos del residencial...`);
    try {
      const pagosSnap = await residencialRef.collection('pagos')
        .where('userId', '==', sourceUid).get();

      for (const doc of pagosSnap.docs) {
        batch.update(doc.ref, {
          userId: destUid,
          migratedFrom: sourceUid,
          migratedAt: FieldValue.serverTimestamp()
        });
        operationsCount++;
        result.migratedData.pagos++;
        await commitBatchIfNeeded();
      }
    } catch (e) {
      console.log(`⚠️ [Migrate User] Error migrando pagos:`, e);
    }

    // Tags
    console.log(`🏷️ [Migrate User] Migrando tags...`);
    try {
      const tagsSnap = await residencialRef.collection('tags')
        .where('userId', '==', sourceUid).get();

      for (const doc of tagsSnap.docs) {
        batch.update(doc.ref, {
          userId: destUid,
          migratedFrom: sourceUid,
          migratedAt: FieldValue.serverTimestamp()
        });
        operationsCount++;
        result.migratedData.tags++;
        await commitBatchIfNeeded();
      }
    } catch (e) {
      console.log(`⚠️ [Migrate User] Error migrando tags:`, e);
    }

    // Chats (actualizar array de participantes)
    console.log(`💬 [Migrate User] Migrando chats...`);
    try {
      const chatsSnap = await residencialRef.collection('chats')
        .where('participants', 'array-contains', sourceUid).get();

      for (const doc of chatsSnap.docs) {
        const chatData = doc.data();
        const updatedParticipants = (chatData.participants || []).map((p: string) =>
          p === sourceUid ? destUid : p
        );
        batch.update(doc.ref, {
          participants: updatedParticipants,
          migratedFrom: sourceUid,
          migratedAt: FieldValue.serverTimestamp()
        });
        operationsCount++;
        result.migratedData.chats++;
        await commitBatchIfNeeded();
      }
    } catch (e) {
      console.log(`⚠️ [Migrate User] Error migrando chats:`, e);
    }

    // Message notifications del residencial
    console.log(`🔔 [Migrate User] Migrando notificaciones de mensajes del residencial...`);
    try {
      const messageNotificationsSnap = await residencialRef.collection('messageNotifications')
        .where('userId', '==', sourceUid).get();

      for (const doc of messageNotificationsSnap.docs) {
        batch.update(doc.ref, {
          userId: destUid,
          migratedFrom: sourceUid,
          migratedAt: FieldValue.serverTimestamp()
        });
        operationsCount++;
        result.migratedData.messageNotifications++;
        await commitBatchIfNeeded();
      }
    } catch (e) {
      console.log(`⚠️ [Migrate User] Error migrando messageNotifications:`, e);
    }

    // Support tickets
    console.log(`🎫 [Migrate User] Migrando tickets de soporte...`);
    try {
      const supportTicketsSnap = await residencialRef.collection('supportTickets')
        .where('userId', '==', sourceUid).get();

      for (const doc of supportTicketsSnap.docs) {
        batch.update(doc.ref, {
          userId: destUid,
          migratedFrom: sourceUid,
          migratedAt: FieldValue.serverTimestamp()
        });
        operationsCount++;
        result.migratedData.supportTickets++;
        await commitBatchIfNeeded();
      }
    } catch (e) {
      console.log(`⚠️ [Migrate User] Error migrando supportTickets:`, e);
    }

    // Support conversations
    console.log(`💭 [Migrate User] Migrando conversaciones de soporte...`);
    try {
      const supportConversationsSnap = await residencialRef.collection('supportConversations')
        .where('userId', '==', sourceUid).get();

      for (const doc of supportConversationsSnap.docs) {
        batch.update(doc.ref, {
          userId: destUid,
          migratedFrom: sourceUid,
          migratedAt: FieldValue.serverTimestamp()
        });
        operationsCount++;
        result.migratedData.supportConversations++;
        await commitBatchIfNeeded();
      }
    } catch (e) {
      console.log(`⚠️ [Migrate User] Error migrando supportConversations:`, e);
    }

    // Support rate limits (documento a nivel raíz)
    try {
      const rateLimitDoc = await db.collection('supportRateLimits').doc(sourceUid).get();
      if (rateLimitDoc.exists) {
        const rateLimitData = rateLimitDoc.data();
        batch.set(db.collection('supportRateLimits').doc(destUid), {
          ...rateLimitData,
          migratedFrom: sourceUid,
          migratedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        batch.delete(rateLimitDoc.ref);
        operationsCount += 2;
      }
    } catch (e) {
      console.log(`⚠️ [Migrate User] No se pudo migrar supportRateLimits`);
    }

    // 10. Desactivar cuenta origen
    console.log(`🔒 [Migrate User] Desactivando cuenta origen...`);
    batch.update(sourceUserRef, {
      isActive: false,
      deactivatedAt: FieldValue.serverTimestamp(),
      deactivatedBy: 'migration-tool',
      deactivationReason: `Migrado a cuenta: ${destUid}`,
      migratedTo: destUid,
      migratedAt: FieldValue.serverTimestamp()
    });
    operationsCount++;
    result.sourceDeactivated = true;

    // Commit final
    if (operationsCount > 0) {
      await batch.commit();
      console.log(`📦 [Migrate User] Batch final committed (${operationsCount} operaciones)`);
    }

    result.success = true;
    console.log(`✅ [Migrate User] Migración completada exitosamente`);

    // Guardar en historial de migraciones
    try {
      const sourceUserDoc = await db.collection('usuarios').doc(sourceUid).get();
      const destUserDoc = await db.collection('usuarios').doc(destUid).get();
      const sourceData = sourceUserDoc.data();
      const destData = destUserDoc.data();

      // Obtener nombre del residencial
      let residencialName = '';
      try {
        const residencialDoc = await db.collection('residenciales').doc(residencialId).get();
        if (residencialDoc.exists) {
          residencialName = residencialDoc.data()?.nombre || residencialDoc.data()?.name || '';
        }
      } catch (e) {
        console.log(`⚠️ [Migrate User] No se pudo obtener nombre del residencial para historial`);
      }

      if (!adminDb) {
        throw new Error('Firestore admin no inicializado');
      }
      await db.collection('migrationHistory').add({
        sourceUid,
        sourceEmail: sourceData?.email || 'N/A',
        sourceName: sourceData?.fullName || sourceData?.nombre || 'N/A',
        destUid,
        destEmail: destData?.email || 'N/A',
        destName: destData?.fullName || destData?.nombre || 'N/A',
        residencialId,
        residencialName,
        migratedData: result.migratedData,
        performedBy: performedBy || 'unknown',
        migratedAt: FieldValue.serverTimestamp(),
        success: true
      });
      console.log(`📝 [Migrate User] Historial guardado`);
    } catch (historyError) {
      console.error(`⚠️ [Migrate User] Error guardando historial:`, historyError);
      result.errors.push('No se pudo guardar el historial de migración');
    }

  } catch (error: any) {
    console.error(`❌ [Migrate User] Error en migración:`, error);
    result.errors.push(error.message || 'Error desconocido durante la migración');
  }

  return result;
}

export async function GET() {
  try {
    console.log('📋 [Migrate User] Obteniendo historial...');

    // Verificar si Firebase Admin está inicializado
    if (!adminDb) {
      return NextResponse.json(
        {
          error: 'Firebase Admin no está configurado',
          message: 'Las variables de entorno de Firebase no están configuradas'
        },
        { status: 500 }
      );
    }

    const history = await getMigrationHistory();
    return NextResponse.json({
      success: true,
      history
    });

  } catch (error) {
    console.error('❌ [Migrate User] Error obteniendo historial:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [Migrate User] Procesando solicitud...');

    // Verificar si Firebase Admin está inicializado
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        {
          error: 'Firebase Admin no está configurado',
          message: 'Las variables de entorno de Firebase no están configuradas'
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { action, email, sourceUid, destUid, residencialId, performedBy } = body;

    // 1. Verificar autenticación
    const authorization = request.headers.get('authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización ausente o inválido.' }, { status: 401 });
    }

    if (!adminAuth) {
      return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
    }

    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // 2. Verificar rol de administrador
    if (!decodedToken.admin && !decodedToken.superadmin && !decodedToken.isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado. Se requiere rol de administrador.' }, { status: 403 });
    }

    // Acción: Validar usuario
    if (action === 'validate') {
      if (!email) {
        return NextResponse.json(
          { error: 'Email es requerido para validar' },
          { status: 400 }
        );
      }

      const validation = await validateUser(email);
      return NextResponse.json({
        success: true,
        validation
      });
    }

    // Acción: Migrar usuario
    if (action === 'migrate') {
      if (!sourceUid || !destUid || !residencialId) {
        return NextResponse.json(
          { error: 'Se requieren sourceUid, destUid y residencialId para migrar' },
          { status: 400 }
        );
      }

      if (sourceUid === destUid) {
        return NextResponse.json(
          { error: 'Los usuarios origen y destino no pueden ser el mismo' },
          { status: 400 }
        );
      }

      const result = await migrateUser(sourceUid, destUid, residencialId, performedBy);
      return NextResponse.json({
        success: result.success,
        result
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida. Use "validate" o "migrate"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ [Migrate User] Error general:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
