import type { Metadata } from "next";
import Link from "next/link";
import {
  CALCULATOR_ROUTE_SLUGS,
  getCalculatorTitle,
  getSearchablePages,
  type CalculatorRouteSlug,
} from "@/lib/content/wp-pages";

export const metadata: Metadata = {
  title: "Calculators",
  description: "Browse all MaterialCalcPro construction material calculators.",
};

export default async function CalculatorsHubPage() {
  const pages = await getSearchablePages();
  const bySlug = new Map(pages.map((page) => [page.slug, page]));

  return (
    <main id="main-content" className="mx-auto max-w-pixl-wide px-pixl-outer py-pixl-outer">
      <article className="pixl-shadow-block mx-auto max-w-pixl-wide border-2 border-pixl-primary bg-pixl-background p-pixl-gap">
        <h1>Calculators</h1>
        <p className="mt-3 max-w-pixl-content">
          Pick a calculator to estimate quantities quickly with unit conversions and waste
          allowances.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CALCULATOR_ROUTE_SLUGS.map((slug) => {
            const page = bySlug.get(slug);
            return (
              <article
                key={slug}
                className="pixl-shadow-block border-2 border-pixl-primary bg-pixl-tertiary p-4"
              >
                <h2 className="text-base">{getCalculatorTitle(slug as CalculatorRouteSlug)}</h2>
                {page?.excerpt ? <p className="mt-2 text-sm">{page.excerpt}</p> : null}
                <Link className="mt-3 inline-block text-sm" href={`/${slug}/`}>
                  Open calculator
                </Link>
              </article>
            );
          })}
        </div>
      </article>
    </main>
  );
}
