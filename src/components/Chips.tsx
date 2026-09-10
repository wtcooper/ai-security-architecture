"use client";

import Link from "next/link";
import { frameworkById, org } from "@/lib/data";
import { FRAMEWORK_ORDER, frameworkHref } from "@/lib/frameworks";
import { useOrgOverlay } from "@/components/tooling/overlay";
import type { Mappings } from "@/lib/types";

export function Chip({
  children,
  tone = "neutral",
  title,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "introduced" | "exposed" | "mitigated";
  title?: string;
}) {
  const tones = {
    neutral: "bg-mist text-ink-2 border-line",
    introduced: "bg-introduced-soft text-introduced border-transparent",
    exposed: "bg-exposed-soft text-exposed border-transparent",
    mitigated: "bg-mitigated-soft text-mitigated border-transparent",
  } as const;
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-full border px-2.5 py-[3px] text-[12px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/**
 * Renders framework mappings as compact, linked identifier badges.
 *
 * `extra` carries mappings authored in this repository for a framework CoSAI does not
 * publish. They are marked, because every other badge here is CoSAI's own assertion.
 */
export function MappingBadges({
  mappings,
  extra,
}: {
  mappings?: Mappings;
  extra?: { frameworkId: string; values: string[]; authored: boolean }[];
}) {
  // The organisation's ids are an overlay, not part of the reference; they appear only when the
  // viewer has switched the overlay on (see components/tooling/overlay.ts).
  const overlay = useOrgOverlay();
  const merged: Record<string, { values: string[]; authored: boolean }> = {};
  for (const [id, values] of Object.entries(mappings ?? {})) {
    if (values?.length) merged[id] = { values, authored: false };
  }
  for (const e of extra ?? []) {
    if (!overlay && frameworkById.get(e.frameworkId)?.org) continue;
    if (e.authored && e.values.length) merged[e.frameworkId] = { values: e.values, authored: true };
  }

  // Organisation catalogues lead — they are what the reader is measured against — then the
  // external frameworks in their usual order, then anything else so a new one appears rather
  // than vanishing.
  const rank = (id: string) => {
    if (frameworkById.get(id)?.org) return -1;
    const i = FRAMEWORK_ORDER.indexOf(id);
    return i === -1 ? FRAMEWORK_ORDER.length : i;
  };
  const entries = Object.keys(merged)
    .sort((a, b) => rank(a) - rank(b))
    .map((id) => [id, merged[id].values, merged[id].authored] as const);
  if (!entries.length) return null;

  return (
    <div className="space-y-2">
      {entries.map(([id, values, authored]) => {
        const fw = frameworkById.get(id);
        return (
          <div key={id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
            <Link href={frameworkHref(id)} className="shrink-0 hover:opacity-70">
              <span className="eyebrow">{fw?.name ?? id}</span>
            </Link>
            {authored && fw?.org ? (
              <span
                className="ident shrink-0 text-ink-3"
                title={
                  org.example
                    ? "Example content shipped with the repository — replace data/org/example with your own catalogue."
                    : `Cross-mapped by ${org.name} in data/org/local.`
                }
              >
                {org.example ? "example organisation" : "your organisation"}
              </span>
            ) : authored ? (
              <span
                className="ident shrink-0 text-ink-3"
                title="CoSAI does not publish this mapping — it was authored in this repository."
              >
                authored
              </span>
            ) : null}
            {values.map((v) => {
              const bare = v.split("@")[0];
              return (
                <Link
                  key={v}
                  href={frameworkHref(id, bare)}
                  title={`See everything mapped to ${bare}`}
                  className="transition-opacity hover:opacity-70"
                >
                  <span className="ident rounded bg-mist px-1.5 py-[2px] text-ink-2">{bare}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
