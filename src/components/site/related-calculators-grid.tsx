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
    <section className="mt-pixl-gap border-t-2 border-pixl-primary pt-pixl-gap">
      <h2>Related calculators</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((slug) => (
          <article
            key={slug}
            className="pixl-shadow-block border-2 border-pixl-primary bg-pixl-tertiary p-4"
          >
            <h3 className="text-base">{getCalculatorTitle(slug)}</h3>
            <Link className="mt-2 inline-block text-sm" href={`/${slug}/`}>
              Open calculator
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
