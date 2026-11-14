/** What the Enable tab derives from an architecture: its enterprise controls by NIST CSF category, and where each sits. */
import { archetypeById, enablement, mitigationById, mitigationsForArchetype } from "@/lib/data";
import type { Archetype, Mitigation, Tool, ToolControl } from "@/lib/types";

export interface ControlGroup {
  id: string;
  /** The CSF category's name. */
  title: string;
  /** The CSF function: Govern, Identify, Protect, Detect, Respond or Recover. */
  function: string;
  blurb: string;
  capabilities: Mitigation[];
}

/**
 * The architecture's enterprise controls: every capability it pins, in pin order, under the
 * NIST CSF category that owns it, in CSF order. Categories it pins nothing from are left out.
 */
export function controlGroups(archetype: Archetype): ControlGroup[] {
  const pinned = mitigationsForArchetype(archetype.id);
  return enablement.groups
    .map((g) => {
      const own = g.surfaces?.[archetype.surface];
      const ids = new Set(g.mitigations);
      return { id: g.id, title: g.title, function: g.function, blurb: own?.blurb ?? g.blurb, capabilities: pinned.filter((m) => ids.has(m.id)) };
    })
    .filter((g) => g.capabilities.length);
}

/** Baseline capabilities this architecture does not draw: still needed, set up once for all AI. */
export const baselineNotPinned = (archetype: Archetype): Mitigation[] => {
  const pinned = new Set(archetype.mitigations);
  return enablement.baseline.filter((id) => !pinned.has(id)).map((id) => mitigationById.get(id)!);
};

/** Where an architecture places a capability: every block it is pinned on, and both ends of a flow it is pinned on. */
export function placementsFor(archetypeId: string, capabilityId: string): { blocks: string[]; notes: string[] } {
  const arch = archetypeById.get(archetypeId);
  if (!arch) return { blocks: [], notes: [] };
  const titles = new Map(arch.blocks.map((b) => [b.id, b.title]));
  const blocks = new Set<string>();
  const notes = new Set<string>();
  for (const pin of arch.pins.mitigations) {
    if (pin.mitigation !== capabilityId) continue;
    for (const id of pin.at.split("->")) if (titles.has(id)) blocks.add(titles.get(id)!);
    if (pin.note) notes.add(pin.note);
  }
  return { blocks: [...blocks], notes: [...notes] };
}

/** A product's own record on one capability, if the registry has one. */
export const toolControlFor = (tool: Tool, capabilityId: string): ToolControl | undefined =>
  tool.controls.find((c) => c.mitigation === capabilityId);
