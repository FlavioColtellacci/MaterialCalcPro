# MaterialCalcPro

Next.js application for construction material calculators: content and SEO metadata are loaded from **Supabase**, with optional one-time migration from WordPress exports.

## Requirements

- Node.js 20+
- A Supabase project and credentials (see [Environment](#environment))

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` and set at least:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for migration seeding and server-side tasks that need elevated access)

Never commit `.env` or `.env.local`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run migration:extract` | Build `migration/output/wp-migration-payload.json` from WordPress XML + SQL (see `scripts/migration/README.md`) |
| `npm run migration:seed` | Upsert payload into Supabase |
| `npm run migration:run` | Extract then seed |
| `npm run sync:site-integrations` | Sync site integration env values (see script header) |

## Repository layout

| Path | Description |
| --- | --- |
| `src/app/` | App Router pages, layout, `robots.ts`, `sitemap.ts`, `ads.txt` route |
| `src/components/` | UI: site shell, calculators, WordPress-rendered content |
| `src/lib/` | Data access (Supabase, content helpers), calculator formulas |
| `migration/sql/` | Postgres schema for Supabase (run manually in SQL editor) |
| `migration/output/` | Generated migration payload (tracked JSON for reproducible seeds) |
| `scripts/migration/` | WordPress → JSON → Supabase tooling |
| `docs/` | Supplementary documentation (e.g. migration source audit) |

Large WordPress trees (`public_html/`), database dumps (`*.sql`), and XML exports (`materialcalcpro*.xml`) are **gitignored** on purpose; keep them outside the repo or only on your machine for `migration:extract`.

## Documentation

- [Migration pipeline](scripts/migration/README.md)
- [Migration source audit](docs/migration-source-audit.md)

## License

Private project (`"private": true` in `package.json`).
