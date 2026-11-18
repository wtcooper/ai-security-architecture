import React from "react";
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { PatternPage } from "../src/components/patterns/PatternPage";
import { SURFACE_SITUATION } from "../src/components/patterns/labels";
import { CloudsBrowser } from "../src/components/cloud/CloudsBrowser";
import { OnCloud } from "../src/components/cloud/CloudViews";
import { IncidentWalkthrough } from "../src/components/incidents/IncidentWalkthrough";
import { cloudProductsFor, cloudSlug, differenceMarks, differencesFor, hostedAs, hostingOptionsFor, hostingWords, isManagedTarget, notOfferedFor } from "../src/components/cloud/model";
import { SettingCheck } from "../src/components/enable/SettingCheck";
import { ControlTable } from "../src/components/enable/ControlTable";
import { controlGroups } from "../src/components/enable/model";
import { ChooseBuild } from "../src/components/enable/ChooseBuild";
import { ProductSettings } from "../src/components/enable/ProductSettings";
import { componentChoiceIn, dataset, productsForArchetype } from "../src/lib/data";
import { checkCommandProblem, HOSTING_COMPARE, type ProductStatusEntry } from "../src/lib/types";
import { checkOrgControls } from "./lib/enablement";
import { checkProductStatus } from "./lib/products";

const router = { bfcacheId: "test", back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, async prefetch() {} };
const page = (archetypeId: string, query = "") =>
  renderToStaticMarkup(
    <AppRouterContext.Provider value={router}>
      <PathnameContext.Provider value="/patterns/x">
        <SearchParamsContext.Provider value={new URLSearchParams(query)}>
          <PatternPage archetypeId={archetypeId} />
        </SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>,
  );
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const hosted = dataset.archetypes.filter((a) => a.surface === "surfaceCloud");

test("every hosted pattern is mapped onto each cloud and onto the organisation's own data centre", () => {
  assert.deepEqual(dataset.clouds.map((c) => c.id), ["cloudAws", "cloudAzure", "cloudGcp", "cloudOnPrem"]);
  const own = dataset.clouds.filter((c) => c.selfManaged);
  assert.deepEqual(own.map((c) => c.id), ["cloudOnPrem"], "one platform is run by the organisation itself");
  assert.ok(own[0].boundary, "it names the organisation's boundary for the drawing");
  for (const cloud of dataset.clouds) {
    // Mapped, or the platform says why it cannot be the place for it (a provider-run service has no on-premises form).
    for (const a of hosted) assert.ok(cloud.implementations.some((i) => i.architecture === a.id) || cloud.notOffered?.some((n) => n.architecture === a.id && n.why), `${a.id} is mapped onto ${cloud.id}`);
  }
  assert.equal(SURFACE_SITUATION.surfaceCloud, "AI you host yourself", "the category is named for hosting, not for applications");
});

test("every mapping is dated, and every named service carries the page it was checked against", () => {
  for (const cloud of dataset.clouds) {
    for (const impl of cloud.implementations) {
      const at = `${cloud.id} ${impl.architecture}`;
      assert.match(impl.verified ?? "", /^\d{4}-\d{2}-\d{2}$/, `${at}: says when it was checked`);
      // What the organisation runs itself is a named product with a page; what sits outside it
      // (the open web, public registries, a partner's agent) is not the platform's to document.
      const arch = dataset.archetypes.find((a) => a.id === impl.architecture)!;
      const ownerOf = (blockId: string) => (arch.zones ?? []).find((z) => z.id === arch.blocks.find((b) => b.id === blockId)?.zone)?.owner;
      const named = impl.bindings.filter((b) => !b.build && ownerOf(b.block) === "cloud");
      const sourced = impl.bindings.filter((b) => b.url);
      for (const b of named) assert.ok(b.url, `${at}: ${b.block} (${b.service}) links to the page it was checked against`);
      for (const b of sourced) assert.equal(b.verified, impl.verified, `${at}: ${b.block} carries the date`);
      assert.ok((impl.differences ?? []).length + (impl.alsoNeeded ?? []).length > 0, `${at}: says where it differs or what else is needed`);
    }
  }
});

test("a platform states where it does not follow the drawing: marked on the drawing, listed under How it works", () => {
  for (const a of hosted) {
    for (const product of cloudProductsFor(a.id)) {
      const where = `${a.id} on ${product.cloud.short}`;
      const differences = differencesFor(a, product);
      const marks = differenceMarks(a, product);
      const html = page(a.id, `cloud=${cloudSlug(product.id)}`);
      assert.equal([...html.matchAll(/data-differs="/g)].length, marks.size, `${where}: one mark for each place that differs`);
      if (marks.size) assert.match(html, /data-legend-differs/, `${where}: the legend explains the mark`);
      const section = renderToStaticMarkup(<OnCloud archetype={a} product={product} />);
      assert.equal([...section.matchAll(/data-difference="/g)].length, differences.length, `${where}: every difference is listed`);
      assert.equal([...section.matchAll(/data-also-needed="/g)].length, product.implementation.alsoNeeded?.length ?? 0, `${where}: every supporting service is listed`);
      for (const d of differences) assert.ok(section.includes(esc(d.text)), `${where}: "${d.text.slice(0, 40)}" is shown`);
      // The overview tab carries the section when a platform is chosen, and only then.
      assert.match(page(a.id, `tab=overview&cloud=${cloudSlug(product.id)}`), /id="on-cloud"/, `${where}: How it works has the section`);
    }
    assert.doesNotMatch(page(a.id, "tab=overview"), /id="on-cloud"|data-differs="/, `${a.id}: nothing platform-specific until one is chosen`);
  }
});

test("shown on-premises, the organisation's boundary is its data centre and the wording drops the cloud", () => {
  for (const a of hosted) {
    const product = cloudProductsFor(a.id).find((p) => p.cloud.selfManaged);
    if (!product) {
      // A provider-run service has no on-premises form: the page says so and points to the pattern to build there.
      const own = dataset.clouds.find((c) => c.selfManaged)!;
      const absent = notOfferedFor(a.id).find((n) => n.cloud.id === own.id);
      assert.ok(absent?.why && absent.instead, `${a.id}: on-premises says why it is not offered and what to use`);
      assert.doesNotMatch(page(a.id), new RegExp(`data-cloud="${own.id}"`), `${a.id}: the switch does not offer on-premises`);
      continue;
    }
    const html = page(a.id, `cloud=${cloudSlug(product.id)}`);
    assert.match(html, new RegExp(`aria-pressed="true"[^>]*data-cloud="${product.id}"`), `${a.id}: the switch shows on-premises`);
    assert.ok(html.includes(product.cloud.boundary!.toUpperCase()), `${a.id}: the boundary is titled ${product.cloud.boundary}`);
    assert.doesNotMatch(html, />ENTERPRISE CLOUD</, `${a.id}: no boundary reads Enterprise cloud`);
    assert.match(html, /Each box names the software that plays it/, `${a.id}: software, not a provider's service`);
    assert.doesNotMatch(page(a.id), new RegExp(esc(product.cloud.boundary!.toUpperCase())), `${a.id}: the generic drawing keeps its own boundary title`);
  }
});

test("a setting's check only reads: the build refuses a command that changes anything", () => {
  assert.equal(checkCommandProblem("aws cognito-idp describe-user-pool-client --user-pool-id <pool-id> --client-id <client-id> --query 'UserPoolClient.AccessTokenValidity'"), null);
  assert.equal(checkCommandProblem("az apim api show --resource-group <rg> --service-name <apim> --api-id <api>"), null);
  assert.equal(checkCommandProblem("kubectl get networkpolicy --namespace <namespace>"), null);
  for (const bad of [
    "aws s3api put-bucket-policy --bucket <bucket> --policy file://policy.json",
    "aws iam create-role --role-name x",
    "kubectl apply -f policy.yaml",
    "aws s3api get-bucket-policy --bucket <bucket> | jq .",
    "aws s3api get-bucket-policy --bucket <bucket>; aws s3 rm s3://<bucket>",
    "aws s3api get-bucket-policy --bucket <bucket> > out.json",
    "aws sts",
    "",
  ]) {
    assert.ok(checkCommandProblem(bad), `"${bad}" is refused`);
  }
  // Every check in the catalogue passes the same guard and names its reference page.
  const checked = [...dataset.clouds.flatMap((c) => c.settings), ...dataset.tools.flatMap((t) => t.settings ?? [])].filter((s) => s.check);
  for (const s of checked) {
    assert.equal(checkCommandProblem(s.check!.command), null, `${s.id}: ${s.check!.command}`);
    assert.match(s.check!.url, /^https:\/\//, `${s.id}: names the command's reference page`);
    assert.ok(s.check!.expect.trim(), `${s.id}: says what a pass looks like`);
    assert.notDeepEqual(s.setVia, ["code"], `${s.id}: a control in your own code has no vendor command`);
  }
  const html = renderToStaticMarkup(<SettingCheck check={{ command: "aws x get-y --id <id>", expect: "It is on.", url: "https://example.com/ref" }} />);
  assert.match(html, /aws x get-y --id &lt;id&gt;/);
  assert.match(html, /changes nothing/i, "the block says the command only reads");
  assert.match(html, /not run by this project/i, "and that nobody here has run it");
});

test("an organisation can record what it runs in place of the reference, and a link to its own module", () => {
  const aws = dataset.clouds.find((c) => c.id === "cloudAws")!;
  const impl = aws.implementations[0];
  const block = impl.bindings[0].block;
  const setting = impl.settings[0];
  const products: Record<string, ProductStatusEntry> = {
    cloudAws: {
      status: "enabled",
      components: { [block]: { uses: "Our approved gateway", link: "https://git.example.com/gateway" }, [`${impl.architecture}/${block}`]: { uses: "This pattern's own" } },
      settings: { [setting]: { status: "enabled", link: "https://git.example.com/module" } },
    },
  };
  const checked = checkProductStatus({ products }, dataset.tools, dataset.clouds);
  assert.equal(componentChoiceIn(checked, "cloudAws", impl.architecture, block)?.uses, "This pattern's own", "an entry for one pattern wins");
  const other = aws.implementations.find((i) => i.architecture !== impl.architecture && i.bindings.some((b) => b.block === block));
  if (other) assert.equal(componentChoiceIn(checked, "cloudAws", other.architecture, block)?.uses, "Our approved gateway", "an entry for the component applies everywhere else");
  assert.equal(componentChoiceIn(checked, "cloudAzure", impl.architecture, block), undefined);

  const refuse = (entry: ProductStatusEntry, why: RegExp, id = "cloudAws") => assert.throws(() => checkProductStatus({ products: { [id]: entry } }, dataset.tools, dataset.clouds), why);
  refuse({ components: { noSuchBox: { uses: "x" } } }, /no component/);
  refuse({ components: { [`archNothing/${block}`]: { uses: "x" } } }, /not a pattern mapped/);
  refuse({ components: { [block]: { uses: "x".repeat(61) } } }, /60/);
  refuse({ components: { [block]: { uses: "x", link: "http://insecure.example.com" } } }, /https/);
  refuse({ settings: { [setting]: { link: "ftp://x" } } }, /https/);
  refuse({ components: { [block]: { uses: "x" } } }, /is a tool/, dataset.tools[0].id);
});

test("on a hosted pattern, where it runs and what it is built with are two choices, not one list", () => {
  for (const a of hosted) {
    const products = productsForArchetype(a.id);
    const platforms = products.filter((p) => p.kind === "cloud");
    const frameworks = products.filter((p) => p.kind === "tool");
    assert.ok(frameworks.length, `${a.id}: has a catalogued framework or server`);
    // Every catalogued tool and every example says which box it fills.
    for (const p of frameworks) {
      if (p.kind !== "tool") continue;
      assert.ok(p.tool.fills?.length, `${p.tool.id}: says which box it is used to build`);
      for (const id of p.tool.fills!) assert.ok(a.blocks.some((b) => b.id === id), `${p.tool.id}: fills a box of ${a.id}`);
    }
    for (const e of a.exemplars ?? []) assert.ok(e.fills && a.blocks.some((b) => b.id === e.fills), `${a.id}: example ${e.name} names the box it is an example of`);
    // No platform names a framework inside a component's name.
    for (const p of platforms) {
      if (p.kind !== "cloud") continue;
      for (const b of p.implementation.bindings) assert.doesNotMatch(b.service, /\((Strands|ADK|Microsoft Agent Framework|LangGraph)\)/, `${a.id} on ${p.cloud.short}: ${b.block} names the framework in builtWith`);
    }

    const [platform] = platforms;
    const [framework] = frameworks;
    const render = (selected: string | null, where: typeof platform | null) =>
      renderToStaticMarkup(<ProductSettings archetype={a} products={products} selected={selected} platform={where} onPick={() => {}} lit={null} onLight={() => {}} />);
    // The choices are their own step: where it runs, how it is hosted there, what it is built with.
    const choose = renderToStaticMarkup(
      <ChooseBuild archetype={a} products={products} platform={null} framework={null} host={null} onPickPlatform={() => {}} onPickHost={() => {}} onPickFramework={() => {}} />,
    );
    for (const label of ["Where it runs", "How it is hosted there", "What you build it with"]) assert.ok(choose.includes(`data-choice="${label}"`), `${a.id}: asks "${label}"`);
    assert.match(choose, /data-hosting-wait/, `${a.id}: hosting waits for a platform`);
    assert.doesNotMatch(choose, /data-settings=/, `${a.id}: no settings in the step of choices`);
    // Nothing chosen: the settings step says so and shows no table.
    const none = render(null, null);
    assert.match(none, /data-choose-first/);
    assert.doesNotMatch(none, /data-settings=|role="tab"/);
    // Both chosen: one table holding both products' settings, each row saying whose it is.
    const both = render(framework.id, platform);
    assert.match(both, new RegExp(`data-settings="${platform.id} ${framework.id}"`), `${a.id}: one table for both`);
    const rows = [...both.matchAll(/data-setting-name/g)].length;
    assert.equal(rows, platform.settings.length + framework.settings.length, `${a.id}: every setting of both is a row`);
    assert.equal([...both.matchAll(/data-setting-source=/g)].length, rows, `${a.id}: every row says whose it is`);
    assert.match(both, /data-setting-source="cloud"/);
    assert.match(both, /data-setting-source="tool"/);
    // The platform alone: its settings; a row that belongs to a framework says so.
    const alone = render(platform.id, platform);
    assert.match(alone, new RegExp(`data-settings="${platform.id}"`));
    const tagged = platform.settings.filter((st) => st.builtWith).length;
    assert.equal([...alone.matchAll(/data-setting-source="framework"/g)].length, tagged, `${a.id}: ${tagged} framework rows are marked`);

    // The control rows name both products' settings.
    const table = renderToStaticMarkup(<ControlTable groups={controlGroups(a)} archetype={a} open={null} onOpen={() => {}} products={[platform, framework]} />);
    const expected = a.mitigations.reduce((n, id) => n + [platform, framework].filter((p) => p.settings.some((st) => st.mitigations.includes(id))).length, 0);
    assert.equal([...table.matchAll(/data-option-names/g)].length, expected, `${a.id}: each control names the platform's and the framework's settings`);

    // The drawing names the chosen framework in the box it fills, and nowhere else.
    const html = page(a.id, `tool=${framework.id}`);
    assert.match(html, /data-box-tag="built-with"/, `${a.id}: the box is tagged`);
    assert.doesNotMatch(page(a.id), /data-box-tag="built-with"/, `${a.id}: no tag until a framework is chosen`);
  }
  // A pattern that is bought, not hosted, keeps its one row of products.
  const bought = dataset.archetypes.find((a) => a.surface !== "surfaceCloud" && productsForArchetype(a.id).length > 1)!;
  const one = renderToStaticMarkup(<ProductSettings archetype={bought} products={productsForArchetype(bought.id)} selected={null} onPick={() => {}} lit={null} onLight={() => {}} />);
  assert.doesNotMatch(one, /data-hosted-settings/);
  assert.match(one, /role="tab"/);
});

test("agent federation checks both peers alike; only whose identity travels differs", () => {
  const a = dataset.archetypes.find((x) => x.id === "archAgentFederation")!;
  const risksAt = (at: string) => a.pins.risks.filter((p) => p.at === at).map((p) => p.risk).sort();
  const shared = ["riskAgentDelegationChainOpacity", "riskEconomicDenialOfWallet", "riskPromptInjection", "riskSensitiveDataDisclosure", "riskToolRegistryTampering"];
  for (const at of ["gateway->peerVendor", "gateway->partner"]) for (const r of shared) assert.ok(risksAt(at).includes(r), `${at} carries ${r}`);
  const controlAt = (id: string) => a.pins.mitigations.filter((p) => p.mitigation === id).map((p) => p.at);
  assert.deepEqual(controlAt("AML.M0036").sort(), ["gateway->partner", "gateway->peerVendor"], "the cost limit is on both peers");
  assert.deepEqual(controlAt("cap-ai-vendor-assessment").sort(), ["partner", "peerVendor"], "both peers are assessed");
  assert.ok(controlAt("D3-APA").includes("user->entry"), "the user's grant is pinned at the front end");
  assert.match(a.pins.mitigations.find((p) => p.mitigation === "D3-CTS")!.note ?? "", /replay|sent again/i, "replay protection is stated in the token-exchange control");
  const tools = a.blocks.find((b) => b.id === "internalTools")!;
  assert.ok(!(tools.items ?? []).some((i) => /A2A/.test(i.label)), "Tool services does not list the peers again");
  assert.match(a.edges.find((e) => e.from === "harness" && e.to === "gateway")!.label ?? "", /A2A/, "the gateway flow names A2A");
  assert.match(a.exemplars!.find((e) => /Rovo/.test(e.name))!.note, /signs in the user/, "the Rovo example says how it differs");
  // No control was added, so no chip was renumbered.
  assert.equal(a.mitigations.length, 13);
});

test("a platform's hosting options are compared on the same rows; a variant keeps the pattern and still delivers every control", () => {
  const AGENT_PATTERNS = ["archActionAgent", "archChatAgent", "archAgentWorkflow", "archAgentFederation"];
  for (const a of hosted) {
    for (const product of cloudProductsFor(a.id)) {
      const options = hostingOptionsFor(product);
      const where = `${a.id} on ${product.cloud.short}`;
      // Every hosted pattern says how it can be hosted on every platform. The one that is itself
      // the managed way of hosting the others has no further choice, and says so.
      if (isManagedTarget(a.id)) {
        assert.equal(options.length, 0, `${where}: the managed pattern has no hosting options of its own`);
        const note = renderToStaticMarkup(
          <ChooseBuild archetype={a} products={productsForArchetype(a.id)} platform={product} framework={null} host={null} onPickPlatform={() => {}} onPickHost={() => {}} onPickFramework={() => {}} />,
        );
        assert.match(note, /data-hosting-managed/, `${where}: says it is the managed way of hosting`);
        assert.match(note, /data-self-run="/, `${where}: links to the patterns where you run the agent yourself`);
        continue;
      }
      assert.ok(options.length, `${where}: lists its hosting options`);
      assert.equal(options.filter((o) => o.mapped).length, 1, `${where}: one option is the mapping itself`);
      for (const o of options) {
        for (const [key] of HOSTING_COMPARE) assert.ok(o.compare[key]?.trim(), `${where} ${o.id}: answers "${key}"`);
        assert.ok(o.sources?.length, `${where} ${o.id}: names the pages its comparison rests on`);
        if (o.kind === "managed") {
          // The vendor runs it. A managed agent is another pattern, linked and not redrawn; for the
          // other hosted patterns no pattern draws it, and the option says what the service offers.
          const other = dataset.archetypes.find((x) => x.id === o.pattern);
          if (AGENT_PATTERNS.includes(a.id)) assert.ok(other && other.id !== a.id, `${where} ${o.id}: points at the pattern that draws it`);
          else assert.ok(!o.pattern && o.offers?.length, `${where} ${o.id}: says what the service offers`);
          if (o.tool) assert.equal(dataset.tools.find((t) => t.id === o.tool)?.architecture, o.pattern, `${where} ${o.id}: its product is catalogued on that pattern`);
          assert.equal(hostedAs(product, o.id), product, `${where} ${o.id}: choosing it changes nothing on this pattern`);
          continue;
        }
        const as = hostedAs(product, o.id);
        const delivered = new Set(as.settings.flatMap((st) => st.mitigations));
        for (const id of a.mitigations) assert.ok(delivered.has(id), `${where} ${o.id}: ${id} is still delivered`);
        assert.equal(as.implementation.bindings.length, product.implementation.bindings.length, `${where} ${o.id}: every component is still named`);
        if (o.mapped) continue;
        // The variant shows on the page: its own component names and its own settings.
        for (const b of o.bindings ?? []) assert.equal(as.implementation.bindings.find((x) => x.block === b.block)?.service, b.service, `${where} ${o.id}: ${b.block} is renamed`);
        const html = page(a.id, `cloud=${cloudSlug(product.id)}&host=${o.id}&tool=${product.id}`);
        assert.equal([...html.matchAll(/data-setting-name/g)].length, as.settings.length, `${where} ${o.id}: the settings step lists the variant's settings`);
        assert.ok(html.includes(`hosted on ${esc(o.name)}`), `${where} ${o.id}: the page says how it is hosted`);
      }
      // The choosing step: a card per option and every comparison row, none ranked.
      const choose = renderToStaticMarkup(
        <ChooseBuild archetype={a} products={productsForArchetype(a.id)} platform={product} framework={null} host={null} onPickPlatform={() => {}} onPickHost={() => {}} onPickFramework={() => {}} />,
      );
      assert.equal([...choose.matchAll(/data-hosting-option="/g)].length, options.length, `${where}: a card per option`);
      assert.equal([...choose.matchAll(/data-compare-row="/g)].length, HOSTING_COMPARE.length, `${where}: every comparison row`);
      for (const o of options.filter((x) => x.kind === "managed" && x.pattern)) assert.match(choose, new RegExp(`data-hosting-pattern="${o.pattern}"`), `${where}: ${o.id} links to its pattern`);
      // The rows are worded for what the pattern hosts, so an agent is named only on an agent pattern.
      assert.match(choose, new RegExp(`who runs ${hostingWords(a.id).thing}`), `${where}: says what is hosted`);
      if (!AGENT_PATTERNS.includes(a.id)) assert.doesNotMatch(choose, /Who runs the agent loop|managed agent service/, `${where}: no agent wording`);
      // The page compares and does not rank: it says so, and marks no option as the one to pick. (A cell may quote the vendor's own guidance.)
      assert.match(choose, /Nothing here ranks the options/, `${where}: says it does not rank`);
      assert.doesNotMatch(choose, /data-recommended|data-rank/, `${where}: no option is marked as the one to pick`);
    }
  }
});

test("an organisation can record which ways of hosting it has approved", () => {
  const cloud = dataset.clouds.find((c) => c.implementations.some((i) => i.hosting?.length));
  if (!cloud) return;
  const option = cloud.implementations.find((i) => i.hosting?.length)!.hosting![0];
  const ok = checkProductStatus({ products: { [cloud.id]: { hosting: { [option.id]: { status: "enabled", note: "Platform team standard" } } } } }, dataset.tools, dataset.clouds);
  assert.equal(ok[cloud.id].hosting?.[option.id].status, "enabled");
  assert.throws(() => checkProductStatus({ products: { [cloud.id]: { hosting: { noSuchOption: { status: "enabled" } } } } }, dataset.tools, dataset.clouds), /no hosting option/);
  assert.throws(() => checkProductStatus({ products: { [dataset.tools[0].id]: { hosting: { [option.id]: { status: "enabled" } } } } }, dataset.tools, dataset.clouds), /is a tool/);
});

test("an organisation's controls map many to many onto the catalogue's, and the status rolls up", () => {
  const cat = dataset.mitigations;
  const [a, b] = cat.filter((m) => !m.parent).slice(0, 2).map((m) => m.id);
  const ok = checkOrgControls(
    {
      controls: [
        { id: "SEC-1", name: "First of ours", status: "enabled", maps: [a, b] },
        { id: "SEC-2", name: "Second of ours", status: "inProgress", maps: [a] },
        { id: 7 as unknown as string, name: "Inventoried, not assessed", maps: [b] },
      ],
    },
    cat,
  );
  assert.equal(ok.orgControls.length, 3);
  assert.equal(ok.orgControls[2].id, "7", "a numeric identifier is kept as text");
  assert.equal(ok.status[a].status, "inProgress", "two of ours on one of theirs: enabled only when both are");
  assert.equal(ok.status[b].status, "inProgress", "an unassessed control holds the rollup back");
  assert.equal(checkOrgControls({ controls: [{ id: "S", name: "Only one", status: "enabled", maps: [a] }] }, cat).status[a].status, "enabled");
  assert.deepEqual(checkOrgControls({ controls: [] }, cat), { orgControls: [], status: {} });
  const refuse = (row: Record<string, unknown>, why: RegExp) => assert.throws(() => checkOrgControls({ controls: [row as never] }, cat), why);
  refuse({ name: "No id", maps: [a] }, /needs an id/);
  refuse({ id: "X", maps: [a] }, /needs a name/);
  refuse({ id: "X", name: "No mapping" }, /needs maps/);
  refuse({ id: "X", name: "Unknown", maps: ["NOT-A-CONTROL"] }, /not a control in the catalogue/);
  refuse({ id: "X", name: "Bad status", status: "done", maps: [a] }, /status must be one of/);
  refuse({ id: "X", name: "Bad link", maps: [a], link: "http://insecure" }, /https/);
  refuse({ id: "X", name: "Extra", maps: [a], owner: "me" }, /unknown field owner/);
  assert.throws(() => checkOrgControls({ controls: [{ id: "X", name: "A", maps: [a] }, { id: "X", name: "B", maps: [b] }] }, cat), /used twice/);
});

test("pages show names, never identifiers: no control id reaches the text of a page", () => {
  // What a reader sees: the text between tags, and the hover text. Addresses and data attributes are not text.
  const visible = (html: string) =>
    [...html.replace(/<(script|style)[\s\S]*?<\/\1>/g, "").matchAll(/>([^<]+)<|\s(?:title|aria-label|alt|placeholder)="([^"]*)"/g)].map((m) => m[1] ?? m[2]).join(" \n ");
  const ids = dataset.mitigations.map((m) => m.id);
  const leak = (html: string) => {
    const text = visible(html);
    return ids.filter((id) => new RegExp(`(^|[^A-Za-z0-9.-])${id.replace(/[.]/g, "\\.")}([^A-Za-z0-9-]|$)`).test(text));
  };
  for (const a of dataset.archetypes) {
    for (const q of ["", "tab=overview", "tab=risks", "tab=flows", "tab=incidents"]) {
      assert.deepEqual(leak(page(a.id, q)), [], `${a.id} ${q || "enable"}: shows a control id`);
    }
    const open = renderToStaticMarkup(<ControlTable groups={controlGroups(a)} archetype={a} open={a.mitigations[0]} onOpen={() => {}} />);
    assert.deepEqual(leak(open), [], `${a.id}: an open control row shows an id`);
    assert.doesNotMatch(visible(open), /\b(GV|ID|PR|DE|RS|RC)\.[A-Z]{2}\b/, `${a.id}: a category shows its framework code`);
  }
  const wrap = (node: React.ReactNode, path: string, query = "") =>
    renderToStaticMarkup(
      <AppRouterContext.Provider value={router}>
        <PathnameContext.Provider value={path}>
          <SearchParamsContext.Provider value={new URLSearchParams(query)}>{node}</SearchParamsContext.Provider>
        </PathnameContext.Provider>
      </AppRouterContext.Provider>,
    );
  for (const c of dataset.clouds) assert.deepEqual(leak(wrap(<CloudsBrowser />, "/reference/clouds", `cloud=${cloudSlug(c.id)}`)), [], `${c.id}: the platform page shows a control id`);
  for (const i of dataset.incidents) assert.deepEqual(leak(wrap(<IncidentWalkthrough id={i.id} />, `/incidents/${i.id}`, `step=${i.steps.length}`)), [], `${i.id}: the incident page shows a control id`);
});
