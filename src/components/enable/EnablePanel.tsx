"use client";

/**
 * The Enable tab of a pattern: how to put it in place, as a short list of folded steps. What to
 * do (the plan, from the pattern's guidance); the enterprise controls, by NIST CSF category;
 * then the settings of the cloud or tool it runs on. The tab opens as that list and nothing
 * else, so it first reads as the plan; a step unfolds to its rows. Every control row is a
 * numbered chip on the drawing above, and every setting names the chips it delivers.
 *
 * A step also stands open while it holds what the reader asked for: the control lit on the
 * drawing, or the product a link opened. With a cloud chosen above the drawing, every control
 * names that cloud's own settings and the last step leads with what plays each component.
 */
import { useState, type ReactNode } from "react";

import { Prose } from "@/components/Prose";
import { capabilityName, guidanceByArchetype, isBaseline, productsForArchetype, status, statusFor } from "@/lib/data";
import type { Archetype, Mitigation } from "@/lib/types";
import type { CloudProduct } from "@/components/cloud/model";
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

type StepId = "plan" | "controls" | "tools";

function Step({
  n,
  id,
  title,
  lead,
  aside,
  expanded,
  onToggle,
  children,
}: {
  n: number;
  id: StepId;
  title: string;
  /** One line: what the step is for. */
  lead: string;
  aside?: ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 rounded-xl border border-line bg-paper">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`${id}-body`}
        className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-mist/50"
      >
        <span className="display flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-white">{n}</span>
        <span className="min-w-0 flex-1">
          <span className="display flex flex-wrap items-baseline gap-x-3 text-[16.5px] font-bold leading-tight text-ink">
            {title}
            {aside}
          </span>
          <span className="mt-0.5 block text-[13px] leading-snug text-ink-2">{lead}</span>
        </span>
        <svg width="14" height="14" viewBox="0 0 12 12" className={`shrink-0 text-ink-3 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden>
          <path d="M 2 4 L 6 8 L 10 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {expanded && (
        <div id={`${id}-body`} className="border-t border-line px-4 pb-5 pt-4 sm:pl-[56px]">
          {children}
        </div>
      )}
    </section>
  );
}

/** The plan: every guidance action with its reasoning and the controls it relies on, then how to govern the pattern. */
export function EnablePlan({ archetype, onOpenControl }: { archetype: Archetype; onOpenControl: (id: string) => void }) {
  const guidance = guidanceByArchetype.get(archetype.id);
  const actions = guidance?.items ?? [];
  const openControl = onOpenControl;
  return (
    <>
          <ol className="space-y-4">
            {actions.map((item, i) => (
              <li key={item.title} className="flex gap-3" data-action>
                <span className="ident mt-0.5 w-4 shrink-0 text-right text-[12px] text-ink-3">{i + 1}</span>
                <div className="min-w-0 max-w-3xl">
                  <p className="text-[13.5px] font-semibold leading-snug text-ink">{item.title}</p>
                  <div className="mt-1"><Prose blocks={item.body} size="sm" /></div>
                  <p className="mt-1.5 text-[12px] leading-snug text-ink-3">
                    Controls:{" "}
                    {item.mitigations.filter((id) => archetype.mitigations.includes(id)).map((id, k) => (
                      <span key={id}>
                        {k > 0 && " · "}
                        <button type="button" onClick={() => openControl(id)} className="text-ink-2 hover:text-introduced hover:underline">
                          {archetype.mitigations.indexOf(id) + 1} {capabilityName(id)}
                        </button>
                      </span>
                    ))}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          {guidance && guidance.overview.length > 0 && (
            <details className="mt-4 max-w-3xl">
              <summary className="cursor-pointer text-[12.5px] font-semibold text-ink-2">How to govern this pattern</summary>
              <div className="mt-2"><Prose blocks={guidance.overview} size="sm" /></div>
            </details>
          )}
    </>
  );
}

const count = (text: string) => <span className="text-[12px] font-normal text-ink-3">{text}</span>;

export function EnablePanel({
  archetype,
  open,
  onOpen,
  onShowDrawing,
  tool: productId,
  onPickTool,
  cloud = null,
}: {
  archetype: Archetype;
  /** The control row that is open, and lit on the drawing. */
  open: string | null;
  onOpen: (id: string | null) => void;
  onShowDrawing: () => void;
  /** The product a link or the reader opened in the last step: a tool or a cloud id. */
  tool: string | null;
  focus?: string | null;
  onPickTool: (productId: string | null) => void;
  /** The cloud the pattern is shown as built on, or null for the cloud-neutral pattern. */
  cloud?: CloudProduct | null;
}) {
  const groups = controlGroups(archetype);
  const controls = groups.flatMap((g) => g.capabilities);
  const shared = controls.filter((m) => isBaseline(m.id)).length;
  const alsoNeeded = baselineNotPinned(archetype);
  const guidance = guidanceByArchetype.get(archetype.id);
  const actions = guidance?.items ?? [];
  const products = productsForArchetype(archetype.id);
  // The open product is the one the reader picked, or else the cloud the pattern is shown on.
  const product = (productId ? products.find((p) => p.id === productId) : undefined) ?? cloud ?? undefined;
  const built = products.some((p) => p.kind === "cloud");

  // Every step starts folded. A step also stands open while it holds the lit control or the
  // opened product, so a chip picked on the drawing or a product link lands on a visible row.
  const [unfolded, setUnfolded] = useState<Set<StepId>>(new Set());
  // A chip lit from a setting row lights the drawing without unfolding the controls: the reader
  // is working down a product's settings, not the control list.
  const [litFromTools, setLitFromTools] = useState(false);
  const holds: Record<StepId, boolean> = {
    plan: false,
    controls: !litFromTools && controls.some((m) => m.id === open),
    tools: Boolean(productId && products.some((p) => p.id === productId)),
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
  /** Opens a control's row from the plan: unfolds the controls and brings the row into view. */
  const openControl = (id: string) => {
    setLitFromTools(false);
    onOpen(id);
    requestAnimationFrame(() => document.getElementById(`control-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const steps: StepId[] = [...(actions.length ? (["plan"] as StepId[]) : []), "controls", "tools"];
  const n = (id: StepId) => steps.indexOf(id) + 1;

  return (
    <div className="space-y-2.5">
      <p className="mb-3 max-w-3xl text-[13px] leading-relaxed text-ink-2">
        {steps.length === 3 ? "Three" : "Two"} steps to run this pattern safely. Open a step to work through it. Each control is a numbered chip on the
        drawing: pick a chip to open its row.
      </p>

      {actions.length > 0 && (
        <Step
          n={n("plan")}
          id="plan"
          title="What to do"
          aside={count(`${actions.length} actions${guidance?.status === "draft" ? " · draft" : ""}`)}
          expanded={isOpen("plan")}
          onToggle={() => toggle("plan")}
          lead="The plan in plain words: what to put in place and why, before the detail of each control."
        >
          <EnablePlan archetype={archetype} onOpenControl={openControl} />
        </Step>
      )}

      <Step
        n={n("controls")}
        id="controls"
        title="Enterprise controls"
        aside={
          <>
            {count(`${controls.length} controls`)}
            <Progress capabilities={controls} />
          </>
        }
        expanded={isOpen("controls")}
        onToggle={() => toggle("controls")}
        lead={`The controls your organisation runs, whichever product is chosen, by NIST CSF category.${
          cloud ? ` Each names the ${cloud.cloud.short} setting that delivers it.` : ""
        }`}
      >
        {shared > 0 && (
          <p className="mb-3 max-w-3xl text-[12.5px] leading-snug text-ink-3" title={BASELINE_HELP}>
            {shared} of the {controls.length} are needed by every AI deployment, so they are set up once and reused. Open a row for how to put
            it in place.
          </p>
        )}
        <CapabilityTable
          groups={groups}
          archetype={archetype}
          open={open}
          onOpen={(id) => {
            setLitFromTools(false);
            onOpen(id);
          }}
          onShowDrawing={onShowDrawing}
          cloud={cloud}
        />
        {alsoNeeded.length > 0 && (
          <p className="mt-2 text-[12px] leading-snug text-ink-3" title={BASELINE_HELP}>
            <span className="font-semibold text-ink-2">Also needed by every AI deployment, not drawn here: </span>
            {alsoNeeded.map((m) => capabilityName(m.id)).join(" · ")}
          </p>
        )}
      </Step>

      <Step
        n={n("tools")}
        id="tools"
        title={built ? "Cloud & tool settings" : "Tool settings"}
        aside={products.length ? count(`${cloud ? `${cloud.cloud.short} · ` : ""}${products.length} products`) : undefined}
        expanded={isOpen("tools")}
        onToggle={() => toggle("tools")}
        lead={
          products.length
            ? built
              ? "What plays each component on the cloud you build on, and its security settings: where each is set, the value and why."
              : "The security settings of the product you choose: where each is set, the value to set it to and why."
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
