import type { DocumentData } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";

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
  const db = getAdminFirestore();
  const slugs = [...WP_ROUTE_SLUGS];
  const refs = slugs.map((slug) => db.collection("pages").doc(slug));
  const snapshots = await db.getAll(...refs);

  const bySlug = new Map<string, WpPageRecord>();
  snapshots.forEach((snap) => {
    if (!snap.exists) return;
    const row = snap.data() as Partial<WpPageRecord> | undefined;
    const slug = row?.slug;
    if (!slug || !WP_ROUTE_SLUG_SET.has(slug)) return;
    bySlug.set(slug, {
      slug,
      title: typeof row.title === "string" ? row.title : "",
      body_html: typeof row.body_html === "string" ? row.body_html : "",
      excerpt: typeof row.excerpt === "string" ? row.excerpt : null,
    });
  });

  return WP_ROUTE_SLUGS.map((slug) => {
    const record = bySlug.get(slug);
    return {
      slug,
      href: getRouteHref(slug),
      title:
        record?.title ??
        (isCalculatorRouteSlug(slug)
          ? getCalculatorTitle(slug)
          : slug === "home"
            ? "Home"
            : "Privacy Policy"),
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

function mapSeo(data: DocumentData | undefined): WpSeoRecord | null {
  if (!data) return null;
  return {
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : null,
    canonical: typeof data.canonical === "string" ? data.canonical : null,
    og: data.og && typeof data.og === "object" ? (data.og as Record<string, unknown>) : null,
    twitter:
      data.twitter && typeof data.twitter === "object"
        ? (data.twitter as Record<string, unknown>)
        : null,
  };
}

export async function getWpRouteDataBySlug(
  slug: WpRouteSlug,
): Promise<WpRouteData | null> {
  const db = getAdminFirestore();
  const pageRef = db.collection("pages").doc(slug);

  const [pageSnap, seoSnap, blocksSnap] = await Promise.all([
    pageRef.get(),
    db.collection("seo_meta").doc(slug).get(),
    pageRef.collection("content_blocks").orderBy("sort_order", "asc").get(),
  ]);

  if (!pageSnap.exists) {
    return null;
  }

  const raw = pageSnap.data() as Partial<WpPageRecord> | undefined;
  const page: WpPageRecord = {
    slug,
    title: typeof raw?.title === "string" ? raw.title : "",
    body_html: typeof raw?.body_html === "string" ? raw.body_html : "",
    excerpt: typeof raw?.excerpt === "string" ? raw.excerpt : null,
  };

  const seo = seoSnap.exists ? mapSeo(seoSnap.data()) : null;

  const blocks: WpContentBlockRecord[] = blocksSnap.docs.map((doc) => {
    const b = doc.data();
    return {
      block_key: typeof b.block_key === "string" ? b.block_key : doc.id,
      heading: typeof b.heading === "string" ? b.heading : null,
      content_html: typeof b.content_html === "string" ? b.content_html : "",
    };
  });

  return { page, seo, blocks };
}
