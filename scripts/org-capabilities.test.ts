import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { compileOrgCapabilities, checkOrgToolCapabilities } from "./lib/org-capabilities";
import { capabilitySupportStatus } from "../src/lib/org-capabilities";
import { dataset, orgCapabilitySurfacePostureFor, orgSurfacePostureFor, orgStatusFor, mitigationsWithoutCapabilities } from "../src/lib/data";
import { renameMitigationKeys, isOrgCapabilityDocument } from "./rename-mitigations";
import type { OrgCapability, OrgToolPosture } from "../src/lib/types";

const example: OrgCapability = { id: "TEST-DLP", title: "Test DLP", capability: "tech-dlp", surfaces: { surfaceEndpoint: { status: "enabled", note: "Assessed deployment" } } };
const compile = (entries: OrgCapability[]) => compileOrgCapabilities({ meta: dataset.meta.org, capabilities: entries }, dataset.capabilities, dataset.mitigations, new Set(dataset.surfaces.map((s) => s.id)));

test("one org capability generates exactly its default category, method, and CoSAI control associations", () => {
  const result = compile([example]);
  const mapping = result.mappings["org-capabilities"]!;
  assert.deepEqual(mapping.capabilities, { "tech-dlp": [example.id] });
  const technology = dataset.capabilities.find((c) => c.id === "tech-dlp")!;
  assert.deepEqual(Object.keys(mapping.mitigations!).sort(), technology.mitigationMappings.map((m) => m.mitigation).sort());
  const controls = new Set(technology.mitigationMappings.flatMap((m) => dataset.mitigations.find((v) => v.id === m.mitigation)!.controls));
  assert.deepEqual(new Set(Object.keys(mapping.controls!)), controls);
  assert.equal(mapping.risks, undefined);
  assert.deepEqual(result.entries["org-capabilities"]!.entries[example.id].label, example.title);
});

test("org schema rejects direct method/control mappings, invalid categories, duplicate IDs and bad status", () => {
  assert.throws(() => compile([{ ...example, controls: ["controlUserDataManagement"] } as OrgCapability]), /map only/);
  assert.throws(() => compile([{ ...example, mitigations: ["AML.M0020"] } as OrgCapability]), /map only/);
  assert.throws(() => compile([{ ...example, capability: "D3-EI" }]), /unknown default capability/);
  assert.throws(() => compile([example, example]), /duplicate/);
  assert.throws(() => compile([{ ...example, surfaces: { invalid: { status: "enabled" } } }]), /unsupported surface/);
  assert.throws(() => compile([{ ...example, surfaces: { surfaceEndpoint: { status: "invalid" } } } as unknown as OrgCapability]), /invalid status/);
});

test("per-tool assessments use org capability IDs and must reach a pinned mitigation", () => {
  const valid: OrgToolPosture = { tool: "toolClaudeCode", available: true, capabilities: { [example.id]: { status: "inProgress" } } };
  const check = (record: OrgToolPosture) => checkOrgToolCapabilities([record], [example], dataset.capabilities, dataset.tools, dataset.archetypes);
  assert.deepEqual(check(valid), [valid]);
  assert.throws(() => check({ ...valid, controls: { "D3-EI": { status: "enabled" } } } as OrgToolPosture), /author capabilities only/);
  assert.throws(() => check({ ...valid, capabilities: { "tech-dlp": { status: "enabled" } } }), /unknown or has no mapping/);
  assert.throws(() => check({ ...valid, capabilities: { "AML.M0020": { status: "enabled" } } }), /unknown or has no mapping/);
});

test("mixed and missing capability assessments never become an all-enabled rollup", () => {
  assert.equal(capabilitySupportStatus([]), "notAssessed");
  assert.equal(capabilitySupportStatus([undefined]), "notAssessed");
  assert.equal(capabilitySupportStatus([{ status: "enabled" }, { status: "enabled" }]), "enabled");
  assert.equal(capabilitySupportStatus([{ status: "enabled" }, { status: "gap" }]), "inProgress");
  assert.equal(capabilitySupportStatus([{ status: "enabled" }, undefined]), "inProgress");
  assert.equal(capabilitySupportStatus([{ status: "gap" }]), "gap");
});

test("actual surface and tool support can be traced only to their recorded capabilities", () => {
  for (const method of dataset.mitigations) for (const surface of dataset.surfaces) {
    const support = orgSurfacePostureFor(method.id, surface.id);
    for (const c of support.contributions) {
      const own = dataset.orgCapabilities.find((o) => o.id === c.id)!;
      assert.equal(own.capability, c.capability);
      assert.ok(dataset.capabilities.find((t) => t.id === c.capability)!.mitigationMappings.some((m) => m.mitigation === method.id));
    }
  }
  for (const tool of dataset.orgToolPosture) for (const method of dataset.mitigations) {
    for (const c of orgStatusFor(tool.tool, method.id).contributions) assert.deepEqual(c.record, tool.capabilities[c.id]);
  }
  if (dataset.meta.org.example) {
    assert.equal(orgCapabilitySurfacePostureFor("tech-dlp", "surfaceEndpoint").status, "inProgress");
    assert.equal(orgCapabilitySurfacePostureFor("tech-sandbox", "surfaceEndpoint").status, "gap");
    assert.equal(orgCapabilitySurfacePostureFor("tech-pam", "surfaceEndpoint").status, "inProgress", "tool assessment rolls up on its actual surface");
    assert.equal(orgStatusFor("toolClaudeCode", "AML.M0020").status, "notAssessed", "enterprise DLP does not assert this tool's configuration");
  }
});

test("unmapped mitigations stay explicit and cannot acquire org status through unrelated technology", () => {
  assert.equal(mitigationsWithoutCapabilities.length, 25);
  for (const method of mitigationsWithoutCapabilities) for (const surface of dataset.surfaces) {
    assert.equal(orgSurfacePostureFor(method.id, surface.id).status, "unmapped");
    assert.deepEqual(orgSurfacePostureFor(method.id, surface.id).contributions, []);
  }
});

test("legacy renaming leaves current org capability files and tool records intact", async () => {
  for (const filename of ["capabilities.yaml", "tooling-status.yaml"]) {
    const source = await readFile(`data/org/example/${filename}`, "utf8");
    assert.equal(renameMitigationKeys(source), source);
    if (filename === "capabilities.yaml") assert.equal(isOrgCapabilityDocument(source), true);
  }
  const doc = parse(await readFile("data/org/example/capabilities.yaml", "utf8"));
  assert.deepEqual(doc.capabilities, dataset.orgCapabilities);
  assert.equal("orgMitigationPosture" in dataset, false);
});
