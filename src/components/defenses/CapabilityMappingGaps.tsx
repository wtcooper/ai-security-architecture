import Link from "next/link";
import { capabilitiesForControl, controls, mitigations, mitigationsWithoutCapabilities } from "@/lib/data";

export function CapabilityMappingGaps() {
  const controlGaps = controls.filter((c) => !capabilitiesForControl(c.id).length);
  return <details className="mt-5 rounded-lg border border-line bg-paper p-4">
    <summary className="cursor-pointer text-sm font-semibold">Technology mapping coverage: {mitigations.length - mitigationsWithoutCapabilities.length} of {mitigations.length} mitigations</summary>
    <p className="mt-2 text-xs text-ink-3">The following mitigations have no mapped technology category. Organization capability status cannot roll up to them; this is a taxonomy mapping gap, not an organization deployment gap.</p>
    <ul className="mt-3 space-y-2">{mitigationsWithoutCapabilities.map((m) => <li key={m.id} className="text-sm">
      <Link href={`/controls?mitigation=${m.id}`} className="text-introduced hover:underline">{m.title} <span className="text-xs text-ink-3">({m.id})</span></Link>
    </li>)}</ul>
    <p className="mt-4 text-sm font-semibold">{controlGaps.length} CoSAI controls have no capability path</p>
    <p className="mt-1 text-xs text-ink-3">Some are process or governance requirements. A technology association would not replace those responsibilities.</p>
    <ul className="mt-2 space-y-2">{controlGaps.map((c) => <li key={c.id} className="text-sm">
      <Link href={`/controls?control=${c.id}`} className="text-introduced hover:underline">{c.title}</Link>
    </li>)}</ul>
  </details>;
}
