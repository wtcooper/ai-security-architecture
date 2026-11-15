"use client";

/**
 * The boundary drawing itself: a pattern as plain boxes inside labelled trust boundaries, drawn
 * in SVG from a computed ViewSpec (layout.ts). Every word on it comes from the pattern's data:
 * a box is the block's title and its one-liner, a boundary is the zone's canonical title, an
 * arrow carries the edge's label. Numbered chips are the pattern's controls; in risk mode they
 * give way to the coded risk tags; a walk numbers its steps onto the arrows.
 */
import { Fragment, type MouseEvent, type FocusEvent, type ReactNode } from "react";

import { isLit, type Highlight } from "@/components/reference/FlowDiagram";
import type { BlockService } from "@/components/reference/FlowDiagramRF";
import { blockTab, chipColors } from "@/components/reference/flow-style";
import { capabilityName, riskById, riskCode, statusFor } from "@/lib/data";
import type { Archetype, Scenario } from "@/lib/types";
import { GOV_SUB, ownedControls, summaryOf, wrap, type BoundaryTone, type ViewBox, type ViewLine, type ViewSpec } from "./layout";

export type DrawingPins = "risks" | "capabilities" | "all";

/** What the hover card shows, and where the pointer was (client coordinates). */
export interface HoverCard {
  title: string;
  body?: string;
  x: number;
  y: number;
}

/** Boundary outlines. No token exists for these, so they are the drawing's own four tones. */
export const BOUNDARY_TONE: Record<BoundaryTone, { stroke: string; fill: string; ink: string; dash?: string }> = {
  ours: { stroke: "#8A94A3", fill: "var(--mist)", ink: "var(--ink-2)", dash: "6 4" },
  vendor: { stroke: "#9B91C7", fill: "#FBFAFE", ink: "#4E427F", dash: "6 4" },
  outside: { stroke: "#C2877F", fill: "#FFFCFB", ink: "#8A3B2E", dash: "3 3" },
  control: { stroke: "#9AA8A0", fill: "#F7FAF8", ink: "#36573F" },
};

const reverse = (k: string) => k.split("->").reverse().join("->");
const STEP = "var(--ink)";

export function BoxDiagram({
  archetype,
  spec,
  walk = null,
  highlight = null,
  pins = "capabilities",
  services = null,
  onPickMitigation,
  onPickRisk,
  onHover,
  transform,
  svgRef,
  className,
  style,
}: {
  archetype: Archetype;
  spec: ViewSpec;
  walk?: Scenario | null;
  highlight?: Highlight | null;
  /** Which pins show: the numbered controls, the coded risk tags, or both. */
  pins?: DrawingPins;
  /** Block id -> the cloud service that plays it; null draws the generic components. */
  services?: Map<string, BlockService> | null;
  onPickMitigation?: (id: string) => void;
  onPickRisk?: (id: string) => void;
  onHover?: (card: HoverCard | null) => void;
  /** Pan and zoom, applied to everything drawn. */
  transform?: string;
  svgRef?: React.Ref<SVGSVGElement>;
  className?: string;
  style?: React.CSSProperties;
}) {
  const number = new Map(archetype.mitigations.map((id, i) => [id, i + 1]));
  const blocks = new Map(archetype.blocks.map((b) => [b.id, b]));
  const edges = new Map(archetype.edges.map((e) => [`${e.from}->${e.to}`, e]));
  const showControls = pins !== "risks" && !walk;
  const showRisks = pins !== "capabilities";

  // Controls and risks per place: a block id or an edge key.
  const controlsAt = new Map<string, string[]>();
  for (const p of archetype.pins.mitigations) {
    const key = edges.has(p.at) || blocks.has(p.at) ? p.at : reverse(p.at);
    if (!controlsAt.get(key)?.includes(p.mitigation)) controlsAt.set(key, [...(controlsAt.get(key) ?? []), p.mitigation]);
  }
  for (const b of archetype.blocks) {
    const owned = ownedControls(archetype, b);
    if (owned.length) controlsAt.set(b.id, owned);
  }
  for (const list of controlsAt.values()) list.sort((x, y) => (number.get(x) ?? 0) - (number.get(y) ?? 0));
  const risksAt = new Map<string, string[]>();
  for (const p of archetype.pins.risks) {
    const key = edges.has(p.at) || blocks.has(p.at) ? p.at : reverse(p.at);
    if (!risksAt.get(key)?.includes(p.risk)) risksAt.set(key, [...(risksAt.get(key) ?? []), p.risk]);
  }
  const noteOf = (kind: "mitigations" | "risks", id: string, at: string) =>
    (archetype.pins[kind] as { at: string; note?: string; mitigation?: string; risk?: string }[]).find(
      (p) => (p.at === at || p.at === reverse(at)) && (p.mitigation ?? p.risk) === id,
    )?.note;

  // A walk: step numbers per drawn arrow, and the boxes it touches.
  const lineKeys = new Set(spec.lines.map((l) => l.key));
  const steps = new Map<string, number[]>();
  const touched = new Set<string>();
  walk?.steps.forEach((s, i) => {
    const k = lineKeys.has(s.follow) ? s.follow : reverse(s.follow);
    steps.set(k, [...(steps.get(k) ?? []), i + 1]);
    for (const id of s.follow.split("->")) touched.add(id);
  });
  for (const id of [...touched]) for (let p = blocks.get(id)?.parent; p; p = blocks.get(p)?.parent) touched.add(p);
  const boxLit = (id: string) => !walk || touched.has(id);
  const lineLit = (k: string) => !walk || steps.has(k);
  const dim = (lit: boolean) => (lit ? 1 : 0.22);

  const hover = (title: string, body?: string) => ({
    onMouseEnter: (e: MouseEvent) => onHover?.({ title, body, x: e.clientX, y: e.clientY }),
    onMouseMove: (e: MouseEvent) => onHover?.({ title, body, x: e.clientX, y: e.clientY }),
    onMouseLeave: () => onHover?.(null),
    onFocus: (e: FocusEvent) => {
      const r = (e.target as Element).getBoundingClientRect();
      onHover?.({ title, body, x: r.left + r.width / 2, y: r.bottom });
    },
    onBlur: () => onHover?.(null),
  });

  const chip = (id: string, at: string, cx: number, cy: number, faded = false) => {
    const n = number.get(id);
    if (!n) return null;
    const lit = highlight ? isLit(highlight, "mitigation", id) : false;
    const off = (highlight?.kind === "mitigation" && !lit) || faded;
    const tint = chipColors(statusFor(id));
    const name = capabilityName(id);
    return (
      <g
        key={`c-${id}-${at}`}
        role="button"
        tabIndex={0}
        aria-label={`Control ${n}: ${name}`}
        data-control={id}
        data-lit={lit || undefined}
        onClick={() => onPickMitigation?.(id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPickMitigation?.(id);
          }
        }}
        style={{ cursor: "pointer", opacity: off ? 0.28 : 1, outlineOffset: 2 }}
        {...hover(`${n} · ${name}`, noteOf("mitigations", id, at) ?? "Select to open this control on Enable.")}
      >
        <circle cx={cx} cy={cy} r={8.5} fill={lit ? "var(--chip)" : tint.background} stroke={lit ? "var(--chip)" : tint.borderColor} strokeWidth={1.2} />
        <text x={cx} y={cy + 3.4} textAnchor="middle" fontSize={9.5} fontWeight={700} fill={lit ? "#fff" : tint.color}>
          {n}
        </text>
      </g>
    );
  };

  const TAG_W = 28;
  const tag = (id: string, at: string, cx: number, cy: number, faded = false) => {
    const risk = riskById.get(id);
    const code = riskCode(id);
    const lit = highlight ? isLit(highlight, "risk", id) : false;
    const off = (highlight?.kind === "risk" && !lit) || faded;
    return (
      <g
        key={`r-${id}-${at}`}
        role="button"
        tabIndex={0}
        aria-label={`Risk ${code}: ${risk?.title ?? id}`}
        data-risk={id}
        data-lit={lit || undefined}
        onClick={() => onPickRisk?.(id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPickRisk?.(id);
          }
        }}
        style={{ cursor: "pointer", opacity: off ? 0.28 : 1 }}
        {...hover(`${code} · ${risk?.title ?? id}`, noteOf("risks", id, at))}
      >
        <rect x={cx - TAG_W / 2 + 1} y={cy - 7.5} width={TAG_W - 2} height={15} rx={3} fill={lit ? "var(--exposed)" : "var(--exposed-soft)"} stroke="var(--exposed)" strokeWidth={1} />
        <text x={cx} y={cy + 3.3} textAnchor="middle" fontSize={9} fontWeight={700} fill={lit ? "#fff" : "var(--exposed)"} style={{ fontFamily: "var(--font-mono-id), ui-monospace, monospace" }}>
          {code}
        </text>
      </g>
    );
  };

  const stepDisc = (n: number, key: string, cx: number, cy: number) => (
    <g key={`s-${key}-${n}`} aria-label={`Step ${n}`}>
      <rect x={cx - 8.5} y={cy - 8.5} width={17} height={17} rx={4} fill={STEP} />
      <text x={cx} y={cy + 3.4} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#fff">
        {n}
      </text>
    </g>
  );

  /** A run of markers centred on a point, along the way the arrow runs there; more than the run holds wrap into rows. */
  const run = (items: { w: number; draw: (cx: number, cy: number) => ReactNode }[], pin: ViewLine["pin"]) => {
    if (pin.horizontal) {
      const rows: (typeof items)[] = [[]];
      let used = 0;
      for (const it of items) {
        if (used + it.w > Math.max(60, pin.room - 14) && used) {
          rows.push([]);
          used = 0;
        }
        rows[rows.length - 1].push(it);
        used += it.w;
      }
      return rows.flatMap((row, r) => {
        let x = pin.x - row.reduce((s, it) => s + it.w, 0) / 2;
        return row.map((it) => {
          const node = it.draw(x + it.w / 2, pin.y + r * 19);
          x += it.w;
          return node;
        });
      });
    }
    const perColumn = Math.max(2, Math.floor((pin.room - 14) / 19));
    const columns = Math.ceil(items.length / perColumn);
    return items.map((it, n) => {
      const col = Math.floor(n / perColumn);
      const inCol = Math.min(perColumn, items.length - col * perColumn);
      return it.draw(pin.x + (col - (columns - 1) / 2) * 30, pin.y - ((inCol - 1) * 19) / 2 + (n % perColumn) * 19);
    });
  };

  /** Markers along a box's top edge, right-aligned; or in rows inside a control-plane box. */
  const onBox = (bx: ViewBox, items: { w: number; draw: (cx: number, cy: number) => ReactNode }[]) => {
    if (bx.tone === "governance") {
      const perRow = Math.max(1, Math.floor((bx.w - 22) / 19));
      let x = bx.x + 12;
      let row = 0;
      let used = 0;
      return items.map((it) => {
        if (used + it.w > perRow * 19 && used) {
          row += 1;
          x = bx.x + 12;
          used = 0;
        }
        const node = it.draw(x + it.w / 2, bx.y + 52 + GOV_SUB + row * 21);
        x += it.w;
        used += it.w;
        return node;
      });
    }
    const total = items.reduce((s, it) => s + it.w, 0);
    let x = bx.x + bx.w - 8 - total;
    return items.map((it) => {
      const node = it.draw(x + it.w / 2, bx.y);
      x += it.w;
      return node;
    });
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${spec.width} ${spec.height}`}
      className={className}
      role="img"
      aria-label={`${archetype.title}: trust-boundary drawing`}
      style={{ fontFamily: "var(--font-body), ui-sans-serif, system-ui, sans-serif", display: "block", ...style }}
    >
      <defs>
        <marker id="pd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--ink-2)" />
        </marker>
        <marker id="pd-arrow-walk" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--ink)" />
        </marker>
      </defs>
      <g transform={transform}>
        {/* Boundaries */}
        {spec.boundaries.map((b) => {
          const t = BOUNDARY_TONE[b.tone];
          const zone = archetype.zones?.find((z) => z.id === b.zone);
          return (
            <rect
              key={b.zone}
              data-zone={b.zone}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx={10}
              fill={t.fill}
              stroke={t.stroke}
              strokeWidth={b.primary ? 1.8 : 1.3}
              strokeDasharray={t.dash}
              {...hover(`${b.title}${b.gloss ? ` · ${b.gloss}` : ""}`, zone?.note?.trim())}
            />
          );
        })}

        {/* Boxes: containers first, outermost first, so what they hold draws over them. */}
        {[...spec.boxes]
          .sort((p, q) => Number(q.tone === "container") - Number(p.tone === "container") || q.w * q.h - p.w * p.h)
          .map((bx) => {
            const block = blocks.get(bx.id);
            if (!block) return null;
            const service = services?.get(bx.id);
            const sub = service ? service.service : summaryOf(block);
            // A long title takes a second line and the one-liner gives one up.
            const titleLines = wrap(block.title, bx.w - 22, 13.2, 2);
            const room = Math.max(1, bx.lines - (titleLines.length - 1) - (service?.build ? 1 : 0));
            const subLines = sub ? wrap(sub, bx.w - 24, 10.5, bx.tone === "container" ? bx.lines : bx.tone === "governance" ? 2 : room) : [];
            const subY = bx.y + 35 + (titleLines.length - 1) * 14;
            const accent = bx.tone === "actor" || bx.tone === "governance" ? null : blockTab(block);
            const fill = bx.tone === "actor" ? "var(--mist)" : "var(--paper)";
            const stroke = bx.tone === "container" ? "var(--ink-3)" : bx.tone === "governance" ? "#B9C7BE" : "var(--line-strong)";
            return (
              <g
                key={bx.id}
                data-block={bx.id}
                style={{ opacity: dim(boxLit(bx.id)), transition: "opacity 150ms" }}
                {...hover(block.title, (service?.note ?? block.note)?.trim())}
              >
                <rect x={bx.x} y={bx.y} width={bx.w} height={bx.h} rx={6} fill={fill} stroke={stroke} strokeWidth={bx.tone === "container" ? 1.3 : 1} />
                {accent && <rect x={bx.x + 1} y={bx.y + 7} width={3} height={Math.min(bx.h - 14, 54)} rx={1.5} fill={accent} />}
                {titleLines.map((t, i) => (
                  <text key={i} x={bx.x + 12} y={bx.y + 20 + i * 14} fontSize={12.5} fontWeight={650} fill="var(--ink)">
                    {t}
                  </text>
                ))}
                {subLines.map((s, i) => (
                  <text key={i} x={bx.x + 12} y={subY + i * 12.5} fontSize={10.5} fill={service ? "var(--ink)" : "var(--ink-2)"} fontWeight={service ? 600 : 400}>
                    {s}
                  </text>
                ))}
                {service?.build && (
                  <text x={bx.x + 12} y={subY + subLines.length * 12.5} fontSize={8.5} fontWeight={700} letterSpacing="0.06em" fill="var(--ink-3)">
                    YOU BUILD THIS
                  </text>
                )}
              </g>
            );
          })}

        {/* Arrows */}
        {spec.lines.map((l) => {
          const e = edges.get(l.key);
          if (!e) return null;
          const inWalk = Boolean(walk && steps.has(l.key));
          const head = inWalk ? "url(#pd-arrow-walk)" : "url(#pd-arrow)";
          const d = l.pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
          return (
            <g key={l.key} data-edge={l.key} style={{ opacity: dim(lineLit(l.key)), transition: "opacity 150ms" }} {...hover(e.label ?? l.key.replace("->", " → "), e.note?.trim())}>
              {/* A wide invisible stroke so the arrow is easy to hover. */}
              <path d={d} fill="none" stroke="transparent" strokeWidth={10} />
              <path
                d={d}
                fill="none"
                stroke={inWalk ? "var(--ink)" : "var(--ink-2)"}
                strokeWidth={inWalk ? 2 : 1.25}
                strokeDasharray={e.path === "external" ? "5 4" : undefined}
                strokeLinejoin="round"
                markerEnd={head}
                markerStart={e.bidir ? head : undefined}
              />
              {l.label?.lines.map((t, i) => (
                <text
                  key={i}
                  x={l.label!.x}
                  y={l.label!.y + i * 12}
                  textAnchor={l.label!.anchor}
                  fontSize={10}
                  fill="var(--ink-2)"
                  stroke="var(--paper)"
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

        {/* Boundary labels over the arrows, haloed in the boundary's fill. */}
        {spec.boundaries.map((b) => {
          const t = BOUNDARY_TONE[b.tone];
          return (
            <text key={b.zone} x={b.x + 12} y={b.y + 18} fontSize={10.5} fill={t.ink} stroke={t.fill} strokeWidth={4} paintOrder="stroke" strokeLinejoin="round" pointerEvents="none">
              <tspan fontWeight={700} letterSpacing="0.08em">{b.title.toUpperCase()}</tspan>
              {b.gloss && <tspan fill="var(--ink-3)">{`  ${b.gloss}`}</tspan>}
            </text>
          );
        })}

        {/* Pins on boxes */}
        {spec.boxes.map((bx) => {
          const items = [
            ...(showControls ? (controlsAt.get(bx.id) ?? []).map((id) => ({ w: 19, draw: (cx: number, cy: number) => chip(id, bx.id, cx, cy) })) : []),
            ...(showRisks ? (risksAt.get(bx.id) ?? []).map((id) => ({ w: TAG_W, draw: (cx: number, cy: number) => tag(id, bx.id, cx, cy, !boxLit(bx.id)) })) : []),
          ];
          return items.length ? <Fragment key={bx.id}>{onBox(bx, items)}</Fragment> : null;
        })}

        {/* Pins and step numbers on arrows */}
        {spec.lines.map((l) => {
          const items = [
            ...(steps.get(l.key) ?? []).map((n) => ({ w: 19, draw: (cx: number, cy: number) => stepDisc(n, l.key, cx, cy) })),
            ...(showControls ? (controlsAt.get(l.key) ?? []).map((id) => ({ w: 19, draw: (cx: number, cy: number) => chip(id, l.key, cx, cy) })) : []),
            ...(showRisks ? (risksAt.get(l.key) ?? []).map((id) => ({ w: TAG_W, draw: (cx: number, cy: number) => tag(id, l.key, cx, cy, !lineLit(l.key)) })) : []),
          ];
          return items.length ? <Fragment key={l.key}>{run(items, l.pin)}</Fragment> : null;
        })}
      </g>
    </svg>
  );
}
