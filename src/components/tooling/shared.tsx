"use client";

/** Encodings the three lenses share: the cell tile, the legend, and the detail panel. */
import { STATUS_STYLE } from "@/components/capabilities/status";
import { CAPABILITY_STATUSES, type Tool, type ToolCoverage } from "@/lib/types";
import { vendorById } from "@/lib/data";
import { ControlRowDetail } from "./ControlRowDetail";
import { COVERAGE_META, ORG_STATUS_LABEL } from "./labels";
import type { Cell, Row } from "./model";

/** The vendor's own documentation index for a product, for the attributable link beside its name. */
export const docsUrlFor = (tool: Tool) =>
  tool.facts?.find((f) => /docs/i.test(f.label) && f.url)?.url ?? tool.sources[0]?.url;

export function cellTitle(tool: Tool, row: Row, cell: Cell, overlay: boolean) {
  const cov = cell.coverage ? COVERAGE_META[cell.coverage] : null;
  const steps = cell.parts.reduce((n, p) => n + (p.control?.steps?.length ?? 0), 0);
  return [
    `${tool.name} · ${row.title ?? row.label}`,
    `Vendor: ${cov ? cov.label : "not assessed"}${cell.parts.length > 1 ? ` (worst of ${cell.parts.length})` : ""}${cov ? ` — ${cov.blurb}` : ""}`,
    steps ? `${steps} operator step${steps === 1 ? "" : "s"} with vendor links — click to open` : "",
    overlay ? `Status: ${cell.status ? ORG_STATUS_LABEL[cell.status] : "—"}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** The matrix and bar tile: status is the tint, vendor coverage the glyph. */
export function CellTile({
  cell,
  title,
  overlay,
  size = "md",
  selected = false,
  onClick,
}: {
  cell: Cell;
  title: string;
  /** With the organisation overlay on, the tint is its status and a small pill names it. */
  overlay: boolean;
  size?: "sm" | "md";
  selected?: boolean;
  onClick?: () => void;
}) {
  const cov = cell.coverage ? COVERAGE_META[cell.coverage] : null;
  const status = overlay ? cell.status : undefined;
  const style = status ? { background: STATUS_STYLE[status].bg, color: STATUS_STYLE[status].text } : undefined;
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
        {cov ? cov.glyph : "·"}
      </span>
      {size === "md" && (
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[10.5px] font-medium text-ink-2">{cov ? cov.label : ""}</span>
          {status && (
            <span
              className="shrink-0 rounded-full border px-1.5 py-px text-[9.5px] font-semibold"
              style={{ borderColor: STATUS_STYLE[status].border, color: STATUS_STYLE[status].text, background: "var(--paper)" }}
            >
              {ORG_STATUS_LABEL[status]}
            </span>
          )}
        </span>
      )}
    </button>
  );
}

export function Legend({ overlay, compact = false }: { overlay: boolean; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-ink-3 ${compact ? "" : "rounded-lg border border-line bg-paper px-3 py-2"}`}>
      <span className="eyebrow">Vendor coverage</span>
      {(Object.keys(COVERAGE_META) as ToolCoverage[]).map((c) => (
        <span key={c} className="flex items-center gap-1" title={COVERAGE_META[c].blurb}>
          <span className="w-3 text-center text-[12px] text-ink">{COVERAGE_META[c].glyph}</span>
          {COVERAGE_META[c].label}
        </span>
      ))}
      {overlay && (
        <>
          <span className="eyebrow ml-2">Your status</span>
          {CAPABILITY_STATUSES.map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-[2px] border" style={{ background: STATUS_STYLE[s].bg, borderColor: STATUS_STYLE[s].border }} />
              {ORG_STATUS_LABEL[s]}
            </span>
          ))}
        </>
      )}
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
        {docsUrlFor(tool) && (
          <a href={docsUrlFor(tool)} target="_blank" rel="noreferrer" className="text-[11.5px] font-semibold text-introduced hover:underline">
            Vendor docs ↗
          </a>
        )}
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

