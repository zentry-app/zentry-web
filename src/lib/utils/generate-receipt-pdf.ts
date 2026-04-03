import jsPDF from "jspdf";
import * as QRCode from "qrcode";

export interface ReceiptData {
  folio: string;
  houseId: string;
  payerName: string;
  concept: string;
  amountCents: number;
  method: string;
  timestamp: string; // formatted date string e.g. "1 de abril de 2026 · 14:30"
  isAdmin: boolean;
  residencialName?: string;
  residencialAddress?: string;
  referencia?: string;
  bancoOrigen?: string;
  rfc?: string;
  razonSocial?: string;
  domicilioFiscal?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function formatHouseLabel(houseId: string): string {
  if (!houseId) return "";
  const parts = houseId.split("-");
  if (parts.length >= 3) {
    const street = parts
      .slice(1, -1)
      .join(" ")
      .replace(/_/g, " ")
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return `${street} ${parts[parts.length - 1]}`;
  }
  return houseId;
}

async function computeHash(
  folio: string,
  amountCents: number,
  houseId: string,
): Promise<string> {
  const input = `${folio}|${amountCents}|${houseId}|ZENTRY`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .substring(0, 16)
    .toUpperCase();
}

function to12h(time: string): string {
  if (!time) return time;
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

function fmtAmount(cents: number): string {
  return (
    "$" +
    (cents / 100).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// ─── Colors ───────────────────────────────────────────────────────────────

const C = {
  blue600: [30, 64, 175] as [number, number, number], // #1E40AF
  blue700: [29, 78, 216] as [number, number, number], // #1D4ED8
  blueDark: [10, 38, 71] as [number, number, number], // #0A2647
  green700: [21, 128, 61] as [number, number, number], // #15803D
  green50: [240, 253, 244] as [number, number, number], // #F0FDF4
  green200: [187, 247, 208] as [number, number, number], // #BBF7D0
  grey50: [249, 250, 251] as [number, number, number], // #F9FAFB
  grey100: [243, 244, 246] as [number, number, number], // #F3F4F6
  grey300: [209, 213, 219] as [number, number, number], // #D1D5DB
  grey500: [107, 114, 128] as [number, number, number], // #6B7280
  grey700: [55, 65, 81] as [number, number, number], // #374151
  grey800: [31, 41, 55] as [number, number, number], // #1F2937
  white: [255, 255, 255] as [number, number, number],
};

// ─── Drawing helpers ──────────────────────────────────────────────────────

function drawSection(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { fill?: [number, number, number]; border?: boolean } = {},
) {
  const fill = opts.fill ?? C.white;
  const r = 3;
  doc.setFillColor(...fill);
  doc.roundedRect(x, y, w, h, r, r, "F");
  if (opts.border !== false) {
    doc.setDrawColor(...C.grey300);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, r, r, "S");
  }
}

function drawSectionTitle(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  font: string,
) {
  doc.setFont(font, "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.grey800);
  doc.text(text, x, y);
}

function drawInfoRow(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  labelW: number,
  font: string,
  opts: { valueColor?: [number, number, number]; bold?: boolean } = {},
) {
  // Label
  doc.setFont(font, "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.grey700);
  doc.text(label, x, y);

  // Value
  doc.setFont(font, opts.bold ? "bold" : "normal");
  doc.setFontSize(8);
  doc.setTextColor(...(opts.valueColor ?? C.grey800));
  doc.text(value, x + labelW, y);
}

// ─── Font loader ──────────────────────────────────────────────────────────

async function loadFontAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch {
    return null;
  }
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ─── Page drawer ─────────────────────────────────────────────────────────────

async function drawReceiptPage(
  doc: jsPDF,
  data: ReceiptData,
  opts: {
    fontName: string;
    qrDataUrl: string;
    logoDataUrl: string | null;
    hash: string;
    verifyUrl: string;
    copyLabel?: string;
  },
): Promise<void> {
  const W = 210;
  const margin = 16;
  const contentW = W - margin * 2;
  const labelW = 38;
  const pad = 8; // section inner padding
  const rowH = 6; // row height for info rows
  const sectionGap = 4; // gap between sections

  let curY = margin;

  // Parse timestamp
  let datePart = data.timestamp;
  let timePart = "";
  const dotSepIdx = data.timestamp.indexOf(" · ");
  if (dotSepIdx !== -1) {
    datePart = data.timestamp.substring(0, dotSepIdx).trim();
    timePart = to12h(data.timestamp.substring(dotSepIdx + 3).trim());
  } else {
    const commaIdx = data.timestamp.indexOf(",");
    if (commaIdx !== -1) {
      datePart = data.timestamp.substring(0, commaIdx).trim();
      timePart = to12h(data.timestamp.substring(commaIdx + 1).trim());
    }
  }

  const houseLabel = formatHouseLabel(data.houseId) || data.houseId || "—";

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. HEADER — Blue gradient bar with ZENTRY + RECIBO DE PAGO + residencial
  // ═══════════════════════════════════════════════════════════════════════════
  const headerH = data.residencialName ? 42 : 36;
  doc.setFillColor(...C.blue600);
  doc.roundedRect(margin, curY, contentW, headerH, 4, 4, "F");

  // Zentry logo image or text fallback
  if (opts.logoDataUrl) {
    // Logo is wide wordmark (~3.3:1 ratio), center it
    const logoH = 8;
    const logoW = logoH * 3.3;
    doc.addImage(
      opts.logoDataUrl,
      "PNG",
      W / 2 - logoW / 2,
      curY + 4,
      logoW,
      logoH,
    );
  } else {
    doc.setFont(opts.fontName, "bold");
    doc.setFontSize(13);
    doc.setTextColor(...C.white);
    doc.setCharSpace(3);
    doc.text("ZENTRY", W / 2, curY + 10, { align: "center" });
    doc.setCharSpace(0);
  }

  // "RECIBO DE PAGO"
  doc.setFont(opts.fontName, "bold");
  doc.setFontSize(15);
  doc.setTextColor(...C.white);
  doc.text("RECIBO DE PAGO", W / 2, curY + 22, { align: "center" });

  // Residencial name
  if (data.residencialName) {
    doc.setFont(opts.fontName, "normal");
    doc.setFontSize(9);
    doc.text(data.residencialName, W / 2, curY + 31, { align: "center" });
  }

  curY += headerH + sectionGap;

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. INFORMACION DEL RECIBO
  // ═══════════════════════════════════════════════════════════════════════════
  const infoRows = 4;
  const infoH = 10 + infoRows * rowH + 3;
  drawSection(doc, margin, curY, contentW, infoH, { fill: C.grey50 });

  drawSectionTitle(
    doc,
    "INFORMACION DEL RECIBO",
    margin + pad,
    curY + 8,
    opts.fontName,
  );

  let rowY = curY + 14;
  drawInfoRow(
    doc,
    "Numero:",
    data.folio,
    margin + pad,
    rowY,
    labelW,
    opts.fontName,
  );
  rowY += rowH;
  drawInfoRow(
    doc,
    "Fecha:",
    datePart || "—",
    margin + pad,
    rowY,
    labelW,
    opts.fontName,
  );
  rowY += rowH;
  drawInfoRow(
    doc,
    "Concepto:",
    data.concept || "—",
    margin + pad,
    rowY,
    labelW,
    opts.fontName,
  );
  rowY += rowH;
  drawInfoRow(
    doc,
    "Estado:",
    "VALIDADO",
    margin + pad,
    rowY,
    labelW,
    opts.fontName,
    {
      valueColor: C.green700,
      bold: true,
    },
  );

  curY += infoH + sectionGap;

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. DETALLES DEL PAGO
  // ═══════════════════════════════════════════════════════════════════════════
  const hasRef = !!data.referencia;
  const hasTime = !!timePart;
  const detailRowCount = 4 + (hasRef ? 1 : 0) + (hasTime ? 1 : 0);
  // Section title + rows + monto box
  const detailH = 10 + detailRowCount * rowH + 3 + 18;
  drawSection(doc, margin, curY, contentW, detailH);

  drawSectionTitle(
    doc,
    "DETALLES DEL PAGO",
    margin + pad,
    curY + 8,
    opts.fontName,
  );

  rowY = curY + 14;
  drawInfoRow(
    doc,
    "Vivienda:",
    houseLabel,
    margin + pad,
    rowY,
    labelW,
    opts.fontName,
  );
  rowY += rowH;
  drawInfoRow(
    doc,
    "Pago:",
    data.payerName || "—",
    margin + pad,
    rowY,
    labelW,
    opts.fontName,
  );
  rowY += rowH;
  drawInfoRow(
    doc,
    "Metodo:",
    data.method || "Efectivo",
    margin + pad,
    rowY,
    labelW,
    opts.fontName,
  );
  rowY += rowH;
  drawInfoRow(
    doc,
    "Fecha:",
    datePart || "—",
    margin + pad,
    rowY,
    labelW,
    opts.fontName,
  );
  if (hasTime) {
    rowY += rowH;
    drawInfoRow(
      doc,
      "Hora:",
      timePart,
      margin + pad,
      rowY,
      labelW,
      opts.fontName,
    );
  }
  if (hasRef) {
    rowY += rowH;
    drawInfoRow(
      doc,
      "Referencia:",
      data.referencia!,
      margin + pad,
      rowY,
      labelW,
      opts.fontName,
    );
  }
  rowY += 8;

  // Monto highlight box (green background)
  const montoBoxX = margin + pad;
  const montoBoxW = contentW - pad * 2;
  const montoBoxH = 12;
  doc.setFillColor(...C.green50);
  doc.roundedRect(montoBoxX, rowY, montoBoxW, montoBoxH, 3, 3, "F");
  doc.setDrawColor(...C.green200);
  doc.setLineWidth(0.4);
  doc.roundedRect(montoBoxX, rowY, montoBoxW, montoBoxH, 3, 3, "S");

  doc.setFont(opts.fontName, "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.grey700);
  doc.text("Monto:", montoBoxX + 6, rowY + 8);

  doc.setFont(opts.fontName, "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.green700);
  const amountText = `${fmtAmount(data.amountCents)} MXN`;
  doc.text(amountText, montoBoxX + 28, rowY + 8);

  curY += detailH + sectionGap;

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. VERIFICACION — QR + hash
  // ═══════════════════════════════════════════════════════════════════════════
  const verifyH = 30;
  drawSection(doc, margin, curY, contentW, verifyH, { fill: C.grey50 });

  // QR code (left)
  const qrSize = 22;
  const qrX = margin + pad;
  const qrY = curY + (verifyH - qrSize) / 2;
  doc.addImage(opts.qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  // Verification text (right of QR)
  const textX = qrX + qrSize + 6;

  doc.setFont(opts.fontName, "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.grey800);
  doc.text("Documento electronico verificado", textX, curY + 8);

  doc.setFont(opts.fontName, "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.grey500);
  doc.text(`Hash: ${opts.hash}`, textX, curY + 13.5);

  doc.setFontSize(6);
  doc.setTextColor(...C.blue600);
  doc.text(opts.verifyUrl, textX, curY + 19);

  doc.setFontSize(5.5);
  doc.setTextColor(...C.grey500);
  doc.text(
    "Escanee el codigo QR o visite la URL para verificar este comprobante.",
    textX,
    curY + 24,
  );

  curY += verifyH + sectionGap;

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. INFORMACION DEL RESIDENCIAL (if available)
  // ═══════════════════════════════════════════════════════════════════════════
  if (data.residencialName || data.residencialAddress || data.razonSocial) {
    const resRowCount =
      (data.razonSocial ? 1 : 0) +
      (data.rfc ? 1 : 0) +
      (data.domicilioFiscal ? 1 : 0) +
      (data.residencialName && !data.razonSocial ? 1 : 0) +
      (data.residencialAddress && !data.domicilioFiscal ? 1 : 0) +
      1;
    const resInfoH = 10 + resRowCount * rowH + 3;
    drawSection(doc, margin, curY, contentW, resInfoH, { fill: C.grey50 });
    drawSectionTitle(
      doc,
      "INFORMACION DEL EMISOR",
      margin + pad,
      curY + 8,
      opts.fontName,
    );

    rowY = curY + 14;
    if (data.razonSocial) {
      drawInfoRow(
        doc,
        "Razon Social:",
        data.razonSocial,
        margin + pad,
        rowY,
        labelW,
        opts.fontName,
      );
      rowY += rowH;
    } else if (data.residencialName) {
      drawInfoRow(
        doc,
        "Residencial:",
        data.residencialName,
        margin + pad,
        rowY,
        labelW,
        opts.fontName,
      );
      rowY += rowH;
    }
    if (data.rfc) {
      drawInfoRow(
        doc,
        "RFC:",
        data.rfc,
        margin + pad,
        rowY,
        labelW,
        opts.fontName,
      );
      rowY += rowH;
    }
    if (data.domicilioFiscal) {
      drawInfoRow(
        doc,
        "Dom. Fiscal:",
        data.domicilioFiscal,
        margin + pad,
        rowY,
        labelW,
        opts.fontName,
      );
      rowY += rowH;
    } else if (data.residencialAddress) {
      drawInfoRow(
        doc,
        "Direccion:",
        data.residencialAddress,
        margin + pad,
        rowY,
        labelW,
        opts.fontName,
      );
      rowY += rowH;
    }
    drawInfoRow(
      doc,
      "Generado:",
      `${datePart}${timePart ? " " + timePart : ""}`,
      margin + pad,
      rowY,
      labelW,
      opts.fontName,
    );

    curY += resInfoH + sectionGap;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. FIRMA — Espacio para firma fisica
  // ═══════════════════════════════════════════════════════════════════════════
  const sigH = 24;
  const sigLineY = curY + sigH - 8;
  const sigLineW = 60;

  // Firma Administracion (izquierda)
  doc.setDrawColor(...C.grey300);
  doc.setLineWidth(0.4);
  doc.line(margin + pad, sigLineY, margin + pad + sigLineW, sigLineY);
  doc.setFont(opts.fontName, "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.grey500);
  doc.text(
    "Firma de la Administracion",
    margin + pad + sigLineW / 2,
    sigLineY + 4,
    { align: "center" },
  );

  // Firma Residente (derecha)
  const sigRightX = W - margin - pad - sigLineW;
  doc.line(sigRightX, sigLineY, sigRightX + sigLineW, sigLineY);
  doc.text("Firma del Residente", sigRightX + sigLineW / 2, sigLineY + 4, {
    align: "center",
  });

  curY += sigH + sectionGap;

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. FOOTER — Disclaimer + copy label
  // ═══════════════════════════════════════════════════════════════════════════
  const footerH = opts.copyLabel ? 16 : 12;
  drawSection(doc, margin, curY, contentW, footerH, { fill: C.grey100 });

  doc.setFont(opts.fontName, "normal");
  doc.setFontSize(6);
  doc.setTextColor(...C.grey500);
  doc.text(
    "Este comprobante ha sido generado mediante la plataforma Zentry. Valido unicamente como constancia de pago para fines internos. No constituye comprobante fiscal.",
    W / 2,
    curY + 5.5,
    { align: "center", maxWidth: contentW - 10 },
  );

  if (opts.copyLabel) {
    doc.setFont(opts.fontName, "bold");
    doc.setFontSize(6);
    doc.setTextColor(...C.grey500);
    doc.text(opts.copyLabel, W / 2, curY + 12.5, { align: "center" });
  }
}

// ─── Main generator ─────────────────────────────────────────────────────────

export async function generateReceiptPDF(data: ReceiptData): Promise<void> {
  const hash = await computeHash(data.folio, data.amountCents, data.houseId);
  const verifyUrl = `https://zentrymx.com/verificar/${data.folio}?h=${hash}`;

  // Load assets in parallel
  const [qrDataUrl, logoDataUrl, interRegularB64, interBoldB64] =
    await Promise.all([
      QRCode.toDataURL(verifyUrl, {
        width: 200,
        margin: 1,
        color: { dark: "#1F2937", light: "#FFFFFF" },
        errorCorrectionLevel: "M",
      }),
      loadImageAsDataUrl("/images/logos/zentry-logo-white.png"),
      loadFontAsBase64("/fonts/Inter-Regular.ttf"),
      loadFontAsBase64("/fonts/Inter-Bold.ttf"),
    ]);

  // A4 portrait
  const doc = new jsPDF({ format: "a4", orientation: "portrait", unit: "mm" });

  // Register Inter font (fallback to helvetica if loading fails)
  let fontName = "helvetica";
  if (interRegularB64 && interBoldB64) {
    doc.addFileToVFS("Inter-Regular.ttf", interRegularB64);
    doc.addFont("Inter-Regular.ttf", "Inter", "normal");
    doc.addFileToVFS("Inter-Bold.ttf", interBoldB64);
    doc.addFont("Inter-Bold.ttf", "Inter", "bold");
    fontName = "Inter";
  }

  const pageOpts = { fontName, qrDataUrl, logoDataUrl, hash, verifyUrl };

  if (data.isAdmin) {
    // Page 1: Copia Comite
    await drawReceiptPage(doc, data, {
      ...pageOpts,
      copyLabel: "COPIA COMITE",
    });
    // Page 2: Copia Residente
    doc.addPage("a4", "portrait");
    await drawReceiptPage(doc, data, {
      ...pageOpts,
      copyLabel: "COPIA RESIDENTE",
    });
  } else {
    // Single page, no copy label
    await drawReceiptPage(doc, data, pageOpts);
  }

  const fileName = `recibo-${data.folio}.pdf`;
  doc.save(fileName);
}
