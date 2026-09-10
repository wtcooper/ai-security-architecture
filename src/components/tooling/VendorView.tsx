"use client";

/**
 * One vendor across reference architectures: for each drawing its products instantiate, the
 * same grid the category view shows — that drawing's controls as rows, enterprise modules
 * beside them, the vendor's products as admin-control columns. Inheritance reads first;
 * nothing is summarised into bars.
 */
import Link from "next/link";

import { archetypesForVendor, toolsForVendor } from "@/lib/data";
import { GridView } from "./GridView";
import { cosaiRows } from "./model";
import { useOrgOverlay } from "./overlay";
import { OverlayToggle } from "./OverlayToggle";
import { Legend } from "./shared";

export function VendorView({ vendorId, onPickArchitecture }: { vendorId: string; onPickArchitecture: (id: string) => void }) {
  const archetypes = archetypesForVendor(vendorId);
  const tools = toolsForVendor(vendorId);
  const overlay = useOrgOverlay();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-ink-2">
        <span>
          <span className="font-semibold text-ink">{tools.length} products</span> across{" "}
          <span className="font-semibold text-ink">{archetypes.length} reference architectures</span>. Each grid is one drawing&rsquo;s
          reference controls with this vendor&rsquo;s products as the admin-control columns.
        </span>
        <OverlayToggle className="ml-auto" />
      </div>
      <Legend overlay={overlay} />
      {archetypes.map((a) => (
        <section key={a.id}>
          <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <button type="button" onClick={() => onPickArchitecture(a.id)} className="text-[14px] font-semibold text-ink hover:text-introduced hover:underline">
              {a.title}
            </button>
            <span className="text-[11.5px] text-ink-3">{a.capabilities.length} reference controls · click the title to compare every vendor here</span>
            <Link href={`/reference?archetype=${a.id}`} className="ml-auto text-[11.5px] font-semibold text-introduced hover:underline">
              Drawing →
            </Link>
          </div>
          <GridView tools={tools.filter((t) => t.architecture === a.id)} groups={cosaiRows(a.id)} overlay={overlay} archetypeId={a.id} />
        </section>
      ))}
    </div>
  );
}
