# Migration pipeline

Node scripts that read **gitignored** WordPress exports (XML + SQL) and produce a normalized JSON payload for Supabase. Background and source mapping: [docs/migration-source-audit.md](../../docs/migration-source-audit.md).

## Commands

- `npm run migration:extract`
  - Parses `materialcalcprocom.WordPress.2026-04-13.xml` and `u589264389_GZdzZ.sql`
  - Generates `migration/output/wp-migration-payload.json`
- `npm run migration:seed`
  - Upserts payload rows into Supabase tables
  - Requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- `npm run migration:run`
  - Runs extract and seed in sequence

## Table Schema

Run `migration/sql/001_content_calculator_seo_schema.sql` in Supabase SQL editor first to create:

- `pages`
- `seo_meta`
- `calculator_definitions`
- `calculator_content_blocks`
- `site_settings`
- `raw_wp_items`

## Script Layout

- `build-migration-payload.mjs`: builds normalized JSON payload from WordPress data.
- `seed-supabase.mjs`: seeds/upserts payload into Supabase.
- `lib/wp-xml.mjs`: parser for XML pages, calculator scripts, and content blocks.
- `lib/wp-sql.mjs`: parser for SQL options and analytics/ad/SEO settings.

Optional (for SQL-based seeding or tooling outside the Node upsert path):

- `build-seed-sql-chunks.mjs`: writes chunked SQL under `migration/output/seed_chunks/` (gitignored).
- `build-seed-statement-files.mjs`: writes one statement per file under `migration/output/seed_statements/` (gitignored).
