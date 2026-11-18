import Link from "next/link";
import { Chip } from "@/components/Chips";
import { StatusPill } from "@/components/StatusPill";
import { capabilityName, mitigationsForControl, statusFor } from "@/lib/data";
import { controlHref } from "@/lib/routes";

/** The capabilities that deliver a control: the pins an organisation sets status against. */
export function CapabilityLinks({ controls, title = "Delivered by controls in the catalogue" }: { controls: string[]; title?: string }) {
  const capabilities = [...new Map(controls.flatMap(mitigationsForControl).map((m) => [m.id, m])).values()];
  if (!capabilities.length) return null;
  return (
    <div className="mt-5">
      <p className="eyebrow">{title}</p>
      <p className="mt-1 text-xs text-ink-3">MITRE-backed controls pinned on the patterns; status is set against these, never against the CoSAI control.</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {capabilities.map((m) => <Link key={m.id} href={controlHref(m.id)} className="inline-flex items-center gap-1">
          <Chip tone="introduced">{capabilityName(m.id)}</Chip>
          {statusFor(m.id) !== "notSet" && <StatusPill status={statusFor(m.id)} compact />}
        </Link>)}
      </div>
    </div>
  );
}
