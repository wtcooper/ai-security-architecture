"use client";

/**
 * Step 2 of Enable: the same list as step 1, now in the product. One pill per product; on a
 * hosted pattern, two rows of pills, because where it runs (a cloud or the organisation's own
 * data centre) and what its boxes are built with (a framework or a server) are separate choices
 * and not alternatives. For what is picked, every recommended setting as a row shaped like a
 * control row, both products' rows in one table when two are picked: what to set and the
 * value, one line of why, and beside it the control it delivers (by number and name) and where
 * it is set. The settings sit under the same plain headings, in the same order, as the controls
 * above, so the eye meets nothing new moving from one step to the next.
 *
 * A row opens to the rest: the full path, how it is set, the default, what it requires and the
 * vendor's page. Background on the product is one line and an "About" fold. The status column
 * appears only once the organisation has recorded a status for that product.
 */
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { Prose } from "@/components/Prose";
import { SettingCheck } from "./SettingCheck";
import { adoptionFor, archetypeById, controlName, settingAdoptionFor, settingLinkFor, vendorById, type Product } from "@/lib/data";
import { patternHref } from "@/lib/routes";
import type { AdoptionStatus, Archetype, ProductSetting } from "@/lib/types";
import { ADOPTION_META } from "./labels";
import { controlGroups, controlsDelivered, settingGroups } from "./model";
import { ToolRecord } from "./ToolRecord";
import { Recommended, SetVia } from "./SettingParts";

export function AdoptionPill({ status, title }: { status: AdoptionStatus; title?: string }) {
  const m = ADOPTION_META[status];
  return (
    <span
      title={title}
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-1.5 py-px text-[10.5px] ${status === "notEnabled" ? "font-normal" : "font-semibold"}`}
      style={{ background: m.bg, borderColor: m.border, color: m.text }}
    >
      {m.label}
    </span>
  );
}

/** The row of products, each a pill tinted by its adoption. */
export function ProductPills({ products, selected, onPick, label = "Products" }: { products: Product[]; selected: string; onPick: (id: string) => void; label?: string }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={label}>
      {products.map((p) => {
        const a = adoptionFor(p.id);
        const m = ADOPTION_META[a.status];
        const active = p.id === selected;
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onPick(p.id)}
            title={`${a.set ? m.label : "Not enabled — no status recorded"}${a.note ? ` · ${a.note}` : ""}`}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-semibold transition-colors ${
              active ? "ring-2 ring-ink ring-offset-1" : "hover:border-ink-3"
            }`}
            style={{
              background: a.status === "notEnabled" ? "var(--mist)" : m.bg,
              borderColor: a.status === "notEnabled" ? "var(--line)" : m.border,
              color: a.status === "notEnabled" ? "var(--ink-2)" : m.text,
            }}
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: m.dot }} aria-hidden />
            {p.kind === "cloud" ? p.cloud.short : p.tool.name}
          </button>
        );
      })}
    </div>
  );
}

/** How a product is named in a tight space: a platform by its short name, a tool by its own. */
const shortOf = (product: Product) => (product.kind === "cloud" ? product.cloud.short : product.tool.name);

/** The chip of a control a setting delivers: picking it lights that control on the drawing. */
function Chip({ n, lit, title, onClick }: { n: number; lit: boolean; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`flex h-[21px] w-[21px] items-center justify-center rounded-full border text-[10.5px] font-bold hover:bg-chip hover:text-white ${lit ? "border-chip bg-chip text-white" : "border-chip bg-chip-soft text-chip"}`}
    >
      {n}
    </button>
  );
}

/**
 * The settings of one product, or of two chosen together on a hosted pattern (where it runs, and
 * what it is built with), as a table of recommended values: the setting and its page, how it is
 * set, the value to set with the default and the reason, the controls it delivers, and its status
 * once the organisation records one. The bands are those of the controls step, in the same order,
 * each opening with the sentence that says what it is for.
 */
export function SettingsTable({
  product,
  products = product ? [product] : [],
  archetype,
  lit,
  onLight,
}: {
  product?: Product;
  /** One product, or the platform and the framework of a hosted pattern. */
  products?: Product[];
  archetype: Archetype;
  /** The control lit on the drawing, so its chip reads as lit here too. */
  lit: string | null;
  onLight: (controlId: string) => void;
}) {
  const number = new Map(archetype.mitigations.map((id, i) => [id, i + 1]));
  const blurbs = new Map(controlGroups(archetype).map((g) => [g.id, g.blurb]));
  // A setting belongs to the product that lists it; two products may use the same id.
  const owner = new Map<ProductSetting, Product>(products.flatMap((p) => p.settings.map((st) => [st, p] as const)));
  const groups = settingGroups(archetype, products.flatMap((p) => p.settings));
  // Shown only once a status is recorded for one of these products; until then every row would read "Not enabled".
  const recorded = products.some((p) => p.settings.some((st) => settingAdoptionFor(p.id, st.id).set));
  // A row says whose it is when two products are shown, or when the platform's file carries a framework's own setting.
  const tagged = products.length > 1;
  const grid = recorded ? "md:grid-cols-[minmax(0,1.35fr)_104px_minmax(0,1.9fr)_76px_100px]" : "md:grid-cols-[minmax(0,1.35fr)_104px_minmax(0,1.9fr)_76px]";
  return (
    <>
      <p className="mb-2 text-[12px] leading-snug text-ink-3" data-settings-status-hint>
        {recorded ? (
          <>
            Status comes from <span className="ident">data/org/products.yaml</span>.
          </>
        ) : (
          <>
            No status recorded for these settings yet: record what you have switched on in <span className="ident">data/org/products.yaml</span> and a status column appears.
          </>
        )}
      </p>
      <div className="overflow-hidden rounded-xl border border-line bg-paper" data-settings={products.map((p) => p.id).join(" ")}>
        <div className={`hidden gap-4 border-b border-line bg-mist/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 md:grid ${grid}`}>
          <span>Setting</span>
          <span>Set via</span>
          <span>Recommended</span>
          <span>Delivers</span>
          {recorded && <span className="md:text-right">Status</span>}
        </div>
        {groups.map((group) => (
          <Fragment key={group.id}>
            <div className="border-b border-line bg-mist/40 px-4 py-2" data-setting-group={group.id}>
              <p className="flex flex-wrap items-baseline gap-x-2.5">
                <span className="display text-[14px] font-bold text-ink">{group.plain}</span>
                {group.title && (
                  <span className="text-[11px] text-ink-3" title={`NIST CSF 2.0 · ${group.function}`}>
                    {group.title}
                  </span>
                )}
              </p>
              <p className="mt-0.5 max-w-4xl text-[12px] leading-snug text-ink-2">
                {group.title ? blurbs.get(group.id) : "Hardening the product recommends that is not one of the numbered controls."}
              </p>
            </div>
            <ul className="divide-y divide-line border-b border-line last:border-b-0">
              {group.settings.map((s) => {
                const controls = controlsDelivered(archetype, s);
                const product = owner.get(s)!;
                const key = `${product.id}-${s.id}`;
                const a = settingAdoptionFor(product.id, s.id);
                const ourLink = settingLinkFor(product.id, s.id);
                return (
                  <li
                    key={key}
                    id={`setting-${key}`}
                    className={`grid scroll-mt-24 grid-cols-1 gap-x-4 gap-y-2 px-4 py-3 text-[12.5px] leading-snug ${grid} ${controls.includes(lit ?? "") ? "bg-chip-soft/30" : ""}`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-ink" data-setting-name>
                        <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-introduced hover:underline" title="The vendor's page for this setting">
                          {s.name} <span className="text-introduced">↗</span>
                        </a>
                        {(tagged || s.builtWith) && (
                          <span
                            className="ml-2 inline-block rounded border border-line bg-mist px-1.5 py-px align-[1px] text-[10.5px] font-semibold text-ink-2"
                            data-setting-source={s.builtWith ? "framework" : product.kind}
                            title={
                              s.builtWith
                                ? `Applies if you build this with ${s.builtWith}, as ${shortOf(product) === "On-premises" ? "this mapping does" : `${shortOf(product)}'s own guides do`}; with another framework, use its own setting for the same control`
                                : product.kind === "cloud"
                                  ? `A setting of ${product.cloud.name}: where it runs`
                                  : `A setting of ${product.tool.name}`
                            }
                          >
                            {s.builtWith ?? shortOf(product)}
                          </span>
                        )}
                      </p>
                      <p className="ident mt-0.5 break-words text-[10.5px] leading-snug text-ink-3" data-setting-where>
                        {s.where}
                      </p>
                      {s.requires && (
                        <p className="mt-1">
                          <span className="inline-block rounded border border-line px-1.5 py-px text-[10.5px] text-ink-3" title="What it requires">
                            {s.requires}
                          </span>
                        </p>
                      )}
                      {s.check && (
                        <details className="mt-1.5">
                          <summary className="cursor-pointer text-[11.5px] font-semibold text-introduced">Check it</summary>
                          <div className="mt-1.5">
                            <SettingCheck check={s.check} />
                          </div>
                        </details>
                      )}
                    </div>
                    <div>
                      <SetVia setting={s} />
                    </div>
                    <Recommended setting={s} />
                    <div className="flex flex-wrap content-start gap-1">
                      {controls.length ? (
                        controls.map((id) => (
                          <span key={id} data-delivers={id}>
                            <Chip n={number.get(id)!} lit={lit === id} title={`Control ${number.get(id)}: ${controlName(id)}. Light it on the drawing`} onClick={() => onLight(id)} />
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-ink-3" title="Delivers none of the numbered controls">
                          ·
                        </span>
                      )}
                    </div>
                    {recorded && (
                      <div className="md:text-right" data-setting-ours>
                        <AdoptionPill
                          status={a.status}
                          title={a.set ? [a.value && `Set to: ${a.value}`, a.note].filter(Boolean).join(" · ") || undefined : "No status recorded in data/org/products.yaml"}
                        />
                        {a.value && <p className="mt-0.5 text-[11px] text-ink-3">Set to {a.value}</p>}
                        {a.note && <p className="mt-0.5 text-[11px] text-ink-3">{a.note}</p>}
                        {ourLink && (
                          <a href={ourLink} target="_blank" rel="noreferrer" className="mt-0.5 block text-[11px] font-semibold text-introduced hover:underline">
                            Your runbook ↗
                          </a>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Fragment>
        ))}
      </div>
    </>
  );
}

/** One line on the product, and the background behind a fold: the step is about its settings. */
function ProductHeader({ product, archetype }: { product: Product; archetype: Archetype }) {
  const count = `${product.settings.length} recommended ${product.settings.length === 1 ? "setting" : "settings"}`;
  if (product.kind === "cloud") {
    const { implementation: impl, cloud } = product;
    return (
      <div data-product-header={product.id}>
        <p className="text-[13px] text-ink-2">
          <span className="font-semibold text-ink">{cloud.name}</span> · {count} · verified {impl.asOf}
        </p>
        <details className="mt-1.5">
          <summary className="cursor-pointer text-[12.5px] font-semibold text-ink-2">About this pattern {cloud.selfManaged ? "on-premises" : `on ${cloud.short}`}</summary>
          <div className="mt-2 max-w-3xl">
            {impl.summary && <Prose blocks={impl.summary} size="sm" />}
            {impl.reference.length > 0 && (
              <p className="mt-2 text-[12px] text-ink-3">
                Follows{" "}
                {impl.reference.map((r, i) => (
                  <span key={r.url}>
                    {i > 0 && " · "}
                    <a href={r.url} target="_blank" rel="noreferrer" className="font-semibold text-introduced hover:underline">
                      {r.title}
                    </a>
                  </span>
                ))}
              </p>
            )}
            <p className="mt-2 text-[12px] text-ink-3">
              What plays each component on {cloud.short} is on the drawing and under{" "}
              <Link href={patternHref(archetype.id, { tab: "overview", cloud: cloud.id })} className="font-semibold text-introduced hover:underline">
                How it works
              </Link>
              .
            </p>
          </div>
        </details>
      </div>
    );
  }
  const { tool } = product;
  const vendor = vendorById.get(tool.vendor);
  // The settings carry their own check dates; the newest is when this table was last verified.
  const checked = product.settings.map((st) => st.verified).sort().at(-1);
  return (
    <div data-product-header={product.id}>
      <p className="text-[13px] text-ink-2">
        <span className="font-semibold text-ink">{tool.name}</span> · {vendor?.name ?? tool.vendor}
        {product.settings.length > 0 && ` · ${count}`} · verified {checked ?? tool.asOf}
      </p>
      {tool.summary[0] && (
        <details className="mt-1.5">
          <summary className="cursor-pointer text-[12.5px] font-semibold text-ink-2">About {tool.name}</summary>
          <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ink-2">{tool.summary[0]}</p>
        </details>
      )}
    </div>
  );
}

/** One choice of a hosted pattern's build, lettered in the order the choices are made. */
export function ChoiceRow({ n, label, hint, children }: { n?: string; label: string; hint: string; children: ReactNode }) {
  return (
    <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-[190px_minmax(0,1fr)]" data-choice={label}>
      <p className="pt-1 text-[13px] font-semibold leading-snug text-ink">
        {n && <span className="ident mr-1.5 text-[11px] text-ink-3">{n}</span>}
        {label}
        <span className="block text-[11.5px] font-normal text-ink-3">{hint}</span>
      </p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function ProductSettings({
  archetype,
  products,
  selected,
  platform = null,
  onPick,
  lit,
  onLight,
}: {
  archetype: Archetype;
  products: Product[];
  /** The product open, or null for the default: the first one switched on, else the first. */
  selected: string | null;
  /** On a hosted pattern: the cloud or data centre the pattern is shown as built on. */
  platform?: Product | null;
  /** Picks a product; null lets go of the framework on a hosted pattern. */
  onPick: (id: string | null) => void;
  lit: string | null;
  onLight: (controlId: string) => void;
}) {
  // On a hosted pattern the choosing is the step before this one: this step shows the settings
  // of what was chosen, the platform's and the framework's in one table.
  if (products.some((p) => p.kind === "cloud")) {
    const picked = products.find((p) => p.id === selected);
    const where = platform ?? (picked?.kind === "cloud" ? picked : null);
    const framework = picked?.kind === "tool" ? picked : null;
    // A platform's own service comes with the platform: its settings are in the table, its record below.
    const service = where?.kind === "cloud" ? where.service : undefined;
    const chosen = [where, framework].filter((p): p is Product => Boolean(p));
    if (!chosen.length) {
      return (
        <p className="text-[13px] leading-snug text-ink-2" data-choose-first>
          Nothing is chosen yet. In the step above, pick where it runs, what you build it with, or both; their settings appear here under the same headings as the controls.
        </p>
      );
    }
    return (
      <div data-hosted-settings>
        <div className="space-y-2.5">
          {chosen.map((p) => (
            <ProductHeader key={p.id} product={p} archetype={archetype} />
          ))}
        </div>
        {chosen.some((p) => p.settings.length) && (
          <div className="mt-3">
            <SettingsTable key={chosen.map((p) => `${p.id}:${p.settings.length}`).join("+")} products={chosen.filter((p) => p.settings.length)} archetype={archetype} lit={lit} onLight={onLight} />
          </div>
        )}
        {service && (
          <details className="mt-4 rounded-lg border border-line bg-paper" data-platform-service={service.id}>
            <summary className="cursor-pointer px-3 py-2 text-[12.5px] font-semibold text-ink">About {service.name}: what it is, and how far it covers each control by itself</summary>
            <div className="border-t border-line px-3 pb-3 pt-2">
              <ToolRecord tool={service} />
            </div>
          </details>
        )}
        {framework?.kind === "tool" && !framework.settings.length && (
          <div className="mt-4">
            <ToolRecord tool={framework.tool} />
          </div>
        )}
      </div>
    );
  }
  const fallback = products.find((p) => adoptionFor(p.id).status === "enabled") ?? products[0];
  const product = products.find((p) => p.id === selected) ?? fallback;
  if (!product) return null;
  return (
    <div>
      <ProductPills products={products} selected={product.id} onPick={onPick} />
      <div className="mt-3">
        <ProductHeader product={product} archetype={archetype} />
      </div>
      {product.settings.length ? (
        // Keyed by product, so an open row does not carry over to another product's table.
        <div className="mt-3">
          <SettingsTable key={product.id} product={product} archetype={archetype} lit={lit} onLight={onLight} />
        </div>
      ) : product.kind === "tool" ? (
        <>
          <p className="mt-3 rounded-lg border border-line bg-mist/50 px-3 py-2 text-[12px] leading-snug text-ink-2">
            {product.tool.name}&apos;s settings are not catalogued row by row yet. Until they are, this is how it covers each control on{" "}
            {archetypeById.get(product.tool.architecture)?.title ?? "this pattern"}.
          </p>
          <div className="mt-4">
            <ToolRecord tool={product.tool} />
          </div>
        </>
      ) : null}
    </div>
  );
}
