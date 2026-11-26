"use client";

/**
 * "Recent incident reports" on /incidents/: every incident the daily feed has filed, newest first,
 * one line each (its day, its title, the patterns it would replay on, its incident pattern and its
 * evidence), each opening the item on the feed. The filters that narrow incidents live here, all
 * in the address so a filtered list can be linked: incident pattern (`?category=`), pattern
 * (`?pattern=`), evidence (`?evidence=`) and `?incident=`, the reports one deep dive tells.
 *
 * The page is built with the last month of reports. Older months load from /data/feed/ when a
 * filter is on (so its counts and its list are whole) or the reader asks for more.
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { archetypeById, archetypesInOrder, incidentById, surfaces } from "@/lib/data";
import { incidentItems, toReport, type IncidentReport } from "@/lib/feed";
import { evidenceById, FEED_EVIDENCE } from "@/lib/feed-vocabulary";
import { categoryById, INCIDENT_CATEGORIES } from "@/lib/incident-categories";
import { feedHref, incidentHref, incidentPatternHref, incidentReportsQuery, REPORTS_ANCHOR, type IncidentReportFilters } from "@/lib/routes";
import type { FeedItem, FeedMonthsIndex } from "@/lib/types";
import { CategoryChip, CategoryDot, EvidenceTag, filterChip } from "./chrome";
import { formatDay, formatMonth } from "./model";
import { useFeedMonths } from "./months";

/** How many reports the list shows before "Show more". */
export const REPORTS_SHOWN = 25;

/** A loaded month, as the list keeps it: its incidents, cut down to what a row and the filters read. */
const toReports = (items: FeedItem[]): IncidentReport[] => incidentItems(items).map(toReport);

const tally = (values: string[]) => {
  const out: Record<string, number> = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return out;
};

/** The counts the filters start from, for a list given whole (a test). */
const indexOf = (reports: IncidentReport[]): FeedMonthsIndex => ({
  months: [],
  incidents: {
    category: tally(reports.map((f) => f.category ?? "")),
    evidence: tally(reports.map((f) => f.evidence ?? "")),
    pattern: tally(reports.flatMap((f) => f.patterns)),
  },
});

export function IncidentReports({
  reports: whole,
  initial = [],
  from = "",
  index: givenIndex,
  loadMonth,
}: {
  /** Every report, for a test: nothing is loaded later. */
  reports?: IncidentReport[];
  /** The newest reports, built with the page: every one dated `from` or later. */
  initial?: IncidentReport[];
  from?: string;
  /** The months and the counts the filters start from. */
  index?: FeedMonthsIndex;
  loadMonth?: (month: string) => Promise<FeedItem[]>;
}) {
  const index = useMemo(() => givenIndex ?? indexOf(whole ?? initial), [givenIndex, whole, initial]);
  const params = useSearchParams();
  const linked = (key: keyof IncidentReportFilters, known: (v: string) => boolean) => {
    const v = params.get(key);
    return v && known(v) ? v : null;
  };
  const [category, setCategory] = useState(() => linked("category", (v) => categoryById.has(v)));
  const [pattern, setPattern] = useState(() => linked("pattern", (v) => archetypeById.has(v)));
  const [evidence, setEvidence] = useState(() => linked("evidence", (v) => evidenceById.has(v)));
  const [incident, setIncident] = useState(() => linked("incident", (v) => incidentById.has(v)));
  const [limit, setLimit] = useState(REPORTS_SHOWN);
  const filtered = Boolean(category || pattern || evidence || incident);

  const matches = (f: IncidentReport, skip?: "category" | "pattern" | "evidence") =>
    (skip === "category" || !category || f.category === category) &&
    (skip === "pattern" || !pattern || f.patterns.includes(pattern)) &&
    (skip === "evidence" || !evidence || f.evidence === evidence) &&
    (!incident || f.incident === incident);

  const months = useFeedMonths({
    whole,
    initial,
    from,
    index,
    loadMonth,
    select: toReports,
    // A filter wants every month, so its counts and its list are whole; "Show more", as many as it shows.
    want: (_covered, loaded) => filtered || (limit > REPORTS_SHOWN && loaded.filter((f) => matches(f)).length < limit),
  });
  const { items } = months;
  const complete = months.next === null;

  // The filters stay shareable and survive Back; replaceState keeps the GitHub Pages basePath and the #.
  useEffect(() => {
    const query = incidentReportsQuery({ category, pattern, evidence, incident });
    window.history.replaceState(null, "", `${query ? `?${query}` : window.location.pathname}${window.location.hash}`);
  }, [category, pattern, evidence, incident]);

  // Each filter's counts follow the others, so an option never promises reports the list will not
  // show. Until every month is loaded, they are the whole feed's, from the index.
  const allIncidents = Object.values(index.incidents.category).reduce((n, c) => n + c, 0);
  const count = {
    category: (id: string | null) => (complete ? items.filter((f) => matches(f, "category") && (!id || f.category === id)).length : id ? index.incidents.category[id] ?? 0 : allIncidents),
    pattern: (id: string) => (complete ? items.filter((f) => matches(f, "pattern") && f.patterns.includes(id)).length : index.incidents.pattern[id] ?? 0),
    evidence: (id: string) => (complete ? items.filter((f) => matches(f, "evidence") && f.evidence === id).length : index.incidents.evidence[id] ?? 0),
  };
  const shown = items.filter((f) => matches(f));
  const total = complete || !filtered ? (complete ? shown.length : allIncidents) : null;
  const patternsInFeed = archetypesInOrder.filter((a) => a.id === pattern || (index.incidents.pattern[a.id] ?? 0) > 0);
  const clear = () => {
    setCategory(null);
    setPattern(null);
    setEvidence(null);
    setIncident(null);
  };
  const told = incident ? incidentById.get(incident) : undefined;
  const on = category ? categoryById.get(category) : undefined;
  const select =
    "min-w-0 max-w-full flex-1 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[13px] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-introduced sm:flex-none";

  return (
    <section id={REPORTS_ANCHOR} aria-labelledby="reports-title" className="mt-10 scroll-mt-20" data-incident-reports>
      <h2 id="reports-title" className="display text-[20px] font-bold text-ink">
        Recent incident reports <span className="ml-1 text-[14px] font-normal text-ink-3" data-reports-count={total ?? ""}>{total ?? `${shown.length}+`}</span>
      </h2>
      <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-ink-2">
        Every incident the daily feed has filed, newest first. Narrow them by how the attack started (the incident pattern), the pattern it would replay on, and how
        well it is established. Each opens its item in the feed.
      </p>

      <div className="mt-3 rounded-xl border border-line bg-paper/60 px-3 py-3 sm:px-4" data-incident-filters>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Incident pattern">
          <button type="button" onClick={() => setCategory(null)} aria-pressed={category === null} className={filterChip(category === null)}>
            All <span className="font-normal opacity-70">{count.category(null)}</span>
          </button>
          {INCIDENT_CATEGORIES.map((c) => {
            const n = count.category(c.id);
            return (
              <button
                key={c.id}
                type="button"
                title={c.blurb}
                data-category-chip={c.id}
                onClick={() => setCategory(category === c.id ? null : c.id)}
                aria-pressed={category === c.id}
                disabled={n === 0 && category !== c.id}
                className={`${filterChip(category === c.id)} inline-flex items-center gap-1.5 disabled:opacity-40`}
              >
                <CategoryDot category={c.id} />
                {c.label} <span className="font-normal opacity-70">{n}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
          <label className="flex min-w-0 max-w-full items-center gap-2 text-[12.5px] text-ink-3">
            Pattern
            <select value={pattern ?? ""} onChange={(e) => setPattern(e.target.value || null)} className={select} data-pattern-filter>
              <option value="">All patterns</option>
              {surfaces.map((s) => {
                const list = patternsInFeed.filter((a) => a.surface === s.id);
                return list.length ? (
                  <optgroup key={s.id} label={s.title}>
                    {list.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} ({count.pattern(a.id)})
                      </option>
                    ))}
                  </optgroup>
                ) : null;
              })}
            </select>
          </label>
          <label className="flex min-w-0 max-w-full items-center gap-2 text-[12.5px] text-ink-3">
            Evidence
            <select value={evidence ?? ""} onChange={(e) => setEvidence(e.target.value || null)} className={select} data-evidence-filter>
              <option value="">Any evidence</option>
              {FEED_EVIDENCE.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label} ({count.evidence(e.id)})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {on && (
        <p className="mt-3 max-w-3xl text-[12.5px] leading-snug text-ink-3">
          {on.blurb}{" "}
          <Link href={incidentPatternHref(on.id)} className="font-semibold text-introduced hover:underline">
            About this incident pattern →
          </Link>
        </p>
      )}

      {told && (
        <p className="mt-3 text-[13px] text-ink-2" data-told={told.id}>
          Showing the reports told step by step in the deep dive{" "}
          <Link href={incidentHref(told.id)} className="font-semibold text-ink hover:text-introduced hover:underline">
            {told.title}
          </Link>
          .{" "}
          <button type="button" onClick={() => setIncident(null)} className="font-semibold text-introduced hover:underline">
            Show every report
          </button>
        </p>
      )}

      {shown.length > 0 ? (
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
          {shown.slice(0, limit).map((f) => (
            <li key={f.id} data-report={f.id}>
              <Link
                href={feedHref({}, f.id)}
                className="grid grid-cols-[76px_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 px-4 py-2.5 transition-colors hover:bg-mist/60 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:px-5"
              >
                <time dateTime={f.date} className="ident whitespace-nowrap text-ink-3">
                  {formatDay(f.date)}
                </time>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold leading-snug text-ink">{f.title}</span>
                  {f.patterns.length > 0 && (
                    <span className="mt-0.5 block text-[12px] leading-snug text-ink-3">Replays on {f.patterns.map((id) => archetypeById.get(id)?.title ?? id).join(" · ")}</span>
                  )}
                </span>
                <span className="col-start-2 flex flex-wrap items-center gap-1.5 sm:col-start-auto sm:justify-end">
                  {f.category && <CategoryChip category={f.category} />}
                  {f.evidence && <EvidenceTag evidence={f.evidence} />}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        (complete || !months.loading) && (
          <p className="mt-3 rounded-xl border border-line bg-paper px-5 py-6 text-[13.5px] text-ink-2">
            {filtered ? (
              <>
                Nothing matches these filters.{" "}
                <button type="button" onClick={clear} className="font-semibold text-introduced hover:underline">
                  Clear them
                </button>
              </>
            ) : (
              "No incident report in the feed yet."
            )}
          </p>
        )
      )}

      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px]">
        {shown.length > limit && (
          <button type="button" onClick={() => setLimit((n) => n + REPORTS_SHOWN)} className="font-semibold text-introduced hover:underline" data-reports-more>
            Show {Math.min(REPORTS_SHOWN, shown.length - limit)} more
          </button>
        )}
        {months.next &&
          (months.failed ? (
            <button type="button" onClick={months.retry} className="font-semibold text-introduced hover:underline">
              {formatMonth(months.failed)} did not load. Try again
            </button>
          ) : months.loading ? (
            <span className="text-ink-3" aria-live="polite">
              Loading {formatMonth(months.loading)}…
            </span>
          ) : (
            shown.length <= limit && (
              <button type="button" onClick={months.loadNext} className="font-semibold text-introduced hover:underline" data-reports-older={months.next}>
                Older reports ({formatMonth(months.next)}) →
              </button>
            )
          ))}
        {filtered && shown.length > 0 && (
          <button type="button" onClick={clear} className="font-semibold text-ink-3 hover:text-ink hover:underline">
            Clear the filters
          </button>
        )}
      </div>
    </section>
  );
}
