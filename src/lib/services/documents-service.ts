"use client";

import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import type {
  ZentryDocument,
  DocumentFormData,
  DocumentItem,
  DocumentTotalsResult,
  IVAType,
  DocumentTipo,
} from "@/types/documents";

const COL = "documents";
const COUNTERS = "counters";

export class DocumentsService {
  // Función pura — testeable sin Firebase
  static calculateTotals(
    items: DocumentItem[],
    descuentoPct: number,
    ivaType: IVAType,
  ): DocumentTotalsResult {
    const subtotal = items.reduce((acc, i) => acc + i.cantidad * i.tarifa, 0);
    const descuento = subtotal * (descuentoPct / 100);
    const base = subtotal - descuento;
    const ivaRate = ivaType === "exento" ? 0 : ivaType === "8" ? 0.08 : 0.16;
    const iva = base * ivaRate;
    const total = base + iva;
    return { subtotal, descuento, iva, total };
  }

  // Función pura — testeable sin Firebase
  static formatFolio(tipo: DocumentTipo, num: number): string {
    return `${tipo}-${String(num).padStart(4, "0")}`;
  }

  static async getNextFolio(
    tipo: DocumentTipo,
  ): Promise<{ folio: string; folioNumero: number }> {
    const key = tipo === "COT" ? "cot_documents" : "not_documents";
    const counterRef = doc(db, COUNTERS, key);
    const newNum = await runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef);
      const current = snap.exists() ? (snap.data().lastFolioNumber ?? 0) : 0;
      const next = current + 1;
      tx.set(counterRef, { lastFolioNumber: next }, { merge: true });
      return next;
    });
    return {
      folio: DocumentsService.formatFolio(tipo, newNum),
      folioNumero: newNum,
    };
  }

  static async getAllDocuments(): Promise<ZentryDocument[]> {
    const q = query(collection(db, COL), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ZentryDocument);
  }

  static async getDocument(id: string): Promise<ZentryDocument | null> {
    const snap = await getDoc(doc(db, COL, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as ZentryDocument;
  }

  static async createDocument(
    formData: DocumentFormData,
    creadoPor: string,
  ): Promise<string> {
    const { folio, folioNumero } = await DocumentsService.getNextFolio(
      formData.tipo,
    );
    const totals = DocumentsService.calculateTotals(
      formData.items,
      formData.descuentoPct,
      formData.ivaType,
    );
    // Recalcular importe por línea
    const items = formData.items.map((item) => ({
      ...item,
      importe: item.cantidad * item.tarifa,
    }));
    const ref = await addDoc(collection(db, COL), {
      ...formData,
      items,
      folio,
      folioNumero,
      subtotal: totals.subtotal,
      descuento: totals.descuento,
      iva: totals.iva,
      total: totals.total,
      estado: "borrador",
      creadoPor,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  static async updateDocument(
    id: string,
    formData: DocumentFormData,
  ): Promise<void> {
    const totals = DocumentsService.calculateTotals(
      formData.items,
      formData.descuentoPct,
      formData.ivaType,
    );
    // Recalcular importe por línea
    const items = formData.items.map((item) => ({
      ...item,
      importe: item.cantidad * item.tarifa,
    }));
    await updateDoc(doc(db, COL, id), {
      ...formData,
      items,
      subtotal: totals.subtotal,
      descuento: totals.descuento,
      iva: totals.iva,
      total: totals.total,
      updatedAt: serverTimestamp(),
    });
  }

  static async updateEstado(
    id: string,
    estado: ZentryDocument["estado"],
  ): Promise<void> {
    await updateDoc(doc(db, COL, id), { estado, updatedAt: serverTimestamp() });
  }

  static async deleteDocument(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id));
  }
}
