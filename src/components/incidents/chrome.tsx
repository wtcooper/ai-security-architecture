"use client";

/**
 * What the incident pages share: the filter chips, the chip that names an incident pattern, the
 * kind and evidence tags a feed item carries, and the breadcrumb under /incidents/.
 */
import Link from "next/link";
import type { ReactNode } from "react";

import { categoryById, categoryColour } from "@/lib/incident-categories";
import { evidenceById, kindById } from "@/lib/feed-vocabulary";
import { ROUTES, incidentPatternHref } from "@/lib/routes";

/** A filter chip: ink when on, paper when off. */
export const filterChip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-[12.5px] font-semibold transition-colors ${
    active ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink-2 hover:border-ink-3 hover:text-ink"
  }`;

/** The incident pattern's own colour, as a small dot beside its name. */
export function CategoryDot({ category, className = "" }: { category: string; className?: string }) {
  return <span aria-hidden className={`inline-block h-2 w-2 shrink-0 rounded-full ${className}`} style={{ background: categoryColour(category).rail }} />;
}

/**
 * The incident pattern a deep dive or a feed item is filed under. With `link`, it opens that
 * incident pattern's page; inside a row that is itself a link, it is plain text.
 */
export function CategoryChip({ category, link = false }: { category: string; link?: boolean }) {
  const c = categoryById.get(category);
  const className = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-mist px-2.5 py-[2px] text-[11.5px] font-semibold text-ink-2";
  const body = (
    <>
      <CategoryDot category={category} />
      {c?.label ?? category}
    </>
  );
  return link && c ? (
    <Link href={incidentPatternHref(category)} title={c.blurb} data-incident-pattern={category} className={`${className} hover:border-ink-3 hover:text-ink`}>
      {body}
    </Link>
  ) : (
    <span title={c?.blurb} data-incident-pattern={category} className={className}>
      {body}
    </span>
  );
}

/**
 * What kind of item a feed entry is. Each kind has a hue of its own on the left edge of its tag,
 * so a day's mix reads at a glance; the tag itself stays quiet, as the evidence tag does.
 */
export const KIND_HUE: Record<string, string> = {
  incident: "var(--exposed)",
  productUpdate: "var(--introduced)",
  tool: "var(--mitigated)",
  launch: "var(--band-data-rail)",
  research: "var(--chip)",
};

export function KindTag({ kind }: { kind: string }) {
  const k = kindById.get(kind);
  return (
    <span
      title={k?.blurb}
      data-kind={kind}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-paper px-2 py-[1px] text-[11px] font-semibold uppercase tracking-wide text-ink-2"
    >
      <span aria-hidden className="inline-block h-2 w-2 rounded-sm" style={{ background: KIND_HUE[kind] ?? "var(--ink-3)" }} />
      {k?.label ?? kind}
    </span>
  );
}

/** How well a feed item is established. A tag, never a rank; only a single report is tinted, as a caveat is. */
export function EvidenceTag({ evidence }: { evidence: string }) {
  const e = evidenceById.get(evidence);
  const single = evidence === "reported";
  return (
    <span
      title={e?.blurb}
      className="whitespace-nowrap rounded-full border px-2 py-[1px] text-[11px] font-medium"
      style={
        single
          ? { borderColor: "var(--band-data-edge)", background: "var(--band-data-fill)", color: "var(--ink-2)" }
          : { borderColor: "var(--line)", color: "var(--ink-3)" }
      }
    >
      {e?.label ?? evidence}
    </span>
  );
}

/** "Incidents › …": where a page sits under /incidents/. The last crumb is the page itself. */
export function IncidentsBreadcrumb({ trail }: { trail: { label: ReactNode; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[12.5px] text-ink-3">
      <ol className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
        <li>
          <Link href={ROUTES.incidents} className="font-semibold text-ink-2 hover:text-ink hover:underline">
            Incidents
          </Link>
        </li>
        {trail.map((t, i) => (
          <li key={i} className="flex min-w-0 items-baseline gap-x-1.5">
            <span aria-hidden>›</span>
            {t.href ? (
              <Link href={t.href} className="font-semibold text-ink-2 hover:text-ink hover:underline">
                {t.label}
              </Link>
            ) : (
              <span aria-current="page" className="min-w-0">
                {t.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
