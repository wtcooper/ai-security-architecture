/** What the Enable tab derives from an architecture: its enterprise controls by NIST CSF category, and where each sits. */
import { archetypeById, enablement, mitigationById, mitigationsForArchetype } from "@/lib/data";
import type { Archetype, Mitigation, ProductSetting, Tool, ToolControl } from "@/lib/types";

export interface ControlGroup {
  id: string;
  /** The CSF category's name. */
  title: string;
  /** What the category is for, in everyday words: the heading a reader sees. */
  plain: string;
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
      return { id: g.id, title: g.title, plain: g.plain, function: g.function, blurb: own?.blurb ?? g.blurb, capabilities: pinned.filter((m) => ids.has(m.id)) };
    })
    .filter((g) => g.capabilities.length);
}

/** Baseline capabilities this architecture does not draw: still needed, set up once for all AI. */
export const baselineNotPinned = (archetype: Archetype): Mitigation[] => {
  const pinned = new Set(archetype.mitigations);
  return enablement.baseline.filter((id) => !pinned.has(id)).map((id) => mitigationById.get(id)!);
};

/** One place a control is pinned on a pattern: what to do there, why, and the architect's note. */
export interface Placement {
  /** The boxes it sits on: one for a box, both ends for a flow. */
  where: string[];
  do: string;
  why: string;
  note?: string;
}

/** Where a pattern places a control: every block it is pinned on, both ends of a flow it is pinned on, and the instruction at each place. */
export function placementsFor(archetypeId: string, capabilityId: string): { blocks: string[]; notes: string[]; steps: Placement[] } {
  const arch = archetypeById.get(archetypeId);
  if (!arch) return { blocks: [], notes: [], steps: [] };
  const titles = new Map(arch.blocks.map((b) => [b.id, b.title]));
  const blocks = new Set<string>();
  const notes = new Set<string>();
  const steps: Placement[] = [];
  for (const pin of arch.pins.mitigations) {
    if (pin.mitigation !== capabilityId) continue;
    const where = pin.at.split("->").filter((id) => titles.has(id)).map((id) => titles.get(id)!);
    for (const title of where) blocks.add(title);
    if (pin.note) notes.add(pin.note);
    steps.push({ where, do: pin.do, why: pin.why, note: pin.note?.trim() });
  }
  return { blocks: [...blocks], notes: [...notes], steps };
}

/** A product's own record on one capability, if the registry has one. */
export const toolControlFor = (tool: Tool, capabilityId: string): ToolControl | undefined =>
  tool.controls.find((c) => c.mitigation === capabilityId);

/** One band of the settings step: a category's plain heading and the settings filed under it. */
export interface SettingGroup {
  /** The category's id, or "extras" for settings that deliver none of the pattern's controls. */
  id: string;
  plain: string;
  /** The CSF category's name; absent for the extras band. */
  title?: string;
  function?: string;
  settings: ProductSetting[];
}

/** The pattern's controls a setting delivers, in chip order. */
export const controlsDelivered = (archetype: Archetype, setting: ProductSetting): string[] =>
  archetype.mitigations.filter((id) => setting.mitigations.includes(id));

/**
 * A product's settings under the same plain headings, in the same order, as the pattern's
 * controls in step 1: a setting is filed with the first control it delivers, so step 2 reads
 * as the same list, now in the product. Settings that deliver none of the pattern's controls
 * come last, as hardening the product recommends anyway.
 */
export function settingGroups(archetype: Archetype, settings: ProductSetting[]): SettingGroup[] {
  const order = new Map(archetype.mitigations.map((id, i) => [id, i]));
  const first = (st: ProductSetting) => controlsDelivered(archetype, st)[0];
  const groups: SettingGroup[] = controlGroups(archetype)
    .map((g) => {
      const ids = new Set(g.capabilities.map((c) => c.id));
      const own = settings.filter((st) => ids.has(first(st) ?? ""));
      // Within a band, in the order step 1 lists the controls; a product's own order breaks ties.
      const sorted = own.map((st, i) => ({ st, i })).sort((a, b) => order.get(first(a.st)!)! - order.get(first(b.st)!)! || a.i - b.i).map((x) => x.st);
      return { id: g.id, plain: g.plain, title: g.title, function: g.function, settings: sorted };
    })
    .filter((g) => g.settings.length);
  const extras = settings.filter((st) => !first(st));
  if (extras.length) groups.push({ id: "extras", plain: "Also recommended", settings: extras });
  return groups;
}
