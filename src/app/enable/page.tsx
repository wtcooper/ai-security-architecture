import { Suspense } from "react";
import { LegacyRedirect } from "@/components/shell/LegacyRedirect";

export const metadata = { title: "Moved · AI Security Architecture" };

/** Enable is a tab on each pattern. */
export default function Page() {
  return (
    <Suspense>
      <LegacyRedirect kind="pattern" to="/patterns" defaultTab="enable" />
    </Suspense>
  );
}
