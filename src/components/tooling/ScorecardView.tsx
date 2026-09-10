"use client";

/**
 * Option B — scorecards. One card per product variant: the adoption decision, two stacked
 * bars (how much of the reference set the vendor covers, how much the organisation has
 * switched on), and the key controls as tinted chips. The executive read: which products are
 * far along, which are unassessed, where the gaps cluster — without a grid.
 */
import { useState } from "react";
import Link from "next/link";

import { STATUS_STYLE } from "@/components/capabilities/status";
import { orgAdoptionFor, vendorById } from "@/lib/data";
import type { CapabilityStatus, Tool, ToolCoverage } from "@/lib/types";
import { ADOPTION_META, COVERAGE_META, ORG_STATUS_LABEL, SURFACE_CLASS_META } from "./labels";
import { cellFor, columnGroups, summarise, type Row, type RowGroup } from "./model";
import { CellDetail, CellTile, Legend, cellTitle } from "./shared";

const COVERAGE_FILL: Record<ToolCoverage | "unassessed", string> = {
  native: "var(--ink)",
  partial: "var(--ink-2)",
  external: "var(--ink-3)",
  none: "var(--line-strong)",
  unknown: "var(--line)",
  unassessed: "transparent",
};

export function ScorecardView({ tools, groups }: { tools: Tool[]; groups: RowGroup[] }) {
  const rows = groups.flatMap((g) => g.rows);
  const [picked, setPicked] = useState<{ tool: Tool; row: Row } | null>(null);
  if (!tools.length) return <p className="text-[13.5px] text-ink-3">No product matches these filters.</p>;

  return (
    <div className="space-y-4">
      <Legend />
      {columnGroups(tools).map((g) => (
        <div key={g.vendorId}>
          <p className="eyebrow mb-2">{g.vendorName}</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {g.tools.map((t) => (
              <Card key={t.id} tool={t} rows={rows} picked={picked} onPick={setPicked} />
            ))}
          </div>
        </div>
      ))}
      {picked && <CellDetail tool={picked.tool} row={picked.row} onClose={() => setPicked(null)} />}
    </div>
  );
}

function Bar({ segments, total, title }: { segments: { key: string; n: number; fill: string; border?: string; label: string }[]; total: number; title: string }) {
  return (
    <div>
      <p className="flex items-baseline justify-between text-[10.5px] text-ink-3">
        <span className="eyebrow">{title}</span>
        <span>
          {segments
            .filter((s) => s.n)
            .map((s) => `${s.n} ${s.label.toLowerCase()}`)
            .join(" · ")}
        </span>
      </p>
      <div className="mt-1 flex h-2.5 w-full overflow-hidden rounded-full border border-line bg-mist" title={`${total} pinned capabilities`}>
        {segments.map((s) =>
          s.n ? (
            <span
              key={s.key}
              style={{ width: `${(s.n / total) * 100}%`, background: s.fill, boxShadow: s.border ? `inset 0 0 0 1px ${s.border}` : undefined }}
              title={`${s.label}: ${s.n} of ${total}`}
            />
          ) : null,
        )}
      </div>
    </div>
  );
}

function Card({ tool, rows, picked, onPick }: { tool: Tool; rows: Row[]; picked: { tool: Tool; row: Row } | null; onPick: (p: { tool: Tool; row: Row }) => void }) {
  const s = summarise(tool);
  const adoption = orgAdoptionFor(tool.id);
  const statuses: CapabilityStatus[] = ["inPlace", "partial", "gap", "needsAssessment"];
  const coverages: (ToolCoverage | "unassessed")[] = ["native", "partial", "external", "none", "unknown", "unassessed"];
  const applicable = rows.filter((r) => cellFor(tool, r).applies);
  return (
    <div className="rounded-xl border border-line bg-paper p-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <Link href={`/tooling?tool=${tool.id}`} className="text-[14px] font-semibold text-ink hover:underline">
          {tool.name}
        </Link>
        <span className="text-[11px] text-ink-3">{tool.surfaceClasses.map((c) => SURFACE_CLASS_META[c].short).join(" · ")}</span>
        <span
          className={`ml-auto rounded-full border px-2 py-px text-[10.5px] font-semibold ${
            adoption === "approved" ? "border-mitigated text-mitigated" : adoption === "blocked" ? "border-exposed text-exposed" : "border-line-strong text-ink-2"
          }`}
          title={ADOPTION_META[adoption].blurb}
        >
          {ADOPTION_META[adoption].label}
        </span>
      </div>
      <p className="mt-0.5 text-[11px] text-ink-3">
        {vendorById.get(tool.vendor)?.name} · {s.pinned} reference controls · as of {tool.asOf}
      </p>
      <div className="mt-3 space-y-2.5">
        <Bar
          title="Vendor coverage"
          total={s.pinned}
          segments={coverages.map((c) => ({ key: c, n: s.coverage[c], fill: COVERAGE_FILL[c], label: c === "unassessed" ? "Unassessed" : COVERAGE_META[c].label }))}
        />
        <Bar
          title="Your status"
          total={s.pinned}
          segments={[
            ...statuses.map((st) => ({ key: st, n: s.status[st], fill: STATUS_STYLE[st].bg, border: STATUS_STYLE[st].border, label: ORG_STATUS_LABEL[st] })),
            { key: "unset", n: s.status.unset, fill: "transparent", label: "No status" },
          ]}
        />
      </div>
      <div className="mt-3">
        <p className="eyebrow">Controls</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {applicable.map((row) => {
            const cell = cellFor(tool, row);
            const selected = picked?.tool.id === tool.id && picked.row.id === row.id;
            return (
              <span key={row.id} className="flex items-center gap-1 rounded-md border border-line px-1 py-[2px]" style={cell.status ? { background: STATUS_STYLE[cell.status].bg, borderColor: STATUS_STYLE[cell.status].border } : undefined}>
                <CellTile cell={cell} title={cellTitle(tool, row, cell)} size="sm" selected={selected} onClick={() => onPick({ tool, row })} />
                <span className="max-w-[140px] truncate text-[10.5px] text-ink-2" title={row.title ?? row.label}>
                  {row.short}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
