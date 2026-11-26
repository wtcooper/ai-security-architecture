"use client";

/**
 * The daily feed (/feed/): the AI security daily. Six kinds of item (incidents, product updates,
 * security tools, launches, guidance and research), each in two or three lines, weighed as a
 * headline, notable or a brief, and where it belongs to one, shown under its story.
 *
 * At the top, the kind chips: they apply to every section below. Then the sections, each with its
 * heading, its count (after the chips) and its overview, always visible:
 *   Latest     the items the daily run filed on its newest day (their `added`), whatever day
 *              each came to light: "Today's feed" when that is today, "Latest feed · <day>"
 *              otherwise; always open;
 *   This week  the current week by `date` (when things happened), every item in it, folded
 *              until opened;
 *   the weeks before it, newest first, each folded.
 * An open section lists its stories and standalone items by weight then date: the headline and
 * notable ones, then "+N briefs" for the rest. What is new since the reader's last visit (by
 * `added`) is counted in the header and in each section, and marked on the item. The kind rides in the
 * address (`?kind=`); an item's anchor is its id, which is how search, the RSS feed and the home
 * page land on it, opening its week and its briefs as needed.
 *
 * The incident filters (incident pattern, pattern, evidence, deep dive) live on the Incidents
 * page; an old feed address that carries one is forwarded there, or, when it names an item, kept
 * on the feed at that item.
 *
 * The page is built with its newest days only. Older months load from /data/feed/<YYYY-MM>.json
 * when the reader opens an older week or follows a link to an older item, so the feed never rides
 * in the JavaScript every page loads, however long it grows.
 */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { PageHeader } from "@/components/Panel";
import { archetypeById, controlName, incidentById, mitigationById, toolById } from "@/lib/data";
import { feedIndexOf, sectionUnits, weekOf, type FeedUnit } from "@/lib/feed";
import { FEED_KINDS, kindById, SECURITY_TOOL_KINDS, SECURITY_TOOL_STATUSES } from "@/lib/feed-vocabulary";
import { controlHref, FEED_XML, feedQuery, fileHref, incidentHref, incidentReportsHref, INCIDENT_REPORT_FILTERS, legacyFeedTarget, patternHref, ROUTES, toolHref } from "@/lib/routes";
import type { FeedIndex, FeedItem, FeedOverviews, FeedSpan } from "@/lib/types";
import { CategoryChip, EvidenceTag, filterChip, KindTag, plural, WeightMark } from "./chrome";
import { newSince, useLastVisit, type Visit } from "./last-visit";
import { formatDay, formatLongDay, formatMonth, formatShortDay } from "./model";
import { isCovered, useFeedMonths } from "./months";

/** The item named after the # in the address. Empty on the server, so hydration agrees. */
const subscribeHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
};
const readHash = () => decodeURIComponent(window.location.hash.slice(1));
const useHash = () => useSyncExternalStore(subscribeHash, readHash, () => "");

/** The reader's own day, YYYY-MM-DD; the day the page was built until the browser is asked. */
const pad = (n: number) => String(n).padStart(2, "0");
const localDay = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const subscribeNever = () => () => {};
const useToday = (built: string) => useSyncExternalStore(subscribeNever, localDay, () => built);

const toolKindLabel = new Map<string, string>(SECURITY_TOOL_KINDS.map((k) => [k.id, k.label]));
const toolStatusLabel = new Map<string, string>(SECURITY_TOOL_STATUSES.map((s) => [s.id, s.label]));

/** A loaded month, kept whole: the feed shows every kind. */
const keepAll = (items: FeedItem[]) => items;

/** The section key of the newest day. */
const LATEST = "latest";

/**
 * Sections (or their briefs) the reader opened or closed. One can be open without being asked,
 * `forced` (the one holding the item a link landed on), until the reader closes it.
 */
function useOpenSet(initial: string[] = []) {
  const [on, setOn] = useState<ReadonlySet<string>>(() => new Set(initial));
  const [off, setOff] = useState<ReadonlySet<string>>(new Set());
  const isOn = (key: string, forced?: string | null) => on.has(key) || (key === forced && !off.has(key));
  const toggle = (key: string, forced?: string | null) => {
    const now = isOn(key, forced);
    const flip = (s: ReadonlySet<string>, add: boolean) => {
      const n = new Set(s);
      if (add) n.add(key);
      else n.delete(key);
      return n;
    };
    setOn((s) => flip(s, !now));
    setOff((s) => flip(s, now));
  };
  return { isOn, toggle };
}

/**
 * Where the item a link names sits: the week that opens for it (none when it is on Latest, which
 * is always open), and the section whose briefs open (when it is a brief). Exported for the tests.
 */
export function landing(target: FeedItem | undefined, latestAdded: string): { week: string | null; briefs: string | null } {
  if (!target) return { week: null, briefs: null };
  const section = target.added === latestAdded ? LATEST : weekOf(target.date);
  return { week: section === LATEST ? null : section, briefs: target.weight === "brief" ? section : null };
}

export function IncidentFeed({
  items: whole,
  initial = [],
  from = "",
  addedFrom = "",
  index: givenIndex,
  overviews,
  loadMonth,
  lastVisit,
  today: builtToday,
  open: openAtFirst,
  briefsOpen: briefsAtFirst,
}: {
  /** The whole feed, for a test: nothing is loaded later. */
  items?: FeedItem[];
  /** The newest days, built with the page: every item dated `from` or later, and every item filed (`added`) `addedFrom` or later. */
  initial?: FeedItem[];
  from?: string;
  addedFrom?: string;
  /** The months, the sections and the counts the chips start from; worked out from `items` when the whole feed is given. */
  index?: FeedIndex;
  /** With `items` and no `index`: the overviews the sections show. */
  overviews?: FeedOverviews;
  /** How a month is fetched; the build's file under /data/feed/ unless a test passes its own. */
  loadMonth?: (month: string) => Promise<FeedItem[]>;
  /** The reader's previous visit, for a test; the browser's own record otherwise. */
  lastVisit?: Visit | null;
  /** The day the page was built: what "today" is until the browser says. */
  today?: string;
  /** Weeks (by their Monday) open from the start, for a test; every week starts folded otherwise. */
  open?: string[];
  /** Sections ("latest", or a week's Monday) whose briefs are open from the start, for a test. */
  briefsOpen?: string[];
}) {
  const index = useMemo(() => givenIndex ?? feedIndexOf(whole ?? initial, overviews), [givenIndex, whole, initial, overviews]);
  const today = useToday(builtToday ?? index.latest);
  // Latest is the items filed on the newest `added` day.
  const latestDate = index.day?.date ?? "";

  const params = useSearchParams();
  const router = useRouter();
  const [kind, setKind] = useState(() => {
    const v = params.get("kind");
    return v && kindById.has(v) ? v : null;
  });
  const hash = useHash();

  // The section holding the item a link landed on opens by itself, and so do its briefs if it is one.
  const weeks = useOpenSet(openAtFirst);
  const briefs = useOpenSet(briefsAtFirst);

  const months = useFeedMonths({
    whole,
    initial,
    from,
    index,
    loadMonth,
    select: keepAll,
    // An item a link names that is not loaded yet, and every open week, load month after month.
    want: (covered, loaded) => {
      const target = hash ? loaded.find((f) => f.id === hash) : undefined;
      if (hash && !target) return true;
      const forced = landing(target, latestDate).week;
      return index.weeks.some((w) => weeks.isOn(w.week, forced) && !isCovered(covered, w.week));
    },
  });
  const { items, covered } = months;
  const visit = useLastVisit(items, whole ? "" : addedFrom);
  const previous = lastVisit !== undefined ? lastVisit : visit.previous;
  const fresh = newSince(items, previous);

  const target = hash ? items.find((f) => f.id === hash) : undefined;
  const forced = landing(target, latestDate);

  // An old address with an incident filter: the Incidents page's report list has those filters now.
  const legacy = INCIDENT_REPORT_FILTERS.some((k) => params.get(k));
  const forwarding = legacy && !hash;
  useEffect(() => {
    if (!legacy || window.location.hash.slice(1)) return;
    const to = legacyFeedTarget(new URLSearchParams(params.toString()));
    if (to) router.replace(to);
  }, [legacy, params, router]);

  // The kind stays shareable and survives Back. replaceState rather than router.push keeps the
  // GitHub Pages basePath, and the # keeps the item a link landed on.
  useEffect(() => {
    if (forwarding) return;
    const query = feedQuery({ kind });
    window.history.replaceState(null, "", `${query ? `?${query}` : window.location.pathname}${window.location.hash}`);
  }, [kind, forwarding]);

  // The page is drawn in the browser; once the item a link names is on it, go to it, once.
  const arrived = useRef("");
  useEffect(() => {
    if (!hash || arrived.current === hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    el.scrollIntoView({ block: "start" });
    arrived.current = hash;
  });

  const matches = (f: FeedItem) => !kind || f.kind === kind;
  const countOf = (span: FeedSpan) => (kind ? span.kinds[kind] ?? 0 : span.count);
  const newIn = (list: FeedItem[]) => list.filter((f) => fresh.has(f.id)).length;
  const chip = kind ? kindById.get(kind)?.chip.toLowerCase() : "";

  if (forwarding) {
    return <p className="mx-auto max-w-5xl px-6 py-16 text-[14px] text-ink-3">The incident filters are on the Incidents page now. Taking you there…</p>;
  }

  const body = (key: string, list: FeedItem[], anchored: (f: FeedItem) => boolean) => (
    <SectionItems
      list={list}
      briefsOpen={briefs.isOn(key, forced.briefs)}
      onBriefs={() => briefs.toggle(key, forced.briefs)}
      anchored={anchored}
      fresh={fresh}
      hash={hash}
    />
  );
  const latestItems = latestDate ? items.filter((f) => f.added === latestDate && matches(f)) : [];
  const isToday = latestDate === today;

  return (
    <>
      <PageHeader
        eyebrow="Daily feed"
        title="Daily feed"
        lead="The AI security daily: what changed in AI security, why it matters and what it touches on this site, reviewed every day."
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
        {index.total > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Kind" data-kind-filters>
              <button type="button" onClick={() => setKind(null)} aria-pressed={kind === null} className={filterChip(kind === null)}>
                All <span className="font-normal opacity-70">{index.total}</span>
              </button>
              {FEED_KINDS.map((k) => {
                const n = index.kinds[k.id] ?? 0;
                return (
                  <button
                    key={k.id}
                    type="button"
                    title={k.blurb}
                    data-kind-chip={k.id}
                    onClick={() => setKind(kind === k.id ? null : k.id)}
                    aria-pressed={kind === k.id}
                    disabled={n === 0 && kind !== k.id}
                    className={`${filterChip(kind === k.id)} disabled:opacity-40`}
                  >
                    {k.chip} <span className="font-normal opacity-70">{n}</span>
                  </button>
                );
              })}
            </div>
            {kind === "incident" && (
              <p className="mt-2.5 text-[12.5px] text-ink-3" data-incident-filters-elsewhere>
                To narrow incidents by incident pattern, pattern or evidence, use{" "}
                <Link href={incidentReportsHref()} className="font-semibold text-introduced hover:underline">
                  the incident reports on the Incidents page →
                </Link>
              </p>
            )}
          </>
        )}

        {index.day ? (
          <div className="mt-6 space-y-4">
            <FeedSection
              id={LATEST}
              heading={isToday ? "Today’s feed" : `Latest feed · ${formatLongDay(latestDate)}`}
              when={isToday ? formatLongDay(latestDate) : undefined}
              count={countOf(index.day)}
              fresh={newIn(latestItems)}
              span={index.day}
              open
            >
              {latestItems.length ? (
                body(LATEST, latestItems, () => true)
              ) : (
                <p className="px-4 py-3 text-[13px] text-ink-3 sm:px-5">
                  No {chip} filed on {formatLongDay(latestDate)}.
                </p>
              )}
            </FeedSection>

            {index.weeks.map((w) => {
              const open = weeks.isOn(w.week, forced.week);
              const inWeek = items.filter((f) => weekOf(f.date) === w.week && matches(f));
              const loaded = isCovered(covered, w.week);
              const current = w.week === weekOf(today);
              return (
                <FeedSection
                  key={w.week}
                  id={`week-${w.week}`}
                  heading={current ? "This week" : `Week of ${formatLongDay(w.week)}`}
                  when={current ? `From ${formatLongDay(w.week)}` : undefined}
                  count={countOf(w)}
                  fresh={newIn(inWeek)}
                  span={w}
                  open={open}
                  onToggle={() => weeks.toggle(w.week, forced.week)}
                >
                  {loaded ? (
                    // Latest's items are listed in their week too; their anchor stays on Latest, so a link lands there.
                    body(w.week, inWeek, (f) => f.added !== latestDate)
                  ) : (
                    <MonthLoading next={months.next} loading={months.loading} failed={months.failed} retry={months.retry} />
                  )}
                </FeedSection>
              );
            })}
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-line bg-paper px-5 py-6 text-[13.5px] text-ink-2">
            Nothing in the feed yet.{" "}
            <Link href={ROUTES.incidents} className="font-semibold text-introduced hover:underline">
              The incident patterns →
            </Link>
          </p>
        )}

        {hash && !target && months.next && (
          <div className="mt-4">
            <MonthLoading next={months.next} loading={months.loading} failed={months.failed} retry={months.retry} />
          </div>
        )}
      </div>
    </>
  );
}

/** While an open week waits for its month: loading, or a way to try again. */
function MonthLoading({ next, loading, failed, retry }: { next: string | null; loading: string | null; failed: string | null; retry: () => void }) {
  if (!next) return null;
  return (
    <p className="px-4 py-3 text-[13px] text-ink-3 sm:px-5" data-feed-more={next}>
      {failed ? (
        <button type="button" onClick={retry} className="font-semibold text-introduced hover:underline">
          {formatMonth(failed)} did not load. Try again
        </button>
      ) : (
        <span aria-live="polite">Loading {formatMonth(loading ?? next)}…</span>
      )}
    </p>
  );
}

/**
 * One section: its heading, its count after the chips (and how many are new), its overview (or,
 * with none written, its headlines' titles), and its items when open. A section that folds has
 * an expander; Latest does not.
 */
function FeedSection({
  id,
  heading,
  when,
  count,
  fresh,
  span,
  open,
  onToggle,
  children,
}: {
  id: string;
  heading: string;
  when?: string;
  count: number;
  fresh: number;
  span: FeedSpan;
  open: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}) {
  const folds = Boolean(onToggle);
  return (
    <section aria-labelledby={`${id}-title`} data-section={id} data-open={open} className="scroll-mt-20 overflow-hidden rounded-xl border border-line bg-paper" id={id}>
      <div className="px-4 py-3.5 sm:px-5">
        <h2 id={`${id}-title`} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className="display text-[17px] font-bold text-ink">{heading}</span>
          <span className="text-[12.5px] text-ink-3">
            {when && <>{when} · </>}
            <span data-section-count={count}>{plural(count, "item")}</span>
            {fresh > 0 && <span className="font-semibold text-introduced" data-section-new={fresh}> · {fresh} new</span>}
          </span>
        </h2>
        {span.overview ? (
          <p className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed text-ink-2" data-overview>
            {span.overview}
          </p>
        ) : span.headlines?.length ? (
          <ul className="mt-1.5 max-w-3xl list-disc space-y-0.5 pl-5 text-[13.5px] leading-snug text-ink-2" data-overview-headlines>
            {span.headlines.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        ) : null}
        {folds && count > 0 && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={`${id}-items`}
            data-expander
            className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-introduced hover:underline"
          >
            <span aria-hidden className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}>
              ›
            </span>
            {open ? "Hide the items" : `Show the ${plural(count, "item")}`}
          </button>
        )}
      </div>
      {open && (!folds || count > 0) && (
        <div id={`${id}-items`} className="border-t border-line" data-section-items>
          {children}
        </div>
      )}
    </section>
  );
}

/** An open section's items: its stories and standalone items, heaviest and newest first, then "+N briefs". */
function SectionItems({
  list,
  briefsOpen,
  onBriefs,
  anchored,
  fresh,
  hash,
}: {
  list: FeedItem[];
  briefsOpen: boolean;
  onBriefs: () => void;
  anchored: (f: FeedItem) => boolean;
  fresh: Set<string>;
  hash: string;
}) {
  const { shown, briefs, briefCount } = sectionUnits(list);
  const units = briefsOpen ? [...shown, ...briefs] : shown;
  const row = (f: FeedItem, nested = false) => <FeedRow key={f.id} item={f} anchor={anchored(f)} inView={hash === f.id} isNew={fresh.has(f.id)} nested={nested} />;
  return (
    <>
      {units.length > 0 && (
        <ul className="divide-y divide-line" data-units>
          {units.map((u) => (u.story ? <StoryGroup key={u.key} unit={u} row={row} /> : row(u.items[0])))}
        </ul>
      )}
      {briefCount > 0 && (
        <p className={`px-4 py-2.5 sm:px-5 ${units.length ? "border-t border-line" : ""}`}>
          <button type="button" onClick={onBriefs} aria-expanded={briefsOpen} data-briefs={briefCount} className="text-[13px] font-semibold text-introduced hover:underline">
            {briefsOpen ? `Hide the ${plural(briefCount, "brief")}` : `+${plural(briefCount, "brief")}`}
          </button>
        </p>
      )}
    </>
  );
}

/** A story: its title, how many items, its deep dive if it has one, then its items newest first. */
function StoryGroup({ unit, row }: { unit: FeedUnit; row: (f: FeedItem, nested?: boolean) => React.ReactNode }) {
  const story = unit.story!;
  return (
    <li data-story={story.id} className="px-4 py-3.5 sm:px-5">
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="eyebrow">Story</span>
        <span className="text-[14px] font-semibold leading-snug text-ink" data-story-title>
          {story.title}
        </span>
        <span className="text-[12px] text-ink-3">{plural(unit.items.length, "item")}</span>
        {story.incident && (
          <Link href={incidentHref(story.incident)} title={incidentById.get(story.incident)?.title} className="text-[12.5px] font-semibold text-introduced hover:underline">
            Deep dive →
          </Link>
        )}
      </p>
      <ul className="mt-2 divide-y divide-line border-l-2 border-line-strong">{unit.items.map((f) => row(f, true))}</ul>
    </li>
  );
}

/**
 * One item: its kind, weight and date (and, for an incident, its incident pattern and evidence),
 * what happened, why it matters, who announced it and what it touches on this site, the security
 * tool it announced, its deep dive, and who said so. `anchor` gives it its id, the place a link
 * lands; an item listed twice (in Latest and in its week) has it once.
 */
function FeedRow({ item, anchor, inView, isNew, nested }: { item: FeedItem; anchor: boolean; inView: boolean; isNew: boolean; nested: boolean }) {
  const incident = item.kind === "incident";
  const [first, ...others] = item.sources;
  const tag = "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-[1px] text-[11.5px] font-medium";
  const hasTags = Boolean(item.vendor || item.products?.length || item.controls?.length || item.patterns.length);
  return (
    <li
      id={anchor ? item.id : undefined}
      data-item={item.id}
      data-item-kind={item.kind}
      className={`scroll-mt-20 transition-colors ${nested ? "py-3 pl-3 sm:pl-4" : "px-4 py-4 sm:px-5"} ${inView ? "bg-introduced-soft/50" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <KindTag kind={item.kind} />
        <WeightMark weight={item.weight} />
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
      <h3 className={`mt-1.5 font-semibold leading-snug text-ink ${item.weight === "headline" ? "text-[16px]" : "text-[15px]"}`}>{item.title}</h3>
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
