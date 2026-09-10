"use client";

/**
 * One reference architecture's products against its reference controls, as a grid: controls
 * as rows, enterprise capability modules beside them, one admin-control column per product.
 * The header states the inheritance, carries the organisation overlay switch and, with it on,
 * the row-label switch. Used by the AI Tooling tab and by the Tools tab on the drawing itself.
 */
import { useState } from "react";
import Link from "next/link";

import { archetypeById, org } from "@/lib/data";
import type { Tool } from "@/lib/types";
import { GridView } from "./GridView";
import { hasOrgMappings, rowsFor, type LabelMode } from "./model";
import { useOrgOverlay } from "./overlay";
import { OverlayToggle } from "./OverlayToggle";
import { Legend } from "./shared";

export function ArchitectureViews({
  archetypeId,
  tools,
  showDrawingLink = false,
}: {
  archetypeId: string;
  tools: Tool[];
  showDrawingLink?: boolean;
}) {
  const archetype = archetypeById.get(archetypeId);
  const overlay = useOrgOverlay();
  const [labels, setLabels] = useState<LabelMode>("cosai");
  if (!archetype) return null;
  const groups = rowsFor(archetypeId, overlay ? labels : "cosai");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-ink-2">
        <span>
          <span className="font-semibold text-ink">{archetype.capabilities.length} reference controls</span> every product of this kind
          needs, from the drawing{showDrawingLink && (
            <>
              {" "}
              <Link href={`/reference?archetype=${archetypeId}`} className="font-semibold text-introduced hover:underline">
                {archetype.abbrev ?? archetype.title} →
              </Link>
            </>
          )}
          ; {tools.length} product{tools.length === 1 ? "" : "s"} rated against them.
        </span>
        <span className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <OverlayToggle />
          {overlay && hasOrgMappings && (
            <span className="flex items-center gap-1.5">
              <span className="eyebrow">Rows</span>
              {(["cosai", "org"] as LabelMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={labels === m}
                  onClick={() => setLabels(m)}
                  className={`rounded-full border px-2.5 py-[3px] text-[11.5px] font-medium transition-colors ${
                    labels === m ? "border-transparent bg-ink text-white" : "border-line bg-paper text-ink-2 hover:border-line-strong"
                  }`}
                >
                  {m === "cosai" ? "CoSAI names" : org.example ? "Example org's control ids" : `${org.shortName ?? org.name} control ids`}
                </button>
              ))}
            </span>
          )}
        </span>
      </div>

      <Legend overlay={overlay} />

      {tools.length === 0 ? (
        <p className="rounded-xl border border-line bg-paper px-4 py-6 text-[13px] text-ink-3">
          No product in the registry instantiates this architecture yet. The reference set above is still what one would need.
        </p>
      ) : (
        <GridView tools={tools} groups={groups} overlay={overlay} archetypeId={archetypeId} />
      )}
    </div>
  );
}
