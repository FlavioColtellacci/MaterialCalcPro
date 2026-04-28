/** Parse FIREBASE_SERVICE_ACCOUNT_JSON (.env truncation / paste issues). */

export function parseServiceAccountInlineJson(raw: string): Record<string, unknown> {
  let s = raw.replace(/^\uFEFF/, "").trim();
  if (s.startsWith("'") && s.endsWith("'") && s.length > 2) {
    s = s.slice(1, -1);
  }
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(s.slice(start, end + 1)) as Record<string, unknown>;
    }
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON");
  }
}
