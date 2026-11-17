/**
 * A pattern as built on one cloud: which service plays each component, and which of the cloud's
 * own settings deliver each control. Everything here is read from the cloud's file
 * (data/clouds/<cloud>.yaml); nothing is inferred beyond joining a setting to the controls it
 * names and to the control-plane box that owns those controls.
 */
import { ownedControls } from "@/components/drawing/layout";
import { archetypesInOrder, clouds, productsForArchetype, type Product } from "@/lib/data";
import { cloudSlug } from "@/lib/routes";
import type { Archetype, ArchBlock, CloudBinding, CloudPlatform, ProductSetting } from "@/lib/types";

export type CloudProduct = Extract<Product, { kind: "cloud" }>;

export { cloudSlug };

/** The cloud an address names, by slug ("aws") or id ("cloudAws"). */
export const cloudFromSlug = (value: string | null | undefined): CloudPlatform | null =>
  value ? clouds.find((c) => c.id === value || cloudSlug(c.id) === value.toLowerCase()) ?? null : null;

/** The clouds a pattern is mapped onto, in the catalogue's order. */
export const cloudProductsFor = (archetypeId: string): CloudProduct[] =>
  productsForArchetype(archetypeId).filter((p): p is CloudProduct => p.kind === "cloud");

export const cloudProductFor = (archetypeId: string, cloudId: string | null): CloudProduct | null =>
  cloudId ? cloudProductsFor(archetypeId).find((p) => p.id === cloudId) ?? null : null;

/** The cloud's own settings that deliver one control on this pattern, in the order the cloud lists them. */
export const optionsFor = (product: CloudProduct, controlId: string): ProductSetting[] =>
  product.settings.filter((s) => s.mitigations.includes(controlId));

/** What plays a component on this cloud, if the cloud's mapping names one. */
export const bindingFor = (product: CloudProduct, blockId: string): CloudBinding | undefined =>
  product.implementation.bindings.find((b) => b.block === blockId);

/**
 * A control-plane box is a function, not a service, so no single resource plays it. What a
 * cloud offers there is the set of settings that deliver the controls the box owns.
 */
export function controlPlaneOptions(archetype: Archetype, product: CloudProduct, block: ArchBlock): ProductSetting[] {
  const owned = new Set(ownedControls(archetype, block));
  return product.settings.filter((s) => s.mitigations.some((id) => owned.has(id)));
}

/** One row of the component table: a box, and what the cloud names for it. */
export interface ComponentRow {
  block: ArchBlock;
  binding?: CloudBinding;
  /** For a control-plane box: the settings that deliver its controls. */
  options: ProductSetting[];
}

/** Every box a cloud has something to say about: components first, then the control plane. People and outside parties are left out. */
export function componentRows(archetype: Archetype, product: CloudProduct): ComponentRow[] {
  const rows = archetype.blocks.map((block): ComponentRow => ({
    block,
    binding: bindingFor(product, block.id),
    options: block.kind === "governance" ? controlPlaneOptions(archetype, product, block) : [],
  }));
  return [...rows.filter((r) => r.binding), ...rows.filter((r) => !r.binding && r.options.length)];
}

/** Across every pattern: the settings on each cloud that deliver one control, with the patterns each is used on. */
export function cloudOptionsForControl(controlId: string): { cloud: CloudPlatform; options: { setting: ProductSetting; patterns: Archetype[] }[] }[] {
  return clouds
    .map((cloud) => ({
      cloud,
      options: cloud.settings
        .filter((s) => s.mitigations.includes(controlId))
        .map((setting) => ({
          setting,
          patterns: archetypesInOrder.filter((a) => {
            const impl = cloud.implementations.find((i) => i.architecture === a.id);
            return Boolean(impl?.settings.includes(setting.id) && a.mitigations.includes(controlId));
          }),
        }))
        .filter((o) => o.patterns.length),
    }))
    .filter((c) => c.options.length);
}

/** The patterns a cloud has a mapping for. */
export const patternsOn = (cloud: CloudPlatform): Archetype[] =>
  archetypesInOrder.filter((a) => cloud.implementations.some((i) => i.architecture === a.id));
