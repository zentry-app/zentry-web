"use client";

import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import type { Client } from "@/types/documents";

const COL = "quote_clients"; // reutiliza colección existente

export class ClientsService {
  static async getAllClients(): Promise<Client[]> {
    const q = query(collection(db, COL), orderBy("empresa", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Client);
  }

  static async createClient(
    data: Omit<Client, "id" | "createdAt" | "updatedAt">,
  ): Promise<Client> {
    const ref = await addDoc(collection(db, COL), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, ...data };
  }

  static async updateClient(
    id: string,
    data: Partial<Omit<Client, "id">>,
  ): Promise<void> {
    await updateDoc(doc(db, COL, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }
}
