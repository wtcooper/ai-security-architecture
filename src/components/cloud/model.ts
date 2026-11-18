/**
 * A pattern as built on one cloud: which service plays each component, and which of the cloud's
 * own settings deliver each control. Everything here is read from the cloud's file
 * (data/clouds/<cloud>.yaml); nothing is inferred beyond joining a setting to the controls it
 * names and to the control-plane box that owns those controls.
 */
import { ownedControls } from "@/components/drawing/layout";
import { archetypesInOrder, clouds, productsForArchetype, type Product } from "@/lib/data";
import { cloudSlug } from "@/lib/routes";
import { HOSTING_COMPARE, type Archetype, type ArchBlock, type CloudBinding, type CloudPlatform, type HostingCompareKey, type HostingOption, type ProductSetting } from "@/lib/types";

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

/**
 * The product a platform implies on a pattern: a service that exists only on that platform (a
 * cloud's managed agent service). It is not a separate choice, so it never appears as a pill.
 */
export const serviceFor = (products: Product[], platformId: string | null | undefined): Extract<Product, { kind: "tool" }> | null =>
  (platformId && products.find((p): p is Extract<Product, { kind: "tool" }> => p.kind === "tool" && p.tool.platform === platformId)) || null;

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
    },
    settings: ids.map((id) => byId.get(id)!).filter(Boolean),
  };
  resolved.set(key, next);
  return next;
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
