import type { Metadata } from "next";
import {
  CALCULATOR_ROUTE_SLUGS,
  getCalculatorTitle,
  getSearchablePages,
} from "@/lib/content/wp-pages";
import {
  createHubCategories,
  HubCategoryGrid,
  HubFeaturedCards,
  HubHero,
  HubQuickActions,
  HubSection,
  inferCategory,
} from "@/components/site/calculators-hub-sections";

export const metadata: Metadata = {
  title: "Calculators",
  description: "Browse all MaterialCalcPro construction material calculators.",
};

export default async function CalculatorsHubPage() {
  const pages = await getSearchablePages();
  const bySlug = new Map(pages.map((page) => [page.slug, page]));
  const calculatorItems = CALCULATOR_ROUTE_SLUGS.map((slug) => {
    const page = bySlug.get(slug);

    return {
      slug,
      title: getCalculatorTitle(slug),
      href: `/${slug}/`,
      excerpt: page?.excerpt,
      category: inferCategory(slug),
    };
  });
  const categories = createHubCategories(calculatorItems);

  return (
    <main id="main-content" className="mx-auto max-w-pixl-wide space-y-6 px-pixl-outer py-8 md:py-10">
      <HubHero totalCount={calculatorItems.length} />

      <HubSection
        eyebrow="Featured workflows"
        title="Start with proven estimators"
        description="Spotlight cards are prioritized from the active calculator catalog, keeping this area fully aligned with your route and content contracts."
      >
        <HubFeaturedCards items={calculatorItems} />
      </HubSection>

      <HubSection
        id="categories"
        eyebrow="Material filters"
        title="Browse by material category"
        description="Each section groups calculators by practical usage patterns so crews can jump to concrete, masonry, aggregate, or surface coverage tasks quickly."
      >
        <HubCategoryGrid categories={categories} />
      </HubSection>

      <HubQuickActions />
    </main>
  );
}
