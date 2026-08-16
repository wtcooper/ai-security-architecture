"use client";

/**
 * React Flow renderer for the flow-style architectures — the second leg of the renderer
 * bake-off, promoted to a full view where containment matters. Geometry is enforced exactly as
 * in the SVG engine: node positions are the build-time rects, and edges render the
 * build-computed path strings verbatim, so every pixel drawn is a pixel the collision checks
 * validated. Capability chips and risk tags sit at the same chipSpots/tagSpots the SVG uses;
 * the containment frame is the one thing this renderer can draw that the SVG cannot.
 */
import { useMemo } from "react";
import {
  Background,
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { capabilityById, riskById, riskCode } from "@/lib/data";
import { chipSpots, itemCells, TAG_H, tagSpots } from "@/lib/flow-layout";
import type { ArchBlock, Archetype } from "@/lib/types";
import { blockTab, BLOCK_STYLE, PATH_STYLE, tagWidth } from "./flow-style";
import { FlowIcon } from "./FlowIcons";

/**
 * The containment layer: which blocks each architecture draws inside a labelled frame. Only
 * architectures listed here offer the React Flow view; `rfDefault` makes it the default engine.
 */
const RF_CONFIG: Record<
  string,
  { frameLabel: string; frameNote: string; members: string[]; hide: string[]; rfDefault?: boolean }
> = {
  archSandboxedExecution: {
    frameLabel: "Disposable sandbox",
    frameNote:
      "Provisioned per task, destroyed after — untrusted code and untrusted content execute together inside",
    members: ["sandbox", "sourceContent"],
    hide: [],
  },
  archPersonalAgent: {
    frameLabel: "Sandbox",
    frameNote:
      "MicroVM-class boundary: daemon, memory and tools run whole inside, with their own filesystem and network. The AI gateway is the only exit (target state)",
    members: ["bridges", "toolPlane", "harness", "memory"],
    hide: [],
    rfDefault: true,
  },
};

export const hasReactFlowVersion = (id: string) => id in RF_CONFIG;
export const reactFlowIsDefault = (id: string) => Boolean(RF_CONFIG[id]?.rfDefault);

const FRAME_PAD = 26;
const FRAME_HEAD = 52;

type BlockNodeData = { block: ArchBlock; w: number; h: number; dim: boolean };

function BlockNode({ data }: NodeProps<Node<BlockNodeData>>) {
  const { block, w, h, dim } = data;
  const style = block.kind === "actor" ? null : BLOCK_STYLE[block.kind];
  const cells = itemCells(block, { x: 0, y: 0, w, h });
  return (
    <div
      title={block.note}
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
              title={item.note}
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

function FrameNode({ data }: NodeProps<Node<{ label: string; note: string; w: number; h: number }>>) {
  return (
    <div
      style={{
        width: data.w,
        height: data.h,
        border: "2px dashed var(--ink-3, #999)",
        borderRadius: 12,
        background: "color-mix(in srgb, var(--ink-3, #999) 6%, transparent)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -12,
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
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 18,
          right: 18,
          fontSize: 10,
          color: "var(--ink-2, #555)",
        }}
      >
        {data.note}
      </div>
    </div>
  );
}

/** A numbered capability chip at a build-validated spot. */
function ChipNode({ data }: NodeProps<Node<{ n: number; tip: string; dim: boolean }>>) {
  return (
    <div
      title={data.tip}
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

/** A coded risk tag at a build-validated spot. */
function TagNode({ data }: NodeProps<Node<{ code: string; w: number; tip: string; dim: boolean }>>) {
  return (
    <div
      title={data.tip}
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

/**
 * Renders the build-computed path verbatim, so the drawn geometry is exactly what the
 * collision checks validated.
 */
function BuildPathEdge({ data, markerEnd, markerStart, label, style }: EdgeProps) {
  const d = (data as { d: string; midX: number; midY: number }) ?? { d: "", midX: 0, midY: 0 };
  return (
    <>
      <BaseEdge path={d.d} markerEnd={markerEnd} markerStart={markerStart} style={style} />
      {label ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${d.midX}px, ${d.midY - 10}px)`,
              fontSize: 9,
              color: "var(--ink-2, #555)",
              background: "var(--paper, #fff)",
              padding: "0 3px",
              pointerEvents: "none",
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

const nodeTypes = { block: BlockNode, frame: FrameNode, chip: ChipNode, tag: TagNode };
const edgeTypes = { buildPath: BuildPathEdge };

export function FlowDiagramRF({
  archetype,
  scenario = null,
  className,
}: {
  archetype: Archetype;
  scenario?: number | null;
  className?: string;
}) {
  const cfg = RF_CONFIG[archetype.id];

  const { nodes, edges } = useMemo(() => {
    const { layout } = archetype;
    const hidden = new Set(cfg?.hide ?? []);
    const members = new Set(cfg?.members ?? []);
    const rects = layout.blocks;
    const walk = scenario !== null ? archetype.scenarios?.[scenario] : undefined;
    const walkEdges = new Set(walk?.steps.map((s) => s.follow) ?? []);
    const walkBlocks = new Set(walk?.steps.flatMap((s) => s.follow.split("->")) ?? []);
    const inScenario = Boolean(walk);

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
    if (frame && cfg) {
      nodes.push({
        id: "__frame",
        type: "frame",
        position: { x: frame.x, y: frame.y },
        data: { label: cfg.frameLabel, note: cfg.frameNote, w: frame.w, h: frame.h },
        style: { width: frame.w, height: frame.h },
        draggable: false,
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
        extent: inFrame ? ("parent" as const) : undefined,
        data: { block, w: r.w, h: r.h, dim: inScenario && !walkBlocks.has(block.id) },
        draggable: false,
        style: { width: r.w, height: r.h },
      });
    }

    // --- Pins: the same spots the SVG renderer and the build checks use ---------------
    const capNumber = new Map(archetype.capabilities.map((id, i) => [id, i + 1]));
    const edgeGeo = new Map(layout.edges.map((g) => [`${g.from}->${g.to}`, g]));
    const anchorArgs = (at: string) =>
      at.includes("->")
        ? { block: undefined, edge: edgeGeo.get(at) }
        : { block: rects[at], edge: undefined };

    const chipGroups = new Map<string, { capability: string; note?: string }[]>();
    for (const pin of archetype.pins.capabilities) {
      if (!chipGroups.has(pin.at)) chipGroups.set(pin.at, []);
      chipGroups.get(pin.at)!.push(pin);
    }
    for (const [at, pins] of chipGroups) {
      const { block, edge } = anchorArgs(at);
      if (!block && !edge) continue;
      const spots = chipSpots(pins.length, block, edge);
      pins.forEach((pin, i) => {
        const spot = spots[i];
        if (!spot) return;
        const n = capNumber.get(pin.capability) ?? 0;
        const cap = capabilityById.get(pin.capability);
        nodes.push({
          id: `chip:${at}:${pin.capability}`,
          type: "chip",
          position: { x: spot.x - 9, y: spot.y - 9 },
          data: {
            n,
            tip: `${n} · ${cap?.title ?? pin.capability}${pin.note ? ` — ${pin.note}` : ""}`,
            dim: inScenario,
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
      const { block, edge } = anchorArgs(at);
      if (!block && !edge) continue;
      const codes = pins.map((p) => riskCode(p.risk));
      const { rects: tagRects } = tagSpots(codes.map(tagWidth), block, edge);
      pins.forEach((pin, i) => {
        const r = tagRects[i];
        if (!r) return;
        const risk = riskById.get(pin.risk);
        nodes.push({
          id: `tag:${at}:${pin.risk}`,
          type: "tag",
          position: { x: r.x, y: r.y },
          data: {
            code: codes[i],
            w: r.w,
            tip: `${codes[i]} · ${risk?.title ?? pin.risk}${pin.note ? ` — ${pin.note}` : ""}`,
            dim: inScenario,
          },
          draggable: false,
          selectable: false,
          zIndex: 10,
        });
      });
    }

    // --- Edges: the build-computed paths, verbatim ------------------------------------
    const edges: Edge[] = [];
    for (const e of archetype.edges) {
      if (hidden.has(e.from) || hidden.has(e.to)) continue;
      const key = `${e.from}->${e.to}`;
      const geo = edgeGeo.get(key);
      if (!geo) continue;
      const style = PATH_STYLE[e.path];
      const dimmed = inScenario && !walkEdges.has(key);
      edges.push({
        id: key,
        source: e.from,
        target: e.to,
        type: "buildPath",
        data: { d: geo.d, midX: geo.midX, midY: geo.midY },
        label: e.label,
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
    return { nodes, edges };
  }, [archetype, cfg, scenario]);

  return (
    <div className={className} style={{ height: "min(640px, 70vh)" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
    </div>
  );
}
