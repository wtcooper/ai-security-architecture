"use client";

/**
 * The Enable tab of an architecture: what to put in place, in the order an organisation puts it
 * in place. The foundations every AI deployment needs, what the surface adds, what this use case
 * adds, then the products it is built on or bought as, each with its own settings and the
 * baseline value for each. Every capability row is a numbered chip on the drawing above, and
 * every setting names the chips it delivers, so the requirements and where they go read as one.
 * The four steps open folded, so the tab first reads as the plan; a step unfolds to its rows.
 */
import { useState, type ReactNode } from "react";

import { Prose } from "@/components/Prose";
import { additionsFor, capabilityName, guidanceByArchetype, layerFor, productsForArchetype, status, statusFor } from "@/lib/data";
import type { Archetype, Mitigation } from "@/lib/types";
import { CapabilityTable } from "./CapabilityTable";
import { foundationGroups, surfaceBaseline } from "./model";
import { ProductSettings } from "./ProductSettings";

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
  tool: productId,
  onPickTool,
}: {
  archetype: Archetype;
  /** The capability row that is open, and lit on the drawing. */
  open: string | null;
  onOpen: (id: string | null) => void;
  onShowDrawing: () => void;
  /** The product open in the tools step: a tool or a cloud id. */
  tool: string | null;
  focus?: string | null;
  onPickTool: (productId: string | null) => void;
}) {
  const pinned = new Set(archetype.mitigations);
  const foundations = foundationGroups().flatMap((g) => g.capabilities);
  const baseline = surfaceBaseline(archetype.surface);
  const additions = additionsFor(archetype);
  const guidance = guidanceByArchetype.get(archetype.id);
  const products = productsForArchetype(archetype.id);
  const product = productId ? products.find((p) => p.id === productId) : undefined;
  // In pin order, so the rows count up with the chips on the drawing.
  const byPin = (list: Mitigation[]) => list.filter((m) => pinned.has(m.id)).sort((a, b) => archetype.mitigations.indexOf(a.id) - archetype.mitigations.indexOf(b.id));
  const drawnFoundations = byPin(foundations.filter((m) => layerFor(m.id, archetype) === "foundation"));
  const drawnBaseline = byPin(baseline.capabilities.filter((m) => layerFor(m.id, archetype) === "surface"));

  const drawnAdditions = byPin(additions);
  const pinNumber = (m: Mitigation) => archetype.mitigations.indexOf(m.id) + 1;

  // Steps the reader unfolded. A step also stands open while it holds the lit capability or the
  // open product, so a chip picked on the drawing or a product link always lands on a visible row.
  const [unfolded, setUnfolded] = useState<Set<StepId>>(new Set());
  // A chip lit from a setting row lights the drawing without unfolding the step that holds its
  // capability row: the reader is working down a product's settings, not the capability list.
  const [litFromTools, setLitFromTools] = useState(false);
  const fromRows = !litFromTools;
  const holds: Record<StepId, boolean> = {
    foundations: fromRows && drawnFoundations.some((m) => m.id === open),
    surface: fromRows && drawnBaseline.some((m) => m.id === open),
    "use-case": fromRows && drawnAdditions.some((m) => m.id === open),
    tools: Boolean(product),
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

  const openRow = (id: string | null) => {
    setLitFromTools(false);
    onOpen(id);
  };
  const table = (capabilities: Mitigation[]) => (
    <CapabilityTable capabilities={capabilities} archetype={archetype} open={open} onOpen={openRow} onShowDrawing={onShowDrawing} />
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
        aside={products.length ? <span className="text-[12px] font-normal text-ink-3">{products.length} products</span> : undefined}
        expanded={isOpen("tools")}
        onToggle={() => toggle("tools")}
        lead={
          products.length
            ? "The products this is built on or bought as. Pick one for its own security settings: where each is set, the baseline value to set it to and why, and the chips on the drawing it delivers. A pill is green once your organisation records it as enabled."
            : "No product of this kind is catalogued yet. Build it to the capabilities above."
        }
      >
        {products.length > 0 && (
          <ProductSettings
            archetype={archetype}
            products={products}
            selected={product?.id ?? null}
            onPick={(id) => onPickTool(id)}
            lit={open}
            onLight={(id) => {
              setLitFromTools(true);
              onOpen(open === id ? null : id);
            }}
          />
        )}
      </Step>
    </div>
  );
}
