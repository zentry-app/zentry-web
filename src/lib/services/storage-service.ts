/**
 * Servicio de Storage para subida de documentos a Firebase Storage
 * Replica la funcionalidad de subida de documentos de la app móvil
 */

import { ref, uploadBytes, getDownloadURL, UploadMetadata, UploadTask, uploadBytesResumable, getStorage } from 'firebase/storage';
import { storage, app } from '../firebase/config';

interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

interface DocumentUploadData {
  file: File;
  documentType: 'identification' | 'proof';
  userId: string;
  residentialId: string;
  email: string;
}

interface UploadResult {
  path: string;
  downloadUrl: string;
  metadata: UploadMetadata;
}

class StorageService {
  private static instance: StorageService;
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Valida un archivo antes de subirlo
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    // Verificar tamaño
    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        error: `El archivo es demasiado grande. Máximo permitido: ${this.maxFileSize / 1024 / 1024}MB`
      };
    }

    // Verificar tipo
    if (!this.allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Tipo de archivo no permitido. Tipos permitidos: ${this.allowedTypes.join(', ')}`
      };
    }

    return { isValid: true };
  }

  /**
   * Comprime una imagen antes de subirla
   */
  async compressImage(file: File, quality: number = 0.7, maxWidth: number = 1200): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo la proporción
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir a blob comprimido
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Error al comprimir la imagen'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Sube un documento con progreso
   */
  async uploadDocument(
    data: DocumentUploadData,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    console.log(`[StorageService] 🚀 Iniciando uploadDocument para ${data.documentType}:`, {
      fileName: data.file.name,
      fileSize: data.file.size,
      fileType: data.file.type,
      userId: data.userId,
      residentialId: data.residentialId,
      email: data.email,
      timestamp: new Date().toISOString()
    });

    try {
      // Verificar que tenemos los datos necesarios
      if (!data.file) {
        throw new Error('No se proporcionó archivo');
      }
      if (!data.residentialId) {
        throw new Error('No se proporcionó residentialId');
      }
      if (!data.userId) {
        throw new Error('No se proporcionó userId');
      }

      console.log(`[StorageService] ✅ Datos de entrada validados`);

      // Validar archivo
      console.log(`[StorageService] 🔍 Validando archivo...`);
      const validation = this.validateFile(data.file);
      if (!validation.isValid) {
        console.error(`[StorageService] ❌ Archivo no válido:`, validation.error);
        throw new Error(validation.error);
      }
      console.log(`[StorageService] ✅ Archivo validado exitosamente`);

      // Comprimir imagen
      console.log(`[StorageService] 🗜️ Comprimiendo imagen...`);
      const compressedFile = await this.compressImage(data.file);
      console.log(`[StorageService] ✅ Imagen comprimida: ${data.file.size} → ${compressedFile.size} bytes`);

      // Generar nombre del archivo
      const fileName = data.documentType === 'identification' ? 'identification.jpg' : 'proof.jpg';
      
      // Usar la misma ruta que en la app móvil
      const filePath = `public_registration/${data.residentialId}/${data.userId}/${fileName}`;
      console.log(`[StorageService] 📁 Ruta del archivo: ${filePath}`);

      // Verificar que Firebase Storage esté disponible
      console.log(`[StorageService] 🔥 Verificando Firebase Storage...`);
      if (!storage && !app) {
        throw new Error('Firebase no está inicializado');
      }

      // Crear referencia
      const storageInstance = storage || getStorage(app);
      console.log(`[StorageService] 📦 Instancia de Storage obtenida:`, !!storageInstance);
      
      const storageRef = ref(storageInstance, filePath);
      console.log(`[StorageService] 📌 Referencia creada:`, storageRef.fullPath);

      // Metadatos del archivo
      const metadata: UploadMetadata = {
        contentType: 'image/jpeg',
        customMetadata: {
          originalSize: data.file.size.toString(),
          compressedSize: compressedFile.size.toString(),
          documentType: data.documentType,
          userId: data.userId,
          uploadDate: new Date().toISOString(),
          email: data.email,
          residencialID: data.residentialId,
          status: 'pending_review',
          purpose: 'user_registration_document',
        },
      };

      console.log(`[StorageService] 📋 Metadatos preparados:`, metadata);
      console.log(`[StorageService] 📤 Iniciando subida con uploadBytesResumable...`);

      // Subir con progreso
      const uploadTask: UploadTask = uploadBytesResumable(storageRef, compressedFile, metadata);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress: UploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            };

            console.log(`[StorageService] 📊 Progreso (${data.documentType}): ${progress.percentage.toFixed(1)}% (${progress.bytesTransferred}/${progress.totalBytes})`);
            
            if (onProgress) {
              onProgress(progress);
            }
          },
          (error) => {
            console.error(`[StorageService] ❌ Error durante la subida de ${data.documentType}:`, {
              error,
              errorCode: error.code,
              errorMessage: error.message,
              filePath,
              timestamp: new Date().toISOString()
            });
            reject(error);
          },
          async () => {
            try {
              console.log(`[StorageService] 🎉 Subida completada, obteniendo URL de descarga...`);
              
              // Obtener URL de descarga
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              
              console.log(`[StorageService] ✅ Subida de ${data.documentType} completada exitosamente:`, {
                filePath,
                downloadUrl,
                metadata: uploadTask.snapshot.metadata,
                timestamp: new Date().toISOString()
              });

              resolve({
                path: filePath,
                downloadUrl,
                metadata: uploadTask.snapshot.metadata,
              });
            } catch (error) {
              console.error(`[StorageService] ❌ Error al obtener URL de descarga:`, error);
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error(`[StorageService] ❌ Error crítico en uploadDocument (${data.documentType}):`, {
        error,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        errorStack: error instanceof Error ? error.stack : undefined,
        data: {
          fileName: data.file?.name,
          fileSize: data.file?.size,
          userId: data.userId,
          residentialId: data.residentialId
        },
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Sube múltiples documentos en paralelo
   */
  async uploadMultipleDocuments(
    documents: DocumentUploadData[],
    onProgress?: (documentType: string, progress: UploadProgress) => void
  ): Promise<{ [documentType: string]: UploadResult }> {
    try {
      console.log(`📤 Subiendo ${documents.length} documentos en paralelo`);

      const uploadPromises = documents.map(async (doc) => {
        const result = await this.uploadDocument(doc, (progress) => {
          if (onProgress) {
            onProgress(doc.documentType, progress);
          }
        });
        return { [doc.documentType]: result };
      });

      const results = await Promise.all(uploadPromises);
      
      // Combinar resultados en un solo objeto
      const combinedResults = results.reduce((acc, result) => {
        return { ...acc, ...result };
      }, {});

      console.log(`✅ Todos los documentos subidos exitosamente`);
      return combinedResults;
    } catch (error) {
      console.error(`❌ Error al subir múltiples documentos:`, error);
      throw error;
    }
  }

  /**
   * Obtiene la URL de descarga de un documento
   */
  async getDocumentUrl(path: string): Promise<string> {
    try {
      const storageInstance = storage || getStorage(app);
      const storageRef = ref(storageInstance, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error al obtener URL del documento:', error);
      throw error;
    }
  }

  /**
   * Genera una vista previa de un archivo
   */
  generatePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Error al generar vista previa'));
        }
      };
      
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Formatea el tamaño de archivo para mostrar
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default StorageService.getInstance(); 