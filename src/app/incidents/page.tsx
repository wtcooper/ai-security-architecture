import { Suspense } from "react";
import { IncidentPatternsIndex } from "@/components/incidents/IncidentPatternsIndex";
import { meta } from "@/lib/data";
import { incidentItems, incidentPatternCards, initialWindow, RECENT_DAYS, toReport } from "@/lib/feed";
import { feedIndex, feedItems } from "@/lib/feed-server";

export const metadata = { title: "Incidents · AI Security Architecture" };

/**
 * The incident patterns, the recent incident reports, then every deep dive. Each card is given its
 * count and its newest title, not the feed; the report list is given the last month of incidents,
 * cut down to what a row shows, and loads older months as its filters or the reader want them.
 */
export default function IncidentsPage() {
  const today = meta.generatedAt.slice(0, 10);
  const { from, items } = initialWindow(incidentItems(feedItems), RECENT_DAYS);
  return (
    <Suspense>
      <IncidentPatternsIndex
        cards={incidentPatternCards(feedItems, today)}
        total={feedItems.length}
        today={today}
        reports={items.map(toReport)}
        reportsFrom={from}
        reportsIndex={{ months: feedIndex.months, incidents: feedIndex.incidents }}
      />
    </Suspense>
  );
}
