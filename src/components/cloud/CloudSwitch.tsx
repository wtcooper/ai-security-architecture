"use client";

/**
 * The one switch for how a pattern is shown: cloud-neutral, or as built on one cloud. Choosing a
 * cloud names each component's service on the drawing and lists that cloud's own control
 * options beside every control. It appears above the drawing and again on Enable; both are the
 * same state.
 */
import type { CloudProduct } from "./model";

export function CloudSwitch({
  products,
  cloud,
  onCloud,
  label = "Built on",
  size = "md",
}: {
  products: CloudProduct[];
  /** The chosen cloud's id, or null for the cloud-neutral pattern. */
  cloud: string | null;
  onCloud: (cloudId: string | null) => void;
  label?: string;
  size?: "md" | "sm";
}) {
  if (!products.length) return null;
  const options = [{ id: null as string | null, label: "Generic", title: "The cloud-neutral pattern" }, ...products.map((p) => ({ id: p.id, label: p.cloud.short, title: `As built on ${p.cloud.name}` }))];
  const pad = size === "md" ? "px-3.5 py-1.5 text-[13px]" : "px-2.5 py-1 text-[12px]";
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5" data-cloud-switch>
      <span className={`font-semibold text-ink ${size === "md" ? "text-[13px]" : "text-[12px]"}`}>{label}</span>
      <div className="flex gap-1 rounded-lg border border-line bg-paper p-1" role="group" aria-label={label}>
        {options.map((o) => {
          const on = o.id === cloud;
          return (
            <button
              key={o.label}
              type="button"
              aria-pressed={on}
              title={o.title}
              data-cloud={o.id ?? "generic"}
              onClick={() => onCloud(o.id)}
              className={`whitespace-nowrap rounded-md font-semibold transition-colors ${pad} ${on ? "bg-ink text-white" : "text-ink-2 hover:bg-mist hover:text-ink"}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
