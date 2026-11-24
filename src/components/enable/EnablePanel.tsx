"use client";

/**
 * The Enable tab of a pattern: how to put it in place, as two folded steps that read the same
 * way, or three on a pattern the organisation hosts, where a step of choices (which platform, how
 * it is hosted there, which framework) sits between the controls and their settings. The enterprise controls, each saying what to do and why; then the same list as settings
 * of the cloud or tool it runs on, under the same headings: what to set, why, and the control
 * each delivers. The tab opens as those two lines
 * and nothing else; a step unfolds to its rows. Every control row is a numbered chip on the
 * drawing above, and every setting names the chips it delivers.
 *
 * A step also stands open while it holds what the reader asked for: the control lit on the
 * drawing, or the product a link opened. Once a product is chosen (a cloud above the drawing,
 * or a pill in the second step) every control also names that product's own settings for it;
 * on a hosted pattern that can be two products, the platform and the framework.
 * The pattern's governance guidance is prose, not steps, and lives under How it works.
 */
import { useState, type ReactNode } from "react";

import { controlName, isBaseline, productsForArchetype, status, statusFor } from "@/lib/data";
import type { Archetype, Mitigation, ProductSetting } from "@/lib/types";
import { hostingInEffect, MIX, NO_STACK, productShort, type CloudProduct, type Stack } from "@/components/cloud/model";
import { anyControlStatus, BASELINE_HELP, ControlTable } from "./ControlTable";
import { baselineNotPinned, controlGroups } from "./model";
import { ChooseBuild } from "./ChooseBuild";
import { ProductSettings } from "./ProductSettings";

const anyStatus = Object.values(status).some((s) => s.status);

/** "3 of 5 enabled", once the organisation has set any status at all. */
function Progress({ controls }: { controls: Mitigation[] }) {
  if (!anyStatus || !controls.length) return null;
  const enabled = controls.filter((m) => statusFor(m.id) === "enabled").length;
  return <span className="text-[12px] font-normal text-ink-3">{enabled} of {controls.length} enabled</span>;
}

type StepId = "controls" | "choose" | "tools";

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

const count = (text: string) => <span className="text-[12px] font-normal text-ink-3">{text}</span>;

export function EnablePanel({
  archetype,
  open,
  onOpen,
  onShowDrawing,
  tool: productId,
  onPickTool,
  onDropFramework,
  cloud = null,
  host = null,
  onHost,
  stack = NO_STACK,
  onStack,
  hiddenSettings = [],
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
  /** On a hosted pattern: lets go of the framework and keeps the platform. */
  onDropFramework?: () => void;
  /** The cloud the pattern is shown as built on, or null for the cloud-neutral pattern. */
  cloud?: CloudProduct | null;
  /** The hosting option chosen on that platform, or null for the one its mapping describes. */
  host?: string | null;
  onHost?: (optionId: string | null) => void;
  /** Where the platform has packs: the pack and add-ons chosen. */
  stack?: Stack;
  onStack?: (stack: Stack) => void;
  /** The platform's settings rows the stack leaves out: their products are not in it. */
  hiddenSettings?: ProductSetting[];
}) {
  const groups = controlGroups(archetype);
  const controls = groups.flatMap((g) => g.controls);
  const shared = controls.filter((m) => isBaseline(m.id)).length;
  const alsoNeeded = baselineNotPinned(archetype);
  const products = productsForArchetype(archetype.id);
  const picked = productId ? products.find((p) => p.id === productId) : undefined;
  // A hosted pattern has two separate choices: the platform it runs on (a cloud or the
  // organisation's own data centre) and the framework or server its own boxes are built with.
  const built = products.some((p) => p.kind === "cloud");
  const platform = cloud ?? (picked?.kind === "cloud" ? picked : null);
  const framework = built && picked?.kind === "tool" ? picked : null;
  // What the control rows name settings for: both choices on a hosted pattern, else the one product open.
  const chosen = built ? [platform, framework].filter((p): p is NonNullable<typeof p> => Boolean(p)) : picked ? [picked] : [];
  const platformCount = products.filter((p) => p.kind === "cloud").length;
  const frameworkCount = products.length - platformCount;
  // How it is hosted on the chosen platform, where its options have been compared.
  const inEffect = platform ? hostingInEffect(platform, host) : undefined;
  // The stack chosen, where the platform has packs, in a few words.
  const packs = platform?.kind === "cloud" ? platform.cloud.packs ?? [] : [];
  const stackWords = [stack.pack === MIX ? "Your own mix" : packs.find((p) => p.id === stack.pack)?.name, ...stack.addons.map((id) => packs.find((p) => p.id === id)?.name)].filter(Boolean).join(" + ");

  // Every step starts folded. A step also stands open while it holds the lit control or the
  // opened product, so a chip picked on the drawing or a product link lands on a visible row.
  const [unfolded, setUnfolded] = useState<Set<StepId>>(new Set());
  // A chip lit from a setting row lights the drawing without unfolding the controls: the reader
  // is working down a product's settings, not the control list.
  const [litFromTools, setLitFromTools] = useState(false);
  const holds: Record<StepId, boolean> = {
    controls: !litFromTools && controls.some((m) => m.id === open),
    // Choosing is the reader's own act: the step opens only by hand.
    choose: false,
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
  const short = chosen.length ? chosen.map(productShort).join(" and ") : null;

  const intro = built ? "The controls, how you build it, then the settings." : "The controls, then the settings in your product."

  const controlsStep = (
      <Step
        n={1}
        id="controls"
        title="Enterprise controls"
        aside={
          <>
            {count(`${controls.length} controls`)}
            <Progress controls={controls} />
          </>
        }
        expanded={isOpen("controls")}
        onToggle={() => toggle("controls")}
        lead={`What this pattern needs in place, by category.${short ? ` Each names the ${short} settings that deliver it.` : ""} Open a row for what to do and why.`}
      >
        <p className="mb-3 max-w-3xl text-[12px] leading-snug text-ink-3" data-status-hint>
          {shared > 0 && <span title={BASELINE_HELP}>{shared} of the {controls.length} are needed by every AI deployment, so you may already have them. </span>}
          {anyControlStatus ? (
            <>
              Status comes from your organisation&rsquo;s controls in <span className="ident">data/org/controls.yaml</span>.
            </>
          ) : (
            <>
              No status recorded yet: list your own controls in <span className="ident">data/org/controls.yaml</span> and each row shows whether it is in place.
            </>
          )}
        </p>
        <ControlTable
          groups={groups}
          archetype={archetype}
          open={open}
          onOpen={(id) => {
            setLitFromTools(false);
            onOpen(id);
          }}
          onShowDrawing={onShowDrawing}
          products={chosen}
        />
        {alsoNeeded.length > 0 && (
          <p className="mt-2 text-[12px] leading-snug text-ink-3" title={BASELINE_HELP}>
            <span className="font-semibold text-ink-2">Also needed by every AI deployment, not drawn here: </span>
            {alsoNeeded.map((m) => controlName(m.id)).join(" · ")}
          </p>
        )}
      </Step>
  );
  const chooseStep = built && (
        <Step
          n={2}
          id="choose"
          title={"Choose how you\u2019ll build it"}
          aside={count(
            [
              platform ? platform.cloud.short : `${platformCount} platforms`,
              inEffect ? inEffect.name : null,
              stackWords || null,
              framework ? framework.name : frameworkCount ? `${frameworkCount} ${frameworkCount === 1 ? "framework" : "frameworks"}` : null,
            ]
              .filter(Boolean)
              .join(" · "),
          )}
          expanded={isOpen("choose")}
          onToggle={() => toggle("choose")}
          lead={packs.length ? "Where it runs, how it is hosted there, the products that fill its boxes, and what you build it with." : "Where it runs, how it is hosted there, and what you build it with."}
        >
          <ChooseBuild
            archetype={archetype}
            products={products}
            platform={platform}
            framework={framework}
            host={host}
            stack={stack}
            onStack={(s) => onStack?.(s)}
            onPickPlatform={(id) => onPickTool(id)}
            onPickHost={(id) => onHost?.(id)}
            onPickFramework={(id) => {
              if (id === null && onDropFramework) onDropFramework();
              else onPickTool(id ?? platform?.id ?? null);
            }}
          />
        </Step>
  );
  const toolsStep = (
      <Step
        n={built ? 3 : 2}
        id="tools"
        title={built ? "Set it" : "Set it in your product"}
        aside={products.length ? count(built ? (chosen.length ? `${chosen.reduce((n, p) => n + p.settings.length, 0)} settings` : "nothing chosen yet") : `${products.length} products`) : undefined}
        expanded={isOpen("tools")}
        onToggle={() => toggle("tools")}
        lead={
          !products.length
            ? "No product of this kind is catalogued yet. Build it to the controls above."
            : built
              ? chosen.length
                ? `The recommended value for each setting of ${chosen.map((p) => p.name).join(" and ")}, and the controls it delivers.`
                : "The recommended value for each setting of what you chose in step 2, and the controls it delivers."
              : "The recommended value for each setting of your product, and the controls it delivers. Pick your product first."
        }
      >
        {products.length > 0 && (
          <ProductSettings
            archetype={archetype}
            products={products}
            selected={picked?.id ?? platform?.id ?? null}
            platform={platform}
            hidden={hiddenSettings}
            stackName={stackWords || null}
            onPick={(id) => onPickTool(id ?? platform?.id ?? null)}
            lit={open}
            onLight={(id) => {
              setLitFromTools(true);
              onOpen(open === id ? null : id);
            }}
          />
        )}
      </Step>
  );

  return (
    <div className="space-y-2.5">
      <p className="mb-3 max-w-3xl text-[13px] leading-relaxed text-ink-2">
        {intro} Each control is a numbered chip on the drawing.
      </p>
      {controlsStep}
      {chooseStep}
      {toolsStep}
    </div>
  );
}
