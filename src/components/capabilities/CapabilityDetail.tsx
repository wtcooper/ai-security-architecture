"use client";

import Link from "next/link";
import { Chip, MappingBadges } from "@/components/Chips";
import { Prose } from "@/components/Prose";
import { bandFor } from "@/lib/bands";
import { BAND_TOKENS } from "@/lib/map-layout";
import {
  archetypesForCapability,
  componentsForCapability,
  componentTitle,
  controlCategories,
  controlsForCapability,
  risksForCapability,
  orgSurfacePostureFor,
  surfaces,
  toolsForCapability,
  vendorById,
} from "@/lib/data";
import { mappingsForCapability } from "@/lib/frameworks";
import { useOrgOverlay } from "@/components/tooling/overlay";
import type { Capability, CapabilityStatus } from "@/lib/types";
import { ArchetypeLinks } from "@/components/reference/ArchetypeLinks";
import { StatusPill } from "./StatusPill";

export function CapabilityDetail({
  capability,
  effective,
  onClose,
}: {
  capability: Capability;
  effective: (capability: Capability, surfaceId: string) => CapabilityStatus;
  onClose: () => void;
}) {
  const controls = controlsForCapability(capability.id);
  const risks = risksForCapability(capability.id);
  const components = componentsForCapability(capability.id);
  const categoryTitle = controlCategories.find((c) => c.id === capability.category)?.title;
  const orgMappings = mappingsForCapability(capability);
  const tools = toolsForCapability(capability.id);
  const overlay = useOrgOverlay();

  return (
    <div className="rounded-xl border border-line bg-paper p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Capability · {categoryTitle}</p>
          <h2 className="display mt-1.5 text-[24px] font-bold leading-tight text-ink">
            {capability.title}
          </h2>
        </div>
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
      </div>

      <Prose blocks={capability.description} className="mt-4" />

      {orgMappings.length > 0 && (
        <div className="mt-4">
          <MappingBadges extra={orgMappings} />
        </div>
      )}

      <div className="mt-5">
        <p className="eyebrow">Example technology classes</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {capability.examples.map((e) => (
            <Chip key={e}>{e}</Chip>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {surfaces.map((s) => {
          const info = capability.surfaces[s.id];
          const status = effective(capability, s.id);
          return (
            <div
              key={s.id}
              className={`rounded-lg border border-line p-3.5 ${info?.applies ? "" : "bg-mist"}`}
            >
              <p className="flex items-center justify-between gap-2 text-[13px] font-semibold text-ink">
                {s.title}
                {info?.applies ? (
                  <StatusPill status={status} />
                ) : (
                  <span className="text-[11px] font-medium text-ink-3">not available</span>
                )}
              </p>
              {info?.note && <p className="mt-1.5 text-[12.5px] leading-snug text-ink-3">{info.note}</p>}
              {overlay && orgSurfacePostureFor(capability.id, s.id)?.technology && (
                <p className="mt-1.5 text-[12px] leading-snug text-ink-2">
                  <span className="eyebrow mr-1">With</span>
                  {orgSurfacePostureFor(capability.id, s.id)!.technology}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <p className="eyebrow">Implements CoSAI controls</p>
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
          <p className="eyebrow">Addresses risks</p>
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

      {tools.length > 0 && (
        <div className="mt-6">
          <p className="eyebrow">Implemented by</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tools.map((t) => (
              <Link key={t.id} href={`/reference?archetype=${t.architecture}&tool=${t.id}`}>
                <Chip title={`${vendorById.get(t.vendor)?.name ?? t.vendor} · see how it is switched on`}>
                  {t.name}
                </Chip>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <ArchetypeLinks
          archetypes={archetypesForCapability(capability.id)}
          empty="No reference architecture attaches this capability yet. Either the archetype it belongs to is not drawn, or nothing in the catalogue needs it."
        />
      </div>

      {capability.sources?.length ? (
        <div className="mt-6 border-t border-line pt-4">
          <p className="eyebrow">Sources</p>
          <ul className="mt-1.5 space-y-1">
            {capability.sources.map((s) => (
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
