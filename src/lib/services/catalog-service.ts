import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';

export interface ProductoCatalog {
    id: string;
    nombre: string;
    descripcion: string;
    precioSugerido: number;
    tipo: 'unico' | 'recurrente';
    activo: boolean;
    createdAt?: any;
}

export interface MultaCatalog {
    id: string;
    nombre: string;
    descripcion: string;
    monto: number;
    tipo: 'fija' | 'porcentaje';
    activo: boolean;
    createdAt?: any;
}

export class CatalogService {
    // Productos
    static async getProductos(residencialId: string): Promise<ProductoCatalog[]> {
        const q = query(collection(db, `residenciales/${residencialId}/productos`), orderBy('nombre'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductoCatalog));
    }

    static async addProducto(residencialId: string, data: Omit<ProductoCatalog, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, `residenciales/${residencialId}/productos`), {
            ...data,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    }

    static async updateProducto(residencialId: string, id: string, data: Partial<ProductoCatalog>): Promise<void> {
        const docRef = doc(db, `residenciales/${residencialId}/productos/${id}`);
        await updateDoc(docRef, data);
    }

    static async deleteProducto(residencialId: string, id: string): Promise<void> {
        const docRef = doc(db, `residenciales/${residencialId}/productos/${id}`);
        await deleteDoc(docRef);
    }

    // Multas
    static async getMultas(residencialId: string): Promise<MultaCatalog[]> {
        const q = query(collection(db, `residenciales/${residencialId}/multas`), orderBy('nombre'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MultaCatalog));
    }

    static async addMulta(residencialId: string, data: Omit<MultaCatalog, 'id'>): Promise<string> {
        const docRef = await addDoc(collection(db, `residenciales/${residencialId}/multas`), {
            ...data,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    }

    static async updateMulta(residencialId: string, id: string, data: Partial<MultaCatalog>): Promise<void> {
        const docRef = doc(db, `residenciales/${residencialId}/multas/${id}`);
        await updateDoc(docRef, data);
    }

    static async deleteMulta(residencialId: string, id: string): Promise<void> {
        const docRef = doc(db, `residenciales/${residencialId}/multas/${id}`);
        await deleteDoc(docRef);
    }
}
