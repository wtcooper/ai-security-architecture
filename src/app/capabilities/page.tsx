import { Suspense } from "react";
import { LegacyRedirect } from "@/components/shell/LegacyRedirect";

export const metadata = { title: "Moved · AI Security Architecture" };

/** The catalogue once lived here; it is now at /controls. */
export default function Page() {
  return (
    <Suspense>
      <LegacyRedirect kind="catalogue" />
    </Suspense>
  );
}
