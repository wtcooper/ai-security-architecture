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
import { CapabilityDetail } from "./CapabilityDetail";
import { capabilities, capabilitiesForCategory, capabilityById, categoryById, mitigationById, mitigationAliases, orgCapabilitySurfaceStatusFor, surfaces } from "@/lib/data";
import { MitigationsBrowser } from "@/components/mitigations/MitigationsBrowser";

// Links published when "capability" meant a MITRE method still open their original subject.
export function CapabilitiesRoute() {
  const params = useSearchParams();
  const id = params.get("capability") ?? "";
  if (params.get("mitigation") || mitigationById.has(id) || mitigationAliases[id]) return <MitigationsBrowser />;
  return <CapabilitiesBrowser />;
}

/** Question two: where are the gaps, and what must we procure or build? */
function CapabilitiesBrowser() {
  const params = useSearchParams();
  const [selected, setClicked] = useDefenseSelection("capability");
  const filters = useMatrixFilters();
  const overlay = useOrgOverlay();
  const detailRef = useRef<HTMLDivElement>(null);
  const [gapsOnly, setGapsOnly] = useState(false);
  const [query, setQuery] = useState("");
  // A technology category has no page of its own: a link to one lands on the capabilities it realises.
  const category = categoryById.get(params.get("category") ?? "");
  const isGap = (id: string) => surfaces.some((s) => ["gap", "notAssessed"].includes(orgCapabilitySurfaceStatusFor(id, s.id)) && capabilityById.get(id)!.surfaces[s.id]?.applies);
  const shown = capabilities.filter((c) => matchesMatrixFilters(capabilityMatrixItem(c), filters)
    && (!category || c.realization.technology.includes(category.id))
    && (!gapsOnly || !overlay || isGap(c.id))
    && `${c.title} ${c.description}`.toLowerCase().includes(query.toLowerCase()));
  const capability = selected ? capabilityById.get(selected) : undefined;
  useEffect(() => {
    if (selected) detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);
  return (
    <>
      <PageHeader eyebrow={`${capabilities.length} capabilities · authored catalogue`} title="Capabilities" aside={<OverlayToggle />}
        lead="The operational capabilities that deliver CoSAI controls, placed by control group and by the surfaces where each can exist. Each is realised by technology, process and people, and is the only thing the organisation records status against.">
        <CapabilityFilters />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input aria-label="Search capabilities" placeholder="Search capabilities" value={query} onChange={(e) => { setQuery(e.target.value); setClicked(null); }} className="w-full max-w-sm rounded-lg border border-line bg-paper px-3 py-2 text-sm" />
          {overlay && <label className="flex items-center gap-2 text-xs text-ink-2"><input type="checkbox" checked={gapsOnly} onChange={(e) => setGapsOnly(e.target.checked)} /> Gaps only</label>}
        </div>
        {category && <p className="mt-3 text-xs text-ink-3">Showing the {capabilitiesForCategory(category.id).length} capabilities that <span className="font-semibold text-ink-2">{category.title}</span> realises.</p>}
      </PageHeader>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8">
        <p className="mb-3 text-[13px] text-ink-3">{shown.length} of {capabilities.length} capabilities</p>
        {overlay && <OrgCapabilityLegend />}
        <DefenseMatrix items={shown.map(capabilityMatrixItem)} selectedId={selected}
          onSelect={(id) => setClicked(id === selected ? null : id)} {...filters}
          statusFor={overlay ? orgCapabilitySurfaceStatusFor : undefined} label="Capabilities by control group and deployment surface" />
        {!shown.length && <p className="mt-3 text-sm text-ink-2">No capabilities match these filters.</p>}
        <p className="mt-2 text-xs text-ink-3">A capability sits in the control groups of the controls it delivers, on the surfaces where it was judged able to exist; the reason is on the capability. A blank cell means no capability reaches that surface.</p>
        <div ref={detailRef} className="mt-6 scroll-mt-20">
          {capability && <CapabilityDetail capabilityId={capability.id} overlay={overlay} surface={filters.surface} onClose={() => setClicked(null)} />}
        </div>
      </div>
    </>
  );
}
