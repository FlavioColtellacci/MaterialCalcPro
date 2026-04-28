# MaterialCalcPro

Next.js application for construction material calculators: content and SEO metadata are loaded from **Firebase Cloud Firestore** (via the Admin SDK on the server), with optional one-time migration from WordPress exports.

## Requirements

- Node.js 20+
- A Firebase project with Firestore enabled and a **service account** key (see [Environment](#environment))

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` and set at least:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_JSON` — full service account JSON as a **single-line** string (recommended on Vercel), or omit and use `GOOGLE_APPLICATION_CREDENTIALS` pointing to a key file locally.

Never commit `.env` or `.env.local`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run migration:extract` | Build `migration/output/wp-migration-payload.json` from WordPress XML + SQL (see `scripts/migration/README.md`) |
| `npm run migration:seed` | Upsert payload into Firestore |
| `npm run migration:run` | Extract then seed |
| `npm run sync:site-integrations` | Sync GA4 / AdSense / Search Console from env into Firestore `site_settings` |
| `node scripts/recover-firebase-key-from-env.mjs` | Fix multi-line pasted service account in `.env.local` → `.credentials/firebase-sa-local.json` + PATH var |

## Repository layout

| Path | Description |
| --- | --- |
| `src/app/` | App Router pages, layout, `robots.ts`, `sitemap.ts`, `ads.txt` route |
| `src/components/` | UI: site shell, calculators, WordPress-rendered content |
| `src/lib/` | Data access (Firebase Admin, content helpers), calculator formulas |
| `firestore.rules` | Locked-down rules (Admin SDK bypasses rules for server writes) |
| `migration/sql/` | Legacy Postgres schema reference (not used by the Next.js app) |
| `migration/output/` | Generated migration payload (tracked JSON for reproducible seeds) |
| `scripts/migration/` | WordPress → JSON → Firestore tooling |
| `docs/` | Supplementary documentation (e.g. migration source audit) |

Large WordPress trees (`public_html/`), database dumps (`*.sql`), and XML exports (`materialcalcpro*.xml`) are **gitignored** on purpose; keep them outside the repo or only on your machine for `migration:extract`.

## Documentation

- [Migration pipeline](scripts/migration/README.md)
- [Migration source audit](docs/migration-source-audit.md)

## License

Private project (`"private": true` in `package.json`).
