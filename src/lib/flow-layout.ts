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

const COL_W = 176;
const COL_GAP = 64;
const ROW_GAP = 116;
const MARGIN_X = 22;
/** Room above the first row for tabs and risk-tag stacks. */
const MARGIN_TOP = 68;
const MARGIN_BOTTOM = 48;

export const TAB_H = 20;
/** Items pack two per row inside a standard block. */
const ITEM_H = 50;
const BLOCK_PAD_TOP = 16;
const BLOCK_PAD_BOTTOM = 12;
const ACTOR_H = 66;

/** How tall a block wants to be, before row heights are settled. */
function naturalHeight(block: ArchBlock): number {
  if (block.kind === "actor") return ACTOR_H;
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
  return hi - lo > 24 ? [lo, hi] : null;
};

export function layoutArchetype(arch: Omit<Archetype, "layout">): ArchLayout {
  const cols = Math.max(...arch.blocks.map((b) => b.col)) + 1;
  const rows = Math.max(...arch.blocks.map((b) => b.row + (b.rowSpan ?? 1) - 1)) + 1;
  const width = MARGIN_X * 2 + cols * COL_W + (cols - 1) * COL_GAP;

  // Row heights come from the single-row blocks; spanning blocks then grow their last row if
  // the span still cannot hold them.
  const rowH = Array.from({ length: rows }, () => 64);
  for (const b of arch.blocks) {
    if ((b.rowSpan ?? 1) === 1) rowH[b.row] = Math.max(rowH[b.row], naturalHeight(b));
  }
  for (const b of arch.blocks) {
    const span = b.rowSpan ?? 1;
    if (span === 1) continue;
    const have =
      rowH.slice(b.row, b.row + span).reduce((s, h) => s + h, 0) + ROW_GAP * (span - 1);
    const need = naturalHeight(b) - have;
    if (need > 0) rowH[b.row + span - 1] += need;
  }

  const rowY: number[] = [];
  let y = MARGIN_TOP;
  for (let r = 0; r < rows; r++) {
    rowY.push(y);
    y += rowH[r] + ROW_GAP;
  }
  const height = y - ROW_GAP + MARGIN_BOTTOM;

  const blocks: Record<string, Rect> = {};
  for (const b of arch.blocks) {
    const span = b.rowSpan ?? 1;
    const x = MARGIN_X + b.col * (COL_W + COL_GAP);
    const spanH =
      rowH.slice(b.row, b.row + span).reduce((s, h) => s + h, 0) + ROW_GAP * (span - 1);
    const h = span > 1 ? spanH : naturalHeight(b);
    // Centre a short block in its row; a spanning block takes the whole span.
    const top = span > 1 ? rowY[b.row] : rowY[b.row] + (rowH[b.row] - h) / 2;
    // An actor is drawn as a small icon, not a box — shrink its rect so flows attach to the
    // figure instead of floating at the edge of an invisible full-width cell.
    blocks[b.id] =
      b.kind === "actor"
        ? { x: x + (COL_W - 64) / 2, y: top, w: 64, h }
        : { x, y: top, w: COL_W, h };
  }

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

  const sideLists = new Map<string, { ref: string; sort: number }[]>();
  plans.forEach((p, i) => {
    const add = (blockId: string, side: Side, other: Rect, end: "a" | "b") => {
      const k = `${blockId}|${side}`;
      const list = sideLists.get(k) ?? [];
      list.push({ ref: `${i}|${end}`, sort: side === "t" || side === "b" ? cx(other) : cy(other) });
      sideLists.set(k, list);
    };
    add(p.e.from, p.aSide, p.b, "a");
    add(p.e.to, p.bSide, p.a, "b");
  });
  const slot = new Map<string, { idx: number; total: number }>();
  for (const [k, list] of sideLists) {
    list.sort((x, y) => x.sort - y.sort);
    list.forEach((entry, idx) => slot.set(`${k}|${entry.ref}`, { idx, total: list.length }));
  }
  const anchorAt = (blockId: string, side: Side, r: Rect, i: number, end: "a" | "b") => {
    const s = slot.get(`${blockId}|${side}|${i}|${end}`) ?? { idx: 0, total: 1 };
    const f = (s.idx + 1) / (s.total + 1);
    if (side === "t") return { x: r.x + r.w * f, y: r.y };
    if (side === "b") return { x: r.x + r.w * f, y: r.y + r.h };
    if (side === "l") return { x: r.x, y: r.y + r.h * f };
    return { x: r.x + r.w, y: r.y + r.h * f };
  };

  const edges = plans.map((p, i) => {
    const { e, a, b, kind, aSide, bSide } = p;
    const A = anchorAt(e.from, aSide, a, i, "a");
    const B = anchorAt(e.to, bSide, b, i, "b");
    const base = { from: e.from, to: e.to };
    if (kind === "h") {
      // Straight where the anchors line up; a shallow Z where they do not.
      const d =
        Math.abs(A.y - B.y) < 0.5
          ? `M ${A.x} ${A.y} L ${B.x} ${B.y}`
          : `M ${A.x} ${A.y} L ${(A.x + B.x) / 2} ${A.y} L ${(A.x + B.x) / 2} ${B.y} L ${B.x} ${B.y}`;
      return { ...base, d, midX: (A.x + B.x) / 2, midY: (A.y + B.y) / 2, horizontal: true };
    }
    if (kind === "v") {
      const d =
        Math.abs(A.x - B.x) < 0.5
          ? `M ${A.x} ${A.y} L ${B.x} ${B.y}`
          : `M ${A.x} ${A.y} L ${A.x} ${(A.y + B.y) / 2} L ${B.x} ${(A.y + B.y) / 2} L ${B.x} ${B.y}`;
      return { ...base, d, midX: (A.x + B.x) / 2, midY: (A.y + B.y) / 2, horizontal: false };
    }
    if (kind === "vh") {
      return {
        ...base,
        d: `M ${A.x} ${A.y} L ${A.x} ${B.y} L ${B.x} ${B.y}`,
        midX: A.x,
        midY: (A.y + B.y) / 2,
        horizontal: false,
      };
    }
    return {
      ...base,
      d: `M ${A.x} ${A.y} L ${B.x} ${A.y} L ${B.x} ${B.y}`,
      midX: (A.x + B.x) / 2,
      midY: A.y,
      horizontal: true,
    };
  });

  return { width, height, blocks, edges };
}

// --- Pin placement -----------------------------------------------------------------
// Chips and tags have deterministic positions computed from the same geometry the renderer
// draws, and the build re-runs these functions to prove nothing lands on top of a block.
// One implementation, imported by both sides, so the check can never drift from the drawing.

export interface PinEdgeGeo {
  midX: number;
  midY: number;
  horizontal: boolean;
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
 * Risk-tag pills plus the leader line that ties the stack to what it tags. Blocks carry their
 * stack above the title tab; horizontal flows above the midpoint; vertical flows beside it.
 */
export function tagSpots(
  widths: number[],
  block?: Rect,
  edge?: PinEdgeGeo,
): { rects: Rect[]; leader: string } {
  const n = widths.length;
  if (block) {
    const ax = block.x + 18;
    const ay = block.y - TAB_H / 2;
    return {
      rects: widths.map((w, i) => ({ x: ax - w / 2, y: ay - TAG_GAP * (n - i), w, h: TAG_H })),
      leader: `M ${ax} ${ay - TAG_GAP * n + TAG_H + 2} L ${ax} ${ay}`,
    };
  }
  if (!edge) return { rects: [], leader: "" };
  if (edge.horizontal) {
    const ax = edge.midX;
    const bottom = edge.midY - 14;
    return {
      rects: widths.map((w, i) => ({ x: ax - w / 2, y: bottom - TAG_GAP * (n - i), w, h: TAG_H })),
      leader: `M ${ax} ${bottom - TAG_GAP + TAG_H + 2} L ${ax} ${edge.midY - 5}`,
    };
  }
  const right = edge.midX - 16;
  const top = edge.midY - (n * TAG_GAP - (TAG_GAP - TAG_H)) / 2;
  return {
    rects: widths.map((w, i) => ({ x: right - w, y: top + i * TAG_GAP, w, h: TAG_H })),
    leader: `M ${right + 1} ${edge.midY} L ${edge.midX - 5} ${edge.midY}`,
  };
}
