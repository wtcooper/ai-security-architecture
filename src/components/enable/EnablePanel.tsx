"use client";

/**
 * The Enable tab of an architecture: what to put in place, in the order an organisation puts it
 * in place. The foundations every AI deployment needs, what the surface adds, what this use case
 * adds, then the tools — build, buy or both — and how far each covers the rest. Every row is a
 * numbered chip on the drawing above, so the requirements and where they go read as one.
 */
import { useEffect, useRef, type ReactNode } from "react";

import { Prose } from "@/components/Prose";
import { additionsFor, capabilityName, guidanceByArchetype, layerFor, status, statusFor, toolById, toolsForArchetype } from "@/lib/data";
import type { Archetype, Mitigation } from "@/lib/types";
import { CapabilityTable } from "./CapabilityTable";
import { foundationGroups, surfaceBaseline } from "./model";
import { ToolRecord } from "./ToolRecord";
import { ToolsMatrix } from "./ToolsMatrix";

const anyStatus = Object.values(status).some((s) => s.status);

/** "3 of 5 enabled", once the organisation has set any status at all. */
function Progress({ capabilities }: { capabilities: Mitigation[] }) {
  if (!anyStatus || !capabilities.length) return null;
  const enabled = capabilities.filter((m) => statusFor(m.id) === "enabled").length;
  return <span className="text-[12px] font-normal text-ink-3">{enabled} of {capabilities.length} enabled</span>;
}

function Step({ n, id, title, lead, aside, children }: { n: number; id: string; title: string; lead: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="flex items-start gap-3">
        <span className="display flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[14px] font-bold text-white">{n}</span>
        <div className="min-w-0 flex-1">
          <h3 className="display flex flex-wrap items-baseline gap-x-3 text-[18px] font-bold leading-tight text-ink">
            {title}
            {aside}
          </h3>
          <p className="mt-1 max-w-3xl text-[13.5px] leading-relaxed text-ink-2">{lead}</p>
        </div>
      </div>
      <div className="mt-4 sm:pl-11">{children}</div>
    </section>
  );
}

/** The layer's capabilities that are not drawn here, named in one line so nothing is silently dropped. */
function AlsoNeeded({ capabilities, label }: { capabilities: Mitigation[]; label: string }) {
  if (!capabilities.length) return null;
  return (
    <p className="mt-2 text-[12px] leading-snug text-ink-3">
      <span className="font-semibold text-ink-2">{label}: </span>
      {capabilities.map((m) => capabilityName(m.id)).join(" · ")}
    </p>
  );
}

export function EnablePanel({
  archetype,
  open,
  onOpen,
  onShowDrawing,
  tool: toolId,
  focus,
  onPickTool,
}: {
  archetype: Archetype;
  /** The capability row that is open, and lit on the drawing. */
  open: string | null;
  onOpen: (id: string | null) => void;
  onShowDrawing: () => void;
  /** The product whose record is open beneath the tools grid, and the capability it is opened on. */
  tool: string | null;
  focus: string | null;
  onPickTool: (toolId: string | null, capabilityId?: string) => void;
}) {
  const pinned = new Set(archetype.mitigations);
  const foundations = foundationGroups().flatMap((g) => g.capabilities);
  const baseline = surfaceBaseline(archetype.surface);
  const additions = additionsFor(archetype);
  const guidance = guidanceByArchetype.get(archetype.id);
  const tools = toolsForArchetype(archetype.id);
  const tool = toolId ? toolById.get(toolId) : undefined;
  // In pin order, so the rows count up with the chips on the drawing.
  const byPin = (list: Mitigation[]) => list.filter((m) => pinned.has(m.id)).sort((a, b) => archetype.mitigations.indexOf(a.id) - archetype.mitigations.indexOf(b.id));
  const drawnFoundations = byPin(foundations.filter((m) => layerFor(m.id, archetype) === "foundation"));
  const drawnBaseline = byPin(baseline.capabilities.filter((m) => layerFor(m.id, archetype) === "surface"));

  const recordRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tool && !focus) recordRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [tool, focus]);

  const table = (capabilities: Mitigation[]) => (
    <CapabilityTable capabilities={capabilities} archetype={archetype} open={open} onOpen={onOpen} onShowDrawing={onShowDrawing} />
  );

  return (
    <div className="space-y-10">
      <p className="max-w-3xl text-[13px] leading-relaxed text-ink-2">
        Everything this architecture needs in place, in the order an organisation puts it in place. Each row is a numbered chip on the
        drawing: open one to light it and read how to put it in place, or pick a chip on the drawing to open its row.
      </p>

      <Step
        n={1}
        id="foundations"
        title="Enterprise foundations"
        aside={<Progress capabilities={drawnFoundations} />}
        lead="Set up once, and every AI deployment inherits them. Most of the risk on this architecture is reduced here, before any tool is chosen."
      >
        {table(drawnFoundations)}
        <AlsoNeeded label="Also org-wide, not drawn here" capabilities={foundations.filter((m) => !pinned.has(m.id))} />
      </Step>

      <Step
        n={2}
        id="surface"
        title={`${baseline.surface.title} baseline`}
        aside={<Progress capabilities={drawnBaseline} />}
        lead={baseline.blurb}
      >
        {drawnBaseline.length ? table(drawnBaseline) : <p className="text-[13px] text-ink-3">Nothing from the baseline is drawn on this architecture.</p>}
        <AlsoNeeded label="Also in the baseline, not drawn here" capabilities={baseline.capabilities.filter((m) => !pinned.has(m.id))} />
      </Step>

      <Step
        n={3}
        id="use-case"
        title="Use-case additions"
        aside={<Progress capabilities={additions} />}
        lead={`What ${archetype.title} needs beyond the foundations and its surface baseline.`}
      >
        {additions.length ? table(byPin(additions)) : <p className="text-[13px] text-ink-3">Nothing beyond the foundations and the surface baseline.</p>}
        {guidance && (
          <details className="mt-4 rounded-xl border border-line bg-paper px-4 py-3">
            <summary className="cursor-pointer text-[13px] font-semibold text-ink">How to govern this{guidance.status === "draft" ? " · draft" : ""}</summary>
            <div className="mt-2"><Prose blocks={guidance.overview} size="sm" /></div>
          </details>
        )}
      </Step>

      <Step
        n={4}
        id="tools"
        title="Tools"
        lead={
          tools.length
            ? "How each product's own settings cover the capabilities above. Pick a product or a cell for its settings, steps and vendor links. Anything not in the tool has to come from a foundation, the baseline or another product."
            : "No product of this kind is in the registry yet. Build it to the capabilities above, or onboard a product with the tooling-onboard skill."
        }
      >
        {tools.length > 0 && (
          <ToolsMatrix
            archetype={archetype}
            tools={tools}
            selected={tool ? { tool: tool.id, capability: focus ?? undefined } : null}
            onPick={(id, capability) => onPickTool(id, capability)}
          />
        )}
        {tool && (
          <div ref={recordRef} className="mt-6 scroll-mt-20 rounded-xl border border-line bg-paper px-5 py-5">
            <ToolRecord key={tool.id} tool={tool} focus={focus} onClose={() => onPickTool(null)} />
          </div>
        )}
      </Step>
    </div>
  );
}
