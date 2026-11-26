import { test } from "node:test";
import assert from "node:assert/strict";
import { LegacyRedirect, legacyCatalogueTarget, legacyPathTarget, legacyPatternTarget } from "../src/components/shell/LegacyRedirect";
import LegacyFeedPage from "../src/app/incidents/feed/page";
import { findPatterns } from "../src/components/patterns/model";
import { dataset, toolsForArchetype } from "../src/lib/data";
import { ROUTES, cloudHref, controlHref, feedHref, incidentHref, incidentPatternHref, isCosaiControlId, patternHref, toolHref } from "../src/lib/routes";

const q = (s: string) => new URLSearchParams(s);

test("every pattern has its own address, and every control, tool and cloud link lands on one", () => {
  const slugs = new Set(dataset.archetypes.map((a) => a.slug));
  assert.equal(slugs.size, dataset.archetypes.length, "slugs are unique");
  for (const a of dataset.archetypes) {
    assert.match(a.slug, /^(endpoint|cloud|saas)-[a-z0-9-]+$/, a.id);
    assert.equal(patternHref(a.id), `/patterns/${a.slug}`);
    assert.equal(patternHref(a.id, { tab: "overview" }), `/patterns/${a.slug}`, "How it works is the default and stays out of the address");
    assert.equal(patternHref(a.id, { tab: "enable" }), `/patterns/${a.slug}?tab=enable`);
    assert.equal(patternHref(a.id, { tab: "flows" }), `/patterns/${a.slug}?tab=flows`);
    assert.equal(patternHref(a.id, { control: a.mitigations[0] }), `/patterns/${a.slug}#control-${a.mitigations[0]}`);
  }
  for (const t of dataset.tools) {
    const arch = dataset.archetypes.find((a) => a.id === t.architecture)!;
    assert.equal(toolHref(t.id), `/patterns/${arch.slug}?tool=${t.id}`);
  }
});

test("old pattern addresses forward to the new pattern page, keeping tab, product and control", () => {
  const arch = dataset.archetypes.find((a) => toolsForArchetype(a.id).some((t) => t.architecture === a.id))!;
  const tool = toolsForArchetype(arch.id).find((t) => t.architecture === arch.id)!;
  const base = `/patterns/${arch.slug}`;
  // /reference?archetype=… opened on the overview.
  assert.equal(legacyPatternTarget(q(`archetype=${arch.id}`), "", "overview"), base);
  assert.equal(legacyPatternTarget(q(`archetype=${arch.id}&tab=flows`), "", "overview"), `${base}?tab=flows`);
  assert.equal(legacyPatternTarget(q(`archetype=${arch.id}&tab=enable`), "", "overview"), `${base}?tab=enable`);
  assert.equal(legacyPatternTarget(q(`archetype=${arch.id}&tab=enable&tool=${tool.id}`), ""), `${base}?tool=${tool.id}`);
  // A product names its own pattern, even with a stale or missing archetype beside it.
  assert.equal(legacyPatternTarget(q(`tool=${tool.id}`), ""), `${base}?tool=${tool.id}`);
  assert.equal(legacyPatternTarget(q(`archetype=archNope&tool=${tool.id}`), ""), `${base}?tool=${tool.id}`);
  // A framework offered on another pattern keeps the pattern the address names.
  const shared = dataset.tools.find((t) => t.builder?.also?.length)!;
  const other = shared.builder!.also![0].architecture;
  const otherSlug = dataset.archetypes.find((a) => a.id === other)!.slug;
  assert.equal(legacyPatternTarget(q(`archetype=${other}&tool=${shared.id}`), ""), `/patterns/${otherSlug}?tool=${shared.id}`);
  // An old capability anchor opens that control's row.
  const control = arch.mitigations[0];
  assert.equal(legacyPatternTarget(q(`archetype=${arch.id}&tab=enable`), `#capability-${control}`), `${base}#control-${control}`);
  // /enable?archetype=… opened Enable.
  assert.equal(legacyPatternTarget(q(`archetype=${arch.id}`), "", "enable"), `${base}?tab=enable`);
  // A cloud is a product of the pattern in the address.
  const built = dataset.clouds[0].implementations[0].architecture;
  const builtSlug = dataset.archetypes.find((a) => a.id === built)!.slug;
  assert.equal(legacyPatternTarget(q(`archetype=${built}&tool=${dataset.clouds[0].id}`), ""), `/patterns/${builtSlug}?tool=${dataset.clouds[0].id}`);
  // Nothing to forward: the Reference index and the pattern finder stay put.
  assert.equal(legacyPatternTarget(q(""), ""), null);
  assert.equal(legacyPatternTarget(q("archetype=archNope"), ""), null);
});

test("old catalogue addresses forward to /controls, and CoSAI control ids are told apart from catalogue ids", () => {
  assert.equal(legacyCatalogueTarget(q("capability=D3-MFA")), controlHref("D3-MFA"));
  assert.equal(legacyCatalogueTarget(q("capability=AML.M0020&surface=surfaceCloud")), `${controlHref("AML.M0020")}&surface=surfaceCloud`);
  assert.equal(legacyCatalogueTarget(q("")), ROUTES.controls);
  for (const c of dataset.controls) assert.ok(isCosaiControlId(c.id), c.id);
  for (const m of dataset.mitigations) assert.ok(!isCosaiControlId(m.id), m.id);
});

test("the pattern finder understands product, cloud and everyday words", () => {
  const ids = (query: string) => findPatterns(query).map((a) => a.id);
  assert.equal(findPatterns("").length, dataset.archetypes.length);
  assert.ok(ids("copilot").includes("archCodingAgentThirdParty"));
  assert.ok(ids("copilot").includes("archEnterpriseAiChat"));
  assert.ok(ids("azure").length >= 1 && ids("azure").every((id) => dataset.clouds.some((c) => c.implementations.some((i) => i.architecture === id)) || true));
  assert.ok(ids("azure").includes("archChatAgent"));
  assert.equal(ids("rag")[0], "archChatAgent", "a RAG chatbot is the chat agent pattern");
  assert.ok(ids("chatbot").includes("archChatAgent") && ids("chatbot").includes("archEnterpriseAiChat"));
  assert.ok(ids("m365").includes("archEnterpriseAiChat"));
  assert.ok(ids("claude code").includes("archCodingAgentThirdParty"));
  assert.ok(ids("mcp server")[0] === "archRemoteMcpServer");
  assert.deepEqual(ids("zzzz"), []);
  for (const a of dataset.archetypes) {
    assert.ok(a.useWhen.length > 20 && a.useWhen.endsWith("."), `${a.id} has a use-when line`);
    assert.equal(ids(a.title)[0], a.id, `${a.id} is found by its own title`);
  }
});

test("a pattern can be linked as built on a cloud, on any tab, and a cloud has its own page", () => {
  assert.equal(patternHref("archChatAgent", { cloud: "cloudAws" }), "/patterns/cloud-chat-agent?cloud=aws");
  assert.equal(patternHref("archChatAgent", { tab: "flows", cloud: "cloudGcp" }), "/patterns/cloud-chat-agent?tab=flows&cloud=gcp");
  assert.equal(patternHref("archChatAgent", { cloud: "cloudAzure", control: "D3-OTF" }), "/patterns/cloud-chat-agent?cloud=azure#control-D3-OTF");
  assert.equal(cloudHref("cloudAzure"), `${ROUTES.clouds}?cloud=azure`);
});

test("the feed moved to /feed/: the old address forwards there, keeping the filters and the item", () => {
  assert.equal(ROUTES.feed, "/feed");
  assert.equal(feedHref({ kind: "incident" }, "some-item"), "/feed?kind=incident#some-item");
  // The old page is a path redirect to the feed, like the site's other retired addresses.
  const page = LegacyFeedPage() as React.ReactElement<{ children: React.ReactElement<{ kind: string; to: string }> }>;
  const redirect = page.props.children;
  assert.equal(redirect.type, LegacyRedirect);
  assert.deepEqual({ kind: redirect.props.kind, to: redirect.props.to }, { kind: "path", to: "/feed" });
  assert.equal(
    legacyPathTarget(redirect.props.to, q("category=identity&pattern=archChatAgent&evidence=exploited"), "#mittwald-mcp-server"),
    "/feed?category=identity&pattern=archChatAgent&evidence=exploited#mittwald-mcp-server",
  );
  assert.equal(legacyPathTarget(redirect.props.to, q(""), ""), "/feed");
  assert.equal(legacyPathTarget(redirect.props.to, q("incident=mittwald-mcp-server"), ""), "/feed?incident=mittwald-mcp-server");
});

test("incident patterns and deep dives share /incidents/<id>/, each at its own address", () => {
  const addresses = [...dataset.incidentPatterns.map((p) => p.slug), ...dataset.incidents.map((i) => i.id)];
  assert.equal(new Set(addresses).size, addresses.length, "no slug is a deep dive's id");
  assert.ok(!addresses.includes("feed"), "/incidents/feed/ stays the old feed's forward");
  for (const p of dataset.incidentPatterns) assert.equal(incidentPatternHref(p.id), `/incidents/${p.slug}`);
  for (const i of dataset.incidents) assert.equal(incidentHref(i.id), `/incidents/${i.id}`);
  assert.equal(incidentPatternHref("noSuchPattern"), ROUTES.incidents);
});
