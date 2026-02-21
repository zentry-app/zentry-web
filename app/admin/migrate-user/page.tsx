'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AdminLayout } from '@/components/dashboard/admin-layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowRightLeft, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Mail,
  Home,
  Building2,
  Loader2,
  History,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UserValidation {
  found: boolean;
  user: {
    uid: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
    residencialID: string;
    residencialName?: string;
    houseNumber: string;
    isActive: boolean;
    createdAt?: string;
  } | null;
  relatedData: {
    pagos: number;
    reservaciones: number;
    ingresos: number;
    tags: number;
    chats: number;
    messageNotifications: number;
    supportTickets: number;
    supportConversations: number;
  } | null;
}

interface MigrationResult {
  success: boolean;
  migratedData: {
    pagos: number;
    reservaciones: number;
    ingresos: number;
    tags: number;
    chats: number;
    messageNotifications: number;
    supportTickets: number;
    supportConversations: number;
  };
  sourceDeactivated: boolean;
  errors: string[];
}

interface MigrationHistoryItem {
  id: string;
  sourceUid: string;
  sourceEmail: string;
  sourceName: string;
  destUid: string;
  destEmail: string;
  destName: string;
  residencialId: string;
  residencialName: string;
  migratedData: {
    pagos: number;
    reservaciones: number;
    ingresos: number;
    tags: number;
    chats: number;
    messageNotifications: number;
    supportTickets: number;
    supportConversations: number;
  };
  performedBy: string;
  migratedAt: string;
  success: boolean;
}

export default function MigrateUserPage() {
  const { user } = useAuth();
  const [sourceEmail, setSourceEmail] = useState('');
  const [destEmail, setDestEmail] = useState('');
  const [sourceValidation, setSourceValidation] = useState<UserValidation | null>(null);
  const [destValidation, setDestValidation] = useState<UserValidation | null>(null);
  const [isValidatingSource, setIsValidatingSource] = useState(false);
  const [isValidatingDest, setIsValidatingDest] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [confirmMigration, setConfirmMigration] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [migrationHistory, setMigrationHistory] = useState<MigrationHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Cargar historial al montar el componente
  useEffect(() => {
    loadMigrationHistory();
  }, []);

  const loadMigrationHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/admin/migrate-user');
      const data = await response.json();
      if (data.success) {
        setMigrationHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const validateUser = async (email: string, type: 'source' | 'dest') => {
    if (!email.trim()) {
      setError(`Por favor ingresa el email ${type === 'source' ? 'origen' : 'destino'}`);
      return;
    }

    const setIsValidating = type === 'source' ? setIsValidatingSource : setIsValidatingDest;
    const setValidation = type === 'source' ? setSourceValidation : setDestValidation;

    setIsValidating(true);
    setError(null);
    setMigrationResult(null);
    setConfirmMigration(false);

    try {
      const response = await fetch('/api/admin/migrate-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          action: 'validate'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la validación');
      }

      setValidation(data.validation);
    } catch (error) {
      console.error('Error al validar:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setValidation(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleMigrate = async () => {
    if (!sourceValidation?.found || !destValidation?.found || !confirmMigration) return;

    // Validaciones adicionales
    if (sourceValidation.user?.role === 'admin' || sourceValidation.user?.role === 'developer') {
      setError('No se puede migrar desde cuentas de administrador o desarrollador');
      return;
    }

    if (destValidation.user?.role === 'admin' || destValidation.user?.role === 'developer') {
      setError('No se puede migrar hacia cuentas de administrador o desarrollador');
      return;
    }

    if (sourceValidation.user?.residencialID !== destValidation.user?.residencialID) {
      setError('Ambos usuarios deben pertenecer al mismo residencial');
      return;
    }

    setIsMigrating(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/migrate-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceUid: sourceValidation.user?.uid,
          destUid: destValidation.user?.uid,
          residencialId: sourceValidation.user?.residencialID,
          performedBy: user?.email || 'unknown',
          action: 'migrate'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la migración');
      }

      setMigrationResult(data.result);
      // Limpiar validaciones después de migración exitosa
      setSourceValidation(null);
      setDestValidation(null);
      setSourceEmail('');
      setDestEmail('');
      setConfirmMigration(false);
      // Recargar historial
      loadMigrationHistory();
    } catch (error) {
      console.error('Error al migrar:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsMigrating(false);
    }
  };

  const canMigrate = sourceValidation?.found && 
                    destValidation?.found && 
                    confirmMigration &&
                    sourceValidation.user?.uid !== destValidation.user?.uid;

  const renderUserCard = (
    validation: UserValidation | null, 
    type: 'source' | 'dest',
    email: string,
    setEmail: (value: string) => void,
    isValidating: boolean
  ) => {
    const isSource = type === 'source';
    
    return (
      <Card className={`flex-1 ${validation?.found ? (isSource ? 'border-orange-200' : 'border-green-200') : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isSource ? (
              <>
                <User className="w-5 h-5 text-orange-500" />
                Usuario Origen (cuenta incorrecta)
              </>
            ) : (
              <>
                <User className="w-5 h-5 text-green-500" />
                Usuario Destino (cuenta correcta)
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isSource 
              ? 'Ingresa el correo de la cuenta que tiene los datos a migrar'
              : 'Ingresa el correo de la cuenta que recibirá los datos'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isValidating || isMigrating}
              className="flex-1"
            />
            <Button 
              onClick={() => validateUser(email, type)}
              disabled={isValidating || !email.trim() || isMigrating}
              variant={isSource ? "outline" : "outline"}
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {validation && (
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estado:</span>
                <Badge variant={validation.found ? (isSource ? "destructive" : "default") : "secondary"}>
                  {validation.found ? 'Usuario encontrado' : 'No encontrado'}
                </Badge>
              </div>

              {validation.found && validation.user && (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{validation.user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{validation.user.fullName || 'Sin nombre'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-gray-400" />
                      <span>Casa: {validation.user.houseNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span>{validation.user.residencialName || validation.user.residencialID}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Rol:</span>
                      <Badge variant="outline">{validation.user.role}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Estado:</span>
                      <Badge variant={validation.user.status === 'approved' ? 'default' : 'secondary'}>
                        {validation.user.status}
                      </Badge>
                    </div>
                  </div>

                  {isSource && validation.relatedData && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Datos a migrar:</p>
                      <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                        <span>Pagos: {validation.relatedData.pagos}</span>
                        <span>Reservaciones: {validation.relatedData.reservaciones}</span>
                        <span>Ingresos: {validation.relatedData.ingresos}</span>
                        <span>Tags: {validation.relatedData.tags}</span>
                        <span>Chats: {validation.relatedData.chats}</span>
                        <span>Notificaciones: {validation.relatedData.messageNotifications}</span>
                        <span>Tickets: {validation.relatedData.supportTickets}</span>
                        <span>Conversaciones: {validation.relatedData.supportConversations}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminLayout requireGlobalAdmin={true}>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <ArrowRightLeft className="w-8 h-8" />
            Migración de Cuentas de Usuario
          </h1>
          <p className="text-gray-600">
            Transfiere todos los datos de una cuenta de usuario a otra. 
            La cuenta origen será desactivada después de la migración.
          </p>
        </div>

        {/* Error global */}
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

        {/* Formularios de validación */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {renderUserCard(sourceValidation, 'source', sourceEmail, setSourceEmail, isValidatingSource)}
          {renderUserCard(destValidation, 'dest', destEmail, setDestEmail, isValidatingDest)}
        </div>

        {/* Sección de migración */}
        {sourceValidation?.found && destValidation?.found && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-5 h-5" />
                Confirmar Migración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sourceValidation.user?.uid === destValidation.user?.uid ? (
                <p className="text-red-600">
                  Los correos origen y destino pertenecen al mismo usuario. 
                  Por favor selecciona cuentas diferentes.
                </p>
              ) : sourceValidation.user?.residencialID !== destValidation.user?.residencialID ? (
                <p className="text-red-600">
                  Los usuarios pertenecen a residenciales diferentes. 
                  La migración solo es posible dentro del mismo residencial.
                </p>
              ) : (
                <>
                  <div className="p-4 bg-white rounded-lg border">
                    <p className="text-sm text-gray-700 mb-3">
                      <strong>Resumen de la migración:</strong>
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-orange-600">{sourceValidation.user?.email}</span>
                      <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-green-600">{destValidation.user?.email}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Todos los datos (pagos, reservaciones, ingresos, tags, chats, etc.) 
                      serán transferidos a la cuenta destino.
                    </p>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="confirm" 
                      checked={confirmMigration}
                      onCheckedChange={(checked) => setConfirmMigration(checked === true)}
                      disabled={isMigrating}
                    />
                    <Label htmlFor="confirm" className="text-sm text-amber-800 leading-tight cursor-pointer">
                      Entiendo que esta acción transferirá todos los datos del usuario origen 
                      al usuario destino y desactivará la cuenta origen. Esta acción no se puede deshacer fácilmente.
                    </Label>
                  </div>

                  <Button 
                    onClick={handleMigrate}
                    disabled={!canMigrate || isMigrating}
                    className="w-full"
                    variant="default"
                  >
                    {isMigrating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Migrando datos...
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                        Ejecutar Migración
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resultado de la migración */}
        {migrationResult && (
          <Card className={migrationResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${migrationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {migrationResult.success ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                {migrationResult.success ? 'Migración Completada' : 'Error en la Migración'}
              </CardTitle>
            </CardHeader>
            <CardContent className={migrationResult.success ? 'text-green-700' : 'text-red-700'}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="p-2 bg-white rounded border">
                    <span className="block text-xs text-gray-500">Pagos</span>
                    <span className="font-medium">{migrationResult.migratedData.pagos}</span>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <span className="block text-xs text-gray-500">Reservaciones</span>
                    <span className="font-medium">{migrationResult.migratedData.reservaciones}</span>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <span className="block text-xs text-gray-500">Ingresos</span>
                    <span className="font-medium">{migrationResult.migratedData.ingresos}</span>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <span className="block text-xs text-gray-500">Tags</span>
                    <span className="font-medium">{migrationResult.migratedData.tags}</span>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <span className="block text-xs text-gray-500">Chats</span>
                    <span className="font-medium">{migrationResult.migratedData.chats}</span>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <span className="block text-xs text-gray-500">Notificaciones</span>
                    <span className="font-medium">{migrationResult.migratedData.messageNotifications}</span>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <span className="block text-xs text-gray-500">Tickets</span>
                    <span className="font-medium">{migrationResult.migratedData.supportTickets}</span>
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <span className="block text-xs text-gray-500">Conversaciones</span>
                    <span className="font-medium">{migrationResult.migratedData.supportConversations}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  {migrationResult.sourceDeactivated ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span>
                    Cuenta origen: {migrationResult.sourceDeactivated ? 'Desactivada' : 'No se pudo desactivar'}
                  </span>
                </div>

                {migrationResult.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
                    <h4 className="font-medium text-yellow-800">Advertencias:</h4>
                    <ul className="list-disc list-inside text-yellow-700 text-sm mt-1">
                      {migrationResult.errors.map((err, index) => (
                        <li key={index}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historial de Migraciones */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Historial de Migraciones
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={loadMigrationHistory}
                disabled={isLoadingHistory}
              >
                {isLoadingHistory ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : migrationHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay migraciones registradas
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cuenta Origen</TableHead>
                      <TableHead>Cuenta Destino</TableHead>
                      <TableHead>Residencial</TableHead>
                      <TableHead>Datos Migrados</TableHead>
                      <TableHead>Realizado por</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {migrationHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap">
                          {item.migratedAt ? new Date(item.migratedAt).toLocaleString('es-MX', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          }) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{item.sourceEmail}</div>
                            <div className="text-gray-500 text-xs">{item.sourceName}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{item.destEmail}</div>
                            <div className="text-gray-500 text-xs">{item.destName}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.residencialName || item.residencialId}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-gray-600 space-y-0.5">
                            {item.migratedData && (
                              <>
                                {item.migratedData.pagos > 0 && <div>Pagos: {item.migratedData.pagos}</div>}
                                {item.migratedData.reservaciones > 0 && <div>Reservaciones: {item.migratedData.reservaciones}</div>}
                                {item.migratedData.ingresos > 0 && <div>Ingresos: {item.migratedData.ingresos}</div>}
                                {item.migratedData.tags > 0 && <div>Tags: {item.migratedData.tags}</div>}
                                {item.migratedData.chats > 0 && <div>Chats: {item.migratedData.chats}</div>}
                                {Object.values(item.migratedData).every(v => v === 0) && <span className="text-gray-400">Sin datos</span>}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {item.performedBy}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.success ? "default" : "destructive"}>
                            {item.success ? 'Exitoso' : 'Error'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instrucciones */}
        <Card className="bg-blue-50 border-blue-200 mt-6">
          <CardHeader>
            <CardTitle className="text-blue-900">Instrucciones de Uso</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 space-y-2 text-sm">
            <p><strong>1.</strong> Ingresa el correo de la cuenta origen (la que tiene los datos pero el usuario no puede acceder)</p>
            <p><strong>2.</strong> Valida que el usuario exista y revisa los datos asociados</p>
            <p><strong>3.</strong> Ingresa el correo de la cuenta destino (la nueva cuenta del usuario)</p>
            <p><strong>4.</strong> Valida que ambos usuarios pertenezcan al mismo residencial</p>
            <p><strong>5.</strong> Confirma la migración marcando el checkbox</p>
            <p><strong>6.</strong> Ejecuta la migración - todos los datos serán transferidos</p>
            <p className="text-blue-600 mt-3">
              <strong>Nota:</strong> La cuenta origen será desactivada pero no eliminada, 
              permitiendo reversión manual si es necesario.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
