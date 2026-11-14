"use client";

/**
 * The Enable tab of a pattern: what an organisation needs in place to run this kind of
 * tool or application safely, in two steps. First the enterprise controls, grouped by NIST CSF
 * category; then the products it is built on or bought as, each with its
 * own settings and the baseline value for each. Every control row is a numbered chip on the
 * drawing above, and every setting names the chips it delivers, so the requirements and where
 * they go read as one. The controls open unfolded, since they are the plan; the products fold
 * until the reader picks one.
 */
import { useState, type ReactNode } from "react";

import { Prose } from "@/components/Prose";
import { capabilityName, guidanceByArchetype, isBaseline, productsForArchetype, status, statusFor } from "@/lib/data";
import type { Archetype, Mitigation } from "@/lib/types";
import { BASELINE_HELP, CapabilityTable } from "./CapabilityTable";
import { baselineNotPinned, controlGroups } from "./model";
import { ProductSettings } from "./ProductSettings";

const anyStatus = Object.values(status).some((s) => s.status);

/** "3 of 5 enabled", once the organisation has set any status at all. */
function Progress({ capabilities }: { capabilities: Mitigation[] }) {
  if (!anyStatus || !capabilities.length) return null;
  const enabled = capabilities.filter((m) => statusFor(m.id) === "enabled").length;
  return <span className="text-[12px] font-normal text-ink-3">{enabled} of {capabilities.length} enabled</span>;
}

type StepId = "controls" | "tools";

function Step({
  n,
  id,
  title,
  lead,
  aside,
  summary,
  expanded,
  onToggle,
  children,
}: {
  n: number;
  id: StepId;
  title: string;
  lead: string;
  aside?: ReactNode;
  /** What the step holds, shown while it is folded. */
  summary?: ReactNode;
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
          {!expanded && summary}
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

/** The pin numbers a folded step covers. */
function Chips({ numbers }: { numbers: number[] }) {
  return (
    <span className="flex flex-wrap gap-1" aria-label="Pins on the drawing">
      {numbers.map((c) => (
        <span key={c} className="flex h-[19px] w-[19px] items-center justify-center rounded-full border border-chip bg-chip-soft text-[10px] font-bold text-chip">
          {c}
        </span>
      ))}
    </span>
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
  const groups = controlGroups(archetype);
  const controls = groups.flatMap((g) => g.capabilities);
  const shared = controls.filter((m) => isBaseline(m.id)).length;
  const alsoNeeded = baselineNotPinned(archetype);
  const guidance = guidanceByArchetype.get(archetype.id);
  const products = productsForArchetype(archetype.id);
  const product = productId ? products.find((p) => p.id === productId) : undefined;
  const built = products.some((p) => p.kind === "cloud");
  const pinNumber = (m: Mitigation) => archetype.mitigations.indexOf(m.id) + 1;

  // The controls start unfolded and the products folded. A step also stands open while it holds
  // the lit capability or the open product, so a chip picked on the drawing or a product link
  // always lands on a visible row.
  const [unfolded, setUnfolded] = useState<Set<StepId>>(new Set(["controls"]));
  // A chip lit from a setting row lights the drawing without unfolding the controls: the reader
  // is working down a product's settings, not the control list.
  const [litFromTools, setLitFromTools] = useState(false);
  const holds: Record<StepId, boolean> = {
    controls: !litFromTools && controls.some((m) => m.id === open),
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

  return (
    <div className="space-y-3">
      <p className="mb-4 max-w-3xl text-[13px] leading-relaxed text-ink-2">
        What your organisation needs in place to run this pattern safely: the enterprise controls, then the settings of the{" "}
        {built ? "cloud and tools it is built on" : "product you choose"}. Each control is a numbered chip on the drawing. Open one to
        light it and read how to put it in place, or pick a chip on the drawing to open its row.
      </p>

      {guidance && guidance.items.length > 0 && (
        <section id="what-to-do" aria-labelledby="what-to-do-title" className="rounded-xl border border-line bg-paper px-4 py-4">
          <p id="what-to-do-title" className="display text-[16px] font-bold text-ink">
            What to do
            {guidance.status === "draft" && <span className="ml-2 text-[11.5px] font-normal text-ink-3">guidance in draft</span>}
          </p>
          <ol className="mt-2.5 gap-x-8 md:columns-2">
            {guidance.items.map((item, i) => (
              <li key={item.title} className="mb-2 flex break-inside-avoid gap-2.5 text-[13px] leading-snug text-ink">
                <span className="ident mt-px w-4 shrink-0 text-right text-ink-3">{i + 1}</span>
                <span className="min-w-0">
                  {item.title}
                  <span className="ml-1.5 inline-flex flex-wrap gap-1 align-middle">
                    {item.mitigations.filter((id) => archetype.mitigations.includes(id)).map((id) => (
                      <button
                        key={id}
                        type="button"
                        title={`${capabilityName(id)} — open its row`}
                        onClick={() => {
                          setLitFromTools(false);
                          onOpen(id);
                          requestAnimationFrame(() => document.getElementById(`control-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
                        }}
                        className={`flex h-[19px] w-[19px] items-center justify-center rounded-full border border-chip text-[10px] font-bold transition-colors ${
                          open === id ? "bg-chip text-white" : "bg-chip-soft text-chip hover:bg-chip hover:text-white"
                        }`}
                      >
                        {archetype.mitigations.indexOf(id) + 1}
                      </button>
                    ))}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <details className="mt-3">
            <summary className="cursor-pointer text-[12.5px] font-semibold text-ink-2">How to govern this pattern</summary>
            <div className="mt-2 max-w-3xl"><Prose blocks={guidance.overview} size="sm" /></div>
          </details>
        </section>
      )}

      <Step
        n={1}
        id="controls"
        title="Enterprise controls"
        aside={
          <>
            <span className="text-[12px] font-normal text-ink-3">{controls.length} controls</span>
            <Progress capabilities={controls} />
          </>
        }
        summary={
          <span className="mt-2 grid gap-x-4 gap-y-1.5 sm:grid-cols-[max-content_minmax(0,1fr)]">
            {groups.map((g) => (
              <span key={g.id} className="contents">
                <span className="text-[12px] font-semibold text-ink-2">
                  {g.title} <span className="ident ml-1 text-[10px] font-normal text-ink-3">{g.id}</span>
                </span>
                <Chips numbers={g.capabilities.map(pinNumber)} />
              </span>
            ))}
          </span>
        }
        expanded={isOpen("controls")}
        onToggle={() => toggle("controls")}
        lead={`The security controls your organisation runs, whichever product is chosen, grouped by NIST CSF category.${
          shared ? ` ${shared} of the ${controls.length} are needed by every AI deployment, so they are set up once and reused.` : ""
        }`}
      >
        <CapabilityTable
          groups={groups}
          archetype={archetype}
          open={open}
          onOpen={(id) => {
            setLitFromTools(false);
            onOpen(id);
          }}
          onShowDrawing={onShowDrawing}
        />
        {alsoNeeded.length > 0 && (
          <p className="mt-2 text-[12px] leading-snug text-ink-3" title={BASELINE_HELP}>
            <span className="font-semibold text-ink-2">Also needed by every AI deployment, not drawn here: </span>
            {alsoNeeded.map((m) => capabilityName(m.id)).join(" · ")}
          </p>
        )}
      </Step>

      <Step
        n={2}
        id="tools"
        title={built ? "Cloud & tool settings" : "Tool settings"}
        aside={products.length ? <span className="text-[12px] font-normal text-ink-3">{products.length} products</span> : undefined}
        expanded={isOpen("tools")}
        onToggle={() => toggle("tools")}
        lead={
          products.length
            ? `${built ? "The clouds this is built on and the frameworks it is built with" : "The products this is bought as"}. Pick one for its own security settings: where each is set, the baseline value to set it to and why, and the chips on the drawing it delivers. A pill is green once your organisation records it as enabled.`
            : "No product of this kind is catalogued yet. Build it to the controls above."
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
