"use client";

/**
 * One vendor, across categories: its products grouped by the architecture each instantiates,
 * so the inheritance reads first — "Anthropic ships products in five categories" — and then,
 * per product, the adoption decision and two bars: how much of the category's reference set
 * the vendor covers, and how much the organisation has switched on. Nothing else; the matrix
 * behind any product is one click away.
 */
import Link from "next/link";

import { STATUS_STYLE } from "@/components/capabilities/status";
import { archetypesForVendor, toolsForVendor } from "@/lib/data";
import type { CapabilityStatus, Tool, ToolCoverage } from "@/lib/types";
import { COVERAGE_META, ORG_STATUS_LABEL, SURFACE_CLASS_META } from "./labels";
import { summarise } from "./model";
import { useOrgOverlay } from "./overlay";
import { OverlayToggle } from "./OverlayToggle";
import { docsUrlFor } from "./shared";

const COVERAGE_FILL: Record<ToolCoverage | "unassessed", string> = {
  native: "var(--ink)",
  partial: "var(--ink-2)",
  external: "var(--ink-3)",
  none: "var(--line-strong)",
  unknown: "var(--line)",
  unassessed: "transparent",
};
const STATUSES: CapabilityStatus[] = ["inPlace", "partial", "gap", "needsAssessment"];
const COVERAGES: (ToolCoverage | "unassessed")[] = ["native", "partial", "external", "none", "unknown", "unassessed"];

export function VendorView({ vendorId, onPickArchitecture }: { vendorId: string; onPickArchitecture: (id: string) => void }) {
  const archetypes = archetypesForVendor(vendorId);
  const tools = toolsForVendor(vendorId);
  const overlay = useOrgOverlay();
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-ink-2">
        <span>
          <span className="font-semibold text-ink">{tools.length} products</span> across{" "}
          <span className="font-semibold text-ink">{archetypes.length} categories</span>. Each product inherits its reference
          controls from its category&rsquo;s drawing; the bar is measured against that set.
        </span>
        <OverlayToggle className="ml-auto" />
      </div>
      {archetypes.map((a) => (
        <section key={a.id} className="rounded-xl border border-line bg-paper">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line px-4 py-2.5">
            <button type="button" onClick={() => onPickArchitecture(a.id)} className="text-[13.5px] font-semibold text-ink hover:text-introduced hover:underline">
              {a.title}
            </button>
            <span className="text-[11.5px] text-ink-3">{a.capabilities.length} reference controls</span>
            <Link href={`/reference?archetype=${a.id}`} className="ml-auto text-[11.5px] font-semibold text-introduced hover:underline">
              Drawing →
            </Link>
          </div>
          <div className="divide-y divide-line">
            {tools
              .filter((t) => t.architecture === a.id)
              .map((t) => (
                <ProductRow key={t.id} tool={t} overlay={overlay} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ProductRow({ tool, overlay }: { tool: Tool; overlay: boolean }) {
  const s = summarise(tool);
  return (
    <div className={`grid items-center gap-x-5 gap-y-2 px-4 py-2.5 ${overlay ? "md:grid-cols-[minmax(220px,1.2fr)_minmax(0,2fr)_minmax(0,2fr)]" : "md:grid-cols-[minmax(220px,1.2fr)_minmax(0,3fr)]"}`}>
      <div className="min-w-0">
        <Link href={`/tooling?tool=${tool.id}`} className="text-[13px] font-semibold text-ink hover:underline">
          {tool.name}
        </Link>
        <span className="ml-2 text-[11px] text-ink-3">{tool.surfaceClasses.map((c) => SURFACE_CLASS_META[c].short).join(" · ")}</span>
        {docsUrlFor(tool) && (
          <a href={docsUrlFor(tool)} target="_blank" rel="noreferrer" className="ml-2 text-[10.5px] font-medium text-ink-3 hover:text-introduced hover:underline">
            vendor docs ↗
          </a>
        )}
      </div>
      <Bar
        title="Vendor coverage"
        total={s.pinned}
        segments={COVERAGES.map((c) => ({ key: c, n: s.coverage[c], fill: COVERAGE_FILL[c], label: c === "unassessed" ? "unassessed" : COVERAGE_META[c].label.toLowerCase() }))}
      />
      {overlay && (
        <Bar
          title="Your status"
          total={s.pinned}
          segments={[
            ...STATUSES.map((st) => ({ key: st, n: s.status[st], fill: STATUS_STYLE[st].bg, border: STATUS_STYLE[st].border, label: ORG_STATUS_LABEL[st].toLowerCase() })),
            { key: "unset", n: s.status.unset, fill: "transparent", label: "no status" },
          ]}
        />
      )}
    </div>
  );
}

function Bar({ segments, total, title }: { segments: { key: string; n: number; fill: string; border?: string; label: string }[]; total: number; title: string }) {
  return (
    <div className="min-w-0">
      <p className="flex items-baseline justify-between gap-2 text-[10.5px] text-ink-3">
        <span className="eyebrow shrink-0">{title}</span>
        <span className="truncate">
          {segments
            .filter((s) => s.n)
            .map((s) => `${s.n} ${s.label}`)
            .join(" · ")}
        </span>
      </p>
      <div className="mt-1 flex h-2.5 w-full overflow-hidden rounded-full border border-line bg-mist" title={`${total} reference controls`}>
        {segments.map((s) =>
          s.n ? (
            <span key={s.key} style={{ width: `${(s.n / total) * 100}%`, background: s.fill, boxShadow: s.border ? `inset 0 0 0 1px ${s.border}` : undefined }} title={`${s.label}: ${s.n} of ${total}`} />
          ) : null,
        )}
      </div>
    </div>
  );
}
