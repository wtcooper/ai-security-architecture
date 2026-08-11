"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chip, MappingBadges } from "@/components/Chips";
import { RiskMap } from "@/components/map/RiskMap";
import { PageHeader } from "@/components/Panel";
import { Prose } from "@/components/Prose";
import { PHASE_META } from "@/components/PhaseRail";
import {
  componentById,
  componentCategories,
  components,
  componentTitle,
  controlsForComponent,
  risksForComponent,
} from "@/lib/data";
import type { Phase } from "@/lib/types";

const SUBCATEGORY_TITLES = new Map(
  componentCategories.flatMap((c) => (c.subcategory ?? []).map((s) => [s.id, s.title] as const)),
);

export function ComponentsBrowser() {
  const params = useSearchParams();
  const [clicked, setClicked] = useState<string | null>(null);

  // A ?component= link wins until the visitor picks something on the map themselves.
  const linked = params.get("component");
  const selected =
    clicked ?? (linked && componentById.has(linked) ? linked : components[0].id);

  const component = componentById.get(selected)!;
  const risks = risksForComponent(selected);
  const controls = controlsForComponent(selected);
  const category = componentCategories.find((c) => c.id === component.category);

  return (
    <>
      <PageHeader
        eyebrow={`${components.length} components · CoSAI Risk Map`}
        title="Components"
        lead="The building blocks of an AI system. Pick one on the map to see what it does, which risks touch it, and which controls protect it."
      />

      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-8 px-6 py-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-ink-3">
            Click any of the 23 components
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
          <div className="sticky top-20 rounded-xl border border-line bg-paper p-6">
            <p className="eyebrow">
              {category?.title}
              {component.subcategory && ` · ${SUBCATEGORY_TITLES.get(component.subcategory)}`}
            </p>
            <h2 className="display mt-1.5 text-[24px] font-bold leading-tight text-ink">
              {componentTitle(component.id)}
            </h2>
            <p className="ident mt-1">{component.id}</p>

            <Prose
              blocks={component.description}
              refs={component.externalReferences}
              size="sm"
              className="mt-4 max-h-64 overflow-y-auto"
            />

            <Flow label="Receives from" ids={component.edges?.from} />
            <Flow label="Sends to" ids={component.edges?.to} />

            <div className="mt-6">
              <p className="eyebrow">{risks.length} risks touch this component</p>
              <ul className="mt-2 space-y-1.5">
                {risks.map(({ risk, phases }) => (
                  <li key={risk.id} className="flex items-start justify-between gap-3">
                    <Link
                      href={`/?risk=${risk.id}&phase=${phases[0]}`}
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

            {component.mappings && (
              <div className="mt-6">
                <MappingBadges mappings={component.mappings} />
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
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
