"use client";

/**
 * One vendor across categories: its products as runbook cards, grouped under the architecture
 * each instantiates, so the inheritance reads first and every card carries the same checklist
 * of reference controls, coverage words and configure links as the category views.
 */
import Link from "next/link";

import { archetypesForVendor, toolsForVendor } from "@/lib/data";
import { ProductCard } from "./CardsView";
import { cosaiRows } from "./model";
import { useOrgOverlay } from "./overlay";
import { OverlayToggle } from "./OverlayToggle";
import { Legend } from "./shared";

export function VendorView({ vendorId, onPickArchitecture }: { vendorId: string; onPickArchitecture: (id: string) => void }) {
  const archetypes = archetypesForVendor(vendorId);
  const tools = toolsForVendor(vendorId);
  const overlay = useOrgOverlay();
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-ink-2">
        <span>
          <span className="font-semibold text-ink">{tools.length} products</span> across{" "}
          <span className="font-semibold text-ink">{archetypes.length} reference architectures</span>. Each card lists the controls its
          architecture requires and whether an administrator can switch each on in that product.
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
            <span className="text-[11.5px] text-ink-3">{a.capabilities.length} reference controls · compare every vendor here</span>
            <Link href={`/reference?archetype=${a.id}`} className="ml-auto text-[11.5px] font-semibold text-introduced hover:underline">
              Drawing →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tools
              .filter((t) => t.architecture === a.id)
              .map((t) => (
                <ProductCard key={t.id} tool={t} groups={cosaiRows(a.id)} overlay={overlay} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
