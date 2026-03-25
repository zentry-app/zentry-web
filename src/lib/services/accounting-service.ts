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
  addDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface AccountingRecord {
  id?: string;
  residencialId: string;
  fecha: Timestamp | Date;
  tipo: 'ingreso' | 'egreso';
  categoria: string;
  concepto: string;
  monto: number;
  currency: string;
  metodoPago: 'transferencia' | 'efectivo' | 'tarjeta';
  houseId?: string; // Para pagos de mantenimiento
  userId?: string; // Usuario que realizó el pago
  userName?: string;
  referencia?: string; // Número de movimiento, referencia, etc.
  mesReferencia?: string; // Formato: "2024-01"
  observaciones?: string;
  registradoPor?: string; // Admin que registró
  fechaRegistro: Timestamp | Date;
}

export interface MonthlyReport {
  mes: string; // Formato: "2024-01"
  residencialId: string;
  fechaGeneracion: Timestamp | Date;

  // Ingresos
  totalIngresos: number;
  ingresosTransferencia: number;
  ingresosEfectivo: number;
  ingresosTarjeta: number;

  // Egresos (si se implementan)
  totalEgresos: number;

  // Balance
  balanceMensual: number;

  // Estadísticas de casas
  totalCasas: number;
  casasPagadas: number;
  casasMorosas: number;
  porcentajeCobranza: number;

  // Detalles por casa
  detallePorCasa: {
    houseId: string;
    calle: string;
    houseNumber: string;
    montoEsperado: number;
    montoPagado: number;
    estado: 'pagado' | 'moroso' | 'parcial';
    fechaPago?: Date;
  }[];
}

export interface AccountingSummary {
  periodo: string;
  totalIngresos: number;
  totalEgresos: number;
  balance: number;
  totalCasas: number;
  casasPagadas: number;
  casasMorosas: number;
  porcentajeCobranza: number;
  promedioMensual: number;
  tendencia: 'creciente' | 'decreciente' | 'estable';
}

/**
 * Servicio para manejar la contabilidad del residencial
 */
export class AccountingService {

  /**
   * Registrar un movimiento contable
   */
  static async recordAccountingEntry(
    residencialId: string,
    entry: Omit<AccountingRecord, 'id' | 'fechaRegistro' | 'registradoPor'>
  ): Promise<string> {
    try {
      console.log(`📊 Registrando movimiento contable: ${entry.concepto}`);

      const accountingRef = collection(db, 'residenciales', residencialId, 'contabilidad');

      const newEntry: Omit<AccountingRecord, 'id'> = {
        ...entry,
        fechaRegistro: Timestamp.now(),
        registradoPor: 'admin', // TODO: Obtener UID del admin actual
        currency: entry.currency || 'MXN',
      };

      const docRef = await addDoc(accountingRef, newEntry);

      console.log(`✅ Movimiento contable registrado con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error al registrar movimiento contable:', error);
      throw error;
    }
  }

  /**
   * Obtener movimientos contables de un período
   */
  static async getAccountingRecords(
    residencialId: string,
    fechaInicio: Date,
    fechaFin: Date,
    tipo?: 'ingreso' | 'egreso'
  ): Promise<AccountingRecord[]> {
    try {
      console.log(`📊 Obteniendo movimientos contables para período: ${fechaInicio.toISOString()} - ${fechaFin.toISOString()}`);

      const accountingRef = collection(db, 'residenciales', residencialId, 'financialEvents');
      let q = query(
        accountingRef,
        where('timestamp', '>=', Timestamp.fromDate(fechaInicio)),
        where('timestamp', '<=', Timestamp.fromDate(fechaFin)),
        orderBy('timestamp', 'desc')
      );

      if (tipo) {
        // En v2, filtramos por impacto (DECREASE_DEBT = ingreso, INCREASE_DEBT = egreso/vencimiento)
        const impact = tipo === 'ingreso' ? 'DECREASE_DEBT' : 'INCREASE_DEBT';
        q = query(
          accountingRef,
          where('timestamp', '>=', Timestamp.fromDate(fechaInicio)),
          where('timestamp', '<=', Timestamp.fromDate(fechaFin)),
          where('impact', '==', impact),
          orderBy('timestamp', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const records: AccountingRecord[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const record: AccountingRecord = {
          id: docSnapshot.id,
          residencialId: data.residencialId || '',
          fecha: data.fecha || new Date(),
          tipo: data.tipo || 'ingreso',
          categoria: data.categoria || '',
          concepto: data.concepto || '',
          monto: data.monto || 0,
          currency: data.currency || 'MXN',
          metodoPago: data.metodoPago || 'transferencia',
          houseId: data.houseId || '',
          userId: data.userId || '',
          userName: data.userName || '',
          referencia: data.referencia || '',
          observaciones: data.observaciones || '',
          registradoPor: data.registradoPor || '',
          fechaRegistro: data.fechaRegistro || new Date(),
        };

        records.push(record);
      });

      console.log(`✅ ${records.length} movimientos contables obtenidos`);
      return records;
    } catch (error) {
      console.error('❌ Error al obtener movimientos contables:', error);
      throw error;
    }
  }

  /**
   * Generar reporte mensual
   */
  static async generateMonthlyReport(
    residencialId: string,
    año: number,
    mes: number
  ): Promise<MonthlyReport> {
    try {
      console.log(`📊 Generando reporte mensual para ${año}-${mes.toString().padStart(2, '0')}`);

      const fechaInicio = new Date(año, mes - 1, 1);
      const fechaFin = new Date(año, mes, 0, 23, 59, 59);

      // Obtener todos los eventos financieros validados del mes
      const financialRef = collection(db, 'residenciales', residencialId, 'financialEvents');
      const financialQuery = query(
        financialRef,
        where('timestamp', '>=', Timestamp.fromDate(fechaInicio)),
        where('timestamp', '<=', Timestamp.fromDate(fechaFin))
      );

      const fSnapshot = await getDocs(financialQuery);
      const eventos: any[] = [];

      fSnapshot.forEach((doc) => {
        eventos.push({ id: doc.id, ...doc.data() });
      });

      // Calcular estadísticas basadas en eventos (v2)
      const totalIngresos = eventos
        .filter(ev => ev.impact === 'DECREASE_DEBT')
        .reduce((sum, ev) => sum + (ev.amount || 0), 0);

      const ingresosTransferencia = eventos
        .filter(ev => ev.impact === 'DECREASE_DEBT' && ev.subType === 'transfer_payment')
        .reduce((sum, ev) => sum + (ev.amount || 0), 0);

      const ingresosEfectivo = eventos
        .filter(ev => ev.impact === 'DECREASE_DEBT' && ev.subType === 'cash_payment')
        .reduce((sum, ev) => sum + (ev.amount || 0), 0);
      const ingresosTarjeta = eventos
        .filter(ev => ev.impact === 'DECREASE_DEBT' && ev.subType === 'card_payment')
        .reduce((sum, ev) => sum + (ev.amount || 0), 0);

      // Obtener información de casas
      const casasRef = collection(db, 'residenciales', residencialId, 'housePaymentStatus');
      const casasSnapshot = await getDocs(casasRef);
      const totalCasas = casasSnapshot.size;

      // Calcular casas pagadas y morosas
      const casasPagadas = eventos
        .filter(ev => ev.impact === 'DECREASE_DEBT' && ev.houseId)
        .filter((ev, index, self) =>
          self.findIndex(e => e.houseId === ev.houseId) === index
        ).length;
      const casasMorosas = totalCasas - casasPagadas;
      const porcentajeCobranza = totalCasas > 0 ? (casasPagadas / totalCasas) * 100 : 0;

      // Crear detalle por casa
      const detallePorCasa = casasSnapshot.docs.map(doc => {
        const casaData = doc.data();
        const eventosCasa = eventos.filter(ev => ev.houseId === (casaData.houseId || doc.id));
        const montoPagado = eventosCasa
          .filter(ev => ev.impact === 'DECREASE_DEBT')
          .reduce((sum, ev) => sum + (ev.amount || 0), 0);

        return {
          houseId: casaData.houseId || doc.id,
          calle: casaData.calle || '',
          houseNumber: casaData.houseNumber || '',
          montoEsperado: casaData.montoEsperado || 0,
          montoPagado,
          estado: (montoPagado >= (casaData.montoEsperado || 0) ? 'pagado' :
            montoPagado > 0 ? 'parcial' : 'moroso') as 'pagado' | 'moroso' | 'parcial',
          fechaPago: eventosCasa.length > 0 ?
            (eventosCasa[0].timestamp instanceof Timestamp ?
              eventosCasa[0].timestamp.toDate() :
              new Date(eventosCasa[0].timestamp)) : undefined,
        };
      });

      const egresosQuery = query(
        collection(db, 'residenciales', residencialId, 'financialEvents'),
        where('timestamp', '>=', Timestamp.fromDate(fechaInicio)),
        where('timestamp', '<=', Timestamp.fromDate(fechaFin)),
        where('impact', '==', 'INCREASE_DEBT')
      );

      const egresosSnapshot = await getDocs(egresosQuery);
      const totalEgresos = egresosSnapshot.docs.reduce((sum, doc) => sum + (doc.data().monto || 0), 0);

      const reporte: MonthlyReport = {
        mes: `${año}-${mes.toString().padStart(2, '0')}`,
        residencialId,
        fechaGeneracion: Timestamp.now(),
        totalIngresos,
        ingresosTransferencia,
        ingresosEfectivo,
        ingresosTarjeta,
        totalEgresos,
        balanceMensual: totalIngresos - totalEgresos,
        totalCasas,
        casasPagadas,
        casasMorosas,
        porcentajeCobranza,
        detallePorCasa,
      };

      // Guardar reporte
      const reporteRef = collection(db, 'residenciales', residencialId, 'reportesMensuales');
      await addDoc(reporteRef, reporte);

      console.log(`✅ Reporte mensual generado y guardado`);
      return reporte;
    } catch (error) {
      console.error('❌ Error al generar reporte mensual:', error);
      throw error;
    }
  }

  /**
   * Obtener resumen contable de un período
   */
  static async getAccountingSummary(
    residencialId: string,
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<AccountingSummary> {
    try {
      console.log(`📊 Obteniendo resumen contable para período`);

      const records = await this.getAccountingRecords(residencialId, fechaInicio, fechaFin);

      const totalIngresos = records
        .filter(r => r.tipo === 'ingreso')
        .reduce((sum, r) => sum + r.monto, 0);

      const totalEgresos = records
        .filter(r => r.tipo === 'egreso')
        .reduce((sum, r) => sum + r.monto, 0);

      const balance = totalIngresos - totalEgresos;

      // Calcular estadísticas de casas
      const casasRef = collection(db, 'residenciales', residencialId, 'housePaymentStatus');
      const casasSnapshot = await getDocs(casasRef);
      const totalCasas = casasSnapshot.size;

      const casasPagadas = records
        .filter(r => r.tipo === 'ingreso' && r.houseId)
        .reduce((set, r) => set.add(r.houseId!), new Set()).size;

      const casasMorosas = totalCasas - casasPagadas;
      const porcentajeCobranza = totalCasas > 0 ? (casasPagadas / totalCasas) * 100 : 0;

      // Calcular promedio mensual
      const diasPeriodo = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24));
      const promedioMensual = diasPeriodo > 0 ? (totalIngresos / diasPeriodo) * 30 : 0;

      // Determinar tendencia (simplificado)
      const tendencia: 'creciente' | 'decreciente' | 'estable' = 'estable';

      const summary: AccountingSummary = {
        periodo: `${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}`,
        totalIngresos,
        totalEgresos,
        balance,
        totalCasas,
        casasPagadas,
        casasMorosas,
        porcentajeCobranza,
        promedioMensual,
        tendencia,
      };

      console.log('📊 Resumen contable calculado:', summary);
      return summary;
    } catch (error) {
      console.error('❌ Error al obtener resumen contable:', error);
      throw error;
    }
  }

  /**
   * Obtener reportes mensuales existentes
   */
  static async getMonthlyReports(residencialId: string): Promise<MonthlyReport[]> {
    try {
      console.log(`📊 Obteniendo reportes mensuales para residencial: ${residencialId}`);

      const reportesRef = collection(db, 'residenciales', residencialId, 'reportesMensuales');
      const q = query(reportesRef, orderBy('mes', 'desc'));

      const querySnapshot = await getDocs(q);
      const reportes: MonthlyReport[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const reporte: MonthlyReport = {
          mes: data.mes || '',
          residencialId: data.residencialId || '',
          fechaGeneracion: data.fechaGeneracion || new Date(),
          totalIngresos: data.totalIngresos || 0,
          ingresosTransferencia: data.ingresosTransferencia || 0,
          ingresosEfectivo: data.ingresosEfectivo || 0,
          ingresosTarjeta: data.ingresosTarjeta || 0,
          totalEgresos: data.totalEgresos || 0,
          balanceMensual: data.balanceMensual || 0,
          totalCasas: data.totalCasas || 0,
          casasPagadas: data.casasPagadas || 0,
          casasMorosas: data.casasMorosas || 0,
          porcentajeCobranza: data.porcentajeCobranza || 0,
          detallePorCasa: data.detallePorCasa || [],
        };

        reportes.push(reporte);
      });

      console.log(`✅ ${reportes.length} reportes mensuales obtenidos`);
      return reportes;
    } catch (error) {
      console.error('❌ Error al obtener reportes mensuales:', error);
      throw error;
    }
  }

  /**
   * Exportar datos contables a CSV
   */
  static async exportAccountingData(
    residencialId: string,
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<string> {
    try {
      console.log(`📊 Exportando datos contables a CSV`);

      const records = await this.getAccountingRecords(residencialId, fechaInicio, fechaFin);

      // Crear CSV
      const headers = [
        'Fecha',
        'Tipo',
        'Categoría',
        'Concepto',
        'Monto',
        'Método de Pago',
        'Casa',
        'Usuario',
        'Referencia',
        'Observaciones'
      ];

      const csvRows = [headers.join(',')];

      records.forEach(record => {
        const fecha = record.fecha instanceof Date ?
          record.fecha.toLocaleDateString() :
          record.fecha.toDate().toLocaleDateString();

        const row = [
          fecha,
          record.tipo,
          record.categoria,
          `"${record.concepto}"`,
          record.monto.toString(),
          record.metodoPago,
          record.houseId || '',
          `"${record.userName || ''}"`,
          record.referencia || '',
          `"${record.observaciones || ''}"`
        ];

        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      console.log(`✅ CSV generado con ${records.length} registros`);
      return csvContent;
    } catch (error) {
      console.error('❌ Error al exportar datos contables:', error);
      throw error;
    }
  }

  /**
   * Escuchar cambios en movimientos contables (tiempo real)
   */
  static watchAccountingRecords(
    residencialId: string,
    callback: (records: AccountingRecord[]) => void
  ): () => void {
    console.log(`🔔 Suscribiéndose a movimientos contables para residencial: ${residencialId}`);

    const accountingRef = collection(db, 'residenciales', residencialId, 'financialEvents');
    const q = query(accountingRef, orderBy('timestamp', 'desc'));

    return onSnapshot(q, (querySnapshot) => {
      const records: AccountingRecord[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const record: AccountingRecord = {
          id: docSnapshot.id,
          residencialId: data.residencialId || residencialId,
          fecha: data.timestamp || new Date(),
          tipo: data.impact === 'DECREASE_DEBT' ? 'ingreso' : 'egreso',
          categoria: data.subType || data.type || '',
          concepto: data.description || data.concepto || '',
          monto: data.amount || 0,
          currency: data.currency || 'MXN',
          metodoPago: data.metodoPago || 'transferencia',
          houseId: data.houseId || '',
          userId: data.userId || '',
          userName: data.userName || '',
          referencia: data.referenceId || '',
          observaciones: data.observaciones || '',
          fechaRegistro: data.timestamp || new Date(),
        };

        records.push(record);
      });

      console.log(`📣 Actualización en tiempo real: ${records.length} movimientos contables`);
      callback(records);
    });
  }

  /**
   * Obtener estado de cuenta de una casa específica
   */
  static async getHouseStatement(
    residencialId: string,
    houseId: string,
    mes?: string
  ): Promise<{
    saldoAnterior: number;
    cuotaMes: number;
    pagosRealizados: any[];
    totalPagado: number;
    saldoActual: number;
  }> {
    try {
      console.log(`📊 Generando estado de cuenta para casa ${houseId}`);

      // Obtener todos los pagos validados de esta casa (desde paymentIntents SoT)
      const pagosRef = collection(db, 'residenciales', residencialId, 'paymentIntents');
      let pagosQuery = query(
        pagosRef,
        where('houseId', '==', houseId),
        where('status', '==', 'validated')
      );

      const querySnapshot = await getDocs(pagosQuery);
      const pagosRealizados: any[] = [];
      querySnapshot.forEach(docSnapshot => {
        const data = docSnapshot.data();
        pagosRealizados.push({
          id: docSnapshot.id,
          ...data,
          // Convert cents to amount for UI consistency
          amount: data.amountCents ? data.amountCents / 100 : (data.amount || 0)
        });
      });

      const totalPagado = pagosRealizados.reduce((sum, p) => sum + (p.amount || 0), 0);


      // Obtener saldo real y cuota
      const balanceDoc = await getDoc(doc(db, 'residenciales', residencialId, 'housePaymentBalance', houseId));
      let saldoAnterior = 0;
      let cuotaMes = 1500;
      let deudaAcumulada = 0;
      let saldoAFavor = 0;

      if (balanceDoc.exists()) {
        const data = balanceDoc.data();
        cuotaMes = data?.cuotaMensual || 1500;
        deudaAcumulada = data?.deudaAcumulada || 0;
        saldoAFavor = data?.saldoAFavor || 0;
        saldoAnterior = deudaAcumulada;
      } else {
        try {
          const configDoc = await getDoc(doc(db, 'residenciales', residencialId, 'configuracion', 'pagos'));
          if (configDoc.exists()) {
            cuotaMes = configDoc.data()?.cuotaMensual || 1500;
          }
        } catch (e) { }
      }

      const saldoActual = (saldoAnterior + cuotaMes) - totalPagado - saldoAFavor;

      return {
        saldoAnterior,
        cuotaMes,
        pagosRealizados,
        totalPagado,
        saldoActual
      };
    } catch (error) {
      console.error('❌ Error al obtener estado de cuenta de casa:', error);
      throw error;
    }
  }
}
