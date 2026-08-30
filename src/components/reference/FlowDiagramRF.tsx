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
import { chipSpots, itemCells, TAG_H, tagSpots } from "@/lib/flow-layout";
import type { ArchBlock, Archetype } from "@/lib/types";
import { blockTab, BLOCK_STYLE, PATH_STYLE, tagWidth } from "./flow-style";
import { FlowIcon } from "./FlowIcons";

import { FRAME_HEAD, FRAME_PAD, RF_CONFIG } from "./rf-config";

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
  /** Shows the shared hover card — items use it so each icon can explain itself. */
  onItemEnter: (event: React.MouseEvent, title: string, body?: string) => void;
};

function BlockNode({ data }: NodeProps<Node<BlockNodeData>>) {
  const { block, w, h, dim } = data;
  const style = block.kind === "actor" ? null : BLOCK_STYLE[block.kind];
  const cells = itemCells(block, { x: 0, y: 0, w, h });
  return (
    <div
      style={{
        width: w,
        height: h,
        background: block.kind === "actor" ? "transparent" : "var(--paper, #fff)",
        border:
          block.kind === "actor"
            ? "none"
            : `${block.kind === "governance" ? 1 : 1.5}px ${style?.dash ? "dashed" : "solid"} ${style?.stroke}`,
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
  enterprise: { fill: "#fff4e6", line: "#dfb277", ink: "#b0710c" },
  external: { fill: "#f3eef9", line: "#a894ce", ink: "#6f4bb5" },
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

function FrameNode({
  data,
}: NodeProps<Node<{ label: string; w: number; h: number; labelPos?: "top" | "bottom" }>>) {
  return (
    <div
      style={{
        width: data.w,
        height: data.h,
        border: "2px dashed var(--ink-3, #999)",
        borderRadius: 12,
        background: "color-mix(in srgb, var(--ink-3, #999) 6%, transparent)",
        cursor: "grab",
      }}
    >
      <div
        style={{
          position: "absolute",
          ...(data.labelPos === "bottom" ? { bottom: -12 } : { top: -12 }),
          left: 18,
          background: "var(--ink, #333)",
          color: "#fff",
          font: "600 10px/1 var(--font-mono, monospace)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "6px 10px",
          borderRadius: 3,
        }}
      >
        {data.label}
      </div>
    </div>
  );
}

/** A numbered capability chip at a build-validated spot; travels with its block. */
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
                      opacity: data.pinsDim ? 0 : 1,
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

const nodeTypes = { block: BlockNode, frame: FrameNode, chip: ChipNode, tag: TagNode, zone: ZoneNode };
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
  scenario = null,
  flow = null,
  className,
}: {
  archetype: Archetype;
  scenario?: number | null;
  /** Spike grammar: the highlighted numbered flow, by id. */
  flow?: string | null;
  className?: string;
}) {
  const cfg = RF_CONFIG[archetype.id];
  const [card, setCard] = useState<HoverCard | null>(null);
  const [dragged, setDragged] = useState<ReadonlySet<string>>(new Set());

  const walk = scenario !== null ? archetype.scenarios?.[scenario] : undefined;
  const walkEdges = useMemo(() => new Set(walk?.steps.map((s) => s.follow) ?? []), [walk]);
  const walkBlocks = useMemo(
    () => new Set(walk?.steps.flatMap((s) => s.follow.split("->")) ?? []),
    [walk],
  );
  const inScenario = Boolean(walk);

  // Spike grammar: the active numbered flow, and the edge set it runs over (either direction).
  const activeFlow = flow ? archetype.flows?.find((f) => f.id === flow) : undefined;
  const flowEdges = useMemo(() => {
    const s = new Set<string>();
    for (const ref of activeFlow?.path ?? []) {
      s.add(ref);
      const [a, b] = ref.split("->");
      if (a && b) s.add(`${b}->${a}`);
    }
    return s;
  }, [activeFlow]);
  const inFlow = Boolean(activeFlow);
  const flowBlocks = useMemo(
    () => new Set((activeFlow?.path ?? []).flatMap((ref) => ref.split("->"))),
    [activeFlow],
  );

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
    const hidden = new Set(cfg?.hide ?? []);
    const members = new Set(cfg?.members ?? []);
    const rects = layout.blocks;

    let frame: { x: number; y: number; w: number; h: number } | null = null;
    if (cfg && cfg.members.length) {
      const rs = cfg.members.map((id) => rects[id]).filter(Boolean);
      const x0 = Math.min(...rs.map((r) => r.x)) - FRAME_PAD;
      const y0 = Math.min(...rs.map((r) => r.y)) - FRAME_PAD - FRAME_HEAD;
      const x1 = Math.max(...rs.map((r) => r.x + r.w)) + FRAME_PAD;
      const y1 = Math.max(...rs.map((r) => r.y + r.h)) + FRAME_PAD;
      frame = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }

    const nodes: Node[] = [];
    // Spike grammar: ownership zones as background bands, sized from their members.
    const ZONE_PAD = 22;
    const ZONE_HEAD = 30;
    for (const zone of archetype.zones ?? []) {
      const rs = archetype.blocks.filter((b) => b.zone === zone.id).map((b) => rects[b.id]).filter(Boolean);
      if (!rs.length) continue;
      const x0 = Math.min(...rs.map((r) => r.x)) - ZONE_PAD;
      const y0 = Math.min(...rs.map((r) => r.y)) - ZONE_PAD - ZONE_HEAD;
      const x1 = Math.max(...rs.map((r) => r.x + r.w)) + ZONE_PAD;
      const y1 = Math.max(...rs.map((r) => r.y + r.h)) + ZONE_PAD;
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
    if (frame && cfg) {
      nodes.push({
        id: "__frame",
        type: "frame",
        position: { x: frame.x, y: frame.y },
        data: { label: cfg.frameLabel, note: cfg.frameNote, w: frame.w, h: frame.h, labelPos: cfg.labelPos },
        style: { width: frame.w, height: frame.h },
        draggable: true,
        selectable: false,
        zIndex: -1,
      });
    }
    for (const block of archetype.blocks) {
      if (hidden.has(block.id)) continue;
      const r = rects[block.id];
      const inFrame = frame && members.has(block.id);
      nodes.push({
        id: block.id,
        type: "block",
        position: inFrame && frame ? { x: r.x - frame.x, y: r.y - frame.y } : { x: r.x, y: r.y },
        parentId: inFrame ? "__frame" : undefined,
        data: { block, w: r.w, h: r.h, dim: false, onItemEnter: cardAt },
        draggable: true,
        style: { width: r.w, height: r.h },
      });
    }

    // Pins sit at the same spots the SVG renderer and the build checks use. Block-anchored
    // pins are children of their block, so they travel when the user drags it.
    const capNumber = new Map(archetype.capabilities.map((id, i) => [id, i + 1]));

    const chipGroups = new Map<string, { capability: string; note?: string }[]>();
    for (const pin of archetype.pins.capabilities) {
      if (!chipGroups.has(pin.at)) chipGroups.set(pin.at, []);
      chipGroups.get(pin.at)!.push(pin);
    }
    for (const [at, pins] of chipGroups) {
      if (at.includes("->")) continue; // edge-anchored chips render inside the edge itself
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
  }, [archetype, cfg, cardAt]);

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
            (inScenario && !walkBlocks.has(n.id)) || (inFlow && !flowBlocks.has(n.id));
          return { ...n, data: { ...n.data, dim } };
        }
        if (n.type === "chip" || n.type === "tag") {
          return { ...n, data: { ...n.data, dim: inScenario } };
        }
        return n;
      }),
    [nodes, inScenario, walkBlocks, inFlow, flowBlocks],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((ns) => applyNodeChanges(changes, ns)),
    [],
  );

  const edges = useMemo(() => {
    const { layout } = archetype;
    const hidden = new Set(cfg?.hide ?? []);
    const members = new Set(cfg?.members ?? []);
    const rects = layout.blocks;
    const edgeGeo = new Map(layout.edges.map((g) => [`${g.from}->${g.to}`, g]));
    // Dragging the frame moves every member block with it.
    const moved = dragged.has("__frame") ? new Set([...dragged, ...members]) : dragged;

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

    // Spike grammar: the numbered flow tags each edge carries, stacked under the midpoint.
    for (const f of archetype.flows ?? []) {
      for (const ref of f.path) {
        const geo = edgeGeo.get(ref) ?? edgeGeo.get(ref.split("->").reverse().join("->"));
        if (!geo) continue;
        const key = `${geo.from}->${geo.to}`;
        const list = pinsByEdge.get(key) ?? [];
        const nth = list.filter((p) => p.kind === "flow").length;
        list.push({
          kind: "flow",
          dx: -14 + nth * 30,
          dy: 16,
          code: f.id,
          title: `${f.id} · ${f.title}`,
          body: f.moves,
        });
        pinsByEdge.set(key, list);
      }
    }

    const out: Edge[] = [];
    for (const e of archetype.edges) {
      if (hidden.has(e.from) || hidden.has(e.to)) continue;
      const key = `${e.from}->${e.to}`;
      const geo = edgeGeo.get(key);
      if (!geo) continue;
      const style = PATH_STYLE[e.path];
      const dimmed = (inScenario && !walkEdges.has(key)) || (inFlow && !flowEdges.has(key));
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
          strokeWidth: 1.8,
          strokeDasharray: style.dash,
          opacity: dimmed ? 0.15 : 1,
        },
        markerEnd: { type: "arrowclosed" as never, color: style.stroke, width: 14, height: 14 },
        markerStart: e.bidir
          ? { type: "arrowclosed" as never, color: style.stroke, width: 14, height: 14 }
          : undefined,
      });
    }
    return out;
  }, [archetype, cfg, inScenario, walkEdges, inFlow, flowEdges, dragged, cardAt, onPinLeave]);

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
          } else if (node.type === "chip" || node.type === "tag" || node.type === "frame") {
            const d = node.data as { title?: string; label?: string; note?: string; body?: string };
            cardAt(event, d.title ?? d.label ?? "", d.body ?? d.note);
          }
        }}
        onNodeMouseLeave={() => setCard(null)}
        onEdgeMouseEnter={(event, edge) => {
          const d = edge.data as { label?: string; note?: string };
          const e = archetype.edges.find((x) => `${x.from}->${x.to}` === edge.id);
          const fromTitle = archetype.blocks.find((b) => b.id === e?.from)?.title ?? e?.from;
          const toTitle = archetype.blocks.find((b) => b.id === e?.to)?.title ?? e?.to;
          cardAt(event, d.label ?? `${fromTitle} → ${toTitle}`, d.note);
        }}
        onEdgeMouseLeave={() => setCard(null)}
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
