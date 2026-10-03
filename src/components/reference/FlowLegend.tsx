"use client";

import { STATUS_META } from "@/components/StatusPill";
import { useOrgOverlay } from "@/components/tooling/overlay";
import type { DisplayStatus } from "@/lib/types";
import { chipColors, PATH_STYLE, REF_LAYERS } from "./flow-style";

const CHIP_STATUSES: DisplayStatus[] = ["enabled", "inProgress", "gap", "notAssessed"];

/**
 * The reading key for a flow-style architecture drawing, laid out as two breathing rows —
 * paths, then layers — so it can sit under a diagram without cramping into a corner. With org
 * data on, a third row keys the chip colours to capability status.
 * Shared by the Reference Architectures tab and the incident replay's architecture view.
 */
export function FlowLegend({ className = "" }: { className?: string }) {
  const overlay = useOrgOverlay();
  return (
    <div className={`space-y-1.5 text-[12px] text-ink-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
        {Object.entries(PATH_STYLE).map(([id, style]) => (
          <span key={id} className="flex items-center gap-1.5">
            <svg width="26" height="10" aria-hidden>
              <path d="M 1 5 H 25" stroke={style.stroke} strokeWidth="2" strokeDasharray={style.dash} />
            </svg>
            {style.label}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="text-ink-3">Tab colour = layer</span>
        {REF_LAYERS.map((l) => (
          <span key={l.label} className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
        <span className="text-ink-3">Hover anything · pinch or ⌘/Ctrl + wheel to zoom</span>
      </div>
      {overlay && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="text-ink-3">Chip colour = capability status</span>
          {CHIP_STATUSES.map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span aria-hidden className="inline-block h-3 w-3 rounded-full" style={{ borderWidth: 1.3, ...chipColors(s) }} />
              {STATUS_META[s].label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
