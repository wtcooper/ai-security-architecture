import { Suspense } from "react";
import { IncidentFeed } from "@/components/incidents/IncidentFeed";

/**
 * A static segment beside incidents/[id]: Next.js matches it before the dynamic one, and the
 * build refuses an incident whose id is "feed", so the two never claim the same address.
 */
export const metadata = { title: "Incident feed · AI Security Architecture" };

export default function IncidentFeedPage() {
  return (
    <Suspense>
      <IncidentFeed />
    </Suspense>
  );
}
