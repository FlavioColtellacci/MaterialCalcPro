import Link from "next/link";

type SiteFooterProps = {
  siteName: string;
};

export function SiteFooter({ siteName }: SiteFooterProps) {
  return (
    <footer className="site-footer mt-12 border-t-2 border-pixl-primary">
      <div className="mx-auto flex max-w-pixl-wide flex-col gap-2 px-pixl-outer py-6 text-sm md:flex-row md:items-center md:justify-between">
        <p>{siteName}</p>
        <nav aria-label="Footer navigation">
          <ul className="flex gap-4">
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
      </div>
    </footer>
  );
}
