# Diseño: Módulo de Documentos (Cotizaciones + Notas de Venta)

**Fecha:** 2026-04-29
**Estado:** Aprobado
**Objetivo:** Reemplazar los módulos separados de cotizaciones y notas de venta con un módulo unificado estilo Zoho Invoice, con generación de PDF fiel al formato NOT-0017.

---

## Contexto

Se eliminan los componentes actuales `QuotingTool.tsx`, `QuotePreview.tsx`, `SaleNoteForm.tsx`, `SaleNotePreview.tsx` y los servicios `quotes-service.ts` / `sales-notes-service.ts`. Los ~17 documentos existentes en Firestore no se migran (son pocos, se recrean manualmente).

---

## Modelo de datos

### Colección: `documents`

```ts
interface Document {
  id: string;
  tipo: "COT" | "NOT"; // Cotización o Nota de Venta
  folio: string; // "COT-0017" | "NOT-0017"
  folioNumero: number;

  // Cliente
  clienteId: string;
  clienteNombre: string;
  clienteEmpresa: string;
  clienteDireccion: string; // dirección de facturación del cliente

  // Cabecera
  numeroReferencia?: string;
  fecha: string; // ISO date "YYYY-MM-DD"
  fechaVencimiento?: string;
  vendedor?: string;
  proyecto?: string;
  asunto?: string;

  // Artículos
  items: DocumentItem[];

  // Totales
  subtotal: number;
  descuentoPct: number; // porcentaje ingresado por el usuario
  descuento: number; // monto calculado
  ivaType: "8" | "16" | "exento";
  iva: number;
  total: number;

  // Notas
  notasCliente?: string;
  terminosCondiciones?: string;

  // Meta
  estado: "borrador" | "enviado" | "aceptado" | "rechazado";
  creadoPor: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface DocumentItem {
  conceptoId?: string; // referencia al catálogo (opcional)
  nombre: string;
  descripcion: string;
  cantidad: number;
  tarifa: number;
  importe: number; // cantidad * tarifa
}
```

### Contadores (patrón existente)

- `counters/cot_documents` → folio COT-XXXX
- `counters/not_documents` → folio NOT-XXXX

### Colecciones existentes que se mantienen

- `quote_clients` — clientes con dirección de facturación
- `quote_concepts` — catálogo de artículos predefinidos

---

## Rutas

| Ruta                            | Descripción                                |
| ------------------------------- | ------------------------------------------ |
| `/dashboard/cotizaciones`       | Lista unificada COT + NOT                  |
| `/dashboard/cotizaciones/nuevo` | Formulario crear (selector tipo al inicio) |
| `/dashboard/cotizaciones/[id]`  | Formulario edición                         |
| `/dashboard/ventas`             | Redirect → `/dashboard/cotizaciones`       |

---

## Componentes

```
src/
  types/
    documents.ts                       # Tipo Document unificado

  lib/services/
    documents-service.ts               # CRUD, foliado, cálculos
    clients-service.ts                 # CRUD clientes (extraído de quotes-service)

  components/admin/documents/
    DocumentList.tsx                   # Tabla estilo Zoho con filtros y búsqueda
    DocumentForm.tsx                   # Formulario completo estilo Zoho
    DocumentItemsTable.tsx             # Tabla artículos con autocomplete del catálogo
    DocumentTotals.tsx                 # Panel subtotal / descuento / IVA / total
    DocumentPDF.tsx                    # Template HTML para generación PDF
    ClientSelector.tsx                 # Dropdown clientes + modal crear cliente rápido

  app/dashboard/cotizaciones/
    page.tsx                           # Lista
    nuevo/page.tsx                     # Crear nuevo
    [id]/
      page.tsx                         # Editar existente (nueva ruta)
```

---

## Flujo del formulario (Zoho-style)

### Cabecera

1. **Selector tipo** — toggle `COTIZACIÓN / NOTA DE VENTA` (define folio prefix y título PDF)
2. **Nombre del cliente\*** — dropdown con `quote_clients`, al seleccionar auto-llena dirección de facturación. Botón inline para crear cliente nuevo.
3. Dirección de facturación (read-only, editable inline)
4. **Número\*** — generado automáticamente (COT-XXXX / NOT-XXXX), editable
5. N.º de referencia — texto libre
6. **Fecha\*** — date picker, default hoy
7. Fecha de vencimiento — date picker (opcional)
8. Vendedor — texto libre
9. Nombre del proyecto — texto libre
10. Asunto — textarea corta

### Tabla de artículos

- Columnas: `#` | `Artículo & Descripción` | `Cant.` | `Tarifa` | `Importe`
- Campo artículo con autocomplete contra `quote_concepts` (busca por nombre)
- Al seleccionar concepto: auto-llena nombre, descripción y tarifa
- Descripción editable inline debajo del nombre
- Cantidad y tarifa editables; importe calculado automáticamente
- Botón "Añadir nueva fila" al fondo

### Panel de totales (derecha inferior)

```
Subtotal                          $X,XXX.00
Descuento         [  0  ] %       -$XXX.00
IVA [8% ▼]                        $XXX.00
─────────────────────────────────────────
Total (MXN)                       $X,XXX.00
```

- Descuento: campo numérico + siempre en %
- IVA: selector 8% / 16% / Exento

### Pie del formulario

- **Notas del cliente** — textarea (default: "Este documento no es un comprobante fiscal...")
- **Términos y condiciones** — textarea (default: "Los precios mostrados no incluyen IVA...")

### Barra de acciones (sticky bottom)

- `Guardar borrador` — guarda sin PDF
- `Guardar y descargar PDF` — guarda y dispara descarga del PDF

---

## Formato PDF (replica NOT-0017)

**Layout página carta:**

```
┌──────────────────────────────────────────────────┐
│ [Logo Zentry]              NOTA DE VENTA / COT   │
│ Zentry Tech Group                  # NOT-0017    │
│ Batequitos 261 Coto Sur                          │
│ Baja California 21383                            │
│ infra@zentrymx.com                               │
├──────────────────────────────────────────────────┤
│ Facturar a:                   Fecha: 29 abr 2026 │
│ [Nombre cliente]                                 │
│ [Empresa]                                        │
│ [Dirección]                                      │
├──────────────────────────────────────────────────┤
│ # │ Artículo & Descripción │ Cant. │ Tarifa │ $  │
│ 1 │ [nombre + descripción] │  X.00 │   X.00 │ X  │
│ 2 │ ...                    │  X.00 │   X.00 │ X  │
├──────────────────────────────────────────────────┤
│                         Subtotal          $X,XXX │
│                         IVA (8%/16%)       $XXX  │
│                         Total      MXN $X,XXX.XX │
├──────────────────────────────────────────────────┤
│ Notas                                            │
│ [notasCliente]                                   │
└──────────────────────────────────────────────────┘
```

- Logo: `/assets/logos/zentry-logo.png` (o SVG inline)
- Generación: `html2canvas` → `jsPDF` (mismo método que funciona actualmente)
- Nombre del archivo: `{folio}.pdf` (ej: `NOT-0017.pdf`)

---

## Lista de documentos (Zoho-style)

Columnas:
| Fecha | Número | N.º Referencia | Nombre del Cliente | Estado | Cantidad |

- Filtro de búsqueda (folio, cliente)
- Filtro por tipo (Todos / COT / NOT)
- Click en número → abre edición
- Botón `+ Nuevo` → `/dashboard/cotizaciones/nuevo`
- Estado badges: Borrador (gris) | Enviado (azul) | Aceptado (verde) | Rechazado (rojo)

---

## Archivos a eliminar

- `src/components/admin/cotizaciones/QuotingTool.tsx`
- `src/components/admin/cotizaciones/QuotePreview.tsx`
- `src/components/admin/ventas/SaleNoteForm.tsx`
- `src/components/admin/ventas/SaleNotePreview.tsx`
- `src/lib/services/quotes-service.ts`
- `src/lib/services/sales-notes-service.ts`
- `src/types/quotes.ts`
- `src/types/sales-notes.ts`
- `app/dashboard/ventas/page.tsx` (reemplazar por redirect)
- `app/dashboard/cotizaciones/nuevo/page.tsx` (reescribir)

---

## Archivos a crear

- `src/types/documents.ts`
- `src/lib/services/documents-service.ts`
- `src/lib/services/clients-service.ts`
- `src/components/admin/documents/DocumentList.tsx`
- `src/components/admin/documents/DocumentForm.tsx`
- `src/components/admin/documents/DocumentItemsTable.tsx`
- `src/components/admin/documents/DocumentTotals.tsx`
- `src/components/admin/documents/DocumentPDF.tsx`
- `src/components/admin/documents/ClientSelector.tsx`
- `app/dashboard/cotizaciones/page.tsx` (reescribir)
- `app/dashboard/cotizaciones/nuevo/page.tsx` (reescribir)
- `app/dashboard/cotizaciones/[id]/page.tsx` (nuevo)
- `app/dashboard/ventas/page.tsx` (redirect)
