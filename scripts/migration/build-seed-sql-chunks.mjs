/**
 * Reads migration/output/wp-migration-payload.json and writes SQL chunks
 * under migration/output/seed_chunks/ for apply via Supabase SQL / MCP execute_sql.
 *
 * Usage: node scripts/migration/build-seed-sql-chunks.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const PAYLOAD_PATH = path.join(
  PROJECT_ROOT,
  "migration/output/wp-migration-payload.json",
);
const OUT_DIR = path.join(PROJECT_ROOT, "migration/output/seed_chunks");
/** Keep chunks small so Supabase MCP `execute_sql` accepts the payload. */
const MAX_CHUNK = 18_000;

function sqlString(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  return `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

function sqlJson(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function sqlTimestamptz(value) {
  if (!value) return "NULL";
  const normalized = String(value).replace(" ", "T");
  return `'${normalized.replace(/'/g, "''")}'::timestamptz`;
}

async function main() {
  const raw = await readFile(PAYLOAD_PATH, "utf8");
  const payload = JSON.parse(raw);

  const statements = [];

  statements.push(`truncate table
    public.calculator_content_blocks,
    public.calculator_definitions,
    public.seo_meta,
    public.raw_wp_items,
    public.pages,
    public.site_settings
  restart identity cascade;`);

  for (const row of payload.pages) {
    statements.push(`insert into public.pages (slug, title, body_html, excerpt, status, publish_date, source_post_id)
      values (${sqlString(row.slug)}, ${sqlString(row.title)}, ${sqlString(row.body_html)}, ${row.excerpt === null || row.excerpt === undefined ? "NULL" : sqlString(row.excerpt)}, ${sqlString(row.status)}, ${sqlTimestamptz(row.publish_date)}, ${Number(row.source_post_id)})
      on conflict (slug) do update set
        title = excluded.title,
        body_html = excluded.body_html,
        excerpt = excluded.excerpt,
        status = excluded.status,
        publish_date = excluded.publish_date,
        source_post_id = excluded.source_post_id;`);
  }

  for (const row of payload.seo_meta) {
    statements.push(`insert into public.seo_meta (slug, title, description, canonical, og, twitter)
      values (${sqlString(row.slug)}, ${sqlString(row.title)}, ${row.description == null ? "NULL" : sqlString(row.description)}, ${row.canonical == null ? "NULL" : sqlString(row.canonical)}, ${sqlJson(row.og ?? {})}, ${sqlJson(row.twitter ?? {})})
      on conflict (slug) do update set
        title = excluded.title,
        description = excluded.description,
        canonical = excluded.canonical,
        og = excluded.og,
        twitter = excluded.twitter;`);
  }

  for (const row of payload.calculator_definitions) {
    statements.push(`insert into public.calculator_definitions (slug, source_post_id, wrapper_id, input_schema, unit_systems, formula_source, copy_blocks)
      values (${sqlString(row.slug)}, ${Number(row.source_post_id)}, ${row.wrapper_id == null ? "NULL" : sqlString(row.wrapper_id)}, ${sqlJson(row.input_schema ?? null)}, ${sqlJson(row.unit_systems ?? null)}, ${sqlJson(row.formula_source ?? {})}, ${sqlJson(row.copy_blocks ?? {})})
      on conflict (slug) do update set
        source_post_id = excluded.source_post_id,
        wrapper_id = excluded.wrapper_id,
        input_schema = excluded.input_schema,
        unit_systems = excluded.unit_systems,
        formula_source = excluded.formula_source,
        copy_blocks = excluded.copy_blocks;`);
  }

  for (const row of payload.calculator_content_blocks) {
    statements.push(`insert into public.calculator_content_blocks (slug, block_key, block_type, heading, content_html, sort_order)
      values (${sqlString(row.slug)}, ${sqlString(row.block_key)}, ${row.block_type == null ? "NULL" : sqlString(row.block_type)}, ${row.heading == null ? "NULL" : sqlString(row.heading)}, ${sqlString(row.content_html)}, ${Number(row.sort_order)})
      on conflict (slug, block_key) do update set
        block_type = excluded.block_type,
        heading = excluded.heading,
        content_html = excluded.content_html,
        sort_order = excluded.sort_order;`);
  }

  // Optional audit table; payloads are huge and break MCP SQL size limits.
  // Full rows are still produced by `npm run migration:seed` with the service role.
  // for (const row of payload.raw_wp_items) { ... }

  for (const row of payload.site_settings) {
    statements.push(`insert into public.site_settings (setting_key, setting_value)
      values (${sqlString(row.setting_key)}, ${sqlJson(row.setting_value)})
      on conflict (setting_key) do update set setting_value = excluded.setting_value;`);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const chunks = [];
  let current = "";
  for (const stmt of statements) {
    if (stmt.length > MAX_CHUNK) {
      if (current.length) {
        chunks.push(current);
        current = "";
      }
      chunks.push(stmt);
      continue;
    }
    const next = current.length ? `${current}\n${stmt}` : stmt;
    if (next.length > MAX_CHUNK && current.length) {
      chunks.push(current);
      current = stmt;
    } else {
      current = next;
    }
  }
  if (current.length) {
    chunks.push(current);
  }

  let index = 0;
  for (const chunk of chunks) {
    index += 1;
    const filePath = path.join(OUT_DIR, `chunk_${String(index).padStart(3, "0")}.sql`);
    await writeFile(filePath, `${chunk}\n`, "utf8");
  }

  console.log(`Wrote ${chunks.length} chunk(s) to ${OUT_DIR}`);
}

await main();
