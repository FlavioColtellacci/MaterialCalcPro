import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseWordPressXml } from "./lib/wp-xml.mjs";
import { parseWordPressSql } from "./lib/wp-sql.mjs";

const PROJECT_ROOT = process.cwd();
const DEFAULT_XML = "materialcalcprocom.WordPress.2026-04-13.xml";
const DEFAULT_SQL = "u589264389_GZdzZ.sql";
const DEFAULT_OUT = "migration/output/wp-migration-payload.json";

function normalizeCanonical(baseUrl, slug) {
  if (!baseUrl) return null;
  if (!slug || slug === "home") return `${baseUrl.replace(/\/$/, "")}/`;
  return `${baseUrl.replace(/\/$/, "")}/${slug}/`;
}

function createSeoRow(page, canonicalBaseUrl, defaultSiteName) {
  const seoTitle =
    page.meta.rank_math_title || page.title || `${page.slug} | ${defaultSiteName}`;
  const seoDescription =
    page.meta.rank_math_description || page.fallbackDescription || null;
  const canonical =
    page.meta.rank_math_canonical_url ||
    normalizeCanonical(canonicalBaseUrl, page.slug);

  return {
    slug: page.slug,
    title: seoTitle,
    description: seoDescription,
    canonical,
    og: {
      title: page.meta.rank_math_facebook_title || seoTitle,
      description: page.meta.rank_math_facebook_description || seoDescription,
      image: page.meta.rank_math_facebook_image || null,
    },
    twitter: {
      title: page.meta.rank_math_twitter_title || seoTitle,
      description: page.meta.rank_math_twitter_description || seoDescription,
      image: page.meta.rank_math_twitter_image || null,
    },
  };
}

function createSiteSettingsRows(sqlDerived, pages) {
  const homePage =
    pages.find((page) => page.wpPostId === sqlDerived.pageOnFront) ??
    pages.find((page) => page.slug === "home");
  const privacyPage = pages.find(
    (page) => page.wpPostId === sqlDerived.privacyPageId,
  );

  return [
    { setting_key: "site_name", setting_value: sqlDerived.siteName },
    { setting_key: "site_description", setting_value: sqlDerived.siteDescription },
    { setting_key: "canonical_base_url", setting_value: sqlDerived.siteUrl },
    { setting_key: "home_slug", setting_value: homePage?.slug ?? null },
    {
      setting_key: "privacy_slug",
      setting_value: privacyPage?.slug ?? "privacy",
    },
    { setting_key: "ga4_measurement_id", setting_value: sqlDerived.ga4MeasurementId },
    {
      setting_key: "adsense_client_ids",
      setting_value: sqlDerived.adsenseClientIds,
    },
    {
      setting_key: "google_site_verification",
      setting_value: sqlDerived.googleSiteVerification,
    },
    { setting_key: "seo_provider", setting_value: "rank_math" },
    { setting_key: "seo_flags", setting_value: sqlDerived.rankMathModules },
    { setting_key: "active_plugins", setting_value: sqlDerived.activePlugins },
    {
      setting_key: "wpcode_header_snippet",
      setting_value: sqlDerived.wpcodeHeaderSnippet,
    },
  ];
}

function buildPayload(wordpressItems, sqlContext) {
  const pages = wordpressItems.filter(
    (item) => item.postType === "page" && item.slug && item.status !== "trash",
  );
  const canonicalBaseUrl = sqlContext.derived.siteUrl ?? sqlContext.derived.homeUrl;
  const defaultSiteName = sqlContext.derived.siteName ?? "MaterialCalcPro";

  const pageRows = pages.map((page) => ({
    slug: page.slug,
    title: page.title,
    body_html: page.bodyHtmlWithoutAssets,
    excerpt: page.excerpt || page.fallbackDescription || null,
    status: page.status || "draft",
    publish_date: page.postDateGmt,
    source_post_id: page.wpPostId,
  }));

  const seoRows = pages.map((page) =>
    createSeoRow(page, canonicalBaseUrl, defaultSiteName),
  );

  const calculatorPages = pages.filter(
    (page) =>
      page.slug.includes("calculator") &&
      (page.calculator.scripts.length > 0 || page.calculator.wrapperId),
  );

  const calculatorDefinitionRows = calculatorPages.map((page) => ({
    slug: page.slug,
    source_post_id: page.wpPostId,
    wrapper_id: page.calculator.wrapperId,
    input_schema: page.calculator.inputSchema,
    unit_systems: page.calculator.unitSystems,
    formula_source: {
      scripts: page.calculator.scripts,
      styles: page.calculator.styles,
    },
    copy_blocks: {
      title: page.title,
      excerpt: page.excerpt || null,
    },
  }));

  const calculatorContentRows = calculatorPages.flatMap((page) =>
    page.calculator.sections.map((section) => ({
      slug: page.slug,
      block_key: section.block_key,
      block_type: section.block_type,
      heading: section.heading,
      content_html: section.content_html,
      sort_order: section.sort_order,
    })),
  );

  const rawWpItemsRows = pages.map((page) => ({
    source_post_id: page.wpPostId,
    slug: page.slug,
    post_type: page.postType,
    source_payload: page,
  }));

  const siteSettingsRows = createSiteSettingsRows(sqlContext.derived, pages);

  return {
    generated_at: new Date().toISOString(),
    source: {
      xml_file: DEFAULT_XML,
      sql_file: DEFAULT_SQL,
    },
    summary: {
      pages: pageRows.length,
      seo_meta: seoRows.length,
      calculator_definitions: calculatorDefinitionRows.length,
      calculator_content_blocks: calculatorContentRows.length,
      raw_wp_items: rawWpItemsRows.length,
      site_settings: siteSettingsRows.length,
    },
    pages: pageRows,
    seo_meta: seoRows,
    calculator_definitions: calculatorDefinitionRows,
    calculator_content_blocks: calculatorContentRows,
    raw_wp_items: rawWpItemsRows,
    site_settings: siteSettingsRows,
  };
}

async function main() {
  const xmlPath = path.resolve(PROJECT_ROOT, process.argv[2] ?? DEFAULT_XML);
  const sqlPath = path.resolve(PROJECT_ROOT, process.argv[3] ?? DEFAULT_SQL);
  const outputPath = path.resolve(PROJECT_ROOT, process.argv[4] ?? DEFAULT_OUT);

  const [wordpressItems, sqlContext] = await Promise.all([
    parseWordPressXml(xmlPath),
    parseWordPressSql(sqlPath),
  ]);

  const payload = buildPayload(wordpressItems, sqlContext);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log("Migration payload generated.");
  console.log(`Output: ${outputPath}`);
  console.log(`Pages: ${payload.summary.pages}`);
  console.log(`Calculators: ${payload.summary.calculator_definitions}`);
}

await main();
