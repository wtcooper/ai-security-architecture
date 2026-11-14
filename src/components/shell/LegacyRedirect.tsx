"use client";

/**
 * Forwards an address the site used before patterns became the front door. The site is a static
 * export, so there are no server redirects: each retired path keeps a page that renders this,
 * which reads the old query and anchor and replaces the address with the new one.
 *
 *   path       the same query and anchor at a new path (/risks -> /reference/risks)
 *   pattern    /reference?archetype=…&tab=…&tool=… and /enable?… -> /patterns/<slug>/
 *   catalogue  /capabilities?capability=… -> /controls?control=…
 */
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { archetypeById, cloudById, toolById } from "@/lib/data";
import { PATTERN_TABS, ROUTES, controlHref, patternHref, type PatternTab } from "@/lib/routes";

/** Where an old pattern link goes now, or null when it names no pattern. Exported for the tests. */
export function legacyPatternTarget(params: URLSearchParams, hash = "", defaultTab?: PatternTab): string | null {
  const toolId = params.get("tool");
  const tool = toolId ? toolById.get(toolId) : undefined;
  const archetypeId = tool?.architecture ?? params.get("archetype");
  if (!archetypeId || !archetypeById.has(archetypeId)) return null;
  const linked = params.get("tab") as PatternTab | null;
  const product = toolId && (tool || cloudById.has(toolId)) ? toolId : undefined;
  const control = hash.match(/^#(?:capability|control)-(.+)$/)?.[1];
  const tab = product || control ? "enable" : linked && PATTERN_TABS.includes(linked) ? linked : defaultTab;
  return patternHref(archetypeId, { tab, tool: product, control });
}

/** Where an old catalogue link goes now. */
export function legacyCatalogueTarget(params: URLSearchParams): string {
  const next = new URLSearchParams(params);
  const id = next.get("capability");
  next.delete("capability");
  const rest = next.size ? `&${next}` : "";
  return id ? `${controlHref(id)}${rest}` : `${ROUTES.controls}${next.size ? `?${next}` : ""}`;
}

export function LegacyRedirect({
  kind,
  to,
  defaultTab,
  quiet = false,
}: {
  kind: "path" | "pattern" | "catalogue";
  /** The new path, for `path`; where a `pattern` link with no pattern in it goes. */
  to?: string;
  /** The tab an old pattern link opens when it names none: the old page opened on the overview. */
  defaultTab?: PatternTab;
  /** Render nothing: the page has content of its own and only forwards old links. */
  quiet?: boolean;
}) {
  const params = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const query = new URLSearchParams(params.toString());
    const hash = window.location.hash;
    if (kind === "path") router.replace(`${to}${query.size ? `?${query}` : ""}${hash}`);
    else if (kind === "catalogue") router.replace(legacyCatalogueTarget(query));
    else {
      const target = legacyPatternTarget(query, hash, defaultTab);
      if (target) router.replace(target);
      else if (to) router.replace(to);
    }
  }, [kind, to, defaultTab, params, router]);
  if (quiet) return null;
  return <p className="mx-auto max-w-5xl px-6 py-16 text-[14px] text-ink-3">This page has moved. Taking you there…</p>;
}
