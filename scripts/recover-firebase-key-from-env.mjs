/**
 * Recovers Firebase service-account JSON when FIREBASE_SERVICE_ACCOUNT_JSON was split across
 * multiple lines (.env parsers then only expose "{" via --env-file).
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const ENV_REL = ".env.local";
const OUT_DIR = ".credentials";
const OUT_FILE = path.join(OUT_DIR, "firebase-sa-local.json");

const envPath = path.join(PROJECT_ROOT, ENV_REL);
const raw = readFileSync(envPath, "utf8");
const lines = raw.split(/\r?\n/);

const keyLineIndex = lines.findIndex((l) => l.startsWith("FIREBASE_SERVICE_ACCOUNT_JSON="));
if (keyLineIndex === -1) {
  console.error(`No FIREBASE_SERVICE_ACCOUNT_JSON= found in ${ENV_REL}`);
  process.exit(1);
}

function extractJsonObject(blob) {
  const start = blob.indexOf("{");
  const end = blob.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  const slice = blob.slice(start, end + 1);
  try {
    JSON.parse(slice);
    return slice;
  } catch {
    return null;
  }
}

const head = lines[keyLineIndex].slice("FIREBASE_SERVICE_ACCOUNT_JSON=".length);

let recovered = extractJsonObject(head);
let endLine = keyLineIndex;

if (!recovered) {
  let blob = head;
  for (let j = keyLineIndex + 1; j < lines.length; j++) {
    blob += "\n" + lines[j];
    const slice = extractJsonObject(blob);
    if (slice) {
      recovered = slice;
      endLine = j;
      break;
    }
  }
}

if (!recovered) {
  console.error(
    "Could not recover JSON from .env.local. Paste the key as ONE minified line, or use FIREBASE_SERVICE_ACCOUNT_JSON_PATH.",
  );
  process.exit(1);
}

mkdirSync(path.join(PROJECT_ROOT, OUT_DIR), { recursive: true });
const absOut = path.join(PROJECT_ROOT, OUT_FILE);
writeFileSync(absOut, `${recovered}\n`, "utf8");

const replacement = [...lines.slice(0, keyLineIndex), `FIREBASE_SERVICE_ACCOUNT_JSON_PATH=${absOut}`, ...lines.slice(endLine + 1)];

writeFileSync(
  envPath,
  replacement.join("\n") + (/\n$/u.test(raw) ? "" : "\n"),
  "utf8",
);

console.log(`Wrote ${OUT_FILE}`);
console.log("Updated .env.local: FIREBASE_SERVICE_ACCOUNT_JSON_PATH (removed multi-line FIREBASE_SERVICE_ACCOUNT_JSON block).");
