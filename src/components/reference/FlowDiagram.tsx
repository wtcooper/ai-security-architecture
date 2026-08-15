"use client";

/**
 * The flow-style architecture renderer: hand-rolled SVG over build-time geometry, following the
 * F5 reference-architecture grammar. Blocks are white with a dark title tab and icon internals;
 * connectors are typed data paths; capabilities sit on the drawing as numbered chips and risks
 * as coded tags, both keyed to the insight rail beside the diagram; scenario walks replay the
 * same canvas with everything else faded — F5's highlight move.
 *
 * Pan and zoom follow RiskMap, including not capturing the pointer until it has moved. Zoom
 * needs a modifier so the page can still be scrolled past a tall diagram.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { capabilityById, riskById, riskCode } from "@/lib/data";
import { itemCells } from "@/lib/flow-layout";
import type { ArchBlock, Archetype, Rect } from "@/lib/types";
import { BLOCK_STYLE, CHIP, PATH_STYLE, TAG, tagWidth } from "./flow-style";
import { FlowIcon } from "./FlowIcons";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export interface Highlight {
  kind: "capability" | "risk";
  id: string;
}

interface FlowDiagramProps {
  archetype: Archetype;
  /** Index into archetype.scenarios, or null for the resting view. */
  scenario: number | null;
  highlight: Highlight | null;
  onHighlight: (h: Highlight | null) => void;
  className?: string;
}

interface Hover {
  x: number;
  y: number;
  title: string;
  body: string;
  meta?: string;
}

interface EdgeGeometry {
  from: string;
  to: string;
  d: string;
  midX: number;
  midY: number;
  horizontal: boolean;
}

const TAB_H = 20;

export function FlowDiagram({
  archetype,
  scenario,
  highlight,
  onHighlight,
  className,
}: FlowDiagramProps) {
  const { layout } = archetype;
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [hover, setHover] = useState<Hover | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const captured = useRef(false);

  const [lastId, setLastId] = useState(archetype.id);
  if (lastId !== archetype.id) {
    setLastId(archetype.id);
    setView({ k: 1, x: 0, y: 0 });
    setHover(null);
  }

  const toMap = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return { x: 0, y: 0 };
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const { x, y } = point.matrixTransform(ctm.inverse());
    return { x, y };
  }, []);

  const zoomAbout = useCallback((factor: number, at: { x: number; y: number }) => {
    setView((v) => {
      const k = clamp(v.k * factor, MIN_ZOOM, MAX_ZOOM);
      const ratio = k / v.k;
      return { k, x: at.x - (at.x - v.x) * ratio, y: at.y - (at.y - v.y) * ratio };
    });
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomAbout(e.deltaY < 0 ? 1.12 : 1 / 1.12, toMap(e.clientX, e.clientY));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [toMap, zoomAbout]);

  const startPan = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY };
    moved.current = false;
    captured.current = false;
  };
  const doPan = (e: React.PointerEvent<SVGSVGElement>) => {
    const from = drag.current;
    if (!from) return;
    if (!moved.current) {
      if (Math.abs(e.clientX - from.x) + Math.abs(e.clientY - from.y) <= 3) return;
      moved.current = true;
      captured.current = true;
      setPanning(true);
      setHover(null);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const a = toMap(from.x, from.y);
    const b = toMap(e.clientX, e.clientY);
    drag.current = { x: e.clientX, y: e.clientY };
    setView((v) => ({ ...v, x: v.x + (b.x - a.x), y: v.y + (b.y - a.y) }));
  };
  const endPan = (e: React.PointerEvent<SVGSVGElement>) => {
    drag.current = null;
    if (captured.current) {
      captured.current = false;
      setPanning(false);
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }
  };

  // --- Resolution helpers -----------------------------------------------------------

  const blockById = new Map(archetype.blocks.map((b) => [b.id, b]));
  const edgeGeo = new Map<string, EdgeGeometry>();
  for (const g of layout.edges) edgeGeo.set(`${g.from}->${g.to}`, g);
  /** A pin or step may reference a bidirectional edge in reverse; both resolve to one drawing. */
  const findEdge = (ref: string): EdgeGeometry | undefined => {
    if (edgeGeo.has(ref)) return edgeGeo.get(ref);
    const [a, b] = ref.split("->");
    return edgeGeo.get(`${b}->${a}`);
  };

  const activeScenario = scenario === null ? null : archetype.scenarios?.[scenario] ?? null;
  const scenarioEdges = new Set(
    (activeScenario?.steps ?? []).map((s) => {
      const g = findEdge(s.follow);
      return g ? `${g.from}->${g.to}` : "";
    }),
  );

  // Scenario steps grouped per drawn edge, so two steps on one flow sit side by side.
  const stepsAt = new Map<string, { n: number; note?: string }[]>();
  (activeScenario?.steps ?? []).forEach((s, i) => {
    const g = findEdge(s.follow);
    if (!g) return;
    const key = `${g.from}->${g.to}`;
    stepsAt.set(key, [...(stepsAt.get(key) ?? []), { n: i + 1, note: s.note }]);
  });

  // Capability chips and risk tags grouped by target, so clusters can fan out.
  const chipsAt = new Map<string, { n: number; capability: string; note?: string }[]>();
  for (const pin of archetype.pins.capabilities) {
    const n = archetype.capabilities.indexOf(pin.capability) + 1;
    chipsAt.set(pin.at, [...(chipsAt.get(pin.at) ?? []), { n, capability: pin.capability, note: pin.note }]);
  }
  const tagsAt = new Map<string, { risk: string; note?: string }[]>();
  for (const pin of archetype.pins.risks) {
    tagsAt.set(pin.at, [...(tagsAt.get(pin.at) ?? []), { risk: pin.risk, note: pin.note }]);
  }

  const inScenario = scenario !== null;
  const centre = { x: layout.width / 2, y: layout.height / 2 };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className={className}
      role="img"
      aria-label={`Reference architecture for ${archetype.title}: capability blocks connected by typed data paths, with numbered capabilities and coded risks pinned to the drawing`}
      onPointerDown={startPan}
      onPointerMove={doPan}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onPointerLeave={() => setHover(null)}
      style={{ touchAction: "none", cursor: panning ? "grabbing" : "grab" }}
    >
      <defs>
        {Object.entries(PATH_STYLE).map(([id, style]) => (
          <marker
            key={id}
            id={`flow-arrow-${id}`}
            viewBox="0 0 8 8"
            refX="6.5"
            refY="4"
            markerWidth="5.5"
            markerHeight="5.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 7 4 L 0 7 z" fill={style.stroke} />
          </marker>
        ))}
      </defs>

      <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
        {/* --- Paths --------------------------------------------------------------- */}
        {layout.edges.map((g) => {
          const edge = archetype.edges.find((e) => e.from === g.from && e.to === g.to);
          if (!edge) return null;
          const key = `${g.from}->${g.to}`;
          const style = PATH_STYLE[edge.path];
          const dimmed = inScenario && !scenarioEdges.has(key);
          return (
            <g key={key} opacity={dimmed ? 0.15 : 1}>
              <path
                d={g.d}
                fill="none"
                stroke={style.stroke}
                strokeWidth={inScenario && scenarioEdges.has(key) ? 2.4 : 1.8}
                strokeDasharray={style.dash}
                markerEnd={`url(#flow-arrow-${edge.path})`}
                markerStart={edge.bidir ? `url(#flow-arrow-${edge.path})` : undefined}
              />
              {/* Generous invisible hit path for hover. */}
              <path
                d={g.d}
                fill="none"
                stroke="transparent"
                strokeWidth={14}
                onPointerEnter={() =>
                  !panning &&
                  setHover({
                    x: g.midX,
                    y: g.midY,
                    title: edge.label
                      ? edge.label
                      : `${titleOf(blockById.get(edge.from))} → ${titleOf(blockById.get(edge.to))}`,
                    body: edge.note ?? "",
                    meta: PATH_STYLE[edge.path].label,
                  })
                }
                onPointerLeave={() => setHover(null)}
              />
            </g>
          );
        })}

        {/* --- Blocks -------------------------------------------------------------- */}
        {archetype.blocks.map((block) => {
          const rect = layout.blocks[block.id];
          if (!rect) return null;
          return (
            <BlockShape
              key={block.id}
              block={block}
              rect={rect}
              onHover={(h) => !panning && setHover(h)}
              onLeave={() => setHover(null)}
            />
          );
        })}

        {/* --- Risk tags ----------------------------------------------------------- */}
        {!inScenario &&
          [...tagsAt.entries()].map(([at, tags]) => (
            <TagStack
              key={`tags-${at}`}
              at={at}
              tags={tags}
              blockRect={layout.blocks[at]}
              edge={findEdge(at)}
              highlight={highlight}
              onHighlight={onHighlight}
              onHover={(h) => !panning && setHover(h)}
              onLeave={() => setHover(null)}
            />
          ))}

        {/* --- Capability chips ------------------------------------------------------ */}
        {!inScenario &&
          [...chipsAt.entries()].map(([at, chips]) => (
            <ChipCluster
              key={`chips-${at}`}
              at={at}
              chips={chips}
              blockRect={layout.blocks[at]}
              edge={findEdge(at)}
              highlight={highlight}
              onHighlight={onHighlight}
              onHover={(h) => !panning && setHover(h)}
              onLeave={() => setHover(null)}
            />
          ))}

        {/* --- Scenario step numbers ------------------------------------------------- */}
        {inScenario &&
          [...stepsAt.entries()].map(([key, steps]) => {
            const g = edgeGeo.get(key);
            if (!g) return null;
            return steps.map((step, i) => {
              const dx = g.horizontal ? (i - (steps.length - 1) / 2) * 24 : 0;
              const dy = g.horizontal ? 0 : (i - (steps.length - 1) / 2) * 24;
              return (
                <g
                  key={`step-${key}-${step.n}`}
                  onPointerEnter={() =>
                    !panning &&
                    setHover({
                      x: g.midX + dx,
                      y: g.midY + dy,
                      title: `Step ${step.n} — ${activeScenario?.title ?? ""}`,
                      body: step.note ?? "",
                    })
                  }
                  onPointerLeave={() => setHover(null)}
                >
                  <circle cx={g.midX + dx} cy={g.midY + dy} r={9.5} fill="var(--mitigated)" />
                  <text
                    x={g.midX + dx}
                    y={g.midY + dy + 3.5}
                    textAnchor="middle"
                    fill="#fff"
                    style={{ font: "700 10.5px var(--font-body), sans-serif" }}
                  >
                    {step.n}
                  </text>
                </g>
              );
            });
          })}

        {hover && <HoverCard hover={hover} width={layout.width} />}
      </g>

      <ZoomControls
        width={layout.width}
        height={layout.height}
        zoom={view.k}
        onIn={() => zoomAbout(1.3, centre)}
        onOut={() => zoomAbout(1 / 1.3, centre)}
        onReset={() => setView({ k: 1, x: 0, y: 0 })}
      />
    </svg>
  );
}

const titleOf = (block?: ArchBlock) => block?.title ?? "";

/** Hover text is one sentence; anything longer belongs in the rail or the prose below. */
function firstSentence(text?: string) {
  if (!text) return "";
  const flat = text.replace(/\s+/g, " ").trim();
  const end = flat.search(/\.\s|\.$/);
  return end === -1 ? flat : flat.slice(0, end + 1);
}

function BlockShape({
  block,
  rect,
  onHover,
  onLeave,
}: {
  block: ArchBlock;
  rect: Rect;
  onHover: (h: Hover) => void;
  onLeave: () => void;
}) {
  if (block.kind === "actor") {
    const cx = rect.x + rect.w / 2;
    return (
      <g
        onPointerEnter={() =>
          onHover({
            x: cx,
            y: rect.y - 4,
            title: block.title,
            body: firstSentence(block.note),
          })
        }
        onPointerLeave={onLeave}
      >
        <FlowIcon name={block.icon ?? "person"} x={cx} y={rect.y + 20} size={34} color="var(--ink)" />
        <text
          x={cx}
          y={rect.y + 50}
          textAnchor="middle"
          fill="var(--ink)"
          style={{ font: "600 11.5px var(--font-body), sans-serif" }}
        >
          {block.title}
        </text>
      </g>
    );
  }

  const style = BLOCK_STYLE[block.kind];
  const tabW = Math.min(block.title.length * 6.6 + 18, rect.w - 10);
  const cells = itemCells(block, rect);

  return (
    <g>
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.w}
        height={rect.h}
        rx={3}
        fill="var(--paper)"
        stroke={style.stroke}
        strokeWidth={1.4}
        strokeDasharray={style.dash}
        onPointerEnter={() =>
          onHover({
            x: rect.x + rect.w / 2,
            y: rect.y - 16,
            title: block.title,
            body: firstSentence(block.note),
            meta: block.kind === "provider" ? "provider-operated — only the published interface is drawn" : undefined,
          })
        }
        onPointerLeave={onLeave}
      />
      <g style={{ pointerEvents: "none" }}>
        <rect
          x={rect.x + (rect.w - tabW) / 2}
          y={rect.y - TAB_H / 2}
          width={tabW}
          height={TAB_H}
          fill={style.tab}
        />
        <text
          x={rect.x + rect.w / 2}
          y={rect.y + 3.5}
          textAnchor="middle"
          fill="#fff"
          style={{
            font: "700 9px var(--font-mono-id), monospace",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
          }}
        >
          {block.title}
        </text>
      </g>
      {(block.items ?? []).map((item, i) => {
        const cell = cells[i];
        if (!cell) return null;
        const cx = cell.x + cell.w / 2;
        return (
          <g
            key={item.id}
            onPointerEnter={() =>
              onHover({
                x: cx,
                y: cell.y - 2,
                title: item.label,
                body: firstSentence(item.note),
              })
            }
            onPointerLeave={onLeave}
          >
            <rect x={cell.x} y={cell.y} width={cell.w} height={cell.h} fill="transparent" />
            <FlowIcon name={item.icon} x={cx} y={cell.y + 13} size={21} />
            {wrapLabel(item.label, cell.w).map((line, li) => (
              <text
                key={li}
                x={cx}
                y={cell.y + 33 + li * 11}
                textAnchor="middle"
                fill="var(--ink-2)"
                style={{ font: "500 9.5px var(--font-body), sans-serif", pointerEvents: "none" }}
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </g>
  );
}

/** Two lines maximum; the cell is small and the hover carries the rest. */
function wrapLabel(label: string, w: number) {
  const cols = Math.max(10, Math.floor(w / 5.4));
  if (label.length <= cols) return [label];
  const words = label.split(" ");
  let first = "";
  while (words.length && (first + " " + words[0]).trim().length <= cols) {
    first = (first + " " + words.shift()).trim();
  }
  return [first || words.shift() || "", words.join(" ")].filter(Boolean).slice(0, 2);
}

function ChipCluster({
  at,
  chips,
  blockRect,
  edge,
  highlight,
  onHighlight,
  onHover,
  onLeave,
}: {
  at: string;
  chips: { n: number; capability: string; note?: string }[];
  blockRect?: Rect;
  edge?: EdgeGeometry;
  highlight: Highlight | null;
  onHighlight: (h: Highlight | null) => void;
  onHover: (h: Hover) => void;
  onLeave: () => void;
}) {
  return (
    <>
      {chips.map((chip, i) => {
        let cx: number;
        let cy: number;
        if (blockRect) {
          // On the block's bottom border, as F5 seats its chips.
          cx = blockRect.x + 16 + i * 24;
          cy = blockRect.y + blockRect.h;
        } else if (edge) {
          cx = edge.midX + (edge.horizontal ? (i - (chips.length - 1) / 2) * 24 : 0);
          cy = edge.midY + (edge.horizontal ? 0 : (i - (chips.length - 1) / 2) * 24);
        } else {
          return null;
        }
        const active = highlight?.kind === "capability" && highlight.id === chip.capability;
        const dim = highlight && !active;
        const capability = capabilityById.get(chip.capability);
        return (
          <g
            key={`${at}-${chip.capability}`}
            role="button"
            tabIndex={0}
            aria-label={`Capability ${chip.n}: ${capability?.title ?? chip.capability}`}
            opacity={dim ? 0.45 : 1}
            onClick={() =>
              onHighlight(active ? null : { kind: "capability", id: chip.capability })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onHighlight(active ? null : { kind: "capability", id: chip.capability });
              }
            }}
            onPointerEnter={() =>
              onHover({
                x: cx,
                y: cy,
                title: `${chip.n} · ${capability?.title ?? chip.capability}`,
                body: chip.note ?? "",
                meta: "capability to deploy — click to trace",
              })
            }
            onPointerLeave={onLeave}
            style={{ cursor: "pointer" }}
          >
            <circle cx={cx} cy={cy} r={13} fill="transparent" />
            <circle
              cx={cx}
              cy={cy}
              r={CHIP.r}
              fill={CHIP.fill}
              stroke={active ? "var(--ink)" : CHIP.stroke}
              strokeWidth={active ? 2 : 1.3}
            />
            <text
              x={cx}
              y={cy + 3.5}
              textAnchor="middle"
              fill={CHIP.text}
              style={{ font: "700 10px var(--font-body), sans-serif", pointerEvents: "none" }}
            >
              {chip.n}
            </text>
          </g>
        );
      })}
    </>
  );
}

function TagStack({
  at,
  tags,
  blockRect,
  edge,
  highlight,
  onHighlight,
  onHover,
  onLeave,
}: {
  at: string;
  tags: { risk: string; note?: string }[];
  blockRect?: Rect;
  edge?: EdgeGeometry;
  highlight: Highlight | null;
  onHighlight: (h: Highlight | null) => void;
  onHover: (h: Hover) => void;
  onLeave: () => void;
}) {
  // Anchor point the leader line reaches, and where the stack grows from.
  let ax: number;
  let ay: number;
  if (blockRect) {
    ax = blockRect.x + 18;
    ay = blockRect.y - TAB_H / 2;
  } else if (edge) {
    ax = edge.midX + (edge.horizontal ? -30 : 14);
    ay = edge.midY + (edge.horizontal ? -12 : -30);
  } else {
    return null;
  }

  return (
    <g>
      <path
        d={
          blockRect
            ? `M ${ax} ${ay - tags.length * 20 + 4} L ${ax} ${ay}`
            : `M ${ax} ${ay - tags.length * 20 + 16} L ${ax} ${edge!.midY} L ${edge!.midX} ${edge!.midY}`
        }
        fill="none"
        stroke="var(--line-strong)"
        strokeWidth={1}
      />
      {tags.map((tag, i) => {
        const code = riskCode(tag.risk);
        const w = tagWidth(code);
        const y = ay - 20 * (tags.length - i);
        const active = highlight?.kind === "risk" && highlight.id === tag.risk;
        const dim = highlight && !active;
        const risk = riskById.get(tag.risk);
        return (
          <g
            key={`${at}-${tag.risk}-${i}`}
            role="button"
            tabIndex={0}
            aria-label={`Risk ${code}: ${risk?.title ?? tag.risk}`}
            opacity={dim ? 0.45 : 1}
            onClick={() => onHighlight(active ? null : { kind: "risk", id: tag.risk })}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onHighlight(active ? null : { kind: "risk", id: tag.risk });
              }
            }}
            onPointerEnter={() =>
              onHover({
                x: ax + w / 2,
                y,
                title: `${code} · ${risk?.title ?? tag.risk}`,
                body: tag.note ?? "",
                meta: "risk here — click to trace",
              })
            }
            onPointerLeave={onLeave}
            style={{ cursor: "pointer" }}
          >
            <rect
              x={ax - w / 2}
              y={y}
              width={w}
              height={TAG.h}
              rx={2}
              fill={TAG.fill}
              stroke={active ? "var(--ink)" : TAG.stroke}
              strokeWidth={active ? 1.8 : 1}
            />
            <text
              x={ax}
              y={y + 12.5}
              textAnchor="middle"
              fill={TAG.text}
              style={{
                font: "700 9px var(--font-mono-id), monospace",
                letterSpacing: "0.04em",
                pointerEvents: "none",
              }}
            >
              {code}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function HoverCard({ hover, width }: { hover: Hover; width: number }) {
  const lines = wrap(hover.body, 46).slice(0, 4);
  const w = 300;
  const h = 34 + lines.length * 14 + (hover.meta ? 16 : 0);
  const x = clamp(hover.x - w / 2, 8, width - w - 8);
  const y = hover.y > h + 24 ? hover.y - h - 14 : hover.y + 20;

  return (
    <g style={{ pointerEvents: "none" }}>
      <rect x={x} y={y} width={w} height={h} rx={8} fill="var(--ink)" opacity={0.96} />
      <text x={x + 12} y={y + 19} fill="#fff" style={{ font: "700 12px var(--font-body), sans-serif" }}>
        {hover.title}
      </text>
      {lines.map((line, i) => (
        <text
          key={i}
          x={x + 12}
          y={y + 35 + i * 14}
          fill="#fff"
          opacity={0.82}
          style={{ font: "400 11.5px var(--font-body), sans-serif" }}
        >
          {line}
        </text>
      ))}
      {hover.meta && (
        <text
          x={x + 12}
          y={y + h - 10}
          fill="#fff"
          opacity={0.6}
          style={{ font: "500 10px var(--font-mono-id), monospace" }}
        >
          {hover.meta}
        </text>
      )}
    </g>
  );
}

function wrap(text: string, cols: number) {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if (line && line.length + word.length + 1 > cols) {
      out.push(line);
      line = "";
    }
    line += (line ? " " : "") + word;
  }
  if (line) out.push(line);
  return out;
}

/** Drawn outside the pan/zoom transform so it stays pinned, as on the risk map. */
function ZoomControls({
  width,
  height,
  zoom,
  onIn,
  onOut,
  onReset,
}: {
  width: number;
  height: number;
  zoom: number;
  onIn: () => void;
  onOut: () => void;
  onReset: () => void;
}) {
  const buttons = [
    { label: "Zoom in", onClick: onIn, glyph: <><path d="M -6 0 H 6" /><path d="M 0 -6 V 6" /></> },
    { label: "Zoom out", onClick: onOut, glyph: <path d="M -6 0 H 6" /> },
    {
      label: "Reset view",
      onClick: onReset,
      glyph: (
        <>
          <path d="M -5.5 -5.5 H 5.5 V 5.5 H -5.5 Z" />
          <path d="M -2 -2 H 2 V 2 H -2 Z" />
        </>
      ),
    },
  ];
  return (
    <g>
      {zoom !== 1 && (
        <text
          x={width - 118}
          y={height - 17}
          textAnchor="end"
          fill="var(--ink-3)"
          style={{ font: "500 11px var(--font-mono-id), monospace" }}
        >
          {Math.round(zoom * 100)}%
        </text>
      )}
      {buttons.map((b, i) => (
        <g
          key={b.label}
          transform={`translate(${width - 96 + i * 32} ${height - 22})`}
          role="button"
          tabIndex={0}
          aria-label={b.label}
          onClick={b.onClick}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              b.onClick();
            }
          }}
          style={{ cursor: "pointer" }}
        >
          <rect x={-13} y={-13} width={26} height={26} rx={7} fill="var(--paper)" stroke="var(--line-strong)" strokeWidth={1.25} />
          <g fill="none" stroke="var(--ink-2)" strokeWidth={1.5} strokeLinecap="round">
            {b.glyph}
          </g>
        </g>
      ))}
    </g>
  );
}
