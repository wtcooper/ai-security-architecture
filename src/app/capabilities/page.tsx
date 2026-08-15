import { Suspense } from "react";
import { CapabilitiesBrowser } from "@/components/capabilities/CapabilitiesBrowser";

export const metadata = { title: "Capabilities · AI Risk Map" };

export default function CapabilitiesPage() {
  return (
    <Suspense>
      <CapabilitiesBrowser />
    </Suspense>
  );
}
