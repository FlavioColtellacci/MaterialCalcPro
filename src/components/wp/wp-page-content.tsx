import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { PageToc } from "@/components/site/page-toc";
import { RelatedCalculatorsGrid } from "@/components/site/related-calculators-grid";
import { CalculatorModule } from "@/components/calculators/calculator-module";
import {
  CALCULATOR_ROUTE_SLUGS,
  getCalculatorTitle,
  isCalculatorRouteSlug,
  type CalculatorRouteSlug,
  type WpRouteData,
} from "@/lib/content/wp-pages";

const SITE_ORIGIN_REGEX = /https:\/\/materialcalcpro\.com\//gi;
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const LEGACY_CALCULATOR_WRAPPER_REGEX =
  /<div\b[^>]*class="[^"]*mcp-calc-wrapper[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
const HEADING_TAG_REGEX = /<(\/?)h([1-6])(\b[^>]*)>/gi;
const HEADING_WITH_CONTENT_REGEX = /<h([2-3])([^>]*)>([\s\S]*?)<\/h\1>/gi;
const TAG_REGEX = /<[^>]*>/g;

type TocItem = {
  id: string;
  title: string;
  level: 2 | 3;
};

function stripHtml(input: string): string {
  return input.replace(TAG_REGEX, "").replace(/\s+/g, " ").trim();
}

function toSlug(input: string): string {
  const normalized = stripHtml(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return normalized.length > 0 ? normalized : "section";
}

function getUniqueId(baseId: string, usedIds: Set<string>): string {
  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }

  let index = 2;
  let candidate = `${baseId}-${index}`;
  while (usedIds.has(candidate)) {
    index += 1;
    candidate = `${baseId}-${index}`;
  }
  usedIds.add(candidate);
  return candidate;
}

function sanitizeWpHtml(html: string): string {
  return html
    .replace(SCRIPT_TAG_REGEX, "")
    .replace(LEGACY_CALCULATOR_WRAPPER_REGEX, "")
    .replace(SITE_ORIGIN_REGEX, "/")
    .trim();
}

function normalizeHeadingTags(html: string): string {
  return html.replace(HEADING_TAG_REGEX, (_, close: string, levelText: string, attrs: string) => {
    const level = Number(levelText);
    if (close) {
      return `</h${Math.min(level + 1, 6)}>`;
    }

    return `<h${Math.min(level + 1, 6)}${attrs}>`;
  });
}

function extractIdFromAttributes(attributes: string): string | null {
  const idMatch = attributes.match(/\sid=(['"])(.*?)\1/i);
  return idMatch?.[2] ?? null;
}

function renderHtmlWithAnchors(
  html: string,
  idPrefix: string,
  usedIds: Set<string>,
): { html: string; tocItems: TocItem[] } {
  const tocItems: TocItem[] = [];
  const normalizedHtml = normalizeHeadingTags(sanitizeWpHtml(html));

  const renderedHtml = normalizedHtml.replace(
    HEADING_WITH_CONTENT_REGEX,
    (fullMatch, levelText: string, attributes: string, headingContent: string) => {
      const level = Number(levelText) as 2 | 3;
      const headingTitle = stripHtml(headingContent);
      if (!headingTitle) {
        return fullMatch;
      }

      const existingId = extractIdFromAttributes(attributes);
      const baseId = existingId || `${idPrefix}-${toSlug(headingTitle)}`;
      const id = getUniqueId(baseId, usedIds);
      const attrsWithoutId = attributes.replace(/\sid=(['"])(.*?)\1/i, "");
      tocItems.push({
        id,
        title: headingTitle,
        level,
      });

      return `<h${level}${attrsWithoutId} id="${id}">${headingContent}</h${level}>`;
    },
  );

  return { html: renderedHtml, tocItems };
}

type WpPageContentProps = {
  routeData: WpRouteData;
};

export function WpPageContent({ routeData }: WpPageContentProps) {
  const isCalculatorPage = isCalculatorRouteSlug(routeData.page.slug);
  const usedIds = new Set<string>();
  const renderedBody = renderHtmlWithAnchors(routeData.page.body_html, "content", usedIds);
  const renderedBlocks = routeData.blocks.map((block) => {
    const blockTitle = block.heading?.trim();
    const blockId = blockTitle
      ? getUniqueId(`block-${toSlug(blockTitle)}`, usedIds)
      : null;
    const renderedBlock = renderHtmlWithAnchors(
      block.content_html,
      `block-${block.block_key}`,
      usedIds,
    );

    if (blockTitle && blockId) {
      renderedBlock.tocItems.unshift({
        id: blockId,
        title: blockTitle,
        level: 2,
      });
    }

    return {
      ...block,
      blockId,
      heading: blockTitle,
      contentHtml: renderedBlock.html,
      tocItems: renderedBlock.tocItems,
    };
  });
  const tocItems = [
    ...renderedBody.tocItems,
    ...renderedBlocks.flatMap((block) => block.tocItems),
  ];

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    ...(isCalculatorPage ? [{ label: "Calculators", href: "/calculators/" }] : []),
    { label: routeData.page.title },
  ];

  return (
    <main id="main-content" className="mx-auto max-w-pixl-wide px-pixl-outer py-pixl-outer">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <article className="pixl-shadow-block mx-auto w-full max-w-pixl-content border-2 border-pixl-primary bg-pixl-background p-pixl-gap lg:mx-0 lg:max-w-none">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="mt-4">{routeData.page.title}</h1>
          {isCalculatorPage ? (
            <div className="mt-pixl-gap">
              <CalculatorModule slug={routeData.page.slug as CalculatorRouteSlug} />
            </div>
          ) : null}

          <section
            className="wp-content mt-pixl-gap"
            dangerouslySetInnerHTML={{ __html: renderedBody.html }}
          />

          {renderedBlocks.length > 0 ? (
            <div className="mt-pixl-gap border-t-2 border-pixl-primary pt-pixl-gap">
              {renderedBlocks.map((block) => (
                <section key={block.block_key} className="wp-content mt-6 first:mt-0">
                  {block.heading ? <h2 id={block.blockId ?? undefined}>{block.heading}</h2> : null}
                  <div dangerouslySetInnerHTML={{ __html: block.contentHtml }} />
                </section>
              ))}
            </div>
          ) : null}

          {isCalculatorPage ? (
            <RelatedCalculatorsGrid
              currentSlug={routeData.page.slug as CalculatorRouteSlug}
              slugs={CALCULATOR_ROUTE_SLUGS}
            />
          ) : null}
        </article>
        <div className="hidden lg:block">
          <PageToc items={tocItems} />
        </div>
      </div>
      {tocItems.length > 0 ? (
        <div className="mt-6 lg:hidden">
          <PageToc items={tocItems} />
        </div>
      ) : null}
      {isCalculatorPage ? (
        <p className="sr-only">{getCalculatorTitle(routeData.page.slug as CalculatorRouteSlug)}</p>
      ) : null}
    </main>
  );
}
