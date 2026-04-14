import Link from "next/link";
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

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function estimateReadMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
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
  const isPrivacyPage = routeData.page.slug === "privacy";
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
  const readMinutes = estimateReadMinutes(
    `${stripHtml(renderedBody.html)} ${renderedBlocks.map((block) => stripHtml(block.contentHtml)).join(" ")}`,
  );
  const canonical = routeData.seo?.canonical ?? `https://materialcalcpro.com/${routeData.page.slug}/`;

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    ...(isCalculatorPage ? [{ label: "Calculators", href: "/calculators/" }] : []),
    { label: routeData.page.title },
  ];

  if (isPrivacyPage) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-pixl-wide px-pixl-outer py-8 md:py-10">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <article className="space-y-6">
            <section className="premium-surface p-5 md:p-7">
              <Breadcrumbs items={breadcrumbItems} />
              <p className="premium-eyebrow mt-4">Legal and policy</p>
              <h1 className="mt-2">{routeData.page.title}</h1>
              <p className="mt-3 max-w-[66ch] text-mcp-text-body">
                {routeData.page.excerpt?.trim() ||
                  "Review how MaterialCalcPro handles data, cookies, and privacy controls while using our calculators."}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="premium-card p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-mcp-text-muted">Last reviewed</p>
                  <p className="mt-1 text-sm font-medium text-mcp-text-strong">
                    {formatDateLabel(new Date())}
                  </p>
                </div>
                <div className="premium-card p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-mcp-text-muted">Reading time</p>
                  <p className="mt-1 text-sm font-medium text-mcp-text-strong">{readMinutes} min</p>
                </div>
                <div className="premium-card p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-mcp-text-muted">Canonical URL</p>
                  <a className="mt-1 block break-all text-sm font-medium" href={canonical}>
                    {canonical}
                  </a>
                </div>
              </div>
            </section>

            <section className="premium-surface p-5 md:p-7">
              <div
                className="wp-content wp-content--legal"
                dangerouslySetInnerHTML={{ __html: renderedBody.html }}
              />
              {renderedBlocks.length > 0 ? (
                <div className="mt-8 space-y-6 border-t border-mcp-border-soft pt-6">
                  {renderedBlocks.map((block) => (
                    <section key={block.block_key} className="premium-card p-4 md:p-5">
                      {block.heading ? (
                        <h2 id={block.blockId ?? undefined} className="scroll-mt-28">
                          {block.heading}
                        </h2>
                      ) : null}
                      <div className="wp-content wp-content--legal mt-4">
                        <div dangerouslySetInnerHTML={{ __html: block.contentHtml }} />
                      </div>
                    </section>
                  ))}
                </div>
              ) : null}
            </section>
          </article>

          <div className="space-y-4">
            <PageToc title="Privacy sections" items={tocItems} className="hidden xl:block" />
            <aside className="premium-card p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-mcp-text-muted">Need quick estimates?</p>
              <p className="mt-2 text-sm text-mcp-text-body">
                Jump to the calculators hub for concrete, paint, tile, and more material estimators.
              </p>
              <Link className="pixl-btn mt-4" href="/calculators/">
                Open calculators hub
              </Link>
            </aside>
          </div>
        </div>
        <PageToc title="Privacy sections" items={tocItems} className="mt-6 xl:hidden" />
      </main>
    );
  }

  if (isCalculatorPage) {
    return (
      <main id="main-content" className="mx-auto max-w-pixl-wide px-pixl-outer py-8 md:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <article className="space-y-6">
            <section className="premium-surface p-5 md:p-7">
              <Breadcrumbs items={breadcrumbItems} />
              <p className="premium-eyebrow mt-4">Material estimator</p>
              <h1 className="mt-2">{routeData.page.title}</h1>
              <p className="mt-3 max-w-[62ch] text-mcp-text-body">
                {routeData.page.excerpt?.trim() ||
                  "Adjust dimensions, units, and waste factors to estimate quantities with cleaner job-site planning."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a className="pixl-btn" href="#calculator-tool">
                  Jump to calculator
                </a>
                <a className="premium-nav-link border border-mcp-border-soft" href="#related-calculators">
                  Compare with related tools
                </a>
              </div>
            </section>

            <section id="calculator-tool" className="premium-surface scroll-mt-28 p-4 md:p-6">
              <CalculatorModule slug={routeData.page.slug as CalculatorRouteSlug} />
            </section>

            <section className="premium-surface p-5 md:p-7">
              <div
                className="wp-content"
                dangerouslySetInnerHTML={{ __html: renderedBody.html }}
              />
              {renderedBlocks.length > 0 ? (
                <div className="mt-8 space-y-6 border-t border-mcp-border-soft pt-6">
                  {renderedBlocks.map((block) => (
                    <section key={block.block_key} className="wp-content">
                      {block.heading ? (
                        <h2 id={block.blockId ?? undefined} className="scroll-mt-28">
                          {block.heading}
                        </h2>
                      ) : null}
                      <div className="mt-3" dangerouslySetInnerHTML={{ __html: block.contentHtml }} />
                    </section>
                  ))}
                </div>
              ) : null}
              <RelatedCalculatorsGrid
                currentSlug={routeData.page.slug as CalculatorRouteSlug}
                slugs={CALCULATOR_ROUTE_SLUGS}
              />
            </section>
          </article>

          <PageToc title="Calculator guide" items={tocItems} className="hidden lg:block" />
        </div>
        <PageToc title="Calculator guide" items={tocItems} className="mt-6 lg:hidden" />
        <p className="sr-only">{getCalculatorTitle(routeData.page.slug as CalculatorRouteSlug)}</p>
      </main>
    );
  }

  return (
    <main id="main-content" className="mx-auto max-w-pixl-wide px-pixl-outer py-8 md:py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <article className="space-y-6">
          <section className="premium-surface p-5 md:p-7">
            {routeData.page.slug === "home" ? null : <Breadcrumbs items={breadcrumbItems} />}
            <p className="premium-eyebrow mt-4">Precision instruments</p>
            <h1 className="mt-2">{routeData.page.title}</h1>
            {routeData.page.excerpt?.trim() ? (
              <p className="mt-3 max-w-[66ch] text-mcp-text-body">{routeData.page.excerpt}</p>
            ) : null}
          </section>

          <section className="premium-surface p-5 md:p-7">
            <div className="wp-content" dangerouslySetInnerHTML={{ __html: renderedBody.html }} />

            {renderedBlocks.length > 0 ? (
              <div className="mt-8 space-y-6 border-t border-mcp-border-soft pt-6">
                {renderedBlocks.map((block) => (
                  <section key={block.block_key} className="wp-content">
                    {block.heading ? (
                      <h2 id={block.blockId ?? undefined} className="scroll-mt-28">
                        {block.heading}
                      </h2>
                    ) : null}
                    <div className="mt-3" dangerouslySetInnerHTML={{ __html: block.contentHtml }} />
                  </section>
                ))}
              </div>
            ) : null}
          </section>
        </article>
        <div className="hidden lg:block">
          <PageToc title="On this page" items={tocItems} />
        </div>
      </div>
      {tocItems.length > 0 ? (
        <div className="mt-6 lg:hidden">
          <PageToc title="On this page" items={tocItems} />
        </div>
      ) : null}
    </main>
  );
}
