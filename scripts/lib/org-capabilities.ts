import type { Archetype, AuthoredMappings, Framework, FrameworkEntryInfo, Mitigation, OrgCapability, OrgMeta, OrgToolPosture, Tool } from "../../src/lib/types";
import { ORG_STATUSES } from "../../src/lib/types";

/**
 * An organisation maps its own capabilities onto the catalogue's: a MITRE id or an authored
 * specialisation. Control links are derived; nothing is authored against a control.
 */
export function compileOrgCapabilities(org: { meta: OrgMeta; capabilities: OrgCapability[] }, catalogue: Mitigation[], surfaceIds: Set<string>) {
  const byId = new Map(catalogue.map((c) => [c.id, c]));
  const seen = new Set<string>();
  const mappings: AuthoredMappings = {};
  const entries: Record<string, FrameworkEntryInfo> = {};
  const map = (kind: "mitigations" | "controls", target: string, id: string) => {
    const values = ((mappings[kind] ??= {})[target] ??= []);
    if (!values.includes(id)) values.push(id);
  };
  for (const entry of org.capabilities) {
    if (!entry.id?.trim() || seen.has(entry.id)) throw new Error(`org capability: missing or duplicate id ${entry.id}`);
    seen.add(entry.id);
    if (!entry.title?.trim()) throw new Error(`org capability ${entry.id}: needs a title`);
    if (["controls", "mitigations", "risks", "capabilities", "categories"].some((key) => key in entry)) throw new Error(`org capability ${entry.id}: map only with capability: <MITRE id or cap-*>; control links are derived`);
    const capability = byId.get(entry.capability);
    if (!capability) throw new Error(`org capability ${entry.id}: unknown capability ${entry.capability}`);
    if (!entry.surfaces || typeof entry.surfaces !== "object" || Array.isArray(entry.surfaces)) throw new Error(`org capability ${entry.id}: surfaces must be a map (or {})`);
    for (const [surface, record] of Object.entries(entry.surfaces)) {
      if (!surfaceIds.has(surface) || !capability.surfaces[surface]?.applies) throw new Error(`org capability ${entry.id}: unsupported surface ${surface}`);
      if (!ORG_STATUSES.includes(record?.status)) throw new Error(`org capability ${entry.id}: invalid status on ${surface}`);
    }
    entries[entry.id] = {
      label: entry.title,
      description: entry.description ?? `Organization implementation of ${capability.title}${capability.parent ? ` (${capability.parent})` : ` (${capability.id})`}. Control links are derived through that capability.`,
      group: capability.title,
    };
    map("mitigations", capability.id, entry.id);
    if (capability.parent) map("mitigations", capability.parent, entry.id);
    for (const control of capability.controls) map("controls", control, entry.id);
  }
  const framework: Framework = {
    id: "org-capabilities", name: `${org.meta.shortName ?? org.meta.name} capabilities`,
    fullName: `${org.meta.name} security capabilities`, version: null,
    description: "Organization capabilities mapped onto the capability catalogue (MITRE mitigations and authored specialisations). CoSAI control links are derived; these links do not attest control fulfillment.",
    authored: true, org: true, entriesComplete: true,
    attribution: `Authored in data/org/${org.meta.profile}/capabilities.yaml. Organization → capability → CoSAI control.`,
  };
  return {
    frameworks: org.capabilities.length ? [framework] : [],
    mappings: org.capabilities.length ? { [framework.id]: mappings } : {},
    entries: org.capabilities.length ? { [framework.id]: { source: `data/org/${org.meta.profile}/capabilities.yaml`, entries } } : {},
  };
}

/** A product is assessed only against capabilities its reference architecture pins: the id, its parent, or a specialisation of it. */
export function checkOrgToolCapabilities(posture: OrgToolPosture[], orgCapabilities: OrgCapability[], catalogue: Mitigation[], tools: Tool[], archetypes: Archetype[]) {
  const seen = new Set<string>();
  const byId = new Map(catalogue.map((c) => [c.id, c]));
  for (const entry of posture) {
    const tool = tools.find((t) => t.id === entry.tool);
    if (!tool || seen.has(entry.tool)) throw new Error(`org tool ${entry.tool}: unknown or duplicate tool`);
    seen.add(entry.tool);
    if ("controls" in entry || "mitigations" in entry) throw new Error(`org tool ${entry.tool}: author capabilities only; archive legacy mitigation assessments`);
    if (entry.available !== undefined && typeof entry.available !== "boolean") throw new Error(`org tool ${entry.tool}: available must be boolean`);
    const arch = archetypes.find((a) => a.id === tool.architecture)!;
    const pinned = new Set(arch.mitigations.flatMap((id) => [id, byId.get(id)?.parent].filter((x): x is string => Boolean(x))));
    for (const [id, record] of Object.entries(entry.capabilities ?? {})) {
      const own = orgCapabilities.find((c) => c.id === id);
      const capability = byId.get(own?.capability ?? "");
      const reaches = capability && (pinned.has(capability.id) || catalogue.some((c) => c.parent === capability.id && pinned.has(c.id)));
      if (!reaches) throw new Error(`org tool ${entry.tool}: ${id} is unknown or names a capability its architecture does not pin`);
      if (!ORG_STATUSES.includes(record?.status)) throw new Error(`org tool ${entry.tool}: invalid capability status for ${id}`);
    }
  }
  return posture.map((p) => ({ ...p, capabilities: p.capabilities ?? {} }));
}
