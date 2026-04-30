"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IVAType, DocumentItem } from "@/types/documents";
import { DocumentsService } from "@/lib/services/documents-service";

interface DocumentTotalsProps {
  items: DocumentItem[];
  descuentoPct: number;
  ivaType: IVAType;
  onDescuentoChange: (val: number) => void;
  onIVAChange: (val: IVAType) => void;
}

export function DocumentTotals({
  items,
  descuentoPct,
  ivaType,
  onDescuentoChange,
  onIVAChange,
}: DocumentTotalsProps) {
  const { subtotal, descuento, iva, total } = DocumentsService.calculateTotals(
    items,
    descuentoPct,
    ivaType,
  );

  const fmt = (val: number) =>
    val.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="ml-auto w-full max-w-sm space-y-0">
      {/* Subtotal */}
      <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
        <span className="text-sm font-semibold text-slate-600">Subtotal</span>
        <span className="text-sm font-black text-slate-900">
          {fmt(subtotal)}
        </span>
      </div>

      {/* Descuento */}
      <div className="flex justify-between items-center py-2.5 border-b border-slate-100 gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-semibold text-slate-600">
            Descuento
          </span>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <input
              type="number"
              min={0}
              max={100}
              value={descuentoPct}
              onChange={(e) =>
                onDescuentoChange(
                  Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                )
              }
              className="w-14 text-sm text-right px-2 py-1 focus:outline-none"
            />
            <span className="px-2 py-1 bg-slate-50 text-slate-500 text-sm font-bold border-l border-slate-200">
              %
            </span>
          </div>
        </div>
        <span className="text-sm font-medium text-slate-500">
          -{fmt(descuento)}
        </span>
      </div>

      {/* IVA */}
      <div className="flex justify-between items-center py-2.5 border-b border-slate-100 gap-4">
        <div className="flex items-center gap-2">
          <Select
            value={ivaType}
            onValueChange={(v) => onIVAChange(v as IVAType)}
          >
            <SelectTrigger className="h-8 text-sm font-semibold border-slate-200 rounded-lg w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-xl">
              <SelectItem value="8">IVA 8% (BC)</SelectItem>
              <SelectItem value="16">IVA 16%</SelectItem>
              <SelectItem value="exento">Exento</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm font-medium text-slate-500">{fmt(iva)}</span>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center py-3 bg-slate-50 rounded-xl px-4 mt-2">
        <span className="text-sm font-black text-slate-700 uppercase tracking-wide">
          Total ( MXN )
        </span>
        <span className="text-lg font-black text-slate-900">{fmt(total)}</span>
      </div>
    </div>
  );
}
