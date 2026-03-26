import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface Product {
    id: string;
    name: string;
    description: string;
    priceCents: number;
    category: 'access' | 'amenity' | 'service' | 'monthly';
    active: boolean;
    createdAt?: any;
}

export interface PenaltyRule {
    id: string;
    name: string;
    description: string;
    amountCents: number;
    type: 'fixed' | 'percentage';
    active: boolean;
    createdAt?: any;
}

export type SupplierCategory = 'maintenance' | 'utilities' | 'security' | 'cleaning' | 'construction' | 'technology' | 'other';

export interface Supplier {
    id: string;
    name: string;
    category: SupplierCategory;
    contactName?: string;
    phone?: string;
    email?: string;
    rfc?: string;
    bankAccount?: string;
    notes?: string;
    active: boolean;
    createdAt?: any;
}

export const SUPPLIER_CATEGORY_LABELS: Record<SupplierCategory, string> = {
    maintenance: 'Mantenimiento',
    utilities: 'Servicios',
    security: 'Seguridad',
    cleaning: 'Limpieza',
    construction: 'Construcción',
    technology: 'Tecnología',
    other: 'Otro',
};

export class CatalogService {
    // Products
    static async getProducts(residencialId: string): Promise<Product[]> {
        const q = query(collection(db, `residenciales/${residencialId}/productos`), orderBy('name'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    }

    static async addProduct(residencialId: string, data: Omit<Product, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, `residenciales/${residencialId}/productos`), {
            ...data,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    }

    static async updateProduct(residencialId: string, id: string, data: Partial<Product>): Promise<void> {
        const docRef = doc(db, `residenciales/${residencialId}/productos/${id}`);
        await updateDoc(docRef, data);
    }

    static async deleteProduct(residencialId: string, id: string): Promise<void> {
        const docRef = doc(db, `residenciales/${residencialId}/productos/${id}`);
        await deleteDoc(docRef);
    }

    // Penalty Rules
    static async getPenaltyRules(residencialId: string): Promise<PenaltyRule[]> {
        const q = query(collection(db, `residenciales/${residencialId}/penaltyRules`), orderBy('name'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PenaltyRule));
    }

    static async addPenaltyRule(residencialId: string, data: Omit<PenaltyRule, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, `residenciales/${residencialId}/penaltyRules`), {
            ...data,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    }

    static async updatePenaltyRule(residencialId: string, id: string, data: Partial<PenaltyRule>): Promise<void> {
        const docRef = doc(db, `residenciales/${residencialId}/penaltyRules/${id}`);
        await updateDoc(docRef, data);
    }

    static async deletePenaltyRule(residencialId: string, id: string): Promise<void> {
        const docRef = doc(db, `residenciales/${residencialId}/penaltyRules/${id}`);
        await deleteDoc(docRef);
    }

    // Suppliers
    static async getSuppliers(residencialId: string): Promise<Supplier[]> {
        const q = query(collection(db, `residenciales/${residencialId}/suppliers`), orderBy('name'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
    }

    static async addSupplier(residencialId: string, data: Omit<Supplier, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, `residenciales/${residencialId}/suppliers`), {
            ...data,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    }

    static async updateSupplier(residencialId: string, id: string, data: Partial<Supplier>): Promise<void> {
        const docRef = doc(db, `residenciales/${residencialId}/suppliers/${id}`);
        await updateDoc(docRef, data);
    }

    static async deleteSupplier(residencialId: string, id: string): Promise<void> {
        const docRef = doc(db, `residenciales/${residencialId}/suppliers/${id}`);
        await deleteDoc(docRef);
    }
}
