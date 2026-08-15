"use client";

import { useState } from "react";
import Link from "next/link";
import { BANDS, BAND_TOKENS } from "@/lib/map-layout";
import { architectureVocabulary, personaById } from "@/lib/data";
import type { Archetype } from "@/lib/types";
import { personaShort, zoneStyle } from "./zone-style";

/**
 * How to read the diagram, folded away by default.
 *
 * Four facts get a visitor through it: dashed boxes are trust boundaries, a tick on a line is the
 * control securing that crossing, hovering explains anything, and zoom needs a modifier so the
 * page still scrolls. Everything else is available and does not need to be on screen.
 */
export function DiagramLegend({ archetype }: { archetype: Archetype }) {
  const [open, setOpen] = useState(false);
  const personas = [...new Set(archetype.zones.flatMap((z) => z.personas))];
  const hasGovernance = archetype.nodes.some(
    (n) => !architectureVocabulary.nodeTypes.find((t) => t.id === n.type)?.layer,
  );

  return (
    <div className="rounded-lg border border-line bg-paper px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
          <svg width="22" height="14" aria-hidden>
            <rect
              x="1"
              y="1"
              width="20"
              height="12"
              rx="3"
              fill={zoneStyle("device").fill}
              stroke={zoneStyle("device").stroke}
              strokeDasharray="4 3"
              strokeWidth="1.3"
            />
          </svg>
          trust boundary
        </span>

        <span className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
          <svg width="18" height="16" aria-hidden>
            <circle cx="9" cy="8" r="6.5" fill="var(--paper)" stroke="var(--mitigated)" strokeWidth="1.3" />
            <path
              d="M 6.2 8 L 8 10.2 L 11.8 5.8"
              fill="none"
              stroke="var(--mitigated)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          control on the crossing — hover it
        </span>

        <span className="text-[12.5px] text-ink-3">
          Hover any component for a one-line explanation. Click for the full detail. Hold ⌘ or Ctrl
          to zoom.
        </span>

        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="ml-auto text-[12.5px] font-semibold text-introduced hover:underline"
        >
          {open ? "Less" : "Full key"}
        </button>
      </div>

      {open && (
        <div className="mt-2.5 space-y-2.5 border-t border-line pt-2.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="eyebrow">Boundaries</span>
            <span className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
              <svg width="22" height="14" aria-hidden>
                <rect
                  x="1"
                  y="1"
                  width="20"
                  height="12"
                  rx="3"
                  fill={zoneStyle("vendorOpaque").fill}
                  stroke={zoneStyle("vendorOpaque").stroke}
                  strokeDasharray="6 3"
                  strokeWidth="1.3"
                />
              </svg>
              provider-operated, not inspectable
            </span>
            <span className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
              <svg width="30" height="14" aria-hidden>
                <path d="M 1 7 H 29" stroke="var(--line-strong)" strokeWidth="1.3" />
              </svg>
              data flow
            </span>
            <span className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
              <svg width="30" height="14" aria-hidden>
                <path
                  d="M 1 7 H 29"
                  stroke="var(--line-strong)"
                  strokeWidth="1.3"
                  strokeDasharray="5 4"
                />
              </svg>
              governance relationship
            </span>
            <span className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
              <svg width="22" height="14" aria-hidden>
                <rect
                  x="1"
                  y="1"
                  width="20"
                  height="12"
                  rx="3"
                  fill="none"
                  stroke="var(--ink-3)"
                  strokeDasharray="4 3"
                  strokeWidth="1.3"
                />
              </svg>
              outside the system
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="eyebrow">Stack layer</span>
            {BANDS.map((b) => (
              <span key={b.id} className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
                <span className="h-3 w-1 rounded-full" style={{ background: BAND_TOKENS[b.id].rail }} />
                {b.label}
              </span>
            ))}
            {hasGovernance && (
              <span className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
                <span className="h-3 w-1 rounded-full" style={{ background: "var(--ink-3)" }} />
                governance plane — CoSAI names no component for it
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="eyebrow">Responsible persona</span>
            {personas.map((id) => (
              <Link
                key={id}
                href={`/personas?persona=${id}`}
                className="text-[12.5px] text-ink-2 hover:text-introduced"
                title={personaById.get(id)?.title}
              >
                <span className="ident rounded-full border border-line-strong px-1.5 py-px">
                  {personaShort(id)}
                </span>
              </Link>
            ))}
            <span className="text-[12px] text-ink-3">
              Ownership is stated in CoSAI personas. Two on one zone is shared responsibility; none
              means the zone is outside the system.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
