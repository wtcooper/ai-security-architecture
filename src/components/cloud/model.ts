/**
 * A pattern as built on one cloud: which service plays each component, and which of the cloud's
 * own settings deliver each control. Everything here is read from the cloud's file
 * (data/clouds/<cloud>.yaml); nothing is inferred beyond joining a setting to the controls it
 * names and to the control-plane box that owns those controls.
 */
import { ownedControls } from "@/components/drawing/layout";
import { archetypesInOrder, clouds, productsForArchetype, tools, type Product } from "@/lib/data";
import { cloudSlug } from "@/lib/routes";
import { applyShape, describeShape, type ShapeLine } from "@/lib/shape";
import { HOSTING_COMPARE, namesProduct, type Archetype, type ArchBlock, type CloudBinding, type CloudPlatform, type HostingCompareKey, type HostingOption, type ProductSetting, type TechOption, type TechPack, type Tool } from "@/lib/types";

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

/** The ways a platform can host a pattern, if more than one has been compared. */
export const hostingOptionsFor = (product: CloudProduct): HostingOption[] => product.implementation.hosting ?? [];

/** The patterns that name this one as their managed way of hosting on a platform: where you run it yourself. */
export const selfRunPatternsFor = (patternId: string, cloudId: string): Archetype[] =>
  archetypesInOrder.filter((a) =>
    clouds
      .find((c) => c.id === cloudId)
      ?.implementations.some((i) => i.architecture === a.id && i.hosting?.some((o) => o.kind === "managed" && o.pattern === patternId)),
  );

/** True when the pattern is itself the managed way of hosting others: it has no hosting choice of its own. */
export const isManagedTarget = (patternId: string): boolean =>
  clouds.some((c) => c.implementations.some((i) => i.hosting?.some((o) => o.kind === "managed" && o.pattern === patternId)));

/** Platforms that cannot be the place for a hosted pattern, with the reason and what to use there. */
export const notOfferedFor = (patternId: string): { cloud: CloudPlatform; why: string; instead?: Archetype }[] =>
  clouds.flatMap((c) =>
    (c.notOffered ?? [])
      .filter((n) => n.architecture === patternId)
      .map((n) => ({ cloud: c, why: n.why, instead: n.instead ? archetypesInOrder.find((a) => a.id === n.instead) : undefined })),
  );

/** The option the mapping's own components and settings describe. */
export const mappedHosting = (product: CloudProduct): HostingOption | undefined => hostingOptionsFor(product).find((o) => o.mapped);

/** The hosting option in effect: the one chosen if it is a variant of this pattern, else the mapped one. */
export const hostingInEffect = (product: CloudProduct, optionId: string | null): HostingOption | undefined => {
  const chosen = hostingOptionsFor(product).find((o) => o.id === optionId && o.kind !== "managed");
  return chosen ?? mappedHosting(product);
};

/**
 * A platform as hosted on one of its options. The mapped option is the mapping itself; a variant
 * changes only some components and settings, so everything else is carried over. A managed
 * option is another pattern and is never resolved here.
 */
const resolved = new Map<string, CloudProduct>();
export function hostedAs(product: CloudProduct, optionId: string | null): CloudProduct {
  const option = hostingOptionsFor(product).find((o) => o.id === optionId);
  if (!option || option.mapped || option.kind === "managed") return product;
  const key = `${product.id}|${product.implementation.architecture}|${option.id}`;
  const cached = resolved.get(key);
  if (cached) return cached;
  const impl = product.implementation;
  const swap = new Map((option.bindings ?? []).map((b) => [b.block, b]));
  const dropped = new Set(option.dropSettings ?? []);
  const gone = new Set(option.dropDifferences ?? []);
  const ids = [...impl.settings.filter((id) => !dropped.has(id)), ...(option.addSettings ?? [])];
  const byId = new Map(product.cloud.settings.map((st) => [st.id, st]));
  const next: CloudProduct = {
    ...product,
    implementation: {
      ...impl,
      summary: option.summary ? [option.summary] : impl.summary,
      bindings: impl.bindings.map((b) => (swap.has(b.block) ? { ...swap.get(b.block)!, verified: swap.get(b.block)!.url ? impl.verified : undefined } : b)),
      settings: ids,
      differences: [...(impl.differences ?? []).filter((d) => !gone.has(d.at)), ...(option.differences ?? [])],
      alsoNeeded: [...(impl.alsoNeeded ?? []), ...(option.alsoNeeded ?? [])],
      quickstart: option.quickstart?.length ? option.quickstart : impl.quickstart,
      // A variant's changes of shape apply on top of the mapping's.
      shape: [...(impl.shape ?? []), ...(option.shape ?? [])],
    },
    settings: [...ids.map((id) => byId.get(id)!).filter(Boolean), ...(product.service?.settings ?? [])],
  };
  resolved.set(key, next);
  return next;
}

/**
 * The pattern as drawn on a platform (and hosting option), where the platform's own documentation
 * shows another shape: its changes applied to a copy, cached so a page gets the same object on
 * every render. The pattern itself where the platform draws it as it is. `product` is the
 * platform as hosted (hostedAs), which carries the mapping's changes and the option's after them.
 */
const drawnCache = new Map<string, Archetype>();
export function drawnOn(archetype: Archetype, product: CloudProduct, hostId: string | null = null): Archetype {
  const changes = product.implementation.shape ?? [];
  if (!changes.length) return archetype;
  const option = hostId ? hostingOptionsFor(product).find((o) => o.id === hostId && !o.mapped && o.kind !== "managed") : undefined;
  const key = `${archetype.id}|${product.id}|${option?.id ?? ""}`;
  const hit = drawnCache.get(key);
  if (hit) return hit;
  const on = option ? `${platformWords(product.cloud).on}, hosted on ${option.name}` : platformWords(product.cloud).on;
  const drawn = applyShape(archetype, changes, { key, on }).archetype;
  drawnCache.set(key, drawn);
  return drawn;
}

/** Every drawing of a pattern that differs from its own: each mapping with changes of shape, and each hosting option that adds its own. */
export function drawnVariants(archetype: Archetype): { label: string; short: string; product: CloudProduct; host: string | null; archetype: Archetype }[] {
  return cloudProductsFor(archetype.id).flatMap((p) => [
    ...(p.implementation.shape?.length ? [{ label: platformWords(p.cloud).on, short: p.cloud.short, product: p, host: null, archetype: drawnOn(archetype, p, null) }] : []),
    ...hostingOptionsFor(p)
      .filter((o) => !o.mapped && o.kind !== "managed" && o.shape?.length)
      .map((o) => {
        const hosted = hostedAs(p, o.id);
        return { label: `${platformWords(p.cloud).on}, hosted on ${o.name}`, short: `${p.cloud.short} · ${o.name}`, product: hosted, host: o.id, archetype: drawnOn(archetype, hosted, o.id) };
      }),
  ]);
}

/** A platform's changes of shape as How it works lists them, the organisation's own boundary named as the drawing names it. */
export function shapeLinesFor(archetype: Archetype, product: CloudProduct): ShapeLine[] {
  const boundary = product.cloud.boundary;
  const zoneTitle = (id: string) => (boundary && archetype.zones?.find((z) => z.id === id)?.owner === "cloud" ? boundary : undefined);
  return describeShape(archetype, product.implementation.shape ?? [], zoneTitle);
}

export const HOSTING_KIND_LABEL: Record<string, string> = {
  cluster: "Your own cluster",
  runtime: "The platform's own runtime",
  managed: "A managed service",
};

/** How one hosted pattern words its hosting choice: what is hosted, and the comparison rows that differ. */
export interface HostingWords {
  /** What is hosted, as it reads after "who runs". */
  thing: string;
  managedKind: string;
  /** What choosing the managed option means. */
  managed: string;
  offers: string;
  rows: Partial<Record<HostingCompareKey, string>>;
}

const AGENT_HOSTING: HostingWords = {
  thing: "the agent",
  managedKind: "A managed agent service",
  managed: "The vendor hosts and operates the agent, so this is drawn as another pattern",
  offers: "lets you build",
  rows: {
    runs: "Who runs the agent loop",
    data: "Where prompts and state are processed and kept",
    identity: "The identity the agent runs as",
    accepts: "Frameworks and agent types it accepts",
    workload: "Long-running and event-driven work",
  },
};

const managedMeans = (thing: string) => `The vendor runs ${thing} for you, so this pattern's components and settings no longer describe it`;

const HOSTING_WORDS: Record<string, HostingWords> = {
  archRemoteMcpServer: {
    thing: "the MCP server",
    managedKind: "A managed service",
    managed: managedMeans("the MCP server"),
    offers: "offers",
    rows: {
      runs: "Who runs the MCP server",
      data: "Where requests and tool results are processed and kept",
      identity: "The identity the server runs as",
      accepts: "Transports, languages and SDKs it accepts",
      workload: "Sessions, streaming and long tool calls",
    },
  },
  archSelfHostedInference: {
    thing: "the model server",
    managedKind: "A managed service",
    managed: managedMeans("the model server"),
    offers: "offers",
    rows: {
      runs: "Who runs the model server",
      data: "Where prompts, completions and weights are processed and kept",
      identity: "The identity the model server runs as",
      accepts: "Models, formats and serving engines it accepts",
      workload: "GPUs, scaling and idle capacity",
    },
  },
  archTrainingPipeline: {
    thing: "the training job",
    managedKind: "A managed service",
    managed: managedMeans("the training"),
    offers: "offers",
    rows: {
      runs: "Who runs the training code",
      data: "Where training data, checkpoints and weights are processed and kept",
      identity: "The identity the job runs as",
      accepts: "Frameworks, containers and tuning methods it accepts",
      workload: "Long jobs, GPUs, checkpoints and interruptions",
    },
  },
  archSoftwareFactory: {
    thing: "the factory's coding agent",
    managedKind: "A managed coding agent",
    managed: managedMeans("the coding agent"),
    offers: "offers",
    rows: {
      runs: "Who runs the coding agent, and what isolates each build",
      data: "Where specs, code and build output are processed and kept",
      identity: "The identity the coding agent runs as",
      accepts: "Agents, languages and toolchains it accepts",
      workload: "Build length, parallel builds and idle capacity",
    },
  },
  archAgentSandbox: {
    thing: "the sandbox",
    managedKind: "A managed service",
    managed: managedMeans("the sandbox"),
    offers: "offers",
    rows: {
      runs: "Who runs the sandbox, and what isolates each run",
      data: "Where a run's code, files and results are processed and kept",
      identity: "The identity a run has",
      accepts: "Images, languages and tools it accepts",
      workload: "Start time, session length and parallel runs",
    },
  },
};

export const hostingWords = (patternId: string): HostingWords => HOSTING_WORDS[patternId] ?? AGENT_HOSTING;

/** The comparison rows as one pattern labels them. */
export const hostingRows = (patternId: string): [HostingCompareKey, string][] =>
  HOSTING_COMPARE.map(([key, label]) => [key, hostingWords(patternId).rows[key] ?? label]);

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
      options: [
        ...cloud.settings
          .filter((s) => s.mitigations.includes(controlId))
          .map((setting) => ({
            setting,
            patterns: archetypesInOrder.filter((a) => {
              const impl = cloud.implementations.find((i) => i.architecture === a.id);
              return Boolean(impl?.settings.includes(setting.id) && a.mitigations.includes(controlId));
            }),
          })),
        // The settings of the platform's own service, on the pattern that service is.
        ...servicesOn(cloud.id).flatMap(({ tool, pattern }) =>
          (tool.settings ?? []).filter((s) => s.mitigations.includes(controlId) && pattern.mitigations.includes(controlId)).map((setting) => ({ setting, patterns: [pattern] })),
        ),
      ].filter((o) => o.patterns.length),
    }))
    .filter((c) => c.options.length);
}

/** A platform's own managed services that are a pattern in themselves, each with that pattern. */
export const servicesOn = (cloudId: string): { tool: Tool; pattern: Archetype }[] =>
  tools.flatMap((tool) => {
    const pattern = tool.platform === cloudId ? archetypesInOrder.find((a) => a.id === tool.architecture) : undefined;
    return pattern ? [{ tool, pattern }] : [];
  });

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

// --- Technology packs: which products fill the boxes, where the organisation chooses them ------

/**
 * The products a reader has chosen on a platform with packs: one platform pack (or "mix", their
 * own choice per box), and any add-ons, each of which replaces the platform pack's product on the
 * boxes it covers. Nothing chosen is `{ pack: null, addons: [] }`.
 */
export interface Stack {
  pack: string | null;
  addons: string[];
}
export const MIX = "mix";
export const NO_STACK: Stack = { pack: null, addons: [] };

/** True when a stack puts a product on some box: a platform pack, or an add-on. */
export const stackChosen = (stack: Stack) => Boolean((stack.pack && stack.pack !== MIX) || stack.addons.length);

/** A control-plane box is a function, played by several products at once. */
export const isControlBox = (archetype: Archetype, blockId: string) => archetype.blocks.find((b) => b.id === blockId)?.kind === "governance";

/** The packs that fill at least one box of this pattern as hosted, platform packs and add-ons apart. */
export function packsFor(product: CloudProduct): { platform: TechPack[]; addons: TechPack[] } {
  const listed = new Set(product.implementation.bindings.flatMap((b) => (b.options ?? []).flatMap((o) => o.packs ?? [])));
  const packs = (product.cloud.packs ?? []).filter((p) => listed.has(p.id));
  return { platform: packs.filter((p) => p.scope === "platform"), addons: packs.filter((p) => p.scope === "addon") };
}

/** The stack an address names, keeping only what this pattern as hosted offers. */
export function stackFrom(product: CloudProduct | null, pack: string | null | undefined, addons: string | string[] | null | undefined): Stack {
  if (!product) return NO_STACK;
  const { platform, addons: offered } = packsFor(product);
  const ids = (Array.isArray(addons) ? addons : (addons ?? "").split(",")).map((x) => x.trim()).filter(Boolean);
  return {
    pack: pack === MIX || platform.some((p) => p.id === pack) ? (pack as string) : null,
    addons: [...new Set(ids)].filter((id) => offered.some((p) => p.id === id)),
  };
}

/**
 * The products in effect on a box for a stack: the last chosen add-on that covers it, else the
 * platform pack's. A component box has one; a control-plane box can have several. None: the
 * stack does not fill the box, so its options are what you bring.
 */
export function productsInEffect(binding: CloudBinding, stack: Stack, control = false): TechOption[] {
  const options = binding.options ?? [];
  const of = (id: string) => options.filter((o) => o.packs?.includes(id));
  for (const id of [...stack.addons].reverse()) {
    const hit = of(id);
    if (hit.length) return control ? hit : hit.slice(0, 1);
  }
  if (stack.pack && stack.pack !== MIX) {
    const hit = of(stack.pack);
    if (hit.length) return control ? hit : hit.slice(0, 1);
  }
  return [];
}

/** The boxes of this pattern a pack puts a product on, by block id. */
export const boxesFilledBy = (product: CloudProduct, packId: string): string[] =>
  product.implementation.bindings.filter((b) => b.options?.some((o) => o.packs?.includes(packId))).map((b) => b.block);

/**
 * Whether a settings row applies to the stack chosen. A row with no product applies whatever is
 * chosen, and with nothing chosen every row is shown. Otherwise a row is shown when its product is
 * in effect on some box, or when no box the stack fills offers something else in its place: a
 * product that is an option only on boxes the stack leaves to you, or on no box at all, may be the
 * one you run.
 */
export function settingApplies(archetype: Archetype, product: CloudProduct, stack: Stack, setting: ProductSetting): boolean {
  const name = setting.product;
  if (!name || !stackChosen(stack)) return true;
  const bound = product.implementation.bindings.filter((b) => b.options?.length);
  if (bound.some((b) => productsInEffect(b, stack, isControlBox(archetype, b.block)).some((o) => namesProduct(o.name, name)))) return true;
  const offering = bound.filter((b) => !isControlBox(archetype, b.block) && b.options!.some((o) => namesProduct(o.name, name)));
  return !offering.length || offering.some((b) => !productsInEffect(b, stack).length);
}

// Cached per platform as hosted, so a page receives the same object on every render.
const stacked = new WeakMap<CloudProduct, Map<string, { product: CloudProduct; hidden: ProductSetting[] }>>();
/**
 * A platform as built with a stack: the same mapping, with the settings rows of products the
 * stack puts something else in place of left out. They are counted, so a page can say so.
 */
export function stackedAs(archetype: Archetype, product: CloudProduct, stack: Stack): { product: CloudProduct; hidden: ProductSetting[] } {
  if (!stackChosen(stack)) return { product, hidden: [] };
  const key = `${archetype.id}|${stack.pack}|${stack.addons.join(",")}`;
  const byStack = stacked.get(product) ?? new Map();
  stacked.set(product, byStack);
  const hit = byStack.get(key);
  if (hit) return hit;
  const keep = product.settings.filter((s) => settingApplies(archetype, product, stack, s));
  const out = { product: { ...product, settings: keep }, hidden: product.settings.filter((s) => !keep.includes(s)) };
  byStack.set(key, out);
  return out;
}

/** What a box shows on a platform with packs, and its options as hover help marks them. */
export function boxProduct(archetype: Archetype, binding: CloudBinding, stack: Stack): { text: string; inEffect: TechOption[] } {
  const inEffect = productsInEffect(binding, stack, isControlBox(archetype, binding.block));
  return { text: !isControlBox(archetype, binding.block) && inEffect[0] ? inEffect[0].name : binding.service, inEffect };
}

export const KIND_LABEL: Record<string, string> = { open: "Open source", commercial: "Commercial", mixed: "Open and commercial" };
export const STATUS_LABEL: Record<string, string> = { ga: "Generally available", preview: "Preview", mixed: "Some parts in preview" };

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
