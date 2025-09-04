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
  FileText
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Residencial {
  id: string;
  nombre: string;
}

interface Casa {
  id: string;
  nombre: string;
  residencialId: string;
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
}

export function AddTagModal({
  open,
  onOpenChange,
  onTagCreated,
  residenciales,
  casas,
  paneles,
  currentUserId
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
  const [panelesFiltrados, setPanelesFiltrados] = useState<Panel[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Filtrar casas y paneles cuando cambia el residencial
  useEffect(() => {
    console.log('🏠 [ADD-TAG] useEffect triggered - residencialId:', formData.residencialId);
    console.log('🏠 [ADD-TAG] Total casas disponibles:', casas.length);
    console.log('🏠 [ADD-TAG] Total paneles disponibles:', paneles.length);
    
    if (formData.residencialId) {
      const casasDelResidencial = casas.filter(c => c.residencialId === formData.residencialId);
      const panelesDelResidencial = paneles.filter(p => 
        p.residencialId === formData.residencialId && p.tipo === 'vehicular'
      );
      
      console.log('🏠 [ADD-TAG] Casas filtradas para residencial', formData.residencialId, ':', casasDelResidencial.length);
      console.log('🏠 [ADD-TAG] Casas filtradas:', casasDelResidencial);
      console.log('🏠 [ADD-TAG] Paneles filtrados para residencial', formData.residencialId, ':', panelesDelResidencial.length);
      console.log('🏠 [ADD-TAG] Paneles filtrados:', panelesDelResidencial);
      
      setCasasFiltradas(casasDelResidencial);
      setPanelesFiltrados(panelesDelResidencial);

      // Si hay un grupo por defecto "Todos los accesos vehiculares", preseleccionarlo
      const grupoPorDefecto = panelesDelResidencial.find(p => 
        p.nombre.toLowerCase().includes('todos') || 
        p.nombre.toLowerCase().includes('accesos vehiculares')
      );
      
      if (grupoPorDefecto) {
        setFormData(prev => ({
          ...prev,
          panels: [grupoPorDefecto.id]
        }));
      }

      // Resetear casa si no pertenece al residencial
      if (formData.casaId && !casasDelResidencial.some(c => c.id === formData.casaId)) {
        setFormData(prev => ({ ...prev, casaId: "" }));
      }
    } else {
      setCasasFiltradas([]);
      setPanelesFiltrados([]);
    }
  }, [formData.residencialId, casas, paneles]);

  // Validar número de tarjeta único
  useEffect(() => {
    const validateCard = async () => {
      if (formData.cardNumberDec && formData.residencialId) {
        setValidatingCard(true);
        try {
          // TODO: Implementar validación real contra Firestore
          // const exists = await checkCardExists(formData.cardNumberDec, formData.residencialId);
          // setCardExists(exists);
          setCardExists(false); // Placeholder
        } catch (error) {
          console.error("Error validando tarjeta:", error);
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

    if (formData.panels.length === 0) {
      toast.error("Debe seleccionar al menos un panel");
      return false;
    }

    if (panelesFiltrados.length === 0) {
      toast.error("No hay paneles vehiculares configurados en este residencial");
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
        type: "vehicular",
        ownerType: "unit",
        ownerRef: formData.casaId,
        cardNumberDec: formData.cardNumberDec,
        format: "W26", // TODO: Obtener del residencial o configuración global
        facilityCode: null, // TODO: Obtener si se usa
        residentialId: formData.residencialId,
        panels: formData.panels,
        status: formData.status,
        plate: formData.plate || null,
        notes: formData.notes || null,
        lastChangedBy: currentUserId,
        lastChangedAt: new Date().toISOString(),
        source: "Web"
      };

      // TODO: Implementar llamada real a la API
      // const response = await fetch('/api/tags/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(tagData)
      // });

      // if (!response.ok) throw new Error('Error al crear tag');

      // const newTag = await response.json();
      
      // Placeholder para desarrollo
      const newTag = { id: Date.now().toString(), ...tagData };
      
      onTagCreated(newTag);
      toast.success("Tag guardado. Aplicación en paneles: en proceso.");
      onOpenChange(false);
      resetForm();

    } catch (error) {
      console.error("Error al crear tag:", error);
      toast.error("Error al guardar el tag");
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

            {/* Tipo (fijo) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <Car className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Vehicular</span>
                <Badge variant="secondary" className="ml-auto">Fijo</Badge>
              </div>
            </div>

            {/* Residencial */}
            <div className="space-y-2">
              <Label htmlFor="residencialId" className="text-sm font-medium">
                Residencial *
              </Label>
              <Select
                value={formData.residencialId}
                onValueChange={(value) => handleInputChange('residencialId', value)}
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

            {/* Casa */}
            <div className="space-y-2">
              <Label htmlFor="casaId" className="text-sm font-medium">
                Casa *
              </Label>
              <Select
                value={formData.casaId}
                onValueChange={(value) => {
                  console.log('🏠 [ADD-TAG] Casa seleccionada:', value);
                  handleInputChange('casaId', value);
                }}
                disabled={casasFiltradas.length === 0}
              >
                <SelectTrigger>
                  <SelectValue 
                    placeholder={
                      casasFiltradas.length === 0 
                        ? "Seleccione un residencial primero" 
                        : "Seleccionar casa"
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {casasFiltradas.map((casa) => (
                    <SelectItem key={casa.id} value={casa.id}>
                      {casa.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                Debug: {casasFiltradas.length} casas disponibles, deshabilitado: {casasFiltradas.length === 0 ? 'Sí' : 'No'}
              </div>
            </div>

            {/* Paneles */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Paneles *
              </Label>
              {panelesFiltrados.length === 0 ? (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    No hay paneles vehiculares configurados en este residencial.
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
                  Seleccionados: {formData.panels.length} panel(es)
                </div>
              )}
            </div>

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
                    Aplicar de inmediato en paneles
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Se crearán trabajos para dar de alta en los paneles seleccionados.
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
              Se programará el alta en {formData.panels.length} panel(es):
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {formData.panels.map(panelId => (
              <div key={panelId} className="flex items-center gap-2 text-sm">
                <Car className="h-4 w-4 text-blue-500" />
                <span>{getPanelName(panelId)}</span>
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
