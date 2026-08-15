"use client";

/**
 * The architecture renderer: hand-rolled SVG over build-time geometry.
 *
 * Reading order is deliberate. At rest the diagram shows structure only — zones, nodes and the
 * flow between them. Controls are dots on the crossings; hovering one names the control and the
 * capability behind it, clicking opens the full detail. An earlier draft drew every control as a
 * text pill and the diagram became unreadable: 286 pills, overlapping, competing with the nodes
 * they were attached to. The information is the same; only its disclosure changed.
 *
 * Pan and zoom follow RiskMap, including the trick of not capturing the pointer until it has
 * actually moved, without which a click never reaches the node the visitor was aiming at. Zoom
 * needs a modifier so the page can still be scrolled past a tall diagram.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { capabilityById, controlKindById, nodeTypeById } from "@/lib/data";
import type { Archetype } from "@/lib/types";
import {
  CONTROL_DASH,
  EDGE_STROKE,
  isActorGroup,
  nodeAccent,
  zonePersonaLabel,
  zoneStyle,
} from "./zone-style";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export interface DiagramSelection {
  kind: "node" | "edge";
  id: string;
}

interface ZoneDiagramProps {
  archetype: Archetype;
  selected: DiagramSelection | null;
  onSelect: (selection: DiagramSelection | null) => void;
  className?: string;
}

const edgeKey = (from: string, to: string) => `${from}->${to}`;

/** What a hover is showing, and where to draw it. */
interface Hover {
  x: number;
  y: number;
  title: string;
  body: string;
  meta?: string;
}

export function ZoneDiagram({ archetype, selected, onSelect, className }: ZoneDiagramProps) {
  const { layout } = archetype;
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [hover, setHover] = useState<Hover | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const captured = useRef(false);

  // Reset the viewport when the archetype changes, so a zoomed-in view of one diagram does not
  // become a confusing off-centre view of the next.
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

  // Zoom only while a modifier is held. The risk map can afford to capture every wheel event
  // because it is one diagram on a short page; these are tall diagrams on a long one, and
  // swallowing the wheel means the page cannot be scrolled past the picture at all.
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

  /** A drag that ends over a node should not also select it. */
  const pick = (selection: DiagramSelection) => {
    if (moved.current) return;
    const same = selected?.kind === selection.kind && selected.id === selection.id;
    onSelect(same ? null : selection);
  };

  const zoneById = new Map(archetype.zones.map((z) => [z.id, z]));
  const centre = { x: layout.width / 2, y: layout.height / 2 };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className={className}
      role="img"
      aria-label={`Target reference architecture for ${archetype.title}, showing trust boundaries and the control securing each crossing`}
      onPointerDown={startPan}
      onPointerMove={doPan}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onPointerLeave={() => setHover(null)}
      style={{ touchAction: "none", cursor: panning ? "grabbing" : "grab" }}
    >
      <defs>
        <marker
          id="zone-arrow"
          viewBox="0 0 8 8"
          refX="6.5"
          refY="4"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 7 4 L 0 7 z" fill={EDGE_STROKE} />
        </marker>
      </defs>

      <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
        {archetype.zones.map((zone) => {
          const rect = layout.zones[zone.id];
          if (!rect) return null;
          const style = zoneStyle(zone.type);
          const chipInHeader = rect.w > 300;
          const budget = Math.floor(((chipInHeader ? rect.w * 0.55 : rect.w - 28) - 16) / 5.6);
          return (
            <g key={zone.id}>
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.w}
                height={rect.h}
                rx={12}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={1.5}
                strokeDasharray={style.dash}
              />
              <text
                x={rect.x + 16}
                y={rect.y + 21}
                fill="var(--ink-2)"
                style={{
                  font: "600 11.5px var(--font-mono-id), monospace",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {zone.label}
              </text>
              <PersonaChip
                x={rect.x + rect.w - 14}
                y={chipInHeader ? rect.y + 13 : rect.y + rect.h - 26}
                label={zonePersonaLabel(zone.personas, budget)}
              />
              {zone.type === "vendorOpaque" && (
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + rect.h - 13}
                  textAnchor="middle"
                  fill="var(--ink-3)"
                  style={{ font: "italic 400 11px var(--font-body), sans-serif" }}
                >
                  provider-operated — only the published interface is drawn
                </text>
              )}
            </g>
          );
        })}

        {layout.edges.map((geometry) => {
          const edge = archetype.edges.find(
            (e) => e.from === geometry.from && e.to === geometry.to,
          );
          if (!edge || !geometry.d) return null;
          const key = edgeKey(edge.from, edge.to);
          const active = selected?.kind === "edge" && selected.id === key;
          const control = edge.control;

          return (
            <g key={key}>
              <path
                d={geometry.d}
                fill="none"
                stroke={active ? "var(--ink)" : EDGE_STROKE}
                strokeWidth={active ? 1.9 : 1.25}
                strokeDasharray={edge.kind === "control" ? CONTROL_DASH : undefined}
                markerEnd="url(#zone-arrow)"
                opacity={edge.kind === "control" ? 0.7 : 0.95}
              />
              {control && (
                <ControlMarker
                  x={geometry.labelX}
                  y={geometry.labelY}
                  active={active}
                  onEnter={() =>
                    setHover({
                      x: geometry.labelX,
                      y: geometry.labelY,
                      title: control.title,
                      body: control.note ?? controlKindById.get(control.kind)?.description ?? "",
                      meta: capabilityById.get(control.capability)?.title,
                    })
                  }
                  onLeave={() => setHover(null)}
                  onClick={() => pick({ kind: "edge", id: key })}
                  label={`${edge.label ?? "connection"} from ${edge.from} to ${edge.to}, secured by ${control.title}`}
                />
              )}
            </g>
          );
        })}

        {archetype.nodes.map((node) => {
          const rect = layout.nodes[node.id];
          if (!rect) return null;
          const type = nodeTypeById.get(node.type);
          const active = selected?.kind === "node" && selected.id === node.id;
          const actor = isActorGroup(type);
          const accent = nodeAccent(type);
          const zone = zoneById.get(node.zone);

          return (
            <g
              key={node.id}
              role="button"
              tabIndex={0}
              aria-label={`${node.label}, ${type?.title ?? node.type}, in ${zone?.label ?? node.zone}`}
              onClick={() => pick({ kind: "node", id: node.id })}
              onPointerEnter={() =>
                !panning &&
                setHover({
                  x: rect.x + rect.w / 2,
                  y: rect.y - 6,
                  title: node.label,
                  body: firstSentence(node.note) || type?.description || "",
                  meta: node.capabilities?.length
                    ? `${node.capabilities.length} capabilities attach here`
                    : undefined,
                })
              }
              onPointerLeave={() => setHover(null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(active ? null : { kind: "node", id: node.id });
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.w}
                height={rect.h}
                rx={8}
                fill={actor ? "transparent" : "var(--paper)"}
                stroke={active ? "var(--ink)" : actor ? "var(--ink-3)" : "var(--line-strong)"}
                strokeWidth={active ? 2 : 1.25}
                strokeDasharray={actor ? "5 4" : undefined}
              />
              {!actor && (
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={3}
                  height={rect.h}
                  rx={1.5}
                  fill={accent}
                  opacity={0.9}
                />
              )}
              <text
                x={rect.x + rect.w / 2}
                y={rect.y + 21}
                textAnchor="middle"
                fill="var(--ink)"
                style={{ font: `${active ? 700 : 600} 12px var(--font-body), sans-serif` }}
              >
                {node.label}
              </text>
              <text
                x={rect.x + rect.w / 2}
                y={rect.y + 35}
                textAnchor="middle"
                fill="var(--ink-3)"
                style={{ font: "500 9.5px var(--font-mono-id), monospace", letterSpacing: "0.03em" }}
              >
                {type?.title ?? node.type}
              </text>
            </g>
          );
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

/** Hover text is one sentence. The full note is a click away, in the panel. */
function firstSentence(text?: string) {
  if (!text) return "";
  const flat = text.replace(/\s+/g, " ").trim();
  const end = flat.search(/\.\s|\.$/);
  return end === -1 ? flat : flat.slice(0, end + 1);
}

/**
 * A control on a crossing, at rest. Small enough that twelve of them on one diagram read as
 * punctuation rather than as content — which is the whole reason they are not text.
 */
function ControlMarker({
  x,
  y,
  active,
  onEnter,
  onLeave,
  onClick,
  label,
}: {
  x: number;
  y: number;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
  label: string;
}) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{ cursor: "pointer" }}
    >
      {/* Generous invisible hit target; the visible mark stays small. */}
      <circle cx={x} cy={y} r={13} fill="transparent" />
      <circle
        cx={x}
        cy={y}
        r={7.5}
        fill="var(--paper)"
        stroke={active ? "var(--ink)" : "var(--mitigated)"}
        strokeWidth={active ? 1.8 : 1.3}
      />
      <path
        d={`M ${x - 3} ${y} L ${x - 1} ${y + 2.6} L ${x + 3.2} ${y - 2.4}`}
        fill="none"
        stroke={active ? "var(--ink)" : "var(--mitigated)"}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

/**
 * Hover text, drawn inside the pan/zoom transform so it needs no coordinate maths and moves with
 * the diagram. Wrapped by hand because SVG has no text flow.
 */
function HoverCard({ hover, width }: { hover: Hover; width: number }) {
  const lines = wrap(hover.body, 46).slice(0, 4);
  const w = 300;
  const h = 34 + lines.length * 14 + (hover.meta ? 16 : 0);
  // Keep the card on the canvas rather than letting it hang off the edge.
  const x = clamp(hover.x - w / 2, 8, width - w - 8);
  const y = hover.y > h + 20 ? hover.y - h - 12 : hover.y + 18;

  return (
    <g style={{ pointerEvents: "none" }}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill="var(--ink)"
        opacity={0.96}
        stroke="var(--ink)"
      />
      <text
        x={x + 12}
        y={y + 19}
        fill="#fff"
        style={{ font: "700 12px var(--font-body), sans-serif" }}
      >
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
          <rect
            x={-13}
            y={-13}
            width={26}
            height={26}
            rx={7}
            fill="var(--paper)"
            stroke="var(--line-strong)"
            strokeWidth={1.25}
          />
          <g fill="none" stroke="var(--ink-2)" strokeWidth={1.5} strokeLinecap="round">
            {b.glyph}
          </g>
        </g>
      ))}
    </g>
  );
}

/** The CoSAI persona(s) responsible for the zone, right-aligned in its header. */
function PersonaChip({ x, y, label }: { x: number; y: number; label: string }) {
  const w = label.length * 5.6 + 16;
  return (
    <g>
      <rect
        x={x - w}
        y={y}
        width={w}
        height={17}
        rx={8.5}
        fill="var(--paper)"
        stroke="var(--line-strong)"
        strokeWidth={1}
      />
      <text
        x={x - w / 2}
        y={y + 12}
        textAnchor="middle"
        fill="var(--ink-2)"
        style={{ font: "600 9.5px var(--font-mono-id), monospace", letterSpacing: "0.04em" }}
      >
        {label}
      </text>
    </g>
  );
}
