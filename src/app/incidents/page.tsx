import { Suspense } from "react";
import { IncidentPatternsIndex } from "@/components/incidents/IncidentPatternsIndex";
import { meta } from "@/lib/data";
import { incidentPatternCards } from "@/lib/feed";
import { feedItems } from "@/lib/feed-server";

export const metadata = { title: "Incidents · AI Security Architecture" };

/** The incident patterns, then every deep dive. Each card is given its count and its newest title, not the feed. */
export default function IncidentsPage() {
  const today = meta.generatedAt.slice(0, 10);
  return (
    <Suspense>
      <IncidentPatternsIndex cards={incidentPatternCards(feedItems, today)} total={feedItems.length} today={today} />
    </Suspense>
  );
}
