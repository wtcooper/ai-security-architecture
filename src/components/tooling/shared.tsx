"use client";

/** Encodings the three lenses share: the cell tile, the legend, and the detail panel. */
import { NEUTRAL_STYLE, ORG_STATUSES, STATUS_META, STATUS_STYLE } from "@/components/StatusPill";
import type { Tool, ToolControl, ToolCoverage } from "@/lib/types";
import { mitigationById, org, orgStatusFor, orgToolAvailableFor, vendorById } from "@/lib/data";
import { ControlRowDetail } from "./ControlRowDetail";
import { COVERAGE_META, COVERAGE_ORDER } from "./labels";
import { type Cell, type Row } from "./model";

/** The vendor's own documentation index for a product, for the attributable link beside its name. */
export const docsUrlFor = (tool: Tool) =>
  tool.facts?.find((f) => /docs/i.test(f.label) && f.url)?.url ?? tool.sources[0]?.url;

/**
 * The hover card for one grid cell: the vendor's mechanism for the control, and, with status
 * shown, the organisation's justification for the status it recorded (the note and evidence in
 * data/org/<profile>/tooling-status.yaml). Positioned fixed from the cell's rectangle so it
 * escapes the scrolling table; pointer-events off so it never steals the hover.
 */
export function CellHoverCard({ tool, row, cell, overlay, rect }: { tool: Tool; row: Row; cell: Cell; overlay: boolean; rect: DOMRect }) {
  const width = 340;
  const vw = typeof window === "undefined" ? 1200 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const left = Math.max(12, Math.min(rect.left, vw - width - 12));
  // Open below the cell, or above it when there is more room there than below.
  const below = vh - rect.bottom >= Math.max(240, rect.top) || vh - rect.bottom >= 320;
  const place = below ? { top: rect.bottom + 6 } : { bottom: vh - rect.top + 6 };
  const available = orgToolAvailableFor(tool.id);
  const profile = org.example ? "data/org/example" : "data/org/local";
  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 rounded-lg border border-line-strong bg-paper p-3 text-[11.5px] leading-snug text-ink-2 shadow-lg"
      style={{ left, width, ...place }}
    >
      <p className="text-[12px] font-semibold text-ink">
        {tool.name} <span className="font-normal text-ink-3">· {row.title ?? row.label}</span>
      </p>
      {cell.parts.map((p) => {
        const mitigation = mitigationById.get(p.mitigation);
        const cov = p.control ? COVERAGE_META[p.control.coverage] : null;
        const status = overlay ? orgStatusFor(tool.id, p.mitigation) : undefined;
        return (
          <div key={p.mitigation} className="mt-2 border-t border-line pt-2 first:mt-1.5">
            {cell.parts.length > 1 && <p className="font-semibold text-ink">{mitigation?.title ?? p.mitigation}</p>}
            <p>
              <span className="eyebrow mr-1">Vendor</span>
              <span className="font-semibold text-ink">{cov ? cov.long : "Not assessed"}</span>
              {p.control?.mechanism ? <span> — {p.control.mechanism}</span> : cov ? <span> — {cov.blurb}</span> : null}
            </p>
            {overlay && (
              <p className="mt-1">
                {!available ? (
                  <span>Not available in the organisation, so nothing is configured.</span>
                ) : p.control?.coverage === "notApplicable" ? (
                  <span>Does not apply to this product, so there is no status to record.</span>
                ) : status?.note || status?.evidence ? (
                  <>
                    <span className="font-semibold" style={{ color: STATUS_STYLE[status.status].text }}>
                      {STATUS_META[status.status].label}
                    </span>
                    {status.note && <span> — {status.note}</span>}
                    {status.evidence && <span className="ident ml-1 text-ink-3">{status.evidence}</span>}
                  </>
                ) : (
                  <span>
                    <span className="font-semibold" style={{ color: STATUS_STYLE[status?.status ?? "gap"].text }}>
                      {STATUS_META[status?.status ?? "gap"].label}
                    </span>
                    {" — "}nothing recorded yet. Add <span className="ident">note</span> and <span className="ident">evidence</span> under this
                    control in <span className="ident">{profile}/tooling-status.yaml</span>.
                  </span>
                )}
              </p>
            )}
          </div>
        );
      })}
      <p className="mt-2 border-t border-line pt-1.5 text-[10.5px] text-ink-3">Click the cell for the operator steps · the word ↗ opens the vendor&rsquo;s page</p>
    </div>
  );
}

/** The vendor page for one control on one product: the first operator step's link, else none. */
export const configureUrl = (control?: ToolControl) => control?.steps?.find((st) => st.url)?.url;

/**
 * The coverage word as a tag. Neutral by itself; when `url` is given (the vendor's page for
 * configuring it, never for "Not offered") the tag is the link.
 */
export function CoverageBadge({ coverage, long = false, url, className = "" }: { coverage?: ToolCoverage; long?: boolean; url?: string; className?: string }) {
  const m = coverage ? COVERAGE_META[coverage] : null;
  const text = m ? (long ? m.long : m.label) : "Not assessed";
  const cls = `inline-flex items-center whitespace-nowrap rounded-full border border-current/30 px-2 py-[2px] text-[11px] font-semibold ${className}`;
  if (m?.linkable && url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" title={`${m.blurb} Opens the vendor's page for configuring it.`} className={`${cls} underline decoration-dotted underline-offset-2 hover:decoration-solid`} onClick={(e) => e.stopPropagation()}>
        {text} ↗
      </a>
    );
  }
  return (
    <span title={m?.blurb ?? "The registry has no vendor record for this control yet."} className={cls}>
      {text}
    </span>
  );
}

/**
 * A grid cell: tinted by the organisation's status when shown (the Mitigations matrix's
 * colours), neutral otherwise; the coverage word inside is the link to the vendor's page.
 * Clicking the cell itself opens the steps beneath the grid.
 */
export function CellTile({
  cell,
  overlay,
  selected = false,
  onClick,
}: {
  cell: Cell;
  overlay: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  const status = overlay ? cell.status : undefined;
  const tint = status ? STATUS_STYLE[status] : NEUTRAL_STYLE;
  // The word and its link refer to the same component: the one whose coverage the cell shows.
  const url = configureUrl(cell.decisive);
  const missing = cell.missing.map((id) => mitigationById.get(id)?.title ?? id);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`flex h-full min-h-[36px] cursor-pointer items-center justify-center rounded-[4px] border px-2 py-1 ${selected ? "outline outline-2 outline-ink" : ""}`}
      style={{ background: tint.bg, borderColor: tint.border, color: tint.text, borderStyle: "dashed" in tint && tint.dashed ? "dashed" : "solid" }}
    >
      {cell.coverage ? <CoverageBadge coverage={cell.coverage} url={url} className="border-transparent" /> : <span className="text-[11.5px] text-ink-3">—</span>}
      {cell.coverage && missing.length > 0 && (
        <span className="ml-0.5 text-[10px] text-ink-3" title={`No vendor record yet for: ${missing.join(", ")}`}>
          †
        </span>
      )}
    </div>
  );
}

export function Legend({ overlay, compact = false }: { overlay: boolean; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-ink-3 ${compact ? "" : "rounded-lg border border-line bg-paper px-3 py-2"}`}>
      <span className="eyebrow" title="Admin control: set by an administrator in the product itself.">Admin control</span>
      <span>{COVERAGE_ORDER.map((c) => COVERAGE_META[c].label).join(" · ")}</span>
      <span className="ml-1">the word ↗ links to the vendor&rsquo;s page for configuring it; click a cell for the steps</span>
      {overlay && (
        <>
          <span className="eyebrow ml-2">Your status</span>
          {ORG_STATUSES.map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-[2px] border" style={{ background: STATUS_STYLE[s].bg, borderColor: STATUS_STYLE[s].border }} />
              {STATUS_META[s].label}
            </span>
          ))}
          <span className="text-ink-3">· greyed product = not available</span>
        </>
      )}
    </div>
  );
}

/** The technology classes a mitigation is bought as — the vendor-neutral names for the enterprise layer. */
export const technologyClasses = (mitigationIds: string[]) =>
  [...new Set(mitigationIds.flatMap((c) => mitigationById.get(c)?.examples ?? []))];

/** What a click on any tile opens: every mitigation behind the cell, in full. */
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
        {row.mitigations.map((mitigationId) => (
          <div key={mitigationId} className="py-4">
            <ControlRowDetail tool={tool} mitigationId={mitigationId} showTitle={row.mitigations.length > 1 || row.title !== undefined} />
          </div>
        ))}
      </div>
    </div>
  );
}
