"use client";

import { org } from "@/lib/data";
import { overlayLabel, setOrgOverlay, useOrgOverlay } from "./overlay";

/** The one switch for everything from data/org. Small, labelled, remembered per browser. */
export function OverlayToggle({ className = "" }: { className?: string }) {
  const on = useOrgOverlay();
  return (
    <label
      className={`inline-flex cursor-pointer select-none items-center gap-2 text-[11.5px] text-ink-2 ${className}`}
      title={
        org.example
          ? "Shows the example organisation's status pills and control ids shipped with the repository. Replace data/org/example with data/org/local for your own."
          : `Shows ${org.name}'s status per control and its control ids beside the CoSAI names, from data/org/local.`
      }
    >
      <span
        role="switch"
        aria-checked={on}
        tabIndex={0}
        onClick={() => setOrgOverlay(!on)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setOrgOverlay(!on);
          }
        }}
        className={`relative h-[16px] w-[28px] rounded-full border transition-colors ${on ? "border-ink bg-ink" : "border-line-strong bg-mist"}`}
      >
        <span className={`absolute top-[2px] h-[10px] w-[10px] rounded-full transition-all ${on ? "left-[14px] bg-white" : "left-[2px] bg-ink-3"}`} />
      </span>
      {overlayLabel()}
    </label>
  );
}
