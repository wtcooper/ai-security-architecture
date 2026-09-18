import { Suspense } from "react";
import { MitigationsBrowser } from "@/components/mitigations/MitigationsBrowser";

export const metadata = { title: "Mitigations · AI Risk Map" };

export default function MitigationsPage() {
  return (
    <Suspense>
      <MitigationsBrowser />
    </Suspense>
  );
}
