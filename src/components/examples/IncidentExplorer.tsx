"use client";

import { useState } from "react";
import Link from "next/link";
import { Chip } from "@/components/Chips";
import { RiskMap } from "@/components/map/RiskMap";
import { PHASE_META } from "@/components/PhaseRail";
import { componentTitle, controlTitle, incidents, riskTitle } from "@/lib/data";
import type { Incident, IncidentSource, Phase } from "@/lib/types";

export function IncidentExplorer() {
  const [incidentId, setIncidentId] = useState(incidents[0].id);
  const [stepIndex, setStepIndex] = useState(0);

  const incident = incidents.find((i) => i.id === incidentId)!;
  const step = incident.steps[stepIndex];
  const meta = PHASE_META[step.phase];

  const selectIncident = (id: string) => {
    setIncidentId(id);
    setStepIndex(0);
  };

  // Number every component this step touches, so the map reads as a numbered flow.
  const stepMarks = Object.fromEntries(step.components.map((c) => [c, step.n]));

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0">
      <aside className="lg:w-[430px] xl:w-[470px] shrink-0 bg-paper border-b lg:border-b-0 lg:border-r border-line flex flex-col">
        <div className="border-b border-line px-6 pt-5 pb-4">
          <p className="eyebrow">Real incidents on the CoSAI map</p>
          <label className="sr-only" htmlFor="incident">
            Choose an incident
          </label>
          <select
            id="incident"
            value={incidentId}
            onChange={(e) => selectIncident(e.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px] font-medium text-ink hover:border-line-strong transition-colors"
          >
            {incidents.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title}
              </option>
            ))}
          </select>

          <h1 className="display mt-4 text-[23px] font-bold leading-[1.2] text-ink">
            {incident.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="ident">{incident.dateRange}</span>
            <PerspectiveTag perspective={incident.perspective} />
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{incident.subtitle}</p>
        </div>

        <StepRail
          steps={incident.steps.map((s) => s.phase)}
          current={stepIndex}
          onSelect={setStepIndex}
        />

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="text-[12.5px] font-semibold" style={{ color: meta.token }}>
            Step {step.n} · {meta.label}
          </p>
          <h2 className="display mt-1 text-[17px] font-semibold leading-snug text-ink">
            {step.title}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{step.narrative}</p>

          <p className="eyebrow mt-5">Components</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {step.components.map((id) => (
              <li
                key={id}
                className="rounded-md px-2 py-[3px] text-[12px] font-medium"
                style={{
                  background: `color-mix(in srgb, ${meta.token} 10%, white)`,
                  color: meta.token,
                }}
              >
                {componentTitle(id)}
              </li>
            ))}
          </ul>

          {step.risks && step.risks.length > 0 && (
            <>
              <p className="eyebrow mt-5">CoSAI risks</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {step.risks.map((id) => (
                  <Link key={id} href={`/?risk=${id}&phase=${step.phase}`}>
                    <Chip tone="exposed">{riskTitle(id)}</Chip>
                  </Link>
                ))}
              </div>
            </>
          )}

          {step.phase === "mitigated" && (
            <>
              <p className="eyebrow mt-5">Controls that break this chain</p>
              <ul className="mt-2 space-y-1.5">
                {incident.controls.map((id) => (
                  <li key={id}>
                    <Link
                      href={`/controls?control=${id}`}
                      className="flex items-start gap-2 text-[13.5px] text-ink-2 hover:text-mitigated transition-colors"
                    >
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-mitigated" />
                      {controlTitle(id)}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {step.cves && step.cves.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {step.cves.map((cve) => (
                <a
                  key={cve}
                  href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ident rounded bg-exposed-soft px-1.5 py-[2px] text-exposed hover:underline"
                >
                  {cve}
                </a>
              ))}
            </div>
          )}

          <Sources sources={step.sources} label="Sources for this step" />
        </div>

        <div className="flex items-center justify-between border-t border-line bg-paper px-6 py-3.5">
          <button
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={stepIndex === 0}
            className="text-[13.5px] font-semibold text-ink-2 transition-colors hover:text-ink disabled:opacity-30"
          >
            ← Previous
          </button>
          <span className="ident">
            {stepIndex + 1} / {incident.steps.length}
          </span>
          <button
            onClick={() => setStepIndex((i) => Math.min(incident.steps.length - 1, i + 1))}
            disabled={stepIndex === incident.steps.length - 1}
            className="text-[13.5px] font-semibold text-introduced transition-opacity hover:underline disabled:opacity-30 disabled:no-underline"
          >
            Next →
          </button>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4 pb-3">
          <p className="text-[13px] text-ink-3">
            Attack path across the CoSAI component map
          </p>
          <div className="flex flex-wrap gap-1.5">
            {incident.patterns.map((p) => (
              <Chip key={p}>{p}</Chip>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1">
          <RiskMap
            phase={step.phase}
            active={step.components}
            stepMarks={stepMarks}
            className="h-full w-full max-h-[calc(100vh-15rem)]"
          />
        </div>

        <IncidentFooter incident={incident} />
      </section>
    </div>
  );
}

/** Horizontal spine of the incident: one segment per step, coloured by its phase. */
function StepRail({
  steps,
  current,
  onSelect,
}: {
  steps: Phase[];
  current: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="border-b border-line px-6 py-4">
      <div className="flex gap-1.5">
        {steps.map((phase, i) => {
          const active = i === current;
          const passed = i < current;
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              aria-label={`Step ${i + 1}, ${PHASE_META[phase].label}`}
              aria-current={active ? "step" : undefined}
              className="group flex-1 text-left"
            >
              <span
                className="block h-[3px] rounded-full transition-colors"
                style={{
                  background: active || passed ? PHASE_META[phase].token : "var(--line)",
                }}
              />
              <span
                className="ident mt-1.5 block transition-colors"
                style={{ color: active ? PHASE_META[phase].token : "var(--ink-3)" }}
              >
                {i + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PerspectiveTag({ perspective }: { perspective: Incident["perspective"] }) {
  const target = perspective === "target";
  return (
    <span
      className="rounded-full px-2.5 py-[3px] text-[11.5px] font-semibold"
      style={{
        background: target ? "var(--exposed-soft)" : "var(--introduced-soft)",
        color: target ? "var(--exposed)" : "var(--introduced)",
      }}
      title={
        target
          ? "The AI system was the target of the attack."
          : "An AI agent carried out the attack — the highlighted components belong to the attacker's stack."
      }
    >
      {target ? "AI system attacked" : "AI agent as attacker"}
    </span>
  );
}

function IncidentFooter({ incident }: { incident: Incident }) {
  return (
    <div className="mt-4 grid gap-5 rounded-xl border border-line bg-paper p-5 sm:grid-cols-2">
      <Sources sources={incident.sources} label="Reporting" />
      {incident.alsoSeen && incident.alsoSeen.length > 0 && (
        <div>
          <p className="eyebrow">Also seen</p>
          <ul className="mt-2 space-y-2.5">
            {incident.alsoSeen.map((r) => (
              <li key={r.title}>
                <p className="text-[13.5px] font-semibold text-ink">
                  {r.title}
                  {r.date && <span className="ml-1.5 font-normal text-ink-3">{r.date}</span>}
                </p>
                <p className="mt-0.5 text-[13px] leading-snug text-ink-2">{r.note}</p>
                {r.sources?.map((s) => (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 inline-block text-[12.5px] text-introduced hover:underline"
                  >
                    {s.publisher ?? s.title} ↗
                  </a>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Sources({ sources, label }: { sources?: IncidentSource[]; label: string }) {
  if (!sources?.length) return null;
  return (
    <div className="mt-5">
      <p className="eyebrow">{label}</p>
      <ul className="mt-2 space-y-1.5">
        {sources.map((s) => (
          <li key={s.url}>
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] leading-snug text-introduced hover:underline"
            >
              {s.title}
            </a>
            {(s.publisher || s.date) && (
              <span className="ml-1.5 text-[12.5px] text-ink-3">
                {[s.publisher, s.date].filter(Boolean).join(" · ")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
