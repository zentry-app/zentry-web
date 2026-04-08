"use client";

import { useState, useMemo } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { BulkPaymentImportService } from "@/lib/services/BulkPaymentImportService";
import type {
  BulkImportMode,
  BulkImportRawRow,
} from "./types";

interface Props {
  residencialId: string;
  onSuccess?: (batchId: string) => void;
}

interface PreviewState {
  rows: BulkImportRawRow[];
  filename: string;
}

function normalizeRow(raw: any): BulkImportRawRow {
  return {
    houseLabel: String(raw.houseLabel ?? raw.casa ?? "").trim(),
    clientFolio: raw.clientFolio ? String(raw.clientFolio).trim() : null,
    amountRaw: String(raw.amountCents ?? raw.amount ?? "").trim(),
    paymentDateStr: String(raw.paymentDateStr ?? raw.fecha ?? "").trim(),
    appliesToMonthsRaw: String(raw.appliesToMonths ?? raw.meses ?? "").trim(),
    paymentMethod: String(raw.paymentMethod ?? "cash").trim().toLowerCase(),
    notes: raw.notes ? String(raw.notes).trim() : null,
  };
}

export default function BulkPaymentImport({ residencialId, onSuccess }: Props) {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [mode, setMode] = useState<BulkImportMode>("on_the_fly");
  const [defaultFee, setDefaultFee] = useState<string>("");
  const [feeTypeLabel, setFeeTypeLabel] = useState("Cuota mensual");
  const [submitting, setSubmitting] = useState(false);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = (results.data as any[]).map(normalizeRow);
        setPreview({ rows, filename: file.name });
      },
      error: (err) => {
        toast.error(`Error parseando CSV: ${err.message}`);
      },
    });
  };

  const stats = useMemo(() => {
    if (!preview) return null;
    const total = preview.rows.length;
    const totalCents = preview.rows.reduce((acc, r) => {
      const n = Number(r.amountRaw);
      return Number.isFinite(n) ? acc + n : acc;
    }, 0);
    const distinctHouses = new Set(preview.rows.map((r) => r.houseLabel)).size;
    return { total, totalCents, distinctHouses };
  }, [preview]);

  const canSubmit =
    !!preview &&
    preview.rows.length > 0 &&
    !submitting &&
    (mode !== "pre_create_fees" || (Number(defaultFee) > 0));

  const handleSubmit = async () => {
    if (!preview) return;
    setSubmitting(true);
    try {
      const result = await BulkPaymentImportService.createBatch({
        residencialId,
        sourceFilename: preview.filename,
        mode,
        defaultFeeAmountCents:
          mode === "pre_create_fees" ? Number(defaultFee) : undefined,
        feeTypeLabel,
        rows: preview.rows,
      });
      toast.success(
        `Batch creado: ${result.stats.validRows} válidas / ${result.stats.invalidRows} inválidas`,
      );
      onSuccess?.(result.batchId);
      setPreview(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Error creando batch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Carga masiva de pagos históricos</h2>
        <p className="text-sm text-muted-foreground">
          Sube un CSV con pagos pasados que la administración cobró antes de
          usar Zentry. El batch queda en revisión hasta que un super-admin lo
          apruebe y aplique.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <a
          href="/templates/bulk-payments-template.csv"
          download
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Download className="h-4 w-4" />
          Descargar plantilla CSV
        </a>
      </div>

      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload">1. Subir archivo</TabsTrigger>
          <TabsTrigger value="config">2. Configuración</TabsTrigger>
          <TabsTrigger value="preview" disabled={!preview}>
            3. Vista previa {preview && `(${preview.rows.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-3 pt-4">
          <Label htmlFor="bulk-file">Archivo CSV</Label>
          <Input
            id="bulk-file"
            type="file"
            accept=".csv"
            onChange={handleFile}
          />
        </TabsContent>

        <TabsContent value="config" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Modo</Label>
            <RadioGroup
              value={mode}
              onValueChange={(v) => setMode(v as BulkImportMode)}
            >
              <div className="flex items-start gap-2">
                <RadioGroupItem id="mode-otf" value="on_the_fly" />
                <Label htmlFor="mode-otf" className="font-normal">
                  <span className="font-medium">Sobre la marcha</span>
                  <span className="block text-xs text-muted-foreground">
                    Crea las cuotas faltantes en el mismo paso del pago.
                    Ideal cuando los importes son variables.
                  </span>
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem id="mode-pre" value="pre_create_fees" />
                <Label htmlFor="mode-pre" className="font-normal">
                  <span className="font-medium">Pre-crear cuotas</span>
                  <span className="block text-xs text-muted-foreground">
                    Crea todas las cuotas pendientes con un monto fijo antes
                    de procesar pagos. Mejor para residenciales con cuota
                    uniforme.
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {mode === "pre_create_fees" && (
            <div className="space-y-2">
              <Label htmlFor="default-fee">Monto de cuota (centavos)</Label>
              <Input
                id="default-fee"
                type="number"
                value={defaultFee}
                onChange={(e) => setDefaultFee(e.target.value)}
                placeholder="ej. 150000 = $1,500"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="fee-label">Concepto / etiqueta de la cuota</Label>
            <Input
              id="fee-label"
              value={feeTypeLabel}
              onChange={(e) => setFeeTypeLabel(e.target.value)}
            />
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4 pt-4">
          {stats && (
            <Card>
              <CardContent className="pt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">filas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat("es-MX", {
                      style: "currency",
                      currency: "MXN",
                      minimumFractionDigits: 0,
                    }).format(stats.totalCents / 100)}
                  </div>
                  <div className="text-xs text-muted-foreground">total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {stats.distinctHouses}
                  </div>
                  <div className="text-xs text-muted-foreground">casas</div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-sm text-muted-foreground flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              La validación final (matching de casas, duplicados, formato)
              corre en el servidor cuando crees el batch. Aquí solo ves un
              preview crudo.
            </div>
          </div>

          {preview && (
            <div className="max-h-64 overflow-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Casa</th>
                    <th className="p-2 text-left">Monto</th>
                    <th className="p-2 text-left">Fecha</th>
                    <th className="p-2 text-left">Meses</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{r.houseLabel}</td>
                      <td className="p-2 font-mono">{r.amountRaw}</td>
                      <td className="p-2 font-mono">{r.paymentDateStr}</td>
                      <td className="p-2">{r.appliesToMonthsRaw}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.rows.length > 50 && (
                <div className="p-2 text-xs text-muted-foreground text-center">
                  …y {preview.rows.length - 50} filas más
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        {preview && (
          <div className="text-xs text-muted-foreground flex items-center gap-1 mr-auto">
            <CheckCircle2 className="h-3 w-3" />
            {preview.filename}
          </div>
        )}
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          <Upload className="h-4 w-4 mr-2" />
          {submitting ? "Subiendo..." : "Crear batch"}
        </Button>
      </div>
    </div>
  );
}
