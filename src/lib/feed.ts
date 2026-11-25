/**
 * What the pages and the build work out from a list of feed items, and nothing else: it reads no
 * dataset, so the build (which writes the month files, the index and the search titles), the
 * pages built from src/data/generated/feed.json and a test given its own items agree by
 * construction. The feed itself never enters the dataset every page loads; see feed-server.ts.
 */
import { FEED_KINDS } from "./feed-vocabulary";
import { daysBefore, incidentsUnder } from "./incident-patterns";
import type { FeedIndex, FeedItem, FeedTitle, SecurityTool } from "./types";

/** How many of a pattern's newest incidents its Incidents tab lists before it hands over to the feed. */
export const FEED_ON_PATTERN = 5;
/** How many of the newest incidents an incident pattern's page lists before it hands over to the feed. */
export const FEED_ON_INCIDENT_PATTERN = 8;
/** The window, in days, an incident pattern's card on /incidents/ counts. */
export const RECENT_DAYS = 30;
/** The days /feed/ is built with; older months load as the reader scrolls or filters. */
export const FEED_INITIAL_DAYS = 7;
/** How many of the newest items /feed.xml carries. */
export const RSS_ITEMS = 100;

/** "2026-11-07" -> "2026-11". */
export const monthOf = (date: string) => date.slice(0, 7);

/** The feed's incidents, in its order. */
export const incidentItems = (items: FeedItem[]): FeedItem[] => items.filter((f) => f.kind === "incident");

/** The incidents that would replay on this pattern, newest first (the feed's order). */
export const feedForPattern = (archetypeId: string, items: FeedItem[]): FeedItem[] => items.filter((f) => f.kind === "incident" && f.patterns.includes(archetypeId));

/** The incidents a deep dive tells, as its own walk-through or as one of its "also seen" entries. */
export const feedForIncident = (incidentId: string, items: FeedItem[]): FeedItem[] => items.filter((f) => f.incident === incidentId);

/** The incidents filed under one incident pattern, newest first. */
export const feedForCategory = (category: string, items: FeedItem[]): FeedItem[] => incidentsUnder(category, items);

/** The items whose site update waits for the owner. */
export const proposedUpdates = (items: FeedItem[]): FeedItem[] => items.filter((f) => f.update?.status === "proposed");

/** The newest day's items: the Latest section's headlines. */
export function latestDay(items: FeedItem[]): { day: string; items: FeedItem[] } {
  const day = items.reduce((d, f) => (f.date > d ? f.date : d), "");
  return { day, items: day ? items.filter((f) => f.date === day) : [] };
}

/** Items newest first, gathered by month, newest month first. */
export function byMonth(items: FeedItem[]): { month: string; items: FeedItem[] }[] {
  const months = new Map<string, FeedItem[]>();
  for (const f of [...items].sort((a, b) => b.date.localeCompare(a.date))) {
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

/** What /feed/ knows before it loads a month: the months, the counts its filters start from, every proposed update. */
export function feedIndexOf(items: FeedItem[]): FeedIndex {
  const incidents = incidentItems(items);
  return {
    total: items.length,
    latest: latestDay(items).day,
    months: byMonth(items).map(({ month, items: list }) => ({ month, count: list.length })),
    kinds: Object.fromEntries(FEED_KINDS.map((k) => [k.id, items.filter((f) => f.kind === k.id).length])),
    incidents: {
      category: tally(incidents.map((f) => f.category ?? "")),
      evidence: tally(incidents.map((f) => f.evidence ?? "")),
      pattern: tally(incidents.flatMap((f) => f.patterns)),
    },
    proposed: proposedUpdates(items),
  };
}

/** Site search's view of the feed: a title, a kind, a day, and an incident's incident pattern. */
export const feedTitles = (items: FeedItem[]): FeedTitle[] =>
  items.map((f) => ({ id: f.id, kind: f.kind, date: f.date, title: f.title, ...(f.category ? { category: f.category } : {}) }));

/** The items /feed/ is built with: the newest `days` days, counted back from the newest item. Everything from `from` on is there. */
export function initialWindow(items: FeedItem[], days = FEED_INITIAL_DAYS): { from: string; items: FeedItem[] } {
  const newest = latestDay(items).day;
  if (!newest) return { from: "", items: [] };
  const from = daysBefore(newest, days - 1);
  return { from, items: items.filter((f) => f.date >= from) };
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

/** Each item with the security tools that name it as their announcement, as the item shows them. */
export function withSecurityTools(items: FeedItem[], tools: SecurityTool[]): FeedItem[] {
  const byItem = new Map<string, SecurityTool[]>();
  for (const t of tools) if (t.feed) byItem.set(t.feed, [...(byItem.get(t.feed) ?? []), t]);
  return items.map((f) => {
    const mine = byItem.get(f.id);
    return mine ? { ...f, securityTools: mine.map(({ id, name, by, kind, status, url }) => ({ id, name, by, kind, status, url })) } : f;
  });
}

/** The security tools that help deliver one control, by name. */
export const securityToolsFor = (controlId: string, tools: SecurityTool[]): SecurityTool[] => tools.filter((t) => t.controls.includes(controlId));
