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
import { toast } from "sonner";
import {
  AlertCircle,
  Info,
  Car,
  Home,
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

interface TagFormData {
  cardNumberDec: string;
  residencialId: string;
  casaId: string;
  plate?: string;
  notes?: string;
}

interface AddTagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTagCreated: (tag: any) => void;
  residenciales: Residencial[];
  casas: Casa[];
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
  currentUserId,
  esAdminDeResidencial = false,
  residencialIdDelAdmin = null
}: AddTagModalProps) {
  const [formData, setFormData] = useState<TagFormData>({
    cardNumberDec: "",
    residencialId: "",
    casaId: "",
    plate: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [validatingCard, setValidatingCard] = useState(false);
  const [cardExists, setCardExists] = useState(false);
  const [casasFiltradas, setCasasFiltradas] = useState<Casa[]>([]);

  // Estado para casas cargadas directamente en el modal
  const [casasModal, setCasasModal] = useState<Casa[]>([]);
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

      // PRIMERO: Verificar que el residencial existe y obtener su residencialID
      const residencialRef = doc(db, 'residenciales', residencialDocId);
      const residencialDoc = await getDoc(residencialRef);

      let residencialID = null;
      if (residencialDoc.exists()) {
        const residencialData = residencialDoc.data();
        residencialID = residencialData?.residencialID;
      }

      // SEGUNDO: Buscar casas en múltiples ubicaciones
      let casas: Casa[] = [];

      // 1. Buscar en residenciales/{docId}/casas (estructura esperada)
      try {
      const casasRef = collection(db, 'residenciales', residencialDocId, 'casas');

      const casasSnapshot = await getDocs(casasRef);

        if (casasSnapshot.docs.length > 0) {
          casas = casasSnapshot.docs.map(doc => {
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
        console.error(`[MODAL] Error en subcolección casas:`, error);
      }

      // 2. Si no hay casas y tenemos residencialID, buscar en colección principal de casas
      if (casas.length === 0 && residencialID) {
        try {
          const casasMainRef = collection(db, 'casas');
          const q = query(casasMainRef, where('residencialID', '==', residencialID));
          const casasMainSnapshot = await getDocs(q);

        if (casasMainSnapshot.docs.length > 0) {
            casas = casasMainSnapshot.docs.map(doc => {
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
          console.error(`[MODAL] Error en colección principal casas:`, error);
        }
      }

      // 3. Si aún no hay casas, buscar en usuarios que pertenezcan a este residencial
      if (casas.length === 0 && residencialID) {
        try {
          const usuariosRef = collection(db, 'usuarios');
          const q = query(usuariosRef, where('residencialID', '==', residencialID));
          const usuariosSnapshot = await getDocs(q);

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
          }
        } catch (error) {
          console.error(`[MODAL] Error extrayendo casas de usuarios:`, error);
        }
      }

      // 4. Último fallback: buscar todas las casas sin filtro
      if (casas.length === 0) {
        try {
          const casasMainRef = collection(db, 'casas');
          const casasMainSnapshot = await getDocs(casasMainRef);

          if (casasMainSnapshot.docs.length > 0) {
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
          console.error(`[MODAL] Error en último fallback:`, error);
        }
      }

      return casas;
    } catch (error) {
      console.error('[MODAL] Error obteniendo casas:', error);
      return [];
    }
  };

  // Seleccionar automáticamente el residencial del admin
  useEffect(() => {
    // Solo auto-seleccionar residencial para admin de residencial, no para admin global
    if (esAdminDeResidencial && residencialIdDelAdmin && !formData.residencialId && residenciales.length > 0) {
      // Buscar el residencial que coincida con el residencialIdDelAdmin
      const residencialEncontrado = residenciales.find(r => (r as any).residencialID === residencialIdDelAdmin);

      if (residencialEncontrado) {
        setFormData(prev => ({
          ...prev,
          residencialId: residencialEncontrado.id
        }));

        // Cargar casas directamente en el modal
        obtenerCasasModal(residencialEncontrado.id).then(casas => {
          setCasasModal(casas);
        });
      } else {
        // Fallback: usar el primer residencial disponible
        const primerResidencial = residenciales[0];
        if (primerResidencial) {
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
    }
  }, [esAdminDeResidencial, residencialIdDelAdmin, formData.residencialId, residenciales]);

  // Cargar casas cuando admin global selecciona un residencial
  useEffect(() => {
    if (!esAdminDeResidencial && formData.residencialId && residenciales.length > 0) {
      obtenerCasasModal(formData.residencialId).then(casas => {
        setCasasModal(casas);
      });
    }
  }, [formData.residencialId, esAdminDeResidencial, residenciales.length]);

  // Filtrar casas cuando cambia el residencial
  useEffect(() => {
    if (formData.residencialId) {
      // Usar casas del modal si están disponibles, sino usar las props
      const casasAUsar = casasModal.length > 0 ? casasModal : casas;
      const casasDelResidencial = casasAUsar.filter(c => c.residencialId === formData.residencialId);

      setCasasFiltradas(casasDelResidencial);

      // Resetear casa si no pertenece al residencial
      if (formData.casaId && !casasDelResidencial.some(c => c.id === formData.casaId)) {
        setFormData(prev => ({ ...prev, casaId: "" }));
      }
    } else {
      setCasasFiltradas([]);
    }
  }, [formData.casaId, formData.residencialId, casas, casasModal]);

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

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    await createTag();
  };

  const createTag = async () => {
    setLoading(true);
    try {
      const tagData = {
        cardNumberDec: formData.cardNumberDec,
        residencialId: formData.residencialId,
        casaId: formData.casaId,
        status: 'disabled',
        plate: formData.plate || null,
        notes: formData.notes || null,
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

      toast.success("Tag creado. Actívalo desde la tabla cuando esté listo.");

      onOpenChange(false);
      resetForm();

    } catch (error) {
      console.error("Error al crear tag:", error);
      toast.error(error instanceof Error ? error.message : "Error al guardar el tag");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      cardNumberDec: "",
      residencialId: "",
      casaId: "",
      plate: "",
      notes: "",
    });
    setCardExists(false);
  };

  return (
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
  );
}
