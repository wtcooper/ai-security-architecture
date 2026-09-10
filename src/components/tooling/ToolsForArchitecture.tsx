"use client";

/**
 * The Tools tab on a reference architecture: this drawing's pinned capabilities as rows, the
 * products that instantiate it as columns, and, when a product name is clicked (or the page is
 * opened with `?tool=`), that product's full record beneath the grid. This is the only place
 * the registry renders; the drawing, its reference controls and its products are one read.
 */
import { useEffect, useRef } from "react";

import type { Archetype, Tool } from "@/lib/types";
import { ArchitectureViews } from "./ArchitectureViews";
import { ToolDetail } from "./ToolDetail";

export function ToolsForArchitecture({
  archetype,
  tools,
  toolId,
  onTool,
}: {
  archetype: Archetype;
  tools: Tool[];
  toolId: string | null;
  onTool: (id: string | null) => void;
}) {
  const tool = tools.find((t) => t.id === toolId) ?? null;
  const recordRef = useRef<HTMLDivElement>(null);
  // A record opened from the grid sits below a tall table: bring it into view.
  useEffect(() => {
    if (tool) recordRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [tool]);

  return (
    <div>
      <p className="mb-3 text-[12px] leading-snug text-ink-3">
        The products that instantiate this drawing, each rated against its {archetype.capabilities.length} pinned capabilities — the
        controls every product of this kind needs. Each says whether an administrator can switch the control on in that product;
        ↗ is the vendor&rsquo;s page for doing so.
      </p>
      <ArchitectureViews archetypeId={archetype.id} tools={tools} onPickTool={onTool} />
      {tool && (
        <div ref={recordRef} className="mt-6 scroll-mt-4 rounded-xl border border-line bg-paper px-5 py-5">
          <div className="mb-3 flex items-center justify-between gap-3 text-[12px]">
            <span className="eyebrow">Product record</span>
            <button type="button" onClick={() => onTool(null)} className="font-semibold text-introduced hover:underline">
              Close ×
            </button>
          </div>
          <ToolDetail key={tool.id} tool={tool} />
        </div>
      )}
    </div>
  );
}
