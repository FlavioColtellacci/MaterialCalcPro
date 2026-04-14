/**
 * Upserts GA4, AdSense, and Search Console verification into Supabase `site_settings`
 * from environment variables. Uses the service role key (bypasses RLS).
 *
 * Run from project root (loads .env.local via npm script):
 *   npm run sync:site-integrations
 *
 * Reads:
 *   - NEXT_PUBLIC_GA4_MEASUREMENT_ID
 *   - NEXT_PUBLIC_ADSENSE_CLIENT_ID (use full ca-pub-… form)
 *   - GOOGLE_SITE_VERIFICATION (HTML tag content only)
 */

import { createClient } from "@supabase/supabase-js";

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

const supabaseUrl = trimOrNull("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = trimOrNull("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.",
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

const rows = [];

if (ga4) {
  if (!ga4.startsWith("G-")) {
    console.warn("Warning: GA4 measurement ID usually starts with G-");
  }
  rows.push({ setting_key: "ga4_measurement_id", setting_value: ga4 });
}

if (adsenseRaw) {
  const clientId = normalizeAdsenseClientId(adsenseRaw);
  if (!clientId.includes("pub-")) {
    console.error("AdSense client id should look like ca-pub-…");
    process.exit(1);
  }
  rows.push({ setting_key: "adsense_client_ids", setting_value: [clientId] });
}

if (verification) {
  rows.push({
    setting_key: "google_site_verification",
    setting_value: verification,
  });
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error } = await supabase
  .from("site_settings")
  .upsert(rows, { onConflict: "setting_key", ignoreDuplicates: false });

if (error) {
  console.error("Supabase upsert failed:", error.message);
  process.exit(1);
}

console.log(
  "Synced site_settings keys:",
  rows.map((r) => r.setting_key).join(", "),
);
