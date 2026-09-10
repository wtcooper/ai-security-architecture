"use client";

/**
 * The named products that instantiate one architecture — the Tools tab on the reference page.
 * Each row carries the vendor's coverage of the drawing's pinned capabilities and the
 * organisation's adoption decision, and links into the AI Tooling tab for the detail.
 */
import Link from "next/link";

import { org, orgAdoptionFor, orgPostureFor, vendorById, vendors } from "@/lib/data";
import type { Archetype, Tool } from "@/lib/types";
import { ADOPTION_META, SURFACE_CLASS_META } from "./labels";
import { OrgStatusPill } from "./OrgStatusPill";

export function ToolsForArchitecture({ archetype, tools }: { archetype: Archetype; tools: Tool[] }) {
  if (!tools.length) {
    return (
      <p className="text-[13px] text-ink-3">
        No product in the registry maps onto this architecture yet. Add one under data/tooling/ with{" "}
        <span className="ident">architecture: {archetype.id}</span>.
      </p>
    );
  }
  const pinned = archetype.capabilities;
  return (
    <div>
      <p className="text-[12px] leading-snug text-ink-3">
        Named products that instantiate this drawing. Coverage counts the {pinned.length} pinned capabilities the
        vendor documents a control for; the adoption pill is {org.example ? "the example organisation's" : `${org.name}'s`}.
      </p>
      <div className="mt-3 space-y-4">
        {vendors
          .filter((v) => tools.some((t) => t.vendor === v.id))
          .map((v) => (
            <div key={v.id}>
              <p className="eyebrow">{v.name}</p>
              <ul className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                {tools
                  .filter((t) => t.vendor === v.id)
                  .map((t) => {
                    const covered = t.controls.filter(
                      (c) => pinned.includes(c.capability) && c.coverage !== "none" && c.coverage !== "unknown",
                    ).length;
                    const secondary = t.architecture !== archetype.id;
                    const posture = orgPostureFor(t.id);
                    const statuses = Object.values(posture?.controls ?? {});
                    const enabled = statuses.filter((s) => s.status === "inPlace").length;
                    return (
                      <li key={t.id}>
                        <Link
                          href={`/tooling?tool=${t.id}`}
                          className="block rounded-lg border border-line bg-paper px-3.5 py-2.5 transition-colors hover:border-line-strong"
                        >
                          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className="text-[13.5px] font-semibold text-ink">{t.name}</span>
                            <span className="text-[11px] text-ink-3">
                              {t.surfaceClasses.map((c) => SURFACE_CLASS_META[c].short).join(" · ")}
                              {secondary && " · secondary"}
                            </span>
                            <span className="ml-auto text-[11px] font-medium text-ink-2" title="Pinned capabilities the vendor documents a control for">
                              {covered}/{pinned.length} covered
                            </span>
                          </span>
                          <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-3">
                            <span
                              className="rounded-full border border-line-strong px-1.5 py-px font-semibold text-ink-2"
                              title={ADOPTION_META[orgAdoptionFor(t.id)].blurb}
                            >
                              {ADOPTION_META[orgAdoptionFor(t.id)].label}
                            </span>
                            {statuses.length > 0 && (
                              <>
                                <OrgStatusPill status="inPlace" compact title="Controls enabled" />
                                <span>{enabled} of {statuses.length} assessed</span>
                              </>
                            )}
                            <span className="ident ml-auto">as of {t.asOf}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
      </div>
      <p className="mt-3 text-[11.5px] text-ink-3">
        {vendorById.size} vendors in the registry. Compare every tool on this architecture on the{" "}
        <Link href={`/tooling?view=compare&arch=${archetype.id}`} className="font-semibold text-introduced hover:underline">
          AI Tooling tab →
        </Link>
      </p>
    </div>
  );
}
