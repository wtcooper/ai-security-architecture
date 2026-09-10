"use client";

/**
 * One category of tool, all its products: rows are the reference architecture's pinned
 * capabilities (what every product of this kind needs), columns are the products that
 * instantiate it, grouped by vendor. The tint is the organisation's status, the glyph the
 * vendor's coverage; a click opens the operator steps. Used on the AI Tooling tab and, with the
 * same component, on the architecture's own Tools tab — one picture, two entry points.
 */
import { useState } from "react";
import Link from "next/link";

import { archetypeById, org } from "@/lib/data";
import type { Tool } from "@/lib/types";
import { cellFor, columnGroups, hasOrgMappings, rowsFor, type LabelMode, type Row } from "./model";
import { useOrgOverlay } from "./overlay";
import { OverlayToggle } from "./OverlayToggle";
import { CellDetail, CellTile, Legend, cellTitle, docsUrlFor } from "./shared";

export function ArchitectureMatrix({
  archetypeId,
  tools,
  showDrawingLink = false,
}: {
  archetypeId: string;
  tools: Tool[];
  /** On the AI Tooling tab, link back to the drawing; on the drawing itself, not needed. */
  showDrawingLink?: boolean;
}) {
  const archetype = archetypeById.get(archetypeId);
  const overlay = useOrgOverlay();
  const [labels, setLabels] = useState<LabelMode>("cosai");
  const [picked, setPicked] = useState<{ tool: Tool; row: Row } | null>(null);
  if (!archetype) return null;
  const cols = columnGroups(tools);
  const groups = rowsFor(archetypeId, overlay ? labels : "cosai");
  const total = cols.reduce((n, g) => n + g.tools.length, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-ink-2">
        <span>
          <span className="font-semibold text-ink">{archetype.capabilities.length} reference controls</span> inherited from the
          drawing{showDrawingLink && (
            <>
              {" "}
              <Link href={`/reference?archetype=${archetypeId}`} className="font-semibold text-introduced hover:underline">
                {archetype.abbrev ?? archetype.title} →
              </Link>
            </>
          )}
          , {total} product{total === 1 ? "" : "s"} rated against them.
        </span>
        <span className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <OverlayToggle />
          {overlay && hasOrgMappings && (
            <span className="flex items-center gap-1.5">
              <span className="eyebrow">Rows</span>
              {(["cosai", "org"] as LabelMode[]).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={labels === m}
              disabled={m === "org" && !hasOrgMappings}
              onClick={() => setLabels(m)}
              title={m === "org" && !hasOrgMappings ? "No organisation catalogue maps onto capabilities yet (data/org)." : undefined}
              className={`rounded-full border px-2.5 py-[3px] text-[11.5px] font-medium transition-colors disabled:opacity-40 ${
                labels === m ? "border-transparent bg-ink text-white" : "border-line bg-paper text-ink-2 hover:border-line-strong"
              }`}
            >
              {m === "cosai" ? "CoSAI names" : org.example ? "Example org's control ids" : `${org.shortName ?? org.name} control ids`}
            </button>
              ))}
            </span>
          )}
        </span>
      </div>

      {tools.length === 0 ? (
        <p className="rounded-xl border border-line bg-paper px-4 py-6 text-[13px] text-ink-3">
          No product in the registry instantiates this architecture yet. The reference set above is still what one would need.
        </p>
      ) : (
        <div className="max-h-[75vh] overflow-auto rounded-xl border border-line bg-paper">
          <table className="border-separate border-spacing-0 text-[12px]">
            <thead className="sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 z-30 min-w-[260px] border-b border-r border-line bg-mist px-3 py-1.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">
                  Vendor
                </th>
                {cols.map((g) => (
                  <th key={g.vendorId} colSpan={g.tools.length} className="border-b border-l border-line bg-mist px-2 py-1.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">
                    {g.vendorName}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="sticky left-0 z-30 border-b border-r border-line bg-paper px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">
                  Reference control ↓ · product →
                </th>
                {cols.flatMap((g) =>
                  g.tools.map((t) => (
                    <th key={t.id} className="min-w-[118px] max-w-[150px] border-b border-l border-line bg-paper px-2 py-2 text-left align-bottom">
                      <Link href={`/tooling?tool=${t.id}`} className="block text-[11.5px] font-semibold leading-tight text-ink hover:text-introduced hover:underline">
                        {t.name}
                      </Link>
                      {docsUrlFor(t) && (
                        <a href={docsUrlFor(t)} target="_blank" rel="noreferrer" className="mt-0.5 inline-block text-[10px] font-medium text-ink-3 hover:text-introduced hover:underline">
                          vendor docs ↗
                        </a>
                      )}
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <GroupRows key={group.id} group={group} cols={cols} picked={picked} onPick={setPicked} overlay={overlay} />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Legend overlay={overlay} compact />
      {picked && <CellDetail tool={picked.tool} row={picked.row} onClose={() => setPicked(null)} />}
    </div>
  );
}

function GroupRows({
  group,
  cols,
  picked,
  onPick,
  overlay,
}: {
  group: { id: string; title: string; rows: Row[] };
  cols: ReturnType<typeof columnGroups>;
  picked: { tool: Tool; row: Row } | null;
  onPick: (p: { tool: Tool; row: Row }) => void;
  overlay: boolean;
}) {
  const span = cols.reduce((n, g) => n + g.tools.length, 0) + 1;
  return (
    <>
      <tr>
        <td colSpan={span} className="sticky left-0 border-b border-t border-line bg-mist/70 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">
          {group.title}
        </td>
      </tr>
      {group.rows.map((row) => (
        <tr key={row.id}>
          <td className="sticky left-0 z-10 border-b border-r border-line bg-paper px-3 py-1 align-middle">
            <span className="block text-[12px] font-medium leading-tight text-ink" title={row.title ?? row.label}>
              {row.label}
            </span>
            {overlay && row.aside && <span className="ident block text-[10px] text-ink-3">{row.aside}</span>}
          </td>
          {cols.flatMap((g) =>
            g.tools.map((t) => {
              const cell = cellFor(t, row);
              const selected = picked?.tool.id === t.id && picked.row.id === row.id;
              return (
                <td key={t.id} className="border-b border-l border-line p-[2px] align-middle">
                  <CellTile cell={cell} title={cellTitle(t, row, cell, overlay)} overlay={overlay} selected={selected} onClick={() => onPick({ tool: t, row })} />
                </td>
              );
            }),
          )}
        </tr>
      ))}
    </>
  );
}
