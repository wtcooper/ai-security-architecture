"use client";

/**
 * Incidents moved from /examples to /incidents, one page each. An old link to an incident lands
 * on its page; any other lands on the list.
 */
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { incidentById } from "@/lib/data";

export function ExamplesRedirect() {
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const id = params.get("incident");
    router.replace(id && incidentById.has(id) ? `/incidents/${id}` : "/incidents");
  }, [params, router]);
  return <p className="mx-auto max-w-5xl px-6 py-16 text-[14px] text-ink-3">Incidents have moved. Taking you there…</p>;
}
