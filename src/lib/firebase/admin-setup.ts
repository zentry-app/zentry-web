/**
 * Script para crear un administrador global manualmente en Firebase
 * Este script puede ser ejecutado localmente para crear un usuario administrador
 * NOTA: Reemplaza los valores marcados con <> antes de ejecutar
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { UserRole } from '@/types/models';

// Inicializa Firebase Admin
// Asegúrate de tener un archivo de credenciales de cuenta de servicio
const app = initializeApp({
  credential: cert({
    projectId: '<TU_PROJECT_ID>',
    clientEmail: '<TU_CLIENT_EMAIL>',
    privateKey: '<TU_PRIVATE_KEY>'
  })
});

const db = getFirestore(app);
const auth = getAuth(app);

async function createGlobalAdmin() {
  try {
    // 1. Crear el usuario en Authentication
    const userEmail = 'admin@example.com'; // Reemplaza con el email deseado
    const userPassword = 'password123';    // Reemplaza con una contraseña segura
    
    const userRecord = await auth.createUser({
      email: userEmail,
      password: userPassword,
      displayName: 'Administrador Global',
      emailVerified: true
    });
    
    console.log('Usuario creado en Authentication:', userRecord.uid);
    
    // 2. Crear el documento del usuario en Firestore
    const userDocRef = db.collection('users').doc(userRecord.uid);
    
    await userDocRef.set({
      email: userEmail,
      fullName: 'Administrador Global',
      role: 'admin', // UserRole.Admin como string
      status: 'active', // Directamente activo
      residencialId: 'global',
      residencialDocId: 'global',
      houseNumber: '0',
      isGlobalAdmin: true, // Campo clave para administrador global
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    console.log('Documento de usuario creado en Firestore');
    console.log('Administrador global creado exitosamente');
    
    return userRecord.uid;
  } catch (error) {
    console.error('Error al crear administrador global:', error);
    throw error;
  }
}

// Ejecutar la función
createGlobalAdmin()
  .then((uid) => {
    console.log('ID del administrador global:', uid);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  }); 