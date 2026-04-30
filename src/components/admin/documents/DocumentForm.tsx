"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Download, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ClientSelector } from "./ClientSelector";
import { DocumentItemsTable } from "./DocumentItemsTable";
import { DocumentTotals } from "./DocumentTotals";
import { DocumentPDFButton } from "./DocumentPDF";
import { DocumentsService } from "@/lib/services/documents-service";
import type {
  DocumentFormData,
  DocumentTipo,
  IVAType,
  Client,
  ZentryDocument,
} from "@/types/documents";
import {
  EMPTY_FORM,
  DEFAULT_NOTAS_COT,
  DEFAULT_NOTAS_NOT,
} from "@/types/documents";

interface DocumentFormProps {
  existingDocument?: ZentryDocument; // si existe → modo edición
  defaultTipo?: DocumentTipo;
}

export function DocumentForm({
  existingDocument,
  defaultTipo = "COT",
}: DocumentFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [savedDoc, setSavedDoc] = useState<ZentryDocument | null>(
    existingDocument ?? null,
  );
  const [folio, setFolio] = useState(existingDocument?.folio ?? "");
  const [loadingFolio, setLoadingFolio] = useState(false);

  const [form, setForm] = useState<DocumentFormData>(() => {
    if (existingDocument) {
      return {
        tipo: existingDocument.tipo,
        clienteId: existingDocument.clienteId,
        clienteNombre: existingDocument.clienteNombre,
        clienteEmpresa: existingDocument.clienteEmpresa,
        clienteDireccion: existingDocument.clienteDireccion,
        numeroReferencia: existingDocument.numeroReferencia ?? "",
        fecha: existingDocument.fecha,
        fechaVencimiento: existingDocument.fechaVencimiento ?? "",
        vendedor: existingDocument.vendedor ?? "",
        proyecto: existingDocument.proyecto ?? "",
        asunto: existingDocument.asunto ?? "",
        items: existingDocument.items,
        descuentoPct: existingDocument.descuentoPct,
        ivaType: existingDocument.ivaType,
        notasCliente: existingDocument.notasCliente,
        terminosCondiciones: existingDocument.terminosCondiciones,
      };
    }
    return {
      ...EMPTY_FORM,
      tipo: defaultTipo,
      notasCliente:
        defaultTipo === "NOT" ? DEFAULT_NOTAS_NOT : DEFAULT_NOTAS_COT,
    };
  });

  // Cargar folio inicial si es documento nuevo
  useEffect(() => {
    if (!existingDocument) {
      setLoadingFolio(true);
      DocumentsService.getNextFolio(form.tipo)
        .then(({ folio }) => setFolio(folio))
        .finally(() => setLoadingFolio(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Al cambiar tipo, actualizar folio y notas default
  const handleTipoChange = async (tipo: DocumentTipo) => {
    setForm((p) => ({
      ...p,
      tipo,
      notasCliente: tipo === "NOT" ? DEFAULT_NOTAS_NOT : DEFAULT_NOTAS_COT,
    }));
    if (!existingDocument) {
      setLoadingFolio(true);
      const { folio } = await DocumentsService.getNextFolio(tipo);
      setFolio(folio);
      setLoadingFolio(false);
    }
  };

  const handleClientChange = (client: Client) => {
    setForm((p) => ({
      ...p,
      clienteId: client.id,
      clienteNombre: client.nombre,
      clienteEmpresa: client.empresa,
      clienteDireccion: client.direccion,
    }));
  };

  const selectedClient: Client | null = form.clienteId
    ? {
        id: form.clienteId,
        nombre: form.clienteNombre,
        empresa: form.clienteEmpresa,
        direccion: form.clienteDireccion,
        email: "",
        telefono: "",
      }
    : null;

  const patch = (data: Partial<DocumentFormData>) =>
    setForm((p) => ({ ...p, ...data }));

  const handleSave = async (andDownload = false) => {
    if (!form.clienteId) {
      toast({
        title: "Cliente requerido",
        description: "Selecciona un cliente antes de guardar.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      let docId: string;
      if (existingDocument) {
        await DocumentsService.updateDocument(existingDocument.id, form);
        docId = existingDocument.id;
      } else {
        docId = await DocumentsService.createDocument(form, user!.uid);
      }

      // Si necesitamos el doc completo para PDF
      if (andDownload) {
        const full = await DocumentsService.getDocument(docId);
        setSavedDoc(full);
      }

      toast({
        title: "Guardado",
        description: `${folio} guardado correctamente.`,
      });
      if (!andDownload) {
        router.push("/dashboard/cotizaciones");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/cotizaciones")}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {existingDocument ? "Editando" : "Nuevo"}
            </p>
            <p className="text-sm font-black text-slate-900">
              {loadingFolio
                ? "..."
                : folio ||
                  (form.tipo === "COT" ? "Cotización" : "Nota de Venta")}
            </p>
          </div>
        </div>

        {/* Selector COT / NOT */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(["COT", "NOT"] as DocumentTipo[]).map((t) => (
            <button
              key={t}
              type="button"
              disabled={!!existingDocument}
              onClick={() => handleTipoChange(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                form.tipo === t
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              } disabled:cursor-not-allowed`}
            >
              {t === "COT" ? "Cotización" : "Nota de Venta"}
            </button>
          ))}
        </div>
      </div>

      {/* Form body */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* === CLIENTE === */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-black text-red-500 uppercase tracking-wide">
              Nombre del Cliente *
            </Label>
            <ClientSelector
              value={selectedClient}
              onChange={handleClientChange}
            />
          </div>

          {selectedClient && (
            <div className="grid grid-cols-2 gap-6 pt-2">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Dirección de Facturación
                </p>
                <textarea
                  value={form.clienteDireccion}
                  onChange={(e) => patch({ clienteDireccion: e.target.value })}
                  rows={3}
                  className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>
            </div>
          )}
        </section>

        {/* === CABECERA === */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-black text-red-500 uppercase tracking-wide">
                {form.tipo === "COT" ? "Cotización" : "Nota de Venta"} # *
              </Label>
              <Input
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                className="h-10 rounded-lg font-mono font-bold"
                disabled={loadingFolio}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                N.º de Referencia
              </Label>
              <Input
                value={form.numeroReferencia}
                onChange={(e) => patch({ numeroReferencia: e.target.value })}
                className="h-10 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black text-red-500 uppercase tracking-wide">
                Fecha *
              </Label>
              <Input
                type="date"
                value={form.fecha}
                onChange={(e) => patch({ fecha: e.target.value })}
                className="h-10 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Fecha de Vencimiento
              </Label>
              <Input
                type="date"
                value={form.fechaVencimiento}
                onChange={(e) => patch({ fechaVencimiento: e.target.value })}
                className="h-10 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Vendedor
              </Label>
              <Input
                value={form.vendedor}
                onChange={(e) => patch({ vendedor: e.target.value })}
                placeholder="Seleccionar o agregar vendedor"
                className="h-10 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Nombre del Proyecto
              </Label>
              <Input
                value={form.proyecto}
                onChange={(e) => patch({ proyecto: e.target.value })}
                placeholder="Seleccionar un proyecto"
                className="h-10 rounded-lg"
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Asunto
              </Label>
              <textarea
                value={form.asunto}
                onChange={(e) => patch({ asunto: e.target.value })}
                rows={2}
                placeholder="Informe a su cliente para qué sirve este documento"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none text-slate-700 placeholder:text-slate-300"
              />
            </div>
          </div>
        </section>

        {/* === TABLA DE ARTÍCULOS === */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">
            Tabla de artículos
          </h3>
          <DocumentItemsTable
            items={form.items}
            onChange={(items) => patch({ items })}
          />

          {/* Totales alineados a la derecha */}
          <div className="flex justify-end pt-4">
            <DocumentTotals
              items={form.items}
              descuentoPct={form.descuentoPct}
              ivaType={form.ivaType}
              onDescuentoChange={(val) => patch({ descuentoPct: val })}
              onIVAChange={(val) => patch({ ivaType: val })}
            />
          </div>
        </section>

        {/* === NOTAS + T&C === */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Notas del cliente
            </Label>
            <textarea
              value={form.notasCliente}
              onChange={(e) => patch({ notasCliente: e.target.value })}
              rows={5}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none text-slate-600"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Términos y condiciones
            </Label>
            <textarea
              value={form.terminosCondiciones}
              onChange={(e) => patch({ terminosCondiciones: e.target.value })}
              rows={5}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none text-slate-600"
            />
          </div>
        </section>
      </div>

      {/* === STICKY FOOTER === */}
      <div className="sticky bottom-0 z-40 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
        {savedDoc && <DocumentPDFButton document={savedDoc} />}
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={saving}
          className="h-11 px-6 font-black rounded-xl border-slate-300"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar borrador
        </Button>
        <Button
          type="button"
          onClick={() => handleSave(true)}
          disabled={saving}
          className="h-11 px-6 font-black bg-slate-900 text-white rounded-xl hover:bg-slate-800"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Guardar y descargar PDF
        </Button>
      </div>
    </div>
  );
}
