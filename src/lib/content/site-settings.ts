import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_SITE_NAME = "MaterialCalcPro";
const DEFAULT_SITE_DESCRIPTION = "Construction material calculators.";
const DEFAULT_CANONICAL_BASE_URL = "https://materialcalcpro.com";
const ADSENSE_SELLER_ID = "f08c47fec0942fa0";

const SITE_SETTING_KEYS = [
  "site_name",
  "site_description",
  "canonical_base_url",
  "home_slug",
  "privacy_slug",
  "ga4_measurement_id",
  "adsense_client_ids",
  "google_site_verification",
] as const;

type SiteSettingKey = (typeof SITE_SETTING_KEYS)[number];
type SiteSettingRow = {
  setting_key: SiteSettingKey;
  setting_value: unknown;
};

type SiteSettings = {
  siteName: string;
  siteDescription: string;
  canonicalBaseUrl: string;
  homeSlug: string;
  privacySlug: string;
  ga4MeasurementId: string | null;
  adsenseClientIds: string[];
  googleSiteVerification: string | null;
  adsTxtLines: string[];
};

function asNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function parseAdsenseClientIds(value: unknown): string[] {
  const source =
    typeof value === "string"
      ? [value]
      : Array.isArray(value)
        ? value
        : [];

  const ids = source
    .map((entry) => asNonEmptyString(entry))
    .filter((entry): entry is string => Boolean(entry))
    .filter((entry) => entry.includes("pub-"));

  return [...new Set(ids)];
}

function toAdsTxtPublisherId(clientId: string): string {
  if (clientId.startsWith("ca-pub-")) {
    return clientId.replace(/^ca-/, "");
  }
  return clientId;
}

function parseAdsTxtLines(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function withTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

function buildSettingsFromMap(byKey: Map<SiteSettingKey, unknown>): SiteSettings {
  const canonicalBaseUrl =
    asNonEmptyString(byKey.get("canonical_base_url")) ??
    DEFAULT_CANONICAL_BASE_URL;

  const ga4MeasurementId =
    asNonEmptyString(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID) ??
    asNonEmptyString(byKey.get("ga4_measurement_id"));

  const adsenseClientIds = [
    ...new Set([
      ...parseAdsenseClientIds(byKey.get("adsense_client_ids")),
      ...parseAdsenseClientIds(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID),
    ]),
  ];

  const adsTxtFromEnv = parseAdsTxtLines(process.env.ADS_TXT_LINES);
  const adsTxtLines =
    adsTxtFromEnv.length > 0
      ? adsTxtFromEnv
      : adsenseClientIds.map(
          (clientId) =>
            `google.com, ${toAdsTxtPublisherId(clientId)}, DIRECT, ${ADSENSE_SELLER_ID}`,
        );

  return {
    siteName: asNonEmptyString(byKey.get("site_name")) ?? DEFAULT_SITE_NAME,
    siteDescription:
      asNonEmptyString(byKey.get("site_description")) ?? DEFAULT_SITE_DESCRIPTION,
    canonicalBaseUrl: withTrailingSlash(canonicalBaseUrl),
    homeSlug: asNonEmptyString(byKey.get("home_slug")) ?? "home",
    privacySlug: asNonEmptyString(byKey.get("privacy_slug")) ?? "privacy",
    ga4MeasurementId,
    adsenseClientIds,
    googleSiteVerification:
      asNonEmptyString(process.env.GOOGLE_SITE_VERIFICATION) ??
      asNonEmptyString(byKey.get("google_site_verification")),
    adsTxtLines,
  };
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("setting_key,setting_value")
    .in("setting_key", [...SITE_SETTING_KEYS])
    .returns<SiteSettingRow[]>();

  const byKey = new Map<SiteSettingKey, unknown>();
  if (!error) {
    const rows = data ?? [];
    rows.forEach((row) => byKey.set(row.setting_key, row.setting_value));
  }

  return buildSettingsFromMap(byKey);
});
