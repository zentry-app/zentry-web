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
  RefreshCw,
  History,
  Copy
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TagPanelStatus } from "./TagPanelStatus";

interface Tag {
  id: string;
  cardNumberDec: string;
  residencialId: string;
  casaId: string;
  panels: string[];
  status: 'active' | 'disabled';
  plate?: string;
  notes?: string;
  lastChangedBy: string;
  lastChangedAt: string;
  source: string;
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

interface EditTagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTagUpdated: (tag: Tag) => void;
  tag: Tag | null;
  casas: Casa[];
  paneles: Panel[];
  currentUserId: string;
}

interface ReplaceTagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTagReplaced: (oldCardNumber: string, newCardNumber: string) => void;
  currentCardNumber: string;
}

export function EditTagModal({
  open,
  onOpenChange,
  onTagUpdated,
  tag,
  casas,
  paneles,
  currentUserId
}: EditTagModalProps) {
  const [formData, setFormData] = useState<Partial<Tag>>({});
  const [loading, setLoading] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [casasFiltradas, setCasasFiltradas] = useState<Casa[]>([]);
  const [panelesFiltrados, setPanelesFiltrados] = useState<Panel[]>([]);

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (tag && open) {
      setFormData({
        cardNumberDec: tag.cardNumberDec,
        residencialId: tag.residencialId,
        casaId: tag.casaId,
        panels: tag.panels,
        status: tag.status,
        plate: tag.plate || "",
        notes: tag.notes || "",
      });
    }
  }, [tag, open]);

  // Filtrar casas y paneles cuando cambia el residencial
  useEffect(() => {
    if (formData.residencialId) {
      const casasDelResidencial = casas.filter(c => c.residencialId === formData.residencialId);
      const panelesDelResidencial = paneles.filter(p => 
        p.residencialId === formData.residencialId && p.tipo === 'vehicular'
      );
      
      setCasasFiltradas(casasDelResidencial);
      setPanelesFiltrados(panelesDelResidencial);
    }
  }, [formData.residencialId, casas, paneles]);

  const handleInputChange = (field: keyof Tag, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePanelToggle = (panelId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      panels: checked 
        ? [...(prev.panels || []), panelId]
        : (prev.panels || []).filter(id => id !== panelId)
    }));
  };

  const validateForm = () => {
    if (!formData.cardNumberDec?.trim()) {
      toast.error("El número de tarjeta es obligatorio");
      return false;
    }

    if (!formData.casaId) {
      toast.error("Debe seleccionar una casa");
      return false;
    }

    if (!formData.panels || formData.panels.length === 0) {
      toast.error("Debe seleccionar al menos un panel");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!tag || !validateForm()) return;

    setLoading(true);
    try {
      const updatedTag = {
        ...tag,
        ...formData,
        lastChangedBy: currentUserId,
        lastChangedAt: new Date().toISOString(),
      };

      // TODO: Implementar llamada real a la API
      // const response = await fetch(`/api/tags/${tag.id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updatedTag)
      // });

      // if (!response.ok) throw new Error('Error al actualizar tag');

      onTagUpdated(updatedTag);
      toast.success("Tag actualizado correctamente");
      onOpenChange(false);

    } catch (error) {
      console.error("Error al actualizar tag:", error);
      toast.error("Error al actualizar el tag");
    } finally {
      setLoading(false);
    }
  };

  const handleReplaceTag = (oldCardNumber: string, newCardNumber: string) => {
    if (tag) {
      const updatedTag = {
        ...tag,
        cardNumberDec: newCardNumber,
        lastChangedBy: currentUserId,
        lastChangedAt: new Date().toISOString(),
      };

      onTagUpdated(updatedTag);
      toast.success("Tag reemplazado correctamente");
      setShowReplaceModal(false);
    }
  };

  const getPanelName = (panelId: string) => {
    return panelesFiltrados.find(p => p.id === panelId)?.nombre || panelId;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  if (!tag) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-500" />
              Editar Tag Vehicular
            </DialogTitle>
            <DialogDescription>
              Modifica los detalles del tag seleccionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Número de tarjeta con opción de reemplazar */}
            <div className="space-y-2">
              <Label htmlFor="cardNumberDec" className="text-sm font-medium">
                Número de tarjeta (DEC) *
              </Label>
              <div className="flex gap-2">
                <Input
                  id="cardNumberDec"
                  value={formData.cardNumberDec || ""}
                  onChange={(e) => handleInputChange('cardNumberDec', e.target.value)}
                  placeholder="Ej: 118654653"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(formData.cardNumberDec || "")}
                  title="Copiar número"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowReplaceModal(true)}
                  title="Reemplazar tag"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Casa */}
            <div className="space-y-2">
              <Label htmlFor="casaId" className="text-sm font-medium">
                Casa *
              </Label>
              <Select
                value={formData.casaId || ""}
                onValueChange={(value) => handleInputChange('casaId', value)}
                disabled={casasFiltradas.length === 0}
              >
                <SelectTrigger>
                  <SelectValue 
                    placeholder={
                      casasFiltradas.length === 0 
                        ? "No hay casas disponibles" 
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
                        checked={(formData.panels || []).includes(panel.id)}
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
              {formData.panels && formData.panels.length > 0 && (
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
                value={formData.status || 'active'}
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
                  value={formData.plate || ""}
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
                  value={formData.notes || ""}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Información adicional sobre el tag..."
                  rows={3}
                />
              </div>


            </div>

            {/* Estado de aplicación por panel */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <History className="h-4 w-4" />
                Estado de Aplicación por Panel
              </h4>
              <TagPanelStatus
                tagId={tag.id}
                panels={formData.panels || []}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de reemplazo de tag */}
      <ReplaceTagModal
        open={showReplaceModal}
        onOpenChange={setShowReplaceModal}
        onTagReplaced={handleReplaceTag}
        currentCardNumber={formData.cardNumberDec || ""}
      />
    </>
  );
}

function ReplaceTagModal({
  open,
  onOpenChange,
  onTagReplaced,
  currentCardNumber
}: ReplaceTagModalProps) {
  const [newCardNumber, setNewCardNumber] = useState("");
  const [disableOldTag, setDisableOldTag] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newCardNumber.trim()) {
      toast.error("Debe ingresar un nuevo número de tarjeta");
      return;
    }

    if (newCardNumber === currentCardNumber) {
      toast.error("El nuevo número debe ser diferente al actual");
      return;
    }

    setLoading(true);
    try {
      // TODO: Implementar llamada real a la API
      // const response = await fetch('/api/tags/replace', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     oldCardNumber: currentCardNumber,
      //     newCardNumber: newCardNumber,
      //     disableOldTag: disableOldTag
      //   })
      // });

      // if (!response.ok) throw new Error('Error al reemplazar tag');

      onTagReplaced(currentCardNumber, newCardNumber);
      toast.success("Tag reemplazado correctamente");
      onOpenChange(false);
      setNewCardNumber("");

    } catch (error) {
      console.error("Error al reemplazar tag:", error);
      toast.error("Error al reemplazar el tag");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-orange-500" />
            Reemplazar Tag
          </DialogTitle>
          <DialogDescription>
            Cambia el número de tarjeta manteniendo la misma casa y paneles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Número actual</Label>
            <div className="p-2 bg-muted rounded-md text-sm font-mono">
              {currentCardNumber}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newCardNumber" className="text-sm font-medium">
              Nuevo número de tarjeta (DEC) *
            </Label>
            <Input
              id="newCardNumber"
              value={newCardNumber}
              onChange={(e) => setNewCardNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="Ej: 118654653"
              maxLength={20}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="disableOldTag"
              checked={disableOldTag}
              onCheckedChange={(checked) => setDisableOldTag(checked as boolean)}
            />
            <Label htmlFor="disableOldTag" className="text-sm">
              Desactivar automáticamente el número anterior
            </Label>
          </div>

          {disableOldTag && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Se creará un registro de auditoría "TAG_REPLACED" para el cambio.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Reemplazando..." : "Reemplazar Tag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
