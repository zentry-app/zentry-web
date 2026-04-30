"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConceptsService } from "@/lib/services/concepts-service";
import type { DocumentItem, Concept } from "@/types/documents";
import { EMPTY_ITEM } from "@/types/documents";

interface DocumentItemsTableProps {
  items: DocumentItem[];
  onChange: (items: DocumentItem[]) => void;
}

export function DocumentItemsTable({
  items,
  onChange,
}: DocumentItemsTableProps) {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [autocompleteIdx, setAutocompleteIdx] = useState<number | null>(null);
  const [acSearch, setAcSearch] = useState("");

  useEffect(() => {
    ConceptsService.getActiveConcepts().then(setConcepts);
  }, []);

  const updateItem = (idx: number, patch: Partial<DocumentItem>) => {
    const updated = items.map((item, i) => {
      if (i !== idx) return item;
      const next = { ...item, ...patch };
      next.importe = next.cantidad * next.tarifa;
      return next;
    });
    onChange(updated);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    onChange([...items, { ...EMPTY_ITEM }]);
  };

  const selectConcept = (idx: number, concept: Concept) => {
    updateItem(idx, {
      conceptoId: concept.id,
      nombre: concept.nombre,
      descripcion: concept.descripcion,
      tarifa: concept.precioUnitario,
      importe: items[idx].cantidad * concept.precioUnitario,
    });
    setAutocompleteIdx(null);
    setAcSearch("");
  };

  const filteredConcepts = concepts.filter((c) =>
    c.nombre.toLowerCase().includes(acSearch.toLowerCase()),
  );

  const formatMXN = (val: number) =>
    val.toLocaleString("es-MX", { minimumFractionDigits: 2 });

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 text-white grid grid-cols-[auto_1fr_120px_140px_140px_40px] gap-0">
        <div className="px-3 py-3 text-[11px] font-black uppercase tracking-wider w-10">
          #
        </div>
        <div className="px-3 py-3 text-[11px] font-black uppercase tracking-wider">
          Artículo &amp; Descripción
        </div>
        <div className="px-3 py-3 text-[11px] font-black uppercase tracking-wider text-right">
          Cant.
        </div>
        <div className="px-3 py-3 text-[11px] font-black uppercase tracking-wider text-right">
          Tarifa
        </div>
        <div className="px-3 py-3 text-[11px] font-black uppercase tracking-wider text-right">
          Importe
        </div>
        <div className="w-10" />
      </div>

      {/* Rows */}
      {items.map((item, idx) => (
        <div
          key={idx}
          className="grid grid-cols-[auto_1fr_120px_140px_140px_40px] gap-0 border-t border-slate-100 hover:bg-slate-50/50 relative"
        >
          {/* # */}
          <div className="px-3 py-3 flex items-start justify-center w-10">
            <span className="text-sm text-slate-400 font-bold mt-2">
              {idx + 1}
            </span>
          </div>

          {/* Artículo + Descripción */}
          <div className="px-3 py-3 relative">
            <input
              type="text"
              value={item.nombre}
              onChange={(e) => {
                updateItem(idx, { nombre: e.target.value });
                setAcSearch(e.target.value);
                setAutocompleteIdx(e.target.value.length > 0 ? idx : null);
              }}
              onFocus={() => {
                setAutocompleteIdx(idx);
                setAcSearch(item.nombre);
              }}
              onBlur={() => setTimeout(() => setAutocompleteIdx(null), 150)}
              placeholder="Escriba o haga clic para seleccionar un artículo."
              className="w-full text-sm border-0 bg-transparent focus:outline-none focus:ring-0 text-slate-800 placeholder:text-slate-300 font-medium"
            />
            <textarea
              value={item.descripcion}
              onChange={(e) => updateItem(idx, { descripcion: e.target.value })}
              placeholder="Descripción (opcional)"
              rows={2}
              className="w-full text-xs border-0 bg-transparent focus:outline-none focus:ring-0 text-slate-500 placeholder:text-slate-300 resize-none mt-1"
            />

            {/* Autocomplete */}
            {autocompleteIdx === idx && filteredConcepts.length > 0 && (
              <div className="absolute left-0 top-full z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto">
                {filteredConcepts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={() => selectConcept(idx, c)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {c.nombre}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {c.descripcion}
                    </p>
                    <p className="text-xs font-bold text-blue-600 mt-0.5">
                      $
                      {c.precioUnitario.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cantidad */}
          <div className="px-2 py-3 flex items-start justify-end">
            <input
              type="number"
              min={0}
              step={1}
              value={item.cantidad}
              onChange={(e) =>
                updateItem(idx, { cantidad: parseFloat(e.target.value) || 0 })
              }
              className="w-full text-sm text-right border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            />
          </div>

          {/* Tarifa */}
          <div className="px-2 py-3 flex items-start justify-end">
            <input
              type="number"
              min={0}
              step={0.01}
              value={item.tarifa}
              onChange={(e) =>
                updateItem(idx, { tarifa: parseFloat(e.target.value) || 0 })
              }
              className="w-full text-sm text-right border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            />
          </div>

          {/* Importe */}
          <div className="px-3 py-3 flex items-start justify-end">
            <span className="text-sm font-black text-slate-900 mt-1.5">
              {formatMXN(item.importe)}
            </span>
          </div>

          {/* Eliminar */}
          <div className="flex items-start justify-center pt-2.5 w-10">
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="h-7 w-7 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          onClick={addItem}
          className="h-9 text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg px-3"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Añadir nueva fila
        </Button>
      </div>
    </div>
  );
}
