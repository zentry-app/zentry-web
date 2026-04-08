"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { BulkPaymentImportService } from "@/lib/services/BulkPaymentImportService";

interface Props {
  residencialId: string;
  batchId: string;
  onDone: () => void;
}

const CHUNK_SIZE = 25;

export default function BulkPaymentRevertDialog({
  residencialId,
  batchId,
  onDone,
}: Props) {
  const [reason, setReason] = useState("");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);

  const handleRevert = async () => {
    if (!reason.trim()) {
      toast.error("Indica el motivo de la reversión");
      return;
    }
    setRunning(true);
    try {
      let isDone = false;
      let safety = 0;
      while (!isDone && safety < 1000) {
        safety++;
        const r = await BulkPaymentImportService.revertChunk(
          residencialId,
          batchId,
          reason,
          CHUNK_SIZE,
        );
        setProcessed(r.processed);
        setRemaining(r.remaining);
        isDone = r.done;
      }
      setDone(true);
      toast.success("Batch revertido");
      // Auto-close after a beat
      setTimeout(onDone, 800);
    } catch (err: any) {
      toast.error(err?.message ?? "Error revirtiendo");
    } finally {
      setRunning(false);
    }
  };

  const total = remaining != null ? processed + remaining : processed;
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Revertir batch
        </DialogTitle>
        <DialogDescription className="font-mono text-xs">
          {batchId}
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200">
        Esta operación crea entradas REV_ en el ledger, marca los pagos como
        revertidos y restaura las cuotas a estado pendiente. La operación es
        reversible solo manualmente.
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Motivo (requerido)</label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej. archivo incorrecto cargado por la administradora"
          rows={3}
          disabled={running || done}
        />
      </div>

      {(running || done) && (
        <div className="space-y-2">
          <Progress value={pct} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {processed} revertidos
              {remaining != null && ` · ${remaining} restantes`}
            </span>
            <span className="font-mono">{pct}%</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={onDone} disabled={running}>
          {done ? "Cerrar" : "Cancelar"}
        </Button>
        {!done && (
          <Button
            variant="destructive"
            onClick={handleRevert}
            disabled={running || !reason.trim()}
          >
            {running ? "Revirtiendo…" : "Confirmar reversión"}
          </Button>
        )}
      </div>
    </div>
  );
}
