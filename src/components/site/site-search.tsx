"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SearchablePage } from "@/lib/content/wp-pages";

type SiteSearchProps = {
  entries: SearchablePage[];
};

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function SiteSearch({ entries }: SiteSearchProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = normalizeQuery(query);

  const matches = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return entries
      .filter((entry) => {
        const haystack = `${entry.title} ${entry.excerpt}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .slice(0, 6);
  }, [entries, normalizedQuery]);

  return (
    <div className="site-search">
      <label className="site-search__label" htmlFor="site-search-input">
        Search pages
      </label>
      <input
        className="w-full"
        id="site-search-input"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search calculators and guides"
        autoComplete="off"
      />
      {normalizedQuery.length > 0 ? (
        <ul className="site-search__results">
          {matches.length > 0 ? (
            matches.map((entry) => (
              <li key={entry.slug}>
                <Link href={entry.href}>{entry.title}</Link>
              </li>
            ))
          ) : (
            <li className="site-search__empty">No matching pages found.</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
