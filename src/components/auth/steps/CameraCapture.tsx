'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, RotateCcw, Check, SwitchCamera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title: string;
}

export function CameraCapture({ 
  isOpen, 
  onClose, 
  onCapture, 
  title 
}: CameraCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Verificar si hay múltiples cámaras
  useEffect(() => {
    const checkCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch (error) {
        console.error('Error checking cameras:', error);
      }
    };

    if (isOpen) {
      checkCameras();
    }
  }, [isOpen]);

  // Iniciar cámara
  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Verifica los permisos.",
        variant: "destructive"
      });
    }
  }, [facingMode, toast]);

  // Detener cámara
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Capturar foto
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir a data URL
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(dataURL);
    
    // Detener la cámara después de capturar
    stopCamera();
  }, [stopCamera]);

  // Cambiar cámara
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    if (isStreaming) {
      stopCamera();
      // Reiniciar con la nueva cámara después de un pequeño delay
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  }, [isStreaming, startCamera, stopCamera]);

  // Confirmar captura
  const confirmCapture = useCallback(() => {
    if (!capturedImage) return;

    // Convertir data URL a File
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const timestamp = new Date().getTime();
        const file = new File([blob], `documento_${timestamp}.jpg`, { 
          type: 'image/jpeg' 
        });
        onCapture(file);
        handleClose();
      })
      .catch(error => {
        console.error('Error converting image:', error);
        toast({
          title: "Error",
          description: "No se pudo procesar la imagen capturada",
          variant: "destructive"
        });
      });
  }, [capturedImage, onCapture, toast]);

  // Reintentar captura
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  // Manejar cierre
  const handleClose = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    onClose();
  }, [stopCamera, onClose]);

  // Iniciar cámara al abrir
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }

    return () => {
      if (!isOpen) {
        stopCamera();
      }
    };
  }, [isOpen, capturedImage, startCamera, stopCamera]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Capturar {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!capturedImage ? (
            // Vista de cámara
            <div className="relative">
              <div className="aspect-[4/3] bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Controles de cámara */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
                {hasMultipleCameras && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={switchCamera}
                    disabled={!isStreaming}
                    className="bg-white/90 hover:bg-white"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </Button>
                )}

                <Button
                  onClick={capturePhoto}
                  disabled={!isStreaming}
                  className="bg-white text-black hover:bg-gray-100 w-16 h-16 rounded-full"
                >
                  <Camera className="w-6 h-6" />
                </Button>
              </div>

              {/* Indicador de estado */}
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="text-white text-center">
                    <Camera className="w-8 h-8 mx-auto mb-2" />
                    <p>Iniciando cámara...</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Vista previa de captura
            <div className="space-y-4">
              <div className="aspect-[4/3] bg-black rounded-lg overflow-hidden">
                <img
                  src={capturedImage}
                  alt="Captura"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Repetir
                </Button>
                <Button
                  onClick={confirmCapture}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Usar foto
                </Button>
              </div>
            </div>
          )}

          {/* Canvas oculto para captura */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Instrucciones */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-800">
                📸 <strong>Consejos para una buena captura:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Asegúrate de tener buena iluminación</li>
                <li>• Mantén el documento plano y completo en el encuadre</li>
                <li>• Evita reflejos y sombras</li>
                <li>• El texto debe ser legible</li>
              </ul>
            </CardContent>
          </Card>

          {/* Botón cancelar */}
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 