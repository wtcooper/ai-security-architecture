"use client";

/**
 * Option 6 — Simplified boxes. A drop-in for the current drawing: the same build-computed
 * geometry (block rects, routed arrows, bands), drawn the way the "logical data flow" reference
 * mockup draws it — plain white cards with a title and one line of contents instead of icon
 * grids, orange C# control badges on each card's corner, black numbered circles for flow steps
 * (so a control number and a step number never look alike), and a key beneath listing the
 * steps of the selected flow and every core control. Risks sit behind a switch.
 *
 * Rendered as plain DOM at the drawing's natural size, scaled to the page width, so the page
 * scrolls past it and nothing is squeezed into a fixed-height canvas.
 */
import { useEffect, useMemo, useRef, useState } from "react";

import { STATUS_META } from "@/components/StatusPill";
import { FlowIcon } from "@/components/reference/FlowIcons";
import { tagWidth } from "@/components/reference/flow-style";
import { useOrgOverlay } from "@/components/tooling/overlay";
import { flowBadgeSpots, placeTags, TAG_H, ZONE_PAD } from "@/lib/flow-layout";
import { mitigationById, orgSurfaceStatusFor, riskById, riskCode } from "@/lib/data";
import type { ArchBlock, Archetype, DisplayStatus, Scenario } from "@/lib/types";
import { fullName, shortName, STATUS_FILL } from "./model";
import { countBy, DrawingBar, StatusLegend } from "./parts";

const INK = "#15181E";
const MUTED = "#555B66";
const CARD_BORDER = "#D3D6DC";
const LINE = "#3B4250";
const LINE_EXTERNAL = "#8A919C";
const BADGE = "#B4410E";

const BAND: Record<string, { fill: string; border: string; ink: string; dashed?: boolean; sub: string }> = {
  user: { fill: "#F2F3F5", border: "#C9CDD4", ink: "#4A505B", sub: "people" },
  endpoint: { fill: "#ECF6F5", border: "#8CC5C0", ink: "#1F6F69", sub: "ours" },
  cloud: { fill: "#EDF3FB", border: "#8DAED8", ink: "#2F5D95", sub: "ours" },
  vendor: { fill: "#F4F1FA", border: "#A99FD3", ink: "#5B4B9A", sub: "vendor-run" },
  external: { fill: "#FAFAF9", border: "#A1A1AA", ink: "#555B66", dashed: true, sub: "untrusted" },
  governance: { fill: "#EEF5F0", border: "#94BFA0", ink: "#2E6B42", sub: "ours · applies to every band" },
};

export interface BoxesProps {
  archetype: Archetype;
  walk: Scenario | null;
  walks: Scenario[];
  walkIndex: number | null;
  onWalk: (i: number | null) => void;
}

export function BoxesDrawing({ archetype, walk, walks, walkIndex, onWalk }: BoxesProps) {
  const overlay = useOrgOverlay();
  const [showRisks, setShowRisks] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [lastArch, setLastArch] = useState(archetype.id);
  if (lastArch !== archetype.id) {
    setLastArch(archetype.id);
    setSelected(null);
  }
  const status = useMemo(
    () => (overlay ? new Map(archetype.mitigations.map((c) => [c, orgSurfaceStatusFor(c, archetype.surface)])) : null),
    [overlay, archetype],
  );
  const pick = (id: string) => setSelected((cur) => (cur === id ? null : id));

  return (
    <>
      <DrawingBar
        legend={
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11.5px] text-ink-2">
            <LineKey color={LINE} label="Data flow" />
            <LineKey color={LINE_EXTERNAL} dashed label="External content & actions" />
            <span className="inline-flex items-center gap-1.5">
              <StepDot n={1} /> Flow step
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Badge label="C#" /> Control {overlay ? "· colour = our status" : "enforcement point"}
            </span>
            {overlay && <StatusLegend counts={status ? countBy([...status.values()]) : undefined} />}
          </div>
        }
      >
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-[12px] text-ink-2">
          <input type="checkbox" checked={showRisks} onChange={(e) => setShowRisks(e.target.checked)} />
          Show risks
        </label>
        {walk && (
          <span className="text-[12px] text-ink-2">
            Numbered: <span className="font-semibold text-ink">{walk.title}</span>{" "}
            <button type="button" onClick={() => onWalk(null)} className="ml-1 font-semibold text-introduced hover:underline">
              clear
            </button>
          </span>
        )}
      </DrawingBar>

      <ScaledCanvas width={archetype.layout.width} height={archetype.layout.height}>
        <Drawing archetype={archetype} walk={walk} status={status} showRisks={showRisks} selected={selected} onPick={pick} />
      </ScaledCanvas>

      <Key archetype={archetype} walk={walk} walks={walks} walkIndex={walkIndex} onWalk={onWalk} status={status} selected={selected} onPick={pick} />
    </>
  );
}

/** Natural size, scaled to the column; a phone keeps a readable minimum and scrolls sideways. */
function ScaledCanvas({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAvail(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const pad = 24;
  const s = avail ? Math.max(0.55, Math.min(1.1, (avail - pad * 2) / width)) : 1;
  return (
    <div ref={ref} className="-mx-6 overflow-x-auto border-y border-line bg-[#FBFBFA] lg:mx-0 lg:rounded-xl lg:border">
      <div style={{ width: width * s + pad * 2, height: height * s + pad * 2, position: "relative", margin: "0 auto" }}>
        <div style={{ position: "absolute", left: pad, top: pad, width, height, transform: `scale(${s})`, transformOrigin: "0 0" }}>{children}</div>
      </div>
    </div>
  );
}

function Drawing({
  archetype,
  walk,
  status,
  showRisks,
  selected,
  onPick,
}: {
  archetype: Archetype;
  walk: Scenario | null;
  status: Map<string, DisplayStatus> | null;
  showRisks: boolean;
  selected: string | null;
  onPick: (id: string) => void;
}) {
  const L = archetype.layout;
  const rects = L.blocks;
  const blocks = new Map(archetype.blocks.map((b) => [b.id, b]));
  const owner = new Map((archetype.zones ?? []).map((z) => [z.id, z.owner]));
  const number = (id: string) => archetype.mitigations.indexOf(id) + 1;
  const kids = new Map<string, string[]>();
  for (const b of archetype.blocks) if (b.parent) kids.set(b.parent, [...(kids.get(b.parent) ?? []), b.id]);

  // Bands: the same arithmetic as the main drawing, so cards sit where they always have.
  const govZones = new Set((archetype.zones ?? []).filter((z) => z.owner === "governance").map((z) => z.id));
  const colRects = archetype.blocks.filter((b) => !govZones.has(b.zone ?? "")).map((b) => rects[b.id]).filter(Boolean);
  const bandBottom = colRects.length ? Math.max(...colRects.map((r) => r.y + r.h)) + ZONE_PAD : 0;
  const cols = L.columns ?? [];
  const bands = (archetype.zones ?? []).flatMap((zone) => {
    const members = archetype.blocks.filter((b) => b.zone === zone.id);
    if (!members.length) return [];
    if (zone.owner === "governance" && L.govBand) return [{ zone, x: L.govBand.x, y: L.govBand.y, w: L.govBand.w, h: L.govBand.h }];
    const cs = members.filter((b) => !b.parent).map((b) => b.col);
    const lo = cols[Math.min(...cs)];
    const hi = cols[Math.max(...cs)];
    const rs = members.map((b) => rects[b.id]).filter(Boolean);
    const x0 = lo ? lo.x - ZONE_PAD : Math.min(...rs.map((r) => r.x)) - ZONE_PAD;
    const x1 = hi ? hi.x + hi.w + ZONE_PAD : Math.max(...rs.map((r) => r.x + r.w)) + ZONE_PAD;
    return [{ zone, x: x0, y: L.bandTop, w: x1 - x0, h: bandBottom - L.bandTop }];
  });

  // Walk: the arrows it rides, the cards it touches, and its step numbers.
  const geoByKey = new Map(L.edges.map((g) => [`${g.from}->${g.to}`, g]));
  const walkEdges = new Set<string>();
  const walkCards = new Set<string>();
  const steps = new Map<string, number[]>();
  (walk?.steps ?? []).forEach((st, i) => {
    const geo = geoByKey.get(st.follow) ?? geoByKey.get(st.follow.split("->").reverse().join("->"));
    if (!geo) return;
    const key = `${geo.from}->${geo.to}`;
    walkEdges.add(key);
    walkCards.add(geo.from);
    walkCards.add(geo.to);
    steps.set(key, [...(steps.get(key) ?? []), i + 1]);
  });
  const lit = (id: string) => !walk || walkCards.has(id) || (kids.get(id) ?? []).some((k) => walkCards.has(k)) || (blocks.get(id)?.parent ? walkCards.has(blocks.get(id)!.parent!) : false);

  // Controls per card: pinned on the block, listed by a governance call-out, or listed on an item.
  const cardCaps = new Map<string, string[]>();
  const addCap = (at: string, id: string) => {
    const list = cardCaps.get(at) ?? [];
    if (!list.includes(id)) list.push(id);
    cardCaps.set(at, list);
  };
  for (const p of archetype.pins.mitigations) if (!p.at.includes("->")) addCap(p.at, p.mitigation);
  for (const b of archetype.blocks) {
    for (const id of b.mitigations ?? []) addCap(b.id, id);
    for (const it of b.items ?? []) for (const id of it.mitigations ?? []) addCap(b.id, id);
  }
  const edgeCaps = new Map<string, string[]>();
  for (const p of archetype.pins.mitigations) if (p.at.includes("->")) edgeCaps.set(p.at, [...(edgeCaps.get(p.at) ?? []), p.mitigation]);
  const pinNote = new Map(archetype.pins.mitigations.map((p) => [`${p.at}|${p.mitigation}`, p.note]));

  const tagGroups = new Map<string, string[]>();
  for (const p of archetype.pins.risks) tagGroups.set(p.at, [...(tagGroups.get(p.at) ?? []), p.risk]);
  const tagSpots = showRisks
    ? placeTags([...tagGroups.entries()].map(([at, ids]) => ({ at, widths: ids.map((r) => tagWidth(riskCode(r))) })), L)
    : new Map();

  const badgeProps = (id: string, at: string) => {
    const s = status?.get(id);
    const fill = s ? STATUS_FILL[s] : undefined;
    const note = pinNote.get(`${at}|${id}`);
    return {
      label: `C${number(id)}`,
      fill,
      faded: selected !== null && selected !== id,
      ring: selected === id,
      title: [`C${number(id)} · ${fullName(id)}`, s && `Our status: ${STATUS_META[s].label}`, note].filter(Boolean).join("\n"),
      onClick: () => onPick(id),
    };
  };

  return (
    <div style={{ position: "relative", width: L.width, height: L.height, fontFamily: "var(--font-body)", color: INK }}>
      {bands.map(({ zone, x, y, w, h }) => {
        const t = BAND[zone.owner] ?? BAND.cloud;
        return (
          <div
            key={zone.id}
            title={zone.note}
            style={{ position: "absolute", left: x, top: y, width: w, height: h, background: t.fill, border: `1px ${t.dashed ? "dashed" : "solid"} ${t.border}`, borderRadius: 12 }}
          >
            {/* One line: a second would meet the badges of a first-row card in a narrow band. */}
            <div style={{ position: "absolute", left: 12, top: 9, color: t.ink, fontSize: 10.5, lineHeight: "13px", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap" }}>
              {zone.title}
              <span style={{ letterSpacing: 0, fontWeight: 400, textTransform: "none" }}> · {t.sub}</span>
            </div>
          </div>
        );
      })}

      {/* Arrows under the cards, so a line never crosses a title. */}
      <svg width={L.width} height={L.height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          {[["dark", LINE], ["grey", LINE_EXTERNAL]].map(([id, c]) => (
            <marker key={id} id={`boxes-head-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 Z" fill={c} />
            </marker>
          ))}
        </defs>
        {archetype.edges.map((e) => {
          const key = `${e.from}->${e.to}`;
          const geo = geoByKey.get(key);
          if (!geo) return null;
          const ext = e.path === "external";
          const head = `url(#boxes-head-${ext ? "grey" : "dark"})`;
          const on = walkEdges.has(key);
          return (
            <g key={key} opacity={walk && !on ? 0.18 : 1}>
              <path d={geo.d} fill="none" stroke={ext ? LINE_EXTERNAL : LINE} strokeWidth={on ? 2.8 : 2} strokeDasharray={ext ? "6 5" : undefined} strokeLinejoin="round" markerEnd={head} markerStart={e.bidir ? head : undefined} />
              <path d={geo.d} fill="none" stroke="transparent" strokeWidth={12}>
                <title>{[e.label, e.note].filter(Boolean).join(" — ")}</title>
              </path>
            </g>
          );
        })}
      </svg>

      {archetype.blocks.map((b) => {
        const r = rects[b.id];
        if (!r || b.kind === "origin") return null;
        return <Card key={b.id} block={b} rect={r} owner={owner.get(b.zone ?? "") ?? "cloud"} kids={(kids.get(b.id) ?? []).map((k) => rects[k]).filter(Boolean)} dim={!lit(b.id)} caps={(cardCaps.get(b.id) ?? []).map((id) => badgeProps(id, b.id))} />;
      })}

      {/* Controls on an arrow sit near the end it guards, clear of the arrowhead, so the midpoint
          stays free for step numbers and risk tags. A short arrow has no such room: there they sit
          beside the midpoint, on the side the step numbers do not use. */}
      {[...edgeCaps.entries()].map(([at, ids]) => {
        const geo = geoByKey.get(at) ?? geoByKey.get(at.split("->").reverse().join("->"));
        if (!geo) return null;
        const path = polyline(geo.d);
        const reversed = !geoByKey.has(at);
        return ids.map((id, i) => {
          let x: number;
          let y: number;
          if (path.length >= 150) {
            const back = 50 + i * (path.at(path.length - 50).horizontal ? 36 : 24);
            const p = reversed ? path.at(back) : path.at(path.length - back);
            x = p.x;
            y = p.y;
          } else {
            const off = i - (ids.length - 1) / 2;
            x = geo.horizontal ? geo.midX + off * 36 : geo.midX - 22;
            y = geo.horizontal ? geo.midY - 16 : geo.midY + off * 24;
          }
          return (
            <div key={`${at}:${id}`} style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", zIndex: 4, opacity: walk ? 0.35 : 1 }}>
              <Badge {...badgeProps(id, at)} />
            </div>
          );
        });
      })}

      {[...steps.entries()].flatMap(([key, ns]) => {
        const geo = geoByKey.get(key)!;
        return flowBadgeSpots(ns.length, geo).map((spot, i) => (
          <div key={`${key}:${ns[i]}`} style={{ position: "absolute", left: spot.x + spot.w / 2, top: spot.y + spot.h / 2, transform: "translate(-50%, -50%)", zIndex: 6 }}>
            <StepDot n={ns[i]} />
          </div>
        ));
      })}

      {showRisks &&
        [...tagGroups.entries()].flatMap(([at, ids]) =>
          (tagSpots.get(at)?.rects ?? []).map((t: { x: number; y: number; w: number }, i: number) => (
            <div
              key={`${at}:${ids[i]}`}
              title={riskById.get(ids[i])?.title}
              style={{ position: "absolute", left: t.x, top: t.y, width: t.w, height: TAG_H, zIndex: 5, borderRadius: 3, background: "#F4F4F2", border: "1px solid #E3E8EF", color: MUTED, font: `600 9.5px/${TAG_H - 2}px var(--font-mono, monospace)`, textAlign: "center" }}
            >
              {riskCode(ids[i])}
            </div>
          )),
        )}
    </div>
  );
}

/** A routed arrow as a measurable polyline: its length, and the point a given distance along it. */
function polyline(d: string) {
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

function Card({
  block,
  rect,
  owner,
  kids,
  dim,
  caps,
}: {
  block: ArchBlock;
  rect: { x: number; y: number; w: number; h: number };
  owner: string;
  kids: { x: number; y: number; w: number; h: number }[];
  dim: boolean;
  caps: React.ComponentProps<typeof Badge>[];
}) {
  const base = { position: "absolute" as const, left: rect.x, top: rect.y, width: rect.w, height: rect.h, opacity: dim ? 0.35 : 1, transition: "opacity 150ms" };
  const badges = caps.length > 0 && (
    <div style={{ position: "absolute", right: 6, bottom: "calc(100% - 9px)", display: "flex", flexWrap: "wrap-reverse", justifyContent: "flex-end", gap: 3, maxWidth: rect.w - 12, zIndex: 4 }}>
      {caps.map((c) => (
        <Badge key={c.label} {...c} />
      ))}
    </div>
  );

  if (block.kind === "actor") {
    return (
      <div title={block.note} style={{ ...base, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, zIndex: 2 }}>
        <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
          <FlowIcon name={block.icon ?? "person"} x={13} y={13} size={22} />
        </svg>
        <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap" }}>{block.title}</span>
        {badges}
      </div>
    );
  }
  if (block.kind === "boundary") {
    return (
      <div title={block.note} style={{ ...base, border: "1.5px dashed #9AA1AC", borderRadius: 10, zIndex: 1 }}>
        <span style={{ position: "absolute", left: 10, top: 6, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED }}>{block.title}</span>
        {badges}
      </div>
    );
  }

  const external = block.kind === "external" || owner === "external";
  const container = kids.length > 0;
  // A container's text must stop above the first card it contains.
  const room = container ? Math.min(...kids.map((k) => k.y)) - rect.y - 12 : rect.h;
  const subtitle = (block.items ?? []).map((i) => i.label).join(" · ");
  const subLines = Math.max(0, Math.floor((room - 20 - 30) / 17));
  return (
    <div
      title={block.note}
      style={{
        ...base,
        boxSizing: "border-box",
        padding: "10px 12px",
        display: "flex",
        alignItems: container ? "flex-start" : "center",
        background: container ? "#FBFBFC" : "#FFFFFF",
        border: `${external ? 1.5 : 1}px ${external ? "dashed" : "solid"} ${external ? "#A1A1AA" : CARD_BORDER}`,
        borderRadius: 8,
        boxShadow: "0 1px 2px rgba(16,24,40,0.05)",
        zIndex: container ? 1 : 2,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, lineHeight: "19px", fontWeight: 600, color: INK }}>{block.title}</div>
        {subtitle && subLines > 0 && (
          <div style={{ marginTop: 2, fontSize: 12, lineHeight: "17px", color: MUTED, display: "-webkit-box", WebkitLineClamp: subLines, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{subtitle}</div>
        )}
      </div>
      {badges}
    </div>
  );
}

function Badge({
  label,
  fill,
  faded,
  ring,
  title,
  onClick,
}: {
  label: string;
  fill?: { bg: string; border: string; text: string; dashed?: boolean };
  faded?: boolean;
  ring?: boolean;
  title?: string;
  onClick?: () => void;
}) {
  const f = fill ?? { bg: BADGE, border: BADGE, text: "#FFFFFF" };
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        height: 19,
        minWidth: 26,
        padding: "0 5px",
        borderRadius: 4,
        background: f.bg,
        border: `1.5px ${f.dashed ? "dashed" : "solid"} ${f.border}`,
        color: f.text,
        font: "600 10.5px/16px var(--font-mono, monospace)",
        textAlign: "center",
        cursor: onClick ? "pointer" : "default",
        opacity: faded ? 0.25 : 1,
        boxShadow: ring ? `0 0 0 2px #fff, 0 0 0 4px ${INK}` : undefined,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function StepDot({ n }: { n: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 11, background: INK, color: "#fff", font: "600 11.5px/1 var(--font-mono, monospace)" }}>
      {n}
    </span>
  );
}

function LineKey({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="28" height="8" aria-hidden>
        <path d="M 1 4 H 27" stroke={color} strokeWidth="2" strokeDasharray={dashed ? "5 4" : undefined} />
      </svg>
      {label}
    </span>
  );
}

/** The key under the drawing: the selected flow's steps, and every core control. */
function Key({
  archetype,
  walk,
  walks,
  walkIndex,
  onWalk,
  status,
  selected,
  onPick,
}: {
  archetype: Archetype;
  walk: Scenario | null;
  walks: Scenario[];
  walkIndex: number | null;
  onWalk: (i: number | null) => void;
  status: Map<string, DisplayStatus> | null;
  selected: string | null;
  onPick: (id: string) => void;
}) {
  const edgeLabel = (follow: string) => {
    const e = archetype.edges.find((x) => `${x.from}->${x.to}` === follow || `${x.to}->${x.from}` === follow);
    return e?.label;
  };
  const title = (id: string) => archetype.blocks.find((b) => b.id === id)?.title ?? id;
  return (
    <div className="mt-4 grid gap-6 rounded-xl border border-line bg-paper px-5 py-4 lg:grid-cols-2">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">Data flows</p>
        {walk ? (
          <ol className="space-y-1">
            {walk.steps.map((st, i) => {
              const [a, b] = st.follow.split("->");
              return (
                <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-ink-2">
                  <span className="w-5 shrink-0 text-right font-mono font-semibold text-ink">{i + 1}</span>
                  <span>
                    <span className="font-semibold text-ink">{st.label ?? edgeLabel(st.follow) ?? `${title(a)} → ${title(b)}`}</span>
                    <span className="text-ink-3"> — {title(a)} → {title(b)}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <>
            <p className="mb-1.5 text-[12px] text-ink-3">Pick a flow to number it on the drawing.</p>
            <ul className="space-y-1">
              {walks.map((w, i) => (
                <li key={i}>
                  <button type="button" onClick={() => onWalk(walkIndex === i ? null : i)} className="text-left text-[12.5px] leading-snug text-ink-2 hover:text-introduced">
                    <span className="font-semibold text-ink">{w.title}</span>
                    <span className="text-ink-3"> · {w.steps.length} steps</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">Core controls</p>
        <ul className="space-y-1">
          {archetype.mitigations.map((id, i) => {
            const m = mitigationById.get(id);
            const lead = typeof m?.description?.[0] === "string" ? m.description[0] : "";
            const s = status?.get(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onPick(id)}
                  className={`flex w-full gap-2 rounded px-1 text-left text-[12.5px] leading-snug text-ink-2 hover:bg-mist ${selected === id ? "bg-mist" : ""}`}
                >
                  <span className="w-8 shrink-0 font-mono font-semibold" style={{ color: s ? STATUS_FILL[s].border : BADGE }}>
                    C{i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="font-semibold text-ink">{shortName(id)}</span>
                    {s && <span className="ml-1.5 text-[11px] font-semibold" style={{ color: STATUS_FILL[s].border === "#98a2b3" ? MUTED : STATUS_FILL[s].border }}>{STATUS_META[s].label}</span>}
                    {lead && <span className="line-clamp-1 text-[11.5px] text-ink-3">{lead}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
