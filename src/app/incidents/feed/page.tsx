import { Suspense } from "react";
import { LegacyRedirect } from "@/components/shell/LegacyRedirect";
import { ROUTES } from "@/lib/routes";

export const metadata = { title: "Moved · AI Security Architecture" };

/**
 * The feed moved to /feed/. A static segment beside incidents/[id]: Next.js matches it before the
 * dynamic one, and the build refuses a deep dive id or incident pattern slug of "feed", so the
 * two never claim the same address. The query (filters) and the anchor (an item) are kept.
 */
export default function Page() {
  return (
    <Suspense>
      <LegacyRedirect kind="path" to={ROUTES.feed} />
    </Suspense>
  );
}
