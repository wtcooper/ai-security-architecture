"use client";

/**
 * The feed (/feed/): the AI security daily. Five kinds of item, newest first, each in two or three
 * lines under the week it came to light: incidents (filed under an incident pattern, naming the
 * patterns they would replay on), product updates, security tools, launches and research. Each
 * says why it matters, who announced it, the products, controls and patterns it touches and the
 * change to the site it implies. Nothing is ranked but the date.
 *
 * At the top, the newest day as headlines, then every proposed site update with how to approve
 * it. What is new since the reader's last visit is counted in the header and marked on the item.
 * The kind and the four incident filters (incident pattern, pattern, evidence, and `incident`,
 * reached from a deep dive) ride in the address, so a filtered feed can be linked and comes back
 * on Back. An item's anchor is its id, which is how search and the RSS feed land on it.
 *
 * The page is built with its newest days only. Older months load from /data/feed/<YYYY-MM>.json
 * as the reader scrolls, filters or follows a link to an older item, so the feed never rides in
 * the JavaScript every page loads, however long it grows.
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { PageHeader } from "@/components/Panel";
import { archetypeById, archetypesInOrder, controlName, incidentById, mitigationById, surfaces, toolById } from "@/lib/data";
import { feedIndexOf, latestDay } from "@/lib/feed";
import { evidenceById, FEED_EVIDENCE, FEED_KINDS, kindById, SECURITY_TOOL_KINDS, SECURITY_TOOL_STATUSES, updateActionById } from "@/lib/feed-vocabulary";
import { categoryById, INCIDENT_CATEGORIES } from "@/lib/incident-categories";
import { controlHref, FEED_XML, feedQuery, fileHref, incidentHref, incidentPatternHref, patternHref, ROUTES, toolHref, type FeedFilters } from "@/lib/routes";
import type { FeedIndex, FeedItem } from "@/lib/types";
import { CategoryChip, CategoryDot, EvidenceTag, filterChip, KindTag, plural } from "./chrome";
import { newSince, useLastVisit, type Visit } from "./last-visit";
import { byWeek, formatDay, formatLongDay, formatMonth, formatShortDay } from "./model";

/** The item named after the # in the address. Empty on the server, so hydration agrees. */
const subscribeHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};
const readHash = () => decodeURIComponent(window.location.hash.slice(1));
const useHash = () => useSyncExternalStore(subscribeHash, readHash, () => "");

/** One month of the feed, as the build wrote it. */
async function fetchMonth(month: string): Promise<FeedItem[]> {
  const res = await fetch(fileHref(`/data/feed/${month}.json`));
  if (!res.ok) throw new Error(`${month}: ${res.status}`);
  return (await res.json()) as FeedItem[];
}

/**
 * How far back the reader has the whole feed: from `from` on (empty: all of it), and the month to
 * load next. Months are walked newest first; a month with no items has no file and nothing missing.
 */
export function coverage(index: FeedIndex, from: string, loaded: Set<string>): { from: string; next: string | null } {
  if (!from) return { from: "", next: null };
  let covered = from;
  for (const { month } of index.months) {
    if (`${month}-01` >= covered) continue;
    if (!loaded.has(month)) return { from: covered, next: month };
    covered = `${month}-01`;
  }
  return { from: "", next: null };
}

const KIND_ORDER = new Map<string, number>(FEED_KINDS.map((k, i) => [k.id, i]));
const toolKindLabel = new Map<string, string>(SECURITY_TOOL_KINDS.map((k) => [k.id, k.label]));
const toolStatusLabel = new Map<string, string>(SECURITY_TOOL_STATUSES.map((s) => [s.id, s.label]));

export function IncidentFeed({
  items: whole,
  initial = [],
  from = "",
  index: givenIndex,
  loadMonth = fetchMonth,
  lastVisit,
}: {
  /** The whole feed, for a test: nothing is loaded later. */
  items?: FeedItem[];
  /** The newest days, built with the page: every item dated `from` or later. */
  initial?: FeedItem[];
  from?: string;
  /** The months and the counts the filters start from; worked out from `items` when the whole feed is given. */
  index?: FeedIndex;
  /** How a month is fetched; the build's file under /data/feed/ unless a test passes its own. */
  loadMonth?: (month: string) => Promise<FeedItem[]>;
  /** The reader's previous visit, for a test; the browser's own record otherwise. */
  lastVisit?: Visit | null;
}) {
  const index = useMemo(() => givenIndex ?? feedIndexOf(whole ?? initial), [givenIndex, whole, initial]);
  const [months, setMonths] = useState<Record<string, FeedItem[]>>({});
  const [failed, setFailed] = useState<string | null>(null);
  const [askedFor, setAskedFor] = useState<string | null>(null);
  const [near, setNear] = useState(false);
  const { from: covered, next } = whole ? { from: "", next: null } : coverage(index, from, new Set(Object.keys(months)));
  const complete = next === null;

  // Newest first, ties as given: what the page was built with, then each month as it arrives.
  const items = useMemo(() => {
    const seen = new Set<string>();
    const all: FeedItem[] = [];
    for (const f of [...(whole ?? initial), ...Object.values(months).flat()]) {
      if (seen.has(f.id)) continue;
      seen.add(f.id);
      all.push(f);
    }
    const order = new Map(all.map((f, i) => [f.id, i]));
    return all.filter((f) => !covered || f.date >= covered).sort((a, b) => b.date.localeCompare(a.date) || order.get(a.id)! - order.get(b.id)!);
  }, [whole, initial, months, covered]);

  const params = useSearchParams();
  const linked = (key: keyof FeedFilters, known: (v: string) => boolean) => {
    const v = params.get(key);
    return v && known(v) ? v : null;
  };
  const [kind, setKind] = useState(() => linked("kind", (v) => kindById.has(v)));
  const [category, setCategory] = useState(() => linked("category", (v) => categoryById.has(v)));
  const [pattern, setPattern] = useState(() => linked("pattern", (v) => archetypeById.has(v)));
  const [evidence, setEvidence] = useState(() => linked("evidence", (v) => evidenceById.has(v)));
  const [incident, setIncident] = useState(() => linked("incident", (v) => incidentById.has(v)));
  const hash = useHash();
  const visit = useLastVisit(items, covered);
  const previous = lastVisit !== undefined ? lastVisit : visit.previous;
  const fresh = newSince(items, previous);

  // The incident pattern, pattern, evidence and deep-dive filters narrow incidents only: with one
  // on, the feed is showing incidents, whatever kind was chosen before.
  const incidentFilter = Boolean(category || pattern || evidence || incident);
  const kindOn = incidentFilter ? "incident" : kind;
  const filtered = Boolean(kindOn);

  // Filters stay shareable and survive Back. replaceState rather than router.push keeps the
  // GitHub Pages basePath, and the # keeps the item a link landed on.
  useEffect(() => {
    const query = feedQuery({ kind: incidentFilter ? null : kind, category, pattern, evidence, incident });
    window.history.replaceState(null, "", `${query ? `?${query}` : window.location.pathname}${window.location.hash}`);
  }, [kind, category, pattern, evidence, incident, incidentFilter]);

  // A link to an item not loaded yet loads month after month until the item is there.
  const hashFound = !hash || items.some((f) => f.id === hash);
  const wanted = Boolean(next) && failed !== next && (filtered || !hashFound || near || askedFor === next);
  const inflight = useRef<string | null>(null);
  useEffect(() => {
    if (!wanted || !next || inflight.current === next) return;
    inflight.current = next;
    loadMonth(next).then(
      (list) => setMonths((m) => ({ ...m, [next]: list })),
      () => setFailed(next),
    ).finally(() => {
      if (inflight.current === next) inflight.current = null;
    });
  }, [wanted, next, loadMonth]);

  // Scrolling near the end of what is loaded loads the month before it.
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [complete]);

  // The page is drawn in the browser, after the browser looked for the # and found nothing.
  useEffect(() => {
    if (hash && hashFound) document.getElementById(hash)?.scrollIntoView({ block: "start" });
  }, [hash, hashFound]);

  // Each incident filter's counts follow the others, so an option never promises reports the list
  // will not show. Until every month is loaded, they are the whole feed's, from the index.
  const isIncident = (f: FeedItem) => f.kind === "incident";
  const matchesIncident = (f: FeedItem, skip?: "category" | "pattern" | "evidence") =>
    isIncident(f) &&
    (skip === "category" || !category || f.category === category) &&
    (skip === "pattern" || !pattern || f.patterns.includes(pattern)) &&
    (skip === "evidence" || !evidence || f.evidence === evidence) &&
    (!incident || f.incident === incident);
  const shown = items.filter((f) => (kindOn === "incident" ? matchesIncident(f) : !kindOn || f.kind === kindOn));
  const count = {
    kind: (id: string) => (complete ? items.filter((f) => f.kind === id).length : index.kinds[id] ?? 0),
    category: (id: string | null) =>
      complete ? items.filter((f) => matchesIncident(f, "category") && (!id || f.category === id)).length : id ? index.incidents.category[id] ?? 0 : index.kinds.incident ?? 0,
    pattern: (id: string) => (complete ? items.filter((f) => matchesIncident(f, "pattern") && f.patterns.includes(id)).length : index.incidents.pattern[id] ?? 0),
    evidence: (id: string) => (complete ? items.filter((f) => matchesIncident(f, "evidence") && f.evidence === id).length : index.incidents.evidence[id] ?? 0),
  };
  const patternsInFeed = archetypesInOrder.filter((a) => a.id === pattern || (index.incidents.pattern[a.id] ?? 0) > 0);
  const clearIncidentFilters = () => {
    setCategory(null);
    setPattern(null);
    setEvidence(null);
    setIncident(null);
  };
  const chooseKind = (id: string | null) => {
    // Another kind lets go of the incident filters, which narrow incidents only.
    if (id !== "incident") clearIncidentFilters();
    setKind(id);
  };
  const clear = () => {
    clearIncidentFilters();
    setKind(null);
  };
  const told = incident ? incidentById.get(incident) : undefined;
  const on = category ? categoryById.get(category) : undefined;
  const latest = latestDay(items);
  const proposed = index.proposed;
  const select =
    "min-w-0 max-w-full flex-1 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[13px] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-introduced sm:flex-none";

  return (
    <>
      <PageHeader
        eyebrow="Feed"
        title="AI security daily"
        lead="Every AI security incident we track, and the product updates, security tools, launches and research that change how AI is secured, newest first: what happened, why it matters and what it changes on this site. Reviewed daily."
      >
        <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px] text-ink-3" data-feed-status>
          <span>{plural(index.total, "item")}</span>
          {index.latest && <span>Latest {formatLongDay(index.latest)}</span>}
          {previous ? (
            <span className={fresh.size ? "font-semibold text-ink" : undefined} data-feed-new={fresh.size}>
              {fresh.size ? `${fresh.size} new` : "Nothing new"} since your last visit
              <span className="font-normal text-ink-3"> ({formatDay(new Date(previous.at).toISOString().slice(0, 10))})</span>
            </span>
          ) : (
            visit.ready && <span>New items are marked from your next visit.</span>
          )}
          <a href={fileHref(FEED_XML)} className="inline-flex items-center gap-1 font-semibold text-introduced hover:underline" data-rss>
            <RssIcon /> RSS
          </a>
        </p>
      </PageHeader>

      <div className="mx-auto w-full max-w-5xl px-4 py-7 sm:px-6">
        {!filtered && latest.items.length > 0 && <Latest day={latest.day} items={latest.items} fresh={fresh} />}
        {!filtered && proposed.length > 0 && <ProposedUpdates items={proposed} />}

        <div className={!filtered && (latest.items.length > 0 || proposed.length > 0) ? "mt-8" : undefined}>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Kind">
            <button type="button" onClick={() => chooseKind(null)} aria-pressed={kindOn === null} className={filterChip(kindOn === null)}>
              All <span className="font-normal opacity-70">{index.total}</span>
            </button>
            {FEED_KINDS.map((k) => {
              const n = count.kind(k.id);
              return (
                <button
                  key={k.id}
                  type="button"
                  title={k.blurb}
                  data-kind-chip={k.id}
                  onClick={() => chooseKind(kindOn === k.id && !incidentFilter ? null : k.id)}
                  aria-pressed={kindOn === k.id}
                  disabled={n === 0 && kindOn !== k.id}
                  className={`${filterChip(kindOn === k.id)} disabled:opacity-40`}
                >
                  {k.chip} <span className="font-normal opacity-70">{n}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-line bg-paper/60 px-3 py-3 sm:px-4" data-incident-filters>
            <p className="text-[12px] text-ink-3">
              <span className="font-semibold text-ink-2">Incident filters.</span> The incident pattern, pattern and evidence filters narrow incidents only
              {incidentFilter ? <span data-incidents-only>: with one on, the feed shows incidents and nothing else.</span> : "."}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2" role="group" aria-label="Incident pattern">
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
                <select value={evidence ?? ""} onChange={(e) => setEvidence(e.target.value || null)} className={select}>
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
                  <span className="text-[12px] font-normal text-ink-3">{plural(inWeek.length, "item")}</span>
                </h2>
                <ul className="mt-2.5 divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
                  {inWeek.map((f) => (
                    <FeedRow key={f.id} item={f} inView={hash === f.id} isNew={fresh.has(f.id)} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : index.total ? (
          complete && (
            <p className="mt-6 rounded-xl border border-line bg-paper px-5 py-6 text-[13.5px] text-ink-2">
              Nothing matches these filters.{" "}
              <button type="button" onClick={clear} className="font-semibold text-introduced hover:underline">
                Clear them
              </button>
            </p>
          )
        ) : (
          <p className="mt-6 rounded-xl border border-line bg-paper px-5 py-6 text-[13.5px] text-ink-2">
            Nothing in the feed yet.{" "}
            <Link href={ROUTES.incidents} className="font-semibold text-introduced hover:underline">
              The incident patterns →
            </Link>
          </p>
        )}

        {next && (
          <div ref={sentinel} className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px] text-ink-3" data-feed-more={next}>
            <span>
              {covered ? `Loaded back to ${formatLongDay(covered)}` : "Loading"}
              {filtered ? "; the filters search the older months as they load." : "."}
            </span>
            {failed === next ? (
              <button type="button" onClick={() => setFailed(null)} className="font-semibold text-introduced hover:underline">
                {formatMonth(next)} did not load. Try again
              </button>
            ) : wanted ? (
              <span aria-live="polite">Loading {formatMonth(next)}…</span>
            ) : (
              <button type="button" onClick={() => setAskedFor(next)} className="font-semibold text-introduced hover:underline">
                Load {formatMonth(next)} →
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/** The newest day, as headlines: the kind, the title, who announced it. Grouped by kind, in the chips' order. */
function Latest({ day, items, fresh }: { day: string; items: FeedItem[]; fresh: Set<string> }) {
  const sorted = [...items].sort((a, b) => (KIND_ORDER.get(a.kind) ?? 9) - (KIND_ORDER.get(b.kind) ?? 9));
  return (
    <section aria-labelledby="latest-title" data-latest={day} className="rounded-xl border border-line bg-paper px-4 py-4 sm:px-5">
      <h2 id="latest-title" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="display text-[17px] font-bold text-ink">Latest</span>
        <span className="text-[12.5px] text-ink-3">
          {formatLongDay(day)} · {plural(items.length, "item")}
        </span>
      </h2>
      <ul className="mt-2.5 space-y-2">
        {sorted.map((f) => (
          <li key={f.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13.5px] leading-snug" data-latest-item={f.id}>
            <KindTag kind={f.kind} />
            <a href={`#${f.id}`} className="min-w-0 font-semibold text-ink hover:text-introduced hover:underline">
              {f.title}
            </a>
            {f.vendor && <span className="text-[12px] text-ink-3">{f.vendor}</span>}
            {fresh.has(f.id) && <span className="text-[11px] font-semibold uppercase tracking-wide text-introduced">New</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Every item whose site update waits for the owner, with how to approve or decline it. */
function ProposedUpdates({ items }: { items: FeedItem[] }) {
  return (
    <section aria-labelledby="proposed-title" data-proposed-updates className="mt-5 rounded-xl border px-4 py-4 sm:px-5" style={{ borderColor: "var(--band-app-edge)", background: "var(--band-app-fill)" }}>
      <h2 id="proposed-title" className="flex items-baseline gap-2">
        <span className="display text-[17px] font-bold text-ink">Proposed site updates</span>
        <span className="text-[13px] text-ink-3">{items.length}</span>
      </h2>
      <p className="mt-1 max-w-3xl text-[12.5px] leading-snug text-ink-2">
        Changes the daily run found and does not make by itself: a product to onboard, a new control or pattern, a change to a control&rsquo;s guidance. To approve
        one, add its line to <code className="rounded bg-paper px-1 font-mono text-[0.9em]">data/feed/decisions.yaml</code> (with <code className="font-mono text-[0.9em]">decline</code> to
        turn it down), or ask for it in the session. The next daily run carries out one approved change and marks the item applied.
      </p>
      <ul className="mt-3 space-y-3">
        {items.map((f) => (
          <li key={f.id} className="rounded-lg border border-line bg-paper px-3 py-2.5" data-proposed={f.id}>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <KindTag kind={f.kind} />
              <a href={`#${f.id}`} className="min-w-0 text-[13.5px] font-semibold leading-snug text-ink hover:text-introduced hover:underline">
                {f.title}
              </a>
            </div>
            <p className="mt-1 text-[12.5px] leading-snug text-ink-2">
              <span className="font-semibold text-ink">{updateActionById.get(f.update!.action)?.label ?? f.update!.action}</span>
              {" · "}
              <code className="break-all font-mono text-[0.9em] text-ink-3">{f.update!.target}</code>
              {" · "}
              {f.update!.note}
            </p>
            <DecisionLine item={f} />
            {!f.decision && (
              <p className="mt-1.5 text-[11.5px] text-ink-3">
                To approve: <code className="break-all rounded bg-mist px-1 font-mono text-ink-2" data-approve-line>{`- { id: ${f.id}, decision: approve }`}</code>
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** What the owner decided, when they have, and what happens next. */
function DecisionLine({ item }: { item: FeedItem }) {
  const d = item.decision;
  if (!d || item.update?.status !== "proposed") return null;
  return (
    <p className="mt-1 text-[12px] font-medium text-ink" data-decision={d.decision}>
      {d.decision === "approve" ? "Approved: the next daily run carries it out." : "Declined: the next daily run marks it declined."}
      {d.note && <span className="font-normal text-ink-3"> {d.note}</span>}
    </p>
  );
}

const STATUS_STYLE: Record<string, { color: string; background: string }> = {
  applied: { color: "var(--mitigated)", background: "var(--mitigated-soft)" },
  proposed: { color: "var(--introduced)", background: "var(--introduced-soft)" },
  declined: { color: "var(--ink-3)", background: "var(--mist)" },
};

/**
 * One item: its kind and date (and, for an incident, its incident pattern and evidence), what
 * happened, why it matters, who announced it and what it touches on this site, the change to the
 * site it implies, its deep dive, and who said so.
 */
function FeedRow({ item, inView, isNew }: { item: FeedItem; inView: boolean; isNew: boolean }) {
  const incident = item.kind === "incident";
  const [first, ...others] = item.sources;
  const tag = "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-[1px] text-[11.5px] font-medium";
  const hasTags = Boolean(item.vendor || item.products?.length || item.controls?.length || item.patterns.length);
  return (
    <li id={item.id} data-item-kind={item.kind} className={`scroll-mt-20 px-4 py-4 transition-colors sm:px-5 ${inView ? "bg-introduced-soft/50" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <KindTag kind={item.kind} />
        <time dateTime={item.date} title={formatDay(item.date)} className="ident text-ink-3">
          {formatShortDay(item.date)}
        </time>
        {incident && item.category && <CategoryChip category={item.category} link />}
        {incident && item.evidence && <EvidenceTag evidence={item.evidence} />}
        {isNew && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-introduced" data-new>
            New
          </span>
        )}
      </div>
      <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-ink">{item.title}</h3>
      <p className="mt-1 max-w-3xl text-[13px] leading-snug text-ink-2">{item.summary}</p>
      {item.why && (
        <p className="mt-1.5 max-w-3xl text-[13px] leading-snug text-ink" data-why>
          <span className="font-semibold">Why it matters: </span>
          {item.why}
        </p>
      )}

      {hasTags && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px]" data-tags>
          {item.vendor && (
            <span className={`${tag} border-line bg-mist text-ink-2`} data-vendor>
              {item.vendor}
            </span>
          )}
          {item.products?.map((id) => (
            <Link key={id} href={toolHref(id)} data-product={id} title="Its settings, on the pattern it belongs to" className={`${tag} border-line bg-paper text-ink hover:border-ink-3`}>
              {toolById.get(id)?.name ?? id}
            </Link>
          ))}
          {item.controls?.map((id) => (
            <Link
              key={id}
              href={controlHref(id)}
              data-control={id}
              title={mitigationById.get(id)?.title}
              className={`${tag} border-transparent hover:underline`}
              style={{ background: "var(--chip-soft)", color: "var(--chip)" }}
            >
              {controlName(id)}
            </Link>
          ))}
          {item.patterns.length > 0 && (
            <span className="ml-0.5 text-ink-3" data-patterns>
              {incident ? "Replays on " : "Patterns: "}
              {item.patterns.map((id, i) => (
                <span key={id}>
                  {i > 0 && " · "}
                  <Link
                    href={incident ? patternHref(id, { tab: "incidents" }) : patternHref(id)}
                    className="font-medium text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-introduced"
                  >
                    {archetypeById.get(id)?.title ?? id}
                  </Link>
                </span>
              ))}
            </span>
          )}
        </div>
      )}

      {item.securityTools?.map((t) => (
        <p key={t.id} className="mt-2 text-[12.5px] leading-snug text-ink-2" data-security-tool={t.id}>
          <a href={t.url} target="_blank" rel="noreferrer" className="font-semibold text-ink hover:text-introduced hover:underline">
            {t.name} ↗
          </a>{" "}
          <span className="text-ink-3">
            by {t.by} · {toolKindLabel.get(t.kind) ?? t.kind} · {toolStatusLabel.get(t.status) ?? t.status} · listed under the controls it delivers
          </span>
        </p>
      ))}

      {item.update && (
        <p className="mt-2 text-[12.5px] leading-snug text-ink-2" data-site-update={item.update.status}>
          <span className="rounded px-1.5 py-[1px] text-[11.5px] font-semibold" style={STATUS_STYLE[item.update.status]}>
            Site update: {item.update.status}
          </span>{" "}
          {item.update.note}
        </p>
      )}
      <DecisionLine item={item} />

      <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[12.5px]">
        {first && (
          <a href={first.url} target="_blank" rel="noreferrer" title={first.title} className="font-semibold text-introduced hover:underline" data-read-more>
            Read more →
          </a>
        )}
        {first && <span className="text-[11.5px] text-ink-3">{[first.publisher ?? first.title, first.date && formatDay(first.date)].filter(Boolean).join(", ")}</span>}
        {incident && item.incident && (
          <Link href={incidentHref(item.incident)} title={incidentById.get(item.incident)?.title} className="font-semibold text-introduced hover:underline">
            Deep dive →
          </Link>
        )}
      </p>
      {(others.length > 0 || item.cves?.length) && (
        <p className="mt-1 text-[11.5px] leading-relaxed text-ink-3" data-other-sources>
          {others.length > 0 && "Also: "}
          {others.map((s, i) => (
            <span key={s.url}>
              {i > 0 && " · "}
              <a href={s.url} target="_blank" rel="noreferrer" title={s.title} className="hover:text-introduced hover:underline">
                {[s.publisher ?? s.title, s.date && formatDay(s.date)].filter(Boolean).join(", ")} ↗
              </a>
            </span>
          ))}
          {item.cves?.map((cve, i) => (
            <span key={cve}>
              {(others.length > 0 || i > 0) && " · "}
              <a href={`https://nvd.nist.gov/vuln/detail/${cve}`} target="_blank" rel="noreferrer" className="ident hover:text-introduced hover:underline">
                {cve}
              </a>
            </span>
          ))}
        </p>
      )}
    </li>
  );
}

function RssIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden fill="currentColor">
      <circle cx="3" cy="13" r="2" />
      <path d="M1 6.5v2a6.5 6.5 0 0 1 6.5 6.5h2A8.5 8.5 0 0 0 1 6.5Z" />
      <path d="M1 1.5v2A11.5 11.5 0 0 1 12.5 15h2A13.5 13.5 0 0 0 1 1.5Z" />
    </svg>
  );
}
