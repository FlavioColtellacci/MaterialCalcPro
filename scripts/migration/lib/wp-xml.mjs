import { readFile } from "node:fs/promises";

const ITEM_REGEX = /<item>([\s\S]*?)<\/item>/g;
const POST_META_REGEX = /<wp:postmeta>([\s\S]*?)<\/wp:postmeta>/g;

function stripCdata(value) {
  if (!value) return "";
  return value
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .trim();
}

function decodeXmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTagValue(block, tagName) {
  const tagRegex = new RegExp(
    `<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`,
  );
  const match = block.match(tagRegex);
  if (!match) return "";
  return decodeXmlEntities(stripCdata(match[1]));
}

function extractPostMeta(itemBlock) {
  const meta = {};
  for (const postMetaMatch of itemBlock.matchAll(POST_META_REGEX)) {
    const postMetaBlock = postMetaMatch[1] ?? "";
    const key = extractTagValue(postMetaBlock, "wp:meta_key");
    if (!key) continue;
    meta[key] = extractTagValue(postMetaBlock, "wp:meta_value");
  }
  return meta;
}

function extractScriptBlocks(html) {
  return Array.from(
    html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g),
    (match) => (match[1] ?? "").trim(),
  ).filter(Boolean);
}

function extractStyleBlocks(html) {
  return Array.from(
    html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/g),
    (match) => (match[1] ?? "").trim(),
  ).filter(Boolean);
}

function extractFieldSchema(html) {
  const fields = [];
  const inputRegex =
    /<(input|select)([^>]*?)id="([^"]+)"([^>]*)>([\s\S]*?<\/select>)?/g;

  for (const inputMatch of html.matchAll(inputRegex)) {
    const tagName = (inputMatch[1] ?? "").toLowerCase();
    const preAttrs = inputMatch[2] ?? "";
    const id = inputMatch[3] ?? "";
    const postAttrs = inputMatch[4] ?? "";
    const fullAttrs = `${preAttrs} ${postAttrs}`;
    if (!id) continue;

    const typeMatch = fullAttrs.match(/type="([^"]+)"/);
    const minMatch = fullAttrs.match(/min="([^"]+)"/);
    const maxMatch = fullAttrs.match(/max="([^"]+)"/);
    const stepMatch = fullAttrs.match(/step="([^"]+)"/);
    const placeholderMatch = fullAttrs.match(/placeholder="([^"]+)"/);

    fields.push({
      id,
      tag: tagName,
      type: typeMatch?.[1] ?? (tagName === "select" ? "select" : "text"),
      min: minMatch?.[1] ?? null,
      max: maxMatch?.[1] ?? null,
      step: stepMatch?.[1] ?? null,
      placeholder: placeholderMatch?.[1] ?? null,
    });
  }

  return fields;
}

function extractUnitSystems(html) {
  const units = new Set();
  for (const match of html.matchAll(
    /<input[^>]*name="[^"]*unit[^"]*"[^>]*value="([^"]+)"/gi,
  )) {
    if (match[1]) units.add(match[1].trim().toLowerCase());
  }
  return [...units];
}

function stripScriptAndStyle(html) {
  return html
    .replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/g, "")
    .replace(/<style(?:\s[^>]*)?>[\s\S]*?<\/style>/g, "")
    .trim();
}

function toPlainText(html) {
  const withoutTags = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
  return withoutTags.replace(/\s+/g, " ").trim();
}

function excerptFromHtml(html, max = 180) {
  const text = toPlainText(html);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function extractCalculatorSections(html, slug) {
  const contentWithoutAssets = stripScriptAndStyle(html);
  const headingRegex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
  const sections = [];
  const headings = Array.from(contentWithoutAssets.matchAll(headingRegex));

  if (headings.length === 0) {
    return [
      {
        slug,
        block_key: "main",
        block_type: "section",
        heading: null,
        content_html: contentWithoutAssets,
        sort_order: 0,
      },
    ];
  }

  for (let index = 0; index < headings.length; index += 1) {
    const current = headings[index];
    const next = headings[index + 1];
    const headingHtml = current[1] ?? "";
    const headingText = toPlainText(headingHtml);
    const start = current.index ?? 0;
    const end = next?.index ?? contentWithoutAssets.length;
    const sectionHtml = contentWithoutAssets.slice(start, end).trim();
    const normalizedHeading = headingText.toLowerCase();

    let blockType = "section";
    if (normalizedHeading.includes("faq")) blockType = "faq";
    if (normalizedHeading.includes("related")) blockType = "related_links";

    sections.push({
      slug,
      block_key: `${blockType}-${index + 1}`,
      block_type: blockType,
      heading: headingText || null,
      content_html: sectionHtml,
      sort_order: index,
    });
  }

  return sections;
}

function buildWordPressItem(itemBlock) {
  const contentHtml = extractTagValue(itemBlock, "content:encoded");
  const excerpt = extractTagValue(itemBlock, "excerpt:encoded");
  const slug = extractTagValue(itemBlock, "wp:post_name");
  const link = extractTagValue(itemBlock, "link");
  const title = extractTagValue(itemBlock, "title");
  const postType = extractTagValue(itemBlock, "wp:post_type");
  const postId = extractTagValue(itemBlock, "wp:post_id");
  const postDate = extractTagValue(itemBlock, "wp:post_date_gmt");
  const postStatus = extractTagValue(itemBlock, "wp:status");
  const meta = extractPostMeta(itemBlock);

  const scripts = extractScriptBlocks(contentHtml);
  const styles = extractStyleBlocks(contentHtml);
  const wrapperIdMatch = contentHtml.match(/id="(mcp-[^"]+)"/i);
  const wrapperId = wrapperIdMatch?.[1] ?? null;
  const inputSchema = extractFieldSchema(contentHtml);
  const unitSystems = extractUnitSystems(contentHtml);

  return {
    wpPostId: Number(postId),
    slug,
    title,
    link,
    postType,
    status: postStatus,
    postDateGmt: postDate || null,
    excerpt,
    contentHtml,
    bodyHtmlWithoutAssets: stripScriptAndStyle(contentHtml),
    fallbackDescription: excerpt || excerptFromHtml(contentHtml),
    meta,
    calculator: {
      wrapperId,
      scripts,
      styles,
      inputSchema,
      unitSystems,
      sections: extractCalculatorSections(contentHtml, slug),
    },
  };
}

export async function parseWordPressXml(xmlPath) {
  const xml = await readFile(xmlPath, "utf8");
  const items = [];

  for (const itemMatch of xml.matchAll(ITEM_REGEX)) {
    const itemBlock = itemMatch[1] ?? "";
    const postType = extractTagValue(itemBlock, "wp:post_type");
    if (!postType) continue;
    items.push(buildWordPressItem(itemBlock));
  }

  return items;
}
