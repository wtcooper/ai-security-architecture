import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { PatternPage } from "../src/components/patterns/PatternPage";
import { SURFACE_SITUATION } from "../src/components/patterns/labels";
import { OnCloud } from "../src/components/cloud/CloudViews";
import { cloudProductsFor, cloudSlug, differenceMarks, differencesFor } from "../src/components/cloud/model";
import { SettingCheck } from "../src/components/enable/SettingCheck";
import { componentChoiceIn, dataset } from "../src/lib/data";
import { checkCommandProblem, type ProductStatusEntry } from "../src/lib/types";
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
    for (const a of hosted) assert.ok(cloud.implementations.some((i) => i.architecture === a.id), `${a.id} is mapped onto ${cloud.id}`);
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
    const product = cloudProductsFor(a.id).find((p) => p.cloud.selfManaged)!;
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
