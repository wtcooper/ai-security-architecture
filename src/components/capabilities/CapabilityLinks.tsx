import Link from "next/link";
import { Chip } from "@/components/Chips";
import { StatusPill } from "@/components/StatusPill";
import { mitigationsForControl, orgSurfaceStatusFor, surfaces } from "@/lib/data";
import { capabilitySupportStatus } from "@/lib/org-capabilities";
import type { DisplayStatus } from "@/lib/types";

/** Status across every surface a capability applies on; the pill a control's detail shows beside each. */
function overallStatus(id: string): DisplayStatus {
  const statuses = surfaces.map((s) => orgSurfaceStatusFor(id, s.id)).filter((s) => s !== "notAssessed" && s !== "unmapped");
  return statuses.length ? capabilitySupportStatus(statuses.map((status) => ({ status: status as "enabled" | "inProgress" | "gap" }))) : "notAssessed";
}

/** The capabilities that deliver a control: the pins an organisation can enable or have a gap on. */
export function CapabilityLinks({ controls, overlay = false, title = "Delivered by capabilities" }: { controls: string[]; overlay?: boolean; title?: string }) {
  const capabilities = [...new Map(controls.flatMap(mitigationsForControl).map((m) => [m.id, m])).values()];
  if (!capabilities.length) return null;
  return (
    <div className="mt-5">
      <p className="eyebrow">{title}</p>
      <p className="mt-1 text-xs text-ink-3">MITRE-backed countermeasures pinned on the drawings; the organisation records status against these, never against the control.</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {capabilities.map((m) => <Link key={m.id} href={`/capabilities?capability=${m.id}`} className="inline-flex items-center gap-1">
          <Chip tone="introduced">{m.title}{" "}<span className="text-ink-3">({m.parent ?? m.id})</span></Chip>
          {overlay && <StatusPill status={overallStatus(m.id)} compact />}
        </Link>)}
      </div>
    </div>
  );
}
