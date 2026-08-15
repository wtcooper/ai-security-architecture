"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chip } from "@/components/Chips";
import { RiskMap } from "@/components/map/RiskMap";
import { PageHeader } from "@/components/Panel";
import { Prose } from "@/components/Prose";
import { PHASE_META } from "@/components/PhaseRail";
import { ArchetypeLinks } from "@/components/reference/ArchetypeLinks";
import {
  archetypesForComponent,
  actorById,
  componentById,
  componentCategories,
  components,
  componentTitle,
  controlsForComponent,
  incidentStepsFor,
  risksForComponent,
} from "@/lib/data";
import { HANDLING_EXPLAINER, notesFor } from "@/lib/deviations";
import { ACTORS, GROUP_IDS, GROUPS, type Actor } from "@/lib/map-layout";
import type { Phase } from "@/lib/types";

const SUBCATEGORY_TITLES = new Map(
  componentCategories.flatMap((c) => (c.subcategory ?? []).map((s) => [s.id, s.title] as const)),
);

export function ComponentsBrowser() {
  const params = useSearchParams();
  const [clicked, setClicked] = useState<string | null>(null);

  // A ?component= link wins until the visitor picks something on the map themselves.
  const linked = params.get("component");
  const isTarget = (id: string | null) =>
    Boolean(id) && (componentById.has(id!) || GROUP_IDS.includes(id!) || actorById.has(id!));
  const selected = clicked ?? (isTarget(linked) ? linked! : components[0].id);

  const actor = actorById.get(selected);
  const group = GROUPS.find((g) => g.id === selected);
  const component = componentById.get(selected);
  const risks = risksForComponent(selected);
  const controls = controlsForComponent(selected);
  const category = componentCategories.find((c) => c.id === component?.category);
  const notes = component ? notesFor(selected) : [];
  const isHandling = selected.toLowerCase().includes("handling");

  return (
    <>
      <PageHeader
        eyebrow={`${components.length} components · CoSAI taxonomy`}
        title="Components"
        lead="The building blocks of an AI system. Pick one on the map to see what it does, which risks touch it, and which controls protect it."
      />

      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-8 px-6 py-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-ink-3">
            Click any of the 23 components, the Agent group, or the {ACTORS.length} dashed
            boundary actors
          </p>
          <RiskMap
            phase="introduced"
            active={[selected]}
            selectionOnly
            onSelect={setClicked}
            className="mt-2 w-full max-h-[calc(100vh-13rem)]"
          />
        </div>

        <aside className="lg:w-[420px] xl:w-[460px] shrink-0">
          {actor ? (
            <ActorPanel actor={actor} onSelect={setClicked} />
          ) : group ? (
            <div className="sticky top-20 rounded-xl border border-line bg-paper p-6">
              <p className="eyebrow">Grouping · not a CoSAI component</p>
              <h2 className="display mt-1.5 text-[24px] font-bold leading-tight text-ink">
                {group.label}
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-ink-2">{group.hint}</p>
              <p className="eyebrow mt-6">Made of {group.members.length} components</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {group.members.map((id) => (
                  <button key={id} onClick={() => setClicked(id)}>
                    <Chip>{componentTitle(id)}</Chip>
                  </button>
                ))}
              </div>
            </div>
          ) : (
          <div className="sticky top-20 rounded-xl border border-line bg-paper p-6">
            <p className="eyebrow">
              {category?.title}
              {component!.subcategory && ` · ${SUBCATEGORY_TITLES.get(component!.subcategory)}`}
            </p>
            <h2 className="display mt-1.5 text-[24px] font-bold leading-tight text-ink">
              {componentTitle(component!.id)}
            </h2>

            <Prose
              blocks={component!.description}
              refs={component!.externalReferences}
              size="sm"
              className="mt-4 max-h-64 overflow-y-auto"
            />

            <Flow label="Receives from (CoSAI)" ids={component!.edges?.from} />
            <Flow label="Sends to (CoSAI)" ids={component!.edges?.to} />

            {notes.length > 0 && (
              <div className="mt-5 rounded-lg border-l-[3px] border-line-strong bg-mist py-3.5 pl-4 pr-4">
                <p className="eyebrow">How the map differs from CoSAI here</p>
                <ul className="mt-2 space-y-2">
                  {notes.map((n, i) => (
                    <li key={i} className="text-[13px] leading-snug text-ink-2">
                      {n.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {isHandling && (
              <details className="mt-4 rounded-lg border border-line px-4 py-3">
                <summary className="cursor-pointer text-[13px] font-semibold text-ink">
                  {HANDLING_EXPLAINER.title}
                </summary>
                <div className="mt-2 space-y-2">
                  {HANDLING_EXPLAINER.body.map((para) => (
                    <p key={para} className="text-[13px] leading-relaxed text-ink-2">
                      {para}
                    </p>
                  ))}
                </div>
              </details>
            )}

            <div className="mt-6">
              <ArchetypeLinks
                archetypes={archetypesForComponent(selected)}
                empty="No reference architecture draws a node anchored to this component yet."
              />
            </div>

            <div className="mt-6">
              <p className="eyebrow">{risks.length} risks touch this component</p>
              <ul className="mt-2 space-y-1.5">
                {risks.map(({ risk, phases }) => (
                  <li key={risk.id} className="flex items-start justify-between gap-3">
                    <Link
                      href={`/map?risk=${risk.id}&phase=${phases[0]}`}
                      className="text-[13.5px] text-ink-2 hover:text-introduced transition-colors"
                    >
                      {risk.title}
                    </Link>
                    <span className="mt-1 flex shrink-0 gap-1">
                      {phases.map((p) => (
                        <span
                          key={p}
                          title={PHASE_META[p as Phase].label}
                          className="h-2 w-2 rounded-full"
                          style={{ background: PHASE_META[p as Phase].token }}
                        />
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <p className="eyebrow">{controls.length} controls protect it</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {controls.map((c) => (
                  <Link key={c.id} href={`/controls?control=${c.id}`}>
                    <Chip tone="mitigated">{c.title}</Chip>
                  </Link>
                ))}
              </div>
            </div>

          </div>
          )}
        </aside>
      </div>
    </>
  );
}

/**
 * The User and the two external-source actors. CoSAI models the system and not what sits
 * outside it, so none of these is a component and none carries CoSAI risks or controls — but
 * they are where untrusted input crosses in, which is where most of the 2026 incidents live.
 * The incident steps are what gives them their content.
 */
function ActorPanel({ actor, onSelect }: { actor: Actor; onSelect: (id: string) => void }) {
  const steps = incidentStepsFor(actor.id);
  return (
    <div className="sticky top-20 rounded-xl border border-line bg-paper p-6">
      <p className="eyebrow">Boundary actor · not a CoSAI component</p>
      <h2 className="display mt-1.5 text-[24px] font-bold leading-tight text-ink">
        {actor.label}
      </h2>
      <p className="mt-4 text-[14px] leading-relaxed text-ink-2">{actor.hint}</p>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="eyebrow shrink-0">Borders</span>
        <span className="text-[13px] text-ink-2">
          {actor.borders
            .map((id) => GROUPS.find((g) => g.id === id)?.label ?? componentTitle(id))
            .join(" · ")}
        </span>
      </div>

      <div className="mt-5 rounded-lg border-l-[3px] border-line-strong bg-mist py-3.5 pl-4 pr-4">
        <p className="eyebrow">Why this is drawn at all</p>
        <p className="mt-2 text-[13px] leading-snug text-ink-2">
          CoSAI&rsquo;s components stop at the edge of the system, so there is no upstream
          entry for the user or the outside world — and therefore no CoSAI risk or control
          attached to either. SAIF drew them, and most of the 2026 incidents cross exactly
          these boundaries, so each is drawn dashed: highlightable, nameable by an incident
          step, and explicitly outside the taxonomy.
        </p>
      </div>

      <div className="mt-6">
        <p className="eyebrow">
          {steps.length} incident step{steps.length === 1 ? "" : "s"} cross this boundary
        </p>
        {steps.length === 0 ? (
          <p className="mt-2 text-[13px] leading-snug text-ink-2">
            None of the five incidents replayed here is an attack on the training-data supply,
            so nothing currently names this boundary. It is drawn because the pipeline starts
            outside the organisation whether or not this set of case studies exercises it.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {steps.map(({ incident, step }) => (
              <li key={`${incident.id}-${step.n}`}>
                <Link
                  href="/examples"
                  className="text-[13.5px] text-ink-2 transition-colors hover:text-introduced"
                >
                  <span className="ident">{step.n}</span> {step.title}
                </Link>
                <span className="block text-[12px] text-ink-3">{incident.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <p className="eyebrow">Other boundary actors</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ACTORS.filter((a) => a.id !== actor.id).map((a) => (
            <button key={a.id} onClick={() => onSelect(a.id)}>
              <Chip>{a.label}</Chip>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Flow({ label, ids }: { label: string; ids?: string[] }) {
  if (!ids?.length) return null;
  return (
    <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="eyebrow shrink-0">{label}</span>
      <span className="text-[13px] text-ink-2">{ids.map(componentTitle).join(" · ")}</span>
    </div>
  );
}
