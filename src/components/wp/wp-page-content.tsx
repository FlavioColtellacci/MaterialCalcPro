import type { WpRouteData, WpRouteSlug } from "@/lib/content/wp-pages";
import { CalculatorModule } from "@/components/calculators/calculator-module";

const SITE_ORIGIN_REGEX = /https:\/\/materialcalcpro\.com\//gi;
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

function toRenderableHtml(html: string): string {
  return html
    .replace(SCRIPT_TAG_REGEX, "")
    .replace(SITE_ORIGIN_REGEX, "/")
    .trim();
}

type WpPageContentProps = {
  routeData: WpRouteData;
};

const CALCULATOR_SLUGS = new Set([
  "concrete-calculator",
  "paint-calculator",
  "tile-calculator",
  "gravel-calculator",
  "drywall-calculator",
  "roofing-calculator",
  "flooring-calculator",
  "asphalt-calculator",
  "fence-post-calculator",
  "brick-calculator",
]);

export function WpPageContent({ routeData }: WpPageContentProps) {
  const isCalculatorPage = CALCULATOR_SLUGS.has(routeData.page.slug);

  return (
    <main className="mx-auto max-w-pixl-wide px-pixl-outer py-pixl-outer">
      <article className="pixl-shadow-block mx-auto max-w-pixl-content border-2 border-pixl-primary bg-pixl-background p-pixl-gap">
        <h1>{routeData.page.title}</h1>
        {isCalculatorPage ? (
          <div className="mt-pixl-gap">
            <CalculatorModule
              slug={routeData.page.slug as Exclude<WpRouteSlug, "home" | "privacy">}
            />
          </div>
        ) : null}

        <section
          className="wp-content mt-pixl-gap"
          dangerouslySetInnerHTML={{ __html: toRenderableHtml(routeData.page.body_html) }}
        />

        {routeData.blocks.length > 0 ? (
          <div className="mt-pixl-gap border-t-2 border-pixl-primary pt-pixl-gap">
            {routeData.blocks.map((block) => (
              <section key={block.block_key} className="wp-content mt-6 first:mt-0">
                {block.heading ? <h2>{block.heading}</h2> : null}
                <div
                  dangerouslySetInnerHTML={{
                    __html: toRenderableHtml(block.content_html),
                  }}
                />
              </section>
            ))}
          </div>
        ) : null}
      </article>
    </main>
  );
}
