import { Suspense } from "react";
import { LegacyRedirect } from "@/components/shell/LegacyRedirect";

export const metadata = { title: "Moved · AI Security Architecture" };

/** The capability catalogue is now the control catalogue at /controls. */
export default function Page() {
  return (
    <Suspense>
      <LegacyRedirect kind="catalogue" />
    </Suspense>
  );
}
