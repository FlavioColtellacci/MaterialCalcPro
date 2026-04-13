import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WpPageContent } from "@/components/wp/wp-page-content";
import { buildMetadataFromRouteData } from "@/lib/content/route-metadata";
import { getWpRouteDataBySlug } from "@/lib/content/wp-pages";

export async function generateMetadata(): Promise<Metadata> {
  const routeData = await getWpRouteDataBySlug("home");
  if (!routeData) {
    return {};
  }

  return buildMetadataFromRouteData(routeData);
}

export default async function HomePage() {
  const routeData = await getWpRouteDataBySlug("home");
  if (!routeData) {
    notFound();
  }

  return <WpPageContent routeData={routeData} />;
}
