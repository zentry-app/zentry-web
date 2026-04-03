import { Timestamp } from 'firebase/firestore';

export type TicketCategoria = 'tecnico' | 'facturacion' | 'acceso' | 'general' | 'otro';
export type TicketPrioridad = 'baja' | 'media' | 'alta' | 'urgente';
export type TicketEstado = 'abierto' | 'en_proceso' | 'resuelto' | 'cerrado';

export interface SupportTicket {
  ticketId: string;
  userId: string;
  userName: string;
  userEmail: string;
  residencialId: string;
  categoria: TicketCategoria;
  prioridad: TicketPrioridad;
  estado: TicketEstado;
  titulo: string;
  descripcion: string;
  tags: string[];
  archivos: {
    url: string;
    nombre: string;
    tipo: string;
  }[];
  asignadoA?: string;
  fechaCreacion: Timestamp | Date | string;
  fechaActualizacion: Timestamp | Date | string;
  fechaResolucion?: Timestamp | Date | string;
  fechaResolucionPrevista?: Timestamp | Date | string;
  fechaPrimeraRespuesta?: Timestamp | Date | string;
  primeraRespuestaPor?: string;
  actualizadoPor?: string;
  resolucion?: string;
  resueltoPor?: string;
  conversacionId?: string;
  metadata: {
    userRole: string;
    userDomicilio?: string;
    appVersion?: string;
  };
}

export interface SupportConversation {
  conversationId: string;
  userId: string;
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Timestamp | Date | string;
  }[];
  ticketId?: string;
  fechaCreacion: Timestamp | Date | string;
  fechaUltimaActualizacion: Timestamp | Date | string;
}

export type AssistantType = 'ventas' | 'residente' | 'admin' | 'guardia';

export const ASSISTANT_TYPES: { value: AssistantType; label: string }[] = [
  { value: 'ventas', label: 'Ventas' },
  { value: 'residente', label: 'Residente' },
  { value: 'admin', label: 'Administración' },
  { value: 'guardia', label: 'Guardia' },
];

export interface KnowledgeBaseItem {
  knowledgeId: string;
  pregunta: string;
  variantesPregunta?: string[];
  respuesta: string;
  categoria: string;
  tags: string[];
  roles: AssistantType[];
  canales?: string[];
  prioridadContexto?: number;
  vecesUtilizada: number;
  efectividad: number;
  creadoPor: string;
  fechaCreacion: Timestamp | Date | string;
  fechaActualizacion: Timestamp | Date | string;
  activo: boolean;
  embedding?: number[];
}

export interface TicketRespuestaArchivo {
  url: string;
  nombre: string;
  tipo: string;
}

export interface TicketRespuesta {
  respuestaId: string;
  texto: string;
  enviadoPor: 'admin' | 'user';
  uid: string;
  nombre: string;
  fecha: Timestamp | Date | string;
  archivos?: TicketRespuestaArchivo[];
}

export interface TicketFilters {
  estado?: TicketEstado[];
  categoria?: TicketCategoria[];
  prioridad?: TicketPrioridad[];
  fechaDesde?: Date;
  fechaHasta?: Date;
  asignadoA?: string;
  searchQuery?: string;
  soloVencidos?: boolean;
}

export interface TicketStats {
  total: number;
  abiertos: number;
  enProceso: number;
  resueltos: number;
  cerrados: number;
  vencidos: number;
  tiempoPromedioResolucion: number; // en horas
  tiempoPromedioPrimeraRespuesta: number; // en horas
  ticketsPorCategoria: Record<TicketCategoria, number>;
  ticketsPorPrioridad: Record<TicketPrioridad, number>;
}

export interface KnowledgeBaseStats {
  total: number;
  activos: number;
  inactivos: number;
  masUtilizadas: KnowledgeBaseItem[];
  mejorEfectividad: KnowledgeBaseItem[];
}
