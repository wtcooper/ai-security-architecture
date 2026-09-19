import { STATUS_META, STATUS_STYLE } from "@/components/StatusPill";
import type { Coverage } from "./model";

const ORDER = ["enabled", "inProgress", "gap", "notAssessed"] as const;

/**
 * One group's coverage as a segmented bar: the organisation's status counts in the same tints
 * the tiles carry, so a column or layer summarises at a glance. Rendered only with the overlay on.
 */
export function CoverageBar({ coverage, className = "" }: { coverage: Coverage; className?: string }) {
  if (!coverage.total) return null;
  const parts = ORDER.filter((s) => coverage[s] > 0);
  return (
    <div className={className} title={parts.map((s) => `${coverage[s]} ${STATUS_META[s].label.toLowerCase()}`).join(" · ")}>
      <div className="flex h-[6px] w-full overflow-hidden rounded-full border border-line bg-mist">
        {parts.map((s) => (
          <span key={s} className="h-full" style={{ width: `${(coverage[s] / coverage.total) * 100}%`, background: STATUS_STYLE[s].text, opacity: s === "notAssessed" ? 0.25 : 0.85 }} />
        ))}
      </div>
      <p className="mt-1 flex flex-wrap gap-x-2 text-[10.5px] leading-tight text-ink-3">
        {parts.map((s) => (
          <span key={s}>
            <span className="font-semibold" style={{ color: STATUS_STYLE[s].text }}>{coverage[s]}</span> {SHORT[s]}
          </span>
        ))}
      </p>
    </div>
  );
}

const SHORT: Record<(typeof ORDER)[number], string> = { enabled: "enabled", inProgress: "partial", gap: "gap", notAssessed: "not assessed" };
