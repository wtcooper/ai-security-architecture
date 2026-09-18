"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/Panel";
import { OrgCapabilityLegend } from "@/components/defenses/OrgCapabilityLegend";
import { CapabilityMappingGaps } from "@/components/defenses/CapabilityMappingGaps";
import { OverlayToggle } from "@/components/tooling/OverlayToggle";
import { useOrgOverlay } from "@/components/tooling/overlay";
import { FilterPill, RISK_CATEGORY_ACCENT } from "@/components/browse/RisksBrowser";
import type { BandId } from "@/lib/bands";
import {
  bandsForMitigation,
  mitigationsInOrder,
  mitigationById,
  mitigationAliases,
  mitigationGaps,
  controlById,
  orgSurfaceStatusFor,
  orgSurfacePostureFor,
  riskById,
  riskCategories,
} from "@/lib/data";
import { DefenseMatrix } from "@/components/defenses/DefenseMatrix";
import { DefenseNavigation, useDefenseSelection, useMatrixFilters } from "@/components/defenses/DefenseNavigation";
import { mitigationMatrixItem, matchesMatrixFilters } from "@/components/defenses/model";
import type { Mitigation } from "@/lib/types";
import { MitigationDetail } from "./MitigationDetail";
import { StackFilter } from "./StackFilter";

const BAND_IDS: BandId[] = ["application", "model", "modelInfrastructure", "dataInfrastructure"];

export function MitigationsBrowser() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const linked = params.get("mitigation") ?? params.get("capability");

  const [riskCategory, setRiskCategory] = useState<string | null>(null);
  const [band, setBand] = useState<BandId | null>(null);
  const [, setClicked] = useDefenseSelection("mitigation");
  const [source, setSource] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const overlay = useOrgOverlay();
  const filters = useMatrixFilters();

  const replacements = linked ? mitigationAliases[linked] : undefined;
  const selectedId = replacements?.[0] ?? (linked && mitigationById.has(linked) ? linked : null);
  const selected = selectedId ? mitigationById.get(selectedId) : undefined;
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedId) detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  const matchesRisk = (cap: Mitigation) =>
    !riskCategory || cap.risks.some((id) => riskById.get(id)?.category === riskCategory);
  const matchesBand = (cap: Mitigation) => !band || bandsForMitigation(cap.id).has(band);
  const matchesSourceAndQuery = (cap: Mitigation) => (!source || cap.origin.framework === source) &&
    `${cap.id} ${cap.title} ${cap.implementation} ${cap.examples.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase());
  const shown = mitigationsInOrder.filter((c) => matchesRisk(c) && matchesBand(c) && matchesSourceAndQuery(c) && matchesMatrixFilters(mitigationMatrixItem(c), filters));

  // Stack-filter counts respond to the risk filter, so the two selectors read as one system.
  const bandCounts = Object.fromEntries(BAND_IDS.map((b) => [b, 0])) as Record<BandId, number>;
  for (const cap of mitigationsInOrder) {
    if (!matchesRisk(cap) || !matchesSourceAndQuery(cap) || !matchesMatrixFilters(mitigationMatrixItem(cap), filters)) continue;
    for (const b of bandsForMitigation(cap.id)) bandCounts[b] += 1;
  }

  return (
    <>
      <PageHeader
        eyebrow={`${mitigationsInOrder.length} mitigations · MITRE D3FEND + ATLAS`}
        title="Mitigations"
        lead="Defensive techniques from MITRE D3FEND and AI mitigations from MITRE ATLAS describe how to reduce risk. They support CoSAI controls. Technology capabilities describe the tools and platforms that can implement them; they are a separate layer."
        aside={<OverlayToggle />}
      >
        <DefenseNavigation current="mitigations" />
        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">Filter by risk category</p>
            <div className="mt-2 flex max-w-xl flex-wrap gap-1.5">
              <FilterPill active={!riskCategory} onClick={() => setRiskCategory(null)}>
                All
              </FilterPill>
              {riskCategories.map((c) => (
                <FilterPill
                  key={c.id}
                  active={riskCategory === c.id}
                  accent={RISK_CATEGORY_ACCENT[c.id]}
                  onClick={() => setRiskCategory(riskCategory === c.id ? null : c.id)}
                >
                  {c.title}
                </FilterPill>
              ))}
            </div>
          </div>
          <div className="w-full shrink-0 lg:w-[300px]">
            <p className="eyebrow">Filter by stack layer</p>
            <div className="mt-2">
              <StackFilter value={band} counts={bandCounts} onChange={setBand} />
            </div>
          </div>
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-[1400px] px-6 py-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input aria-label="Search mitigations" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, identifier or implementation…" className="min-w-[280px] rounded-md border border-line bg-paper px-3 py-2 text-sm" />
          {[null, "MITRE D3FEND", "MITRE ATLAS"].map((name) => (
            <FilterPill key={name ?? "all"} active={source === name} onClick={() => setSource(name)}>{name ?? "All sources"}</FilterPill>
          ))}
        </div>
        {replacements && (
          <div className="mb-4 rounded-lg border border-line bg-paper p-4 text-sm text-ink-2">
            <p>{replacements.length ? "This older mitigation link now points to the following functions. Review each function separately." : "This mitigation was retired because no sufficiently matching MITRE mitigation was selected. Its requirements remain in the CoSAI gap assessment below."}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {replacements.map((id) => <button key={id} onClick={() => setClicked(id)} className="text-introduced hover:underline">{mitigationById.get(id)?.title} <span className="text-xs text-ink-3">({id})</span></button>)}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 pb-3">
          <p className="text-[13px] text-ink-3">
            {shown.length} of {mitigationsInOrder.length} mitigations
            {(riskCategory || band || source || query || filters.category || filters.surface) && (
              <button
                onClick={() => {
                  setRiskCategory(null);
                  setBand(null);
                  setSource(null);
                  setQuery("");
                  const next = new URLSearchParams(params.toString());
                  next.delete("group");
                  next.delete("surface");
                  router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
                }}
                className="ml-2 font-semibold text-introduced hover:underline"
              >
                Clear filters
              </button>
            )}
          </p>
        </div>

        {overlay && <OrgCapabilityLegend derived />}

        <DefenseMatrix items={shown.map(mitigationMatrixItem)} selectedId={selectedId}
          onSelect={(id) => setClicked(id === selectedId ? null : id)} {...filters}
          statusFor={overlay ? orgSurfaceStatusFor : undefined}
          orgNamesFor={overlay ? (id, surface) => orgSurfacePostureFor(id, surface).technology : undefined} label="Mitigations by control group and deployment surface" />

        {!shown.length && <p className="mt-3 text-sm text-ink-2">No mitigations match these filters.</p>}
        <p className="mt-2 text-[12px] text-ink-3">
          A mitigation sits in its primary control group; its full control mapping is in the
          detail. Blank cells are outside this customer-deployment profile. Provider-inherited
          functions require supplier evidence. Counts describe catalogue entries, not independent
          defenses or a coverage score; some upstream concepts overlap.
        </p>

        <CapabilityMappingGaps />
        <details className="mt-5 rounded-lg border border-line bg-paper p-4">
          <summary className="cursor-pointer text-sm font-semibold text-ink">CoSAI requirements beyond the mitigation mappings</summary>
          <p className="mt-2 text-xs text-ink-3">Authored assessment of the pinned MITRE releases. These are gaps and implementation requirements against existing CoSAI controls, not additional mitigations.</p>
          <ul className="mt-3 space-y-3">
            {mitigationGaps.map((gap) => <li key={gap.control} className="text-sm text-ink-2"><a href={`/controls?control=${gap.control}`} className="font-semibold text-introduced hover:underline">{controlById.get(gap.control)?.title}</a> · {gap.assessment}<p className="mt-1">{gap.missing}</p></li>)}
          </ul>
        </details>

        <div ref={detailRef} className="mt-6 scroll-mt-20">
          {selected && (
            <MitigationDetail mitigation={selected} onClose={() => setClicked(null)} />
          )}
        </div>
      </div>

    </>
  );
}
