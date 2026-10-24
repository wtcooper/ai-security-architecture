import { Suspense } from "react";
import { IncidentList } from "@/components/incidents/IncidentList";

export const metadata = { title: "Incidents · AI Security Architecture" };

export default function IncidentsPage() {
  return (
    <Suspense>
      <IncidentList />
    </Suspense>
  );
}
