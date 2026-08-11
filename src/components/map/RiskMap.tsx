"use client";

import {
  BAND_TOKENS,
  BANDS,
  BOXES,
  CAPTIONS,
  EDGES,
  GROUPS,
  HEIGHT,
  RAILS,
  WIDTH,
  type Box,
} from "@/lib/map-layout";
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

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={className}
      role="img"
      aria-label={`CoSAI component map, highlighting where the risk is ${phase}`}
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

      <Bands />
      <Rails />
      <Groups />

      <g>
        {EDGES.map((edge) => (
          <path
            key={`${edge.from}->${edge.to}`}
            d={edge.d}
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth={edge.soft ? 1 : 1.25}
            strokeDasharray={edge.soft ? "3 5" : undefined}
            markerEnd="url(#arrow)"
            opacity={edge.soft ? 0.4 : 0.95}
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

      {BOXES.map((box) => (
        <MapBox
          key={box.id}
          box={box}
          active={activeSet.has(box.id)}
          phase={phase}
          style={style}
          showBadge={!selectionOnly}
          stepMark={stepMarks?.[box.id]}
          onSelect={onSelect}
        />
      ))}
    </svg>
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
            <rect x={92} y={band.y} width={WIDTH - 102} height={band.height} rx={10} fill={t.fill} />
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

/** Dashed outlines for the Agent and Orchestration groupings. */
function Groups() {
  return (
    <g>
      {GROUPS.map((group) => {
        const t = BAND_TOKENS[bandOf(group.y)];
        const midY = group.y + group.h / 2;
        return (
          <g key={group.id}>
            <rect
              x={group.x}
              y={group.y}
              width={group.w}
              height={group.h}
              rx={12}
              fill="none"
              stroke={t.rail}
              strokeWidth={1.25}
              strokeDasharray="6 5"
              opacity={0.45}
            />
            <text
              x={group.x + 14}
              y={midY}
              textAnchor="middle"
              transform={`rotate(-90 ${group.x + 14} ${midY})`}
              fill={t.rail}
              style={{ font: "600 11px var(--font-mono-id), monospace", letterSpacing: "0.11em" }}
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
  const labelSize = box.emphasis ? 16 : box.compact ? 10.5 : 12.5;

  // Long labels in narrow boxes wrap onto two lines.
  const words = box.label.split(" ");
  const wrap = !box.emphasis && !box.compact && box.label.length > 18 && box.w < 200;
  const mid = Math.ceil(words.length / 2);
  const lines = wrap ? [words.slice(0, mid).join(" "), words.slice(mid).join(" ")] : [box.label];

  return (
    <g
      onClick={interactive ? () => onSelect?.(box.id) : undefined}
      style={{ cursor: interactive ? "pointer" : "default" }}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? "button" : undefined}
      aria-label={interactive ? `${box.label}${active ? `, ${phase}` : ""}` : undefined}
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
        rx={7}
        fill={active ? style.fill : "var(--paper)"}
        stroke={active ? style.stroke : t.edge}
        strokeWidth={active ? 2 : 1.25}
        opacity={active ? 1 : 0.9}
        style={{ transition: "fill 200ms, stroke 200ms, opacity 200ms" }}
      />
      <text
        x={box.x + box.w / 2}
        y={box.y + box.h / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={active ? "var(--ink)" : "var(--ink-2)"}
        style={{
          font: `${box.emphasis ? 600 : 500} ${labelSize}px var(--font-display), sans-serif`,
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
