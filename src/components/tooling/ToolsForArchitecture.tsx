"use client";

/** Organization details live in selected records, keeping the taxonomy table compact. */
import { useEffect, useRef } from "react";

import type { Archetype, Tool } from "@/lib/types";
import { ArchitectureViews } from "./ArchitectureViews";
import { ToolDetail } from "./ToolDetail";
import { useOrgOverlay } from "./overlay";

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
  const overlay = useOrgOverlay();
  const tool = overlay ? tools.find((t) => t.id === toolId) ?? null : null;
  const recordRef = useRef<HTMLDivElement>(null);
  // A record opened from the grid sits below a tall table: bring it into view.
  useEffect(() => {
    if (tool) recordRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [tool]);

  return (
    <div>
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
