import { describe, it, expect } from "vitest";
import { DocumentsService } from "./documents-service";
import type { DocumentItem } from "@/types/documents";

const items: DocumentItem[] = [
  { nombre: "A", descripcion: "", cantidad: 2, tarifa: 100, importe: 200 },
  { nombre: "B", descripcion: "", cantidad: 1, tarifa: 50, importe: 50 },
];

describe("DocumentsService.calculateTotals", () => {
  it("calcula subtotal correcto", () => {
    const r = DocumentsService.calculateTotals(items, 0, "16");
    expect(r.subtotal).toBe(250);
  });

  it("aplica descuento porcentual", () => {
    const r = DocumentsService.calculateTotals(items, 10, "16");
    expect(r.descuento).toBeCloseTo(25);
    expect(r.subtotal).toBe(250);
  });

  it("calcula IVA 16% sobre base después de descuento", () => {
    const r = DocumentsService.calculateTotals(items, 0, "16");
    expect(r.iva).toBeCloseTo(40);
    expect(r.total).toBeCloseTo(290);
  });

  it("calcula IVA 8%", () => {
    const r = DocumentsService.calculateTotals(items, 0, "8");
    expect(r.iva).toBeCloseTo(20);
    expect(r.total).toBeCloseTo(270);
  });

  it("IVA exento da iva=0", () => {
    const r = DocumentsService.calculateTotals(items, 0, "exento");
    expect(r.iva).toBe(0);
    expect(r.total).toBe(250);
  });

  it("descuento + IVA combinados", () => {
    const r = DocumentsService.calculateTotals(items, 20, "16");
    // subtotal=250, descuento=50, base=200, iva=32, total=232
    expect(r.descuento).toBeCloseTo(50);
    expect(r.iva).toBeCloseTo(32);
    expect(r.total).toBeCloseTo(232);
  });
});

describe("DocumentsService.formatFolio", () => {
  it("formatea COT con 4 dígitos", () => {
    expect(DocumentsService.formatFolio("COT", 17)).toBe("COT-0017");
  });

  it("formatea NOT con 4 dígitos", () => {
    expect(DocumentsService.formatFolio("NOT", 1)).toBe("NOT-0001");
  });
});
