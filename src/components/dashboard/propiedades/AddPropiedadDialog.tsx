"use client";

import { useState } from "react";
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

interface AddPropiedadDialogProps {
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

export default function AddPropiedadDialog({
  open,
  onOpenChange,
  residencialDocId,
  calles,
  onSuccess,
}: AddPropiedadDialogProps) {
  const [calle, setCalle] = useState("");
  const [calleNueva, setCalleNueva] = useState("");
  const [numero, setNumero] = useState("");
  const [interior, setInterior] = useState("");
  const [tipo, setTipo] = useState<PropiedadWeb["tipo"]>("casa");
  const [estadoOcupacion, setEstadoOcupacion] =
    useState<PropiedadWeb["estadoOcupacion"]>("desocupada");
  const [loading, setLoading] = useState(false);

  const calleEfectiva = calle === "__nueva__" ? calleNueva.trim() : calle;

  const handleSubmit = async () => {
    if (!calleEfectiva || !numero.trim()) {
      toast.error("Calle y número son requeridos");
      return;
    }

    setLoading(true);
    try {
      await PropiedadesService.create({
        residencialDocId,
        calle: calleEfectiva,
        numero: numero.trim(),
        interior: interior.trim() || undefined,
        tipo,
        estadoOcupacion,
      });
      toast.success("Propiedad creada correctamente");
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (err: any) {
      if (
        err?.code === "already-exists" ||
        err?.message?.includes("already-exists")
      ) {
        toast.error("Esa propiedad ya existe en este residencial");
      } else {
        toast.error("Error al crear la propiedad");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCalle("");
    setCalleNueva("");
    setNumero("");
    setInterior("");
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
          <DialogTitle>Agregar Propiedad</DialogTitle>
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

          {/* Número */}
          <div className="space-y-1.5">
            <Label>Número</Label>
            <Input
              placeholder="Ej. 12"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            />
          </div>

          {/* Interior (opcional) */}
          <div className="space-y-1.5">
            <Label>
              Interior{" "}
              <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Input
              placeholder="Ej. A, 3B"
              value={interior}
              onChange={(e) => setInterior(e.target.value)}
            />
          </div>

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
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creando..." : "Crear Propiedad"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
