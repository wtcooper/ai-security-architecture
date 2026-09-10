"use client";

/**
 * Option A — the matrix. Columns are product variants under vendor headers, rows are controls
 * grouped by CoSAI category (or by the organisation's own catalogue), each cell tinted by the
 * organisation's status with the vendor's coverage as its glyph. Sticky row labels and headers
 * so 25 columns stay readable; a click opens the detail beneath.
 */
import { useState } from "react";

import { orgAdoptionFor } from "@/lib/data";
import type { Tool } from "@/lib/types";
import { ADOPTION_META } from "./labels";
import { cellFor, columnGroups, type Row, type RowGroup } from "./model";
import { CellDetail, CellTile, Legend, cellTitle } from "./shared";

export function MatrixView({ tools, groups }: { tools: Tool[]; groups: RowGroup[] }) {
  const cols = columnGroups(tools);
  const [picked, setPicked] = useState<{ tool: Tool; row: Row } | null>(null);
  if (!tools.length) return <p className="text-[13.5px] text-ink-3">No product matches these filters.</p>;

  return (
    <div className="space-y-4">
      <Legend />
      <div className="max-h-[75vh] overflow-auto rounded-xl border border-line bg-paper">
        <table className="border-separate border-spacing-0 text-[12px]">
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 min-w-[260px] border-b border-r border-line bg-mist px-3 py-1.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">
                Vendor
              </th>
              {cols.map((g) => (
                <th
                  key={g.vendorId}
                  colSpan={g.tools.length}
                  className="border-b border-l border-line bg-mist px-2 py-1.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2"
                >
                  {g.vendorName}
                </th>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 z-30 border-b border-r border-line bg-paper px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">
                Control · decision ↓
              </th>
              {cols.flatMap((g) =>
                g.tools.map((t) => {
                  const adoption = orgAdoptionFor(t.id);
                  return (
                    <th key={t.id} className="min-w-[104px] max-w-[132px] border-b border-l border-line bg-paper px-2 py-2 text-left align-bottom">
                      <span className="block text-[11.5px] font-semibold leading-tight text-ink">{t.name}</span>
                      <span
                        className={`mt-1 inline-block rounded-full border px-1.5 py-px text-[9.5px] font-semibold ${
                          adoption === "approved"
                            ? "border-mitigated text-mitigated"
                            : adoption === "blocked"
                              ? "border-exposed text-exposed"
                              : "border-line-strong text-ink-2"
                        }`}
                        title={ADOPTION_META[adoption].blurb}
                      >
                        {ADOPTION_META[adoption].label}
                      </span>
                    </th>
                  );
                }),
              )}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <GroupRows key={group.id} group={group} cols={cols} picked={picked} onPick={setPicked} />
            ))}
          </tbody>
        </table>
      </div>
      {picked && <CellDetail tool={picked.tool} row={picked.row} onClose={() => setPicked(null)} />}
    </div>
  );
}

function GroupRows({
  group,
  cols,
  picked,
  onPick,
}: {
  group: RowGroup;
  cols: ReturnType<typeof columnGroups>;
  picked: { tool: Tool; row: Row } | null;
  onPick: (p: { tool: Tool; row: Row }) => void;
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
            {row.aside && <span className="ident block text-[10px] text-ink-3">{row.aside}</span>}
          </td>
          {cols.flatMap((g) =>
            g.tools.map((t) => {
              const cell = cellFor(t, row);
              const selected = picked?.tool.id === t.id && picked.row.id === row.id;
              return (
                <td key={t.id} className="border-b border-l border-line p-[2px] align-middle">
                  <CellTile cell={cell} title={cellTitle(t, row, cell)} selected={selected} onClick={() => onPick({ tool: t, row })} />
                </td>
              );
            }),
          )}
        </tr>
      ))}
    </>
  );
}
