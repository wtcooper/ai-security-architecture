"use client";

/**
 * Experimental zone: five mockups of how the Tools tab, org data and the drawing could present
 * "what controls this type of application needs, who covers each one for a given product, and
 * whether we have it". Each mockup reuses the real architecture view — Overview, Sequence flows,
 * Capabilities and Risks are unchanged — and swaps only the bar above the drawing, the drawing's
 * chip colouring and the Tools panel. Option 5 also swaps the drawing itself.
 *
 * Shared by all five: tools always shown at full strength; the org switch sits directly above
 * the drawing; with it on, the drawing shows status.
 */
import { useMemo, useState } from "react";

import { ArchetypeView } from "@/components/reference/ArchetypeView";
import type { Highlight } from "@/components/reference/FlowDiagram";
import { archetypeById, archetypesInOrder, surfaces, toolsForArchetype } from "@/lib/data";
import type { Scenario } from "@/lib/types";
import { CanvasDrawing, CanvasPanel, useCanvasState } from "./Option5Canvas";
import { LayersBar, LayersPanel, useLayersPaint } from "./Option4Layers";
import { LensBar, LensPanel, useLens } from "./Option2Lens";
import { ScorecardBar, ScorecardPanel, useScorecardPaint } from "./Option3Scorecard";
import { SplitBar, SplitPanel, useSplitPaint } from "./Option1Split";

export const EXPERIMENTS = [
  {
    id: "exp-split",
    n: 1,
    title: "Split table",
    idea: "The Tools table, rebuilt: rows split into controls our enterprise layer provides, controls shared with the product, and controls only the product can enforce. Every cell says who covers it.",
  },
  {
    id: "exp-lens",
    n: 2,
    title: "Tool lens on the drawing",
    idea: "Pick a product above the drawing and every control chip recolours by who covers it for that product. The drawing becomes the overlay; the Tools tab lists the same answers grouped.",
  },
  {
    id: "exp-scorecard",
    n: 3,
    title: "Can we deploy it? scorecard",
    idea: "Task first: put two or three products side by side and turn each into an action list — what to switch on in the product, what our layer already does, what to buy, what nobody covers, what to ask the vendor.",
  },
  {
    id: "exp-layers",
    n: 4,
    title: "Defense layers",
    idea: "Controls grouped into seven defence layers. Our enterprise column fills once for every product; each product column shows only what that product adds. Left bar = who covers it, fill = our status.",
  },
  {
    id: "exp-canvas",
    n: 5,
    title: "Simpler drawing + side panel",
    idea: "A lower-density drawing: one card per component, named control badges instead of numbered dots, risks behind a switch. Click a badge and the side panel answers it for every product.",
  },
] as const;

export type ExperimentId = (typeof EXPERIMENTS)[number]["id"];
export const experimentById = new Map(EXPERIMENTS.map((e) => [e.id as string, e]));
export const DEFAULT_EXPERIMENT_ARCH = "archPersistentManagedAgents";

/** Only architectures with products recorded are worth a tools mockup. */
const withTools = archetypesInOrder.filter((a) => toolsForArchetype(a.id).length > 0);

export function ExperimentView({
  experimentId,
  archetypeId,
  onArchetype,
  onExperiment,
}: {
  experimentId: ExperimentId;
  archetypeId: string;
  onArchetype: (id: string) => void;
  onExperiment: (id: ExperimentId) => void;
}) {
  const archetype = archetypeById.get(archetypeId) ?? archetypeById.get(DEFAULT_EXPERIMENT_ARCH)!;
  const exp = experimentById.get(experimentId)!;
  const tools = toolsForArchetype(archetype.id);
  const walks = useMemo(
    () => [archetype.walkthrough, ...(archetype.scenarios ?? [])].filter(Boolean) as Scenario[],
    [archetype],
  );
  const [walkIndex, setWalkIndex] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [lastArch, setLastArch] = useState(archetype.id);
  if (lastArch !== archetype.id) {
    setLastArch(archetype.id);
    setWalkIndex(null);
    setHighlight(null);
  }
  const onWalk = (i: number | null) => {
    setWalkIndex(i);
    setHighlight(null);
  };
  const onHighlight = (h: Highlight | null) => {
    setHighlight(h);
    setWalkIndex(null);
  };

  // Each option's state lives here so its bar (above the drawing) and its panel (in the Tools tab) agree.
  const lens = useLens(archetype, tools);
  const canvas = useCanvasState(archetype.id);
  const splitPaint = useSplitPaint(archetype);
  const scorePaint = useScorecardPaint(archetype);
  const layersPaint = useLayersPaint(archetype);

  const slots = (() => {
    switch (experimentId) {
      case "exp-split":
        return { bar: <SplitBar archetype={archetype} />, paint: splitPaint, panel: <SplitPanel archetype={archetype} tools={tools} onHighlight={onHighlight} /> };
      case "exp-lens":
        return { bar: <LensBar archetype={archetype} tools={tools} lens={lens} />, paint: lens.paint, panel: <LensPanel archetype={archetype} tools={tools} lens={lens} highlight={highlight} onHighlight={onHighlight} /> };
      case "exp-scorecard":
        return { bar: <ScorecardBar archetype={archetype} />, paint: scorePaint, panel: <ScorecardPanel archetype={archetype} tools={tools} onHighlight={onHighlight} /> };
      case "exp-layers":
        return { bar: <LayersBar archetype={archetype} />, paint: layersPaint, panel: <LayersPanel archetype={archetype} tools={tools} onHighlight={onHighlight} /> };
      case "exp-canvas":
        return {
          bar: null,
          paint: null,
          panel: <CanvasPanel archetype={archetype} tools={tools} state={canvas} />,
          drawing: (walk: Scenario | null) => <CanvasDrawing archetype={archetype} tools={tools} walk={walk} state={canvas} />,
        };
    }
  })();

  return (
    <div className="mx-auto w-full max-w-[1500px] px-6 py-8">
      <div className="rounded-xl border border-dashed border-[#7c3aed]/50 bg-[#f6f2ff] px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="rounded-full bg-[#7c3aed] px-2 py-px font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white">Experimental</span>
          <span className="text-[12px] text-ink-2">Mockup {exp.n} of {EXPERIMENTS.length} · compare:</span>
          <div className="flex flex-wrap gap-1">
            {EXPERIMENTS.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => onExperiment(e.id)}
                className={`rounded-full border px-2.5 py-0.5 text-[12px] ${
                  e.id === experimentId ? "border-ink bg-ink font-semibold text-white" : "border-line-strong bg-paper text-ink-2 hover:border-ink hover:text-ink"
                }`}
              >
                {e.n}. {e.title}
              </button>
            ))}
          </div>
        </div>
        <h2 className="display mt-2.5 text-[20px] font-bold leading-tight text-ink">
          {exp.n}. {exp.title}
        </h2>
        <p className="mt-1 max-w-4xl text-[13px] leading-snug text-ink-2">{exp.idea}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12px] text-ink-2">
          <span className="eyebrow">Architecture</span>
          <select
            value={archetype.id}
            onChange={(e) => onArchetype(e.target.value)}
            className="w-full max-w-[420px] rounded-md border border-line-strong bg-paper px-2 py-1 text-[12.5px] font-semibold text-ink sm:w-auto"
          >
            {surfaces.map((s) => (
              <optgroup key={s.id} label={s.title}>
                {withTools
                  .filter((a) => a.surface === s.id)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({toolsForArchetype(a.id).length})
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          {archetype.id !== "archCodingAgentThirdParty" && (
            <button type="button" onClick={() => onArchetype("archCodingAgentThirdParty")} className="text-[11.5px] font-semibold text-introduced hover:underline">
              Try coding agents — full example org data
            </button>
          )}
          {archetype.id !== DEFAULT_EXPERIMENT_ARCH && (
            <button type="button" onClick={() => onArchetype(DEFAULT_EXPERIMENT_ARCH)} className="text-[11.5px] font-semibold text-introduced hover:underline">
              Back to Grok Bot &amp; Dots
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 max-w-3xl">
        <h3 className="display text-[17px] font-bold leading-tight text-ink">{archetype.title}</h3>
        <p className="mt-1 text-[12px] text-ink-3">
          {tools.map((t) => t.name).join(", ")} · {archetype.mitigations.length} reference controls · {archetype.risks.length} risks
        </p>
      </div>

      <ArchetypeView
        key={`${experimentId}:${archetype.id}`}
        archetype={archetype}
        walks={walks}
        walkIndex={walkIndex}
        onWalk={onWalk}
        highlight={highlight}
        onHighlight={onHighlight}
        toolId={null}
        onTool={() => {}}
        aboveDrawing={slots.bar}
        chipPaint={slots.paint}
        renderDrawing={slots.drawing}
        toolsPanel={slots.panel}
        initialTab="tools"
      />
    </div>
  );
}
