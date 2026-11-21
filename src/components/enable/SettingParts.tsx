/**
 * The pieces every view of a setting shares, so a recommended value reads the same wherever it
 * appears: as a value to set, tinted, with the default beside it and the sentence that says how
 * to apply it underneath only when there is more to say than the value.
 */
import type { ProductSetting } from "@/lib/types";
import { SETTING_VIA_META } from "./labels";

/** The recommended value in a few words, and how to apply it where that takes a sentence. */
export function recommendedOf(s: ProductSetting): { value: string | null; how: string | null } {
  const rec = s.recommended.trim();
  if (s.value?.trim()) return { value: s.value.trim(), how: rec.toLowerCase() === s.value.trim().toLowerCase() ? null : rec };
  return rec.length <= 70 ? { value: rec, how: null } : { value: null, how: rec };
}

/** The value to set, tinted so it is never mistaken for the default. */
export function ValueChip({ text }: { text: string }) {
  return (
    <span className="inline-block rounded border border-[#a7dcc4] bg-[#e8f6ef] px-1.5 py-px text-[12px] font-semibold leading-snug text-[#06644a]" data-recommended-value>
      {text}
    </span>
  );
}

/** Recommended value, then the default, then how to apply it: the cell a settings table shows. */
export function Recommended({ setting, why = true }: { setting: ProductSetting; why?: boolean }) {
  const { value, how } = recommendedOf(setting);
  return (
    <div className="min-w-0 text-[12.5px] leading-snug" data-setting-value>
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-3">Set to</span>
        {value ? <ValueChip text={value} /> : <span className="font-semibold text-ink">{how}</span>}
        {setting.default && (
          <span className="text-[11.5px] text-ink-3" data-setting-default>
            default: {setting.default}
          </span>
        )}
      </p>
      {value && how && <p className="mt-0.5 text-ink">{how}</p>}
      {why && <p className="mt-0.5 text-ink-2">{setting.why}</p>}
    </div>
  );
}

/** How a setting is set: MDM, admin console, config file and so on. */
export function SetVia({ setting }: { setting: ProductSetting }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {setting.setVia.map((v) => (
        <span key={v} title={SETTING_VIA_META[v].blurb} className="rounded border border-line bg-mist px-1.5 py-px text-[10.5px] font-semibold text-ink-2">
          {SETTING_VIA_META[v].label}
        </span>
      ))}
    </span>
  );
}

/** The setting's name, linked to the vendor's page for it. */
export function SettingLink({ setting }: { setting: ProductSetting }) {
  return (
    <a href={setting.url} target="_blank" rel="noreferrer" className="font-semibold text-ink hover:text-introduced hover:underline" title="The vendor's page for this setting">
      {setting.name} <span className="text-introduced">↗</span>
    </a>
  );
}

/** One setting in a few lines: its name and page, how it is set, where, and the value to set. */
export function SettingCard({ setting, tag }: { setting: ProductSetting; tag?: string }) {
  return (
    <div className="rounded-lg border border-line bg-paper px-3 py-2.5" data-setting-card={setting.id}>
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] leading-snug">
        <SettingLink setting={setting} />
        {tag && <span className="rounded border border-line bg-mist px-1.5 py-px text-[10.5px] font-semibold text-ink-2">{tag}</span>}
        <SetVia setting={setting} />
      </p>
      <p className="ident mt-0.5 break-words text-[10.5px] leading-snug text-ink-3">{setting.where}</p>
      <div className="mt-1.5">
        <Recommended setting={setting} />
      </div>
      {setting.requires && <p className="mt-1 text-[11.5px] text-ink-3">Requires {setting.requires}</p>}
    </div>
  );
}
