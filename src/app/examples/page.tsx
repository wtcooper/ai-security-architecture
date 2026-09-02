import { Suspense } from "react";
import { IncidentExplorer } from "@/components/examples/IncidentExplorer";

export const metadata = { title: "Incidents · AI Security Architecture" };

export default function ExamplesPage() {
  return <Suspense>
      <IncidentExplorer />
    </Suspense>;
}
