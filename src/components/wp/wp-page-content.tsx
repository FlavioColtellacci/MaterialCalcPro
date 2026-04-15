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
/* After normalizeHeadingTags(), WP h3 blocks become h4+ — include h2–h6 for TOC anchors */
const HEADING_WITH_CONTENT_REGEX = /<h([2-6])([^>]*)>([\s\S]*?)<\/h\1>/gi;
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
    .replace(/ilcapofla@gmail\.com/gi, "info@catalitium.com")
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
      const level = Number(levelText) as 2 | 3 | 4 | 5 | 6;
      const headingTitle = stripHtml(headingContent);
      if (!headingTitle) {
        return fullMatch;
      }

      const existingId = extractIdFromAttributes(attributes);
      const baseId = existingId || `${idPrefix}-${toSlug(headingTitle)}`;
      const id = getUniqueId(baseId, usedIds);
      const attrsWithoutId = attributes.replace(/\sid=(['"])(.*?)\1/i, "");
      const tocLevel: 2 | 3 = level <= 2 ? 2 : 3;
      tocItems.push({
        id,
        title: headingTitle,
        level: tocLevel,
      });

      return `<h${level}${attrsWithoutId} id="${id}">${headingContent}</h${level}>`;
    },
  );

  return { html: renderedHtml, tocItems };
}

type WpPageContentProps = {
  routeData: WpRouteData;
};

function buildArticleSideSummary(routeData: WpRouteData): string {
  const excerpt = routeData.page.excerpt?.trim();
  if (excerpt) {
    return excerpt;
  }
  const plain = stripHtml(routeData.page.body_html).replace(/\s+/g, " ").trim();
  if (plain.length > 0) {
    return plain.length > 280 ? `${plain.slice(0, 280)}…` : plain;
  }
  return "Browse construction material calculators for quick, practical quantity estimates.";
}

type ArticleSideRailProps = {
  tocItems: TocItem[];
  tocTitle: string;
  routeData: WpRouteData;
  readMinutes: number;
  variant: "default" | "calculator";
  className?: string;
};

function ArticleSideRail({
  tocItems,
  tocTitle,
  routeData,
  readMinutes,
  variant,
  className,
}: ArticleSideRailProps) {
  if (tocItems.length > 0) {
    return <PageToc title={tocTitle} items={tocItems} className={className} />;
  }

  const summary = buildArticleSideSummary(routeData);
  return (
    <aside
      className={`premium-card sticky top-4 h-fit space-y-4 p-4 ${className ?? ""}`.trim()}
      aria-label="Page overview"
    >
      <p className="text-xs uppercase tracking-[0.08em] text-mcp-text-muted">Overview</p>
      <p className="text-sm leading-relaxed text-mcp-text-body">{summary}</p>
      <p className="text-xs text-mcp-text-muted">About {readMinutes} min read</p>
      {variant === "calculator" ? (
        <div className="flex flex-col gap-2">
          <a className="pixl-btn text-center text-sm" href="#calculator-tool">
            Open calculator
          </a>
          <a
            className="premium-nav-link justify-center border border-mcp-border-soft py-2 text-sm"
            href="#related-calculators"
          >
            Related calculators
          </a>
        </div>
      ) : (
        <Link className="pixl-btn text-center text-sm" href="/calculators/">
          Browse all calculators
        </Link>
      )}
    </aside>
  );
}

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
            <section className="premium-surface p-6 md:p-8">
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

            <section className="premium-surface p-6 md:p-8">
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
            <ArticleSideRail
              tocItems={tocItems}
              tocTitle="Privacy sections"
              routeData={routeData}
              readMinutes={readMinutes}
              variant="default"
              className="hidden xl:block"
            />
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
        <div className="mt-6 xl:hidden">
          <ArticleSideRail
            tocItems={tocItems}
            tocTitle="Privacy sections"
            routeData={routeData}
            readMinutes={readMinutes}
            variant="default"
          />
        </div>
      </main>
    );
  }

  if (isCalculatorPage) {
    return (
      <main id="main-content" className="mx-auto max-w-pixl-wide px-pixl-outer py-8 md:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <article className="space-y-6">
            <section className="premium-surface p-6 md:p-8">
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

            <section className="premium-surface p-6 md:p-8">
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

          <ArticleSideRail
            tocItems={tocItems}
            tocTitle="Calculator guide"
            routeData={routeData}
            readMinutes={readMinutes}
            variant="calculator"
            className="hidden lg:block"
          />
        </div>
        <div className="mt-6 lg:hidden">
          <ArticleSideRail
            tocItems={tocItems}
            tocTitle="Calculator guide"
            routeData={routeData}
            readMinutes={readMinutes}
            variant="calculator"
          />
        </div>
        <p className="sr-only">{getCalculatorTitle(routeData.page.slug as CalculatorRouteSlug)}</p>
      </main>
    );
  }

  return (
    <main id="main-content" className="mx-auto max-w-pixl-wide px-pixl-outer py-8 md:py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <article className="space-y-6">
          <section className="premium-surface p-6 md:p-8">
            {routeData.page.slug === "home" ? null : <Breadcrumbs items={breadcrumbItems} />}
            <p className="premium-eyebrow mt-4">Precision instruments</p>
            <h1 className="mt-2">{routeData.page.title}</h1>
            {routeData.page.excerpt?.trim() ? (
              <p className="mt-3 max-w-[66ch] text-mcp-text-body">{routeData.page.excerpt}</p>
            ) : null}
          </section>

          <section className="premium-surface p-6 md:p-8">
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
        <ArticleSideRail
          tocItems={tocItems}
          tocTitle="On this page"
          routeData={routeData}
          readMinutes={readMinutes}
          variant="default"
          className="hidden lg:block"
        />
      </div>
      <div className="mt-6 lg:hidden">
        <ArticleSideRail
          tocItems={tocItems}
          tocTitle="On this page"
          routeData={routeData}
          readMinutes={readMinutes}
          variant="default"
        />
      </div>
    </main>
  );
}
