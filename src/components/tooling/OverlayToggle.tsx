"use client";

import { org } from "@/lib/data";
import { overlayLabel, setOrgOverlay, useOrgOverlay } from "./overlay";

/**
 * The one switch for everything from data/org: status pills on capabilities, tools and their
 * controls, greyed-out tools the organisation does not run, and its control ids beside CoSAI
 * names. Lives beside the Capabilities and Reference architectures titles; remembered per
 * browser, so flipping it on one page flips it on the other.
 */
export function OverlayToggle({ className = "" }: { className?: string }) {
  const on = useOrgOverlay();
  return (
    <label
      className={`inline-flex cursor-pointer select-none items-center gap-2 text-[11.5px] text-ink-2 ${className}`}
      title={
        org.example
          ? "Shows the example organisation's status (Enabled / In progress or partial / Gap) on every capability, tool and control, from data/org/example. Replace it with data/org/local for your own."
          : `Shows ${org.name}'s status (Enabled / In progress or partial / Gap) on every capability, tool and control, from data/org/local. Tools the organisation does not run are greyed out.`
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
      <span className="font-semibold text-ink">{overlayLabel()}</span>
      {org.example && <span className="text-ink-3">· example org</span>}
    </label>
  );
}
