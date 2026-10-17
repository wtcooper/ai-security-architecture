/** What the Enable page derives from an architecture: its layers, where each capability sits, and tool coverage. */
import { archetypeById, enablement, layerFor, mitigationById, mitigationsForArchetype, surfaceById, type Layer } from "@/lib/data";
import type { Archetype, Mitigation, Tool, ToolControl } from "@/lib/types";

export const LAYER_META: Record<Layer, { n: number; title: string; short: string }> = {
  foundation: { n: 1, title: "Enterprise foundations", short: "Foundations" },
  surface: { n: 2, title: "Surface baseline", short: "Surface" },
  useCase: { n: 3, title: "Use-case additions", short: "Use case" },
};

/** The foundations, every group, whether or not this architecture pins them: they are set up once for all AI. */
export const foundationGroups = () =>
  enablement.foundations.map((g) => ({ ...g, capabilities: g.mitigations.map((id) => mitigationById.get(id)!) }));

/** What one surface adds on top of the foundations. */
export const surfaceBaseline = (surfaceId: string) => ({
  surface: surfaceById.get(surfaceId)!,
  blurb: enablement.surfaces[surfaceId]?.blurb ?? "",
  capabilities: (enablement.surfaces[surfaceId]?.mitigations ?? []).map((id) => mitigationById.get(id)!),
});

/** The architecture's pinned capabilities, in pin order, grouped by the layer each belongs to. */
export function pinnedByLayer(archetype: Archetype): { layer: Layer; capabilities: Mitigation[] }[] {
  const pinned = mitigationsForArchetype(archetype.id);
  return (["foundation", "surface", "useCase"] as Layer[])
    .map((layer) => ({ layer, capabilities: pinned.filter((m) => layerFor(m.id, archetype) === layer) }))
    .filter((g) => g.capabilities.length);
}

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

/** The vendor page for configuring one capability on one product: the first operator step's link. */
export const configureUrl = (control?: ToolControl) => control?.steps?.find((st) => st.url)?.url;
