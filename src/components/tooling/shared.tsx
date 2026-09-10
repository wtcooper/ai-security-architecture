"use client";

/** Encodings the three lenses share: the cell tile, the legend, and the detail panel. */
import { STATUS_STYLE } from "@/components/capabilities/status";
import { CAPABILITY_STATUSES, type Tool, type ToolControl, type ToolCoverage } from "@/lib/types";
import { vendorById } from "@/lib/data";
import { ControlRowDetail } from "./ControlRowDetail";
import { COVERAGE_META, COVERAGE_ORDER, ORG_STATUS_LABEL } from "./labels";
import type { Cell, Row } from "./model";

/** The vendor's own documentation index for a product, for the attributable link beside its name. */
export const docsUrlFor = (tool: Tool) =>
  tool.facts?.find((f) => /docs/i.test(f.label) && f.url)?.url ?? tool.sources[0]?.url;

export function cellTitle(tool: Tool, row: Row, cell: Cell, overlay: boolean) {
  const cov = cell.coverage ? COVERAGE_META[cell.coverage] : null;
  const steps = cell.parts.reduce((n, p) => n + (p.control?.steps?.length ?? 0), 0);
  return [
    `${tool.name} · ${row.title ?? row.label}`,
    `${cov ? cov.long : "Not assessed"}${cell.parts.length > 1 ? ` (worst of ${cell.parts.length})` : ""}${cov ? ` — ${cov.blurb}` : ""}`,
    steps ? `${steps} operator step${steps === 1 ? "" : "s"} with vendor links — click to open` : "",
    overlay ? `Status: ${cell.status ? ORG_STATUS_LABEL[cell.status] : "—"}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** The vendor page for one control on one product: the first operator step's link, else none. */
export const configureUrl = (control?: ToolControl) => control?.steps?.find((st) => st.url)?.url;

/** The coverage word in its colour. The one encoding every view shares. */
export function CoverageBadge({ coverage, long = false, className = "" }: { coverage?: ToolCoverage; long?: boolean; className?: string }) {
  const m = coverage ? COVERAGE_META[coverage] : null;
  return (
    <span
      title={m?.blurb ?? "The registry has no vendor record for this control yet."}
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-[2px] text-[11px] font-semibold ${className}`}
      style={
        m
          ? { background: m.bg, color: m.text, borderColor: m.border, borderStyle: m.dashed ? "dashed" : "solid" }
          : { background: "var(--paper)", color: "var(--ink-3)", borderColor: "var(--line)" }
      }
    >
      {m ? (long ? m.long : m.label) : "Not assessed"}
    </span>
  );
}

/** A grid cell: the coverage word on its colour, the configure link, and the status pill when the overlay is on. */
export function CellTile({
  cell,
  title,
  overlay,
  selected = false,
  onClick,
}: {
  cell: Cell;
  title: string;
  overlay: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  const m = cell.coverage ? COVERAGE_META[cell.coverage] : null;
  const status = overlay ? cell.status : undefined;
  const url = cell.parts.map((p) => configureUrl(p.control)).find(Boolean);
  return (
    <div
      className={`flex h-full min-h-[36px] items-center gap-1.5 rounded-[4px] px-2 py-1 ${selected ? "outline outline-2 outline-ink" : ""}`}
      style={m ? { background: m.bg, color: m.text, boxShadow: m.dashed ? "inset 0 0 0 1px var(--line-strong)" : undefined } : { color: "var(--ink-3)" }}
      title={title}
    >
      <button type="button" onClick={onClick} className="min-w-0 flex-1 truncate text-left text-[11.5px] font-semibold hover:underline">
        {m ? m.label : "—"}
      </button>
      {status && (
        <span
          className="shrink-0 rounded-full border px-1.5 py-px text-[9.5px] font-semibold"
          style={{ borderColor: STATUS_STYLE[status].border, color: STATUS_STYLE[status].text, background: "var(--paper)" }}
        >
          {ORG_STATUS_LABEL[status]}
        </span>
      )}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          title="How to configure — the vendor's page"
          className="shrink-0 rounded px-1 text-[12px] font-bold opacity-70 hover:bg-white/60 hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          ↗
        </a>
      )}
    </div>
  );
}

export function Legend({ overlay, compact = false }: { overlay: boolean; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-ink-3 ${compact ? "" : "rounded-lg border border-line bg-paper px-3 py-2"}`}>
      <span className="eyebrow">Can an admin switch it on?</span>
      {COVERAGE_ORDER.map((c) => (
        <CoverageBadge key={c} coverage={c} />
      ))}
      <span className="ml-1">↗ = the vendor&rsquo;s page for configuring it</span>
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

