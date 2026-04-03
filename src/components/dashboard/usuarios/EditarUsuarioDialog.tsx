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
      <DialogContent className="sm:max-w-[800px] border-none shadow-2xl bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-0 overflow-hidden">
        {/* Header con gradiente suave */}
        <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-8 pb-6">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
              <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Editar Usuario</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium text-base">
                  {usuario.fullName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 pt-6 h-[60vh] overflow-y-auto bg-slate-50/50">
          {/* Indicador de estado de moroso */}
          {usuario.isMoroso && (
            <div className="mb-6 p-4 rounded-3xl border border-red-100 bg-red-50 text-red-900 shadow-sm flex items-start gap-4">
              <div className="p-2 bg-red-100 rounded-xl text-red-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">Usuario Moroso</h4>
                <p className="text-sm opacity-90 leading-relaxed">
                  Las funciones están bloqueadas y los códigos QR limitados a 5 por día. Para restablecer el acceso completo, primero debe regularizar el estado del usuario.
                </p>
              </div>
            </div>
          )}

          {/* Pestañas Modernas */}
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm w-full grid grid-cols-2 h-auto">
              <TabsTrigger
                value="personal"
                className="rounded-xl py-2.5 font-bold text-slate-500 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all duration-300"
              >
                Información Personal
              </TabsTrigger>
              <TabsTrigger
                value="funciones"
                className="rounded-xl py-2.5 font-bold text-slate-500 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all duration-300"
              >
                Funciones y Accesos
              </TabsTrigger>
            </TabsList>

            {/* Pestaña de Información Personal */}
            <TabsContent value="personal" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-6">
                {/* Sección Datos */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Datos Personales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-xs font-bold text-slate-500 ml-1">Nombre</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                        className="rounded-xl h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paternalLastName" className="text-xs font-bold text-slate-500 ml-1">Apellido Paterno</Label>
                      <Input
                        id="paternalLastName"
                        value={formData.paternalLastName}
                        onChange={(e) => handlePersonalInfoChange('paternalLastName', e.target.value)}
                        className="rounded-xl h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maternalLastName" className="text-xs font-bold text-slate-500 ml-1">Apellido Materno</Label>
                      <Input
                        id="maternalLastName"
                        value={formData.maternalLastName}
                        onChange={(e) => handlePersonalInfoChange('maternalLastName', e.target.value)}
                        className="rounded-xl h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección Residencia */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Ubicación</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="calle" className="text-xs font-bold text-slate-500 ml-1">Calle</Label>
                      <Select
                        value={formData.calle}
                        onValueChange={(value) => handlePersonalInfoChange('calle', value)}
                        disabled={isLoadingCalles}
                      >
                        <SelectTrigger className="rounded-xl h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 font-medium">
                          <SelectValue placeholder={isLoadingCalles ? "Cargando..." : "Selecciona calle"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl bg-white/95 backdrop-blur-xl">
                          {callesDisponibles.map((calle) => (
                            <SelectItem key={calle} value={calle} className="font-medium">{calle}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="houseNumber" className="text-xs font-bold text-slate-500 ml-1">Número</Label>
                      <Input
                        id="houseNumber"
                        value={formData.houseNumber}
                        onChange={(e) => handlePersonalInfoChange('houseNumber', e.target.value)}
                        className="rounded-xl h-11 border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-slate-900/10 font-medium"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="houseID" className="text-xs font-bold text-slate-500 ml-1">House ID</Label>
                      <div className="relative">
                        <Input
                          id="houseID"
                          value={formData.houseID}
                          readOnly
                          className="rounded-xl h-11 border-slate-200 bg-slate-100 font-mono text-slate-600 pl-10"
                        />
                        <div className="absolute left-3 top-3 opacity-30">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-2 ml-1">
                        Generado automáticamente: Residencial-Calle-Número
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Pestaña de Funciones y Límites */}
            <TabsContent value="funciones" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Restricciones Globales */}
              {usuario.role === 'resident' && globalRestrictions && (
                <div className="p-4 rounded-3xl border border-amber-100 bg-amber-50 text-amber-900">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">🔒</span>
                    <h4 className="font-bold">Restricciones Globales Activas</h4>
                  </div>
                  <p className="text-sm opacity-80 pl-8">Algunas funciones están deshabilitadas para todo el residencial.</p>
                </div>
              )}

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Permisos de App</h3>
                <div className="space-y-4">
                  {featureLabels.map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <Label htmlFor={key} className="font-bold text-slate-700 cursor-pointer flex-1">{label}</Label>
                      <Switch
                        id={key}
                        checked={formData.features[key]}
                        onCheckedChange={(value) => handleFeatureChange(key, value)}
                        disabled={usuario.isMoroso}
                        className={`${formData.features[key] ? 'bg-green-500' : 'bg-slate-200'} transition-all`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Límites</h3>
                <div className="flex items-center justify-between gap-4 p-2">
                  <div className="flex-1">
                    <Label htmlFor="qr-limit" className="block text-sm font-bold text-slate-700 mb-1">
                      Códigos QR Diarios
                    </Label>
                    <p className="text-xs text-slate-400 font-medium">Límite máximo de códigos generados por día</p>
                  </div>
                  <Input
                    id="qr-limit"
                    type="number"
                    value={formData.max_codigos_qr_diarios}
                    onChange={handleQrLimitChange}
                    disabled={usuario.isMoroso}
                    className="w-24 rounded-xl text-center font-bold text-lg h-12 border-slate-200"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl h-12 px-6 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="rounded-xl h-12 px-8 font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20"
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditarUsuarioDialog; 