/**
 * Build-time geometry for flow-style architecture diagrams.
 *
 * Authors place blocks on a coarse grid (`col`/`row`) and this module turns the grid into
 * pixels: block rects, orthogonal edge paths, and deterministic positions for capability
 * chips and risk tags. The client renders coordinates and never runs a layout algorithm —
 * two renders of the same data are pixel-identical.
 *
 * The router is deliberately simple: straight where two blocks face each other, one bend
 * otherwise. Diagrams stay readable because the grid is curated so flows do not cross, not
 * because the router is clever — the validator enforces that (see validate.mjs).
 *
 * This is a JavaScript port of src/lib/flow-layout.ts in the ai-security-architecture repo,
 * kept dependency-free so it runs under plain `node`.
 */

/** The icon vocabulary the renderers can draw. The validator rejects anything else. */
export const ICON_NAMES = [
  "person", "people", "agent", "model", "chat", "clock", "folder", "db", "key", "shield",
  "plug", "code", "globe", "doc", "gear", "phone", "search", "mail", "scale", "eye", "stop",
];

// --- Grid constants ------------------------------------------------------------------
export const COL_W = 176;      // every non-actor block is one column wide
const COL_GAP = 64;
const ROW_GAP = 116;           // generous, so edge labels and pins have air
const MARGIN_X = 22;
const MARGIN_TOP = 68;         // room above row 0 for title tabs and risk-tag stacks
const MARGIN_BOTTOM = 48;

export const TAB_H = 20;       // the title tab straddling the block's top edge
const ITEM_H = 50;             // items pack two per row inside a standard block
const BLOCK_PAD_TOP = 16;
const BLOCK_PAD_BOTTOM = 12;
const ACTOR_H = 66;

/** Risk-tag pill geometry, shared with the renderers. */
export const TAG_H = 17;
const TAG_GAP = 20;
export const tagWidth = (code) => code.length * 6.6 + 12;

/** How tall a block wants to be, before row heights are settled. */
function naturalHeight(block) {
  if (block.kind === "actor") return ACTOR_H;
  const items = block.items?.length ?? 0;
  if (!items) return 58;
  // Tall side columns (rowSpan > 1) stack items one per row; everything else packs two across.
  const stacked = (block.rowSpan ?? 1) > 1;
  const rows = stacked ? items : Math.ceil(items / 2);
  return TAB_H / 2 + BLOCK_PAD_TOP + rows * ITEM_H + BLOCK_PAD_BOTTOM;
}

/** Where items sit inside a block rect. Renderers call this too — one implementation. */
export function itemCells(block, rect) {
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

const overlap = (a0, a1, b0, b1) => {
  const lo = Math.max(a0, b0);
  const hi = Math.min(a1, b1);
  return hi - lo > 24 ? [lo, hi] : null;
};

/**
 * Grid → pixels. Returns { width, height, blocks: {id: rect}, edges: [{from, to, d, midX,
 * midY, horizontal}] } where `d` is SVG path data drawn from `from` towards `to`.
 */
export function layoutArchetype(arch) {
  const cols = Math.max(...arch.blocks.map((b) => b.col)) + 1;
  const rows = Math.max(...arch.blocks.map((b) => b.row + (b.rowSpan ?? 1) - 1)) + 1;
  const width = MARGIN_X * 2 + cols * COL_W + (cols - 1) * COL_GAP;

  // Row heights come from the single-row blocks; a spanning block then grows its last row
  // if the span still cannot hold it.
  const rowH = Array.from({ length: rows }, () => 64);
  for (const b of arch.blocks) {
    if ((b.rowSpan ?? 1) === 1) rowH[b.row] = Math.max(rowH[b.row], naturalHeight(b));
  }
  for (const b of arch.blocks) {
    const span = b.rowSpan ?? 1;
    if (span === 1) continue;
    const have = rowH.slice(b.row, b.row + span).reduce((s, h) => s + h, 0) + ROW_GAP * (span - 1);
    const need = naturalHeight(b) - have;
    if (need > 0) rowH[b.row + span - 1] += need;
  }

  const rowY = [];
  let y = MARGIN_TOP;
  for (let r = 0; r < rows; r++) {
    rowY.push(y);
    y += rowH[r] + ROW_GAP;
  }
  const height = y - ROW_GAP + MARGIN_BOTTOM;

  const blocks = {};
  for (const b of arch.blocks) {
    const span = b.rowSpan ?? 1;
    const x = MARGIN_X + b.col * (COL_W + COL_GAP);
    const spanH = rowH.slice(b.row, b.row + span).reduce((s, h) => s + h, 0) + ROW_GAP * (span - 1);
    const h = span > 1 ? spanH : naturalHeight(b);
    // Centre a short block in its row; a spanning block takes the whole span. An actor is a
    // small unboxed icon — shrink its rect so flows attach to the figure.
    const top = span > 1 ? rowY[b.row] : rowY[b.row] + (rowH[b.row] - h) / 2;
    blocks[b.id] =
      b.kind === "actor"
        ? { x: x + (COL_W - 64) / 2, y: top, w: 64, h }
        : { x, y: top, w: COL_W, h };
  }

  // --- Edges -----------------------------------------------------------------------
  // Parallel edges between the same pair fan out a few pixels so both stay visible.
  const pairCount = new Map();
  const pairSeen = new Map();
  for (const e of arch.edges) {
    const key = [e.from, e.to].sort().join("~");
    pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
  }

  const edges = arch.edges.map((e) => {
    const a = blocks[e.from];
    const b = blocks[e.to];
    const key = [e.from, e.to].sort().join("~");
    const n = pairCount.get(key) ?? 1;
    const i = pairSeen.get(key) ?? 0;
    pairSeen.set(key, i + 1);
    const off = n > 1 ? (i - (n - 1) / 2) * 16 : 0;

    const yOv = overlap(a.y, a.y + a.h, b.y, b.y + b.h);
    if (yOv) {
      // Facing sides: straight horizontal.
      const yMid = (yOv[0] + yOv[1]) / 2 + off;
      const [x1, x2] = a.x < b.x ? [a.x + a.w, b.x] : [a.x, b.x + b.w];
      return { from: e.from, to: e.to, d: `M ${x1} ${yMid} L ${x2} ${yMid}`,
        midX: (x1 + x2) / 2, midY: yMid, horizontal: true };
    }
    const xOv = overlap(a.x, a.x + a.w, b.x, b.x + b.w);
    if (xOv) {
      const xMid = (xOv[0] + xOv[1]) / 2 + off;
      const [y1, y2] = a.y < b.y ? [a.y + a.h, b.y] : [a.y, b.y + b.h];
      return { from: e.from, to: e.to, d: `M ${xMid} ${y1} L ${xMid} ${y2}`,
        midX: xMid, midY: (y1 + y2) / 2, horizontal: false };
    }
    if (e.route === "vh") {
      // One bend, leaving vertically: along the source's column, turn at the target's row,
      // enter the target sideways. Entry sits a little above centre so a vh arrival and an
      // hv departure on the same block do not draw over each other.
      const ax = a.x + a.w / 2 + off;
      const y1 = a.y + a.h / 2 < b.y + b.h / 2 ? a.y + a.h : a.y;
      const by = b.y + b.h / 2 - 14 + off;
      const bx = ax < b.x ? b.x : b.x + b.w;
      return { from: e.from, to: e.to, d: `M ${ax} ${y1} L ${ax} ${by} L ${bx} ${by}`,
        midX: ax, midY: (y1 + by) / 2, horizontal: false };
    }
    // Default `hv`: across at the source's centre, turn at the target's column, enter
    // the target vertically.
    const ay = a.y + a.h / 2 + off;
    const x1 = a.x + a.w / 2 < b.x + b.w / 2 ? a.x + a.w : a.x;
    const bx = b.x + b.w / 2 + off;
    const by = ay < b.y ? b.y : b.y + b.h;
    return { from: e.from, to: e.to, d: `M ${x1} ${ay} L ${bx} ${ay} L ${bx} ${by}`,
      midX: (x1 + bx) / 2, midY: ay, horizontal: true };
  });

  return { width, height, blocks, edges };
}

// --- Pin placement -------------------------------------------------------------------
// Chips and tags have deterministic positions computed from the same geometry the renderer
// draws, and the validator re-runs these functions to prove nothing lands on a block.

/** Numbered capability chips: along a block's bottom border, or seated on the flow itself. */
export function chipSpots(n, block, edge) {
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
 * Risk-tag pills plus the leader line tying the stack to what it tags. Blocks carry their
 * stack above the title tab; horizontal flows above the midpoint; vertical flows beside it.
 */
export function tagSpots(widths, block, edge) {
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

/** Containment-frame padding, shared by producers so frames look identical everywhere. */
export const FRAME_PAD = 26;
export const FRAME_HEAD = 52;

/** The bounding rect of a frame around its member blocks. */
export function frameRect(memberRects) {
  const x0 = Math.min(...memberRects.map((r) => r.x)) - FRAME_PAD;
  const y0 = Math.min(...memberRects.map((r) => r.y)) - FRAME_PAD - FRAME_HEAD;
  const x1 = Math.max(...memberRects.map((r) => r.x + r.w)) + FRAME_PAD;
  const y1 = Math.max(...memberRects.map((r) => r.y + r.h)) + FRAME_PAD;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
