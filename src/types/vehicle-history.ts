import { Ingreso } from "./ingresos";

export interface Timestamp {
  seconds: number;
  nanoseconds: number;
}

export interface PersonaVehiculo {
  firstEntry: string;
  idNumber: string;
  idType: string;
  lastEntry: string;
  nombre: string;
  totalEntries: number;
}

export interface VehicleHistoryInfo {
  color: string;
  marca: string;
  modelo: string;
  placa: string;
}

export interface VehicleHistory {
  id: string;
  created: Timestamp | Date | string;
  lastUpdated: Timestamp | Date | string;
  personas: PersonaVehiculo[];
  placa: string;
  vehicleInfo: VehicleHistoryInfo;
  // Campos calculados
  _totalPersonas?: number;
  _totalIngresos?: number;
  _firstGlobalEntry?: string | null;
  _lastGlobalEntry?: string | null;
  // Campos para respuesta on-the-fly
  _isLive?: boolean;
  _rawIngresos?: Ingreso[];
} 