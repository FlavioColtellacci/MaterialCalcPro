type TocItem = {
  id: string;
  title: string;
  level: 2 | 3;
};

type PageTocProps = {
  items: TocItem[];
};

export function PageToc({ items }: PageTocProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <aside className="page-toc sticky top-4 h-fit border-2 border-pixl-primary bg-pixl-tertiary p-4">
      <p className="text-sm font-medium">On this page</p>
      <ul className="mt-2 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
            <a href={`#${item.id}`}>{item.title}</a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
