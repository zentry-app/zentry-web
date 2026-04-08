// Client wrapper for the 6 bulk payment import callables.
// Mirrors the backend BulkImportService surface and is consumed by the
// admin upload UI + super-admin review/apply/revert UIs.
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import type {
  BulkImportBatch,
  BulkImportBatchStats,
  BulkImportBatchStatus,
  BulkImportMode,
  BulkImportRawRow,
} from "@/components/financial/bulk-import/types";

export interface CreateBatchPayload {
  residencialId: string;
  sourceFilename: string;
  mode: BulkImportMode;
  defaultFeeAmountCents?: number;
  feeTypeLabel?: string;
  rows: BulkImportRawRow[];
}

export interface CreateBatchResponse {
  success: boolean;
  batchId: string;
  status: BulkImportBatchStatus;
  stats: BulkImportBatchStats;
  itemsStorageMode: "inline" | "subcollection";
}

export interface ApplyProgressResponse {
  success: boolean;
  done: boolean;
  processed: number;
  remaining: number;
  failed: number;
}

export const BulkPaymentImportService = {
  async createBatch(payload: CreateBatchPayload): Promise<CreateBatchResponse> {
    const fn = httpsCallable<CreateBatchPayload, CreateBatchResponse>(
      functions,
      "apiCreateBulkPaymentImportBatch",
    );
    const res = await fn(payload);
    return res.data;
  },

  async reviewBatch(
    residencialId: string,
    batchId: string,
    decision: "approve" | "reject",
    note?: string,
  ): Promise<{ success: boolean }> {
    const fn = httpsCallable<
      {
        residencialId: string;
        batchId: string;
        decision: "approve" | "reject";
        note?: string;
      },
      { success: boolean }
    >(functions, "apiReviewBulkPaymentImportBatch");
    const res = await fn({ residencialId, batchId, decision, note });
    return res.data;
  },

  async applyChunk(
    residencialId: string,
    batchId: string,
    chunkSize = 50,
  ): Promise<ApplyProgressResponse> {
    const fn = httpsCallable<
      { residencialId: string; batchId: string; chunkSize: number },
      ApplyProgressResponse
    >(functions, "apiApplyBulkPaymentImportBatch");
    const res = await fn({ residencialId, batchId, chunkSize });
    return res.data;
  },

  async revertChunk(
    residencialId: string,
    batchId: string,
    reason: string,
    chunkSize = 50,
  ): Promise<ApplyProgressResponse> {
    const fn = httpsCallable<
      {
        residencialId: string;
        batchId: string;
        reason: string;
        chunkSize: number;
      },
      ApplyProgressResponse
    >(functions, "apiRevertBulkPaymentImportBatch");
    const res = await fn({ residencialId, batchId, reason, chunkSize });
    return res.data;
  },

  async getBatch(
    residencialId: string,
    batchId: string,
    withItems = true,
  ): Promise<{ success: boolean; batch: BulkImportBatch }> {
    const fn = httpsCallable<
      { residencialId: string; batchId: string; withItems: boolean },
      { success: boolean; batch: BulkImportBatch }
    >(functions, "apiGetBulkPaymentImportBatch");
    const res = await fn({ residencialId, batchId, withItems });
    return res.data;
  },

  async listBatches(
    residencialId: string,
    filters: { status?: BulkImportBatchStatus; limit?: number } = {},
  ): Promise<{ success: boolean; batches: BulkImportBatch[] }> {
    const fn = httpsCallable<
      { residencialId: string; status?: BulkImportBatchStatus; limit?: number },
      { success: boolean; batches: BulkImportBatch[] }
    >(functions, "apiListBulkPaymentImportBatches");
    const res = await fn({ residencialId, ...filters });
    return res.data;
  },
};
