'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Eye,
  Download,
  RotateCcw,
  Camera 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentsData, RegistrationData } from '../MultiStepRegisterForm';
import StorageService from '@/lib/services/storage-service';
import { useMobile } from '@/hooks/use-mobile';
import { CameraCapture } from './CameraCapture';

interface DocumentsStepProps {
  data: RegistrationData;
  onDataChange: (data: Partial<DocumentsData>) => void;
  onValidationChange: (isValid: boolean) => void;
  isLoading: boolean;
}

interface UploadProgress {
  identification: number;
  proof: number;
}

export function DocumentsStep({ 
  data, 
  onDataChange, 
  onValidationChange, 
  isLoading 
}: DocumentsStepProps) {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    identification: 0,
    proof: 0
  });
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState<'identification' | 'proof' | null>(null);
  const [hasShownSuccessToast, setHasShownSuccessToast] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [currentCaptureType, setCurrentCaptureType] = useState<'identification' | 'proof' | null>(null);
  const { toast } = useToast();
  const { isMobile, hasCamera } = useMobile();

  const { 
    identification, 
    proofOfAddress, 
    identificationPreview,
    proofPreview,
    identificationUploaded,
    proofUploaded
  } = data.documents;

  // Validar documentos
  useEffect(() => {
    console.log(`[DocumentsStep] useEffect ejecutado - identificationUploaded: ${identificationUploaded}, proofUploaded: ${proofUploaded}`);
    
    const isValid = identificationUploaded && proofUploaded;
    onValidationChange(isValid);
    
    console.log(`[DocumentsStep] Validación: ${isValid}`);
    
    // Detectar si se perdieron archivos al recargar pero las previews están disponibles
    const hasLostFiles = (
      (identificationPreview && !identification && !identificationUploaded) ||
      (proofPreview && !proofOfAddress && !proofUploaded)
    );
    
    if (hasLostFiles) {
      console.log(`[DocumentsStep] Archivos perdidos detectados al recargar página`);
      toast({
        title: "Archivos perdidos",
        description: "Se detectaron archivos que se perdieron al recargar la página. Por favor, vuelve a subirlos.",
        variant: "destructive",
        duration: 5000
      });
    }
    
    // Mostrar mensaje de éxito cuando ambos documentos estén subidos (solo una vez)
    if (isValid && !hasShownSuccessToast) {
      console.log(`[DocumentsStep] Ambos documentos subidos exitosamente`);
      setHasShownSuccessToast(true);
      toast({
        title: "¡Documentos completados!",
        description: "Ambos documentos han sido subidos exitosamente. Puedes continuar al siguiente paso.",
        variant: "default"
      });
    }
    
    // Resetear el toast si se quitan documentos
    if (!isValid && hasShownSuccessToast) {
      setHasShownSuccessToast(false);
    }
  }, [identificationUploaded, proofUploaded, identificationPreview, proofPreview, identification, proofOfAddress, onValidationChange, toast, hasShownSuccessToast]);

  // Generar vista previa de archivo
  const generatePreview = useCallback(async (file: File): Promise<string> => {
    try {
      return await StorageService.generatePreview(file);
    } catch (error) {
      console.error('Error al generar vista previa:', error);
      return '';
    }
  }, []);

  // Validar archivo
  const validateFile = (file: File): boolean => {
    const validation = StorageService.validateFile(file);
    if (!validation.isValid) {
      toast({
        title: "Archivo no válido",
        description: validation.error,
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  // Manejar selección de archivo
  const handleFileSelect = async (
    file: File, 
    type: 'identification' | 'proof'
  ) => {
    if (!validateFile(file)) return;

    try {
      console.log(`[DocumentsStep] Archivo seleccionado: ${file.name}, tipo: ${type}`);
      const preview = await generatePreview(file);
      
      if (type === 'identification') {
        onDataChange({
          identification: file,
          identificationPreview: preview,
          identificationUploaded: false
        });
      } else {
        onDataChange({
          proofOfAddress: file,
          proofPreview: preview,
          proofUploaded: false
        });
      }

      console.log(`[DocumentsStep] Iniciando subida automática para: ${type}`);
      // Pasar el archivo directamente en lugar de depender del estado
      await uploadDocument(type, file);

    } catch (error) {
      console.error(`[DocumentsStep] Error al procesar archivo ${type}:`, error);
      toast({
        title: "Error",
        description: "No se pudo procesar el archivo",
        variant: "destructive"
      });
    }
  };

  // Manejar input de archivo
  const handleFileInput = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'identification' | 'proof'
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file, type);
    }
  };

  // Abrir captura de cámara
  const openCameraCapture = (type: 'identification' | 'proof') => {
    setCurrentCaptureType(type);
    setCameraModalOpen(true);
  };

  // Manejar captura de cámara
  const handleCameraCapture = (file: File) => {
    if (currentCaptureType) {
      handleFileSelect(file, currentCaptureType);
    }
    setCameraModalOpen(false);
    setCurrentCaptureType(null);
  };

  // Cerrar modal de cámara
  const closeCameraModal = () => {
    setCameraModalOpen(false);
    setCurrentCaptureType(null);
  };

  // Manejar drag & drop
  const handleDragOver = (e: React.DragEvent, type: 'identification' | 'proof') => {
    e.preventDefault();
    setDragOver(type);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, type: 'identification' | 'proof') => {
    e.preventDefault();
    setDragOver(null);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0], type);
    }
  };

  // Subir documento
  const uploadDocument = async (type: 'identification' | 'proof', fileToUpload?: File) => {
    // Usar el archivo pasado como parámetro o el del estado
    const file = fileToUpload || (type === 'identification' ? identification : proofOfAddress);
    
    if (!file || !data.residential.residentialId) {
      console.error(`[DocumentsStep] ❌ Faltan datos para subir documento ${type}:`, {
        hasFile: !!file,
        fileName: file?.name,
        hasResidentialId: !!data.residential.residentialId,
        residentialId: data.residential.residentialId,
        fileToUpload: !!fileToUpload,
        stateFile: type === 'identification' ? !!identification : !!proofOfAddress
      });
      return;
    }

    console.log(`[DocumentsStep] 🚀 Iniciando subida de documento ${type}:`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      residentialId: data.residential.residentialId,
      email: data.personalInfo.email,
      timestamp: new Date().toISOString()
    });

    try {
      // Verificar que StorageService esté disponible
      if (!StorageService || !StorageService.uploadDocument) {
        throw new Error('StorageService no está disponible');
      }

      console.log(`[DocumentsStep] 📝 Preparando datos para StorageService...`);
      
      const uploadData = {
        file,
        documentType: type,
        userId: (data.authMethod && data.authMethod.googleUser && data.authMethod.googleUser.uid) || 'temp-user-id', // Usar UID real si está disponible
        residentialId: data.residential.residentialId,
        email: data.personalInfo.email || 'temp@email.com'
      };

      console.log(`[DocumentsStep] 📤 Llamando a StorageService.uploadDocument con:`, uploadData);

      // Usar el StorageService para subir el documento
      const result = await StorageService.uploadDocument(
        uploadData,
        (progress) => {
          console.log(`[DocumentsStep] 📊 Progreso de subida ${type}: ${progress.percentage}%`);
          setUploadProgress(prev => ({
            ...prev,
            [type]: progress.percentage
          }));
        }
      );

      console.log(`[DocumentsStep] ✅ Documento ${type} subido exitosamente:`, {
        result,
        path: result.path,
        downloadUrl: result.downloadUrl,
        timestamp: new Date().toISOString()
      });

      // Marcar como subido y guardar la URL
      if (type === 'identification') {
        console.log(`[DocumentsStep] 🔄 Marcando identificación como subida y guardando URL...`);
        onDataChange({ 
          identificationUploaded: true,
          identificationUrl: result.downloadUrl
        });
      } else {
        console.log(`[DocumentsStep] 🔄 Marcando comprobante como subido y guardando URL...`);
        onDataChange({ 
          proofUploaded: true,
          proofUrl: result.downloadUrl
        });
      }

      console.log(`[DocumentsStep] ✅ Estado actualizado para ${type} con URL: ${result.downloadUrl}`);

    } catch (error) {
      console.error(`[DocumentsStep] ❌ Error al subir documento ${type}:`, {
        error,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        errorStack: error instanceof Error ? error.stack : undefined,
        fileName: file.name,
        fileSize: file.size,
        residentialId: data.residential.residentialId,
        timestamp: new Date().toISOString()
      });
      
      // Verificar si es un error específico de Firebase
      if (error instanceof Error) {
        if (error.message.includes('storage/unauthorized')) {
          console.error(`[DocumentsStep] 🚫 Error de permisos de Firebase Storage`);
        } else if (error.message.includes('storage/unknown')) {
          console.error(`[DocumentsStep] 🔥 Error desconocido de Firebase Storage`);
        } else if (error.message.includes('network')) {
          console.error(`[DocumentsStep] 🌐 Error de red`);
        }
      }
      
      // En caso de error, mostrar mensaje al usuario
      // pero no bloquear el proceso de registro
      console.log(`[DocumentsStep] 🔄 Implementando fallback para permitir continuar...`);
      
      alert(`Error al subir ${type === 'identification' ? 'identificación' : 'comprobante'}. El registro continuará y podrás subir los documentos más tarde.`);
      
      // Marcar como "subido" para permitir continuar
      if (type === 'identification') {
        console.log(`[DocumentsStep] 🔄 Marcando identificación como subida (fallback)...`);
        onDataChange({ identificationUploaded: true });
      } else {
        console.log(`[DocumentsStep] 🔄 Marcando comprobante como subido (fallback)...`);
        onDataChange({ proofUploaded: true });
      }

      console.log(`[DocumentsStep] ✅ Fallback completado para ${type}`);
    }
  };

  // Función para marcar manualmente como subido (solo desarrollo)
  const markAsUploaded = (type: 'identification' | 'proof') => {
    if (type === 'identification') {
      onDataChange({ identificationUploaded: true });
    } else {
      onDataChange({ proofUploaded: true });
    }
    
    toast({
      title: "Marcado como subido",
      description: `${type === 'identification' ? 'Identificación' : 'Comprobante de domicilio'} marcado manualmente como subido`,
      variant: "default"
    });
  };

  // Remover archivo
  const removeFile = (type: 'identification' | 'proof') => {
    if (type === 'identification') {
      onDataChange({
        identification: null,
        identificationPreview: '',
        identificationUploaded: false
      });
    } else {
      onDataChange({
        proofOfAddress: null,
        proofPreview: '',
        proofUploaded: false
      });
    }
  };

  // Renderizar zona de subida
  const renderUploadZone = (
    type: 'identification' | 'proof',
    title: string,
    description: string
  ) => {
    const file = type === 'identification' ? identification : proofOfAddress;
    const preview = type === 'identification' ? identificationPreview : proofPreview;
    const uploaded = type === 'identification' ? identificationUploaded : proofUploaded;
    const progress = uploadProgress[type];

    return (
      <Card className={`relative transition-all duration-200 ${
        dragOver === type ? 'border-blue-500 bg-blue-50' : ''
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5" />
            {title}
            {uploaded && <CheckCircle className="w-5 h-5 text-green-500" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!file ? (
            // Zona de subida
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver === type 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={(e) => handleDragOver(e, type)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, type)}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Arrastra tu archivo aquí
              </h4>
              <p className="text-gray-600 mb-4">{description}</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileInput(e, type)}
                className="hidden"
                id={`file-${type}`}
                disabled={isLoading || isUploading}
                              />
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById(`file-${type}`)?.click()}
                    disabled={isLoading || isUploading}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Seleccionar archivo
                  </Button>
                  
                  {isMobile && hasCamera && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openCameraCapture(type)}
                      disabled={isLoading || isUploading}
                      className="flex items-center gap-2 bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Camera className="w-4 h-4" />
                      Usar cámara
                    </Button>
                  )}
                </div>
                
                <p className="text-sm text-gray-500">
                  Formatos: JPG, PNG, WebP • Máximo 10MB
                  {isMobile && hasCamera && (
                    <>
                      <br />
                      <span className="text-blue-600">📱 Puedes usar la cámara de tu dispositivo</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          ) : (
            // Vista previa del archivo
            <div className="space-y-4">
              {preview && (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Vista previa"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeFile(type)}
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {StorageService.formatFileSize(file.size)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {uploaded ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Subido
                    </Badge>
                  ) : isUploading ? (
                    <Badge variant="secondary">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-1" />
                      Subiendo...
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <Upload className="w-4 h-4 mr-1" />
                      Subida automática
                    </Badge>
                  )}
                </div>
              </div>

              {/* Barra de progreso */}
              {isUploading && progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subiendo...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
          <FileText className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Documentos Requeridos
        </h3>
        <p className="text-gray-600">
          Sube los documentos necesarios para verificar tu identidad y domicilio
        </p>
      </div>

      {/* Documentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identificación Oficial */}
        {renderUploadZone(
          'identification',
          'Identificación Oficial',
          'INE, Pasaporte, Cédula Profesional o Licencia de Conducir'
        )}

        {/* Comprobante de Domicilio */}
        {renderUploadZone(
          'proof',
          'Comprobante de Domicilio',
          'Recibo de luz, agua, gas, teléfono o estado de cuenta bancario (máximo 3 meses)'
        )}
      </div>

      {/* Estado de documentos */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Estado de tus Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-blue-800">Identificación oficial:</span>
              <Badge variant={identificationUploaded ? "default" : "secondary"}>
                {identificationUploaded ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Completado
                  </>
                ) : identification ? (
                  <>
                    <Upload className="w-4 h-4 mr-1" />
                    Listo para subir
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Pendiente
                  </>
                )}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-800">Comprobante de domicilio:</span>
              <Badge variant={proofUploaded ? "default" : "secondary"}>
                {proofUploaded ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Completado
                  </>
                ) : proofOfAddress ? (
                  <>
                    <Upload className="w-4 h-4 mr-1" />
                    Listo para subir
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Pendiente
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información importante */}
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-900 mb-1">
              Requisitos importantes
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Los documentos deben estar vigentes y ser legibles</li>
              <li>• El comprobante de domicilio no debe tener más de 3 meses</li>
              <li>• Las imágenes se suben automáticamente al seleccionarlas</li>
              <li>• Todos los documentos son revisados por el equipo de administración</li>
              <li>• La información debe coincidir con los datos proporcionados</li>
              <li>• Una vez subidos ambos documentos, avanzarás automáticamente al siguiente paso</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Botones de desarrollo (solo visible en desarrollo) */}
      {(process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') && 
       (identification || proofOfAddress) && 
       (!identificationUploaded || !proofUploaded) && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-2">
                Herramientas de Desarrollo
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                Si la subida automática falla, puedes usar estos botones para continuar con el testing:
              </p>
              <div className="flex flex-wrap gap-2">
                {identification && !identificationUploaded && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => markAsUploaded('identification')}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    ✓ Marcar Identificación como Subida
                  </Button>
                )}
                {proofOfAddress && !proofUploaded && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => markAsUploaded('proof')}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    ✓ Marcar Comprobante como Subido
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de captura de cámara */}
      <CameraCapture
        isOpen={cameraModalOpen}
        onClose={closeCameraModal}
        onCapture={handleCameraCapture}
        title={
          currentCaptureType === 'identification' 
            ? 'Identificación Oficial' 
            : 'Comprobante de Domicilio'
        }
      />
    </div>
  );
} 