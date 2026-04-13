import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WpPageContent } from "@/components/wp/wp-page-content";
import { buildMetadataFromRouteData } from "@/lib/content/route-metadata";
import {
  getStaticRouteParams,
  getWpRouteDataBySlug,
  normalizeWpSlugFromSegments,
} from "@/lib/content/wp-pages";

type RouteParams = {
  slug: string[];
};

type RouteProps = {
  params: Promise<RouteParams>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getStaticRouteParams();
}

export async function generateMetadata({
  params,
}: RouteProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = normalizeWpSlugFromSegments(resolvedParams.slug);
  if (!slug) {
    return {};
  }

  const routeData = await getWpRouteDataBySlug(slug);
  if (!routeData) {
    return {};
  }

  return buildMetadataFromRouteData(routeData);
}

export default async function WpSlugPage({ params }: RouteProps) {
  const resolvedParams = await params;
  const slug = normalizeWpSlugFromSegments(resolvedParams.slug);
  if (!slug || slug === "home") {
    notFound();
  }

  const routeData = await getWpRouteDataBySlug(slug);
  if (!routeData) {
    notFound();
  }

  return <WpPageContent routeData={routeData} />;
}
