import Link from "next/link";
import { frameworkById } from "@/lib/data";
import { frameworkHref } from "@/lib/frameworks";
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

const FRAMEWORK_ORDER = [
  "owasp-llm-2026",
  "owasp-agentic",
  "mitre-atlas",
  "stride",
  "nist-ai-rmf",
  "eu-ai-act",
  "iso-22989",
];

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
  const merged: Record<string, { values: string[]; authored: boolean }> = {};
  for (const [id, values] of Object.entries(mappings ?? {})) {
    if (values?.length) merged[id] = { values, authored: false };
  }
  for (const e of extra ?? []) {
    if (e.authored && e.values.length) merged[e.frameworkId] = { values: e.values, authored: true };
  }

  const entries = FRAMEWORK_ORDER.filter((id) => merged[id]).map(
    (id) => [id, merged[id].values, merged[id].authored] as const,
  );
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
            {authored && (
              <span
                className="ident shrink-0 text-ink-3"
                title="CoSAI does not publish this mapping — it was authored in this repository."
              >
                authored
              </span>
            )}
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
