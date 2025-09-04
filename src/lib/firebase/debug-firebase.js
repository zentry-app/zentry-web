/**
 * Script para verificar la configuración de Firebase y la colección de usuarios
 * Este script puede ser ejecutado localmente con Node.js para diagnosticar problemas
 * 
 * Para ejecutar:
 * 1. Descarga un archivo de credenciales de tu proyecto Firebase
 * 2. Actualiza la ruta al archivo de credenciales
 * 3. Ejecuta: node debug-firebase.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-serviceAccountKey.json'); // Actualiza esta ruta

// Inicializa Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

// UID a buscar - ajusta este valor al UID que está fallando
const UID_TO_CHECK = 'Vbq7Mqjd9kMMPEbhwU0ScJz9Bqx2';

async function debugFirebase() {
  try {
    console.log('====== INICIANDO DIAGNÓSTICO DE FIREBASE ======');
    
    // 1. Verificar si el usuario existe en Authentication
    try {
      const userRecord = await auth.getUser(UID_TO_CHECK);
      console.log('✅ Usuario encontrado en Authentication:');
      console.log(`   - UID: ${userRecord.uid}`);
      console.log(`   - Email: ${userRecord.email}`);
      console.log(`   - Display Name: ${userRecord.displayName}`);
    } catch (error) {
      console.error('❌ ERROR: Usuario NO encontrado en Authentication:');
      console.error(`   - ${error.message}`);
      console.log('⚠️ RECOMENDACIÓN: Crear el usuario en Firebase Authentication primero');
      return;
    }
    
    // 2. Listar todas las colecciones en Firestore
    console.log('\n==== COLECCIONES EN FIRESTORE ====');
    const collections = await db.listCollections();
    console.log('Colecciones disponibles:');
    if (collections.length === 0) {
      console.log('   - No hay colecciones en Firestore');
    } else {
      for (const collection of collections) {
        console.log(`   - ${collection.id}`);
      }
    }
    
    // 3. Verificar si existe la colección 'users'
    const usersExists = collections.some(c => c.id === 'users');
    
    if (!usersExists) {
      console.error('❌ ERROR: No existe la colección "users"');
      console.log('⚠️ RECOMENDACIÓN: Crear la colección manualmente o ejecutar el script para crear un administrador');
      return;
    }
    
    // 4. Intentar obtener el documento del usuario de diferentes formas
    console.log('\n==== BÚSQUEDA DE DOCUMENTO DE USUARIO ====');
    
    // 4.1 Búsqueda directa por ID
    console.log(`Buscando usuario con ID: ${UID_TO_CHECK}`);
    const userDocRef = db.collection('users').doc(UID_TO_CHECK);
    const userDoc = await userDocRef.get();
    
    if (userDoc.exists) {
      console.log('✅ Documento encontrado directamente por ID:');
      console.log(JSON.stringify(userDoc.data(), null, 2));
    } else {
      console.error('❌ ERROR: No se encontró documento con este ID');
      
      // 4.2 Buscar por email si no se encuentra por ID
      console.log('\nBuscando usuario por email...');
      const userByEmail = await db.collection('users')
        .where('email', '==', (await auth.getUser(UID_TO_CHECK)).email)
        .get();
      
      if (!userByEmail.empty) {
        console.log('✅ Documento encontrado por email:');
        const userData = userByEmail.docs[0].data();
        console.log(JSON.stringify(userData, null, 2));
        console.log(`   - ID del documento: ${userByEmail.docs[0].id}`);
        
        if (userByEmail.docs[0].id !== UID_TO_CHECK) {
          console.error('❌ PROBLEMA DETECTADO: El ID del documento no coincide con el UID de Authentication');
          console.log(`⚠️ RECOMENDACIÓN: Crea un nuevo documento con ID ${UID_TO_CHECK} copiando los datos del documento existente`);
        }
      } else {
        console.error('❌ ERROR: No se encontró ningún documento de usuario ni por ID ni por email');
        
        // 4.3 Listar primeros 5 documentos de la colección para verificar estructura
        console.log('\nListando los primeros 5 documentos de la colección users para inspección:');
        const allUsers = await db.collection('users').limit(5).get();
        
        if (allUsers.empty) {
          console.log('   - La colección users está vacía');
          console.log('⚠️ RECOMENDACIÓN: Ejecuta el script para crear un administrador global');
        } else {
          allUsers.forEach((doc) => {
            console.log(`   - Documento ${doc.id}:`);
            console.log(JSON.stringify(doc.data(), null, 2));
          });
          
          console.log('\n⚠️ RECOMENDACIÓN: Crear manualmente un documento con el ID correcto');
        }
      }
    }
    
    console.log('\n====== DIAGNÓSTICO COMPLETADO ======');
  } catch (error) {
    console.error('Error durante el diagnóstico:', error);
    throw error;
  }
}

// Ejecutar el script
debugFirebase()
  .then(() => {
    console.log('Diagnóstico finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error fatal durante el diagnóstico:', error);
    process.exit(1);
  }); 