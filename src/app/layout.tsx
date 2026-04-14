import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getSiteSettings } from "@/lib/content/site-settings";
import { getSearchablePages } from "@/lib/content/wp-pages";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-mcp-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-mcp-label",
  display: "swap",
});

function toMetadataBase(url: string): URL {
  try {
    return new URL(url);
  } catch {
    return new URL("https://materialcalcpro.com");
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings();

  return {
    title: {
      default: siteSettings.siteName,
      template: `%s | ${siteSettings.siteName}`,
    },
    description: siteSettings.siteDescription,
    metadataBase: toMetadataBase(siteSettings.canonicalBaseUrl),
    openGraph: {
      type: "website",
      siteName: siteSettings.siteName,
      title: siteSettings.siteName,
      description: siteSettings.siteDescription,
    },
    verification: siteSettings.googleSiteVerification
      ? { google: siteSettings.googleSiteVerification }
      : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteSettings, searchEntries] = await Promise.all([
    getSiteSettings(),
    getSearchablePages(),
  ]);
  const primaryAdsenseClient = siteSettings.adsenseClientIds[0];

  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="mcp-app-shell min-h-screen antialiased">
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <div className="flex min-h-screen flex-col">
          <SiteHeader siteName={siteSettings.siteName} searchEntries={searchEntries} />
          <div className="flex-1">{children}</div>
          <SiteFooter siteName={siteSettings.siteName} />
        </div>
        {siteSettings.ga4MeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${siteSettings.ga4MeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${siteSettings.ga4MeasurementId}');`}
            </Script>
          </>
        ) : null}
        {primaryAdsenseClient ? (
          <Script
            id="adsense-loader"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${primaryAdsenseClient}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
            async
          />
        ) : null}
      </body>
    </html>
  );
}
