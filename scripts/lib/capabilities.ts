import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { parse } from "yaml";
import type { Capability, Surface } from "../../src/lib/types";

interface Source {
  framework: "MITRE D3FEND" | "MITRE ATLAS";
  version: string;
  file: string;
  url: string;
  sha256: string;
  license: string;
}
interface D3Node {
  "@id": string;
  "d3f:d3fend-id"?: string;
  "d3f:definition"?: string;
  "rdfs:label"?: string;
  "rdfs:subClassOf"?: { "@id": string } | { "@id": string }[];
}
interface Mitigation {
  id: string;
  name: string;
  description: string;
  "object-type": string;
}

export async function readVerifiedSource(root: string, source: Source): Promise<string> {
  const bytes = await readFile(join(root, "data/mitre", source.file));
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== source.sha256) throw new Error(`MITRE checksum mismatch: ${source.file}`);
  await readFile(join(root, "data/mitre", source.license));
  return bytes.toString("utf8");
}

/** Only descendants of DefensiveTechnique may enter the defensive catalogue. */
export function isDefensiveTechnique(node: D3Node, graph: Map<string, D3Node>, seen = new Set<string>()): boolean {
  if (node["@id"] === "d3f:DefensiveTechnique") return true;
  if (seen.has(node["@id"])) return false;
  seen.add(node["@id"]);
  const parents = node["rdfs:subClassOf"];
  return (Array.isArray(parents) ? parents : parents ? [parents] : []).some((p) => {
    const parent = graph.get(p["@id"]);
    return parent ? isDefensiveTechnique(parent, graph, seen) : false;
  });
}

export async function loadCapabilities(root: string) {
  const profile = parse(await readFile(join(root, "data/overlay/capabilities.yaml"), "utf8")) as {
    attribution: string; surfaces: Surface[]; capabilities: Capability[];
  };
  const { sources } = parse(await readFile(join(root, "data/mitre/sources.yaml"), "utf8")) as { sources: Source[] };
  const upstream = new Map<string, Pick<Capability, "title" | "description" | "origin">>();
  for (const source of sources) {
    const raw = await readVerifiedSource(root, source);
    if (source.framework === "MITRE D3FEND") {
      const nodes = (JSON.parse(raw) as { "@graph": D3Node[] })["@graph"];
      const graph = new Map(nodes.map((n) => [n["@id"], n]));
      for (const n of nodes) {
        const id = n["d3f:d3fend-id"];
        if (!id || !n["rdfs:label"] || !n["d3f:definition"] || !isDefensiveTechnique(n, graph)) continue;
        upstream.set(id, {
          title: n["rdfs:label"], description: [n["d3f:definition"]],
          origin: { framework: source.framework, version: source.version, entityType: "defensive-technique", url: `https://d3fend.mitre.org/technique/${n["@id"]}/` },
        });
      }
    } else {
      const atlas = parse(raw) as { collection: { version: string }; mitigations: Record<string, Mitigation> };
      if (atlas.collection.version !== source.version) throw new Error("ATLAS release does not match manifest");
      for (const [id, m] of Object.entries(atlas.mitigations)) {
        if (m.id !== id || m["object-type"] !== "mitigation") throw new Error(`Invalid ATLAS mitigation: ${id}`);
        upstream.set(id, {
          title: m.name, description: [m.description],
          origin: { framework: source.framework, version: source.version, entityType: "mitigation", url: `https://atlas.mitre.org/mitigations/${id}` },
        });
      }
    }
  }
  const capabilities = profile.capabilities.map((c): Capability => {
    if (c.title || c.description || c.origin) throw new Error(`${c.id}: upstream definitions must not be overridden in the profile`);
    const definition = upstream.get(c.id);
    if (!definition) throw new Error(`${c.id}: not a vendored defensive technique or mitigation`);
    return { ...c, ...definition };
  });
  const migration = parse(await readFile(join(root, "data/migrations/capabilities-v1.yaml"), "utf8")) as {
    mappings: Record<string, { targets: string[] }>;
  };
  const ids = new Set(capabilities.map((c) => c.id));
  for (const [old, rule] of Object.entries(migration.mappings)) {
    if (!old.startsWith("capability") || rule.targets.some((id) => !ids.has(id))) {
      throw new Error(`Invalid capability migration: ${old}`);
    }
  }
  return { ...profile, capabilities, aliases: Object.fromEntries(Object.entries(migration.mappings).map(([id, rule]) => [id, rule.targets])) };
}
