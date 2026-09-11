import { ORG_STATUSES, type OrgStatus } from "@/lib/types";

/**
 * The organisation's status vocabulary, one set of words and tints everywhere it renders:
 * a capability on a surface, a tool the organisation runs, and a control inside that tool.
 * Nothing carries a status until the viewer switches "Show status" on; then everything has
 * one, and anything the organisation has not recorded is a gap.
 */
export const STATUS_META: Record<OrgStatus, { label: string; blurb: string }> = {
  enabled: { label: "Enabled", blurb: "In place and switched on." },
  inProgress: { label: "In progress", blurb: "Partly in place, or being rolled out." },
  gap: { label: "Gap", blurb: "Not in place, or not recorded — which reads as a gap." },
};

/** Pale tints so a wall of pills reads as a matrix; the text colour does the work. */
export const STATUS_STYLE: Record<OrgStatus, { bg: string; border: string; text: string; dashed?: boolean }> = {
  enabled: { bg: "#e8f6ef", border: "#a7dcc4", text: "#06845a" },
  inProgress: { bg: "#fdf3e4", border: "#eecfa3", text: "#b45309" },
  gap: { bg: "#fdeadf", border: "#f0c1a3", text: "#c2410c", dashed: true },
};

/**
 * The same three states said as availability, for a product rather than a control: the
 * question a reader asks of a tool is "can I use it here", not "is this control in place".
 */
export const TOOL_STATUS_LABEL: Record<OrgStatus, string> = {
  enabled: "Available",
  inProgress: "Rolling out",
  gap: "Not available",
};

/** How a capability pill looks with status off: unanswered, neutral. */
export const NEUTRAL_STYLE = { bg: "#f7f8fa", border: "#dfe4ec", text: "#5b6675" };

export { ORG_STATUSES };

export function StatusPill({
  status,
  title,
  label,
  compact = false,
}: {
  status: OrgStatus;
  title?: string;
  /** Overrides the control wording, e.g. TOOL_STATUS_LABEL for a product. */
  label?: string;
  compact?: boolean;
}) {
  const s = STATUS_STYLE[status];
  return (
    <span
      title={title ?? STATUS_META[status].blurb}
      className={`inline-flex items-center whitespace-nowrap rounded-full border font-semibold ${
        compact ? "px-1.5 py-px text-[10.5px]" : "px-2 py-[2px] text-[11.5px]"
      }`}
      style={{ background: s.bg, borderColor: s.border, color: s.text, borderStyle: s.dashed ? "dashed" : "solid" }}
    >
      {label ?? STATUS_META[status].label}
    </span>
  );
}
