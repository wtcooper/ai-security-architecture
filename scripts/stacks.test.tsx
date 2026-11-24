import React from "react";
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext, SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { PatternPage } from "../src/components/patterns/PatternPage";
import { ChooseBuild } from "../src/components/enable/ChooseBuild";
import { ProductSettings } from "../src/components/enable/ProductSettings";
import { ComponentList } from "../src/components/reference/ArchetypeDetail";
import { BoxDiagram } from "../src/components/drawing/BoxDiagram";
import { boundaryLayout } from "../src/components/drawing/layout";
import {
  cloudProductsFor,
  cloudSlug,
  isControlBox,
  MIX,
  NO_STACK,
  packsFor,
  productsInEffect,
  settingApplies,
  stackedAs,
  stackFrom,
  type CloudProduct,
  type Stack,
} from "../src/components/cloud/model";
import { dataset, productsForArchetype } from "../src/lib/data";
import { namesProduct, type TechPack } from "../src/lib/types";
import { checkPacks } from "./lib/products";

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
const onprem = dataset.clouds.find((c) => c.selfManaged)!;
const onpremOf = (archetypeId: string) => cloudProductsFor(archetypeId).find((p) => p.cloud.selfManaged) as CloudProduct;
const UP = "upstreamOpenSource";
const RH = "redHatOpenShiftAi";
const KONG = "kongAiGateway";
const chat = dataset.archetypes.find((a) => a.id === "archChatAgent")!;
const inference = dataset.archetypes.find((a) => a.id === "archSelfHostedInference")!;
/** The text a box draws: its title and the lines under it. */
const boxText = (html: string, block: string) => {
  const m = html.match(new RegExp(`<g data-block="${block}"[^>]*>(.*?)</g>`));
  return (m?.[1] ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
};

test("on-premises, every box names its role and offers its options; the packs are the platform's own", () => {
  assert.ok(onprem.packs?.length, "the organisation's own data centre has packs");
  assert.ok(onprem.packs!.some((p) => p.scope === "platform" && p.kind === "open"), "one is an open-source stack");
  assert.ok(onprem.packs!.some((p) => p.scope === "platform" && p.kind === "commercial"), "and one a commercial platform");
  assert.ok(onprem.packs!.some((p) => p.scope === "addon"), "with add-ons");
  for (const impl of onprem.implementations) {
    const a = dataset.archetypes.find((x) => x.id === impl.architecture)!;
    for (const b of impl.bindings) {
      assert.equal(b.builtWith, undefined, `${a.id} ${b.block}: what it is built with is an option, not builtWith`);
      if (!b.options) continue;
      // The role, never the product we picked: no option's name stands in for it.
      for (const o of b.options) assert.notEqual(b.service, o.name, `${a.id} ${b.block}: names its role`);
      // A component box has one product per pack; a control-plane box can have several.
      if (!isControlBox(a, b.block)) for (const p of onprem.packs!) assert.ok(b.options.filter((o) => o.packs?.includes(p.id)).length <= 1, `${a.id} ${b.block}: one ${p.id} product`);
    }
    // Every product a row belongs to is an option on the platform.
    for (const id of impl.settings) {
      const s = onprem.settings.find((x) => x.id === id)!;
      if (s.product) assert.ok(onprem.implementations.some((i) => i.bindings.some((b) => b.options?.some((o) => namesProduct(o.name, s.product!)))), `${s.id}: ${s.product} is an option`);
    }
  }
  const tagged = onprem.settings.filter((s) => s.product).length;
  assert.ok(tagged >= 120 && tagged < onprem.settings.length, `${tagged} of ${onprem.settings.length} rows belong to one product; the rest apply whatever is chosen`);
  assert.ok(!onprem.settings.some((s) => s.builtWith), "on-premises a row names its product, not what this mapping built it with");
});

test("the model provider on the on-premises agent patterns is a choice, drawn where the pattern draws it", () => {
  for (const id of ["archChatAgent", "archActionAgent", "archAgentWorkflow", "archAgentFederation"]) {
    const a = dataset.archetypes.find((x) => x.id === id)!;
    const b = onpremOf(id).implementation.bindings.find((x) => x.block === "provider")!;
    assert.ok(b.options!.some((o) => o.kind === "open" && /vLLM/.test(o.name)), `${id}: open-weight models you serve`);
    assert.ok(b.options!.some((o) => /hosted model API/i.test(o.name)), `${id}: or a hosted model API`);
    assert.match(b.service, /or a hosted model API/, `${id}: the role says so`);
    // Drawn outside, as the pattern draws it: nothing moves it into the data centre.
    assert.equal(a.blocks.find((x) => x.id === "provider")!.zone, "zoneExternal");
  }
});

test("Enable offers Your stack on an on-premises hosted pattern: pack cards, Mix your own, add-ons, a closed comparison and the options per box", () => {
  for (const a of hosted) {
    const p = onpremOf(a.id);
    if (!p) continue;
    const { platform, addons } = packsFor(p);
    assert.ok(platform.length >= 2, `${a.id}: at least two platform packs`);
    const html = renderToStaticMarkup(
      <ChooseBuild archetype={a} products={productsForArchetype(a.id)} platform={p} framework={null} host={null} stack={NO_STACK} onStack={() => {}} onPickPlatform={() => {}} onPickHost={() => {}} onPickFramework={() => {}} />,
    );
    // After "How it is hosted there", before "What you build it with".
    const order = ["How it is hosted there", "Your stack", "What you build it with"].map((l) => html.indexOf(`data-choice="${l}"`)).filter((i) => i >= 0);
    assert.ok(html.includes('data-choice="Your stack"'), `${a.id}: the choice is offered`);
    assert.deepEqual(order, [...order].sort((x, y) => x - y), `${a.id}: in the order the choices are made`);
    for (const pack of platform) {
      assert.match(html, new RegExp(`data-pack="${pack.id}" data-pack-scope="platform"`), `${a.id}: a card for ${pack.id}`);
      assert.ok(html.includes(esc(pack.fits)), `${a.id}: ${pack.id} says when it fits`);
      assert.ok(html.includes(esc(pack.compare.covers)) && html.includes(esc(pack.compare.bringYourOwn)), `${a.id}: what ${pack.id} covers and what you bring`);
    }
    for (const pack of addons) assert.match(html, new RegExp(`data-pack="${pack.id}" data-pack-scope="addon"`), `${a.id}: an add-on card for ${pack.id}`);
    assert.match(html, new RegExp(`data-pack="${MIX}"`), `${a.id}: Mix your own`);
    // The comparison is there and closed.
    assert.match(html, /<details class="[^"]*" data-pack-comparison/, `${a.id}: a side-by-side comparison, closed`);
    for (const row of ["licence", "support", "covers", "bringYourOwn", "integration", "effort", "status"]) assert.match(html, new RegExp(`data-pack-row="${row}"`), `${a.id}: compares ${row}`);
    // Nothing chosen: a table of options per box, none marked.
    const boxes = p.implementation.bindings.filter((b) => b.options?.length);
    assert.equal([...html.matchAll(/data-role-row=/g)].length, boxes.length, `${a.id}: a row for every box with options`);
    assert.doesNotMatch(html, /data-in-effect/, `${a.id}: nothing in effect until a pack is chosen`);
    assert.doesNotMatch(html, /recommended|best choice|our pick/i, `${a.id}: no ranking`);
  }
  // A provider's cloud offers the choice too: its own services are one pack among others.
  const aws = cloudProductsFor(chat.id).find((p) => p.id === "cloudAws")!;
  const html = renderToStaticMarkup(
    <ChooseBuild archetype={chat} products={productsForArchetype(chat.id)} platform={aws} framework={null} host={null} stack={NO_STACK} onStack={() => {}} onPickPlatform={() => {}} onPickHost={() => {}} onPickFramework={() => {}} />,
  );
  assert.match(html, /data-choice="Your stack"/);
  assert.match(html, /every box names the AWS service drawn/, "on a provider's cloud the box keeps the service drawn");
  assert.doesNotMatch(html, /names its role/, "a provider's cloud names its own services, not roles");
});

/** On a provider's cloud: the pack whose option on every box with options is the service drawn. */
const nativePack = (c: (typeof dataset.clouds)[number]) =>
  (c.packs ?? []).find((p) => p.scope === "platform" && c.implementations.every((i) => i.bindings.every((b) => !b.options || b.options.some((o) => o.name === b.service && o.packs?.includes(p.id)))));

test("on a provider's cloud each box keeps the service drawn; the cloud's own pack is the mapping as drawn, and every row stays with it", () => {
  for (const c of dataset.clouds.filter((x) => !x.selfManaged)) {
    assert.ok(c.packs?.some((p) => p.scope === "platform" && p.kind === "open"), `${c.short}: an open-source stack on its Kubernetes`);
    assert.ok(c.packs?.some((p) => p.scope === "addon"), `${c.short}: with add-ons`);
    const own = nativePack(c);
    assert.ok(own, `${c.short}: one platform pack is the provider's own services, the service drawn on every box`);
    assert.equal(own!.kind, "commercial");
    for (const impl of c.implementations) {
      const a = dataset.archetypes.find((x) => x.id === impl.architecture)!;
      const p = cloudProductsFor(a.id).find((x) => x.id === c.id)!;
      for (const b of impl.bindings) {
        if (!b.options) continue;
        for (const pk of c.packs!) assert.ok(b.options.filter((o) => o.packs?.includes(pk.id)).length <= 1, `${c.short} ${a.id} ${b.block}: one ${pk.id} product`);
        // With the cloud's own pack chosen the box reads as drawn.
        assert.equal(productsInEffect(b, { pack: own!.id, addons: [] })[0]?.name, b.service, `${c.short} ${a.id} ${b.block}: the service drawn`);
      }
      assert.equal(stackedAs(a, p, { pack: own!.id, addons: [] }).hidden.length, 0, `${c.short} ${a.id}: the provider's own pack keeps every row`);
    }
    // Every product a row belongs to is an option on the platform.
    for (const s of c.settings.filter((x) => x.product)) assert.ok(c.implementations.some((i) => i.bindings.some((b) => b.options?.some((o) => namesProduct(o.name, s.product!)))), `${c.short} ${s.id}: ${s.product} is an option`);
    assert.ok(c.settings.some((s) => s.product) && c.settings.some((s) => !s.product), `${c.short}: rows of one replaceable service are tagged; platform-wide rows are not`);
  }
});

test("on Google Cloud another gateway hides Apigee's rows, and the drawing names it", () => {
  const p = cloudProductsFor(chat.id).find((x) => x.id === "cloudGcp")!;
  const own = nativePack(p.cloud)!;
  const kong = p.cloud.packs!.find((x) => x.scope === "addon" && p.implementation.bindings.find((b) => b.block === "gateway")!.options!.some((o) => o.packs?.includes(x.id) && /Kong/.test(o.name)))!;
  const { hidden } = stackedAs(chat, p, { pack: own.id, addons: [kong.id] });
  assert.ok(hidden.length && hidden.every((s) => s.product === "Apigee"), "only Apigee's rows go");
  assert.ok(p.settings.filter((s) => s.product === "Apigee").every((s) => hidden.includes(s)), "every Apigee row goes");
  const html = page(chat.id, `tab=enable&cloud=${cloudSlug(p.id)}&stack=${own.id}&addons=${kong.id}`);
  assert.ok(boxText(html, "gateway").includes("Kong"), "the gateway box names Kong");
  assert.ok(boxText(html, "provider").includes("Gemini"), "the model provider stays the cloud's own");
  assert.match(html, /data-cloud-caption[^>]*>[^<]*Each box names the product/, "the caption says the stack's products are drawn");
  assert.doesNotMatch(page(chat.id, `cloud=${cloudSlug(p.id)}`), /Each box names its role/, "with nothing chosen the boxes name Google Cloud's services");
});

test("choosing a pack puts its products in the boxes, marks them in the options table, and narrows the settings", () => {
  for (const a of [chat, inference]) {
    const p = onpremOf(a.id);
    const slug = cloudSlug(p.id);
    const none = page(a.id, `cloud=${slug}`);
    const red = page(a.id, `cloud=${slug}&stack=${RH}`);
    const gateway = p.implementation.bindings.find((b) => b.block === "gateway")!;
    const rhGateway = productsInEffect(gateway, { pack: RH, addons: [] })[0];
    const upGateway = productsInEffect(gateway, { pack: UP, addons: [] })[0];
    assert.ok(rhGateway && upGateway && rhGateway !== upGateway, `${a.id}: the packs put different gateways in the box`);
    const start = (name: string) => esc(name.split(" ").slice(0, 2).join(" "));
    assert.ok(boxText(none, "gateway").includes(esc(gateway.service.split(" ").slice(0, 3).join(" "))), `${a.id}: with nothing chosen the box names its role`);
    assert.ok(boxText(red, "gateway").includes(start(rhGateway.name)), `${a.id}: with Red Hat the box names ${rhGateway.name}`);
    assert.ok(boxText(page(a.id, `cloud=${slug}&stack=${UP}`), "gateway").includes(start(upGateway.name)), `${a.id}: with upstream, ${upGateway.name}`);
    // The options table marks the product in effect.
    const choose = renderToStaticMarkup(
      <ChooseBuild archetype={a} products={productsForArchetype(a.id)} platform={p} framework={null} host={null} stack={{ pack: RH, addons: [] }} onStack={() => {}} onPickPlatform={() => {}} onPickHost={() => {}} onPickFramework={() => {}} />,
    );
    assert.match(choose, new RegExp(`data-option="${esc(rhGateway.name)}" data-in-effect="true"`), `${a.id}: the table marks ${rhGateway.name}`);
    assert.match(choose, /data-pack="redHatOpenShiftAi" data-pack-scope="platform"[^>]*|aria-pressed="true"[^>]*data-pack="redHatOpenShiftAi"/);
    // The settings: every row with nothing chosen, each tagged; fewer with a pack, never one whose product it replaces.
    const all = renderToStaticMarkup(<ProductSettings archetype={a} products={productsForArchetype(a.id)} selected={p.id} platform={p} onPick={() => {}} lit={null} onLight={() => {}} />);
    assert.equal([...all.matchAll(/data-setting-name/g)].length, p.settings.length, `${a.id}: every row with nothing chosen`);
    assert.equal([...all.matchAll(/data-setting-source="product"/g)].length, p.settings.filter((s) => s.product).length, `${a.id}: each row of one product is tagged`);
    assert.match(all, /If you use LiteLLM/, `${a.id}: the tag says whose setting it is`);
    const { product: narrowed, hidden } = stackedAs(a, p, { pack: RH, addons: [] });
    assert.ok(hidden.length > 0 && narrowed.settings.length + hidden.length === p.settings.length, `${a.id}: Red Hat leaves some rows out`);
    assert.ok(hidden.every((s) => s.product), `${a.id}: a row that applies whatever is chosen is never left out`);
    assert.ok(hidden.some((s) => s.product === "LiteLLM"), `${a.id}: LiteLLM's rows go when another gateway is in effect`);
    const red2 = renderToStaticMarkup(<ProductSettings archetype={a} products={productsForArchetype(a.id)} selected={p.id} platform={narrowed} hidden={hidden} stackName="Red Hat" onPick={() => {}} lit={null} onLight={() => {}} />);
    assert.equal([...red2.matchAll(/data-setting-name/g)].length, narrowed.settings.length);
    assert.match(red2, /data-stack-settings-hint/);
    // Upstream is the stack this mapping drew: none of its rows is left out.
    assert.equal(stackedAs(a, p, { pack: UP, addons: [] }).hidden.length, 0, `${a.id}: upstream keeps every row`);
    // Through the page: Set it, opened on the platform, shows the narrowed table.
    const set = page(a.id, `tab=enable&cloud=${slug}&tool=${p.id}&stack=${RH}`);
    assert.equal([...set.matchAll(/data-setting-name/g)].length, narrowed.settings.length, `${a.id}: Set it shows Red Hat's rows`);
  }
});

test("an add-on replaces the platform pack's product on the boxes it covers, and its settings follow", () => {
  const p = onpremOf(chat.id);
  const gateway = p.implementation.bindings.find((b) => b.block === "gateway")!;
  const stack: Stack = { pack: UP, addons: [KONG] };
  const kong = productsInEffect(gateway, stack)[0];
  assert.ok(kong.packs?.includes(KONG), "Kong's product is in effect on the gateway");
  // Where the add-on covers nothing, the platform pack's product stays.
  const memory = p.implementation.bindings.find((b) => b.block === "memory")!;
  assert.ok(productsInEffect(memory, stack)[0].packs?.includes(UP));
  const html = page(chat.id, `cloud=${cloudSlug(p.id)}&stack=${UP}&addons=${KONG}`);
  assert.ok(boxText(html, "gateway").includes(esc(kong.name.split(" ")[0])), "the gateway box names Kong");
  // Only the rows of products the add-on puts something else in place of go: on the boxes Kong covers.
  const covered = p.implementation.bindings.filter((b) => b.options?.some((o) => o.packs?.includes(KONG)));
  const { hidden } = stackedAs(chat, p, stack);
  assert.ok(hidden.some((s) => s.product === "LiteLLM"), "LiteLLM's rows go");
  for (const s of hidden) assert.ok(covered.some((b) => b.options!.some((o) => namesProduct(o.name, s.product!) && !o.packs?.includes(KONG))), `${s.id}: ${s.product} is offered on a box Kong covers`);
  // On the self-hosted inference pattern the add-on fills the gateway too.
  assert.ok(packsFor(onpremOf(inference.id)).addons.some((x) => x.id === KONG));
});

test("the address carries the stack: unknown or unoffered packs are dropped, and a hosting change keeps what still fits", () => {
  const p = onpremOf(chat.id);
  assert.deepEqual(stackFrom(p, RH, `${KONG},nonsense`), { pack: RH, addons: [KONG] });
  assert.deepEqual(stackFrom(p, "nonsense", null), { pack: null, addons: [] });
  assert.deepEqual(stackFrom(p, MIX, ""), { pack: MIX, addons: [] });
  // A pack that fills nothing on this pattern is not offered on it.
  assert.equal(stackFrom(p, "vmwarePrivateAi", null).pack, null, "VMware fills no box of the chat agent");
  assert.equal(stackFrom(onpremOf(inference.id), "vmwarePrivateAi", null).pack, "vmwarePrivateAi");
  // The pattern page reads it back: the pack card is pressed and Mix your own is not.
  const html = page(chat.id, `tab=enable&cloud=${cloudSlug(p.id)}&stack=${RH}&addons=${KONG}`);
  assert.match(html, /data-cloud-caption[^>]*>[^<]*Red Hat OpenShift AI/, "the caption names the pack");
});

test("every box with options lists them in its hover help and under How it works, the one in effect marked", () => {
  for (const a of hosted) {
    const p = onpremOf(a.id);
    if (!p) continue;
    const bound = p.implementation.bindings.filter((b) => b.options?.length);
    const html = page(a.id, `cloud=${cloudSlug(p.id)}&stack=${UP}`);
    for (const b of bound) {
      const g = html.match(new RegExp(`<g data-block="${b.block}"[^>]*>`))?.[0] ?? "";
      assert.match(g, /aria-description="Options: /, `${a.id} ${b.block}: the hover help lists its options`);
      for (const o of b.options!) assert.ok(g.includes(esc(o.name)), `${a.id} ${b.block}: ${o.name} in the hover help`);
      const on = productsInEffect(b, { pack: UP, addons: [] }, isControlBox(a, b.block));
      for (const o of on) assert.ok(g.includes(`${esc(o.name)} (${o.kind === "open" ? "open source" : "commercial"}, in effect)`), `${a.id} ${b.block}: ${o.name} marked in effect`);
    }
    const list = renderToStaticMarkup(<ComponentList archetype={a} cloud={p} stack={{ pack: UP, addons: [] }} />);
    for (const b of bound) {
      assert.match(list, new RegExp(`data-component-options="${b.block}"`), `${a.id} ${b.block}: its options under How it works`);
      for (const o of b.options!) {
        assert.ok(list.includes(`data-component-option="${esc(o.name)}"`), `${a.id} ${b.block}: ${o.name}`);
        assert.ok(list.includes(`href="${esc(o.url)}"`), `${a.id} ${b.block}: ${o.name} links to its page`);
        for (const w of o.watch ?? []) assert.ok(list.includes(esc(w.text)), `${a.id} ${b.block}: ${o.name}'s watch note`);
      }
    }
    assert.match(list, /data-component-in-effect/, `${a.id}: says what the stack puts in each box`);
  }
});

test("no drawing carries a mark for where a platform differs, on any platform or stack", () => {
  for (const a of dataset.archetypes) {
    const queries = ["", ...cloudProductsFor(a.id).map((p) => `cloud=${cloudSlug(p.id)}`)];
    const own = onpremOf(a.id);
    if (own) for (const pack of [...packsFor(own).platform, ...packsFor(own).addons]) queries.push(`cloud=${cloudSlug(own.id)}&stack=${pack.scope === "platform" ? pack.id : UP}${pack.scope === "addon" ? `&addons=${pack.id}` : ""}`);
    for (const q of queries) {
      const html = page(a.id, q);
      assert.doesNotMatch(html, /data-differs=|data-legend-differs|≠/, `${a.id} ${q}: no difference mark`);
    }
  }
  // The drawing itself takes no differences.
  const svg = renderToStaticMarkup(<BoxDiagram archetype={chat} spec={boundaryLayout(chat)} />);
  assert.doesNotMatch(svg, /≠/);
});

test("a settings row with no product applies whatever is chosen; one whose product is in effect is kept", () => {
  const p = onpremOf(chat.id);
  const neutral = p.settings.find((s) => !s.product)!;
  assert.ok(neutral, "the chat agent has a product-neutral row");
  for (const stack of [{ pack: RH, addons: [] }, { pack: UP, addons: [KONG] }, { pack: MIX, addons: [] }]) assert.ok(settingApplies(chat, p, stack, neutral));
  const litellm = p.settings.find((s) => s.product === "LiteLLM")!;
  assert.ok(settingApplies(chat, p, { pack: UP, addons: [] }, litellm));
  assert.ok(settingApplies(chat, p, { pack: MIX, addons: [] }, litellm), "your own mix shows every row");
  assert.ok(!settingApplies(chat, p, { pack: RH, addons: [] }, litellm));
});

test("the build refuses packs that are not unique, incomplete or wrongly scoped", () => {
  const good: TechPack = onprem.packs![0];
  const fails: string[] = [];
  checkPacks("x", [good, { ...good }], (m) => fails.push(m));
  assert.ok(fails.some((m) => /unique/.test(m)), "pack ids are unique");
  const more: string[] = [];
  checkPacks("x", [{ ...good, id: "other", scope: "everything" as never, compare: { ...good.compare, effort: "" }, sources: ["http://insecure.example.com"] }], (m) => more.push(m));
  assert.ok(more.some((m) => /scope/.test(m)) && more.some((m) => /effort/.test(m)) && more.some((m) => /https/.test(m)));
  const ok: string[] = [];
  checkPacks("x", onprem.packs, (m) => ok.push(m));
  assert.deepEqual(ok, []);
});
