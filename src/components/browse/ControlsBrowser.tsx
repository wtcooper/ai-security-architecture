"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chip, MappingBadges } from "@/components/Chips";
import { mappingsForControl } from "@/lib/frameworks";
import { ExpandAll, PageHeader, Panel } from "@/components/Panel";
import { firstLine, Prose } from "@/components/Prose";
import { FilterPill } from "@/components/browse/RisksBrowser";
import {
  componentsForControl,
  componentTitle,
  controlCategories,
  controls,
  personaTitle,
  risksForControl,
} from "@/lib/data";

export const CONTROL_CATEGORY_ACCENT: Record<string, string> = {
  controlsData: "var(--band-data-rail)",
  controlsInfrastructure: "var(--band-infra-rail)",
  controlsModel: "var(--band-model-rail)",
  controlsApplication: "var(--band-app-rail)",
  controlsAssurance: "var(--mitigated)",
  controlsGovernance: "var(--ink-2)",
};

export function ControlsBrowser() {
  const params = useSearchParams();
  const deepLink = params.get("control");
  const [openAll, setOpenAll] = useState({ value: false, nonce: 0 });
  const [category, setCategory] = useState<string | null>(null);

  const shown = category ? controls.filter((c) => c.category === category) : controls;

  return (
    <>
      <PageHeader
        eyebrow={`${controls.length} controls · CoSAI taxonomy`}
        title="Controls"
        lead="Each control is a countermeasure, mapped to the components it protects and the risks it addresses. Assurance and governance controls apply across every risk."
      >
        <div className="mt-6 flex flex-wrap gap-1.5">
          <FilterPill active={!category} onClick={() => setCategory(null)}>
            All
          </FilterPill>
          {controlCategories.map((c) => (
            <FilterPill
              key={c.id}
              active={category === c.id}
              accent={CONTROL_CATEGORY_ACCENT[c.id]}
              onClick={() => setCategory(c.id)}
            >
              {c.title}
              <span className="ml-1.5 opacity-60">
                {controls.filter((x) => x.category === c.id).length}
              </span>
            </FilterPill>
          ))}
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="flex justify-end pb-1">
          <ExpandAll onToggle={(v) => setOpenAll((s) => ({ value: v, nonce: s.nonce + 1 }))} />
        </div>

        {controlCategories
          .filter((cat) => shown.some((c) => c.category === cat.id))
          .map((cat) => (
            <section key={cat.id} className="mb-10">
              <h2 className="display mb-1 flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: CONTROL_CATEGORY_ACCENT[cat.id] }}
                />
                {cat.title}
              </h2>
              <div className="rounded-xl border border-line bg-paper px-5">
                {shown
                  .filter((c) => c.category === cat.id)
                  .map((control) => {
                    const risks = risksForControl(control.id);
                    const comps = componentsForControl(control.id);
                    return (
                      <Panel
                        key={control.id}
                        id={control.id}
                        title={control.title}
                        meta={firstLine(control.description, 130)}
                        accent={CONTROL_CATEGORY_ACCENT[cat.id]}
                        openAll={openAll}
                        deepLinkId={deepLink}
                      >
                        <Prose blocks={control.description} refs={control.externalReferences} />

                        <div className="mt-6 grid gap-6 sm:grid-cols-2">
                          <div>
                            <p className="eyebrow">
                              Protects {control.components === "all" ? "all components" : `${comps.length} components`}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {control.components === "all" ? (
                                <Chip>Every component</Chip>
                              ) : (
                                comps.map((c) => (
                                  <Link key={c.id} href={`/components?component=${c.id}`}>
                                    <Chip>{componentTitle(c.id)}</Chip>
                                  </Link>
                                ))
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="eyebrow">
                              Addresses {control.risks === "all" ? "all risks" : `${risks.length} risks`}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {control.risks === "all" ? (
                                <Chip tone="exposed">Every risk</Chip>
                              ) : (
                                risks.map((r) => (
                                  <Link key={r.id} href={`/risks?risk=${r.id}`}>
                                    <Chip tone="exposed">{r.title}</Chip>
                                  </Link>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-6">
                          <p className="eyebrow">Owned by</p>
                          <p className="mt-1.5 text-[13.5px] text-ink-2">
                            {control.personas.map(personaTitle).join(" · ")}
                          </p>
                        </div>

                        <div className="mt-6">
                          <MappingBadges mappings={control.mappings} extra={mappingsForControl(control)} />
                        </div>
                      </Panel>
                    );
                  })}
              </div>
            </section>
          ))}
      </div>
    </>
  );
}
