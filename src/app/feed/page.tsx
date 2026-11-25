import { Suspense } from "react";
import { IncidentFeed } from "@/components/incidents/IncidentFeed";
import { initialWindow } from "@/lib/feed";
import { feedIndex, feedItems } from "@/lib/feed-server";

export const metadata = { title: "Daily feed · AI Security Architecture" };

/**
 * The daily review: every item, newest first, under its week. Built with the newest days only;
 * the page loads older months from /data/feed/ as the reader goes back in time.
 */
export default function FeedPage() {
  const { from, items } = initialWindow(feedItems);
  return (
    <Suspense>
      <IncidentFeed initial={items} from={from} index={feedIndex} />
    </Suspense>
  );
}
