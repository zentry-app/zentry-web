'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Search, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface DiagnosisResult {
  email: string;
  authUser: {
    uid: string;
    email: string;
    displayName: string;
    emailVerified: boolean;
    disabled: boolean;
    creationTime: string;
  } | null;
  firestoreUser: {
    uid: string;
    role: string;
    status: string;
  } | null;
  storageFiles: string[];
  canCleanup: boolean;
}

interface CleanupResult {
  authDeleted: boolean;
  firestoreDeleted: boolean;
  storageFilesDeleted: number;
  errors: string[];
}

export default function CleanupUserPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDiagnose = async () => {
    if (!email.trim()) {
      setError('Por favor ingresa un email');
      return;
    }

    setIsLoading(true);
    setError(null);
    setDiagnosis(null);
    setCleanupResult(null);

    try {
      const response = await fetch('/api/admin/cleanup-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          action: 'diagnose'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el diagnóstico');
      }

      setDiagnosis(data.diagnosis);
    } catch (error) {
      console.error('Error al diagnosticar:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!diagnosis || !diagnosis.canCleanup) return;

    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar COMPLETAMENTE el usuario ${email}?\n\n` +
      `Esto eliminará:\n` +
      `${diagnosis.authUser ? '✓ Usuario de Firebase Authentication\n' : ''}` +
      `${diagnosis.firestoreUser ? '✓ Documento de Firestore\n' : ''}` +
      `${diagnosis.storageFiles.length > 0 ? `✓ ${diagnosis.storageFiles.length} archivos de Storage\n` : ''}` +
      `\nEsta acción NO se puede deshacer.`
    );

    if (!confirmed) return;

    setIsLoading(true);
    setError(null);
    setCleanupResult(null);

    try {
      const response = await fetch('/api/admin/cleanup-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          action: 'cleanup'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la limpieza');
      }

      setCleanupResult(data.results);
      // Limpiar diagnóstico después de la limpieza exitosa
      setDiagnosis(null);
    } catch (error) {
      console.error('Error al limpiar:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Herramienta de Limpieza de Usuarios
        </h1>
        <p className="text-gray-600">
          Diagnostica y limpia usuarios problemáticos que causan conflictos en el registro
        </p>
      </div>

      {/* Formulario de búsqueda */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Diagnosticar Usuario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="email"
              placeholder="Ingresa el email del usuario a verificar"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              onClick={handleDiagnose}
              disabled={isLoading || !email.trim()}
              className="flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              {isLoading ? 'Diagnosticando...' : 'Diagnosticar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900">Error</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado del diagnóstico */}
      {diagnosis && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Diagnóstico para: {diagnosis.email}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Firebase Authentication */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Firebase Authentication</h4>
                {diagnosis.authUser && (
                  <div className="text-sm text-gray-600 mt-1">
                    <p>UID: {diagnosis.authUser.uid}</p>
                    <p>Nombre: {diagnosis.authUser.displayName}</p>
                    <p>Verificado: {diagnosis.authUser.emailVerified ? 'Sí' : 'No'}</p>
                    <p>Creado: {new Date(diagnosis.authUser.creationTime).toLocaleString()}</p>
                  </div>
                )}
              </div>
              <Badge variant={diagnosis.authUser ? "destructive" : "secondary"}>
                {diagnosis.authUser ? 'Existe' : 'No existe'}
              </Badge>
            </div>

            {/* Firestore */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Firestore (usuarios)</h4>
                {diagnosis.firestoreUser && (
                  <div className="text-sm text-gray-600 mt-1">
                    <p>Rol: {diagnosis.firestoreUser.role}</p>
                    <p>Estado: {diagnosis.firestoreUser.status}</p>
                  </div>
                )}
              </div>
              <Badge variant={diagnosis.firestoreUser ? "destructive" : "secondary"}>
                {diagnosis.firestoreUser ? 'Existe' : 'No existe'}
              </Badge>
            </div>

            {/* Storage */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Firebase Storage</h4>
                {diagnosis.storageFiles.length > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    <p>{diagnosis.storageFiles.length} archivos encontrados</p>
                    <ul className="list-disc list-inside mt-1">
                      {diagnosis.storageFiles.slice(0, 3).map((file, index) => (
                        <li key={index} className="truncate">{file}</li>
                      ))}
                      {diagnosis.storageFiles.length > 3 && (
                        <li>... y {diagnosis.storageFiles.length - 3} más</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <Badge variant={diagnosis.storageFiles.length > 0 ? "destructive" : "secondary"}>
                {diagnosis.storageFiles.length > 0 ? `${diagnosis.storageFiles.length} archivos` : 'Sin archivos'}
              </Badge>
            </div>

            {/* Botón de limpieza */}
            {diagnosis.canCleanup && (
              <div className="pt-4 border-t">
                <Button 
                  onClick={handleCleanup}
                  disabled={isLoading}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {isLoading ? 'Limpiando...' : 'Limpiar Usuario Completamente'}
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  ⚠️ Esta acción eliminará PERMANENTEMENTE todos los datos del usuario
                </p>
              </div>
            )}

            {!diagnosis.canCleanup && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">No se encontraron datos para limpiar</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resultado de la limpieza */}
      {cleanupResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Limpieza Completada
            </CardTitle>
          </CardHeader>
          <CardContent className="text-green-700">
            <div className="space-y-2">
              <p>✅ Firebase Authentication: {cleanupResult.authDeleted ? 'Eliminado' : 'Sin cambios'}</p>
              <p>✅ Firestore: {cleanupResult.firestoreDeleted ? 'Eliminado' : 'Sin cambios'}</p>
              <p>✅ Storage: {cleanupResult.storageFilesDeleted} archivo(s) eliminado(s)</p>
              
              {cleanupResult.errors.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                  <h4 className="font-medium text-yellow-800">Advertencias:</h4>
                  <ul className="list-disc list-inside text-yellow-700 text-sm mt-1">
                    {cleanupResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-blue-100 rounded-lg">
              <p className="text-blue-800 text-sm">
                💡 <strong>Siguiente paso:</strong> Ahora puedes intentar registrarte nuevamente con este email
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instrucciones adicionales */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Instrucciones Adicionales</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p><strong>1. Consola de Firebase:</strong> También puedes eliminar usuarios manualmente desde la consola de Firebase Authentication</p>
          <p><strong>2. Caché del navegador:</strong> Después de la limpieza, borra el caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)</p>
          <p><strong>3. Incógnito:</strong> Prueba el registro en una ventana de incógnito para evitar problemas de caché</p>
          <p><strong>4. Verificación:</strong> Si el problema persiste, contacta al administrador del sistema</p>
        </CardContent>
      </Card>
    </div>
  );
} 