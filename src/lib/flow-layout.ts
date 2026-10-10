/**
 * Build-time geometry for the flow-style reference architectures.
 *
 * The grammar is F5's: mitigation blocks on a coarse authored grid, connected by orthogonal
 * typed paths. Authors place blocks with `col`/`row` and the build turns that into pixels —
 * the same geometry-as-data discipline as map-layout.ts, so the client renders coordinates
 * and never runs a layout algorithm.
 *
 * The router is deliberately simple: straight where the two blocks face each other, one bend
 * otherwise. F5's diagrams stay readable because the grid is curated so flows do not cross,
 * not because the router is clever — the same is expected of authors here.
 */
import type { ArchBlock, Archetype, ArchLayout, Rect } from "./types";

/** The icon vocabulary FlowDiagram can draw. The build rejects anything else. */
export const ICON_NAMES = [
  "person",
  "people",
  "agent",
  "model",
  "chat",
  "clock",
  "folder",
  "db",
  "key",
  "shield",
  "plug",
  "code",
  "globe",
  "doc",
  "gear",
  "phone",
  "search",
  "mail",
  "scale",
  "eye",
  "stop",
] as const;

// Gaps are sized for what actually has to fit in them — an orthogonal edge run and its label —
// not for visual breathing room. Generous gaps pushed connected blocks far apart and left the
// mean canvas 85% empty, which is the opposite of legible: a reader wants the whole
// architecture in one glance, with short arrows between things that talk to each other.
/** Wide enough for a 24-character title tab at 10.5px, and two 11px item labels side by side. */
const COL_W = 188;
const COL_GAP = 44;
/**
 * Tall enough for a vertical run carrying three stacked risk tags to clear the tab below it,
 * and — since an arrow into a block's top now stops at its tab, 11px short of the border — for
 * two chips on that run to clear the arrowheads at both ends.
 */
const ROW_GAP = 73;
const MARGIN_X = 18;
/** Room above the first row for tabs and risk-tag stacks; grown further when a stack is deep. */
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 32;

export const TAB_H = 20;
/**
 * The title tab as the renderer draws it: centred on the block's top border from 11px above
 * it, 10.5px IBM Plex Mono caps (0.6em advance) with 0.08em tracking and 10px padding each side.
 * It draws above the arrows, so an arrow meeting the top border under it loses its arrowhead.
 */
const TAB_TOP = 11;
/**
 * A tab that would not leave 12px of border at each top corner sets tight — no tracking, 6px
 * padding — rather than overhang its block and hide the corners. The renderer reads the same.
 */
export function tabStyle(title: string, blockW: number): { letterSpacing: string; padX: number; width: number } {
  const loose = title.length * 7.2 + 20;
  if (loose <= blockW - 24) return { letterSpacing: "0.08em", padX: 10, width: loose };
  return { letterSpacing: "0", padX: 6, width: title.length * 6.3 + 12 };
}
const tabHalfWidth = (title: string, blockW = COL_W) => tabStyle(title, blockW).width / 2;
/** Half an arrowhead's width: an anchor this close to the tab still loses part of its head. */
const ARROW_HALF = 7;
/** Band chrome, shared with both renderers so a band's rect can be derived here. */
export const ZONE_PAD = 16;
export const ZONE_HEAD = 30;
/** Clear space between two bands: the column gap less the pad each band adds inside it. */
const BAND_GAP = COL_GAP - ZONE_PAD * 2;
/**
 * Extra room beside a seam between two bands that carries something: an arrow's gutter leg, or
 * the chips and tags of an arrow crossing straight from one band to the next. At the plain gap
 * the leg ran a few pixels from both band borders and read as a third border, and a chip in the
 * gap sat across both. The room goes inside one band, as padding on that side — the gutter
 * between bands stays BAND_GAP everywhere, so the bands still read as one evenly spaced set.
 */
const BAND_GAP_WIDE = 32;
/** Items pack two per row inside a standard block. */
const ITEM_H = 56;
const BLOCK_PAD_TOP = 16;
const BLOCK_PAD_BOTTOM = 12;
const ACTOR_H = 66;
/** 19px chips with 3px between them across a 188px call-out. */
const CALLOUT_CHIPS_PER_ROW = 8;

/** Advance widths of ASCII 32–126 in the item-label face (IBM Plex Sans, 11.5px), measured. */
const LABEL_CHAR_W = [2.7,3.3,4.8,8.2,6.9,10.7,8,2.8,3.9,3.9,5.2,6.9,3.1,4.6,3.1,4.4,6.9,6.9,6.9,6.9,6.9,6.9,6.9,6.9,6.9,6.9,3.4,3.4,6.9,6.9,6.9,5.5,10.2,7.4,7.5,7.1,7.7,6.7,6.4,8,8.1,4.6,5.9,7.3,5.8,9.3,8.1,8.1,7,8.1,7.4,6.7,6.6,7.8,7,10.2,7,6.8,6.7,3.6,4.4,3.6,6.9,6.5,6.9,6.1,6.7,5.8,6.7,6.3,3.7,6.1,6.5,2.9,2.9,6.1,3.1,10,6.5,6.4,6.7,6.7,4.2,5.6,4,6.5,5.7,8.8,5.8,5.7,5.3,3.9,3.6,3.9,6.9];
const LABEL_LINE = 14;
/**
 * Lines an item label wraps to in a cell `cellW` wide: the renderer insets it 8px, breaks at
 * spaces and after hyphens. A row of items grows for a label that needs a third line rather
 * than letting it run into the row below.
 */
export function labelLines(label: string, cellW: number): number {
  const max = cellW - 8 - 1;
  const w = (t: string) => [...t].reduce((a, ch) => a + (LABEL_CHAR_W[ch.charCodeAt(0) - 32] ?? 7), 0);
  const words = label.split(" ").flatMap((word) => word.split(/(?<=-)/).map((part, i, all) => ({ part, glued: i > 0, last: i === all.length - 1 })));
  let lines = 1;
  let cur = 0;
  for (const { part, glued } of words) {
    const add = (cur && !glued ? LABEL_CHAR_W[0] : 0) + w(part);
    if (cur && cur + add > max) {
      lines++;
      cur = w(part);
    } else cur += add;
  }
  return lines;
}
/** Each item row's height in a block `width` wide: ITEM_H, plus a line for a three-line label. */
function itemRowHeights(block: ArchBlock, width: number, stacked: boolean): number[] {
  const items = block.items ?? [];
  const perRow = stacked ? 1 : 2;
  const out: number[] = [];
  for (let i = 0; i < items.length; i += perRow) {
    const row = items.slice(i, i + perRow);
    const cellW = (width - 8) / row.length;
    const lines = Math.max(...row.map((it) => labelLines(it.label, cellW)));
    out.push(ITEM_H + Math.max(0, lines - 2) * LABEL_LINE);
  }
  return out;
}

/** How tall a block wants to be, before row heights are settled. */
function naturalHeight(block: ArchBlock, container = false, chips = 0, chipRow = false): number {
  if (block.kind === "actor" || block.kind === "origin") return ACTOR_H;
  const items = block.items?.length ?? 0;
  // A call-out block — an icon plus the chip numbers of the controls it delivers — needs room
  // for both. Governance-band services are drawn this way; a row of chips that wraps grows the
  // block downward, so its icon stays level with its neighbours'.
  if (!items && block.icon) return 84 + Math.max(0, Math.ceil(chips / CALLOUT_CHIPS_PER_ROW) - 1) * 22;
  if (!items) return 58;
  // Tall side columns stack items vertically, one per row; everything else packs two across —
  // including a container, whose span is for its children, not for its own items.
  const stacked = (block.rowSpan ?? 1) > 1 && !container;
  const heights = itemRowHeights(block, COL_W, stacked);
  const rows = heights.reduce((a, h) => a + h, 0);
  // Chips ride the bottom border; a last row whose label wraps reaches down to them, so it
  // gets room to clear them.
  const perRow = stacked ? 1 : 2;
  const lastRow = (block.items ?? []).slice(Math.floor((items - 1) / perRow) * perRow);
  const wraps = chipRow && lastRow.some((it) => labelLines(it.label, (COL_W - 8) / lastRow.length) > 1);
  return TAB_H / 2 + BLOCK_PAD_TOP + rows + BLOCK_PAD_BOTTOM + (wraps ? 8 : 0);
}

/** Where items sit inside a block. Client-side rendering calls this too, so it lives here. */
export function itemCells(block: ArchBlock, rect: Rect): Rect[] {
  const items = block.items ?? [];
  // A container is wider than a column (it pads its children), and never stacks its items.
  const stacked = (block.rowSpan ?? 1) > 1 && rect.w <= COL_W + 4;
  const perRow = stacked ? 1 : 2;
  const top = rect.y + TAB_H / 2 + BLOCK_PAD_TOP;
  const heights = itemRowHeights(block, rect.w, stacked);
  // A stacked block stretched over several rows spreads its items down its height instead of
  // bunching them at the top above a blank remainder.
  const room = rect.h - TAB_H / 2 - BLOCK_PAD_TOP - BLOCK_PAD_BOTTOM;
  const used = heights.reduce((a, h) => a + h, 0);
  const spread = stacked && room > used ? (room - used) / heights.length : 0;
  const rowTop = heights.map((_, r) => top + heights.slice(0, r).reduce((a, h) => a + h + spread, 0) + spread / 2);
  return items.map((_, i) => {
    const r = Math.floor(i / perRow);
    const c = i % perRow;
    const inRow = Math.min(perRow, items.length - r * perRow);
    const cellW = (rect.w - 8) / inRow;
    return { x: rect.x + 4 + c * cellW, y: rowTop[r], w: cellW, h: heights[r] };
  });
}

const overlap = (a0: number, a1: number, b0: number, b1: number): [number, number] | null => {
  const lo = Math.max(a0, b0);
  const hi = Math.min(a1, b1);
  // A narrower block than the 24px threshold — an origin is 8px wide — overlaps when it is
  // fully inside the other's span; otherwise a line to the block beneath it would grow a
  // 4px horizontal stub and put its badges on the origin.
  const need = Math.min(24, a1 - a0, b1 - b0);
  return hi - lo >= need && hi > lo ? [lo, hi] : null;
};

/** Padding inside a container, and the room its title tab needs above its children. */
const NEST_PAD = 20;
/** Between wrapped lines of governance call-outs: room for the lower line's tabs, no more. */
const GOV_LINE_GAP = 32;
const NEST_HEAD = 34;
/** An anonymous origin draws as a figure the size of an actor: an icon in a dashed ring. */
const ORIGIN_W = 64;

type Placed = {
  block: ArchBlock;
  w: number;
  h: number;
  kids: Placed[];
  inner?: GridResult;
  /** A container's room above its children (title, items, their tags) and below them. */
  head?: number;
  pad?: number;
};
type GridResult = {
  width: number;
  height: number;
  /** Position of each member relative to the grid's own origin. */
  at: Map<string, Rect>;
  colX: number[];
  colW: number[];
  rowY: number[];
  rowH: number[];
  /**
   * Children of a row-spanning container placed level with the rows outside it, relative to
   * the container's top-left. A container without an entry seats its children at its foot.
   */
  nested?: Map<string, Map<string, Rect>>;
};
/** The most extra height worth spending to line a container's children up with their row. */
const SYNC_MAX = 72;

/** Drawn as an icon over a name rather than a box: where the icon sits inside its 66px cell. */
const isFigure = (b: ArchBlock) => b.kind === "actor" || b.kind === "origin";
const FIGURE = {
  actor: { cy: 22.5, half: 16, top: 6 },
  origin: { cy: 24, half: 18, top: 7 },
} as const;

const blockWidth = (b: ArchBlock) =>
  b.kind === "actor" ? 64 : b.kind === "origin" ? ORIGIN_W : COL_W;

/**
 * Lay a set of siblings out on their own grid.
 *
 * Column widths and row heights come from what is actually placed, and **empty tracks
 * collapse to nothing**. That single property is what removes the dead space a sparse
 * authored grid used to produce — a governance band authored at row 5 with content ending at
 * row 2 no longer drags three empty rows of gutter behind it.
 */
function gridLayout(items: Placed[], extraAfter: number[] = []): GridResult {
  if (!items.length) return { width: 0, height: 0, at: new Map(), colX: [], colW: [], rowY: [], rowH: [] };
  const cols = Math.max(...items.map((p) => p.block.col)) + 1;
  const rows = Math.max(...items.map((p) => p.block.row + (p.block.rowSpan ?? 1) - 1)) + 1;
  const spanOf = (p: Placed) => p.block.rowSpan ?? 1;

  const used = { col: new Set<number>(), row: new Set<number>() };
  for (const p of items) {
    used.col.add(p.block.col);
    for (let r = p.block.row; r < p.block.row + spanOf(p); r++) used.row.add(r);
  }

  // A column holding only figures (actors, anonymous origins) is as wide as a figure and its
  // name need, not a full column: a 64px person in a 188px band read as empty space.
  const colW = Array.from({ length: cols }, (_, c) => {
    if (!used.col.has(c)) return 0;
    const inCol = items.filter((p) => p.block.col === c);
    return inCol.every((p) => isFigure(p.block)) ? Math.max(...inCol.map((p) => p.w)) + 56 : Math.max(COL_W, ...inCol.map((p) => p.w));
  });
  const rowNat: number[] = Array.from({ length: rows }, (_, r) => (used.row.has(r) ? 52 : 0));
  const rootMax: number[] = Array.from({ length: rows }, () => 0);
  for (const p of items) {
    if (spanOf(p) > 1) continue;
    // A figure sits with its icon on the row's line, so it needs its name's depth below that.
    const need = isFigure(p.block) ? 2 * (p.h - FIGURE[p.block.kind as "actor" | "origin"].cy) : p.h;
    rowNat[p.block.row] = Math.max(rowNat[p.block.row], need);
    rootMax[p.block.row] = Math.max(rootMax[p.block.row], need);
  }

  // A container spanning rows lines its children up with the rows outside it, so a child and
  // the blocks it faces share a line and their arrows run straight through the middle of both.
  // "full" puts each of its inner rows level with one of its last outer rows; "first" keeps the
  // inner grid rigid and levels only its first row with the container's first row (a frame
  // whose first child faces the row it starts in). Whichever costs least, within SYNC_MAX.
  type Sync = { p: Placed; mode: "full" | "first"; rows: { r: number; ih: number; inner: number; i: number }[] };
  const options: Sync[][] = [];
  for (const p of items) {
    const span = spanOf(p);
    if (span < 2 || !p.inner) continue;
    const innerUsed = p.inner.rowH.map((h, r) => (h ? r : -1)).filter((r) => r >= 0);
    const k = innerUsed.length;
    if (!k) continue;
    const opts: Sync[] = [];
    if (k <= span) opts.push({ p, mode: "full", rows: innerUsed.map((u, i) => ({ r: p.block.row + span - k + i, ih: p.inner!.rowH[u], inner: u, i })) });
    opts.push({ p, mode: "first", rows: [{ r: p.block.row, ih: p.inner.rowH[innerUsed[0]], inner: innerUsed[0], i: 0 }] });
    options.push(opts);
  }
  const H = (r: number, ih: number) => Math.max(ih, rootMax[r]);
  const solve = (syncs: Sync[]) => {
    const c = rowNat.map((h) => h / 2);
    for (const sy of syncs) {
      for (const row of sy.rows) {
        const head = row.i === 0 && row.r === sy.p.block.row ? (sy.p.head ?? 0) + H(row.r, row.ih) / 2 : 0;
        c[row.r] = Math.max(c[row.r], H(row.r, row.ih) / 2, head);
      }
    }
    const h = rowNat.map((n, r) => (n ? Math.max(n, c[r] + rootMax[r] / 2) : 0));
    for (const sy of syncs) {
      sy.rows.forEach((row, j) => {
        const last = sy.mode === "full" && j === sy.rows.length - 1;
        h[row.r] = Math.max(h[row.r], c[row.r] + H(row.r, row.ih) / 2 + (last ? (sy.p.pad ?? NEST_PAD) : 0));
      });
    }
    const spanH = (p: Placed) => h.slice(p.block.row, p.block.row + spanOf(p)).reduce((a, x) => a + x, 0) + ROW_GAP * (spanOf(p) - 1);
    for (const p of items) {
      if (spanOf(p) === 1) continue;
      const sy = syncs.find((x) => x.p === p);
      if (sy?.mode === "full") continue;
      // Rigid contents: the span has to hold them from wherever their first row was levelled.
      const need = sy ? c[p.block.row] - H(p.block.row, sy.rows[0].ih) / 2 + p.inner!.height + (p.pad ?? NEST_PAD) : p.h;
      const have = spanH(p);
      if (need > have) h[p.block.row + spanOf(p) - 1] += need - have;
    }
    return { c, h };
  };
  const total = (h: number[]) => h.reduce((a, x) => a + x, 0);
  let chosen: Sync[] = [];
  for (const opts of options) {
    const best = opts
      .map((o) => ({ o, grow: total(solve([...chosen, o]).h) - total(solve(chosen).h) }))
      .filter((x) => x.grow <= SYNC_MAX)
      .sort((x, y) => x.grow - y.grow)[0];
    if (best) chosen.push(best.o);
  }
  const rowYOf = (h: number[]) => {
    const out: number[] = [];
    let y = 0;
    for (let r = 0; r < rows; r++) {
      out.push(y);
      if (h[r]) y += h[r] + ROW_GAP;
    }
    return { out, end: y };
  };
  // A "full" level whose first inner row is below the container's first row must still leave
  // the container's head above it; drop any that do not.
  let solved = solve(chosen);
  for (let pass = 0; pass < 3; pass++) {
    const { out } = rowYOf(solved.h);
    const keep = chosen.filter((sy) => {
      if (sy.mode !== "full") return true;
      const r0 = sy.rows[0];
      return out[r0.r] + solved.c[r0.r] - H(r0.r, r0.ih) / 2 - out[sy.p.block.row] >= (sy.p.head ?? 0) - 0.5;
    });
    if (keep.length === chosen.length) break;
    chosen = keep;
    solved = solve(chosen);
  }
  const { c, h: rowH } = solved;
  const levelled = new Set(chosen.flatMap((sy) => sy.rows.map((r) => r.r)));

  const colX: number[] = [];
  let x = 0;
  for (let col = 0; col < cols; col++) {
    colX.push(x);
    if (colW[col]) x += colW[col] + COL_GAP + (extraAfter[col] ?? 0);
  }
  const { out: rowY, end: y } = rowYOf(rowH);

  const at = new Map<string, Rect>();
  for (const p of items) {
    const span = spanOf(p);
    const spanH = rowH.slice(p.block.row, p.block.row + span).reduce((a, v) => a + v, 0) + ROW_GAP * (span - 1);
    const h = span > 1 ? Math.max(p.h, spanH) : p.h;
    // Centred on the row's line: its middle, or the line a levelled container set for it.
    const line = levelled.has(p.block.row) ? c[p.block.row] : rowH[p.block.row] / 2;
    // A figure puts its icon, not its icon-and-name box, on the line, so its arrow carries on
    // the row's main line.
    const lift = isFigure(p.block) ? Math.min(Math.max(line - FIGURE[p.block.kind as "actor" | "origin"].cy, 0), rowH[p.block.row] - h) : line - h / 2;
    const top = span > 1 ? rowY[p.block.row] : rowY[p.block.row] + lift;
    // Narrow things (an actor figure, an anonymous origin) centre in their column so flows
    // attach to the figure rather than to the edge of an invisible full-width cell.
    at.set(p.block.id, { x: colX[p.block.col] + (colW[p.block.col] - p.w) / 2, y: top, w: p.w, h });
  }

  const nested = new Map<string, Map<string, Rect>>();
  for (const sy of chosen) {
    const inner = sy.p.inner!;
    const top0 = rowY[sy.p.block.row];
    const m = new Map<string, Rect>();
    if (sy.mode === "first") {
      const r0 = sy.rows[0];
      const off = rowY[r0.r] + c[r0.r] - H(r0.r, r0.ih) / 2 - top0 - inner.rowY[r0.inner];
      for (const q of sy.p.kids) {
        const b = inner.at.get(q.block.id)!;
        m.set(q.block.id, { x: NEST_PAD + b.x, y: off + b.y, w: b.w, h: b.h });
      }
    } else {
      // Each inner row is centred on its outer row's line, like the blocks it faces.
      const topOf = new Map(sy.rows.map((r) => [r.inner, rowY[r.r] + c[r.r] - r.ih / 2 - top0]));
      const ihOf = new Map(sy.rows.map((r) => [r.inner, r.ih]));
      for (const q of sy.p.kids) {
        const b = inner.at.get(q.block.id)!;
        const a = q.block.row;
        const z = a + (q.block.rowSpan ?? 1) - 1;
        const ya = topOf.get(a)!;
        const spanning = z > a;
        const hh = spanning ? Math.max(b.h, topOf.get(z)! + ihOf.get(z)! - ya) : b.h;
        m.set(q.block.id, { x: NEST_PAD + b.x, y: spanning ? ya : ya + (ihOf.get(a)! - b.h) / 2, w: b.w, h: hh });
      }
    }
    nested.set(sy.p.block.id, m);
  }

  const lastUsed = colW.findLastIndex((w) => w > 0);
  return {
    width: x ? x - COL_GAP - (extraAfter[lastUsed] ?? 0) : 0,
    height: y ? y - ROW_GAP : 0,
    at,
    colX,
    colW,
    rowY,
    rowH,
    nested,
  };
}

export function layoutArchetype(arch: Omit<Archetype, "layout">): ArchLayout {
  // --- Containment tree ------------------------------------------------------------
  // `parent` makes containment data rather than config, and it nests to any depth: a sandbox
  // holding a harness that itself holds a supervisor and its subagents is three levels and
  // needs no special case. Children stay ordinary blocks, so they keep their edges and pins.
  const kidsOf = new Map<string, ArchBlock[]>();
  for (const b of arch.blocks) {
    const p = b.parent;
    if (!p) continue;
    if (!kidsOf.has(p)) kidsOf.set(p, []);
    kidsOf.get(p)!.push(b);
  }

  // A container may also carry its own items — an agent harness keeps its loop and context
  // assembly while holding a supervisor and subagents inside it. Items occupy a band under the
  // title tab and the children's grid starts below them, so the two never overlap.
  const itemsHeight = (b: ArchBlock) => (b.items?.length ? naturalHeight(b, true) - TAB_H / 2 : 0);
  // Chips pinned on each block. A call-out's chip row sizes it; a container whose children carry
  // chips too keeps a chip row of room beneath them, so its own chips and theirs never meet.
  const chipsOn = new Map<string, Set<string>>();
  for (const pin of arch.pins?.mitigations ?? []) chipsOn.set(pin.at, new Set([...(chipsOn.get(pin.at) ?? []), pin.mitigation]));
  const calloutChips = (b: ArchBlock) => new Set([...(b.mitigations ?? []), ...(chipsOn.get(b.id) ?? [])]).size;
  const bottomPad = (b: ArchBlock) =>
    chipsOn.has(b.id) && (kidsOf.get(b.id) ?? []).some((k) => chipsOn.has(k.id)) ? NEST_PAD + 16 : NEST_PAD;
  // A child on the container's first inner row carries its risk tags above its tab, inside the
  // container: the container's head grows to hold them clear of its own title.
  const tagsOnBlock = (id: string) => (arch.pins?.risks ?? []).filter((p) => p.at === id).length;
  const tagHeadroom = (kids: Placed[]) => {
    const first = Math.min(...kids.map((k) => k.block.row));
    const rows = Math.max(0, ...kids.filter((k) => k.block.row === first).map((k) => Math.ceil(tagsOnBlock(k.block.id) / TAGS_PER_ROW)));
    return rows ? 14 + TAG_GAP * (rows - 1) : 0;
  };
  // Extra width a straight hop needs over the plain column gap for its tags (one row, 6px each
  // side) or its chips (one line, clear of both arrowheads); 0 when the plain gap does.
  // A chip on a two-way hop needs a little line showing between it and each arrowhead.
  const hopExtra = (tags: number, chips: number, bidir = false) => {
    const forTags = tags >= 2 ? tags * TAG_W_EST + (tags - 1) * TAG_X_GAP + 12 - COL_GAP : 0;
    const forChips = chips >= 3 ? (chips - 1) * 24 + 20 + 24 - COL_GAP : 0;
    const wide = Math.max(0, forTags, forChips) ? Math.max(BAND_GAP_WIDE, forTags, forChips) : 0;
    return Math.max(wide, bidir && chips ? 16 : 0);
  };
  const pinsOn = (k: string) => (arch.pins?.risks ?? []).filter((p) => p.at === k).length;
  const chipsAt = (k: string) => (arch.pins?.mitigations ?? []).filter((p) => p.at === k).length;
  const measure = (b: ArchBlock): Placed => {
    const kids = (kidsOf.get(b.id) ?? []).map(measure);
    if (!kids.length) return { block: b, w: blockWidth(b), h: naturalHeight(b, false, calloutChips(b), chipsOn.has(b.id)), kids };
    // The same hop widening as the root grid, between two children that face each other.
    const innerExtra: number[] = [];
    const kidIds = new Set(kids.map((k) => k.block.id));
    for (const e of arch.edges) {
      if (!kidIds.has(e.from) || !kidIds.has(e.to) || e.route) continue;
      const [ka, kb] = [kids.find((k) => k.block.id === e.from)!.block, kids.find((k) => k.block.id === e.to)!.block];
      if (Math.abs(ka.col - kb.col) !== 1 || !(ka.row <= kb.row + (kb.rowSpan ?? 1) - 1 && kb.row <= ka.row + (ka.rowSpan ?? 1) - 1)) continue;
      const x = hopExtra(pinsOn(`${e.from}->${e.to}`) + pinsOn(`${e.to}->${e.from}`), chipsAt(`${e.from}->${e.to}`) + chipsAt(`${e.to}->${e.from}`), e.bidir);
      const lo = Math.min(ka.col, kb.col);
      if (x) innerExtra[lo] = Math.max(innerExtra[lo] ?? 0, x);
    }
    const inner = gridLayout(kids, innerExtra);
    const head = NEST_HEAD + tagHeadroom(kids) + itemsHeight(b);
    return {
      block: b,
      w: Math.max(inner.width + NEST_PAD * 2, blockWidth(b)),
      h: head + inner.height + bottomPad(b),
      kids,
      inner,
      head,
      pad: bottomPad(b),
    };
  };

  // Governance call-outs are not on the grid. They are laid out by the engine beneath it (see
  // the governance plane below), so they never add columns or rows to the drawing they govern.
  const govZones = new Set(
    (arch.zones ?? []).filter((z) => z.owner === "governance").map((z) => z.id),
  );
  const isGov = (b: ArchBlock) => govZones.has(b.zone ?? "");
  const roots = arch.blocks.filter((b) => !b.parent && !isGov(b)).map(measure);
  const govRoots = arch.blocks
    .filter((b) => !b.parent && isGov(b))
    .sort((a, b) => a.row - b.row || a.col - b.col)
    .map(measure);
  // Gaps between two bands widen where something lives in them (see BAND_GAP_WIDE): the leg of a
  // gutter route into the column beside the gap, or the pins of an arrow crossing it straight.
  const blockById0 = new Map(arch.blocks.map((b) => [b.id, b]));
  const topOf = (id: string): ArchBlock => {
    let b = blockById0.get(id)!;
    while (b.parent) b = blockById0.get(b.parent)!;
    return b;
  };
  const bandOfCol = new Map<number, string>();
  for (const p of roots) bandOfCol.set(p.block.col, p.block.zone ?? "");
  const usedCols = [...bandOfCol.keys()].sort((x, y) => x - y);
  const pinned = new Set([...(arch.pins?.mitigations ?? []), ...(arch.pins?.risks ?? [])].map((p) => p.at));
  const extraAfter: number[] = [];
  // At a seam, which band's padding takes the extra room: the one the pins or the leg sit in.
  const seamOwner: ("l" | "r")[] = [];
  const widen = (lo: number, hi: number, anyBand = false, extra = BAND_GAP_WIDE, owner: "l" | "r" = "r") => {
    // The gap between two adjacent used columns lo < hi — a band seam, unless anyBand.
    const i = usedCols.indexOf(lo);
    if (i < 0 || usedCols[i + 1] !== hi || (!anyBand && bandOfCol.get(lo) === bandOfCol.get(hi))) return;
    if (extra <= (extraAfter[lo] ?? 0)) return;
    extraAfter[lo] = extra;
    seamOwner[lo] = owner;
  };
  const isSeam = (lo: number, hi: number) => bandOfCol.get(lo) !== bandOfCol.get(hi);
  // A hop's pins sit on its target's side of the seam, unless the target is a figure, whose
  // narrow column has no room beside it.
  const pinSide = (a: ArchBlock, b: ArchBlock): "l" | "r" => {
    const toward = b.col > a.col ? "r" : "l";
    return isFigure(b) ? (toward === "r" ? "l" : "r") : toward;
  };
  const rowsMeet = (a: ArchBlock, b: ArchBlock) => a.row <= b.row + (b.rowSpan ?? 1) - 1 && b.row <= a.row + (a.rowSpan ?? 1) - 1;
  for (const e of arch.edges) {
    const a = topOf(e.from);
    const b = topOf(e.to);
    if (isGov(a) || isGov(b) || a.col === b.col) continue;
    if (e.route === "hvh") {
      // The leg runs in the gap beside the target, on the source's side.
      const side = a.col < b.col ? -1 : 1;
      const at = usedCols.indexOf(b.col);
      const near = usedCols[at + side];
      // The leg runs in the target band's padding.
      if (near !== undefined) widen(Math.min(near, b.col), Math.max(near, b.col), false, BAND_GAP_WIDE, b.col > near ? "r" : "l");
    }
    if (pinned.has(`${e.from}->${e.to}`) || pinned.has(`${e.to}->${e.from}`))
      widen(Math.min(a.col, b.col), Math.max(a.col, b.col), false, BAND_GAP_WIDE, pinSide(a, b));
    // A straight hop across one column gap with several risk tags or chips: at the plain gap the
    // tags tower one per row, the top one far above its arrow, and three chips stack across the
    // line; widened, they sit in one row. A band seam keeps its own pad either side.
    const nTags = pinsOn(`${e.from}->${e.to}`) + pinsOn(`${e.to}->${e.from}`);
    const nChips = chipsAt(`${e.from}->${e.to}`) + chipsAt(`${e.to}->${e.from}`);
    const [lo, hi] = [Math.min(a.col, b.col), Math.max(a.col, b.col)];
    if (!e.route && rowsMeet(a, b) && isSeam(lo, hi)) {
      // Across a seam the pins live in one band's padding, clear of the border by half a chip
      // and of the arrowhead by as much: that padding holds a row of tags or of chips.
      const row = Math.max(nTags >= 2 ? nTags * TAG_W_EST + (nTags - 1) * TAG_X_GAP : 0, nChips >= 2 ? (nChips - 1) * 24 + 20 : 0);
      if (row) widen(lo, hi, false, Math.max(BAND_GAP_WIDE, row + 12), pinSide(a, b));
    } else {
      const hop = hopExtra(nTags, nChips, e.bidir);
      if (!e.route && rowsMeet(a, b) && hop) widen(lo, hi, true, hop);
    }
  }
  const top = gridLayout(roots, extraAfter);

  // Risk tags stack upward from a block's top edge, so the first drawn row needs headroom for
  // the tallest stack it carries. Collapsing empty rows removed the accidental slack that used
  // to hide this. The margin is derived rather than fixed so no author has to leave a blank row
  // as packing material.
  const tagsOn = new Map<string, number>();
  for (const pin of arch.pins?.risks ?? []) tagsOn.set(pin.at, (tagsOn.get(pin.at) ?? 0) + 1);
  const firstRow = Math.min(...roots.map((p) => p.block.row));
  const onFirstRow = new Map(roots.filter((p) => p.block.row === firstRow).map((p) => [p.block.id, p]));
  // Headroom for the tallest stack, plus the band chrome that has to fit above it — a tag
  // belongs inside the band its block sits in, so the band's top is pushed up to enclose the
  // stack and the canvas has to have room for that. A block's stack rises from its top edge;
  // an edge's rises from the midpoint, which on a horizontal run between two first-row blocks
  // is half a block lower. Edge stacks were left out of this sum entirely until the local model
  // runtime lost its top row and three risk tags floated up out of the band — the slack that
  // had been hiding them was the row that got removed.
  // A block's tags are laid out in rows above its tab, up to TAGS_PER_ROW per row; an edge's
  // stack is still counted at its full height because its orientation is not known until the
  // arrows are routed. The estimate only sets the margin — the band top is derived from the
  // placed tags further down.
  const stackHeight = (rows: number) => (rows ? TAG_GAP * rows + TAB_H / 2 + ZONE_HEAD + 10 : 0);
  const needed = [
    ...[...onFirstRow.values()].map((p) =>
      stackHeight(Math.ceil((tagsOn.get(p.block.id) ?? 0) / TAGS_PER_ROW)),
    ),
    ...[...tagsOn.entries()]
      .filter(([at]) => at.includes("->"))
      .map(([at, n]) => {
        const ends = at.split("->").map((id) => onFirstRow.get(id));
        if (ends.some((p) => !p)) return 0;
        return stackHeight(n) - Math.min(...ends.map((p) => p!.h)) / 2;
      }),
  ];
  const marginTop = Math.max(MARGIN_TOP, ...needed);

  const blocks: Record<string, Rect> = {};
  const place = (items: Placed[], grid: GridResult, ox: number, oy: number) => {
    for (const p of items) {
      const r = grid.at.get(p.block.id)!;
      const abs = { x: ox + r.x, y: oy + r.y, w: r.w, h: r.h };
      blocks[p.block.id] = abs;
      // A container stretched over several rows keeps its own items at the top. Its children sit
      // level with the rows outside it where gridLayout could line them up, and otherwise at its
      // foot, level with the lower row — either way a child's arrows to its neighbours run
      // straight instead of climbing out through the container's items.
      if (!p.inner) continue;
      const level = grid.nested?.get(p.block.id);
      if (level) {
        // A child stretched to meet the outer rows no longer matches its own levelled layout.
        const keep = new Map([...(p.inner.nested ?? [])].filter(([kid]) => level.get(kid)?.h === p.inner!.at.get(kid)?.h));
        place(p.kids, { ...p.inner, at: level, nested: keep }, abs.x, abs.y);
      } else place(p.kids, p.inner, abs.x + NEST_PAD, abs.y + abs.h - bottomPad(p.block) - p.inner.height);
    }
  };
  place(roots, top, MARGIN_X, marginTop);
  // A block alone in a column a container made wide sits under (or over) the child it connects
  // to, so the arrow between them drops onto its middle rather than past its corner.
  for (const p of roots) {
    const c = p.block.col;
    if (p.w >= top.colW[c] - 1 || roots.some((q) => q !== p && q.block.col === c && q.w < top.colW[c] - 1 && q.block.row === p.block.row)) continue;
    const partner = arch.edges
      .flatMap((e) => (e.from === p.block.id ? [e.to] : e.to === p.block.id ? [e.from] : []))
      .find((id) => blockById0.get(id)?.parent && topOf(id).col === c && topOf(id).id !== p.block.id);
    if (!partner) continue;
    const r = blocks[p.block.id];
    const k = blocks[partner];
    const x0 = MARGIN_X + top.colX[c];
    r.x = Math.min(Math.max(k.x + (k.w - r.w) / 2, x0), x0 + top.colW[c] - r.w);
  }

  // --- Governance plane ---------------------------------------------------------------
  // The control plane is a band beneath the ownership bands: exactly as wide as they are
  // together, and separated from them by the same gutter adjacent vertical bands have. Its
  // call-outs are spaced across that width by the engine, in authored order (row, then col),
  // wrapping to a second line when the drawing is narrower than the call-outs side by side.
  // Deriving the band from the content rather than from its own members is what stops it
  // overhanging a narrow drawing, falling short of a wide one, or sitting on the bands above.
  // The bands' floor clears the chips hanging off the lowest blocks, as their sides do.
  const contentBottom = roots.length
    ? Math.max(...roots.map((p) => blocks[p.block.id].y + blocks[p.block.id].h + (chipsOn.has(p.block.id) ? 10 : 0)))
    : marginTop;
  let govBand: Rect | undefined;
  let bottom = contentBottom;
  if (govRoots.length) {
    const bandY = contentBottom + ZONE_PAD + BAND_GAP;
    // When the call-outs need more than one line, the lines are balanced (3 + 2, not 4 + 1).
    const fits = Math.max(1, Math.floor((top.width + COL_GAP) / (COL_W + COL_GAP)));
    const perRow = Math.ceil(govRoots.length / Math.ceil(govRoots.length / fits));
    let y = bandY + ZONE_HEAD + ZONE_PAD;
    for (let i = 0; i < govRoots.length; i += perRow) {
      const line = govRoots.slice(i, i + perRow);
      const lineW = line.length * COL_W + (line.length - 1) * COL_GAP;
      const lineH = Math.max(...line.map((p) => p.h));
      let x = MARGIN_X + (top.width - lineW) / 2;
      for (const p of line) {
        blocks[p.block.id] = { x, y, w: COL_W, h: lineH };
        x += COL_W + COL_GAP;
      }
      y += lineH + GOV_LINE_GAP;
    }
    bottom = y - GOV_LINE_GAP + ZONE_PAD;
    govBand = { x: MARGIN_X - ZONE_PAD, y: bandY, w: top.width + ZONE_PAD * 2, h: bottom - bandY };
  }

  const width = MARGIN_X * 2 + top.width;
  const height = bottom + MARGIN_BOTTOM;
  // Column extents let the renderer derive band rects from the grid rather than from member
  // rects, so a band holding only a narrow actor no longer leaves a gutter beside it.
  const columns = top.colX.map((x, i) => {
    const prev = usedCols[usedCols.indexOf(i) - 1];
    const padL = prev !== undefined && isSeam(prev, i) && seamOwner[prev] === "r" ? extraAfter[prev] : undefined;
    const padR = isSeam(i, usedCols[usedCols.indexOf(i) + 1] ?? -1) && seamOwner[i] === "l" ? extraAfter[i] : undefined;
    return { x: MARGIN_X + x, w: top.colW[i], ...(padL ? { padL } : {}), ...(padR ? { padR } : {}) };
  });

  // --- Edges ---------------------------------------------------------------------
  // Every arrow gets its own anchor point. Without this, edges attaching to the same side of
  // a block all meet at its centre and their long runs share a corridor, so a reader sees a
  // bundle and cannot tell which line goes where. Anchors are spread along the side and
  // ordered by where the other end sits, which also removes most needless crossings.
  type Side = "t" | "b" | "l" | "r";
  const cx = (r: Rect) => r.x + r.w / 2;
  const cy = (r: Rect) => r.y + r.h / 2;

  const plans = arch.edges.map((e) => {
    const a = blocks[e.from];
    const b = blocks[e.to];
    const yOv = overlap(a.y, a.y + a.h, b.y, b.y + b.h);
    const xOv = overlap(a.x, a.x + a.w, b.x, b.x + b.w);
    let kind: "h" | "v" | "vh" | "hv" | "hvh" | "vhv" | "under" | "over";
    let aSide: Side;
    let bSide: Side;
    if (e.route === "under" || e.route === "over") {
      kind = e.route;
      aSide = e.route === "under" ? "b" : "t";
      bSide = aSide;
    } else if (e.route === "hvh" && !xOv) {
      // Even between blocks that overlap, an explicit gutter route jogs beside the target rather
      // than midway, so it can share that gutter with the arrows around it.
      kind = "hvh";
      aSide = cx(a) < cx(b) ? "r" : "l";
      bSide = cx(a) < cx(b) ? "l" : "r";
    } else if (e.route === "vhv" && !yOv) {
      kind = "vhv";
      aSide = cy(a) < cy(b) ? "b" : "t";
      bSide = cy(a) < cy(b) ? "t" : "b";
    } else if (yOv) {
      kind = "h";
      aSide = a.x < b.x ? "r" : "l";
      bSide = a.x < b.x ? "l" : "r";
    } else if (xOv) {
      kind = "v";
      aSide = a.y < b.y ? "b" : "t";
      bSide = a.y < b.y ? "t" : "b";
    } else if (e.route === "vh") {
      kind = "vh";
      aSide = cy(a) < cy(b) ? "b" : "t";
      bSide = cx(a) < cx(b) ? "l" : "r";
    } else if (e.route === "hvh") {
      kind = "hvh";
      aSide = cx(a) < cx(b) ? "r" : "l";
      bSide = cx(a) < cx(b) ? "l" : "r";
    } else if (e.route === "vhv") {
      kind = "vhv";
      aSide = cy(a) < cy(b) ? "b" : "t";
      bSide = cy(a) < cy(b) ? "t" : "b";
    } else {
      kind = "hv";
      aSide = cx(a) < cx(b) ? "r" : "l";
      bSide = cy(a) < cy(b) ? "t" : "b";
    }
    return { e, a, b, kind, aSide, bSide };
  });

  // Lane order along a side. Arrows to the left of a block take the left lanes and arrows
  // to the right take the right lanes, as before — but within a group the order is what
  // keeps two bent arrows from crossing: an arrow that has further to travel in the
  // perpendicular direction takes the outer lane, so its long leg never cuts across the
  // shorter arrow's turn. Sorting purely by the other block's centre put the low-code
  // builder's data-gateway arrow under its external-tools arrow and crossed them.
  const laneKey = (side: Side, self: Rect, other: Rect): number => {
    const dx = cx(other) - cx(self);
    const dy = cy(other) - cy(self);
    // Ties (two blocks in one column, or one row) fall back to where the other block sits along
    // the side, so lanes keep the same order as the blocks they lead to.
    if (side === "t" || side === "b") {
      const level = Math.abs(dx) < 24;
      const group = level ? 1 : dx < 0 ? 0 : 2;
      const outerFirst = side === "t" ? dx > 0 : dx < 0;
      const within = level ? dx : outerFirst ? dy : -dy;
      return group * 1e6 + within + dx * 1e-3;
    }
    const level = Math.abs(dy) < 24;
    const group = level ? 1 : dy < 0 ? 0 : 2;
    const outerFirst = side === "r" ? dy > 0 : dy < 0;
    const within = level ? dy : outerFirst ? -dx : dx;
    return group * 1e6 + within + dy * 1e-3;
  };
  const parentOf = new Map(arch.blocks.filter((b) => b.parent).map((b) => [b.id, b.parent!]));
  const blockById = new Map(arch.blocks.map((b) => [b.id, b]));
  const ancestors = (id: string): string[] => {
    const out: string[] = [];
    for (let p = parentOf.get(id); p; p = parentOf.get(p)) out.push(p);
    return out;
  };
  // An arrow that leaves a container through one of its sides takes a lane on that side
  // alongside the container's own arrows. Otherwise a child's arrow and its parent's arrow
  // both start at the same centre x and share a corridor — the harness's memory arrow and
  // its sandbox's registry arrow read as one line.
  const exitsThrough = (blockId: string, otherId: string): string | undefined =>
    ancestors(blockId).find((p) => p !== otherId && !ancestors(otherId).includes(p));
  const sideLists = new Map<string, { ref: string; sort: number }[]>();
  plans.forEach((p, i) => {
    // On a container's side, two children's arrows to one block tie; the child's own position
    // along the side breaks it, so the upper child takes the upper lane.
    const add = (blockId: string, side: Side, self: Rect, other: Rect, end: "a" | "b", child?: Rect) => {
      const k = `${blockId}|${side}`;
      const list = sideLists.get(k) ?? [];
      const tie = child ? (side === "t" || side === "b" ? cx(child) : cy(child)) * 1e-6 : 0;
      list.push({ ref: `${i}|${end}`, sort: laneKey(side, self, other) + tie });
      sideLists.set(k, list);
    };
    add(p.e.from, p.aSide, p.a, p.b, "a");
    add(p.e.to, p.bSide, p.b, p.a, "b");
    const outerA = exitsThrough(p.e.from, p.e.to);
    if (outerA) add(outerA, p.aSide, blocks[outerA], p.b, "a", p.a);
    const outerB = exitsThrough(p.e.to, p.e.from);
    if (outerB) add(outerB, p.bSide, blocks[outerB], p.a, "b", p.b);
  });
  const slot = new Map<string, { idx: number; total: number }>();
  for (const [k, list] of sideLists) {
    list.sort((x, y) => x.sort - y.sort);
    list.forEach((entry, idx) => slot.set(`${k}|${entry.ref}`, { idx, total: list.length }));
  }
  // Every arrow a child sends out through one side of its container keeps the container's lane
  // order (the order the container sorted all its arrows in), spread along the child's own side.
  // Taking the container's lane where it lands on the child and the child's lane where it does
  // not mixed two orders, and an arrow bound upward could leave below one bound downward.
  const exitRank = new Map<string, { rank: number; count: number }>();
  {
    const groups = new Map<string, { ref: string; idx: number }[]>();
    plans.forEach((p, i) => {
      for (const [end, child, other, side] of [
        ["a", p.e.from, p.e.to, p.aSide],
        ["b", p.e.to, p.e.from, p.bSide],
      ] as const) {
        const outer = exitsThrough(child, other);
        if (!outer) continue;
        const key = `${child}|${outer}|${side}`;
        const idx = slot.get(`${outer}|${side}|${i}|${end}`)?.idx ?? 0;
        groups.set(key, [...(groups.get(key) ?? []), { ref: `${i}|${end}`, idx }]);
      }
    });
    for (const [key, list] of groups) {
      list.sort((x, y) => x.idx - y.idx).forEach((m, rank) => exitRank.set(`${key}|${m.ref}`, { rank, count: list.length }));
    }
  }
  // The stretch of a block's top border its title tab covers, widened by half an arrowhead and a
  // hair, and how much border is left either side of it for arrows.
  const tabSpan = (blockId: string, r: Rect) => {
    const block = blockById.get(blockId);
    if (!block || isFigure(block)) return undefined;
    const half = tabHalfWidth(block.title, r.w) + ARROW_HALF + 3;
    const l = cx(r) - half;
    const rr = cx(r) + half;
    const left = Math.max(0, l - (r.x + 12));
    return { l, r: rr, left, room: left + Math.max(0, r.x + r.w - 12 - rr) };
  };
  const offTab = (blockId: string, r: Rect, x: number) => {
    const span = tabSpan(blockId, r);
    return !span || span.room < 16 || x <= span.l || x >= span.r;
  };
  // Where the chips of a container's children sit when those children stand at its foot.
  const footChips = (blockId: string) => {
    const r = blocks[blockId];
    return (kidsOf.get(blockId) ?? []).flatMap((k) => {
      const kr = blocks[k.id];
      const n = chipsOn.get(k.id)?.size ?? 0;
      return n && r.y + r.h - (kr.y + kr.h) < 48 ? Array.from({ length: n }, (_, j) => kr.x + 16 + 24 * j) : [];
    });
  };
  const anchorAt = (blockId: string, side: Side, r: Rect, i: number, end: "a" | "b", outer?: string) => {
    const s = slot.get(`${blockId}|${side}|${i}|${end}`) ?? { idx: 0, total: 1 };
    // A figure (an actor, or an anonymous origin in its ring) is an icon over its name: arrows
    // meet the icon — beside it, above it, or under the name — not the invisible box around both.
    const fig = blockById.get(blockId);
    if (fig && isFigure(fig)) {
      const g = FIGURE[fig.kind as "actor" | "origin"];
      const off = (s.idx - (s.total - 1) / 2) * 12;
      if (side === "l") return { x: cx(r) - g.half, y: r.y + g.cy + off };
      if (side === "r") return { x: cx(r) + g.half, y: r.y + g.cy + off };
      if (side === "t") return { x: cx(r) + off, y: r.y + g.top };
      return { x: cx(r) + off, y: r.y + r.h };
    }
    let f = (s.idx + 1) / (s.total + 1);
    // An exit through a container takes its rank in the container's lane order (see exitRank).
    const along = r;
    if (outer) {
      const er = exitRank.get(`${blockId}|${outer}|${side}|${i}|${end}`);
      if (er) f = (er.rank + 1) / (er.count + 1);
    }
    const clampX = (x: number) => Math.min(Math.max(x, r.x + 12), r.x + r.w - 12);
    const clampY = (y: number) => Math.min(Math.max(y, r.y + 12), r.y + r.h - 12);
    if (side === "t") {
      // Arrows meet the top border either side of the title tab, spread in lane order over the
      // free border there. Only a tab that leaves no such room takes an arrow, which then stops
      // at the tab's top edge so its arrowhead lands on the tab rather than hidden beneath it.
      const span = tabSpan(blockId, r);
      if (span && span.room >= 16) {
        // A lone arrow takes the middle of the free border on the side facing its other end,
        // clear of the tab and of the block's corner alike.
        const right = span.room - span.left;
        if (s.total === 1 && !outer) {
          const other = end === "a" ? plans[i].b : plans[i].a;
          const toRight = Math.abs(cx(other) - cx(r)) < 24 ? right >= span.left - 0.5 : cx(other) > cx(r);
          if (toRight && right >= 8) return { x: span.r + right / 2, y: r.y };
          if (!toRight && span.left >= 8) return { x: r.x + 12 + span.left / 2, y: r.y };
        }
        const p = f * span.room;
        return { x: p <= span.left ? r.x + 12 + p : span.r + (p - span.left), y: r.y };
      }
      const x = clampX(along.x + along.w * f);
      return { x, y: span && x > span.l && x < span.r ? r.y - TAB_TOP : r.y };
    }
    if (side === "b") {
      const nC = chipsOn.get(blockId)?.size ?? 0;
      let x = clampX(along.x + along.w * f);
      if (nC && !outer) x = Math.max(x, Math.min(r.x + 16 + 24 * (nC - 1) + 22, r.x + r.w - 12));
      // Nor does it rise out of a child's chip row just above the container's foot.
      const kidChips = footChips(blockId);
      if (kidChips.some((k) => Math.abs(k - x) < 22)) x = Math.min(Math.max(...kidChips) + 22, r.x + r.w - 12);
      return { x, y: r.y + r.h };
    }
    if (side === "l") return { x: r.x, y: clampY(along.y + along.h * f) };
    return { x: r.x + r.w, y: clampY(along.y + along.h * f) };
  };

  // Gutter routes. Arrows that run along the same gap into one column (or above one row) each
  // take their own track, nearest track for the shortest detour, so their legs never cross.
  const gutterTrack = new Map<number, number>();
  const gutterGroups = new Map<string, { i: number; dist: number }[]>();
  plans.forEach((p, i) => {
    if (p.kind !== "hvh" && p.kind !== "vhv" && p.kind !== "under" && p.kind !== "over") return;
    const base =
      p.kind === "hvh" ? (p.bSide === "l" ? p.b.x : p.b.x + p.b.w)
      : p.kind === "under" ? Math.max(p.a.y + p.a.h, p.b.y + p.b.h)
      : p.kind === "over" ? Math.min(p.a.y, p.b.y)
      : p.bSide === "t" ? p.b.y : p.b.y + p.b.h;
    const key = `${p.kind}|${p.bSide}|${base}`;
    const dist = p.kind === "hvh" ? Math.abs(cy(p.b) - cy(p.a)) : Math.abs(cx(p.b) - cx(p.a));
    gutterGroups.set(key, [...(gutterGroups.get(key) ?? []), { i, dist }]);
  });
  for (const list of gutterGroups.values()) {
    list.sort((x, y) => x.dist - y.dist).forEach((g, k) => gutterTrack.set(g.i, k));
  }
  const GUTTER_IN = 10;
  const GUTTER_STEP = 9;
  /** Half a chip plus a hair: a run beneath a block passes clear of the chips on its border. */
  const CHIP_CLEAR = 12;

  // Anchors in three passes: every arrow takes its lane, then each arrow between two blocks that
  // face each other moves onto one straight line if it can do so without crowding another
  // arrow on either side, then the paths are drawn. Lanes alone spread a side's arrows at fixed
  // fractions, which bent arrows that could have run straight across to a block level with them.
  const anchors = plans.map((p, i) => ({
    A: anchorAt(p.e.from, p.aSide, p.a, i, "a", exitsThrough(p.e.from, p.e.to)),
    B: anchorAt(p.e.to, p.bSide, p.b, i, "b", exitsThrough(p.e.to, p.e.from)),
  }));
  const onSide = new Map<string, { i: number; end: "A" | "B" }[]>();
  const enlist = (key: string, i: number, end: "A" | "B") => onSide.set(key, [...(onSide.get(key) ?? []), { i, end }]);
  plans.forEach((p, i) => {
    enlist(`${p.e.from}|${p.aSide}`, i, "A");
    enlist(`${p.e.to}|${p.bSide}`, i, "B");
    const oa = exitsThrough(p.e.from, p.e.to);
    if (oa) enlist(`${oa}|${p.aSide}`, i, "A");
    const ob = exitsThrough(p.e.to, p.e.from);
    if (ob) enlist(`${ob}|${p.bSide}`, i, "B");
  });
  const LANE_MIN = 18;
  // Pairs of arrows a walk takes one after the other: one flow, which may run as one line.
  const planOf = (ref: string) => plans.findIndex((q) => `${q.e.from}->${q.e.to}` === ref || `${q.e.to}->${q.e.from}` === ref);
  const inTurn = new Set<string>();
  for (const w of [arch.walkthrough, ...(arch.scenarios ?? [])]) {
    const ids = (w?.steps ?? []).map((st) => planOf(st.follow));
    ids.slice(1).forEach((b, k) => {
      const a = ids[k];
      if (a >= 0 && b >= 0) inTurn.add(`${a}|${b}`).add(`${b}|${a}`);
    });
  }
  // Straightening may move an anchor along its side, but never past a neighbour: the lane order
  // is what keeps the arrows on one side from crossing each other.
  const laneIdx = (key: string, o: { i: number; end: "A" | "B" }) => slot.get(`${key}|${o.i}|${o.end === "A" ? "a" : "b"}`)?.idx ?? 0;
  const clear = (keys: string[], i: number, end: "A" | "B", axis: "x" | "y", v: number) =>
    keys.every((key) => {
      const list = [...(onSide.get(key) ?? [])].sort((x, y) => laneIdx(key, x) - laneIdx(key, y));
      const at = list.findIndex((o) => o.i === i && o.end === end);
      return list.every((o, j) => {
        if (j === at) return true;
        const w = anchors[o.i][o.end][axis];
        return j < at ? w <= v - LANE_MIN : w >= v + LANE_MIN;
      });
    });
  plans.forEach((p, i) => {
    if (p.kind !== "h" && p.kind !== "v") return;
    const { A, B } = anchors[i];
    const axis = p.kind === "h" ? "y" : "x";
    if (A[axis] === B[axis]) return;
    const [lo, hi] =
      p.kind === "h"
        ? [Math.max(p.a.y, p.b.y), Math.min(p.a.y + p.a.h, p.b.y + p.b.h)]
        : [Math.max(p.a.x, p.b.x), Math.min(p.a.x + p.a.w, p.b.x + p.b.w)];
    const keysA = [`${p.e.from}|${p.aSide}`, ...[exitsThrough(p.e.from, p.e.to)].filter(Boolean).map((o) => `${o}|${p.aSide}`)];
    const keysB = [`${p.e.to}|${p.bSide}`, ...[exitsThrough(p.e.to, p.e.from)].filter(Boolean).map((o) => `${o}|${p.bSide}`)];
    // Prefer keeping one end where it is (the other comes to meet it), then the overlap's middle,
    // then either side of a title tab the line would otherwise meet. A vertical line never
    // settles under a tab that leaves room beside it.
    const tops = p.kind === "v" ? ([[p.aSide, p.e.from, p.a], [p.bSide, p.e.to, p.b]] as const).filter(([sd]) => sd === "t") : [];
    const besideTabs = tops.flatMap(([, id, r]) => {
      const span = tabSpan(id, r);
      return span ? [span.l, span.r] : [];
    });
    const near = (v: number) => Math.min(Math.max(v, lo + 12), hi - 12);
    // Before anything else: carry on the line of a vertical arrow leaving the far side of either
    // end (a vertical chain through one block reads as one line; a horizontal one would read as
    // a single flow even where it is two), or, for an arrow to a container,
    // the middle of the overlap rather than a lane its many exits pushed off-centre.
    const opp = { l: "r", r: "l", t: "b", b: "t" } as const;
    const cont = plans.flatMap((q, j) => {
      if (j === i || p.kind !== "v" || q.kind !== "v") return [];
      const out: number[] = [];
      for (const [blk, sd] of [[p.e.from, p.aSide], [p.e.to, p.bSide]] as const) {
        if (q.e.from === blk && q.aSide === opp[sd]) out.push(anchors[j].A[axis]);
        if (q.e.to === blk && q.bSide === opp[sd]) out.push(anchors[j].B[axis]);
      }
      return out;
    });
    const cont0 = [kidsOf.has(p.e.from) || kidsOf.has(p.e.to) ? (lo + hi) / 2 : NaN].filter((v) => !Number.isNaN(v));
    const figEnds = [[p.e.from, A], [p.e.to, B]].filter(([id]) => isFigure(blockById.get(id as string)!)).map(([, pt]) => (pt as { x: number; y: number })[axis]);
    const candidates = [...cont0, ...cont, A[axis], B[axis], near(A[axis]), near(B[axis]), (lo + hi) / 2, ...besideTabs]
      .filter((v) => v >= lo + 12 && v <= hi - 12)
      .filter((v) => tops.every(([, id, r]) => offTab(id, r, v)))
      .filter((v) => figEnds.every((f) => Math.abs(f - v) < 0.5));
    // A line a few pixels off an unrelated arrow leaving the far side of either end reads as one
    // path with a jog: either share its line exactly or keep 16px from it. And a line that meets
    // a block within 20px of its corner reads as missing it, so lines clear of every corner
    // come first.
    const farInfo = plans.flatMap((q, j) => {
      if (j === i || q.kind !== p.kind) return [];
      const out: { v: number; via: string; j: number }[] = [];
      for (const [blk, sd] of [[p.e.from, p.aSide], [p.e.to, p.bSide]] as const) {
        if (q.e.from === blk && q.aSide === opp[sd]) out.push({ v: anchors[j].A[axis], via: blk, j });
        if (q.e.to === blk && q.bSide === opp[sd]) out.push({ v: anchors[j].B[axis], via: blk, j });
      }
      return out;
    });
    const farSide = farInfo.map((f) => f.v);
    // Lined up through a block that spans three rows or more, two arrows read as one path; that
    // is right only when they are one flow — a walk takes them in turn, or one ends at a figure.
    const oneFlow = (j: number) =>
      [p.e.from, p.e.to, plans[j].e.from, plans[j].e.to].some((id) => isFigure(blockById.get(id)!)) || inTurn.has(`${i}|${j}`);
    const falseThrough = (v: number) =>
      farInfo.some((f) => Math.abs(f.v - v) < 0.5 && (blockById.get(f.via)?.rowSpan ?? 1) >= 3 && !oneFlow(f.j));
    const kidChipsAt = [[p.e.from, p.aSide], [p.e.to, p.bSide]].flatMap(([id, sd]) => (sd === "b" && axis === "x" ? footChips(id) : []));
    const span = (r: Rect) => (axis === "y" ? [r.y, r.y + r.h] : [r.x, r.x + r.w]);
    const cornerSafe = (v: number) => [p.a, p.b].every((r) => v - span(r)[0] >= 20 && span(r)[1] - v >= 20);
    const ranked = [...candidates, ...[(lo + hi) / 2 - 24, (lo + hi) / 2 + 24].filter((v) => v >= lo + 12 && v <= hi - 12)]
      .filter((v) => farSide.every((f) => Math.abs(f - v) < 0.5 || Math.abs(f - v) >= 16))
      .filter((v) => kidChipsAt.every((c) => Math.abs(c - v) >= 22))
      .map((v, k) => ({ v, k: k + (cornerSafe(v) ? 0 : 1000) + (falseThrough(v) ? 500 : 0) }))
      .sort((x, y) => x.k - y.k)
      .map((x) => x.v);
    for (const v of ranked) {
      if (clear(keysA, i, "A", axis, v) && clear(keysB, i, "B", axis, v)) {
        A[axis] = v;
        B[axis] = v;
        break;
      }
    }
  });

  // Where two bands meet. A chip centred within half a chip of either border would sit across
  // it, so pins prefer the rest of their arrow (pinSegment), and tags keep off the seam.
  const bandSeams: [number, number][] = [];
  // The widened padding beside a seam, where a hop's pins and a gutter leg sit.
  const seamRooms: [number, number][] = [];
  for (let i = 0; i + 1 < usedCols.length; i++) {
    const [lo, hi] = [usedCols[i], usedCols[i + 1]];
    if (!isSeam(lo, hi)) continue;
    const l = columns[lo].x + columns[lo].w + ZONE_PAD + (columns[lo].padR ?? 0);
    const r = columns[hi].x - ZONE_PAD - (columns[hi].padL ?? 0);
    bandSeams.push([l, r]);
    if (columns[hi].padL) seamRooms.push([r, columns[hi].x]);
    if (columns[lo].padR) seamRooms.push([columns[lo].x + columns[lo].w, l]);
  }
  const bandGaps = bandSeams.map(([l, r]) => [l - 12, r + 12] as [number, number]);

  const pieceOf: { lo: number; hi: number }[] = [];
  const edges = plans.map((p, i) => {
    const { e, a, b, kind, bSide } = p;
    const { A, B } = anchors[i];
    let d: string;
    if (kind === "h") {
      // Straight where the anchors line up; a shallow Z where they do not.
      d =
        Math.abs(A.y - B.y) < 0.5
          ? `M ${A.x} ${A.y} L ${B.x} ${B.y}`
          : `M ${A.x} ${A.y} L ${(A.x + B.x) / 2} ${A.y} L ${(A.x + B.x) / 2} ${B.y} L ${B.x} ${B.y}`;
    } else if (kind === "v") {
      d =
        Math.abs(A.x - B.x) < 0.5
          ? `M ${A.x} ${A.y} L ${B.x} ${B.y}`
          : `M ${A.x} ${A.y} L ${A.x} ${(A.y + B.y) / 2} L ${B.x} ${(A.y + B.y) / 2} L ${B.x} ${B.y}`;
    } else if (kind === "vh") {
      d = `M ${A.x} ${A.y} L ${A.x} ${B.y} L ${B.x} ${B.y}`;
    } else if (kind === "hvh") {
      const k = gutterTrack.get(i) ?? 0;
      // The first track runs down the middle of the column gap, so a badge seated on it clears
      // the blocks on both sides; a longer detour takes the next track out from the target, so
      // its leg never crosses a shorter one's.
      // The gap is the one beside the target's column, which may be a widened band gap.
      const ci = columns.findIndex((c) => c.w > 0 && c.x <= b.x + 1 && b.x + b.w <= c.x + c.w + 1);
      const col = columns[ci];
      const nb = bSide === "l" ? columns.slice(0, Math.max(ci, 0)).findLast((c) => c.w > 0) : columns.slice(ci + 1).find((c) => c.w > 0);
      const gap = col && nb ? (bSide === "l" ? col.x - (nb.x + nb.w) : nb.x - (col.x + col.w)) : COL_GAP;
      const edgeX = col ? (bSide === "l" ? col.x : col.x + col.w) : bSide === "l" ? b.x : b.x + b.w;
      // Beside a seam the leg runs down the middle of the target band's widened padding, inside
      // the band, rather than in the gutter between two band borders.
      const pad = col ? (bSide === "l" ? col.padL : col.padR) : undefined;
      const half = pad ? (ZONE_PAD + pad) / 2 : gap / 2;
      const gx = bSide === "l" ? edgeX - half - k * GUTTER_STEP : edgeX + half + k * GUTTER_STEP;
      d = `M ${A.x} ${A.y} L ${gx} ${A.y} L ${gx} ${B.y} L ${B.x} ${B.y}`;
    } else if (kind === "under" || kind === "over") {
      // Clear of both ends and of every block the run passes in their rows.
      const k = gutterTrack.get(i) ?? 0;
      const x0 = Math.min(A.x, B.x);
      const x1 = Math.max(A.x, B.x);
      const ends = new Set([e.from, e.to, ...ancestors(e.from), ...ancestors(e.to)]);
      const lo = Math.min(a.y, b.y);
      const hi = Math.max(a.y + a.h, b.y + b.h);
      const mates = Object.entries(blocks)
        .filter(([id, r]) => !ends.has(id) && r.x < x1 && r.x + r.w > x0 && r.y < hi && r.y + r.h > lo)
        .map(([, r]) => r);
      const gy =
        kind === "under"
          ? Math.max(hi, ...mates.map((r) => r.y + r.h)) + CHIP_CLEAR + GUTTER_IN + k * GUTTER_STEP
          : Math.min(Math.min(A.y, B.y), ...mates.map((r) => r.y - TAB_TOP)) - GUTTER_IN - 6 - k * GUTTER_STEP;
      d = `M ${A.x} ${A.y} L ${A.x} ${gy} L ${B.x} ${gy} L ${B.x} ${B.y}`;
    } else if (kind === "vhv") {
      const k = gutterTrack.get(i) ?? 0;
      // The run sits in the gap beside the target's row: clear of every block in that row that
      // the run passes, not just the target — a taller neighbour would otherwise be cut through.
      const x0 = Math.min(A.x, B.x);
      const x1 = Math.max(A.x, B.x);
      const ends = new Set([e.from, e.to, ...ancestors(e.from), ...ancestors(e.to)]);
      const rowMates = Object.entries(blocks)
        .filter(([id, r]) => !ends.has(id) && r.x < x1 && r.x + r.w > x0 && r.y < b.y + b.h && r.y + r.h > b.y)
        .map(([, r]) => r);
      // Below a row it also clears the chips seated on those blocks' bottom borders — by the
      // middle of the air between them and the tabs beneath the run, not by the bare minimum,
      // so the chips do not read as resting on the line.
      const floor = Math.max(b.y + b.h, ...rowMates.map((r) => r.y + r.h));
      const beneath = Object.entries(blocks)
        .filter(([id, r]) => !ends.has(id) && r.x < x1 && r.x + r.w > x0 && r.y > floor)
        .map(([, r]) => r.y - TAB_TOP);
      const ceil = Math.min(A.y, ...beneath);
      const gy =
        bSide === "t"
          ? Math.min(B.y, b.y, ...rowMates.map((r) => r.y)) - GUTTER_IN - k * GUTTER_STEP
          : Math.max(floor + CHIP_CLEAR + GUTTER_IN, (floor + 10 + ceil) / 2) + k * GUTTER_STEP;
      d = `M ${A.x} ${A.y} L ${A.x} ${gy} L ${B.x} ${gy} L ${B.x} ${B.y}`;
    } else {
      d = `M ${A.x} ${A.y} L ${B.x} ${A.y} L ${B.x} ${B.y}`;
    }
    // Containers an endpoint sits inside, minus those holding both ends — an arrow between two
    // children of one sandbox never leaves it, and the sandbox cannot be said to cover it.
    const fromA = ancestors(e.from);
    const toA = ancestors(e.to);
    const containers = [...new Set([...fromA, ...toA])]
      .filter((id) => !(fromA.includes(id) && toA.includes(id)))
      .map((id) => blocks[id]);
    const { lo, hi, ...seg } = pinSegment(d, containers, bandGaps, seamRooms);
    pieceOf.push({ lo, hi });
    // A shallow Z between two facing blocks pins on its middle jog, which runs across the
    // edge's direction. Pins are laid out relative to the edge's direction there — beside the
    // jog, in the gap between the blocks — not relative to the jog itself, which would put a
    // badge stack under a horizontal jog and onto the block beneath it.
    const isZ = (kind === "h" || kind === "v") && segmentsOf(d).length === 3;
    // A Z's pins sit in the gap between the blocks, so its room is that gap, not the jog.
    const gap = kind === "h" ? Math.abs(B.x - A.x) : Math.abs(B.y - A.y);
    return { from: e.from, to: e.to, d, ...seg, horizontal: isZ ? kind === "h" : seg.horizontal, extent: isZ ? gap : seg.extent };
  });

  // Two arrows running side by side pick the same middle, and their pins (chips, tags and step
  // numbers) land on each other. The later one slides along its own run until it clears.
  const walked = new Set(
    [arch.walkthrough, ...(arch.scenarios ?? [])].flatMap((w) => (w?.steps ?? []).map((st) => st.follow)),
  );
  const hasPins = (e: { from: string; to: string }) =>
    [`${e.from}->${e.to}`, `${e.to}->${e.from}`].some((k) => pinned.has(k) || walked.has(k));
  const crowded = (x: number, y: number, k: number) =>
    edges.some((o, j) => j < k && hasPins(o) && Math.abs(o.midX - x) < 90 && Math.abs(o.midY - y) < 60);
  edges.forEach((e, k) => {
    if (!hasPins(e) || !crowded(e.midX, e.midY, k)) return;
    const { lo, hi } = pieceOf[k];
    for (const f of [0.3, 0.7, 0.2, 0.8]) {
      const v = lo + (hi - lo) * f;
      const [x, y] = e.horizontal ? [v, e.midY] : [e.midX, v];
      const room = 2 * Math.min(v - lo, hi - v);
      if (room >= 60 && !crowded(x, y, k)) {
        Object.assign(e, { midX: x, midY: y, extent: room });
        break;
      }
    }
  });

  // Where the ownership bands start. Derived here rather than in each renderer because it is
  // not simply "above the topmost block": a risk-tag row rises out of its block or its arrow
  // and must stay inside the band that owns it, so the band's top is whichever sits higher.
  // Computed from the placed tags themselves — the same placement the renderers draw — rather
  // than from a formula that has to be kept in step with it.
  // Chip counts per pin location, keyed as the edge is drawn, and each block's chip positions:
  // along its bottom border from the left, stepping past any arrow that crosses or leaves that
  // border so a chip never sits on a line.
  const chipCounts: Record<string, number> = {};
  for (const pin of arch.pins?.mitigations ?? []) {
    const at = blocks[pin.at] || edges.some((e) => `${e.from}->${e.to}` === pin.at) ? pin.at : pin.at.split("->").reverse().join("->");
    chipCounts[at] = (chipCounts[at] ?? 0) + 1;
  }
  const blockChipXs: Record<string, number[]> = {};
  const depth = (id: string) => ancestors(id).length;
  for (const [at, n] of Object.entries(chipCounts).sort(([a], [b]) => depth(b) - depth(a))) {
    const r = blocks[at];
    if (!r) continue;
    const y = r.y + r.h;
    const avoid = edges.flatMap((e) => {
      const pts = [...e.d.matchAll(/[ML] ([-\d.]+) ([-\d.]+)/g)].map((m) => ({ x: +m[1], y: +m[2] }));
      return pts.slice(1).flatMap((p, k) => {
        const q = pts[k];
        const vertical = Math.abs(p.x - q.x) < 0.5;
        return vertical && Math.min(p.y, q.y) <= y + 1 && Math.max(p.y, q.y) >= y - 1 && p.x > r.x && p.x < r.x + r.w ? [p.x] : [];
      });
    });
    const kidXs = arch.blocks.filter((k) => k.parent === at && blockChipXs[k.id] && Math.abs(blocks[k.id].y + blocks[k.id].h - y) < 48).flatMap((k) => blockChipXs[k.id]);
    const ok = (x: number) => !avoid.some((a) => Math.abs(a - x) < 22) && !kidXs.some((k) => Math.abs(k - x) < 40);
    let xs: number[] = [];
    for (let x0 = r.x + 16; x0 + 24 * (n - 1) + 10 <= r.x + r.w; x0 += 24) {
      const run = Array.from({ length: n }, (_, k) => x0 + 24 * k);
      if (run.every(ok)) { xs = run; break; }
    }
    if (!xs.length) for (let x = r.x + 16; xs.length < n && x < r.x + r.w + 24 * n; x += 24) {
      if (!avoid.some((a) => Math.abs(a - x) < 22)) xs.push(x);
    }
    blockChipXs[at] = xs;
  }

  {
    // An arrow whose tags fit on neither side of it without crowding another arrow slides its
    // pins along its own run until they do.
    const near8 = (e: (typeof edges)[number], rs: Rect[]) => edges.some((o) => o !== e && segmentsOf(o.d).some((sg) => rs.some((r) => r.x < Math.max(sg.x0, sg.x1) + 8 && r.x + r.w > Math.min(sg.x0, sg.x1) - 8 && r.y < Math.max(sg.y0, sg.y1) + 8 && r.y + r.h > Math.min(sg.y0, sg.y1) - 8)));
    edges.forEach((e, k) => {
      const key = `${e.from}->${e.to}`;
      const nT = tagsOn.get(key) ?? tagsOn.get(`${e.to}->${e.from}`) ?? 0;
      if (!nT || !e.horizontal) return;
      const test = () => { const t = placeTags([{ at: key, widths: Array.from({ length: nT }, () => TAG_W_EST) }], { blocks, edges, columns, chipCounts, blockChipXs, bandSeams }).get(key)!; return !near8(e, t.rects); };
      if (test()) return;
      const { lo, hi } = pieceOf[k];
      const keep = { midX: e.midX, midY: e.midY, extent: e.extent };
      for (const fr of [0.7, 0.3, 0.8, 0.2, 0.85, 0.15]) {
        Object.assign(e, { midX: lo + (hi - lo) * fr, extent: 2 * Math.min((hi - lo) * fr, (hi - lo) * (1 - fr)) });
        if (test()) return;
      }
      Object.assign(e, keep);
    });
  }
  const rootTops = roots.map((p) => blocks[p.block.id].y);
  const placed = placeTags(
    [...tagsOn.entries()].map(([at, n]) => ({ at, widths: Array.from({ length: n }, () => TAG_W_EST) })),
    { blocks, edges, columns, chipCounts, blockChipXs, bandSeams },
  );
  const tagTops = [...placed.values()].flatMap((p) => p.rects.map((r) => r.y));
  const bandTop = Math.min(
    Math.min(...rootTops) - ZONE_PAD - ZONE_HEAD,
    ...tagTops.map((y) => y - ZONE_HEAD - 6),
  );

  return { width, height, blocks, edges, columns, bandTop, bandBottom: contentBottom + ZONE_PAD, govBand, chipCounts, blockChipXs, bandSeams };
}

// --- Pin placement -----------------------------------------------------------------
// Chips and tags have deterministic positions computed from the same geometry the renderer
// draws, and the build re-runs these functions to prove nothing lands on top of a block.
// One implementation, imported by both sides, so the check can never drift from the drawing.

export interface PinEdgeGeo {
  midX: number;
  midY: number;
  horizontal: boolean;
  /** Free length along the arrow at the midpoint; when known, badge stacks are shaped to fit it. */
  extent?: number;
}

export const TAG_H = 17;
const TAG_GAP = 20;

/** Numbered mitigation chips: on a block's bottom border, or seated on the flow itself. */
export function chipSpots(
  n: number,
  block?: Rect,
  edge?: PinEdgeGeo,
  /** Precomputed positions along the block's bottom border (layout.blockChipXs). */
  xs?: number[],
): { x: number; y: number }[] {
  if (block) {
    return Array.from({ length: n }, (_, i) => ({ x: xs?.[i] ?? block.x + 16 + i * 24, y: block.y + block.h }));
  }
  if (!edge) return [];
  // A run too short for its chips in a line — two blocks side by side across a column gap —
  // stacks them across the arrow instead, so they sit in the gap rather than on the blocks.
  // On a short vertical run, two or more chips in a column crowd both arrowheads and the tab
  // below: they sit side by side unless the run leaves a gap above and below them.
  const across =
    edge.extent !== undefined &&
    (edge.horizontal || n === 1 ? (n - 1) * 24 + 20 > edge.extent - 12 : (n - 1) * 24 + 20 + 36 > edge.extent);
  const along = edge.horizontal !== across;
  return Array.from({ length: n }, (_, i) => {
    const off = (i - (n - 1) / 2) * 24;
    return along ? { x: edge.midX + off, y: edge.midY } : { x: edge.midX, y: edge.midY + off };
  });
}

/**
 * Which edges each flow gets badged on.
 *
 * Not every leg it walks — only the legs it does not share with another flow. A chokepoint like
 * the AI gateway sits on the model path, the tools path and the egress path by design, so
 * stamping every leg put three and four numbers on the one arrow into it and made the numbering
 * look broken. Badging the divergences instead puts the number where a flow becomes *itself*,
 * and leaves the shared spine quiet — which on the personal agent draws the actual point, that
 * two entrances converge into one pipe the agent cannot tell apart.
 *
 * Selecting a flow still highlights its whole path. Tracing is the highlight's job; the badge's
 * job is to say which flow this arrow belongs to, and on a shared leg there is no answer.
 *
 * A flow with no leg of its own falls back to its last leg so it still appears somewhere. That
 * is a defect the build reports rather than a case worth designing for — see checkFlows.
 */
export function flowBadgeLegs(
  flows: { id: string; path: (string | { follow: string })[] }[],
  resolve: (ref: string) => string | undefined,
): Map<string, string[]> {
  const legs = new Map<string, string[]>();
  for (const f of flows) {
    const keys: string[] = [];
    for (const raw of f.path) {
      const key = resolve(typeof raw === "string" ? raw : raw.follow);
      if (key && !keys.includes(key)) keys.push(key);
    }
    legs.set(f.id, keys);
  }
  const owners = new Map<string, number>();
  for (const keys of legs.values()) for (const k of keys) owners.set(k, (owners.get(k) ?? 0) + 1);

  const out = new Map<string, string[]>();
  for (const f of flows) {
    const keys = legs.get(f.id)!;
    const own = keys.filter((k) => owners.get(k) === 1);
    const chosen = own.length ? own : keys.slice(-1);
    for (const k of chosen) out.set(k, [...(out.get(k) ?? []), f.id]);
  }
  return out;
}

/**
 * The numbered flow badges an edge carries. Both orientations stack the badges in a column,
 * because the space an edge midpoint sits in is a gutter: 44px wide between columns, and a
 * second badge laid alongside the first needs 58. Below the midpoint on a horizontal arrow,
 * beside it on a vertical one — on the right, since risk tags take the left. The first version
 * ran every stack rightward and downward from the midpoint regardless, which walked twenty
 * badges onto the blocks underneath them.
 */
export const FLOW_BADGE_W = 28;
export const FLOW_BADGE_H = 17;
export function flowBadgeSpots(n: number, edge: PinEdgeGeo, blocks?: Rect[]): Rect[] {
  // Beside a vertical arrow the badges stack in a column while the arrow has room for it. A
  // short vertical arrow between two stacked blocks has only the row gap to spend, so there
  // the stack turns into rows of three, which still stop short of the next column's blocks.
  const perRow = !edge.horizontal && edge.extent !== undefined && n * 21 - 4 > edge.extent - 12 ? 3 : 1;
  const rows = Math.ceil(n / perRow);
  const spots = (flip: boolean, onLine = false) =>
    Array.from({ length: n }, (_, i) =>
      edge.horizontal
        ? {
            x: onLine ? edge.midX - FLOW_BADGE_W / 2 + (i - (n - 1) / 2) * (FLOW_BADGE_W + 4) : edge.midX - 14,
            y: onLine ? edge.midY - FLOW_BADGE_H / 2 : flip ? edge.midY - 16 - FLOW_BADGE_H - i * 21 : edge.midY + 16 + i * 21,
            w: FLOW_BADGE_W,
            h: FLOW_BADGE_H,
          }
        : {
            x: onLine ? edge.midX - FLOW_BADGE_W / 2 : flip ? edge.midX - 12 - FLOW_BADGE_W - (i % perRow) * 30 : edge.midX + 12 + (i % perRow) * 30,
            y: onLine ? edge.midY - (n * 21 - 4) / 2 + i * 21 : edge.midY - (rows * 21 - 4) / 2 + Math.floor(i / perRow) * 21,
            w: FLOW_BADGE_W,
            h: FLOW_BADGE_H,
          },
    );
  // Below a horizontal arrow and right of a vertical one, unless a block is there and the other
  // side is clear — a bend that runs along a block's border has no room on the block's side.
  // Blocks around the arrow's midpoint (the containers it runs inside) never count.
  const near = (blocks ?? []).filter(
    (b) => !(edge.midX > b.x && edge.midX < b.x + b.w && edge.midY > b.y && edge.midY < b.y + b.h),
  );
  const blocked = (rs: Rect[]) =>
    rs.some((r) => near.some((b) => r.x < b.x + b.w - 2 && r.x + r.w > b.x + 2 && r.y < b.y + b.h - 2 && r.y + r.h > b.y + 2));
  const usual = spots(false);
  if (!blocked(usual)) return usual;
  const other = spots(true);
  if (!blocked(other)) return other;
  // A run through a narrow gutter has no room beside it: the numbers sit on the line itself.
  const onLine = spots(false, true);
  return blocked(onLine) ? usual : onLine;
}

/** Split our own "M x y L x y ..." path data into its axis-aligned segments. */
function segmentsOf(d: string): { x0: number; y0: number; x1: number; y1: number }[] {
  const nums = d.match(/-?[\d.]+/g)!.map(Number);
  const segs: { x0: number; y0: number; x1: number; y1: number }[] = [];
  for (let i = 0; i + 3 < nums.length; i += 2) {
    segs.push({ x0: nums[i], y0: nums[i + 1], x1: nums[i + 2], y1: nums[i + 3] });
  }
  return segs;
}

/**
 * Where an arrow's pins attach. Not the geometric middle of the path: on a bent route that is
 * the corner or the short leg, and on an arrow leaving a nested block it is inside the
 * container, on top of the container's items — which is where the hosted-sessions drawing
 * first put two risk tags. The pin segment is the longest piece of the path that lies outside
 * every container the arrow starts or ends in; the midpoint of that piece is where chips,
 * tags and step badges sit, and its length is the room they have.
 */
function pinSegment(
  d: string,
  containers: Rect[],
  bandGaps: [number, number][] = [],
  seamRooms: [number, number][] = [],
): { midX: number; midY: number; horizontal: boolean; extent: number; lo: number; hi: number } {
  type Piece = { horizontal: boolean; at: number; lo: number; hi: number };
  const pieces: Piece[] = [];
  const raw: Piece[] = [];
  for (const s of segmentsOf(d)) {
    const horizontal = Math.abs(s.y1 - s.y0) < 0.5;
    const at = horizontal ? s.y0 : s.x0;
    const lo = horizontal ? Math.min(s.x0, s.x1) : Math.min(s.y0, s.y1);
    const hi = horizontal ? Math.max(s.x0, s.x1) : Math.max(s.y0, s.y1);
    if (hi - lo < 0.5) continue;
    raw.push({ horizontal, at, lo, hi });
    // Subtract every container's span along the segment's axis.
    let spans: [number, number][] = [[lo, hi]];
    for (const r of containers) {
      const crosses = horizontal ? r.y <= at && at <= r.y + r.h : r.x <= at && at <= r.x + r.w;
      if (!crosses) continue;
      const c0 = horizontal ? r.x : r.y;
      const c1 = horizontal ? r.x + r.w : r.y + r.h;
      spans = spans.flatMap(([a, b]) => {
        if (c1 <= a || c0 >= b) return [[a, b] as [number, number]];
        const out: [number, number][] = [];
        if (c0 > a) out.push([a, c0]);
        if (c1 < b) out.push([c1, b]);
        return out;
      });
    }
    for (const [a, b] of spans) if (b - a > 8) pieces.push({ horizontal, at, lo: a, hi: b });
  }
  // Pins stay out of the strip where two bands meet whenever the arrow has a fair run elsewhere:
  // a horizontal piece loses the strips it crosses, and a vertical piece inside one is set aside.
  // An arrow that only hops the gap keeps its pins there, centred, where the gap is widened for them.
  const clean = pieces.flatMap((p) => {
    if (!p.horizontal) return bandGaps.some(([g0, g1]) => p.at > g0 && p.at < g1) ? [] : [p];
    let spans: [number, number][] = [[p.lo, p.hi]];
    for (const [g0, g1] of bandGaps) {
      spans = spans.flatMap(([a, b]) => (g1 <= a || g0 >= b ? [[a, b] as [number, number]] : ([[a, Math.min(b, g0)], [Math.max(a, g1), b]] as [number, number][]).filter(([x, y]) => y - x > 8)));
    }
    return spans.map(([lo, hi]) => ({ ...p, lo, hi }));
  });
  const longest = (ps: Piece[]) => ps.reduce((m, p) => (p.hi - p.lo > m.hi - m.lo ? p : m), ps[0]);
  const pool = pieces.length ? pieces : raw;
  const tidy = clean.length ? longest(clean) : undefined;
  const best = tidy && tidy.hi - tidy.lo >= 60 ? tidy : longest(pool);
  // An arrow that only hops a seam keeps its pins in the room widened for them beside it, clear
  // of the band border and of the arrowhead — or, where the seam was not widened, in the middle
  // of the gap — not the middle of the whole run, which a narrow figure column pulls onto the seam.
  const room = best !== tidy && best.horizontal ? seamRooms.find(([x0, x1]) => x0 >= best.lo - 0.5 && x1 <= best.hi + 0.5) : undefined;
  if (room) {
    const [x0, x1] = room;
    return { midX: (x0 + x1) / 2, midY: best.at, horizontal: true, extent: x1 - x0 - 24, lo: best.lo, hi: best.hi };
  }
  const hop = best !== tidy && best.horizontal ? bandGaps.find(([g0, g1]) => g0 >= best.lo && g1 <= best.hi) : undefined;
  if (hop) {
    const [g0, g1] = hop;
    const midX = (g0 + g1) / 2;
    return { midX, midY: best.at, horizontal: true, extent: Math.min(g1 - g0 - 24, best.hi - best.lo), lo: best.lo, hi: best.hi };
  }
  const mid = (best.lo + best.hi) / 2;
  return best.horizontal
    ? { midX: mid, midY: best.at, horizontal: true, extent: best.hi - best.lo, lo: best.lo, hi: best.hi }
    : { midX: best.at, midY: mid, horizontal: false, extent: best.hi - best.lo, lo: best.lo, hi: best.hi };
}

/** Tags per row above a block, and the width the build assumes for a coded tag ("R07"). */
export const TAGS_PER_ROW = 4;
export const TAG_W_EST = 32;
const TAG_X_GAP = 6;

export interface TagPlacement {
  rects: Rect[];
  /** A short line tying the tags to what they tag; renderers may draw it or not. */
  leader: string;
}

/**
 * Risk tags for every pinned block and arrow, placed together so they can be aligned with
 * each other rather than each finding its own spot.
 *
 * - A block's tags form a row along its top edge, just above the title tab, left-aligned with
 *   the block and wrapping upward past TAGS_PER_ROW. A row reads as part of the block; the
 *   tower the first version stacked off one corner read as something floating beside it.
 * - A horizontal arrow's tags form a row above its pin segment, centred on it.
 * - A vertical arrow's tags stack beside it, right-aligned to the left gutter of the column
 *   the arrow runs in, so every stack in that gutter shares one edge. Stacks that would
 *   overlap — two arrows into the same block, a few pixels apart in their lanes — are merged
 *   into one column ordered top to bottom, which is what turned a staircase of tags into a
 *   list.
 *
 * One implementation for both renderers and the build's collision check, so the check can
 * never drift from the drawing.
 */
export function placeTags(
  groups: { at: string; widths: number[] }[],
  layout: Pick<ArchLayout, "blocks" | "edges" | "columns" | "chipCounts" | "blockChipXs" | "bandSeams">,
): Map<string, TagPlacement> {
  const out = new Map<string, TagPlacement>();
  // What a tag beside an arrow must keep clear of: blocks and their title tabs, every chip, the
  // tags already placed, the seams between bands, and (by 8px) every other arrow's line.
  const meets = (a: Rect, b: Rect, m = 0) => a.x < b.x + b.w + m && a.x + a.w > b.x - m && a.y < b.y + b.h + m && a.y + a.h > b.y - m;
  const chipRects = Object.entries(layout.chipCounts ?? {}).flatMap(([at, n]) => {
    const block = layout.blocks[at];
    const e = block ? undefined : layout.edges.find((x) => `${x.from}->${x.to}` === at);
    return chipSpots(n, block, e, layout.blockChipXs?.[at]).map((sp) => ({ x: sp.x - 10, y: sp.y - 10, w: 20, h: 20 }));
  });
  const placedRects: Rect[] = [];
  type Sg = { x0: number; y0: number; x1: number; y1: number };
  const gapTo = (r: Rect, sgs: Sg[]) =>
    Math.min(
      Infinity,
      ...sgs.map((sg) =>
        Math.hypot(
          Math.max(Math.min(sg.x0, sg.x1) - (r.x + r.w), r.x - Math.max(sg.x0, sg.x1), 0),
          Math.max(Math.min(sg.y0, sg.y1) - (r.y + r.h), r.y - Math.max(sg.y0, sg.y1), 0),
        ),
      ),
    );
  const others = (e: ArchLayout["edges"][number]) => layout.edges.filter((o) => o !== e).flatMap((o) => segmentsOf(o.d));
  const nearLine = (e: ArchLayout["edges"][number] | undefined, rs: Rect[], m: number) =>
    layout.edges.some(
      (o) =>
        o !== e &&
        segmentsOf(o.d).some((sg) =>
          rs.some((r) => meets(r, { x: Math.min(sg.x0, sg.x1), y: Math.min(sg.y0, sg.y1), w: Math.abs(sg.x1 - sg.x0), h: Math.abs(sg.y1 - sg.y0) }, m)),
        ),
    );
  const edgeOf = (ref: string) =>
    layout.edges.find((e) => `${e.from}->${e.to}` === ref) ??
    layout.edges.find((e) => `${e.to}->${e.from}` === ref);
  const rowsUp = (widths: number[], left: number, right: number, firstRowY: number, align: "left" | "centre", centreX = 0) => {
    // Pack left to right; wrap upward when the next tag would pass the right limit.
    const rows: number[][] = [[]];
    let x = 0;
    for (const w of widths) {
      const cur = rows[rows.length - 1];
      if (cur.length && x + w > right - left) {
        rows.push([]);
        x = 0;
      }
      rows[rows.length - 1].push(w);
      x += w + TAG_X_GAP;
    }
    const rects: Rect[] = [];
    rows.forEach((row, ri) => {
      const rowW = row.reduce((a, w) => a + w, 0) + TAG_X_GAP * (row.length - 1);
      let rx = align === "left" ? left : centreX - rowW / 2;
      // Wraps upward from the arrow or tab, but reads top-down: the first tags take the top row.
      const y = firstRowY - (rows.length - 1 - ri) * TAG_GAP;
      for (const w of row) {
        rects.push({ x: rx, y, w, h: TAG_H });
        rx += w + TAG_X_GAP;
      }
    });
    return rects;
  };

  type Stack = { at: string; widths: number[]; side: "l" | "r" | "c"; xEdge: number; midX: number; midY: number };
  const stacks: Stack[] = [];
  // Blocks first, then horizontal arrows, then vertical ones, which fit around the rest.
  const rank = (at: string) => (layout.blocks[at] ? 0 : edgeOf(at)?.horizontal ? 1 : 2);
  for (const g of [...groups].sort((x, y) => rank(x.at) - rank(y.at))) {
    const block = layout.blocks[g.at];
    if (block) {
      // Left-aligned with the block, unless an arrow leaving its top (or that arrow's chips)
      // runs through the row: then the row starts just past the line, or ends at the block's
      // right edge.
      const y0 = block.y - TAB_H / 2 - 4 - TAG_H;
      const row = (x0: number) => rowsUp(g.widths, x0, Math.max(block.x + block.w + 2, x0 + TAG_W_EST), y0, "left");
      const lines = layout.edges.flatMap((o) =>
        segmentsOf(o.d).filter((sg) => Math.abs(sg.x0 - sg.x1) < 0.5 && sg.x0 > block.x - 20 && sg.x0 < block.x + block.w + 20 && Math.min(sg.y0, sg.y1) < y0 + TAG_H + 8 && Math.max(sg.y0, sg.y1) > y0 - 8).map((sg) => sg.x0),
      );
      const free = (rs: Rect[]) => !nearLine(undefined, rs, 8) && !chipRects.some((c) => rs.some((r) => meets(r, c, 8)));
      const rowW = g.widths.reduce((a, w) => a + w, 0) + TAG_X_GAP * (g.widths.length - 1);
      const starts = [block.x, block.x + block.w + 2 - rowW, ...lines.map((x) => x + 14)];
      const rects = starts.map(row).find(free) ?? row(block.x);
      out.set(g.at, { rects, leader: "" });
      placedRects.push(...rects);
      continue;
    }
    const e = edgeOf(g.at);
    if (!e) {
      out.set(g.at, { rects: [], leader: "" });
      continue;
    }
    if (e.horizontal) {
      // As wide as the run allows (two tags fit a widened gap), narrower if that meets a seam.
      // The band borders themselves, not the clear gap between them, which a tag may sit in.
      const seamRects = (layout.bandSeams ?? []).flatMap(([l, r]) => [l, r].map((x) => ({ x: x - 3, y: -1e5, w: 6, h: 2e5 })));
      const wide = Math.max(e.extent / 2 - 3, TAG_W_EST);
      const wideRow = rowsUp(g.widths, e.midX - wide, e.midX + wide, 0, "centre", e.midX);
      const half = wideRow.some((r) => seamRects.some((b) => meets(r, b))) ? Math.max(e.extent / 2 - 8, TAG_W_EST) : wide;
      // Tags rise from just above the arrow's own chips — a short run stacks its chips across
      // the line, and a tag row at a fixed offset landed on them.
      const nChips = layout.chipCounts?.[g.at] ?? 0;
      const chipYs = nChips ? chipSpots(nChips, undefined, e).map((sp) => sp.y) : [];
      const chipTop = chipYs.length ? Math.min(...chipYs) - 10 : e.midY - 4;
      const above = rowsUp(g.widths, e.midX - half, e.midX + half, chipTop - 4 - TAG_H, "centre", e.midX);
      // Above the arrow unless that sits on another arrow and below is clear: two arrows into
      // one block run close together, and the upper one's tags would cover the lower one's line.
      // Near another arrow reads as that arrow's tags, not only on it: keep 8px clear, and sit
      // clearly (8px) nearer this arrow than any other.
      const onOther = (rs: Rect[]) => nearLine(e, rs, 8) || rs.some((r) => gapTo(r, others(e)) < gapTo(r, segmentsOf(e.d)) + 8);
      let rects = above;
      if (onOther(above)) {
        const chipBottom = chipYs.length ? Math.max(...chipYs) + 10 : e.midY + 4;
        // Moved, not mirrored: the first row stays on top, now nearest the line.
        const minY = Math.min(...above.map((r) => r.y));
        const below = above.map((r) => ({ ...r, y: chipBottom + 4 + (r.y - minY) }));
        if (!onOther(below)) rects = below;
      }
      const flipped = rects !== above;
      const edgeY = flipped ? Math.min(...rects.map((r) => r.y)) : Math.max(...rects.map((r) => r.y + r.h));
      out.set(g.at, { rects, leader: flipped ? `M ${e.midX} ${edgeY - 1} L ${e.midX} ${e.midY + 5}` : `M ${e.midX} ${edgeY + 1} L ${e.midX} ${e.midY - 5}` });
      placedRects.push(...rects);
      continue;
    }
    // Vertical: right beside the arrow, clear of its own chips — left of it, or right when the
    // left is taken — in a column, or in pairs when the run is too short for a column. Tags
    // parked in the column's gutter, 130px and more from their arrow, read as some other
    // arrow's or the neighbouring block's.
    {
      const nChips = layout.chipCounts?.[g.at] ?? 0;
      const chips = nChips ? chipSpots(nChips, undefined, e) : [];
      const reach = chips.length ? Math.max(...chips.map((c) => Math.abs(c.x - e.midX))) + 10 : 0;
      const perRow = g.widths.length * TAG_GAP - (TAG_GAP - TAG_H) <= e.extent - 24 ? 1 : 2;
      const rows: number[][] = [];
      g.widths.forEach((w, i) => (i % perRow ? rows[rows.length - 1].push(w) : rows.push([w])));
      const beside = (side: "l" | "r") => {
        const rects: Rect[] = [];
        let y = e.midY - (rows.length * TAG_GAP - (TAG_GAP - TAG_H)) / 2;
        for (const row of rows) {
          const rowW = row.reduce((a, w) => a + w, 0) + TAG_X_GAP * (row.length - 1);
          let x = side === "l" ? e.midX - reach - 6 - rowW : e.midX + reach + 6;
          for (const w of row) {
            rects.push({ x, y, w, h: TAG_H });
            x += w + TAG_X_GAP;
          }
          y += TAG_GAP;
        }
        return rects;
      };
      const solid = Object.values(layout.blocks)
        .filter((b) => !(e.midX > b.x && e.midX < b.x + b.w && e.midY > b.y && e.midY < b.y + b.h))
        .map((b) => ({ x: b.x, y: b.y - TAB_TOP, w: b.w, h: b.h + TAB_TOP }));
      const seams = (layout.bandSeams ?? []).map(([l, r]) => ({ x: l - 3, y: -1e5, w: r - l + 6, h: 2e5 }));
      const clear = (rs: Rect[]) =>
        !rs.some((r) => [...solid, ...seams].some((b) => meets(r, b, 2)) || [...chipRects, ...placedRects].some((b) => meets(r, b, 1))) &&
        !nearLine(e, rs, 8);
      const pick = [beside("l"), beside("r")].find(clear);
      if (pick) {
        out.set(g.at, { rects: pick, leader: "" });
        placedRects.push(...pick);
        continue;
      }
    }
    // Otherwise snap the stack to the nearer gutter of the arrow's column — right-aligned to
    // the left gutter or left-aligned to the right one — so every stack in a gutter shares one
    // edge. An arrow running inside a container (child to child) or far from both gutters
    // keeps its tags just left of itself instead.
    const col = (layout.columns ?? []).find((c) => c.w > 0 && e.midX >= c.x - 8 && e.midX <= c.x + c.w + 8);
    const inside = Object.entries(layout.blocks).some(
      ([id, r]) => id !== e.from && id !== e.to && r.x < e.midX && e.midX < r.x + r.w && r.y < e.midY && e.midY < r.y + r.h,
    );
    let side: "l" | "r" | "c" = "l";
    let xEdge = e.midX - 14;
    // A run down the gap between two columns has a block on each side and room between them
    // for a tag on the line itself.
    if (!col && !inside) {
      side = "c";
      xEdge = e.midX;
    } else if (col && !inside) {
      const left = e.midX - (col.x - 6);
      const right = col.x + col.w + 6 - e.midX;
      if (left >= 14 && left <= right && left <= 160) xEdge = col.x - 6;
      else if (right >= 14 && right <= 160) {
        side = "r";
        xEdge = col.x + col.w + 6;
      }
    }
    stacks.push({ at: g.at, widths: g.widths, side, xEdge, midX: e.midX, midY: e.midY });
  }

  // Lay each vertical stack centred on its arrow, then merge the ones that would overlap in
  // the same gutter into one column, ordered by where their arrows sit.
  const stackH = (n: number) => n * TAG_GAP - (TAG_GAP - TAG_H);
  type Laid = { stack: Stack; top: number; h: number };
  const laid: Laid[] = stacks.map((st) => ({ stack: st, top: st.midY - stackH(st.widths.length) / 2, h: stackH(st.widths.length) }));
  const clusters: Laid[][] = [];
  for (const l of laid.sort((a, b) => a.top - b.top)) {
    const home = clusters.find((c) =>
      c.some(
        (m) =>
          m.stack.side === l.stack.side &&
          Math.abs(m.stack.xEdge - l.stack.xEdge) <= 4 &&
          l.top < m.top + m.h + 4 &&
          m.top < l.top + l.h + 4,
      ),
    );
    if (home) home.push(l);
    else clusters.push([l]);
  }
  for (const c of clusters) {
    c.sort((a, b) => a.stack.midY - b.stack.midY);
    const total = c.reduce((a, m) => a + m.stack.widths.length, 0);
    const centre = c.reduce((a, m) => a + m.stack.midY, 0) / c.length;
    const { side, xEdge } = c[0].stack;
    let y = centre - stackH(total) / 2;
    for (const m of c) {
      const rects = m.stack.widths.map((w) => {
        const r = { x: side === "l" ? xEdge - w : side === "c" ? xEdge - w / 2 : xEdge, y, w, h: TAG_H };
        y += TAG_GAP;
        return r;
      });
      const near = side === "l" ? xEdge + 1 : xEdge - 1;
      const far = side === "l" ? m.stack.midX - 5 : m.stack.midX + 5;
      out.set(m.stack.at, { rects, leader: side === "c" ? "" : `M ${near} ${m.stack.midY} L ${far} ${m.stack.midY}` });
    }
  }
  return out;
}
