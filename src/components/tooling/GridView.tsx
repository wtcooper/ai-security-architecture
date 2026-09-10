"use client";

/**
 * Option 2 — the grid. Reference controls as rows, products as columns, every cell a coloured
 * word (Settable · Partly · 3rd-party · Not offered · Unverified) with the vendor's configure
 * link on it. The dense scan: one screen says which products can be locked down for which
 * controls, and where.
 */
import { useState } from "react";
import Link from "next/link";

import type { Tool } from "@/lib/types";
import { cellFor, columnGroups, type Row, type RowGroup } from "./model";
import { CellDetail, CellTile, cellTitle, docsUrlFor, EnterpriseLine } from "./shared";

export function GridView({ tools, groups, overlay, archetypeId }: { tools: Tool[]; groups: RowGroup[]; overlay: boolean; archetypeId: string }) {
  const cols = columnGroups(tools);
  const [picked, setPicked] = useState<{ tool: Tool; row: Row } | null>(null);
  const span = tools.length + 2;
  return (
    <div className="space-y-3">
      <div className="max-h-[75vh] overflow-auto rounded-xl border border-line bg-paper">
        <table className="border-separate border-spacing-0 text-[12px]">
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 min-w-[260px] border-b border-r border-line bg-mist px-3 py-1.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">
                Vendor
              </th>
              <th className="min-w-[210px] border-b border-r border-line bg-mist px-3 py-1.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">
                Enterprise layer
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
              <th className="border-b border-r border-line bg-paper px-3 py-2 text-left text-[10.5px] font-normal normal-case tracking-normal text-ink-3">
                where the drawing enforces it
              </th>
              {cols.flatMap((g) =>
                g.tools.map((t) => (
                  <th key={t.id} className="min-w-[124px] max-w-[160px] border-b border-l border-line bg-paper px-2 py-2 text-left align-bottom">
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
              <GroupRows key={group.id} group={group} cols={cols} span={span} picked={picked} onPick={setPicked} overlay={overlay} archetypeId={archetypeId} />
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
  span,
  picked,
  onPick,
  overlay,
  archetypeId,
}: {
  group: RowGroup;
  cols: ReturnType<typeof columnGroups>;
  span: number;
  picked: { tool: Tool; row: Row } | null;
  onPick: (p: { tool: Tool; row: Row }) => void;
  overlay: boolean;
  archetypeId: string;
}) {
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
          <td className="border-b border-r border-line px-3 py-1 align-middle">
            <EnterpriseLine row={row} archetypeId={archetypeId} overlay={overlay} bare />
          </td>
          {cols.flatMap((g) =>
            g.tools.map((t) => {
              const cell = cellFor(t, row);
              const selected = picked?.tool.id === t.id && picked.row.id === row.id;
              return (
                <td key={t.id} className="border-b border-l border-line p-[3px] align-middle">
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
