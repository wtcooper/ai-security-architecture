"use client";

/**
 * One incident, walked step by step across its reference architecture. The step reads on the
 * left, the drawing lights where it lands on the right, and the last step turns the drawing
 * back to its capability pins: the few that would have broken the chain, each a link to its
 * row on the architecture's Enable tab. Background, related incidents and sources sit below,
 * out of the way of the walk.
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { PHASE_META } from "@/components/PhaseRail";
import { FlowDiagram } from "@/components/reference/FlowDiagram";
import { FlowLegend } from "@/components/reference/FlowLegend";
import { archetypeById, capabilityName, incidentById, riskCode, riskTitle } from "@/lib/data";
import { categoryById } from "@/lib/incident-categories";
import type { Incident, IncidentSource, Phase } from "@/lib/types";
import { stepOverlay } from "./model";

/** Authored text marks file names and settings with backticks; show them as code, not as ticks. */
function Text({ children }: { children: string }) {
  const parts = children.split("`");
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <code key={i} className="rounded bg-mist px-1 py-px font-mono text-[0.88em] text-ink">
            {p}
          </code>
        ) : (
          p
        ),
      )}
    </>
  );
}

export function IncidentWalkthrough({ id }: { id: string }) {
  const incident = incidentById.get(id)!;
  const archetype = archetypeById.get(incident.archetype)!;
  const params = useSearchParams();
  const linked = Number(params.get("step"));
  const [index, setIndex] = useState(linked >= 1 && linked <= incident.steps.length ? linked - 1 : 0);
  const step = incident.steps[index];
  const meta = PHASE_META[step.phase];
  const last = incident.steps.length - 1;
  const breaking = step.phase === "mitigated";
  const breakIds = incident.breaks.map((b) => b.capability);
  const pinNumber = (capability: string) => archetype.mitigations.indexOf(capability) + 1;

  // The step stays in the URL, so a link can land on it. replaceState keeps the basePath.
  useEffect(() => {
    window.history.replaceState(null, "", index ? `?step=${index + 1}` : window.location.pathname);
  }, [index]);

  // Arrow keys walk the steps, unless the reader is typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (e.key === "ArrowRight") setIndex((i) => Math.min(last, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last]);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6">
      <Link href="/incidents" className="text-[13px] font-semibold text-introduced hover:underline">
        ← All incidents
      </Link>

      <header className="mt-3 max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="ident text-ink-3">{incident.dateRange}</span>
          <Link
            href={`/incidents?type=${incident.category}`}
            className="rounded-full border border-line bg-mist px-2.5 py-[2px] text-[11.5px] font-semibold text-ink-2 hover:underline"
          >
            {categoryById.get(incident.category)?.label}
          </Link>
          <PerspectiveTag perspective={incident.perspective} />
        </div>
        <h1 className="display mt-2 text-[26px] font-bold leading-tight text-ink sm:text-[30px]">{incident.title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
          <Text>{incident.subtitle}</Text>
        </p>
        {incident.caveat && (
          <p
            className="mt-3 rounded-lg border px-3 py-2 text-[12.5px] leading-snug"
            style={{ borderColor: "var(--band-data-edge)", background: "var(--band-data-fill)", color: "var(--ink)" }}
          >
            <span className="font-semibold">Caveat: </span>
            {incident.caveat}
          </p>
        )}
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
        <section aria-label="Steps" className="self-start rounded-xl border border-line bg-paper lg:sticky lg:top-20">
          <StepRail phases={incident.steps.map((s) => s.phase)} current={index} onSelect={setIndex} />
          <div className="px-5 py-5">
            <p className="text-[12.5px] font-semibold" style={{ color: meta.token }}>
              Step {step.n} of {incident.steps.length} · {breaking ? "Where it breaks" : meta.label}
            </p>
            <h2 className="display mt-1 text-[18px] font-semibold leading-snug text-ink">{step.title}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
              <Text>{step.narrative}</Text>
            </p>

            {breaking ? (
              <div className="mt-5">
                <p className="eyebrow">Capabilities that break this chain</p>
                <ul className="mt-2 space-y-2.5">
                  {[...incident.breaks].sort((x, y) => pinNumber(x.capability) - pinNumber(y.capability)).map((b) => (
                    <li key={b.capability} className="flex gap-2.5">
                      <span className="mt-px flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full border border-chip bg-chip text-[10.5px] font-bold text-white">
                        {pinNumber(b.capability)}
                      </span>
                      <span className="min-w-0 text-[13px] leading-snug">
                        <Link
                          href={`/reference?archetype=${archetype.id}&tab=enable#capability-${b.capability}`}
                          className="font-semibold text-ink hover:text-introduced hover:underline"
                        >
                          {capabilityName(b.capability)}
                        </Link>
                        <span className="block text-ink-2">{b.how}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/reference?archetype=${archetype.id}&tab=enable`}
                  className="mt-4 inline-block text-[13px] font-semibold text-mitigated hover:underline"
                >
                  Enable {archetype.title} securely →
                </Link>
              </div>
            ) : (
              step.risks &&
              step.risks.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {step.risks.map((r) => (
                    <Link
                      key={r}
                      href={`/risks?risk=${r}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-exposed-soft px-2.5 py-[3px] text-[12px] font-medium text-exposed hover:underline"
                    >
                      <span className="ident text-[10px] font-bold">{riskCode(r)}</span>
                      {riskTitle(r)}
                    </Link>
                  ))}
                </div>
              )
            )}

            {step.cves && step.cves.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {step.cves.map((cve) => (
                  <a
                    key={cve}
                    href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ident rounded bg-mist px-1.5 py-[2px] text-ink-2 hover:underline"
                  >
                    {cve}
                  </a>
                ))}
              </div>
            )}

            {step.sources && step.sources.length > 0 && (
              <p className="mt-4 text-[12px] leading-relaxed text-ink-3">
                Source:{" "}
                {step.sources.map((s, i) => (
                  <span key={s.url + s.title}>
                    {i > 0 && " · "}
                    <a href={s.url} target="_blank" rel="noreferrer" title={s.title} className="text-introduced hover:underline">
                      {s.publisher ?? s.title} ↗
                    </a>
                  </span>
                ))}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-line px-5 py-3">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="text-[13.5px] font-semibold text-ink-2 hover:text-ink disabled:opacity-30"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(last, i + 1))}
              disabled={index === last}
              className="text-[13.5px] font-semibold text-introduced hover:underline disabled:opacity-30 disabled:no-underline"
            >
              Next →
            </button>
          </div>
        </section>

        <section aria-label="Drawing" className="min-w-0 rounded-xl border border-line bg-paper px-2 pb-3 pt-2">
          <p className="px-3 pt-2 text-[13px] text-ink-3">
            {breaking ? "The capabilities that break it, lit on the " : "Where this step lands on the "}
            <Link href={`/reference?archetype=${archetype.id}`} className="font-semibold text-introduced hover:underline">
              {archetype.title}
            </Link>{" "}
            architecture
          </p>
          <FlowDiagram
            archetype={archetype}
            overlay={breaking ? null : stepOverlay(archetype, step)}
            pins="capabilities"
            highlight={breaking && breakIds.length ? { kind: "mitigation", id: breakIds[0], with: breakIds.slice(1) } : null}
          />
          <FlowLegend className="mt-2 px-3" risks={false} />
        </section>
      </div>

      <IncidentMore incident={incident} />
    </div>
  );
}

/** One coloured segment per step: the walk at a glance, and a way to jump to any step. */
function StepRail({ phases, current, onSelect }: { phases: Phase[]; current: number; onSelect: (i: number) => void }) {
  return (
    <div className="flex gap-1.5 border-b border-line px-5 pb-3 pt-4">
      {phases.map((phase, i) => {
        const active = i === current;
        const color = PHASE_META[phase].token;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`Step ${i + 1}, ${PHASE_META[phase].label}`}
            aria-current={active ? "step" : undefined}
            className="flex-1 text-left"
          >
            <span className="block h-[3px] rounded-full" style={{ background: i <= current ? color : "var(--line)" }} />
            <span className="ident mt-1.5 block" style={{ color: active ? color : "var(--ink-3)" }}>
              {i + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PerspectiveTag({ perspective }: { perspective: Incident["perspective"] }) {
  const target = perspective === "target";
  return (
    <span
      className="rounded-full px-2.5 py-[2px] text-[11.5px] font-semibold"
      style={{
        background: target ? "var(--mist)" : "var(--introduced-soft)",
        color: target ? "var(--ink-2)" : "var(--introduced)",
      }}
      title={
        target
          ? "The AI system was the target."
          : "An AI agent carried out the attack — the lit blocks belong to the attacker's stack."
      }
    >
      {target ? "AI system attacked" : "AI agent as attacker"}
    </span>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-paper px-5 py-4">
      <p className="eyebrow">{title}</p>
      <div className="mt-2">{children}</div>
    </section>
  );
}

/** The background, the related incidents and the reporting: below the walk, never in its way. */
function IncidentMore({ incident }: { incident: Incident }) {
  const related = incident.alsoSeen ?? [];
  return (
    <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
      {related.length > 0 && (
        <div className="lg:row-span-2">
          <Block title="Related incidents">
            <ul className="space-y-3">
              {related.map((r) => (
                <li key={r.title}>
                  <p className="text-[13.5px] font-semibold leading-snug text-ink">
                    {r.title}
                    {r.date && <span className="ml-1.5 font-normal text-ink-3">{r.date}</span>}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-snug text-ink-2">
                    <Text>{r.note}</Text>
                  </p>
                  {r.sources?.map((s) => (
                    <a key={s.url + s.title} href={s.url} target="_blank" rel="noreferrer" className="mr-3 inline-block text-[12px] text-introduced hover:underline">
                      {s.publisher ?? s.title} ↗
                    </a>
                  ))}
                </li>
              ))}
            </ul>
          </Block>
        </div>
      )}
      <Block title="The full story">
        <details className="group">
          <summary className="cursor-pointer text-[13px] font-semibold text-introduced">
            <span className="group-open:hidden">Read the background</span>
            <span className="hidden group-open:inline">Hide the background</span>
          </summary>
          <div className="mt-2 space-y-2.5 text-[13.5px] leading-relaxed text-ink-2">
            {incident.summary.map((p, i) => (
              <p key={i}>
                <Text>{p}</Text>
              </p>
            ))}
          </div>
        </details>
      </Block>
      <Block title={`Sources · ${incident.sources.length}`}>
        <Sources sources={incident.sources} />
      </Block>
    </div>
  );
}

function Sources({ sources }: { sources: IncidentSource[] }) {
  return (
    <ul className="space-y-1.5">
      {sources.map((s) => (
        <li key={s.url + s.title} className="text-[13px] leading-snug">
          <a href={s.url} target="_blank" rel="noreferrer" className="text-introduced hover:underline">
            {s.title}
          </a>
          {(s.publisher || s.date) && <span className="ml-1.5 text-[12px] text-ink-3">{[s.publisher, s.date].filter(Boolean).join(" · ")}</span>}
        </li>
      ))}
    </ul>
  );
}
