// Shared types and helpers for payments dashboard components

export interface KPIData {
  summary: { facturadoCents: number; cobradoNetoCents: number; pendientePeriodoCents: number };
  snapshot: { saldoPendienteTotalCents: number; saldoVencidoTotalCents: number; saldoAFavorTotalCents: number; housesWithDebt: number; housesWithOverdue: number; totalActiveHouses: number };
  validations: { total: number; pendingValidation: number };
}

export interface PendingValidation {
  id: string; houseId: string; houseLabel: string; residentName: string;
  montoCents: number; fecha: string; method: string; proofUrl: string; concepto: string; notas: string;
}

export interface HouseStatus {
  houseId: string; label: string; residentName: string;
  deudaCents: number; saldoAFavorCents: number;
  // Simplified to 2 states: al_dia (no debt) or con_deuda (has debt).
  // Legacy "pendiente"/"moroso" mapped to "con_deuda" at display level.
  status: "al_dia" | "pendiente" | "moroso" | "con_deuda";
  ultimoPago: string | null;
}

// Normalize legacy 3-state to 2-state for display
export const normalizeStatus = (h: HouseStatus): "al_dia" | "con_deuda" =>
  (h.deudaCents || 0) > 0 ? "con_deuda" : "al_dia";

export const fmtFull = (cents: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(Math.abs(cents) / 100);

export const statusDot: Record<string, string> = { al_dia: "bg-emerald-500", con_deuda: "bg-red-500" };
export const statusLabel: Record<string, string> = { al_dia: "Al día", con_deuda: "Con deuda" };
