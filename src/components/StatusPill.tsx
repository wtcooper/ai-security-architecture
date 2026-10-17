import { STATUSES, type DisplayStatus } from "@/lib/types";

/**
 * The organisation's status vocabulary, one set of words and tints everywhere it renders. Status
 * comes from data/status.yaml; anything not listed there reads "Not set".
 */
export type { DisplayStatus } from "@/lib/types";

export const STATUS_META: Record<DisplayStatus, { label: string; blurb: string }> = {
  enabled: { label: "Enabled", blurb: "In place and switched on." },
  inProgress: { label: "In progress", blurb: "Partly in place, or still being rolled out." },
  gap: { label: "Gap", blurb: "An identified shortfall." },
  notSet: { label: "Not set", blurb: "No status recorded in data/status.yaml." },
};

/** Pale tints so a column of pills stays quiet; the text colour does the work. */
export const STATUS_STYLE: Record<DisplayStatus, { bg: string; border: string; text: string }> = {
  enabled: { bg: "#e8f6ef", border: "#a7dcc4", text: "#06845a" },
  inProgress: { bg: "#fef8dc", border: "#ecd58a", text: "#a16207" },
  gap: { bg: "#fdeadf", border: "#f0c1a3", text: "#c2410c" },
  notSet: { bg: "transparent", border: "transparent", text: "#8792a2" },
};

export { STATUSES };

/** What the ⓘ beside every Status heading says. */
export const STATUS_HELP =
  "Status is set by your organisation in data/status.yaml: Enabled, In progress or Gap for each capability. " +
  "The same file can rename any capability to what your organisation calls it; the catalogue name stays beneath. " +
  "Control status rolls up from its capabilities.";

export function StatusPill({
  status,
  title,
  compact = false,
}: {
  status: DisplayStatus;
  title?: string;
  compact?: boolean;
}) {
  const s = STATUS_STYLE[status];
  return (
    <span
      title={title ?? STATUS_META[status].blurb}
      className={`inline-flex items-center whitespace-nowrap rounded-full border font-semibold ${
        compact ? "px-1.5 py-px text-[10.5px]" : "px-2 py-[2px] text-[11.5px]"
      } ${status === "notSet" ? "!font-normal" : ""}`}
      style={{ background: s.bg, borderColor: s.border, color: s.text }}
    >
      {STATUS_META[status].label}
    </span>
  );
}

/** A "Status ⓘ" column heading: the ⓘ explains where status and custom names come from. */
export function StatusHeading({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      Status
      <InfoTip text={STATUS_HELP} />
    </span>
  );
}

/** A small ⓘ that shows its text on hover or focus. */
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex normal-case tracking-normal">
      <button
        type="button"
        aria-label={text}
        className="flex h-[15px] w-[15px] items-center justify-center rounded-full border border-current text-[9.5px] font-bold leading-none opacity-60 hover:opacity-100 focus:opacity-100"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-[calc(100%+6px)] z-30 hidden w-[280px] rounded-lg border border-line bg-paper p-3 text-left text-[12px] font-normal leading-snug text-ink-2 shadow-lg group-hover:block group-focus-within:block"
      >
        {text}
      </span>
    </span>
  );
}
