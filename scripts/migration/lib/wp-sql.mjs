import { readFile } from "node:fs/promises";

const WP_OPTIONS_INSERT_REGEX =
  /INSERT INTO\s+`wp_options`\s+\(([\s\S]*?)\)\s+VALUES\s+([\s\S]*?);/gi;

function unescapeSqlString(value) {
  return value
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\")
    .replace(/\\r/g, "\r")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
}

function parseTupleValues(valuesSql) {
  const tuples = [];
  let index = 0;

  while (index < valuesSql.length) {
    while (index < valuesSql.length && /\s|,/.test(valuesSql[index] ?? "")) {
      index += 1;
    }
    if (valuesSql[index] !== "(") {
      index += 1;
      continue;
    }

    index += 1;
    const fields = [];

    while (index < valuesSql.length) {
      while (index < valuesSql.length && /\s/.test(valuesSql[index] ?? "")) {
        index += 1;
      }

      if (valuesSql[index] === "'") {
        index += 1;
        let value = "";
        while (index < valuesSql.length) {
          const char = valuesSql[index] ?? "";
          if (char === "\\") {
            value += `${char}${valuesSql[index + 1] ?? ""}`;
            index += 2;
            continue;
          }
          if (char === "'") {
            index += 1;
            break;
          }
          value += char;
          index += 1;
        }
        fields.push(unescapeSqlString(value));
      } else {
        let value = "";
        while (index < valuesSql.length) {
          const char = valuesSql[index] ?? "";
          if (char === "," || char === ")") break;
          value += char;
          index += 1;
        }
        const normalized = value.trim();
        fields.push(normalized === "NULL" ? null : normalized);
      }

      while (index < valuesSql.length && /\s/.test(valuesSql[index] ?? "")) {
        index += 1;
      }

      if (valuesSql[index] === ",") {
        index += 1;
        continue;
      }
      if (valuesSql[index] === ")") {
        index += 1;
        break;
      }
    }

    if (fields.length > 0) tuples.push(fields);
  }

  return tuples;
}

function extractPhpSerializedString(value, key) {
  if (!value) return null;
  const keyPattern = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`${keyPattern}"?;s:\\d+:"([^"]*)"`, "i");
  const match = value.match(regex);
  return match?.[1] ?? null;
}

export async function parseWordPressSql(sqlPath) {
  const sql = await readFile(sqlPath, "utf8");
  const options = new Map();

  for (const insertMatch of sql.matchAll(WP_OPTIONS_INSERT_REGEX)) {
    const valuesSql = insertMatch[2] ?? "";
    const tuples = parseTupleValues(valuesSql);
    for (const tuple of tuples) {
      if (tuple.length < 3) continue;
      const optionName = tuple[1];
      const optionValue = tuple[2];
      if (typeof optionName === "string") {
        options.set(optionName, optionValue);
      }
    }
  }

  const rawWpcode = options.get("wpcode_snippets");
  const adsenseIds = new Set([
    ...(rawWpcode?.match(/ca-pub-\d+/g) ?? []),
    ...(options.get("googlesitekit_adsense_settings")?.match(/ca-pub-\d+/g) ??
      []),
  ]);

  const ga4MeasurementId =
    extractPhpSerializedString(
      options.get("googlesitekit_analytics-4_settings"),
      "measurementID",
    ) ??
    extractPhpSerializedString(
      options.get("rank_math_google_analytic_options"),
      "measurement_id",
    );

  return {
    options,
    derived: {
      siteUrl: options.get("siteurl") ?? null,
      homeUrl: options.get("home") ?? null,
      siteName: options.get("blogname") ?? null,
      siteDescription: options.get("blogdescription") ?? null,
      showOnFront: options.get("show_on_front") ?? null,
      pageOnFront: options.get("page_on_front")
        ? Number(options.get("page_on_front"))
        : null,
      privacyPageId: options.get("wp_page_for_privacy_policy")
        ? Number(options.get("wp_page_for_privacy_policy"))
        : null,
      activePlugins:
        options
          .get("active_plugins")
          ?.match(/[a-z0-9-]+\/[a-z0-9-]+\.php/gi) ?? [],
      rankMathModules:
        options
          .get("rank_math_modules")
          ?.match(/s:\d+:"([^"]+)"/g)
          ?.map((entry) => entry.replace(/^s:\d+:"/, "").replace(/"$/, "")) ??
        [],
      ga4MeasurementId,
      adsenseClientIds: [...adsenseIds],
      googleSiteVerification:
        options
          .get("ihaf_insert_header")
          ?.match(/google-site-verification\\?"\s+content=\\?"([^"\\]+)\\?"/i)
          ?.[1] ?? null,
      wpcodeHeaderSnippet: rawWpcode ?? null,
    },
  };
}
