"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chip } from "@/components/Chips";
import { RiskMap } from "@/components/map/RiskMap";
import { PageHeader } from "@/components/Panel";
import { PHASE_META, PhaseRail } from "@/components/PhaseRail";
import { FilterPill } from "@/components/browse/RisksBrowser";
import { componentTitle, overlayFor } from "@/lib/data";
import {
  frameworkView,
  isVisibleFramework,
  KIND_LABEL,
  resolveFrameworkLink,
  visibleFrameworks,
  type FrameworkEntry,
} from "@/lib/frameworks";
import { PHASES, type Phase } from "@/lib/types";

export function FrameworksBrowser() {
  const params = useSearchParams();
  const [chosen, setChosen] = useState<{ fw?: string; entry?: string }>({});
  const [phase, setPhase] = useState<Phase>("exposed");

  // A link may still name the superseded 2025 edition; carry it and its entry across.
  const linked = resolveFrameworkLink(params.get("fw") ?? "", params.get("entry") ?? undefined);
  const frameworkId =
    chosen.fw ?? (isVisibleFramework(linked.frameworkId) ? linked.frameworkId : "owasp-llm-2026");
  const view = frameworkView(frameworkId)!;

  const linkedEntry = chosen.fw ? undefined : linked.entryId;
  const entryId = chosen.entry ?? linkedEntry;
  const entry = view.entries.find((e) => e.id === entryId) ?? view.entries[0];

  // A framework entry maps to risks; the map shows where those risks land at this phase.
  const highlighted = entry
    ? [
        ...new Set([
          ...entry.risks.flatMap((r) => overlayFor(r.id)?.[phase] ?? []),
          ...(phase === "mitigated"
            ? entry.controls.flatMap((c) => (Array.isArray(c.components) ? c.components : []))
            : []),
        ]),
      ]
    : [];

  const select = (fw: string) => {
    setChosen({ fw, entry: undefined });
  };

  return (
    <>
      <PageHeader
        eyebrow="Cross-reference"
        title="Frameworks"
        lead="CoSAI maps its risks, controls and personas onto external frameworks, and three more are added here where CoSAI has not caught up. Read the mapping the other way round: pick what you are being measured against, and see where it lands on this map."
      >
        <div className="mt-6 flex flex-wrap gap-1.5">
          {visibleFrameworks.map((f) => {
            const v = frameworkView(f.id)!;
            return (
              <FilterPill key={f.id} active={f.id === frameworkId} onClick={() => select(f.id)}>
                {f.name}
                <span className="ml-1.5 opacity-60">{v.entries.length || "—"}</span>
              </FilterPill>
            );
          })}
        </div>
      </PageHeader>

      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-8 px-6 py-8 lg:flex-row">
        {/* --------------------------------------------------------------- entries */}
        <div className="lg:w-[380px] xl:w-[420px] shrink-0">
          <div className="rounded-xl border border-line bg-paper p-5">
            <p className="display text-[15px] font-semibold text-ink">{view.framework.fullName}</p>
            {view.framework.description && (
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
                {view.framework.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              {view.framework.version && (
                <span className="ident">version {view.framework.version}</span>
              )}
              {view.framework.authored && (
                <span
                  className="rounded-full bg-mist px-2 py-[2px] text-[11px] font-semibold text-ink-2"
                  title="CoSAI does not carry this framework. The mappings onto it were authored in this repository."
                >
                  mappings authored here
                </span>
              )}
              <a
                href={view.framework.documentUri ?? view.framework.baseUri}
                target="_blank"
                rel="noreferrer"
                className="text-[12.5px] font-semibold text-introduced hover:underline"
              >
                Official reference ↗
              </a>
            </div>

            {(view.framework.summary || view.note) && (
              <details className="group mt-3 border-t border-line pt-3">
                <summary className="flex cursor-pointer items-baseline gap-1.5 text-[12.5px] leading-snug text-ink-2 hover:text-ink">
                  <span className="mt-[3px] shrink-0 text-[9px] text-ink-3 transition-transform group-open:rotate-90">
                    &#9654;
                  </span>
                  <span>{view.framework.summary ?? view.note?.headline}</span>
                </summary>

                <div className="mt-2.5 space-y-2 pl-[15px] text-[12.5px] leading-relaxed text-ink-3">
                  {view.framework.attribution && <p>{view.framework.attribution}</p>}
                  {view.framework.mappingRationale && <p>{view.framework.mappingRationale}</p>}
                  {view.note && <p>{view.note.body}</p>}
                  {view.note?.sourceNote && <p>{view.note.sourceNote}</p>}
                  {view.note?.link && (
                    <a
                      href={view.note.link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block font-semibold text-introduced hover:underline"
                    >
                      {view.note.link.label} &#8599;
                    </a>
                  )}
                  {view.note?.crosswalk && (
                    <ul className="space-y-1.5 border-t border-line pt-2">
                      {view.note.crosswalk.map((row) => (
                        <li key={row.from} className="leading-snug">
                          <span className="ident">{row.from}</span>
                          <span className="mx-1">&#8594;</span>
                          <span className="ident">{row.to}</span>{" "}
                          <span className="text-ink-2">{row.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            )}

            {view.coverage.length > 0 && (
              <div className="mt-4 border-t border-line pt-3">
                <p className="eyebrow">How much of CoSAI it reaches</p>
                <ul className="mt-2 space-y-1.5">
                  {view.coverage.map((c) => (
                    <li key={c.kind} className="text-[13px] text-ink-2">
                      <span className="font-semibold text-ink">
                        {c.mapped} of {c.total}
                      </span>{" "}
                      {KIND_LABEL[c.kind]} carry a mapping
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {view.entries.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {view.entries.map((e) => (
                <li key={e.id}>
                  <EntryRow
                    entry={e}
                    selected={e.id === entry?.id}
                    onSelect={() => setChosen({ fw: frameworkId, entry: e.id })}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ------------------------------------------------------------------ detail */}
        <div className="min-w-0 flex-1">
          {entry ? (
            <>
              <div className="rounded-xl border border-line bg-paper p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <p className="ident">{entry.id}</p>
                    <h2 className="display mt-1 text-[24px] font-bold leading-tight text-ink">
                      {entry.label}
                    </h2>
                  </div>
                  {entry.url && (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13px] font-semibold text-introduced hover:underline"
                    >
                      Read the source ↗
                    </a>
                  )}
                </div>

                {entry.description && (
                  <p className="mt-3 max-w-3xl text-[14.5px] leading-relaxed text-ink-2">
                    {entry.description}
                  </p>
                )}
                {entry.note && (
                  <p className="mt-2 max-w-3xl text-[12.5px] leading-relaxed text-ink-3">
                    {entry.note}
                  </p>
                )}

                {entry.predecessor && (
                  <p className="mt-3 max-w-3xl rounded-lg bg-mist px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-2">
                    <span className="eyebrow">CoSAI publishes this as</span>{" "}
                    <span className="ident ml-1">{entry.predecessor.from}</span>
                    <span className="mt-0.5 block text-ink-3">{entry.predecessor.change}</span>
                  </p>
                )}

                {entry.total === 0 ? (
                  <p className="mt-4 rounded-lg border-l-[3px] border-exposed bg-exposed-soft/40 py-3 pl-4 pr-4 text-[13.5px] leading-relaxed text-ink-2">
                    {view.framework.authored
                      ? "Nothing maps to this entry. CoSAI has no risk that describes it, so there was nothing to map — a real gap in the taxonomy rather than a missing judgement."
                      : "Nothing in CoSAI maps to this entry. That is a gap in the cross-reference worth knowing about if this framework is what you are measured against."}
                  </p>
                ) : (
                  <div className="mt-5 grid gap-6 sm:grid-cols-2">
                    {entry.risks.length > 0 && (
                      <div>
                        <p className="eyebrow">{entry.risks.length} risks</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {entry.risks.map((r) => (
                            <Link key={r.id} href={`/risks?risk=${r.id}`}>
                              <Chip tone="exposed">{r.title}</Chip>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {entry.controls.length > 0 && (
                      <div>
                        <p className="eyebrow">{entry.controls.length} controls</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {entry.controls.map((c) => (
                            <Link key={c.id} href={`/controls?control=${c.id}`}>
                              <Chip tone="mitigated">{c.title}</Chip>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {entry.personas.length > 0 && (
                      <div>
                        <p className="eyebrow">{entry.personas.length} personas</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {entry.personas.map((p) => (
                            <Link key={p.id} href={`/personas?persona=${p.id}`}>
                              <Chip>{p.title}</Chip>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {entry.risks.length > 0 || entry.controls.length > 0 ? (
                <div className="mt-4 rounded-xl border border-line bg-paper p-6">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="eyebrow">Where this lands on the map</p>
                      <p className="mt-1 text-[13px] text-ink-2">
                        {highlighted.length} component{highlighted.length === 1 ? "" : "s"} across
                        the risks mapped to {entry.id}, at the {PHASE_META[phase].label.toLowerCase()}{" "}
                        phase.
                      </p>
                    </div>
                    <div className="w-full max-w-[320px]">
                      <PhaseRail phase={phase} onChange={setPhase} />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {highlighted.map((id) => (
                      <li
                        key={id}
                        className="list-none rounded-md px-2 py-[3px] text-[12px] font-medium"
                        style={{
                          background: `color-mix(in srgb, ${PHASE_META[phase].token} 10%, white)`,
                          color: PHASE_META[phase].token,
                        }}
                      >
                        {componentTitle(id)}
                      </li>
                    ))}
                  </div>
                  <RiskMap phase={phase} active={highlighted} className="mt-4 w-full" />
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-line bg-paper p-6">
                  <p className="eyebrow">Not an architectural mapping</p>
                  <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-2">
                    This framework maps onto roles rather than onto system components, so there
                    is nothing to highlight on the map. Use the personas above to see who carries
                    which risks and controls.
                  </p>
                </div>
              )}

              {view.unmapped.some((u) => u.items.length > 0) && (
                <details className="mt-4 rounded-xl border border-line bg-paper px-6 py-4">
                  <summary className="cursor-pointer text-[13.5px] font-semibold text-ink">
                    What this framework does not reach
                  </summary>
                  <div className="mt-3 space-y-4">
                    {view.unmapped
                      .filter((u) => u.items.length > 0)
                      .map((u) => (
                        <div key={u.kind}>
                          <p className="eyebrow">
                            {u.items.length} {KIND_LABEL[u.kind]} with no {view.framework.name}{" "}
                            mapping
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {u.items.map((i) => (
                              <Chip key={i.id}>{i.title}</Chip>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </details>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-line bg-paper p-6">
              <p className="text-[14px] text-ink-2">
                No published mappings for this framework yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function EntryRow({
  entry,
  selected,
  onSelect,
}: {
  entry: FrameworkEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  const empty = entry.total === 0;
  return (
    <button
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
        selected ? "border-ink bg-paper" : "border-line bg-paper hover:border-line-strong"
      }`}
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="ident">{entry.id}</span>
        <span className={`ident ${empty ? "text-exposed" : ""}`}>
          {empty ? "not mapped" : `${entry.total}`}
        </span>
      </span>
      <span
        className={`display mt-0.5 block text-[14px] font-semibold ${
          empty ? "text-ink-3" : "text-ink"
        }`}
      >
        {entry.label}
      </span>
    </button>
  );
}

export const FRAMEWORK_PHASES = PHASES;
