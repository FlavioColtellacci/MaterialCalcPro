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
  const routes = [...WP_ROUTE_SLUGS, "calculators"] as const;

  return routes.map((slug) => ({
    url: joinUrl(siteSettings.canonicalBaseUrl, slug),
    lastModified: now,
    changeFrequency: slug === "home" ? "daily" : slug === "calculators" ? "weekly" : "weekly",
    priority: slug === "home" ? 1 : slug === "calculators" ? 0.9 : 0.8,
  }));
}
