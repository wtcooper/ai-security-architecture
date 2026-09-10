"use client";

/** Encodings the three lenses share: the cell tile, the legend, and the detail panel. */
import { STATUS_STYLE } from "@/components/capabilities/status";
import { CAPABILITY_STATUSES, type Tool, type ToolCoverage } from "@/lib/types";
import { vendorById } from "@/lib/data";
import { ControlRowDetail } from "./ControlRowDetail";
import { COVERAGE_META, ORG_STATUS_LABEL } from "./labels";
import type { Cell, Row } from "./model";

/** Hatched, for a control the tool's architecture does not pin: not a gap, not applicable. */
export const NA_STYLE = {
  background: "repeating-linear-gradient(135deg, transparent 0 4px, var(--line) 4px 5px)",
  color: "var(--ink-3)",
} as const;

export function cellTitle(tool: Tool, row: Row, cell: Cell) {
  const cov = cell.coverage ? COVERAGE_META[cell.coverage] : null;
  return [
    `${tool.name} · ${row.title ?? row.label}`,
    cell.applies
      ? `Vendor: ${cov ? cov.label : "not assessed"}${cell.parts.length > 1 ? " (worst of " + cell.parts.filter((p) => p.pinned).length + ")" : ""}`
      : "Not pinned on this product's architecture",
    cell.applies ? `Status: ${cell.status ? ORG_STATUS_LABEL[cell.status] : "—"}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** The matrix and bar tile: status is the tint, vendor coverage the glyph. */
export function CellTile({
  cell,
  title,
  size = "md",
  selected = false,
  onClick,
}: {
  cell: Cell;
  title: string;
  size?: "sm" | "md";
  selected?: boolean;
  onClick?: () => void;
}) {
  const cov = cell.coverage ? COVERAGE_META[cell.coverage] : null;
  const style = !cell.applies ? NA_STYLE : cell.status ? { background: STATUS_STYLE[cell.status].bg, color: STATUS_STYLE[cell.status].text } : undefined;
  const base = size === "sm" ? "h-[18px] w-[18px] text-[11px]" : "h-full w-full min-h-[34px] px-2 py-1 text-left";
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={selected}
      className={`flex items-center gap-1.5 rounded-[3px] transition-[filter] hover:brightness-95 ${base} ${
        selected ? "outline outline-2 outline-ink" : ""
      }`}
      style={style}
    >
      <span className={`shrink-0 ${size === "sm" ? "w-full text-center" : "w-3 text-center text-[13px]"} ${cov ? "text-ink" : "text-ink-3"}`}>
        {!cell.applies ? "" : cov ? cov.glyph : "·"}
      </span>
      {size === "md" && (
        <span className="truncate text-[10.5px] font-medium">
          {!cell.applies ? "n/a" : cell.status ? ORG_STATUS_LABEL[cell.status] : cov ? cov.label : ""}
        </span>
      )}
    </button>
  );
}

export function Legend({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-ink-3 ${compact ? "" : "rounded-lg border border-line bg-paper px-3 py-2"}`}>
      <span className="eyebrow">Tint = your status</span>
      {CAPABILITY_STATUSES.map((s) => (
        <span key={s} className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-[2px] border" style={{ background: STATUS_STYLE[s].bg, borderColor: STATUS_STYLE[s].border }} />
          {ORG_STATUS_LABEL[s]}
        </span>
      ))}
      <span className="eyebrow ml-2">Glyph = vendor coverage</span>
      {(Object.keys(COVERAGE_META) as ToolCoverage[]).map((c) => (
        <span key={c} className="flex items-center gap-1" title={COVERAGE_META[c].blurb}>
          <span className="w-3 text-center text-[12px] text-ink">{COVERAGE_META[c].glyph}</span>
          {COVERAGE_META[c].label}
        </span>
      ))}
      <span className="flex items-center gap-1">
        <span className="inline-block h-3 w-3 rounded-[2px] border border-line" style={NA_STYLE} />
        not on this product&rsquo;s architecture
      </span>
    </div>
  );
}

/** What a click on any tile opens: every capability behind the cell, in full. */
export function CellDetail({ tool, row, onClose }: { tool: Tool; row: Row; onClose: () => void }) {
  return (
    <div className="rounded-xl border border-ink/40 bg-paper">
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-b border-line px-4 py-2.5 text-[12.5px]">
        <span className="ident text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">Detail</span>
        <span className="font-semibold text-ink">{tool.name}</span>
        <span className="text-ink-3">{vendorById.get(tool.vendor)?.name ?? tool.vendor}</span>
        <span className="text-ink-2">· {row.title ?? row.label}</span>
        <button type="button" onClick={onClose} className="ml-auto text-[12px] font-semibold text-ink-3 hover:text-ink">
          Close ✕
        </button>
      </div>
      <div className="divide-y divide-line px-4">
        {row.capabilities.map((capabilityId) => (
          <div key={capabilityId} className="py-4">
            <ControlRowDetail tool={tool} capabilityId={capabilityId} showTitle={row.capabilities.length > 1 || row.title !== undefined} />
          </div>
        ))}
      </div>
    </div>
  );
}

