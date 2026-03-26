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
  deudaCents: number; saldoAFavorCents: number; status: "al_dia" | "pendiente" | "moroso"; ultimoPago: string | null;
}

export const fmtFull = (cents: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(Math.abs(cents) / 100);

export const statusDot: Record<string, string> = { al_dia: "bg-emerald-500", pendiente: "bg-amber-500", moroso: "bg-red-500" };
export const statusLabel: Record<string, string> = { al_dia: "Al día", pendiente: "Debe", moroso: "Moroso" };
