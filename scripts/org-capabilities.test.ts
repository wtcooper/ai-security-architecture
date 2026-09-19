import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { compileOrgCapabilities, checkOrgToolCapabilities } from "./lib/org-capabilities";
import { capabilitySupportStatus } from "../src/lib/org-capabilities";
import { dataset, mitigationsForControl, orgControlPostureFor, orgSurfacePostureFor, orgStatusFor, specializationsOf } from "../src/lib/data";
import { renameMitigationKeys, isOrgCapabilityDocument } from "./rename-mitigations";
import type { OrgCapability, OrgToolPosture } from "../src/lib/types";

const example: OrgCapability = { id: "TEST-REDACTION", title: "Test redaction", capability: "cap-sensitive-data-redaction", surfaces: { surfaceEndpoint: { status: "enabled", note: "Assessed deployment" } } };
const compile = (entries: OrgCapability[]) => compileOrgCapabilities({ meta: dataset.meta.org, capabilities: entries }, dataset.mitigations, new Set(dataset.surfaces.map((s) => s.id)));
const byId = (id: string) => dataset.mitigations.find((m) => m.id === id)!;

test("one org capability generates exactly its capability, parent and control associations", () => {
  const result = compile([example]);
  const mapping = result.mappings["org-capabilities"]!;
  const capability = byId(example.capability);
  assert.deepEqual(Object.keys(mapping.mitigations!).sort(), [capability.id, capability.parent!].sort());
  assert.deepEqual(Object.keys(mapping.controls!).sort(), [...capability.controls].sort());
  assert.equal(mapping.risks, undefined);
  assert.equal(mapping.categories, undefined);
  assert.deepEqual(result.entries["org-capabilities"]!.entries[example.id].label, example.title);
});

test("org schema rejects direct control mappings, unknown capabilities, unsupported surfaces, duplicate IDs and bad status", () => {
  assert.throws(() => compile([{ ...example, controls: ["controlUserDataManagement"] } as OrgCapability]), /map only/);
  assert.throws(() => compile([{ ...example, capability: "tech-dlp" }]), /unknown capability/);
  assert.throws(() => compile([{ ...example, capability: "cap-ai-data-protection" }]), /unknown capability/);
  assert.throws(() => compile([example, example]), /duplicate/);
  assert.throws(() => compile([{ ...example, surfaces: { invalid: { status: "enabled" } } }]), /unsupported surface/);
  const outsideSaas = dataset.mitigations.find((m) => !m.surfaces.surfaceSaas.applies)!;
  assert.throws(() => compile([{ ...example, capability: outsideSaas.id, surfaces: { surfaceSaas: { status: "enabled" } } }]), /unsupported surface/);
  assert.throws(() => compile([{ ...example, surfaces: { surfaceEndpoint: { status: "invalid" } } } as unknown as OrgCapability]), /invalid status/);
});

test("per-tool assessments use org capability IDs and must name a capability the architecture pins", () => {
  const valid: OrgToolPosture = { tool: "toolClaudeCode", available: true, capabilities: { [example.id]: { status: "inProgress" } } };
  const check = (record: OrgToolPosture) => checkOrgToolCapabilities([record], [example], dataset.mitigations, dataset.tools, dataset.archetypes);
  assert.deepEqual(check(valid), [valid]);
  assert.throws(() => check({ ...valid, controls: { "D3-EI": { status: "enabled" } } } as OrgToolPosture), /author capabilities only/);
  assert.throws(() => check({ ...valid, capabilities: { "cap-sensitive-data-redaction": { status: "enabled" } } }), /unknown or names a capability/);
  assert.throws(() => check({ ...valid, capabilities: { "AML.M0020": { status: "enabled" } } }), /unknown or names a capability/);
  const unpinned: OrgCapability = { ...example, id: "TEST-TRAINING", capability: "AML.M0007", surfaces: {} };
  assert.throws(() => checkOrgToolCapabilities([{ ...valid, capabilities: { [unpinned.id]: { status: "enabled" } } }], [unpinned], dataset.mitigations, dataset.tools, dataset.archetypes), /does not pin/);
});

test("mixed and missing capability assessments never become an all-enabled rollup", () => {
  assert.equal(capabilitySupportStatus([]), "notAssessed");
  assert.equal(capabilitySupportStatus([undefined]), "notAssessed");
  assert.equal(capabilitySupportStatus([{ status: "enabled" }, { status: "enabled" }]), "enabled");
  assert.equal(capabilitySupportStatus([{ status: "enabled" }, { status: "gap" }]), "inProgress");
  assert.equal(capabilitySupportStatus([{ status: "enabled" }, undefined]), "inProgress");
  assert.equal(capabilitySupportStatus([{ status: "gap" }]), "gap");
});

test("status is authored only on capabilities; parents and controls roll up, tools stay their own", () => {
  for (const capability of dataset.mitigations) for (const surface of dataset.surfaces) {
    const support = orgSurfacePostureFor(capability.id, surface.id);
    const family = new Set([capability.id, ...specializationsOf(capability.id).map((s) => s.id)]);
    for (const c of support.contributions) {
      const own = dataset.orgCapabilities.find((o) => o.id === c.id)!;
      assert.equal(own.capability, c.capability);
      assert.ok(family.has(c.capability), `${capability.id} reaches ${c.capability} only as itself or a specialisation`);
    }
  }
  for (const control of dataset.controls) {
    const support = orgControlPostureFor(control.id);
    const delivering = new Set(mitigationsForControl(control.id).flatMap((m) => [m.id, ...specializationsOf(m.id).map((s) => s.id)]));
    for (const c of support.contributions) assert.ok(delivering.has(c.capability), control.id);
  }
  for (const tool of dataset.orgToolPosture) for (const capability of dataset.mitigations) {
    for (const c of orgStatusFor(tool.tool, capability.id).contributions) assert.deepEqual(c.record, tool.capabilities[c.id]);
  }
  if (dataset.meta.org.example) {
    const redaction = orgStatusFor("toolClaudeCode", "cap-sensitive-data-redaction");
    assert.ok(redaction.contributions.length, "the restored Claude Code DLP record lands on the specialisation");
    assert.ok(redaction.contributions.every((c) => c.context.includes("Claude Code")));
    const guardrails = orgStatusFor("toolClaudeCode", "AML.M0020");
    assert.ok(guardrails.contributions.some((c) => c.capability === "cap-sensitive-data-redaction"), "the parent rolls up its specialisations");
    assert.equal(orgControlPostureFor("controlUserPoliciesAndEducation").status, "unmapped", "no capability delivers policy and education");
  }
});

test("a capability with no supporting org record stays not assessed, never inferred", () => {
  const recorded = new Set(dataset.orgCapabilities.map((c) => c.capability));
  for (const capability of dataset.mitigations) {
    const family = [capability.id, ...specializationsOf(capability.id).map((s) => s.id)];
    if (family.some((id) => recorded.has(id))) continue;
    for (const surface of dataset.surfaces) {
      const support = orgSurfacePostureFor(capability.id, surface.id);
      assert.equal(support.status, "notAssessed", capability.id);
      assert.deepEqual(support.contributions, []);
    }
  }
});

test("legacy renaming leaves current org capability files and tool records intact", async () => {
  for (const file of ["capabilities.yaml", "tooling-status.yaml"]) {
    const source = await readFile(`data/org/example/${file}`, "utf8");
    assert.equal(renameMitigationKeys(source), source, file);
    assert.equal(isOrgCapabilityDocument(source), file === "capabilities.yaml");
  }
  const doc = parse(await readFile("data/org/example/capabilities.yaml", "utf8"));
  const ids = new Set(dataset.mitigations.map((m) => m.id));
  for (const entry of doc.capabilities) assert.ok(ids.has(entry.capability), entry.id);
});
