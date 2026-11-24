"use client";

/**
 * What a product says about a pattern, where a reader meets it: the settings named on a control
 * row and listed under an open control (with where each is set, the value and why), and, under
 * How it works, what is different on the platform chosen.
 */
import { SettingCard } from "@/components/enable/SettingParts";
import type { Archetype, ProductSetting } from "@/lib/types";
import { CLOUD_ROLES } from "@/lib/types";
import { differencesFor, platformWords, ROLE_LABEL, shapeLinesFor, type CloudProduct } from "./model";

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
  // What the drawing itself shows differently here, then what it cannot show.
  const shape = shapeLinesFor(archetype, product);
  const needed = impl.alsoNeeded ?? [];
  // The limits, editions and preview status of the services that play the boxes.
  const title = new Map(archetype.blocks.map((b) => [b.id, b.title]));
  const watch = impl.bindings.flatMap((b) => (b.watch ?? []).map((w) => ({ where: title.get(b.block) ?? b.block, service: b.service, ...w })));
  // Where to start: the platform's quickstarts, or its reference pages where it publishes none.
  const start = impl.quickstart?.length ? impl.quickstart : impl.reference;
  // The services named in the boxes, each with the page it was checked against (on-premises a box with options names a role, and its options carry their own pages).
  const checked = impl.bindings.filter((b) => b.url && !(b.options && own));
  const link = "font-semibold text-introduced hover:underline";
  const item = "text-[13px] leading-snug text-ink-2";
  return (
    <div className="max-w-4xl space-y-4" data-on-cloud={product.id}>
      <div>
        <p className="eyebrow" data-differs-heading>How it differs {words.on}</p>
        {shape.length || differences.length ? (
          <ul className="mt-1.5 space-y-1.5">
            {shape.map((c, i) => (
              <li key={`s${i}`} data-shape-change={c.key} data-shape-kind={c.kind} className={item}>
                <span className="mr-1.5 rounded border border-line bg-mist px-1 py-px text-[10px] font-bold uppercase tracking-[0.05em] text-ink-3" title="Drawn this way on the drawing for this platform">
                  Drawn
                </span>
                <span className="font-semibold text-ink">{c.where}: </span>
                {c.why}{" "}
                <a href={c.url} target="_blank" rel="noreferrer" className={link}>
                  Source ↗
                </a>
              </li>
            ))}
            {differences.map((d, i) => (
              <li key={`d${i}`} data-difference={d.key} className={item}>
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
        ) : (
          <p className="mt-1 text-[13px] text-ink-2">Nothing recorded: the flows on the drawing hold {words.on} as drawn.</p>
        )}
      </div>

      {watch.length > 0 && (
        <div>
          <p className="eyebrow">Watch {words.on}</p>
          <ul className="mt-1.5 space-y-1" data-watch>
            {watch.map((w, i) => (
              <li key={i} className={item}>
                <span className="font-semibold text-ink">{w.where} ({w.service}): </span>
                {w.text}
                {w.url && (
                  <>
                    {" "}
                    <a href={w.url} target="_blank" rel="noreferrer" className={link}>
                      Source ↗
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {needed.length > 0 && (
        <div>
          <p className="eyebrow">{own ? "Also yours to run" : `Also needed on ${cloud.short}`}</p>
          <dl className="mt-1.5 grid gap-x-5 gap-y-1.5 text-[12.5px] leading-snug sm:grid-cols-[max-content_minmax(0,1fr)]">
            {CLOUD_ROLES.filter((role) => needed.some((n) => n.role === role)).map((role) => (
              <div key={role} className="contents">
                <dt className="text-ink-3">{ROLE_LABEL[role]}</dt>
                <dd className="space-y-0.5">
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
        <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] leading-snug" data-quickstart>
          {start.map((r) => (
            <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className={link}>
              {r.title} ↗
            </a>
          ))}
        </p>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-3" data-checked-against>
          {impl.verified ? `Checked against ${words.docs} on ${impl.verified}` : `Mapping dated ${impl.asOf}; not yet re-checked component by component`}
          {/* Each named service, linked to the page it was checked against. */}
          {checked.length > 0 && ": "}
          {checked.map((b, i) => (
            <span key={b.block}>
              {i > 0 && " · "}
              <a href={b.url} target="_blank" rel="noreferrer" className="text-ink-2 hover:text-introduced hover:underline" data-checked-service={b.block}>
                {b.service}
              </a>
            </span>
          ))}
          .{" "}
          {own ? "Open-source projects change their defaults, editions and licences: follow the links before you build." : "Cloud services are renamed and reworked often: follow the links before you build."}
        </p>
      </div>
    </div>
  );
}
