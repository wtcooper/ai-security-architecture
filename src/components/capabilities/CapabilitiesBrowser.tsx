"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/Panel";
import { DefenseMatrix } from "@/components/defenses/DefenseMatrix";
import { CapabilityFilters, useDefenseSelection, useMatrixFilters } from "@/components/defenses/DefenseNavigation";
import { mitigationMatrixItem, matchesMatrixFilters } from "@/components/defenses/model";
import { StatusHeading, StatusPill } from "@/components/StatusPill";
import { FilterPill, RISK_CATEGORY_ACCENT } from "@/components/browse/RisksBrowser";
import { StackFilter } from "@/components/capabilities/StackFilter";
import type { BandId } from "@/lib/bands";
import { CapabilityDetail } from "@/components/capabilities/CapabilityDetail";
import { bandsForMitigation, capabilityName, mitigations, mitigationById, mitigationAliases, riskById, riskCategories, status, statusFor } from "@/lib/data";

const SOURCES = [
  { id: "", label: "All" },
  { id: "MITRE D3FEND", label: "D3FEND" },
  { id: "MITRE ATLAS", label: "ATLAS" },
  { id: "specialisation", label: "Specialisations" },
];

const BAND_IDS: BandId[] = ["application", "model", "modelInfrastructure", "dataInfrastructure"];

/**
 * The matrix shows the most granular capability only: a MITRE parent with specialisations is
 * represented by them, so the same control never appears twice. A parent stays reachable by
 * link and search, and its detail lists the specialisations.
 */
const specialised = new Set(mitigations.flatMap((m) => (m.parent ? [m.parent] : [])));
const catalogue = mitigations.filter((m) => !specialised.has(m.id));

/** Any status set at all: until one is, there is nothing to filter gaps by. */
const anyStatus = Object.values(status).some((s) => s.status);

/** The pin catalogue: every capability is a MITRE mitigation or an authored specialisation of one. */
export function CapabilitiesBrowser() {
  const [linked, setClicked] = useDefenseSelection();
  const filters = useMatrixFilters();
  const detailRef = useRef<HTMLDivElement>(null);
  const [gapsOnly, setGapsOnly] = useState(false);
  const [source, setSource] = useState("");
  const [query, setQuery] = useState("");
  const [riskCategory, setRiskCategory] = useState<string | null>(null);
  const [band, setBand] = useState<BandId | null>(null);
  // A retired home-grown id still opens its replacement.
  const replacements = linked ? mitigationAliases[linked] : undefined;
  const selected = replacements?.[0] ?? (linked && mitigationById.has(linked) ? linked : null);
  const capability = selected ? mitigationById.get(selected) : undefined;
  const isGap = (id: string) => statusFor(id) !== "enabled";
  const matchesSource = (m: typeof mitigations[number]) => !source || (source === "specialisation" ? Boolean(m.parent) : !m.parent && m.origin.framework === source);
  const matchesRisk = (m: typeof mitigations[number]) => !riskCategory || m.risks.some((id) => riskById.get(id)?.category === riskCategory);
  const matchesBand = (m: typeof mitigations[number]) => !band || bandsForMitigation(m.id).has(band);
  const matchesOthers = (m: typeof mitigations[number]) => matchesMatrixFilters(mitigationMatrixItem(m), filters)
    && matchesSource(m)
    && (!gapsOnly || isGap(m.id))
    && `${capabilityName(m.id)} ${m.title} ${m.id} ${m.parent ?? ""} ${m.implementation}`.toLowerCase().includes(query.toLowerCase());
  const shown = catalogue.filter((m) => matchesOthers(m) && matchesRisk(m) && matchesBand(m));
  // Stack-layer counts respond to every other filter, so the selectors read as one system.
  const bandCounts = Object.fromEntries(BAND_IDS.map((b) => [b, 0])) as Record<BandId, number>;
  for (const m of catalogue) {
    if (!matchesOthers(m) || !matchesRisk(m)) continue;
    for (const b of bandsForMitigation(m.id)) bandCounts[b] += 1;
  }
  useEffect(() => {
    if (selected) detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);
  const specialisations = catalogue.filter((m) => m.parent).length;
  return (
    <>
      <PageHeader eyebrow={`${catalogue.length} capabilities · ${catalogue.length - specialisations} MITRE D3FEND + ATLAS · ${specialisations} authored specialisations`} title="Capabilities"
        lead="The actionable countermeasures that deliver CoSAI controls, each pinned where it sits in the data flow on the reference architectures. Rows are the control groups they serve; columns are the surfaces where each can exist. Status is set against these, in data/status.yaml.">
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">Filter by risk category</p>
            <div className="mt-2 flex max-w-xl flex-wrap gap-1.5">
              <FilterPill active={!riskCategory} onClick={() => setRiskCategory(null)}>All</FilterPill>
              {riskCategories.map((c) => (
                <FilterPill key={c.id} active={riskCategory === c.id} accent={RISK_CATEGORY_ACCENT[c.id]}
                  onClick={() => setRiskCategory(riskCategory === c.id ? null : c.id)}>
                  {c.title}
                </FilterPill>
              ))}
            </div>
            <CapabilityFilters />
          </div>
          <div className="w-full shrink-0 lg:w-[300px]">
            <p className="eyebrow">Filter by stack layer</p>
            <div className="mt-2"><StackFilter value={band} counts={bandCounts} onChange={setBand} /></div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">{SOURCES.map((s) => <FilterPill key={s.id} active={source === s.id} onClick={() => setSource(s.id)}>{s.label}</FilterPill>)}</div>
          <input aria-label="Search capabilities" placeholder="Search by name, MITRE id or implementation" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full max-w-sm rounded-lg border border-line bg-paper px-3 py-2 text-sm" />
          {anyStatus && <label className="flex items-center gap-2 text-xs text-ink-2"><input type="checkbox" checked={gapsOnly} onChange={(e) => setGapsOnly(e.target.checked)} /> Not yet enabled only</label>}
        </div>
        {replacements && <p className="mt-3 text-xs text-ink-3">This older link maps to {replacements.length ? replacements.map((id) => mitigationById.get(id)?.title).join(" · ") : "a retired entry; its requirements remain in CoSAI controls"}.</p>}
      </PageHeader>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8">
        <p className="mb-3 text-[13px] text-ink-3">
          {shown.length} of {catalogue.length} capabilities
          {(riskCategory || band) && (
            <button onClick={() => { setRiskCategory(null); setBand(null); }} className="ml-2 font-semibold text-introduced hover:underline">
              Clear filters
            </button>
          )}
        </p>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-ink-2">
          <StatusHeading className="font-semibold" />
          <StatusPill status="enabled" compact /><StatusPill status="inProgress" compact /><StatusPill status="gap" compact />
          <span className="text-ink-3">· grey chips have no status set</span>
        </div>
        <DefenseMatrix items={shown.map(mitigationMatrixItem)} selectedId={selected}
          onSelect={(id) => setClicked(id === selected ? null : id)} {...filters}
          statusFor={statusFor} label="Capabilities by control group and deployment surface" />
        {!shown.length && <p className="mt-3 text-sm text-ink-2">No capabilities match these filters.</p>}
        <p className="mt-2 text-xs text-ink-3">A capability sits in its primary control group on the surfaces where it applies; a MITRE mitigation with specialisations is shown as those specialisations, never beside them. A blank cell means nothing in the catalogue reaches that surface.</p>
        <div ref={detailRef} className="mt-6 scroll-mt-20">
          {capability && <CapabilityDetail mitigation={capability} onClose={() => setClicked(null)} />}
        </div>
      </div>
    </>
  );
}
