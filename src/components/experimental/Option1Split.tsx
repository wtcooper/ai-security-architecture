"use client";

/**
 * Option 1 — Split table. The Tools grid kept as a table, with three changes: rows split by where
 * the reference puts the control (our layer / shared / inside the product), every cell answers
 * "who covers it" in words, and products are always columns. The technology-category column is
 * gone (it lives on the capability page). With org data on, cells take the product's status tint.
 */
import { useMemo, useRef, useEffect, useState } from "react";

import { STATUS_STYLE } from "@/components/StatusPill";
import type { Highlight } from "@/components/reference/FlowDiagram";
import { ControlRowDetail } from "@/components/tooling/ControlRowDetail";
import { ToolDetail } from "@/components/tooling/ToolDetail";
import { docsUrlFor } from "@/components/tooling/shared";
import { useOrgOverlay } from "@/components/tooling/overlay";
import { orgSurfaceStatusFor } from "@/lib/data";
import type { Archetype, Tool } from "@/lib/types";
import {
  controlOf,
  enterpriseStatus,
  fullName,
  PLACEMENT_META,
  placementFor,
  settingUrl,
  shortName,
  sitesFor,
  toolStatus,
  verdictFor,
  type Placement,
} from "./model";
import { AvailableTag, ChipNumber, chipNumber, countBy, DrawingBar, StatusLegend, StatusTag, statusPaint, VerdictLegend, VerdictWord, vendorName } from "./parts";

export function useSplitPaint(archetype: Archetype) {
  const overlay = useOrgOverlay();
  return useMemo(() => (overlay ? statusPaint(archetype) : null), [overlay, archetype]);
}

export function SplitBar({ archetype }: { archetype: Archetype }) {
  const overlay = useOrgOverlay();
  const counts = countBy(archetype.mitigations.map((id) => orgSurfaceStatusFor(id, archetype.surface)));
  return (
    <DrawingBar
      legend={
        overlay ? (
          <StatusLegend lead="Chips show our status" counts={counts} />
        ) : (
          <p className="text-[11.5px] text-ink-3">Chips show the reference controls. Switch org data on to colour them by our status.</p>
        )
      }
    />
  );
}

const PLACEMENTS: Placement[] = ["enterprise", "both", "product"];

export function SplitPanel({ archetype, tools, onHighlight }: { archetype: Archetype; tools: Tool[]; onHighlight: (h: Highlight | null) => void }) {
  const overlay = useOrgOverlay();
  const [picked, setPicked] = useState<{ toolId: string; capId: string } | null>(null);
  const [openTool, setOpenTool] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (picked || openTool) detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [picked, openTool]);

  const groups = PLACEMENTS.map((p) => ({ p, caps: archetype.mitigations.filter((c) => placementFor(archetype, c) === p) })).filter((g) => g.caps.length);
  const verdictCounts = countBy(tools.flatMap((t) => archetype.mitigations.map((c) => verdictFor(archetype, t, c))));
  const pickedTool = tools.find((t) => t.id === picked?.toolId);
  const shownTool = tools.find((t) => t.id === openTool);

  return (
    <div className="space-y-3">
      <p className="max-w-4xl text-[12.5px] leading-snug text-ink-2">
        {archetype.mitigations.length} reference controls for this type of application, split by where the reference
        architecture puts them. Each cell answers <em>who covers it</em> for that product. Click a cell for the product
        setting and our side of the control; click a control name to find it on the drawing.
      </p>
      <div className="rounded-xl border border-line bg-paper px-3 py-2">
        <VerdictLegend lead="Who covers it" counts={verdictCounts} />
        {overlay && (
          <p className="mt-1.5 text-[11.5px] text-ink-3">
            Cell tint = our recorded status for that product. &ldquo;Enforced at&rdquo; carries our enterprise status.
          </p>
        )}
      </div>

      <div className="max-h-[78vh] overflow-auto rounded-xl border border-line bg-paper">
        <table className="w-full border-separate border-spacing-0 text-[12px]">
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="min-w-[210px] border-b border-r border-line bg-mist px-3 py-2.5 text-left align-bottom text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">Control</th>
              <th className="min-w-[200px] border-b border-r border-line bg-mist px-3 py-2.5 text-left align-bottom text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">Enforced at</th>
              {tools.map((t) => (
                <th key={t.id} className="min-w-[128px] border-b border-l border-line bg-paper px-2 py-2 text-center align-bottom">
                  <span className="block text-[10.5px] font-medium text-ink-3">{vendorName(t)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPicked(null);
                      setOpenTool(openTool === t.id ? null : t.id);
                    }}
                    className="block w-full text-[12px] font-semibold leading-tight text-ink hover:text-introduced hover:underline"
                  >
                    {t.name}
                  </button>
                  {docsUrlFor(t) && (
                    <a href={docsUrlFor(t)} target="_blank" rel="noreferrer" className="text-[10px] font-medium text-ink-3 hover:text-introduced hover:underline">
                      vendor docs ↗
                    </a>
                  )}
                  {overlay && (
                    <span className="mt-1 block">
                      <AvailableTag tool={t} />
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <GroupRows key={g.p} archetype={archetype} tools={tools} placement={g.p} caps={g.caps} overlay={overlay} picked={picked} onPick={(p) => { setOpenTool(null); setPicked(p); }} onHighlight={onHighlight} />
            ))}
          </tbody>
        </table>
      </div>

      <div ref={detailRef} className="scroll-mt-20">
        {picked && pickedTool && (
          <div className="rounded-xl border border-line bg-paper px-5 py-4">
            <div className="mb-3 flex items-center justify-between gap-3 text-[12px]">
              <span className="eyebrow">{pickedTool.name} · {fullName(picked.capId)}</span>
              <button type="button" onClick={() => setPicked(null)} className="font-semibold text-introduced hover:underline">Close ×</button>
            </div>
            <ControlRowDetail tool={pickedTool} mitigationId={picked.capId} showTitle />
          </div>
        )}
        {shownTool && (
          <div className="rounded-xl border border-line bg-paper px-5 py-5">
            <div className="mb-3 flex items-center justify-between gap-3 text-[12px]">
              <span className="eyebrow">Product record</span>
              <button type="button" onClick={() => setOpenTool(null)} className="font-semibold text-introduced hover:underline">Close ×</button>
            </div>
            <ToolDetail tool={shownTool} />
          </div>
        )}
      </div>
    </div>
  );
}

function GroupRows({
  archetype,
  tools,
  placement,
  caps,
  overlay,
  picked,
  onPick,
  onHighlight,
}: {
  archetype: Archetype;
  tools: Tool[];
  placement: Placement;
  caps: string[];
  overlay: boolean;
  picked: { toolId: string; capId: string } | null;
  onPick: (p: { toolId: string; capId: string }) => void;
  onHighlight: (h: Highlight | null) => void;
}) {
  const meta = PLACEMENT_META[placement];
  return (
    <>
      <tr>
        <td colSpan={2 + tools.length} className="border-b border-t border-line bg-mist/80 px-3 py-1.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink">{meta.label}</span>
          <span className="ml-2 text-[11px] text-ink-3">{caps.length} · {meta.blurb}</span>
        </td>
      </tr>
      {caps.map((capId) => {
        const sites = sitesFor(archetype, capId);
        const ours = sites.filter((s) => s.side === "enterprise");
        const theirs = sites.filter((s) => s.side === "product");
        const ent = ours.length && overlay ? enterpriseStatus(capId, archetype.surface) : null;
        return (
          <tr key={capId}>
            <th scope="row" className="border-b border-r border-line bg-paper px-3 py-2 text-left align-top font-normal">
              <button type="button" onClick={() => onHighlight({ kind: "mitigation", id: capId })} className="flex items-start gap-2 text-left" title="Light this control on the drawing">
                <ChipNumber n={chipNumber(archetype, capId)} />
                <span>
                  <span className="block text-[12.5px] font-semibold leading-snug text-ink hover:text-introduced">{shortName(capId)}</span>
                  {shortName(capId) !== fullName(capId) && <span className="block text-[11px] leading-snug text-ink-3">{fullName(capId)}</span>}
                </span>
              </button>
            </th>
            <td className="border-b border-r border-line px-3 py-2 align-top text-[11.5px] leading-snug">
              {ours.length > 0 && (
                <p className="text-ink-2">
                  <span className="font-semibold text-ink">Ours:</span> {[...new Set(ours.map((s) => s.title))].join(" · ")}
                </p>
              )}
              {theirs.length > 0 && (
                <p className="text-ink-3">
                  <span className="font-semibold text-ink-2">Product:</span> {[...new Set(theirs.map((s) => s.title))].join(" · ")}
                </p>
              )}
              {ent && (
                <p className="mt-1 flex flex-wrap items-center gap-1.5">
                  <StatusTag status={ent.status} />
                  {ent.names[0] && <span className="text-[10.5px] text-ink-3">{ent.names.join(" · ")}</span>}
                </p>
              )}
            </td>
            {tools.map((t) => {
              const verdict = verdictFor(archetype, t, capId);
              const control = controlOf(t, capId);
              const url = settingUrl(control);
              const status = overlay ? toolStatus(t, capId)?.status : undefined;
              const tint = status ? STATUS_STYLE[status] : undefined;
              const selected = picked?.toolId === t.id && picked.capId === capId;
              return (
                <td key={t.id} className="border-b border-l border-line p-[3px] align-middle">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onPick({ toolId: t.id, capId })}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick({ toolId: t.id, capId })}
                    title={control?.mechanism ?? "No vendor record for this control yet."}
                    className={`flex min-h-[38px] w-full cursor-pointer flex-col items-center justify-center rounded-md border px-1.5 py-1 text-[11.5px] leading-tight ${selected ? "ring-2 ring-ink" : ""}`}
                    style={{ background: tint?.bg ?? "#fff", borderColor: tint?.border ?? "var(--line)", borderStyle: tint?.dashed ? "dashed" : "solid" }}
                  >
                    <VerdictWord verdict={verdict} />
                    {url && (
                      <a href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[10px] text-ink-3 hover:text-introduced hover:underline">
                        setting ↗
                      </a>
                    )}
                  </div>
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
}
