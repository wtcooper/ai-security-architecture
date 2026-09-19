"use client";

import Link from "next/link";
import { Chip } from "@/components/Chips";
import { StatusPill } from "@/components/StatusPill";
import { ArchetypeLinks } from "@/components/reference/ArchetypeLinks";
import { archetypes, capabilityById, categoryById, controlById, controlCategories, frameworkById, mitigations, orgCapabilitySurfacePostureFor, orgControlStatusFor, personaTitle, surfaces } from "@/lib/data";
import { frameworkHref, orgEntriesFor } from "@/lib/frameworks";

/**
 * One capability: what it delivers, where it can exist, and how it is realised by technology,
 * process and people. With org data on, the surface cards and control chips carry status.
 */
export function CapabilityDetail({ capabilityId, overlay, surface = "", onClose, framed = true }: { capabilityId: string; overlay: boolean; surface?: string; onClose?: () => void; framed?: boolean }) {
  const capability = capabilityById.get(capabilityId)!;
  const { technology, process, people } = capability.realization;
  const supporting = mitigations.filter((m) => m.controls.some((id) => capability.controls.includes(id)));
  const related = archetypes.filter((a) => a.mitigations.some((id) => supporting.some((m) => m.id === id)));
  const shownSurfaces = surfaces.filter((s) => !surface || s.id === surface);
  return <section className={framed ? "rounded-xl border border-line bg-paper p-6" : undefined}>
    {onClose && <button onClick={onClose} className="float-right text-sm text-ink-3 hover:text-ink" aria-label="Close capability detail">Close ×</button>}
    <p className="eyebrow">Capability · {capability.id}</p>
    <h2 className="display mt-1 text-[27px] font-bold text-ink">{capability.title}</h2>
    <p className="mt-3 text-sm leading-relaxed text-ink-2">{capability.description}</p>

    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      {surfaces.map((s) => {
        const info = capability.surfaces[s.id];
        const posture = overlay && info?.applies ? orgCapabilitySurfacePostureFor(capability.id, s.id) : null;
        return <div key={s.id} className={`rounded-lg border border-line p-3.5 ${info?.applies ? "" : "bg-mist"}`}>
          <p className="flex items-center justify-between gap-2 text-[13px] font-semibold text-ink">
            {s.title}
            {info?.applies ? posture && <StatusPill status={posture.status} compact /> : <span className="text-[11px] font-medium text-ink-3">not available</span>}
          </p>
          <p className="mt-1.5 text-[12.5px] leading-snug text-ink-3">{info?.note}</p>
          {posture?.contributions.length ? <ul className="mt-2 space-y-1 border-t border-line pt-2">
            {posture.contributions.map((c) => <li key={c.id + c.context} className="text-[12px] text-ink-2">
              <span className="font-semibold">{c.title}</span> · {c.context} <StatusPill status={c.record!.status} compact />
              {c.record?.note && <span className="block text-[11.5px] text-ink-3">{c.record.note}</span>}
            </li>)}
          </ul> : null}
        </div>;
      })}
    </div>

    <div className="mt-6">
      <p className="eyebrow">Delivers CoSAI controls</p>
      <p className="mt-1 text-xs text-ink-3">The one relation maintained by hand. Control status is a rollup of the capabilities that deliver it.</p>
      <div className="mt-2 space-y-2">
        {controlCategories.filter((cat) => capability.controls.some((id) => controlById.get(id)!.category === cat.id)).map((cat) => (
          <div key={cat.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
            <span className="ident shrink-0">{cat.title}</span>
            {capability.controls.filter((id) => controlById.get(id)!.category === cat.id).map((id) => (
              <Link key={id} href={`/controls?control=${id}`} className="inline-flex items-center gap-1.5">
                <Chip tone="mitigated">{controlById.get(id)!.title}</Chip>
                {overlay && <StatusPill status={orgControlStatusFor(id, surface || undefined)} compact />}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>

    <div className="mt-6">
      <p className="eyebrow">How it is realised</p>
      <div className="mt-2 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-line p-3.5">
          <p className="text-[12px] font-semibold text-ink">Technology <span className="font-normal text-ink-3">· {technology.length} categories</span></p>
          {technology.length ? <ul className="mt-2 space-y-1.5">
            {technology.map((id) => {
              const category = categoryById.get(id)!;
              const source = frameworkById.get(category.primarySource.framework);
              return <li key={id} className="text-[12.5px] leading-snug">
                <Link href={frameworkHref(category.primarySource.framework, category.primarySource.entry)} className="font-medium text-ink hover:text-introduced hover:underline">{category.title}</Link>
                <span className="block text-[11px] text-ink-3">{source?.name ?? category.primarySource.framework} · {category.category}</span>
              </li>;
            })}
          </ul> : <p className="mt-2 text-[12.5px] text-ink-3">No technology category; this capability runs on process and people.</p>}
        </div>
        <div className="rounded-lg border border-line p-3.5">
          <p className="text-[12px] font-semibold text-ink">Process <span className="font-normal text-ink-3">· {process.length} items</span></p>
          <ul className="mt-2 space-y-2">
            {process.map((item) => <li key={item.title} className="text-[12.5px] leading-snug">
              <span className="font-medium text-ink">{item.title}</span>
              <span className="block text-[11.5px] text-ink-3">{item.note}</span>
            </li>)}
          </ul>
        </div>
        <div className="rounded-lg border border-line p-3.5">
          <p className="text-[12px] font-semibold text-ink">People <span className="font-normal text-ink-3">· CoSAI personas</span></p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {people.map((id) => <Link key={id} href={`/personas?persona=${id}`}><Chip>{personaTitle(id)}</Chip></Link>)}
          </div>
        </div>
      </div>
    </div>

    {overlay && <div className="mt-6 rounded-lg border border-line p-4">
      <p className="eyebrow">Organization capabilities mapped here</p>
      <div className="mt-2 flex flex-wrap gap-2">{orgEntriesFor("capabilities", capability.id).map((entry) =>
        <Link key={entry.frameworkId + entry.id} href={frameworkHref(entry.frameworkId, entry.id)} className="text-sm text-introduced hover:underline">{entry.label} <span className="text-xs text-ink-3">({entry.id})</span></Link>
      )}</div>
      {!orgEntriesFor("capabilities", capability.id).length && <p className="mt-2 text-xs text-ink-3">No organization capability is mapped to this one yet; it reads as not assessed everywhere.</p>}
      {shownSurfaces.length === 1 && <p className="mt-2 text-xs text-ink-3">Showing {shownSurfaces[0].title.toLowerCase()} records above.</p>}
    </div>}

    <details className="mt-6">
      <summary className="cursor-pointer text-xs font-semibold text-ink-2">Supporting MITRE methods ({supporting.length})</summary>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {supporting.map((m) => <Link key={m.id} href={`/mitigations?mitigation=${m.id}`}><Chip tone="introduced">{m.title} <span className="text-ink-3">({m.id})</span></Chip></Link>)}
      </div>
    </details>

    <div className="mt-6">
      <ArchetypeLinks archetypes={related} empty="No reference architecture pins a method that supports this capability's controls." />
    </div>
  </section>;
}
