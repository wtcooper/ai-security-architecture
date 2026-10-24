"use client";

/**
 * The Enable tab of an architecture: what to put in place, in the order an organisation puts it
 * in place. The foundations every AI deployment needs, what the surface adds, what this use case
 * adds, then the tools — build, buy or both — and how far each covers the rest. Every row is a
 * numbered chip on the drawing above, so the requirements and where they go read as one.
 * The four steps open folded, so the tab first reads as the plan; a step unfolds to its rows.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

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

type StepId = "foundations" | "surface" | "use-case" | "tools";

function Step({
  n,
  id,
  title,
  lead,
  aside,
  chips,
  expanded,
  onToggle,
  children,
}: {
  n: number;
  id: StepId;
  title: string;
  lead: string;
  aside?: ReactNode;
  /** The pin numbers this step covers, shown while it is folded. */
  chips?: number[];
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 rounded-xl border border-line bg-paper">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`${id}-body`}
        className="flex w-full items-start gap-3 rounded-xl px-4 py-4 text-left transition-colors hover:bg-mist/50"
      >
        <span className="display flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[14px] font-bold text-white">{n}</span>
        <span className="min-w-0 flex-1">
          <span className="display flex flex-wrap items-baseline gap-x-3 text-[18px] font-bold leading-tight text-ink">
            {title}
            {aside}
          </span>
          <span className="mt-1 block max-w-3xl text-[13.5px] leading-relaxed text-ink-2">{lead}</span>
          {!expanded && chips && chips.length > 0 && (
            <span className="mt-2 flex flex-wrap gap-1" aria-label="Pins on the drawing">
              {chips.map((c) => (
                <span key={c} className="flex h-[19px] w-[19px] items-center justify-center rounded-full border border-chip bg-chip-soft text-[10px] font-bold text-chip">
                  {c}
                </span>
              ))}
            </span>
          )}
        </span>
        <svg width="14" height="14" viewBox="0 0 12 12" className={`mt-2 shrink-0 text-ink-3 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden>
          <path d="M 2 4 L 6 8 L 10 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {expanded && (
        <div id={`${id}-body`} className="px-4 pb-5 sm:pl-[60px]">
          {children}
        </div>
      )}
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

  const drawnAdditions = byPin(additions);
  const pinNumber = (m: Mitigation) => archetype.mitigations.indexOf(m.id) + 1;

  // Steps the reader unfolded. A step also stands open while it holds the lit capability or the
  // open product, so a chip picked on the drawing or a product link always lands on a visible row.
  const [unfolded, setUnfolded] = useState<Set<StepId>>(new Set());
  const holds: Record<StepId, boolean> = {
    foundations: drawnFoundations.some((m) => m.id === open),
    surface: drawnBaseline.some((m) => m.id === open),
    "use-case": drawnAdditions.some((m) => m.id === open),
    tools: Boolean(tool),
  };
  const isOpen = (id: StepId) => unfolded.has(id) || holds[id];
  const toggle = (id: StepId) => {
    const next = new Set(unfolded);
    if (isOpen(id)) {
      next.delete(id);
      // Folding a step lets go of what held it open.
      if (holds[id] && id === "tools") onPickTool(null);
      else if (holds[id]) onOpen(null);
    } else next.add(id);
    setUnfolded(next);
  };

  const recordRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tool && !focus) recordRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [tool, focus]);

  const table = (capabilities: Mitigation[]) => (
    <CapabilityTable capabilities={capabilities} archetype={archetype} open={open} onOpen={onOpen} onShowDrawing={onShowDrawing} />
  );

  return (
    <div className="space-y-3">
      <p className="mb-4 max-w-3xl text-[13px] leading-relaxed text-ink-2">
        Everything this architecture needs in place, in the order an organisation puts it in place. Open a step for its capabilities;
        each is a numbered chip on the drawing. Open one to light it and read how to put it in place, or pick a chip on the drawing to
        open its row.
      </p>

      <Step
        n={1}
        id="foundations"
        title="Enterprise foundations"
        aside={<Progress capabilities={drawnFoundations} />}
        chips={drawnFoundations.map(pinNumber)}
        expanded={isOpen("foundations")}
        onToggle={() => toggle("foundations")}
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
        chips={drawnBaseline.map(pinNumber)}
        expanded={isOpen("surface")}
        onToggle={() => toggle("surface")}
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
        chips={drawnAdditions.map(pinNumber)}
        expanded={isOpen("use-case")}
        onToggle={() => toggle("use-case")}
        lead={`What ${archetype.title} needs beyond the foundations and its surface baseline.`}
      >
        {additions.length ? table(drawnAdditions) : <p className="text-[13px] text-ink-3">Nothing beyond the foundations and the surface baseline.</p>}
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
        aside={tools.length ? <span className="text-[12px] font-normal text-ink-3">{tools.length} products</span> : undefined}
        expanded={isOpen("tools")}
        onToggle={() => toggle("tools")}
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
