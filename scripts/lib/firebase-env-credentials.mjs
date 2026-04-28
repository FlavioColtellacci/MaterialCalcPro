import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";

/** Parse FIREBASE_SERVICE_ACCOUNT_JSON (fixes common paste issues from .env). */
export function parseServiceAccountInline(raw) {
  let s = String(raw).replace(/^\uFEFF/, "").trim();
  // Whole value wrapped in single quotes
  if (s.startsWith("'") && s.endsWith("'") && s.length > 2) {
    s = s.slice(1, -1);
  }
  try {
    return JSON.parse(s);
  } catch (firstErr) {
    try {
      const start = s.indexOf("{");
      const end = s.lastIndexOf("}");
      if (start >= 0 && end > start) {
        return JSON.parse(s.slice(start, end + 1));
      }
    } catch {
      /* fall through */
    }
    throw new Error(
      `${firstErr instanceof Error ? firstErr.message : "Invalid JSON"}. If the key is multiline, put the JSON file on disk and set FIREBASE_SERVICE_ACCOUNT_JSON_PATH or GOOGLE_APPLICATION_CREDENTIALS.`,
    );
  }
}

/** Load credential object for firebase-admin.cert(). */
export function loadServiceAccountParsed() {
  const jsonPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PATH?.trim();
  if (jsonPath && existsSync(jsonPath)) {
    return JSON.parse(readFileSync(jsonPath, "utf8"));
  }
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (credPath && existsSync(credPath)) {
    return JSON.parse(readFileSync(credPath, "utf8"));
  }
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (inline) {
    return parseServiceAccountInline(inline);
  }
  return null;
}
