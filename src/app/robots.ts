import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/content/site-settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteSettings = await getSiteSettings();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${siteSettings.canonicalBaseUrl}sitemap.xml`,
  };
}
