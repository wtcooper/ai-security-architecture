"use client";

/**
 * Experimental: a plain-box SVG drawing of an architecture. No icons, no item grids — every
 * component is a box with a title and one short line, boundaries are labelled outlines, and
 * arrows carry a few words. It reads the same architecture data as the React Flow canvas
 * (blocks, edges, capability pins, walks) through a hand-laid ViewSpec, so the Overview,
 * Sequence flows and Enable tabs keep working on it: chips light and open their Enable row,
 * a walk numbers its steps onto the arrows.
 */
import { Fragment, useMemo } from "react";

import { capabilityName } from "@/lib/data";
import type { Archetype, ArchEdge, Scenario } from "@/lib/types";

type Pt = [number, number];

export type BoundaryTone = "ours" | "vendor" | "untrusted" | "control";

export interface ViewBoundary {
  /** The architecture zone this outline encloses; crossings are measured against it. */
  zone: string;
  label: string;
  tag?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tone: BoundaryTone;
}

export type BoxTone = "plain" | "actor" | "control" | "container" | "governance";

export interface ViewBox {
  /** A block id on the architecture. */
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title?: string;
  sub?: string;
  tone?: BoxTone;
}

export interface ViewLine {
  /** "from->to" exactly as the architecture's edge is keyed. */
  key: string;
  pts: Pt[];
  /** Where the label sits; text defaults to the edge's label. "\n" breaks a line. */
  label?: { x: number; y: number; anchor?: "start" | "middle" | "end"; text?: string };
}

/** A decoration with no data behind it: a frame drawn inside a box (the sandbox inside the tools). */
export interface ViewFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
}

/** An enforcement-boundary badge, Agent Baseline style: a numbered disc on the thing that enforces it. */
export interface ViewBadge {
  n: number;
  x: number;
  y: number;
}

export interface ViewSpec {
  width: number;
  height: number;
  boundaries: ViewBoundary[];
  boxes: ViewBox[];
  lines: ViewLine[];
  frames?: ViewFrame[];
  badges?: ViewBadge[];
}

export interface Crossing {
  n: number;
  key: string;
  edge: ArchEdge;
  at: Pt;
  fromZone: string;
  toZone: string;
}

const C = {
  ink: "#15181E",
  ink2: "#4B5361",
  ink3: "#7A828F",
  box: "#C8CDD5",
  line: "#4B5563",
  chip: "#6d4fc2",
  chipSoft: "#f1edfb",
  walk: "#101828",
};

const BOUNDARY: Record<BoundaryTone, { stroke: string; fill: string; ink: string; dash: string }> = {
  ours: { stroke: "#8A94A3", fill: "#FAFBFC", ink: "#3D4654", dash: "6 4" },
  vendor: { stroke: "#9B91C7", fill: "#FBFAFE", ink: "#4E427F", dash: "6 4" },
  untrusted: { stroke: "#C2877F", fill: "#FFFCFB", ink: "#8A3B2E", dash: "3 3" },
  control: { stroke: "#9AA8A0", fill: "#F7FAF8", ink: "#36573F", dash: "" },
};

const BOX: Record<BoxTone, { fill: string; stroke: string; width: number }> = {
  plain: { fill: "#FFFFFF", stroke: C.box, width: 1 },
  actor: { fill: "#F4F5F7", stroke: "#AEB4BE", width: 1 },
  control: { fill: "#EEF2F7", stroke: "#4B5563", width: 1.6 },
  container: { fill: "#FFFFFF", stroke: "#9AA1AC", width: 1.2 },
  governance: { fill: "#FFFFFF", stroke: "#B9C7BE", width: 1 },
};

const textWidth = (s: string, size: number) => s.length * size * 0.54;

/** Greedy word wrap to a pixel width, capped at `max` lines (the last one ellipsed). */
function wrap(text: string, width: number, size: number, max: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (textWidth(next, size) > width && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  if (lines.length > max) {
    const kept = lines.slice(0, max);
    kept[max - 1] = `${kept[max - 1].replace(/[,;·—\s]+$/, "")}…`;
    return kept;
  }
  return lines;
}

const keyOf = (e: { from: string; to: string }) => `${e.from}->${e.to}`;
const reverse = (k: string) => k.split("->").reverse().join("->");

/** Where a polyline first crosses the edge of a rectangle, or null. */
function exitPoint(pts: Pt[], r: { x: number; y: number; w: number; h: number }): Pt | null {
  const inside = ([x, y]: Pt) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (inside(a) === inside(b)) continue;
    // Axis-aligned segments: step along the segment to the boundary.
    if (a[0] === b[0]) {
      const y = inside(a) ? (b[1] > a[1] ? r.y + r.h : r.y) : b[1] > a[1] ? r.y : r.y + r.h;
      return [a[0], y];
    }
    const x = inside(a) ? (b[0] > a[0] ? r.x + r.w : r.x) : b[0] > a[0] ? r.x : r.x + r.w;
    return [x, a[1]];
  }
  return null;
}

/** Every line whose ends sit in different trust zones, numbered in drawing order, with the point it crosses. */
export function crossingsOf(archetype: Archetype, spec: ViewSpec): Crossing[] {
  const zoneOf = new Map(archetype.blocks.map((b) => [b.id, b.zone ?? ""]));
  // A nested block's zone is its own; a parent's zone otherwise.
  const edges = new Map(archetype.edges.map((e) => [keyOf(e), e]));
  const out: Crossing[] = [];
  for (const l of spec.lines) {
    const edge = edges.get(l.key);
    if (!edge) continue;
    const fz = zoneOf.get(edge.from) ?? "";
    const tz = zoneOf.get(edge.to) ?? "";
    if (!fz || !tz || fz === tz) continue;
    const rects = [spec.boundaries.find((b) => b.zone === fz), spec.boundaries.find((b) => b.zone === tz)].filter(Boolean) as ViewBoundary[];
    let at: Pt | null = null;
    for (const r of rects) {
      at = exitPoint(l.pts, r);
      if (at) break;
    }
    out.push({ n: out.length + 1, key: l.key, edge, at: at ?? l.pts[Math.floor(l.pts.length / 2)], fromZone: fz, toZone: tz });
  }
  return out;
}

export type CrossingKind = "brokered" | "vendor" | "direct" | "person";

const CROSSING_COLOR: Record<CrossingKind, string> = {
  brokered: "#15181E",
  vendor: "#5B4B9A",
  person: "#4B5361",
  direct: "#C0342B",
};

export function crossingColor(kind: CrossingKind) {
  return CROSSING_COLOR[kind];
}

export function BoxDiagram({
  archetype,
  spec,
  chips = true,
  walk = null,
  litCapability = null,
  onPickMitigation,
  crossings = null,
  crossingKind,
  focusLine = null,
  onFocusLine,
  className,
}: {
  archetype: Archetype;
  spec: ViewSpec;
  /** Draw the capability chips on boxes and arrows. */
  chips?: boolean;
  walk?: Scenario | null;
  litCapability?: string | null;
  onPickMitigation?: (id: string) => void;
  /** Numbered markers where arrows cross a boundary (option C). */
  crossings?: Crossing[] | null;
  crossingKind?: (key: string) => CrossingKind;
  /** One arrow lit, the rest faded — a row hovered in the crossings register. */
  focusLine?: string | null;
  onFocusLine?: (key: string | null) => void;
  className?: string;
}) {
  const number = useMemo(() => new Map(archetype.mitigations.map((id, i) => [id, i + 1])), [archetype]);
  const blocks = useMemo(() => new Map(archetype.blocks.map((b) => [b.id, b])), [archetype]);
  const edges = useMemo(() => new Map(archetype.edges.map((e) => [keyOf(e), e])), [archetype]);

  // Chips per pin location, in capability order.
  const pinsAt = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const p of archetype.pins.mitigations) {
      const list = m.get(p.at) ?? [];
      if (!list.includes(p.mitigation)) list.push(p.mitigation);
      m.set(p.at, list);
    }
    for (const list of m.values()) list.sort((a, b) => (number.get(a) ?? 0) - (number.get(b) ?? 0));
    return m;
  }, [archetype, number]);

  // Walk: step numbers per drawn line, and the boxes the walk touches.
  const lineKeys = new Set(spec.lines.map((l) => l.key));
  const steps = new Map<string, number[]>();
  const touched = new Set<string>();
  walk?.steps.forEach((s, i) => {
    const k = lineKeys.has(s.follow) ? s.follow : reverse(s.follow);
    steps.set(k, [...(steps.get(k) ?? []), i + 1]);
    for (const id of s.follow.split("->")) touched.add(id);
  });
  // A walk that touches a nested block keeps its container lit too.
  for (const id of [...touched]) {
    const parent = blocks.get(id)?.parent;
    if (parent) touched.add(parent);
  }

  // With crossings numbered, a crossing's words live in the register, not on the arrow.
  const crossingKeys = new Set(walk ? [] : (crossings ?? []).map((c) => c.key));
  const dim = (lit: boolean) => (lit ? 1 : 0.22);
  const lineLit = (k: string) => (walk ? steps.has(k) : focusLine ? focusLine === k : true);
  const boxLit = (id: string) => (walk ? touched.has(id) : focusLine ? focusLine.split("->").includes(id) || spec.boxes.some((b) => b.id === id && b.tone === "container") : true);

  const chip = (id: string, cx: number, cy: number) => {
    const n = number.get(id);
    if (!n) return null;
    const lit = litCapability === id;
    const faded = litCapability && !lit;
    return (
      <g
        key={`${id}-${cx}-${cy}`}
        role="button"
        tabIndex={0}
        aria-label={`${n}. ${capabilityName(id)}`}
        onClick={() => onPickMitigation?.(id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onPickMitigation?.(id);
        }}
        style={{ cursor: "pointer", opacity: faded ? 0.3 : 1 }}
      >
        <title>{`${n}. ${capabilityName(id)} — open it on Enable`}</title>
        <circle cx={cx} cy={cy} r={8.5} fill={lit ? C.chip : C.chipSoft} stroke={C.chip} strokeWidth={1.2} />
        <text x={cx} y={cy + 3.4} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={lit ? "#fff" : C.chip}>
          {n}
        </text>
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${spec.width} ${spec.height}`}
      className={className}
      role="img"
      aria-label={`${archetype.title}: simplified drawing`}
      style={{ fontFamily: "var(--font-body), ui-sans-serif, system-ui, sans-serif", display: "block" }}
    >
      <defs>
        <marker id="bx-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill={C.line} />
        </marker>
        <marker id="bx-arrow-walk" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill={C.walk} />
        </marker>
      </defs>

      {/* Boundaries */}
      {spec.boundaries.map((b) => {
        const t = BOUNDARY[b.tone];
        return (
          <g key={b.zone}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={10} fill={t.fill} stroke={t.stroke} strokeWidth={1.3} strokeDasharray={t.dash || undefined} />
          </g>
        );
      })}

      {/* Boxes: containers first so what they hold draws over them. */}
      {[...spec.boxes]
        .sort((a, b) => Number(b.tone === "container") - Number(a.tone === "container"))
        .map((bx) => {
          const block = blocks.get(bx.id);
          const tone = BOX[bx.tone ?? "plain"];
          const title = bx.title ?? block?.title ?? bx.id;
          const sub = bx.sub ?? (block?.items ?? []).map((i) => i.label).join(" · ");
          const subLines = sub ? wrap(sub, bx.w - 22, 10.5, bx.tone === "container" ? 1 : Math.max(1, Math.floor((bx.h - 30) / 13))) : [];
          return (
            <g key={bx.id} style={{ opacity: dim(boxLit(bx.id)), transition: "opacity 150ms" }}>
              <title>{`${title}${block?.note ? ` — ${block.note.trim()}` : ""}`}</title>
              <rect x={bx.x} y={bx.y} width={bx.w} height={bx.h} rx={6} fill={tone.fill} stroke={tone.stroke} strokeWidth={tone.width} />
              <text x={bx.x + 11} y={bx.y + 19} fontSize={12.5} fontWeight={650} fill={C.ink}>
                {title}
              </text>
              {subLines.map((s, i) => (
                <text key={i} x={bx.x + 11} y={bx.y + 34 + i * 13} fontSize={10.5} fill={C.ink2}>
                  {s}
                </text>
              ))}
            </g>
          );
        })}

      {(spec.frames ?? []).map((f) => (
        <g key={f.label}>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={5} fill="none" stroke="#8A94A3" strokeDasharray="4 3" />
          <text x={f.x + 20} y={f.y + 15} fontSize={10} fill={C.ink2}>
            <tspan fontWeight={700} letterSpacing="0.06em">{f.label.toUpperCase()}</tspan>
            {f.sub && <tspan>{`  ${f.sub}`}</tspan>}
          </text>
        </g>
      ))}

      {/* Arrows */}
      {spec.lines.map((l) => {
        const e = edges.get(l.key);
        if (!e) return null;
        const lit = lineLit(l.key);
        const inWalk = Boolean(walk && steps.has(l.key));
        const head = inWalk ? "url(#bx-arrow-walk)" : "url(#bx-arrow)";
        const d = l.pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
        const text = (l.label?.text ?? e.label ?? "").split("\n");
        const anchor = l.label?.anchor ?? "middle";
        return (
          <g
            key={l.key}
            style={{ opacity: dim(lit), transition: "opacity 150ms" }}
            onMouseEnter={() => onFocusLine?.(l.key)}
            onMouseLeave={() => onFocusLine?.(null)}
          >
            <title>{`${e.label ?? l.key}${e.note ? ` — ${e.note.trim()}` : ""}`}</title>
            {/* A wide invisible stroke so the arrow is easy to hover. */}
            <path d={d} fill="none" stroke="transparent" strokeWidth={10} />
            <path
              d={d}
              fill="none"
              stroke={inWalk || (focusLine === l.key && !walk) ? C.walk : C.line}
              strokeWidth={inWalk || focusLine === l.key ? 2 : 1.25}
              strokeDasharray={e.path === "external" ? "5 4" : undefined}
              markerEnd={head}
              markerStart={e.bidir ? head : undefined}
            />
            {l.label &&
              !crossingKeys.has(l.key) &&
              text.map((t, i) => (
                <text
                  key={i}
                  x={l.label!.x}
                  y={l.label!.y + i * 12}
                  textAnchor={anchor}
                  fontSize={10}
                  fill={C.ink2}
                  stroke="#ffffff"
                  strokeWidth={3}
                  paintOrder="stroke"
                  strokeLinejoin="round"
                >
                  {t}
                </text>
              ))}
          </g>
        );
      })}

      {/* Boundary labels over the arrows, haloed in the boundary's fill, so no line runs through one. */}
      {spec.boundaries.map((b) => {
        const t = BOUNDARY[b.tone];
        return (
          <text key={b.zone} x={b.x + 12} y={b.y + 18} fontSize={10.5} fill={t.ink} stroke={t.fill} strokeWidth={4} paintOrder="stroke" strokeLinejoin="round">
            <tspan fontWeight={700} letterSpacing="0.08em">{b.label.toUpperCase()}</tspan>
            {b.tag && <tspan fill={C.ink3}>{`  ${b.tag}`}</tspan>}
          </text>
        );
      })}

      {/* Capability chips: along a box's top edge, or under an arrow's label. */}
      {chips && !walk && (
        <g>
          {spec.boxes.map((bx) =>
            (pinsAt.get(bx.id) ?? []).map((id, i, all) => chip(id, bx.x + bx.w - 14 - (all.length - 1 - i) * 19, bx.y)),
          )}
          {spec.lines.map((l) => {
            const ids = [...(pinsAt.get(l.key) ?? []), ...(pinsAt.get(reverse(l.key)) ?? [])];
            if (!ids.length) return null;
            const lab = l.label ?? { x: l.pts[0][0], y: l.pts[0][1], anchor: "start" as const };
            const lines = (lab.text ?? edges.get(l.key)?.label ?? "").split("\n");
            const w = Math.max(...lines.map((t) => textWidth(t, 10)));
            const x0 = lab.anchor === "end" ? lab.x - w + 8 : lab.anchor === "start" || !lab.anchor ? lab.x + 8 : lab.x - w / 2 + 8;
            const y = lab.y + (lines.length - 1) * 12 + 13;
            return <Fragment key={l.key}>{ids.map((id, i) => chip(id, x0 + i * 19, y))}</Fragment>;
          })}
        </g>
      )}

      {/* Enforcement-boundary badges */}
      {!walk &&
        (spec.badges ?? []).map((b, i) => (
          <g key={i}>
            <circle cx={b.x} cy={b.y} r={10} fill="#1F2937" stroke="#fff" strokeWidth={1.5} />
            <text x={b.x} y={b.y + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">
              {b.n}
            </text>
          </g>
        ))}

      {/* Boundary crossings */}
      {!walk &&
        crossings?.map((c) => {
          const color = CROSSING_COLOR[crossingKind?.(c.key) ?? "brokered"];
          const lit = !focusLine || focusLine === c.key;
          return (
            <g key={c.key} style={{ opacity: lit ? 1 : 0.3, cursor: "default" }} onMouseEnter={() => onFocusLine?.(c.key)} onMouseLeave={() => onFocusLine?.(null)}>
              <rect x={c.at[0] - 10} y={c.at[1] - 10} width={20} height={20} rx={4} fill="#fff" stroke={color} strokeWidth={1.8} />
              <text x={c.at[0]} y={c.at[1] + 4} textAnchor="middle" fontSize={10.5} fontWeight={700} fill={color}>
                {c.n}
              </text>
            </g>
          );
        })}

      {/* Walk step numbers, above each arrow's label */}
      {walk &&
        spec.lines.map((l) => {
          const ns = steps.get(l.key);
          if (!ns) return null;
          const lab = l.label ?? { x: l.pts[0][0], y: l.pts[0][1], anchor: "middle" as const };
          const total = ns.length * 19;
          const x0 = lab.anchor === "end" ? lab.x - total + 9 : lab.anchor === "start" ? lab.x + 9 : lab.x - total / 2 + 9;
          return ns.map((n, i) => (
            <g key={`${l.key}-${n}`}>
              <circle cx={x0 + i * 19} cy={lab.y - 17} r={8.5} fill={C.walk} />
              <text x={x0 + i * 19} y={lab.y - 13.6} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#fff">
                {n}
              </text>
            </g>
          ));
        })}
    </svg>
  );
}
