"use client";

/**
 * Step 4 of Enable: the products this architecture is built on or bought as, one pill each,
 * coloured by whether the organisation has switched it on. Picking one shows its own settings —
 * every security-relevant switch the vendor or cloud exposes, how it is set, the baseline value
 * (data/tooling/BASELINE.md) and why, the chips on the drawing it delivers, and the
 * organisation's status for it. A product not yet catalogued setting by setting falls back to
 * its capability-by-capability record, so nothing the registry knows is hidden.
 */
import { Fragment } from "react";

import { InfoTip } from "@/components/StatusPill";
import { Prose } from "@/components/Prose";
import { adoptionFor, archetypeById, capabilityName, settingAdoptionFor, vendorById, type Product } from "@/lib/data";
import type { AdoptionStatus, Archetype, ProductSetting } from "@/lib/types";
import { SETTING_AREAS } from "@/lib/types";
import { ADOPTION_HELP, ADOPTION_META, SETTING_AREA_META, SETTING_VIA_META } from "./labels";
import { ToolRecord } from "./ToolRecord";

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
function ProductPills({ products, selected, onPick }: { products: Product[]; selected: string; onPick: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Products">
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

const GRID = "md:grid-cols-[minmax(0,1.35fr)_92px_minmax(0,1.5fr)_76px_92px]";

/** One product's settings, grouped by admin area. */
export function SettingsTable({
  product,
  archetype,
  lit,
  onLight,
}: {
  product: Product;
  archetype: Archetype;
  /** The capability lit on the drawing, so its chips read as selected here too. */
  lit: string | null;
  onLight: (capabilityId: string) => void;
}) {
  const number = new Map(archetype.mitigations.map((id, i) => [id, i + 1]));
  const groups = SETTING_AREAS.map((area) => ({ area, rows: product.settings.filter((s) => s.area === area) })).filter((g) => g.rows.length);
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-paper">
      <div className={`hidden gap-4 border-b border-line bg-mist/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 md:grid ${GRID}`}>
        <span>Setting</span>
        <span>Set via</span>
        <span>Recommended</span>
        <span>Delivers</span>
        <span className="inline-flex items-center gap-1 md:justify-end">
          Status
          <InfoTip text={ADOPTION_HELP} />
        </span>
      </div>
      {groups.map(({ area, rows }) => (
        <Fragment key={area}>
          <p className="border-b border-line bg-mist/30 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">{SETTING_AREA_META[area]}</p>
          <ul className="divide-y divide-line border-b border-line last:border-b-0">
            {rows.map((s) => (
              <SettingRow key={s.id} productId={product.id} setting={s} number={number} lit={lit} onLight={onLight} />
            ))}
          </ul>
        </Fragment>
      ))}
    </div>
  );
}

function SettingRow({
  productId,
  setting: s,
  number,
  lit,
  onLight,
}: {
  productId: string;
  setting: ProductSetting;
  number: Map<string, number>;
  lit: string | null;
  onLight: (id: string) => void;
}) {
  const a = settingAdoptionFor(productId, s.id);
  const chips = s.mitigations.filter((id) => number.has(id)).sort((x, y) => number.get(x)! - number.get(y)!);
  return (
    <li id={`setting-${productId}-${s.id}`} className={`grid grid-cols-1 gap-x-4 gap-y-1.5 px-4 py-3 ${GRID}`}>
      <div className="min-w-0">
        <a href={s.url} target="_blank" rel="noreferrer" className="text-[13px] font-semibold leading-snug text-ink hover:text-introduced hover:underline">
          {s.name}
          <span className="ml-1 text-introduced">↗</span>
        </a>
        <p className="ident mt-0.5 break-words text-[10.5px] leading-snug text-ink-3">{s.where}</p>
        {s.requires && <span className="mt-1 inline-block rounded border border-line px-1.5 text-[10.5px] text-ink-3">{s.requires}</span>}
      </div>
      <div className="flex flex-wrap content-start gap-1">
        {s.setVia.map((v) => (
          <span key={v} title={SETTING_VIA_META[v].blurb} className="rounded border border-line bg-mist px-1.5 py-px text-[10.5px] font-semibold text-ink-2">
            {SETTING_VIA_META[v].label}
          </span>
        ))}
      </div>
      <div className="min-w-0 text-[12.5px] leading-snug">
        <p className="font-semibold text-ink">{s.recommended}</p>
        {s.default && <p className="text-[11.5px] text-ink-3">Default: {s.default}</p>}
        <p className="mt-0.5 text-ink-2">{s.why}</p>
      </div>
      <div className="flex flex-wrap content-start gap-1" aria-label="Capabilities on the drawing">
        {chips.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onLight(id)}
            title={`${capabilityName(id)} — light it on the drawing`}
            className={`flex h-[21px] w-[21px] items-center justify-center rounded-full border border-chip text-[10.5px] font-bold transition-colors ${
              lit === id ? "bg-chip text-white" : "bg-chip-soft text-chip hover:bg-chip hover:text-white"
            }`}
          >
            {number.get(id)}
          </button>
        ))}
      </div>
      <div className="md:text-right">
        <AdoptionPill status={a.status} title={a.set ? [a.value && `Set to: ${a.value}`, a.note].filter(Boolean).join(" · ") || undefined : "No status recorded in data/status.yaml"} />
        {a.value && <p className="mt-0.5 text-[11px] text-ink-3">Set to {a.value}</p>}
      </div>
    </li>
  );
}

/** Who makes it, when it was checked, and the short description; the long record stays a click away. */
function ProductHeader({ product }: { product: Product }) {
  if (product.kind === "cloud") {
    const { implementation: impl } = product;
    return (
      <div>
        <p className="eyebrow">{product.cloud.name} · verified {impl.asOf}</p>
        {impl.summary && <Prose blocks={impl.summary} className="mt-2" size="sm" />}
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
      </div>
    );
  }
  const { tool } = product;
  const vendor = vendorById.get(tool.vendor);
  // The settings carry their own check dates; the newest is when this table was last verified.
  const checked = product.settings.map((st) => st.verified).sort().at(-1);
  return (
    <div>
      <p className="eyebrow">
        {vendor?.name ?? tool.vendor} · {tool.family} · {checked ? `settings verified ${checked}` : `verified ${tool.asOf}`}
      </p>
      <p className="mt-1.5 line-clamp-3 max-w-3xl text-[13px] leading-relaxed text-ink-2">{tool.summary[0]}</p>
    </div>
  );
}

export function ProductSettings({
  archetype,
  products,
  selected,
  onPick,
  lit,
  onLight,
}: {
  archetype: Archetype;
  products: Product[];
  /** The product open, or null for the default: the first one switched on, else the first. */
  selected: string | null;
  onPick: (id: string) => void;
  lit: string | null;
  onLight: (capabilityId: string) => void;
}) {
  const fallback = products.find((p) => adoptionFor(p.id).status === "enabled") ?? products[0];
  const product = products.find((p) => p.id === selected) ?? fallback;
  if (!product) return null;
  const recorded = product.settings.some((s) => settingAdoptionFor(product.id, s.id).set);
  return (
    <div>
      <ProductPills products={products} selected={product.id} onPick={onPick} />
      <div className="mt-4 rounded-xl border border-line bg-paper px-4 py-4 sm:px-5">
        <ProductHeader product={product} />
        {product.settings.length ? (
          <>
            {!recorded && (
              <p className="mt-3 rounded-lg border border-line bg-mist/50 px-3 py-2 text-[12px] leading-snug text-ink-2">
                No settings recorded for {product.kind === "cloud" ? product.cloud.short : product.tool.name} yet, so every row reads Not
                enabled. Record what your organisation has switched on under <code className="ident text-[11px]">products:</code> in{" "}
                <code className="ident text-[11px]">data/status.yaml</code>.
              </p>
            )}
            <div className="mt-4">
              <SettingsTable product={product} archetype={archetype} lit={lit} onLight={onLight} />
            </div>
          </>
        ) : product.kind === "tool" ? (
          <>
            <p className="mt-3 rounded-lg border border-line bg-mist/50 px-3 py-2 text-[12px] leading-snug text-ink-2">
              {product.tool.name}&apos;s settings are not catalogued row by row yet. Until they are, this is how it covers each capability on{" "}
              {archetypeById.get(product.tool.architecture)?.title ?? "this architecture"}.
            </p>
            <div className="mt-4">
              <ToolRecord tool={product.tool} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
