"use client";

/**
 * Option 5's drawing: the same architecture at lower density. One card per top-level component
 * (contained blocks fold into their container), ownership lanes behind, the governance call-outs
 * as a row beneath. Controls are named badges inside the card — or on the arrow they are pinned
 * to — instead of numbered dots; risk codes appear only when asked for. Positions come from the
 * authored grid, compressed, so the cards keep the main drawing's arrangement.
 */
import { useMemo } from "react";
import {
  Background,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { STATUS_META } from "@/components/StatusPill";
import { useOrgOverlay } from "@/components/tooling/overlay";
import { orgSurfaceStatusFor, riskById, riskCode } from "@/lib/data";
import type { ArchBlock, Archetype, DisplayStatus, Scenario } from "@/lib/types";
import { FlowIcon } from "@/components/reference/FlowIcons";
import { fullName, shortName, STATUS_FILL } from "./model";

const CARD_W = 210;
const COL_W = CARD_W + 56;
const ROW_GAP = 46;
const LANE_PAD = 18;

/** A card's height before React Flow measures it, so rows can be packed to their tallest card. */
function estimateHeight(title: string, inside: string[], pills: string[], risks: number): number {
  const inner = CARD_W - 22;
  let lines = pills.length ? 1 : 0;
  let x = 0;
  for (const label of pills) {
    const w = label.length * 6.4 + 22;
    if (x && x + w > inner) {
      lines += 1;
      x = 0;
    }
    x += w + 4;
  }
  const titleLines = Math.ceil((title.length * 7.6) / inner);
  return 20 + titleLines * 17 + (inside.length ? 16 : 0) + lines * 24 + (risks ? 22 : 0);
}

const LANE_FILL: Record<string, { fill: string; edge: string; ink: string }> = {
  user: { fill: "#eef2f7", edge: "#d5dde8", ink: "#475467" },
  endpoint: { fill: "#e9f5ee", edge: "#bfe0cc", ink: "#2f8a5b" },
  cloud: { fill: "#eaf0ff", edge: "#c3d3f7", ink: "#3d5bd9" },
  vendor: { fill: "#fdf3e4", edge: "#efd5a8", ink: "#a8781f" },
  external: { fill: "#f4effc", edge: "#dccff3", ink: "#7c3aed" },
  governance: { fill: "#eef1f5", edge: "#d3d9e2", ink: "#344054" },
};

const LANE_TITLE: Record<string, string> = {
  user: "Users & devices",
  endpoint: "Our managed endpoint",
  cloud: "Our enterprise cloud",
  vendor: "Vendor platform",
  external: "External",
  governance: "Our governance plane",
};

export interface CanvasProps {
  archetype: Archetype;
  walk: Scenario | null;
  selected: string | null;
  onSelect: (capId: string | null) => void;
  showRisks: boolean;
}

type Pill = { capId: string };
type CardData = {
  block: ArchBlock;
  inside: string[];
  pills: Pill[];
  risks: string[];
  owner: string;
  dim: boolean;
  selected: string | null;
  onSelect: (capId: string) => void;
  status: Map<string, DisplayStatus> | null;
};

export function SimpleCanvasRF({ archetype, walk, selected, onSelect, showRisks }: CanvasProps) {
  const overlay = useOrgOverlay();
  const status = useMemo(
    () => (overlay ? new Map(archetype.mitigations.map((c) => [c, orgSurfaceStatusFor(c, archetype.surface)])) : null),
    [overlay, archetype],
  );

  const { nodes, edges } = useMemo(() => {
    const blocks = new Map(archetype.blocks.map((b) => [b.id, b]));
    const ownerOfZone = new Map((archetype.zones ?? []).map((z) => [z.id, z.owner]));
    const top = (id: string): string => {
      let b = blocks.get(id);
      while (b?.parent) b = blocks.get(b.parent);
      return b?.id ?? id;
    };
    const isGov = (b: ArchBlock) => b.kind === "governance" || ownerOfZone.get(b.zone ?? "") === "governance";
    const tops = archetype.blocks.filter((b) => !b.parent && !isGov(b) && b.kind !== "origin");
    const gov = archetype.blocks.filter((b) => !b.parent && isGov(b));

    // Compress the authored grid so empty rows and columns take no room.
    const colIdx = new Map([...new Set(tops.map((b) => b.col))].sort((a, b) => a - b).map((c, i) => [c, i]));
    const rowIdx = new Map([...new Set(tops.map((b) => b.row))].sort((a, b) => a - b).map((r, i) => [r, i]));
    const width = colIdx.size * COL_W - (COL_W - CARD_W);

    // Walk membership, folded to the cards.
    const walkKeys = new Set<string>();
    const walkCards = new Set<string>();
    const stepsByKey = new Map<string, number[]>();
    (walk?.steps ?? []).forEach((s, i) => {
      const [a, b] = s.follow.split("->").map(top);
      walkCards.add(a);
      walkCards.add(b);
      const key = [a, b].sort().join("|");
      walkKeys.add(key);
      stepsByKey.set(key, [...(stepsByKey.get(key) ?? []), i + 1]);
    });

    // Pins: block-anchored ones go in their card; flow-anchored ones on the folded arrow, or in
    // the card when both ends fold into the same card. Neighbours in one row leave no room on the
    // arrow between them, so their badges go in the card on our side of the link.
    const byIdTop = new Map(tops.map((b) => [b.id, b]));
    const sideBySide = (a: string, b: string) => {
      const ba = byIdTop.get(a);
      const bb = byIdTop.get(b);
      return !!ba && !!bb && ba.row === bb.row && Math.abs(colIdx.get(ba.col)! - colIdx.get(bb.col)!) === 1;
    };
    const ours = (a: string, b: string) => {
      const enterprise = (id: string) => ["cloud", "endpoint", "governance"].includes(ownerOfZone.get(blocks.get(id)?.zone ?? "") ?? "");
      return enterprise(a) || !enterprise(b) ? a : b;
    };
    const cardPills = new Map<string, Pill[]>();
    const edgePills = new Map<string, Pill[]>();
    const add = (m: Map<string, Pill[]>, k: string, capId: string) => {
      const list = m.get(k) ?? [];
      if (!list.some((p) => p.capId === capId)) list.push({ capId });
      m.set(k, list);
    };
    for (const p of archetype.pins.mitigations) {
      if (!p.at.includes("->")) {
        add(cardPills, top(p.at), p.mitigation);
        continue;
      }
      const [a, b] = p.at.split("->").map(top);
      if (a === b) add(cardPills, a, p.mitigation);
      else if (sideBySide(a, b)) add(cardPills, ours(a, b), p.mitigation);
      else add(edgePills, [a, b].sort().join("|"), p.mitigation);
    }
    const cardRisks = new Map<string, string[]>();
    const edgeRisks = new Map<string, string[]>();
    for (const p of archetype.pins.risks) {
      if (!p.at.includes("->")) {
        const k = top(p.at);
        cardRisks.set(k, [...new Set([...(cardRisks.get(k) ?? []), p.risk])]);
        continue;
      }
      const [a, b] = p.at.split("->").map(top);
      const k = a === b ? a : [a, b].sort().join("|");
      const m = a === b ? cardRisks : edgeRisks;
      m.set(k, [...new Set([...(m.get(k) ?? []), p.risk])]);
    }

    // Each row is as tall as its tallest card, so short rows stay short.
    const insideOf = (id: string) => archetype.blocks.filter((k) => k.parent && top(k.id) === id).map((k) => k.title);
    const heightOf = (b: ArchBlock) =>
      b.kind === "actor" ? 70 : estimateHeight(b.title, insideOf(b.id), (cardPills.get(b.id) ?? []).map((p) => shortName(p.capId)), showRisks ? (cardRisks.get(b.id) ?? []).length : 0);
    const rowHeights = [...rowIdx.keys()].map((r) => Math.max(...tops.filter((b) => b.row === r).map(heightOf)));
    const rowY: number[] = [];
    rowHeights.reduce((y, h, i) => ((rowY[i] = y), y + h + ROW_GAP), 0);
    const bodyH = rowY[rowY.length - 1] + rowHeights[rowHeights.length - 1];
    const pos = new Map(tops.map((b) => [b.id, { x: colIdx.get(b.col)! * COL_W, y: rowY[rowIdx.get(b.row)!] }]));

    const nodes: Node[] = [];
    // Lanes behind the cards, one per ownership band, in the authored order.
    for (const zone of archetype.zones ?? []) {
      if (zone.owner === "governance") continue;
      const members = tops.filter((b) => b.zone === zone.id);
      if (!members.length) continue;
      const cs = members.map((b) => colIdx.get(b.col)!);
      const x0 = Math.min(...cs) * COL_W - LANE_PAD;
      const x1 = Math.max(...cs) * COL_W + CARD_W + LANE_PAD;
      nodes.push({
        id: `lane:${zone.id}`,
        type: "lane",
        position: { x: x0, y: -48 },
        data: { title: LANE_TITLE[zone.owner] ?? zone.owner, owner: zone.owner, w: x1 - x0, h: bodyH + 48 + LANE_PAD },
        draggable: false,
        selectable: false,
        zIndex: -2,
      });
    }
    for (const b of tops) {
      const inside = insideOf(b.id);
      nodes.push({
        id: b.id,
        type: "card",
        position: pos.get(b.id)!,
        data: {
          block: b,
          inside,
          pills: cardPills.get(b.id) ?? [],
          risks: showRisks ? cardRisks.get(b.id) ?? [] : [],
          owner: ownerOfZone.get(b.zone ?? "") ?? "cloud",
          dim: Boolean(walk) && !walkCards.has(b.id),
          selected,
          onSelect,
          status,
        } satisfies CardData,
        draggable: false,
        selectable: false,
      });
    }
    // The governance call-outs as one row beneath, inside their own lane.
    if (gov.length) {
      const y = bodyH + LANE_PAD + 62;
      const step = Math.max(CARD_W + 16, (width - CARD_W) / Math.max(1, gov.length - 1));
      const span = step * (gov.length - 1) + CARD_W;
      nodes.push({
        id: "lane:governance",
        type: "lane",
        position: { x: -LANE_PAD, y: y - 34 },
        data: {
          title: LANE_TITLE.governance,
          owner: "governance",
          w: Math.max(width, span) + LANE_PAD * 2,
          h: 34 + LANE_PAD + Math.max(...gov.map((b) => estimateHeight(b.title, [], (cardPills.get(b.id) ?? []).map((p) => shortName(p.capId)), 0))),
        },
        draggable: false,
        selectable: false,
        zIndex: -2,
      });
      gov.forEach((b, i) => {
        nodes.push({
          id: b.id,
          type: "card",
          position: { x: i * step, y },
          data: {
            block: b,
            inside: [],
            pills: cardPills.get(b.id) ?? [],
            risks: [],
            owner: "governance",
            dim: Boolean(walk),
            selected,
            onSelect,
            status,
          } satisfies CardData,
          draggable: false,
          selectable: false,
        });
      });
    }

    const center = (id: string) => {
      const p = pos.get(id);
      return p ? { x: p.x + CARD_W / 2, y: p.y + 40 } : { x: 0, y: 0 };
    };
    const seen = new Set<string>();
    const edges: Edge[] = [];
    for (const e of archetype.edges) {
      const a = top(e.from);
      const b = top(e.to);
      if (a === b || !pos.has(a) || !pos.has(b)) continue;
      const key = [a, b].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      const ca = center(a);
      const cb = center(b);
      const dx = cb.x - ca.x;
      const dy = cb.y - ca.y;
      const [sh, th] = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? ["r", "l"] : ["l", "r"]) : dy > 0 ? ["b", "t"] : ["t", "b"];
      const stroke = e.path === "external" ? "#a8781f" : "#06845a";
      const inWalk = walkKeys.has(key);
      edges.push({
        id: key,
        source: a,
        target: b,
        sourceHandle: sh,
        targetHandle: `${th}-in`,
        type: "pills",
        data: {
          label: e.label,
          pills: edgePills.get(key) ?? [],
          risks: showRisks ? edgeRisks.get(key) ?? [] : [],
          steps: walk ? stepsByKey.get(key) ?? [] : [],
          selected,
          onSelect,
          status,
          dim: Boolean(walk) && !inWalk,
        },
        style: { stroke, strokeWidth: inWalk ? 2.8 : 1.8, opacity: walk && !inWalk ? 0.15 : 1 },
        markerEnd: { type: "arrowclosed" as never, color: stroke, width: 14, height: 14 },
        markerStart: e.bidir ? { type: "arrowclosed" as never, color: stroke, width: 14, height: 14 } : undefined,
      });
    }
    return { nodes, edges };
  }, [archetype, walk, selected, onSelect, showRisks, status]);

  return (
    <div style={{ height: "min(820px, 84vh)" }} className="w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.03 }}
        minZoom={0.2}
        maxZoom={3}
        zoomOnScroll={false}
        preventScrolling={false}
        zoomActivationKeyCode={["Meta", "Control"]}
        proOptions={{ hideAttribution: false }}
      >
        <Background gap={24} size={1} />
      </ReactFlow>
    </div>
  );
}

function pillStyle(capId: string, status: Map<string, DisplayStatus> | null, selected: string | null) {
  const s = status?.get(capId);
  const p = s ? STATUS_FILL[s] : { bg: "#ffffff", border: "#4a5fd0", text: "#3d5bd9", dashed: false };
  const on = selected === capId;
  return {
    background: p.bg,
    borderColor: p.border,
    borderStyle: p.dashed ? "dashed" : "solid",
    color: p.text,
    boxShadow: on ? "0 0 0 2.5px #101828" : undefined,
    opacity: selected && !on ? 0.45 : 1,
    // React Flow turns pointer events off on nodes that are neither draggable nor selectable.
    pointerEvents: "all",
    cursor: "pointer",
  } as const;
}

function ControlPill({ capId, status, selected, onSelect }: { capId: string; status: Map<string, DisplayStatus> | null; selected: string | null; onSelect: (id: string) => void }) {
  const s = status?.get(capId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(capId);
      }}
      title={`${fullName(capId)}${s ? ` — our status: ${STATUS_META[s].label}` : ""}`}
      className="nodrag nopan rounded-full border-[1.5px] px-2 py-[1px] text-[11px] font-semibold leading-[17px] transition-opacity"
      style={pillStyle(capId, status, selected)}
    >
      {shortName(capId)}
    </button>
  );
}

function RiskCode({ riskId }: { riskId: string }) {
  return (
    <span title={riskById.get(riskId)?.title} className="rounded-[3px] border border-[#e3e8ef] bg-[#f4f4f2] px-1 font-mono text-[9.5px] font-semibold leading-[14px] text-[#555]">
      {riskCode(riskId)}
    </span>
  );
}

const HANDLES = (["t", "b", "l", "r"] as const).map((side) => {
  const position = { t: Position.Top, b: Position.Bottom, l: Position.Left, r: Position.Right }[side];
  return (
    <span key={side}>
      <Handle type="source" id={side} position={position} style={{ opacity: 0 }} />
      <Handle type="target" id={`${side}-in`} position={position} style={{ opacity: 0 }} />
    </span>
  );
});

function CardNode({ data }: NodeProps<Node<CardData>>) {
  const { block, inside, pills, risks, owner, dim, selected, onSelect, status } = data;
  const tone = LANE_FILL[owner] ?? LANE_FILL.cloud;
  if (block.kind === "actor") {
    return (
      <div style={{ width: CARD_W, opacity: dim ? 0.3 : 1 }} className="flex flex-col items-center gap-1 py-2">
        {HANDLES}
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white" style={{ borderColor: tone.edge }}>
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
            <FlowIcon name="person" x={11} y={11} size={20} />
          </svg>
        </span>
        <span className="text-[13px] font-semibold text-ink">{block.title}</span>
      </div>
    );
  }
  const vendor = block.kind === "provider";
  const external = block.kind === "external" || owner === "external";
  return (
    <div
      style={{
        width: CARD_W,
        opacity: dim ? 0.3 : 1,
        borderColor: external ? "#e3cd9c" : vendor ? "#c9ced6" : "#cfd6e0",
        borderStyle: vendor ? "dashed" : "solid",
      }}
      className="rounded-lg border-[1.5px] bg-white px-2.5 pb-2.5 pt-2 shadow-[0_1px_2px_rgba(16,24,40,0.06)]"
      title={block.note}
    >
      {HANDLES}
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13.5px] font-bold leading-tight text-ink">{block.title}</span>
        {owner === "governance" && <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">ours</span>}
      </div>
      {inside.length > 0 && <p className="mt-0.5 text-[11px] leading-snug text-ink-3">contains {inside.join(", ")}</p>}
      {pills.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {pills.map((p) => (
            <ControlPill key={p.capId} capId={p.capId} status={status} selected={selected} onSelect={onSelect} />
          ))}
        </div>
      )}
      {risks.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {risks.map((r) => (
            <RiskCode key={r} riskId={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function LaneNode({ data }: NodeProps<Node<{ title: string; owner: string; w: number; h: number }>>) {
  const tone = LANE_FILL[data.owner] ?? LANE_FILL.cloud;
  return (
    <div style={{ width: data.w, height: data.h, background: tone.fill, border: `1px solid ${tone.edge}`, borderRadius: 12 }}>
      <div style={{ color: tone.ink }} className="px-3 pt-2 text-[10.5px] font-bold uppercase tracking-[0.1em]">
        {data.title}
      </div>
    </div>
  );
}

type PillEdgeData = {
  label?: string;
  pills: Pill[];
  risks: string[];
  steps: number[];
  selected: string | null;
  onSelect: (capId: string) => void;
  status: Map<string, DisplayStatus> | null;
  dim: boolean;
};

/**
 * A control on an arrow sits where the arrow enters the card it guards, not at the arrow's
 * middle — on a long route the middle can land beside an unrelated card.
 */
function besideTarget(p: EdgeProps): string {
  const gap = 10;
  switch (p.targetPosition) {
    case Position.Left:
      return `translate(-100%, -50%) translate(${p.targetX - gap}px, ${p.targetY - 14}px)`;
    case Position.Right:
      return `translate(0, -50%) translate(${p.targetX + gap}px, ${p.targetY - 14}px)`;
    case Position.Top:
      return `translate(8px, -100%) translate(${p.targetX}px, ${p.targetY - gap}px)`;
    default:
      return `translate(8px, 0) translate(${p.targetX}px, ${p.targetY + gap}px)`;
  }
}

function PillEdge(props: EdgeProps) {
  const data = props.data as unknown as PillEdgeData;
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
    borderRadius: 10,
  });
  const showPills = !data.steps.length && (data.pills.length > 0 || data.risks.length > 0);
  return (
    <>
      <BaseEdge path={path} markerEnd={props.markerEnd} markerStart={props.markerStart} style={props.style} />
      {(showPills || data.steps.length > 0) && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan absolute flex max-w-[220px] flex-wrap justify-center gap-1"
            style={{ transform: data.steps.length ? `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` : besideTarget(props), pointerEvents: "all", opacity: data.dim ? 0.15 : 1 }}
          >
            {data.steps.length > 0
              ? data.steps.map((n) => (
                  <span key={n} className="rounded-full bg-ink px-1.5 font-mono text-[10px] font-bold leading-[17px] text-white">
                    {n}
                  </span>
                ))
              : (
                <>
                  {data.pills.map((p) => (
                    <ControlPill key={p.capId} capId={p.capId} status={data.status} selected={data.selected} onSelect={data.onSelect} />
                  ))}
                  {data.risks.map((r) => (
                    <RiskCode key={r} riskId={r} />
                  ))}
                </>
              )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const nodeTypes = { card: CardNode, lane: LaneNode };
const edgeTypes = { pills: PillEdge };
