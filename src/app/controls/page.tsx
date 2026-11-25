import { Suspense } from "react";
import { ControlsBrowser } from "@/components/controls/ControlsBrowser";
import { securityTools } from "@/lib/feed-server";

export const metadata = { title: "Controls · AI Security Architecture" };

/** The control catalogue. The security tools are given to this page alone, so they stay out of every other page's bundle. */
export default function Page() {
  return (
    <Suspense>
      <ControlsBrowser securityTools={securityTools} />
    </Suspense>
  );
}
