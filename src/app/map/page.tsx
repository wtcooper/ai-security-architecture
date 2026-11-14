import { Suspense } from "react";
import { LegacyRedirect } from "@/components/shell/LegacyRedirect";

export const metadata = { title: "Moved · AI Security Architecture" };

/** The risk map moved under Reference. */
export default function Page() {
  return (
    <Suspense>
      <LegacyRedirect kind="path" to="/reference/risk-map" />
    </Suspense>
  );
}
