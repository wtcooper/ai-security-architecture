"use client";

/**
 * Enable moved onto each architecture as its Enable tab. Old links — an architecture, a product,
 * a capability anchor — land on the same place there.
 */
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function EnableRedirect() {
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const query = new URLSearchParams({ tab: "enable" });
    for (const key of ["archetype", "tool"]) {
      const value = params.get(key);
      if (value) query.set(key, value);
    }
    router.replace(`/reference?${query}${window.location.hash}`);
  }, [params, router]);
  return <p className="mx-auto max-w-5xl px-6 py-16 text-[14px] text-ink-3">Enable is now a tab on each architecture. Taking you there…</p>;
}
