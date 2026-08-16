"use client";

import { PATH_STYLE, REF_LAYERS } from "./flow-style";

/**
 * The reading key for a flow-style architecture drawing, laid out as two breathing rows —
 * paths, then layers — so it can sit under a diagram without cramping into a corner.
 * Shared by the Reference Architectures tab and the incident replay's architecture view.
 */
export function FlowLegend({ className = "" }: { className?: string }) {
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
    </div>
  );
}
