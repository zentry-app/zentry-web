/**
 * Script para migrar documentos existentes a la nueva estructura de rutas
 * que sea consistente entre la app móvil y el web admin
 */

import { getUsuarios } from '@/lib/firebase/firestore';
import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { generateIdentificationPath, generateProofPath } from './storage-paths';

interface MigrationResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Migra un documento de la estructura antigua a la nueva
 */
async function migrateDocument(
  oldPath: string, 
  newPath: string, 
  userId: string
): Promise<MigrationResult> {
  try {
    console.log(`🔄 Migrando documento: ${oldPath} → ${newPath}`);
    
    // Verificar que storage esté disponible
    if (!storage) {
      throw new Error('Firebase Storage no está inicializado');
    }
    
    // Obtener el archivo desde la ruta antigua
    const oldRef = ref(storage, oldPath);
    const oldUrl = await getDownloadURL(oldRef);
    
    // Descargar el archivo
    const response = await fetch(oldUrl);
    const blob = await response.blob();
    const file = new File([blob], 'document.jpg', { type: 'image/jpeg' });
    
    // Subir a la nueva ruta
    const newRef = ref(storage, newPath);
    await uploadBytes(newRef, file);
    
    // Eliminar el archivo antiguo
    await deleteObject(oldRef);
    
    console.log(`✅ Documento migrado exitosamente: ${oldPath} → ${newPath}`);
    
    return {
      success: true,
      message: `Documento migrado: ${oldPath} → ${newPath}`,
      details: { oldPath, newPath, userId }
    };
  } catch (error) {
    console.error(`❌ Error migrando documento: ${oldPath}`, error);
    return {
      success: false,
      message: `Error migrando documento: ${oldPath}`,
      details: { error, oldPath, newPath, userId }
    };
  }
}

/**
 * Migra todos los documentos de un usuario a la nueva estructura
 */
async function migrateUserDocuments(user: any): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];
  
  try {
    console.log(`🔄 Migrando documentos del usuario: ${user.id}`);
    
    // Migrar identificación si existe
    if (user.identificacionUrl) {
      const oldPath = user.identificacionUrl;
      const newPath = generateIdentificationPath(user.residencialID, user.id);
      
      const result = await migrateDocument(oldPath, newPath, user.id);
      results.push(result);
    }
    
    // Migrar comprobante si existe
    if (user.comprobanteUrl) {
      const oldPath = user.comprobanteUrl;
      const newPath = generateProofPath(user.residencialID, user.id);
      
      const result = await migrateDocument(oldPath, newPath, user.id);
      results.push(result);
    }
    
    // Migrar historial de documentos si existe
    if (user.identificacionPaths && Array.isArray(user.identificacionPaths)) {
      for (let i = 0; i < user.identificacionPaths.length; i++) {
        const oldPath = user.identificacionPaths[i];
        const timestamp = Date.now() + i; // Usar timestamp único
        const newPath = generateIdentificationPath(user.residencialID, user.id, timestamp);
        
        const result = await migrateDocument(oldPath, newPath, user.id);
        results.push(result);
      }
    }
    
    if (user.comprobantePaths && Array.isArray(user.comprobantePaths)) {
      for (let i = 0; i < user.comprobantePaths.length; i++) {
        const oldPath = user.comprobantePaths[i];
        const timestamp = Date.now() + i; // Usar timestamp único
        const newPath = generateProofPath(user.residencialID, user.id, timestamp);
        
        const result = await migrateDocument(oldPath, newPath, user.id);
        results.push(result);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error migrando documentos del usuario ${user.id}:`, error);
    results.push({
      success: false,
      message: `Error migrando documentos del usuario: ${user.id}`,
      details: { error, userId: user.id }
    });
  }
  
  return results;
}

/**
 * Migra todos los documentos de todos los usuarios
 */
export async function migrateAllDocuments(): Promise<{
  totalUsers: number;
  totalDocuments: number;
  successfulMigrations: number;
  failedMigrations: number;
  results: MigrationResult[];
}> {
  console.log('🚀 Iniciando migración de documentos a nueva estructura...');
  
  try {
    const usuarios = await getUsuarios();
    console.log(`📋 Encontrados ${usuarios.length} usuarios para migrar`);
    
    let totalDocuments = 0;
    let successfulMigrations = 0;
    let failedMigrations = 0;
    const allResults: MigrationResult[] = [];
    
    for (const usuario of usuarios) {
      console.log(`🔄 Procesando usuario: ${usuario.id} (${usuario.email})`);
      
      const userResults = await migrateUserDocuments(usuario);
      
      for (const result of userResults) {
        totalDocuments++;
        if (result.success) {
          successfulMigrations++;
        } else {
          failedMigrations++;
        }
        allResults.push(result);
      }
    }
    
    console.log('✅ Migración completada:', {
      totalUsers: usuarios.length,
      totalDocuments,
      successfulMigrations,
      failedMigrations
    });
    
    return {
      totalUsers: usuarios.length,
      totalDocuments,
      successfulMigrations,
      failedMigrations,
      results: allResults
    };
    
  } catch (error) {
    console.error('❌ Error en migración general:', error);
    throw error;
  }
}

/**
 * Verifica si un usuario necesita migración
 */
export function needsMigration(user: any): boolean {
  // Verificar si tiene documentos con estructura antigua
  const hasOldStructure = 
    (user.identificacionUrl && user.identificacionUrl.includes('usuarios/')) ||
    (user.comprobanteUrl && user.comprobanteUrl.includes('usuarios/'));
  
  return hasOldStructure;
}

/**
 * Obtiene estadísticas de migración
 */
export async function getMigrationStats(): Promise<{
  totalUsers: number;
  usersNeedingMigration: number;
  usersWithNewStructure: number;
}> {
  const usuarios = await getUsuarios();
  
  let usersNeedingMigration = 0;
  let usersWithNewStructure = 0;
  
  for (const usuario of usuarios) {
    if (needsMigration(usuario)) {
      usersNeedingMigration++;
    } else {
      usersWithNewStructure++;
    }
  }
  
  return {
    totalUsers: usuarios.length,
    usersNeedingMigration,
    usersWithNewStructure
  };
} 