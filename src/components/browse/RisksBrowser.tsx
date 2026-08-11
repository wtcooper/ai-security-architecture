"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Chip, MappingBadges } from "@/components/Chips";
import { ExpandAll, PageHeader, Panel } from "@/components/Panel";
import { firstLine, Prose } from "@/components/Prose";
import { PHASE_META } from "@/components/PhaseRail";
import {
  componentTitle,
  controlsForRisk,
  overlayFor,
  personasForRisk,
  riskCategories,
  risks,
  vocabTitle,
} from "@/lib/data";
import { mappingsForRisk } from "@/lib/frameworks";
import { PHASES } from "@/lib/types";

const CATEGORY_ACCENT: Record<string, string> = {
  risksSupplyChainAndDevelopment: "var(--band-data-rail)",
  risksDeploymentAndInfrastructure: "var(--band-infra-rail)",
  risksRuntimeInputSecurity: "var(--band-app-rail)",
  risksRuntimeDataSecurity: "var(--band-model-rail)",
  risksRuntimeOutputSecurity: "var(--exposed)",
};

export function RisksBrowser() {
  const params = useSearchParams();
  const deepLink = params.get("risk");
  const [openAll, setOpenAll] = useState({ value: false, nonce: 0 });
  const [category, setCategory] = useState<string | null>(null);

  const shown = category ? risks.filter((r) => r.category === category) : risks;

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
              accent={CATEGORY_ACCENT[c.id]}
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

      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <div className="flex justify-end pb-1">
          <ExpandAll onToggle={(v) => setOpenAll((s) => ({ value: v, nonce: s.nonce + 1 }))} />
        </div>

        {riskCategories
          .filter((cat) => shown.some((r) => r.category === cat.id))
          .map((cat) => (
            <section key={cat.id} className="mb-10">
              <h2 className="display mb-1 flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: CATEGORY_ACCENT[cat.id] }}
                />
                {cat.title}
              </h2>
              <div className="rounded-xl border border-line bg-paper px-5">
                {shown
                  .filter((r) => r.category === cat.id)
                  .map((risk) => {
                    const overlay = overlayFor(risk.id);
                    const controls = controlsForRisk(risk.id);
                    return (
                      <Panel
                        key={risk.id}
                        id={risk.id}
                        title={risk.title}
                        meta={firstLine(risk.shortDescription, 130)}
                        accent={CATEGORY_ACCENT[cat.id]}
                        openAll={openAll}
                        deepLinkId={deepLink}
                      >
                        <Prose blocks={risk.longDescription} refs={risk.externalReferences} />

                        {risk.examples && (
                          <div className="mt-5 rounded-lg border-l-[3px] border-line-strong bg-mist py-3 pl-4 pr-4">
                            <p className="eyebrow">Seen in the wild</p>
                            <Prose
                              blocks={risk.examples}
                              refs={risk.externalReferences}
                              size="sm"
                              className="mt-1"
                            />
                          </div>
                        )}

                        {overlay && (
                          <div className="mt-6 grid gap-4 sm:grid-cols-3">
                            {PHASES.map((p) => (
                              <div key={p}>
                                <p
                                  className="text-[12.5px] font-semibold"
                                  style={{ color: PHASE_META[p].token }}
                                >
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

                        <div className="mt-6 grid gap-5 sm:grid-cols-2">
                          <div>
                            <p className="eyebrow">Personas affected</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {personasForRisk(risk.id).map((p) => (
                                <Chip key={p.id}>{p.title}</Chip>
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
