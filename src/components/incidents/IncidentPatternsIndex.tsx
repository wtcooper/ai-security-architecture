"use client";

/**
 * The Incidents index (/incidents/): how AI systems are being attacked, as a catalogue of
 * incident patterns built like the patterns index. One card per incident pattern, then every
 * deep dive in one compact list. Each card says what the incident pattern is, how much evidence
 * sits under it (its deep dives, and its feed reports of the last 30 days), the newest report
 * and the patterns it lands on most. Old links that filtered the old list are forwarded: a
 * `?category=` (or `?type=`) to that incident pattern's page, an `?arch=` to that pattern's
 * Incidents tab.
 */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { PageHeader } from "@/components/Panel";
import { archetypeById, incidentPatterns, incidentPatternView, incidents, meta } from "@/lib/data";
import { incidentPatternCards, RECENT_DAYS, type IncidentPatternCardFeed } from "@/lib/feed";
import { categoryColour } from "@/lib/incident-categories";
import { deepDivesNewestFirst } from "@/lib/incident-patterns";
import { ROUTES, feedHref, incidentHref, incidentPatternHref, patternHref } from "@/lib/routes";
import type { FeedItem, IncidentPattern, IncidentPatternAuthored } from "@/lib/types";
import { CategoryChip, plural } from "./chrome";
import { formatDay, formatMonth } from "./model";

/** How many of the patterns an incident pattern lands on its card names. */
export const LANDINGS_ON_CARD = 3;
export { RECENT_DAYS };

/** Where an old link to the incidents list goes now, or null when it names nothing to forward. Exported for the tests. */
export function legacyIncidentsTarget(params: URLSearchParams): string | null {
  const category = params.get("category") ?? params.get("type");
  if (category && incidentPatterns.some((p) => p.id === category)) return incidentPatternHref(category);
  const arch = params.get("arch");
  if (arch && archetypeById.has(arch)) return patternHref(arch, { tab: "incidents" });
  return null;
}

export function IncidentPatternsIndex({
  patterns = incidentPatterns,
  feed: whole,
  cards: built = {},
  total = meta.counts.feed ?? 0,
  today = meta.generatedAt.slice(0, 10),
}: {
  /** The incident patterns; the dataset's unless a test passes its own. */
  patterns?: IncidentPatternAuthored[];
  /** A whole feed to work everything out from, for a test. */
  feed?: FeedItem[];
  /** What each card shows of the feed, as the page was built with it: a count and the newest title, not the items. */
  cards?: Record<string, IncidentPatternCardFeed>;
  /** How many items the feed holds, of every kind. */
  total?: number;
  /** The day "the last 30 days" ends on: the day the site was built. */
  today?: string;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const forward = legacyIncidentsTarget(params);
  useEffect(() => {
    if (forward) router.replace(forward);
  }, [forward, router]);

  const views = patterns.map((p) => incidentPatternView(p, whole));
  const cards = whole ? incidentPatternCards(whole, today) : built;
  const count = whole ? whole.length : total;
  const deepDives = deepDivesNewestFirst(incidents);

  return (
    <>
      <PageHeader
        eyebrow={plural(views.length, "incident pattern")}
        title="Incidents"
        lead="How AI systems are being attacked, sorted into incident patterns. Each has an overview, the controls that stop it, and deep dives: real incidents told step by step."
      >
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          <a href="#deep-dives" className="font-semibold text-introduced hover:underline">
            {plural(deepDives.length, "deep dive")} ↓
          </a>
          <Link href={ROUTES.feed} className="font-semibold text-introduced hover:underline">
            {plural(count, "item")} in the feed →
          </Link>
        </p>
      </PageHeader>

      <div className="mx-auto w-full max-w-[1500px] px-4 py-7 sm:px-6">
        {views.length ? (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Incident patterns">
            {views.map((p) => (
              <IncidentPatternCard key={p.id} pattern={p} feed={cards[p.id] ?? { recent: 0 }} />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-line bg-paper px-5 py-6 text-[13.5px] text-ink-2">No incident pattern is written yet.</p>
        )}

        <section id="deep-dives" aria-labelledby="deep-dives-title" className="mt-10 scroll-mt-20">
          <h2 id="deep-dives-title" className="display text-[20px] font-bold text-ink">
            Deep dives <span className="ml-1 text-[14px] font-normal text-ink-3">{deepDives.length}</span>
          </h2>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-ink-2">
            Real incidents told step by step across the pattern each happened on, ending at the controls that would have broken the chain. Newest first.
          </p>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
            {deepDives.map((i) => (
              <li key={i.id} data-deep-dive={i.id}>
                <Link
                  href={incidentHref(i.id)}
                  className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 gap-y-1 px-4 py-2.5 transition-colors hover:bg-mist/60 sm:px-5 md:grid-cols-[84px_minmax(0,1fr)_minmax(0,220px)_minmax(0,200px)] md:items-baseline"
                >
                  <span className="ident whitespace-nowrap pt-0.5 text-ink-3">{formatMonth(i.date)}</span>
                  <span className="text-[13.5px] font-semibold leading-snug text-ink">{i.title}</span>
                  <span className="col-start-2 md:col-start-auto">
                    <CategoryChip category={i.category} />
                  </span>
                  <span className="col-start-2 text-[12px] leading-snug text-ink-3 md:col-start-auto">{archetypeById.get(i.archetype)?.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

/** One incident pattern: what it is, how much sits under it, the newest report and where it lands. */
function IncidentPatternCard({ pattern, feed: { recent, latest } }: { pattern: IncidentPattern; feed: IncidentPatternCardFeed }) {
  const colour = categoryColour(pattern.id);
  const landings = pattern.landsOn.slice(0, LANDINGS_ON_CARD);
  return (
    <li
      className="relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-paper transition-colors hover:border-ink-3"
      data-incident-pattern-card={pattern.id}
    >
      <span aria-hidden className="h-[3px] w-full" style={{ background: colour.rail }} />
      <div className="px-4 pb-3 pt-3.5">
        <h3 className="display text-[16.5px] font-bold leading-snug text-ink">
          {/* The name is the card's link; the links inside the card sit above it. */}
          <Link href={incidentPatternHref(pattern.id)} className="after:absolute after:inset-0 hover:text-introduced">
            {pattern.name}
          </Link>
        </h3>
        <p className="mt-1 text-[13px] leading-snug text-ink-2">{pattern.short}</p>
        <p className="ident mt-2 text-ink-3" data-card-counts>
          {plural(pattern.deepDives.length, "deep dive")} · {recent} in the feed, last {RECENT_DAYS} days
        </p>
      </div>
      <div className="border-t border-line px-4 py-2.5">
        <p className="eyebrow">Latest</p>
        {latest ? (
          <p className="mt-1 text-[12.5px] leading-snug" data-card-latest={latest.id}>
            <Link href={feedHref({ category: pattern.id }, latest.id)} className="relative z-10 font-medium text-ink hover:text-introduced hover:underline">
              {latest.title}
            </Link>{" "}
            <time dateTime={latest.date} className="whitespace-nowrap text-ink-3">
              {formatDay(latest.date)}
            </time>
          </p>
        ) : (
          <p className="mt-1 text-[12.5px] text-ink-3">Nothing in the feed yet.</p>
        )}
      </div>
      {landings.length > 0 && (
        <div className="mt-auto border-t border-line px-4 py-2.5">
          <p className="eyebrow">Lands on</p>
          <ul className="mt-1 space-y-0.5 text-[12.5px] leading-snug">
            {landings.map((l) => (
              <li key={l.pattern} className="flex items-baseline justify-between gap-3" data-card-lands={l.pattern}>
                <Link href={patternHref(l.pattern, { tab: "incidents" })} className="relative z-10 min-w-0 text-ink-2 hover:text-introduced hover:underline">
                  {archetypeById.get(l.pattern)?.title ?? l.pattern}
                </Link>
                <span className="ident shrink-0 text-ink-3">{l.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}
