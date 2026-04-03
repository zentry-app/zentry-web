/**
 * Utilidades para manejar rutas de Firebase Storage de manera consistente
 * entre la app móvil y el web admin
 */

export interface StoragePathConfig {
  residentialId: string;
  userId: string;
  documentType: 'identification' | 'proof';
  timestamp?: number;
  extension?: string;
}

/**
 * Genera la ruta de storage para documentos siguiendo la estructura de la app móvil
 * @param config Configuración para generar la ruta
 * @returns Ruta completa del documento en Firebase Storage
 */
export function generateDocumentPath(config: StoragePathConfig): string {
  const { residentialId, userId, documentType, timestamp, extension = 'jpg' } = config;
  
  // Usar la misma estructura que la app móvil
  const basePath = `public_registration/${residentialId}/${userId}`;
  
  if (timestamp) {
    // Para documentos con timestamp (historial)
    return `${basePath}/${documentType}_${timestamp}.${extension}`;
  } else {
    // Para documentos principales (sin timestamp)
    const fileName = documentType === 'identification' ? 'identification.jpg' : 'proof.jpg';
    return `${basePath}/${fileName}`;
  }
}

/**
 * Genera la ruta para documentos de identificación
 */
export function generateIdentificationPath(
  residentialId: string, 
  userId: string, 
  timestamp?: number
): string {
  return generateDocumentPath({
    residentialId,
    userId,
    documentType: 'identification',
    timestamp,
    extension: 'jpg'
  });
}

/**
 * Genera la ruta para documentos de comprobante de domicilio
 */
export function generateProofPath(
  residentialId: string, 
  userId: string, 
  timestamp?: number
): string {
  return generateDocumentPath({
    residentialId,
    userId,
    documentType: 'proof',
    timestamp,
    extension: 'jpg'
  });
}

/**
 * Extrae información de una ruta de storage
 * @param path Ruta completa del documento
 * @returns Información extraída de la ruta
 */
export function parseDocumentPath(path: string): {
  residentialId?: string;
  userId?: string;
  documentType?: 'identification' | 'proof';
  timestamp?: number;
  fileName?: string;
} {
  const parts = path.split('/');
  
  if (parts.length < 4 || parts[0] !== 'public_registration') {
    return {};
  }
  
  const residentialId = parts[1];
  const userId = parts[2];
  const fileName = parts[3];
  
  let documentType: 'identification' | 'proof' | undefined;
  let timestamp: number | undefined;
  
  if (fileName === 'identification.jpg') {
    documentType = 'identification';
  } else if (fileName === 'proof.jpg') {
    documentType = 'proof';
  } else if (fileName.startsWith('identification_')) {
    documentType = 'identification';
    const timestampMatch = fileName.match(/identification_(\d+)\./);
    if (timestampMatch) {
      timestamp = parseInt(timestampMatch[1]);
    }
  } else if (fileName.startsWith('proof_')) {
    documentType = 'proof';
    const timestampMatch = fileName.match(/proof_(\d+)\./);
    if (timestampMatch) {
      timestamp = parseInt(timestampMatch[1]);
    }
  }
  
  return {
    residentialId,
    userId,
    documentType,
    timestamp,
    fileName
  };
}

/**
 * Valida si una ruta sigue el formato correcto
 */
export function isValidDocumentPath(path: string): boolean {
  const info = parseDocumentPath(path);
  return !!(info.residentialId && info.userId && info.documentType);
} 