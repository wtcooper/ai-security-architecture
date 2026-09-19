import type { Archetype, AuthoredMappings, Capability, Framework, FrameworkEntryInfo, Mitigation, OrgCapability, OrgMeta, OrgToolPosture, Tool } from "../../src/lib/types";
import { ORG_STATUSES } from "../../src/lib/types";

/** Only capability mappings are authored. Control and MITRE links are derived for every view. */
export function compileOrgCapabilities(org: { meta: OrgMeta; capabilities: OrgCapability[] }, catalogue: Capability[], mitigations: Mitigation[], surfaceIds: Set<string>) {
  const byId = new Map(catalogue.map((c) => [c.id, c]));
  const seen = new Set<string>();
  const mappings: AuthoredMappings = {};
  const entries: Record<string, FrameworkEntryInfo> = {};
  const map = (kind: "capabilities" | "mitigations" | "controls", target: string, id: string) => {
    const values = ((mappings[kind] ??= {})[target] ??= []);
    if (!values.includes(id)) values.push(id);
  };
  for (const entry of org.capabilities) {
    if (!entry.id?.trim() || seen.has(entry.id)) throw new Error(`org capability: missing or duplicate id ${entry.id}`);
    seen.add(entry.id);
    if (!entry.title?.trim()) throw new Error(`org capability ${entry.id}: needs a title`);
    if (["controls", "mitigations", "risks", "capabilities", "categories"].some((key) => key in entry)) throw new Error(`org capability ${entry.id}: map only with capability: cap-*; control and mitigation links are derived`);
    const capability = byId.get(entry.capability);
    if (!capability) throw new Error(`org capability ${entry.id}: unknown capability ${entry.capability}`);
    if (!entry.surfaces || typeof entry.surfaces !== "object" || Array.isArray(entry.surfaces)) throw new Error(`org capability ${entry.id}: surfaces must be a map (or {})`);
    const applicable = new Set(Object.entries(capability.surfaces).filter(([, s]) => s.applies).map(([id]) => id));
    for (const [surface, record] of Object.entries(entry.surfaces)) {
      if (!surfaceIds.has(surface) || !applicable.has(surface)) throw new Error(`org capability ${entry.id}: unsupported surface ${surface}`);
      if (!ORG_STATUSES.includes(record?.status)) throw new Error(`org capability ${entry.id}: invalid status on ${surface}`);
    }
    entries[entry.id] = {
      label: entry.title,
      description: entry.description ?? `Organization implementation of ${capability.title}. Control and mitigation links are derived through that capability.`,
      group: capability.title,
    };
    map("capabilities", capability.id, entry.id);
    for (const control of capability.controls) {
      map("controls", control, entry.id);
      for (const m of mitigations) if (m.controls.includes(control)) map("mitigations", m.id, entry.id);
    }
  }
  const framework: Framework = {
    id: "org-capabilities", name: `${org.meta.shortName ?? org.meta.name} capabilities`,
    fullName: `${org.meta.name} security capabilities`, version: null,
    description: "Organization capabilities mapped onto the capability catalogue. CoSAI controls and MITRE mitigations are derived through the catalogue; these links do not attest control fulfillment.",
    authored: true, org: true, entriesComplete: true,
    attribution: `Authored in data/org/${org.meta.profile}/capabilities.yaml. Organization → capability → CoSAI control → supporting mitigation.`,
  };
  return {
    frameworks: org.capabilities.length ? [framework] : [],
    mappings: org.capabilities.length ? { [framework.id]: mappings } : {},
    entries: org.capabilities.length ? { [framework.id]: { source: `data/org/${org.meta.profile}/capabilities.yaml`, entries } } : {},
  };
}

/** A product is assessed against capabilities its reference architecture actually calls for. */
export function checkOrgToolCapabilities(posture: OrgToolPosture[], orgCapabilities: OrgCapability[], catalogue: Capability[], mitigations: Mitigation[], tools: Tool[], archetypes: Archetype[]) {
  const seen = new Set<string>();
  for (const entry of posture) {
    const tool = tools.find((t) => t.id === entry.tool);
    if (!tool || seen.has(entry.tool)) throw new Error(`org tool ${entry.tool}: unknown or duplicate tool`);
    seen.add(entry.tool);
    if ("controls" in entry || "mitigations" in entry) throw new Error(`org tool ${entry.tool}: author capabilities only; archive legacy mitigation assessments`);
    if (entry.available !== undefined && typeof entry.available !== "boolean") throw new Error(`org tool ${entry.tool}: available must be boolean`);
    const arch = archetypes.find((a) => a.id === tool.architecture)!;
    const pinnedControls = new Set(mitigations.filter((m) => arch.mitigations.includes(m.id)).flatMap((m) => m.controls));
    for (const [id, record] of Object.entries(entry.capabilities ?? {})) {
      const own = orgCapabilities.find((c) => c.id === id);
      const capability = catalogue.find((c) => c.id === own?.capability);
      if (!capability?.controls.some((c) => pinnedControls.has(c))) throw new Error(`org tool ${entry.tool}: ${id} is unknown or delivers no control its architecture pins`);
      if (!ORG_STATUSES.includes(record?.status)) throw new Error(`org tool ${entry.tool}: invalid capability status for ${id}`);
    }
  }
  return posture.map((p) => ({ ...p, capabilities: p.capabilities ?? {} }));
}
