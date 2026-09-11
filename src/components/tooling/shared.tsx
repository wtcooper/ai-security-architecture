"use client";

/** Encodings the three lenses share: the cell tile, the legend, and the detail panel. */
import Link from "next/link";
import { NEUTRAL_STYLE, ORG_STATUSES, STATUS_META, STATUS_STYLE } from "@/components/StatusPill";
import type { Tool, ToolControl, ToolCoverage } from "@/lib/types";
import { archetypeById, capabilityById, orgSurfacePostureFor, orgSurfaceStatusFor, vendorById } from "@/lib/data";
import { ControlRowDetail } from "./ControlRowDetail";
import { COVERAGE_META, COVERAGE_ORDER } from "./labels";
import { OWNER_META, type Cell, type Row } from "./model";

/** The vendor's own documentation index for a product, for the attributable link beside its name. */
export const docsUrlFor = (tool: Tool) =>
  tool.facts?.find((f) => /docs/i.test(f.label) && f.url)?.url ?? tool.sources[0]?.url;

export function cellTitle(tool: Tool, row: Row, cell: Cell, overlay: boolean) {
  const cov = cell.coverage ? COVERAGE_META[cell.coverage] : null;
  const steps = cell.parts.reduce((n, p) => n + (p.control?.steps?.length ?? 0), 0);
  return [
    `Admin control · ${tool.name} · ${row.title ?? row.label}`,
    `${cov ? cov.long : "Not assessed"}${cell.parts.length > 1 ? ` (worst of ${cell.parts.length})` : ""}${cov ? ` — ${cov.blurb}` : ""}`,
    steps ? `${steps} operator step${steps === 1 ? "" : "s"} with vendor links — click to open` : "",
    overlay ? `Status: ${cell.status ? STATUS_META[cell.status].label : "product not available"}` : "",
  ]
    .filter(Boolean)
    .join("\n");
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
 * A grid cell: tinted by the organisation's status when shown (the Capabilities matrix's
 * colours), neutral otherwise; the coverage word inside is the link to the vendor's page.
 * Clicking the cell itself opens the steps beneath the grid.
 */
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
  const status = overlay ? cell.status : undefined;
  const tint = status ? STATUS_STYLE[status] : NEUTRAL_STYLE;
  const url = cell.parts.map((p) => configureUrl(p.control)).find(Boolean);
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
      title={title}
    >
      {cell.coverage ? <CoverageBadge coverage={cell.coverage} url={url} className="border-transparent" /> : <span className="text-[11.5px] text-ink-3">—</span>}
    </div>
  );
}

export function Legend({ overlay, compact = false }: { overlay: boolean; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-ink-3 ${compact ? "" : "rounded-lg border border-line bg-paper px-3 py-2"}`}>
      <span className="eyebrow" title="Admin control: set by an administrator in the product itself.">Admin control</span>
      <span>{COVERAGE_ORDER.map((c) => COVERAGE_META[c].label).join(" · ")}</span>
      <span className="ml-1">the word ↗ links to the vendor&rsquo;s page for configuring it; click a cell for the steps</span>
      <span className="eyebrow ml-2" title="Enterprise capability: a control class the organisation deploys around the products, at the place the drawing pins it.">Enterprise capability</span>
      <span className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-paper px-1.5 py-[2px] text-[10.5px] leading-none text-ink" style={{ borderStyle: "dashed" }}>
        <span className="font-semibold">control class</span>
        <span className="text-ink-3">· where it sits</span>
      </span>
      <span>layers stack: one, the other, or both</span>
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

/**
 * The enterprise capability of one control on one architecture, as one tag: the capability
 * class, then every block the drawing pins it on ("where it sits", with the zone owner's dot).
 * With status shown the tag is tinted by the organisation's status on this surface, the same
 * colours as everywhere else; the technology it runs and its note live in the tooltip.
 */
export function EnterpriseModules({ row, archetypeId, overlay, className = "" }: { row: Row; archetypeId: string; overlay: boolean; className?: string }) {
  const arch = archetypeById.get(archetypeId);
  const capability = capabilityById.get(row.capabilities[0]);
  if (!row.enforcement.length) return null;
  const posture = overlay && arch ? row.capabilities.map((c) => orgSurfacePostureFor(c, arch.surface)).find(Boolean) : undefined;
  const status = overlay && arch ? orgSurfaceStatusFor(row.capabilities[0], arch.surface) : undefined;
  const tint = status ? STATUS_STYLE[status] : null;
  const label = capability?.abbrev ?? capability?.title ?? "Capability";
  const title = [
    `Enterprise capability: ${capability?.title ?? row.label}`,
    `Where it sits: ${row.enforcement.map((e) => `${e.title} (${OWNER_META[e.owner]?.label ?? e.owner})`).join(", ")}`,
    capability?.examples?.length ? `Bought as: ${capability.examples.join(", ")}` : "",
    status ? `Your status: ${STATUS_META[status].label}${posture?.technology ? ` with ${posture.technology}` : ""}${posture?.note ? ` — ${posture.note}` : ""}` : "",
    ...row.enforcement.flatMap((e) => e.notes),
  ]
    .filter(Boolean)
    .join("\n\n");
  return (
    <span className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <Link
        href={`/capabilities?capability=${row.capabilities[0]}`}
        className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-md border px-1.5 py-[3px] text-[11px] leading-none hover:border-ink"
        style={
          tint
            ? { background: tint.bg, borderColor: tint.border, color: tint.text, borderStyle: tint.dashed ? "dashed" : "solid" }
            : { background: "var(--paper)", borderColor: "var(--line-strong)", color: "var(--ink)", borderStyle: "dashed" }
        }
        title={title}
      >
        <span className="font-semibold">{label}</span>
        {row.enforcement.map((e) => (
          <span key={e.blockId} className={tint ? "opacity-80" : "text-ink-3"}>
            <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: OWNER_META[e.owner]?.color ?? "var(--ink-3)" }} />
            {e.title}
          </span>
        ))}
      </Link>
    </span>
  );
}

/** The technology classes a capability is bought as — the vendor-neutral names for the enterprise layer. */
export const technologyClasses = (capabilityIds: string[]) =>
  [...new Set(capabilityIds.flatMap((c) => capabilityById.get(c)?.examples ?? []))];

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

