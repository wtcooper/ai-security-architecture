"use client";

import { BAND_TOKENS, BANDS } from "@/lib/map-layout";
import type { BandId } from "@/lib/bands";

/**
 * The four stack layers as a filter — the same bands, colors, and order as the map, so the
 * "every surface runs this stack" framing and the component filter are one element.
 */
export function StackFilter({
  value,
  counts,
  onChange,
}: {
  value: BandId | null;
  counts: Record<BandId, number>;
  onChange: (band: BandId | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1" role="group" aria-label="Filter by stack layer">
      {BANDS.map((band) => {
        const t = BAND_TOKENS[band.id];
        const active = value === band.id;
        return (
          <button
            key={band.id}
            aria-pressed={active}
            onClick={() => onChange(active ? null : band.id)}
            className={`flex items-center gap-2.5 rounded-lg border px-3 py-1.5 text-left transition-colors ${
              active ? "border-ink" : "border-transparent hover:border-line-strong"
            }`}
            style={{ background: t.fill }}
          >
            <span className="h-5 w-[4px] shrink-0 rounded-full" style={{ background: t.rail }} />
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-semibold leading-tight text-ink">
                {band.label}
              </span>
              <span className="block text-[10.5px] leading-tight text-ink-3">{band.sublabel}</span>
            </span>
            <span className="text-[11px] font-medium text-ink-3">{counts[band.id]}</span>
          </button>
        );
      })}
    </div>
  );
}
