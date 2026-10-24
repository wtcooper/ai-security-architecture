import { Suspense } from "react";
import { ExamplesRedirect } from "@/components/incidents/ExamplesRedirect";

export const metadata = { title: "Incidents · AI Security Architecture" };

/** The old address: forwards to /incidents. */
export default function ExamplesPage() {
  return (
    <Suspense>
      <ExamplesRedirect />
    </Suspense>
  );
}
