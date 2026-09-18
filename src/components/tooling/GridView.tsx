"use client";

/**
 * Three permanent taxonomy columns: CoSAI controls, MITRE methods, technology categories.
 * Each control spans its method rows so product evidence always describes one method.
 * The organization overlay adds in-cell crosswalks, surface status and product columns.
 */
import { useState } from "react";
import Link from "next/link";

import { AvailabilityPill, StatusPill } from "@/components/StatusPill";
import { archetypeById, capabilitiesForMitigations, mitigationById, org, orgSurfacePostureFor, orgSurfaceStatusFor, orgToolAvailableFor } from "@/lib/data";
import { frameworkHref, orgEntriesFor, type EntityKind } from "@/lib/frameworks";
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
  const span = 3 + (overlay ? tools.length : 0);
  // With status shown, a product the organisation does not run fades so the gaps are the picture.
  const dim = (t: Tool) => overlay && !orgToolAvailableFor(t.id);
  // A single vendor needs no extra vendor heading; taxonomy-only mode has one header row.
  const headerRows = !cols.length ? 1 : cols.length > 1 ? 3 : 2;
  return (
    <div className="space-y-3">
      <div className="max-h-[75vh] overflow-auto rounded-xl border border-line bg-paper">
        <table className="w-full border-separate border-spacing-0 text-[12px]">
          <caption className="sr-only">CoSAI controls, MITRE mitigations and technology capabilities{overlay ? ", with organization mappings, tools and status" : ""}</caption>
          <thead className="sticky top-0 z-20">
            <tr>
              {["CoSAI controls", "Mitigations", "Technology capabilities"].map((label) => (
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
                      onClick={() => onPickTool(t.id)}
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
              <GroupRows key={group.id} group={group} cols={cols} span={span} picked={picked} onPick={setPicked} overlay={overlay} archetypeId={archetypeId} dim={dim} onHover={setHover} />
            ))}
          </tbody>
        </table>
      </div>
      {overlay && hover && <CellHoverCard tool={hover.tool} row={hover.row} cell={hover.cell} overlay={overlay} rect={hover.rect} />}
      {overlay && picked && <CellDetail tool={picked.tool} row={picked.row} onClose={() => setPicked(null)} />}
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
  dim,
  onHover,
}: {
  group: RowGroup;
  cols: ReturnType<typeof columnGroups>;
  span: number;
  picked: { tool: Tool; row: Row } | null;
  onPick: (p: { tool: Tool; row: Row }) => void;
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
          {row.controlSpan > 0 && <th scope="row" rowSpan={row.controlSpan} className="border-b border-r border-line bg-paper px-3 py-3 text-left align-top font-normal">
            <Link href={`/controls?control=${row.controlId}`} className="block text-[12px] font-semibold leading-snug text-ink hover:text-introduced hover:underline">{row.label}</Link>
            {overlay && <OrgMappings kind="controls" id={row.controlId} />}
          </th>}
          <td className="border-b border-r border-line px-3 py-3 align-top">
            {row.mitigations.map((id) => <MitigationCell key={id} id={id} archetypeId={archetypeId} overlay={overlay} />)}
          </td>
          <td className="border-b border-r border-line px-3 py-3 align-top">
            <TechnologyCell mitigations={row.mitigations} overlay={overlay} />
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

/** Organization capability mappings augment the reference names; method/control links are derived. */
function OrgMappings({ kind, id }: { kind: EntityKind; id: string }) {
  const entries = orgEntriesFor(kind, id);
  if (!entries.length) return null;
  return <div className="mt-2 border-l-2 border-line pl-2">
    <p className="text-[10px] font-semibold text-ink-3">{org.example ? "Example org" : org.shortName ?? org.name}{kind !== "capabilities" ? " · via capabilities" : ""}</p>
    <ul className="mt-1 space-y-1">
      {entries.map((entry) => <li key={entry.frameworkId + ":" + entry.id}>
        <Link href={frameworkHref(entry.frameworkId, entry.id)} title={entry.frameworkName} className="text-[11px] leading-snug text-ink-2 hover:text-introduced hover:underline">
          {entry.label} <span className="text-[10px] text-ink-3">({entry.id})</span>
        </Link>
      </li>)}
    </ul>
  </div>;
}

function MitigationCell({ id, archetypeId, overlay }: { id: string; archetypeId: string; overlay: boolean }) {
  const method = mitigationById.get(id)!;
  const arch = archetypeById.get(archetypeId)!;
  const posture = overlay ? orgSurfacePostureFor(id, arch.surface) : undefined;
  return <div>
    <Link href={`/mitigations?mitigation=${id}`} className="text-[12px] font-semibold leading-snug text-ink hover:text-introduced hover:underline">{method.title}</Link>
    <p className="mt-1 text-[10px] text-ink-3">{id}</p>
    {overlay && <>
      <OrgMappings kind="mitigations" id={id} />
      <div className="mt-2"><StatusPill status={orgSurfaceStatusFor(id, arch.surface)} compact title={posture?.note} /></div>
      {posture?.technology && <p className="mt-1 text-[11px] text-ink-2" title={posture.note}>Org capabilities: {posture.technology}</p>}
    </>}
  </div>;
}

function TechnologyCell({ mitigations, overlay }: { mitigations: string[]; overlay: boolean }) {
  const capabilities = capabilitiesForMitigations(mitigations);
  if (!capabilities.length) return <span className="text-[11px] text-ink-3">No technology category mapped</span>;
  return <ul className="space-y-3">
    {capabilities.map((capability) => <li key={capability.id}>
      <Link href={`/capabilities?capability=${capability.id}`} title={capability.mitigationMappings.filter((m) => mitigations.includes(m.mitigation)).map((m) => m.rationale).join(" ")} className="text-[12px] font-medium leading-snug text-ink hover:text-introduced hover:underline">{capability.title}</Link>
      {overlay && <OrgMappings kind="capabilities" id={capability.id} />}
    </li>)}
  </ul>;
}
