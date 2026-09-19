"use client";

import Link from "next/link";
import { Chip, MappingBadges } from "@/components/Chips";
import { StatusPill } from "@/components/StatusPill";
import { capabilityById, frameworkById, frameworkEntries, mitigationById, controlById, archetypes, incidents, orgCapabilitySurfacePostureFor, orgCapabilitySurfaceStatusFor, surfaces } from "@/lib/data";
import { frameworkHref, mappingsForControl, orgEntriesFor } from "@/lib/frameworks";
import { matrixHref } from "@/components/defenses/DefenseNavigation";

export function CapabilityDetail({ capabilityId, overlay, surface = "", onClose }: { capabilityId: string; overlay: boolean; surface?: string; onClose: () => void }) {
  const capability = capabilityById.get(capabilityId)!;
  const filters = { category: "", surface };
  const mitigationIds = capability.mitigationMappings.map((m) => m.mitigation);
  const controlIds = [...new Set(mitigationIds.flatMap((id) => mitigationById.get(id)?.controls ?? []))];
  const relatedArchitectures = archetypes.filter((a) => a.mitigations.some((id) => mitigationIds.includes(id)));
  const relatedIncidents = incidents.filter((i) => i.controls.some((id) => controlIds.includes(id)));
  return <section className="rounded-xl border border-line bg-paper p-6">
    <button onClick={onClose} className="float-right text-sm text-ink-3 hover:text-ink" aria-label="Close capability detail">Close ×</button>
    <p className="eyebrow">{capability.category}</p>
    <h2 className="display mt-1 text-[27px] font-bold text-ink">{capability.title}</h2>
    <p className="mt-2 text-xs text-ink-3">Repository key: {capability.id} · not an official standard identifier</p>
    <p className="mt-4 text-sm leading-relaxed text-ink-2">{capability.description}</p>
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      {surfaces.map((s) => {
        const info = capability.surfaces[s.id];
        return <div key={s.id} className={`rounded-lg border border-line p-3.5 ${info?.applies ? "" : "bg-mist"}`}>
          <p className="flex items-center justify-between gap-2 text-[13px] font-semibold text-ink">
            {s.title}
            {info?.applies
              ? overlay && <StatusPill status={orgCapabilitySurfaceStatusFor(capability.id, s.id)} compact />
              : <span className="text-[11px] font-medium text-ink-3">not available</span>}
          </p>
          <p className="mt-1.5 text-[12.5px] leading-snug text-ink-3">{info?.note}</p>
        </div>;
      })}
    </div>
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
      <p className="eyebrow mt-4">Capability deployments</p>
      {surfaces.filter((s) => !filters.surface || filters.surface === s.id).map((surface) => {
        const rollup = orgCapabilitySurfacePostureFor(capability.id, surface.id);
        return <div key={surface.id} className="mt-3">
          <p className="text-xs font-semibold">{surface.title} <StatusPill status={rollup.status} compact /></p>
          {rollup.contributions.length ? rollup.contributions.map((c) => <div key={c.id + c.context} className="mt-2 text-sm text-ink-2">
            <span className="font-semibold">{c.title}</span> · {c.context}{" "}<StatusPill status={c.record!.status} compact />
            {c.record?.note && <p className="mt-1 text-xs">{c.record.note}</p>}
            {c.record?.evidence && <p className="mt-1 text-xs text-ink-3">Evidence: {c.record.evidence}</p>}
          </div>) : <p className="mt-1 text-xs text-ink-3">No capability assessment recorded on this surface.</p>}
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
            <Link href={`${matrixHref("/controls", filters.category, filters.surface)}${filters.category || filters.surface ? "&" : "?"}mitigation=${m.mitigation}`} className="text-sm font-semibold text-introduced hover:underline">{mitigation.title} <span className="text-xs font-normal text-ink-3">({mitigation.id})</span></Link>
            <p className="mt-2 text-sm text-ink-2">{m.rationale}</p>
            {m.sources?.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-introduced hover:underline">{source.title} ↗</a>)}
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
  </section>;
}
