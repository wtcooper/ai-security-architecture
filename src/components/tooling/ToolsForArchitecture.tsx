"use client";

/**
 * The Tools tab on a reference architecture: the same matrix the AI Tooling tab shows for this
 * category — this drawing's pinned capabilities as rows, the products that instantiate it as
 * columns — so the drawing, its reference controls and its products are one continuous read.
 */
import type { Archetype, Tool } from "@/lib/types";
import { ArchitectureViews } from "./ArchitectureViews";

export function ToolsForArchitecture({ archetype, tools }: { archetype: Archetype; tools: Tool[] }) {
  return (
    <div>
      <p className="mb-3 text-[12px] leading-snug text-ink-3">
        The products that instantiate this drawing, each rated against its {archetype.capabilities.length} pinned capabilities — the
        controls every product of this kind needs. Each says whether an administrator can switch the control on in that product;
        ↗ is the vendor&rsquo;s page for doing so.
      </p>
      <ArchitectureViews archetypeId={archetype.id} tools={tools} />
    </div>
  );
}
