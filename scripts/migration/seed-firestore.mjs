import { readFile } from "node:fs/promises";
import path from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { loadServiceAccountParsed } from "../lib/firebase-env-credentials.mjs";

const PROJECT_ROOT = process.cwd();
const DEFAULT_PAYLOAD = "migration/output/wp-migration-payload.json";
const MAX_WRITES_PER_BATCH = 400;

async function initFirestore() {
  if (getApps().length > 0) {
    return getFirestore();
  }

  const fromEnvId = process.env.FIREBASE_PROJECT_ID?.trim();
  let parsed = loadServiceAccountParsed();
  if (!parsed) {
    throw new Error(
      "Missing credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_JSON_PATH, or GOOGLE_APPLICATION_CREDENTIALS in .env.local.",
    );
  }

  const inferred =
    typeof parsed.project_id === "string"
      ? parsed.project_id.trim()
      : typeof parsed.projectId === "string"
        ? parsed.projectId.trim()
        : "";
  const projectId = fromEnvId || inferred;
  if (!projectId) {
    throw new Error(
      "Could not determine project id. Set FIREBASE_PROJECT_ID or use a service account JSON that includes project_id.",
    );
  }

  initializeApp({
    credential: cert(parsed),
    projectId,
  });
  return getFirestore();
}

async function readPayload(payloadPath) {
  const raw = await readFile(payloadPath, "utf8");
  return JSON.parse(raw);
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {Array<{ ref: import("firebase-admin/firestore").DocumentReference; data: Record<string, unknown> }>} writes
 */
async function commitInBatches(db, writes) {
  for (let i = 0; i < writes.length; i += MAX_WRITES_PER_BATCH) {
    const batch = db.batch();
    const chunk = writes.slice(i, i + MAX_WRITES_PER_BATCH);
    for (const { ref, data } of chunk) {
      batch.set(ref, data, { merge: true });
    }
    await batch.commit();
  }
}

async function seedPayload(payloadPath) {
  const db = await initFirestore();
  const payload = await readPayload(payloadPath);

  /** @type {Array<{ ref: import("firebase-admin/firestore").DocumentReference; data: Record<string, unknown> }>} */
  const writes = [];

  for (const row of payload.pages ?? []) {
    if (!row.slug) continue;
    const { slug, ...rest } = row;
    writes.push({
      ref: db.collection("pages").doc(String(slug)),
      data: { slug, ...rest },
    });
  }

  for (const row of payload.seo_meta ?? []) {
    if (!row.slug) continue;
    const { slug, ...rest } = row;
    writes.push({
      ref: db.collection("seo_meta").doc(String(slug)),
      data: { slug, ...rest },
    });
  }

  for (const row of payload.site_settings ?? []) {
    if (!row.setting_key) continue;
    writes.push({
      ref: db.collection("site_settings").doc(String(row.setting_key)),
      data: { setting_value: row.setting_value },
    });
  }

  for (const row of payload.calculator_content_blocks ?? []) {
    if (!row.slug || !row.block_key) continue;
    const { slug, block_key, ...rest } = row;
    writes.push({
      ref: db
        .collection("pages")
        .doc(String(slug))
        .collection("content_blocks")
        .doc(String(block_key)),
      data: { block_key, ...rest },
    });
  }

  await commitInBatches(db, writes);

  console.log("Firestore seed completed.");
  console.log(
    `Upserted: pages=${(payload.pages ?? []).length}, seo_meta=${(payload.seo_meta ?? []).length}, site_settings=${(payload.site_settings ?? []).length}, content_blocks=${(payload.calculator_content_blocks ?? []).length}`,
  );
}

async function main() {
  const payloadPath = path.resolve(PROJECT_ROOT, process.argv[2] ?? DEFAULT_PAYLOAD);
  await seedPayload(payloadPath);
}

await main();
