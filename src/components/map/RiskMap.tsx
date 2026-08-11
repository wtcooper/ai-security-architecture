"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  ACTORS,
  BAND_TOKENS,
  BAND_RIGHT,
  BANDS,
  BOXES,
  CAPTIONS,
  EDGES,
  GROUPS,
  HEIGHT,
  RAILS,
  TOP_MARGIN,
  WIDTH,
  type Actor,
  type Box,
} from "@/lib/map-layout";
import { componentTitle } from "@/lib/data";
import type { Phase } from "@/lib/types";

const PHASE_STYLE: Record<Phase, { stroke: string; fill: string; badge: string }> = {
  introduced: {
    stroke: "var(--introduced)",
    fill: "var(--introduced-soft)",
    badge: "var(--introduced)",
  },
  exposed: { stroke: "var(--exposed)", fill: "var(--exposed-soft)", badge: "var(--exposed)" },
  mitigated: {
    stroke: "var(--mitigated)",
    fill: "var(--mitigated-soft)",
    badge: "var(--mitigated)",
  },
};

/** Browsing the map, not touring a risk: highlight without claiming a phase. */
const SELECTION_STYLE = { stroke: "var(--ink)", fill: "var(--mist)", badge: "var(--ink)" };

/** Which band a y coordinate falls in, for tinting group outlines. */
const bandOf = (y: number) =>
  BANDS.find((b) => y >= b.y && y < b.y + b.height)?.id ?? "application";

interface RiskMapProps {
  phase: Phase;
  /** CoSAI component ids highlighted at this step. */
  active: string[];
  /** Optional step numbers to pin on boxes, used by the incident flows. */
  stepMarks?: Record<string, number>;
  /** Highlight as a plain selection — no phase colour, no phase badge. */
  selectionOnly?: boolean;
  onSelect?: (componentId: string) => void;
  className?: string;
}

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 6;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function RiskMap({
  phase,
  active,
  stepMarks,
  selectionOnly,
  onSelect,
  className,
}: RiskMapProps) {
  const activeSet = new Set(active);
  const style = selectionOnly ? SELECTION_STYLE : PHASE_STYLE[phase];

  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);

  /** Client coordinates -> the map's own coordinate space. */
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

  /** Zoom about a fixed point, so the thing under the cursor stays under the cursor. */
  const zoomAbout = useCallback((factor: number, at: { x: number; y: number }) => {
    setView((v) => {
      const k = clamp(v.k * factor, MIN_ZOOM, MAX_ZOOM);
      const ratio = k / v.k;
      return { k, x: at.x - (at.x - v.x) * ratio, y: at.y - (at.y - v.y) * ratio };
    });
  }, []);

  // Wheel needs a non-passive listener to stop the page scrolling underneath.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
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
    setPanning(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const doPan = (e: React.PointerEvent<SVGSVGElement>) => {
    const from = drag.current;
    if (!from) return;
    if (Math.abs(e.clientX - from.x) + Math.abs(e.clientY - from.y) > 3) moved.current = true;
    const a = toMap(from.x, from.y);
    const b = toMap(e.clientX, e.clientY);
    drag.current = { x: e.clientX, y: e.clientY };
    setView((v) => ({ ...v, x: v.x + (b.x - a.x), y: v.y + (b.y - a.y) }));
  };

  const endPan = (e: React.PointerEvent<SVGSVGElement>) => {
    drag.current = null;
    setPanning(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // A drag that ends over a box should not also select it.
  const select = onSelect
    ? (id: string) => {
        if (!moved.current) onSelect(id);
      }
    : undefined;

  const centre = { x: WIDTH / 2, y: HEIGHT / 2 };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 ${-TOP_MARGIN} ${WIDTH} ${HEIGHT + TOP_MARGIN}`}
      className={className}
      role="img"
      aria-label={`AI system component map, highlighting where the risk is ${phase}`}
      onPointerDown={startPan}
      onPointerMove={doPan}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      style={{ touchAction: "none", cursor: panning ? "grabbing" : "grab" }}
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 8 8"
          refX="6.5"
          refY="4"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 7 4 L 0 7 z" fill="var(--line-strong)" />
        </marker>
      </defs>

      <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
      <Bands />
      <Rails />
      <Groups onSelect={select} selected={active} />

      <g>
        {EDGES.map((edge) => (
          <path
            key={`${edge.from}->${edge.to}`}
            d={edge.d}
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth={edge.soft ? 1 : 1.25}
            strokeDasharray={edge.soft ? "4 4" : undefined}
            markerEnd="url(#arrow)"
            opacity={edge.soft ? 0.6 : 0.95}
          />
        ))}
      </g>

      {CAPTIONS.map((c) => (
        <text
          key={c.text}
          x={c.x}
          y={c.y}
          textAnchor="middle"
          fill="var(--ink-3)"
          style={{
            font: `500 ${c.small ? 10.5 : 12}px var(--font-mono-id), monospace`,
            letterSpacing: "0.04em",
          }}
        >
          {c.text}
        </text>
      ))}

      {ACTORS.map((actor) => (
        <MapActor
          key={actor.id}
          actor={actor}
          active={activeSet.has(actor.id)}
          style={style}
          stepMark={stepMarks?.[actor.id]}
        />
      ))}

      {BOXES.map((box) => (
        <MapBox
          key={box.id}
          box={box}
          active={activeSet.has(box.id)}
          phase={phase}
          style={style}
          showBadge={!selectionOnly}
          stepMark={stepMarks?.[box.id]}
          onSelect={select}
        />
      ))}
      </g>

      <ZoomControls
        zoom={view.k}
        onIn={() => zoomAbout(1.3, centre)}
        onOut={() => zoomAbout(1 / 1.3, centre)}
        onReset={() => setView({ k: 1, x: 0, y: 0 })}
      />
    </svg>
  );
}

/** Zoom controls, drawn outside the pan/zoom transform so they stay put. */
function ZoomControls({
  zoom,
  onIn,
  onOut,
  onReset,
}: {
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
          x={938}
          y={1051}
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
          transform={`translate(${979 + i * 32} 1046)`}
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
          <g fill="none" stroke="var(--ink-2)" strokeWidth={1.6} strokeLinecap="round">
            {b.glyph}
          </g>
        </g>
      ))}
    </g>
  );
}

function Bands() {
  return (
    <g>
      {BANDS.map((band) => {
        const t = BAND_TOKENS[band.id];
        const midY = band.y + band.height / 2;
        return (
          <g key={band.id}>
            <rect x={92} y={band.y} width={BAND_RIGHT - 92} height={band.height} rx={10} fill={t.fill} />
            <rect x={92} y={band.y} width={4} height={band.height} rx={2} fill={t.rail} />
            <text
              x={74}
              y={midY}
              textAnchor="middle"
              transform={`rotate(-90 74 ${midY})`}
              fill={t.rail}
              style={{
                font: "600 12px var(--font-mono-id), monospace",
                letterSpacing: "0.11em",
              }}
            >
              {band.label.toUpperCase()}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Rails() {
  return (
    <g>
      {RAILS.map((rail) => {
        const midY = rail.y + rail.height / 2;
        return (
          <g key={rail.label}>
            <path
              d={`M 42 ${rail.y + 6} L 34 ${rail.y + 14} L 34 ${rail.y + rail.height - 14} L 42 ${
                rail.y + rail.height - 6
              }`}
              fill="none"
              stroke="var(--line-strong)"
              strokeWidth={1.25}
            />
            <text
              x={20}
              y={midY}
              textAnchor="middle"
              transform={`rotate(-90 20 ${midY})`}
              fill="var(--ink-2)"
              style={{ font: "600 15px var(--font-display), sans-serif" }}
            >
              {rail.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The Agent, drawn as a parent box: a soft panel lighter than the band it sits in. */
function Groups({
  onSelect,
  selected,
}: {
  onSelect?: (id: string) => void;
  selected: string[];
}) {
  const selectedSet = new Set(selected);
  return (
    <g>
      {GROUPS.map((group) => {
        const t = BAND_TOKENS[bandOf(group.y)];
        const interactive = Boolean(onSelect);
        const active = selectedSet.has(group.id);
        return (
          <g
            key={group.id}
            onClick={interactive ? () => onSelect?.(group.id) : undefined}
            style={{ cursor: interactive ? "pointer" : "default" }}
            tabIndex={interactive ? 0 : undefined}
            role={interactive ? "button" : undefined}
            aria-label={interactive ? group.label : undefined}
            onKeyDown={
              interactive
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect?.(group.id);
                    }
                  }
                : undefined
            }
          >
            <rect
              x={group.x}
              y={group.y}
              width={group.w}
              height={group.h}
              rx={14}
              fill="color-mix(in srgb, var(--paper) 45%, transparent)"
              stroke={active ? "var(--ink)" : t.rail}
              strokeWidth={active ? 1.75 : 1.25}
              strokeDasharray={active ? undefined : "6 5"}
              opacity={active ? 1 : 0.5}
              style={{ transition: "stroke 200ms, opacity 200ms" }}
            >
              <title>{group.hint}</title>
            </rect>
            <text
              x={group.x + 18}
              y={group.y + 20}
              fill={t.rail}
              style={{
                font: "600 11px var(--font-mono-id), monospace",
                letterSpacing: "0.12em",
                pointerEvents: "none",
              }}
            >
              {group.label.toUpperCase()}
            </text>
          </g>
        );
      })}
    </g>
  );
}

interface MapBoxProps {
  box: Box;
  active: boolean;
  phase: Phase;
  style: { stroke: string; fill: string; badge: string };
  showBadge: boolean;
  stepMark?: number;
  onSelect?: (id: string) => void;
}

function MapBox({ box, active, phase, style, showBadge, stepMark, onSelect }: MapBoxProps) {
  const t = BAND_TOKENS[bandOf(box.y)];
  const interactive = Boolean(onSelect);
  const label = componentTitle(box.id);
  const labelSize = box.emphasis ? 16 : box.compact ? 10.5 : 12.5;

  // Group boxes carry their title at the top, leaving room for the children inside.
  const titleY = box.group ? box.y + 22 : box.y + box.h / 2;

  // Long labels in narrow boxes wrap onto two lines.
  const words = label.split(" ");
  const wrap = !box.emphasis && !box.compact && !box.group && label.length > 18 && box.w < 220;
  const mid = Math.ceil(words.length / 2);
  const lines = wrap ? [words.slice(0, mid).join(" "), words.slice(mid).join(" ")] : [label];

  return (
    <g
      onClick={interactive ? () => onSelect?.(box.id) : undefined}
      style={{ cursor: interactive ? "pointer" : "default" }}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? "button" : undefined}
      aria-label={interactive ? `${label}${active ? `, ${phase}` : ""}` : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.(box.id);
              }
            }
          : undefined
      }
    >
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        rx={box.group ? 10 : 7}
        fill={
          active
            ? style.fill
            : box.group
              ? "color-mix(in srgb, var(--paper) 70%, transparent)"
              : "var(--paper)"
        }
        stroke={active ? style.stroke : t.edge}
        strokeWidth={active ? 2 : 1.25}
        opacity={active ? 1 : 0.9}
        style={{ transition: "fill 200ms, stroke 200ms, opacity 200ms" }}
      />
      <text
        x={box.x + box.w / 2}
        y={titleY}
        textAnchor="middle"
        dominantBaseline="central"
        fill={active ? "var(--ink)" : box.group ? "var(--ink-2)" : "var(--ink-2)"}
        style={{
          font: `${box.emphasis || box.group ? 600 : 500} ${
            box.group ? 14 : labelSize
          }px var(--font-display), sans-serif`,
          letterSpacing: box.emphasis ? "-0.01em" : "0",
          pointerEvents: "none",
          transition: "fill 200ms",
        }}
      >
        {lines.map((line, i) => (
          <tspan key={i} x={box.x + box.w / 2} dy={i === 0 ? (lines.length > 1 ? -7 : 0) : 14}>
            {line}
          </tspan>
        ))}
      </text>

      {box.sublabel && (
        <text
          x={box.x + box.w / 2}
          y={box.y + 39}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--ink-3)"
          style={{
            font: "400 10.5px var(--font-mono-id), monospace",
            letterSpacing: "0.03em",
            pointerEvents: "none",
          }}
        >
          {box.sublabel}
        </text>
      )}

      {active && showBadge && (
        <PhaseBadge phase={phase} x={box.x} y={box.y + box.h / 2} color={style.badge} />
      )}

      {stepMark !== undefined && (
        <g className="badge-in">
          <circle
            cx={box.x + box.w}
            cy={box.y}
            r={13}
            fill="var(--ink)"
            stroke="var(--paper)"
            strokeWidth={2}
          />
          <text
            x={box.x + box.w}
            y={box.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            style={{ font: "600 12px var(--font-mono-id), monospace", pointerEvents: "none" }}
          >
            {stepMark}
          </text>
        </g>
      )}
    </g>
  );
}

/**
 * The User and the external world, drawn on the boundary they cross. Dashed and unfilled so
 * they read as outside the system rather than as another component.
 */
function MapActor({
  actor,
  active,
  style,
  stepMark,
}: {
  actor: Actor;
  active: boolean;
  style: { stroke: string; fill: string; badge: string };
  stepMark?: number;
}) {
  const cx = actor.x + actor.w / 2;
  const cy = actor.y + actor.h / 2;
  return (
    <g>
      <path
        d={actor.d}
        fill="none"
        stroke={active ? style.stroke : "var(--line-strong)"}
        strokeWidth={active ? 1.75 : 1.25}
        strokeDasharray="4 4"
        markerEnd={actor.directed ? "url(#arrow)" : undefined}
        opacity={active ? 1 : 0.7}
        style={{ transition: "stroke 200ms" }}
      />
      <rect
        x={actor.x}
        y={actor.y}
        width={actor.w}
        height={actor.h}
        rx={11}
        fill={active ? style.fill : "var(--paper)"}
        stroke={active ? style.stroke : "var(--line-strong)"}
        strokeWidth={active ? 1.75 : 1.25}
        strokeDasharray={active ? undefined : "4 3"}
        style={{ transition: "fill 200ms, stroke 200ms" }}
      >
        <title>{actor.hint}</title>
      </rect>
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        transform={actor.rotated ? `rotate(-90 ${cx} ${cy})` : undefined}
        fill={active ? "var(--ink)" : "var(--ink-3)"}
        style={{
          font: "500 11px var(--font-mono-id), monospace",
          letterSpacing: "0.06em",
          pointerEvents: "none",
          transition: "fill 200ms",
        }}
      >
        {actor.label.toUpperCase()}
      </text>
      {stepMark !== undefined && (
        <g className="badge-in">
          <circle
            cx={actor.x + actor.w}
            cy={actor.y}
            r={12}
            fill="var(--ink)"
            stroke="var(--paper)"
            strokeWidth={2}
          />
          <text
            x={actor.x + actor.w}
            y={actor.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            style={{ font: "600 11px var(--font-mono-id), monospace", pointerEvents: "none" }}
          >
            {stepMark}
          </text>
        </g>
      )}
    </g>
  );
}

/** The three phase glyphs: arrow in, warning, shield. */
function PhaseBadge({
  phase,
  x,
  y,
  color,
}: {
  phase: Phase;
  x: number;
  y: number;
  color: string;
}) {
  return (
    <g className="badge-in" style={{ pointerEvents: "none" }}>
      <circle cx={x} cy={y} r={12} fill={color} stroke="var(--paper)" strokeWidth={2} />
      <g transform={`translate(${x - 7} ${y - 7})`} fill="none" stroke="#fff" strokeWidth={1.7}>
        {phase === "introduced" && (
          <>
            <path d="M 2 7 L 12 7" strokeLinecap="round" />
            <path d="M 8 3 L 12 7 L 8 11" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
        {phase === "exposed" && (
          <>
            <path d="M 7 2.4 L 12.6 11.6 L 1.4 11.6 Z" strokeLinejoin="round" />
            <path d="M 7 5.8 L 7 8.4" strokeLinecap="round" />
            <circle cx="7" cy="10" r="0.5" fill="#fff" stroke="none" />
          </>
        )}
        {phase === "mitigated" && (
          <path
            d="M 7 1.8 L 12.2 4 V 7.6 C 12.2 10.2 9.9 12 7 12.8 C 4.1 12 1.8 10.2 1.8 7.6 V 4 Z"
            strokeLinejoin="round"
          />
        )}
      </g>
    </g>
  );
}
