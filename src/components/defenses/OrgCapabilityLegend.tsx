import { StatusPill } from "@/components/StatusPill";

export function OrgCapabilityLegend() {
  return <div className="mb-3 rounded-lg border border-line bg-paper p-3 text-xs text-ink-2">
    <p className="font-semibold">Organization capability status</p>
    <div className="mt-2 flex flex-wrap gap-2">
      <StatusPill status="enabled" compact /><StatusPill status="inProgress" compact /><StatusPill status="gap" compact /><StatusPill status="notAssessed" compact />
    </div>
    <p className="mt-2">Recorded per capability: the enterprise layer on each surface, and each available product. A MITRE parent rolls up its specialisations. Mixed statuses roll up as partial; missing records are not assessed.</p>
  </div>;
}
