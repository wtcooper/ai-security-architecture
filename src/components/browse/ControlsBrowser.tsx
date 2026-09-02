"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chip, MappingBadges } from "@/components/Chips";
import { PageHeader } from "@/components/Panel";
import { firstLine, Prose } from "@/components/Prose";
import { FilterPill } from "@/components/browse/RisksBrowser";
import { ArchetypeLinks } from "@/components/reference/ArchetypeLinks";
import {
  archetypesForControl,
  componentsForControl,
  componentTitle,
  controlById,
  controlCategories,
  controls,
  personaTitle,
  risksForControl,
} from "@/lib/data";
import { mappingsForControl } from "@/lib/frameworks";
import { MasterDetail, useMasterSelection } from "./MasterDetail";

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
  const [clicked, setClicked] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  const shown = category ? controls.filter((c) => c.category === category) : controls;
  const selectedId = useMasterSelection(
    "control",
    params.get("control"),
    shown.map((c) => c.id),
    clicked && shown.some((c) => c.id === clicked) ? clicked : null,
  );
  const control = controlById.get(selectedId) ?? shown[0];
  const risks = risksForControl(control.id);
  const comps = componentsForControl(control.id);

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

      <MasterDetail
        groups={controlCategories
          .map((cat) => ({
            id: cat.id,
            title: cat.title,
            accent: CONTROL_CATEGORY_ACCENT[cat.id],
            items: shown.filter((c) => c.category === cat.id),
          }))
          .filter((g) => g.items.length)}
        selectedId={control.id}
        onSelect={setClicked}
        meta={(c) => firstLine(c.description, 80)}
      >
        <p className="eyebrow">{controlCategories.find((c) => c.id === control.category)?.title}</p>
        <h2 className="display mt-1.5 text-[27px] font-bold leading-tight text-ink">{control.title}</h2>

        <Prose blocks={control.description} refs={control.externalReferences} className="mt-4" />

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
          <ArchetypeLinks
            archetypes={archetypesForControl(control.id)}
            empty="No reference architecture reaches this control through its capability set — a gap worth reading as a finding about the architectures, not about the control."
          />
        </div>

        <div className="mt-6">
          <MappingBadges mappings={control.mappings} extra={mappingsForControl(control)} />
        </div>
      </MasterDetail>
    </>
  );
}
