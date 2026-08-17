/**
 * The validator — the reviewer that never squints at screenshots. It checks the authored
 * graph (ids resolve, pins land on real blocks or flows, scenarios follow real edges) and
 * then re-runs the exact placement maths the renderer draws with, failing on any geometry
 * that would be illegible: a flow through a block, a chip or tag on a block, a tag stack
 * off the top of the canvas.
 *
 * Every error message names the fix, because the fix is always authored: a `route` hint, a
 * different grid cell, or fewer pins on one target.
 */
import { chipSpots, ICON_NAMES, layoutArchetype, tagSpots, tagWidth } from "./layout.mjs";

const BLOCK_KINDS = new Set(["actor", "service", "provider", "external", "governance"]);
const PATH_CLASSES = new Set(["primary", "external", "governance"]);
const LAYERS = new Set(["app", "model", "data"]);
const ICONS = new Set(ICON_NAMES);

/** Returns a list of error strings; empty means the architecture is valid and legible. */
export function validateArchetype(arch) {
  const errors = [];
  const fail = (msg) => errors.push(msg);

  if (!arch || typeof arch !== "object") return ["not a mapping — is the YAML well-formed?"];
  if (!arch.id?.trim()) fail("needs an id");
  if (!arch.title?.trim()) fail("needs a title");
  if (!arch.blocks?.length) fail("needs blocks");
  if (!arch.edges?.length) fail("needs edges");
  if (errors.length) return errors;

  // --- Blocks ------------------------------------------------------------------------
  const blockIds = new Set();
  for (const block of arch.blocks) {
    const at = `block ${block.id}`;
    if (blockIds.has(block.id)) fail(`${at}: duplicate block id`);
    blockIds.add(block.id);
    if (!BLOCK_KINDS.has(block.kind)) fail(`${at}: kind must be one of ${[...BLOCK_KINDS].join(", ")}`);
    if (!block.title?.trim()) fail(`${at}: needs a title`);
    // The title tab is as wide as the block; a longer title draws outside it.
    if (block.kind !== "actor" && (block.title?.length ?? 0) > 24) {
      fail(`${at}: title "${block.title}" is longer than 24 characters and will overflow its tab`);
    }
    if (!Number.isInteger(block.col) || block.col < 0 || !Number.isInteger(block.row) || block.row < 0) {
      fail(`${at}: needs non-negative integer col and row`);
    }
    if (block.icon && !ICONS.has(block.icon)) fail(`${at}: unknown icon ${block.icon}`);
    if (block.kind === "actor" && !block.icon) fail(`${at}: an actor block needs an icon`);
    if (block.layer && !LAYERS.has(block.layer)) fail(`${at}: layer must be app, model or data`);
    const itemIds = new Set();
    for (const item of block.items ?? []) {
      if (itemIds.has(item.id)) fail(`${at}: duplicate item ${item.id}`);
      itemIds.add(item.id);
      if (!item.label?.trim()) fail(`${at} item ${item.id}: needs a label`);
      if (!ICONS.has(item.icon)) fail(`${at} item ${item.id}: unknown icon ${item.icon}`);
    }
  }

  // No two blocks may claim the same grid cell — overlap is a wrong drawing, not a layout bug.
  const cells = new Map();
  for (const block of arch.blocks) {
    for (let r = block.row; r < block.row + (block.rowSpan ?? 1); r++) {
      const key = `${block.col},${r}`;
      const holder = cells.get(key);
      if (holder) fail(`blocks ${holder} and ${block.id} both occupy grid cell ${key}`);
      cells.set(key, block.id);
    }
  }

  // --- Edges -------------------------------------------------------------------------
  const edgeKeys = new Set();
  const bidir = new Set();
  for (const edge of arch.edges) {
    const key = `${edge.from}->${edge.to}`;
    const at = `edge ${key}`;
    if (edgeKeys.has(key)) fail(`${at}: duplicate edge`);
    edgeKeys.add(key);
    if (edge.bidir) bidir.add(key);
    if (edge.from === edge.to) fail(`${at}: loops back on itself`);
    if (!blockIds.has(edge.from)) fail(`${at}: unknown source block ${edge.from}`);
    if (!blockIds.has(edge.to)) fail(`${at}: unknown target block ${edge.to}`);
    if (!PATH_CLASSES.has(edge.path)) fail(`${at}: path must be one of ${[...PATH_CLASSES].join(", ")}`);
    if (edge.route && edge.route !== "hv" && edge.route !== "vh") fail(`${at}: route must be "hv" or "vh"`);
  }

  // --- Frames ------------------------------------------------------------------------
  for (const frame of arch.frames ?? []) {
    const at = `frame "${frame.label}"`;
    if (!frame.label?.trim()) fail(`a frame needs a label`);
    if (!frame.members?.length) fail(`${at}: needs members`);
    for (const m of frame.members ?? []) {
      if (!blockIds.has(m)) fail(`${at}: unknown member block ${m}`);
    }
    if (frame.labelPos && frame.labelPos !== "top" && frame.labelPos !== "bottom") {
      fail(`${at}: labelPos must be "top" or "bottom"`);
    }
  }

  // --- Legends and pins ----------------------------------------------------------------
  const riskById = new Map((arch.riskLegend ?? []).map((r) => [r.id, r]));
  const capById = new Map((arch.capabilityLegend ?? []).map((c) => [c.id, c]));
  for (const r of arch.riskLegend ?? []) {
    if (!r.code?.trim()) fail(`riskLegend ${r.id}: needs a short code (e.g. R01)`);
    if (!r.title?.trim()) fail(`riskLegend ${r.id}: needs a title`);
  }
  for (const c of arch.capabilityLegend ?? []) {
    if (!c.title?.trim()) fail(`capabilityLegend ${c.id}: needs a title`);
  }

  const resolvePin = (at, ref) => {
    if (blockIds.has(ref) || edgeKeys.has(ref)) return;
    const [a, b] = (ref ?? "").split("->");
    if (a && b && bidir.has(`${b}->${a}`)) return;
    fail(`${at}: "${ref}" is neither a block id nor an edge "from->to" (reverse needs bidir: true)`);
  };
  for (const pin of arch.pins?.risks ?? []) {
    const at = `risk pin ${pin.risk} @ ${pin.at}`;
    if (!riskById.has(pin.risk)) fail(`${at}: not in riskLegend`);
    resolvePin(at, pin.at);
  }
  for (const pin of arch.pins?.capabilities ?? []) {
    const at = `capability pin ${pin.capability} @ ${pin.at}`;
    if (!capById.has(pin.capability)) fail(`${at}: not in capabilityLegend`);
    resolvePin(at, pin.at);
  }

  // --- Scenarios -----------------------------------------------------------------------
  for (const scenario of arch.scenarios ?? []) {
    const at = `scenario "${scenario.title}"`;
    if (!scenario.steps?.length) fail(`${at}: has no steps`);
    for (const step of scenario.steps ?? []) {
      if (edgeKeys.has(step.follow)) continue;
      const [a, b] = (step.follow ?? "").split("->");
      if (a && b && bidir.has(`${b}->${a}`)) continue;
      fail(`${at}: step "${step.follow}" follows no edge (reverse needs bidir: true)`);
    }
  }

  if (errors.length) return errors;

  // --- Geometry — the drawing must be legible -----------------------------------------
  const layout = layoutArchetype(arch);
  errors.push(...checkDiagramCollisions(arch, layout));
  return errors;
}

/** Re-runs the renderer's placement maths and reports anything that lands where it should not. */
export function checkDiagramCollisions(arch, layout) {
  const errors = [];
  const fail = (msg) => errors.push(msg);
  const inflate = (r, by) => ({ x: r.x - by, y: r.y - by, w: r.w + 2 * by, h: r.h + 2 * by });
  const hits = (r, s) => r.x < s.x + s.w && s.x < r.x + r.w && r.y < s.y + s.h && s.y < r.y + r.h;
  const blockRects = Object.entries(layout.blocks);

  // Flows through blocks. Path data is our own "M x y L x y ..." — parse the segments back.
  for (const edge of layout.edges) {
    const nums = edge.d.match(/-?[\d.]+/g).map(Number);
    for (let i = 0; i + 3 < nums.length; i += 2) {
      const seg = {
        x: Math.min(nums[i], nums[i + 2]) - 1,
        y: Math.min(nums[i + 1], nums[i + 3]) - 1,
        w: Math.abs(nums[i + 2] - nums[i]) + 2,
        h: Math.abs(nums[i + 3] - nums[i + 1]) + 2,
      };
      for (const [id, rect] of blockRects) {
        if (id === edge.from || id === edge.to) continue;
        if (hits(seg, inflate(rect, -2))) {
          const authored = arch.edges.find((e) => e.from === edge.from && e.to === edge.to);
          const other = (authored?.route ?? "hv") === "hv" ? "vh" : "hv";
          fail(`flow ${edge.from}->${edge.to} passes through block ${id} — move a block, or set route: ${other}`);
        }
      }
    }
  }

  const edgeGeoOf = (ref) => {
    const found =
      layout.edges.find((e) => `${e.from}->${e.to}` === ref) ??
      layout.edges.find((e) => `${e.to}->${e.from}` === ref);
    return found ? { midX: found.midX, midY: found.midY, horizontal: found.horizontal } : undefined;
  };

  const checkSpots = (kind, at, rects, ownBlock) => {
    for (const r of rects) {
      if (r.y < 2) fail(`${kind} at ${at} runs off the top of the canvas — fewer pins there, or move the block down a row`);
      for (const [id, rect] of blockRects) {
        if (id === ownBlock) continue;
        if (hits(r, inflate(rect, -2))) {
          fail(`${kind} at ${at} lands on block ${id} — pin it elsewhere or adjust the grid`);
        }
      }
    }
  };

  const chipGroups = new Map();
  for (const pin of arch.pins?.capabilities ?? []) {
    chipGroups.set(pin.at, (chipGroups.get(pin.at) ?? 0) + 1);
  }
  for (const [at, n] of chipGroups) {
    const spots = chipSpots(n, layout.blocks[at], edgeGeoOf(at));
    checkSpots("capability chip", at,
      spots.map((s) => ({ x: s.x - 9, y: s.y - 9, w: 18, h: 18 })),
      layout.blocks[at] ? at : undefined);
  }

  const riskById = new Map((arch.riskLegend ?? []).map((r) => [r.id, r]));
  const tagGroups = new Map();
  for (const pin of arch.pins?.risks ?? []) {
    const list = tagGroups.get(pin.at) ?? [];
    list.push(riskById.get(pin.risk)?.code ?? "R??");
    tagGroups.set(pin.at, list);
  }
  for (const [at, codes] of tagGroups) {
    const { rects } = tagSpots(codes.map(tagWidth), layout.blocks[at], edgeGeoOf(at));
    checkSpots("risk tag", at, rects);
  }

  return errors;
}
