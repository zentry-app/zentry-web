import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  getDoc,
  updateDoc,
  addDoc,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export interface HousePaymentStatus {
  houseId: string; // Formato: "calle-houseNumber" ej: "Av. Principal-123"
  calle: string;
  houseNumber: string;
  residencialId: string;
  userId?: string; // Usuario asociado a la casa
  userName?: string;
  userEmail?: string;

  // Estados de pago
  status: "al_dia" | "moroso" | "pendiente";
  ultimoPago?: Timestamp | Date;
  montoUltimoPago?: number;
  conceptoUltimoPago?: string;

  // Información de morosidad
  mesesMoroso?: number;
  montoAdeudado?: number;
  fechaVencimiento?: Timestamp | Date;

  // Metadatos
  fechaActualizacion: Timestamp | Date;
  actualizadoPor: string;
}

export interface PaymentSummary {
  houseId: string;
  calle: string;
  houseNumber: string;
  totalPagos: number;
  totalRecaudado: number;
  ultimoPago?: Date;
  estado: "al_dia" | "moroso" | "pendiente";
  mesesSinPagar?: number;
  montoAdeudado?: number;
}

/**
 * Servicio para manejar el estado de pagos por casa (houseID)
 */
export class HousePaymentStatusService {
  /**
   * Generar houseID único
   */
  static generateHouseId(calle: string, houseNumber: string): string {
    return `${calle.trim()}-${houseNumber.trim()}`
      .toLowerCase()
      .replace(/\s+/g, "_");
  }

  /**
   * Obtener estado de pagos de todas las casas de un residencial
   */
  static async getHousePaymentStatuses(
    residencialId: string,
  ): Promise<HousePaymentStatus[]> {
    try {
      console.log(
        `🏠 Obteniendo estados de pagos por casa para residencial: ${residencialId}`,
      );

      // Obtener todos los pagos del residencial (paymentIntents SoT)
      const pagosRef = collection(
        db,
        "residenciales",
        residencialId,
        "paymentIntents",
      );
      const pagosQuery = query(pagosRef, orderBy("createdAt", "desc"));
      const pagosSnapshot = await getDocs(pagosQuery);

      // Agrupar pagos por casa
      const pagosPorCasa = new Map<string, any[]>();

      pagosSnapshot.forEach((doc) => {
        const data = doc.data();
        const houseId = this.generateHouseId(
          data.userAddress?.calle || "",
          data.userAddress?.houseNumber || "",
        );

        if (!pagosPorCasa.has(houseId)) {
          pagosPorCasa.set(houseId, []);
        }
        pagosPorCasa.get(houseId)!.push({
          id: doc.id,
          ...data,
          houseId,
        });
      });

      // Crear estados de casas
      const estadosCasas: HousePaymentStatus[] = [];
      const ahora = new Date();

      // NUEVO: Obtener configuración y saldos a favor documentados
      let cuotaMensual = 1500;
      try {
        const configDoc = await getDoc(
          doc(db, "residenciales", residencialId, "configuracion", "pagos"),
        );
        if (configDoc.exists())
          cuotaMensual = configDoc.data()?.cuotaMensual || 1500;
      } catch (e) {}

      const balancesSnapshot = await getDocs(
        query(
          collection(db, "residenciales", residencialId, "housePaymentBalance"),
          limit(500),
        ),
      );
      const balances = new Map<string, any>();
      balancesSnapshot.forEach((docSnapshot) =>
        balances.set(docSnapshot.id, docSnapshot.data()),
      );

      for (const [houseId, pagos] of Array.from(pagosPorCasa.entries())) {
        if (pagos.length === 0) continue;

        const primerPago = pagos[0];
        const ultimoPago = (pagos as any[]).find(
          (p: any) => p.status === "validated" || p.status === "completed",
        );

        let status: "al_dia" | "moroso" | "pendiente" = "pendiente";
        let mesesMoroso = 0;
        let montoAdeudado = 0;

        const balance = balances.get(houseId);

        if (balance) {
          montoAdeudado = balance.deudaAcumulada || 0;
          if (montoAdeudado === 0) {
            status = "al_dia";
          } else {
            mesesMoroso = Math.ceil(montoAdeudado / cuotaMensual);
            status = mesesMoroso <= 1 ? "pendiente" : "moroso";
          }
        } else {
          // Fallback heredado
          if (ultimoPago) {
            const fechaUltimoPago =
              ultimoPago.createdAt instanceof Timestamp
                ? ultimoPago.createdAt.toDate()
                : new Date(
                    ultimoPago.createdAt ||
                      ultimoPago.fechaRegistro ||
                      ultimoPago.fechaSubida,
                  );

            const mesesTranscurridos = this.calculateMonthsDifference(
              fechaUltimoPago,
              ahora,
            );

            if (mesesTranscurridos <= 1) {
              status = "al_dia";
            } else if (mesesTranscurridos <= 3) {
              status = "pendiente";
              mesesMoroso = mesesTranscurridos - 1;
              montoAdeudado =
                mesesMoroso * (ultimoPago.montoEsperado || cuotaMensual);
            } else {
              status = "moroso";
              mesesMoroso = mesesTranscurridos - 1;
              montoAdeudado =
                mesesMoroso * (ultimoPago.montoEsperado || cuotaMensual);
            }
          } else {
            status = "moroso";
            mesesMoroso = 1;
            montoAdeudado = cuotaMensual;
          }
        }

        const estado: HousePaymentStatus = {
          houseId,
          calle: primerPago.userAddress?.calle || "",
          houseNumber: primerPago.userAddress?.houseNumber || "",
          residencialId,
          userId: primerPago.userId,
          userName: primerPago.userName,
          userEmail: primerPago.userEmail,
          status,
          ultimoPago: ultimoPago?.createdAt || ultimoPago?.fechaRegistro,
          montoUltimoPago: ultimoPago?.amountCents
            ? ultimoPago.amountCents / 100
            : ultimoPago?.amount,
          conceptoUltimoPago: ultimoPago?.concept || ultimoPago?.concepto,
          mesesMoroso,
          montoAdeudado,
          fechaVencimiento: this.calculateNextDueDate(ultimoPago?.createdAt),
          fechaActualizacion: Timestamp.now(),
          actualizadoPor: "System",
        };

        estadosCasas.push(estado);
      }

      return estadosCasas;
    } catch (error) {
      console.error("❌ Error al obtener estados de pagos:", error);
      throw error;
    }
  }

  /**
   * Listener en tiempo real para estados de casas
   */
  static listenToHousePaymentStatuses(
    residencialId: string,
    callback: (estados: HousePaymentStatus[]) => void,
  ) {
    const pagosRef = collection(
      db,
      "residenciales",
      residencialId,
      "paymentIntents",
    );
    const q = query(pagosRef, orderBy("createdAt", "desc"));

    return onSnapshot(q, async (snapshot) => {
      const pagosPorCasa = new Map<string, any[]>();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const houseId = this.generateHouseId(
          data.userAddress?.calle || "",
          data.userAddress?.houseNumber || "",
        );

        if (!pagosPorCasa.has(houseId)) {
          pagosPorCasa.set(houseId, []);
        }
        pagosPorCasa.get(houseId)!.push({
          id: doc.id,
          ...data,
          houseId,
        });
      });

      const estados: HousePaymentStatus[] = [];
      const ahora = new Date();

      // NUEVO: Obtener configuración y saldos a favor documentados
      let cuotaMensual = 1500;
      try {
        const configDoc = await getDoc(
          doc(db, "residenciales", residencialId, "configuracion", "pagos"),
        );
        if (configDoc.exists())
          cuotaMensual = configDoc.data()?.cuotaMensual || 1500;
      } catch (e) {}

      const balancesSnapshot = await getDocs(
        query(
          collection(db, "residenciales", residencialId, "housePaymentBalance"),
          limit(500),
        ),
      );
      const balances = new Map<string, any>();
      balancesSnapshot.forEach((docSnapshot) =>
        balances.set(docSnapshot.id, docSnapshot.data()),
      );

      pagosPorCasa.forEach((pagos, houseId) => {
        const primerPago = pagos[0];
        const ultimoPago = pagos.find(
          (p: any) => p.status === "validated" || p.status === "completed",
        );

        let status: "al_dia" | "moroso" | "pendiente" = "pendiente";
        let mesesMoroso = 0;
        let montoAdeudado = 0;

        const balance = balances.get(houseId);

        if (balance) {
          montoAdeudado = balance.deudaAcumulada || 0;
          if (montoAdeudado === 0) {
            status = "al_dia";
          } else {
            mesesMoroso = Math.ceil(montoAdeudado / cuotaMensual);
            status = mesesMoroso <= 1 ? "pendiente" : "moroso";
          }
        } else {
          // Fallback heredado
          if (ultimoPago) {
            const fechaUltimoPago =
              ultimoPago.createdAt instanceof Timestamp
                ? ultimoPago.createdAt.toDate()
                : new Date(
                    ultimoPago.createdAt ||
                      ultimoPago.fechaRegistro ||
                      ultimoPago.fechaSubida,
                  );

            const mesesTranscurridos = this.calculateMonthsDifference(
              fechaUltimoPago,
              ahora,
            );

            if (mesesTranscurridos <= 1) {
              status = "al_dia";
            } else if (mesesTranscurridos <= 3) {
              status = "pendiente";
              mesesMoroso = mesesTranscurridos - 1;
              montoAdeudado =
                mesesMoroso * (ultimoPago.montoEsperado || cuotaMensual);
            } else {
              status = "moroso";
              mesesMoroso = mesesTranscurridos - 1;
              montoAdeudado =
                mesesMoroso * (ultimoPago.montoEsperado || cuotaMensual);
            }
          } else {
            status = "moroso";
            mesesMoroso = 1;
            montoAdeudado = cuotaMensual;
          }
        }

        const estado: HousePaymentStatus = {
          houseId,
          calle: primerPago.userAddress?.calle || "",
          houseNumber: primerPago.userAddress?.houseNumber || "",
          residencialId,
          userId: primerPago.userId,
          userName: primerPago.userName,
          userEmail: primerPago.userEmail,
          status,
          ultimoPago: ultimoPago?.createdAt || ultimoPago?.fechaRegistro,
          montoUltimoPago: ultimoPago?.amountCents
            ? ultimoPago.amountCents / 100
            : ultimoPago?.amount,
          conceptoUltimoPago: ultimoPago?.concept || ultimoPago?.concepto,
          mesesMoroso,
          montoAdeudado,
          fechaVencimiento: this.calculateNextDueDate(ultimoPago?.createdAt),
          fechaActualizacion: Timestamp.now(),
          actualizadoPor: "System",
        };

        estados.push(estado);
      });

      console.log(
        `📣 Actualización en tiempo real: ${estados.length} estados de casas`,
      );
      callback(estados);
    });
  }

  /**
   * Calcular diferencia de meses entre dos fechas
   */
  private static calculateMonthsDifference(date1: Date, date2: Date): number {
    const year1 = date1.getFullYear();
    const month1 = date1.getMonth();
    const year2 = date2.getFullYear();
    const month2 = date2.getMonth();

    return (year2 - year1) * 12 + (month2 - month1);
  }

  /**
   * Calcular próxima fecha de vencimiento
   */
  private static calculateNextDueDate(
    ultimoPago?: Timestamp | Date,
  ): Timestamp | Date {
    const ahora = new Date();
    const proximoMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);
    return Timestamp.fromDate(proximoMes);
  }

  /**
   * Obtener estadísticas de morosidad
   */
  static async getMorosidadStats(residencialId: string): Promise<{
    totalCasas: number;
    casasAlDia: number;
    casasPendientes: number;
    casasMorosas: number;
    porcentajeMorosidad: number;
    montoTotalAdeudado: number;
  }> {
    try {
      const estados = await this.getHousePaymentStatuses(residencialId);

      const stats = {
        totalCasas: estados.length,
        casasAlDia: estados.filter((e) => e.status === "al_dia").length,
        casasPendientes: estados.filter((e) => e.status === "pendiente").length,
        casasMorosas: estados.filter((e) => e.status === "moroso").length,
        porcentajeMorosidad: 0,
        montoTotalAdeudado: estados.reduce(
          (sum, e) => sum + (e.montoAdeudado || 0),
          0,
        ),
      };

      stats.porcentajeMorosidad =
        stats.totalCasas > 0
          ? (stats.casasMorosas / stats.totalCasas) * 100
          : 0;

      console.log("📊 Estadísticas de morosidad:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Error al obtener estadísticas de morosidad:", error);
      throw error;
    }
  }

  /**
   * Obtener el balance consolidado de una casa (Saldo a favor y Deuda)
   */
  static async getHouseBalance(
    residencialId: string,
    houseId: string,
  ): Promise<{ saldoAFavor: number; deudaAcumulada: number } | null> {
    try {
      const balanceDoc = await getDoc(
        doc(db, "residenciales", residencialId, "housePaymentBalance", houseId),
      );
      if (balanceDoc.exists()) {
        const data = balanceDoc.data();
        return {
          saldoAFavor: data.saldoAFavor || 0,
          deudaAcumulada: data.deudaAcumulada || 0,
        };
      }
      return { saldoAFavor: 0, deudaAcumulada: 0 };
    } catch (error) {
      console.error("Error al obtener balance de la casa:", error);
      return null;
    }
  }

  /**
   * Actualizar manualmente el balance de una casa (Carga inicial o Ajustes)
   */
  static async updateHouseBalance(
    residencialId: string,
    houseId: string,
    data: { saldoAFavor?: number; deudaAcumulada?: number; razon?: string },
    adminUid: string,
  ): Promise<boolean> {
    try {
      const balanceRef = doc(
        db,
        "residenciales",
        residencialId,
        "housePaymentBalance",
        houseId,
      );

      const balanceSnap = await getDoc(balanceRef);

      if (!balanceSnap.exists()) {
        await updateDoc(balanceRef, {
          ...data,
          houseId,
          actualizadoPor: adminUid,
          fechaActualizacion: Timestamp.now(),
          ultimaRazon: data.razon || "Carga inicial",
        });
      } else {
        await updateDoc(balanceRef, {
          ...data,
          actualizadoPor: adminUid,
          fechaActualizacion: Timestamp.now(),
          ultimaRazon: data.razon || "Ajuste manual administrativo",
        });
      }

      console.log(`✅ Balance de casa ${houseId} actualizado exitosamente`);
      return true;
    } catch (error: any) {
      // Si el documento no existe y updateDoc falló, usamos setDoc o simplemente lo creamos con setDoc(..., {merge: true})
      // Pero mejor usamos addDoc si no conocemos el path exacto o setDoc si ya lo tenemos.
      if (error.code === "not-found") {
        // Firestore dynamic path: we use doc() which already has the ID.
      }

      console.error("Error al actualizar balance de la casa:", error);
      return false;
    }
  }
}
