"use client";

/**
 * What the two Incidents pages share: the switch between the catalogue and the feed under the
 * heading, the filter chips, and the tags an incident or a feed item carries.
 */
import Link from "next/link";

import { categoryById, evidenceById } from "@/lib/incident-categories";
import { ROUTES } from "@/lib/routes";

/** A filter chip: ink when on, paper when off. */
export const filterChip = (active: boolean) =>
  `rounded-full border px-3 py-1 text-[12.5px] font-semibold transition-colors ${
    active ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink-2 hover:border-ink-3 hover:text-ink"
  }`;

/** The Incidents section has two views; the nav item stays "Incidents" and the catalogue is the default. */
export function IncidentsSwitch({ current, catalogue, feed }: { current: "catalogue" | "feed"; catalogue: number; feed: number }) {
  const views = [
    { id: "catalogue", label: "Catalogue", href: ROUTES.incidents, count: catalogue, title: "The incidents that teach something new, each told step by step" },
    { id: "feed", label: "Feed", href: ROUTES.incidentFeed, count: feed, title: "Every incident we track, newest first" },
  ] as const;
  return (
    <nav aria-label="Incidents views" className="mt-5 inline-flex rounded-lg border border-line bg-mist p-0.5">
      {views.map((v) => {
        const on = current === v.id;
        return (
          <Link
            key={v.id}
            href={v.href}
            title={v.title}
            aria-current={on ? "page" : undefined}
            className={`rounded-md px-3 py-1 text-[13px] transition-colors ${on ? "bg-paper font-semibold text-ink shadow-sm" : "text-ink-3 hover:text-ink"}`}
          >
            {v.label} <span className="ml-0.5 font-normal opacity-70">{v.count}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** An incident's or a feed item's attack type, as the catalogue list shows it. */
export function CategoryChip({ category }: { category: string }) {
  const c = categoryById.get(category);
  return (
    <span title={c?.blurb} className="whitespace-nowrap rounded-full border border-line bg-mist px-2.5 py-[2px] text-[11.5px] font-semibold text-ink-2">
      {c?.label ?? category}
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
