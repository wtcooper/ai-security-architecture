import type { DisplayStatus, OrgCapabilityStatus } from "./types";

/** A rollup describes deployment support, never an assessment of a MITRE method or control. */
export function capabilitySupportStatus(records: (OrgCapabilityStatus | undefined)[]): DisplayStatus {
  if (!records.length || records.every((r) => !r)) return "notAssessed";
  const statuses = records.map((r) => r?.status ?? "notAssessed");
  return statuses.every((s) => s === statuses[0]) ? statuses[0] : "inProgress";
}
