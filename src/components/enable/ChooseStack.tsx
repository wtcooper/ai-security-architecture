"use client";

/**
 * Enable › Choose how you'll build it › Your stack: on a platform where the organisation chooses
 * the products itself (its own data centre), which products fill the boxes. A platform pack is a
 * set of products its vendor or project documents as working together, and fills most boxes; an
 * add-on replaces the platform pack's product on the boxes it covers; "Mix your own" chooses box
 * by box. The packs are cards in the style of the hosting cards, compared row by row behind a
 * fold, and every box's options are listed with their kind and the packs each is part of. No
 * ranking anywhere: the order is the research's, and nothing is marked as recommended.
 */
import { Fragment } from "react";

import { boxesFilledBy, isControlBox, KIND_LABEL, MIX, packsFor, productsInEffect, stackChosen, STATUS_LABEL, type CloudProduct, type Stack } from "@/components/cloud/model";
import { PACK_COMPARE, type Archetype, type TechPack } from "@/lib/types";

/** A pack's name in a tight space: up to "on", "with" or a bracket ("Red Hat OpenShift AI"). */
export const packShort = (pack: TechPack) => pack.name.split(/ (?:on|with) | \(/)[0];

const tag = "rounded border px-1.5 py-px text-[10.5px] font-semibold";

function KindTag({ kind }: { kind: string }) {
  return (
    <span className={`${tag} ${kind === "open" ? "border-[#a7dcc4] bg-[#e8f6ef] text-[#06644a]" : kind === "commercial" ? "border-[#c9c2e6] bg-[#f3f1fb] text-[#4E427F]" : "border-line bg-mist text-ink-2"}`} data-kind={kind}>
      {KIND_LABEL[kind] ?? kind}
    </span>
  );
}

function StatusTag({ status }: { status: string }) {
  if (status === "ga") return null;
  return (
    <span className={`${tag} border-[#e6c98f] bg-[#fff6e3] text-[#7a5410]`} data-pack-status={status}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function PackCard({ pack, on, fills, total, onPick, note }: { pack: TechPack; on: boolean; fills: number; total: number; onPick: () => void; note?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onPick}
      className={`flex h-full flex-col justify-start rounded-lg border p-3 text-left transition-colors ${on ? "border-ink bg-paper ring-1 ring-ink" : "border-line bg-paper hover:border-ink-3"}`}
      data-pack={pack.id}
      data-pack-scope={pack.scope}
    >
      <span className="text-[13px] font-semibold leading-snug text-ink">{pack.name}</span>
      <span className="mt-1 flex flex-wrap gap-1">
        <KindTag kind={pack.kind} />
        <StatusTag status={pack.status} />
        {pack.vendor && pack.scope === "addon" && <span className="text-[11px] text-ink-3">{pack.vendor}</span>}
      </span>
      <span className="mt-1.5 block text-[12.5px] leading-snug text-ink-2" data-pack-fits>{pack.fits}</span>
      <span className="mt-1.5 block text-[11.5px] leading-snug text-ink-2">
        <span className="font-semibold text-ink">Covers: </span>
        {pack.compare.covers}
      </span>
      <span className="mt-1 block text-[11.5px] leading-snug text-ink-2">
        <span className="font-semibold text-ink">You bring: </span>
        {pack.compare.bringYourOwn}
      </span>
      <span className="mt-auto block pt-1.5 text-[11px] text-ink-3" data-pack-fills={fills}>
        {pack.scope === "addon" ? `Replaces the product on ${fills} ${fills === 1 ? "box" : "boxes"} here` : `Puts a product on ${fills} of the ${total} boxes here`}
        {note ? ` · ${note}` : ""}
      </span>
    </button>
  );
}

/** The packs side by side, on the same rows, closed until asked for. */
function PackComparison({ packs }: { packs: TechPack[] }) {
  const asOf = packs.map((p) => p.asOf).sort().at(-1);
  return (
    <details className="mt-3 rounded-lg border border-line bg-paper" data-pack-comparison>
      <summary className="cursor-pointer px-3 py-2 text-[12.5px] font-semibold text-ink">Compare the packs row by row</summary>
      <div className="overflow-x-auto border-t border-line px-3 pb-3 pt-2">
        <table className="w-full min-w-[760px] table-fixed border-collapse text-left text-[12.5px] leading-snug">
          <thead>
            <tr className="border-b border-line-strong text-[11px] uppercase tracking-[0.06em] text-ink-3">
              <th className="w-[14%] py-2 pr-4 font-semibold" />
              {packs.map((p) => (
                <th key={p.id} className="py-2 pr-4 font-semibold">
                  {p.name}
                  {p.scope === "addon" && <span className="block text-[10px] font-normal normal-case tracking-normal">add-on</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PACK_COMPARE.map(([key, label]) => (
              <tr key={key} className="border-b border-line align-top" data-pack-row={key}>
                <th scope="row" className="py-2 pr-4 font-semibold text-ink">{label}</th>
                {packs.map((p) => (
                  <td key={p.id} className="py-2 pr-4 text-ink-2">{p.compare[key]}</td>
                ))}
              </tr>
            ))}
            <tr className="border-b border-line align-top" data-pack-row="status">
              <th scope="row" className="py-2 pr-4 font-semibold text-ink">Status</th>
              {packs.map((p) => (
                <td key={p.id} className="py-2 pr-4 text-ink-2">{STATUS_LABEL[p.status] ?? p.status}</td>
              ))}
            </tr>
            <tr className="align-top" data-pack-row="sources">
              <th scope="row" className="py-2 pr-4 font-semibold text-ink">Sources</th>
              {packs.map((p) => (
                <td key={p.id} className="py-2 pr-4 text-ink-2">
                  {p.sources.map((u, i) => (
                    <Fragment key={u}>
                      {i > 0 && " · "}
                      <a href={u} target="_blank" rel="noreferrer" className="font-semibold text-introduced hover:underline">
                        {i + 1} ↗
                      </a>
                    </Fragment>
                  ))}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <p className="mt-3 max-w-3xl text-[12px] leading-snug text-ink-3">
          From each vendor&rsquo;s or project&rsquo;s own pages{asOf ? `, read in ${asOf}` : ""}. Not ranked: a pack is what its makers document as working together, and an organisation that already runs one of them usually stays with it.
        </p>
      </div>
    </details>
  );
}

/** Every box's options: the products that can play it, their kind and the packs each is part of. */
function RoleOptions({ archetype, platform, stack }: { archetype: Archetype; platform: CloudProduct; stack: Stack }) {
  const packs = new Map((platform.cloud.packs ?? []).map((p) => [p.id, p]));
  const title = new Map(archetype.blocks.map((b) => [b.id, b.title]));
  const bound = platform.implementation.bindings.filter((b) => b.options?.length);
  // Component boxes first, then the control plane, each in the pattern's own order.
  const order = (id: string) => (isControlBox(archetype, id) ? 1000 : 0) + archetype.blocks.findIndex((b) => b.id === id);
  const rows = [...bound].sort((a, b) => order(a.block) - order(b.block));
  const chosen = stackChosen(stack);
  const chosenName = stack.pack && stack.pack !== MIX ? packs.get(stack.pack)?.name : null;
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-line bg-paper" data-role-options>
      <table className="w-full min-w-[720px] border-collapse text-left text-[12.5px] leading-snug">
        <thead>
          <tr className="border-b border-line-strong text-[11px] uppercase tracking-[0.06em] text-ink-3">
            <th className="w-[26%] py-2 pl-3 pr-4 font-semibold">Box · its role</th>
            <th className="py-2 pr-3 font-semibold">{chosen ? "Options, the one in effect marked" : "Options, none ranked"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => {
            const control = isControlBox(archetype, b.block);
            const inEffect = productsInEffect(b, stack, control);
            return (
              <tr key={b.block} className="border-b border-line align-top last:border-b-0" data-role-row={b.block}>
                <th scope="row" className="py-2 pl-3 pr-4 font-normal">
                  <span className="block font-semibold text-ink">{title.get(b.block) ?? b.block}</span>
                  <span className="block text-[11.5px] text-ink-3">{b.service}</span>
                  {control && <span className="block text-[10.5px] text-ink-3">control plane: several products at once</span>}
                </th>
                <td className="py-2 pr-3">
                  <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
                    {b.options!.map((o) => {
                      const on = inEffect.includes(o);
                      return (
                        <li key={o.name} className={`inline-flex flex-wrap items-baseline gap-1 ${on ? "rounded bg-chip-soft/40 px-1 ring-1 ring-ink" : ""}`} data-option={o.name} data-in-effect={on || undefined}>
                          <a href={o.url} target="_blank" rel="noreferrer" title={o.note} className={`${on ? "font-bold" : "font-semibold"} text-ink hover:text-introduced hover:underline`}>
                            {o.name} <span className="text-introduced">↗</span>
                          </a>
                          <KindTag kind={o.kind} />
                          {(o.packs ?? []).map((id) => (
                            <span key={id} className={`${tag} border-line bg-mist text-ink-3`} data-option-pack={id}>
                              {packs.get(id) ? packShort(packs.get(id)!) : id}
                            </span>
                          ))}
                          {on && <span className={`${tag} border-ink bg-ink text-white`}>in effect</span>}
                        </li>
                      );
                    })}
                  </ul>
                  {chosen && !inEffect.length && (
                    <p className="mt-1 text-[11.5px] text-ink-3" data-bring-your-own>
                      {chosenName ? `${chosenName} does not fill this box` : "Your stack does not fill this box"}: bring your own, from these or others.
                    </p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ChooseStack({ archetype, platform, stack, onStack }: { archetype: Archetype; platform: CloudProduct; stack: Stack; onStack: (stack: Stack) => void }) {
  const { platform: packs, addons } = packsFor(platform);
  const total = platform.implementation.bindings.filter((b) => b.options?.length).length;
  const fills = (id: string) => boxesFilledBy(platform, id);
  const title = new Map(archetype.blocks.map((b) => [b.id, b.title]));
  const pick = (id: string) => onStack({ pack: stack.pack === id ? null : id, addons: stack.addons });
  // An add-on replaces the product on the boxes it covers, so two that cover the same box do not stack: the later one is kept.
  const overlap = (a: string, b: string) => fills(a).some((x) => !isControlBox(archetype, x) && fills(b).includes(x));
  const toggle = (id: string) => {
    const on = stack.addons.includes(id);
    onStack({ pack: stack.pack, addons: on ? stack.addons.filter((x) => x !== id) : [...stack.addons.filter((x) => !overlap(x, id)), id] });
  };
  return (
    <div data-choose-stack>
      <div className="grid gap-2 md:grid-cols-3" role="group" aria-label="Your stack">
        {packs.map((p) => (
          <PackCard key={p.id} pack={p} on={stack.pack === p.id} fills={fills(p.id).length} total={total} onPick={() => pick(p.id)} />
        ))}
        <button
          type="button"
          aria-pressed={stack.pack === MIX}
          onClick={() => pick(MIX)}
          className={`flex h-full flex-col justify-start rounded-lg border border-dashed p-3 text-left transition-colors ${stack.pack === MIX ? "border-ink bg-paper ring-1 ring-ink" : "border-line-strong bg-paper hover:border-ink-3"}`}
          data-pack={MIX}
        >
          <span className="text-[13px] font-semibold leading-snug text-ink">Mix your own</span>
          <span className="mt-1 flex flex-wrap gap-1">
            <KindTag kind="mixed" />
          </span>
          <span className="mt-1.5 block text-[12.5px] leading-snug text-ink-2">Choose a product for each box from its options below, knowing which go together in a pack.</span>
          <span className="mt-1.5 block text-[11.5px] leading-snug text-ink-2">
            <span className="font-semibold text-ink">You bring: </span>
            the integration between them. Every box names its role, and every row in the settings stays listed, each tagged with the product it belongs to.
          </span>
        </button>
      </div>
      {addons.length > 0 && (
        <>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">Add-ons: replace the product on some boxes, whatever else you choose</p>
          <div className="mt-1.5 grid gap-2 md:grid-cols-3" role="group" aria-label="Add-ons">
            {addons.map((p) => {
              const clash = stack.addons.filter((x) => x !== p.id && overlap(x, p.id));
              const boxes = fills(p.id).map((id) => title.get(id) ?? id);
              return (
                <PackCard
                  key={p.id}
                  pack={p}
                  on={stack.addons.includes(p.id)}
                  fills={boxes.length}
                  total={total}
                  onPick={() => toggle(p.id)}
                  note={`${boxes.join(", ")}${clash.length ? `; choosing it lets go of ${clash.map((x) => addons.find((a) => a.id === x)?.name ?? x).join(", ")}` : ""}`}
                />
              );
            })}
          </div>
        </>
      )}
      <p className="mt-2 max-w-3xl text-[12px] leading-snug text-ink-3" data-stack-hint>
        Not ranked. A pack is a set of products its makers document as working together. Choose one to see its products on the drawing and only their settings in the next step; with none chosen, or your own mix, every box names its role and every setting is listed.
      </p>
      <PackComparison packs={[...packs, ...addons]} />
      <RoleOptions archetype={archetype} platform={platform} stack={stack} />
    </div>
  );
}
