"use client";

/** One tool × one capability, in full: mechanism, operator steps, the organisation's note. */
import Link from "next/link";

import { Chip } from "@/components/Chips";
import { Prose } from "@/components/Prose";
import { archetypeById, capabilityById, controlsForCapability, org, orgStatusFor, orgSurfacePostureFor, surfaceById } from "@/lib/data";
import { frameworkHref, orgEntriesFor } from "@/lib/frameworks";
import type { Tool } from "@/lib/types";
import { OrgStatusPill } from "./OrgStatusPill";
import { useOrgOverlay } from "./overlay";
import { enforcementFor, OWNER_META } from "./model";
import { CoverageBadge } from "./shared";

export function ControlRowDetail({ tool, capabilityId, showTitle = false }: { tool: Tool; capabilityId: string; showTitle?: boolean }) {
  const overlay = useOrgOverlay();
  const capability = capabilityById.get(capabilityId);
  const control = tool.controls.find((c) => c.capability === capabilityId);
  const status = orgStatusFor(tool.id, capabilityId);
  const orgIds = orgEntriesFor("capabilities", capabilityId);
  const cosai = controlsForCapability(capabilityId);
  const arch = archetypeById.get(tool.architecture);
  const enforcement = enforcementFor(tool.architecture, [capabilityId]);
  const surfacePosture = overlay && arch ? orgSurfacePostureFor(capabilityId, arch.surface) : undefined;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div>
        {showTitle && (
          <p className="mb-2 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-ink">
            {capability?.title ?? capabilityId}
            <CoverageBadge coverage={control?.coverage} long />
            {overlay && status && <OrgStatusPill status={status.status} compact />}
          </p>
        )}
        {control ? (
          <>
            {control.mechanism && (
              <p className="text-[12.5px] text-ink-2">
                <span className="eyebrow mr-2">Mechanism</span>
                {control.mechanism}
              </p>
            )}
            {control.note && <p className="mt-1.5 text-[12.5px] leading-snug text-ink-2">{control.note}</p>}
            {control.steps?.length ? (
              <ol className="mt-2.5 space-y-2">
                {control.steps.map((step, si) => (
                  <li key={step.title} className="flex gap-2.5">
                    <span className="ident mt-[2px] shrink-0 text-ink-3">{si + 1}</span>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-ink">
                        {step.url ? (
                          <a href={step.url} target="_blank" rel="noreferrer" className="hover:text-introduced hover:underline">
                            {step.title} ↗
                          </a>
                        ) : (
                          step.title
                        )}
                      </p>
                      <Prose blocks={step.body} size="sm" />
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}
            {control.verified && <p className="ident mt-2 text-[10.5px] text-ink-3">verified {control.verified}</p>}
          </>
        ) : (
          <p className="text-[12.5px] leading-snug text-ink-3">
            The registry has no vendor record for this capability on {tool.name} yet. It is pinned on{" "}
            <Link href={`/reference?archetype=${tool.architecture}`} className="font-semibold text-introduced hover:underline">
              the architecture
            </Link>{" "}
            so it belongs in the reference set; the research pass has not reached it.
          </p>
        )}
      </div>
      <div className="space-y-3">
        <div>
          <p className="eyebrow">Enterprise layer · where the drawing enforces it</p>
          <ul className="mt-1.5 space-y-1.5">
            {enforcement.map((e) => (
              <li key={e.blockId} className="text-[12px] leading-snug text-ink-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: OWNER_META[e.owner]?.color }} />{" "}
                <span className="font-semibold text-ink">{e.title}</span>
                <span className="text-ink-3"> · {OWNER_META[e.owner]?.label ?? e.owner}</span>
                {e.notes.map((n, i) => (
                  <span key={i} className="block text-[11.5px] text-ink-3">
                    {n}
                  </span>
                ))}
              </li>
            ))}
          </ul>
          {capability?.examples?.length ? (
            <p className="mt-1.5 text-[11.5px] leading-snug text-ink-3">
              <span className="eyebrow mr-1">Bought as</span>
              {capability.examples.join(" · ")}
            </p>
          ) : null}
          {surfacePosture && arch && (
            <p className="mt-1.5 text-[12px] leading-snug text-ink-2">
              <OrgStatusPill status={surfacePosture.status} compact />{" "}
              {surfacePosture.technology ?? "Enterprise capability"} on {surfaceById.get(arch.surface)?.title.toLowerCase()}
              {surfacePosture.note && <span className="block text-[11.5px] text-ink-3">{surfacePosture.note}</span>}
            </p>
          )}
        </div>
        <div>
          <p className="eyebrow">CoSAI controls</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {cosai.map((c) => (
              <Link key={c.id} href={`/controls?control=${c.id}`}>
                <Chip tone="mitigated">{c.title}</Chip>
              </Link>
            ))}
            <Link href={`/capabilities?capability=${capabilityId}`}>
              <Chip tone="introduced">{capability?.abbrev ?? capability?.title ?? capabilityId}</Chip>
            </Link>
          </div>
        </div>
        {overlay && orgIds.length > 0 && (
          <div>
            <p className="eyebrow">{org.example ? "Example organisation" : org.name}</p>
            <ul className="mt-1.5 space-y-1">
              {orgIds.map((o) => (
                <li key={`${o.frameworkId}:${o.id}`} className="text-[12.5px] leading-snug">
                  <Link href={frameworkHref(o.frameworkId, o.id)} className="hover:underline">
                    <span className="ident mr-1.5 rounded bg-mist px-1.5 py-[2px] text-ink-2">{o.id}</span>
                    <span className="text-ink-2">{o.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {overlay && status && (status.note || status.evidence) && (
          <div>
            <p className="eyebrow">Status note</p>
            <p className="mt-1 text-[12.5px] leading-snug text-ink-2">
              {status.note}
              {status.evidence && <span className="ident ml-1.5 text-ink-3">{status.evidence}</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
