import type { StepOverlay } from "@/components/reference/FlowDiagram";
import { incidents } from "@/lib/data";
import type { Archetype, Incident, IncidentStep } from "@/lib/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09" -> "Sep 2026". */
export const formatMonth = (date: string) => {
  const [y, m] = date.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
};

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
