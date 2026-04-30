"use client";

import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import type { Concept } from "@/types/documents";

const COL = "quote_concepts"; // reutiliza colección existente

export class ConceptsService {
  static async getActiveConcepts(): Promise<Concept[]> {
    const q = query(
      collection(db, COL),
      where("activo", "==", true),
      orderBy("nombre", "asc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        nombre: data.nombre ?? "",
        descripcion: data.descripcion ?? "",
        precioUnitario: data.precioUnitario ?? 0,
        activo: data.activo ?? true,
      } as Concept;
    });
  }
}
