"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/Panel";
import { Chip, MappingBadges } from "@/components/Chips";
import { DefenseMatrix } from "@/components/defenses/DefenseMatrix";
import { DefenseNavigation, matrixHref, useDefenseSelection, useMatrixFilters } from "@/components/defenses/DefenseNavigation";
import { capabilityMatrixItem, matchesMatrixFilters } from "@/components/defenses/model";
import { OverlayToggle } from "@/components/tooling/OverlayToggle";
import { useOrgOverlay } from "@/components/tooling/overlay";
import { StatusPill } from "@/components/StatusPill";
import { FilterPill } from "@/components/browse/RisksBrowser";
import { MitigationsBrowser } from "@/components/mitigations/MitigationsBrowser";
import { capabilities, capabilityById, frameworkById, frameworkEntries, mitigationById, mitigationAliases, controlById, archetypes, incidents, orgSurfacePostureFor, surfaces } from "@/lib/data";
import { frameworkHref, mappingsForControl, orgEntriesFor } from "@/lib/frameworks";

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
  const mitigationIds = capability?.mitigationMappings.map((m) => m.mitigation) ?? [];
  const controlIds = [...new Set(mitigationIds.flatMap((id) => mitigationById.get(id)?.controls ?? []))];
  const relatedArchitectures = archetypes.filter((a) => a.mitigations.some((id) => mitigationIds.includes(id)));
  const relatedIncidents = incidents.filter((i) => i.controls.some((id) => controlIds.includes(id)));
  return (
    <>
      <PageHeader eyebrow={`${capabilities.length} sourced categories`} title="Technology capabilities" aside={<OverlayToggle />} lead="Technology categories implement defensive methods that support CoSAI controls. OWASP supplies the AI categories; ENISA and ECSO supply additional technology terminology. Explore CISA functions and NIST outcomes as supplementary mappings.">
        <DefenseNavigation current="capabilities" />
        <div className="mt-5 flex flex-wrap gap-1.5">
          <FilterPill active={!source} onClick={() => { setSource(null); setClicked(null); }}>All sources</FilterPill>
          {sourceIds.map((id) => <FilterPill key={id} active={source === id} onClick={() => { setSource(id); setClicked(null); }}>{frameworkById.get(id)?.name}</FilterPill>)}
        </div>
        <input aria-label="Search technology capabilities" placeholder="Search capabilities, e.g. DLP or CASB" value={query} onChange={(e) => { setQuery(e.target.value); setClicked(null); }} className="mt-4 w-full max-w-lg rounded-lg border border-line bg-paper px-3 py-2 text-sm" />
      </PageHeader>
      <div className="mx-auto w-full max-w-[1400px] px-6 py-8">
        <p className="mb-3 text-[13px] text-ink-3">{shown.length} of {capabilities.length} technology capabilities</p>
        {overlay && <p className="mb-3 rounded-lg border border-line bg-paper p-3 text-xs text-ink-2">
          Technology deployment: Not assessed. Select a category to see organization mappings and recorded implementations of related mitigations. Those records do not establish deployment of the whole technology category.
        </p>}
        <DefenseMatrix items={shown.map(capabilityMatrixItem)} selectedId={selected}
          onSelect={(id) => setClicked(id === selected ? null : id)} {...filters}
          statusFor={overlay ? () => "notAssessed" : undefined} label="Technology capabilities by control group and deployment surface" />
        {!shown.length && <p className="mt-3 text-sm text-ink-2">No capabilities match these filters.</p>}
        <p className="mt-2 text-xs text-ink-3">Placement follows mapped mitigations’ primary CoSAI control groups and applicable surfaces. A category may appear in several groups. These are possible implementation paths, not deployment claims; inspect the mapping rationale for scope.</p>
        <div ref={detailRef} className="mt-6 scroll-mt-20">
        {capability && <div className="rounded-xl border border-line bg-paper p-7">
          <button onClick={() => setClicked(null)} className="float-right text-sm text-ink-3 hover:text-ink" aria-label="Close capability detail">Close ×</button>
          <p className="eyebrow">{capability.category}</p>
          <h2 className="display mt-1 text-[27px] font-bold text-ink">{capability.title}</h2>
          <p className="mt-2 text-xs text-ink-3">Repository key: {capability.id} · not an official standard identifier</p>
          <p className="mt-4 text-sm leading-relaxed text-ink-2">{capability.description}</p>
          <div className="mt-6">
            <p className="eyebrow">Source categories and framework mappings</p>
            <p className="mt-1 text-xs text-ink-3">Crosswalks authored here. “Supports” means a contribution to a function or outcome; “narrower” means the source category is broader.</p>
            <ul className="mt-3 space-y-3">
              {capability.frameworkMappings.map((m) => {
                const fw = frameworkById.get(m.framework)!;
                const entry = frameworkEntries[m.framework][m.entry];
                const primary = m.framework === capability.primarySource.framework && m.entry === capability.primarySource.entry;
                return <li key={`${m.framework}/${m.entry}`} className="rounded-lg border border-line p-3">
                  <Link href={frameworkHref(m.framework, m.entry)} className="text-sm font-semibold text-introduced hover:underline">{entry.label}{entry.group ? ` · ${entry.group}` : ""}</Link>
                  <p className="mt-1 text-xs text-ink-3">{fw.name} · {fw.version} · {primary ? "naming source" : m.relationship.replaceAll("-", " ")} · {entry.identifierKind === "repository-key" ? "repository key" : "ID"}: {m.entry}</p>
                  <p className="mt-2 text-xs leading-relaxed text-ink-2">{m.rationale}</p>
                  <a href={entry.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-introduced hover:underline">{entry.sourceLocation} ↗</a>
                </li>;
              })}
            </ul>
          </div>
          {overlay && <div className="mt-6 rounded-lg border border-line p-4">
            <p className="eyebrow">Organization mappings</p>
            <div className="mt-2 flex flex-wrap gap-2">{orgEntriesFor("capabilities", capability.id).map((entry) =>
              <Link key={entry.frameworkId + entry.id} href={frameworkHref(entry.frameworkId, entry.id)} className="text-sm text-introduced hover:underline">{entry.label} <span className="text-xs text-ink-3">({entry.id})</span></Link>
            )}</div>
            {!orgEntriesFor("capabilities", capability.id).length && <p className="mt-2 text-xs text-ink-3">No organization mapping recorded.</p>}
            <p className="eyebrow mt-4">Related mitigation implementations</p>
            <p className="mt-1 text-xs text-ink-3">Status belongs to each mitigation and surface, not to this technology category.</p>
            {surfaces.filter((s) => !filters.surface || filters.surface === s.id).map((surface) => {
              const records = mitigationIds.flatMap((id) => {
                const record = orgSurfacePostureFor(id, surface.id);
                return record ? [{ id, record }] : [];
              });
              return <div key={surface.id} className="mt-3">
                <p className="text-xs font-semibold">{surface.title}</p>
                {records.length ? records.map(({ id, record }) => <div key={id} className="mt-2 text-sm text-ink-2">
                  <Link href={`/mitigations?mitigation=${id}`} className="hover:underline">{mitigationById.get(id)?.title}</Link>{" "}<StatusPill status={record.status} compact />
                  {record.technology && <p className="mt-1 text-xs">{record.technology}</p>}
                  {record.note && <p className="mt-1 text-xs text-ink-3">{record.note}</p>}
                </div>) : <p className="mt-1 text-xs text-ink-3">No related assessment recorded.</p>}
              </div>;
            })}
          </div>}
          <div className="mt-6">
            <p className="eyebrow">Implementation paths to CoSAI controls</p>
            <p className="mt-1 text-xs text-ink-3">Possible implementations, not product guarantees. A broad mitigation can support controls outside this technology’s scope; review both mapping rationales.</p>
            <ul className="mt-3 space-y-3">
              {capability.mitigationMappings.map((m) => {
                const mitigation = mitigationById.get(m.mitigation)!;
                return <li key={m.mitigation} className="rounded-lg border border-line p-3">
                  <Link href={`${matrixHref("/mitigations", filters.category, filters.surface)}${filters.category || filters.surface ? "&" : "?"}mitigation=${m.mitigation}`} className="text-sm font-semibold text-introduced hover:underline">{mitigation.title} <span className="text-xs font-normal text-ink-3">({mitigation.id})</span></Link>
                  <p className="mt-2 text-sm text-ink-2">{m.rationale}</p>
                  <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-ink-2">Related CoSAI controls and their framework mappings</summary>
                    {mitigation.controlMappings.map((cm) => {
                      const control = controlById.get(cm.control)!;
                      return <div key={cm.control} className="mt-3 border-t border-line pt-3">
                        <Link href={`/controls?control=${control.id}`} className="text-sm font-semibold hover:underline">{control.title}</Link>
                        <p className="my-2 text-xs text-ink-3">{cm.rationale}</p>
                        <MappingBadges extra={mappingsForControl(control)} mappings={control.mappings} />
                      </div>;
                    })}
                  </details>
                </li>;
              })}
            </ul>
          </div>
          <details className="mt-6"><summary className="cursor-pointer text-sm font-semibold">Related architectures and incidents</summary>
            <p className="mt-2 text-xs text-ink-3">Architectures share a mapped mitigation; incidents share a related CoSAI control. These links do not assert that this technology was deployed or would have prevented an incident.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">{relatedArchitectures.map((a) => <Link key={a.id} href={`/reference?archetype=${a.id}`}><Chip>{a.title}</Chip></Link>)}</div>
            <div className="mt-3 flex flex-wrap gap-1.5">{relatedIncidents.map((i) => <Link key={i.id} href={`/examples?incident=${i.id}`}><Chip tone="exposed">{i.title}</Chip></Link>)}</div>
          </details>
        </div>}
        </div>
      </div>
    </>
  );
}
