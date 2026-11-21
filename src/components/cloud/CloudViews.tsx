"use client";

/**
 * What a product says about a pattern, where a reader meets it: the settings named on a control
 * row and listed under an open control (with where each is set, the value and why), and the
 * side-by-side table of all three clouds under How it works.
 */
import { Prose } from "@/components/Prose";
import { SettingCard } from "@/components/enable/SettingParts";
import type { Archetype, ProductSetting } from "@/lib/types";
import { CLOUD_ROLES } from "@/lib/types";
import { bindingFor, controlPlaneOptions, differencesFor, platformWords, ROLE_LABEL, type CloudProduct } from "./model";

/** Under an open control: each of the product's own settings that delivers it, with the value to set. */
export function NativeOptions({ id, name, options }: { id: string; name: string; options: ProductSetting[] }) {
  if (!options.length) return null;
  return (
    <div data-native-options={id}>
      <p className="eyebrow">Set it in {name}</p>
      <ul className="mt-1.5 space-y-2">
        {options.map((s) => (
          <li key={s.id}>
            <SettingCard setting={s} />
          </li>
        ))}
      </ul>
    </div>
  );
}

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
                        {binding.builtWith && !binding.service.includes(binding.builtWith) && (
                          <span className="block text-[11.5px] text-ink-3" data-built-with>
                            built with {binding.builtWith} in {p.cloud.selfManaged ? "this mapping" : `${p.cloud.short}'s guides`}
                          </span>
                        )}
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

/**
 * How it works, with a platform chosen: where it does not follow the drawing, what else a
 * builder has to stand up, and where to start. The drawing is shared by every cloud and by the
 * organisation's own data centre, so this is where each says what is true only of itself.
 */
export function OnCloud({ archetype, product }: { archetype: Archetype; product: CloudProduct }) {
  const { implementation: impl, cloud } = product;
  const words = platformWords(cloud);
  const own = words.own;
  const differences = differencesFor(archetype, product);
  const needed = impl.alsoNeeded ?? [];
  const link = "font-semibold text-introduced hover:underline";
  return (
    <div className="max-w-4xl space-y-6" data-on-cloud={product.id}>
      {impl.summary && <Prose blocks={impl.summary} size="sm" />}

      <div>
        <p className="eyebrow">Where {own ? "running it on-premises" : cloud.short} differs from the drawing</p>
        {differences.length ? (
          <>
            <ul className="mt-2 space-y-2.5">
              {differences.map((d, i) => (
                <li key={i} data-difference={d.key} className="text-[13px] leading-snug text-ink-2">
                  <span className="font-semibold text-ink">{d.where}: </span>
                  {d.text}
                  {d.url && (
                    <>
                      {" "}
                      <a href={d.url} target="_blank" rel="noreferrer" className={link}>
                        Source ↗
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-1 text-[13px] text-ink-2">Nothing recorded: the flows on the drawing hold {words.on} as drawn.</p>
        )}
      </div>

      {needed.length > 0 && (
        <div>
          <p className="eyebrow">{own ? "Also yours to run" : `Also needed on ${cloud.short}`}</p>
          <dl className="mt-2 grid gap-x-6 gap-y-3 text-[13px] leading-snug sm:grid-cols-[max-content_minmax(0,1fr)]">
            {CLOUD_ROLES.filter((role) => needed.some((n) => n.role === role)).map((role) => (
              <div key={role} className="contents">
                <dt className="text-ink-3">{ROLE_LABEL[role]}</dt>
                <dd className="space-y-1.5">
                  {needed.filter((n) => n.role === role).map((n) => (
                    <p key={n.service} data-also-needed={n.service}>
                      {n.url ? (
                        <a href={n.url} target="_blank" rel="noreferrer" className="font-semibold text-ink hover:text-introduced hover:underline">
                          {n.service} ↗
                        </a>
                      ) : (
                        <span className="font-semibold text-ink">{n.service}</span>
                      )}
                      <span className="text-ink-2"> · {n.why}</span>
                    </p>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div>
        <p className="eyebrow">Where to start building</p>
        <ul className="mt-1.5 space-y-1 text-[13px] leading-snug">
          {[...(impl.quickstart ?? []), ...impl.reference].map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noreferrer" className={link}>
                {r.title} ↗
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[12px] text-ink-3">
          {impl.verified ? `Components and flows checked against ${words.docs} on ${impl.verified}.` : `Mapping dated ${impl.asOf}; not yet re-checked component by component.`}{" "}
          {own
            ? "Open-source projects change their defaults, editions and licences: follow the links before you build."
            : "Cloud services are renamed and reworked often: follow the links before you build."}
        </p>
      </div>
    </div>
  );
}
