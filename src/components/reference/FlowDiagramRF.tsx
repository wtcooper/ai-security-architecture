"use client";

/**
 * Experimental React Flow renderer for the flow-style architectures — the second leg of the
 * renderer bake-off, revisited because the hand-rolled SVG engine cannot draw containment
 * (a sandbox enclosing the blocks that run inside it) and its single-elbow router constrains
 * same-row spines. Positions come from the same build-time layout as the SVG renderer, so the
 * comparison is renderer capability, not layout quality. Pins, tags and scenario walks are
 * deliberately not rendered here; the experiment is about structure and nesting.
 */
import { useMemo } from "react";
import {
  Background,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { itemCells } from "@/lib/flow-layout";
import type { ArchBlock, Archetype } from "@/lib/types";
import { blockTab, BLOCK_STYLE, PATH_STYLE } from "./flow-style";
import { FlowIcon } from "./FlowIcons";

/**
 * The containment experiment: which blocks each architecture draws inside a labelled frame,
 * and which standalone blocks the frame replaces. Only architectures listed here offer the
 * React Flow toggle.
 */
const RF_CONFIG: Record<
  string,
  { frameLabel: string; frameNote: string; members: string[]; hide: string[] }
> = {
  archSandboxedExecution: {
    frameLabel: "Disposable sandbox",
    frameNote: "Provisioned per task, destroyed after — untrusted code and untrusted content execute together inside",
    members: ["sandbox", "sourceContent"],
    hide: [],
  },
  archPersonalAgent: {
    frameLabel: "Sandboxed container",
    frameNote: "The wrap-the-whole-harness product: daemon, memory and tools all inside the boundary (target state)",
    members: ["harness", "memory", "toolPlane"],
    hide: ["sandbox"],
  },
};

export const hasReactFlowVersion = (id: string) => id in RF_CONFIG;

const FRAME_PAD = 22;
const FRAME_HEAD = 46;

type BlockNodeData = { block: ArchBlock; w: number; h: number };

function BlockNode({ data }: NodeProps<Node<BlockNodeData>>) {
  const { block, w, h } = data;
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

const nodeTypes = { block: BlockNode, frame: FrameNode };

/** Pick the facing handle pair from the two blocks' relative geometry. */
function handles(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  const dx = b.x + b.w / 2 - (a.x + a.w / 2);
  const dy = b.y + b.h / 2 - (a.y + a.h / 2);
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? (["r", "l-in"] as const) : (["l", "r-in"] as const);
  return dy > 0 ? (["b", "t-in"] as const) : (["t", "b-in"] as const);
}

export function FlowDiagramRF({ archetype, className }: { archetype: Archetype; className?: string }) {
  const cfg = RF_CONFIG[archetype.id];

  const { nodes, edges } = useMemo(() => {
    const { layout } = archetype;
    const hidden = new Set(cfg?.hide ?? []);
    const members = new Set(cfg?.members ?? []);
    const rects = layout.blocks;

    let frame: { x: number; y: number; w: number; h: number } | null = null;
    if (cfg && cfg.members.length) {
      const rs = cfg.members.map((id) => rects[id]);
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
        data: { block, w: r.w, h: r.h },
        draggable: true,
        style: { width: r.w, height: r.h },
      });
    }

    const edges: Edge[] = [];
    for (const e of archetype.edges) {
      if (hidden.has(e.from) || hidden.has(e.to)) continue;
      const style = PATH_STYLE[e.path];
      const [sh, th] = handles(rects[e.from], rects[e.to]);
      edges.push({
        id: `${e.from}->${e.to}`,
        source: e.from,
        target: e.to,
        sourceHandle: sh,
        targetHandle: th,
        type: "smoothstep",
        label: e.label,
        labelStyle: { fontSize: 9, fill: "var(--ink-2, #555)" },
        labelBgStyle: { fill: "var(--paper, #fff)", fillOpacity: 0.9 },
        style: { stroke: style.stroke, strokeWidth: 1.8, strokeDasharray: style.dash },
        markerEnd: { type: MarkerType.ArrowClosed, color: style.stroke, width: 14, height: 14 },
        markerStart: e.bidir
          ? { type: MarkerType.ArrowClosed, color: style.stroke, width: 14, height: 14 }
          : undefined,
      });
    }
    return { nodes, edges };
  }, [archetype, cfg]);

  return (
    <div className={className} style={{ height: "min(640px, 70vh)" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.06 }}
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
