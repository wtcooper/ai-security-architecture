"use client";

/**
 * One capability on the landscape: a small block with the MITRE name and id, tinted by the
 * organisation's rolled-up status when the overlay is on and neutral otherwise. Hovering opens a
 * card with the per-surface statuses; clicking opens the full record beneath the drawing.
 */
import { useState } from "react";

import { NEUTRAL_STYLE, STATUS_META, STATUS_STYLE, StatusPill } from "@/components/StatusPill";
import { controlCategories, orgSurfacePostureFor, specializationsOf, surfaces } from "@/lib/data";
import type { AiKind, Tile as TileModel } from "./model";

/** The mark for what a tile adds to a domain's own architecture: filled = AI-native, hollow = foundational with an AI specialisation, none = foundational. */
export function AiDot({ kind, className = "" }: { kind: AiKind; className?: string }) {
  if (kind === "foundational") return null;
  return (
    <span
      aria-label={kind === "native" ? "AI-native (MITRE ATLAS)" : "Foundational, extended for AI by a specialisation"}
      className={`inline-block h-[6px] w-[6px] shrink-0 rounded-full border border-introduced ${kind === "native" ? "bg-introduced" : "bg-transparent"} ${className}`}
    />
  );
}

export function Tile({ tile, surface, selected, onSelect, className = "" }: { tile: TileModel; surface: string | null; selected: boolean; onSelect: (id: string) => void; className?: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const status = tile.posture?.status;
  const tint = status ? STATUS_STYLE[status] : NEUTRAL_STYLE;
  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(tile.id)}
        onMouseEnter={(e) => setRect(e.currentTarget.getBoundingClientRect())}
        onMouseLeave={() => setRect(null)}
        onFocus={(e) => setRect(e.currentTarget.getBoundingClientRect())}
        onBlur={() => setRect(null)}
        aria-pressed={selected}
        data-tile={tile.id}
        className={`block rounded-md border px-2.5 py-1.5 text-left transition-shadow hover:shadow-sm ${className}`}
        style={{
          background: tint.bg,
          color: tint.text,
          borderColor: selected ? "var(--ink)" : tint.border,
          borderStyle: "dashed" in tint && tint.dashed ? "dashed" : "solid",
          boxShadow: selected ? "0 0 0 1px var(--ink)" : undefined,
        }}
      >
        <span className="block text-[12px] font-semibold leading-[1.2]">{tile.title}</span>
        <span className="mt-[3px] flex items-center gap-1.5 text-ink-3">
          <AiDot kind={tile.ai} />
          <span className="ident !text-[10px]">{tile.id}</span>
        </span>
      </button>
      {rect && <TileHoverCard tile={tile} surface={surface} rect={rect} />}
    </>
  );
}

/** Fixed beside the tile so it escapes any scrolling container; pointer-events off so it never steals the hover. */
function TileHoverCard({ tile, surface, rect }: { tile: TileModel; surface: string | null; rect: DOMRect }) {
  const width = 320;
  const vw = typeof window === "undefined" ? 1200 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const left = Math.max(12, Math.min(rect.left, vw - width - 12));
  const below = vh - rect.bottom >= 260 || vh - rect.bottom >= rect.top;
  const place = below ? { top: rect.bottom + 6 } : { bottom: vh - rect.top + 6 };
  const m = tile.mitigation;
  const group = controlCategories.find((c) => c.id === m.category)?.title;
  const applies = surfaces.filter((s) => m.surfaces[s.id]?.applies);
  const specs = specializationsOf(m.id);
  const overlay = Boolean(tile.posture);
  return (
    <div role="tooltip" className="pointer-events-none fixed z-50 rounded-lg border border-line-strong bg-paper p-3 text-[11.5px] leading-snug text-ink-2 shadow-lg" style={{ left, width, ...place }}>
      <p className="text-[12.5px] font-semibold text-ink">{m.title}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-ink-3">
        <span className="ident">{m.id}</span>
        <span>· {m.origin.framework}</span>
        {group && <span>· {group}</span>}
      </p>
      <p className="mt-2">{m.implementation.split(/(?<=\.)\s/)[0]}</p>
      {overlay ? (
        <div className="mt-2 border-t border-line pt-2">
          <p className="mb-1 flex items-center gap-1.5">
            <span className="eyebrow">Org status</span>
            <span className="font-semibold" style={{ color: STATUS_STYLE[tile.posture!.status].text }}>{STATUS_META[tile.posture!.status].label}</span>
            {surface ? <span className="text-ink-3">· {surfaces.find((s) => s.id === surface)?.title}</span> : <span className="text-ink-3">· across surfaces</span>}
          </p>
          {!surface && (
            <ul className="flex flex-wrap gap-1.5">
              {applies.map((s) => (
                <li key={s.id} className="flex items-center gap-1">
                  <span className="text-ink-3">{s.title}</span>
                  <StatusPill status={orgSurfacePostureFor(m.id, s.id).status} compact />
                </li>
              ))}
            </ul>
          )}
          {tile.posture!.technology && <p className="mt-1.5 text-ink-3">Recorded as: {tile.posture!.technology}</p>}
        </div>
      ) : (
        <p className="mt-2 border-t border-line pt-2 text-ink-3">Applies on {applies.map((s) => s.title).join(" · ")}</p>
      )}
      {specs.length > 0 && <p className="mt-1.5 text-ink-3">{specs.length} specialisation{specs.length > 1 ? "s" : ""} roll up here: {specs.map((s) => s.title).join(" · ")}</p>}
      <p className="mt-2 border-t border-line pt-1.5 text-[10.5px] text-ink-3">Click for the full record</p>
    </div>
  );
}
