// Mirror of functions/src/erp/bulkImport/BulkImportTypes.ts (frontend-friendly: no firebase-admin imports)

export type BulkImportBatchStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "applied"
  | "apply_failed"
  | "reverted";

export type BulkImportMode = "pre_create_fees" | "on_the_fly";

export type BulkImportRowStatus = "valid" | "invalid" | "duplicate";

export interface BulkImportRowError {
  field: string;
  code: string;
  message: string;
}

export interface BulkImportRawRow {
  houseLabel: string;
  clientFolio: string | null;
  amountRaw: string;
  paymentDateStr: string;
  appliesToMonthsRaw: string;
  paymentMethod: string;
  notes: string | null;
}

export interface BulkImportParsedRow {
  propiedadId: string | null;
  matchConfidence: "exact" | "fuzzy" | "none";
  clientFolio: string | null;
  amountCents: number | null;
  paymentDateStr: string | null;
  months: string[];
  paymentMethod: "cash" | "transfer";
  notes: string | null;
}

export interface BulkImportRow {
  rowIndex: number;
  status: BulkImportRowStatus;
  errors: BulkImportRowError[];
  raw: BulkImportRawRow;
  parsed: BulkImportParsedRow;
  migrationFolio: string | null;
  resultingIntentId?: string;
  resultingLedgerEntryId?: string;
  applyError?: string;
}

export interface BulkImportBatchStats {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRowsInBatch: number;
  duplicateRowsExisting: number;
  totalAmountCents: number;
  distinctHouses: number;
  distinctMonths: string[];
  appliedCount?: number;
  failedCount?: number;
  revertedCount?: number;
}

export interface BulkImportBatch {
  batchId: string;
  residencialId: string;
  residencialDocId: string;
  status: BulkImportBatchStatus;
  mode: BulkImportMode;
  sourceFilename: string;
  uploadedBy: string;
  uploadedByEmail: string;
  uploadedAt: any; // Firestore Timestamp serialized
  reviewedBy: string | null;
  reviewedByEmail: string | null;
  reviewedAt: any;
  reviewNote: string | null;
  appliedBy: string | null;
  appliedAt: any;
  appliedIntentIds: string[];
  applyCursor: number;
  revertedBy: string | null;
  revertedAt: any;
  revertReason: string | null;
  revertCursor: number;
  stats: BulkImportBatchStats;
  itemsStorageMode: "inline" | "subcollection";
  items?: BulkImportRow[];
  defaultFeeAmountCents: number | null;
  feeTypeLabel: string;
  preCreateFeesDone?: boolean;
}
