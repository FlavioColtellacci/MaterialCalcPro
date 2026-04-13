import Link from "next/link";
import type { SearchablePage } from "@/lib/content/wp-pages";
import { SiteSearch } from "@/components/site/site-search";

type SiteHeaderProps = {
  siteName: string;
  searchEntries: SearchablePage[];
};

export function SiteHeader({ siteName, searchEntries }: SiteHeaderProps) {
  return (
    <header className="site-header border-b-2 border-pixl-primary">
      <div className="mx-auto flex max-w-pixl-wide flex-col gap-4 px-pixl-outer py-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link className="text-xl font-medium tracking-wide" href="/">
            {siteName}
          </Link>
          <p className="mt-1 text-sm">Material calculators and practical guides.</p>
        </div>
        <div className="w-full max-w-md">
          <SiteSearch entries={searchEntries} />
        </div>
      </div>
      <nav
        aria-label="Primary navigation"
        className="mx-auto max-w-pixl-wide px-pixl-outer pb-4"
      >
        <ul className="flex flex-wrap gap-4 text-sm">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/calculators/">Calculators</Link>
          </li>
          <li>
            <Link href="/privacy/">Privacy</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
