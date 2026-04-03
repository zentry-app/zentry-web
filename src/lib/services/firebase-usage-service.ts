import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase/config';

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface ServiceUsage {
  total: number;
  series: TimeSeriesPoint[];
}

export interface EstimatedCosts {
  firestoreReads: number;
  firestoreWrites: number;
  firestoreDeletes: number;
  functionsInvocations: number;
  storageTotalGB: number;
  total: number;
}

export interface FunctionUsageItem {
  name: string;
  invocations: number;
  unused: boolean;
}

export interface FreeTierItem {
  label: string;
  used: number;
  limit: number;
  unit: string;
  withinFreeTier: boolean;
}

export interface FreeTierStatus {
  withinFreeTier: boolean;
  items: FreeTierItem[];
}

export interface FirebaseUsageData {
  period: { month: number; year: number };
  firestore: {
    reads: ServiceUsage;
    writes: ServiceUsage;
    deletes: ServiceUsage;
  };
  functions: {
    invocations: ServiceUsage;
    executionTimeMs: ServiceUsage;
    breakdown?: FunctionUsageItem[];
  };
  storage: {
    totalBytes: ServiceUsage;
  };
  estimatedCosts: EstimatedCosts;
  freeTier?: FreeTierStatus;
}

export class FirebaseUsageService {
  static async getUsage(month: number, year: number): Promise<FirebaseUsageData> {
    const functions = getFunctions(app, 'us-central1');
    const callable = httpsCallable<
      { month: number; year: number },
      FirebaseUsageData
    >(functions, 'getFirebaseUsage');

    const result = await callable({ month, year });
    return result.data;
  }
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat('es-MX').format(Math.round(value));
}

export function formatStorage(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${Math.round(bytes)} B`;
}

export function getCostBreakdown(costs: EstimatedCosts) {
  return [
    { label: 'Firestore Lecturas', value: costs.firestoreReads, color: '#3b82f6' },
    { label: 'Firestore Escrituras', value: costs.firestoreWrites, color: '#22c55e' },
    { label: 'Firestore Eliminaciones', value: costs.firestoreDeletes, color: '#ec4899' },
    { label: 'Functions Invocaciones', value: costs.functionsInvocations, color: '#f97316' },
    { label: 'Storage', value: costs.storageTotalGB, color: '#a855f7' },
  ].sort((a, b) => b.value - a.value);
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function getPeriodLabel(month: number, year: number): string {
  return `${MONTH_NAMES[(month - 1) % 12]} ${year}`;
}
