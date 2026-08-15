"use client";

/**
 * The rail beside the diagram — F5's "Insights" panel translated onto this framework's spine:
 * scenario walks over the canvas, the numbered capabilities that must be deployed (their
 * design-requirements list), and the coded risks pinned to the drawing (their OWASP list).
 * Every row links into the taxonomy tab that owns the entity.
 */
import Link from "next/link";

import { capabilityById, riskById, riskCode } from "@/lib/data";
import type { Archetype } from "@/lib/types";
import type { Highlight } from "./FlowDiagram";

interface InsightRailProps {
  archetype: Archetype;
  scenario: number | null;
  onScenario: (index: number | null) => void;
  highlight: Highlight | null;
  onHighlight: (h: Highlight | null) => void;
}

export function InsightRail({
  archetype,
  scenario,
  onScenario,
  highlight,
  onHighlight,
}: InsightRailProps) {
  const capabilityNotes = new Map<string, string[]>();
  for (const pin of archetype.pins.capabilities) {
    if (pin.note) {
      capabilityNotes.set(pin.capability, [
        ...(capabilityNotes.get(pin.capability) ?? []),
        pin.note,
      ]);
    }
  }
  const riskNotes = new Map<string, string[]>();
  for (const pin of archetype.pins.risks) {
    if (pin.note) riskNotes.set(pin.risk, [...(riskNotes.get(pin.risk) ?? []), pin.note]);
  }

  return (
    <div className="space-y-5">
      {(archetype.scenarios?.length ?? 0) > 0 && (
        <section>
          <p className="eyebrow">Scenario walks</p>
          <div className="mt-2 space-y-1.5">
            {archetype.scenarios!.map((s, i) => {
              const active = scenario === i;
              return (
                <button
                  key={s.title}
                  onClick={() => onScenario(active ? null : i)}
                  aria-pressed={active}
                  className={`block w-full rounded-lg border px-3 py-2 text-left text-[12.5px] leading-snug transition-colors ${
                    active
                      ? "border-mitigated bg-mitigated-soft font-semibold text-ink"
                      : "border-line bg-paper text-ink-2 hover:border-line-strong"
                  }`}
                >
                  {s.title}
                  <span className="ml-1.5 opacity-60">{s.steps.length} steps</span>
                </button>
              );
            })}
          </div>
          {scenario !== null && (
            <ol className="mt-2.5 space-y-1.5 border-l-2 border-mitigated-soft pl-3">
              {archetype.scenarios![scenario].steps.map((step, i) => (
                <li key={i} className="text-[12px] leading-snug text-ink-2">
                  <span className="font-semibold text-mitigated">{i + 1}.</span> {step.note}
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <section>
        <p className="eyebrow">Capabilities to deploy · {archetype.capabilities.length}</p>
        <p className="mt-1 text-[11.5px] leading-snug text-ink-3">
          The numbered chips on the drawing. Each number marks where the capability must sit.
        </p>
        <div className="mt-2 space-y-1">
          {archetype.capabilities.map((id, i) => {
            const capability = capabilityById.get(id);
            const active = highlight?.kind === "capability" && highlight.id === id;
            return (
              <div key={id}>
                <button
                  onClick={() => onHighlight(active ? null : { kind: "capability", id })}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${
                    active
                      ? "border-introduced bg-introduced-soft"
                      : "border-transparent hover:bg-mist"
                  }`}
                >
                  <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border border-introduced bg-introduced-soft text-[10.5px] font-bold text-introduced">
                    {i + 1}
                  </span>
                  <span className="text-[12.5px] leading-tight text-ink">
                    {capability?.title ?? id}
                  </span>
                </button>
                {active && (
                  <div className="mb-1 ml-8 mt-1 space-y-1">
                    {(capabilityNotes.get(id) ?? []).map((note, ni) => (
                      <p key={ni} className="text-[11.5px] leading-snug text-ink-2">
                        {note}
                      </p>
                    ))}
                    <Link
                      href={`/capabilities?capability=${id}`}
                      className="inline-block text-[11.5px] font-semibold text-introduced hover:underline"
                    >
                      Open on the Capabilities tab →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <p className="eyebrow">Risks on the drawing · {archetype.risks.length}</p>
        <p className="mt-1 text-[11.5px] leading-snug text-ink-3">
          CoSAI risks, tagged where they surface. Codes are stable across every architecture.
        </p>
        <div className="mt-2 space-y-1">
          {archetype.risks.map((id) => {
            const risk = riskById.get(id);
            const active = highlight?.kind === "risk" && highlight.id === id;
            return (
              <div key={id}>
                <button
                  onClick={() => onHighlight(active ? null : { kind: "risk", id })}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${
                    active ? "border-ink bg-mist" : "border-transparent hover:bg-mist"
                  }`}
                >
                  <span className="ident shrink-0 rounded-sm border border-line-strong bg-mist px-1 py-px text-[9.5px] font-bold text-ink-2">
                    {riskCode(id)}
                  </span>
                  <span className="text-[12.5px] leading-tight text-ink">{risk?.title ?? id}</span>
                </button>
                {active && (
                  <div className="mb-1 ml-8 mt-1 space-y-1">
                    {(riskNotes.get(id) ?? []).map((note, ni) => (
                      <p key={ni} className="text-[11.5px] leading-snug text-ink-2">
                        {note}
                      </p>
                    ))}
                    <Link
                      href={`/risks?risk=${id}`}
                      className="inline-block text-[11.5px] font-semibold text-introduced hover:underline"
                    >
                      Open on the Risks tab →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
