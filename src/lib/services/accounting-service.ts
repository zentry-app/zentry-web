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
  registradoPor: string; // Admin que registró
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

      const accountingRef = collection(db, 'residenciales', residencialId, 'contabilidad');
      let q = query(
        accountingRef,
        where('fecha', '>=', Timestamp.fromDate(fechaInicio)),
        where('fecha', '<=', Timestamp.fromDate(fechaFin)),
        orderBy('fecha', 'desc')
      );

      if (tipo) {
        q = query(
          accountingRef,
          where('fecha', '>=', Timestamp.fromDate(fechaInicio)),
          where('fecha', '<=', Timestamp.fromDate(fechaFin)),
          where('tipo', '==', tipo),
          orderBy('fecha', 'desc')
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

      // Obtener todos los pagos del mes
      const pagosRef = collection(db, 'residenciales', residencialId, 'pagos');
      const pagosQuery = query(
        pagosRef,
        where('fechaSubida', '>=', Timestamp.fromDate(fechaInicio)),
        where('fechaSubida', '<=', Timestamp.fromDate(fechaFin)),
        where('status', 'in', ['validated', 'completed'])
      );

      const pagosSnapshot = await getDocs(pagosQuery);
      const pagos: any[] = [];

      pagosSnapshot.forEach((doc) => {
        pagos.push({ id: doc.id, ...doc.data() });
      });

      // Calcular estadísticas
      const totalIngresos = pagos.reduce((sum, pago) => sum + (pago.amount || 0), 0);
      const ingresosTransferencia = pagos
        .filter(p => p.paymentMethod === 'transferencia' || p.comprobanteUrl)
        .reduce((sum, pago) => sum + (pago.amount || 0), 0);
      const ingresosEfectivo = pagos
        .filter(p => p.paymentMethod === 'cash')
        .reduce((sum, pago) => sum + (pago.amount || 0), 0);
      const ingresosTarjeta = pagos
        .filter(p => p.paymentMethod === 'card')
        .reduce((sum, pago) => sum + (pago.amount || 0), 0);

      // Obtener información de casas
      const casasRef = collection(db, 'residenciales', residencialId, 'housePaymentStatus');
      const casasSnapshot = await getDocs(casasRef);
      const totalCasas = casasSnapshot.size;

      // Calcular casas pagadas y morosas
      const casasPagadas = pagos.filter((pago, index, self) =>
        self.findIndex(p => p.houseId === pago.houseId) === index
      ).length;
      const casasMorosas = totalCasas - casasPagadas;
      const porcentajeCobranza = totalCasas > 0 ? (casasPagadas / totalCasas) * 100 : 0;

      // Crear detalle por casa
      const detallePorCasa = casasSnapshot.docs.map(doc => {
        const casaData = doc.data();
        const pagosCasa = pagos.filter(p => p.houseId === casaData.houseId);
        const montoPagado = pagosCasa.reduce((sum, p) => sum + (p.amount || 0), 0);

        return {
          houseId: casaData.houseId || doc.id,
          calle: casaData.calle || '',
          houseNumber: casaData.houseNumber || '',
          montoEsperado: casaData.montoEsperado || 0,
          montoPagado,
          estado: montoPagado >= (casaData.montoEsperado || 0) ? 'pagado' :
            montoPagado > 0 ? 'parcial' : 'moroso',
          fechaPago: pagosCasa.length > 0 ?
            (pagosCasa[0].fechaSubida instanceof Timestamp ?
              pagosCasa[0].fechaSubida.toDate() :
              new Date(pagosCasa[0].fechaSubida)) : undefined,
        };
      });

      const egresosQuery = query(
        collection(db, 'residenciales', residencialId, 'contabilidad'),
        where('fecha', '>=', Timestamp.fromDate(fechaInicio)),
        where('fecha', '<=', Timestamp.fromDate(fechaFin)),
        where('tipo', '==', 'egreso')
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

    const accountingRef = collection(db, 'residenciales', residencialId, 'contabilidad');
    const q = query(accountingRef, orderBy('fecha', 'desc'));

    return onSnapshot(q, (querySnapshot) => {
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

      // Obtener todos los pagos validados de esta casa
      const pagosRef = collection(db, 'residenciales', residencialId, 'pagos');
      let pagosQuery = query(
        pagosRef,
        where('houseId', '==', houseId),
        where('status', 'in', ['validated', 'completed'])
      );

      if (mes) {
        pagosQuery = query(
          pagosRef,
          where('houseId', '==', houseId),
          where('mes', '==', mes),
          where('status', 'in', ['validated', 'completed'])
        );
      }

      const querySnapshot = await getDocs(pagosQuery);
      const pagosRealizados: any[] = [];
      querySnapshot.forEach(doc => pagosRealizados.push({ id: doc.id, ...doc.data() }));

      const totalPagado = pagosRealizados.reduce((sum, p) => sum + (p.amount || 0), 0);

      // TODO: Obtener cuota configurada del residencial
      const cuotaMes = 1500; // Valor por defecto para desarrollo

      return {
        saldoAnterior: 0, // Por ahora no calculamos arrastre
        cuotaMes,
        pagosRealizados,
        totalPagado,
        saldoActual: cuotaMes - totalPagado
      };
    } catch (error) {
      console.error('❌ Error al obtener estado de cuenta de casa:', error);
      throw error;
    }
  }
}
