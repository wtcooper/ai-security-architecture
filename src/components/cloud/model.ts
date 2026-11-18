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

/** A product's own settings that deliver one control on this pattern, in the order the product lists them. */
export const optionsFor = (product: Product, controlId: string): ProductSetting[] =>
  product.settings.filter((s) => s.mitigations.includes(controlId));

/**
 * How a platform is spoken of. A provider's cloud offers services; in its own data centre the
 * organisation runs software, and nothing is the provider's to run.
 */
export function platformWords(cloud: CloudPlatform) {
  const own = Boolean(cloud.selfManaged);
  return {
    own,
    /** What plays a component: "AWS service" or "software". */
    service: own ? "software" : `${cloud.short} service`,
    /** "on AWS" or "on-premises". */
    on: own ? "on-premises" : `on ${cloud.short}`,
    /** The switch's hover text. */
    asBuilt: own ? "As run in your own data centre" : `As built on ${cloud.name}`,
    /** Whose pages the mapping was checked against. */
    docs: own ? "each project's own documentation" : `${cloud.short}'s documentation`,
  };
}

/** How a product is named in a tight space: a cloud by its short name, a tool by its own. */
export const productShort = (product: Product) => (product.kind === "cloud" ? product.cloud.short : product.tool.name);

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

/** A cloud difference, with the place it applies to named as a reader sees it on the drawing. */
export interface PlacedDifference {
  /** The flow key as drawn ("from->to"), or the block id. */
  key: string;
  /** "Agent harness → AI gateway", or the box's title. */
  where: string;
  text: string;
  url?: string;
}

/** Where a cloud does not follow the drawing, keyed the way the drawing keys its flows. */
export function differencesFor(archetype: Archetype, product: CloudProduct): PlacedDifference[] {
  const title = new Map(archetype.blocks.map((b) => [b.id, b.title]));
  const drawn = new Set(archetype.edges.map((e) => `${e.from}->${e.to}`));
  return (product.implementation.differences ?? []).map((d) => {
    if (!d.at.includes("->")) return { key: d.at, where: title.get(d.at) ?? d.at, text: d.text, url: d.url };
    const [a, b] = d.at.split("->");
    // A difference authored against the reply direction marks the arrow as it is drawn.
    const key = drawn.has(d.at) ? d.at : `${b}->${a}`;
    const [from, to] = key.split("->");
    return { key, where: `${title.get(from) ?? from} → ${title.get(to) ?? to}`, text: d.text, url: d.url };
  });
}

/** The marker text for each flow or box that differs: what the drawing shows on hover. */
export function differenceMarks(archetype: Archetype, product: CloudProduct): Map<string, string> {
  const marks = new Map<string, string>();
  for (const d of differencesFor(archetype, product)) marks.set(d.key, marks.has(d.key) ? `${marks.get(d.key)} ${d.text}` : d.text);
  return marks;
}

export const ROLE_LABEL: Record<string, string> = {
  identity: "Identity",
  network: "Network and outbound traffic",
  ingress: "Incoming traffic",
  keys: "Encryption keys",
  secrets: "Secrets",
  registry: "Registries",
  logging: "Logging and monitoring",
  other: "Other",
};
