"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { DocumentsService } from "@/lib/services/documents-service";
import type {
  ZentryDocument,
  DocumentTipo,
  DocumentEstado,
} from "@/types/documents";

const ESTADO_STYLES: Record<DocumentEstado, string> = {
  borrador: "text-slate-500 bg-slate-100",
  enviado: "text-blue-600 bg-blue-50",
  aceptado: "text-emerald-600 bg-emerald-50",
  rechazado: "text-rose-600 bg-rose-50",
};

const ESTADO_LABELS: Record<DocumentEstado, string> = {
  borrador: "BORRADOR",
  enviado: "ENVIADO",
  aceptado: "ACEPTADO",
  rechazado: "RECHAZADO",
};

export function DocumentList() {
  const [docs, setDocs] = useState<ZentryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<"ALL" | DocumentTipo>("ALL");
  const [deleteDoc, setDeleteDoc] = useState<ZentryDocument | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      setDocs(await DocumentsService.getAllDocuments());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return docs.filter((d) => {
      const matchSearch =
        d.folio.toLowerCase().includes(q) ||
        d.clienteEmpresa.toLowerCase().includes(q) ||
        d.clienteNombre.toLowerCase().includes(q) ||
        (d.numeroReferencia ?? "").toLowerCase().includes(q);
      const matchTipo = tipoFilter === "ALL" || d.tipo === tipoFilter;
      return matchSearch && matchTipo;
    });
  }, [docs, search, tipoFilter]);

  const handleDelete = async () => {
    if (!deleteDoc) return;
    try {
      await DocumentsService.deleteDocument(deleteDoc.id);
      toast({
        title: "Eliminado",
        description: `${deleteDoc.folio} eliminado.`,
      });
      setDeleteDoc(null);
      load();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const fmt = (val: number) =>
    `MXN${val.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

  const fmtDate = (ts: any) => {
    if (!ts) return "-";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-black text-slate-900">
            Todos los Documentos
          </h1>
          <button className="text-slate-400 hover:text-slate-600">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
        <Link href="/dashboard/documentos/nuevo">
          <Button className="h-10 px-5 font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
            <Plus className="h-4 w-4 mr-2" /> Nuevo
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-9 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {(["ALL", "COT", "NOT"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipoFilter(t)}
              className={`px-3 py-1 text-xs font-black rounded-md transition-all ${
                tipoFilter === t
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "ALL" ? "Todos" : t}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={load}
          className="h-9 w-9 text-slate-400"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-slate-100">
              {[
                "Fecha",
                "Número de Estimación",
                "N.º de Referencia",
                "Nombre del Cliente",
                "Estado",
                "Cantidad",
              ].map((h) => (
                <TableHead
                  key={h}
                  className="text-[10px] font-black uppercase tracking-wider text-slate-500 py-3"
                >
                  {h}
                </TableHead>
              ))}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-20 text-center text-slate-300 font-black text-sm uppercase tracking-widest"
                >
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-20 text-center">
                  <p className="text-slate-300 font-black text-sm uppercase tracking-widest">
                    Sin documentos
                  </p>
                  <Link href="/dashboard/documentos/nuevo">
                    <Button className="mt-4 bg-blue-600 text-white font-black rounded-xl h-9 px-5 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-1" /> Crear primero
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((d) => (
                <TableRow
                  key={d.id}
                  className="border-slate-50 hover:bg-slate-50/60 transition-colors"
                >
                  <TableCell className="py-4 text-sm text-slate-600 font-medium">
                    {fmtDate(d.createdAt)}
                  </TableCell>
                  <TableCell className="py-4">
                    <Link
                      href={`/dashboard/documentos/${d.id}`}
                      className="text-sm font-black text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {d.folio}
                    </Link>
                  </TableCell>
                  <TableCell className="py-4 text-sm text-slate-500">
                    {d.numeroReferencia || "-"}
                  </TableCell>
                  <TableCell className="py-4 text-sm text-slate-800 font-semibold">
                    {d.clienteEmpresa || d.clienteNombre}
                  </TableCell>
                  <TableCell className="py-4">
                    <span
                      className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${ESTADO_STYLES[d.estado]}`}
                    >
                      {ESTADO_LABELS[d.estado]}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 text-sm font-black text-slate-900 text-right">
                    {fmt(d.total)}
                  </TableCell>
                  <TableCell className="py-4">
                    <button
                      onClick={() => setDeleteDoc(d)}
                      className="h-8 w-8 flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDoc} onOpenChange={(o) => !o && setDeleteDoc(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-black text-rose-600">
              Eliminar documento
            </DialogTitle>
            <DialogDescription>
              ¿Eliminar <strong>{deleteDoc?.folio}</strong>? Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDoc(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
