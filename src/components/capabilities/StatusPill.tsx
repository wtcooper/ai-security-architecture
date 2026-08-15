import type { CapabilityStatus } from "@/lib/types";
import { STATUS_META, STATUS_STYLE } from "./status";

/** The status shown on its own, where there is no capability pill to tint. */
export function StatusPill({
  status,
  label = "short",
}: {
  status: CapabilityStatus;
  label?: "short" | "long";
}) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-[2px] text-[11.5px] font-semibold"
      style={{
        background: s.bg,
        borderColor: s.border,
        color: s.text,
        borderStyle: s.dashed ? "dashed" : "solid",
      }}
    >
      {label === "short" ? STATUS_META[status].short : STATUS_META[status].label}
    </span>
  );
}
