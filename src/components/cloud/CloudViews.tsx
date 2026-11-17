"use client";

/**
 * What a product says about a pattern, where a reader meets it: the settings named on a control
 * row and listed under an open control (with where each is set, the value and why), and the
 * side-by-side table of all three clouds under How it works.
 */
import { SETTING_VIA_META } from "@/components/enable/labels";
import type { Archetype, ProductSetting } from "@/lib/types";
import { bindingFor, controlPlaneOptions, type CloudProduct } from "./model";

/** A setting's name as a link to the vendor's page for it. */
function SettingName({ setting }: { setting: ProductSetting }) {
  return (
    <a href={setting.url} target="_blank" rel="noreferrer" className="font-semibold text-ink hover:text-introduced hover:underline">
      {setting.name}
      <span className="ml-0.5 text-introduced">↗</span>
    </a>
  );
}

/** One line for a folded control row: the names of the cloud's options for it. */
export function OptionNames({ short, options }: { short: string; options: ProductSetting[] }) {
  if (!options.length) return null;
  return (
    <span className="mt-1 block text-[12px] leading-snug text-ink" data-option-names>
      <span className="font-semibold">{short}: </span>
      {options.map((s) => s.name).join(" · ")}
    </span>
  );
}

/** Under an open control: each of the product's own settings that delivers it, with where it is set, the value to set and why. */
export function NativeOptions({ id, name, options }: { id: string; name: string; options: ProductSetting[] }) {
  if (!options.length) return null;
  return (
    <div data-native-options={id}>
      <p className="eyebrow">Set it in {name}</p>
      <ul className="mt-1.5 space-y-2">
        {options.map((s) => (
          <li key={s.id} className="rounded-lg border border-line bg-paper px-3 py-2.5">
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] leading-snug">
              <SettingName setting={s} />
              {s.setVia.map((v) => (
                <span key={v} title={SETTING_VIA_META[v].blurb} className="rounded border border-line bg-mist px-1.5 py-px text-[10.5px] font-semibold text-ink-2">
                  {SETTING_VIA_META[v].label}
                </span>
              ))}
            </p>
            <p className="ident mt-0.5 break-words text-[10.5px] leading-snug text-ink-3">{s.where}</p>
            <p className="mt-1.5 text-[12.5px] leading-snug">
              <span className="font-semibold text-ink">Set to: </span>
              <span className="text-ink">{s.recommended}</span>
            </p>
            {s.default && <p className="text-[11.5px] leading-snug text-ink-3">Default: {s.default}</p>}
            <p className="mt-0.5 text-[12.5px] leading-snug text-ink-2">{s.why}</p>
            {s.requires && <p className="mt-1 text-[11.5px] text-ink-3">Requires: {s.requires}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** How it works: every component, and what plays it on each cloud the pattern is mapped to, side by side. */
export function CloudComparison({ archetype, products }: { archetype: Archetype; products: CloudProduct[] }) {
  const blocks = archetype.blocks.filter((b) => products.some((p) => bindingFor(p, b.id)));
  const governance = archetype.blocks.filter((b) => b.kind === "governance" && products.some((p) => controlPlaneOptions(archetype, p, b).length));
  return (
    <div className="overflow-x-auto" data-cloud-comparison>
      <table className="w-full min-w-[720px] border-collapse text-left text-[12.5px] leading-snug">
        <thead>
          <tr className="border-b border-line-strong text-[11px] uppercase tracking-[0.06em] text-ink-3">
            <th className="w-[19%] py-2 pr-4 font-semibold">Component</th>
            {products.map((p) => (
              <th key={p.id} className="py-2 pr-4 font-semibold">{p.cloud.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {blocks.map((b) => (
            <tr key={b.id} className="border-b border-line align-top">
              <th scope="row" className="py-2 pr-4 font-semibold text-ink">{b.title}</th>
              {products.map((p) => {
                const binding = bindingFor(p, b.id);
                return (
                  <td key={p.id} className="py-2 pr-4 text-ink-2">
                    {binding ? (
                      <>
                        <span className="text-ink">{binding.service}</span>
                        {binding.build && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-ink-3">You build this</span>}
                      </>
                    ) : (
                      <span className="text-ink-3">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {governance.map((b) => (
            <tr key={b.id} className="border-b border-line align-top">
              <th scope="row" className="py-2 pr-4 font-semibold text-ink">
                {b.title}
                <span className="block text-[10.5px] font-normal text-ink-3">control plane · settings</span>
              </th>
              {products.map((p) => (
                <td key={p.id} className="py-2 pr-4 text-ink-2">
                  {controlPlaneOptions(archetype, p, b).map((s) => s.name).join(" · ") || <span className="text-ink-3">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
