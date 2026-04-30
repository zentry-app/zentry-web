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
