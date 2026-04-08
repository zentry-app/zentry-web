"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { BulkImportRow } from "./types";

interface Props {
  rows: BulkImportRow[];
  filter?: "all" | "valid" | "invalid";
}

function formatCents(cents: number | null): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default function BulkImportRowsTable({ rows, filter = "all" }: Props) {
  const visible = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "valid") return r.status === "valid";
    return r.status === "invalid" || r.status === "duplicate";
  });

  if (visible.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No hay filas que mostrar
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Casa</TableHead>
            <TableHead>Folio cliente</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Meses</TableHead>
            <TableHead>Folio migración</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((row) => {
            const invalid = row.status !== "valid";
            return (
              <TableRow
                key={row.rowIndex}
                className={
                  invalid
                    ? "bg-red-50 dark:bg-red-950/30"
                    : "bg-green-50/50 dark:bg-green-950/20"
                }
              >
                <TableCell className="font-mono text-xs">
                  {row.rowIndex + 1}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{row.raw.houseLabel}</div>
                  {row.parsed.matchConfidence === "fuzzy" && (
                    <div className="text-xs text-amber-600">match difuso</div>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {row.raw.clientFolio || "—"}
                </TableCell>
                <TableCell className="font-mono">
                  {formatCents(row.parsed.amountCents)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {row.parsed.paymentDateStr || row.raw.paymentDateStr}
                </TableCell>
                <TableCell className="text-xs">
                  {row.parsed.months.join(", ") || row.raw.appliesToMonthsRaw}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {row.migrationFolio || "—"}
                </TableCell>
                <TableCell>
                  {invalid ? (
                    <div className="space-y-1">
                      <Badge variant="destructive">Inválida</Badge>
                      {row.errors.map((e, i) => (
                        <div
                          key={i}
                          className="text-xs text-red-700 dark:text-red-300"
                        >
                          • {e.message}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Badge variant="default" className="bg-emerald-600">
                      Válida
                    </Badge>
                  )}
                  {row.applyError && (
                    <div className="text-xs text-red-600 mt-1">
                      Error apply: {row.applyError}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
