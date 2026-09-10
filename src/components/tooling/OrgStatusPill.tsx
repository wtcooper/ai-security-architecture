import { STATUS_STYLE } from "@/components/capabilities/status";
import type { CapabilityStatus } from "@/lib/types";
import { ORG_STATUS_LABEL } from "./labels";

/** The organisation's status on one tool × capability, in the same tints the matrix uses. */
export function OrgStatusPill({
  status,
  title,
  compact = false,
}: {
  status: CapabilityStatus;
  title?: string;
  compact?: boolean;
}) {
  const s = STATUS_STYLE[status];
  return (
    <span
      title={title}
      className={`inline-flex items-center whitespace-nowrap rounded-full border font-semibold ${
        compact ? "px-1.5 py-px text-[10.5px]" : "px-2 py-[2px] text-[11.5px]"
      }`}
      style={{
        background: s.bg,
        borderColor: s.border,
        color: s.text,
        borderStyle: s.dashed ? "dashed" : "solid",
      }}
    >
      {ORG_STATUS_LABEL[status]}
    </span>
  );
}
