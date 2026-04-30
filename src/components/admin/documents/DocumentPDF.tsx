"use client";

import React, { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ZentryDocument } from "@/types/documents";
import { DocumentsService } from "@/lib/services/documents-service";

interface DocumentPDFProps {
  document: ZentryDocument;
  onGenerated?: () => void;
}

export function DocumentPDFPreview({ document }: { document: ZentryDocument }) {
  const { subtotal, descuento, iva, total } = DocumentsService.calculateTotals(
    document.items,
    document.descuentoPct,
    document.ivaType,
  );

  const fmt = (val: number) =>
    val.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const ivaLabel =
    document.ivaType === "exento" ? "Exento" : `IVA (${document.ivaType}%)`;

  const fechaFmt = document.fecha
    ? new Date(document.fecha + "T12:00:00Z").toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const tituloDoc = document.tipo === "COT" ? "COTIZACIÓN" : "NOTA DE\nVENTA";

  return (
    <div
      id="pdf-content"
      style={{
        width: "794px",
        minHeight: "1123px",
        backgroundColor: "#fff",
        padding: "48px 56px",
        fontFamily: "Arial, sans-serif",
        fontSize: "13px",
        color: "#111",
        boxSizing: "border-box",
      }}
    >
      {/* Header: Logo + Título */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "32px",
        }}
      >
        {/* Logo + datos empresa */}
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logos/Logo version azul.png"
            alt="Zentry"
            style={{ height: "48px", marginBottom: "12px" }}
          />
          <p
            style={{
              fontWeight: "bold",
              fontSize: "13px",
              marginBottom: "2px",
            }}
          >
            Zentry Tech Group
          </p>
          <p style={{ fontSize: "12px", color: "#444", lineHeight: "1.6" }}>
            Batequitos 261 Coto Sur
            <br />
            Baja California 21383
            <br />
            Mexico
            <br />
            infra@zentrymx.com
          </p>
        </div>

        {/* Tipo de documento + folio */}
        <div style={{ textAlign: "right" }}>
          <p
            style={{
              fontSize: "28px",
              fontWeight: "900",
              lineHeight: "1.1",
              whiteSpace: "pre-line",
            }}
          >
            {tituloDoc}
          </p>
          <p style={{ fontSize: "13px", color: "#555", marginTop: "6px" }}>
            # {document.folio}
          </p>
        </div>
      </div>

      {/* Cliente + Fecha */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "28px",
        }}
      >
        <div>
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
            Facturar a
          </p>
          <p style={{ fontWeight: "bold", fontSize: "13px" }}>
            {document.clienteEmpresa || document.clienteNombre}
          </p>
          {document.clienteEmpresa && (
            <p style={{ fontSize: "12px", color: "#444" }}>
              {document.clienteNombre}
            </p>
          )}
          {document.clienteDireccion && (
            <p
              style={{
                fontSize: "12px",
                color: "#444",
                whiteSpace: "pre-line",
                marginTop: "4px",
              }}
            >
              {document.clienteDireccion}
            </p>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "12px", color: "#666" }}>
            Fecha:&nbsp;&nbsp;
          </span>
          <span style={{ fontSize: "12px" }}>{fechaFmt}</span>
          {document.fechaVencimiento && (
            <div style={{ marginTop: "4px" }}>
              <span style={{ fontSize: "12px", color: "#666" }}>
                Vence:&nbsp;&nbsp;
              </span>
              <span style={{ fontSize: "12px" }}>
                {new Date(
                  document.fechaVencimiento + "T12:00:00Z",
                ).toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de artículos */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "16px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#1e293b", color: "#fff" }}>
            <th
              style={{
                padding: "10px 12px",
                textAlign: "left",
                fontSize: "12px",
                width: "32px",
              }}
            >
              #
            </th>
            <th
              style={{
                padding: "10px 12px",
                textAlign: "left",
                fontSize: "12px",
              }}
            >
              Artículo &amp; Descripción
            </th>
            <th
              style={{
                padding: "10px 12px",
                textAlign: "right",
                fontSize: "12px",
                width: "80px",
              }}
            >
              Cant.
            </th>
            <th
              style={{
                padding: "10px 12px",
                textAlign: "right",
                fontSize: "12px",
                width: "100px",
              }}
            >
              Tarifa
            </th>
            <th
              style={{
                padding: "10px 12px",
                textAlign: "right",
                fontSize: "12px",
                width: "100px",
              }}
            >
              Importe
            </th>
          </tr>
        </thead>
        <tbody>
          {document.items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td
                style={{
                  padding: "12px",
                  fontSize: "12px",
                  color: "#555",
                  verticalAlign: "top",
                }}
              >
                {idx + 1}
              </td>
              <td style={{ padding: "12px", verticalAlign: "top" }}>
                <p
                  style={{
                    fontWeight: "500",
                    fontSize: "12px",
                    marginBottom: "2px",
                  }}
                >
                  {item.nombre}
                </p>
                {item.descripcion && (
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#666",
                      lineHeight: "1.5",
                    }}
                  >
                    {item.descripcion}
                  </p>
                )}
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontSize: "12px",
                  verticalAlign: "top",
                }}
              >
                {item.cantidad.toLocaleString("es-MX", {
                  minimumFractionDigits: 2,
                })}
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontSize: "12px",
                  verticalAlign: "top",
                }}
              >
                {fmt(item.tarifa)}
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontSize: "12px",
                  fontWeight: "bold",
                  verticalAlign: "top",
                }}
              >
                {fmt(item.importe)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "32px",
        }}
      >
        <table style={{ minWidth: "280px" }}>
          <tbody>
            <tr>
              <td
                style={{
                  padding: "6px 16px 6px 0",
                  fontSize: "12px",
                  color: "#555",
                  textAlign: "right",
                  fontWeight: "600",
                }}
              >
                Subtotal
              </td>
              <td
                style={{
                  padding: "6px 0",
                  fontSize: "12px",
                  textAlign: "right",
                  minWidth: "100px",
                }}
              >
                {fmt(subtotal)}
              </td>
            </tr>
            {descuento > 0 && (
              <tr>
                <td
                  style={{
                    padding: "6px 16px 6px 0",
                    fontSize: "12px",
                    color: "#555",
                    textAlign: "right",
                    fontWeight: "600",
                  }}
                >
                  Descuento ({document.descuentoPct}%)
                </td>
                <td
                  style={{
                    padding: "6px 0",
                    fontSize: "12px",
                    textAlign: "right",
                  }}
                >
                  -{fmt(descuento)}
                </td>
              </tr>
            )}
            <tr>
              <td
                style={{
                  padding: "6px 16px 6px 0",
                  fontSize: "12px",
                  color: "#555",
                  textAlign: "right",
                  fontWeight: "600",
                }}
              >
                {ivaLabel}
              </td>
              <td
                style={{
                  padding: "6px 0",
                  fontSize: "12px",
                  textAlign: "right",
                }}
              >
                {fmt(iva)}
              </td>
            </tr>
            <tr style={{ backgroundColor: "#f1f5f9" }}>
              <td
                style={{
                  padding: "10px 16px 10px 12px",
                  fontSize: "13px",
                  fontWeight: "900",
                  textAlign: "right",
                }}
              >
                Total
              </td>
              <td
                style={{
                  padding: "10px 12px 10px 0",
                  fontSize: "13px",
                  fontWeight: "900",
                  textAlign: "right",
                }}
              >
                MXN {fmt(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notas */}
      {document.notasCliente && (
        <div style={{ marginBottom: "24px" }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              marginBottom: "6px",
            }}
          >
            Notas
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "#444",
              whiteSpace: "pre-line",
              lineHeight: "1.6",
            }}
          >
            {document.notasCliente}
          </p>
        </div>
      )}

      {/* Términos */}
      {document.terminosCondiciones && (
        <div>
          <p
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              marginBottom: "6px",
            }}
          >
            Términos y Condiciones
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "#444",
              whiteSpace: "pre-line",
              lineHeight: "1.6",
            }}
          >
            {document.terminosCondiciones}
          </p>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: "32px",
          right: "56px",
          fontSize: "11px",
          color: "#aaa",
        }}
      >
        1
      </div>
    </div>
  );
}

export function DocumentPDFButton({ document }: DocumentPDFProps) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setGenerating(true);
    // Renderiza el preview en un div oculto fuera del DOM visible
    const container = window.document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "-9999px";
    container.style.left = "-9999px";
    container.style.zIndex = "-1";
    window.document.body.appendChild(container);

    const React = await import("react");
    const ReactDOM = await import("react-dom/client");
    const root = ReactDOM.createRoot(container);
    root.render(<DocumentPDFPreview document={document} />);

    await new Promise((r) => setTimeout(r, 400)); // esperar render

    try {
      const el = container.querySelector("#pdf-content") as HTMLElement;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });
      pdf.addImage(imgData, "JPEG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${document.folio}.pdf`);
    } finally {
      root.unmount();
      window.document.body.removeChild(container);
      setGenerating(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleDownload}
      disabled={generating}
      className="h-11 px-6 font-black bg-slate-900 text-white rounded-xl hover:bg-slate-800"
    >
      {generating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" /> Descargar PDF
        </>
      )}
    </Button>
  );
}
