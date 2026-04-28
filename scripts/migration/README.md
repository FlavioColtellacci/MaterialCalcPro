# Migration pipeline

Node scripts that read **gitignored** WordPress exports (XML + SQL) and produce a normalized JSON payload, then seed **Cloud Firestore** (via Firebase Admin).

Background and source mapping: [docs/migration-source-audit.md](../../docs/migration-source-audit.md).

## Commands

- `npm run migration:extract`
  - Parses `materialcalcprocom.WordPress.2026-04-13.xml` and `u589264389_GZdzZ.sql`
  - Generates `migration/output/wp-migration-payload.json`
- `npm run migration:seed`
  - Upserts payload into Firestore collections (requires service account env vars)
  - Requires `FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT_JSON`
- `npm run migration:run`
  - Runs extract and seed in sequence

## Firestore layout

- `pages/{slug}` — page body (`slug`, `title`, `body_html`, `excerpt`, …)
- `seo_meta/{slug}` — SEO row (`title`, `description`, `canonical`, `og`, `twitter`)
- `site_settings/{setting_key}` — `{ setting_value }` (same keys as before: `site_name`, `ga4_measurement_id`, …)
- `pages/{slug}/content_blocks/{block_key}` — calculator blocks (`sort_order`, `heading`, `content_html`, …)

Deploy rules (optional): `npx -y firebase-tools@latest deploy --only firestore:rules` from repo root after `firebase login` and `firebase use <project>`.

## Script layout

- `build-migration-payload.mjs`: builds normalized JSON payload from WordPress data.
- `seed-firestore.mjs`: seeds/upserts payload into Firestore.
- `lib/wp-xml.mjs`: parser for XML pages, calculator scripts, and content blocks.
- `lib/wp-sql.mjs`: parser for SQL options and analytics/ad/SEO settings.

Optional (for SQL-based seeding or tooling outside the Node upsert path):

- `build-seed-sql-chunks.mjs`: writes chunked SQL under `migration/output/seed_chunks/` (gitignored).
- `build-seed-statement-files.mjs`: writes one statement per file under `migration/output/seed_statements/` (gitignored).

## Legacy Supabase

Older docs may reference Supabase SQL (`migration/sql/001_content_calculator_seo_schema.sql`). The live app reads only from Firestore; that SQL file is no longer required for production.
