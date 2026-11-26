import { Suspense } from "react";
import { IncidentFeed } from "@/components/incidents/IncidentFeed";
import { meta } from "@/lib/data";
import { feedWindow } from "@/lib/feed";
import { feedIndex, feedItems } from "@/lib/feed-server";

export const metadata = { title: "Daily feed · AI Security Architecture" };

/**
 * The daily review: the latest feed (what the run filed on its newest day), this week and every
 * week before it, each with its overview. Built with the newest days only (the whole of the newest
 * week, and everything filed in the newest days); the page loads older months from /data/feed/ as
 * the reader opens an older week.
 */
export default function FeedPage() {
  const { from, addedFrom, items } = feedWindow(feedItems);
  return (
    <Suspense>
      <IncidentFeed initial={items} from={from} addedFrom={addedFrom} index={feedIndex} today={meta.generatedAt.slice(0, 10)} />
    </Suspense>
  );
}
