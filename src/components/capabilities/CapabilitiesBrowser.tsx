"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/Panel";
import { DefenseMatrix } from "@/components/defenses/DefenseMatrix";
import { CapabilityFilters, useDefenseSelection, useMatrixFilters } from "@/components/defenses/DefenseNavigation";
import { mitigationMatrixItem, matchesMatrixFilters } from "@/components/defenses/model";
import { OverlayToggle } from "@/components/tooling/OverlayToggle";
import { useOrgOverlay } from "@/components/tooling/overlay";
import { OrgCapabilityLegend } from "@/components/defenses/OrgCapabilityLegend";
import { FilterPill } from "@/components/browse/RisksBrowser";
import { MitigationDetail } from "@/components/mitigations/MitigationDetail";
import { categoryById, mitigations, mitigationById, mitigationAliases, mitigationsForCategory, orgSurfaceStatusFor, surfaces } from "@/lib/data";

/** The pin catalogue: every capability is a MITRE mitigation or an authored specialisation of one. */
export function CapabilitiesRoute() {
  return <CapabilitiesBrowser />;
}

const SOURCES = [
  { id: "", label: "All" },
  { id: "MITRE D3FEND", label: "D3FEND" },
  { id: "MITRE ATLAS", label: "ATLAS" },
  { id: "specialisation", label: "Specialisations" },
];

function CapabilitiesBrowser() {
  const params = useSearchParams();
  const [clicked, setClicked] = useDefenseSelection("capability");
  const filters = useMatrixFilters();
  const overlay = useOrgOverlay();
  const detailRef = useRef<HTMLDivElement>(null);
  const [gapsOnly, setGapsOnly] = useState(false);
  const [source, setSource] = useState("");
  const [query, setQuery] = useState("");
  // Links published as ?mitigation= or with a retired id still open their subject.
  const linked = clicked ?? params.get("mitigation") ?? params.get("capability");
  const replacements = linked ? mitigationAliases[linked] : undefined;
  const selected = replacements?.[0] ?? (linked && mitigationById.has(linked) ? linked : null);
  const capability = selected ? mitigationById.get(selected) : undefined;
  // A technology category has no page of its own: a link to one lands on the capabilities it can realise.
  const category = categoryById.get(params.get("category") ?? "");
  const inCategory = category ? new Set(mitigationsForCategory(category.id).map((m) => m.id)) : null;
  const isGap = (id: string) => surfaces.some((s) => mitigationById.get(id)!.surfaces[s.id]?.applies && ["gap", "notAssessed"].includes(orgSurfaceStatusFor(id, s.id)));
  const matchesSource = (m: typeof mitigations[number]) => !source || (source === "specialisation" ? Boolean(m.parent) : !m.parent && m.origin.framework === source);
  const shown = mitigations.filter((m) => matchesMatrixFilters(mitigationMatrixItem(m), filters)
    && (!inCategory || inCategory.has(m.id))
    && matchesSource(m)
    && (!gapsOnly || !overlay || isGap(m.id))
    && `${m.title} ${m.id} ${m.parent ?? ""} ${m.implementation}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    if (selected) detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);
  const specialisations = mitigations.filter((m) => m.parent).length;
  return (
    <>
      <PageHeader eyebrow={`${mitigations.length} capabilities · ${mitigations.length - specialisations} MITRE D3FEND + ATLAS · ${specialisations} authored specialisations`} title="Capabilities" aside={<OverlayToggle />}
        lead="The actionable countermeasures that deliver CoSAI controls, each pinned where it sits in the data flow on the reference architectures. Rows are the control groups they serve; columns are the surfaces where each can exist. This is the only layer the organisation records status against.">
        <CapabilityFilters />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">{SOURCES.map((s) => <FilterPill key={s.id} active={source === s.id} onClick={() => setSource(s.id)}>{s.label}</FilterPill>)}</div>
          <input aria-label="Search capabilities" placeholder="Search by name, MITRE id or implementation" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full max-w-sm rounded-lg border border-line bg-paper px-3 py-2 text-sm" />
          {overlay && <label className="flex items-center gap-2 text-xs text-ink-2"><input type="checkbox" checked={gapsOnly} onChange={(e) => setGapsOnly(e.target.checked)} /> Gaps only</label>}
        </div>
        {category && <p className="mt-3 text-xs text-ink-3">Showing the {inCategory!.size} capabilities that <span className="font-semibold text-ink-2">{category.title}</span> can realise.</p>}
        {replacements && <p className="mt-3 text-xs text-ink-3">This older link maps to {replacements.length ? replacements.map((id) => mitigationById.get(id)?.title).join(" · ") : "a retired entry; its requirements remain in CoSAI controls"}.</p>}
      </PageHeader>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8">
        <p className="mb-3 text-[13px] text-ink-3">{shown.length} of {mitigations.length} capabilities</p>
        {overlay && <OrgCapabilityLegend />}
        <DefenseMatrix items={shown.map(mitigationMatrixItem)} selectedId={selected}
          onSelect={(id) => setClicked(id === selected ? null : id)} {...filters}
          statusFor={overlay ? orgSurfaceStatusFor : undefined} label="Capabilities by control group and deployment surface" />
        {!shown.length && <p className="mt-3 text-sm text-ink-2">No capabilities match these filters.</p>}
        <p className="mt-2 text-xs text-ink-3">A capability sits in its primary control group on the surfaces where it applies; a specialisation is shown beside its MITRE parent. A blank cell means nothing in the catalogue reaches that surface.</p>
        <div ref={detailRef} className="mt-6 scroll-mt-20">
          {capability && <MitigationDetail mitigation={capability} showOrg={overlay} onClose={() => setClicked(null)} />}
        </div>
      </div>
    </>
  );
}
