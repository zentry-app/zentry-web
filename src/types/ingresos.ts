export interface Domicilio {
  calle: string;
  houseNumber: string;
  residencialID: string; // Código del residencial, ej: "3C45M1"
}

export interface Timestamp {
  seconds: number;
  nanoseconds: number;
}

// Información del pase físico
export interface PhysicalPass {
  delivered: boolean;
  deliveredAt: Timestamp | Date | string;
  number: number;
  returned: boolean;
}

// Información del vehículo
export interface VehicleInfo {
  color: string;
  marca: string;
  modelo: string;
  placa: string;
}

// Detalles de la salida
export interface ExitDetails {
  differentPersonName?: string;
  exitInSameVehicle?: boolean;
  exitTimestamp: Timestamp | Date | string;
  exitVehicleInfo?: VehicleInfo;
  guardId: string;
  guardName: string;
  passReturned?: boolean;
  samePersonExit?: boolean;
  suspiciousCargo?: boolean;
}

// Datos de visitante temporal
export interface TemporalVisitData {
  category: "temporal";
  idNumber: string;
  idType: string;
  name: string;
  visitorId: string | null;
}

// Datos de visitante de evento
export interface EventoVisitData {
  category: "evento";
  eventId: string;
  idNumber: string;
  idType: string;
  isEventGuest: boolean;
  name: string;
  visitorId: string;
}

// Tipo base para todos los ingresos
export interface IngresoBase {
  id: string; // ID del documento de Firestore
  category: string;
  codigoAcceso?: string | null;
  domicilio: Domicilio;
  entryMethod: string;
  exitTimestamp?: Timestamp | Date | string | null;
  isFrequentVisitor: boolean;
  manualEntryData?: any | null;
  packageInfo?: any | null;
  passLost?: boolean;
  passReturned?: boolean;
  physicalPass?: PhysicalPass | null;
  registradoPor: string; // UID del usuario que registró
  rejectionInfo?: any | null;
  rejected?: boolean; // Nuevo campo de Flutter
  status: "completed" | "pending" | "cancelled" | "active" | "rejected";
  timestamp: Timestamp | Date | string; // Timestamp de creación/registro
  userId?: string | null; // UID del usuario asociado al ingreso
  visitorId?: string | null; // ID del visitante
  vehicleInfo?: VehicleInfo | null;
  visitData: any; // Datos del visitante
  exitDetails?: ExitDetails | null;
  _residencialDocId?: string; // ID del documento del residencial (para referencia interna)
  _residencialNombre?: string; // Nombre del residencial (para UI)
}

// Tipos completos para cada tipo de ingreso
export interface IngresoTemporal extends IngresoBase {
  category: "temporal";
  visitData: TemporalVisitData;
}

export interface IngresoEvento extends IngresoBase {
  category: "evento";
  visitData: EventoVisitData;
}

// Nuevo tipo para ingresos genéricos (compatibilidad con Flutter)
export interface IngresoGenerico extends IngresoBase {
  category: string;
  visitData: any;
}

// Tipo unión para cualquier tipo de ingreso
export type Ingreso = IngresoTemporal | IngresoEvento | IngresoGenerico;

// Función para inferir el tipo de Ingreso y enriquecer el objeto
export function clasificarIngreso(data: any, id: string): Ingreso {
  const ingresoBase: IngresoBase = {
    id,
    category: data.category || "temporal",
    codigoAcceso: data.codigoAcceso || null,
    domicilio: data.domicilio,
    entryMethod: data.entryMethod || "",
    exitTimestamp: data.exitTimestamp || null,
    isFrequentVisitor: data.isFrequentVisitor || false,
    manualEntryData: data.manualEntryData || null,
    packageInfo: data.packageInfo || null,
    passLost: data.passLost || false,
    passReturned: data.passReturned || false,
    physicalPass: data.physicalPass || null,
    registradoPor: data.registradoPor,
    rejectionInfo: data.rejectionInfo || null,
    rejected: data.rejected || false,
    status: data.status,
    timestamp: data.timestamp,
    userId: data.userId || null,
    visitorId: data.visitorId || null,
    vehicleInfo: data.vehicleInfo || null,
    visitData: data.visitData || {},
    exitDetails: data.exitDetails || null,
  };

  if (data.category === "temporal" && data.visitData) {
    return {
      ...ingresoBase,
      category: "temporal",
      visitData: data.visitData as TemporalVisitData,
    } as IngresoTemporal;
  } else if (data.category === "evento" && data.visitData) {
    return {
      ...ingresoBase,
      category: "evento",
      visitData: data.visitData as EventoVisitData,
    } as IngresoEvento;
  }

  // Fallback para ingreso genérico (compatibilidad con Flutter)
  return {
    ...ingresoBase,
    category: data.category || "visita",
    visitData: data.visitData || {},
  } as IngresoGenerico;
} 