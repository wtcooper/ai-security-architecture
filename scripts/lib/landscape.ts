import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import type { Landscape, LandscapeView } from "../../src/lib/types";

/**
 * Compile the enterprise landscape: three framings and one placement per MITRE parent per
 * framing. Every parent must be placed in every view, and nothing else may be placed —
 * specialisations follow their parent, so a stray cap-* here would double-count it.
 */
export async function loadLandscape(root: string, parentIds: Set<string>): Promise<Landscape> {
  const doc = parse(await readFile(join(root, "data/overlay/landscape.yaml"), "utf8")) as Landscape;
  const check = (ok: unknown, message: string) => { if (!ok) throw new Error(`Landscape: ${message}`); };
  check(doc.attribution?.trim(), "missing attribution");
  check(doc.views?.length, "no views");
  const viewIds = new Set<string>();
  for (const view of doc.views) {
    check(/^[a-z]+$/.test(view.id) && !viewIds.has(view.id), `bad or duplicate view id ${view.id}`);
    viewIds.add(view.id);
    check(view.title?.trim() && view.short?.trim() && view.basis?.trim() && view.description?.trim(), `${view.id}: incomplete definition`);
    check(view.url?.startsWith("https://"), `${view.id}: basis needs a source url`);
    if (view.kind === "groups") {
      check(view.groups?.length && !view.rows && !view.columns, `${view.id}: a grouped view needs groups only`);
      const ids = new Set<string>();
      for (const g of view.groups!) {
        check(g.id && g.title?.trim() && g.blurb?.trim() && !ids.has(g.id), `${view.id}: bad group ${g.id}`);
        ids.add(g.id);
        const lanes = new Set<string>();
        for (const l of g.lanes ?? []) {
          check(l.id && l.title?.trim() && !lanes.has(l.id), `${view.id}/${g.id}: bad lane ${l.id}`);
          lanes.add(l.id);
        }
      }
    } else {
      check(view.kind === "matrix" && view.rows?.length && view.columns?.length && !view.groups, `${view.id}: a matrix needs rows and columns only`);
      for (const axis of [view.rows!, view.columns!]) {
        const ids = new Set<string>();
        for (const a of axis) {
          check(a.id && a.title?.trim() && !ids.has(a.id), `${view.id}: bad axis entry ${a.id}`);
          ids.add(a.id);
        }
      }
    }
  }
  for (const [id, placement] of Object.entries(doc.placements ?? {})) {
    check(parentIds.has(id), `${id} is not a MITRE parent capability`);
    for (const view of doc.views) {
      const value = placement[view.id];
      check(typeof value === "string" && value.trim(), `${id}: no placement in ${view.id}`);
      check(resolvePlacement(view, value) !== null, `${id}: ${view.id} placement "${value}" does not resolve`);
    }
    check(Object.keys(placement).every((k) => viewIds.has(k)), `${id}: placement names an unknown view`);
  }
  for (const id of parentIds) check(doc.placements?.[id], `${id} has no landscape placement`);
  return doc;
}

/**
 * A placement string against its view: `group` or `group/lane` for a grouped view (a lane is
 * required exactly when the group declares lanes), `row/column` for the matrix. Null when the
 * string names nothing the view has. Shared with the client so both read one grammar.
 */
export function resolvePlacement(view: LandscapeView, value: string): { group: string; lane?: string } | { row: string; column: string } | null {
  const [a, b, ...rest] = value.split("/");
  if (rest.length) return null;
  if (view.kind === "groups") {
    const group = view.groups?.find((g) => g.id === a);
    if (!group) return null;
    if (group.lanes?.length) return b && group.lanes.some((l) => l.id === b) ? { group: a, lane: b } : null;
    return b === undefined ? { group: a } : null;
  }
  return b && view.rows?.some((r) => r.id === a) && view.columns?.some((c) => c.id === b) ? { row: a, column: b } : null;
}
