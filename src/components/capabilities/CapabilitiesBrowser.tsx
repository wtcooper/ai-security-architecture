"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/Panel";
import { DefenseMatrix } from "@/components/defenses/DefenseMatrix";
import { CapabilityFilters, useDefenseSelection, useMatrixFilters } from "@/components/defenses/DefenseNavigation";
import { capabilityMatrixItem, matchesMatrixFilters } from "@/components/defenses/model";
import { OverlayToggle } from "@/components/tooling/OverlayToggle";
import { useOrgOverlay } from "@/components/tooling/overlay";
import { OrgCapabilityLegend } from "@/components/defenses/OrgCapabilityLegend";
import { CapabilityMappingGaps } from "@/components/defenses/CapabilityMappingGaps";
import { CapabilityDetail } from "./CapabilityDetail";
import { FilterPill } from "@/components/browse/RisksBrowser";
import { MitigationsBrowser } from "@/components/mitigations/MitigationsBrowser";
import { capabilities, capabilityById, frameworkById, mitigationById, mitigationAliases, orgCapabilitySurfaceStatusFor } from "@/lib/data";

// Links published when capabilities meant MITRE methods still open their original subject.
export function CapabilitiesRoute() {
  const params = useSearchParams();
  const id = params.get("capability") ?? "";
  if (params.get("mitigation") || mitigationById.has(id) || mitigationAliases[id]) return <MitigationsBrowser />;
  return <CapabilitiesBrowser />;
}

function CapabilitiesBrowser() {
  const [selected, setClicked] = useDefenseSelection("capability");
  const filters = useMatrixFilters();
  const overlay = useOrgOverlay();
  const detailRef = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const shown = capabilities.filter((c) => (!source || c.frameworkMappings.some((m) => m.framework === source)) && matchesMatrixFilters(capabilityMatrixItem(c), filters) && `${c.title} ${c.description}`.toLowerCase().includes(query.toLowerCase()));
  const capability = selected ? capabilityById.get(selected) : undefined;
  useEffect(() => {
    if (selected) detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);
  const sourceIds = [...new Set(capabilities.flatMap((c) => c.frameworkMappings.map((m) => m.framework)))];
  return (
    <>
      <PageHeader eyebrow={`${capabilities.length} sourced categories`} title="Technology capabilities" aside={<OverlayToggle />} lead="Technology categories implement defensive methods that support CoSAI controls. OWASP supplies the AI categories; ENISA and ECSO supply additional technology terminology. Explore CISA functions and NIST outcomes as supplementary mappings.">
        <CapabilityFilters />
        <div className="mt-5 flex flex-wrap gap-1.5">
          <FilterPill active={!source} onClick={() => { setSource(null); setClicked(null); }}>All sources</FilterPill>
          {sourceIds.map((id) => <FilterPill key={id} active={source === id} onClick={() => { setSource(id); setClicked(null); }}>{frameworkById.get(id)?.name}</FilterPill>)}
        </div>
        <input aria-label="Search technology capabilities" placeholder="Search capabilities, e.g. DLP or CASB" value={query} onChange={(e) => { setQuery(e.target.value); setClicked(null); }} className="mt-4 w-full max-w-lg rounded-lg border border-line bg-paper px-3 py-2 text-sm" />
      </PageHeader>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8">
        <p className="mb-3 text-[13px] text-ink-3">{shown.length} of {capabilities.length} technology capabilities</p>
        {overlay && <OrgCapabilityLegend />}
        <DefenseMatrix items={shown.map(capabilityMatrixItem)} selectedId={selected}
          onSelect={(id) => setClicked(id === selected ? null : id)} {...filters}
          statusFor={overlay ? orgCapabilitySurfaceStatusFor : undefined} label="Technology capabilities by control group and deployment surface" />
        {!shown.length && <p className="mt-3 text-sm text-ink-2">No capabilities match these filters.</p>}
        <p className="mt-2 text-xs text-ink-3">Placement follows mapped mitigations’ primary CoSAI control groups and applicable surfaces. A category may appear in several groups. These are possible implementation paths, not deployment claims; inspect the mapping rationale for scope.</p>
        <CapabilityMappingGaps />
        <div ref={detailRef} className="mt-6 scroll-mt-20">
          {capability && <CapabilityDetail capabilityId={capability.id} overlay={overlay} surface={filters.surface} onClose={() => setClicked(null)} />}
        </div>
      </div>
    </>
  );
}
