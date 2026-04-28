"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { RefreshCw } from "lucide-react";
import { BulkPaymentImportService } from "@/lib/services/BulkPaymentImportService";
import type { BulkImportBatch, BulkImportBatchStatus } from "./types";
import BulkPaymentReviewDialog from "./BulkPaymentReviewDialog";
import BulkPaymentApplyProgress from "./BulkPaymentApplyProgress";
import BulkPaymentRevertDialog from "./BulkPaymentRevertDialog";

interface Props {
  residencialId: string;
}

const STATUS_VARIANT: Record<
  BulkImportBatchStatus,
  { label: string; className: string }
> = {
  pending_review: {
    label: "Pendiente",
    className: "bg-amber-500 text-white",
  },
  approved: { label: "Aprobado", className: "bg-blue-600 text-white" },
  rejected: { label: "Rechazado", className: "bg-zinc-500 text-white" },
  applied: { label: "Aplicado", className: "bg-emerald-600 text-white" },
  apply_failed: { label: "Apply fallido", className: "bg-red-600 text-white" },
  reverted: { label: "Revertido", className: "bg-purple-600 text-white" },
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(ts: any): string {
  if (!ts) return "—";
  const date = ts._seconds
    ? new Date(ts._seconds * 1000)
    : ts.seconds
      ? new Date(ts.seconds * 1000)
      : new Date(ts);
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BulkPaymentBatchesList({ residencialId }: Props) {
  const [batches, setBatches] = useState<BulkImportBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await BulkPaymentImportService.listBatches(residencialId);
      setBatches(r.batches);
    } catch (err: any) {
      toast.error(err?.message ?? "Error cargando batches");
    } finally {
      setLoading(false);
    }
  }, [residencialId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Batches de migración histórica
        </h3>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refrescar
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full rounded-lg" />
      ) : batches.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          Aún no hay batches. Sube uno desde "Carga masiva histórica".
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Archivo</TableHead>
                <TableHead>Modo</TableHead>
                <TableHead>Filas</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => {
                const sv =
                  STATUS_VARIANT[batch.status] ?? STATUS_VARIANT.pending_review;
                return (
                  <TableRow key={batch.batchId}>
                    <TableCell className="text-xs">
                      {formatDate(batch.uploadedAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {batch.sourceFilename}
                    </TableCell>
                    <TableCell className="text-xs">
                      {batch.mode === "pre_create_fees" ? "Pre-cuotas" : "OTF"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {batch.stats.validRows}/{batch.stats.totalRows}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {formatCents(batch.stats.totalAmountCents)}
                    </TableCell>
                    <TableCell>
                      <Badge className={sv.className}>{sv.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <BatchActions
                        batch={batch}
                        residencialId={residencialId}
                        onChange={load}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function BatchActions({
  batch,
  residencialId,
  onChange,
}: {
  batch: BulkImportBatch;
  residencialId: string;
  onChange: () => void;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [revertOpen, setRevertOpen] = useState(false);

  if (batch.status === "pending_review") {
    return (
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="default">
            Revisar
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <BulkPaymentReviewDialog
            residencialId={residencialId}
            batchId={batch.batchId}
            onClose={() => {
              setReviewOpen(false);
              onChange();
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (batch.status === "approved" || batch.status === "apply_failed") {
    return (
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="default">
            Aplicar
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <BulkPaymentApplyProgress
            residencialId={residencialId}
            batchId={batch.batchId}
            onDone={() => {
              setApplyOpen(false);
              onChange();
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (batch.status === "applied") {
    return (
      <Dialog open={revertOpen} onOpenChange={setRevertOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive">
            Revertir
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <BulkPaymentRevertDialog
            residencialId={residencialId}
            batchId={batch.batchId}
            onDone={() => {
              setRevertOpen(false);
              onChange();
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <span className="text-xs text-muted-foreground">
      {batch.status === "rejected" ? "Rechazado" : "Revertido"}
    </span>
  );
}
