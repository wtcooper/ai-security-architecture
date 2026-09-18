/**
 * Build-time geometry for the flow-style reference architectures.
 *
 * The grammar is F5's: capability blocks on a coarse authored grid, connected by orthogonal
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
const COL_W = 176;
const COL_GAP = 44;
/** Tall enough for a vertical run carrying three stacked risk tags to clear the tab below it. */
const ROW_GAP = 62;
const MARGIN_X = 18;
/** Room above the first row for tabs and risk-tag stacks; grown further when a stack is deep. */
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 32;

export const TAB_H = 20;
/** Band chrome, shared with both renderers so a band's rect can be derived here. */
export const ZONE_PAD = 16;
export const ZONE_HEAD = 30;
/** Clear space between two bands: the column gap less the pad each band adds inside it. */
const BAND_GAP = COL_GAP - ZONE_PAD * 2;
/** Items pack two per row inside a standard block. */
const ITEM_H = 50;
const BLOCK_PAD_TOP = 16;
const BLOCK_PAD_BOTTOM = 12;
const ACTOR_H = 66;

/** How tall a block wants to be, before row heights are settled. */
function naturalHeight(block: ArchBlock): number {
  if (block.kind === "actor" || block.kind === "origin") return ACTOR_H;
  const items = block.items?.length ?? 0;
  // A call-out block — an icon plus the chip numbers of the controls it delivers — needs room
  // for both. Governance-band services are drawn this way.
  if (!items && block.icon) return 78;
  if (!items) return 58;
  // Tall side columns stack items vertically, one per row; everything else packs two across.
  const stacked = (block.rowSpan ?? 1) > 1;
  const rows = stacked ? items : Math.ceil(items / 2);
  return TAB_H / 2 + BLOCK_PAD_TOP + rows * ITEM_H + BLOCK_PAD_BOTTOM;
}

/** Where items sit inside a block. Client-side rendering calls this too, so it lives here. */
export function itemCells(block: ArchBlock, rect: Rect): Rect[] {
  const items = block.items ?? [];
  const stacked = (block.rowSpan ?? 1) > 1;
  const perRow = stacked ? 1 : 2;
  const top = rect.y + TAB_H / 2 + BLOCK_PAD_TOP;
  return items.map((_, i) => {
    const r = Math.floor(i / perRow);
    const c = i % perRow;
    const inRow = Math.min(perRow, items.length - r * perRow);
    const cellW = (rect.w - 16) / inRow;
    return { x: rect.x + 8 + c * cellW, y: top + r * ITEM_H, w: cellW, h: ITEM_H };
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
const NEST_HEAD = 34;
/** An anonymous origin draws as a figure the size of an actor: an icon in a dashed ring. */
const ORIGIN_W = 64;

type Placed = { block: ArchBlock; w: number; h: number; kids: Placed[]; inner?: GridResult };
type GridResult = {
  width: number;
  height: number;
  /** Position of each member relative to the grid's own origin. */
  at: Map<string, Rect>;
  colX: number[];
  colW: number[];
};

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
function gridLayout(items: Placed[]): GridResult {
  if (!items.length) return { width: 0, height: 0, at: new Map(), colX: [], colW: [] };
  const cols = Math.max(...items.map((p) => p.block.col)) + 1;
  const rows = Math.max(...items.map((p) => p.block.row + (p.block.rowSpan ?? 1) - 1)) + 1;

  const used = { col: new Set<number>(), row: new Set<number>() };
  for (const p of items) {
    used.col.add(p.block.col);
    for (let r = p.block.row; r < p.block.row + (p.block.rowSpan ?? 1); r++) used.row.add(r);
  }

  const colW = Array.from({ length: cols }, (_, c) =>
    used.col.has(c) ? Math.max(COL_W, ...items.filter((p) => p.block.col === c).map((p) => p.w)) : 0,
  );
  const rowH: number[] = Array.from({ length: rows }, (_, r) => (used.row.has(r) ? 52 : 0));
  for (const p of items) {
    if ((p.block.rowSpan ?? 1) === 1) rowH[p.block.row] = Math.max(rowH[p.block.row], p.h);
  }
  for (const p of items) {
    const span = p.block.rowSpan ?? 1;
    if (span === 1) continue;
    const gaps = ROW_GAP * (span - 1);
    const have = rowH.slice(p.block.row, p.block.row + span).reduce((s, h) => s + h, 0) + gaps;
    if (p.h > have) rowH[p.block.row + span - 1] += p.h - have;
  }

  const colX: number[] = [];
  let x = 0;
  for (let c = 0; c < cols; c++) {
    colX.push(x);
    if (colW[c]) x += colW[c] + COL_GAP;
  }
  const rowY: number[] = [];
  let y = 0;
  for (let r = 0; r < rows; r++) {
    rowY.push(y);
    if (rowH[r]) y += rowH[r] + ROW_GAP;
  }

  const at = new Map<string, Rect>();
  for (const p of items) {
    const span = p.block.rowSpan ?? 1;
    const spanH =
      rowH.slice(p.block.row, p.block.row + span).reduce((s, h) => s + h, 0) + ROW_GAP * (span - 1);
    const h = span > 1 ? Math.max(p.h, spanH) : p.h;
    const top = span > 1 ? rowY[p.block.row] : rowY[p.block.row] + (rowH[p.block.row] - h) / 2;
    // Narrow things (an actor figure, an anonymous origin) centre in their column so flows
    // attach to the figure rather than to the edge of an invisible full-width cell.
    at.set(p.block.id, { x: colX[p.block.col] + (colW[p.block.col] - p.w) / 2, y: top, w: p.w, h });
  }
  return {
    width: x ? x - COL_GAP : 0,
    height: y ? y - ROW_GAP : 0,
    at,
    colX,
    colW,
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
  const itemsHeight = (b: ArchBlock) => (b.items?.length ? naturalHeight(b) - TAB_H / 2 : 0);
  const measure = (b: ArchBlock): Placed => {
    const kids = (kidsOf.get(b.id) ?? []).map(measure);
    if (!kids.length) return { block: b, w: blockWidth(b), h: naturalHeight(b), kids };
    const inner = gridLayout(kids);
    return {
      block: b,
      w: Math.max(inner.width + NEST_PAD * 2, blockWidth(b)),
      h: NEST_HEAD + itemsHeight(b) + inner.height + NEST_PAD,
      kids,
      inner,
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
  const top = gridLayout(roots);

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
      if (p.inner) place(p.kids, p.inner, abs.x + NEST_PAD, abs.y + NEST_HEAD + itemsHeight(p.block));
    }
  };
  place(roots, top, MARGIN_X, marginTop);

  // --- Governance plane ---------------------------------------------------------------
  // The control plane is a band beneath the ownership bands: exactly as wide as they are
  // together, and separated from them by the same gutter adjacent vertical bands have. Its
  // call-outs are spaced across that width by the engine, in authored order (row, then col),
  // wrapping to a second line when the drawing is narrower than the call-outs side by side.
  // Deriving the band from the content rather than from its own members is what stops it
  // overhanging a narrow drawing, falling short of a wide one, or sitting on the bands above.
  const contentBottom = roots.length
    ? Math.max(...roots.map((p) => blocks[p.block.id].y + blocks[p.block.id].h))
    : marginTop;
  let govBand: Rect | undefined;
  let bottom = contentBottom;
  if (govRoots.length) {
    const bandY = contentBottom + ZONE_PAD + BAND_GAP;
    const perRow = Math.max(1, Math.floor((top.width + COL_GAP) / (COL_W + COL_GAP)));
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
      y += lineH + ROW_GAP;
    }
    bottom = y - ROW_GAP + ZONE_PAD;
    govBand = { x: MARGIN_X - ZONE_PAD, y: bandY, w: top.width + ZONE_PAD * 2, h: bottom - bandY };
  }

  const width = MARGIN_X * 2 + top.width;
  const height = bottom + MARGIN_BOTTOM;
  // Column extents let the renderer derive band rects from the grid rather than from member
  // rects, so a band holding only a narrow actor no longer leaves a gutter beside it.
  const columns = top.colX.map((x, i) => ({ x: MARGIN_X + x, w: top.colW[i] }));

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
    let kind: "h" | "v" | "vh" | "hv";
    let aSide: Side;
    let bSide: Side;
    if (yOv) {
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
    if (side === "t" || side === "b") {
      const level = Math.abs(dx) < 24;
      const group = level ? 1 : dx < 0 ? 0 : 2;
      const outerFirst = side === "t" ? dx > 0 : dx < 0;
      const within = level ? dx : outerFirst ? dy : -dy;
      return group * 1e6 + within;
    }
    const level = Math.abs(dy) < 24;
    const group = level ? 1 : dy < 0 ? 0 : 2;
    const outerFirst = side === "r" ? dy > 0 : dy < 0;
    const within = level ? dy : outerFirst ? -dx : dx;
    return group * 1e6 + within;
  };
  const parentOf = new Map(arch.blocks.filter((b) => b.parent).map((b) => [b.id, b.parent!]));
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
    const add = (blockId: string, side: Side, self: Rect, other: Rect, end: "a" | "b") => {
      const k = `${blockId}|${side}`;
      const list = sideLists.get(k) ?? [];
      list.push({ ref: `${i}|${end}`, sort: laneKey(side, self, other) });
      sideLists.set(k, list);
    };
    add(p.e.from, p.aSide, p.a, p.b, "a");
    add(p.e.to, p.bSide, p.b, p.a, "b");
    const outerA = exitsThrough(p.e.from, p.e.to);
    if (outerA) add(outerA, p.aSide, blocks[outerA], p.b, "a");
    const outerB = exitsThrough(p.e.to, p.e.from);
    if (outerB) add(outerB, p.bSide, blocks[outerB], p.a, "b");
  });
  const slot = new Map<string, { idx: number; total: number }>();
  for (const [k, list] of sideLists) {
    list.sort((x, y) => x.sort - y.sort);
    list.forEach((entry, idx) => slot.set(`${k}|${entry.ref}`, { idx, total: list.length }));
  }
  const anchorAt = (blockId: string, side: Side, r: Rect, i: number, end: "a" | "b", outer?: string) => {
    const s = slot.get(`${blockId}|${side}|${i}|${end}`) ?? { idx: 0, total: 1 };
    let f = (s.idx + 1) / (s.total + 1);
    // Position along the side comes from the container's lane, clamped onto the child so the
    // line still starts on the block it belongs to.
    let along = r;
    if (outer) {
      const o = slot.get(`${outer}|${side}|${i}|${end}`);
      if (o) {
        f = (o.idx + 1) / (o.total + 1);
        along = blocks[outer];
      }
    }
    const clampX = (x: number) => Math.min(Math.max(x, r.x + 12), r.x + r.w - 12);
    const clampY = (y: number) => Math.min(Math.max(y, r.y + 12), r.y + r.h - 12);
    if (side === "t") return { x: clampX(along.x + along.w * f), y: r.y };
    if (side === "b") return { x: clampX(along.x + along.w * f), y: r.y + r.h };
    if (side === "l") return { x: r.x, y: clampY(along.y + along.h * f) };
    return { x: r.x + r.w, y: clampY(along.y + along.h * f) };
  };

  const edges = plans.map((p, i) => {
    const { e, a, b, kind, aSide, bSide } = p;
    const A = anchorAt(e.from, aSide, a, i, "a", exitsThrough(e.from, e.to));
    const B = anchorAt(e.to, bSide, b, i, "b", exitsThrough(e.to, e.from));
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
    const seg = pinSegment(d, containers);
    // A shallow Z between two facing blocks pins on its middle jog, which runs across the
    // edge's direction. Pins are laid out relative to the edge's direction there — beside the
    // jog, in the gap between the blocks — not relative to the jog itself, which would put a
    // badge stack under a horizontal jog and onto the block beneath it.
    const isZ = (kind === "h" || kind === "v") && segmentsOf(d).length === 3;
    return { from: e.from, to: e.to, d, ...seg, horizontal: isZ ? kind === "h" : seg.horizontal };
  });

  // Where the ownership bands start. Derived here rather than in each renderer because it is
  // not simply "above the topmost block": a risk-tag row rises out of its block or its arrow
  // and must stay inside the band that owns it, so the band's top is whichever sits higher.
  // Computed from the placed tags themselves — the same placement the renderers draw — rather
  // than from a formula that has to be kept in step with it.
  const rootTops = roots.map((p) => blocks[p.block.id].y);
  const placed = placeTags(
    [...tagsOn.entries()].map(([at, n]) => ({ at, widths: Array.from({ length: n }, () => TAG_W_EST) })),
    { blocks, edges, columns },
  );
  const tagTops = [...placed.values()].flatMap((p) => p.rects.map((r) => r.y));
  const bandTop = Math.min(
    Math.min(...rootTops) - ZONE_PAD - ZONE_HEAD,
    ...tagTops.map((y) => y - ZONE_HEAD - 6),
  );

  return { width, height, blocks, edges, columns, bandTop, govBand };
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

/** Numbered capability chips: on a block's bottom border, or seated on the flow itself. */
export function chipSpots(
  n: number,
  block?: Rect,
  edge?: PinEdgeGeo,
): { x: number; y: number }[] {
  if (block) {
    return Array.from({ length: n }, (_, i) => ({ x: block.x + 16 + i * 24, y: block.y + block.h }));
  }
  if (!edge) return [];
  return Array.from({ length: n }, (_, i) => {
    const off = (i - (n - 1) / 2) * 24;
    return edge.horizontal
      ? { x: edge.midX + off, y: edge.midY }
      : { x: edge.midX, y: edge.midY + off };
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
export function flowBadgeSpots(n: number, edge: PinEdgeGeo): Rect[] {
  // Beside a vertical arrow the badges stack in a column while the arrow has room for it. A
  // short vertical arrow between two stacked blocks has only the row gap to spend, so there
  // the stack turns into rows of three, which still stop short of the next column's blocks.
  const perRow = !edge.horizontal && edge.extent !== undefined && n * 21 - 4 > edge.extent - 12 ? 3 : 1;
  const rows = Math.ceil(n / perRow);
  return Array.from({ length: n }, (_, i) =>
    edge.horizontal
      ? { x: edge.midX - 14, y: edge.midY + 16 + i * 21, w: FLOW_BADGE_W, h: FLOW_BADGE_H }
      : {
          x: edge.midX + 12 + (i % perRow) * 30,
          y: edge.midY - (rows * 21 - 4) / 2 + Math.floor(i / perRow) * 21,
          w: FLOW_BADGE_W,
          h: FLOW_BADGE_H,
        },
  );
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
): { midX: number; midY: number; horizontal: boolean; extent: number } {
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
  const pool = pieces.length ? pieces : raw;
  const best = pool.reduce((m, p) => (p.hi - p.lo > m.hi - m.lo ? p : m), pool[0]);
  const mid = (best.lo + best.hi) / 2;
  return best.horizontal
    ? { midX: mid, midY: best.at, horizontal: true, extent: best.hi - best.lo }
    : { midX: best.at, midY: mid, horizontal: false, extent: best.hi - best.lo };
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
  layout: { blocks: Record<string, Rect>; edges: ArchLayout["edges"]; columns?: { x: number; w: number }[] },
): Map<string, TagPlacement> {
  const out = new Map<string, TagPlacement>();
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
      const y = firstRowY - ri * TAG_GAP;
      for (const w of row) {
        rects.push({ x: rx, y, w, h: TAG_H });
        rx += w + TAG_X_GAP;
      }
    });
    return rects;
  };

  type Stack = { at: string; widths: number[]; side: "l" | "r"; xEdge: number; midX: number; midY: number };
  const stacks: Stack[] = [];
  for (const g of groups) {
    const block = layout.blocks[g.at];
    if (block) {
      const rects = rowsUp(g.widths, block.x, block.x + block.w + 2, block.y - TAB_H / 2 - 4 - TAG_H, "left");
      out.set(g.at, { rects, leader: "" });
      continue;
    }
    const e = edgeOf(g.at);
    if (!e) {
      out.set(g.at, { rects: [], leader: "" });
      continue;
    }
    if (e.horizontal) {
      const half = Math.max(e.extent / 2 - 8, TAG_W_EST);
      const rects = rowsUp(g.widths, e.midX - half, e.midX + half, e.midY - 8 - TAG_H, "centre", e.midX);
      const bottom = Math.max(...rects.map((r) => r.y + r.h));
      out.set(g.at, { rects, leader: `M ${e.midX} ${bottom + 1} L ${e.midX} ${e.midY - 5}` });
      continue;
    }
    // Vertical: snap the stack to the nearer gutter of the arrow's column — right-aligned to
    // the left gutter or left-aligned to the right one — so every stack in a gutter shares one
    // edge. An arrow running inside a container (child to child) or far from both gutters
    // keeps its tags just left of itself instead.
    const col = (layout.columns ?? []).find((c) => c.w > 0 && e.midX >= c.x - 8 && e.midX <= c.x + c.w + 8);
    const inside = Object.entries(layout.blocks).some(
      ([id, r]) => id !== e.from && id !== e.to && r.x < e.midX && e.midX < r.x + r.w && r.y < e.midY && e.midY < r.y + r.h,
    );
    let side: "l" | "r" = "l";
    let xEdge = e.midX - 14;
    if (col && !inside) {
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
        const r = { x: side === "l" ? xEdge - w : xEdge, y, w, h: TAG_H };
        y += TAG_GAP;
        return r;
      });
      const near = side === "l" ? xEdge + 1 : xEdge - 1;
      const far = side === "l" ? m.stack.midX - 5 : m.stack.midX + 5;
      out.set(m.stack.at, { rects, leader: `M ${near} ${m.stack.midY} L ${far} ${m.stack.midY}` });
    }
  }
  return out;
}
