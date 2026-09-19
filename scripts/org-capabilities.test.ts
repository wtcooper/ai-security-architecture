import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { compileOrgCapabilities, checkOrgToolCapabilities } from "./lib/org-capabilities";
import { capabilitySupportStatus } from "../src/lib/org-capabilities";
import { dataset, capabilitiesForControl, orgCapabilitySurfacePostureFor, orgControlPostureFor, orgSurfacePostureFor, orgStatusFor, orgToolCapabilityPostureFor } from "../src/lib/data";
import { renameMitigationKeys, isOrgCapabilityDocument } from "./rename-mitigations";
import type { OrgCapability, OrgToolPosture } from "../src/lib/types";

const example: OrgCapability = { id: "TEST-DLP", title: "Test DLP", capability: "cap-ai-data-protection", surfaces: { surfaceEndpoint: { status: "enabled", note: "Assessed deployment" } } };
const compile = (entries: OrgCapability[]) => compileOrgCapabilities({ meta: dataset.meta.org, capabilities: entries }, dataset.capabilities, dataset.mitigations, new Set(dataset.surfaces.map((s) => s.id)));

test("one org capability generates exactly its capability, control and supporting-method associations", () => {
  const result = compile([example]);
  const mapping = result.mappings["org-capabilities"]!;
  assert.deepEqual(mapping.capabilities, { "cap-ai-data-protection": [example.id] });
  const capability = dataset.capabilities.find((c) => c.id === "cap-ai-data-protection")!;
  assert.deepEqual(Object.keys(mapping.controls!).sort(), [...capability.controls].sort());
  const methods = dataset.mitigations.filter((m) => m.controls.some((id) => capability.controls.includes(id))).map((m) => m.id);
  assert.deepEqual(Object.keys(mapping.mitigations!).sort(), methods.sort());
  assert.equal(mapping.risks, undefined);
  assert.equal(mapping.categories, undefined);
  assert.deepEqual(result.entries["org-capabilities"]!.entries[example.id].label, example.title);
});

test("org schema rejects direct method/control mappings, unknown capabilities, duplicate IDs and bad status", () => {
  assert.throws(() => compile([{ ...example, controls: ["controlUserDataManagement"] } as OrgCapability]), /map only/);
  assert.throws(() => compile([{ ...example, mitigations: ["AML.M0020"] } as OrgCapability]), /map only/);
  assert.throws(() => compile([{ ...example, capability: "tech-dlp" }]), /unknown capability/);
  assert.throws(() => compile([{ ...example, capability: "D3-EI" }]), /unknown capability/);
  assert.throws(() => compile([example, example]), /duplicate/);
  assert.throws(() => compile([{ ...example, surfaces: { invalid: { status: "enabled" } } }]), /unsupported surface/);
  const isolation = dataset.capabilities.find((c) => c.id === "cap-workload-isolation")!;
  assert.equal(isolation.surfaces.surfaceSaas.applies, false);
  assert.throws(() => compile([{ ...example, capability: isolation.id, surfaces: { surfaceSaas: { status: "enabled" } } }]), /unsupported surface/);
  assert.throws(() => compile([{ ...example, surfaces: { surfaceEndpoint: { status: "invalid" } } } as unknown as OrgCapability]), /invalid status/);
});

test("per-tool assessments use org capability IDs and must deliver a control the architecture pins", () => {
  const valid: OrgToolPosture = { tool: "toolClaudeCode", available: true, capabilities: { [example.id]: { status: "inProgress" } } };
  const check = (record: OrgToolPosture) => checkOrgToolCapabilities([record], [example], dataset.capabilities, dataset.mitigations, dataset.tools, dataset.archetypes);
  assert.deepEqual(check(valid), [valid]);
  assert.throws(() => check({ ...valid, controls: { "D3-EI": { status: "enabled" } } } as OrgToolPosture), /author capabilities only/);
  assert.throws(() => check({ ...valid, capabilities: { "cap-ai-data-protection": { status: "enabled" } } }), /unknown or delivers no control/);
  assert.throws(() => check({ ...valid, capabilities: { "AML.M0020": { status: "enabled" } } }), /unknown or delivers no control/);
});

test("mixed and missing capability assessments never become an all-enabled rollup", () => {
  assert.equal(capabilitySupportStatus([]), "notAssessed");
  assert.equal(capabilitySupportStatus([undefined]), "notAssessed");
  assert.equal(capabilitySupportStatus([{ status: "enabled" }, { status: "enabled" }]), "enabled");
  assert.equal(capabilitySupportStatus([{ status: "enabled" }, { status: "gap" }]), "inProgress");
  assert.equal(capabilitySupportStatus([{ status: "enabled" }, undefined]), "inProgress");
  assert.equal(capabilitySupportStatus([{ status: "gap" }]), "gap");
});

test("status is authored only on capabilities; controls and methods roll up through the delivering capabilities", () => {
  for (const method of dataset.mitigations) for (const surface of dataset.surfaces) {
    const support = orgSurfacePostureFor(method.id, surface.id);
    for (const c of support.contributions) {
      const own = dataset.orgCapabilities.find((o) => o.id === c.id)!;
      assert.equal(own.capability, c.capability);
      const capability = dataset.capabilities.find((t) => t.id === c.capability)!;
      assert.ok(capability.controls.some((id) => method.controls.includes(id)), `${method.id} reaches ${c.capability} only through a shared control`);
    }
  }
  for (const control of dataset.controls) {
    const support = orgControlPostureFor(control.id);
    const delivering = new Set(capabilitiesForControl(control.id).map((c) => c.id));
    for (const c of support.contributions) assert.ok(delivering.has(c.capability), control.id);
  }
  for (const tool of dataset.orgToolPosture) for (const capability of dataset.capabilities) {
    for (const c of orgToolCapabilityPostureFor(tool.tool, capability.id).contributions) assert.deepEqual(c.record, tool.capabilities[c.id]);
  }
  if (dataset.meta.org.example) {
    assert.equal(orgCapabilitySurfacePostureFor("cap-workload-isolation", "surfaceEndpoint").status, "inProgress", "sandbox gap and egress progress mix");
    assert.equal(orgControlPostureFor("controlUserPoliciesAndEducation").status, "notAssessed", "no org capability maps to policy and education yet");
    const guardrails = orgStatusFor("toolClaudeCode", "AML.M0020");
    assert.equal(guardrails.status, "inProgress", "the tool's own records roll up; enterprise DLP does not assert this tool's configuration");
    assert.ok(guardrails.contributions.every((c) => c.context.includes("Claude Code")));
  }
});

test("a mitigation with no supporting capability path stays explicit", () => {
  for (const method of dataset.mitigations) {
    const reachable = dataset.capabilities.some((c) => c.controls.some((id) => method.controls.includes(id)));
    for (const surface of dataset.surfaces) {
      const support = orgSurfacePostureFor(method.id, surface.id);
      if (!reachable) { assert.equal(support.status, "unmapped"); assert.deepEqual(support.contributions, []); }
      else assert.notEqual(support.status, "unmapped");
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
  for (const entry of doc.capabilities) assert.match(entry.capability, /^cap-/);
});
