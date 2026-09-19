"use client";

/** Capabilities and their technology categories stay fixed; org data adds status and product columns. */
import { useEffect, useRef, useState } from "react";
import { MitigationDetail } from "@/components/mitigations/MitigationDetail";

import { AvailabilityPill } from "@/components/StatusPill";
import { categoryById, mitigationById, orgToolAvailableFor } from "@/lib/data";
import type { Tool } from "@/lib/types";
import { cellFor, columnGroups, type Cell, type Row, type RowGroup } from "./model";
import { CellDetail, CellHoverCard, CellTile, docsUrlFor } from "./shared";

export function GridView({
  tools,
  groups,
  overlay,
  archetypeId,
  onPickTool,
}: {
  tools: Tool[];
  groups: RowGroup[];
  overlay: boolean;
  archetypeId: string;
  /** Opens the product's full record beneath the grid. */
  onPickTool: (toolId: string) => void;
}) {
  const cols = columnGroups(overlay ? tools : []);
  const [picked, setPicked] = useState<{ tool: Tool; row: Row } | null>(null);
  // The hovered cell, with its rectangle, for the justification card.
  const [hover, setHover] = useState<{ tool: Tool; row: Row; cell: Cell; rect: DOMRect } | null>(null);
  const [taxonomy, setTaxonomy] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (taxonomy || (overlay && picked)) detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [taxonomy, picked, overlay]);
  const span = 2 + (overlay ? tools.length : 0);
  // With status shown, a product the organisation does not run fades so the gaps are the picture.
  const dim = (t: Tool) => overlay && !orgToolAvailableFor(t.id);
  // A single vendor needs no extra vendor heading; taxonomy-only mode has one header row.
  const headerRows = !cols.length ? 1 : cols.length > 1 ? 3 : 2;
  return (
    <div className="space-y-3">
      <div className="max-h-[75vh] overflow-auto rounded-xl border border-line bg-paper">
        <table className="w-full border-separate border-spacing-0 text-[12px]">
          <caption className="sr-only">Capabilities and technology categories{overlay ? ", with tools and status" : ""}</caption>
          <thead className="sticky top-0 z-20">
            <tr>
              {["Capabilities", "Technology categories"].map((label) => (
                <th key={label} scope="col" rowSpan={headerRows} className="min-w-[240px] border-b border-r border-line bg-mist px-3 py-3 text-left align-middle text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">{label}</th>
              ))}
              {!!cols.length && <th colSpan={tools.length} className="border-b border-l border-line bg-mist px-2 py-1.5 text-center text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">
                {archetypeId === "archPersonalAgent" ? "Tools and status · the user is the admin here" : "Tools and status"}
              </th>}
            </tr>
            {cols.length > 1 && (
              <tr>
                {cols.map((g) => (
                  <th key={g.vendorId} colSpan={g.tools.length} className="border-b border-l border-line bg-mist px-2 py-1 text-center text-[10.5px] font-medium text-ink-2">
                    {g.vendorName}
                  </th>
                ))}
              </tr>
            )}
            {!!cols.length && <tr>
              {cols.flatMap((g) =>
                g.tools.map((t) => (
                  <th key={t.id} className={`min-w-[124px] max-w-[160px] border-b border-l border-line bg-paper px-2 py-2 text-center align-middle ${dim(t) ? "opacity-40" : ""}`}>
                    <button
                      type="button"
                      onClick={() => { setPicked(null); setTaxonomy(null); setHover(null); onPickTool(t.id); }}
                      title="Open this product's record"
                      className="block w-full text-center text-[11.5px] font-semibold leading-tight text-ink hover:text-introduced hover:underline"
                    >
                      {t.name}
                    </button>
                    {docsUrlFor(t) && (
                      <a href={docsUrlFor(t)} target="_blank" rel="noreferrer" className="mt-0.5 inline-block text-[10px] font-medium text-ink-3 hover:text-introduced hover:underline">
                        vendor docs ↗
                      </a>
                    )}
                    {overlay && (
                      <span className="mt-1 block">
                        <AvailabilityPill available={orgToolAvailableFor(t.id)} compact />
                      </span>
                    )}
                  </th>
                )),
              )}
            </tr>}
          </thead>
          <tbody>
            {groups.map((group) => (
              <GroupRows key={group.id} group={group} cols={cols} span={span} picked={picked} onPick={(p) => { setPicked(p); setTaxonomy(null); setHover(null); }} onTaxonomy={(id) => { setTaxonomy(id); setPicked(null); setHover(null); }} overlay={overlay} archetypeId={archetypeId} dim={dim} onHover={setHover} />
            ))}
          </tbody>
        </table>
      </div>
      {overlay && hover && <CellHoverCard tool={hover.tool} row={hover.row} cell={hover.cell} overlay={overlay} rect={hover.rect} />}
      <div ref={detailRef} className="scroll-mt-20">
        {taxonomy && mitigationById.get(taxonomy) && <MitigationDetail mitigation={mitigationById.get(taxonomy)!} showOrg={overlay} onClose={() => setTaxonomy(null)} />}
        {overlay && picked && <CellDetail tool={picked.tool} row={picked.row} onClose={() => setPicked(null)} />}
      </div>
    </div>
  );
}

function GroupRows({
  group,
  cols,
  span,
  picked,
  onPick,
  onTaxonomy,
  overlay,
  archetypeId,
  dim,
  onHover,
}: {
  group: RowGroup;
  cols: ReturnType<typeof columnGroups>;
  span: number;
  picked: { tool: Tool; row: Row } | null;
  onPick: (p: { tool: Tool; row: Row }) => void;
  onTaxonomy: (id: string) => void;
  overlay: boolean;
  archetypeId: string;
  dim: (t: Tool) => boolean;
  onHover: (h: { tool: Tool; row: Row; cell: Cell; rect: DOMRect } | null) => void;
}) {
  return (
    <>
      <tr>
        <td colSpan={span} className="border-b border-t border-line bg-mist/70 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">
          {group.title}
        </td>
      </tr>
      {group.rows.map((row) => (
        <tr key={row.id}>
          <th scope="row" className="border-b border-r border-line bg-paper px-3 py-2 text-left align-top font-normal">
            <button onClick={() => onTaxonomy(row.capabilityId)} className="text-left text-[12px] font-semibold leading-snug text-ink hover:text-introduced hover:underline">{row.label}</button>
          </th>
          <td className="border-b border-r border-line px-3 py-2 align-top">
            <CategoryCell categories={row.categories} onSelect={() => onTaxonomy(row.capabilityId)} />
          </td>
          {cols.flatMap((g) =>
            g.tools.map((t) => {
              const cell = cellFor(t, row);
              const selected = picked?.tool.id === t.id && picked.row.id === row.id;
              return (
                <td
                  key={t.id}
                  className={`border-b border-l border-line p-[3px] align-middle ${dim(t) ? "opacity-40" : ""}`}
                  onMouseEnter={(e) => onHover({ tool: t, row, cell, rect: e.currentTarget.getBoundingClientRect() })}
                  onMouseLeave={() => onHover(null)}
                  onFocusCapture={(e) => onHover({ tool: t, row, cell, rect: e.currentTarget.getBoundingClientRect() })}
                  onBlurCapture={() => onHover(null)}
                >
                  <CellTile cell={cell} overlay={overlay} selected={selected} onClick={() => onPick({ tool: t, row })} />
                </td>
              );
            }),
          )}
        </tr>
      ))}
    </>
  );
}

function CategoryCell({ categories, onSelect }: { categories: string[]; onSelect: () => void }) {
  if (!categories.length) return <span className="text-[11px] text-ink-3">Process and people; no technology category</span>;
  return <div className="flex flex-wrap gap-1.5">
    {categories.map((id) => <button key={id} onClick={onSelect} title={categoryById.get(id)?.description}
      className="rounded-full border border-line bg-mist px-2 py-1 text-left text-[11px] font-medium leading-snug text-ink-2 hover:border-ink">
      {categoryById.get(id)?.title ?? id}
    </button>)}
  </div>;
}
