/**
 * Geometry for the reference architectures, computed from zone membership.
 *
 * The risk map holds its geometry as hand-authored coordinates, which is right for one diagram
 * whose arrangement is itself a considered reproduction of SAIF's. It does not survive 28
 * diagrams. Here the arrangement is derived instead, so an archetype is authored as a graph and
 * the drawing follows — and so the build can check the graph rather than the picture.
 *
 * The arrangement rules, in full:
 *
 *   1. `outsideWorld` zones sit at the top, full width. Untrusted things are above the system.
 *   2. `management` zones sit in a right-hand column. The governance plane governs the other
 *      zones rather than sitting in their flow, and drawing it in the stack implies otherwise.
 *      This is CSA MAESTRO's treatment of its security layer, turned ninety degrees.
 *   3. Everything else stacks in the main column, in declaration order.
 *   4. Inside a zone, nodes group into rows by their node type's vocabulary group, in the
 *      vocabulary's group order — so entry sits above reasoning sits above action, always.
 *   5. Gutters between zones are where boundary crossings run, because that is where their auth
 *      labels have room to be read.
 *
 * Called by scripts/build-data.ts; the result is emitted into dataset.json as `archetype.layout`.
 */
import type {
  ArchetypeEdge,
  ArchetypeLayout,
  ArchitectureVocabulary,
  ArchetypeNode,
  ArchetypeZone,
  Rect,
} from "./types";

export const CANVAS_WIDTH = 1080;

const MARGIN = 18;
/** Width reserved for the governance column, only when the archetype has a management zone. */
const SIDE_WIDTH = 208;
/** Vertical space between stacked zones — the crossing lane, sized to fit stacked auth labels. */
const ZONE_GAP = 84;
const SIDE_GAP = 28;

const ZONE_PAD_X = 18;
const ZONE_HEADER_H = 34;
const ZONE_PAD_BOTTOM = 26;
/** Minimum body height, so an empty vendor-operated zone still reads as a container. */
const ZONE_MIN_BODY_H = 46;

/** Wide enough to be a routing lane, not just a gap: same-row edges detour through it. */
const ROW_GAP = 34;
const NODE_H = 46;
const NODE_GAP_X = 14;
const NODE_MIN_W = 116;
const NODE_MAX_W = 232;

/**
 * Node width has to fit two strings, not one: the label at 12px and the node type beneath it at
 * 9.5px mono, which is frequently the longer of the two ("Skill or extension package" under
 * "Installed skills"). Sizing on the label alone lets the sublabel run outside its own box.
 */
const estimateWidth = (label: string, typeTitle: string) =>
  clamp(
    Math.max(Math.round(label.length * 6.7), Math.round(typeTitle.length * 5.9)) + 26,
    NODE_MIN_W,
    NODE_MAX_W,
  );

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

interface AuthoredArchetype {
  zones: ArchetypeZone[];
  nodes: ArchetypeNode[];
  edges: ArchetypeEdge[];
}

export function layoutArchetype(
  archetype: AuthoredArchetype,
  vocab: ArchitectureVocabulary,
): ArchetypeLayout {
  const groupOrder = new Map(vocab.groups.map((g, i) => [g.id, i]));
  const groupOfType = new Map(vocab.nodeTypes.map((t) => [t.id, t.group]));
  const titleOfType = new Map(vocab.nodeTypes.map((t) => [t.id, t.title]));
  const zoneTypeOf = new Map(archetype.zones.map((z) => [z.id, z.type]));
  const widthOf = (node: ArchetypeNode) =>
    estimateWidth(node.label, titleOfType.get(node.type) ?? node.type);

  const nodesByZone = new Map<string, ArchetypeNode[]>();
  for (const zone of archetype.zones) nodesByZone.set(zone.id, []);
  for (const node of archetype.nodes) nodesByZone.get(node.zone)?.push(node);

  const outside = archetype.zones.filter((z) => z.type === "outsideWorld");
  const side = archetype.zones.filter((z) => z.type === "management");
  const main = archetype.zones.filter((z) => z.type !== "outsideWorld" && z.type !== "management");

  const mainWidth =
    CANVAS_WIDTH - MARGIN * 2 - (side.length ? SIDE_WIDTH + SIDE_GAP : 0);

  const zones: Record<string, Rect> = {};
  const nodes: Record<string, Rect> = {};

  /** Place one zone's nodes into rows and return the zone's total height. */
  const placeZone = (zone: ArchetypeZone, x: number, y: number, width: number) => {
    const members = nodesByZone.get(zone.id) ?? [];
    const inner = width - ZONE_PAD_X * 2;
    const rows = packRows(members, inner, groupOfType, groupOrder, widthOf);

    let cursor = y + ZONE_HEADER_H;
    for (const row of rows) {
      // Spread the row across the zone by distributing the slack, rather than packing at natural
      // width and centring. Filling the width is what keeps each node's vertical edge in its own
      // corridor; a centre-packed row drops every downward edge into the same few pixels.
      // Clamp to the zone: the governance column is narrower than NODE_MAX_W, so a long label
      // there would otherwise draw a node wider than the zone containing it.
      const natural = row.map((n) => Math.min(widthOf(n), inner));
      const slack = inner - natural.reduce((a, b) => a + b, 0);
      const gap = Math.max(NODE_GAP_X, slack / (row.length + 1));
      let nodeX = x + ZONE_PAD_X + gap;
      for (let i = 0; i < row.length; i++) {
        nodes[row[i].id] = { x: nodeX, y: cursor, w: natural[i], h: NODE_H };
        nodeX += natural[i] + gap;
      }
      cursor += NODE_H + ROW_GAP;
    }

    const bodyH = rows.length ? cursor - ROW_GAP - (y + ZONE_HEADER_H) : ZONE_MIN_BODY_H;
    const height = ZONE_HEADER_H + bodyH + ZONE_PAD_BOTTOM;
    zones[zone.id] = { x, y, w: width, h: height };
    return height;
  };

  // --- Main column: outside world on top, then the owned zones ---------------------
  let y = MARGIN;
  for (const zone of outside) {
    y += placeZone(zone, MARGIN, y, CANVAS_WIDTH - MARGIN * 2) + ZONE_GAP;
  }
  const stackTop = y;
  for (const zone of main) {
    y += placeZone(zone, MARGIN, y, mainWidth) + ZONE_GAP;
  }
  const mainBottom = main.length || outside.length ? y - ZONE_GAP : MARGIN;

  // --- Governance column, beside the stack rather than inside it -------------------
  let sideY = stackTop;
  const sideX = MARGIN + mainWidth + SIDE_GAP;
  for (const zone of side) {
    sideY += placeZone(zone, sideX, sideY, SIDE_WIDTH) + SIDE_GAP;
  }
  const sideBottom = side.length ? sideY - SIDE_GAP : MARGIN;

  const height = Math.max(mainBottom, sideBottom) + MARGIN;

  return {
    width: CANVAS_WIDTH,
    height,
    zones,
    nodes,
    edges: routeEdges(archetype, nodes, zones, zoneTypeOf),
  };
}

/**
 * Nodes are ordered by their vocabulary group — entry above reasoning above action, always — and
 * then packed greedily into rows.
 *
 * Packing runs *across* group boundaries rather than starting a fresh row per group. One row per
 * group sounds tidier and produces the opposite: a zone with seven groups of one or two nodes
 * becomes seven near-empty rows and a diagram twice as tall as its content. Groups stay
 * contiguous and in order either way, which is what actually carries the meaning.
 */
function packRows(
  members: ArchetypeNode[],
  available: number,
  groupOfType: Map<string, string>,
  groupOrder: Map<string, number>,
  widthOf: (node: ArchetypeNode) => number,
): ArchetypeNode[][] {
  const ordered = [...members].sort((a, b) => {
    const ga = groupOrder.get(groupOfType.get(a.type) ?? "") ?? 99;
    const gb = groupOrder.get(groupOfType.get(b.type) ?? "") ?? 99;
    if (ga !== gb) return ga - gb;
    return members.indexOf(a) - members.indexOf(b);
  });

  const rows: ArchetypeNode[][] = [];
  let row: ArchetypeNode[] = [];
  let width = 0;
  for (const node of ordered) {
    const w = widthOf(node);
    if (row.length && width + NODE_GAP_X + w > available) {
      rows.push(row);
      row = [];
      width = 0;
    }
    row.push(node);
    width += (row.length > 1 ? NODE_GAP_X : 0) + w;
  }
  if (row.length) rows.push(row);
  return rows;
}

const centreX = (r: Rect) => r.x + r.w / 2;
const centreY = (r: Rect) => r.y + r.h / 2;

/**
 * Orthogonal routing.
 *
 * The rule that matters: an edge crossing a zone boundary turns in the *gutter* between the two
 * zones, and its auth label goes there. Auth labels are the whole argument of this notation, so
 * they are given clear space by construction rather than landing wherever the midpoint happened
 * to fall — which, inside a dense zone, is on top of a node.
 *
 * Edges sharing a gutter are fanned across it so they read as separate crossings.
 */
function routeEdges(
  archetype: AuthoredArchetype,
  nodes: Record<string, Rect>,
  zones: Record<string, Rect>,
  zoneTypeOf: Map<string, string>,
): ArchetypeLayout["edges"] {
  const zoneOfNode = new Map(archetype.nodes.map((n) => [n.id, n.zone]));
  const crossesOf = (edge: ArchetypeEdge) =>
    zoneOfNode.get(edge.from) !== zoneOfNode.get(edge.to);

  // Lane assignment, per gutter for crossings and per row-pair for internal edges, so parallel
  // runs separate instead of stacking.
  const laneCount = new Map<string, number>();
  const laneIndex: number[] = [];
  archetype.edges.forEach((edge, i) => {
    const a = nodes[edge.from];
    const b = nodes[edge.to];
    if (!a || !b) {
      laneIndex[i] = 0;
      return;
    }
    const key = crossesOf(edge)
      ? `${zoneOfNode.get(edge.from)}|${zoneOfNode.get(edge.to)}`
      : `${zoneOfNode.get(edge.from)}|${Math.round(a.y / 30)}|${Math.round(b.y / 30)}`;
    const n = laneCount.get(key) ?? 0;
    laneCount.set(key, n + 1);
    laneIndex[i] = n;
  });

  return archetype.edges.map((edge, i) => {
    const a = nodes[edge.from];
    const b = nodes[edge.to];
    const crosses = crossesOf(edge);
    if (!a || !b) {
      return { from: edge.from, to: edge.to, d: "", labelX: 0, labelY: 0, crosses };
    }

    // A governance-plane edge comes in from the side column, not through the flow.
    const fromSide = zoneTypeOf.get(zoneOfNode.get(edge.from) ?? "") === "management";
    const toSide = zoneTypeOf.get(zoneOfNode.get(edge.to) ?? "") === "management";
    if (fromSide || toSide) return sideRoute(edge, a, b, crosses, fromSide);

    const lane = laneIndex[i] ?? 0;
    const total = laneCount.get(
      crosses
        ? `${zoneOfNode.get(edge.from)}|${zoneOfNode.get(edge.to)}`
        : `${zoneOfNode.get(edge.from)}|${Math.round(a.y / 30)}|${Math.round(b.y / 30)}`,
    ) ?? 1;

    const sourceZone = zones[zoneOfNode.get(edge.from) ?? ""];
    const targetZone = zones[zoneOfNode.get(edge.to) ?? ""];

    if (b.y >= a.y + a.h) {
      return verticalRoute(edge, a, b, crosses, lane, total, 1, crosses ? sourceZone : undefined, targetZone);
    }
    if (a.y >= b.y + b.h) {
      return verticalRoute(edge, a, b, crosses, lane, total, -1, crosses ? sourceZone : undefined, targetZone);
    }
    return horizontalRoute(edge, a, b, crosses, (lane - (total - 1) / 2) * 9, nodes);
  });
}

/**
 * Down (or up) out of one row and into another. For a boundary crossing the turn happens in the
 * gutter just outside the source zone, which is empty space by construction — that is where the
 * auth label can be read.
 */
function verticalRoute(
  edge: ArchetypeEdge,
  a: Rect,
  b: Rect,
  crosses: boolean,
  lane: number,
  total: number,
  dir: 1 | -1,
  sourceZone: Rect | undefined,
  targetZone: Rect | undefined,
) {
  const ax = centreX(a);
  const bx = centreX(b);
  const ay = dir === 1 ? a.y + a.h : a.y;
  const by = dir === 1 ? b.y : b.y + b.h;

  let mid: number;
  if (crosses && sourceZone) {
    // Spread across the gutter just outside the source zone. The usable band is capped at one
    // gutter's worth even when the target is several zones away, so a distant crossing still
    // turns in clear space rather than inside an intervening zone.
    const edgeOfZone = dir === 1 ? sourceZone.y + sourceZone.h : sourceZone.y;
    const toTarget = targetZone
      ? Math.abs((dir === 1 ? targetZone.y : targetZone.y + targetZone.h) - edgeOfZone)
      : ZONE_GAP;
    const room = Math.max(18, Math.min(toTarget, ZONE_GAP) - 22);
    // Divide the band into `total` slots and take the middle of ours. Spacing by (total - 1)
    // instead would put two lanes at the extremes and collapse them once clamped.
    const step = room / total;
    mid = edgeOfZone + dir * (11 + step * (lane + 0.5));
  } else {
    const centred = (lane - (total - 1) / 2) * 9;
    mid = ay + (by - ay) * 0.5 + centred;
  }

  const d =
    Math.abs(ax - bx) < 2
      ? `M ${ax} ${ay} L ${bx} ${by}`
      : `M ${ax} ${ay} L ${ax} ${mid} L ${bx} ${mid} L ${bx} ${by}`;

  return {
    from: edge.from,
    to: edge.to,
    d,
    labelX: (ax + bx) / 2,
    labelY: mid,
    crosses,
  };
}

/**
 * Side to side within a row. Where another node sits between the two, the edge drops into the
 * lane beneath the row and comes back up — drawing it straight would run it behind that node,
 * which reads as a connection to the wrong box.
 */
function horizontalRoute(
  edge: ArchetypeEdge,
  a: Rect,
  b: Rect,
  crosses: boolean,
  fan: number,
  nodes: Record<string, Rect>,
) {
  const leftToRight = centreX(b) >= centreX(a);
  const ax = leftToRight ? a.x + a.w : a.x;
  const bx = leftToRight ? b.x : b.x + b.w;

  if (isBlocked(a, b, nodes)) {
    const lane = Math.max(a.y + a.h, b.y + b.h) + ROW_GAP / 2 + fan;
    const fromX = centreX(a);
    const toX = centreX(b);
    return {
      from: edge.from,
      to: edge.to,
      d: `M ${fromX} ${a.y + a.h} L ${fromX} ${lane} L ${toX} ${lane} L ${toX} ${b.y + b.h}`,
      labelX: (fromX + toX) / 2,
      labelY: lane,
      crosses,
    };
  }

  const ay = centreY(a) + fan;
  const by = centreY(b) + fan;
  const mid = (ax + bx) / 2;

  const d =
    Math.abs(ay - by) < 2
      ? `M ${ax} ${ay} L ${bx} ${by}`
      : `M ${ax} ${ay} L ${mid} ${ay} L ${mid} ${by} L ${bx} ${by}`;

  return { from: edge.from, to: edge.to, d, labelX: mid, labelY: (ay + by) / 2, crosses };
}

/** Is there a third node sitting in the straight line between these two? */
function isBlocked(a: Rect, b: Rect, nodes: Record<string, Rect>) {
  const lo = Math.min(a.x + a.w, b.x + b.w);
  const hi = Math.max(a.x, b.x);
  if (hi <= lo) return false;
  const top = Math.min(a.y, b.y);
  const bottom = Math.max(a.y + a.h, b.y + b.h);
  return Object.values(nodes).some(
    (r) =>
      r !== a &&
      r !== b &&
      r.y < bottom &&
      r.y + r.h > top &&
      r.x + r.w > lo &&
      r.x < hi,
  );
}

/** Governance plane in or out: straight across from the side column into the node's flank. */
function sideRoute(edge: ArchetypeEdge, a: Rect, b: Rect, crosses: boolean, fromSide: boolean) {
  const [governance, target] = fromSide ? [a, b] : [b, a];
  const govX = governance.x;
  const targetX = target.x + target.w;
  const govY = centreY(governance);
  const targetY = centreY(target);
  const mid = (govX + targetX) / 2;

  const path = `M ${govX} ${govY} L ${mid} ${govY} L ${mid} ${targetY} L ${targetX} ${targetY}`;
  const d = fromSide
    ? path
    : `M ${targetX} ${targetY} L ${mid} ${targetY} L ${mid} ${govY} L ${govX} ${govY}`;

  // The label goes in the corridor between the two columns, not at the geometric midpoint — the
  // midpoint lands inside the main column, where the nodes paint over it.
  return {
    from: edge.from,
    to: edge.to,
    d,
    labelX: govX - SIDE_GAP / 2,
    labelY: govY,
    crosses,
  };
}
