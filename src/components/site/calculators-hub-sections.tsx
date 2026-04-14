import Link from "next/link";

type HubCalculatorItem = {
  slug: string;
  title: string;
  href: string;
  excerpt?: string;
  category: string;
};

type HubCategory = {
  key: string;
  label: string;
  description: string;
  items: HubCalculatorItem[];
};

type HubSectionProps = {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

const MATERIAL_FILTERS = [
  { key: "all", label: "All Materials", description: "Complete access to every calculator workflow." },
  { key: "structural", label: "Structural", description: "Framing, concrete, roofing, and assembly quantities." },
  { key: "finishing", label: "Finishing", description: "Paint, tile, flooring, and coverage-focused planning." },
  { key: "landscaping", label: "Landscaping", description: "Outdoor volume, tonnage, and surface prep estimates." },
];

export function inferCategory(slug: string): string {
  if (/paint|tile|grout|floor|insulation/i.test(slug)) {
    return "finishing";
  }

  if (/gravel|asphalt|mulch|landscape|fence-post/i.test(slug)) {
    return "landscaping";
  }

  return "structural";
}

export function createHubCategories(items: HubCalculatorItem[]): HubCategory[] {
  const grouped = new Map<string, HubCalculatorItem[]>();

  for (const item of items) {
    const current = grouped.get(item.category) ?? [];
    current.push(item);
    grouped.set(item.category, current);
  }

  return MATERIAL_FILTERS.filter((filter) => filter.key !== "all")
    .map((filter) => ({
    ...filter,
    items: grouped.get(filter.key) ?? [],
    }))
    .filter((category) => category.items.length > 0);
}

export function HubSection({ id, eyebrow, title, description, children }: HubSectionProps) {
  return (
    <section id={id} className="premium-card p-6 md:p-8">
      <p className="premium-eyebrow">{eyebrow}</p>
      <h2 className="mt-2">{title}</h2>
      <p className="mt-2 max-w-[68ch] text-sm text-mcp-text-body md:text-base">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function HubHero({ totalCount }: { totalCount: number }) {
  return (
    <section id="hub-top" className="premium-surface p-6 md:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="premium-eyebrow">Precision instruments</p>
          <h1 className="mt-2">
            Calculators
            <br />
            <span className="text-mcp-text-muted/55">Hub.</span>
          </h1>
          <p className="mt-3 max-w-[66ch] text-sm text-mcp-text-body md:text-base">
            Pick a calculator to estimate quantities quickly with unit conversions and waste
            allowances.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <article className="premium-card bg-mcp-muted/65 p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-mcp-text-muted">Available tools</p>
            <p className="mt-2 text-3xl font-medium leading-none text-mcp-text-strong">
              {totalCount}
            </p>
            <p className="mt-1 text-sm text-mcp-text-body">Live calculators and quantity helpers.</p>
          </article>
          <article className="premium-card bg-mcp-surface p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-mcp-text-muted">Workflow</p>
            <p className="mt-2 text-mcp-text-strong">
              {"Choose material -> run estimate -> order"}
            </p>
            <p className="mt-1 text-sm text-mcp-text-body">Consistent units and waste allowances.</p>
          </article>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {MATERIAL_FILTERS.map((filter) => (
          <a
            className="premium-nav-link border border-mcp-border-soft bg-mcp-surface/80"
            href={filter.key === "all" ? "#categories" : `#${filter.key}`}
            key={filter.key}
          >
            {filter.label}
          </a>
        ))}
      </div>
    </section>
  );
}

export function HubFeaturedCards({ items }: { items: HubCalculatorItem[] }) {
  if (items.length === 0) {
    return null;
  }

  const spotlight = items[0];
  const secondary = items.slice(1, 3);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <article className="premium-card border-mcp-border-strong bg-mcp-surface p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.08em] text-mcp-text-muted">Most used</p>
        <h3 className="mt-2">{spotlight.title}</h3>
        <p className="mt-2 text-sm text-mcp-text-body">
          {spotlight.excerpt ?? "Fast estimate workflow with practical output values."}
        </p>
        <Link className="pixl-btn mt-4" href={spotlight.href}>
          Open calculator
        </Link>
      </article>
      <div className="grid gap-4">
        {secondary.map((item) => (
          <article className="premium-card p-5" key={item.slug}>
            <p className="text-xs uppercase tracking-[0.08em] text-mcp-text-muted">{item.category}</p>
            <h3 className="mt-1 text-base">{item.title}</h3>
            {item.excerpt ? <p className="mt-2 text-sm text-mcp-text-body">{item.excerpt}</p> : null}
            <Link className="premium-nav-link mt-3" href={item.href}>
              Open calculator
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

export function HubCategoryGrid({ categories }: { categories: HubCategory[] }) {
  return (
    <div className="grid gap-5">
      {categories.map((category) => (
        <article className="premium-card p-5 md:p-6" id={category.key} key={category.key}>
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="premium-eyebrow">{category.label}</p>
              <p className="mt-1 max-w-[60ch] text-sm text-mcp-text-body">{category.description}</p>
            </div>
            <p className="text-xs text-mcp-text-muted">{category.items.length} calculators</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {category.items.map((item) => (
              <article className="rounded-[var(--mcp-radius-sm)] border border-mcp-border-soft bg-mcp-surface px-4 py-3" key={item.slug}>
                <h3 className="text-base">{item.title}</h3>
                {item.excerpt ? <p className="mt-1 text-sm text-mcp-text-body">{item.excerpt}</p> : null}
                <Link className="premium-nav-link mt-3" href={item.href}>
                  Open calculator
                </Link>
              </article>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

export function HubQuickActions() {
  return (
    <div className="fixed bottom-6 right-6 z-40 hidden md:block">
      <a
        href="#categories"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--mcp-color-accent)_0%,var(--mcp-color-accent-strong)_100%)] text-2xl text-white shadow-mcp-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mcp-border-strong"
        aria-label="Browse calculator categories"
      >
        ⌕
      </a>
    </div>
  );
}
