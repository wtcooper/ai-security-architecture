/**
 * FlowViewer — the skill's diagram viewer as an importable React component. Identical logic
 * to templates/viewer.html (which is the tested reference); the differences are npm imports
 * instead of CDN, JSX instead of htm, and props instead of an embedded JSON block.
 *
 * Props:
 *   model     — the render model from `node engine/build.mjs <yaml> <out.json>` (required)
 *   rail      — render the side rail with scenario walks + legends (default true)
 *   scenario  — controlled scenario index (optional; omit to let the rail drive it)
 *
 * Client-side only (React Flow measures DOM). Parent must have a height.
 */
import React, { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  Position,
  applyNodeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

/* --- Icon vocabulary: hand-drawn strokes in a 24x24 box ------------------------------ */
const ICONS = {
  person: '<circle cx="12" cy="8" r="3.6"/><path d="M 5 21 C 5 15.5 19 15.5 19 21"/>',
  people: '<circle cx="9" cy="8.5" r="3.2"/><path d="M 3 20.5 C 3 15.5 15 15.5 15 20.5"/><circle cx="16.5" cy="8" r="2.6"/><path d="M 15.8 13.6 C 19.5 14 21 16.6 21 19"/>',
  agent: '<rect x="6" y="8" width="12" height="9" rx="2"/><path d="M 12 8 V 4.5 M 10 4.5 H 14"/><circle cx="9.5" cy="12" r="0.9" fill="currentColor" stroke="none"/><circle cx="14.5" cy="12" r="0.9" fill="currentColor" stroke="none"/><path d="M 9.5 20 V 17 M 14.5 20 V 17"/>',
  model: '<path d="M 9.5 4.5 C 6.5 4.5 5.5 7 6 9 C 4 10 4 13.5 6 14.5 C 5.5 17.5 7.5 19.5 10 19 C 10.8 20.2 13.2 20.2 14 19 C 16.5 19.5 18.5 17.5 18 14.5 C 20 13.5 20 10 18 9 C 18.5 7 17.5 4.5 14.5 4.5 C 13.4 3.6 10.6 3.6 9.5 4.5 Z"/><path d="M 12 4 V 20 M 8.6 9 H 12 M 12 13 H 15.4"/>',
  chat: '<path d="M 4 6 H 20 V 16 H 10 L 6 19.5 V 16 H 4 Z"/><path d="M 8 10 H 16 M 8 12.8 H 13"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M 12 7 V 12 L 15.5 14"/>',
  folder: '<path d="M 3.5 6 H 9.5 L 11.5 8.5 H 20.5 V 18.5 H 3.5 Z"/>',
  db: '<ellipse cx="12" cy="6" rx="7" ry="2.8"/><path d="M 5 6 V 18 C 5 19.5 8 20.8 12 20.8 C 16 20.8 19 19.5 19 18 V 6"/><path d="M 5 12 C 5 13.5 8 14.8 12 14.8 C 16 14.8 19 13.5 19 12"/>',
  key: '<circle cx="8" cy="9" r="4"/><path d="M 11 12 L 19 20 M 16 17 L 18.5 14.5 M 13.5 14.5 L 15.5 12.5"/>',
  shield: '<path d="M 12 3.5 L 19 6 V 12 C 19 16.5 16 19.5 12 21 C 8 19.5 5 16.5 5 12 V 6 Z"/><path d="M 8.8 12 L 11 14.2 L 15.4 9.5"/>',
  plug: '<path d="M 9 3.5 V 8 M 15 3.5 V 8"/><path d="M 6.5 8 H 17.5 V 11 C 17.5 14 15.5 16 12 16 C 8.5 16 6.5 14 6.5 11 Z"/><path d="M 12 16 V 20.5"/>',
  code: '<path d="M 8.5 7 L 3.5 12 L 8.5 17 M 15.5 7 L 20.5 12 L 15.5 17"/><path d="M 13.4 5 L 10.6 19"/>',
  globe: '<circle cx="12" cy="12" r="8.2"/><path d="M 3.8 12 H 20.2 M 12 3.8 C 8 8 8 16 12 20.2 C 16 16 16 8 12 3.8"/>',
  doc: '<path d="M 6 3.5 H 14.5 L 18 7 V 20.5 H 6 Z"/><path d="M 14.5 3.5 V 7 H 18 M 9 11 H 15 M 9 14 H 15 M 9 17 H 12.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M 12 4 V 6.5 M 12 17.5 V 20 M 4 12 H 6.5 M 17.5 12 H 20 M 6.3 6.3 L 8.1 8.1 M 15.9 15.9 L 17.7 17.7 M 17.7 6.3 L 15.9 8.1 M 8.1 15.9 L 6.3 17.7"/>',
  phone: '<rect x="7.5" y="3.5" width="9" height="17" rx="2"/><path d="M 10.5 18 H 13.5"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M 15 15 L 20.5 20.5"/>',
  mail: '<rect x="3.5" y="6" width="17" height="12.5" rx="1.5"/><path d="M 4 7 L 12 13 L 20 7"/>',
  scale: '<path d="M 12 4.5 V 19.5 M 8.5 19.5 H 15.5 M 5 7.5 H 19"/><path d="M 6.5 7.5 L 4 13 C 4 14.6 9 14.6 9 13 L 6.5 7.5 M 17.5 7.5 L 15 13 C 15 14.6 20 14.6 20 13 L 17.5 7.5"/>',
  eye: '<path d="M 3 12 C 6 6.5 18 6.5 21 12 C 18 17.5 6 17.5 3 12 Z"/><circle cx="12" cy="12" r="2.6"/>',
  stop: '<circle cx="12" cy="12" r="8.2"/><rect x="8.8" y="8.8" width="6.4" height="6.4" rx="0.8"/>',
};

function Icon({ name, size, color = "var(--ink-2, #4a4e55)" }) {
  // Injected markup comes only from the hardcoded ICONS constant above — never from the
  // model or any user input, so there is no sanitization concern here.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ color }}>
      <g
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: ICONS[name] ?? "" }}
      />
    </svg>
  );
}

/* --- Visual language ------------------------------------------------------------------ */
const KIND_STYLE = {
  service: { stroke: "var(--ink, #1c1e21)", dash: false },
  provider: { stroke: "var(--ink-3, #9a9ea6)", dash: true },
  external: { stroke: "var(--data, #b07a1e)", dash: true },
  governance: { stroke: "var(--ink-2, #4a4e55)", dash: true },
};
const PATH_STYLE = {
  primary: { stroke: "var(--model, #2e7d54)" },
  external: { stroke: "var(--data, #b07a1e)" },
  governance: { stroke: "var(--ink-3, #9a9ea6)", dash: "3 4" },
};
function tabColor(block) {
  if (block.layer === "app") return "var(--app, #3667c4)";
  if (block.layer === "model") return "var(--model, #2e7d54)";
  if (block.layer === "data" || block.kind === "external") return "var(--data, #b07a1e)";
  return "var(--ink-2, #4a4e55)";
}
const MONO = "ui-monospace, monospace";

/* --- Node components ------------------------------------------------------------------ */
function BlockNode({ data }) {
  const { block, dim } = data;
  const style = KIND_STYLE[block.kind];
  const handles = ["t", "b", "l", "r"].map((side) => {
    const pos =
      side === "t" ? Position.Top : side === "b" ? Position.Bottom : side === "l" ? Position.Left : Position.Right;
    return (
      <span key={side}>
        <Handle type="source" id={side} position={pos} style={{ opacity: 0 }} />
        <Handle type="target" id={`${side}-in`} position={pos} style={{ opacity: 0 }} />
      </span>
    );
  });
  const base = { width: block.w, height: block.h, opacity: dim ? 0.25 : 1, transition: "opacity 150ms", cursor: "grab" };
  if (block.kind === "actor") {
    return (
      <div style={{ ...base, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11 }}>
        {handles}
        <Icon name={block.icon ?? "person"} size={30} color="var(--ink, #1c1e21)" />
        <span style={{ fontWeight: 600 }}>{block.title}</span>
      </div>
    );
  }
  return (
    <div
      style={{
        ...base,
        background: "var(--paper, #fff)",
        borderRadius: 8,
        position: "relative",
        border: `${block.kind === "governance" ? 1 : 1.5}px ${style.dash ? "dashed" : "solid"} ${style.stroke}`,
      }}
    >
      {handles}
      <div
        style={{
          position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
          background: tabColor(block), color: "#fff", font: `600 10px/1 ${MONO}`,
          letterSpacing: ".08em", textTransform: "uppercase", padding: "6px 10px",
          borderRadius: 3, whiteSpace: "nowrap",
        }}
      >
        {block.title}
      </div>
      {(block.items ?? []).map((item) => (
        <div
          key={item.id}
          title={item.note ? `${item.label} — ${item.note}` : item.label}
          style={{
            position: "absolute", left: item.x + item.w / 2, top: item.y + item.h / 2,
            transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3, width: item.w, textAlign: "center",
            fontSize: 10, lineHeight: 1.25, color: "var(--ink-2, #4a4e55)",
          }}
        >
          <Icon name={item.icon} size={20} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function FrameNode({ data }) {
  return (
    <div style={{ width: data.w, height: data.h, border: "2px dashed var(--ink-3, #9a9ea6)", borderRadius: 12, background: "rgba(154,158,166,.07)", cursor: "grab" }}>
      <div
        style={{
          position: "absolute", [data.labelPos === "bottom" ? "bottom" : "top"]: -12, left: 18,
          background: "var(--ink, #1c1e21)", color: "#fff", font: `600 10px/1 ${MONO}`,
          letterSpacing: ".08em", textTransform: "uppercase", padding: "6px 10px", borderRadius: 3,
        }}
      >
        {data.label}
      </div>
    </div>
  );
}

const chipStyle = (dim) => ({
  width: 18, height: 18, borderRadius: 9, background: "var(--paper, #fff)",
  border: "1.5px solid var(--chip, #4a5fd0)", color: "var(--chip, #4a5fd0)",
  font: `700 10px/15px ${MONO}`, textAlign: "center", opacity: dim ? 0 : 1,
});
const tagStyle = (w, dim) => ({
  width: w, height: 17, borderRadius: 3, background: "var(--paper-2, #f4f4f2)",
  border: "1px solid var(--line, #ddd)", color: "var(--ink-2, #4a4e55)",
  font: `600 9.5px/15px ${MONO}`, textAlign: "center", opacity: dim ? 0 : 1,
});

function ChipNode({ data }) {
  return <div style={chipStyle(data.dim)}>{data.n}</div>;
}
function TagNode({ data }) {
  return <div style={tagStyle(data.w, data.dim)}>{data.code}</div>;
}

/* Verbatim build path until an endpoint is dragged, then live orthogonal routing; the
   edge's pins render here so they travel with the arrow. */
function BuildPathEdge(props) {
  const data = props.data ?? {};
  let path = data.d ?? "";
  let midX = data.midX ?? 0;
  let midY = data.midY ?? 0;
  if (data.live) {
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
  const pins = data.pins ?? [];
  return (
    <>
      <BaseEdge path={path} markerEnd={props.markerEnd} markerStart={props.markerStart} style={props.style} />
      {pins.length ? (
        <EdgeLabelRenderer>
          {pins.map((pin, i) => (
            <div
              key={i}
              onMouseEnter={(e) => data.onPinEnter(e, pin.title, pin.note)}
              onMouseLeave={data.onPinLeave}
              style={{
                position: "absolute",
                transform:
                  pin.kind === "chip"
                    ? `translate(${midX + pin.dx - 9}px, ${midY + pin.dy - 9}px)`
                    : `translate(${midX + pin.dx}px, ${midY + pin.dy}px)`,
                ...(pin.kind === "chip" ? chipStyle(data.pinsDim) : tagStyle(pin.w, data.pinsDim)),
                pointerEvents: "all",
                zIndex: 10,
              }}
            >
              {pin.kind === "chip" ? pin.n : pin.code}
            </div>
          ))}
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

const nodeTypes = { block: BlockNode, frame: FrameNode, chip: ChipNode, tag: TagNode };
const edgeTypes = { buildPath: BuildPathEdge };

function facing(a, b) {
  const dx = b.x + b.w / 2 - (a.x + a.w / 2);
  const dy = b.y + b.h / 2 - (a.y + a.h / 2);
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? ["r", "l-in"] : ["l", "r-in"];
  return dy > 0 ? ["b", "t-in"] : ["t", "b-in"];
}

export function FlowViewer({ model, rail = true, scenario: controlled }) {
  const [card, setCard] = useState(null);
  const [dragged, setDragged] = useState(new Set());
  const [ownScenario, setOwnScenario] = useState(null);
  const scenario = controlled !== undefined ? controlled : ownScenario;

  const walk = scenario !== null && scenario !== undefined ? model.scenarios[scenario] : null;
  const walkEdges = useMemo(
    () =>
      new Set(
        walk?.steps.map((s) => {
          const e =
            model.edges.find((x) => x.id === s.follow) ??
            model.edges.find((x) => x.id === s.follow.split("->").reverse().join("->"));
          return e?.id;
        }) ?? [],
      ),
    [walk, model],
  );
  const walkBlocks = useMemo(() => new Set(walk?.steps.flatMap((s) => s.follow.split("->")) ?? []), [walk]);
  const inScenario = Boolean(walk);

  const cardAt = useCallback((event, title, note) => {
    const wrap = event.target.closest("[data-flowviewer]");
    const rect = wrap?.getBoundingClientRect();
    if (!rect) return;
    setCard({
      x: Math.min(event.clientX - rect.left + 12, rect.width - 280),
      y: Math.min(event.clientY - rect.top + 12, rect.height - 120),
      title,
      note,
    });
  }, []);
  const clearCard = useCallback(() => setCard(null), []);

  const initialNodes = useMemo(() => {
    const nodes = [];
    const memberOf = new Map();
    model.frames.forEach((f, i) => {
      const id = `__frame${i}`;
      f.members.forEach((m) => memberOf.set(m, { id, x: f.x, y: f.y }));
      nodes.push({
        id, type: "frame", position: { x: f.x, y: f.y },
        data: { label: f.label, note: f.note, labelPos: f.labelPos, w: f.w, h: f.h },
        style: { width: f.w, height: f.h }, draggable: true, selectable: false, zIndex: -1,
      });
    });
    for (const block of model.blocks) {
      const frame = memberOf.get(block.id);
      nodes.push({
        id: block.id, type: "block",
        position: frame ? { x: block.x - frame.x, y: block.y - frame.y } : { x: block.x, y: block.y },
        parentId: frame?.id, data: { block, dim: false }, draggable: true,
        style: { width: block.w, height: block.h },
      });
    }
    for (const pin of model.blockPins) {
      nodes.push({
        id: `pin:${pin.parent}:${pin.kind}:${pin.n ?? pin.code}:${pin.x}`,
        parentId: pin.parent, type: pin.kind,
        position: pin.kind === "chip" ? { x: pin.x - 9, y: pin.y - 9 } : { x: pin.x, y: pin.y },
        data: { ...pin, dim: false }, draggable: false, selectable: false, zIndex: 10,
      });
    }
    return nodes;
  }, [model]);

  const [nodes, setNodes] = useState(initialNodes);
  const onNodesChange = useCallback((changes) => setNodes((ns) => applyNodeChanges(changes, ns)), []);

  const displayNodes = useMemo(
    () =>
      nodes.map((n) => {
        if (n.type === "block") return { ...n, data: { ...n.data, dim: inScenario && !walkBlocks.has(n.id) } };
        if (n.type === "chip" || n.type === "tag") return { ...n, data: { ...n.data, dim: inScenario } };
        return n;
      }),
    [nodes, inScenario, walkBlocks],
  );

  const edges = useMemo(() => {
    const frameMembers = new Set(model.frames.flatMap((f) => f.members));
    const frameDragged = [...dragged].some((id) => id.startsWith("__frame"));
    const moved = frameDragged ? new Set([...dragged, ...frameMembers]) : dragged;
    const rectOf = Object.fromEntries(model.blocks.map((b) => [b.id, b]));
    const pinsByEdge = new Map();
    for (const pin of model.edgePins) {
      if (!pinsByEdge.has(pin.edge)) pinsByEdge.set(pin.edge, []);
      pinsByEdge.get(pin.edge).push(pin);
    }
    return model.edges.map((e) => {
      const style = PATH_STYLE[e.path];
      const dimmed = inScenario && !walkEdges.has(e.id);
      const [sh, th] = facing(rectOf[e.from], rectOf[e.to]);
      return {
        id: e.id, source: e.from, target: e.to, sourceHandle: sh, targetHandle: th, type: "buildPath",
        data: {
          d: e.d, live: moved.has(e.from) || moved.has(e.to), midX: e.midX, midY: e.midY,
          label: e.label, note: e.note, pins: pinsByEdge.get(e.id) ?? [], pinsDim: inScenario,
          onPinEnter: cardAt, onPinLeave: clearCard,
        },
        style: { stroke: style.stroke, strokeWidth: 1.8, strokeDasharray: style.dash, opacity: dimmed ? 0.15 : 1 },
        markerEnd: { type: "arrowclosed", color: style.stroke, width: 14, height: 14 },
        markerStart: e.bidir ? { type: "arrowclosed", color: style.stroke, width: 14, height: 14 } : undefined,
      };
    });
  }, [model, dragged, inScenario, walkEdges, cardAt, clearCard]);

  const canvas = (
    <div data-flowviewer style={{ flex: 1, minWidth: 0, position: "relative", height: "100%" }}>
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
          if (node.type === "block") cardAt(event, node.data.block.title, node.data.block.note);
          else if (node.type === "chip" || node.type === "tag")
            cardAt(event, `${node.data.n ?? node.data.code} · ${node.data.title}`, node.data.note);
          else if (node.type === "frame") cardAt(event, node.data.label, node.data.note);
        }}
        onNodeMouseLeave={clearCard}
        onEdgeMouseEnter={(event, edge) => {
          const d = edge.data ?? {};
          const from = model.blocks.find((b) => b.id === edge.source)?.title;
          const to = model.blocks.find((b) => b.id === edge.target)?.title;
          cardAt(event, d.label ?? `${from} → ${to}`, d.note);
        }}
        onEdgeMouseLeave={clearCard}
        onMoveStart={clearCard}
        fitView
        fitViewOptions={{ padding: 0.05 }}
        minZoom={0.2}
        maxZoom={4}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background gap={24} size={1} />
      </ReactFlow>
      {card && (
        <div
          style={{
            position: "absolute", left: card.x, top: card.y, width: 268, zIndex: 30, pointerEvents: "none",
            background: "var(--paper, #fff)", border: "1px solid var(--line, #ddd)", borderRadius: 8,
            boxShadow: "0 6px 20px rgba(0,0,0,.12)", padding: "8px 10px",
          }}
        >
          <div style={{ font: "600 11px/1.3 sans-serif", color: "var(--ink, #1c1e21)" }}>{card.title}</div>
          {card.note && (
            <div style={{ marginTop: 4, font: "400 10.5px/1.45 sans-serif", color: "var(--ink-2, #4a4e55)" }}>{card.note}</div>
          )}
        </div>
      )}
    </div>
  );

  if (!rail) return canvas;

  const h2 = { font: `700 10.5px/1 ${MONO}`, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3, #9a9ea6)", margin: "18px 0 8px" };
  const row = { display: "flex", gap: 8, margin: "0 0 7px", alignItems: "baseline", fontSize: 12.5 };
  return (
    <div style={{ display: "flex", height: "100%" }}>
      {canvas}
      <aside style={{ width: 300, borderLeft: "1px solid var(--line, #ddd)", overflowY: "auto", padding: "14px 16px" }}>
        {model.scenarios.length > 0 && (
          <>
            <h2 style={{ ...h2, marginTop: 2 }}>Scenario walks</h2>
            {model.scenarios.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setOwnScenario(scenario === i ? null : i)}
                style={{
                  display: "block", width: "100%", textAlign: "left", margin: "0 0 6px", padding: "7px 9px",
                  border: `1px solid ${scenario === i ? "var(--ink, #1c1e21)" : "var(--line, #ddd)"}`,
                  borderRadius: 7, background: scenario === i ? "var(--paper-2, #f4f4f2)" : "var(--paper, #fff)",
                  cursor: "pointer", font: "inherit", fontWeight: scenario === i ? 600 : 400, fontSize: 12.5,
                }}
              >
                {s.title} · {s.steps.length} steps
              </button>
            ))}
          </>
        )}
        {model.legend.capabilities.length > 0 && (
          <>
            <h2 style={h2}>Capabilities to deploy · {model.legend.capabilities.length}</h2>
            {model.legend.capabilities.map((c) => (
              <div key={c.n} style={row} title={c.note ?? ""}>
                <span style={{ ...chipStyle(false), flex: "none" }}>{c.n}</span>
                <span>{c.title}</span>
              </div>
            ))}
          </>
        )}
        {model.legend.risks.length > 0 && (
          <>
            <h2 style={h2}>Risks on the drawing · {model.legend.risks.length}</h2>
            {model.legend.risks.map((r) => (
              <div key={r.code} style={row} title={r.note ?? ""}>
                <span style={{ flex: "none", padding: "1px 6px", borderRadius: 3, background: "var(--paper-2, #f4f4f2)", border: "1px solid var(--line, #ddd)", color: "var(--ink-2, #4a4e55)", font: `600 9.5px/1.5 ${MONO}` }}>{r.code}</span>
                <span>{r.title}</span>
              </div>
            ))}
          </>
        )}
        {walk && (
          <>
            <h2 style={h2}>Steps</h2>
            {walk.steps.map((s, i) => (
              <div key={i} style={row}>
                <span style={{ ...chipStyle(false), flex: "none", borderColor: "var(--model, #2e7d54)", color: "var(--model, #2e7d54)" }}>{i + 1}</span>
                <span style={{ color: "var(--ink-2, #4a4e55)" }}>{s.note ?? s.follow}</span>
              </div>
            ))}
          </>
        )}
      </aside>
    </div>
  );
}
