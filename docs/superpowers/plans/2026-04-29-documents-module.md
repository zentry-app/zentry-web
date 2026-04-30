# Documents Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar cotizaciones y notas de venta con un módulo unificado estilo Zoho Invoice que genera PDFs idénticos al formato NOT-0017.

**Architecture:** Un solo tipo `ZentryDocument` con campo `tipo: 'COT' | 'NOT'`, colección Firestore `documents`, formulario Zoho-style con autocomplete de clientes/catálogo, y PDF generado vía html2canvas + jsPDF. Las rutas `/dashboard/cotizaciones` y `/dashboard/cotizaciones/[id]` manejan lista y edición; `/dashboard/ventas` redirige.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Firebase/Firestore, jsPDF, html2canvas, Tailwind CSS, shadcn/ui, Vitest

---

## File Map

| Acción     | Archivo                                                            |
| ---------- | ------------------------------------------------------------------ |
| Crear      | `Zentry WEB/src/types/documents.ts`                                |
| Crear      | `Zentry WEB/src/lib/services/documents-service.ts`                 |
| Crear      | `Zentry WEB/src/lib/services/clients-service.ts`                   |
| Crear      | `Zentry WEB/src/lib/services/concepts-service.ts`                  |
| Crear      | `Zentry WEB/src/components/admin/documents/ClientSelector.tsx`     |
| Crear      | `Zentry WEB/src/components/admin/documents/DocumentItemsTable.tsx` |
| Crear      | `Zentry WEB/src/components/admin/documents/DocumentTotals.tsx`     |
| Crear      | `Zentry WEB/src/components/admin/documents/DocumentPDF.tsx`        |
| Crear      | `Zentry WEB/src/components/admin/documents/DocumentForm.tsx`       |
| Crear      | `Zentry WEB/src/components/admin/documents/DocumentList.tsx`       |
| Reescribir | `Zentry WEB/app/dashboard/cotizaciones/page.tsx`                   |
| Reescribir | `Zentry WEB/app/dashboard/cotizaciones/nuevo/page.tsx`             |
| Crear      | `Zentry WEB/app/dashboard/cotizaciones/[id]/page.tsx`              |
| Reescribir | `Zentry WEB/app/dashboard/ventas/page.tsx` (redirect)              |
| Eliminar   | `Zentry WEB/src/components/admin/cotizaciones/QuotingTool.tsx`     |
| Eliminar   | `Zentry WEB/src/components/admin/cotizaciones/QuotePreview.tsx`    |
| Eliminar   | `Zentry WEB/src/components/admin/ventas/SaleNoteForm.tsx`          |
| Eliminar   | `Zentry WEB/src/components/admin/ventas/SaleNotePreview.tsx`       |
| Eliminar   | `Zentry WEB/src/lib/services/quotes-service.ts`                    |
| Eliminar   | `Zentry WEB/src/lib/services/sales-notes-service.ts`               |
| Eliminar   | `Zentry WEB/src/types/quotes.ts`                                   |
| Eliminar   | `Zentry WEB/src/types/sales-notes.ts`                              |
| Crear      | `Zentry WEB/src/lib/services/documents-service.test.ts`            |

---

## Task 1: Tipos e interfaces unificadas

**Files:**

- Create: `Zentry WEB/src/types/documents.ts`

- [ ] **Step 1: Crear el archivo de tipos**

```typescript
// Zentry WEB/src/types/documents.ts

export type DocumentTipo = "COT" | "NOT";
export type DocumentEstado = "borrador" | "enviado" | "aceptado" | "rechazado";
export type IVAType = "8" | "16" | "exento";

export interface DocumentItem {
  conceptoId?: string; // ref al catálogo (opcional)
  nombre: string;
  descripcion: string;
  cantidad: number;
  tarifa: number;
  importe: number; // cantidad * tarifa (calculado)
}

export interface ZentryDocument {
  id: string;
  tipo: DocumentTipo;
  folio: string; // "COT-0017" | "NOT-0017"
  folioNumero: number;

  // Cliente
  clienteId: string;
  clienteNombre: string;
  clienteEmpresa: string;
  clienteDireccion: string;

  // Cabecera
  numeroReferencia?: string;
  fecha: string; // "YYYY-MM-DD"
  fechaVencimiento?: string;
  vendedor?: string;
  proyecto?: string;
  asunto?: string;

  // Artículos
  items: DocumentItem[];

  // Totales
  subtotal: number;
  descuentoPct: number;
  descuento: number;
  ivaType: IVAType;
  iva: number;
  total: number;

  // Notas
  notasCliente: string;
  terminosCondiciones: string;

  // Meta
  estado: DocumentEstado;
  creadoPor: string;
  createdAt: any;
  updatedAt: any;
}

export interface DocumentFormData {
  tipo: DocumentTipo;
  clienteId: string;
  clienteNombre: string;
  clienteEmpresa: string;
  clienteDireccion: string;
  numeroReferencia: string;
  fecha: string;
  fechaVencimiento: string;
  vendedor: string;
  proyecto: string;
  asunto: string;
  items: DocumentItem[];
  descuentoPct: number;
  ivaType: IVAType;
  notasCliente: string;
  terminosCondiciones: string;
}

export interface DocumentTotalsResult {
  subtotal: number;
  descuento: number;
  iva: number;
  total: number;
}

// Clientes
export interface Client {
  id: string;
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  direccion: string;
  rfc?: string;
  createdAt?: any;
  updatedAt?: any;
}

// Conceptos del catálogo (subset de lo que ya existe en quote_concepts)
export interface Concept {
  id: string;
  nombre: string;
  descripcion: string;
  precioUnitario: number;
  activo: boolean;
}

// Defaults de texto
export const DEFAULT_NOTAS_COT =
  "Los precios mostrados no incluyen IVA. Se aplicará el IVA correspondiente al momento de la facturación.";

export const DEFAULT_NOTAS_NOT =
  "Este documento no es un comprobante fiscal.\nLa presente nota de venta es solo para efectos administrativos y de control interno.\nPrecios en MXN.";

export const EMPTY_ITEM: DocumentItem = {
  nombre: "",
  descripcion: "",
  cantidad: 1,
  tarifa: 0,
  importe: 0,
};

export const EMPTY_FORM: DocumentFormData = {
  tipo: "COT",
  clienteId: "",
  clienteNombre: "",
  clienteEmpresa: "",
  clienteDireccion: "",
  numeroReferencia: "",
  fecha: new Date().toISOString().split("T")[0],
  fechaVencimiento: "",
  vendedor: "",
  proyecto: "",
  asunto: "",
  items: [{ ...EMPTY_ITEM }],
  descuentoPct: 0,
  ivaType: "16",
  notasCliente: DEFAULT_NOTAS_COT,
  terminosCondiciones: "",
};
```

- [ ] **Step 2: Commit**

```bash
cd "Zentry WEB"
git add src/types/documents.ts
git commit -m "feat(documents): add unified Document types"
```

---

## Task 2: DocumentsService con calculateTotals testeado

**Files:**

- Create: `Zentry WEB/src/lib/services/documents-service.ts`
- Create: `Zentry WEB/src/lib/services/documents-service.test.ts`

- [ ] **Step 1: Escribir los tests (TDD)**

```typescript
// Zentry WEB/src/lib/services/documents-service.test.ts
import { describe, it, expect } from "vitest";
import { DocumentsService } from "./documents-service";
import type { DocumentItem } from "@/types/documents";

const items: DocumentItem[] = [
  { nombre: "A", descripcion: "", cantidad: 2, tarifa: 100, importe: 200 },
  { nombre: "B", descripcion: "", cantidad: 1, tarifa: 50, importe: 50 },
];

describe("DocumentsService.calculateTotals", () => {
  it("calcula subtotal correcto", () => {
    const r = DocumentsService.calculateTotals(items, 0, "16");
    expect(r.subtotal).toBe(250);
  });

  it("aplica descuento porcentual", () => {
    const r = DocumentsService.calculateTotals(items, 10, "16");
    expect(r.descuento).toBeCloseTo(25);
    expect(r.subtotal).toBe(250);
  });

  it("calcula IVA 16% sobre base después de descuento", () => {
    const r = DocumentsService.calculateTotals(items, 0, "16");
    expect(r.iva).toBeCloseTo(40);
    expect(r.total).toBeCloseTo(290);
  });

  it("calcula IVA 8%", () => {
    const r = DocumentsService.calculateTotals(items, 0, "8");
    expect(r.iva).toBeCloseTo(20);
    expect(r.total).toBeCloseTo(270);
  });

  it("IVA exento da iva=0", () => {
    const r = DocumentsService.calculateTotals(items, 0, "exento");
    expect(r.iva).toBe(0);
    expect(r.total).toBe(250);
  });

  it("descuento + IVA combinados", () => {
    const r = DocumentsService.calculateTotals(items, 20, "16");
    // subtotal=250, descuento=50, base=200, iva=32, total=232
    expect(r.descuento).toBeCloseTo(50);
    expect(r.iva).toBeCloseTo(32);
    expect(r.total).toBeCloseTo(232);
  });
});

describe("DocumentsService.formatFolio", () => {
  it("formatea COT con 4 dígitos", () => {
    expect(DocumentsService.formatFolio("COT", 17)).toBe("COT-0017");
  });

  it("formatea NOT con 4 dígitos", () => {
    expect(DocumentsService.formatFolio("NOT", 1)).toBe("NOT-0001");
  });
});
```

- [ ] **Step 2: Ejecutar tests — verificar que fallan**

```bash
cd "Zentry WEB"
npm run test -- documents-service.test --run
```

Esperado: FAIL — `documents-service` not found.

- [ ] **Step 3: Crear el servicio**

```typescript
// Zentry WEB/src/lib/services/documents-service.ts
"use client";

import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import type {
  ZentryDocument,
  DocumentFormData,
  DocumentItem,
  DocumentTotalsResult,
  IVAType,
  DocumentTipo,
} from "@/types/documents";

const COL = "documents";
const COUNTERS = "counters";

export class DocumentsService {
  // Función pura — testeable sin Firebase
  static calculateTotals(
    items: DocumentItem[],
    descuentoPct: number,
    ivaType: IVAType,
  ): DocumentTotalsResult {
    const subtotal = items.reduce((acc, i) => acc + i.cantidad * i.tarifa, 0);
    const descuento = subtotal * (descuentoPct / 100);
    const base = subtotal - descuento;
    const ivaRate = ivaType === "exento" ? 0 : ivaType === "8" ? 0.08 : 0.16;
    const iva = base * ivaRate;
    const total = base + iva;
    return { subtotal, descuento, iva, total };
  }

  // Función pura — testeable sin Firebase
  static formatFolio(tipo: DocumentTipo, num: number): string {
    return `${tipo}-${String(num).padStart(4, "0")}`;
  }

  static async getNextFolio(
    tipo: DocumentTipo,
  ): Promise<{ folio: string; folioNumero: number }> {
    const key = tipo === "COT" ? "cot_documents" : "not_documents";
    const counterRef = doc(db, COUNTERS, key);
    const newNum = await runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef);
      const current = snap.exists() ? (snap.data().lastFolioNumber ?? 0) : 0;
      const next = current + 1;
      tx.set(counterRef, { lastFolioNumber: next }, { merge: true });
      return next;
    });
    return {
      folio: DocumentsService.formatFolio(tipo, newNum),
      folioNumero: newNum,
    };
  }

  static async getAllDocuments(): Promise<ZentryDocument[]> {
    const q = query(collection(db, COL), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ZentryDocument);
  }

  static async getDocument(id: string): Promise<ZentryDocument | null> {
    const snap = await getDoc(doc(db, COL, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as ZentryDocument;
  }

  static async createDocument(
    formData: DocumentFormData,
    creadoPor: string,
  ): Promise<string> {
    const { folio, folioNumero } = await DocumentsService.getNextFolio(
      formData.tipo,
    );
    const totals = DocumentsService.calculateTotals(
      formData.items,
      formData.descuentoPct,
      formData.ivaType,
    );
    const ref = await addDoc(collection(db, COL), {
      ...formData,
      folio,
      folioNumero,
      subtotal: totals.subtotal,
      descuento: totals.descuento,
      iva: totals.iva,
      total: totals.total,
      estado: "borrador",
      creadoPor,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  static async updateDocument(
    id: string,
    formData: DocumentFormData,
  ): Promise<void> {
    const totals = DocumentsService.calculateTotals(
      formData.items,
      formData.descuentoPct,
      formData.ivaType,
    );
    await updateDoc(doc(db, COL, id), {
      ...formData,
      subtotal: totals.subtotal,
      descuento: totals.descuento,
      iva: totals.iva,
      total: totals.total,
      updatedAt: serverTimestamp(),
    });
  }

  static async updateEstado(
    id: string,
    estado: ZentryDocument["estado"],
  ): Promise<void> {
    await updateDoc(doc(db, COL, id), { estado, updatedAt: serverTimestamp() });
  }

  static async deleteDocument(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id));
  }
}
```

- [ ] **Step 4: Ejecutar tests — verificar que pasan**

```bash
cd "Zentry WEB"
npm run test -- documents-service.test --run
```

Esperado: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/services/documents-service.ts src/lib/services/documents-service.test.ts
git commit -m "feat(documents): add DocumentsService with calculateTotals and formatFolio"
```

---

## Task 3: ClientsService y ConceptsService

**Files:**

- Create: `Zentry WEB/src/lib/services/clients-service.ts`
- Create: `Zentry WEB/src/lib/services/concepts-service.ts`

- [ ] **Step 1: Crear ClientsService**

```typescript
// Zentry WEB/src/lib/services/clients-service.ts
"use client";

import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import type { Client } from "@/types/documents";

const COL = "quote_clients"; // reutiliza colección existente

export class ClientsService {
  static async getAllClients(): Promise<Client[]> {
    const q = query(collection(db, COL), orderBy("empresa", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Client);
  }

  static async createClient(
    data: Omit<Client, "id" | "createdAt" | "updatedAt">,
  ): Promise<Client> {
    const ref = await addDoc(collection(db, COL), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, ...data };
  }

  static async updateClient(
    id: string,
    data: Partial<Omit<Client, "id">>,
  ): Promise<void> {
    await updateDoc(doc(db, COL, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }
}
```

- [ ] **Step 2: Crear ConceptsService**

```typescript
// Zentry WEB/src/lib/services/concepts-service.ts
"use client";

import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import type { Concept } from "@/types/documents";

const COL = "quote_concepts"; // reutiliza colección existente

export class ConceptsService {
  static async getActiveConcepts(): Promise<Concept[]> {
    const q = query(
      collection(db, COL),
      where("activo", "==", true),
      orderBy("nombre", "asc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        nombre: data.nombre ?? "",
        descripcion: data.descripcion ?? "",
        precioUnitario: data.precioUnitario ?? 0,
        activo: data.activo ?? true,
      } as Concept;
    });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/clients-service.ts src/lib/services/concepts-service.ts
git commit -m "feat(documents): add ClientsService and ConceptsService"
```

---

## Task 4: ClientSelector — dropdown de clientes con modal crear

**Files:**

- Create: `Zentry WEB/src/components/admin/documents/ClientSelector.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
// Zentry WEB/src/components/admin/documents/ClientSelector.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Plus, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ClientsService } from "@/lib/services/clients-service";
import type { Client } from "@/types/documents";

interface ClientSelectorProps {
  value: Client | null;
  onChange: (client: Client) => void;
}

export function ClientSelector({ value, onChange }: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    direccion: "",
    rfc: "",
  });
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ClientsService.getAllClients().then(setClients);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.empresa.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q)
    );
  });

  const handleSelect = (c: Client) => {
    onChange(c);
    setOpen(false);
    setSearch("");
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const created = await ClientsService.createClient(newClient);
      setClients((prev) =>
        [...prev, created].sort((a, b) => a.empresa.localeCompare(b.empresa)),
      );
      onChange(created);
      setCreateOpen(false);
      setNewClient({
        nombre: "",
        empresa: "",
        email: "",
        telefono: "",
        direccion: "",
        rfc: "",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-4 h-11 text-sm font-medium bg-white hover:border-slate-400 transition-colors"
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value
            ? `${value.empresa || value.nombre}`
            : "Seleccionar cliente..."}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 h-9 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                Sin resultados
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <p className="text-sm font-semibold text-slate-900">
                    {c.empresa || c.nombre}
                  </p>
                  {c.empresa && (
                    <p className="text-xs text-slate-400">{c.nombre}</p>
                  )}
                </button>
              ))
            )}
          </div>
          <div className="p-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setCreateOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" /> Nuevo cliente
            </button>
          </div>
        </div>
      )}

      {/* Modal Crear Cliente */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black">Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[
              { label: "Empresa / Razón Social*", key: "empresa" },
              { label: "Nombre del Contacto", key: "nombre" },
              { label: "Dirección de Facturación", key: "direccion" },
              { label: "Email", key: "email" },
              { label: "Teléfono", key: "telefono" },
              { label: "RFC", key: "rfc" },
            ].map(({ label, key }) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  {label}
                </Label>
                <Input
                  value={(newClient as any)[key]}
                  onChange={(e) =>
                    setNewClient((p) => ({ ...p, [key]: e.target.value }))
                  }
                  className="h-10 rounded-lg"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newClient.empresa || saving}
              className="bg-slate-900 text-white font-black rounded-xl"
            >
              {saving ? "Guardando..." : "Crear Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/documents/ClientSelector.tsx
git commit -m "feat(documents): add ClientSelector with create modal"
```

---

## Task 5: DocumentItemsTable — tabla de artículos con autocomplete

**Files:**

- Create: `Zentry WEB/src/components/admin/documents/DocumentItemsTable.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
// Zentry WEB/src/components/admin/documents/DocumentItemsTable.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Trash2, Plus, GripVertical } from "lucide-react";
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/documents/DocumentItemsTable.tsx
git commit -m "feat(documents): add DocumentItemsTable with catalog autocomplete"
```

---

## Task 6: DocumentTotals — panel subtotal / descuento / IVA / total

**Files:**

- Create: `Zentry WEB/src/components/admin/documents/DocumentTotals.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
// Zentry WEB/src/components/admin/documents/DocumentTotals.tsx
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

  const ivaLabel = ivaType === "exento" ? "Exento" : `IVA (${ivaType}%)`;

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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/documents/DocumentTotals.tsx
git commit -m "feat(documents): add DocumentTotals panel"
```

---

## Task 7: DocumentPDF — template HTML que replica NOT-0017

**Files:**

- Create: `Zentry WEB/src/components/admin/documents/DocumentPDF.tsx`

Logo disponible en: `public/images/logos/Logo version azul.png`

- [ ] **Step 1: Crear el componente**

```tsx
// Zentry WEB/src/components/admin/documents/DocumentPDF.tsx
"use client";

import React, { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ZentryDocument } from "@/types/documents";
import { DocumentsService } from "@/lib/services/documents-service";

interface DocumentPDFProps {
  document: ZentryDocument;
  onGenerated?: () => void;
}

export function DocumentPDFPreview({ document }: { document: ZentryDocument }) {
  const { subtotal, descuento, iva, total } = DocumentsService.calculateTotals(
    document.items,
    document.descuentoPct,
    document.ivaType,
  );

  const fmt = (val: number) =>
    val.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const ivaLabel =
    document.ivaType === "exento" ? "Exento" : `IVA (${document.ivaType}%)`;

  const fechaFmt = document.fecha
    ? new Date(document.fecha + "T12:00:00Z").toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const tituloDoc = document.tipo === "COT" ? "COTIZACIÓN" : "NOTA DE\nVENTA";

  return (
    <div
      id="pdf-content"
      style={{
        width: "794px",
        minHeight: "1123px",
        backgroundColor: "#fff",
        padding: "48px 56px",
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#111",
        boxSizing: "border-box",
      }}
    >
      {/* Header: Logo + Título */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
        }}
      >
        {/* Logo + datos empresa */}
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logos/Logo version azul.png"
            alt="Zentry"
            style={{ height: "48px", marginBottom: "12px" }}
          />
          <p
            style={{
              fontWeight: "bold",
              fontSize: "13px",
              marginBottom: "2px",
            }}
          >
            Zentry Tech Group
          </p>
          <p style={{ fontSize: "12px", color: "#444", lineHeight: "1.6" }}>
            Batequitos 261 Coto Sur
            <br />
            Baja California 21383
            <br />
            Mexico
            <br />
            infra@zentrymx.com
          </p>
        </div>

        {/* Tipo de documento + folio */}
        <div style={{ textAlign: "right" }}>
          <p
            style={{
              fontSize: "28px",
              fontWeight: "900",
              lineHeight: "1.1",
              whiteSpace: "pre-line",
            }}
          >
            {tituloDoc}
          </p>
          <p style={{ fontSize: "13px", color: "#555", marginTop: "6px" }}>
            # {document.folio}
          </p>
        </div>
      </div>

      {/* Cliente + Fecha */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "28px",
        }}
      >
        <div>
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
            Facturar a
          </p>
          <p style={{ fontWeight: "bold", fontSize: "13px" }}>
            {document.clienteEmpresa || document.clienteNombre}
          </p>
          {document.clienteEmpresa && (
            <p style={{ fontSize: "12px", color: "#444" }}>
              {document.clienteNombre}
            </p>
          )}
          {document.clienteDireccion && (
            <p
              style={{
                fontSize: "12px",
                color: "#444",
                whiteSpace: "pre-line",
                marginTop: "4px",
              }}
            >
              {document.clienteDireccion}
            </p>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "12px", color: "#666" }}>
            Fecha:&nbsp;&nbsp;
          </span>
          <span style={{ fontSize: "12px" }}>{fechaFmt}</span>
          {document.fechaVencimiento && (
            <div style={{ marginTop: "4px" }}>
              <span style={{ fontSize: "12px", color: "#666" }}>
                Vence:&nbsp;&nbsp;
              </span>
              <span style={{ fontSize: "12px" }}>
                {new Date(
                  document.fechaVencimiento + "T12:00:00Z",
                ).toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de artículos */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "16px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#1e293b", color: "#fff" }}>
            <th
              style={{
                padding: "10px 12px",
                textAlign: "left",
                fontSize: "12px",
                width: "32px",
              }}
            >
              #
            </th>
            <th
              style={{
                padding: "10px 12px",
                textAlign: "left",
                fontSize: "12px",
              }}
            >
              Artículo &amp; Descripción
            </th>
            <th
              style={{
                padding: "10px 12px",
                textAlign: "right",
                fontSize: "12px",
                width: "80px",
              }}
            >
              Cant.
            </th>
            <th
              style={{
                padding: "10px 12px",
                textAlign: "right",
                fontSize: "12px",
                width: "100px",
              }}
            >
              Tarifa
            </th>
            <th
              style={{
                padding: "10px 12px",
                textAlign: "right",
                fontSize: "12px",
                width: "100px",
              }}
            >
              Cantidad
            </th>
          </tr>
        </thead>
        <tbody>
          {document.items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td
                style={{
                  padding: "12px",
                  fontSize: "12px",
                  color: "#555",
                  verticalAlign: "top",
                }}
              >
                {idx + 1}
              </td>
              <td style={{ padding: "12px", verticalAlign: "top" }}>
                <p
                  style={{
                    fontWeight: "500",
                    fontSize: "12px",
                    marginBottom: "2px",
                  }}
                >
                  {item.nombre}
                </p>
                {item.descripcion && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#666",
                      lineHeight: "1.5",
                    }}
                  >
                    {item.descripcion}
                  </p>
                )}
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontSize: "12px",
                  verticalAlign: "top",
                }}
              >
                {item.cantidad.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontSize: "12px",
                  verticalAlign: "top",
                }}
              >
                {fmt(item.tarifa)}
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontSize: "12px",
                  fontWeight: "bold",
                  verticalAlign: "top",
                }}
              >
                {fmt(item.importe)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "32px",
        }}
      >
        <table style={{ minWidth: "280px" }}>
          <tbody>
            <tr>
              <td
                style={{
                  padding: "6px 16px 6px 0",
                  fontSize: "12px",
                  color: "#555",
                  textAlign: "right",
                  fontWeight: "600",
                }}
              >
                Subtotal
              </td>
              <td
                style={{
                  padding: "6px 0",
                  fontSize: "12px",
                  textAlign: "right",
                  minWidth: "100px",
                }}
              >
                {fmt(subtotal)}
              </td>
            </tr>
            {descuento > 0 && (
              <tr>
                <td
                  style={{
                    padding: "6px 16px 6px 0",
                    fontSize: "12px",
                    color: "#555",
                    textAlign: "right",
                    fontWeight: "600",
                  }}
                >
                  Descuento ({document.descuentoPct}%)
                </td>
                <td
                  style={{
                    padding: "6px 0",
                    fontSize: "12px",
                    textAlign: "right",
                  }}
                >
                  -{fmt(descuento)}
                </td>
              </tr>
            )}
            <tr>
              <td
                style={{
                  padding: "6px 16px 6px 0",
                  fontSize: "12px",
                  color: "#555",
                  textAlign: "right",
                  fontWeight: "600",
                }}
              >
                {ivaLabel}
              </td>
              <td
                style={{
                  padding: "6px 0",
                  fontSize: "12px",
                  textAlign: "right",
                }}
              >
                {fmt(iva)}
              </td>
            </tr>
            <tr style={{ backgroundColor: "#f1f5f9" }}>
              <td
                style={{
                  padding: "10px 16px 10px 12px",
                  fontSize: "13px",
                  fontWeight: "900",
                  textAlign: "right",
                }}
              >
                Total
              </td>
              <td
                style={{
                  padding: "10px 12px 10px 0",
                  fontSize: "13px",
                  fontWeight: "900",
                  textAlign: "right",
                }}
              >
                MXN {fmt(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notas */}
      {document.notasCliente && (
        <div style={{ marginBottom: "24px" }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              marginBottom: "6px",
            }}
          >
            Notas
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "#444",
              whiteSpace: "pre-line",
              lineHeight: "1.6",
            }}
          >
            {document.notasCliente}
          </p>
        </div>
      )}

      {/* Términos */}
      {document.terminosCondiciones && (
        <div>
          <p
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              marginBottom: "6px",
            }}
          >
            Términos y Condiciones
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "#444",
              whiteSpace: "pre-line",
              lineHeight: "1.6",
            }}
          >
            {document.terminosCondiciones}
          </p>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: "32px",
          right: "56px",
          fontSize: "11px",
          color: "#aaa",
        }}
      >
        1
      </div>
    </div>
  );
}

export function DocumentPDFButton({ document }: DocumentPDFProps) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setGenerating(true);
    // Renderiza el preview en un div oculto fuera del DOM visible
    const container = window.document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "-9999px";
    container.style.left = "-9999px";
    container.style.zIndex = "-1";
    window.document.body.appendChild(container);

    const React = await import("react");
    const ReactDOM = await import("react-dom/client");
    const root = ReactDOM.createRoot(container);
    root.render(<DocumentPDFPreview document={document} />);

    await new Promise((r) => setTimeout(r, 400)); // esperar render

    try {
      const el = container.querySelector("#pdf-content") as HTMLElement;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });
      pdf.addImage(imgData, "JPEG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${document.folio}.pdf`);
    } finally {
      root.unmount();
      window.document.body.removeChild(container);
      setGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleDownload}
      disabled={generating}
      className="h-11 px-6 font-black bg-slate-900 text-white rounded-xl hover:bg-slate-800"
    >
      {generating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" /> Descargar PDF
        </>
      )}
    </Button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/documents/DocumentPDF.tsx
git commit -m "feat(documents): add PDF template replicating NOT-0017 format"
```

---

## Task 8: DocumentForm — formulario principal Zoho-style

**Files:**

- Create: `Zentry WEB/src/components/admin/documents/DocumentForm.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
// Zentry WEB/src/components/admin/documents/DocumentForm.tsx
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
  EMPTY_ITEM,
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/documents/DocumentForm.tsx
git commit -m "feat(documents): add DocumentForm with Zoho-style layout"
```

---

## Task 9: DocumentList — lista unificada estilo Zoho

**Files:**

- Create: `Zentry WEB/src/components/admin/documents/DocumentList.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
// Zentry WEB/src/components/admin/documents/DocumentList.tsx
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
        <Link href="/dashboard/cotizaciones/nuevo">
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
                  <Link href="/dashboard/cotizaciones/nuevo">
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
                      href={`/dashboard/cotizaciones/${d.id}`}
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/admin/documents/DocumentList.tsx
git commit -m "feat(documents): add DocumentList with Zoho-style table"
```

---

## Task 10: Pages y rutas

**Files:**

- Rewrite: `Zentry WEB/app/dashboard/cotizaciones/page.tsx`
- Rewrite: `Zentry WEB/app/dashboard/cotizaciones/nuevo/page.tsx`
- Create: `Zentry WEB/app/dashboard/cotizaciones/[id]/page.tsx`
- Rewrite: `Zentry WEB/app/dashboard/ventas/page.tsx`

- [ ] **Step 1: Reescribir `cotizaciones/page.tsx`**

```tsx
// Zentry WEB/app/dashboard/cotizaciones/page.tsx
"use client";
import { DocumentList } from "@/components/admin/documents/DocumentList";

export default function CotizacionesPage() {
  return <DocumentList />;
}
```

- [ ] **Step 2: Reescribir `cotizaciones/nuevo/page.tsx`**

```tsx
// Zentry WEB/app/dashboard/cotizaciones/nuevo/page.tsx
"use client";
import { DocumentForm } from "@/components/admin/documents/DocumentForm";

export default function NuevoCotizacionPage() {
  return <DocumentForm />;
}
```

- [ ] **Step 3: Crear `cotizaciones/[id]/page.tsx`**

```tsx
// Zentry WEB/app/dashboard/cotizaciones/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DocumentForm } from "@/components/admin/documents/DocumentForm";
import { DocumentsService } from "@/lib/services/documents-service";
import type { ZentryDocument } from "@/types/documents";
import { Loader2 } from "lucide-react";

export default function EditDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<ZentryDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DocumentsService.getDocument(id).then((d) => {
      setDoc(d);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-slate-400 font-black">Documento no encontrado.</p>
      </div>
    );
  }

  return <DocumentForm existingDocument={doc} />;
}
```

- [ ] **Step 4: Reescribir `ventas/page.tsx` como redirect**

```tsx
// Zentry WEB/app/dashboard/ventas/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VentasRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/cotizaciones");
  }, [router]);
  return null;
}
```

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/cotizaciones/page.tsx app/dashboard/cotizaciones/nuevo/page.tsx app/dashboard/cotizaciones/[id]/page.tsx app/dashboard/ventas/page.tsx
git commit -m "feat(documents): wire pages and add [id] edit route"
```

---

## Task 11: Cleanup — eliminar archivos obsoletos

**Files:**

- Delete: `Zentry WEB/src/components/admin/cotizaciones/QuotingTool.tsx`
- Delete: `Zentry WEB/src/components/admin/cotizaciones/QuotePreview.tsx`
- Delete: `Zentry WEB/src/components/admin/ventas/SaleNoteForm.tsx`
- Delete: `Zentry WEB/src/components/admin/ventas/SaleNotePreview.tsx`
- Delete: `Zentry WEB/src/lib/services/quotes-service.ts`
- Delete: `Zentry WEB/src/lib/services/sales-notes-service.ts`
- Delete: `Zentry WEB/src/types/quotes.ts`
- Delete: `Zentry WEB/src/types/sales-notes.ts`

- [ ] **Step 1: Verificar que el build no use los archivos viejos**

```bash
cd "Zentry WEB"
grep -r "quotes-service\|sales-notes-service\|QuotingTool\|SaleNoteForm\|QuotePreview\|SaleNotePreview\|from.*types/quotes\|from.*types/sales-notes" src app --include="*.tsx" --include="*.ts" -l
```

Esperado: sin resultados (o solo los archivos que vamos a eliminar).
Si hay resultados inesperados, actualizar esas importaciones antes de continuar.

- [ ] **Step 2: Eliminar archivos obsoletos**

```bash
cd "Zentry WEB"
rm src/components/admin/cotizaciones/QuotingTool.tsx
rm src/components/admin/cotizaciones/QuotePreview.tsx
rm src/components/admin/ventas/SaleNoteForm.tsx
rm src/components/admin/ventas/SaleNotePreview.tsx
rm src/lib/services/quotes-service.ts
rm src/lib/services/sales-notes-service.ts
rm src/types/quotes.ts
rm src/types/sales-notes.ts
```

- [ ] **Step 3: Verificar build**

```bash
cd "Zentry WEB"
npm run build 2>&1 | tail -30
```

Esperado: build exitoso sin errores TypeScript.

Si hay errores de importaciones rotas en otros archivos (ej. `app/dashboard/cotizaciones/nuevo/page.tsx` viejo que importaba `QuotingTool`), ya fueron reemplazados en Task 10. Si aparece otro archivo, actualizar la importación a los nuevos componentes.

- [ ] **Step 4: Correr tests finales**

```bash
cd "Zentry WEB"
npm run test:silent 2>&1 | tail -20
```

Esperado: PASS en `documents-service.test`.

- [ ] **Step 5: Commit final**

```bash
cd "Zentry WEB"
git add -A
git commit -m "feat(documents): complete unified documents module — Zoho Invoice style

- Unified COT/NOT module replacing separate cotizaciones/ventas
- Zoho-style form: client selector, catalog autocomplete, IVA, discount
- PDF generation replicating NOT-0017 format exactly
- Clean list view with status badges and search/filter
- Removes QuotingTool, SaleNoteForm, and legacy types"
```
