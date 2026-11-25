import { Suspense } from "react";
import { IncidentPatternsIndex } from "@/components/incidents/IncidentPatternsIndex";

export const metadata = { title: "Incidents · AI Security Architecture" };

/** The incident patterns, then every deep dive. */
export default function IncidentsPage() {
  return (
    <Suspense>
      <IncidentPatternsIndex />
    </Suspense>
  );
}
