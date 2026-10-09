"use client";

/**
 * The simple component set for the flow canvas (`simple` on FlowDiagram): the same geometry,
 * drawn plainly — white text cards with a title and one line of contents instead of icon grids,
 * C# control badges on a card's corner, tinted bands with a one-line label. Everything else
 * (zoom, pan, hover cards, walks, expand) is the canvas's own.
 */
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import type { ArchBlock, DisplayStatus } from "@/lib/types";
import type { ChipPaint } from "./flow-style";
import { FlowIcon } from "./FlowIcons";

export const SIMPLE = {
  ink: "#15181E",
  muted: "#555B66",
  cardBorder: "#D3D6DC",
  line: "#3B4250",
  lineExternal: "#8A919C",
  badge: "#B4410E",
};

/** Saturated status fills, so a control's status reads at canvas zoom. */
export const STATUS_FILL: Record<DisplayStatus, { bg: string; border: string; text: string; dashed?: boolean }> = {
  enabled: { bg: "#06845a", border: "#06845a", text: "#ffffff" },
  inProgress: { bg: "#d4a106", border: "#b88a00", text: "#ffffff" },
  gap: { bg: "#d92d20", border: "#d92d20", text: "#ffffff" },
  notAssessed: { bg: "#ffffff", border: "#98a2b3", text: "#667085", dashed: true },
  unmapped: { bg: "#ffffff", border: "#d0d5dd", text: "#98a2b3", dashed: true },
};

export function badgeColors(status?: DisplayStatus, paint?: ChipPaint) {
  const f = paint ?? (status ? STATUS_FILL[status] : { bg: SIMPLE.badge, border: SIMPLE.badge, text: "#ffffff" });
  return { background: f.bg, border: `1.5px ${f.dashed ? "dashed" : "solid"} ${f.border}`, color: f.text } as const;
}

const BAND: Record<string, { fill: string; border: string; ink: string; dashed?: boolean; tag: string }> = {
  user: { fill: "#F2F3F5", border: "#C9CDD4", ink: "#4A505B", tag: "people" },
  endpoint: { fill: "#ECF6F5", border: "#8CC5C0", ink: "#1F6F69", tag: "ours" },
  cloud: { fill: "#EDF3FB", border: "#8DAED8", ink: "#2F5D95", tag: "ours" },
  vendor: { fill: "#F4F1FA", border: "#A99FD3", ink: "#5B4B9A", tag: "vendor-run" },
  external: { fill: "#FAFAF9", border: "#A1A1AA", ink: "#555B66", dashed: true, tag: "untrusted" },
  governance: { fill: "#EEF5F0", border: "#94BFA0", ink: "#2E6B42", tag: "ours · applies to every band" },
};

export function SimpleZoneNode({ data }: NodeProps<Node<{ title: string; owner: string; w: number; h: number }>>) {
  const t = BAND[data.owner] ?? BAND.cloud;
  return (
    <div style={{ width: data.w, height: data.h, background: t.fill, border: `1px ${t.dashed ? "dashed" : "solid"} ${t.border}`, borderRadius: 12, position: "relative", pointerEvents: "none" }}>
      {/* One line: a second would meet the badges of a first-row card in a narrow band. */}
      <div style={{ position: "absolute", left: 12, top: 9, color: t.ink, fontSize: 10.5, lineHeight: "13px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap" }}>
        {data.title}
        <span style={{ letterSpacing: 0, fontWeight: 400, textTransform: "none" }}> · {t.tag}</span>
      </div>
    </div>
  );
}

export interface SimpleBadge {
  id: string;
  n: number;
  title: string;
  body?: string;
  status?: DisplayStatus;
  paint?: ChipPaint;
}

export type SimpleBlockData = {
  block: ArchBlock;
  w: number;
  h: number;
  dim: boolean;
  owner: string;
  /** Top of the first contained card, relative to this one, so a container's text stops above it. */
  kidTop?: number;
  badges: SimpleBadge[];
  highlight?: { kind: string; id: string } | null;
  onItemEnter: (event: React.MouseEvent, title: string, body?: string) => void;
  onPick?: (id: string) => void;
};

const SIDES = (["t", "b", "l", "r"] as const).map((side) => {
  const pos = { t: Position.Top, b: Position.Bottom, l: Position.Left, r: Position.Right }[side];
  return (
    <span key={side}>
      <Handle type="source" id={side} position={pos} style={{ opacity: 0 }} />
      <Handle type="target" id={`${side}-in`} position={pos} style={{ opacity: 0 }} />
    </span>
  );
});

export function Badge({
  label,
  status,
  paint,
  faded,
  onEnter,
  onLeave,
  onClick,
}: {
  label: string;
  status?: DisplayStatus;
  paint?: ChipPaint;
  faded?: boolean;
  onEnter?: (e: React.MouseEvent) => void;
  onLeave?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}) {
  return (
    <span
      role={onClick ? "button" : undefined}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{
        display: "inline-block",
        height: 19,
        minWidth: 26,
        padding: "0 5px",
        borderRadius: 4,
        ...badgeColors(status, paint),
        font: "600 10.5px/16px var(--font-mono, monospace)",
        textAlign: "center",
        cursor: onClick ? "pointer" : "default",
        opacity: faded ? 0.25 : 1,
        whiteSpace: "nowrap",
        boxSizing: "border-box",
        // React Flow turns pointer events off on nodes that are neither draggable nor selectable.
        pointerEvents: "all",
      }}
    >
      {label}
    </span>
  );
}

export function SimpleBlockNode({ data }: NodeProps<Node<SimpleBlockData>>) {
  const { block, w, h, dim, owner, kidTop, badges, highlight, onItemEnter, onPick } = data;
  const base = { width: w, height: h, position: "relative" as const, opacity: dim ? 0.3 : 1, transition: "opacity 150ms" };
  const leave = (e: React.MouseEvent) => onItemEnter(e, block.title, block.note);
  const row = badges.length > 0 && (
    <div style={{ position: "absolute", right: 6, bottom: "calc(100% - 9px)", display: "flex", flexWrap: "wrap-reverse", justifyContent: "flex-end", gap: 3, maxWidth: w - 12, zIndex: 4 }}>
      {badges.map((b) => (
        <Badge
          key={b.id}
          label={`C${b.n}`}
          status={b.status}
          paint={b.paint}
          faded={!!highlight && !(highlight.kind === "mitigation" && highlight.id === b.id)}
          onEnter={(e) => onItemEnter(e, b.title, b.body)}
          onLeave={leave}
          onClick={onPick ? () => onPick(b.id) : undefined}
        />
      ))}
    </div>
  );

  if (block.kind === "actor") {
    return (
      <div style={{ ...base, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
        {SIDES}
        <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
          <FlowIcon name={block.icon ?? "person"} x={13} y={13} size={22} />
        </svg>
        <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", color: SIMPLE.ink }}>{block.title}</span>
        {row}
      </div>
    );
  }
  if (block.kind === "boundary") {
    return (
      <div style={{ ...base, border: "1.5px dashed #9AA1AC", borderRadius: 10 }}>
        {SIDES}
        <span style={{ position: "absolute", left: 10, top: 6, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: SIMPLE.muted }}>{block.title}</span>
        {row}
      </div>
    );
  }

  const external = block.kind === "external" || owner === "external";
  const container = kidTop !== undefined;
  const room = container ? kidTop - 12 : h;
  const subtitle = (block.items ?? []).map((i) => i.label).join(" · ");
  const subLines = Math.max(0, Math.floor((room - 20 - 30) / 17));
  return (
    <div
      style={{
        ...base,
        boxSizing: "border-box",
        padding: "10px 12px",
        display: "flex",
        alignItems: container ? "flex-start" : "center",
        background: container ? "#FBFBFC" : "#FFFFFF",
        border: `${external ? 1.5 : 1}px ${external ? "dashed" : "solid"} ${external ? "#A1A1AA" : SIMPLE.cardBorder}`,
        borderRadius: 8,
        boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
      }}
    >
      {SIDES}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, lineHeight: "19px", fontWeight: 600, color: SIMPLE.ink }}>{block.title}</div>
        {subtitle && subLines > 0 && (
          <div style={{ marginTop: 2, fontSize: 12, lineHeight: "17px", color: SIMPLE.muted, display: "-webkit-box", WebkitLineClamp: subLines, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {subtitle}
          </div>
        )}
      </div>
      {row}
    </div>
  );
}

/** A routed arrow as a measurable polyline: its length, and the point a given distance along it. */
export function polyline(d: string) {
  const nums = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) pts.push({ x: nums[i], y: nums[i + 1] });
  const segs = pts.slice(1).map((p, i) => ({ a: pts[i], b: p, len: Math.hypot(p.x - pts[i].x, p.y - pts[i].y) }));
  const length = segs.reduce((n, sg) => n + sg.len, 0);
  const at = (dist: number) => {
    let left = Math.max(0, Math.min(length, dist));
    for (const sg of segs) {
      if (left <= sg.len || sg === segs[segs.length - 1]) {
        const t = sg.len ? left / sg.len : 0;
        return { x: sg.a.x + (sg.b.x - sg.a.x) * t, y: sg.a.y + (sg.b.y - sg.a.y) * t, horizontal: Math.abs(sg.b.x - sg.a.x) >= Math.abs(sg.b.y - sg.a.y) };
      }
      left -= sg.len;
    }
    return { x: 0, y: 0, horizontal: true };
  };
  return { length, at };
}
