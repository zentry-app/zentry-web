import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [Cleanup User] Iniciando diagnóstico y limpieza de usuario');

    const body = await request.json();
    const { email, action } = body;

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

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    console.log(`🔍 [Cleanup User] Procesando email: ${email}, acción: ${action}`);

    // Verificar si Firebase Admin está inicializado
    if (!adminAuth || !adminDb || !adminStorage) {
      return NextResponse.json(
        {
          error: 'Firebase Admin no está configurado',
          message: 'Las variables de entorno de Firebase no están configuradas'
        },
        { status: 500 }
      );
    }

    const auth = adminAuth;
    const firestore = adminDb;
    const storage = adminStorage;
    const bucket = storage.bucket();

    let authUser = null;
    let firestoreUser = null;
    let storageFiles: string[] = [];

    // 1. Verificar en Firebase Authentication
    try {
      authUser = await auth.getUserByEmail(email);
      console.log(`✅ [Cleanup User] Usuario encontrado en Auth: ${authUser.uid}`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log(`ℹ️ [Cleanup User] Usuario NO encontrado en Auth`);
      } else {
        console.error(`❌ [Cleanup User] Error verificando Auth:`, error);
      }
    }

    // 2. Verificar en Firestore (colección usuarios)
    if (authUser) {
      try {
        const userDoc = await firestore.collection('usuarios').doc(authUser.uid).get();
        if (userDoc.exists) {
          firestoreUser = { id: userDoc.id, ...userDoc.data() };
          console.log(`✅ [Cleanup User] Usuario encontrado en Firestore: ${authUser.uid}`);
        } else {
          console.log(`ℹ️ [Cleanup User] Usuario NO encontrado en Firestore`);
        }
      } catch (error) {
        console.error(`❌ [Cleanup User] Error verificando Firestore:`, error);
      }
    }

    // 3. Buscar archivos en Storage
    try {
      const [files] = await bucket.getFiles({
        prefix: 'public_registration/',
      });

      for (const file of files) {
        const metadata = await file.getMetadata();
        const customMetadata = metadata[0]?.metadata;

        if (customMetadata?.email === email) {
          storageFiles.push(file.name);
        }
      }

      console.log(`🗂️ [Cleanup User] Archivos encontrados en Storage: ${storageFiles.length}`);
    } catch (error) {
      console.error(`❌ [Cleanup User] Error verificando Storage:`, error);
    }

    // Si solo es diagnóstico, retornar información
    if (action === 'diagnose' || !action) {
      return NextResponse.json({
        success: true,
        diagnosis: {
          email,
          authUser: authUser ? {
            uid: authUser.uid,
            email: authUser.email,
            displayName: authUser.displayName,
            emailVerified: authUser.emailVerified,
            disabled: authUser.disabled,
            creationTime: authUser.metadata.creationTime,
          } : null,
          firestoreUser: firestoreUser ? {
            uid: (firestoreUser as any).uid,
            role: (firestoreUser as any).role,
            status: (firestoreUser as any).status,
          } : null,
          storageFiles: storageFiles,
          canCleanup: !!(authUser || firestoreUser || storageFiles.length > 0)
        }
      });
    }

    // Si es limpieza, proceder a eliminar
    if (action === 'cleanup') {
      const results = {
        authDeleted: false,
        firestoreDeleted: false,
        storageFilesDeleted: 0,
        errors: [] as string[]
      };

      // Eliminar de Authentication
      if (authUser) {
        try {
          await auth.deleteUser(authUser.uid);
          results.authDeleted = true;
          console.log(`🗑️ [Cleanup User] Usuario eliminado de Auth: ${authUser.uid}`);
        } catch (error: any) {
          const errorMsg = `Error eliminando de Auth: ${error.message}`;
          results.errors.push(errorMsg);
          console.error(`❌ [Cleanup User] ${errorMsg}`);
        }
      }

      // Eliminar de Firestore
      if (firestoreUser) {
        try {
          await firestore.collection('usuarios').doc(authUser!.uid).delete();
          results.firestoreDeleted = true;
          console.log(`🗑️ [Cleanup User] Usuario eliminado de Firestore: ${authUser!.uid}`);
        } catch (error: any) {
          const errorMsg = `Error eliminando de Firestore: ${error.message}`;
          results.errors.push(errorMsg);
          console.error(`❌ [Cleanup User] ${errorMsg}`);
        }
      }

      // Eliminar archivos de Storage
      for (const fileName of storageFiles) {
        try {
          await bucket.file(fileName).delete();
          results.storageFilesDeleted++;
          console.log(`🗑️ [Cleanup User] Archivo eliminado: ${fileName}`);
        } catch (error: any) {
          const errorMsg = `Error eliminando archivo ${fileName}: ${error.message}`;
          results.errors.push(errorMsg);
          console.error(`❌ [Cleanup User] ${errorMsg}`);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Limpieza completada',
        results
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida. Use "diagnose" o "cleanup"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ [Cleanup User] Error general:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
} 