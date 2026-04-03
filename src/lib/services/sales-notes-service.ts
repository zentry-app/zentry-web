'use client';

import { db } from '@/lib/firebase/config';
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
} from 'firebase/firestore';
import type {
    SaleNote,
    SaleNoteFormData,
    SaleLineItem,
    SaleTotals,
    SaleIVAType,
} from '@/types/sales-notes';

const SALE_NOTES_COLLECTION = 'sale_notes';
const COUNTERS_COLLECTION = 'counters';

export class SaleNotesService {
    // ---------- FOLIADO ----------

    static async getNextFolio(): Promise<{ folio: string; folioNumero: number }> {
        const counterRef = doc(db, COUNTERS_COLLECTION, 'sale_notes');

        const newFolioNumero = await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            let currentNum = 0;
            if (counterDoc.exists()) {
                currentNum = counterDoc.data().lastFolioNumber || 0;
            }
            const nextNum = currentNum + 1;
            transaction.set(counterRef, { lastFolioNumber: nextNum }, { merge: true });
            return nextNum;
        });

        return {
            folio: `#NV-${String(newFolioNumero).padStart(4, '0')}`,
            folioNumero: newFolioNumero,
        };
    }

    // ---------- CÁLCULOS ----------

    static calculateTotals(items: SaleNoteFormData['items'], ivaType: SaleIVAType): SaleTotals {
        const subtotal = items.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0);
        const ivaRate = ivaType === 'exento' ? 0 : ivaType === '8' ? 0.08 : 0.16;
        const iva = subtotal * ivaRate;
        const total = subtotal + iva;
        return { subtotal, iva, total };
    }

    // ---------- CRUD ----------

    static async getAllSaleNotes(): Promise<SaleNote[]> {
        const q = query(
            collection(db, SALE_NOTES_COLLECTION),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SaleNote));
    }

    static async getSaleNoteById(id: string): Promise<SaleNote | null> {
        const ref = doc(db, SALE_NOTES_COLLECTION, id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as SaleNote;
    }

    static async createSaleNote(
        formData: SaleNoteFormData,
        userId: string,
        estado: 'borrador' | 'emitida' = 'borrador'
    ): Promise<string> {
        const { folio, folioNumero } = await this.getNextFolio();
        const totals = this.calculateTotals(formData.items, formData.ivaType);

        // Calculate subtotals per item
        const itemsWithSubtotals = formData.items.map((item) => ({
            ...item,
            subtotal: item.cantidad * item.precioUnitario,
        }));

        const docRef = await addDoc(collection(db, SALE_NOTES_COLLECTION), {
            folio,
            folioNumero,
            fecha: formData.fecha,
            clienteNombre: formData.clienteNombre,
            clienteEmpresa: formData.clienteEmpresa,
            clienteEmail: formData.clienteEmail,
            clienteTelefono: formData.clienteTelefono,
            clienteRFC: formData.clienteRFC,
            concepto: formData.concepto,
            items: itemsWithSubtotals,
            ivaType: formData.ivaType,
            subtotal: totals.subtotal,
            iva: totals.iva,
            total: totals.total,
            metodoPago: formData.metodoPago,
            referenciaPago: formData.referenciaPago,
            notas: formData.notas,
            estado,
            creadoPor: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return docRef.id;
    }

    static async updateSaleNote(id: string, data: Partial<SaleNote>): Promise<void> {
        const ref = doc(db, SALE_NOTES_COLLECTION, id);
        await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
    }

    static async deleteSaleNote(id: string): Promise<void> {
        await deleteDoc(doc(db, SALE_NOTES_COLLECTION, id));
    }
}
