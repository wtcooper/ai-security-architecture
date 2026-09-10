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
        controls every product of this kind needs. A cell is how far the vendor documents that control; click it for the operator
        steps and the vendor&rsquo;s page, or a product name for its full record.
      </p>
      <ArchitectureMatrix archetypeId={archetype.id} tools={tools} />
    </div>
  );
}
