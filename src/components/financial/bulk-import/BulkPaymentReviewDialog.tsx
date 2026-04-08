"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { BulkPaymentImportService } from "@/lib/services/BulkPaymentImportService";
import type { BulkImportBatch, BulkImportRow } from "./types";
import BulkImportRowsTable from "./BulkImportRowsTable";

interface Props {
  residencialId: string;
  batchId: string;
  onClose: () => void;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default function BulkPaymentReviewDialog({
  residencialId,
  batchId,
  onClose,
}: Props) {
  const [batch, setBatch] = useState<BulkImportBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await BulkPaymentImportService.getBatch(
          residencialId,
          batchId,
          true,
        );
        setBatch(r.batch);
      } catch (err: any) {
        toast.error(err?.message ?? "Error cargando batch");
      } finally {
        setLoading(false);
      }
    })();
  }, [residencialId, batchId]);

  const { valid, invalid, byHouse } = useMemo(() => {
    const items = batch?.items ?? [];
    const valid = items.filter((r) => r.status === "valid");
    const invalid = items.filter((r) => r.status !== "valid");
    const byHouse = new Map<
      string,
      { count: number; total: number; label: string }
    >();
    for (const r of valid) {
      const key = r.parsed.propiedadId ?? r.raw.houseLabel;
      const cur = byHouse.get(key) ?? {
        count: 0,
        total: 0,
        label: r.raw.houseLabel,
      };
      cur.count++;
      cur.total += r.parsed.amountCents ?? 0;
      byHouse.set(key, cur);
    }
    return { valid, invalid, byHouse };
  }, [batch]);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await BulkPaymentImportService.reviewBatch(
        residencialId,
        batchId,
        "approve",
      );
      toast.success("Batch aprobado");
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Error aprobando");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!note.trim()) {
      toast.error("Indica el motivo del rechazo");
      return;
    }
    setSubmitting(true);
    try {
      await BulkPaymentImportService.reviewBatch(
        residencialId,
        batchId,
        "reject",
        note,
      );
      toast.success("Batch rechazado");
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Error rechazando");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (!batch) {
    return <div>Batch no encontrado</div>;
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Revisar batch de migración</DialogTitle>
        <DialogDescription className="font-mono text-xs">
          {batch.batchId} · {batch.sourceFilename} · subido por{" "}
          {batch.uploadedByEmail || batch.uploadedBy}
        </DialogDescription>
      </DialogHeader>

      <Card>
        <CardContent className="grid grid-cols-4 gap-4 pt-6 text-center">
          <Stat label="Filas" value={String(batch.stats.totalRows)} />
          <Stat label="Válidas" value={String(batch.stats.validRows)} />
          <Stat label="Inválidas" value={String(batch.stats.invalidRows)} />
          <Stat
            label="Total"
            value={formatCents(batch.stats.totalAmountCents)}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="valid">
        <TabsList>
          <TabsTrigger value="valid">Válidas ({valid.length})</TabsTrigger>
          <TabsTrigger value="invalid">
            Inválidas ({invalid.length})
          </TabsTrigger>
          <TabsTrigger value="byhouse">Resumen por casa</TabsTrigger>
        </TabsList>
        <TabsContent value="valid">
          <BulkImportRowsTable rows={valid as BulkImportRow[]} />
        </TabsContent>
        <TabsContent value="invalid">
          <BulkImportRowsTable rows={invalid as BulkImportRow[]} />
        </TabsContent>
        <TabsContent value="byhouse">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Casa</th>
                  <th className="p-2 text-right">Pagos</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(byHouse.entries()).map(([key, info]) => (
                  <tr key={key} className="border-t">
                    <td className="p-2">{info.label}</td>
                    <td className="p-2 text-right font-mono">{info.count}</td>
                    <td className="p-2 text-right font-mono">
                      {formatCents(info.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {rejectMode && (
        <div className="space-y-2 border-t pt-4">
          <label className="text-sm font-medium">Motivo del rechazo</label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Explica por qué se rechaza este batch"
            rows={3}
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={submitting}
        >
          Cancelar
        </Button>
        {rejectMode ? (
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setRejectMode(false);
                setNote("");
              }}
              disabled={submitting}
            >
              Atrás
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={submitting}
            >
              Confirmar rechazo
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="destructive"
              onClick={() => setRejectMode(true)}
              disabled={submitting}
            >
              Rechazar
            </Button>
            <Button onClick={handleApprove} disabled={submitting}>
              Aprobar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
