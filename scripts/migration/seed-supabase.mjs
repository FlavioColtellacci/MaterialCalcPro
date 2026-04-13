import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const PROJECT_ROOT = process.cwd();
const DEFAULT_PAYLOAD = "migration/output/wp-migration-payload.json";
const UPSERT_BATCH_SIZE = 50;

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set it before running seed script.`);
  }
  return value;
}

async function readPayload(payloadPath) {
  const raw = await readFile(payloadPath, "utf8");
  return JSON.parse(raw);
}

async function upsertInBatches(supabase, table, rows, onConflict) {
  if (!rows.length) return;
  for (let index = 0; index < rows.length; index += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(index, index + UPSERT_BATCH_SIZE);
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict, ignoreDuplicates: false });
    if (error) {
      throw new Error(
        `Failed upserting ${table} (batch starting at ${index}): ${error.message}`,
      );
    }
  }
}

async function seedPayload(payloadPath) {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const payload = await readPayload(payloadPath);

  await upsertInBatches(supabase, "pages", payload.pages, "slug");
  await upsertInBatches(supabase, "seo_meta", payload.seo_meta, "slug");
  await upsertInBatches(
    supabase,
    "calculator_definitions",
    payload.calculator_definitions,
    "slug",
  );
  await upsertInBatches(
    supabase,
    "calculator_content_blocks",
    payload.calculator_content_blocks,
    "slug,block_key",
  );
  await upsertInBatches(
    supabase,
    "raw_wp_items",
    payload.raw_wp_items,
    "source_post_id",
  );
  await upsertInBatches(
    supabase,
    "site_settings",
    payload.site_settings,
    "setting_key",
  );

  console.log("Supabase seed completed.");
  console.log(
    `Inserted/updated rows: pages=${payload.pages.length}, seo_meta=${payload.seo_meta.length}, calculators=${payload.calculator_definitions.length}`,
  );
}

async function main() {
  const payloadPath = path.resolve(PROJECT_ROOT, process.argv[2] ?? DEFAULT_PAYLOAD);
  await seedPayload(payloadPath);
}

await main();
