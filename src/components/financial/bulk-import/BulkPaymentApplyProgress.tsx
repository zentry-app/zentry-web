"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { BulkPaymentImportService } from "@/lib/services/BulkPaymentImportService";

interface Props {
  residencialId: string;
  batchId: string;
  onDone: () => void;
}

const CHUNK_SIZE = 25;

export default function BulkPaymentApplyProgress({
  residencialId,
  batchId,
  onDone,
}: Props) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processed, setProcessed] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [failed, setFailed] = useState(0);
  const startedRef = useRef(false);

  const runLoop = async () => {
    if (running) return;
    setRunning(true);
    setError(null);
    try {
      let isDone = false;
      let safety = 0;
      while (!isDone && safety < 1000) {
        safety++;
        const r = await BulkPaymentImportService.applyChunk(
          residencialId,
          batchId,
          CHUNK_SIZE,
        );
        setProcessed(r.processed);
        setRemaining(r.remaining);
        setFailed(r.failed);
        isDone = r.done;
      }
      setDone(true);
      toast.success("Batch aplicado");
    } catch (err: any) {
      setError(err?.message ?? "Error aplicando batch");
      toast.error(err?.message ?? "Error aplicando");
    } finally {
      setRunning(false);
    }
  };

  // Auto-start the apply loop on mount
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      runLoop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total =
    remaining != null ? processed + remaining + failed : processed;
  const pct = total > 0 ? Math.round(((processed + failed) / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Aplicando batch</DialogTitle>
        <DialogDescription className="font-mono text-xs">
          {batchId}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <Progress value={pct} className="h-2" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {processed} aplicados · {failed} fallidos
            {remaining != null && ` · ${remaining} restantes`}
          </span>
          <span className="font-mono">{pct}%</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-red-700 dark:text-red-300">{error}</div>
        </div>
      )}

      {done && !error && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-emerald-700 dark:text-emerald-300">
            Apply completado correctamente.
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        {error && !running && (
          <Button onClick={runLoop} variant="default">
            Reintentar
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onDone}
          disabled={running}
        >
          {done ? "Cerrar" : "Cancelar"}
        </Button>
      </div>
    </div>
  );
}
