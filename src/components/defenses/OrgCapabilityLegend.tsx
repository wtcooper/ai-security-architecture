import { StatusPill } from "@/components/StatusPill";

export function OrgCapabilityLegend({ derived = false }: { derived?: boolean }) {
  return <div className="mb-3 rounded-lg border border-line bg-paper p-3 text-xs text-ink-2">
    <p className="font-semibold">{derived ? "Organization capability support" : "Organization capability deployment"}</p>
    <div className="mt-2 flex flex-wrap gap-2">
      <StatusPill status="enabled" compact /><StatusPill status="inProgress" compact /><StatusPill status="gap" compact /><StatusPill status="notAssessed" compact />
      {derived && <StatusPill status="unmapped" compact />}
    </div>
    <p className="mt-2">Recorded capability assessments across enterprise and tool deployments on each surface. Mixed statuses roll up as partial; missing records are not assessed.
      {derived && " These links show technology support, not verified mitigation effectiveness or control fulfillment."}</p>
  </div>;
}
