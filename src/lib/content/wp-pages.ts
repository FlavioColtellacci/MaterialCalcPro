import { createSupabaseServerClient } from "@/lib/supabase/server";

export const WP_ROUTE_SLUGS = [
  "home",
  "concrete-calculator",
  "paint-calculator",
  "tile-calculator",
  "gravel-calculator",
  "drywall-calculator",
  "roofing-calculator",
  "flooring-calculator",
  "asphalt-calculator",
  "fence-post-calculator",
  "brick-calculator",
  "privacy",
] as const;

export type WpRouteSlug = (typeof WP_ROUTE_SLUGS)[number];
const WP_ROUTE_SLUG_SET = new Set<string>(WP_ROUTE_SLUGS);
export const CALCULATOR_ROUTE_SLUGS = WP_ROUTE_SLUGS.filter(
  (slug): slug is Exclude<WpRouteSlug, "home" | "privacy"> =>
    slug !== "home" && slug !== "privacy",
);
export type CalculatorRouteSlug = (typeof CALCULATOR_ROUTE_SLUGS)[number];

const CALCULATOR_ROUTE_SLUG_SET = new Set<string>(CALCULATOR_ROUTE_SLUGS);

const CALCULATOR_PAGE_TITLES: Record<CalculatorRouteSlug, string> = {
  "concrete-calculator": "Concrete Calculator",
  "paint-calculator": "Paint Calculator",
  "tile-calculator": "Tile Calculator",
  "gravel-calculator": "Gravel Calculator",
  "drywall-calculator": "Drywall Calculator",
  "roofing-calculator": "Roofing Calculator",
  "flooring-calculator": "Flooring Calculator",
  "asphalt-calculator": "Asphalt Calculator",
  "fence-post-calculator": "Fence Post Calculator",
  "brick-calculator": "Brick Calculator",
};

export type WpPageRecord = {
  slug: string;
  title: string;
  body_html: string;
  excerpt: string | null;
};

export type WpSeoRecord = {
  title: string;
  description: string | null;
  canonical: string | null;
  og: Record<string, unknown> | null;
  twitter: Record<string, unknown> | null;
};

export type WpContentBlockRecord = {
  block_key: string;
  heading: string | null;
  content_html: string;
};

export type WpRouteData = {
  page: WpPageRecord;
  seo: WpSeoRecord | null;
  blocks: WpContentBlockRecord[];
};

export type SearchablePage = {
  slug: WpRouteSlug;
  href: string;
  title: string;
  excerpt: string;
};

function normalizeExcerpt(value: string | null): string {
  return value?.trim() ?? "";
}

export function isCalculatorRouteSlug(slug: string): slug is CalculatorRouteSlug {
  return CALCULATOR_ROUTE_SLUG_SET.has(slug);
}

export function getRouteHref(slug: WpRouteSlug): string {
  return slug === "home" ? "/" : `/${slug}/`;
}

export function getCalculatorTitle(slug: CalculatorRouteSlug): string {
  return CALCULATOR_PAGE_TITLES[slug];
}

export async function getSearchablePages(): Promise<SearchablePage[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pages")
    .select("slug,title,excerpt")
    .in("slug", [...WP_ROUTE_SLUGS])
    .returns<WpPageRecord[]>();

  if (error) {
    throw new Error(`Failed to fetch searchable pages: ${error.message}`);
  }

  const records = (data ?? []).filter(
    (record): record is WpPageRecord & { slug: WpRouteSlug } =>
      WP_ROUTE_SLUG_SET.has(record.slug),
  );
  const bySlug = new Map(records.map((record) => [record.slug, record]));

  return WP_ROUTE_SLUGS.map((slug) => {
    const record = bySlug.get(slug);
    return {
      slug,
      href: getRouteHref(slug),
      title:
        record?.title ??
        (isCalculatorRouteSlug(slug) ? getCalculatorTitle(slug) : slug === "home" ? "Home" : "Privacy Policy"),
      excerpt: normalizeExcerpt(record?.excerpt ?? null),
    };
  });
}

export function normalizeWpSlugFromSegments(
  segments?: string[],
): WpRouteSlug | null {
  if (!segments || segments.length === 0) {
    return "home";
  }

  if (segments.length !== 1) {
    return null;
  }

  const slug = segments[0]?.trim().toLowerCase();
  if (!slug || !WP_ROUTE_SLUG_SET.has(slug)) {
    return null;
  }

  return slug as WpRouteSlug;
}

export function getStaticRouteParams(): Array<{ slug: string[] }> {
  return WP_ROUTE_SLUGS.filter((slug) => slug !== "home").map((slug) => ({
    slug: [slug],
  }));
}

export async function getWpRouteDataBySlug(
  slug: WpRouteSlug,
): Promise<WpRouteData | null> {
  const supabase = await createSupabaseServerClient();

  const [{ data: page, error: pageError }, { data: seo, error: seoError }, { data: blocks, error: blocksError }] =
    await Promise.all([
      supabase
        .from("pages")
        .select("slug,title,body_html,excerpt")
        .eq("slug", slug)
        .maybeSingle<WpPageRecord>(),
      supabase
        .from("seo_meta")
        .select("title,description,canonical,og,twitter")
        .eq("slug", slug)
        .maybeSingle<WpSeoRecord>(),
      supabase
        .from("calculator_content_blocks")
        .select("block_key,heading,content_html")
        .eq("slug", slug)
        .order("sort_order", { ascending: true })
        .returns<WpContentBlockRecord[]>(),
    ]);

  if (pageError) {
    throw new Error(`Failed to fetch page '${slug}': ${pageError.message}`);
  }
  if (!page) {
    return null;
  }
  if (seoError) {
    throw new Error(`Failed to fetch SEO meta for '${slug}': ${seoError.message}`);
  }
  if (blocksError) {
    throw new Error(
      `Failed to fetch content blocks for '${slug}': ${blocksError.message}`,
    );
  }

  return {
    page,
    seo: seo ?? null,
    blocks: blocks ?? [],
  };
}
