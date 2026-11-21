/**
 * The boundary drawing's layout: a pattern drawn as nested trust boundaries, computed from the
 * data a pattern already has (zones, each block's zone, grid cell and parent, the edges). No
 * pattern has coordinates of its own.
 *
 *   people            stand at the left, outside every boundary
 *   endpoint, cloud   boundaries we run, side by side in the pattern's own column order
 *   vendor            the vendor's boundary, beside them
 *   external          a band beneath, each party under whatever reaches it
 *   control plane     a band beneath everything, because it applies to all of it
 *
 * Boxes keep the rows the pattern authors, so components that talk to each other stay level and
 * most arrows run straight. Arrows are routed orthogonally around every box on a sparse grid of
 * tracks, then each takes a label and a point where its chips, risk tags and step numbers sit.
 *
 * Pure and deterministic: tests and audits call it without a browser.
 */
import { clouds, componentChoiceFor, fillsOn, toolsForArchetype } from "@/lib/data";
import type { Archetype, ArchBlock, ArchZone } from "@/lib/types";

export type Pt = [number, number];
export type BoundaryTone = "ours" | "vendor" | "outside" | "control";
export type BoxTone = "plain" | "actor" | "container" | "governance";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ViewBoundary extends Rect {
  zone: string;
  owner: ArchZone["owner"];
  /** The zone's canonical title. */
  title: string;
  /** What it is on this pattern, or what its owner implies; absent when neither is known. */
  gloss?: string;
  tone: BoundaryTone;
  /** The surface this pattern is about: drawn a little stronger. */
  primary: boolean;
  /** How much wider the boundary is than what it holds, because its label needed the room. */
  stretched?: number;
  /** The label's drawn extent, kept clear of arrows. */
  label: Rect;
}

export interface ViewBox extends Rect {
  /** A block id on the pattern. */
  id: string;
  tone: BoxTone;
  /** Lines of one-liner the box has room for. */
  lines: number;
  /** Controls the box owns, drawn inside it (control-plane boxes only). */
  chipRows: number;
  /** Where a control-plane box's first row of chips sits, below its text. */
  chipTop?: number;
  /** A container's heading height: its title and one-liner, above what it holds. */
  header?: number;
}

export interface ViewLabel {
  x: number;
  /** Baseline of the first line. */
  y: number;
  anchor: "start" | "middle" | "end";
  lines: string[];
}

export interface ViewLine {
  /** "from->to" exactly as the pattern keys the edge. */
  key: string;
  pts: Pt[];
  label?: ViewLabel;
  /** Where chips, risk tags and step numbers sit on the arrow, which way it runs there, and how long that run is. */
  pin: { x: number; y: number; horizontal: boolean; room: number };
}

export interface ViewSpec {
  width: number;
  height: number;
  boundaries: ViewBoundary[];
  boxes: ViewBox[];
  lines: ViewLine[];
}

/**
 * One template per surface. The engine is shared; a template says which boundary the pattern is
 * about and how tightly it is drawn. Column order always comes from the pattern.
 */
interface Template {
  /** The boundary this surface is about. */
  primary: ArchZone["owner"];
  colGap: number;
  rowGap: number;
  /** Space between the trust boundaries and the external band, where crossings are labelled. */
  externalGap: number;
}

export const TEMPLATES: Record<string, Template> = {
  // A tool on a managed device: the device leads, and most crossings drop to the internet beneath it.
  surfaceEndpoint: { primary: "endpoint", colGap: 76, rowGap: 48, externalGap: 60 },
  // An application we build: one wide boundary of ours, read left to right.
  surfaceCloud: { primary: "cloud", colGap: 80, rowGap: 48, externalGap: 58 },
  // A vendor-hosted service: the vendor's boundary leads, ours sits beside it.
  surfaceSaas: { primary: "vendor", colGap: 78, rowGap: 48, externalGap: 58 },
};

const LEAF_W = 166;
const LEAF_H = 68;
const ACTOR_W = 150;
const ACTOR_H = 58;
const HEADER = 52;
const KID_PAD = 24;
const KID_COL_GAP = 60;
const KID_ROW_GAP = 40;
const PAD_X = 20;
const PAD_TOP = 38;
const PAD_BOTTOM = 24;
const ZONE_GAP = 56;
const PEOPLE_GAP = 58;
const MARGIN = 26;
/** Clear space above the boundaries, for arrows that go over the top. */
const TOP = 62;
const EXT_BOX_GAP = 40;
const GOV_GAP = 34;
const CHIP_PITCH = 19;

export const textWidth = (s: string, size: number) => s.length * size * 0.54;

/** Greedy word wrap to a pixel width, capped at `max` lines (the last one ellipsed). */
export function wrap(text: string, width: number, size: number, max: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (textWidth(next, size) > width && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  if (lines.length > max) {
    const kept = lines.slice(0, max);
    kept[max - 1] = `${kept[max - 1].replace(/[,;·—\s]+$/, "")}…`;
    return kept;
  }
  return lines;
}

/** The controls a block owns: pinned on it, listed by it (a control-plane call-out), or listed on one of its items. */
export function ownedControls(archetype: Archetype, block: ArchBlock): string[] {
  const ids = [
    ...archetype.pins.mitigations.filter((p) => p.at === block.id).map((p) => p.mitigation),
    ...(block.mitigations ?? []),
    ...(block.items ?? []).flatMap((i) => i.mitigations ?? []),
  ];
  return [...new Set(ids)]
    .filter((id) => archetype.mitigations.includes(id))
    .sort((a, b) => archetype.mitigations.indexOf(a) - archetype.mitigations.indexOf(b));
}

/** A box's one-liner: authored on the block, else its item labels. */
export const summaryOf = (block: ArchBlock) => block.summary ?? (block.items ?? []).map((i) => i.label).join(" · ");

const keyOf = (e: { from: string; to: string }) => `${e.from}->${e.to}`;

/** A block's cell on this drawing: its own `cell` where the pattern gives one, else the canvas's. */
const colOf = (b: ArchBlock) => b.cell?.col ?? b.col;
const rowOf = (b: ArchBlock) => b.cell?.row ?? b.row;
const spanOf = (b: ArchBlock) => (b.cell ? b.cell.rowSpan ?? 1 : b.rowSpan ?? 1);

// --- Placement -------------------------------------------------------------------

interface Cell {
  id: string;
  col: number;
  row: number;
  span: number;
  w: number;
  h: number;
  /** Fill the rows it spans. Nothing does today: a container is as tall as its contents. */
  stretch: boolean;
}

/** Lay cells on a grid: a column is as wide as its widest cell, a row as tall as its tallest. */
function grid(cells: Cell[], colGap: (a: number, b: number) => number, rowGap: number, minColW?: Map<number, number>) {
  const cols = [...new Set(cells.map((c) => c.col))].sort((a, b) => a - b);
  const rows = [...new Set(cells.flatMap((c) => Array.from({ length: c.span }, (_, i) => c.row + i)))].sort((a, b) => a - b);
  const colW = new Map(cols.map((c) => [c, Math.max(minColW?.get(c) ?? 0, ...cells.filter((x) => x.col === c).map((x) => x.w))]));
  const rowH = new Map(rows.map((r) => [r, Math.max(0, ...cells.filter((x) => x.row === r && x.span === 1).map((x) => x.h))]));
  const spanOf = (c: Cell) => rows.filter((r) => r >= c.row && r < c.row + c.span);
  for (const c of cells.filter((x) => x.span > 1)) {
    const rs = spanOf(c);
    const have = rs.reduce((s, r) => s + rowH.get(r)!, 0) + rowGap * (rs.length - 1);
    if (c.h > have) for (const r of rs) rowH.set(r, rowH.get(r)! + (c.h - have) / rs.length);
  }
  const colX = new Map<number, number>();
  let x = 0;
  cols.forEach((c, i) => {
    if (i) x += colW.get(cols[i - 1])! + colGap(cols[i - 1], c);
    colX.set(c, x);
  });
  const rowY = new Map<number, number>();
  let y = 0;
  rows.forEach((r, i) => {
    if (i) y += rowH.get(rows[i - 1])! + rowGap;
    rowY.set(r, y);
  });
  const at = new Map<string, Rect>();
  for (const c of cells) {
    const rs = spanOf(c);
    const top = rowY.get(rs[0])!;
    const height = rowY.get(rs[rs.length - 1])! + rowH.get(rs[rs.length - 1])! - top;
    const w = c.stretch ? colW.get(c.col)! : c.w;
    const h = c.stretch ? height : c.h;
    // One row: centred in it. Several: level with the first, so a container starts where its row does.
    at.set(c.id, { x: colX.get(c.col)! + (colW.get(c.col)! - w) / 2, y: c.span > 1 ? top : top + (height - h) / 2, w, h });
  }
  const last = cols[cols.length - 1];
  const lastRow = rows[rows.length - 1];
  return {
    w: cols.length ? colX.get(last)! + colW.get(last)! : 0,
    h: rows.length ? rowY.get(lastRow)! + rowH.get(lastRow)! : 0,
    at,
    colX,
    colW,
  };
}

// --- Routing ---------------------------------------------------------------------

interface Obstacle extends Rect {
  /** The box this belongs to, when it is one: an arrow may touch its own ends. */
  box?: string;
}

interface Port {
  i: number;
  j: number;
  cost: number;
  key: string;
}

const T1 = 12;
const T2 = 24;
/** Two parallel arrows are never drawn closer than this. */
const CLEAR = 9;
const BEND = 30;
/** What running across another arrow's words costs, per step: worth a detour. */
const WORDS = 160;
/** What crossing another arrow costs: more than a bend, so a flow goes round where it reasonably can. */
const CROSS = 48;
/** What a step inside a boundary that is neither end's costs, per pixel: enough to go round it. */
const FOREIGN_ZONE = 6;

type LineKind = "edge" | "port" | "soft";

/**
 * Grid lines, sorted. A box's edge stays exactly where it is; a port that would crowd a line
 * already kept snaps onto it; a soft track that would crowd one is dropped. `snap` maps every
 * value offered to the line that stands for it.
 */
function gridLines(values: { v: number; kind: LineKind }[], lo: number, hi: number) {
  const rank = { edge: 0, port: 1, soft: 2 } as const;
  const kept: number[] = [];
  const snap = new Map<number, number>();
  for (const l of [...values].filter((x) => x.v >= lo && x.v <= hi).sort((p, q) => rank[p.kind] - rank[q.kind] || p.v - q.v)) {
    const near = kept.find((k) => Math.abs(k - l.v) < (l.kind === "edge" ? 0.5 : CLEAR));
    if (near !== undefined) {
      if (l.kind !== "soft") snap.set(l.v, near);
      continue;
    }
    kept.push(l.v);
    snap.set(l.v, l.v);
  }
  kept.sort((p, q) => p - q);
  // Open space gets tracks of its own, so an arrow can run down the middle of a gutter
  // instead of hugging the nearest box.
  const filled: number[] = [];
  kept.forEach((v, i) => {
    filled.push(v);
    const gap = (kept[i + 1] ?? v) - v;
    const extra = Math.floor(gap / 20) - 1;
    for (let n = 1; n <= extra; n++) filled.push(v + (gap * n) / (extra + 1));
  });
  return { at: filled, snap };
}

const portFractions = (length: number) => {
  if (length < 56) return [0.5];
  if (length < 190) return [0.5, 0.26, 0.74];
  const n = Math.floor(length / 46);
  return Array.from({ length: n }, (_, i) => (i + 1) / (n + 1)).sort((a, b) => Math.abs(a - 0.5) - Math.abs(b - 0.5));
};

/** A tiny binary heap of [cost, state]. */
class Heap {
  private a: [number, number][] = [];
  get size() {
    return this.a.length;
  }
  push(item: [number, number]) {
    const a = this.a;
    a.push(item);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): [number, number] {
    const a = this.a;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

// --- The layout ------------------------------------------------------------------

const cache = new Map<string, ViewSpec>();

export function boundaryLayout(archetype: Archetype): ViewSpec {
  const hit = cache.get(archetype.id);
  if (hit) return hit;
  const spec = compute(archetype);
  cache.set(archetype.id, spec);
  return spec;
}

function compute(a: Archetype): ViewSpec {
  const template = TEMPLATES[a.surface] ?? TEMPLATES.surfaceCloud;
  const zones = a.zones ?? [];
  const ownerOfZone = new Map(zones.map((z) => [z.id, z.owner]));
  const ownerOf = (b: ArchBlock) => ownerOfZone.get(b.zone ?? "") ?? "cloud";
  const kids = new Map<string, ArchBlock[]>();
  for (const b of a.blocks) if (b.parent) kids.set(b.parent, [...(kids.get(b.parent) ?? []), b]);
  const isContainer = (b: ArchBlock) => kids.has(b.id);
  const isPerson = (b: ArchBlock) => b.kind === "actor" || b.kind === "origin" || ownerOf(b) === "user";

  // A component many flows meet is drawn wider, so each flow has its own place to land.
  const degree = (id: string) => a.edges.filter((e) => e.from === id || e.to === id).length;

  // Everything a box may have to show under its title: its one-liner, and each cloud's service for it.
  const wordsOf = (b: ArchBlock): { text: string; build?: boolean }[] => [
    ...(summaryOf(b) ? [{ text: summaryOf(b) }] : []),
    ...clouds.flatMap((c) =>
      (c.implementations.find((i) => i.architecture === a.id)?.bindings ?? []).filter((x) => x.block === b.id).map((x) => ({ text: x.service, build: x.build })),
    ),
    // A box a catalogued framework fills can carry "built with ..." under whatever it shows.
    ...(toolsForArchetype(a.id).some((t) => fillsOn(t, a.id).includes(b.id)) && summaryOf(b) ? [{ text: summaryOf(b), build: true }] : []),
    // The organisation's own choice for the component is drawn with a one-line tag, as "you build this" is.
    ...clouds.flatMap((c) => {
      const ours = componentChoiceFor(c.id, a.id, b.id);
      return ours ? [{ text: ours.uses, build: true }] : [];
    }),
  ];

  // Sizes, innermost first. A container is as large as the grid of what it holds.
  const inner = new Map<string, ReturnType<typeof grid>>();
  const sizes = new Map<string, { w: number; h: number }>();
  const headers = new Map<string, number>();
  const sizeOf = (b: ArchBlock): { w: number; h: number } => {
    const known = sizes.get(b.id);
    if (known) return known;
    let s: { w: number; h: number };
    if (isContainer(b)) {
      const g = grid(
        kids.get(b.id)!.map((k) => ({ id: k.id, col: colOf(k), row: rowOf(k), span: spanOf(k), ...sizeOf(k), stretch: false })),
        () => KID_COL_GAP,
        KID_ROW_GAP,
      );
      inner.set(b.id, g);
      const w = Math.max(g.w, LEAF_W) + 2 * KID_PAD;
      // A container's heading is its title and a one-liner of up to two lines.
      const header = HEADER + (wordsOf(b).some((t) => wrap(t.text, w - 24, 10.5, 2).length > 1) ? 13 : 0);
      headers.set(b.id, header);
      s = { w, h: header + g.h + KID_PAD };
    } else if (isPerson(b)) s = { w: ACTOR_W, h: summaryOf(b) ? ACTOR_H : 40 };
    else {
      // As tall as its words need: a title of one or two lines, then the longest thing it will
      // ever show beneath it, which is its one-liner or the name of a cloud service that plays it.
      const w = LEAF_W + 16 * Math.max(0, degree(b.id) - 4);
      const title = wrap(b.title, w - 22, 13.2, 2).length;
      const slots = Math.max(3, ...wordsOf(b).map((t) => title - 1 + wrap(t.text, w - 24, 10.5, 4).length + (t.build ? 1 : 0)));
      s = { w, h: Math.max(LEAF_H, 27 + Math.min(slots, 5) * 12.5 + 4) };
    }
    sizes.set(b.id, s);
    return s;
  };

  const top = a.blocks.filter((b) => !b.parent);
  const trust = top.filter((b) => ["user", "endpoint", "cloud", "vendor"].includes(ownerOf(b)));
  const external = top.filter((b) => ownerOf(b) === "external");
  const governance = top.filter((b) => ownerOf(b) === "governance").sort((x, y) => colOf(x) - colOf(y));

  // The trust row: one grid across people, our boundaries and the vendor's, so rows line up
  // across boundaries. A change of zone between two columns opens room for both outlines.
  const zoneOfCol = new Map<number, string>();
  // People and outside callers stand outside every boundary, whichever zone their block names.
  const PEOPLE = "@people";
  const standOf = (b: ArchBlock) => (isPerson(b) ? PEOPLE : b.zone ?? "");
  const outside = (z?: string) => z === PEOPLE || ownerOfZone.get(z ?? "") === "user";
  for (const b of trust) if (!zoneOfCol.has(colOf(b))) zoneOfCol.set(colOf(b), standOf(b));
  const gapBetween = (c1: number, c2: number) => {
    const z1 = zoneOfCol.get(c1);
    const z2 = zoneOfCol.get(c2);
    if (z1 === z2) return template.colGap;
    if (outside(z1) || outside(z2)) return PEOPLE_GAP + PAD_X;
    // Every flow between two boundaries is labelled in the gap between them: more flows, more room.
    const zoneOf = (id: string) => a.blocks.find((b) => b.id === id)?.zone;
    const between = a.edges.filter((e) => new Set([zoneOf(e.from), zoneOf(e.to)]).size === 2 && [z1, z2].every((z) => [zoneOf(e.from), zoneOf(e.to)].includes(z))).length;
    return ZONE_GAP + 2 * PAD_X + Math.min(54, 18 * Math.max(0, between - 2));
  };
  // A boundary is at least as wide as its own label. Where what it holds is narrower, its last
  // column is given the difference, so the label never reaches into the boundary beside it.
  const labelWidth = (z: ArchZone) => {
    const gloss = glossOf(z, a);
    return textWidth((z.title ?? z.owner).toUpperCase(), 10.5) * 1.18 + (gloss ? textWidth(gloss, 10.5) + 10 : 0) + 12;
  };
  const minColW = new Map<number, number>();
  for (const z of zones) {
    if (!["endpoint", "cloud", "vendor"].includes(z.owner)) continue;
    const cols = [...new Set(trust.filter((b) => standOf(b) === z.id).map(colOf))].sort((x, y) => x - y);
    if (!cols.length) continue;
    const natural = (c: number) => Math.max(...trust.filter((b) => colOf(b) === c).map((b) => sizeOf(b).w));
    const have = cols.reduce((sum, c) => sum + natural(c), 0) + template.colGap * (cols.length - 1) + 2 * PAD_X;
    const short = labelWidth(z) + 16 - have;
    const last = cols[cols.length - 1];
    if (short > 0) minColW.set(last, natural(last) + short);
  }
  const tg = grid(
    trust.map((b) => ({ id: b.id, col: colOf(b), row: rowOf(b), span: spanOf(b), ...sizeOf(b), stretch: false })),
    gapBetween,
    template.rowGap,
    minColW,
  );

  const rects = new Map<string, Rect>();
  const firstZone = zoneOfCol.get(Math.min(...zoneOfCol.keys()));
  // With no people at the left, the first boundary stands a little in from the edge, so a flow
  // from the band beneath can run up the outside of it instead of through what it holds.
  const originX = MARGIN + (outside(firstZone) || !trust.length ? 0 : PAD_X + 10);
  const originY = TOP + PAD_TOP;
  const place = (id: string, r: Rect, dx: number, dy: number) => {
    const abs = { x: r.x + dx, y: r.y + dy, w: r.w, h: r.h };
    rects.set(id, abs);
    const g = inner.get(id);
    if (g) for (const [kid, kr] of g.at) place(kid, kr, abs.x + (abs.w - g.w) / 2, abs.y + (headers.get(id) ?? HEADER));
  };
  for (const [id, r] of tg.at) place(id, r, originX, originY);

  // Boundaries around each zone we or a vendor run.
  const labelOf = (z: ArchZone, x: number, y: number): Rect => {
    const gloss = glossOf(z, a);
    const w = textWidth((z.title ?? z.owner).toUpperCase(), 10.5) * 1.18 + (gloss ? textWidth(gloss, 10.5) + 10 : 0);
    return { x: x + 8, y: y + 4, w: w + 12, h: 20 };
  };
  const boundaries: ViewBoundary[] = [];
  const trustBottom = originY + tg.h + PAD_BOTTOM;
  for (const z of zones) {
    if (!["endpoint", "cloud", "vendor"].includes(z.owner)) continue;
    const members = trust.filter((b) => standOf(b) === z.id).map((b) => rects.get(b.id)!);
    if (!members.length) continue;
    let x = Math.min(...members.map((r) => r.x)) - PAD_X;
    let right = Math.max(...members.map((r) => r.x + r.w)) + PAD_X;
    // Wider than what it holds only to fit its label, and then evenly on both sides.
    const need = labelWidth(z) + 16;
    const stretched = Math.max(0, need - (right - x));
    if (right - x < need) {
      const extra = (need - (right - x)) / 2;
      x -= extra;
      right += extra;
    }
    // Every boundary hugs what it holds, so no outline encloses an empty row.
    const y = Math.min(...members.map((r) => r.y)) - PAD_TOP;
    const bottom = Math.max(...members.map((r) => r.y + r.h)) + PAD_BOTTOM;
    const title = z.title ?? z.owner;
    const label = labelOf(z, x, y);
    boundaries.push({
      zone: z.id,
      owner: z.owner,
      title,
      gloss: glossOf(z, a),
      x,
      y,
      w: right - x,
      h: bottom - y,
      stretched,
      tone: z.owner === "vendor" ? "vendor" : "ours",
      primary: z.owner === template.primary,
      label,
    });
  }

  const trustLeft = boundaries.length ? Math.min(...boundaries.map((b) => b.x)) : MARGIN;
  const trustRight = Math.max(MARGIN + 400, ...boundaries.map((b) => b.x + b.w), ...[...rects.values()].map((r) => r.x + r.w));

  // The external band: each party sits under the middle of whatever reaches it.
  let cursorY = trustBottom;
  const centre = (id: string) => {
    const r = rects.get(id);
    return r ? r.x + r.w / 2 : undefined;
  };
  if (external.length) {
    const zone = zones.find((z) => z.owner === "external")!;
    const neighbours = (id: string) =>
      a.edges.flatMap((e) => (e.from === id ? [e.to] : e.to === id ? [e.from] : [])).map(centre).filter((v): v is number => v !== undefined);
    const depthOf = (id: string) =>
      Math.max(0, ...a.edges.flatMap((e) => (e.from === id ? [e.to] : e.to === id ? [e.from] : [])).map((n) => { const r = rects.get(n); return r ? r.y + r.h : 0; }));
    const wanted = external
      .map((b) => {
        const ns = neighbours(b.id);
        return { b, s: sizeOf(b), want: ns.length ? ns.reduce((s, v) => s + v, 0) / ns.length : Number.POSITIVE_INFINITY, depth: depthOf(b.id) };
      })
      // Of two parties that want the same spot, the one whose target is further up stands to
      // the outside, where it can run up beside the boundary; the nearer one goes straight in.
      .sort((p, q) => p.want - q.want || p.depth - q.depth || rowOf(p.b) - rowOf(q.b) || colOf(p.b) - colOf(q.b));
    const bandX = trustLeft;
    const xs: number[] = [];
    let cursor = bandX + PAD_X;
    for (const p of wanted) {
      const x = Math.max(cursor, Number.isFinite(p.want) ? p.want - p.s.w / 2 : cursor);
      xs.push(x);
      cursor = x + p.s.w + EXT_BOX_GAP;
    }
    // Pull back anything pushed past the trust row's right edge, as far as its neighbours allow.
    let limit = Math.max(trustRight, bandX + PAD_X + wanted.reduce((s, p) => s + p.s.w + EXT_BOX_GAP, 0)) - PAD_X;
    for (let i = wanted.length - 1; i >= 0; i--) {
      xs[i] = Math.min(xs[i], limit - wanted[i].s.w);
      limit = xs[i] - EXT_BOX_GAP;
    }
    const bandY = trustBottom + template.externalGap;
    const boxH = Math.max(...wanted.map((p) => p.s.h));
    wanted.forEach((p, i) => place(p.b.id, { x: xs[i], y: bandY + PAD_TOP + (boxH - p.s.h) / 2, w: p.s.w, h: p.s.h }, 0, 0));
    const right = Math.max(trustRight, xs[xs.length - 1] + wanted[wanted.length - 1].s.w + PAD_X);
    boundaries.push({
      zone: zone.id,
      owner: "external",
      title: zone.title ?? "External",
      gloss: glossOf(zone, a),
      x: bandX,
      y: bandY,
      w: right - bandX,
      h: PAD_TOP + boxH + PAD_BOTTOM,
      tone: "outside",
      primary: false,
      label: labelOf(zone, bandX, bandY),
    });
    cursorY = bandY + PAD_TOP + boxH + PAD_BOTTOM;
  }

  const contentRight = Math.max(trustRight, ...boundaries.map((b) => b.x + b.w), ...[...rects.values()].map((r) => r.x + r.w));
  const width = contentRight + MARGIN;

  // The control plane: one band beneath everything, its boxes holding the chips they own.
  const boxes: ViewBox[] = [];
  let height = cursorY + MARGIN;
  if (governance.length) {
    const zone = zones.find((z) => z.owner === "governance")!;
    const bandX = MARGIN - 10;
    const bandW = width - 2 * (MARGIN - 10);
    const gap = 16;
    const boxW = Math.min(250, (bandW - 2 * 18 - gap * (governance.length - 1)) / governance.length);
    const perRow = Math.max(1, Math.floor((boxW - 22) / CHIP_PITCH));
    const rowsOf = (b: ArchBlock) => Math.max(1, Math.ceil(Math.max(ownedControls(a, b).length, a.pins.risks.filter((p) => p.at === b.id).length * 1.5) / perRow));
    const chipRows = Math.max(...governance.map(rowsOf));
    // Room for a title, a one-liner of up to two lines, then the chips the box owns.
    // Each box is a title of one or two lines, a one-liner of up to two, then the chips it owns.
    // The chips start below the tallest text in the band, so every row of chips lines up.
    const textH = Math.max(
      ...governance.map((b) => {
        const sub = summaryOf(b);
        return 20 + (wrap(b.title, boxW - 22, 13.2, 2).length - 1) * 14 + (sub ? wrap(sub, boxW - 24, 10.5, 3).length * 12.5 + 3 : 0);
      }),
    );
    const chipTop = textH + 19;
    const boxH = chipTop + (chipRows - 1) * 21 + 17;
    const bandY = cursorY + GOV_GAP;
    const total = governance.length * boxW + gap * (governance.length - 1);
    const startX = bandX + (bandW - total) / 2;
    governance.forEach((b, i) => rects.set(b.id, { x: startX + i * (boxW + gap), y: bandY + 32, w: boxW, h: boxH }));
    boundaries.push({
      zone: zone.id,
      owner: "governance",
      title: zone.title ?? "Control plane",
      gloss: glossOf(zone, a),
      x: bandX,
      y: bandY,
      w: bandW,
      h: 32 + boxH + 16,
      tone: "control",
      primary: false,
      label: labelOf(zone, bandX, bandY),
    });
    height = bandY + 32 + boxH + 16 + MARGIN - 10;
    for (const b of governance) boxes.push({ id: b.id, ...rects.get(b.id)!, tone: "governance", lines: 3, chipRows, chipTop });
  }

  for (const b of a.blocks) {
    if (ownerOf(b) === "governance" && !b.parent) continue;
    const r = rects.get(b.id);
    if (!r) continue;
    const tone: BoxTone = isContainer(b) ? "container" : isPerson(b) ? "actor" : "plain";
    const header = headers.get(b.id) ?? HEADER;
    boxes.push({ id: b.id, ...r, tone, lines: tone === "container" ? (header > HEADER ? 2 : 1) : Math.max(1, Math.floor((r.h - 27) / 12.5)), chipRows: 0, header: tone === "container" ? header : undefined });
  }

  // Arrows are routed before their words are placed, so an arrow can end up across another's
  // label. Route again with the labels as ground to avoid, and keep the result if it is cleaner.
  let routed = route(a, boxes, boundaries, width, height);
  for (let pass = 0; pass < 2; pass++) {
    const before = wordsCrossed(routed);
    if (!before) break;
    const again = route(a, boxes, boundaries, width, height, routed.flatMap((l) => { const r = labelRect(l); return r ? [{ key: l.key, r }] : []; }));
    if (wordsCrossed(again) >= before) break;
    routed = again;
  }
  return { width, height, boundaries, boxes, lines: routed };
}

/** A boundary's gloss: the pattern's own words, else what its owner implies where that is certain. */
function glossOf(z: ArchZone, a: Archetype): string | undefined {
  const ours = z.owner === "endpoint" || z.owner === "cloud";
  // The pattern's own words stand alone: the outline's colour already says whose it is.
  if (z.gloss) return z.gloss;
  if (ours) return "ours";
  if (z.owner === "vendor") return "vendor-run, under agreement";
  if (z.owner === "governance") return "ours · applies across every boundary";
  if (z.owner === "external") {
    // Only "no agreement" where that is true of everything in it: a provider is reached under contract.
    const contracted = a.blocks.some((b) => b.zone === z.id && b.kind === "provider");
    return contracted ? undefined : "outside, no agreement";
  }
  return undefined;
}

/** The space a line's label takes on the drawing. */
export function labelRect(l: ViewLine): Rect | null {
  if (!l.label) return null;
  const w = Math.max(...l.label.lines.map((t) => textWidth(t, 10)));
  const h = l.label.lines.length * 12;
  const x = l.label.anchor === "middle" ? l.label.x - w / 2 : l.label.anchor === "end" ? l.label.x - w : l.label.x;
  return { x, y: l.label.y - 9, w, h };
}

/** How many times an arrow runs across the words of another. */
function wordsCrossed(lines: ViewLine[]): number {
  let n = 0;
  for (const l of lines) {
    const r = labelRect(l);
    if (!r) continue;
    for (const o of lines) {
      if (o.key === l.key) continue;
      for (let i = 1; i < o.pts.length; i++) {
        const p = o.pts[i - 1];
        const q = o.pts[i];
        if (Math.min(p[0], q[0]) < r.x + r.w - 3 && Math.max(p[0], q[0]) > r.x + 3 && Math.min(p[1], q[1]) < r.y + r.h - 2 && Math.max(p[1], q[1]) > r.y + 2) n++;
      }
    }
  }
  return n;
}

function route(a: Archetype, boxes: ViewBox[], boundaries: ViewBoundary[], width: number, height: number, avoid: { key: string; r: Rect }[] = []): ViewLine[] {
  const box = new Map(boxes.map((b) => [b.id, b]));
  const control = boundaries.find((b) => b.tone === "control");
  const floor = control ? control.y - 8 : height - 8;

  // What an arrow may not run through: every leaf box, a container's heading, a boundary's label.
  const obstacles: Obstacle[] = [];
  for (const b of boxes) {
    if (b.tone === "governance") continue;
    if (b.tone === "container") obstacles.push({ x: b.x, y: b.y, w: b.w, h: (b.header ?? HEADER) - 8, box: b.id });
    else obstacles.push({ x: b.x, y: b.y, w: b.w, h: b.h, box: b.id });
  }
  for (const b of boundaries) if (b.tone !== "control") obstacles.push(b.label);

  // Tracks: beside every box and boundary, through every port, and a ring round the outside.
  const xs: { v: number; kind: LineKind }[] = [{ v: 12, kind: "soft" }, { v: width - 12, kind: "soft" }];
  const ys: { v: number; kind: LineKind }[] = [{ v: 18, kind: "soft" }, { v: 38, kind: "soft" }, { v: floor, kind: "soft" }];
  for (const b of boxes) {
    if (b.tone === "governance") continue;
    for (const [list, lo, len] of [[xs, b.x, b.w], [ys, b.y, b.h]] as const) {
      list.push({ v: lo, kind: "edge" }, { v: lo + len, kind: "edge" });
      for (const t of [T1, T2]) list.push({ v: lo - t, kind: "soft" }, { v: lo + len + t, kind: "soft" });
      for (const f of portFractions(len)) list.push({ v: lo + len * f, kind: "port" });
    }
  }
  for (const b of boundaries) {
    if (b.tone === "control") continue;
    xs.push({ v: b.x - 22, kind: "soft" }, { v: b.x + b.w + 22, kind: "soft" });
    ys.push({ v: b.y - 22, kind: "soft" }, { v: b.y + b.h + 22, kind: "soft" });
  }
  const gx = gridLines(xs, 8, width - 8);
  const gy = gridLines(ys, 10, floor);
  const X = gx.at;
  const Y = gy.at;

  // Outlines an arrow may cross but never run along: a container's edge, a boundary's edge.
  // A boundary's outline keeps arrows further off than a container's: beside it they read as a second border.
  const rails: { vertical: boolean; at: number; lo: number; hi: number; off: number }[] = [];
  const rail = (r: Rect, off: number) => {
    rails.push({ vertical: true, at: r.x, lo: r.y, hi: r.y + r.h, off }, { vertical: true, at: r.x + r.w, lo: r.y, hi: r.y + r.h, off });
    rails.push({ vertical: false, at: r.y, lo: r.x, hi: r.x + r.w, off }, { vertical: false, at: r.y + r.h, lo: r.x, hi: r.x + r.w, off });
  };
  for (const b of boxes) if (b.tone === "container") rail(b, 7);
  for (const b of boundaries) if (b.tone !== "control") rail(b, 15);
  const onRail = (x1: number, y1: number, x2: number, y2: number) =>
    rails.some((r) =>
      r.vertical ? x1 === x2 && Math.abs(x1 - r.at) < r.off && Math.min(y2, r.hi) - Math.max(y1, r.lo) > 0 : y1 === y2 && Math.abs(y1 - r.at) < r.off && Math.min(x2, r.hi) - Math.max(x1, r.lo) > 0,
    );
  const NX = X.length;
  const NY = Y.length;
  const xi = new Map(X.map((v, i) => [v, i]));
  const yi = new Map(Y.map((v, i) => [v, i]));

  // For each step between neighbouring grid points, the obstacles it would run through.
  const NONE: number[] = [];
  const hitsOf = (x1: number, y1: number, x2: number, y2: number): number[] => {
    let out = NONE;
    obstacles.forEach((o, k) => {
      const m = 8;
      const hit =
        y1 === y2
          ? y1 > o.y - m && y1 < o.y + o.h + m && Math.min(x2, o.x + o.w + m) - Math.max(x1, o.x - m) > 0
          : x1 > o.x - m && x1 < o.x + o.w + m && Math.min(y2, o.y + o.h + m) - Math.max(y1, o.y - m) > 0;
      if (hit) out = out === NONE ? [k] : [...out, k];
    });
    return out;
  };
  // How close a step runs to the nearest box or heading beside it: close runs cost more, so
  // arrows keep to the middle of a gutter and leave room for their words.
  const crowding = (x1: number, y1: number, x2: number, y2: number) => {
    let near = Infinity;
    for (const o of obstacles) {
      if (y1 === y2) {
        if (Math.min(x2, o.x + o.w) - Math.max(x1, o.x) <= 0) continue;
        near = Math.min(near, y1 <= o.y ? o.y - y1 : y1 >= o.y + o.h ? y1 - o.y - o.h : 0);
      } else {
        if (Math.min(y2, o.y + o.h) - Math.max(y1, o.y) <= 0) continue;
        near = Math.min(near, x1 <= o.x ? o.x - x1 : x1 >= o.x + o.w ? x1 - o.x - o.w : 0);
      }
    }
    return near < 16 ? 0.7 : near < 26 ? 0.3 : 0;
  };
  // Words already placed by an earlier pass: the steps that would run across each.
  const wordsOf = (x1: number, y1: number, x2: number, y2: number): number[] => {
    let out = NONE;
    avoid.forEach(({ r }, k) => {
      const hit =
        y1 === y2
          ? y1 > r.y - 2 && y1 < r.y + r.h + 2 && Math.min(x2, r.x + r.w) - Math.max(x1, r.x) > 0
          : x1 > r.x - 2 && x1 < r.x + r.w + 2 && Math.min(y2, r.y + r.h) - Math.max(y1, r.y) > 0;
      if (hit) out = out === NONE ? [k] : [...out, k];
    });
    return out;
  };
  const hWords: number[][] = new Array(NX * NY).fill(NONE);
  const vWords: number[][] = new Array(NX * NY).fill(NONE);
  const hHits: number[][] = new Array(NX * NY);
  const vHits: number[][] = new Array(NX * NY);
  const hCrowd = new Float32Array(NX * NY);
  const vCrowd = new Float32Array(NX * NY);
  for (let i = 0; i < NX; i++)
    for (let j = 0; j < NY; j++) {
      // -1 marks a step that runs along an outline: closed to every arrow.
      hHits[i * NY + j] = i + 1 < NX ? (onRail(X[i], Y[j], X[i + 1], Y[j]) ? [-1] : hitsOf(X[i], Y[j], X[i + 1], Y[j])) : NONE;
      vHits[i * NY + j] = j + 1 < NY ? (onRail(X[i], Y[j], X[i], Y[j + 1]) ? [-1] : hitsOf(X[i], Y[j], X[i], Y[j + 1])) : NONE;
      if (avoid.length && i + 1 < NX) hWords[i * NY + j] = wordsOf(X[i], Y[j], X[i + 1], Y[j]);
      if (avoid.length && j + 1 < NY) vWords[i * NY + j] = wordsOf(X[i], Y[j], X[i], Y[j + 1]);
      if (i + 1 < NX) hCrowd[i * NY + j] = crowding(X[i], Y[j], X[i + 1], Y[j]);
      if (j + 1 < NY) vCrowd[i * NY + j] = crowding(X[i], Y[j], X[i], Y[j + 1]);
    }

  // A box takes an arrow wherever a track meets one of its sides, clear of the corners. The
  // middle of a side is preferred, then its thirds; anywhere else costs a little, which is
  // still cheaper than a jog, so two boxes that face each other are joined by a straight line.
  const portsOf = (b: ViewBox): Port[] => {
    const out: Port[] = [];
    const bias = (v: number, lo: number, len: number) => {
      const f = (v - lo) / len;
      const d = Math.min(...portFractions(len).map((p, n) => Math.abs(p - f) * len + (n ? 6 : 0)));
      return d < 2 ? d : 12 + Math.abs(f - 0.5) * 8;
    };
    const left = xi.get(b.x);
    const right = xi.get(b.x + b.w);
    const top = yi.get(b.y);
    const bottom = yi.get(b.y + b.h);
    Y.forEach((y, j) => {
      if (y < b.y + 12 || y > b.y + b.h - 12) return;
      const c = bias(y, b.y, b.h);
      if (left !== undefined) out.push({ i: left, j, cost: c, key: `${b.id}:l:${j}` });
      if (right !== undefined) out.push({ i: right, j, cost: c, key: `${b.id}:r:${j}` });
    });
    X.forEach((x, i) => {
      if (x < b.x + 14 || x > b.x + b.w - 14) return;
      const c = bias(x, b.x, b.w);
      if (top !== undefined) out.push({ i, j: top, cost: c, key: `${b.id}:t:${i}` });
      if (bottom !== undefined) out.push({ i, j: bottom, cost: c, key: `${b.id}:b:${i}` });
    });
    return out;
  };

  // Which container's body each step runs through, if any: an arrow that has no business in a
  // container goes round it when it reasonably can.
  const containers = boxes.filter((b) => b.tone === "container").sort((p, q) => p.w * p.h - q.w * q.h);
  const bodyOf = (x: number, y: number) => containers.findIndex((c) => x > c.x && x < c.x + c.w && y > c.y && y < c.y + c.h);
  const hBody = new Int16Array(NX * NY).fill(-1);
  const vBody = new Int16Array(NX * NY).fill(-1);
  for (let i = 0; i < NX; i++)
    for (let j = 0; j < NY; j++) {
      if (i + 1 < NX) hBody[i * NY + j] = bodyOf((X[i] + X[i + 1]) / 2, Y[j]);
      if (j + 1 < NY) vBody[i * NY + j] = bodyOf(X[i], (Y[j] + Y[j + 1]) / 2);
    }
  // Which trust boundary each step runs inside, if any: a flow keeps out of a boundary neither
  // of its ends is in, and goes over or round it instead.
  const fences = boundaries.filter((b) => b.tone !== "control");
  const fenceOf = (x: number, y: number) => fences.findIndex((f) => x > f.x && x < f.x + f.w && y > f.y && y < f.y + f.h);
  const hFence = new Int16Array(NX * NY).fill(-1);
  const vFence = new Int16Array(NX * NY).fill(-1);
  for (let i = 0; i < NX; i++)
    for (let j = 0; j < NY; j++) {
      if (i + 1 < NX) hFence[i * NY + j] = fenceOf((X[i] + X[i + 1]) / 2, Y[j]);
      if (j + 1 < NY) vFence[i * NY + j] = fenceOf(X[i], (Y[j] + Y[j + 1]) / 2);
    }
  const zoneOfBlock = new Map(a.blocks.map((b) => [b.id, b.zone ?? ""]));
  const parentOf = new Map(a.blocks.map((b) => [b.id, b.parent]));
  const lineage = (id: string) => {
    const out = new Set<number>();
    for (let p: string | undefined = id; p; p = parentOf.get(p)) {
      const k = containers.findIndex((c) => c.id === p);
      if (k >= 0) out.add(k);
    }
    return out;
  };

  const usedH = new Set<number>();
  const usedV = new Set<number>();
  const usedPorts = new Map<string, number>();
  const DI = [1, -1, 0, 0];
  const DJ = [0, 0, 1, -1];

  const edges = a.edges
    .map((e) => ({ e, from: box.get(e.from), to: box.get(e.to) }))
    .filter((x): x is { e: (typeof a.edges)[number]; from: ViewBox; to: ViewBox } => Boolean(x.from && x.to));
  const span = (x: { from: ViewBox; to: ViewBox }) =>
    Math.abs(x.from.x + x.from.w / 2 - x.to.x - x.to.w / 2) + Math.abs(x.from.y + x.from.h / 2 - x.to.y - x.to.h / 2);
  const order = [...edges].sort((p, q) => span(p) - span(q));

  const paths = new Map<string, Pt[]>();
  for (const { e, from, to } of order) {
    const ends = [from, to];
    const own = new Set(obstacles.flatMap((o, k) => (o.box === from.id || o.box === to.id ? [k] : [])));
    const edgeKey = keyOf(e);
    const home = new Set([...lineage(from.id), ...lineage(to.id)]);
    const homeFences = new Set(fences.flatMap((f, k) => (f.zone === zoneOfBlock.get(from.id) || f.zone === zoneOfBlock.get(to.id) ? [k] : [])));
    // An arrow touches its own ends at one point only: it may not run along them or through them.
    const grazes = (x1: number, y1: number, x2: number, y2: number) =>
      ends.some((r) =>
        y1 === y2
          ? y1 >= r.y && y1 <= r.y + r.h && Math.min(x2, r.x + r.w) - Math.max(x1, r.x) > 0
          : x1 >= r.x && x1 <= r.x + r.w && Math.min(y2, r.y + r.h) - Math.max(y1, r.y) > 0,
      );
    const open = (i: number, j: number, d: number) => {
      const ni = i + DI[d];
      const nj = j + DJ[d];
      if (ni < 0 || nj < 0 || ni >= NX || nj >= NY) return false;
      const a0 = d === 0 ? i : d === 1 ? ni : i;
      const b0 = d === 2 ? j : d === 3 ? nj : j;
      const hits = d < 2 ? hHits[a0 * NY + b0] : vHits[a0 * NY + b0];
      for (const k of hits) if (!own.has(k)) return false;
      return d < 2 ? !grazes(X[a0], Y[b0], X[a0 + 1], Y[b0]) : !grazes(X[a0], Y[b0], X[a0], Y[b0 + 1]);
    };

    const starts = portsOf(from);
    const goals = new Map(portsOf(to).map((p) => [p.i * NY + p.j, p]));
    const dist = new Float64Array(NX * NY * 4).fill(Infinity);
    const prev = new Int32Array(NX * NY * 4).fill(-1);
    const heap = new Heap();
    for (const p of starts) {
      for (let d = 0; d < 4; d++) {
        if (!open(p.i, p.j, d)) continue;
        const s = (p.i * NY + p.j) * 4 + d;
        const c = p.cost + (usedPorts.get(p.key) ?? 0) * 260;
        if (c < dist[s]) {
          dist[s] = c;
          heap.push([c, s]);
        }
      }
    }
    let end = -1;
    let goalAt = -1;
    let best = Infinity;
    while (heap.size) {
      const [c, s] = heap.pop();
      if (c > dist[s]) continue;
      if (c >= best) break;
      const node = s >> 2;
      const d = s & 3;
      const i = Math.floor(node / NY);
      const j = node % NY;
      // The state means "at node, about to leave in direction d".
      if (!open(i, j, d)) continue;
      const ni = i + DI[d];
      const nj = j + DJ[d];
      const nn = ni * NY + nj;
      const segKey = d === 0 ? node : d === 1 ? nn : d === 2 ? node : nn;
      const length = d < 2 ? Math.abs(X[ni] - X[i]) : Math.abs(Y[nj] - Y[j]);
      const shared = (d < 2 ? usedH : usedV).has(segKey);
      const crossing = (d < 2 ? usedV : usedH).has(nn) || (d < 2 ? nj > 0 && usedV.has(nn - 1) : ni > 0 && usedH.has(nn - NY));
      const body = (d < 2 ? hBody : vBody)[segKey];
      const fence = (d < 2 ? hFence : vFence)[segKey];
      const foreign = (body >= 0 && !home.has(body) ? 1.6 : 0) + (fence >= 0 && !homeFences.has(fence) ? FOREIGN_ZONE : 0);
      const words = (d < 2 ? hWords : vWords)[segKey].some((k) => avoid[k].key !== edgeKey) ? WORDS : 0;
      const step = c + length * (1 + (d < 2 ? hCrowd : vCrowd)[segKey] + foreign) + (shared ? 90 + length * 5 : 0) + (crossing ? CROSS : 0) + words;
      const goal = goals.get(nn);
      if (goal) {
        const total = step + goal.cost + (usedPorts.get(goal.key) ?? 0) * 260;
        if (total < best) {
          best = total;
          end = s;
          goalAt = nn;
        }
        continue;
      }
      for (let nd = 0; nd < 4; nd++) {
        if (nd === (d ^ 1)) continue;
        const ns = nn * 4 + nd;
        const cost = step + (nd === d ? 0 : BEND);
        if (cost < dist[ns]) {
          dist[ns] = cost;
          prev[ns] = s;
          heap.push([cost, ns]);
        }
      }
    }

    let pts: Pt[];
    if (end >= 0) {
      const nodes: number[] = [goalAt];
      for (let s = end; s >= 0; s = prev[s]) nodes.push(s >> 2);
      nodes.reverse();
      const startPort = starts.find((p) => p.i * NY + p.j === nodes[0]);
      const goalPort = goals.get(goalAt);
      if (startPort) usedPorts.set(startPort.key, (usedPorts.get(startPort.key) ?? 0) + 1);
      if (goalPort) usedPorts.set(goalPort.key, (usedPorts.get(goalPort.key) ?? 0) + 1);
      for (let n = 1; n < nodes.length; n++) {
        const p = nodes[n - 1];
        const q = nodes[n];
        if (Math.abs(p - q) >= NY) usedH.add(Math.min(p, q));
        else usedV.add(Math.min(p, q));
      }
      pts = nodes.map((n) => [X[Math.floor(n / NY)], Y[n % NY]] as Pt);
    } else {
      // No clear route (it should not happen): a plain elbow, so the edge is still drawn.
      const p: Pt = [from.x + from.w / 2, from.y + from.h / 2];
      const q: Pt = [to.x + to.w / 2, to.y + to.h / 2];
      pts = [p, [q[0], p[1]], q];
    }
    paths.set(keyOf(e), simplify(pts));
  }

  return label(a, paths, boxes, boundaries, width, control);
}

/** Drop the points a straight run does not need. */
function simplify(pts: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (const p of pts) {
    const n = out.length;
    if (n >= 2 && ((out[n - 2][0] === out[n - 1][0] && out[n - 1][0] === p[0]) || (out[n - 2][1] === out[n - 1][1] && out[n - 1][1] === p[1]))) out[n - 1] = p;
    else if (!n || out[n - 1][0] !== p[0] || out[n - 1][1] !== p[1]) out.push(p);
  }
  return out;
}

const overlap = (p: Rect, q: Rect) => Math.max(0, Math.min(p.x + p.w, q.x + q.w) - Math.max(p.x, q.x)) * Math.max(0, Math.min(p.y + p.h, q.y + q.h) - Math.max(p.y, q.y));

/** Give every arrow its pin point and its words, clear of boxes, headings and each other. */
function label(a: Archetype, paths: Map<string, Pt[]>, boxes: ViewBox[], boundaries: ViewBoundary[], width: number, control?: ViewBoundary): ViewLine[] {
  const solid: Rect[] = [
    ...boxes.filter((b) => b.tone !== "container").map((b) => ({ x: b.x - 2, y: b.y - 2, w: b.w + 4, h: b.h + 4 })),
    ...boxes.filter((b) => b.tone === "container").map((b) => ({ x: b.x, y: b.y, w: b.w, h: (b.header ?? HEADER) - 6 })),
    ...boundaries.filter((b) => b.tone !== "control").map((b) => b.label),
    ...(control ? [control as Rect] : []),
  ];
  const segments = (pts: Pt[]) => pts.slice(1).map((q, i) => ({ p: pts[i], q, len: Math.abs(q[0] - pts[i][0]) + Math.abs(q[1] - pts[i][1]), horizontal: q[1] === pts[i][1] }));
  // A boundary's outline counts as a stroke nobody owns: words do not sit on it.
  const strokes: { key: string; r: Rect }[] = boundaries.flatMap((b) => [
    { key: "", r: { x: b.x - 2, y: b.y - 2, w: 4, h: b.h + 4 } },
    { key: "", r: { x: b.x + b.w - 2, y: b.y - 2, w: 4, h: b.h + 4 } },
    { key: "", r: { x: b.x - 2, y: b.y - 2, w: b.w + 4, h: 4 } },
    { key: "", r: { x: b.x - 2, y: b.y + b.h - 2, w: b.w + 4, h: 4 } },
  ]);
  for (const b of boxes)
    if (b.tone === "container")
      strokes.push(
        { key: "", r: { x: b.x - 2, y: b.y, w: 4, h: b.h } },
        { key: "", r: { x: b.x + b.w - 2, y: b.y, w: 4, h: b.h } },
        { key: "", r: { x: b.x, y: b.y + b.h - 2, w: b.w, h: 4 } },
      );
  for (const [key, pts] of paths)
    for (const s of segments(pts))
      strokes.push({ key, r: { x: Math.min(s.p[0], s.q[0]) - 2, y: Math.min(s.p[1], s.q[1]) - 2, w: Math.abs(s.q[0] - s.p[0]) + 4, h: Math.abs(s.q[1] - s.p[1]) + 4 } });

  // Pin points first: the middle of each arrow's longest run, so labels can keep clear of them.
  // On the longest runs, at the spot least crossed by other arrows and furthest from a box.
  const pins = new Map<string, ViewLine["pin"]>();
  for (const [key, pts] of paths) {
    let best: { score: number; pin: ViewLine["pin"] } | null = null;
    segments(pts)
      .sort((x, y) => y.len - x.len)
      .slice(0, 3)
      .forEach((sg, rank) => {
        if (rank && sg.len < 44) return;
        for (const f of [0.5, 0.36, 0.64, 0.24, 0.76]) {
          const x = sg.p[0] + (sg.q[0] - sg.p[0]) * f;
          const y = sg.p[1] + (sg.q[1] - sg.p[1]) * f;
          const r = sg.horizontal ? { x: x - 22, y: y - 11, w: 44, h: 22 } : { x: x - 11, y: y - 22, w: 22, h: 44 };
          let score = rank * 40 + Math.abs(f - 0.5) * 30;
          for (const st of strokes) if (st.key !== key) score += overlap(r, st.r) * 3;
          for (const so of solid) score += overlap(r, so) * 3;
          if (!best || score < best.score) best = { score, pin: { x, y, horizontal: sg.horizontal, room: sg.len } };
        }
      });
    const chosen = best as { score: number; pin: ViewLine["pin"] } | null;
    pins.set(key, chosen?.pin ?? { x: pts[0][0], y: pts[0][1], horizontal: true, room: 0 });
  }
  // A flow that some platform marks as different carries one more mark there, so its words keep further off.
  const marked = new Set(
    clouds.flatMap((c) => (c.implementations.find((i) => i.architecture === a.id)?.differences ?? []).flatMap((d) => (d.at.includes("->") ? [d.at, d.at.split("->").reverse().join("->")] : []))),
  );
  const pinRects = [...pins].map(([key, p]) => {
    const more = marked.has(key) ? 20 : 0;
    return { key, r: p.horizontal ? { x: p.x - 30 - more / 2, y: p.y - 10, w: 60 + more, h: 20 } : { x: p.x - 14 - more / 2, y: p.y - 26 - more / 2, w: 28 + more, h: 52 + more } };
  });

  const placed: Rect[] = [];
  const out: ViewLine[] = [];
  const edgeByKey = new Map(a.edges.map((e) => [keyOf(e), e]));
  // Longest labels first: they have the fewest places to go.
  const keys = [...paths.keys()].sort((x, y) => (edgeByKey.get(y)?.label?.length ?? 0) - (edgeByKey.get(x)?.label?.length ?? 0));
  const labels = new Map<string, ViewLabel>();
  for (const key of keys) {
    const text = edgeByKey.get(key)?.label;
    if (!text) continue;
    const pts = paths.get(key)!;
    let best: { score: number; label: ViewLabel; rect: Rect } | null = null;
    const consider = (lab: ViewLabel, rect: Rect, bias: number) => {
      let score = bias;
      // Words stay on the canvas: off its edge they are cut.
      const off = Math.max(0, 6 - rect.x) + Math.max(0, rect.x + rect.w - (width - 6));
      if (off) score += 400 + off * 20;
      for (const r of solid) score += overlap(rect, r) * 4;
      for (const r of placed) score += overlap(rect, r) * 4;
      for (const s of strokes) score += overlap(rect, s.r) * 2;
      for (const p of pinRects) score += overlap(rect, p.r) * (p.key === key ? 1 : 3);
      if (!best || score < best.score) best = { score, label: lab, rect };
    };
    segments(pts)
      .filter((s) => s.len >= 26)
      .sort((x, y) => y.len - x.len)
      .slice(0, 5)
      .forEach((s, rank) => {
        const cx = s.p[0];
        const cy = s.p[1];
        if (s.horizontal) {
          const lines = wrap(text, Math.min(160, Math.max(72, s.len - 8)), 10, 3);
          const w = Math.max(...lines.map((l) => textWidth(l, 10)));
          const h = lines.length * 12;
          for (const f of [0.5, 0.34, 0.66, 0.18, 0.82]) {
            const x = Math.min(s.p[0], s.q[0]) + s.len * f;
            const off = Math.abs(f - 0.5) * 24;
            consider({ x, y: cy - 12 - (lines.length - 1) * 12, anchor: "middle", lines }, { x: x - w / 2 - 2, y: cy - 10 - h, w: w + 4, h }, rank * 6 + off);
            consider({ x, y: cy + 21, anchor: "middle", lines }, { x: x - w / 2 - 2, y: cy + 11, w: w + 4, h }, rank * 6 + off + 5);
          }
        } else {
          const lines = wrap(text, 108, 10, 3);
          const w = Math.max(...lines.map((l) => textWidth(l, 10)));
          const h = lines.length * 12;
          for (const f of [0.5, 0.34, 0.66, 0.18, 0.82]) {
            const y = Math.min(s.p[1], s.q[1]) + s.len * f;
            const first = y - h / 2 + 9;
            const off = Math.abs(f - 0.5) * 24;
            consider({ x: cx + 13, y: first, anchor: "start", lines }, { x: cx + 11, y: y - h / 2, w: w + 4, h }, rank * 6 + off);
            consider({ x: cx - 13, y: first, anchor: "end", lines }, { x: cx - 15 - w, y: y - h / 2, w: w + 4, h }, rank * 6 + off + 5);
          }
        }
      });
    const chosen = best as { score: number; label: ViewLabel; rect: Rect } | null;
    if (chosen) {
      labels.set(key, chosen.label);
      placed.push(chosen.rect);
    }
  }
  for (const e of a.edges) {
    const key = keyOf(e);
    const pts = paths.get(key);
    if (!pts) continue;
    out.push({ key, pts, label: labels.get(key), pin: pins.get(key)! });
  }
  return out;
}
