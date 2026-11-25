/**
 * What an incident pattern's page shows but its file does not say: its deep dives, its feed
 * items and the patterns it lands on. Worked out from the deep dives and the feed alone, so the
 * build (which writes it into the dataset) and a page given a test feed agree by construction.
 * Nothing here reads the dataset.
 */
import type { FeedItem, Incident, IncidentPattern, IncidentPatternAuthored, IncidentPatternLanding } from "./types";

/** Deep dives newest first; ties keep file order, so a deep dive's place is stable. */
export const deepDivesNewestFirst = (incidents: Incident[]): Incident[] =>
  incidents.map((inc, i) => ({ inc, i })).sort((a, b) => b.inc.date.localeCompare(a.inc.date) || a.i - b.i).map((x) => x.inc);

/**
 * The patterns an incident pattern's incidents replay on, most often first. Every feed item counts
 * once for each pattern it names; a deep dive counts for its own pattern unless a feed item that
 * points at it already names that pattern, so one incident is never counted twice. Ties keep the
 * order `patternOrder` gives (the catalogue's), then first seen.
 */
export function landsOn(items: FeedItem[], deepDives: Incident[], patternOrder: string[] = []): IncidentPatternLanding[] {
  const tally = new Map<string, IncidentPatternLanding>();
  const at = (pattern: string) => {
    if (!tally.has(pattern)) tally.set(pattern, { pattern, count: 0, feed: 0, deepDives: 0 });
    return tally.get(pattern)!;
  };
  for (const f of items) {
    for (const pattern of f.patterns) {
      const t = at(pattern);
      t.feed += 1;
      t.count += 1;
    }
  }
  for (const d of deepDives) {
    const t = at(d.archetype);
    t.deepDives += 1;
    if (!items.some((f) => f.incident === d.id && f.patterns.includes(d.archetype))) t.count += 1;
  }
  const rank = (id: string) => {
    const i = patternOrder.indexOf(id);
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  };
  const seen = [...tally.keys()];
  return [...tally.values()].sort((a, b) => b.count - a.count || rank(a.pattern) - rank(b.pattern) || seen.indexOf(a.pattern) - seen.indexOf(b.pattern));
}

/** The incidents in a feed filed under one incident pattern, newest first (ties keep feed order). */
export const incidentsUnder = (category: string, feed: FeedItem[]): FeedItem[] =>
  feed
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => f.kind === "incident" && f.category === category)
    .sort((a, b) => b.f.date.localeCompare(a.f.date) || a.i - b.i)
    .map(({ f }) => f);

/** One incident pattern with its deep dives (newest first), how many feed items it holds, and its landings. */
export function deriveIncidentPattern(
  pattern: IncidentPatternAuthored,
  incidents: Incident[],
  feed: FeedItem[],
  patternOrder: string[] = [],
): IncidentPattern {
  const deepDives = deepDivesNewestFirst(incidents.filter((i) => i.category === pattern.id));
  const items = incidentsUnder(pattern.id, feed);
  return {
    ...pattern,
    deepDives: deepDives.map((d) => d.id),
    feedCount: items.length,
    landsOn: landsOn(items, deepDives, patternOrder),
  };
}

/** Every incident pattern, by `order`, derived from the same deep dives and feed. */
export const deriveIncidentPatterns = (
  patterns: IncidentPatternAuthored[],
  incidents: Incident[],
  feed: FeedItem[],
  patternOrder: string[] = [],
): IncidentPattern[] => [...patterns].sort((a, b) => a.order - b.order).map((p) => deriveIncidentPattern(p, incidents, feed, patternOrder));

/** The day `days` before a "YYYY-MM-DD" day. */
export function daysBefore(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** The feed items dated within the `days` days up to and including `today`. */
export const within = (items: FeedItem[], today: string, days: number): FeedItem[] => {
  const from = daysBefore(today, days);
  return items.filter((f) => f.date > from && f.date <= today);
};
