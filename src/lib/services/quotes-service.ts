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
    where,
    limit,
    serverTimestamp,
    runTransaction,
    Timestamp,
} from 'firebase/firestore';
import type {
    Quote,
    QuoteConcept,
    QuoteTerm,
    QuoteFormData,
    QuoteLineItem,
    QuoteClient,
    DEFAULT_CONCEPTS,
    DEFAULT_TERMS,
} from '@/types/quotes';

// Nombres de colecciones
const QUOTES_COLLECTION = 'quotes';
const CONCEPTS_COLLECTION = 'quote_concepts';
const TERMS_COLLECTION = 'quote_terms';
const CLIENTS_COLLECTION = 'quote_clients';
const COUNTERS_COLLECTION = 'counters';

// =============================================
// Servicio de Cotizaciones
// =============================================

export class QuotesService {
    // ---------- FOLIADO ----------

    /**
     * Obtiene el siguiente número de folio usando una transacción atómica
     */
    static async getNextFolio(): Promise<{ folio: string; folioNumero: number }> {
        const counterRef = doc(db, COUNTERS_COLLECTION, 'quotes');

        const newFolioNumero = await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);

            let currentNum = 18; // Empezamos después del folio #0018 existente
            if (counterDoc.exists()) {
                currentNum = counterDoc.data().lastFolioNumber || 18;
            }

            const nextNum = currentNum + 1;
            transaction.set(counterRef, { lastFolioNumber: nextNum }, { merge: true });
            return nextNum;
        });

        return {
            folio: `#${String(newFolioNumero).padStart(4, '0')}`,
            folioNumero: newFolioNumero,
        };
    }

    // ---------- COTIZACIONES CRUD ----------

    /**
     * Crear nueva cotización
     */
    static async createQuote(
        formData: QuoteFormData,
        creadoPor: string
    ): Promise<string> {
        const { folio, folioNumero } = await this.getNextFolio();

        // Calcular totales
        const calculations = this.calculateTotals(formData.items, formData.ivaType);

        const quoteData: Omit<Quote, 'id'> = {
            folio,
            folioNumero,
            fecha: formData.fecha,
            tipoCotizacion: formData.tipoCotizacion,
            clienteNombre: formData.clienteNombre,
            clienteEmpresa: formData.clienteEmpresa,
            clienteEmail: formData.clienteEmail,
            clienteTelefono: formData.clienteTelefono,
            clienteProyecto: formData.clienteProyecto,
            clienteUnidades: formData.clienteUnidades,
            items: formData.items,
            terminosIds: formData.terminosIds,
            terminosPersonalizados: formData.terminosPersonalizados,
            propuestaValor: formData.propuestaValor,
            validezDias: formData.validezDias,
            estado: 'borrador',
            creadoPor,
            ...calculations,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, QUOTES_COLLECTION), quoteData);
        return docRef.id;
    }

    /**
     * Actualizar cotización existente
     */
    static async updateQuote(
        quoteId: string,
        formData: Partial<QuoteFormData> & { estado?: Quote['estado'] }
    ): Promise<void> {
        const updateData: any = {
            ...formData,
            updatedAt: serverTimestamp(),
        };

        // Recalcular si hay items
        if (formData.items && formData.ivaType) {
            const calculations = this.calculateTotals(formData.items, formData.ivaType);
            Object.assign(updateData, calculations);
        }

        await updateDoc(doc(db, QUOTES_COLLECTION, quoteId), updateData);
    }

    /**
     * Obtener todas las cotizaciones ordenadas por folio
     */
    static async getAllQuotes(): Promise<Quote[]> {
        const q = query(
            collection(db, QUOTES_COLLECTION),
            orderBy('folioNumero', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Quote[];
    }

    /**
     * Obtener cotización por ID
     */
    static async getQuoteById(quoteId: string): Promise<Quote | null> {
        const docSnap = await getDoc(doc(db, QUOTES_COLLECTION, quoteId));
        if (!docSnap.exists()) return null;
        return { id: docSnap.id, ...docSnap.data() } as Quote;
    }

    /**
     * Eliminar cotización
     */
    static async deleteQuote(quoteId: string): Promise<void> {
        await deleteDoc(doc(db, QUOTES_COLLECTION, quoteId));
    }

    // ---------- CLIENTES CRUD ----------

    static async getAllClients(): Promise<QuoteClient[]> {
        const q = query(
            collection(db, CLIENTS_COLLECTION),
            orderBy('empresa')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as QuoteClient[];
    }

    static async createClient(data: Omit<QuoteClient, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, CLIENTS_COLLECTION), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    }

    // ---------- CONCEPTOS CRUD ----------

    static async getAllConcepts(): Promise<QuoteConcept[]> {
        const q = query(
            collection(db, CONCEPTS_COLLECTION),
            orderBy('categoria'),
            orderBy('nombre')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as QuoteConcept[];
    }

    static async createConcept(data: Omit<QuoteConcept, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, CONCEPTS_COLLECTION), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    }

    static async updateConcept(id: string, data: Partial<QuoteConcept>): Promise<void> {
        await updateDoc(doc(db, CONCEPTS_COLLECTION, id), {
            ...data,
            updatedAt: serverTimestamp(),
        });
    }

    static async deleteConcept(id: string): Promise<void> {
        await deleteDoc(doc(db, CONCEPTS_COLLECTION, id));
    }

    // ---------- TÉRMINOS CRUD ----------

    static async getAllTerms(): Promise<QuoteTerm[]> {
        const q = query(
            collection(db, TERMS_COLLECTION),
            orderBy('orden')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as QuoteTerm[];
    }

    static async createTerm(data: Omit<QuoteTerm, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const docRef = await addDoc(collection(db, TERMS_COLLECTION), {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        return docRef.id;
    }

    static async updateTerm(id: string, data: Partial<QuoteTerm>): Promise<void> {
        await updateDoc(doc(db, TERMS_COLLECTION, id), {
            ...data,
            updatedAt: serverTimestamp(),
        });
    }

    static async deleteTerm(id: string): Promise<void> {
        await deleteDoc(doc(db, TERMS_COLLECTION, id));
    }

    // ---------- SEED (Inicializar defaults) ----------

    static async seedDefaults(
        defaultConcepts: typeof DEFAULT_CONCEPTS,
        defaultTerms: typeof DEFAULT_TERMS
    ): Promise<void> {
        // Solo seedear si no hay datos
        const existingConcepts = await getDocs(collection(db, CONCEPTS_COLLECTION));
        if (existingConcepts.empty) {
            for (const concept of defaultConcepts) {
                await this.createConcept(concept as any);
            }
        }

        const existingTerms = await getDocs(collection(db, TERMS_COLLECTION));
        if (existingTerms.empty) {
            for (const term of defaultTerms) {
                await this.createTerm(term as any);
            }
        }
    }

    // ---------- CÁLCULOS ----------

    static calculateTotals(items: QuoteLineItem[], ivaType: Quote['ivaType']) {
        const ivaRate = parseFloat(ivaType) / 100;

        const subtotalMensual = items
            .filter((i) => i.tipoCobro === 'mensual')
            .reduce((sum, i) => sum + i.cantidad * i.precioUnitario, 0);

        const subtotalUnico = items
            .filter((i) => i.tipoCobro === 'unico')
            .reduce((sum, i) => sum + i.cantidad * i.precioUnitario, 0);

        const ivaMensual = subtotalMensual * ivaRate;
        const ivaUnico = subtotalUnico * ivaRate;

        return {
            subtotalMensual,
            subtotalUnico,
            ivaType,
            ivaMensual,
            ivaUnico,
            totalMensual: subtotalMensual + ivaMensual,
            totalUnico: subtotalUnico + ivaUnico,
        };
    }
}

export default QuotesService;
