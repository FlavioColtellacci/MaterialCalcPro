import { getSiteSettings } from "@/lib/content/site-settings";

export const revalidate = 3600;

export async function GET() {
  const siteSettings = await getSiteSettings();
  const lines =
    siteSettings.adsTxtLines.length > 0
      ? siteSettings.adsTxtLines
      : ["# ads.txt not configured"];

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
