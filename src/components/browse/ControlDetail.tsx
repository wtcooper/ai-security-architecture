"use client";

import Link from "next/link";
import { Chip, MappingBadges } from "@/components/Chips";
import { Prose } from "@/components/Prose";
import { ArchetypeLinks } from "@/components/reference/ArchetypeLinks";
import { CapabilityLinks } from "@/components/capabilities/CapabilityLinks";
import { StatusPill } from "@/components/StatusPill";
import { archetypesForControl, mitigationGaps, mitigationsForControl, componentsForControl, componentTitle, controlById, controlCategories, frameworkById, orgControlPostureFor, personaTitle, risksForControl } from "@/lib/data";
import { mappingsForControl } from "@/lib/frameworks";

export function ControlDetail({ controlId, onClose, framed = true, overlay = false }: { controlId: string; onClose?: () => void; framed?: boolean; overlay?: boolean }) {
  const control = controlById.get(controlId)!;
  const risks = risksForControl(control.id);
  const comps = componentsForControl(control.id);
  const mitigationGap = mitigationGaps.find((gap) => gap.control === control.id);
  const posture = overlay ? orgControlPostureFor(control.id) : null;
  return <section className={framed ? "rounded-xl border border-line bg-paper p-6" : undefined}>
    {onClose && <button onClick={onClose} className="float-right text-xs text-ink-3 hover:text-ink" aria-label="Close control detail">Close ×</button>}
    <p className="eyebrow">{controlCategories.find((c) => c.id === control.category)?.title}</p>
    <h2 className="display mt-1.5 flex flex-wrap items-center gap-3 text-[27px] font-bold leading-tight text-ink">{control.title}{posture && <StatusPill status={posture.status} />}</h2>
    {posture && <p className="mt-2 text-xs text-ink-3">Rolled up from the capabilities below across every surface and available product; never authored against the control itself.</p>}

    <Prose blocks={control.description} refs={control.externalReferences} className="mt-4" />
    <CapabilityLinks controls={[control.id]} />
    <details className="mt-5">
      <summary className="cursor-pointer text-xs font-semibold text-ink-2">How · supporting MITRE methods ({mitigationsForControl(control.id).length})</summary>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {mitigationsForControl(control.id).map((m) => (
          <Link key={m.id} href={`/mitigations?mitigation=${m.id}`}>
            <Chip tone="introduced">{m.title} <span className="text-ink-3">({m.id})</span></Chip>
          </Link>
        ))}
      </div>
      {!mitigationsForControl(control.id).length && <p className="mt-2 text-sm text-ink-3">No MITRE method maps to this control; it is delivered by process.</p>}
      {mitigationGap && (
        <div className="mt-3 rounded-lg border border-line bg-mist p-4">
          <p className="eyebrow">MITRE mitigation mapping · {mitigationGap.assessment}</p>
          <p className="mt-2 text-sm text-ink-2">{mitigationGap.missing}</p>
        </div>
      )}
    </details>

    <div className="mt-6 grid gap-6 sm:grid-cols-2">
      <div>
        <p className="eyebrow">
          Protects {control.components === "all" ? "all components" : `${comps.length} components`}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {control.components === "all" ? (
            <Chip>Every component</Chip>
          ) : (
            comps.map((c) => (
              <Link key={c.id} href={`/components?component=${c.id}`}>
                <Chip>{componentTitle(c.id)}</Chip>
              </Link>
            ))
          )}
        </div>
      </div>
      <div>
        <p className="eyebrow">
          Addresses {control.risks === "all" ? "all risks" : `${risks.length} risks`}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {control.risks === "all" ? (
            <Chip tone="exposed">Every risk</Chip>
          ) : (
            risks.map((r) => (
              <Link key={r.id} href={`/risks?risk=${r.id}`}>
                <Chip tone="exposed">{r.title}</Chip>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>

    <div className="mt-6">
      <p className="eyebrow">Owned by</p>
      <p className="mt-1.5 text-[13.5px] text-ink-2">
        {control.personas.map(personaTitle).join(" · ")}
      </p>
    </div>

    <div className="mt-6">
      <ArchetypeLinks
        archetypes={archetypesForControl(control.id)}
        empty="No reference architecture reaches this control through its mitigation set — a gap worth reading as a finding about the architectures, not about the control."
      />
    </div>

    <div className="mt-6">
      <MappingBadges mappings={control.mappings} extra={mappingsForControl(control).filter((m) => !frameworkById.get(m.frameworkId)?.org)} />
    </div>

  </section>;
}
