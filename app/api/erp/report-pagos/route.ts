import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import ExcelJS from "exceljs";

// ── Colores corporativos ────────────────────────────────────────────────────
const C = {
  azulOscuro: "1E3A5F",
  azulMedio: "2E6DA4",
  azulClaro: "D6E4F0",
  verde: "1A7F4B",
  verdeClaro: "D4EFDF",
  rojo: "C0392B",
  rojoClaro: "FADBD8",
  grisHeader: "F2F3F4",
  grisFila: "FAFAFA",
  blanco: "FFFFFF",
  negro: "1A1A1A",
  amarillo: "F39C12",
  amarilloClaro: "FDEBD0",
};

type ARGB = `FF${string}`;
const argb = (hex: string): ARGB => `FF${hex.toUpperCase()}` as ARGB;

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmtMXN(cents: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function mesLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
}

function mesCorto(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", {
    month: "short",
    year: "numeric",
  });
}

function styleHeader(row: ExcelJS.Row, bgHex = C.azulOscuro, fgHex = C.blanco) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: argb(fgHex) }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: argb(bgHex) },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: argb(C.azulMedio) } },
    };
  });
}

function styleDataRow(row: ExcelJS.Row, even: boolean) {
  const bg = even ? C.grisHeader : C.blanco;
  row.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: argb(bg) },
    };
    cell.alignment = { vertical: "middle", wrapText: false };
    cell.font = { size: 10, color: { argb: argb(C.negro) } };
  });
}

function styleTotalsRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: argb(C.blanco) } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: argb(C.azulMedio) },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
}

function kpiBlock(
  ws: ExcelJS.Worksheet,
  startRow: number,
  label: string,
  value: string,
  bgHex: string,
  fgHex = C.blanco,
) {
  const labelRow = ws.getRow(startRow);
  const valueRow = ws.getRow(startRow + 1);

  const lCell = labelRow.getCell(2);
  lCell.value = label;
  lCell.font = { bold: true, size: 10, color: { argb: argb(fgHex) } };
  lCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: argb(bgHex) },
  };
  lCell.alignment = { horizontal: "center", vertical: "middle" };

  const vCell = valueRow.getCell(2);
  vCell.value = value;
  vCell.font = { bold: true, size: 16, color: { argb: argb(fgHex) } };
  vCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: argb(bgHex) },
  };
  vCell.alignment = { horizontal: "center", vertical: "middle" };

  ws.mergeCells(startRow, 2, startRow, 5);
  ws.mergeCells(startRow + 1, 2, startRow + 1, 5);
  labelRow.height = 20;
  valueRow.height = 32;
}

// ── Auth helper ─────────────────────────────────────────────────────────────
async function verifyAdminToken(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || !adminAuth) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

// ── Main query ───────────────────────────────────────────────────────────────
async function fetchReportData(residencialId: string, reportMonth: string) {
  const db = adminDb!;

  // Resolve docId si es ID legado
  let docId = residencialId;
  const byLegacy = await db
    .collection("residenciales")
    .where("residencialID", "==", residencialId)
    .limit(1)
    .get();
  if (!byLegacy.empty) docId = byLegacy.docs[0].id;

  const [y, mo] = reportMonth.split("-").map(Number);
  const nextMonth =
    mo === 12 ? `${y + 1}-01-01` : `${y}-${String(mo + 1).padStart(2, "0")}-01`;
  const startDateStr = `${reportMonth}-01`;

  const [balancesSnap, resSnap, intentsSnap, usersSnap] = await Promise.all([
    db.collection(`residenciales/${docId}/housePaymentBalance`).get(),
    db.collection("residenciales").doc(docId).get(),
    db
      .collection(`residenciales/${docId}/paymentIntents`)
      .where("dateStr", ">=", startDateStr)
      .where("dateStr", "<", nextMonth)
      .get(),
    db
      .collection("usuarios")
      .where(
        "residencialID",
        "==",
        resSnap?.data?.()?.residencialID ?? residencialId,
      )
      .where("role", "==", "resident")
      .get(),
  ]);

  const residencialName: string =
    resSnap.data()?.nombre || resSnap.data()?.name || "Residencial";
  const cuotaBase: number = resSnap.data()?.cuotaMensual || 115000;

  // Nombre por houseId
  const nameMap: Record<string, string> = {};
  usersSnap.forEach((doc) => {
    const u = doc.data();
    const hid = u.houseID || u.houseId;
    if (hid && u.fullName) nameMap[hid] = u.fullName;
  });

  // Pagos del mes
  const paidMap: Record<string, number> = {};
  const fechaMap: Record<string, string> = {};
  const mesesMap: Record<string, Set<string>> = {};

  intentsSnap.forEach((doc) => {
    const d = doc.data();
    if (d.status === "reversed" || d.status === "rejected") return;
    const hid: string = d.houseId;
    if (!hid) return;
    paidMap[hid] = (paidMap[hid] || 0) + (d.amountCents || 0);
    if (d.dateStr) {
      const prev = fechaMap[hid];
      if (!prev || d.dateStr > prev) fechaMap[hid] = d.dateStr;
    }
    if (!mesesMap[hid]) mesesMap[hid] = new Set();
    (d.months || []).forEach((m: string) => mesesMap[hid].add(m));
  });

  // Construir casas
  const houses = balancesSnap.docs.map((doc) => {
    const d = doc.data();
    const hid = doc.id;
    const pagado = paidMap[hid] || 0;
    const meses = mesesMap[hid] ? Array.from(mesesMap[hid]).sort() : [];
    const cubreMes = meses.includes(reportMonth);
    const deuda = d.deudaAcumulada || 0;
    const calle = hid.split("-")[1] || "";

    return {
      houseId: hid,
      label: d.houseLabel || hid,
      calle,
      residentName:
        d.residentName || d.ownerName || nameMap[hid] || "Sin residente",
      deudaCents: deuda,
      saldoAFavorCents: d.saldoAFavor || 0,
      pagadoCents: pagado,
      fechaPago: fechaMap[hid] || null,
      mesesCubiertos: meses,
      cubreMesActual: cubreMes,
      ultimoPago: d.ultimoPago?.toDate?.()?.toLocaleDateString("es-MX") || null,
      status: deuda > 0 ? "con_deuda" : "al_dia",
    };
  });

  // Métricas
  const totalCasas = houses.length;
  const totalRecaudado = Object.values(paidMap).reduce((s, v) => s + v, 0);
  const casasQuePagaron = houses.filter((h) => h.pagadoCents > 0).length;
  const casasNoPagaron = totalCasas - casasQuePagaron;
  const totalDeuda = houses.reduce(
    (s, h) => s + (h.deudaCents > 0 ? h.deudaCents : 0),
    0,
  );
  const facturado = totalCasas * cuotaBase;

  // Cuánto del recaudado cubre el mes actual vs otros meses
  let paraMesActualCents = 0;
  let paraOtrosMesesCents = 0;
  intentsSnap.forEach((doc) => {
    const d = doc.data();
    if (d.status === "reversed" || d.status === "rejected") return;
    const months: string[] = d.months || [];
    if (months.includes(reportMonth)) {
      const perMonth = Math.round((d.amountCents || 0) / (months.length || 1));
      paraMesActualCents += perMonth;
      paraOtrosMesesCents +=
        (d.amountCents || 0) -
        perMonth * months.length +
        perMonth * (months.length - 1);
    } else {
      paraOtrosMesesCents += d.amountCents || 0;
    }
  });

  // Recaudado por calle (para gráfica de barras)
  const porCalle: Record<string, number> = {};
  houses.forEach((h) => {
    if (h.pagadoCents > 0) {
      porCalle[h.calle] = (porCalle[h.calle] || 0) + h.pagadoCents;
    }
  });

  return {
    residencialName,
    reportMonth,
    totalCasas,
    facturadoCents: facturado,
    totalRecaudadoCents: totalRecaudado,
    paraMesActualCents,
    paraOtrosMesesCents,
    totalDeudaCents: totalDeuda,
    casasQuePagaron,
    casasNoPagaron,
    pctCobranza:
      totalCasas > 0 ? Math.round((casasQuePagaron / totalCasas) * 100) : 0,
    houses,
    porCalle,
  };
}

// ── Excel builder ────────────────────────────────────────────────────────────
async function buildExcel(data: Awaited<ReturnType<typeof fetchReportData>>) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Zentry";
  wb.created = new Date();

  const mesNombre = mesLabel(data.reportMonth).toUpperCase();

  // ════════════════════════════════════════════════════════════════
  // HOJA 1: RESUMEN
  // ════════════════════════════════════════════════════════════════
  const wsRes = wb.addWorksheet("Resumen", {
    tabColor: { argb: argb(C.azulOscuro) },
  });
  wsRes.columns = [
    { width: 3 },
    { width: 22 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 3 },
  ];

  // Título principal
  wsRes.mergeCells("B2:F2");
  const titleCell = wsRes.getCell("B2");
  titleCell.value = `REPORTE DE COBRANZA — ${mesNombre}`;
  titleCell.font = { bold: true, size: 18, color: { argb: argb(C.blanco) } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: argb(C.azulOscuro) },
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  wsRes.getRow(2).height = 40;

  wsRes.mergeCells("B3:F3");
  const subCell = wsRes.getCell("B3");
  subCell.value = `${data.residencialName}   ·   Generado el ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}`;
  subCell.font = { size: 10, color: { argb: argb(C.blanco) }, italic: true };
  subCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: argb(C.azulMedio) },
  };
  subCell.alignment = { horizontal: "center", vertical: "middle" };
  wsRes.getRow(3).height = 20;

  wsRes.getRow(4).height = 10;

  // KPIs - fila de labels
  const kpiLabels = wsRes.getRow(5);
  kpiLabels.values = [
    "",
    "CASAS ACTIVAS",
    "CUOTAS FACTURADAS",
    "RECAUDADO EN EL MES",
    "DEUDA ACUMULADA",
    "% COBRANZA",
  ];
  styleHeader(kpiLabels, C.azulOscuro);
  kpiLabels.height = 22;

  // KPIs - fila de valores
  const kpiValues = wsRes.getRow(6);
  kpiValues.values = [
    "",
    data.totalCasas,
    fmtMXN(data.facturadoCents),
    fmtMXN(data.totalRecaudadoCents),
    fmtMXN(data.totalDeudaCents),
    `${data.pctCobranza}%`,
  ];
  kpiValues.eachCell((cell, col) => {
    if (col < 2) return;
    const bg =
      col === 3
        ? C.azulClaro
        : col === 4
          ? C.verdeClaro
          : col === 5
            ? C.rojoClaro
            : col === 6
              ? data.pctCobranza >= 70
                ? C.verdeClaro
                : C.amarilloClaro
              : C.grisHeader;
    cell.font = { bold: true, size: 14 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: argb(bg) },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  kpiValues.height = 36;

  wsRes.getRow(7).height = 10;

  // Desglose del recaudado
  wsRes.mergeCells("B8:F8");
  const desgloseTitle = wsRes.getCell("B8");
  desgloseTitle.value = "DESGLOSE DEL RECAUDADO EN EL MES";
  desgloseTitle.font = {
    bold: true,
    size: 11,
    color: { argb: argb(C.blanco) },
  };
  desgloseTitle.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: argb(C.azulMedio) },
  };
  desgloseTitle.alignment = { horizontal: "center", vertical: "middle" };
  wsRes.getRow(8).height = 22;

  const desglose = [
    [
      "Para cuota de " + mesCorto(data.reportMonth),
      fmtMXN(data.paraMesActualCents),
      "Pagos que liquidan la cuota del mes actual",
    ],
    [
      "Para meses anteriores",
      fmtMXN(data.paraOtrosMesesCents),
      "Catch-up de adeudos de meses pasados",
    ],
    [
      "Total recaudado",
      fmtMXN(data.totalRecaudadoCents),
      "Suma total de efectivo recibido",
    ],
  ];

  desglose.forEach(([label, valor, nota], i) => {
    const row = wsRes.getRow(9 + i);
    row.getCell(2).value = label;
    row.getCell(3).value = valor;
    row.getCell(4).value = "";
    row.getCell(5).value = nota;
    row.getCell(2).font = { bold: i === 2, size: 10 };
    row.getCell(3).font = { bold: i === 2, size: 11 };
    row.getCell(5).font = {
      italic: true,
      size: 9,
      color: { argb: argb("777777") },
    };
    const bg = i === 2 ? C.azulClaro : i % 2 === 0 ? C.blanco : C.grisHeader;
    [2, 3, 4, 5].forEach((col) => {
      row.getCell(col).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: argb(bg) },
      };
    });
    row.height = 20;
  });

  wsRes.getRow(12).height = 10;

  // Tabla de estado por calle
  wsRes.mergeCells("B13:F13");
  const calleTitle = wsRes.getCell("B13");
  calleTitle.value = "COBRANZA POR CALLE";
  calleTitle.font = { bold: true, size: 11, color: { argb: argb(C.blanco) } };
  calleTitle.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: argb(C.azulMedio) },
  };
  calleTitle.alignment = { horizontal: "center", vertical: "middle" };
  wsRes.getRow(13).height = 22;

  const calleHeader = wsRes.getRow(14);
  calleHeader.values = ["", "Calle", "Recaudado", "% del Total", "", ""];
  styleHeader(calleHeader, C.azulClaro, C.negro);
  calleHeader.height = 18;

  const calles = Object.entries(data.porCalle).sort((a, b) => b[1] - a[1]);
  calles.forEach(([calle, monto], i) => {
    const row = wsRes.getRow(15 + i);
    const pct =
      data.totalRecaudadoCents > 0
        ? ((monto / data.totalRecaudadoCents) * 100).toFixed(1)
        : "0.0";
    row.getCell(2).value = calle.replace(/_/g, " ");
    row.getCell(3).value = fmtMXN(monto);
    row.getCell(4).value = `${pct}%`;
    styleDataRow(row, i % 2 === 0);
    row.height = 18;
  });

  // ════════════════════════════════════════════════════════════════
  // HOJA 2: PAGARON
  // ════════════════════════════════════════════════════════════════
  const wsPag = wb.addWorksheet("Pagaron", {
    tabColor: { argb: argb(C.verde) },
  });

  wsPag.columns = [
    { width: 3 },
    { width: 28 }, // Casa
    { width: 24 }, // Residente
    { width: 16 }, // Pagado
    { width: 14 }, // Fecha
    { width: 36 }, // Meses cubiertos
    { width: 3 },
  ];

  wsPag.mergeCells("B2:F2");
  const pagTitle = wsPag.getCell("B2");
  pagTitle.value = `CASAS QUE PAGARON — ${mesNombre}`;
  pagTitle.font = { bold: true, size: 14, color: { argb: argb(C.blanco) } };
  pagTitle.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: argb(C.verde) },
  };
  pagTitle.alignment = { horizontal: "center", vertical: "middle" };
  wsPag.getRow(2).height = 35;

  wsPag.mergeCells("B3:F3");
  const pagSub = wsPag.getCell("B3");
  pagSub.value = `${data.casasQuePagaron} casas  ·  Total recaudado: ${fmtMXN(data.totalRecaudadoCents)}`;
  pagSub.font = { size: 10, color: { argb: argb(C.blanco) }, italic: true };
  pagSub.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: argb("27AE60") },
  };
  pagSub.alignment = { horizontal: "center", vertical: "middle" };
  wsPag.getRow(3).height = 18;

  wsPag.getRow(4).height = 8;

  const pagHeader = wsPag.getRow(5);
  pagHeader.values = [
    "",
    "Casa",
    "Residente",
    "Pagado ($)",
    "Fecha de pago",
    "Meses cubiertos",
  ];
  styleHeader(pagHeader, C.verde);
  pagHeader.height = 20;

  const pagadores = data.houses
    .filter((h) => h.pagadoCents > 0)
    .sort((a, b) => a.label.localeCompare(b.label));

  pagadores.forEach((h, i) => {
    const row = wsPag.getRow(6 + i);
    row.values = [
      "",
      h.label,
      h.residentName,
      fmtMXN(h.pagadoCents),
      h.fechaPago || "",
      h.mesesCubiertos.map(mesCorto).join("  |  "),
    ];
    styleDataRow(row, i % 2 === 0);

    // Destacar si pagó más de un mes
    if (h.mesesCubiertos.length > 1) {
      row.getCell(6).font = {
        size: 10,
        bold: true,
        color: { argb: argb(C.azulMedio) },
      };
    }
    // Destacar si cubrió el mes actual
    if (h.cubreMesActual) {
      row.getCell(3).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: argb(i % 2 === 0 ? C.verdeClaro : "E8F8F0") },
      };
    }
    row.height = 18;
  });

  const pagTotRow = wsPag.getRow(6 + pagadores.length);
  pagTotRow.values = [
    "",
    "TOTAL",
    `${pagadores.length} casas`,
    fmtMXN(data.totalRecaudadoCents),
    "",
    "",
  ];
  styleTotalsRow(pagTotRow);
  pagTotRow.height = 22;

  // ════════════════════════════════════════════════════════════════
  // HOJA 3: PENDIENTES
  // ════════════════════════════════════════════════════════════════
  const wsPend = wb.addWorksheet("Pendientes", {
    tabColor: { argb: argb(C.rojo) },
  });

  wsPend.columns = [
    { width: 3 },
    { width: 28 }, // Casa
    { width: 24 }, // Residente
    { width: 18 }, // Deuda acumulada
    { width: 16 }, // Último pago
    { width: 3 },
  ];

  wsPend.mergeCells("B2:E2");
  const pendTitle = wsPend.getCell("B2");
  pendTitle.value = `PENDIENTES DE PAGO — ${mesNombre}`;
  pendTitle.font = { bold: true, size: 14, color: { argb: argb(C.blanco) } };
  pendTitle.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: argb(C.rojo) },
  };
  pendTitle.alignment = { horizontal: "center", vertical: "middle" };
  wsPend.getRow(2).height = 35;

  wsPend.mergeCells("B3:E3");
  const pendSub = wsPend.getCell("B3");
  pendSub.value = `${data.casasNoPagaron} casas sin pago en el mes  ·  Deuda total: ${fmtMXN(data.totalDeudaCents)}`;
  pendSub.font = { size: 10, color: { argb: argb(C.blanco) }, italic: true };
  pendSub.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: argb("E74C3C") },
  };
  pendSub.alignment = { horizontal: "center", vertical: "middle" };
  wsPend.getRow(3).height = 18;

  wsPend.getRow(4).height = 8;

  const pendHeader = wsPend.getRow(5);
  pendHeader.values = [
    "",
    "Casa",
    "Residente",
    "Deuda acumulada ($)",
    "Último pago",
  ];
  styleHeader(pendHeader, C.rojo);
  pendHeader.height = 20;

  const pendientes = data.houses
    .filter((h) => h.pagadoCents === 0)
    .sort((a, b) => b.deudaCents - a.deudaCents);

  pendientes.forEach((h, i) => {
    const row = wsPend.getRow(6 + i);
    row.values = [
      "",
      h.label,
      h.residentName,
      h.deudaCents > 0 ? fmtMXN(h.deudaCents) : "Al día",
      h.ultimoPago || "Sin registro",
    ];
    styleDataRow(row, i % 2 === 0);

    // Resaltar casas con deuda alta (> 2 meses)
    if (h.deudaCents > 230000) {
      row.getCell(4).font = {
        bold: true,
        size: 10,
        color: { argb: argb(C.rojo) },
      };
      row.getCell(4).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: argb(C.rojoClaro) },
      };
    }
    row.height = 18;
  });

  const pendTotRow = wsPend.getRow(6 + pendientes.length);
  pendTotRow.values = [
    "",
    "TOTAL",
    `${pendientes.length} casas`,
    fmtMXN(data.totalDeudaCents),
    "",
  ];
  styleTotalsRow(pendTotRow);
  pendTotRow.height = 22;

  // ════════════════════════════════════════════════════════════════
  // HOJA 4: ESTADO COMPLETO
  // ════════════════════════════════════════════════════════════════
  const wsAll = wb.addWorksheet("Estado Completo", {
    tabColor: { argb: argb(C.azulMedio) },
  });

  wsAll.columns = [
    { width: 3 },
    { width: 28 }, // Casa
    { width: 24 }, // Residente
    { width: 12 }, // Estado
    { width: 16 }, // Deuda
    { width: 16 }, // A favor
    { width: 16 }, // Pagado mes
    { width: 14 }, // Fecha
    { width: 36 }, // Meses cubiertos
    { width: 3 },
  ];

  wsAll.mergeCells("B2:I2");
  const allTitle = wsAll.getCell("B2");
  allTitle.value = `ESTADO COMPLETO — ${mesNombre}  ·  ${data.residencialName}`;
  allTitle.font = { bold: true, size: 14, color: { argb: argb(C.blanco) } };
  allTitle.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: argb(C.azulOscuro) },
  };
  allTitle.alignment = { horizontal: "center", vertical: "middle" };
  wsAll.getRow(2).height = 35;
  wsAll.getRow(3).height = 8;

  const allHeader = wsAll.getRow(4);
  allHeader.values = [
    "",
    "Casa",
    "Residente",
    "Estado",
    "Deuda ($)",
    "A Favor ($)",
    `Pagado ${mesCorto(data.reportMonth)} ($)`,
    "Fecha de pago",
    "Meses cubiertos",
  ];
  styleHeader(allHeader, C.azulOscuro);
  allHeader.height = 22;

  // Ordenar: primero con_deuda por monto, luego al_dia
  const sorted = [...data.houses].sort((a, b) => {
    if (a.status !== b.status) return a.status === "con_deuda" ? -1 : 1;
    return b.deudaCents - a.deudaCents;
  });

  sorted.forEach((h, i) => {
    const row = wsAll.getRow(5 + i);
    row.values = [
      "",
      h.label,
      h.residentName,
      h.status === "con_deuda" ? "Con deuda" : "Al día",
      h.deudaCents > 0 ? fmtMXN(h.deudaCents) : "-",
      h.saldoAFavorCents > 0 ? fmtMXN(h.saldoAFavorCents) : "-",
      h.pagadoCents > 0 ? fmtMXN(h.pagadoCents) : "-",
      h.fechaPago || "-",
      h.mesesCubiertos.length > 0
        ? h.mesesCubiertos.map(mesCorto).join("  |  ")
        : "-",
    ];
    styleDataRow(row, i % 2 === 0);

    // Estado cell
    const estadoCell = row.getCell(4);
    estadoCell.alignment = { horizontal: "center", vertical: "middle" };
    if (h.status === "con_deuda") {
      estadoCell.font = { bold: true, size: 10, color: { argb: argb(C.rojo) } };
      estadoCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: argb(C.rojoClaro) },
      };
    } else {
      estadoCell.font = {
        bold: true,
        size: 10,
        color: { argb: argb(C.verde) },
      };
      estadoCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: argb(C.verdeClaro) },
      };
    }
    row.height = 18;
  });

  const allTotRow = wsAll.getRow(5 + sorted.length);
  allTotRow.values = [
    "",
    "TOTALES",
    `${data.totalCasas} casas`,
    "",
    fmtMXN(data.totalDeudaCents),
    "",
    fmtMXN(data.totalRecaudadoCents),
    "",
    "",
  ];
  styleTotalsRow(allTotRow);
  allTotRow.height = 22;

  // Freeze header rows
  wsPag.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }];
  wsPend.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }];
  wsAll.views = [{ state: "frozen", xSplit: 0, ySplit: 4 }];

  return wb;
}

// ── Route Handler ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500 },
    );
  }

  const uid = await verifyAdminToken(req);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const residencialId = searchParams.get("residencialId");
  const reportMonth = searchParams.get("reportMonth");

  if (!residencialId || !reportMonth || !/^\d{4}-\d{2}$/.test(reportMonth)) {
    return NextResponse.json(
      { error: "residencialId y reportMonth (YYYY-MM) requeridos" },
      { status: 400 },
    );
  }

  try {
    const data = await fetchReportData(residencialId, reportMonth);
    const wb = await buildExcel(data);

    const buffer = await wb.xlsx.writeBuffer();
    const mesSlug = reportMonth.replace("-", "");
    const filename = `reporte-cobranza-${mesSlug}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[report-pagos] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Error interno" },
      { status: 500 },
    );
  }
}
