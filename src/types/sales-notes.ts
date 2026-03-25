// =============================================
// Tipos para el Sistema de Notas de Venta
// =============================================

/** Estado de una nota de venta */
export type SaleNoteStatus = 'borrador' | 'emitida' | 'pagada' | 'cancelada';

/** Método de pago */
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque' | 'otro';

/** Tipo de IVA */
export type SaleIVAType = '8' | '16' | 'exento';

/** Categoría de producto/servicio */
export type SaleItemCategory = 'licencia' | 'hardware' | 'servicio' | 'instalacion' | 'otro';

// ---- Línea de Nota de Venta ----
export interface SaleLineItem {
    nombre: string;
    descripcion: string;
    categoria: SaleItemCategory;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}

// ---- Nota de Venta Principal ----
export interface SaleNote {
    id: string;
    folio: string;        // #NV-0001
    folioNumero: number;

    // Fechas
    fecha: string;        // ISO date
    createdAt: any;
    updatedAt: any;

    // Cliente
    clienteNombre: string;
    clienteEmpresa: string;
    clienteEmail: string;
    clienteTelefono: string;
    clienteRFC?: string;

    // Concepto general
    concepto: string;     // Descripción breve de la venta

    // Items
    items: SaleLineItem[];

    // Finanzas
    ivaType: SaleIVAType;
    subtotal: number;
    iva: number;
    total: number;

    // Pago
    metodoPago: PaymentMethod;
    referenciaPago?: string;  // Número de transferencia, etc.

    // Estado
    estado: SaleNoteStatus;
    notas?: string;           // Observaciones internas

    // Creado por
    creadoPor: string;
}

// ---- Datos del Formulario ----
export interface SaleNoteFormData {
    fecha: string;
    clienteNombre: string;
    clienteEmpresa: string;
    clienteEmail: string;
    clienteTelefono: string;
    clienteRFC: string;
    concepto: string;
    items: SaleLineItem[];
    ivaType: SaleIVAType;
    metodoPago: PaymentMethod;
    referenciaPago: string;
    notas: string;
}

// ---- Cálculos ----
export interface SaleTotals {
    subtotal: number;
    iva: number;
    total: number;
}
