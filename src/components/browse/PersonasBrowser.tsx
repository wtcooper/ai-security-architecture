"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chip, MappingBadges } from "@/components/Chips";
import { PageHeader } from "@/components/Panel";
import { firstLine, Prose } from "@/components/Prose";
import {
  activePersonas,
  controlsForPersona,
  legacyPersonas,
  personaById,
  risksForPersona,
} from "@/lib/data";
import type { Persona } from "@/lib/types";

export function PersonasBrowser() {
  const params = useSearchParams();
  const [clicked, setClicked] = useState<string | null>(null);

  const linked = params.get("persona");
  const selectedId =
    clicked ?? (linked && personaById.has(linked) ? linked : activePersonas[0].id);
  const persona = personaById.get(selectedId)!;

  const risks = risksForPersona(persona.id);
  const controls = controlsForPersona(persona.id);

  return (
    <>
      <PageHeader
        eyebrow={`${activePersonas.length} personas · CoSAI taxonomy`}
        title="Personas"
        lead="Who owns what. CoSAI replaced SAIF's two roles with eight, so a risk or a control can name the party actually responsible for it."
      />

      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-6 py-8 lg:flex-row">
        <div className="lg:w-[360px] xl:w-[400px] shrink-0">
          <ul className="space-y-2">
            {activePersonas.map((p) => (
              <li key={p.id}>
                <PersonaCard
                  persona={p}
                  selected={p.id === persona.id}
                  riskCount={risksForPersona(p.id).length}
                  controlCount={controlsForPersona(p.id).length}
                  onSelect={() => setClicked(p.id)}
                />
              </li>
            ))}
          </ul>

          {legacyPersonas.length > 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-line-strong bg-paper/60 p-4">
              <p className="eyebrow">Superseded</p>
              <p className="mt-1.5 text-[13px] leading-snug text-ink-2">
                CoSAI keeps SAIF&rsquo;s original two roles in the data, marked deprecated:{" "}
                {legacyPersonas.map((p) => p.title.replace(" (Legacy)", "")).join(" and ")}. The
                eight above replace them.
              </p>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="rounded-xl border border-line bg-paper p-7">
            <h2 className="display text-[27px] font-bold leading-tight text-ink">
              {persona.title}
            </h2>
            <p className="ident mt-1">{persona.id}</p>

            <Prose blocks={persona.description} className="mt-4" />

            {persona.responsibilities && persona.responsibilities.length > 0 && (
              <div className="mt-7">
                <p className="eyebrow">Responsibilities</p>
                <ul className="mt-2.5 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {persona.responsibilities.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-[13.5px] text-ink-2">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-line-strong" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {persona.identificationQuestions && persona.identificationQuestions.length > 0 && (
              <div className="mt-7 rounded-lg border-l-[3px] border-introduced bg-introduced-soft/40 py-4 pl-4 pr-4">
                <p className="eyebrow">Is this you?</p>
                <ul className="mt-2 space-y-1.5">
                  {persona.identificationQuestions.map((q) => (
                    <li key={q} className="text-[13.5px] leading-snug text-ink-2">
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-7 grid gap-7 lg:grid-cols-2">
              <div>
                <p className="eyebrow">{risks.length} risks affect this persona</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {risks.map((r) => (
                    <Link key={r.id} href={`/risks?risk=${r.id}`}>
                      <Chip tone="exposed">{r.title}</Chip>
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="eyebrow">{controls.length} controls they own</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {controls.map((c) => (
                    <Link key={c.id} href={`/controls?control=${c.id}`}>
                      <Chip tone="mitigated">{c.title}</Chip>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {persona.mappings && (
              <div className="mt-7">
                <MappingBadges mappings={persona.mappings} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function PersonaCard({
  persona,
  selected,
  riskCount,
  controlCount,
  onSelect,
}: {
  persona: Persona;
  selected: boolean;
  riskCount: number;
  controlCount: number;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        selected
          ? "border-ink bg-paper"
          : "border-line bg-paper hover:border-line-strong"
      }`}
    >
      <span className="display block text-[15px] font-semibold text-ink">{persona.title}</span>
      <span className="mt-1 block text-[13px] leading-snug text-ink-3">
        {firstLine(persona.description, 92)}
      </span>
      <span className="mt-2.5 flex gap-4">
        <span className="ident flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-exposed" aria-hidden />
          {riskCount} risks
        </span>
        <span className="ident flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-mitigated" aria-hidden />
          {controlCount} controls
        </span>
      </span>
    </button>
  );
}
