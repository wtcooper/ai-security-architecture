"use client";

/**
 * Option C — coverage bars. One row per control; every product is a small tile in a strip,
 * so all of them fit on one screen with no horizontal scroll and a row reads as a pattern:
 * a control everyone has enabled is a green run, a control nobody has assessed is grey. The
 * vendor blocks are separated so the strip still says who is who; hover names the product.
 */
import { useState } from "react";

import type { Tool } from "@/lib/types";
import { ORG_STATUS_LABEL } from "./labels";
import { cellFor, columnGroups, type Row, type RowGroup } from "./model";
import { CellDetail, CellTile, Legend, cellTitle } from "./shared";

export function CoverageBarsView({ tools, groups }: { tools: Tool[]; groups: RowGroup[] }) {
  const cols = columnGroups(tools);
  const [picked, setPicked] = useState<{ tool: Tool; row: Row } | null>(null);
  if (!tools.length) return <p className="text-[13.5px] text-ink-3">No product matches these filters.</p>;

  const tally = (row: Row) => {
    const cells = tools.map((t) => cellFor(t, row)).filter((c) => c.applies);
    const enabled = cells.filter((c) => c.status === "inPlace").length;
    const gap = cells.filter((c) => c.status === "gap").length;
    const native = cells.filter((c) => c.coverage === "native").length;
    return `${native}/${cells.length} native · ${enabled} enabled · ${gap} gap`;
  };

  return (
    <div className="space-y-4">
      <Legend />
      <div className="rounded-xl border border-line bg-paper">
        <div className="flex items-end gap-4 border-b border-line px-4 py-2">
          <span className="w-[300px] shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">Control</span>
          <div className="flex gap-2">
            {cols.map((g) => (
              <span key={g.vendorId} className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2" style={{ width: g.tools.length * 20 - 2 }}>
                <span className="block truncate" title={`${g.vendorName}: ${g.tools.map((t) => t.name).join(", ")}`}>
                  {g.tools.length * 20 < 60 ? g.vendorName.replace(/\s*\(.*\)/, "").slice(0, 3) : g.vendorName}
                </span>
              </span>
            ))}
          </div>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">Across products</span>
        </div>
        {groups.map((group) => (
          <div key={group.id}>
            <p className="bg-mist/70 px-4 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">{group.title}</p>
            {group.rows.map((row) => (
              <div key={row.id} className="flex items-center gap-4 border-t border-line px-4 py-1.5">
                <div className="w-[300px] shrink-0 leading-tight">
                  <span className="block text-[12px] font-medium text-ink" title={row.title ?? row.label}>
                    {row.label}
                  </span>
                  {row.aside && <span className="ident text-[10px] text-ink-3">{row.aside}</span>}
                </div>
                <div className="flex gap-2">
                  {cols.map((g) => (
                    <div key={g.vendorId} className="flex gap-[2px]">
                      {g.tools.map((t) => {
                        const cell = cellFor(t, row);
                        const selected = picked?.tool.id === t.id && picked.row.id === row.id;
                        return <CellTile key={t.id} cell={cell} size="sm" title={cellTitle(t, row, cell)} selected={selected} onClick={() => setPicked({ tool: t, row })} />;
                      })}
                    </div>
                  ))}
                </div>
                <span className="text-[11px] text-ink-3">{tally(row)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-ink-3">
        Tiles read left to right in vendor order; {ORG_STATUS_LABEL.inPlace.toLowerCase()} is the green tint. Click a tile for the operator steps.
      </p>
      {picked && <CellDetail tool={picked.tool} row={picked.row} onClose={() => setPicked(null)} />}
    </div>
  );
}
