import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parse, stringify } from "yaml";
import { dataset, capabilitiesForMitigations, capabilitiesForControl } from "../src/lib/data";
import { frameworkView, visibleFrameworks, mappingsForControl } from "../src/lib/frameworks";
import { loadTechnologyCatalogue } from "./lib/technology-capabilities";

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
  const catalogue = await loadTechnologyCatalogue(root, mitigationIds, controlIds);
  assert.deepEqual(catalogue.capabilities, dataset.capabilities);
  for (const capability of dataset.capabilities) {
    assert.match(capability.id, /^tech-/);
    assert.ok(!mitigationIds.has(capability.id));
    for (const m of capability.frameworkMappings) {
      const entry = frameworkView(m.framework)!.entries.find((e) => e.id === m.entry)!;
      assert.ok(entry.capabilities.some((c) => c.id === capability.id), `${capability.id}: ${m.framework}`);
      assert.ok(entry.mappingNotes?.some((n) => n.entity === capability.id && n.rationale === m.rationale));
      assert.ok(entry.identifierKind && entry.sourceLocation && entry.url);
    }
    for (const m of capability.mitigationMappings) assert.ok(capabilitiesForMitigations([m.mitigation]).some((c) => c.id === capability.id));
  }
  for (const id of ["owasp-solutions", "enisa-ecsmaf", "ecso-market", "cisa-tic", "nist-csf"]) {
    assert.ok(visibleFrameworks.some((f) => f.id === id));
    assert.ok(frameworkView(id)!.entries.some((e) => e.capabilities.length));
  }
});

test("DLP retains technology identity and several source mappings without merging with AI guardrails", () => {
  const dlp = dataset.capabilities.find((c) => c.id === "tech-dlp")!;
  assert.deepEqual(dlp.frameworkMappings.map((m) => m.framework), ["enisa-ecsmaf", "ecso-market", "cisa-tic", "cisa-tic", "nist-csf"]);
  assert.ok(dataset.capabilities.some((c) => c.id === "tech-llm-guardrails"));
  assert.ok(dataset.capabilities.some((c) => c.id === "tech-casb"));
  assert.ok(dataset.capabilities.some((c) => c.id === "tech-ai-spm"));
  assert.ok(capabilitiesForControl("controlUserDataManagement").some((c) => c.id === dlp.id));
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
    const profile = parse(await readFile(join(root, "data/overlay/technology-capabilities.yaml"), "utf8"));
    await writeFile(join(temp, "data/frameworks/technology-sources.yaml"), sources);
    for (const [mutate, pattern] of [
      [(p: typeof profile) => { p.capabilities[0].mitigationMappings[0].mitigation = "D3-INVENTED"; }, /unknown mitigation/],
      [(p: typeof profile) => { p.capabilities[0].frameworkMappings[0].rationale = ""; }, /invalid framework mapping/],
      [(p: typeof profile) => { p.capabilities.push(p.capabilities[0]); }, /duplicate capability/],
      [(p: typeof profile) => { p.capabilities[0].frameworkMappings[0].entry = "invented"; p.capabilities[0].primarySource.entry = "invented"; }, /unknown category/],
    ] as const) {
      const copy = structuredClone(profile); mutate(copy);
      await writeFile(join(temp, "data/overlay/technology-capabilities.yaml"), stringify(copy));
      await assert.rejects(loadTechnologyCatalogue(temp, mitigationIds, controlIds), pattern);
    }
  } finally { await rm(temp, { recursive: true, force: true }); }
});
