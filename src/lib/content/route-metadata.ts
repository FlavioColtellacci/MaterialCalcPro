import type { Metadata } from "next";
import type { WpRouteData } from "@/lib/content/wp-pages";

type SocialMeta = {
  title?: string | null;
  description?: string | null;
  image?: string | null;
};

function asSocialMeta(value: unknown): SocialMeta {
  if (!value || typeof value !== "object") {
    return {};
  }
  const entry = value as Record<string, unknown>;
  return {
    title: typeof entry.title === "string" ? entry.title : null,
    description: typeof entry.description === "string" ? entry.description : null,
    image: typeof entry.image === "string" ? entry.image : null,
  };
}

export function buildMetadataFromRouteData(routeData: WpRouteData): Metadata {
  const title = routeData.seo?.title ?? routeData.page.title;
  const description = routeData.seo?.description ?? routeData.page.excerpt ?? undefined;
  const canonical = routeData.seo?.canonical ?? undefined;
  const og = asSocialMeta(routeData.seo?.og);
  const twitter = asSocialMeta(routeData.seo?.twitter);
  const socialImage = og.image ?? twitter.image ?? undefined;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: "website",
      url: canonical,
      title: og.title ?? title,
      description: og.description ?? description,
      images: socialImage ? [{ url: socialImage }] : undefined,
    },
    twitter: {
      card: socialImage ? "summary_large_image" : "summary",
      title: twitter.title ?? title,
      description: twitter.description ?? description,
      images: socialImage ? [socialImage] : undefined,
    },
  };
}
