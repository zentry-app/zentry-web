/**
 * Script para crear un administrador global manualmente en Firebase
 * Este script puede ser ejecutado localmente con Node.js para crear un usuario administrador
 * 
 * Para ejecutar:
 * 1. Descarga un archivo de credenciales de tu proyecto Firebase
 * 2. Actualiza la ruta al archivo de credenciales y los datos del usuario
 * 3. Ejecuta: node manual-admin-create.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-serviceAccountKey.json'); // Actualiza esta ruta

// Inicializa Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function createGlobalAdmin() {
  try {
    // 1. Crear el usuario en Authentication
    const userEmail = 'admin@example.com'; // CAMBIA ESTE EMAIL
    const userPassword = 'password123';    // CAMBIA ESTA CONTRASEÑA
    const fullName = 'Administrador Global'; // CAMBIA ESTE NOMBRE
    
    const userRecord = await auth.createUser({
      email: userEmail,
      password: userPassword,
      displayName: fullName,
      emailVerified: true
    });
    
    console.log('Usuario creado en Authentication:', userRecord.uid);
    
    // 2. Crear el documento del usuario en Firestore
    const userDocRef = db.collection('users').doc(userRecord.uid);
    const timestamp = admin.firestore.Timestamp.now();
    
    await userDocRef.set({
      // Campos básicos obligatorios
      email: userEmail,
      fullName: fullName,
      role: 'admin', // valor de rol como string
      status: 'active', // activo desde el inicio
      
      // Campos de residencial (críticos para evitar errores)
      residencialId: 'global',
      residencialID: 'global', // Versión alternativa con mayúscula
      residencialDocId: 'global',
      houseNumber: '0',
      
      // Campo para administrador global (como booleano, no como string)
      isGlobalAdmin: true,
      
      // Campos adicionales para prevenir errores
      managedResidencials: [],
      
      // Campos para apellidos
      paternalLastName: '',
      maternalLastName: '',
      
      // Campos de fechas
      createdAt: timestamp,
      updatedAt: timestamp,
      
      // Campos opcionales pero útiles
      doNotDisturb: false,
    });
    
    console.log('Documento de usuario creado en Firestore');
    console.log('¡Administrador global creado exitosamente!');
    console.log('--------------------------------------');
    console.log('Email:', userEmail);
    console.log('Contraseña:', userPassword);
    console.log('UID:', userRecord.uid);
    console.log('--------------------------------------');
    
    return userRecord.uid;
  } catch (error) {
    console.error('Error al crear administrador global:', error);
    throw error;
  }
}

// Ejecutar la función
createGlobalAdmin()
  .then((uid) => {
    console.log('Proceso completado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  }); 