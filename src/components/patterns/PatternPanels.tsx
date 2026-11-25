"use client";

/**
 * Two panels of a pattern page that list what the drawing only marks: the risks that enter the
 * pattern, with where each enters and the controls here that reduce it; and the real incidents
 * that happened on it, the catalogue's walk-throughs first and then the newest feed reports.
 */
import Link from "next/link";

import { CategoryChip } from "@/components/incidents/chrome";
import { formatDay, formatMonth, incidentsNewestFirst } from "@/components/incidents/model";
import { controlName, feed, feedForPattern, mitigationsForArchetype, riskCategories, riskCode, risksForArchetype } from "@/lib/data";
import { ROUTES, feedHref, incidentHref, riskHref } from "@/lib/routes";
import type { Archetype, FeedItem } from "@/lib/types";

/** Where on the drawing a risk is pinned: the block, or both ends of the flow. */
function placements(archetype: Archetype, riskId: string) {
  const titles = new Map(archetype.blocks.map((b) => [b.id, b.title]));
  const pins = archetype.pins.risks.filter((p) => p.risk === riskId);
  const where = [...new Set(pins.map((p) => p.at.split("->").map((id) => titles.get(id) ?? id).join(" → ")))];
  const notes = [...new Set(pins.map((p) => p.note?.trim()).filter(Boolean) as string[])];
  return { where, notes };
}

export function PatternRisks({
  archetype,
  lit,
  onLight,
  onPickControl,
}: {
  archetype: Archetype;
  /** The risk lit on the drawing. */
  lit: string | null;
  onLight: (riskId: string | null) => void;
  /** Opens a control's row on Enable. */
  onPickControl: (id: string) => void;
}) {
  const risks = risksForArchetype(archetype.id);
  const pinned = mitigationsForArchetype(archetype.id);
  const number = new Map(archetype.mitigations.map((id, i) => [id, i + 1]));
  if (!risks.length) return null;
  return (
    <section aria-label="Risks on this pattern">
      <p className="max-w-3xl text-[13px] leading-relaxed text-ink-2">
        Open a risk to tag it on the drawing where it enters. The chips are the controls here that reduce it.
      </p>
      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
        {risks.map((r) => {
          const open = lit === r.id;
          const { where, notes } = placements(archetype, r.id);
          const reducedBy = pinned.filter((m) => m.risks.includes(r.id));
          return (
            <li key={r.id} id={`risk-${r.id}`}>
              <button
                type="button"
                onClick={() => onLight(open ? null : r.id)}
                aria-expanded={open}
                className={`grid w-full grid-cols-[44px_minmax(0,1fr)] gap-x-3 gap-y-1 px-4 py-2.5 text-left transition-colors hover:bg-mist/50 md:grid-cols-[44px_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.9fr)] ${open ? "bg-mist/50" : ""}`}
              >
                <span className="ident mt-px h-fit rounded-sm border border-line-strong bg-mist px-1 py-px text-center text-[10px] font-bold text-ink-2">{riskCode(r.id)}</span>
                <span className="text-[13.5px] font-semibold leading-snug text-ink">{r.title}</span>
                <span className="col-start-2 text-[12px] leading-snug text-ink-3 md:col-start-auto">{where.join(" · ")}</span>
                <span className="col-start-2 flex flex-wrap gap-1 md:col-start-auto" aria-label="Controls here that reduce it">
                  {reducedBy.map((m) => (
                    <span key={m.id} title={controlName(m.id)} className="flex h-[19px] w-[19px] items-center justify-center rounded-full border border-chip bg-chip-soft text-[10px] font-bold text-chip">
                      {number.get(m.id)}
                    </span>
                  ))}
                </span>
              </button>
              {open && (
                <div className="space-y-2.5 border-t border-line bg-mist/30 px-4 py-3 text-[12.5px] leading-relaxed text-ink-2 md:pl-[72px]">
                  <p className="text-[11.5px] text-ink-3">{riskCategories.find((c) => c.id === r.category)?.title}</p>
                  {notes.map((n) => <p key={n}>{n}</p>)}
                  {reducedBy.length > 0 && (
                    <div>
                      <p className="eyebrow">Reduced here by</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {reducedBy.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => onPickControl(m.id)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper py-0.5 pl-1 pr-2.5 text-[12px] text-ink-2 hover:border-chip hover:text-ink"
                          >
                            <span className="flex h-[19px] w-[19px] items-center justify-center rounded-full border border-chip bg-chip-soft text-[10px] font-bold text-chip">{number.get(m.id)}</span>
                            {controlName(m.id)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <Link href={riskHref(r.id)} className="inline-block text-[12px] font-semibold text-introduced hover:underline">
                    Full risk definition in Reference →
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** How many of the newest feed items the tab lists before it hands over to the feed. */
export const FEED_ON_PATTERN = 5;

export function PatternIncidents({ archetype, feed: items = feed }: { archetype: Archetype; /** The feed to read; the dataset's unless a test passes its own. */ feed?: FeedItem[] }) {
  const here = incidentsNewestFirst().filter((i) => i.archetype === archetype.id);
  const reports = feedForPattern(archetype.id, items);
  return (
    <div className="space-y-6">
      {here.length ? (
        <section aria-label="Incidents on this pattern">
          <p className="max-w-3xl text-[13px] leading-relaxed text-ink-2">
            Real incidents that happened on this pattern. Each opens a step-by-step walk across the drawing, ending at the controls that
            would have broken the chain.
          </p>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
            {here.map((i) => (
              <li key={i.id}>
                <Link href={incidentHref(i.id)} className="grid grid-cols-1 gap-x-5 gap-y-1.5 px-5 py-4 transition-colors hover:bg-mist/60 sm:grid-cols-[84px_minmax(0,1fr)_190px]">
                  <span className="ident pt-0.5 text-ink-3">{formatMonth(i.date)}</span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold leading-snug text-ink">{i.title}</span>
                    <span className="mt-1 line-clamp-2 block text-[13px] leading-snug text-ink-2">{i.subtitle}</span>
                  </span>
                  <span className="sm:text-right">
                    <CategoryChip category={i.category} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="rounded-xl border border-line bg-paper px-5 py-6 text-[13.5px] text-ink-2">
          No catalogued incident happened on this pattern yet.{" "}
          <Link href={ROUTES.incidents} className="font-semibold text-introduced hover:underline">See all incidents →</Link>
        </p>
      )}

      {reports.length > 0 && (
        <section aria-label="In the feed">
          <p className="eyebrow">In the feed</p>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-ink-2">The newest reports that would replay on this pattern.</p>
          <ul className="mt-2.5 divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
            {reports.slice(0, FEED_ON_PATTERN).map((f) => (
              <li key={f.id}>
                <Link
                  href={feedHref({ pattern: archetype.id }, f.id)}
                  className="grid grid-cols-[80px_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 px-5 py-2.5 transition-colors hover:bg-mist/60 sm:grid-cols-[84px_minmax(0,1fr)_auto]"
                >
                  <span className="ident whitespace-nowrap text-ink-3">{formatDay(f.date)}</span>
                  <span className="min-w-0 text-[13.5px] font-medium leading-snug text-ink">{f.title}</span>
                  <span className="col-start-2 sm:col-start-auto sm:text-right">
                    <CategoryChip category={f.category} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href={feedHref({ pattern: archetype.id })} className="mt-2.5 inline-block text-[13px] font-semibold text-introduced hover:underline">
            All {reports.length} in the feed →
          </Link>
        </section>
      )}
    </div>
  );
}
