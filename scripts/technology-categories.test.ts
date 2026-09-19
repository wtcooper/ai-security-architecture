import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parse, stringify } from "yaml";
import { dataset, categoriesForMitigations, mitigationsForCategory } from "../src/lib/data";
import { frameworkView, visibleFrameworks, mappingsForControl } from "../src/lib/frameworks";
import { loadTechnologyCategories } from "./lib/technology-categories";

const root = process.cwd();
const mitigationIds = new Set(dataset.mitigations.map((m) => m.id));
const controlIds = new Set(dataset.controls.map((c) => c.id));

test("CoSAI core entities and NIST AI RMF mappings remain exactly upstream", async () => {
  for (const kind of ["components", "risks", "controls", "personas"] as const) {
    const upstream = parse(await readFile(join(root, `data/cosai/${kind}.yaml`), "utf8"));
    assert.deepEqual(dataset[kind], upstream[kind], kind);
  }
  const nist = frameworkView("nist-ai-rmf")!;
  assert.ok(nist.entries.some((e) => e.controls.length));
  assert.equal(nist.framework.authored, undefined);
  assert.equal(dataset.authoredMappings["nist-ai-rmf"], undefined);
  const control = dataset.controls.find((c) => c.mappings?.["nist-ai-rmf"]?.length && dataset.authoredMappings["nist-csf"].controls?.[c.id])!;
  assert.ok(control);
  const mappings = mappingsForControl(control);
  assert.ok(mappings.some((m) => m.frameworkId === "nist-ai-rmf" && !m.authored));
  assert.ok(mappings.some((m) => m.frameworkId === "nist-csf" && m.authored));
});

test("technology categories are sourced, distinct from MITRE, and invert into each framework view", async () => {
  const catalogue = await loadTechnologyCategories(root, mitigationIds, controlIds);
  assert.deepEqual(catalogue.categories, dataset.technologyCategories);
  for (const capability of dataset.technologyCategories) {
    assert.match(capability.id, /^tech-/);
    assert.ok(!mitigationIds.has(capability.id));
    for (const m of capability.frameworkMappings) {
      const entry = frameworkView(m.framework)!.entries.find((e) => e.id === m.entry)!;
      assert.ok(entry.categories.some((c) => c.id === capability.id), `${capability.id}: ${m.framework}`);
      assert.ok(entry.mappingNotes?.some((n) => n.entity === capability.id && n.rationale === m.rationale));
      assert.ok(entry.identifierKind && entry.sourceLocation && entry.url);
    }
    for (const m of capability.mitigationMappings) assert.ok(categoriesForMitigations([m.mitigation]).some((c) => c.id === capability.id));
    assert.ok(mitigationsForCategory(capability.id).length, `${capability.id}: realises no capability`);
  }
  for (const id of ["owasp-solutions", "enisa-ecsmaf", "ecso-market", "cisa-tic", "nist-csf"]) {
    assert.ok(visibleFrameworks.some((f) => f.id === id));
    assert.ok(frameworkView(id)!.entries.some((e) => e.categories.length));
  }
});

test("DLP retains technology identity and several source mappings without merging with AI guardrails", () => {
  const dlp = dataset.technologyCategories.find((c) => c.id === "tech-dlp")!;
  assert.deepEqual(dlp.frameworkMappings.map((m) => m.framework), ["enisa-ecsmaf", "ecso-market", "cisa-tic", "cisa-tic", "nist-csf"]);
  assert.ok(dataset.technologyCategories.some((c) => c.id === "tech-llm-guardrails"));
  assert.ok(dataset.technologyCategories.some((c) => c.id === "tech-casb"));
  assert.ok(dataset.technologyCategories.some((c) => c.id === "tech-ai-spm"));
  assert.ok(mitigationsForCategory(dlp.id).some((c) => c.id === "cap-sensitive-data-redaction"), "categories reach specialisations through the parent");
  assert.equal(dlp.frameworkMappings.find((m) => m.framework === "nist-csf")?.relationship, "supports");
  assert.ok(!("status" in dlp), "category links cannot manufacture deployed coverage");
});

test("NIST CSF has all 22 categories, explicit mapping rationales, and visible unmapped categories", () => {
  const view = frameworkView("nist-csf")!;
  assert.equal(view.entries.length, 22);
  assert.equal(view.framework.entriesComplete, true);
  assert.ok(view.entries.some((e) => e.total === 0));
  assert.equal(view.coverage.find((c) => c.kind === "controls")?.mapped, 34);
  for (const entry of view.entries) for (const control of entry.controls) {
    assert.ok(entry.mappingNotes?.some((m) => m.entity === control.id && m.kind === "controls" && m.rationale));
  }
});

test("catalogue rejects dangling references, missing evidence, duplicate identities and invented source categories", async () => {
  const temp = await mkdtemp(join(tmpdir(), "technology-catalogue-"));
  try {
    await mkdir(join(temp, "data/frameworks"), { recursive: true });
    await mkdir(join(temp, "data/overlay"), { recursive: true });
    const sources = await readFile(join(root, "data/frameworks/technology-sources.yaml"), "utf8");
    const profile = parse(await readFile(join(root, "data/overlay/technology-categories.yaml"), "utf8"));
    await writeFile(join(temp, "data/frameworks/technology-sources.yaml"), sources);
    for (const [mutate, pattern] of [
      [(p: typeof profile) => { p.categories[0].mitigationMappings[0].mitigation = "D3-INVENTED"; }, /unknown mitigation/],
      [(p: typeof profile) => { p.categories[0].frameworkMappings[0].rationale = ""; }, /invalid framework mapping/],
      [(p: typeof profile) => { p.categories[0].mitigationMappings[0].sources = [{ title: "", url: "not-a-source" }]; }, /invalid implementation source/],
      [(p: typeof profile) => { p.categories.push(p.categories[0]); }, /duplicate category/],
      [(p: typeof profile) => { p.categories[0].frameworkMappings[0].entry = "invented"; p.categories[0].primarySource.entry = "invented"; }, /unknown category/],
    ] as const) {
      const copy = structuredClone(profile); mutate(copy);
      await writeFile(join(temp, "data/overlay/technology-categories.yaml"), stringify(copy));
      await assert.rejects(loadTechnologyCategories(temp, mitigationIds, controlIds), pattern);
    }
  } finally { await rm(temp, { recursive: true, force: true }); }
});

test("expanded implementation paths retain sources, scope limits, and original category identities", () => {
  assert.equal(dataset.technologyCategories.length, 25);
  assert.ok(!dataset.technologyCategories.some((c) => c.id === "tech-llm-firewall"), "firewall folded into guardrails");
  assert.ok(dataset.technologyCategories.find((c) => c.id === "tech-llm-guardrails")!.frameworkMappings.some((m) => m.entry === "llm-firewall"));
  for (const [capabilityId, methodIds] of [
    ["tech-ai-spm", ["AML.M0023", "D3-DI"]],
    ["tech-access", ["D3-SCP"]],
    ["tech-cwpp", ["D3-FIM"]],
  ] as const) {
    const capability = dataset.technologyCategories.find((c) => c.id === capabilityId)!;
    for (const id of methodIds) {
      const mapping = capability.mitigationMappings.find((m) => m.mitigation === id)!;
      assert.ok(mapping.sources?.length, id);
      assert.ok(mapping.rationale.length > 120, "retain implementation scope limits");
      assert.ok(categoriesForMitigations([id]).includes(capability));
    }
  }
});
