import { Suspense } from "react";
import { IncidentFeed } from "@/components/incidents/IncidentFeed";

export const metadata = { title: "Feed · AI Security Architecture" };

/** The daily review: every incident tracked, newest first, under its week. */
export default function FeedPage() {
  return (
    <Suspense>
      <IncidentFeed />
    </Suspense>
  );
}
