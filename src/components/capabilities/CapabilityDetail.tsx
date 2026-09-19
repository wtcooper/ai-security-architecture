"use client";

import Link from "next/link";
import { Chip, MappingBadges } from "@/components/Chips";
import { Prose } from "@/components/Prose";
import { bandFor } from "@/lib/bands";
import { BAND_TOKENS } from "@/lib/map-layout";
import {
  archetypesForMitigation,
  categoriesForMitigations,
  componentsForMitigation,
  mitigationById,
  specializationsOf,
  componentTitle,
  controlCategories,
  controlsForMitigation,
  risksForMitigation,
  orgSurfacePostureFor,
  orgSurfaceStatusFor,
  surfaces,
  frameworkById,
} from "@/lib/data";
import { mappingsForMitigation } from "@/lib/frameworks";
import { useOrgOverlay } from "@/components/tooling/overlay";
import type { Mitigation } from "@/lib/types";
import { ArchetypeLinks } from "@/components/reference/ArchetypeLinks";
import { StatusPill } from "@/components/StatusPill";

export function CapabilityDetail({ mitigation, onClose, showOrg = true, framed = true }: { mitigation: Mitigation; onClose?: () => void; showOrg?: boolean; framed?: boolean }) {
  const controls = controlsForMitigation(mitigation.id);
  const risks = risksForMitigation(mitigation.id);
  const components = componentsForMitigation(mitigation.id);
  const categoryTitle = controlCategories.find((c) => c.id === mitigation.category)?.title;
  const orgMappings = mappingsForMitigation(mitigation).filter((m) => showOrg || !frameworkById.get(m.frameworkId)?.org);
  const orgOverlay = useOrgOverlay();
  const overlay = showOrg && orgOverlay;

  return (
    <div className={framed ? "rounded-xl border border-line bg-paper p-7" : undefined}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="display text-[24px] font-bold leading-tight text-ink">
            {mitigation.title}
          </h2>
          <p className="mt-2 text-xs text-ink-3">{mitigation.parent ? `Authored specialisation of ${mitigation.parent} · ${mitigation.id}` : `${mitigation.origin.framework} · ${mitigation.id} · ${mitigation.origin.version}`}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close detail"
            className="rounded-md p-1.5 text-ink-3 transition-colors hover:bg-mist hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path
                d="M4 4 L12 12 M12 4 L4 12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      <p className="mt-2 text-xs text-ink-3">{categoryTitle} · {mitigation.kind === "support" ? "Governance support" : "Defensive function"} · {mitigation.origin.entityType}</p>
      {mitigation.origin.url && <a href={mitigation.origin.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-introduced hover:underline">Read the official {mitigation.title} definition ↗</a>}
      <div className="mt-4">
        <p className="eyebrow">{mitigation.parent ? `Upstream definition of ${mitigation.parent} · unmodified` : "Upstream definition · unmodified"}</p>
        <Prose blocks={mitigation.description} className="mt-2 whitespace-pre-line" />
      </div>
      <div className="mt-4 rounded-lg bg-mist p-4">
        <p className="eyebrow">Implementation scope · authored here</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{mitigation.implementation}</p>
        {mitigation.features && <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-ink-2">{mitigation.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>}
      </div>

      {orgMappings.length > 0 && (
        <div className="mt-4">
          <MappingBadges extra={orgMappings} />
        </div>
      )}

      {(mitigation.parent || specializationsOf(mitigation.id).length > 0) && (
        <div className="mt-5 rounded-lg border border-line p-4">
          <p className="eyebrow">{mitigation.parent ? "Specialises" : "Specialised as"}</p>
          <p className="mt-1 text-xs text-ink-3">{mitigation.parent
            ? "An authored narrowing of one MITRE entry, kept where the parent is too coarse to pin or report on. The parent is the citable identifier."
            : "Authored narrowings of this entry, each one actionable countermeasure; their records roll up here."}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {mitigation.parent && <Link href={`/capabilities?capability=${mitigation.parent}`}><Chip tone="introduced">{mitigationById.get(mitigation.parent)?.title} <span className="text-ink-3">({mitigation.parent})</span></Chip></Link>}
            {specializationsOf(mitigation.id).map((s) => <Link key={s.id} href={`/capabilities?capability=${s.id}`}><Chip tone="introduced">{s.title}</Chip></Link>)}
          </div>
        </div>
      )}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="eyebrow">Realised by · technology categories</p>
          <p className="mt-1 text-xs text-ink-3">How this is bought. Categories map to the MITRE entry, so a specialisation inherits its parent&rsquo;s.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {categoriesForMitigations([mitigation.id]).map((c) => <Link key={c.id} href={`/capabilities?category=${c.id}`}><Chip>{c.title}</Chip></Link>)}
            {!categoriesForMitigations([mitigation.id]).length && <span className="text-xs text-ink-3">No technology category; delivered by process.</span>}
          </div>
        </div>
        {mitigation.process?.length ? (
          <div>
            <p className="eyebrow">Realised by · process</p>
            <ul className="mt-2 space-y-1.5">
              {mitigation.process.map((item) => <li key={item.title} className="text-[12.5px] leading-snug"><span className="font-medium text-ink">{item.title}</span><span className="block text-[11.5px] text-ink-3">{item.note}</span></li>)}
            </ul>
          </div>
        ) : null}
      </div>
      <details className="mt-5">
        <summary className="cursor-pointer text-xs font-semibold text-ink-2">Implementation examples · authored guidance</summary>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {mitigation.examples.map((e) => (
            <Chip key={e}>{e}</Chip>
          ))}
        </div>
      </details>

      {overlay && <p className="mt-6 text-xs text-ink-3">Organization status below rolls up from capability deployments. It describes supporting technology, not an assessment of this mitigation.</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {surfaces.map((s) => {
          const info = mitigation.surfaces[s.id];
          const status = overlay ? orgSurfaceStatusFor(mitigation.id, s.id) : null;
          return (
            <div
              key={s.id}
              className={`rounded-lg border border-line p-3.5 ${info?.applies ? "" : "bg-mist"}`}
            >
              <p className="flex items-center justify-between gap-2 text-[13px] font-semibold text-ink">
                {s.title}
                {info?.applies ? (
                  status && <StatusPill status={status} />
                ) : (
                  <span className="text-[11px] font-medium text-ink-3">outside profile</span>
                )}
              </p>
              <p className="mt-1.5 text-xs font-medium text-ink-2">{info?.responsibility.replaceAll("-", " ")}</p>
              {info?.note && <p className="mt-1.5 text-[12.5px] leading-snug text-ink-3">{info.note}</p>}
              {overlay && info?.applies && orgSurfacePostureFor(mitigation.id, s.id)?.technology && (
                <p className="mt-1.5 text-[12px] leading-snug text-ink-2">
                  <span className="eyebrow mr-1">Org capability</span>
                  {orgSurfacePostureFor(mitigation.id, s.id)!.technology}
                </p>
              )}
              {overlay && orgSurfacePostureFor(mitigation.id, s.id)?.note && <p className="mt-2 text-xs text-ink-3">{orgSurfacePostureFor(mitigation.id, s.id)!.note}</p>}
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <p className="eyebrow">Contributes to CoSAI controls</p>
        <p className="mt-1 text-xs text-ink-3">Authored supporting relationships, scoped above. These do not establish control fulfillment.</p>
        <div className="mt-2 space-y-2">
          {controlCategories
            .filter((cat) => controls.some((c) => c.category === cat.id))
            .map((cat) => (
              <div key={cat.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
                <span className="ident shrink-0">{cat.title}</span>
                {controls
                  .filter((c) => c.category === cat.id)
                  .map((c) => (
                    <Link key={c.id} href={`/controls?control=${c.id}`}>
                      <Chip tone="mitigated">{c.title}</Chip>
                    </Link>
                  ))}
              </div>
            ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="eyebrow">Related risks · authored mapping</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {risks.map((r) => (
              <Link key={r.id} href={`/risks?risk=${r.id}`}>
                <Chip tone="exposed">{r.title}</Chip>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="eyebrow">Anchored components</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {components.map((c) => (
              <Link key={c.id} href={`/components?component=${c.id}`}>
                <Chip>
                  <span
                    className="mr-1.5 inline-block h-2 w-2 rounded-full"
                    style={{ background: BAND_TOKENS[bandFor(c.id, c.category, c.subcategory)].rail }}
                  />
                  {componentTitle(c.id)}
                </Chip>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ArchetypeLinks
          archetypes={archetypesForMitigation(mitigation.id)}
          empty="No reference architecture attaches this mitigation yet. Either the archetype it belongs to is not drawn, or nothing in the catalogue needs it."
        />
      </div>

      {mitigation.sources?.length ? (
        <div className="mt-6 border-t border-line pt-4">
          <p className="eyebrow">Sources</p>
          <ul className="mt-1.5 space-y-1">
            {mitigation.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] text-introduced hover:underline"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
