"use client";

/**
 * The feed (/feed/): the daily review. Every AI security incident tracked, newest first, each in
 * two or three lines under the week it came to light, filed under its incident pattern and naming
 * the patterns it would replay on. Nothing is ranked but the date. What is new since the reader's
 * last visit is counted in the header and marked on the item. Three filters (incident pattern,
 * pattern, evidence) ride in the address, so a filtered feed can be linked and comes back on
 * Back; a fourth, `incident`, narrows it to the reports one deep dive tells and is reached from
 * that deep dive's page. An item's anchor is its id, which is how search lands on it.
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { PageHeader } from "@/components/Panel";
import { archetypeById, archetypesInOrder, feed as datasetFeed, incidentById, surfaces } from "@/lib/data";
import { evidenceById, FEED_EVIDENCE } from "@/lib/feed-vocabulary";
import { categoryById, INCIDENT_CATEGORIES } from "@/lib/incident-categories";
import { feedQuery, incidentHref, incidentPatternHref, patternHref, ROUTES, type FeedFilters } from "@/lib/routes";
import type { FeedItem } from "@/lib/types";
import { CategoryChip, CategoryDot, EvidenceTag, filterChip, plural } from "./chrome";
import { newSince, useLastVisit, type Visit } from "./last-visit";
import { byWeek, formatDay, formatLongDay, formatShortDay } from "./model";

/** The item named after the # in the address. Empty on the server, so hydration agrees. */
const subscribeHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};
const readHash = () => decodeURIComponent(window.location.hash.slice(1));
const useHash = () => useSyncExternalStore(subscribeHash, readHash, () => "");

export function IncidentFeed({
  items: given = datasetFeed,
  lastVisit,
}: {
  items?: FeedItem[];
  /** The reader's previous visit, for a test; the browser's own record otherwise. */
  lastVisit?: Visit | null;
}) {
  // Newest first, ties as given: the feed is built that way, and a list passed in is held to it.
  const items = [...given].sort((a, b) => b.date.localeCompare(a.date));
  const params = useSearchParams();
  const linked = (key: keyof FeedFilters, known: (v: string) => boolean) => {
    const v = params.get(key);
    return v && known(v) ? v : null;
  };
  const [category, setCategory] = useState(() => linked("category", (v) => categoryById.has(v)));
  const [pattern, setPattern] = useState(() => linked("pattern", (v) => archetypeById.has(v)));
  const [evidence, setEvidence] = useState(() => linked("evidence", (v) => evidenceById.has(v)));
  const [incident, setIncident] = useState(() => linked("incident", (v) => incidentById.has(v)));
  const hash = useHash();
  const visit = useLastVisit(items);
  const previous = lastVisit !== undefined ? lastVisit : visit.previous;
  const fresh = newSince(items, previous);

  // Filters stay shareable and survive Back. replaceState rather than router.push keeps the
  // GitHub Pages basePath, and the # keeps the item a link landed on.
  useEffect(() => {
    const query = feedQuery({ category, pattern, evidence, incident });
    window.history.replaceState(null, "", `${query ? `?${query}` : window.location.pathname}${window.location.hash}`);
  }, [category, pattern, evidence, incident]);

  // The page is drawn in the browser, after the browser looked for the # and found nothing.
  useEffect(() => {
    if (hash) document.getElementById(hash)?.scrollIntoView({ block: "start" });
  }, [hash]);

  // Each filter's counts follow the others, so an option never promises reports the list will not show.
  const matches = (f: FeedItem, skip?: "category" | "pattern" | "evidence") =>
    (skip === "category" || !category || f.category === category) &&
    (skip === "pattern" || !pattern || f.patterns.includes(pattern)) &&
    (skip === "evidence" || !evidence || f.evidence === evidence) &&
    (!incident || f.incident === incident);
  const shown = items.filter((f) => matches(f));
  const forCategory = items.filter((f) => matches(f, "category"));
  const forPattern = items.filter((f) => matches(f, "pattern"));
  const forEvidence = items.filter((f) => matches(f, "evidence"));
  const patternsInFeed = archetypesInOrder.filter((a) => a.id === pattern || items.some((f) => f.patterns.includes(a.id)));
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
    <>
      <PageHeader
        eyebrow="Feed"
        title="The incident feed"
        lead="Every AI security incident we track, newest first: what happened, the incident pattern it belongs to and the patterns it would replay on. Reviewed daily."
      >
        <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px] text-ink-3" data-feed-status>
          <span>{plural(items.length, "report")}</span>
          {items[0] && <span>Latest {formatLongDay(items[0].date)}</span>}
          {previous ? (
            <span className={fresh.size ? "font-semibold text-ink" : undefined} data-feed-new={fresh.size}>
              {fresh.size ? `${fresh.size} new` : "Nothing new"} since your last visit
              <span className="font-normal text-ink-3"> ({formatDay(new Date(previous.at).toISOString().slice(0, 10))})</span>
            </span>
          ) : (
            visit.ready && <span>New reports are marked from your next visit.</span>
          )}
        </p>
      </PageHeader>

      <div className="mx-auto w-full max-w-5xl px-6 py-7">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Incident pattern">
          <button type="button" onClick={() => setCategory(null)} aria-pressed={category === null} className={filterChip(category === null)}>
            All <span className="font-normal opacity-70">{forCategory.length}</span>
          </button>
          {INCIDENT_CATEGORIES.map((c) => {
            const n = forCategory.filter((f) => f.category === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                title={c.blurb}
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
            <select value={pattern ?? ""} onChange={(e) => setPattern(e.target.value || null)} className={select}>
              <option value="">All patterns</option>
              {surfaces.map((s) => {
                const list = patternsInFeed.filter((a) => a.surface === s.id);
                return list.length ? (
                  <optgroup key={s.id} label={s.title}>
                    {list.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} ({forPattern.filter((f) => f.patterns.includes(a.id)).length})
                      </option>
                    ))}
                  </optgroup>
                ) : null;
              })}
            </select>
          </label>
          <label className="flex min-w-0 max-w-full items-center gap-2 text-[12.5px] text-ink-3">
            Evidence
            <select value={evidence ?? ""} onChange={(e) => setEvidence(e.target.value || null)} className={select}>
              <option value="">Any evidence</option>
              {FEED_EVIDENCE.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label} ({forEvidence.filter((f) => f.evidence === e.id).length})
                </option>
              ))}
            </select>
          </label>
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
          <p className="mt-4 text-[13px] text-ink-2">
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

        {shown.length ? (
          <div className="mt-6 space-y-7">
            {byWeek(shown).map(({ week, items: inWeek }) => (
              <section key={week} aria-labelledby={`week-${week}`}>
                <h2 id={`week-${week}`} className="flex items-baseline justify-between gap-3 border-b border-line pb-1.5 text-[13.5px] font-semibold text-ink">
                  Week of {formatLongDay(week)}
                  <span className="text-[12px] font-normal text-ink-3">{plural(inWeek.length, "report")}</span>
                </h2>
                <ul className="mt-2.5 divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
                  {inWeek.map((f) => (
                    <FeedRow key={f.id} item={f} inView={hash === f.id} isNew={fresh.has(f.id)} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : items.length ? (
          <p className="mt-6 rounded-xl border border-line bg-paper px-5 py-6 text-[13.5px] text-ink-2">
            No report matches these filters.{" "}
            <button type="button" onClick={clear} className="font-semibold text-introduced hover:underline">
              Clear them
            </button>
          </p>
        ) : (
          <p className="mt-6 rounded-xl border border-line bg-paper px-5 py-6 text-[13.5px] text-ink-2">
            Nothing in the feed yet.{" "}
            <Link href={ROUTES.incidents} className="font-semibold text-introduced hover:underline">
              The incident patterns →
            </Link>
          </p>
        )}
      </div>
    </>
  );
}

/** One report: when, its incident pattern, how well established, what happened, where it would replay, its deep dive and who said so. */
function FeedRow({ item, inView, isNew }: { item: FeedItem; inView: boolean; isNew: boolean }) {
  return (
    <li id={item.id} className={`scroll-mt-20 px-5 py-4 transition-colors ${inView ? "bg-introduced-soft/50" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <time dateTime={item.date} title={formatDay(item.date)} className="ident text-ink-3">
          {formatShortDay(item.date)}
        </time>
        <CategoryChip category={item.category} link />
        <EvidenceTag evidence={item.evidence} />
        {isNew && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-introduced" data-new>
            New
          </span>
        )}
      </div>
      <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-ink">{item.title}</h3>
      <p className="mt-1 max-w-3xl text-[13px] leading-snug text-ink-2">{item.summary}</p>
      {(item.patterns.length > 0 || item.incident) && (
        <p className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[12.5px]">
          {item.patterns.length > 0 && (
            <span className="text-ink-3">
              Replays on{" "}
              {item.patterns.map((id, i) => (
                <span key={id}>
                  {i > 0 && " · "}
                  <Link href={patternHref(id, { tab: "incidents" })} className="font-medium text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-introduced">
                    {archetypeById.get(id)?.title ?? id}
                  </Link>
                </span>
              ))}
            </span>
          )}
          {item.incident && (
            <Link href={incidentHref(item.incident)} title={incidentById.get(item.incident)?.title} className="font-semibold text-introduced hover:underline">
              Deep dive →
            </Link>
          )}
        </p>
      )}
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-3">
        {item.sources.map((s, i) => (
          <span key={s.url}>
            {i > 0 && " · "}
            <a href={s.url} target="_blank" rel="noreferrer" title={s.title} className="hover:text-introduced hover:underline">
              {[s.publisher ?? s.title, s.date && formatDay(s.date)].filter(Boolean).join(", ")} ↗
            </a>
          </span>
        ))}
        {item.cves?.map((cve) => (
          <span key={cve}>
            {" · "}
            <a href={`https://nvd.nist.gov/vuln/detail/${cve}`} target="_blank" rel="noreferrer" className="ident hover:text-introduced hover:underline">
              {cve}
            </a>
          </span>
        ))}
      </p>
    </li>
  );
}
