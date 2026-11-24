"use client";

/**
 * The drawing of a pattern: trust boundaries, plain boxes, numbered controls. The layout is
 * computed from the pattern's data (layout.ts); this component adds what a reader does with it:
 * zoom and pan, a hover card, expanding to the window, and export.
 *
 * The mouse belongs to the page until the reader clicks the drawing. From then the wheel zooms
 * about the pointer and a drag pans, and a click anywhere else (or Esc) hands the wheel back to
 * the page. Without that hand-over a drawing this tall would trap the scroll on the way past it.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { REF_LAYERS } from "@/components/reference/flow-style";
import type { Archetype, Scenario } from "@/lib/types";
import { BOUNDARY_TONE, BoxDiagram, type DrawingPins, type HoverCard } from "./BoxDiagram";
import { boundaryLayout } from "./layout";
import type { BlockService, Highlight, StepOverlay } from "./types";

interface View {
  k: number;
  x: number;
  y: number;
}

const FIT: View = { k: 1, x: 0, y: 0 };
const MAX_ZOOM = 3;
/** Never draw smaller than this share of natural size inline: a wide pattern scrolls sideways instead. */
const MIN_SCALE = 0.82;

export function PatternDrawing({
  archetype,
  walk = null,
  highlight = null,
  onHighlight,
  overlay = null,
  pins = "controls",
  onPickMitigation,
  services = null,
  ownBoundary = null,
  builtWith = null,
  minScale = MIN_SCALE,
  className,
}: {
  archetype: Archetype;
  /** The selected sequence flow, or null for the resting drawing. */
  walk?: Scenario | null;
  highlight?: Highlight | null;
  onHighlight?: (h: Highlight | null) => void;
  /** An incident step replayed on the drawing. */
  overlay?: StepOverlay | null;
  /** Which pins show: the numbered controls, the coded risk tags, or both. */
  pins?: DrawingPins;
  onPickMitigation?: (id: string) => void;
  /** Block id -> the cloud service that plays it; null draws the generic components. */
  services?: Map<string, BlockService> | null;
  /** The title of the organisation's own boundary, when the chosen platform is not a cloud. */
  ownBoundary?: string | null;
  /** Block id -> the framework or server the reader chose to build that box with. */
  builtWith?: Map<string, string> | null;
  /** The smallest share of natural size to draw at inline before scrolling sideways. Lower where seeing the whole drawing matters more than reading it. */
  minScale?: number;
  className?: string;
}) {
  const spec = useMemo(() => boundaryLayout(archetype), [archetype]);
  const [view, setView] = useState<View>(FIT);
  const [expanded, setExpanded] = useState(false);
  /** Clicked into: the wheel zooms and a drag pans, until a click elsewhere or Esc. */
  const [active, setActive] = useState(false);
  const [card, setCard] = useState<HoverCard | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; view: View } | null>(null);

  // A different pattern, or the same one drawn for another platform, starts fitted. Adjusted
  // during render, as the page's other resets are.
  const drawingKey = archetype.drawn?.key ?? archetype.id;
  const [shown, setShown] = useState(drawingKey);
  if (shown !== drawingKey) {
    setShown(drawingKey);
    setView(FIT);
    setActive(false);
  }

  const clamp = useCallback(
    (v: View): View => {
      const k = Math.min(MAX_ZOOM, Math.max(1, v.k));
      return { k, x: Math.min(0, Math.max(spec.width * (1 - k), v.x)), y: Math.min(0, Math.max(spec.height * (1 - k), v.y)) };
    },
    [spec],
  );
  /** Zoom by a factor about a point given in drawing units (the centre by default). */
  const zoom = useCallback(
    (factor: number, cx = spec.width / 2, cy = spec.height / 2) =>
      setView((v) => {
        const k = Math.min(MAX_ZOOM, Math.max(1, v.k * factor));
        const ux = (cx - v.x) / v.k;
        const uy = (cy - v.y) / v.k;
        return clamp({ k, x: cx - ux * k, y: cy - uy * k });
      }),
    [spec, clamp],
  );
  /** Client coordinates to drawing units. */
  const toDrawing = (clientX: number, clientY: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r || !r.width) return { x: spec.width / 2, y: spec.height / 2, scale: 1 };
    const scale = Math.min(r.width / spec.width, r.height / spec.height);
    return { x: (clientX - r.left - (r.width - spec.width * scale) / 2) / scale, y: (clientY - r.top - (r.height - spec.height * scale) / 2) / scale, scale };
  };

  // The wheel zooms once the drawing has been clicked into or expanded (and with Ctrl or ⌘ held,
  // which is also how a trackpad pinch arrives). Otherwise it is the page's, so it scrolls past.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!expanded && !active && !e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const p = toDrawing(e.clientX, e.clientY);
      // Proportional to the turn of the wheel, so a notched mouse and a smooth trackpad both feel right.
      const delta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;
      zoom(Math.exp(-Math.max(-240, Math.min(240, delta)) * 0.0016), p.x, p.y);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // toDrawing reads refs and the spec only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, active, zoom, spec]);

  // Clicked into, the drawing keeps the mouse until a click anywhere else, or Esc.
  useEffect(() => {
    if (!active) return;
    const release = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setActive(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(false);
    };
    document.addEventListener("pointerdown", release, true);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", release, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  const exportSvg = () => {
    const el = svgRef.current;
    if (!el) return;
    const copy = el.cloneNode(true) as SVGSVGElement;
    // A standalone file has no stylesheet: write each token's value where it was referenced.
    const root = getComputedStyle(document.documentElement);
    const resolve = (v: string) => v.replace(/var\((--[\w-]+)(?:,\s*([^)]+))?\)/g, (_, name: string, fallback?: string) => root.getPropertyValue(name).trim() || fallback || "currentColor");
    for (const node of [copy, ...copy.querySelectorAll<SVGElement>("*")]) {
      for (const attr of ["fill", "stroke", "style"]) {
        const v = node.getAttribute(attr);
        if (v?.includes("var(")) node.setAttribute(attr, resolve(v));
      }
      node.removeAttribute("tabindex");
    }
    copy.querySelector("g[transform]")?.removeAttribute("transform");
    copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    copy.setAttribute("width", String(spec.width));
    copy.setAttribute("height", String(spec.height));
    copy.removeAttribute("class");
    copy.setAttribute("style", "font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #fff");
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${archetype.id}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const button = "rounded-md border border-ink-3/40 bg-paper px-2.5 py-1 text-[11px] text-ink-2 hover:bg-mist disabled:opacity-40";
  const engaged = active || expanded;
  const toolbar = (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <span className={`mr-auto text-[11.5px] ${active && !expanded ? "font-semibold text-introduced" : "text-ink-3"}`} data-zoom-hint>
        {expanded
          ? "Scroll to zoom · drag to pan · Esc to collapse"
          : active
            ? "Scroll to zoom · drag to pan · click outside the drawing to release"
            : "Click the drawing to zoom and pan with the mouse"}
      </span>
      <button type="button" className={button} onClick={() => zoom(1 / 1.3)} disabled={view.k <= 1} aria-label="Zoom out" title="Zoom out">
        −
      </button>
      <button type="button" className={button} onClick={() => zoom(1.3)} disabled={view.k >= MAX_ZOOM} aria-label="Zoom in" title="Zoom in (or hold Ctrl / ⌘ and scroll)">
        +
      </button>
      <button type="button" className={button} onClick={() => setView(FIT)} disabled={view.k === 1} title="Fit the whole drawing">
        Fit
      </button>
      <button type="button" className={button} onClick={exportSvg} title="Download this drawing as an SVG image">
        Export SVG
      </button>
      {expanded ? (
        <button type="button" autoFocus className={button} onClick={() => setExpanded(false)} title="Collapse back into the page (Esc)">
          Collapse ⤡
        </button>
      ) : (
        <button type="button" className={button} onClick={() => setExpanded(true)} title="Expand the drawing to fill the window (Esc to collapse)">
          Expand ⤢
        </button>
      )}
    </div>
  );

  const drawing = (
    <BoxDiagram
      archetype={archetype}
      spec={spec}
      walk={walk}
      highlight={highlight}
      overlay={overlay}
      pins={pins}
      services={services}
      ownBoundary={ownBoundary}
      builtWith={builtWith}
      onPickMitigation={onPickMitigation}
      onPickRisk={(id) => onHighlight?.(highlight?.kind === "risk" && highlight.id === id ? null : { kind: "risk", id })}
      onHover={setCard}
      transform={view.k === 1 ? undefined : `translate(${view.x} ${view.y}) scale(${view.k})`}
      svgRef={svgRef}
      className={expanded ? "h-full w-full" : "w-full"}
      style={{
        minWidth: expanded ? undefined : Math.round(spec.width * minScale),
        cursor: view.k > 1 ? "grab" : engaged ? "zoom-in" : undefined,
        touchAction: view.k > 1 ? "none" : undefined,
        userSelect: engaged ? "none" : undefined,
      }}
    />
  );

  // A click on the drawing itself (not on a chip, a tag or a button) takes the mouse. A drag
  // pans once zoomed in; at fit there is nowhere to pan to.
  const panHandlers = {
    onPointerDown: (e: React.PointerEvent) => {
      if ((e.target as Element).closest("[role=button], button")) return;
      if (e.pointerType === "mouse" && e.button === 0) setActive(true);
      if (view.k <= 1) return;
      drag.current = { x: e.clientX, y: e.clientY, view };
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      setCard(null);
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const { scale } = toDrawing(e.clientX, e.clientY);
      setView(clamp({ k: d.view.k, x: d.view.x + (e.clientX - d.x) / scale, y: d.view.y + (e.clientY - d.y) / scale }));
    },
    onPointerUp: () => {
      drag.current = null;
    },
    onPointerCancel: () => {
      drag.current = null;
    },
  };

  const hoverCard = card && (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[60] max-w-[320px] rounded-lg border border-line-strong bg-paper px-3 py-2 text-[12px] leading-snug text-ink-2 shadow-lg"
      style={{ left: Math.min(card.x + 14, (typeof window === "undefined" ? 1200 : window.innerWidth) - 336), top: card.y + 16 }}
    >
      <p className="font-semibold text-ink">{card.title}</p>
      {card.holds && card.holds.length > 0 && (
        <p className="mt-1 text-ink">
          <span className="text-ink-3">Holds: </span>
          {card.holds.join(" · ")}
        </p>
      )}
      {card.role && <p className="mt-1 text-ink"><span className="text-ink-3">Role: </span>{card.role}</p>}
      {card.body && <p className="mt-1">{card.body.length > 360 ? `${card.body.slice(0, 357).trimEnd()}…` : card.body}</p>}
      {card.options && card.options.length > 0 && (
        <div className="mt-1.5 border-t border-line pt-1.5" data-hover-options>
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-3">Options, none ranked</p>
          <ul className="mt-0.5 space-y-0.5">
            {card.options.slice(0, 9).map((o) => (
              <li key={o.name} className={o.on ? "font-semibold text-ink" : undefined}>
                {o.name}
                <span className="text-ink-3"> · {o.kind === "open" ? "open source" : "commercial"}</span>
                {o.on && <span className="ml-1 rounded bg-ink px-1 text-[10px] font-bold text-white">in effect</span>}
              </li>
            ))}
            {card.options.length > 9 && <li className="text-ink-3">and {card.options.length - 9} more under How it works</li>}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={rootRef}
      className={`relative rounded-[inherit] transition-shadow ${active && !expanded ? "shadow-[inset_0_0_0_2px_var(--introduced)]" : ""} ${className ?? ""}`}
      data-drawing="boundaries"
      data-active={active || undefined}
    >
      <div className="px-2 pt-2">{!expanded && toolbar}</div>
      {expanded ? (
        <div aria-hidden style={{ aspectRatio: `${spec.width} / ${spec.height}` }} />
      ) : (
        <div className="overflow-x-auto p-3" {...panHandlers}>
          {drawing}
        </div>
      )}
      {expanded && (
        <div role="dialog" aria-modal="true" aria-label={`${archetype.title}: expanded drawing`} className="fixed inset-0 z-50 flex flex-col bg-paper">
          <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-2">
            <span className="display text-[14px] font-bold text-ink">{archetype.title}</span>
            <div className="ml-auto">{toolbar}</div>
          </div>
          <div className="min-h-0 flex-1 p-4" {...panHandlers}>
            {drawing}
          </div>
        </div>
      )}
      {hoverCard}
    </div>
  );
}

/** The reading key for the boundary drawing, on one line. */
export function DrawingLegend({
  className = "",
  risks = false,
  cloud,
  own = false,
  roles = false,
  placedFor,
}: {
  className?: string;
  /** True where the coded risk tags are showing instead of the controls. */
  risks?: boolean;
  /** The cloud the drawing is shown as built on, by its short name. */
  cloud?: string;
  /** True when the chosen platform is the organisation's own data centre: it runs software, not a provider's services. */
  own?: boolean;
  /** True when the platform has packs: the products that can play a box are in its hover help (on-premises the box names its role). */
  roles?: boolean;
  /** Where the drawing has boxes the chosen platform adds or draws elsewhere: that platform, as the legend names it. */
  placedFor?: string;
}) {
  const swatch = (tone: keyof typeof BOUNDARY_TONE) => {
    const t = BOUNDARY_TONE[tone];
    return <span aria-hidden className="inline-block h-3 w-5 rounded-[3px]" style={{ background: t.fill, border: `1.5px ${t.dash ? "dashed" : "solid"} ${t.stroke}` }} />;
  };
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-ink-2 ${className}`}>
      <span className="flex items-center gap-1.5">
        <svg width="24" height="10" aria-hidden>
          <path d="M 1 5 H 23" stroke="var(--ink-2)" strokeWidth="1.5" />
        </svg>
        Data path
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="24" height="10" aria-hidden>
          <path d="M 1 5 H 23" stroke="var(--ink-2)" strokeWidth="1.5" strokeDasharray="5 4" />
        </svg>
        Outside content &amp; actions
      </span>
      {risks ? (
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="ident rounded-[3px] border px-1 text-[9px] font-bold" style={{ background: "var(--exposed-soft)", borderColor: "var(--exposed)", color: "var(--exposed)" }}>
            R01
          </span>
          Risk · select to light it
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="flex h-[16px] w-[16px] items-center justify-center rounded-full border text-[9px] font-bold" style={{ background: "var(--paper)", borderColor: "var(--chip)", color: "var(--chip)" }}>
            1
          </span>
          Control · select to open it on Enable
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="flex h-[15px] w-[15px] items-center justify-center rounded-[4px] bg-ink text-[9px] font-bold text-white">1</span>
        Step of a flow
      </span>
      <span className="flex items-center gap-1.5">
        {swatch("ours")} Ours
      </span>
      <span className="flex items-center gap-1.5">
        {swatch("vendor")} Vendor-run
      </span>
      <span className="flex items-center gap-1.5">
        {swatch("outside")} Outside
      </span>
      <span className="flex items-center gap-1.5">
        {swatch("control")} Control plane
      </span>
      <span className="flex items-center gap-1.5" title="The coloured edge on a box says what kind of component it is">
        {REF_LAYERS.map((l) => (
          <span key={l.label} aria-hidden className="inline-block h-3 w-[3px] rounded-sm" style={{ background: l.color }} />
        ))}
        <span aria-hidden className="inline-block h-3 w-[3px] rounded-sm" style={{ background: "var(--ink-2)" }} />
        {REF_LAYERS.map((l) => l.label).join(" · ")} · Control point
      </span>
      {cloud && (
        <span className="flex items-center gap-1.5" data-legend-cloud>
          <span aria-hidden className="text-[11px] font-semibold text-ink">{roles ? (own ? "Role or product" : "Service or product") : own ? "Software name" : "Service name"}</span>
          {roles
            ? own
              ? "The role, or the product your stack puts there; hover a box for its options"
              : `The ${cloud} service, or the product your stack puts there; hover a box for its options`
            : own
              ? "The software that plays the box in your data centre"
              : `The ${cloud} service that plays the box`}{" "}
          · <span className="text-[9.5px] font-bold tracking-[0.06em] text-ink-3">YOU BUILD THIS</span> where none does
        </span>
      )}
      {placedFor && (
        <span className="flex items-center gap-1.5" data-legend-placed>
          <span aria-hidden className="inline-block h-3 w-5 rounded-[3px] bg-paper" style={{ border: "1.2px dashed var(--ink-3)" }} />
          Placed for {placedFor}; hover it for why
        </span>
      )}
      <span className="text-ink-3">Hover anything for detail</span>
    </div>
  );
}
