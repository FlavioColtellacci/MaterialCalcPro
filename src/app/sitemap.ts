import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/content/site-settings";
import { WP_ROUTE_SLUGS } from "@/lib/content/wp-pages";

function joinUrl(baseUrl: string, slug: string): string {
  if (slug === "home") {
    return baseUrl;
  }
  return `${baseUrl}${slug}/`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteSettings = await getSiteSettings();
  const now = new Date();

  return WP_ROUTE_SLUGS.map((slug) => ({
    url: joinUrl(siteSettings.canonicalBaseUrl, slug),
    lastModified: now,
    changeFrequency: slug === "home" ? "daily" : "weekly",
    priority: slug === "home" ? 1 : 0.8,
  }));
}
