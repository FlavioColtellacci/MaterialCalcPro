type TocItem = {
  id: string;
  title: string;
  level: 2 | 3;
};

type PageTocProps = {
  items: TocItem[];
  title?: string;
  className?: string;
};

export function PageToc({ items, title = "On this page", className }: PageTocProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <aside
      className={`page-toc premium-card sticky top-4 h-fit p-4 ${className ?? ""}`.trim()}
      aria-label={title}
    >
      <p className="text-sm font-medium text-mcp-text-strong">{title}</p>
      <ul className="mt-2 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
            <a className="page-toc__link" href={`#${item.id}`}>
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
