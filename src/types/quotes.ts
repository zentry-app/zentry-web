// =============================================
// Tipos para el Sistema de Cotizaciones Zentry
// =============================================

/** Estado de una cotización */
export type QuoteStatus = 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'vencida';

/** Tipo de cotización */
export type QuoteType = 'mensual' | 'integracion' | 'nuevo' | 'otro';

/** Tipo de IVA */
export type IVAType = '8' | '16';

/** Categoría de concepto */
export type ConceptCategory = 'licencia' | 'hardware' | 'servicio' | 'otro';

/** Tipo de cobro */
export type ChargeType = 'mensual' | 'unico';

// ---- Conceptos Recurrentes ----

export interface QuoteConcept {
    id: string;
    nombre: string;
    descripcion: string;
    categoria: ConceptCategory;
    precioUnitario: number;
    tipoCobro: ChargeType;
    unidad: string; // ej: "casa", "puerta", "dispositivo", "hora"
    activo: boolean;
    createdAt: any; // Firestore Timestamp
    updatedAt: any;
}

// ---- Términos y Condiciones ----

export interface QuoteTerm {
    id: string;
    titulo: string;
    contenido: string; // Texto del término
    categoria: 'incluye' | 'condicion' | 'garantia' | 'nota' | 'clausula';
    activo: boolean;
    orden: number;
    createdAt: any;
    updatedAt: any;
}

// ---- Línea de Cotización ----

export interface QuoteLineItem {
    conceptoId?: string; // Referencia al concepto (opcional si es manual)
    nombre: string;
    descripcion: string;
    categoria: ConceptCategory;
    cantidad: number;
    precioUnitario: number;
    tipoCobro: ChargeType;
    unidad: string;
    subtotal: number; // cantidad * precioUnitario
}

// ---- Cliente de Cotización ----

export interface QuoteClient {
    id: string;
    nombre: string;
    empresa: string;
    email: string;
    telefono: string;
    createdAt?: any;
    updatedAt?: any;
}

// ---- Cotización Principal ----

export interface Quote {
    id: string;
    folio: string; // #0019, #0020, etc.
    folioNumero: number; // 19, 20, etc. (para ordenar)

    // Configuración general
    fecha: string; // ISO string de la fecha
    tipoCotizacion: QuoteType;

    // Información del cliente
    clienteNombre: string;
    clienteEmpresa: string;
    clienteEmail: string;
    clienteTelefono: string;
    clienteProyecto: string;
    clienteUnidades: number;

    // Líneas de la cotización
    items: QuoteLineItem[];

    // Términos seleccionados
    terminosIds: string[];
    terminosPersonalizados: { titulo: string; contenido: string; categoria: string }[];

    // Cálculos
    subtotalMensual: number;
    subtotalUnico: number;
    ivaType: IVAType;
    ivaMensual: number;
    ivaUnico: number;
    totalMensual: number;
    totalUnico: number;

    // Propuesta de valor (texto editable)
    propuestaValor: string;

    // Estado
    estado: QuoteStatus;
    validezDias: number; // Días de validez del presupuesto

    // Metadata
    creadoPor: string; // UID del admin
    createdAt: any;
    updatedAt: any;
}

// ---- Formulario de cotización ----

export interface QuoteFormData {
    fecha: string;
    tipoCotizacion: QuoteType;
    clienteNombre: string;
    clienteEmpresa: string;
    clienteEmail: string;
    clienteTelefono: string;
    clienteProyecto: string;
    clienteUnidades: number;
    items: QuoteLineItem[];
    terminosIds: string[];
    terminosPersonalizados: { titulo: string; contenido: string; categoria: string }[];
    ivaType: IVAType;
    propuestaValor: string;
    validezDias: number;
}

// ---- Defaults ----

export const DEFAULT_PROPUESTA_VALOR =
    'Gracias por considerar a Zentry para su desarrollo. Nuestra plataforma no solo moderniza la gestión administrativa, sino que se convierte en un activo de venta tangible al ofrecer a sus futuros residentes un entorno seguro, conectado y plusvalizado desde el primer día.';

export const DEFAULT_CONCEPTS: Omit<QuoteConcept, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        nombre: 'Licencia Zentry App Residencial',
        descripcion: 'Incluye: Módulo de Seguridad (QR), Administración, Reservas, Finanzas y App para Residentes (iOS/Android).',
        categoria: 'licencia',
        precioUnitario: 13.00,
        tipoCobro: 'mensual',
        unidad: 'casa',
        activo: true,
    },
    {
        nombre: 'Kit Control de Acceso Shelly',
        descripcion: 'Shelly 1 Plus + Chapa Magnética 600 lbs + Fuente 12V/5A + Sensor Reed + Instalación.',
        categoria: 'hardware',
        precioUnitario: 4750.00,
        tipoCobro: 'unico',
        unidad: 'puerta',
        activo: true,
    },
    {
        nombre: 'Shelly 1 Plus (Solo Dispositivo)',
        descripcion: 'Relay inteligente con contacto seco y soporte Wi-Fi.',
        categoria: 'hardware',
        precioUnitario: 550.00,
        tipoCobro: 'unico',
        unidad: 'dispositivo',
        activo: true,
    },
    {
        nombre: 'Chapa Magnética 600 lbs',
        descripcion: 'Cerradura electromagnética de alta seguridad.',
        categoria: 'hardware',
        precioUnitario: 1200.00,
        tipoCobro: 'unico',
        unidad: 'puerta',
        activo: true,
    },
    {
        nombre: 'Instalación y Configuración',
        descripcion: 'Instalación profesional, configuración y pruebas del sistema.',
        categoria: 'servicio',
        precioUnitario: 1500.00,
        tipoCobro: 'unico',
        unidad: 'puerta',
        activo: true,
    },
    {
        nombre: 'Capacitación Personal',
        descripcion: 'Capacitación presencial al equipo de administración y seguridad.',
        categoria: 'servicio',
        precioUnitario: 2500.00,
        tipoCobro: 'unico',
        unidad: 'sesión',
        activo: true,
    },
];

export const DEFAULT_TERMS: Omit<QuoteTerm, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        titulo: 'Cuentas Ilimitadas',
        contenido: 'Cuentas ilimitadas para Admin y Seguridad.',
        categoria: 'incluye',
        activo: true,
        orden: 1,
    },
    {
        titulo: 'Capacitación Inicial',
        contenido: 'Capacitación inicial a personal de caseta.',
        categoria: 'incluye',
        activo: true,
        orden: 2,
    },
    {
        titulo: 'Soporte Técnico',
        contenido: 'Soporte técnico prioritario.',
        categoria: 'incluye',
        activo: true,
        orden: 3,
    },
    {
        titulo: 'Actualizaciones',
        contenido: 'Actualizaciones automáticas y gratuitas.',
        categoria: 'incluye',
        activo: true,
        orden: 4,
    },
    {
        titulo: 'Facturación',
        contenido: 'Facturación mensual recurrente.',
        categoria: 'condicion',
        activo: true,
        orden: 5,
    },
    {
        titulo: 'Precio Garantizado',
        contenido: 'Precio garantizado por 12 meses.',
        categoria: 'condicion',
        activo: true,
        orden: 6,
    },
    {
        titulo: 'Activación',
        contenido: 'Activación inmediata post-firma.',
        categoria: 'condicion',
        activo: true,
        orden: 7,
    },
    {
        titulo: 'Garantía Hardware',
        contenido: 'Garantía de 12 meses en todos los componentes de hardware instalados.',
        categoria: 'garantia',
        activo: true,
        orden: 8,
    },
    {
        titulo: 'Confidencialidad',
        contenido: 'Toda la información contenida en esta propuesta es confidencial y para uso exclusivo del cliente.',
        categoria: 'clausula',
        activo: true,
        orden: 9,
    },
    {
        titulo: 'Propiedad Intelectual',
        contenido: 'Zentry Tech Group conserva todos los derechos de propiedad intelectual sobre el software y metodologías empleadas.',
        categoria: 'clausula',
        activo: true,
        orden: 10,
    },
];
