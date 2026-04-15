# Source audit (WordPress → Next.js + Supabase)

This document inventories the WordPress export artifacts used for migration and maps them into the Supabase content model (pages, calculators, SEO, integrations). It is a historical reference for the extraction pipeline under `scripts/migration/`.

## Audited inputs (local exports, gitignored)

- `materialcalcprocom.WordPress.2026-04-13.xml`
- `u589264389_GZdzZ.sql`
- Theme tokens were taken from the former WordPress `pixl` theme (`theme.json` / `style.css` under a local `wp-content/themes/pixl/` tree). The Next.js app now owns styling; no theme bundle is kept in this repository.

## Migration Matrix (High Level)

| Domain | WordPress source | Extraction keys | Supabase target | Notes |
| --- | --- | --- | --- | --- |
| Pages/content | XML + SQL (`wp_posts`) | `post_type=page`, `post_name`, `post_title`, `post_content`, `post_excerpt`, `post_status`, `post_date` | `pages` | XML and SQL show matching page payloads; XML is easier for parser-first extraction, SQL is fallback for completeness checks. |
| Calculators | XML + SQL (`wp_posts`) | Inline `<style>` + `<script>` inside `post_content`; calculator wrappers `id="mcp-*"` | `calculator_definitions`, `calculator_content_blocks`, `pages` | Each calculator page embeds bespoke JS formula logic that must become typed React logic. |
| SEO | SQL (`wp_options`, `wp_postmeta`) + XML | Global Rank Math options in `wp_options`; per-page post meta mostly absent except processing/status fields | `seo_meta`, `site_settings` | No rich per-page SEO title/description meta found in export; derive baseline from page title + excerpt/content, then enrich manually if needed. |
| Integrations | SQL (`wp_options`, `wpcode` post type) + page content | Google Site Kit, AdSense snippet, verification meta, plugin state | `site_settings` (+ runtime env) | AdSense client IDs are inconsistent across options/snippet and should be validated before cutover. |
| Theme/design | `theme.json` + `style.css` | Color palette, typography, spacing, shadows, link/form/nav behavior | App theme tokens + global CSS | Pixl design primitives are fully extractable and can seed the Next.js design system. |

## Page Inventory (Route Parity Scope)

| Route target | WP slug (`post_name`) | WP post ID | Source confirmation | Migration handling |
| --- | --- | --- | --- | --- |
| `/` | `home` | `11` | XML has `post_type=page`, link `https://materialcalcpro.com/`; SQL has matching page row | Map to homepage route; keep internal calculator links from content blocks. |
| `/concrete-calculator/` | `concrete-calculator` | `12` | XML + SQL present | Keep intro + FAQ/related links in content blocks; port JS logic to React calculator module. |
| `/paint-calculator/` | `paint-calculator` | `13` | XML + SQL present | Same as above. |
| `/tile-calculator/` | `tile-calculator` | `14` | XML + SQL present | Same as above. |
| `/gravel-calculator/` | `gravel-calculator` | `15` | XML + SQL present | Same as above. |
| `/drywall-calculator/` | `drywall-calculator` | `16` | XML + SQL present | Same as above. |
| `/roofing-calculator/` | `roofing-calculator` | `17` | XML + SQL present | Same as above. |
| `/flooring-calculator/` | `flooring-calculator` | `18` | XML + SQL present | Same as above. |
| `/asphalt-calculator/` | `asphalt-calculator` | `19` | XML + SQL present | Same as above. |
| `/fence-post-calculator/` | `fence-post-calculator` | `20` | XML + SQL present | Same as above. |
| `/brick-calculator/` | `brick-calculator` | `21` | XML + SQL present | Same as above. |
| `/privacy/` | `privacy` | `23` | XML + SQL present | Migrate legal copy as standard page content. |

## Calculator Extraction Matrix

| Calculator page slug | Wrapper ID in source | Inline JS present | Inline CSS present | Extraction plan |
| --- | --- | --- | --- | --- |
| `concrete-calculator` | `mcp-concrete-calculator` | Yes (`<script>` with `calculate()` and listeners) | Yes | Parse input fields + units + formula branches into typed schema + formula engine. |
| `paint-calculator` | `mcp-paint-calc` | Yes | Yes | Same pattern. |
| `tile-calculator` | `mcp-tile-calc` | Yes | Yes | Same pattern. |
| `gravel-calculator` | `mcp-gravel-calc` | Yes | Yes | Same pattern. |
| `drywall-calculator` | `mcp-drywall-calc` | Yes | Yes | Same pattern. |
| `roofing-calculator` | `mcp-roof-calc` | Yes | Yes | Same pattern. |
| `flooring-calculator` | `mcp-floor-calc` | Yes | Yes | Same pattern. |
| `asphalt-calculator` | `mcp-asphalt-calc` | Yes | Yes | Same pattern. |
| `fence-post-calculator` | `mcp-fence-calc` | Yes | Yes | Same pattern. |
| `brick-calculator` | `mcp-brick-calc` | Yes | Yes | Same pattern. |

## SEO + Integration Mapping Matrix

| Concern | WP source key/value | Supabase destination | Action |
| --- | --- | --- | --- |
| Canonical domain and base URLs | `siteurl=https://materialcalcpro.com`, `home=https://materialcalcpro.com` | `site_settings.canonical_base_url` | Use as canonical base for metadata + sitemap. |
| Front page configuration | `show_on_front=page`, `page_on_front=11` | `site_settings.home_slug` (derived) | Resolve `post_id=11` => `home` slug. |
| Privacy policy configuration | `wp_page_for_privacy_policy=3` while scoped privacy page is `post_id=23` | `site_settings.privacy_slug` | Flag mismatch; verify intended legal page before launch. |
| SEO plugin and modules | `active_plugins` includes Rank Math; `rank_math_modules` contains analytics/sitemap/etc | `site_settings.seo_provider` + `site_settings.seo_flags` | Capture provider + enabled module context. |
| Per-page SEO metadata | No clear per-page `rank_math_title/description/canonical` found in `wp_postmeta`; mainly `rank_math_internal_links_processed` and score fields | `seo_meta` | Backfill from page title/excerpt/content initially; optional manual SEO enrichment pass. |
| GA4 tracking | `googlesitekit_analytics-4_settings` contains `measurementID=G-MN1WN2RTWH` | `site_settings.ga4_measurement_id` | Migrate into runtime script injection/config. |
| AdSense | `wpcode_snippets` script has `ca-pub-6113308105665934`; `googlesitekit_adsense_settings.clientID=ca-pub-6113308150656934` | `site_settings.adsense_client` | IDs conflict; confirm authoritative account before go-live. |
| Google site verification | `ihaf_insert_header` meta verification tag present | `site_settings.google_site_verification` | Keep as head meta in Next layout/metadata pipeline. |

## Theme Token Mapping (Pixl)

| Token type | Source | Extracted values |
| --- | --- | --- |
| Colors | `theme.json` palette | primary `#040DE1`, foreground `#040DE1`, background `#DDCFFF`, tertiary `#CDBAF9` |
| Fonts | `theme.json` typography | `DM Mono` family set + `uni 05_53` display font |
| Layout widths | `theme.json` layout | content `620px`, wide `1200px` |
| Spacing + gaps | `theme.json` custom spacing | horizontal/vertical gap `min(30px, 5vw)`, outer spacing clamp expression |
| Shadow style | `theme.json` custom shadow + `style.css` | Pixel shadow style used across buttons/inputs/blocks |
| Interaction styles | `style.css` + `theme.json` elements | Link underline variants, bordered inputs, button hover/active inversions, nav submenu styling |

## Audit Findings and Migration Implications

1. All target parity routes from the migration plan are present and mappable via XML/SQL.
2. Calculator business logic is currently embedded as inline JS per page and must be normalized into reusable typed modules.
3. Rich page-level SEO metadata is not clearly represented per page in the current export; migration should include a deterministic fallback strategy.
4. Integration data is available, but AdSense and privacy-page IDs show conflicts that require manual verification before production cutover.
5. Theme tokens are sufficiently complete to bootstrap a Pixl-aligned design system in Next.js.
