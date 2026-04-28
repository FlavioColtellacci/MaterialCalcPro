/**
 * Upserts GA4, AdSense, and Search Console verification into Firestore `site_settings`
 * from environment variables (service account).
 *
 * Run from project root:
 *   npm run sync:site-integrations
 *
 * Reads:
 *   - NEXT_PUBLIC_GA4_MEASUREMENT_ID
 *   - NEXT_PUBLIC_ADSENSE_CLIENT_ID (use full ca-pub-… form)
 *   - GOOGLE_SITE_VERIFICATION (HTML tag content only)
 *
 * Requires:
 *   - FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS (path to key file)
 *   - FIREBASE_PROJECT_ID (optional if the JSON includes project_id)
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { loadServiceAccountParsed } from "./lib/firebase-env-credentials.mjs";

function trimOrNull(name) {
  const value = process.env[name];
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim();
}

function normalizeAdsenseClientId(raw) {
  const s = raw.trim();
  if (s.startsWith("ca-pub-")) return s;
  if (s.startsWith("pub-")) return `ca-${s}`;
  return s;
}

function resolveProjectId(parsed) {
  const fromEnv = trimOrNull("FIREBASE_PROJECT_ID");
  if (fromEnv) return fromEnv;
  if (!parsed) return null;
  const raw = parsed.project_id ?? parsed.projectId;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return null;
}

const parsedAccount = loadServiceAccountParsed();
const projectId = resolveProjectId(parsedAccount);

if (!projectId || !parsedAccount) {
  console.error(
    "Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS (and FIREBASE_PROJECT_ID if project_id is missing from the JSON).",
  );
  process.exit(1);
}

const ga4 = trimOrNull("NEXT_PUBLIC_GA4_MEASUREMENT_ID");
const adsenseRaw = trimOrNull("NEXT_PUBLIC_ADSENSE_CLIENT_ID");
const verification = trimOrNull("GOOGLE_SITE_VERIFICATION");

if (!ga4 && !adsenseRaw && !verification) {
  console.error(
    "Nothing to sync. Set one or more of: NEXT_PUBLIC_GA4_MEASUREMENT_ID, NEXT_PUBLIC_ADSENSE_CLIENT_ID, GOOGLE_SITE_VERIFICATION",
  );
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert(parsedAccount),
    projectId,
  });
}

const db = getFirestore();
const batch = db.batch();

if (ga4) {
  if (!ga4.startsWith("G-")) {
    console.warn("Warning: GA4 measurement ID usually starts with G-");
  }
  batch.set(
    db.collection("site_settings").doc("ga4_measurement_id"),
    { setting_value: ga4 },
    { merge: true },
  );
}

if (adsenseRaw) {
  const clientId = normalizeAdsenseClientId(adsenseRaw);
  if (!clientId.includes("pub-")) {
    console.error("AdSense client id should look like ca-pub-…");
    process.exit(1);
  }
  batch.set(
    db.collection("site_settings").doc("adsense_client_ids"),
    { setting_value: [clientId] },
    { merge: true },
  );
}

if (verification) {
  batch.set(
    db.collection("site_settings").doc("google_site_verification"),
    { setting_value: verification },
    { merge: true },
  );
}

await batch.commit();

console.log("Synced Firestore site_settings for:", [
  ga4 && "ga4_measurement_id",
  adsenseRaw && "adsense_client_ids",
  verification && "google_site_verification",
]
  .filter(Boolean)
  .join(", "));
