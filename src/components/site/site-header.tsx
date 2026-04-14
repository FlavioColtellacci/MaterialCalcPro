"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { SearchablePage } from "@/lib/content/wp-pages";
import { SiteSearch } from "@/components/site/site-search";

type SiteHeaderProps = {
  siteName: string;
  searchEntries: SearchablePage[];
};

export function SiteHeader({ siteName, searchEntries }: SiteHeaderProps) {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { href: "/calculators/", label: "Calculators" },
      { href: "#", label: "Pro Tools" },
      { href: "#", label: "Pricing" },
      { href: "/privacy/", label: "Support" },
    ],
    [],
  );

  useEffect(() => {
    setIsNavOpen(false);
  }, [pathname]);

  const isActiveHref = (href: string): boolean => {
    if (href === "#") {
      return false;
    }

    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  return (
    <header className="site-header premium-shell sticky top-0 z-50 border-b border-mcp-border-soft">
      <div className="mx-auto flex w-full max-w-pixl-wide flex-col gap-4 px-pixl-outer py-4">
        <div className="flex items-start justify-between gap-3 md:items-end">
          <div>
            <p className="premium-eyebrow">Precision instruments</p>
            <Link
              className="mt-1 inline-block text-2xl font-black tracking-tighter text-mcp-text-strong"
              href="/"
            >
              {siteName}
            </Link>
            <p className="mt-1 text-sm text-mcp-text-body md:max-w-[48ch]">
              Professional-grade material calculators for site planning, ordering, and estimation.
            </p>
          </div>
          <button
            type="button"
            className="premium-nav-toggle md:hidden"
            aria-expanded={isNavOpen}
            aria-controls="site-navigation"
            onClick={() => setIsNavOpen((value) => !value)}
          >
            <span className="sr-only">Toggle navigation</span>
            {isNavOpen ? "Close" : "Menu"}
          </button>
        </div>
        <div className="premium-surface w-full p-3 md:max-w-lg">
          <SiteSearch entries={searchEntries} />
        </div>
      </div>
      <nav
        id="site-navigation"
        aria-label="Primary navigation"
        className={`mx-auto w-full max-w-pixl-wide px-pixl-outer pb-4 ${isNavOpen ? "block" : "hidden"} md:block`}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <ul className="grid gap-2 rounded-[var(--mcp-radius-md)] border border-mcp-border-soft bg-mcp-surface p-2 text-sm shadow-mcp-sm md:flex md:flex-wrap md:gap-3 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
            {navItems.map((item) => (
              <li key={item.label}>
                {item.href.startsWith("/") ? (
                  <Link
                    className="premium-nav-link w-full justify-between md:w-auto md:justify-center"
                    data-active={isActiveHref(item.href)}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    className="premium-nav-link w-full justify-between md:w-auto md:justify-center"
                    href={item.href}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
          <Link className="pixl-btn self-start md:self-auto" href="#">
            Sign In
          </Link>
        </div>
      </nav>
    </header>
  );
}
