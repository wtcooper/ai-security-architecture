import Link from "next/link";
import { Chip } from "@/components/Chips";
import { capabilitiesForMitigations } from "@/lib/data";

/** Derived associations only: category membership never sets deployed coverage or posture. */
export function CapabilityLinks({ mitigations }: { mitigations: string[] }) {
  const capabilities = capabilitiesForMitigations(mitigations);
  if (!capabilities.length) return null;
  return (
    <div className="mt-5">
      <p className="eyebrow">Related technology capabilities</p>
      <p className="mt-1 text-xs text-ink-3">Candidates linked through MITRE mitigations; verify the required features and deployment scope.</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {capabilities.map((c) => <Link key={c.id} href={`/capabilities?capability=${c.id}`}><Chip tone="introduced">{c.title}</Chip></Link>)}
      </div>
    </div>
  );
}
