/**
 * Script para corregir un usuario existente en Firebase
 * Este script tomará un documento de usuario existente y corregirá los campos
 * necesarios para asegurar que funcione correctamente como administrador global
 * 
 * Para ejecutar:
 * 1. Descarga un archivo de credenciales de tu proyecto Firebase
 * 2. Actualiza la ruta al archivo de credenciales y el UID del usuario
 * 3. Ejecuta: node fix-user.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-serviceAccountKey.json'); // Actualiza esta ruta

// Inicializa Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function fixUser() {
  try {
    // UID del usuario a corregir - REEMPLAZA ESTO CON EL UID REAL
    const uid = 'REEMPLAZA_CON_EL_UID_DEL_USUARIO';
    
    // 1. Verificar si el usuario existe en Authentication
    try {
      const userRecord = await auth.getUser(uid);
      console.log('Usuario encontrado en Authentication:', userRecord.uid);
    } catch (error) {
      console.error('Error: El usuario no existe en Authentication');
      throw error;
    }
    
    // 2. Obtener el documento actual del usuario
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      console.error('Error: El documento del usuario no existe en Firestore');
      throw new Error('Documento de usuario no encontrado');
    }
    
    const userData = userDoc.data();
    console.log('Datos actuales del usuario:', userData);
    
    // 3. Preparar campos actualizados, manteniendo los valores existentes cuando sea posible
    const timestamp = admin.firestore.Timestamp.now();
    const updatedData = {
      // Campos básicos obligatorios
      email: userData.email || '',
      fullName: userData.fullName || '',
      role: 'admin', // Forzar rol de admin como string
      status: 'active', // Forzar estado activo
      
      // Campos de residencial (críticos)
      residencialId: userData.residencialId || 'global',
      residencialID: userData.residencialID || 'global', // Versión alternativa con mayúscula
      residencialDocId: userData.residencialDocId || 'global',
      houseNumber: userData.houseNumber?.toString() || '0',
      
      // Campo para administrador global (como booleano, no como string)
      isGlobalAdmin: true, // Forzar a verdadero (booleano)
      
      // Campos adicionales para prevenir errores
      managedResidencials: userData.managedResidencials || [],
      
      // Campos para apellidos
      paternalLastName: userData.paternalLastName || '',
      maternalLastName: userData.maternalLastName || '',
      
      // Campos de fechas
      createdAt: userData.createdAt || timestamp,
      updatedAt: timestamp,
      
      // Campos opcionales pero útiles
      doNotDisturb: userData.doNotDisturb || false,
    };
    
    // 4. Actualizar el documento
    await userDocRef.update(updatedData);
    
    console.log('¡Usuario corregido exitosamente!');
    console.log('--------------------------------------');
    console.log('UID:', uid);
    console.log('Campos actualizados:', Object.keys(updatedData).join(', '));
    console.log('--------------------------------------');
    
    return uid;
  } catch (error) {
    console.error('Error al corregir usuario:', error);
    throw error;
  }
}

// Ejecutar la función
fixUser()
  .then((uid) => {
    console.log('Proceso completado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  }); 