import { functions } from "@/lib/firebase/config";
import { httpsCallable } from "firebase/functions";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";

export interface PropiedadWeb {
  propiedadId: string;
  residencialDocId: string;
  calle: string;
  numero: string;
  interior?: string;
  tipo: "casa" | "departamento" | "local" | "lote";
  estadoOcupacion: "ocupada" | "desocupada" | "exenta";
  participaEnBilling: boolean;
  cuotaOverrideCents?: number;
  usuariosVinculados: string[];
  propietarioUid?: string;
  isMorosa?: boolean;
  tieneInquilinos?: boolean;
  creadoPor: string;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface PropiedadesStats {
  total: number;
  ocupadas: number;
  desocupadas: number;
  exentas: number;
  enBilling: number;
  morosas: number;
}

export class PropiedadesService {
  static async getAll(residencialDocId: string): Promise<PropiedadWeb[]> {
    const fn = httpsCallable<
      { residencialDocId: string },
      { propiedades: PropiedadWeb[] }
    >(functions, "apiGetPropiedades");
    const result = await fn({ residencialDocId });
    return result.data.propiedades;
  }

  static async create(params: {
    residencialDocId: string;
    calle: string;
    numero: string;
    interior?: string;
    tipo: PropiedadWeb["tipo"];
    estadoOcupacion: PropiedadWeb["estadoOcupacion"];
  }): Promise<{ propiedadId: string }> {
    const fn = httpsCallable<typeof params, { propiedadId: string }>(
      functions,
      "apiCreatePropiedad",
    );
    const result = await fn(params);
    return result.data;
  }

  static async createBatch(params: {
    residencialDocId: string;
    calle: string;
    desde: number;
    hasta: number;
    tipo: PropiedadWeb["tipo"];
    estadoOcupacion: PropiedadWeb["estadoOcupacion"];
  }): Promise<{ creadas: number; omitidas: number }> {
    const fn = httpsCallable<
      typeof params,
      { creadas: number; omitidas: number }
    >(functions, "apiCreatePropiedadesBatch");
    const result = await fn(params);
    return result.data;
  }

  static async update(params: {
    propiedadId: string;
    residencialDocId: string;
    estadoOcupacion?: PropiedadWeb["estadoOcupacion"];
    participaEnBilling?: boolean;
    cuotaOverrideCents?: number;
    tipo?: PropiedadWeb["tipo"];
    interior?: string;
    isMorosa?: boolean;
  }): Promise<void> {
    const { propiedadId, residencialDocId, ...updates } = params;
    const fn = httpsCallable<
      {
        residencialDocId: string;
        propiedadId: string;
        updates: Record<string, unknown>;
      },
      void
    >(functions, "apiUpdatePropiedad");
    await fn({ residencialDocId, propiedadId, updates });
  }

  static async migrate(
    residencialDocId: string,
  ): Promise<{ migradas: number }> {
    const fn = httpsCallable<
      { residencialDocId: string },
      { migradas: number }
    >(functions, "apiMigratePropiedades");
    const result = await fn({ residencialDocId });
    return result.data;
  }

  static async getUserDetails(
    uids: string[],
  ): Promise<
    Array<{ uid: string; fullName: string; email: string; isOwner: boolean }>
  > {
    if (!uids || uids.length === 0) return [];
    const results = await Promise.all(
      uids.map(async (uid) => {
        try {
          const snap = await getDoc(doc(db, "usuarios", uid));
          if (snap.exists()) {
            const d = snap.data();
            return {
              uid,
              fullName:
                [d.fullName || d.nombre, d.paternalLastName, d.maternalLastName]
                  .filter(Boolean)
                  .join(" ") || uid,
              email: d.email || "",
              isOwner: d.isOwner === true,
            };
          }
          // fallback: try 'users' collection
          const snap2 = await getDoc(doc(db, "users", uid));
          if (snap2.exists()) {
            const d = snap2.data();
            return {
              uid,
              fullName:
                [d.fullName || d.nombre, d.paternalLastName, d.maternalLastName]
                  .filter(Boolean)
                  .join(" ") || uid,
              email: d.email || "",
              isOwner: d.isOwner === true,
            };
          }
          return { uid, fullName: uid, email: "", isOwner: false };
        } catch {
          return { uid, fullName: uid, email: "", isOwner: false };
        }
      }),
    );
    return results;
  }

  static computeStats(propiedades: PropiedadWeb[]): PropiedadesStats {
    const total = propiedades.length;
    const ocupadas = propiedades.filter(
      (p) => p.estadoOcupacion === "ocupada",
    ).length;
    const desocupadas = propiedades.filter(
      (p) => p.estadoOcupacion === "desocupada",
    ).length;
    const exentas = propiedades.filter(
      (p) => p.estadoOcupacion === "exenta",
    ).length;
    const enBilling = propiedades.filter((p) => p.participaEnBilling).length;
    const morosas = propiedades.filter((p) => p.isMorosa).length;
    return { total, ocupadas, desocupadas, exentas, enBilling, morosas };
  }
}
