import Link from "next/link";

type SiteFooterProps = {
  siteName: string;
};

export function SiteFooter({ siteName }: SiteFooterProps) {
  return (
    <footer className="site-footer premium-shell mt-14 border-t border-mcp-border-soft">
      <div className="mx-auto grid max-w-pixl-wide gap-8 px-pixl-outer py-10 text-sm md:grid-cols-[1.3fr_1fr_1fr] md:items-start">
        <div className="space-y-2">
          <p className="premium-eyebrow">Built for accurate estimates</p>
          <p className="text-base font-medium tracking-wide text-mcp-text-strong">{siteName}</p>
          <p className="max-w-md text-mcp-text-body">
            Browse practical guides, compare materials, and reduce job-site surprises before
            ordering.
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <p className="text-xs uppercase tracking-[0.08em] text-mcp-text-muted">Explore</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-1">
            <li>
              <Link className="premium-nav-link" href="/privacy/">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link className="premium-nav-link" href="#">
                Terms of Service
              </Link>
            </li>
            <li>
              <a className="premium-nav-link" href="mailto:info@catalitium.com">
                Support
              </a>
            </li>
          </ul>
        </nav>
        <div className="premium-card p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-mcp-text-muted">Get started</p>
          <p className="mt-2 text-mcp-text-body">
            Need a quick estimate right now? Jump straight into the calculators hub.
          </p>
          <Link className="pixl-btn mt-4" href="/calculators/">
            Open calculators
          </Link>
          <p className="mt-3 text-xs text-mcp-text-muted">Updated tools and formulas each release.</p>
        </div>
      </div>
      <div className="border-t border-mcp-border-soft/80">
        <div className="mx-auto flex max-w-pixl-wide flex-col gap-1 px-pixl-outer py-4 text-xs text-mcp-text-muted md:flex-row md:items-center md:justify-between">
          <p>{siteName}</p>
          <p>Reliable quantities. Cleaner planning.</p>
        </div>
      </div>
    </footer>
  );
}
