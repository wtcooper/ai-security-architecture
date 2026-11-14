import { Suspense } from "react";
import { CapabilitiesBrowser } from "@/components/capabilities/CapabilitiesBrowser";

export const metadata = { title: "Controls · AI Security Architecture" };

export default function Page() {
  return (
    <Suspense>
      <CapabilitiesBrowser />
    </Suspense>
  );
}
