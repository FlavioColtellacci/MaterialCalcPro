import type { Metadata } from "next";
import { DM_Mono } from "next/font/google";
import Script from "next/script";
import { getSiteSettings } from "@/lib/content/site-settings";
import "./globals.css";

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
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
  const siteSettings = await getSiteSettings();
  const primaryAdsenseClient = siteSettings.adsenseClientIds[0];

  return (
    <html lang="en" className={dmMono.variable}>
      <body className="min-h-screen font-[family-name:var(--font-dm-mono)] antialiased">
        {children}
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
