"use client";

/**
 * React Flow renderer for the flow-style architectures — the second leg of the renderer
 * bake-off, promoted to a full view where containment matters. Geometry is enforced the same
 * way as the SVG engine: initial node positions are the build-time rects and edges render the
 * build-computed path strings verbatim — but nodes are user-movable, and once an endpoint has
 * been dragged its edges switch to live routing. Capability chips and risk tags sit at the
 * same chipSpots/tagSpots the SVG uses and travel with the block they annotate. Hover cards
 * replace persistent edge labels, which also keeps text off the drawing.
 */
import { useCallback, useMemo, useState } from "react";
import {
  applyNodeChanges,
  Background,
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { capabilityById, riskById, riskCode } from "@/lib/data";
import { chipSpots, flowBadgeSpots, itemCells, TAG_H, tagSpots, ZONE_PAD } from "@/lib/flow-layout";
import type { ArchBlock, Archetype, Scenario } from "@/lib/types";
import { blockTab, BLOCK_STYLE, PATH_STYLE, tagWidth } from "./flow-style";
import { FlowIcon } from "./FlowIcons";


interface HoverCard {
  x: number;
  y: number;
  title: string;
  body?: string;
}

type BlockNodeData = {
  block: ArchBlock;
  w: number;
  h: number;
  dim: boolean;
  /** Capability id -> chip number, so an item can show what it implements. */
  capNumber?: Map<string, number>;
  /**
   * Capabilities pinned directly on a governance call-out. They join the call-out's own chip
   * row instead of hanging off a border the call-out no longer draws.
   */
  pinnedCaps?: string[];
  /** Shows the shared hover card — items use it so each icon can explain itself. */
  onItemEnter: (event: React.MouseEvent, title: string, body?: string) => void;
};

const HANDLE_POS = {
  t: Position.Top,
  b: Position.Bottom,
  l: Position.Left,
  r: Position.Right,
} as const;

function BlockNode({ data }: NodeProps<Node<BlockNodeData>>) {
  const { block, w, h, dim } = data;
  // A deliberately unnamed source: it anchors an edge and draws nothing, so the line appears
  // to begin in empty space. Handles still render, which is the entire point of the node.
  if (block.kind === "origin") {
    return (
      <div style={{ width: w, height: h, opacity: 0 }}>
        {(["t", "b", "l", "r"] as const).map((side) => (
          <span key={side}>
            <Handle type="source" id={side} position={HANDLE_POS[side]} style={{ opacity: 0 }} />
            <Handle type="target" id={`${side}-in`} position={HANDLE_POS[side]} style={{ opacity: 0 }} />
          </span>
        ))}
      </div>
    );
  }
  const style = block.kind === "actor" ? null : BLOCK_STYLE[block.kind];
  const cells = itemCells(block, { x: 0, y: 0, w, h });
  // A governance call-out is a control, not a component, so it gets no component box: the
  // title tab, the icon and the chip numbers stand on the band by themselves.
  const boxless = block.kind === "actor" || block.kind === "governance";
  return (
    <div
      style={{
        width: w,
        height: h,
        background: boxless ? "transparent" : "var(--paper, #fff)",
        border: boxless ? "none" : `1.5px ${style?.dash ? "dashed" : "solid"} ${style?.stroke}`,
        borderRadius: 8,
        position: "relative",
        fontFamily: "inherit",
        opacity: dim ? 0.25 : 1,
        transition: "opacity 150ms",
        cursor: "grab",
      }}
    >
      {(["t", "b", "l", "r"] as const).map((side) => {
        const pos =
          side === "t" ? Position.Top : side === "b" ? Position.Bottom : side === "l" ? Position.Left : Position.Right;
        return (
          <span key={side}>
            <Handle type="source" id={side} position={pos} style={{ opacity: 0 }} />
            <Handle type="target" id={`${side}-in`} position={pos} style={{ opacity: 0 }} />
          </span>
        );
      })}
      {block.kind !== "actor" && (
        <div
          style={{
            position: "absolute",
            top: -11,
            left: "50%",
            transform: "translateX(-50%)",
            background: blockTab(block),
            color: "#fff",
            font: "600 10px/1 var(--font-mono, monospace)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "6px 10px",
            borderRadius: 3,
            whiteSpace: "nowrap",
          }}
        >
          {block.title}
        </div>
      )}
      {block.kind === "actor" ? (
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: 11,
            color: "var(--ink, #222)",
          }}
        >
          <svg width="30" height="30" viewBox="0 0 30 30">
            <FlowIcon name={block.icon ?? "person"} x={15} y={15} size={26} color="var(--ink)" />
          </svg>
          <span style={{ fontWeight: 600 }}>{block.title}</span>
        </div>
      ) : (block.items?.length ?? 0) === 0 && block.icon ? (
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 26 26">
            <FlowIcon name={block.icon} x={13} y={13} size={24} />
          </svg>
          {(block.capabilities?.length ?? 0) + (data.pinnedCaps?.length ?? 0) > 0 && (
            <span style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center" }}>
              {[...new Set([...(block.capabilities ?? []), ...(data.pinnedCaps ?? [])])].map((id) => (
                <span
                  key={id}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    background: "var(--paper, #fff)",
                    border: "1.3px solid var(--chip, #4a5fd0)",
                    color: "var(--chip, #4a5fd0)",
                    font: "700 9.5px/14px var(--font-mono, monospace)",
                    textAlign: "center",
                  }}
                >
                  {data.capNumber?.get(id) ?? "?"}
                </span>
              ))}
            </span>
          )}
        </div>
      ) : (
        (block.items ?? []).map((item, i) => {
          const cell = cells[i];
          if (!cell) return null;
          return (
            <div
              key={item.id}
              onMouseEnter={(e) => data.onItemEnter(e, item.label, item.note)}
              onMouseLeave={(e) => data.onItemEnter(e, block.title, block.note)}
              style={{
                position: "absolute",
                left: cell.x + cell.w / 2,
                top: cell.y + cell.h / 2,
                transform: "translate(-50%, -50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                width: cell.w,
                textAlign: "center",
                fontSize: 10,
                lineHeight: 1.25,
                color: "var(--ink-2, #444)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22">
                <FlowIcon name={item.icon} x={11} y={11} size={20} />
              </svg>
              <span>{item.label}</span>
              {(item.capabilities?.length ?? 0) > 0 && (
                <span style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                  {item.capabilities!.map((id) => (
                    <span
                      key={id}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        background: "var(--paper, #fff)",
                        border: "1.2px solid var(--chip, #4a5fd0)",
                        color: "var(--chip, #4a5fd0)",
                        font: "700 8.5px/12px var(--font-mono, monospace)",
                        textAlign: "center",
                      }}
                    >
                      {data.capNumber?.get(id) ?? "?"}
                    </span>
                  ))}
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

/** Spike grammar: an ownership zone drawn as a labelled background band. */
const ZONE_TINT: Record<string, { fill: string; line: string; ink: string }> = {
  user: { fill: "#eef3f7", line: "#8ba6bd", ink: "#3d5a72" },
  endpoint: { fill: "#e7f2ef", line: "#7fb3a4", ink: "#2e7d5b" },
  cloud: { fill: "#eaf0fb", line: "#94aede", ink: "#3667c4" },
  vendor: { fill: "#fff4e6", line: "#dfb277", ink: "#b0710c" },
  external: { fill: "#f3eef9", line: "#a894ce", ink: "#6f4bb5" },
  governance: { fill: "#eef1f5", line: "#9aa3b0", ink: "#4b5b70" },
};

function ZoneNode({
  data,
}: NodeProps<Node<{ title: string; owner: string; w: number; h: number }>>) {
  const tint = ZONE_TINT[data.owner] ?? ZONE_TINT.user;
  return (
    <div
      style={{
        width: data.w,
        height: data.h,
        background: tint.fill,
        border: `1.5px solid ${tint.line}`,
        borderRadius: 14,
        position: "relative",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 0,
          right: 0,
          textAlign: "center",
          font: "700 10px/1 var(--font-mono, monospace)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: tint.ink,
        }}
      >
        {data.title}
      </div>
    </div>
  );
}

function ChipNode({ data }: NodeProps<Node<{ n: number; dim: boolean }>>) {
  return (
    <div
      style={{
        width: 18,
        height: 18,
        borderRadius: 9,
        background: "var(--paper, #fff)",
        border: "1.5px solid var(--chip, #4a5fd0)",
        color: "var(--chip, #4a5fd0)",
        font: "700 10px/15px var(--font-mono, monospace)",
        textAlign: "center",
        opacity: data.dim ? 0 : 1,
      }}
    >
      {data.n}
    </div>
  );
}

/** A coded risk tag at a build-validated spot; travels with its block. */
function TagNode({ data }: NodeProps<Node<{ code: string; w: number; dim: boolean }>>) {
  return (
    <div
      style={{
        width: data.w,
        height: TAG_H,
        borderRadius: 3,
        background: "var(--paper-2, #f4f4f2)",
        border: "1px solid var(--line, #ddd)",
        color: "var(--ink-2, #555)",
        font: `600 9.5px/${TAG_H - 2}px var(--font-mono, monospace)`,
        textAlign: "center",
        opacity: data.dim ? 0 : 1,
      }}
    >
      {data.code}
    </div>
  );
}

interface EdgePin {
  kind: "chip" | "tag" | "flow";
  dx: number;
  dy: number;
  n?: number;
  code?: string;
  w?: number;
  title: string;
  body?: string;
}

interface BuildPathData {
  d: string;
  live: boolean;
  midX: number;
  midY: number;
  pins: EdgePin[];
  pinsDim: boolean;
  onPinEnter: (event: React.MouseEvent, title: string, body?: string) => void;
  onPinLeave: () => void;
}

/**
 * Renders the build-computed path verbatim until either endpoint has been dragged, then falls
 * back to live orthogonal routing so edges follow the user's layout. The edge's capability
 * chips and risk tags render here too, offset from the current midpoint — so they travel with
 * the arrow when a block is dragged.
 */
function BuildPathEdge(props: EdgeProps) {
  const data = props.data as unknown as BuildPathData;
  let path = data?.d ?? "";
  let midX = data?.midX ?? 0;
  let midY = data?.midY ?? 0;
  if (data?.live) {
    const [sx, sy, tx, ty] = [props.sourceX, props.sourceY, props.targetX, props.targetY];
    if (Math.abs(tx - sx) > Math.abs(ty - sy)) {
      const ex = (sx + tx) / 2;
      path = `M ${sx} ${sy} L ${ex} ${sy} L ${ex} ${ty} L ${tx} ${ty}`;
      midX = ex;
      midY = (sy + ty) / 2;
    } else {
      const ey = (sy + ty) / 2;
      path = `M ${sx} ${sy} L ${sx} ${ey} L ${tx} ${ey} L ${tx} ${ty}`;
      midX = (sx + tx) / 2;
      midY = ey;
    }
  }
  return (
    <>
      <BaseEdge path={path} markerEnd={props.markerEnd} markerStart={props.markerStart} style={props.style} />
      {data?.pins?.length ? (
        <EdgeLabelRenderer>
          {data.pins.map((pin, i) => (
            <div
              key={i}
              onMouseEnter={(e) => data.onPinEnter(e, pin.title, pin.body)}
              onMouseLeave={data.onPinLeave}
              style={
                pin.kind === "flow"
                  ? {
                      position: "absolute",
                      transform: `translate(${midX + pin.dx}px, ${midY + pin.dy}px)`,
                      height: 17,
                      padding: "0 7px",
                      borderRadius: 9,
                      background: "var(--ink, #1c1e21)",
                      color: "#fff",
                      font: "700 9.5px/17px var(--font-mono, monospace)",
                      letterSpacing: "0.04em",
                      textAlign: "center",
                      // Step badges exist only while a walk is selected — the same state that
                      // dims every other pin — so they must never share the pins' fade.
                      opacity: 1,
                      pointerEvents: "all",
                      zIndex: 11,
                    }
                  : pin.kind === "chip"
                  ? {
                      position: "absolute",
                      transform: `translate(${midX + pin.dx - 9}px, ${midY + pin.dy - 9}px)`,
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      background: "var(--paper, #fff)",
                      border: "1.5px solid var(--chip, #4a5fd0)",
                      color: "var(--chip, #4a5fd0)",
                      font: "700 10px/15px var(--font-mono, monospace)",
                      textAlign: "center",
                      opacity: data.pinsDim ? 0 : 1,
                      pointerEvents: "all",
                      zIndex: 10,
                    }
                  : {
                      position: "absolute",
                      transform: `translate(${midX + pin.dx}px, ${midY + pin.dy}px)`,
                      width: pin.w,
                      height: TAG_H,
                      borderRadius: 3,
                      background: "var(--paper-2, #f4f4f2)",
                      border: "1px solid var(--line, #ddd)",
                      color: "var(--ink-2, #555)",
                      font: `600 9.5px/${TAG_H - 2}px var(--font-mono, monospace)`,
                      textAlign: "center",
                      opacity: data.pinsDim ? 0 : 1,
                      pointerEvents: "all",
                      zIndex: 10,
                    }
              }
            >
              {pin.kind === "chip" ? pin.n : pin.code}

            </div>
          ))}
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

const nodeTypes = { block: BlockNode, chip: ChipNode, tag: TagNode, zone: ZoneNode };
const edgeTypes = { buildPath: BuildPathEdge };

/** Pick the facing handle pair from the two blocks' initial geometry. */
function facing(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  const dx = b.x + b.w / 2 - (a.x + a.w / 2);
  const dy = b.y + b.h / 2 - (a.y + a.h / 2);
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? (["r", "l-in"] as const) : (["l", "r-in"] as const);
  return dy > 0 ? (["b", "t-in"] as const) : (["t", "b-in"] as const);
}

export function FlowDiagramRF({
  archetype,
  walk = null,
  className,
}: {
  archetype: Archetype;
  /** The selected sequence data flow, or null — the resting drawing carries no step numbers. */
  walk?: Scenario | null;
  className?: string;
}) {
  const [card, setCard] = useState<HoverCard | null>(null);
  const [dragged, setDragged] = useState<ReadonlySet<string>>(new Set());
  // Hovering one arrow pulls it out of the bundle — the interactive half of the answer to
  // "which line goes where", alongside the fanned anchor points the layout computes.
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  // The drawing rests unnumbered: blocks, arrows, chips and tags, and nothing else. Selecting a
  // sequence data flow numbers its steps onto the arrows it uses and dims the rest. Every walk
  // behaves the same way, so a number on a drawing means one thing — the step you are on — and
  // it is only ever there because somebody asked for it.
  const walkEdges = useMemo(() => new Set(walk?.steps.map((s) => s.follow) ?? []), [walk]);
  const walkBlocks = useMemo(
    () => new Set(walk?.steps.flatMap((s) => s.follow.split("->")) ?? []),
    [walk],
  );
  const inScenario = Boolean(walk);


  const cardAt = useCallback((event: React.MouseEvent, title: string, body?: string) => {
    const wrap = (event.target as HTMLElement).closest("[data-rfwrap]");
    const rect = wrap?.getBoundingClientRect();
    if (!rect) return;
    setCard({
      x: Math.min(event.clientX - rect.left + 12, rect.width - 280),
      y: Math.min(event.clientY - rect.top + 12, rect.height - 120),
      title,
      body,
    });
  }, []);
  const onPinLeave = useCallback(() => setCard(null), []);

  const initialNodes = useMemo(() => {
    const { layout } = archetype;
    // Containment comes from the architecture's own `parent` links now, at any depth.
    const kidsOf = new Map<string, string[]>();
    for (const b of archetype.blocks) {
      if (!b.parent) continue;
      if (!kidsOf.has(b.parent)) kidsOf.set(b.parent, []);
      kidsOf.get(b.parent)!.push(b.id);
    }
    const rects = layout.blocks;
    const capNumber = new Map(archetype.capabilities.map((id, i) => [id, i + 1]));

    const nodes: Node[] = [];

    // Ownership bands as full-height background columns. The horizontal extent
    // comes from each zone's own members; the vertical extent is shared across every zone, so
    // the bands read as columns and a crossing is a horizontal move between two of them.
    // Governance is drawn as a full-width band beneath the columns: it applies to every other
    // band, including what may be reached externally, so it cannot be one of them.
    const govZoneIds = new Set(
      (archetype.zones ?? []).filter((z) => z.owner === "governance").map((z) => z.id),
    );
    const colRects = archetype.blocks
      .filter((b) => !govZoneIds.has(b.zone ?? ""))
      .map((b) => rects[b.id])
      .filter(Boolean);
    // bandTop comes from the layout, which knows how far the first row's risk-tag stacks rise
    // above their blocks. Recomputing it from block rects alone drops those tags outside the band.
    const bandTop = colRects.length ? layout.bandTop : 0;
    const bandBottom = colRects.length
      ? Math.max(...colRects.map((r) => r.y + r.h)) + ZONE_PAD
      : 0;
    // A band spans the GRID COLUMNS its members occupy, not the members' own rects. A band
    // holding only a narrow actor figure used to draw 108px wide against a 176px column and
    // leave a visible gutter beside it; deriving from the column closes that.
    const cols = archetype.layout.columns ?? [];
    const spanOf = (zoneId: string) => {
      const cs = archetype.blocks.filter((b) => b.zone === zoneId && !b.parent).map((b) => b.col);
      if (!cs.length) return null;
      const lo = cols[Math.min(...cs)];
      const hi = cols[Math.max(...cs)];
      return lo && hi ? { x0: lo.x - ZONE_PAD, x1: hi.x + hi.w + ZONE_PAD } : null;
    };
    for (const zone of archetype.zones ?? []) {
      const rs = archetype.blocks.filter((b) => b.zone === zone.id).map((b) => rects[b.id]).filter(Boolean);
      if (!rs.length) continue;
      // The governance band's rect is the layout's: as wide as the ownership bands together,
      // one band gutter beneath them — never derived from its own call-outs.
      const gov = zone.owner === "governance" ? layout.govBand : undefined;
      const span = spanOf(zone.id);
      const x0 = gov ? gov.x : (span?.x0 ?? Math.min(...rs.map((r) => r.x)) - ZONE_PAD);
      const x1 = gov ? gov.x + gov.w : (span?.x1 ?? Math.max(...rs.map((r) => r.x + r.w)) + ZONE_PAD);
      const y0 = gov ? gov.y : bandTop;
      const y1 = gov ? gov.y + gov.h : bandBottom;
      nodes.push({
        id: `__zone_${zone.id}`,
        type: "zone",
        position: { x: x0, y: y0 },
        data: { title: zone.title, owner: zone.owner, note: zone.note, w: x1 - x0, h: y1 - y0 },
        style: { width: x1 - x0, height: y1 - y0 },
        draggable: false,
        selectable: false,
        zIndex: -3,
      });
    }
    // Blocks are emitted parents-first, because React Flow requires a parent node to appear
    // before its children. Depth is unbounded — the walk recurses.
    const byId = new Map(archetype.blocks.map((b) => [b.id, b]));
    const emit = (id: string, depth: number) => {
      const block = byId.get(id);
      if (!block) return;
      const r = rects[id];
      const parentRect = block.parent ? rects[block.parent] : undefined;
      nodes.push({
        id,
        type: "block",
        position: parentRect ? { x: r.x - parentRect.x, y: r.y - parentRect.y } : { x: r.x, y: r.y },
        parentId: block.parent,
        data: {
          block,
          w: r.w,
          h: r.h,
          dim: false,
          onItemEnter: cardAt,
          capNumber,
          pinnedCaps:
            block.kind === "governance"
              ? archetype.pins.capabilities.filter((p) => p.at === id).map((p) => p.capability)
              : undefined,
        },
        draggable: true,
        selectable: false,
        // A container sits behind what it contains, deeper nesting drawing progressively above.
        zIndex: kidsOf.has(id) ? -2 + depth : depth,
        style: { width: r.w, height: r.h },
      });
      for (const kid of kidsOf.get(id) ?? []) emit(kid, depth + 1);
    };
    for (const block of archetype.blocks) if (!block.parent) emit(block.id, 0);

    // Pins sit at the same spots the SVG renderer and the build checks use. Block-anchored
    // pins are children of their block, so they travel when the user drags it.

    const chipGroups = new Map<string, { capability: string; note?: string }[]>();
    for (const pin of archetype.pins.capabilities) {
      if (!chipGroups.has(pin.at)) chipGroups.set(pin.at, []);
      chipGroups.get(pin.at)!.push(pin);
    }
    for (const [at, pins] of chipGroups) {
      if (at.includes("->")) continue; // edge-anchored chips render inside the edge itself
      if (byId.get(at)?.kind === "governance") continue; // drawn in the call-out's own chip row
      const blockRect = rects[at];
      if (!blockRect) continue;
      const spots = chipSpots(pins.length, blockRect, undefined);
      pins.forEach((pin, i) => {
        const spot = spots[i];
        if (!spot) return;
        const n = capNumber.get(pin.capability) ?? 0;
        const cap = capabilityById.get(pin.capability);
        nodes.push({
          id: `chip:${at}:${pin.capability}`,
          type: "chip",
          position: { x: spot.x - 9 - blockRect.x, y: spot.y - 9 - blockRect.y },
          parentId: at,
          data: {
            n,
            dim: false,
            title: `${n} · ${cap?.title ?? pin.capability}`,
            body: pin.note,
          },
          draggable: false,
          selectable: false,
          zIndex: 10,
        });
      });
    }

    const tagGroups = new Map<string, { risk: string; note?: string }[]>();
    for (const pin of archetype.pins.risks) {
      if (!tagGroups.has(pin.at)) tagGroups.set(pin.at, []);
      tagGroups.get(pin.at)!.push(pin);
    }
    for (const [at, pins] of tagGroups) {
      if (at.includes("->")) continue; // edge-anchored tags render inside the edge itself
      const blockRect = rects[at];
      if (!blockRect) continue;
      const codes = pins.map((p) => riskCode(p.risk));
      const { rects: tagRects } = tagSpots(codes.map(tagWidth), blockRect, undefined);
      pins.forEach((pin, i) => {
        const r = tagRects[i];
        if (!r) return;
        const risk = riskById.get(pin.risk);
        nodes.push({
          id: `tag:${at}:${pin.risk}`,
          type: "tag",
          position: { x: r.x - blockRect.x, y: r.y - blockRect.y },
          parentId: at,
          data: {
            code: codes[i],
            w: r.w,
            dim: false,
            title: `${codes[i]} · ${risk?.title ?? pin.risk}`,
            body: pin.note,
          },
          draggable: false,
          selectable: false,
          zIndex: 10,
        });
      });
    }
    return nodes;
  }, [archetype, cardAt]);

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [lastId, setLastId] = useState(archetype.id);
  if (lastId !== archetype.id) {
    setLastId(archetype.id);
    setNodes(initialNodes);
    setDragged(new Set());
    setCard(null);
  }

  // Scenario fade is derived at render time, so dragged positions survive scenario changes.
  const displayNodes = useMemo(
    () =>
      nodes.map((n) => {
        if (n.type === "block") {
          const dim =
            inScenario && !walkBlocks.has(n.id);
          return { ...n, data: { ...n.data, dim } };
        }
        if (n.type === "chip" || n.type === "tag") {
          return { ...n, data: { ...n.data, dim: inScenario } };
        }
        return n;
      }),
    [nodes, inScenario, walkBlocks],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((ns) => applyNodeChanges(changes, ns)),
    [],
  );

  const edges = useMemo(() => {
    const { layout } = archetype;
    const descendants = (id: string): string[] => {
      const kids = archetype.blocks.filter((b) => b.parent === id).map((b) => b.id);
      return kids.flatMap((k) => [k, ...descendants(k)]);
    };
    const rects = layout.blocks;
    const edgeGeo = new Map(layout.edges.map((g) => [`${g.from}->${g.to}`, g]));
    // Dragging a container carries everything nested inside it, however deep.
    const moved = new Set([...dragged, ...[...dragged].flatMap(descendants)]);

    // Edge-anchored pins, as offsets from the build midpoint — the edge component re-bases
    // them on the live midpoint once an endpoint moves, so they travel with the arrow.
    const capNumber = new Map(archetype.capabilities.map((id, i) => [id, i + 1]));
    const pinsByEdge = new Map<string, EdgePin[]>();
    const chipGroups = new Map<string, { capability: string; note?: string }[]>();
    for (const pin of archetype.pins.capabilities) {
      if (!pin.at.includes("->")) continue;
      if (!chipGroups.has(pin.at)) chipGroups.set(pin.at, []);
      chipGroups.get(pin.at)!.push(pin);
    }
    for (const [at, pins] of chipGroups) {
      const geo = edgeGeo.get(at);
      if (!geo) continue;
      const spots = chipSpots(pins.length, undefined, geo);
      const list = pinsByEdge.get(at) ?? [];
      pins.forEach((pin, i) => {
        const spot = spots[i];
        if (!spot) return;
        const n = capNumber.get(pin.capability) ?? 0;
        const cap = capabilityById.get(pin.capability);
        list.push({
          kind: "chip",
          dx: spot.x - geo.midX,
          dy: spot.y - geo.midY,
          n,
          title: `${n} · ${cap?.title ?? pin.capability}`,
          body: pin.note,
        });
      });
      pinsByEdge.set(at, list);
    }
    const tagGroups = new Map<string, { risk: string; note?: string }[]>();
    for (const pin of archetype.pins.risks) {
      if (!pin.at.includes("->")) continue;
      if (!tagGroups.has(pin.at)) tagGroups.set(pin.at, []);
      tagGroups.get(pin.at)!.push(pin);
    }
    for (const [at, pins] of tagGroups) {
      const geo = edgeGeo.get(at);
      if (!geo) continue;
      const codes = pins.map((p) => riskCode(p.risk));
      const { rects: tagRects } = tagSpots(codes.map(tagWidth), undefined, geo);
      const list = pinsByEdge.get(at) ?? [];
      pins.forEach((pin, i) => {
        const r = tagRects[i];
        if (!r) return;
        const risk = riskById.get(pin.risk);
        list.push({
          kind: "tag",
          dx: r.x - geo.midX,
          dy: r.y - geo.midY,
          code: codes[i],
          w: r.w,
          title: `${codes[i]} · ${risk?.title ?? pin.risk}`,
          body: pin.note,
        });
      });
      pinsByEdge.set(at, list);
    }

    // Step numbers for the active walk. A walk may cross the same arrow twice — a round trip
    // means something different each way — so numbers stack on that arrow, which is the one
    // case where two badges on one edge is the correct drawing rather than a defect.
    const stepsByEdge = new Map<string, { n: number; note?: string }[]>();
    (walk?.steps ?? []).forEach((st, i) => {
      const geo = edgeGeo.get(st.follow) ?? edgeGeo.get(st.follow.split("->").reverse().join("->"));
      if (!geo) return;
      const key = `${geo.from}->${geo.to}`;
      stepsByEdge.set(key, [...(stepsByEdge.get(key) ?? []), { n: i + 1, note: st.note }]);
    });
    for (const [key, steps] of stepsByEdge) {
      const geo = edgeGeo.get(key)!;
      const spots = flowBadgeSpots(steps.length, geo);
      const list = pinsByEdge.get(key) ?? [];
      steps.forEach((step, i) => {
        list.push({
          kind: "flow",
          dx: spots[i].x - geo.midX,
          dy: spots[i].y - geo.midY,
          code: String(step.n),
          title: `Step ${step.n} · ${walk?.title ?? ""}`,
          body: step.note,
        });
      });
      pinsByEdge.set(key, list);
    }

    const out: Edge[] = [];
    for (const e of archetype.edges) {
      const key = `${e.from}->${e.to}`;
      const geo = edgeGeo.get(key);
      if (!geo) continue;
      const style = PATH_STYLE[e.path];
      const dimmed = inScenario && !walkEdges.has(key);
      const traced = hoveredEdge === key;
      const otherTraced = hoveredEdge !== null && !traced;
      const live = moved.has(e.from) || moved.has(e.to);
      const [sh, th] = facing(rects[e.from], rects[e.to]);
      out.push({
        id: key,
        source: e.from,
        target: e.to,
        sourceHandle: sh,
        targetHandle: th,
        type: "buildPath",
        data: {
          d: geo.d,
          live,
          midX: geo.midX,
          midY: geo.midY,
          label: e.label,
          note: e.note,
          pins: pinsByEdge.get(key) ?? [],
          pinsDim: inScenario,
          onPinEnter: cardAt,
          onPinLeave,
        },
        style: {
          stroke: style.stroke,
          strokeWidth: traced ? 3.4 : 1.8,
          strokeDasharray: style.dash,
          opacity: dimmed ? 0.15 : otherTraced ? 0.2 : 1,
        },
        zIndex: traced ? 20 : undefined,
        markerEnd: { type: "arrowclosed" as never, color: style.stroke, width: 14, height: 14 },
        markerStart: e.bidir
          ? { type: "arrowclosed" as never, color: style.stroke, width: 14, height: 14 }
          : undefined,
      });
    }
    return out;
  }, [archetype, walk, inScenario, walkEdges, hoveredEdge, dragged, cardAt, onPinLeave]);

  return (
    <div data-rfwrap className={className} style={{ height: "min(640px, 70vh)", position: "relative" }}>
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStart={(_, n) => {
          setDragged((prev) => new Set(prev).add(n.id));
          setCard(null);
        }}
        onNodeMouseEnter={(event, node) => {
          if (node.type === "block") {
            const block = (node.data as BlockNodeData).block;
            cardAt(event, block.title, block.note);
          } else if (node.type === "chip" || node.type === "tag") {
            const d = node.data as { title?: string; label?: string; note?: string; body?: string };
            cardAt(event, d.title ?? d.label ?? "", d.body ?? d.note);
          }
        }}
        onNodeMouseLeave={() => setCard(null)}
        onEdgeMouseEnter={(event, edge) => {
          setHoveredEdge(edge.id);
          const d = edge.data as { label?: string; note?: string };
          const e = archetype.edges.find((x) => `${x.from}->${x.to}` === edge.id);
          const fromTitle = archetype.blocks.find((b) => b.id === e?.from)?.title ?? e?.from;
          const toTitle = archetype.blocks.find((b) => b.id === e?.to)?.title ?? e?.to;
          cardAt(event, d.label ?? `${fromTitle} → ${toTitle}`, d.note);
        }}
        onEdgeMouseLeave={() => {
          setHoveredEdge(null);
          setCard(null);
        }}
        onMoveStart={() => setCard(null)}
        fitView
        fitViewOptions={{ padding: 0.05 }}
        minZoom={0.2}
        maxZoom={4}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: false }}
      >
        <Background gap={24} size={1} />
      </ReactFlow>
      {card && (
        <div
          style={{
            position: "absolute",
            left: card.x,
            top: card.y,
            width: 268,
            zIndex: 30,
            pointerEvents: "none",
            background: "var(--paper, #fff)",
            border: "1px solid var(--line, #ddd)",
            borderRadius: 8,
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
            padding: "8px 10px",
          }}
        >
          <div style={{ font: "600 11px/1.3 var(--font-body, sans-serif)", color: "var(--ink, #222)" }}>
            {card.title}
          </div>
          {card.body && (
            <div style={{ marginTop: 4, font: "400 10.5px/1.45 var(--font-body, sans-serif)", color: "var(--ink-2, #555)" }}>
              {card.body}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
