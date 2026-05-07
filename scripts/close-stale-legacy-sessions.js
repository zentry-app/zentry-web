/**
 * close-stale-legacy-sessions.js
 *
 * Cierra sesiones legacy migradas que quedaron "activas" sin exitAt.
 * Criterio: doc migrado (legacyIngresoId existe y == docId) con exitAt == null
 *           y entryAt de más de STALE_HOURS horas atrás.
 *
 * Uso:
 *   node scripts/close-stale-legacy-sessions.js --dry-run
 *   node scripts/close-stale-legacy-sessions.js --execute
 *   node scripts/close-stale-legacy-sessions.js --execute --residencial mCTs294LGLkGvL9TTvaQ
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const STALE_HOURS = 12; // sesiones de más de 12h sin cierre = ghost

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim(),
      v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

function initAdmin() {
  const sa = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, "base64").toString(),
  );
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  return admin.firestore();
}

async function procesarResidencial(db, resId, nombre, ejecutar) {
  console.log(`\n${ejecutar ? "[EXECUTE]" : "[DRY-RUN]"} ${nombre} (${resId})`);

  const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);
  console.log(`  Cutoff: entryAt < ${cutoff.toISOString()} (hace ${STALE_HOURS}h)`);

  // Leer todos los accessEvents con exitAt == null
  const snap = await db
    .collection(`residenciales/${resId}/accessEvents`)
    .where("exitAt", "==", null)
    .get();

  console.log(`  Docs con exitAt==null: ${snap.size}`);

  const stale = [];
  snap.forEach((doc) => {
    const d = doc.data();
    // Solo docs migrados (legacyIngresoId existe y == docId)
    if (!d.legacyIngresoId || d.legacyIngresoId !== doc.id) return;
    // Solo si entryAt es anterior al cutoff
    const entryAt = d.entryAt?.toDate?.();
    if (!entryAt || entryAt >= cutoff) return;
    stale.push({ id: doc.id, entryAt, name: d.subject?.name || "(sin nombre)" });
  });

  console.log(`  Sesiones ghost a cerrar: ${stale.length}`);

  if (stale.length === 0) {
    console.log(`  Nada que cerrar.`);
    return { resId, stale: 0, cerrados: 0 };
  }

  // Mostrar sample
  const oldest = stale.sort((a, b) => a.entryAt - b.entryAt)[0];
  const horasAtras = Math.round((Date.now() - oldest.entryAt.getTime()) / 3600000);
  console.log(`  Más antigua: "${oldest.name}" — entryAt hace ${horasAtras}h`);
  console.log(`  Sample (5): ${stale.slice(0, 5).map(s => s.name).join(", ")}`);

  if (!ejecutar) {
    return { resId, stale: stale.length, cerrados: 0 };
  }

  // Cerrar en batches — exitAt = entryAt (indica salida no registrada)
  const BATCH_SIZE = 400;
  let cerrados = 0;
  for (let i = 0; i < stale.length; i += BATCH_SIZE) {
    const chunk = stale.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const { id, entryAt } of chunk) {
      // exitAt = entryAt para indicar que no hay registro de salida real
      batch.update(
        db.doc(`residenciales/${resId}/accessEvents/${id}`),
        { exitAt: admin.firestore.Timestamp.fromDate(entryAt) },
      );
    }
    await batch.commit();
    cerrados += chunk.length;
    process.stdout.write(`\r  Progreso: ${cerrados}/${stale.length}`);
  }
  console.log(`\n  Cerrados: ${cerrados} docs`);

  return { resId, stale: stale.length, cerrados };
}

async function main() {
  const args = process.argv.slice(2);
  const ejecutar = args.includes("--execute");
  const resIdx = args.indexOf("--residencial");
  const resTarget = resIdx !== -1 ? args[resIdx + 1] : null;

  console.log("=".repeat(60));
  console.log("Cierre de sesiones ghost (legacy migradas sin exitAt)");
  console.log(`Modo: ${ejecutar ? "EXECUTE" : "DRY-RUN"}`);
  console.log("=".repeat(60));

  loadEnv();
  const db = initAdmin();

  let resDocs;
  if (resTarget) {
    const d = await db.collection("residenciales").doc(resTarget).get();
    if (!d.exists) { console.error("Residencial no encontrado"); process.exit(1); }
    resDocs = [d];
  } else {
    resDocs = (await db.collection("residenciales").get()).docs;
  }

  const resultados = [];
  for (const rd of resDocs) {
    const nombre = rd.data().nombre || rd.data().name || rd.id;
    resultados.push(await procesarResidencial(db, rd.id, nombre, ejecutar));
  }

  console.log("\n" + "=".repeat(60));
  console.log("RESUMEN");
  console.log("=".repeat(60));
  let totalStale = 0, totalCerrados = 0;
  for (const r of resultados) {
    console.log(`${r.resId}: ${r.stale} ghost, ${r.cerrados} cerrados`);
    totalStale += r.stale;
    totalCerrados += r.cerrados;
  }
  console.log(`\nTotal ghost: ${totalStale}`);
  if (ejecutar) console.log(`Total cerrados: ${totalCerrados}`);
  else console.log("\nEjecuta con --execute para cerrarlos.");

  process.exit(0);
}

main().catch((e) => { console.error("Error:", e); process.exit(1); });
