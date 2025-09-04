import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Usuario, UserFeatures, GlobalScreenRestrictions, getUsuariosPorResidencial } from '@/lib/firebase/firestore';
import { FeatureAccessService } from '@/lib/services/feature-access-service';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface EditarUsuarioDialogProps {
  usuario: Usuario | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedData: Partial<Usuario>) => Promise<void>;
}

interface FormData {
  // Información personal
  fullName: string;
  paternalLastName: string;
  maternalLastName: string;
  calle: string;
  houseNumber: string;
  houseID: string;
  // Funciones
  features: UserFeatures;
  max_codigos_qr_diarios: number;
}

const EditarUsuarioDialog: React.FC<EditarUsuarioDialogProps> = ({ usuario, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<FormData>({
    // Información personal
    fullName: '',
    paternalLastName: '',
    maternalLastName: '',
    calle: '',
    houseNumber: '',
    houseID: '',
    // Funciones
    features: { visitas: true, eventos: true, mensajes: true, reservas: true, encuestas: true },
    max_codigos_qr_diarios: 10,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [globalRestrictions, setGlobalRestrictions] = useState<GlobalScreenRestrictions | null>(null);
  const [isLoadingGlobalRestrictions, setIsLoadingGlobalRestrictions] = useState(false);
  const [callesDisponibles, setCallesDisponibles] = useState<string[]>([]);
  const [isLoadingCalles, setIsLoadingCalles] = useState(false);

  useEffect(() => {
    const loadGlobalRestrictions = async () => {
      if (usuario && usuario.role === 'resident' && usuario.residencialID) {
        setIsLoadingGlobalRestrictions(true);
        try {
          const hasGlobalRestrictions = await FeatureAccessService.hasGlobalRestrictions(usuario, usuario.residencialID);
          if (hasGlobalRestrictions) {
            // Aquí podrías cargar las restricciones específicas si las necesitas
            setGlobalRestrictions({} as GlobalScreenRestrictions); // Placeholder
          }
        } catch (error) {
          console.error('Error cargando restricciones globales:', error);
        } finally {
          setIsLoadingGlobalRestrictions(false);
        }
      }
    };

      const loadCallesResidencial = async () => {
    if (usuario) {
      const residencialId = (usuario as any).residencialID || (usuario as any).residencialId;
      console.log('🔍 Debug usuario completo:', {
        usuario: usuario,
        residencialID: (usuario as any).residencialID,
        residencialId: (usuario as any).residencialId,
        residencialIdFinal: residencialId
      });
      
      if (residencialId) {
        setIsLoadingCalles(true);
        try {
          console.log('🔍 Cargando calles para residencial ID:', residencialId);
        
        // Buscar el documento del residencial por su campo residencialID
        console.log('🔍 Buscando residencial por residencialID:', residencialId);
        const residencialesRef = collection(db, 'residenciales');
        const q = query(residencialesRef, where('residencialID', '==', residencialId));
        const residencialSnap = await getDocs(q);
        
        if (!residencialSnap.empty) {
          const residencialDoc = residencialSnap.docs[0];
          console.log('📄 Documento encontrado con ID:', residencialDoc.id);
          const residencialData = residencialDoc.data();
          console.log('📄 Documento residencial completo:', residencialData);
          
          // Verificar si existe el campo calles y es un array
          if (residencialData.calles && Array.isArray(residencialData.calles)) {
            console.log('✅ Calles encontradas en residencial:', residencialData.calles);
            const callesFiltradas = residencialData.calles.filter((calle: string) => calle && calle.trim() !== '');
            console.log('🏠 Calles filtradas:', callesFiltradas.length, callesFiltradas);
            setCallesDisponibles(callesFiltradas);
          } else {
            console.log('⚠️ No se encontraron calles en el residencial. Campo calles:', residencialData.calles);
            console.log('⚠️ Tipo de campo calles:', typeof residencialData.calles);
            console.log('⚠️ Es array?:', Array.isArray(residencialData.calles));
            setCallesDisponibles([]);
          }
        } else {
          console.log('❌ No se encontró residencial con residencialID:', residencialId);
          setCallesDisponibles([]);
        }
        
      } catch (error) {
        console.error('Error cargando calles del residencial:', error);
        setCallesDisponibles([]);
              } finally {
          setIsLoadingCalles(false);
        }
      } else {
        console.log('❌ No se encontró residencialID en el usuario');
        setCallesDisponibles([]);
      }
    } else {
      console.log('❌ No hay usuario disponible');
      setCallesDisponibles([]);
      }
    };

    if (usuario) {
      // Si el usuario es moroso, todas las funciones deben estar deshabilitadas
      const features = usuario.isMoroso ? {
        visitas: false,
        eventos: false,
        mensajes: false,
        reservas: false,
        encuestas: false,
      } : (usuario.features || { visitas: true, eventos: true, mensajes: true, reservas: true, encuestas: true });

      const calle = (usuario as any).calle || '';
      const houseNumber = (usuario as any).houseNumber || '';
      const residencialId = (usuario as any).residencialID || (usuario as any).residencialId || '';
      const existingHouseID = (usuario as any).houseID || (usuario as any).houseId || '';
      
      // Si no hay houseID existente pero sí hay calle y número, generar uno nuevo
      const calculatedHouseID = !existingHouseID && residencialId && calle && houseNumber 
        ? generateHouseID(residencialId, calle, houseNumber)
        : existingHouseID;

      setFormData({
        // Información personal
        fullName: usuario.fullName || '',
        paternalLastName: usuario.paternalLastName || '',
        maternalLastName: usuario.maternalLastName || '',
        calle,
        houseNumber,
        houseID: calculatedHouseID,
        // Funciones
        features,
        max_codigos_qr_diarios: usuario.isMoroso ? 5 : (usuario.max_codigos_qr_diarios ?? 10),
      });

      // Cargar restricciones globales y calles del residencial
      loadGlobalRestrictions();
      loadCallesResidencial();
    }
  }, [usuario]);

  if (!usuario) return null;

  // Función para generar houseID estructurado: {residencialId}-{calle_normalizada}-{houseNumber}
  const generateHouseID = (residencialId: string, calle: string, houseNumber: string): string => {
    if (!residencialId || !calle || !houseNumber) return '';
    
    const normalizeStreet = (street: string): string => {
      return street
        .replace(/^CALLE\s+/i, '') // Quitar prefijo 'CALLE'
        .replace(/[áÁ]/g, 'A')
        .replace(/[éÉ]/g, 'E')
        .replace(/[íÍ]/g, 'I')
        .replace(/[óÓ]/g, 'O')
        .replace(/[úÚüÜ]/g, 'U')
        .replace(/[^A-Z0-9 ]/gi, '') // Quitar caracteres especiales
        .replace(/\s+/g, '_')
        .toUpperCase();
    };
    
    const calleNorm = normalizeStreet(calle);
    const houseID = `${residencialId}-${calleNorm}-${houseNumber}`;
    console.log('🏠 House ID generado (estructurado):', houseID);
    return houseID;
  };

  const handlePersonalInfoChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value,
      };
      
      // Generar/actualizar houseID en tiempo real cuando cambian calle o número
      if (field === 'calle' || field === 'houseNumber') {
        const newCalle = field === 'calle' ? value : prev.calle;
        const newHouseNumber = field === 'houseNumber' ? value : prev.houseNumber;
        const residencialId = (usuario as any)?.residencialID || (usuario as any)?.residencialId || '';
        
        // Generar houseID estructurado si todos los campos están presentes
        if (residencialId && newCalle && newHouseNumber) {
          updated.houseID = generateHouseID(residencialId, newCalle, newHouseNumber);
        } else {
          updated.houseID = ''; // Limpiar si faltan datos
        }
      }
      
      return updated;
    });
  };

  const handleFeatureChange = (featureName: keyof UserFeatures, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureName]: value,
      },
    }));
  };

  const handleQrLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      max_codigos_qr_diarios: parseInt(e.target.value, 10) || 0,
    }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    
    // Datos de información personal
    let dataToUpdate: Partial<Usuario> = {
      fullName: formData.fullName,
      paternalLastName: formData.paternalLastName,
      maternalLastName: formData.maternalLastName,
      features: formData.features,
      max_codigos_qr_diarios: formData.max_codigos_qr_diarios,
    };

    // Incluir datos de casa (usar any para campos que no están en la interfaz Usuario)
    (dataToUpdate as any).calle = formData.calle;
    (dataToUpdate as any).houseNumber = formData.houseNumber;
    (dataToUpdate as any).houseID = formData.houseID;
    
    if (usuario.isMoroso) {
      // Deshabilitar todas las funciones para usuarios morosos
      dataToUpdate.features = {
        visitas: false,
        eventos: false,
        mensajes: false,
        reservas: false,
        encuestas: false,
      };
      
      // Limitar códigos QR a 5 por día para usuarios morosos
      dataToUpdate.max_codigos_qr_diarios = 5;
    }
    
    await onUpdate(dataToUpdate);
    setIsSaving(false);
  };

  const featureLabels: { key: keyof UserFeatures; label: string }[] = [
    { key: 'visitas', label: 'Permitir Visitas' },
    { key: 'eventos', label: 'Permitir Eventos' },
    { key: 'mensajes', label: 'Permitir Mensajes' },
    { key: 'reservas', label: 'Permitir Reservas' },
    { key: 'encuestas', label: 'Permitir Encuestas' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Usuario: {usuario.fullName}</DialogTitle>
          <DialogDescription>
            Modifica la información personal, permisos y límites del usuario. Los cambios se aplicarán en tiempo real.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 overflow-y-auto flex-1">
          {/* Indicador de estado de moroso */}
          {usuario.isMoroso && (
            <Card className="mb-4 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Usuario marcado como moroso</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  Las funciones están bloqueadas y no se pueden modificar. Los códigos QR están limitados a 5 por día.
                </p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-2 font-medium">
                  💡 Para habilitar las funciones, primero debe desmarcar al usuario como moroso desde la tabla principal.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pestañas */}
          <Tabs defaultValue="personal" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="personal">Información Personal</TabsTrigger>
              <TabsTrigger value="funciones">Funciones y Límites</TabsTrigger>
            </TabsList>
            
            {/* Pestaña de Información Personal */}
            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Datos Personales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nombre</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                        placeholder="Nombre completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paternalLastName">Apellido Paterno</Label>
                      <Input
                        id="paternalLastName"
                        value={formData.paternalLastName}
                        onChange={(e) => handlePersonalInfoChange('paternalLastName', e.target.value)}
                        placeholder="Apellido paterno"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maternalLastName">Apellido Materno</Label>
                      <Input
                        id="maternalLastName"
                        value={formData.maternalLastName}
                        onChange={(e) => handlePersonalInfoChange('maternalLastName', e.target.value)}
                        placeholder="Apellido materno"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información de Residencia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="calle">Calle</Label>
                      <Select
                        value={formData.calle}
                        onValueChange={(value) => handlePersonalInfoChange('calle', value)}
                        disabled={isLoadingCalles}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingCalles ? "Cargando calles..." : "Selecciona una calle"} />
                        </SelectTrigger>
                        <SelectContent>
                          {callesDisponibles.map((calle) => (
                            <SelectItem key={calle} value={calle}>
                              {calle}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="houseNumber">Número de Casa</Label>
                      <Input
                        id="houseNumber"
                        value={formData.houseNumber}
                        onChange={(e) => handlePersonalInfoChange('houseNumber', e.target.value)}
                        placeholder="Número de casa"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="houseID">House ID</Label>
                      <Input
                        id="houseID"
                        value={formData.houseID}
                        readOnly
                        className="bg-gray-100 dark:bg-gray-800"
                        placeholder="ResidencialID-Calle-Número (ej: ABC123-JUAREZ-15)"
                      />
                      <p className="text-xs text-muted-foreground">
                        El House ID se genera automáticamente con el formato: ResidencialID-Calle-Número. Se actualiza en tiempo real al cambiar calle o número.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pestaña de Funciones y Límites */}
            <TabsContent value="funciones" className="space-y-4">
              {/* Indicador de restricciones globales */}
          {usuario.role === 'resident' && globalRestrictions && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2 text-orange-700 dark:text-orange-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Restricciones globales activas</span>
                </div>
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                  Algunas funciones están bloqueadas a nivel global para todos los residentes del residencial.
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Control de Funciones</CardTitle>
              {usuario.isMoroso && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ Usuario marcado como moroso. Las funciones están bloqueadas y no se pueden modificar.
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {featureLabels.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between space-x-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Label htmlFor={key} className="flex-1 cursor-pointer">
                    {label}
                  </Label>
                  <Switch
                    id={key}
                    checked={formData.features[key]}
                    onCheckedChange={(value) => handleFeatureChange(key, value)}
                    disabled={usuario.isMoroso}
                    className={`${formData.features[key] ? 'bg-green-500' : ''} ${usuario.isMoroso ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          
              <Card>
            <CardHeader>
              <CardTitle className="text-lg">Límites</CardTitle>
              {usuario.isMoroso && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ Los códigos QR están limitados a 5 por día para usuarios morosos y no se pueden modificar.
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="qr-limit" className="flex-1">
                  Códigos QR por día
                </Label>
                <Input
                  id="qr-limit"
                  type="number"
                  value={formData.max_codigos_qr_diarios}
                  onChange={handleQrLimitChange}
                  disabled={usuario.isMoroso}
                  className={`w-24 ${usuario.isMoroso ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
            </CardContent>
          </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditarUsuarioDialog; 