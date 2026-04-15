"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchablePage } from "@/lib/content/wp-pages";
import { SiteSearch } from "@/components/site/site-search";

const SUPPORT_EMAIL = "info@catalitium.com";
const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`;

const TAGLINE =
  "Professional-grade material calculators for site planning, ordering, and estimation.";

/** Ignore tiny scroll jitter; hide only after user has moved down a bit */
const SCROLL_DOWN_THRESHOLD = 72;
const DIRECTION_DELTA = 8;

type SiteHeaderProps = {
  siteName: string;
  searchEntries: SearchablePage[];
};

export function SiteHeader({ siteName, searchEntries }: SiteHeaderProps) {
  const pathname = usePathname();
  const [concealed, setConcealed] = useState(false);
  const lastScrollY = useRef(0);
  const frame = useRef<number | null>(null);

  const navItems = useMemo(
    () => [
      { href: "/calculators/", label: "Calculators" },
      { href: "/privacy/", label: "Privacy" },
      { href: SUPPORT_MAILTO, label: "Support" },
    ],
    [],
  );

  useEffect(() => {
    setConcealed(false);
    lastScrollY.current = typeof window !== "undefined" ? window.scrollY : 0;
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setConcealed(false);
      return;
    }

    const onScroll = () => {
      if (frame.current !== null) {
        return;
      }
      frame.current = window.requestAnimationFrame(() => {
        frame.current = null;
        const y = Math.max(0, window.scrollY);
        const prev = lastScrollY.current;
        const delta = y - prev;

        if (y < SCROLL_DOWN_THRESHOLD) {
          setConcealed(false);
        } else if (delta > DIRECTION_DELTA) {
          setConcealed(true);
        } else if (delta < -DIRECTION_DELTA) {
          setConcealed(false);
        }

        lastScrollY.current = y;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current !== null) {
        window.cancelAnimationFrame(frame.current);
      }
    };
  }, []);

  const isActiveHref = (href: string): boolean => {
    if (href.startsWith("mailto:")) {
      return false;
    }

    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  const navPanelClass =
    "rounded-xl border border-mcp-border-soft bg-mcp-surface/90 p-1.5 shadow-mcp-sm backdrop-blur-sm md:inline-flex md:flex-row md:flex-nowrap md:items-center md:gap-0.5 md:rounded-full md:p-1";

  return (
    <header className="site-header sticky top-0 z-50">
      <div
        className={[
          "premium-shell border-b border-mcp-border-soft",
          "transform-gpu transition-[transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
          concealed ? "-translate-y-full pointer-events-none" : "translate-y-0",
        ].join(" ")}
        inert={concealed ? true : undefined}
      >
        <div className="mx-auto max-w-pixl-wide px-pixl-outer py-3 md:py-3.5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,auto)_minmax(12rem,1fr)_auto] md:items-center md:gap-x-8 lg:grid-cols-[minmax(0,auto)_minmax(14rem,min(36vw,28rem))_auto]">
            <div className="flex items-center gap-3 md:justify-start">
              <div className="min-w-0 md:flex md:min-w-0 md:flex-col md:gap-1">
                <p className="premium-eyebrow text-[0.625rem] leading-none">Precision instruments</p>
                <Link
                  className="mt-1 block text-lg font-black leading-none tracking-tight text-mcp-text-strong md:mt-0 md:text-xl"
                  href="/"
                >
                  {siteName}
                </Link>
              </div>
            </div>

            <div className="min-w-0 w-full md:min-w-[12rem]">
              <SiteSearch compact entries={searchEntries} />
            </div>

            <nav
              id="site-navigation"
              aria-label="Primary navigation"
              className="w-full md:w-auto md:justify-self-end"
            >
              <ul className={`flex flex-col gap-0.5 text-sm ${navPanelClass}`}>
                {navItems.map((item) => (
                  <li key={item.label} className="md:inline-flex">
                    {item.href.startsWith("mailto:") ? (
                      <a
                        className="premium-nav-link w-full rounded-md md:w-auto md:rounded-full md:px-3.5 md:py-1.5"
                        href={item.href}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        className="premium-nav-link w-full rounded-md md:w-auto md:rounded-full md:px-3.5 md:py-1.5"
                        data-active={isActiveHref(item.href)}
                        href={item.href}
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <p className="mx-auto mt-2.5 max-w-[52rem] text-pretty border-t border-mcp-border-soft/70 pt-2.5 text-center text-[0.7rem] leading-relaxed text-mcp-text-body sm:text-xs">
            {TAGLINE}
          </p>
        </div>
      </div>
    </header>
  );
}
