import { Ingreso } from "../../types/ingresos";

/**
 * Convierte un documento de `accessEvents` al tipo `Ingreso` que consume el web admin.
 * Equivalente TypeScript de AccessEventsRepository.toIngresoShape() en Flutter.
 */
export function clasificarAccessEvent(
  data: Record<string, any>,
  id: string,
): Ingreso {
  const extras = data.legacyExtras ?? {};
  const subject = data.subject ?? {};
  const unit = data.unit ?? {};
  const community = data.community ?? {};
  const vehicle = data.vehicle ?? null;
  const providerData = data.providerData ?? null;

  const isRejected = data.entryStatus === "rejected";
  const hasExit = data.exitAt != null;

  const status = isRejected ? "rejected" : hasExit ? "completed" : "active";

  const visitData: Record<string, any> = {
    name: subject.name ?? "",
    category: data.category ?? "temporal",
    ...(data.eventId ? { eventId: data.eventId } : {}),
    ...(providerData?.multipleDestinations
      ? {
          multipleDestinations: providerData.multipleDestinations,
          destinationCount: providerData.destinationCount,
        }
      : {}),
  };

  const domicilio = {
    calle: unit.street ?? "",
    houseNumber: unit.number ?? "",
    residencialID: community.legacyId ?? "",
  };

  const vehicleInfo = vehicle
    ? {
        placa: vehicle.plate ?? "",
        marca: vehicle.brand ?? "",
        modelo: vehicle.model ?? "",
        color: vehicle.color ?? "",
      }
    : null;

  return {
    id,
    category: data.category ?? "temporal",
    codigoAcceso: data.codigoAcceso ?? null,
    domicilio,
    entryMethod: data.entryMethod ?? "",
    exitTimestamp: data.exitAt ?? null,
    isFrequentVisitor: extras.isFrequentVisitor ?? false,
    manualEntryData: extras.manualEntryData ?? null,
    packageInfo: extras.packageInfo ?? null,
    passLost: extras.passLost ?? false,
    passReturned: extras.passReturned ?? false,
    physicalPass: data.physicalPass ?? null,
    registradoPor: extras.registradoPor ?? "",
    rejectionInfo: extras.rejectionInfo ?? null,
    rejected: isRejected,
    status,
    timestamp: data.entryAt,
    userId: subject.userId ?? null,
    visitorId: subject.visitorId ?? null,
    vehicleInfo,
    visitData,
    exitDetails: extras.exitDetails ?? null,
  } as Ingreso;
}
