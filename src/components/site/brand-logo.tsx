type BrandLogoProps = {
  siteName: string;
  className?: string;
};

/**
 * Vector wordmark + mark for the header only. Transparent background, scales crisply.
 */
export function BrandLogo({ siteName, className }: BrandLogoProps) {
  const proSplit = siteName.endsWith("Pro");
  const baseName = proSplit ? siteName.slice(0, -3) : siteName;

  return (
    <svg
      className={className}
      viewBox="0 0 360 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
      preserveAspectRatio="xMinYMid meet"
    >
      <g>
        <rect
          x="2"
          y="6"
          width="44"
          height="44"
          rx="10"
          fill="var(--mcp-color-text-strong, #1a1715)"
        />
        <rect x="12" y="16" width="24" height="5" rx="1.5" fill="var(--mcp-color-accent, #ff6b00)" />
        <rect x="12" y="25" width="24" height="5" rx="1.5" fill="rgb(255 251 247 / 0.92)" />
        <rect x="12" y="34" width="24" height="5" rx="1.5" fill="var(--mcp-color-accent, #ff6b00)" />
      </g>
      <text
        x="56"
        y="38"
        fill="var(--mcp-color-text-strong, #1a1715)"
        style={{
          fontFamily: "var(--font-mcp-label, ui-sans-serif), Space Grotesk, system-ui, sans-serif",
          fontSize: "26px",
          fontWeight: 800,
          letterSpacing: "-0.03em",
        }}
      >
        {proSplit ? (
          <>
            <tspan fill="var(--mcp-color-text-strong, #1a1715)">{baseName}</tspan>
            <tspan fill="var(--mcp-color-accent, #ff6b00)">Pro</tspan>
          </>
        ) : (
          siteName
        )}
      </text>
    </svg>
  );
}
