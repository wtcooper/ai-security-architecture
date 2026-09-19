import Link from "next/link";
import { Chip } from "@/components/Chips";
import { capabilitiesForControl, capabilitiesForMitigations } from "@/lib/data";

/** The capabilities that deliver these controls, or the controls these methods support. Never a posture. */
export function CapabilityLinks({ controls = [], mitigations = [], title = "Delivered by capabilities" }: { controls?: string[]; mitigations?: string[]; title?: string }) {
  const capabilities = [...new Set([...controls.flatMap(capabilitiesForControl), ...capabilitiesForMitigations(mitigations)])];
  if (!capabilities.length) return null;
  return (
    <div className="mt-5">
      <p className="eyebrow">{title}</p>
      <p className="mt-1 text-xs text-ink-3">Operational capabilities the organisation records status against; open one for how it is realised.</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {capabilities.map((c) => <Link key={c.id} href={`/capabilities?capability=${c.id}`}><Chip tone="introduced">{c.title}</Chip></Link>)}
      </div>
    </div>
  );
}
