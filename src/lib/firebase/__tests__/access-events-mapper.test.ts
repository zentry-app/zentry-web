import { describe, it, expect } from "vitest";
import { clasificarAccessEvent } from "../access-events-mapper";

// Helper para crear Timestamp de Firestore simulado
const ts = (iso: string) => ({
  toDate: () => new Date(iso),
  seconds: 0,
  nanoseconds: 0,
});

describe("clasificarAccessEvent", () => {
  it("ingreso temporal activo — sin exitAt", () => {
    const data = {
      entryAt: ts("2026-05-06T20:00:00Z"),
      exitAt: null,
      category: "temporal",
      entryMethod: "qr_with_physical_pass",
      entryStatus: "approved",
      subject: { name: "Juan Perez", userId: "uid_123", visitorId: null },
      unit: { street: "Coto Sur", number: "1469" },
      community: { legacyId: "S9G7TL" },
      vehicle: null,
      physicalPass: {
        number: 5,
        delivered: true,
        returned: false,
        deliveredAt: ts("2026-05-06T20:00:00Z"),
      },
      codigoAcceso: "ABC123",
      eventId: null,
      providerData: null,
      legacyExtras: null,
    };

    const result = clasificarAccessEvent(data, "doc_001");

    expect(result.id).toBe("doc_001");
    expect(result.category).toBe("temporal");
    expect(result.entryMethod).toBe("qr_with_physical_pass");
    expect(result.status).toBe("active");
    expect(result.exitTimestamp).toBeNull();
    expect(result.visitData.name).toBe("Juan Perez");
    expect(result.userId).toBe("uid_123");
    expect(result.domicilio.calle).toBe("Coto Sur");
    expect(result.domicilio.houseNumber).toBe("1469");
    expect(result.domicilio.residencialID).toBe("S9G7TL");
    expect(result.codigoAcceso).toBe("ABC123");
    expect(result.physicalPass?.number).toBe(5);
    expect(result.rejected).toBe(false);
    expect(result.isFrequentVisitor).toBe(false);
  });

  it("ingreso temporal completado — con exitAt", () => {
    const data = {
      entryAt: ts("2026-05-06T20:00:00Z"),
      exitAt: ts("2026-05-06T21:00:00Z"),
      category: "temporal",
      entryMethod: "qr_with_physical_pass",
      entryStatus: "approved",
      subject: { name: "Maria Lopez", userId: null, visitorId: null },
      unit: { street: "Guaycura", number: "1488" },
      community: { legacyId: "S9G7TL" },
      vehicle: null,
      physicalPass: null,
      codigoAcceso: null,
      eventId: null,
      providerData: null,
      legacyExtras: null,
    };

    const result = clasificarAccessEvent(data, "doc_002");

    expect(result.status).toBe("completed");
    expect(result.exitTimestamp).not.toBeNull();
  });

  it("ingreso con vehículo", () => {
    const data = {
      entryAt: ts("2026-05-06T20:00:00Z"),
      exitAt: null,
      category: "residente",
      entryMethod: "frequent_visitor_with_physical_pass",
      entryStatus: "approved",
      subject: { name: "Carlos Ruiz", userId: "uid_456", visitorId: "5RLXSG" },
      unit: { street: "Batequitos", number: "293" },
      community: { legacyId: "S9G7TL" },
      vehicle: {
        plate: "ABC123",
        brand: "Honda",
        model: "Civic",
        color: "Negro",
      },
      physicalPass: null,
      codigoAcceso: null,
      eventId: null,
      providerData: null,
      legacyExtras: {
        isFrequentVisitor: true,
        registradoPor: "guard_uid",
        exitDetails: null,
        passLost: false,
        passReturned: false,
      },
    };

    const result = clasificarAccessEvent(data, "doc_003");

    expect(result.vehicleInfo?.placa).toBe("ABC123");
    expect(result.vehicleInfo?.marca).toBe("Honda");
    expect(result.vehicleInfo?.modelo).toBe("Civic");
    expect(result.vehicleInfo?.color).toBe("Negro");
    expect(result.isFrequentVisitor).toBe(true);
    expect(result.registradoPor).toBe("guard_uid");
    expect(result.visitorId).toBe("5RLXSG");
  });

  it("ingreso de evento — con eventId", () => {
    const data = {
      entryAt: ts("2026-05-06T20:00:00Z"),
      exitAt: null,
      category: "evento",
      entryMethod: "event_with_physical_pass",
      entryStatus: "approved",
      subject: { name: "Beto", userId: "uid_789", visitorId: "inv_123" },
      unit: { street: "Coto Sur", number: "1469" },
      community: { legacyId: "S9G7TL" },
      vehicle: null,
      physicalPass: null,
      codigoAcceso: null,
      eventId: "EVT_ABC123",
      providerData: null,
      legacyExtras: null,
    };

    const result = clasificarAccessEvent(data, "doc_004");

    expect(result.category).toBe("evento");
    expect(result.visitData.eventId).toBe("EVT_ABC123");
  });

  it("paquetería con multipleDestinations", () => {
    const data = {
      entryAt: ts("2026-05-06T20:00:00Z"),
      exitAt: null,
      category: "paquetería",
      entryMethod: "provider_paqueteria",
      entryStatus: "approved",
      subject: { name: "MercadoLibre", userId: null, visitorId: null },
      unit: { street: "No especificada", number: "N/A" },
      community: { legacyId: "S9G7TL" },
      vehicle: null,
      physicalPass: null,
      codigoAcceso: null,
      eventId: null,
      providerData: {
        multipleDestinations: ["Coto Sur #1469", "Guaycura #1429"],
        destinationCount: 2,
        company: "MercadoLibre",
      },
      legacyExtras: null,
    };

    const result = clasificarAccessEvent(data, "doc_005");

    expect(result.visitData.multipleDestinations).toEqual([
      "Coto Sur #1469",
      "Guaycura #1429",
    ]);
  });

  it("ingreso rechazado — entryStatus rejected", () => {
    const data = {
      entryAt: ts("2026-05-06T20:00:00Z"),
      exitAt: ts("2026-05-06T20:01:00Z"),
      category: "temporal",
      entryMethod: "qr_with_physical_pass",
      entryStatus: "rejected",
      subject: { name: "Sin Nombre", userId: null, visitorId: null },
      unit: { street: "Coto Sur", number: "1469" },
      community: { legacyId: "S9G7TL" },
      vehicle: null,
      physicalPass: null,
      codigoAcceso: null,
      eventId: null,
      providerData: null,
      legacyExtras: null,
    };

    const result = clasificarAccessEvent(data, "doc_006");

    expect(result.rejected).toBe(true);
    expect(result.status).toBe("rejected");
  });

  it("doc migrado — con legacyExtras completo", () => {
    const data = {
      entryAt: ts("2026-04-01T18:00:00Z"),
      exitAt: ts("2026-04-01T19:00:00Z"),
      category: "temporal",
      entryMethod: "intelligent_with_physical_pass",
      entryStatus: "approved",
      subject: { name: "Fernando del Rayo", userId: null, visitorId: null },
      unit: { street: "Guaycura", number: "1488" },
      community: { legacyId: "S9G7TL" },
      vehicle: {
        plate: "ZJA433V",
        brand: "Toyota",
        model: "Tacoma",
        color: "Plata",
      },
      physicalPass: {
        number: 1,
        delivered: true,
        returned: true,
        deliveredAt: ts("2026-04-01T18:00:00Z"),
      },
      codigoAcceso: "W5TTX7",
      eventId: null,
      providerData: null,
      legacyExtras: {
        registradoPor: "ZfxMdUK7L9agvfs0S2LYZ1dp1g73",
        isFrequentVisitor: false,
        exitDetails: {
          exitMode: "same_vehicle",
          passReturned: true,
          samePersonExit: true,
        },
        passLost: false,
        passReturned: true,
      },
    };

    const result = clasificarAccessEvent(data, "legacy_doc_007");

    expect(result.registradoPor).toBe("ZfxMdUK7L9agvfs0S2LYZ1dp1g73");
    expect(result.passReturned).toBe(true);
    expect(result.exitDetails?.exitMode).toBe("same_vehicle");
    expect(result.codigoAcceso).toBe("W5TTX7");
  });
});
