import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, readFile, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { loadMitigations, readVerifiedSource, isDefensiveTechnique } from "./lib/mitigations";
import { dataset, archetypeById, mitigationById, controlById, controlsForTool } from "../src/lib/data";
import { buildViewerModel } from "../src/components/reference/export-html";

test("all live tabs share native mitigation references, including framework mappings", () => {
  const retired = new Set(Object.keys(dataset.mitigationAliases));
  const walk = (value: unknown, path: string) => {
    if (typeof value === "string") assert.ok(!retired.has(value), `${path}: retired reference ${value}`);
    else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (value && typeof value === "object") for (const [key, v] of Object.entries(value)) {
      // These deliberately preserve historical identifiers, not live entity references.
      if (key === "migration" || key === "mitigationAliases" || key === "legacy") continue;
      if (key === "capabilities" && Array.isArray(v)) for (const item of v) {
        assert.ok(typeof item !== "string" || !mitigationById.has(item), `${path}: MITRE lists must use mitigations`);
      }
      assert.ok(!retired.has(key), `${path}: retired key ${key}`);
      walk(v, `${path}.${key}`);
    }
  };
  walk(dataset, "dataset");
  for (const tool of dataset.tools) {
    const rows = controlsForTool(tool.id);
    const arch = archetypeById.get(tool.architecture)!;
    assert.equal(rows.length, arch.mitigations.length, tool.id);
    for (const row of rows) assert.ok(mitigationById.has(row.mitigation.id), tool.id);
  }
});

test("every architecture HTML export resolves canonical names and numbered mitigation pins", () => {
  for (const arch of dataset.archetypes) {
    const model = buildViewerModel(arch);
    const expected = arch.mitigations.map((id) => mitigationById.get(id)!.title);
    assert.deepEqual(model.legend.mitigations.map((c) => c.title), expected, arch.id);
    assert.deepEqual(model.legend.mitigations.map((c) => c.id), arch.mitigations, `${arch.id}: legend carries the MITRE id`);
    // Chips and hover cards cite the MITRE id beside the canonical name.
    const cited = (n: number) => `${expected[n - 1]} · ${arch.mitigations[n - 1]}`;
    for (const block of model.blocks) for (const c of block.caps) {
      assert.ok(c.n > 0, `${arch.id}: unnumbered ${c.title}`);
      assert.equal(c.title, cited(c.n), arch.id);
    }
    for (const pin of [...model.blockPins, ...model.edgePins]) if (pin.kind === "chip") {
      assert.ok(typeof pin.n === "number" && pin.n > 0, `${arch.id}: unnumbered pin`);
      assert.equal(pin.title, cited(pin.n), arch.id);
    }
  }
});

test("incident replays use migrated architectures while keeping CoSAI control references", () => {
  for (const incident of dataset.incidents) {
    const arch = archetypeById.get(incident.archetype);
    assert.ok(arch, incident.id);
    for (const id of arch.mitigations) assert.ok(mitigationById.has(id), incident.id);
    for (const id of incident.controls) assert.ok(controlById.has(id), incident.id);
    const paths = new Set([
      ...arch.blocks.map((b) => b.id),
      ...arch.edges.flatMap((e) => [`${e.from}->${e.to}`, ...(e.bidir || e.outbound ? [`${e.to}->${e.from}`] : [])]),
    ]);
    for (const step of incident.steps) for (const path of step.path) assert.ok(paths.has(path), `${incident.id}: ${path}`);
  }
});

test("selected mitigations resolve to source definitions and every legacy ID has valid destinations", async () => {
  const profile = await loadMitigations(process.cwd());
  const ids = new Set(profile.mitigations.map((c) => c.id));
  assert.equal(ids.size, profile.mitigations.length);
  assert.equal(Object.keys(profile.aliases).length, 56);
  for (const targets of Object.values(profile.aliases)) {
    for (const id of targets) assert.ok(ids.has(id), id);
  }
  assert.equal(profile.mitigations.find((c) => c.id === "D3-EI")?.title, "Execution Isolation");
  assert.equal(profile.mitigations.find((c) => c.id === "AML.M0031")?.title, "Memory Hardening");
  for (const c of profile.mitigations) {
    assert.match(c.id, /^(D3-[A-Z]+|AML\.M\d{4})$/);
    assert.ok(c.description.length);
    assert.ok(c.origin.version);
    assert.equal(c.controlMappings.length, c.controls.length);
    assert.ok(!c.controls.includes("controlUserPoliciesAndEducation"));
    assert.ok(!c.controls.includes("controlInternalPoliciesAndEducation"));
  }
});

test("source corruption fails before catalogue compilation", async () => {
  const root = await mkdtemp(join(tmpdir(), "mitigation-source-"));
  try {
    await mkdir(join(root, "data/mitre"), { recursive: true });
    await writeFile(join(root, "data/mitre/source.json"), "original");
    await writeFile(join(root, "data/mitre/LICENSE"), "notice");
    const source = { framework: "MITRE D3FEND" as const, version: "test", file: "source.json", license: "LICENSE", url: "https://example.com", sha256: createHash("sha256").update("original").digest("hex") };
    assert.equal(await readVerifiedSource(root, source), "original");
    await writeFile(join(root, "data/mitre/source.json"), "changed");
    await assert.rejects(readVerifiedSource(root, source), /checksum mismatch/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("offensive and cyclic ontology classes do not qualify as defenses", () => {
  const defense = { "@id": "d3f:DefensiveTechnique" };
  const attack = { "@id": "attack:T1000" };
  const cycle = { "@id": "cycle", "rdfs:subClassOf": { "@id": "cycle" } };
  const graph = new Map([defense, attack, cycle].map((n) => [n["@id"], n]));
  assert.equal(isDefensiveTechnique(defense, graph), true);
  assert.equal(isDefensiveTechnique(attack, graph), false);
  assert.equal(isDefensiveTechnique(cycle, graph), false);
});

test("the profile rejects invented mitigation IDs and authored overrides of MITRE definitions", async () => {
  const root = await mkdtemp(join(tmpdir(), "mitigation-profile-"));
  try {
    await mkdir(join(root, "data/overlay"), { recursive: true });
    await symlink(join(process.cwd(), "data/mitre"), join(root, "data/mitre"));
    const { parse, stringify } = await import("yaml");
    const profile = parse(await readFile("data/overlay/mitigations.yaml", "utf8"));
    const path = join(root, "data/overlay/mitigations.yaml");
    const first = profile.mitigations[0];
    const originalId = first.id;
    first.id = "LOCAL-CUSTOM-MITIGATION";
    await writeFile(path, stringify(profile));
    await assert.rejects(loadMitigations(root), /not a vendored defensive technique or mitigation/);
    first.id = originalId;
    first.title = "Our replacement title";
    await writeFile(path, stringify(profile));
    await assert.rejects(loadMitigations(root), /upstream definitions must not be overridden/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
