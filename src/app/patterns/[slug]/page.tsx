import { Suspense } from "react";
import { PatternPage } from "@/components/patterns/PatternPage";
import { archetypes } from "@/lib/data";
import { FEED_ON_PATTERN, feedForPattern } from "@/lib/feed";
import { feedItems } from "@/lib/feed-server";

export const generateStaticParams = () => archetypes.map((a) => ({ slug: a.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pattern = archetypes.find((a) => a.slug === slug);
  return { title: `${pattern?.title ?? "Pattern"} · AI Security Architecture`, description: pattern?.useWhen };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pattern = archetypes.find((a) => a.slug === slug);
  // The Incidents tab lists the newest few; the page is given those and the count, not the feed.
  const incidents = pattern ? feedForPattern(pattern.id, feedItems) : [];
  return (
    <Suspense>
      <PatternPage archetypeId={pattern?.id ?? ""} feed={{ items: incidents.slice(0, FEED_ON_PATTERN), total: incidents.length }} />
    </Suspense>
  );
}
