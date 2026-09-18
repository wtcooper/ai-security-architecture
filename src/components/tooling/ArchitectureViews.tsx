"use client";

import { archetypeById } from "@/lib/data";
import type { Tool } from "@/lib/types";
import { GridView } from "./GridView";
import { rowsFor } from "./model";
import { useOrgOverlay } from "./overlay";
import { Legend } from "./shared";

/** The taxonomy is fixed; the organization overlay adds mappings, products and status. */
export function ArchitectureViews({ archetypeId, tools, onPickTool }: {
  archetypeId: string;
  tools: Tool[];
  onPickTool: (toolId: string) => void;
}) {
  const archetype = archetypeById.get(archetypeId);
  const overlay = useOrgOverlay();
  if (!archetype) return null;
  const groups = rowsFor(archetypeId);
  const controlCount = groups.flatMap((g) => g.rows).length;

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-ink-2">
        {controlCount} CoSAI controls. Select a capability or product cell for mappings and evidence.
        {overlay ? " Colors summarize capability support, not control fulfillment." : " Show org data to add tools and status."}
      </p>
      {overlay && <Legend overlay />}
      <GridView tools={tools} groups={groups} overlay={overlay} archetypeId={archetypeId} onPickTool={onPickTool} />
      {overlay && tools.length === 0 && <p className="text-xs text-ink-3">No products are recorded for this architecture yet.</p>}
    </div>
  );
}
