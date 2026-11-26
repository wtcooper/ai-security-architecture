/**
 * What the pages and the build work out from a list of feed items, and nothing else: it reads no
 * dataset, so the build (which writes the month files, the index and the search titles), the
 * pages built from src/data/generated/feed.json and a test given its own items agree by
 * construction. The feed itself never enters the dataset every page loads; see feed-server.ts.
 */
import { FEED_KINDS, weightRank } from "./feed-vocabulary";
import { daysBefore, incidentsUnder } from "./incident-patterns";
import type { FeedIndex, FeedItem, FeedOverviews, FeedSpan, FeedStory, FeedTitle, SecurityTool } from "./types";

/** How many of a pattern's newest incidents its Incidents tab lists before it hands over to the Incidents page. */
export const FEED_ON_PATTERN = 5;
/** How many of the newest incidents an incident pattern's page lists before it hands over to the Incidents page. */
export const FEED_ON_INCIDENT_PATTERN = 8;
/** The window, in days, an incident pattern's card on /incidents/ counts, and the reports /incidents/ is built with. */
export const RECENT_DAYS = 30;
/** The days /feed/ is built with (the Latest day and the whole of its week); older months load as the reader opens older weeks. */
export const FEED_INITIAL_DAYS = 7;
/** How many of the newest items /feed.xml carries. */
export const RSS_ITEMS = 100;
/** How many items the home page's "Today in AI security" lists. */
export const HOME_HEADLINES = 12;
/** A section with no overview lists at most this many of its headlines' titles in its place. */
export const SPAN_HEADLINES = 5;

/** "2026-11-07" -> "2026-11". */
export const monthOf = (date: string) => date.slice(0, 7);

/** The Monday of the ISO week a day falls in, "YYYY-MM-DD". Weeks run Monday to Sunday. */
export function weekOf(date: string): string {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

/** The ISO week a day falls in: its year (which a day near New Year may not share) and its number. */
export function isoWeek(date: string): { year: number; week: number } {
  const thursday = new Date(`${weekOf(date)}T00:00:00Z`);
  thursday.setUTCDate(thursday.getUTCDate() + 3);
  const year = thursday.getUTCFullYear();
  const firstThursday = new Date(`${weekOf(`${year}-01-04`)}T00:00:00Z`);
  firstThursday.setUTCDate(firstThursday.getUTCDate() + 3);
  return { year, week: 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 86_400_000)) };
}

/** Items gathered under the week each came to light in, newest week first, newest first within it. */
export function byWeek<T extends { date: string }>(items: T[]): { week: string; items: T[] }[] {
  const weeks = new Map<string, T[]>();
  for (const item of newestFirst(items)) {
    const week = weekOf(item.date);
    if (!weeks.has(week)) weeks.set(week, []);
    weeks.get(week)!.push(item);
  }
  return [...weeks].map(([week, list]) => ({ week, items: list }));
}

/** Newest first; ties keep the order given. */
const newestFirst = <T extends { date: string }>(items: T[]): T[] =>
  items.map((f, i) => ({ f, i })).sort((a, b) => b.f.date.localeCompare(a.f.date) || a.i - b.i).map((x) => x.f);

/** The feed's incidents, in its order. */
export const incidentItems = (items: FeedItem[]): FeedItem[] => items.filter((f) => f.kind === "incident");

/** The incidents that would replay on this pattern, newest first (the feed's order). */
export const feedForPattern = (archetypeId: string, items: FeedItem[]): FeedItem[] => items.filter((f) => f.kind === "incident" && f.patterns.includes(archetypeId));

/** The incidents a deep dive tells, as its own walk-through or as one of its "also seen" entries. */
export const feedForIncident = (incidentId: string, items: FeedItem[]): FeedItem[] => items.filter((f) => f.incident === incidentId);

/** The incidents filed under one incident pattern, newest first. */
export const feedForCategory = (category: string, items: FeedItem[]): FeedItem[] => incidentsUnder(category, items);

/** The newest day items are dated (came to light) on, and its items. */
export function latestDay(items: FeedItem[]): { day: string; items: FeedItem[] } {
  const day = items.reduce((d, f) => (f.date > d ? f.date : d), "");
  return { day, items: day ? items.filter((f) => f.date === day) : [] };
}

/** The newest day the run filed items on (their `added`), and those items: the Latest section. */
export function latestAdded<T extends { added: string }>(items: T[]): { day: string; items: T[] } {
  const day = items.reduce((d, f) => (f.added > d ? f.added : d), "");
  return { day, items: day ? items.filter((f) => f.added === day) : [] };
}

/** Items newest first, gathered by month, newest month first. */
export function byMonth(items: FeedItem[]): { month: string; items: FeedItem[] }[] {
  const months = new Map<string, FeedItem[]>();
  for (const f of newestFirst(items)) {
    const m = monthOf(f.date);
    if (!months.has(m)) months.set(m, []);
    months.get(m)!.push(f);
  }
  return [...months].map(([month, list]) => ({ month, items: list }));
}

const tally = (values: string[]) => {
  const out: Record<string, number> = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return out;
};

/** Items of each kind, every kind named. */
const kindsOf = (items: FeedItem[]) => Object.fromEntries(FEED_KINDS.map((k) => [k.id, items.filter((f) => f.kind === k.id).length]));

/**
 * What a section says before its items are loaded: its counts and its overview, or, with none
 * written, the titles of its headlines (its first notable items when it has no headline).
 */
export function spanOf(items: FeedItem[], overview?: string): FeedSpan {
  const span: FeedSpan = { count: items.length, kinds: kindsOf(items) };
  if (overview) return { ...span, overview };
  const sorted = newestFirst(items);
  const heads = sorted.filter((f) => f.weight === "headline");
  const pick = heads.length ? heads : sorted.filter((f) => f.weight === "notable");
  const titles = pick.slice(0, SPAN_HEADLINES).map((f) => f.title);
  return titles.length ? { ...span, headlines: titles } : span;
}

/**
 * What /feed/ knows before it loads a month: the months, the Latest day (the items filed on the
 * newest `added` day, with that day's overview) and every week by `date` as sections, and the
 * counts its filters start from.
 */
export function feedIndexOf(items: FeedItem[], overviews: FeedOverviews = { days: [], weeks: [] }): FeedIndex {
  const incidents = incidentItems(items);
  const latest = latestAdded(items);
  const dayOverview = new Map(overviews.days.map((d) => [d.date, d.overview]));
  const weekOverview = new Map(overviews.weeks.map((w) => [w.week, w.overview]));
  return {
    total: items.length,
    latest: latest.day,
    months: byMonth(items).map(({ month, items: list }) => ({ month, count: list.length })),
    kinds: kindsOf(items),
    incidents: {
      category: tally(incidents.map((f) => f.category ?? "")),
      evidence: tally(incidents.map((f) => f.evidence ?? "")),
      pattern: tally(incidents.flatMap((f) => f.patterns)),
    },
    ...(latest.day ? { day: { date: latest.day, ...spanOf(latest.items, dayOverview.get(latest.day)) } } : {}),
    weeks: byWeek(items).map(({ week, items: list }) => ({ week, ...spanOf(list, weekOverview.get(week)) })),
  };
}

/** Site search's view of the feed: a title, a kind, a day, and an incident's incident pattern. */
export const feedTitles = (items: FeedItem[]): FeedTitle[] =>
  items.map((f) => ({ id: f.id, kind: f.kind, date: f.date, title: f.title, ...(f.category ? { category: f.category } : {}) }));

/** The items a page is built with: the newest `days` days, counted back from the newest item. Everything from `from` on is there. */
export function initialWindow(items: FeedItem[], days = FEED_INITIAL_DAYS): { from: string; items: FeedItem[] } {
  const newest = latestDay(items).day;
  if (!newest) return { from: "", items: [] };
  const from = daysBefore(newest, days - 1);
  return { from, items: items.filter((f) => f.date >= from) };
}

/**
 * The items /feed/ is built with: the newest `days` days by `date` (so the whole of the newest
 * week), and every item filed in the newest `days` days by `added` (so all of Latest, and what is
 * new since a recent visit, whatever its date). `addedFrom` is the day from which every item filed
 * is in hand.
 */
export function feedWindow(items: FeedItem[], days = FEED_INITIAL_DAYS): { from: string; addedFrom: string; items: FeedItem[] } {
  const { from } = initialWindow(items, days);
  const newestAdded = latestAdded(items).day;
  const addedFrom = newestAdded ? daysBefore(newestAdded, days - 1) : "";
  return { from, addedFrom, items: items.filter((f) => (from && f.date >= from) || (addedFrom && f.added >= addedFrom)) };
}

/**
 * The home page's "Today in AI security", up to `n`: the headline and notable items filed on the
 * newest `added` day first, then the other headline and notable items, newest by `date` first,
 * then the briefs in the same order. A brief never comes before a heavier item.
 */
export function homeHeadlines(items: FeedItem[], n = HOME_HEADLINES): FeedItem[] {
  const today = latestAdded(items).day;
  const sorted = newestFirst(items);
  const heavy = sorted.filter((f) => f.weight !== "brief");
  const briefs = sorted.filter((f) => f.weight === "brief");
  const todayFirst = (list: FeedItem[]) => [...list.filter((f) => f.added === today), ...list.filter((f) => f.added !== today)];
  return [...todayFirst(heavy), ...todayFirst(briefs)].slice(0, n);
}

/**
 * One thing a section lists: an item on its own, or a story (its title, then its items newest
 * first). It ranks by its heaviest item, then its newest.
 */
export interface FeedUnit {
  key: string;
  story?: { id: string; title: string; incident?: string };
  items: FeedItem[];
  weight: FeedItem["weight"];
  date: string;
}

/**
 * A section's items as it lists them: grouped by story, then every story and standalone item by
 * weight (headline, notable, brief) and then date, newest first. What is shown open is every unit
 * with a headline or a notable item; the units that hold only briefs fold behind "+N briefs".
 */
export function sectionUnits(items: FeedItem[]): { shown: FeedUnit[]; briefs: FeedUnit[]; briefCount: number } {
  const units: FeedUnit[] = [];
  const byStory = new Map<string, FeedUnit>();
  for (const f of newestFirst(items)) {
    if (f.story) {
      const known = byStory.get(f.story);
      if (known) {
        known.items.push(f);
        if (weightRank(f.weight) < weightRank(known.weight)) known.weight = f.weight;
        continue;
      }
      const unit: FeedUnit = {
        key: `story-${f.story}`,
        story: { id: f.story, title: f.storyTitle ?? f.story, ...(f.storyIncident ? { incident: f.storyIncident } : {}) },
        items: [f],
        weight: f.weight,
        date: f.date,
      };
      byStory.set(f.story, unit);
      units.push(unit);
    } else units.push({ key: f.id, items: [f], weight: f.weight, date: f.date });
  }
  const ranked = units.map((u, i) => ({ u, i })).sort((a, b) => weightRank(a.u.weight) - weightRank(b.u.weight) || b.u.date.localeCompare(a.u.date) || a.i - b.i).map((x) => x.u);
  const shown = ranked.filter((u) => u.weight !== "brief");
  const briefs = ranked.filter((u) => u.weight === "brief");
  return { shown, briefs, briefCount: briefs.reduce((n, u) => n + u.items.length, 0) };
}

/** What an incident pattern's card on /incidents/ shows of the feed: how many in the last RECENT_DAYS days, and the newest. */
export interface IncidentPatternCardFeed {
  recent: number;
  latest?: Pick<FeedItem, "id" | "date" | "title">;
}

/** Each incident pattern's card, worked out from the whole feed, so the page is given counts and one title each, not the items. */
export function incidentPatternCards(items: FeedItem[], today: string): Record<string, IncidentPatternCardFeed> {
  const from = daysBefore(today, RECENT_DAYS);
  const cards: Record<string, IncidentPatternCardFeed> = {};
  for (const f of incidentItems(items)) {
    if (!f.category) continue;
    const card = (cards[f.category] ??= { recent: 0 });
    if (!card.latest || f.date > card.latest.date) card.latest = { id: f.id, date: f.date, title: f.title };
    if (f.date > from && f.date <= today) card.recent += 1;
  }
  return cards;
}

/**
 * An incident as the Incidents page's report list shows it: the few fields its row and its
 * filters read, so the page is built with a slim list and the months it loads are slimmed alike.
 */
export type IncidentReport = Pick<FeedItem, "id" | "date" | "title" | "weight" | "category" | "evidence" | "patterns" | "incident">;

export const toReport = (f: FeedItem): IncidentReport => ({
  id: f.id,
  date: f.date,
  title: f.title,
  weight: f.weight,
  ...(f.category ? { category: f.category } : {}),
  ...(f.evidence ? { evidence: f.evidence } : {}),
  patterns: f.patterns,
  ...(f.incident ? { incident: f.incident } : {}),
});

/** Each item with the security tools that name it as their announcement, as the item shows them. */
export function withSecurityTools<T extends FeedItem>(items: T[], tools: SecurityTool[]): T[] {
  const byItem = new Map<string, SecurityTool[]>();
  for (const t of tools) if (t.feed) byItem.set(t.feed, [...(byItem.get(t.feed) ?? []), t]);
  return items.map((f) => {
    const mine = byItem.get(f.id);
    return mine ? { ...f, securityTools: mine.map(({ id, name, by, kind, status, url }) => ({ id, name, by, kind, status, url })) } : f;
  });
}

/** Each item with its story's title, and the deep dive the story belongs to, so a section can group them without the stories file. */
export function withStories<T extends FeedItem>(items: T[], stories: FeedStory[]): T[] {
  const byId = new Map(stories.map((s) => [s.id, s]));
  return items.map((f) => {
    const s = f.story ? byId.get(f.story) : undefined;
    return s ? { ...f, storyTitle: s.title, ...(s.incident ? { storyIncident: s.incident } : {}) } : f;
  });
}

/** The security tools that help deliver one control, by name. */
export const securityToolsFor = (controlId: string, tools: SecurityTool[]): SecurityTool[] => tools.filter((t) => t.controls.includes(controlId));
