"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RiskMap } from "@/components/map/RiskMap";
import { PHASE_META, PhaseRail } from "@/components/PhaseRail";
import { Prose } from "@/components/Prose";
import { componentTitle, controlsForRisk, overlayFor, riskCategories, risksInOrder } from "@/lib/data";
import { PHASES, type Phase } from "@/lib/types";

const FALLBACK = "Component highlights for this phase.";

export function TourExplorer() {
  // A shared ?risk=&phase= link opens where it says it will. This component renders on the
  // client (its page is Suspense-wrapped), so the params are available for initial state.
  const params = useSearchParams();
  const [riskIndex, setRiskIndex] = useState(() =>
    Math.max(0, risksInOrder.findIndex((r) => r.id === params.get("risk"))),
  );
  const [phaseIndex, setPhaseIndex] = useState(() =>
    Math.max(0, PHASES.indexOf(params.get("phase") as Phase)),
  );

  const risk = risksInOrder[riskIndex];
  const phase = PHASES[phaseIndex];
  const overlay = overlayFor(risk.id);
  const controls = controlsForRisk(risk.id);

  const active = overlay?.[phase] ?? [];
  const counts = PHASES.reduce(
    (acc, p) => ({ ...acc, [p]: overlay?.[p].length ?? 0 }),
    {} as Record<Phase, number>,
  );

  const stepNumber = riskIndex * 3 + phaseIndex + 1;
  const totalSteps = risksInOrder.length * 3;

  const go = useCallback(
    (delta: number) => {
      const next = stepNumber - 1 + delta;
      if (next < 0 || next >= totalSteps) return;
      setRiskIndex(Math.floor(next / 3));
      setPhaseIndex(next % 3);
    },
    [stepNumber, totalSteps],
  );

  // Keep the address bar in step, so the current view is always shareable.
  useEffect(() => {
    window.history.replaceState(null, "", `/map?risk=${risk.id}&phase=${phase}`);
  }, [risk.id, phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ["INPUT", "SELECT"].includes(e.target.tagName)) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const meta = PHASE_META[phase];

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0">
      {/* ---------------------------------------------------------------- panel */}
      <aside className="lg:w-[400px] xl:w-[440px] shrink-0 bg-paper border-b lg:border-b-0 lg:border-r border-line flex flex-col">
        <div className="px-6 pt-5 pb-4 border-b border-line">
          <div className="flex items-center justify-between gap-3">
            <span className="eyebrow">
              Risk {riskIndex + 1} of {risksInOrder.length}
            </span>
            <label className="sr-only" htmlFor="jump">
              Jump to risk
            </label>
            <select
              id="jump"
              value={risk.id}
              onChange={(e) => {
                setRiskIndex(risksInOrder.findIndex((r) => r.id === e.target.value));
                setPhaseIndex(0);
              }}
              className="max-w-[230px] truncate rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[13px] font-medium text-ink hover:border-line-strong transition-colors"
            >
              {riskCategories.map((cat) => (
                <optgroup key={cat.id} label={cat.title}>
                  {risksInOrder
                    .filter((r) => r.category === cat.id)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          <h1 className="display mt-3 text-[27px] font-bold leading-[1.12] text-ink">
            {risk.title}
          </h1>
          <p className="mt-1.5 text-[13px] text-ink-3">
            {riskCategories.find((c) => c.id === risk.category)?.title}
            {overlay?.source === "saif" && " · mapping from Google SAIF"}
          </p>
        </div>

        <div className="px-6 py-4 border-b border-line">
          <PhaseRail phase={phase} onChange={(p) => setPhaseIndex(PHASES.indexOf(p))} counts={counts} />
        </div>

        <div className="px-6 py-5 flex-1 overflow-y-auto">
          <p
            className="display text-[15px] font-semibold"
            style={{ color: meta.token }}
          >
            {meta.label}
          </p>
          <Prose
            blocks={risk.tourContent?.[phase] ?? [FALLBACK]}
            refs={risk.externalReferences}
            className="mt-2"
            size="sm"
          />

          <p className="eyebrow mt-6">
            {active.length} component{active.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {active.map((id) => (
              <li
                key={id}
                className="rounded-md px-2 py-[3px] text-[12px] font-medium"
                style={{ background: `color-mix(in srgb, ${meta.token} 10%, white)`, color: meta.token }}
              >
                {componentTitle(id)}
              </li>
            ))}
          </ul>

          {phase === "mitigated" && controls.length > 0 && (
            <div className="mt-6">
              <p className="eyebrow">Controls that address this</p>
              <ul className="mt-2 space-y-1.5">
                {controls.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/controls?control=${c.id}`}
                      className="flex items-start gap-2 text-[13.5px] text-ink-2 hover:text-mitigated transition-colors"
                    >
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-mitigated" />
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            href={`/risks?risk=${risk.id}`}
            className="mt-6 inline-block text-[13.5px] font-semibold text-introduced hover:underline"
          >
            Full risk detail →
          </Link>
        </div>

        <div className="border-t border-line px-6 py-3.5 flex items-center justify-between bg-paper">
          <button
            onClick={() => go(-1)}
            disabled={stepNumber === 1}
            className="text-[13.5px] font-semibold text-ink-2 hover:text-ink disabled:opacity-30 disabled:hover:text-ink-2 transition-colors"
          >
            ← Previous
          </button>
          <span className="ident">
            {stepNumber} / {totalSteps}
          </span>
          <button
            onClick={() => go(1)}
            disabled={stepNumber === totalSteps}
            className="text-[13.5px] font-semibold text-introduced hover:underline disabled:opacity-30 disabled:no-underline transition-opacity"
          >
            Next →
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ map */}
      <section className="flex-1 min-w-0 p-4 sm:p-6 flex flex-col">
        <div className="flex items-center justify-between gap-4 pb-3">
          <span className="ident ml-auto hidden sm:block">← → to step through</span>
        </div>
        <div className="flex-1 min-h-0">
          <RiskMap
            phase={phase}
            active={active}
            className="h-full w-full max-h-[calc(100vh-11rem)]"
          />
        </div>
      </section>
    </div>
  );
}
