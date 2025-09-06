"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  AlertCircle, 
  Info, 
  Car,
  Home,
  Calendar,
  FileText,
  Check,
  ChevronsUpDown
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getAuthSafe } from "@/lib/firebase/config";

interface Residencial {
  id: string;
  nombre: string;
}

interface Casa {
  id: string;
  nombre: string;
  residencialId: string;
  calle?: string;
  houseNumber?: string;
  houseID?: string;
  searchText?: string;
}

interface Panel {
  id: string;
  nombre: string;
  tipo: 'vehicular' | 'peatonal';
  residencialId: string;
}

interface TagFormData {
  cardNumberDec: string;
  residencialId: string;
  casaId: string;
  panels: string[];
  status: 'active' | 'disabled';
  plate?: string;
  notes?: string;
  applyImmediately: boolean;
}

interface AddTagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTagCreated: (tag: any) => void;
  residenciales: Residencial[];
  casas: Casa[];
  paneles: Panel[];
  currentUserId: string;
  esAdminDeResidencial?: boolean;
  residencialIdDelAdmin?: string | null;
}

export function AddTagModal({
  open,
  onOpenChange,
  onTagCreated,
  residenciales,
  casas,
  paneles,
  currentUserId,
  esAdminDeResidencial = false,
  residencialIdDelAdmin = null
}: AddTagModalProps) {
  const [formData, setFormData] = useState<TagFormData>({
    cardNumberDec: "",
    residencialId: "",
    casaId: "",
    panels: [],
    status: 'active',
    plate: "",
    notes: "",
    applyImmediately: true,
  });

  const [loading, setLoading] = useState(false);
  const [validatingCard, setValidatingCard] = useState(false);
  const [cardExists, setCardExists] = useState(false);
  const [casasFiltradas, setCasasFiltradas] = useState<Casa[]>([]);
  
  // Estado para casas cargadas directamente en el modal
  const [casasModal, setCasasModal] = useState<Casa[]>([]);
  const [panelesFiltrados, setPanelesFiltrados] = useState<Panel[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [openCasaSelector, setOpenCasaSelector] = useState(false);

  // Función para obtener el token de autenticación
  const getAuthToken = async () => {
    const auth = await getAuthSafe();
    if (!auth) {
      throw new Error('Firebase Auth no disponible');
    }
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    throw new Error('Usuario no autenticado');
  };

  // Función para obtener casas directamente en el modal
  const obtenerCasasModal = async (residencialDocId: string): Promise<Casa[]> => {
    try {
      const { collection, getDocs, doc, getDoc, query, where } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      console.log(`🏠 [MODAL] Obteniendo casas para residencial: ${residencialDocId}`);
      
      // PRIMERO: Verificar que el residencial existe y obtener su residencialID
      const residencialRef = doc(db, 'residenciales', residencialDocId);
      const residencialDoc = await getDoc(residencialRef);
      console.log(`🏠 [MODAL] Residencial existe:`, residencialDoc.exists());
      
      let residencialID = null;
      if (residencialDoc.exists()) {
        const residencialData = residencialDoc.data();
        residencialID = residencialData?.residencialID;
        console.log(`🏠 [MODAL] Datos del residencial:`, residencialData);
        console.log(`🏠 [MODAL] ResidencialID encontrado:`, residencialID);
      }
      
      // SEGUNDO: Buscar casas en múltiples ubicaciones
      let casas: Casa[] = [];
      
      // 1. Buscar en residenciales/{docId}/casas (estructura esperada)
      try {
      const casasRef = collection(db, 'residenciales', residencialDocId, 'casas');
      console.log(`🏠 [MODAL] Consultando colección: residenciales/${residencialDocId}/casas`);
      
      const casasSnapshot = await getDocs(casasRef);
        console.log(`🏠 [MODAL] Documentos encontrados en subcolección: ${casasSnapshot.docs.length}`);
        
        if (casasSnapshot.docs.length > 0) {
          casas = casasSnapshot.docs.map(doc => {
            const data = doc.data();
            console.log(`🏠 [MODAL] Procesando casa ${doc.id}:`, data);
            return {
              id: doc.id,
              nombre: data.nombre || data.houseID || data.direccion || `Casa ${doc.id}`,
              residencialId: residencialDocId,
              ...data
            };
          });
        }
      } catch (error) {
        console.log(`🏠 [MODAL] Error en subcolección casas:`, error);
      }
      
      // 2. Si no hay casas y tenemos residencialID, buscar en colección principal de casas
      if (casas.length === 0 && residencialID) {
        try {
          console.log(`🏠 [MODAL] Buscando en colección principal 'casas' con residencialID: ${residencialID}`);
        const casasMainRef = collection(db, 'casas');
          const q = query(casasMainRef, where('residencialID', '==', residencialID));
          const casasMainSnapshot = await getDocs(q);
          console.log(`🏠 [MODAL] Documentos en colección 'casas' con residencialID ${residencialID}: ${casasMainSnapshot.docs.length}`);
        
        if (casasMainSnapshot.docs.length > 0) {
            casas = casasMainSnapshot.docs.map(doc => {
              const data = doc.data();
              console.log(`🏠 [MODAL] Procesando casa principal ${doc.id}:`, data);
              return {
                id: doc.id,
                nombre: data.nombre || data.houseID || data.direccion || `Casa ${doc.id}`,
                residencialId: residencialDocId,
                ...data
              };
            });
          }
        } catch (error) {
          console.log(`🏠 [MODAL] Error en colección principal casas:`, error);
        }
      }
      
      // 3. Si aún no hay casas, buscar en usuarios que pertenezcan a este residencial
      if (casas.length === 0 && residencialID) {
        try {
          console.log(`🏠 [MODAL] Buscando casas únicas en usuarios con residencialID: ${residencialID}`);
          const usuariosRef = collection(db, 'usuarios');
          const q = query(usuariosRef, where('residencialID', '==', residencialID));
          const usuariosSnapshot = await getDocs(q);
          console.log(`🏠 [MODAL] Usuarios encontrados: ${usuariosSnapshot.docs.length}`);
          
          // Usar la misma lógica que la página de usuarios para obtener TODAS las casas únicas
          const sanitize = (s?: string) => (s || '')
            .toString()
            .replace(/[\u0000-\u001F\u007F-\u009F\u200B\u200C\u200D\uFEFF]/g, '');
          const normalize = (s?: string) => sanitize(s).trim().toUpperCase().replace(/\s+/g, ' ');
          const addrKey = (calle?: string, houseNumber?: string) => `ADDR::${normalize(calle)}#${normalize(houseNumber)}`;
          
          // Índices para detectar duplicados y unificar casas
          const hidIndex = new Map<string, string>();
          const addrIndex = new Map<string, string>();
          const casasUnicas = new Map<string, Casa>();
          
          // Solo residentes con referencia de casa (igual que en usuarios)
          const soloResidentes = usuariosSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((u: any) => {
              const tieneCasa = u.houseID || u.houseId || u.houseNumber || u.calle;
              return u.role === 'resident' && !!tieneCasa;
            });
          
          console.log(`🏠 [MODAL] Residentes con casa encontrados: ${soloResidentes.length}`);
          
          for (const usuario of soloResidentes) {
            const rawHid = ((usuario as any).houseID || (usuario as any).houseId || '').toString();
            const hidSanitized = sanitize(rawHid);
            const hidNorm = normalize(hidSanitized);
            const aKey = addrKey((usuario as any).calle, (usuario as any).houseNumber);
            
            // Elegir key preferente (igual que en usuarios)
            let chosenKey = hidNorm || aKey;
            
            // Verificar consistencia con índices existentes
            if (hidNorm) {
              const hidExisting = hidIndex.get(hidNorm);
              if (hidExisting && hidExisting !== chosenKey) {
                chosenKey = hidExisting;
              } else if (!hidExisting) {
                hidIndex.set(hidNorm, chosenKey);
              }
            }
            if (!addrIndex.has(aKey)) addrIndex.set(aKey, chosenKey);
            
            // Solo agregar si no existe ya
            if (!casasUnicas.has(chosenKey)) {
              const calle = (usuario as any).calle || '';
              const houseNumber = (usuario as any).houseNumber || '';
              const houseID = hidSanitized || '';
              
              // Crear nombre descriptivo
              const nombreDescriptivo = calle && houseNumber 
                ? `${calle} ${houseNumber}` 
                : houseID || `${calle} ${houseNumber}`.trim();
              
              casasUnicas.set(chosenKey, {
                id: chosenKey,
                nombre: nombreDescriptivo,
                residencialId: residencialDocId,
                calle: calle,
                houseNumber: houseNumber,
                houseID: houseID,
                searchText: `${calle} ${houseNumber} ${houseID}`.toLowerCase().trim()
              });
            }
          }
          
          if (casasUnicas.size > 0) {
            casas = Array.from(casasUnicas.values());
            console.log(`🏠 [MODAL] Casas únicas extraídas de residentes: ${casas.length}`);
            console.log(`🏠 [MODAL] Primeras 3 casas:`, casas.slice(0, 3).map(c => ({ 
              id: c.id, 
              nombre: c.nombre, 
              calle: c.calle, 
              houseNumber: c.houseNumber 
            })));
          }
        } catch (error) {
          console.log(`🏠 [MODAL] Error extrayendo casas de usuarios:`, error);
        }
      }
      
      // 4. Último fallback: buscar todas las casas sin filtro
      if (casas.length === 0) {
        try {
          console.log(`🏠 [MODAL] Último fallback: buscando todas las casas`);
          const casasMainRef = collection(db, 'casas');
          const casasMainSnapshot = await getDocs(casasMainRef);
          console.log(`🏠 [MODAL] Total de casas en colección principal: ${casasMainSnapshot.docs.length}`);
          
          if (casasMainSnapshot.docs.length > 0) {
            console.log(`🏠 [MODAL] Primeras 5 casas encontradas:`, 
              casasMainSnapshot.docs.slice(0, 5).map(doc => ({ 
                id: doc.id, 
                data: doc.data(),
                residencialID: doc.data().residencialID 
              }))
            );
            
            // Filtrar por residencialID si está disponible
            casas = casasMainSnapshot.docs
              .filter(doc => !residencialID || doc.data().residencialID === residencialID)
              .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.nombre || data.houseID || data.direccion || `Casa ${doc.id}`,
          residencialId: residencialDocId,
          ...data
        };
      });
          }
        } catch (error) {
          console.log(`🏠 [MODAL] Error en último fallback:`, error);
        }
      }
      
      console.log(`🏠 [MODAL] Casas finales encontradas: ${casas.length}`, casas);
      return casas;
    } catch (error) {
      console.error('🏠 [MODAL] Error obteniendo casas:', error);
      return [];
    }
  };

  // Seleccionar automáticamente el residencial del admin
  useEffect(() => {
    console.log('🔍 [DEBUG] esAdminDeResidencial:', esAdminDeResidencial);
    console.log('🔍 [DEBUG] residencialIdDelAdmin:', residencialIdDelAdmin);
    console.log('🔍 [DEBUG] formData.residencialId:', formData.residencialId);
    console.log('🔍 [DEBUG] residenciales disponibles:', residenciales.map(r => ({ 
      id: r.id, 
      nombre: r.nombre, 
      residencialID: (r as any).residencialID,
      allProps: r 
    })));
    
    // Solo auto-seleccionar residencial para admin de residencial, no para admin global
    if (esAdminDeResidencial && residencialIdDelAdmin && !formData.residencialId && residenciales.length > 0) {
      // Buscar el residencial que coincida con el residencialIdDelAdmin
      const residencialEncontrado = residenciales.find(r => (r as any).residencialID === residencialIdDelAdmin);
      
      if (residencialEncontrado) {
        console.log('🔍 [DEBUG] Estableciendo residencialId:', residencialEncontrado.id);
        setFormData(prev => ({
          ...prev,
          residencialId: residencialEncontrado.id
        }));
        
        // Cargar casas directamente en el modal
        obtenerCasasModal(residencialEncontrado.id).then(casas => {
          setCasasModal(casas);
        });
      } else {
        console.log('🔍 [DEBUG] No se encontró residencial para:', residencialIdDelAdmin);
        console.log('🔍 [DEBUG] Usando el primer residencial disponible como fallback');
        
        // Fallback: usar el primer residencial disponible
        const primerResidencial = residenciales[0];
        if (primerResidencial) {
          console.log('🔍 [DEBUG] Estableciendo residencialId (fallback):', primerResidencial.id);
          setFormData(prev => ({
            ...prev,
            residencialId: primerResidencial.id
          }));
          
          // Cargar casas directamente en el modal
          obtenerCasasModal(primerResidencial.id).then(casas => {
            setCasasModal(casas);
          });
        }
      }
    } else if (!esAdminDeResidencial && residenciales.length > 0) {
      // Para admin global, no auto-seleccionar residencial
      console.log('🔍 [DEBUG] Admin global - no auto-seleccionando residencial');
    }
  }, [esAdminDeResidencial, residencialIdDelAdmin, formData.residencialId, residenciales]);

  // Cargar casas cuando admin global selecciona un residencial
  useEffect(() => {
    if (!esAdminDeResidencial && formData.residencialId && residenciales.length > 0) {
      console.log('🔍 [DEBUG] Admin global seleccionó residencial:', formData.residencialId);
      obtenerCasasModal(formData.residencialId).then(casas => {
        setCasasModal(casas);
      });
    }
  }, [formData.residencialId, esAdminDeResidencial, residenciales.length]);

  // Filtrar casas y paneles cuando cambia el residencial
  useEffect(() => {
    if (formData.residencialId) {
      // Usar casas del modal si están disponibles, sino usar las props
      const casasAUsar = casasModal.length > 0 ? casasModal : casas;
      const casasDelResidencial = casasAUsar.filter(c => c.residencialId === formData.residencialId);
      const panelesDelResidencial = paneles.filter(p => 
        p.residencialId === formData.residencialId && p.tipo === 'vehicular'
      );
      
      setCasasFiltradas(casasDelResidencial);
      setPanelesFiltrados(panelesDelResidencial);
      
      console.log('🔍 [MODAL] Casas filtradas:', casasDelResidencial);

      // Para tags de residentes, asignar automáticamente entrada y salida
      const plumasResidente = panelesDelResidencial.filter(p => 
        p.nombre.includes('Residente')
      );
      
      console.log('🔍 [MODAL] Plumas de residente encontradas:', plumasResidente);
      console.log('🔍 [MODAL] IDs de plumas:', plumasResidente.map(p => p.id));
      
      if (plumasResidente.length > 0) {
        // Asignar automáticamente todas las plumas de residente
        setFormData(prev => ({
          ...prev,
          panels: plumasResidente.map(p => p.id)
        }));
        console.log('🔍 [MODAL] Plumas asignadas automáticamente:', plumasResidente.map(p => p.id));
      }

      // Resetear casa si no pertenece al residencial
      if (formData.casaId && !casasDelResidencial.some(c => c.id === formData.casaId)) {
        setFormData(prev => ({ ...prev, casaId: "" }));
      }
    } else {
      setCasasFiltradas([]);
      setPanelesFiltrados([]);
    }
  }, [formData.residencialId, casas, paneles, casasModal]);

  // Validar número de tarjeta único
  useEffect(() => {
    const validateCard = async () => {
      if (formData.cardNumberDec && formData.residencialId) {
        setValidatingCard(true);
        try {
          const response = await fetch(`/api/tags/validate-card?cardNumberDec=${formData.cardNumberDec}&residencialId=${formData.residencialId}`, {
            headers: {
              'Authorization': `Bearer ${await getAuthToken()}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setCardExists(!data.valid);
          } else {
            console.error("Error validando tarjeta:", await response.text());
            setCardExists(false);
          }
        } catch (error) {
          console.error("Error validando tarjeta:", error);
          setCardExists(false);
        } finally {
          setValidatingCard(false);
        }
      }
    };

    const timeoutId = setTimeout(validateCard, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.cardNumberDec, formData.residencialId]);

  const handleInputChange = (field: keyof TagFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePanelToggle = (panelId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      panels: checked 
        ? [...prev.panels, panelId]
        : prev.panels.filter(id => id !== panelId)
    }));
  };

  const normalizeCardNumber = (value: string) => {
    // Solo dígitos, sin espacios, normalizar sin ceros a la izquierda
    const digits = value.replace(/\D/g, '');
    return digits.replace(/^0+/, '') || '0';
  };

  const validateForm = () => {
    if (!formData.cardNumberDec.trim()) {
      toast.error("El número de tarjeta es obligatorio");
      return false;
    }

    if (formData.cardNumberDec.length < 1 || formData.cardNumberDec.length > 20) {
      toast.error("El número de tarjeta debe tener entre 1 y 20 dígitos");
      return false;
    }

    if (cardExists) {
      toast.error("Este número de tarjeta ya existe en el residencial");
      return false;
    }

    if (!formData.residencialId) {
      toast.error("Debe seleccionar un residencial");
      return false;
    }

    if (!formData.casaId) {
      toast.error("Debe seleccionar una casa");
      return false;
    }

    // Validar plumas solo si hay opciones de selección manual
    const tienePlumasManuales = panelesFiltrados.some(p => !p.nombre.includes('Residente'));
    
    if (tienePlumasManuales && formData.panels.length === 0) {
      toast.error("Debe seleccionar al menos una pluma de acceso");
      return false;
    }

    if (tienePlumasManuales && panelesFiltrados.length === 0) {
      toast.error("No hay plumas de acceso configuradas en este residencial");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Mostrar confirmación si aplicará inmediatamente
    if (formData.status === 'active' && formData.applyImmediately) {
      setShowConfirmation(true);
      return;
    }

    await createTag();
  };

  const createTag = async () => {
    setLoading(true);
    try {
      const tagData = {
        cardNumberDec: formData.cardNumberDec,
        residencialId: formData.residencialId,
        casaId: formData.casaId,
        panels: formData.panels,
        status: formData.status,
        plate: formData.plate || null,
        notes: formData.notes || null,
        applyImmediately: formData.applyImmediately
      };

      const response = await fetch('/api/tags/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify(tagData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear tag');
      }

      const result = await response.json();
      
      onTagCreated(result.tag);
      
      if (result.panelJobsCreated > 0) {
        toast.success(`Tag creado correctamente. Se crearon ${result.panelJobsCreated} trabajos para aplicar en plumas de acceso.`);
      } else {
        toast.success("Tag creado correctamente. No se aplicará en plumas automáticamente.");
      }
      
      onOpenChange(false);
      resetForm();

    } catch (error) {
      console.error("Error al crear tag:", error);
      toast.error(error instanceof Error ? error.message : "Error al guardar el tag");
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  const resetForm = () => {
    setFormData({
      cardNumberDec: "",
      residencialId: "",
      casaId: "",
      panels: [],
      status: 'active',
      plate: "",
      notes: "",
      applyImmediately: true,
    });
    setCardExists(false);
  };

  const getPanelName = (panelId: string) => {
    return panelesFiltrados.find(p => p.id === panelId)?.nombre || panelId;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-500" />
              Añadir Tag Vehicular
            </DialogTitle>
            <DialogDescription>
              Crea un nuevo tag de acceso vehicular para el residencial seleccionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Número de tarjeta */}
            <div className="space-y-2">
              <Label htmlFor="cardNumberDec" className="text-sm font-medium">
                Número de tarjeta (DEC) *
              </Label>
              <Input
                id="cardNumberDec"
                value={formData.cardNumberDec}
                onChange={(e) => handleInputChange('cardNumberDec', normalizeCardNumber(e.target.value))}
                placeholder="Ej: 118654653"
                className={cardExists ? "border-red-500" : ""}
                maxLength={20}
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>Este es el número que usa ZKTeco en 'Número de tarjeta' (decimal).</span>
              </div>
              {validatingCard && (
                <div className="text-xs text-blue-600">Validando unicidad...</div>
              )}
              {cardExists && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Este número de tarjeta ya existe en el residencial.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Residencial - Solo para admin global */}
            {!esAdminDeResidencial && residenciales.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="residencialId" className="text-sm font-medium">
                  Residencial *
                </Label>
                <Select
                  value={formData.residencialId}
                  onValueChange={(value) => {
                    handleInputChange('residencialId', value);
                    // Limpiar casa seleccionada cuando cambia el residencial
                    setFormData(prev => ({ ...prev, casaId: "" }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar residencial" />
                  </SelectTrigger>
                  <SelectContent>
                    {residenciales.map((residencial) => (
                      <SelectItem key={residencial.id} value={residencial.id}>
                        {residencial.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Casa */}
            <div className="space-y-2">
              <Label htmlFor="casaId" className="text-sm font-medium">
                Casa *
              </Label>
              <Popover open={openCasaSelector} onOpenChange={setOpenCasaSelector}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCasaSelector}
                    className="w-full justify-between"
                disabled={casasFiltradas.length === 0}
              >
                    {formData.casaId ? (
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-blue-500" />
                        <span className="truncate">
                          {casasFiltradas.find((casa) => casa.id === formData.casaId)?.nombre || "Casa seleccionada"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        {casasFiltradas.length === 0 
                        ? "Seleccione un residencial primero" 
                          : "Buscar y seleccionar casa..."}
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar casa por calle, número o ID..." 
                      className="h-9"
                    />
                    <CommandList>
                      <CommandEmpty>
                        {casasFiltradas.length === 0 
                          ? "No hay casas disponibles. Seleccione un residencial primero."
                          : "No se encontraron casas con ese criterio."}
                      </CommandEmpty>
                      <CommandGroup>
                  {casasFiltradas.map((casa) => (
                          <CommandItem
                            key={casa.id}
                            value={casa.searchText || casa.nombre}
                            onSelect={() => {
                              handleInputChange('casaId', casa.id);
                              setOpenCasaSelector(false);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Check
                              className={`h-4 w-4 ${
                                formData.casaId === casa.id ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <Home className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">{casa.nombre}</span>
                              </div>
                              {(casa as any).calle && (casa as any).houseNumber && (
                                <div className="text-xs text-muted-foreground ml-6">
                                  Calle: {(casa as any).calle} • Número: {(casa as any).houseNumber}
                                  {(casa as any).houseID && ` • ID: ${(casa as any).houseID}`}
                                </div>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Plumas de Acceso - Solo mostrar si hay opciones de selección */}
            {panelesFiltrados.some(p => !p.nombre.includes('Residente')) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                  Plumas de Acceso *
              </Label>
              {panelesFiltrados.length === 0 ? (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                      No hay plumas de acceso configuradas en este residencial.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
                  {panelesFiltrados.map((panel) => (
                    <div key={panel.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={panel.id}
                        checked={formData.panels.includes(panel.id)}
                        onCheckedChange={(checked) => 
                          handlePanelToggle(panel.id, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={panel.id} 
                        className="text-sm font-normal cursor-pointer"
                      >
                        {panel.nombre}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              {formData.panels.length > 0 && (
                <div className="text-xs text-muted-foreground">
                    Seleccionadas: {formData.panels.length} pluma(s)
                </div>
              )}
            </div>
            )}

            {/* Información automática para plumas de residente */}
            {panelesFiltrados.some(p => p.nombre.includes('Residente')) && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Plumas de Acceso
                </Label>
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <div className="space-y-1">
                      <div className="font-medium">Plumas asignadas automáticamente:</div>
                      {panelesFiltrados
                        .filter(p => p.nombre.includes('Residente'))
                        .map(panel => {
                          console.log('🔍 [MODAL] Mostrando pluma en alert:', panel.nombre, panel.id);
                          return (
                            <div key={panel.id} className="flex items-center gap-2 text-sm">
                              <Car className="h-3 w-3 text-blue-600" />
                              <span>{panel.nombre}</span>
                            </div>
                          );
                        })
                      }
                      <div className="text-xs mt-2">
                        Estas plumas se activan automáticamente cuando se escanea el tag.
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Estado
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="disabled">Desactivado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Aplicar de inmediato */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Aplicar de inmediato en plumas de acceso
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Se crearán trabajos para dar de alta en las plumas seleccionadas.
                  </p>
                </div>
                <Switch
                  checked={formData.applyImmediately}
                  onCheckedChange={(checked) => handleInputChange('applyImmediately', checked)}
                />
              </div>
            </div>

            {/* Campos opcionales */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground">Información Adicional</h4>
              
              {/* Placa */}
              <div className="space-y-2">
                <Label htmlFor="plate" className="text-sm font-medium">
                  Placa
                </Label>
                <Input
                  id="plate"
                  value={formData.plate}
                  onChange={(e) => handleInputChange('plate', e.target.value)}
                  placeholder="Ej: ABC-123"
                />
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Información adicional sobre el tag..."
                  rows={3}
                />
              </div>


            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || cardExists || validatingCard}
            >
              {loading ? "Guardando..." : "Guardar Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Aplicación</DialogTitle>
            <DialogDescription>
              Se programará el alta en {formData.panels.length} pluma(s) de acceso:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {formData.panels.map(panelId => (
              <div key={panelId} className="flex items-center gap-2 text-sm">
                <Car className="h-4 w-4 text-blue-500" />
                <span>{getPanelName(panelId)}</span>
                {getPanelName(panelId).includes('Residente') && (
                  <Badge variant="secondary" className="text-xs">Automático</Badge>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Cancelar
            </Button>
            <Button onClick={createTag} disabled={loading}>
              {loading ? "Aplicando..." : "Confirmar y Aplicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
