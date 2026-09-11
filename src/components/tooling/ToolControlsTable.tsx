"use client";

/**
 * The reference control set of one tool — its architecture's pinned capabilities — with the
 * vendor's implementation of each and the organisation's status. A row opens to the
 * mechanism and the operator steps, each linking to the vendor page that documents it.
 */
import { useState } from "react";

import { controlsForCapability, controlsForTool, org, orgStatusFor, orgToolStatusFor } from "@/lib/data";
import { orgEntriesFor } from "@/lib/frameworks";
import type { Tool } from "@/lib/types";
import { ControlRowDetail } from "./ControlRowDetail";
import { StatusPill } from "@/components/StatusPill";
import { useOrgOverlay } from "./overlay";
import { CoverageBadge, configureUrl } from "./shared";

export function ToolControlsTable({ tool, openCapability }: { tool: Tool; openCapability?: string | null }) {
  const rows = controlsForTool(tool.id);
  const overlay = useOrgOverlay();
  const onboarded = orgToolStatusFor(tool.id) !== "gap";
  const [open, setOpen] = useState<string | null>(openCapability ?? null);
  const addressed = rows.filter((r) => r.control).length;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow">
          Reference controls · {rows.length} pinned on the architecture · {addressed} addressed by the vendor
        </p>
        <p className="text-[11.5px] text-ink-3">
          {overlay
            ? `Coverage is the vendor's; status is ${org.example ? "the example organisation's" : `${org.name}'s`}.`
            : "Coverage is the vendor's, from its own documentation. Open a row for the steps and links."}
        </p>
      </div>
      <div className="mt-2 overflow-x-auto rounded-lg border border-line">
        <table className="w-full min-w-[720px] border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-mist text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">
              <th className="px-3 py-2 font-semibold">Capability</th>
              <th className="px-3 py-2 font-semibold">CoSAI controls</th>
              {overlay && <th className="px-3 py-2 font-semibold">Your controls</th>}
              <th className="px-3 py-2 font-semibold">Admin-settable?</th>
              {overlay && <th className="px-3 py-2 font-semibold">Status</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ capability, control }, i) => {
              const isOpen = open === capability.id;
              const status = orgStatusFor(tool.id, capability.id);
              const orgIds = orgEntriesFor("capabilities", capability.id);
              const cosai = controlsForCapability(capability.id);
              const url = configureUrl(control);
              return (
                <RowGroup key={capability.id}>
                  <tr
                    className={`cursor-pointer border-t border-line align-top transition-colors hover:bg-mist/60 ${
                      isOpen ? "bg-mist/60" : ""
                    }`}
                    onClick={() => setOpen(isOpen ? null : capability.id)}
                    aria-expanded={isOpen}
                  >
                    <td className="px-3 py-2">
                      <span className="mr-1.5 inline-flex h-[17px] w-[17px] items-center justify-center rounded-full border border-introduced bg-introduced-soft text-[9.5px] font-bold text-introduced">
                        {i + 1}
                      </span>
                      <span className="font-medium text-ink">{capability.title}</span>
                    </td>
                    <td className="px-3 py-2 text-ink-2">
                      {cosai.map((c) => c.title).join(" · ")}
                    </td>
                    {overlay && (
                    <td className="px-3 py-2">
                      {orgIds.length ? (
                        <span className="flex flex-wrap gap-1">
                          {orgIds.map((o) => (
                            <span key={`${o.frameworkId}:${o.id}`} className="ident rounded bg-mist px-1.5 py-[2px] text-ink-2" title={o.label}>
                              {o.id}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-ink-3">—</span>
                      )}
                    </td>
                    )}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <CoverageBadge coverage={control?.coverage} url={url} />
                    </td>
                    {overlay && (
                      <td className="px-3 py-2 whitespace-nowrap">
                        {onboarded ? <StatusPill status={status?.status ?? "gap"} title={status?.note} /> : <span className="text-ink-3">not onboarded</span>}
                      </td>
                    )}
                  </tr>
                  {isOpen && (
                    <tr className="border-t border-line/60 bg-paper">
                      <td colSpan={overlay ? 5 : 3} className="px-4 pb-4 pt-3">
                        <ControlRowDetail tool={tool} capabilityId={capability.id} />
                      </td>
                    </tr>
                  )}
                </RowGroup>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Two `<tr>`s per row need a keyed wrapper that renders nothing of its own. */
function RowGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
