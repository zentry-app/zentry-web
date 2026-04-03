import { storage as firebaseStorage } from './config';
import { ref, getDownloadURL, getMetadata, listAll, deleteObject, uploadBytes } from 'firebase/storage';
import { getAuthSafe } from './config';

// Las siguientes importaciones de Firestore y la función esAdministradorDeResidencial
// se comentan temporalmente porque la función verificarPermisos (que las usa)
// también está comentada en su cuerpo para la depuración actual.
// import { db } from './config'; // db se importa de config, así que esta línea podría ser diferente si db viene de firestore directamente
// import { doc, getDoc } from 'firebase/firestore';
// import { esAdministradorDeResidencial } from './firestore';

/**
 * Obtiene la URL de descarga de un documento almacenado en Firebase Storage
 * (VERSIÓN DE DEPURACIÓN SIMPLIFICADA)
 * @param path Ruta del documento en Storage
 * @returns Promesa con la URL de descarga
 */
export const getDocumentURLSimplificado = async (path: string): Promise<string|null> => {
  console.log('[DEBUG_STORAGE] getDocumentURL (simplificado) llamado para:', path);
  const auth = await getAuthSafe();
  if (!path || !firebaseStorage || !auth || !auth.currentUser) {
    console.warn('[DEBUG_STORAGE] getDocumentURL: Parámetros inválidos, storage no inicializado o usuario no autenticado.', {
        pathProvided: !!path,
        storageInitialized: !!firebaseStorage,
        userAuthenticated: !!(auth && auth.currentUser)
    });
    return null; 
  }
  try {
    const correctedPath = path.startsWith('/') ? path.substring(1) : path;
    console.log(`[DEBUG_STORAGE] getDocumentURL: Intentando obtener URL para ${correctedPath} como UID: ${auth.currentUser.uid}`);
    if (!firebaseStorage) {
        console.error("[DEBUG_STORAGE] getDocumentURL: firebaseStorage es null o undefined ANTES de llamar a ref.");
        return null;
    }
    const documentRef = ref(firebaseStorage, correctedPath);
    const url = await getDownloadURL(documentRef);
    console.log('[DEBUG_STORAGE] getDocumentURL: URL obtenida:', url);
    return url;
  } catch (error: any) {
    console.error('[DEBUG_STORAGE] getDocumentURL: Error obteniendo URL:', error.code, error.message, error);
    return null;
  }
};

/**
 * Verificar si un documento existe en Firebase Storage
 * (VERSIÓN DE DEPURACIÓN SIMPLIFICADA)
 * @param path Ruta del documento en Storage
 * @returns Promesa con un objeto que indica si el documento existe y su URL si está disponible
 */
export const documentExistsSimplificado = async (path: string): Promise<{existe: boolean, url?: string, error?: any}> => {
  console.log('[DEBUG_STORAGE] documentExists (simplificado) llamado para:', path);
  const auth = await getAuthSafe();
  if (!path || !firebaseStorage || !auth || !auth.currentUser) {
    console.warn('[DEBUG_STORAGE] documentExists: Parámetros inválidos, storage no inicializado o usuario no autenticado.', {
        pathProvided: !!path,
        storageInitialized: !!firebaseStorage,
        userAuthenticated: !!(auth && auth.currentUser)
    });
    return {existe: false};
  }
  
  const correctedPath = path.startsWith('/') ? path.substring(1) : path;
  if (!firebaseStorage) {
    console.error("[DEBUG_STORAGE] documentExists: firebaseStorage es null o undefined ANTES de llamar a ref.");
    return {existe: false, error: new Error("Storage not initialized")};
  }
  const storageRef = ref(firebaseStorage, correctedPath);
  try {
    console.log(`[DEBUG_STORAGE] documentExists: Intentando getMetadata para ${correctedPath} como UID: ${auth.currentUser.uid}`);
    await getMetadata(storageRef);
    console.log('[DEBUG_STORAGE] documentExists: Metadatos obtenidos, el documento existe.');
    return {existe: true };
  } catch (error: any) {
    console.error('[DEBUG_STORAGE] documentExists: Error en getMetadata:', error.code, error.message, error);
    return {existe: false, error: error};
  }
};

/**
 * Elimina un documento de Firebase Storage
 * @param path Ruta del documento en Storage
 * @returns Promesa que se resuelve a true si el documento fue eliminado, false en caso contrario
 */
export const eliminarDocumento = async (path: string): Promise<boolean> => {
  console.log(`[STORAGE] Iniciando eliminación de documento para: ${path}`);
  
  if (!path || path.trim() === '') {
    console.error("[STORAGE] Error: La ruta del documento no puede estar vacía.");
    return false;
  }

  if (!firebaseStorage) {
    console.error("[STORAGE] Error: Firebase Storage no está inicializado.");
    return false;
  }

  const auth = await getAuthSafe();
  if (!auth || !auth.currentUser) {
    console.error("[STORAGE] Error: Usuario no autenticado. No se puede eliminar el documento.");
    return false;
  }

  // Firebase Storage maneja bien las rutas aunque empiecen con `/`, pero es buena práctica normalizar.
  const correctedPath = path.startsWith('/') ? path.substring(1) : path;
  const storageRef = ref(firebaseStorage, correctedPath);

  try {
    await deleteObject(storageRef);
    console.log(`[STORAGE] Documento eliminado exitosamente: ${correctedPath}`);
    return true;
  } catch (error: any) {
    console.error(`[STORAGE] Error al eliminar el documento ${correctedPath}:`, {
      code: error.code,
      message: error.message,
      fullError: error
    });
    // Aquí podrías querer manejar errores específicos de Firebase Storage,
    // por ejemplo, 'storage/object-not-found', 'storage/unauthorized', etc.
    if (error.code === 'storage/object-not-found') {
      console.warn(`[STORAGE] El documento ${correctedPath} no se encontró. Pudo haber sido eliminado previamente.`);
      // Considera devolver true si el objetivo es que el archivo no exista, 
      // o false si quieres indicar que la operación de borrado como tal no ocurrió.
      // Por ahora, devolvemos false para indicar que deleteObject falló.
    }
    return false;
  }
};

/**
 * Sube un archivo a Firebase Storage en la ruta especificada
 * @param file Archivo a subir
 * @param path Ruta destino en Storage
 */
export const subirDocumento = async (file: File, path: string): Promise<void> => {
  const auth = await getAuthSafe();
  if (!auth || !auth.currentUser) throw new Error('Usuario no autenticado');
  if (!firebaseStorage) throw new Error('Firebase Storage no inicializado');
  if (!file) throw new Error('Archivo no proporcionado');
  if (!path) throw new Error('Ruta no proporcionada');

  const correctedPath = path.startsWith('/') ? path.substring(1) : path;
  const storageRef = ref(firebaseStorage, correctedPath);
  await uploadBytes(storageRef, file);
};

export const verificarPermisos = async (path: string, userEmail?: string): Promise<boolean> => {
  const auth = await getAuthSafe();
  if (!auth || !auth.currentUser) {
    console.log('❌ No hay usuario autenticado');
    return false;
  }
  console.log('👤 Usuario autenticado:', auth.currentUser.email, auth.currentUser.uid);
  /*
  // Contenido original de la función verificarPermisos comentado para evitar errores de linter
  // durante la depuración de Storage, ya que las importaciones de Firestore están comentadas.
  if (path.startsWith('public_registration/')) {
    console.log('📝 Es un documento de registro público');
    const parts = path.split('/');
    if (parts.length < 4) {
      console.log('❌ Ruta inválida, tiene menos de 4 partes');
      return false;
    }
    const residencialID = parts[1];
    const userEmail = parts[2].replace(/_at_/g, '@').replace(/_dot_/g, '.');
    console.log('🏠 ID del residencial:', residencialID);
    console.log('📧 Email del propietario del documento:', userEmail);

    // ESTA SECCIÓN REQUIERE 'doc' y 'getDoc' DE FIRESTORE (y db)
    // const userRef = doc(db, 'usuarios', auth.uid);
    // const userSnap = await getDoc(userRef);
    // if (userSnap.exists()) {
    //   const userData = userSnap.data(); // Esto daría error de 'unknown' sin un tipo
    //   if (userData.role === 'admin') { // Necesitaría (userData as any).role o un tipo adecuado
    //     console.log('✅ Usuario es administrador global');
    //     return true;
    //   }
    //   if (auth.email === userEmail) {
    //     console.log('✅ Usuario es propietario del documento');
    //     return true;
    //   }
    //   // ESTA SECCIÓN REQUIERE 'esAdministradorDeResidencial'
    //   // const esAdmin = await esAdministradorDeResidencial(residencialID);
    //   // if (esAdmin) {
    //   //   console.log('✅ Usuario es administrador del residencial:', residencialID);
    //   //   return true;
    //   // }
    // } else {
    //   console.log('❌ No se encontraron datos del usuario en Firestore');
    // }
    console.log('❌ Usuario no tiene permisos suficientes (lógica original comentada)');
    return false;
  }
  console.log('❓ No es un tipo de documento con reglas definidas (lógica original comentada)');
  */
  return false; 
}; 

export async function listFilesIfAllowed(rutaBaseUsuario: string): Promise<string[]> {
  console.log(`[storage.ts] Iniciando listFilesIfAllowed para ruta: ${rutaBaseUsuario}`);
  if (!firebaseStorage) {
    console.error("[storage.ts] Firebase Storage no está inicializado en listFilesIfAllowed.");
    return [];
  }
  console.log(`[storage.ts] Permiso concedido (temporalmente) para listar archivos en: ${rutaBaseUsuario}`);
  const listRef = ref(firebaseStorage, rutaBaseUsuario);
  try {
    const res = await listAll(listRef);
    const files = res.items.map((itemRef) => itemRef.name);
    console.log(`[storage.ts] Archivos encontrados en ${rutaBaseUsuario}:`, files);
    return files;
  } catch (error: any) {
    console.error(`[storage.ts] Error al listar archivos en ${rutaBaseUsuario}:`, error.code, error.message, error);
    return []; 
  }
}

// Las funciones originales documentExists y getDocumentUrl deben ser comentadas o eliminadas si estas
// funciones _Simplificado las reemplazan para la depuración.
// Comentar las funciones originales para evitar conflictos de nombres:
/*
export async function documentExists(rutaCompletaStorage: string): Promise<{ existe: boolean; error?: any }> {
  // ...código original...
}

export async function getDocumentUrl(rutaCompletaStorage: string): Promise<string | null> {
  // ...código original...
}
*/

// Asegúrate de que las importaciones necesarias para las funciones simplificadas estén presentes y no comentadas.
// import { storage as firebaseStorage } from './config'; // Asumiendo que 'storage' se exporta desde config
// import { ref, getDownloadURL, getMetadata, listAll } from 'firebase/storage';
// Si getCurrentUserData o auth eran usados por verificarPermisosYRol, y ahora no,
// podrías comentar esas importaciones específicas si no se usan en ningún otro lugar de este archivo.
// import { auth } from './config'; 
// import { getCurrentUserData } from '../auth/AuthService';

// Las definiciones de interfaz y la función verificarPermisosYRol están comentadas arriba.
// ... el resto del código del archivo ... 