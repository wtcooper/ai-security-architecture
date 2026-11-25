import type { StepOverlay } from "@/components/drawing/types";
import { incidents } from "@/lib/data";
import type { Archetype, Incident, IncidentStep } from "@/lib/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09" -> "Sep 2026". */
export const formatMonth = (date: string) => {
  const [y, m] = date.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
};

const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const parts = (date: string) => date.split("-").map(Number);

/** "2026-11-07" -> "7 Nov 2026"; "2026-11" -> "Nov 2026". */
export const formatDay = (date: string) => {
  const [y, m, d] = parts(date);
  return d ? `${d} ${MONTHS[m - 1]} ${y}` : formatMonth(date);
};

/** "2026-11-07" -> "7 Nov", for a day already under its week's heading. */
export const formatShortDay = (date: string) => {
  const [, m, d] = parts(date);
  return `${d} ${MONTHS[m - 1]}`;
};

/** "2026-11-16" -> "16 November 2026". */
export const formatLongDay = (date: string) => {
  const [y, m, d] = parts(date);
  return `${d} ${MONTHS_LONG[m - 1]} ${y}`;
};

/** The Monday of the week a day falls in, "YYYY-MM-DD". Weeks run Monday to Sunday. */
export function weekOf(date: string): string {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

/** Items already newest first, gathered under the week each came to light in, newest week first. */
export function byWeek<T extends { date: string }>(items: T[]): { week: string; items: T[] }[] {
  const weeks: { week: string; items: T[] }[] = [];
  for (const item of items) {
    const week = weekOf(item.date);
    const last = weeks.at(-1);
    if (last?.week === week) last.items.push(item);
    else weeks.push({ week, items: [item] });
  }
  return weeks;
}

/** Newest first; ties keep file order, so a case study's place is stable. */
export const incidentsNewestFirst = (): Incident[] =>
  incidents.map((inc, i) => ({ inc, i })).sort((a, b) => b.inc.date.localeCompare(a.inc.date) || a.i - b.i).map((x) => x.inc);

/**
 * The step replayed on its reference architecture: the blocks it lands in and the edges it
 * rides, straight from the step's authored `path`. An edge walked against a bidirectional
 * arrow is keyed the way the layout drew it, so the diagram finds it.
 */
export function stepOverlay(archetype: Archetype, step: IncidentStep): StepOverlay {
  const drawn = new Set(archetype.edges.map((e) => `${e.from}->${e.to}`));
  const marks: Record<string, number> = {};
  const edges: string[] = [];
  for (const ref of step.path) {
    if (!ref.includes("->")) {
      marks[ref] = step.n;
      continue;
    }
    const [a, b] = ref.split("->");
    marks[a] = step.n;
    marks[b] = step.n;
    edges.push(drawn.has(ref) ? ref : `${b}->${a}`);
  }
  return { phase: step.phase, marks, edges };
}
