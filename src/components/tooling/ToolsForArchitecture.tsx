"use client";

/**
 * The Tools tab on a reference architecture: the same matrix the AI Tooling tab shows for this
 * category — this drawing's pinned capabilities as rows, the products that instantiate it as
 * columns — so the drawing, its reference controls and its products are one continuous read.
 */
import type { Archetype, Tool } from "@/lib/types";
import { ArchitectureMatrix } from "./ArchitectureMatrix";

export function ToolsForArchitecture({ archetype, tools }: { archetype: Archetype; tools: Tool[] }) {
  return (
    <div>
      <p className="mb-3 text-[12px] leading-snug text-ink-3">
        The products that instantiate this drawing, each rated against its {archetype.capabilities.length} pinned capabilities — the
        controls every product of this kind needs. Click a cell for the vendor&rsquo;s operator steps; click a product for its record.
      </p>
      <ArchitectureMatrix archetypeId={archetype.id} tools={tools} />
    </div>
  );
}
