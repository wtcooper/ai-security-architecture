"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chip, MappingBadges } from "@/components/Chips";
import { PageHeader } from "@/components/Panel";
import { firstLine, Prose } from "@/components/Prose";
import { PHASE_META } from "@/components/PhaseRail";
import { ArchetypeLinks } from "@/components/reference/ArchetypeLinks";
import {
  archetypesForRisk,
  componentTitle,
  controlsForRisk,
  incidentsForRisk,
  overlayFor,
  personasForRisk,
  riskById,
  riskCategories,
  riskCode,
  risks,
  vocabTitle,
} from "@/lib/data";
import { mappingsForRisk } from "@/lib/frameworks";
import { PHASES } from "@/lib/types";
import { MasterDetail, useMasterSelection } from "./MasterDetail";

export const RISK_CATEGORY_ACCENT: Record<string, string> = {
  risksSupplyChainAndDevelopment: "var(--band-data-rail)",
  risksDeploymentAndInfrastructure: "var(--band-infra-rail)",
  risksRuntimeInputSecurity: "var(--band-app-rail)",
  risksRuntimeDataSecurity: "var(--band-model-rail)",
  risksRuntimeOutputSecurity: "var(--exposed)",
};

export function RisksBrowser() {
  const params = useSearchParams();
  const [clicked, setClicked] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  const shown = category ? risks.filter((r) => r.category === category) : risks;
  const selectedId = useMasterSelection(
    "risk",
    params.get("risk"),
    shown.map((r) => r.id),
    clicked && shown.some((r) => r.id === clicked) ? clicked : null,
  );
  const risk = riskById.get(selectedId) ?? shown[0];
  const overlay = overlayFor(risk.id);
  const controls = controlsForRisk(risk.id);
  const incidents = incidentsForRisk(risk.id);

  return (
    <>
      <PageHeader
        eyebrow={`${risks.length} risks · CoSAI taxonomy`}
        title="Risks"
        lead="Each risk names a way an AI system can be attacked or fail, the components it touches, and the controls that address it."
      >
        <div className="mt-6 flex flex-wrap gap-1.5">
          <FilterPill active={!category} onClick={() => setCategory(null)}>
            All
          </FilterPill>
          {riskCategories.map((c) => (
            <FilterPill
              key={c.id}
              active={category === c.id}
              accent={RISK_CATEGORY_ACCENT[c.id]}
              onClick={() => setCategory(c.id)}
            >
              {c.title}
              <span className="ml-1.5 opacity-60">
                {risks.filter((r) => r.category === c.id).length}
              </span>
            </FilterPill>
          ))}
        </div>
      </PageHeader>

      <MasterDetail
        groups={riskCategories
          .map((cat) => ({
            id: cat.id,
            title: cat.title,
            accent: RISK_CATEGORY_ACCENT[cat.id],
            items: shown.filter((r) => r.category === cat.id),
          }))
          .filter((g) => g.items.length)}
        selectedId={risk.id}
        onSelect={setClicked}
        meta={(r) => (
          <>
            <span className="ident mr-1.5">{riskCode(r.id)}</span>
            {firstLine(r.shortDescription, 70)}
          </>
        )}
      >
        <p className="eyebrow">
          {riskCategories.find((c) => c.id === risk.category)?.title} ·{" "}
          <span className="ident">{riskCode(risk.id)}</span>
        </p>
        <h2 className="display mt-1.5 text-[27px] font-bold leading-tight text-ink">{risk.title}</h2>

        <Prose blocks={risk.longDescription} refs={risk.externalReferences} className="mt-4" />

        {risk.examples && (
          <div className="mt-5 rounded-lg border-l-[3px] border-line-strong bg-mist py-3 pl-4 pr-4">
            <p className="eyebrow">Seen in the wild</p>
            <Prose blocks={risk.examples} refs={risk.externalReferences} size="sm" className="mt-1" />
          </div>
        )}

        {overlay && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {PHASES.map((p) => (
              <div key={p}>
                <p className="text-[12.5px] font-semibold" style={{ color: PHASE_META[p].token }}>
                  {PHASE_META[p].label}
                </p>
                <ul className="mt-1.5 space-y-1">
                  {overlay[p].map((id) => (
                    <li key={id} className="text-[13px] text-ink-2">
                      {componentTitle(id)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <p className="eyebrow">Controls</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {controls.map((c) => (
              <Link key={c.id} href={`/controls?control=${c.id}`}>
                <Chip tone="mitigated">{c.title}</Chip>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <ArchetypeLinks
            archetypes={archetypesForRisk(risk.id)}
            empty="No reference architecture names this risk. Either it belongs to an archetype not yet drawn, or the catalogue has a gap."
          />
        </div>

        {incidents.length > 0 && (
          <div className="mt-6">
            <p className="eyebrow">Seen in these incidents · {incidents.length}</p>
            <ul className="mt-2 space-y-1">
              {incidents.map((inc) => (
                <li key={inc.id} className="text-[13px] leading-snug">
                  <Link
                    href={`/examples?incident=${inc.id}`}
                    className="font-medium text-ink-2 hover:text-introduced hover:underline"
                  >
                    {inc.title}
                  </Link>
                  <span className="ident ml-2 text-[10.5px] text-ink-3">{inc.dateRange}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="eyebrow">Personas affected</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {personasForRisk(risk.id).map((p) => (
                <Link key={p.id} href={`/personas?persona=${p.id}`}>
                  <Chip>{p.title}</Chip>
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Facet label="Lifecycle" value={risk.lifecycleStage} />
            <Facet label="Impact" value={risk.impactType} />
            <Facet label="Attacker access" value={risk.actorAccess} />
          </div>
        </div>

        <div className="mt-6">
          <MappingBadges mappings={risk.mappings} extra={mappingsForRisk(risk)} />
        </div>

        <Link
          href={`/map?risk=${risk.id}&phase=introduced`}
          className="mt-6 inline-block text-[13.5px] font-semibold text-introduced hover:underline"
        >
          See it on the map →
        </Link>
      </MasterDetail>
    </>
  );
}

function Facet({ label, value }: { label: string; value?: string[] | "all" | "none" }) {
  if (!value || value === "none") return null;
  const items = value === "all" ? ["All"] : value;
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="eyebrow shrink-0">{label}</span>
      <span className="text-[13px] text-ink-2">{items.map(vocabTitle).join(" · ")}</span>
    </div>
  );
}

export function FilterPill({
  active,
  accent,
  onClick,
  children,
}: {
  active: boolean;
  accent?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
        active
          ? "border-transparent text-white"
          : "border-line bg-paper text-ink-2 hover:border-line-strong"
      }`}
      style={active ? { background: accent ?? "var(--ink)" } : undefined}
    >
      {children}
    </button>
  );
}
