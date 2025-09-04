import * as admin from 'firebase-admin';

// Lee las credenciales de la cuenta de servicio desde una variable de entorno.
// ¡ASEGÚRATE de que esta variable de entorno esté configurada en tu entorno de despliegue (Vercel, etc.)
// y en tu archivo .env.local para desarrollo!
// El valor de la variable debe ser el CONTENIDO JSON de tu archivo de credenciales de Firebase.
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountJson) {
  console.error('FIREBASE_SERVICE_ACCOUNT_KEY no está configurada. El SDK de Firebase Admin no puede inicializarse.');
  // Puedes decidir si lanzar un error aquí o permitir que la app continúe
  // con la advertencia, dependiendo de si el admin SDK es crítico en todos los contextos.
}

// Inicializar Firebase Admin SDK solo si no hay aplicaciones ya inicializadas.
if (!admin.apps.length && serviceAccountJson) {
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Opcionalmente, puedes especificar la URL de tu base de datos si usas Realtime Database:
      // databaseURL: `https://<TU-PROYECTO-ID>.firebaseio.com`,
    });
    console.log('Firebase Admin SDK inicializado correctamente.');
  } catch (error) {
    console.error('Error al parsear FIREBASE_SERVICE_ACCOUNT_KEY o al inicializar Firebase Admin:', error);
  }
} else if (admin.apps.length) {
  console.log('Firebase Admin SDK ya estaba inicializado.');
}


// Exportar los servicios de admin que necesites.
// Si solo necesitas auth por ahora, solo exporta eso.
export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null; // Si también vas a usar Firestore desde el admin SDK
// Exporta otros servicios de admin como storage, messaging, etc., si los necesitas. 