/**
 * migrate-ingresos-to-access-events.js
 *
 * Migra docs legacy de `residenciales/{id}/ingresos` a `residenciales/{id}/accessEvents`.
 * Usa el mismo doc ID para garantizar idempotencia.
 *
 * Uso:
 *   node scripts/migrate-ingresos-to-access-events.js --dry-run
 *   node scripts/migrate-ingresos-to-access-events.js --execute
 *   node scripts/migrate-ingresos-to-access-events.js --execute --residencial mCTs294LGLkGvL9TTvaQ
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Cargar .env.local
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local no encontrado en " + envPath);
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

// ---------------------------------------------------------------------------
// Inicializar Firebase Admin
// ---------------------------------------------------------------------------
function initAdmin() {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!encoded)
    throw new Error("FIREBASE_SERVICE_ACCOUNT no encontrado en .env.local");
  const serviceAccount = JSON.parse(
    Buffer.from(encoded, "base64").toString("utf-8"),
  );
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return admin.firestore();
}

// ---------------------------------------------------------------------------
// Mapear un doc de ingresos → doc de accessEvents
// ---------------------------------------------------------------------------
function mapIngresoToAccessEvent(data, ingresoId) {
  const vehicleInfo = data.vehicleInfo || null;
  const domicilio = data.domicilio || {};
  const visitData = data.visitData || {};
  const extras = {};

  if (data.registradoPor !== undefined)
    extras.registradoPor = data.registradoPor;
  if (data.isFrequentVisitor !== undefined)
    extras.isFrequentVisitor = data.isFrequentVisitor;
  if (data.exitDetails !== undefined) extras.exitDetails = data.exitDetails;
  if (data.passLost !== undefined) extras.passLost = data.passLost;
  if (data.passReturned !== undefined) extras.passReturned = data.passReturned;
  if (data.manualEntryData !== undefined)
    extras.manualEntryData = data.manualEntryData;
  if (data.packageInfo !== undefined) extras.packageInfo = data.packageInfo;
  if (data.rejectionInfo !== undefined)
    extras.rejectionInfo = data.rejectionInfo;

  const doc = {
    entryAt: data.timestamp ?? null,
    exitAt: data.exitTimestamp ?? null,
    subject: {
      name: visitData.name ?? "",
      userId: data.userId ?? null,
      visitorId: data.visitorId ?? null,
    },
    unit: {
      street: domicilio.calle ?? "",
      number: domicilio.houseNumber ?? "",
    },
    community: {
      legacyId: domicilio.residencialID ?? "",
    },
    vehicle: vehicleInfo
      ? {
          plate: vehicleInfo.placa ?? "",
          brand: vehicleInfo.marca ?? "",
          model: vehicleInfo.modelo ?? "",
          color: vehicleInfo.color ?? "",
        }
      : null,
    physicalPass: data.physicalPass ?? null,
    category: data.category ?? "temporal",
    entryMethod: data.entryMethod ?? "",
    codigoAcceso: data.codigoAcceso ?? null,
    entryStatus: data.rejected ? "rejected" : "approved",
    legacyIngresoId: ingresoId,
  };

  // providerData para paquetería
  if (visitData.multipleDestinations) {
    doc.providerData = {
      multipleDestinations: visitData.multipleDestinations,
      ...(visitData.destinationCount !== undefined
        ? { destinationCount: visitData.destinationCount }
        : {}),
    };
  }

  // eventId
  if (visitData.eventId) {
    doc.eventId = visitData.eventId;
  }

  // legacyExtras solo si tiene algún campo
  if (Object.keys(extras).length > 0) {
    doc.legacyExtras = extras;
  }

  return doc;
}

// ---------------------------------------------------------------------------
// Procesar un residencial
// ---------------------------------------------------------------------------
async function procesarResidencial(
  db,
  residencialId,
  nombreResidencial,
  ejecutar,
) {
  console.log(
    `\n${ejecutar ? "[EXECUTE]" : "[DRY-RUN]"} Residencial: ${nombreResidencial} (${residencialId})`,
  );

  const ingresosRef = db.collection(`residenciales/${residencialId}/ingresos`);
  const accessEventsRef = db.collection(
    `residenciales/${residencialId}/accessEvents`,
  );

  // Contar totales
  const [ingresosSnap, accessEventsSnap] = await Promise.all([
    ingresosRef.count().get(),
    accessEventsRef.count().get(),
  ]);

  const totalIngresos = ingresosSnap.data().count;
  const totalAccessEvents = accessEventsSnap.data().count;

  console.log(`  ingresos totales:           ${totalIngresos}`);
  console.log(`  accessEvents actuales:      ${totalAccessEvents}`);

  // Obtener IDs que ya existen en accessEvents (para detectar ya migrados / dual-write)
  // Usamos legacyIngresoId para identificar los ya migrados, y también el propio ID del doc
  // En la práctica: todos los docs de dual-write tienen el mismo ID en ambas colecciones
  // Los docs legacy aún no están en accessEvents → los migramos
  // Estrategia: obtener todos los IDs de accessEvents y comparar contra ingresos
  console.log(`  Leyendo IDs de accessEvents...`);
  const existingIds = new Set();
  const aePage = await accessEventsRef.select().get();
  aePage.forEach((doc) => existingIds.add(doc.id));

  // Solo migrar docs legacy (antes del dual-write, 15 abril 2026).
  // Los docs del periodo dual-write ya existen en accessEvents con IDs propios de Flutter.
  // Migrar todos los ingresos causaría duplicados para los ~963 docs del periodo dual-write.
  const DUAL_WRITE_START = new Date("2026-04-15T00:00:00.000Z");
  console.log(
    `  Leyendo docs de ingresos con timestamp < ${DUAL_WRITE_START.toISOString()}...`,
  );
  const ingresosAll = await ingresosRef
    .where("timestamp", "<", DUAL_WRITE_START)
    .get();

  const aMigrar = [];
  ingresosAll.forEach((doc) => {
    if (!existingIds.has(doc.id)) {
      aMigrar.push({ id: doc.id, data: doc.data() });
    }
  });

  console.log(`  ya en accessEvents:         ${existingIds.size}`);
  console.log(`  a migrar (legacy):          ${aMigrar.length}`);

  if (aMigrar.length === 0) {
    console.log(`  Nada que migrar.`);
    return {
      residencialId,
      total: totalIngresos,
      yaMigrados: existingIds.size,
      aMigrar: 0,
      migrados: 0,
    };
  }

  // Mostrar sample doc
  const sample = aMigrar[0];
  const sampleMapped = mapIngresoToAccessEvent(sample.data, sample.id);
  console.log(`  sample doc (id=${sample.id}):`);
  console.log(
    `    entryAt: ${sampleMapped.entryAt?.toDate ? sampleMapped.entryAt.toDate().toISOString() : sampleMapped.entryAt}`,
  );
  console.log(`    subject.name: ${sampleMapped.subject.name}`);
  console.log(
    `    unit: ${sampleMapped.unit.street} #${sampleMapped.unit.number}`,
  );
  console.log(`    category: ${sampleMapped.category}`);
  console.log(`    entryStatus: ${sampleMapped.entryStatus}`);

  const BATCH_SIZE = 400;
  const batchesNecesarios = Math.ceil(aMigrar.length / BATCH_SIZE);
  console.log(`  batches necesarios:         ${batchesNecesarios}`);

  if (!ejecutar) {
    return {
      residencialId,
      total: totalIngresos,
      yaMigrados: existingIds.size,
      aMigrar: aMigrar.length,
      migrados: 0,
    };
  }

  // Ejecutar migración en batches
  let migrados = 0;
  for (let i = 0; i < aMigrar.length; i += BATCH_SIZE) {
    const chunk = aMigrar.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const { id, data } of chunk) {
      const mapped = mapIngresoToAccessEvent(data, id);
      batch.set(accessEventsRef.doc(id), mapped);
    }
    await batch.commit();
    migrados += chunk.length;
    process.stdout.write(
      `\r  Progreso: ${migrados}/${aMigrar.length} docs escritos`,
    );
  }
  console.log(`\n  Migración completada: ${migrados} docs escritos`);

  // Verificar conteo final
  const finalSnap = await accessEventsRef.count().get();
  console.log(`  accessEvents después:       ${finalSnap.data().count}`);

  return {
    residencialId,
    total: totalIngresos,
    yaMigrados: existingIds.size,
    aMigrar: aMigrar.length,
    migrados,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const ejecutar = args.includes("--execute");
  const dryRun = !ejecutar; // dry-run es el default
  const residencialIdx = args.indexOf("--residencial");
  const residencialTarget =
    residencialIdx !== -1 ? args[residencialIdx + 1] : null;

  console.log("=".repeat(60));
  console.log("Migración ingresos → accessEvents");
  console.log(
    `Modo: ${ejecutar ? "EXECUTE (escribirá en Firestore)" : "DRY-RUN (solo lectura)"}`,
  );
  if (residencialTarget)
    console.log(`Residencial objetivo: ${residencialTarget}`);
  console.log("=".repeat(60));

  loadEnv();
  const db = initAdmin();

  // Obtener residenciales
  let residencialesSnap;
  if (residencialTarget) {
    const doc = await db
      .collection("residenciales")
      .doc(residencialTarget)
      .get();
    if (!doc.exists) {
      console.error(`Error: residencial ${residencialTarget} no encontrado`);
      process.exit(1);
    }
    residencialesSnap = [doc];
  } else {
    const snap = await db.collection("residenciales").get();
    residencialesSnap = snap.docs;
  }

  const resultados = [];
  for (const resDoc of residencialesSnap) {
    const nombre = resDoc.data().nombre || resDoc.data().name || resDoc.id;
    const resultado = await procesarResidencial(
      db,
      resDoc.id,
      nombre,
      ejecutar,
    );
    resultados.push(resultado);
  }

  // Resumen
  console.log("\n" + "=".repeat(60));
  console.log("RESUMEN");
  console.log("=".repeat(60));
  let totalAMigrar = 0;
  let totalMigrados = 0;
  for (const r of resultados) {
    console.log(
      `${r.residencialId}: ${r.aMigrar} a migrar, ${r.migrados} migrados`,
    );
    totalAMigrar += r.aMigrar;
    totalMigrados += r.migrados;
  }
  console.log(`\nTotal a migrar:  ${totalAMigrar}`);
  if (ejecutar) {
    console.log(`Total migrados:  ${totalMigrados}`);
    console.log(
      "\nVerificacion: revisa los conteos anteriores (accessEvents despues).",
    );
    console.log(
      "Tambien puedes revisar 5 docs al azar para confirmar que el mapper los convierte bien.",
    );
  } else {
    console.log("\nEjecuta con --execute para escribir en Firestore.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
