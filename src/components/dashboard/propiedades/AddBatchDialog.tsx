"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  PropiedadesService,
  PropiedadWeb,
} from "@/lib/services/propiedades-service";

interface AddBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  residencialDocId: string;
  calles: string[];
  onSuccess: () => void;
}

const TIPOS: { value: PropiedadWeb["tipo"]; label: string }[] = [
  { value: "casa", label: "Casa" },
  { value: "departamento", label: "Departamento" },
  { value: "local", label: "Local" },
  { value: "lote", label: "Lote" },
];

const ESTADOS: { value: PropiedadWeb["estadoOcupacion"]; label: string }[] = [
  { value: "ocupada", label: "Ocupada" },
  { value: "desocupada", label: "Desocupada" },
  { value: "exenta", label: "Exenta" },
];

export default function AddBatchDialog({
  open,
  onOpenChange,
  residencialDocId,
  calles,
  onSuccess,
}: AddBatchDialogProps) {
  const [calle, setCalle] = useState("");
  const [calleNueva, setCalleNueva] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tipo, setTipo] = useState<PropiedadWeb["tipo"]>("casa");
  const [estadoOcupacion, setEstadoOcupacion] =
    useState<PropiedadWeb["estadoOcupacion"]>("desocupada");
  const [loading, setLoading] = useState(false);

  const calleEfectiva = calle === "__nueva__" ? calleNueva.trim() : calle;
  const desdeNum = parseInt(desde, 10);
  const hastaNum = parseInt(hasta, 10);

  const rangeCount = useMemo(() => {
    if (!isNaN(desdeNum) && !isNaN(hastaNum) && hastaNum >= desdeNum) {
      return hastaNum - desdeNum + 1;
    }
    return 0;
  }, [desdeNum, hastaNum]);

  const rangeError = useMemo(() => {
    if (!desde || !hasta) return null;
    if (isNaN(desdeNum) || isNaN(hastaNum)) return "Ingresa números válidos";
    if (desdeNum < 1) return "El número debe ser mayor a 0";
    if (hastaNum < desdeNum)
      return "El número final debe ser mayor o igual al inicial";
    if (rangeCount > 500) return "El rango no puede superar 500 propiedades";
    return null;
  }, [desde, hasta, desdeNum, hastaNum, rangeCount]);

  const handleSubmit = async () => {
    if (!calleEfectiva) {
      toast.error("Selecciona una calle");
      return;
    }
    if (rangeError) {
      toast.error(rangeError);
      return;
    }
    if (rangeCount === 0) {
      toast.error("Define un rango válido");
      return;
    }

    setLoading(true);
    try {
      const result = await PropiedadesService.createBatch({
        residencialDocId,
        calle: calleEfectiva,
        desde: desdeNum,
        hasta: hastaNum,
        tipo,
        estadoOcupacion,
      });
      toast.success(
        `${result.creadas} propiedades creadas${result.omitidas > 0 ? `, ${result.omitidas} ya existían` : ""}`,
      );
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch {
      toast.error("Error al crear propiedades en lote");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCalle("");
    setCalleNueva("");
    setDesde("");
    setHasta("");
    setTipo("casa");
    setEstadoOcupacion("desocupada");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) resetForm();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Propiedades por Rango</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Calle */}
          <div className="space-y-1.5">
            <Label>Calle</Label>
            <Select value={calle} onValueChange={setCalle}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una calle" />
              </SelectTrigger>
              <SelectContent>
                {calles.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
                <SelectItem value="__nueva__">+ Nueva calle</SelectItem>
              </SelectContent>
            </Select>
            {calle === "__nueva__" && (
              <Input
                placeholder="Nombre de la nueva calle"
                value={calleNueva}
                onChange={(e) => setCalleNueva(e.target.value)}
              />
            )}
          </div>

          {/* Rango */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Desde</Label>
              <Input
                type="number"
                placeholder="1"
                min={1}
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Hasta</Label>
              <Input
                type="number"
                placeholder="50"
                min={1}
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
              />
            </div>
          </div>

          {/* Preview */}
          {rangeCount > 0 && !rangeError && (
            <p className="text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">
              Se crearán <strong>{rangeCount}</strong> propiedades en{" "}
              <strong>{calleEfectiva || "la calle seleccionada"}</strong>
            </p>
          )}
          {rangeError && (
            <p className="text-sm text-destructive">{rangeError}</p>
          )}

          {/* Tipo */}
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select
              value={tipo}
              onValueChange={(v) => setTipo(v as PropiedadWeb["tipo"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado */}
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select
              value={estadoOcupacion}
              onValueChange={(v) =>
                setEstadoOcupacion(v as PropiedadWeb["estadoOcupacion"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !!rangeError || rangeCount === 0}
          >
            {loading
              ? "Creando..."
              : `Crear ${rangeCount > 0 ? rangeCount : ""} Propiedades`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
