import Link from "next/link";
import type { CalculatorRouteSlug } from "@/lib/content/wp-pages";
import { getCalculatorTitle } from "@/lib/content/wp-pages";

type RelatedCalculatorsGridProps = {
  currentSlug: CalculatorRouteSlug;
  slugs: CalculatorRouteSlug[];
};

export function RelatedCalculatorsGrid({
  currentSlug,
  slugs,
}: RelatedCalculatorsGridProps) {
  const related = slugs.filter((slug) => slug !== currentSlug).slice(0, 6);

  if (related.length === 0) {
    return null;
  }

  return (
    <section id="related-calculators" className="mt-8 border-t border-mcp-border-soft pt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="premium-eyebrow">Continue estimating</p>
          <h2 className="mt-1">Related calculators</h2>
        </div>
        <Link className="pixl-btn" href="/calculators/">
          Browse all calculators
        </Link>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((slug) => (
          <article
            key={slug}
            className="premium-card p-4 transition-transform duration-200 ease-out hover:-translate-y-0.5"
          >
            <h3 className="text-base text-mcp-text-strong">{getCalculatorTitle(slug)}</h3>
            <p className="mt-2 text-sm text-mcp-text-body">
              Open the calculator to compare material quantities with the same premium workflow.
            </p>
            <Link className="mt-3 inline-block text-sm font-medium" href={`/${slug}/`}>
              Open calculator
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
