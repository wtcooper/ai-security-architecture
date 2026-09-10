"use client";

/**
 * Tools side by side on one architecture: rows are the capabilities pinned on it (the
 * reference control set), columns are the tools that instantiate it. A cell shows the
 * vendor's coverage as a glyph and the organisation's status as its tint — the leadership
 * question, "which variants have which controls, and where are we", on one screen.
 */
import { STATUS_STYLE } from "@/components/capabilities/status";
import { archetypeById, capabilitiesForArchetype, orgStatusFor, vendorById } from "@/lib/data";
import { orgEntriesFor } from "@/lib/frameworks";
import type { Tool } from "@/lib/types";
import { COVERAGE_META, ORG_STATUS_LABEL } from "./labels";

export function CompareMatrix({
  archetypeId,
  tools,
  onSelect,
}: {
  archetypeId: string;
  tools: Tool[];
  onSelect: (toolId: string, capabilityId?: string) => void;
}) {
  const archetype = archetypeById.get(archetypeId);
  const rows = capabilitiesForArchetype(archetypeId);
  if (!archetype) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-paper">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="bg-mist">
            <th className="sticky left-0 z-10 min-w-[240px] border-b border-line bg-mist px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-2">
              Reference control · {archetype.abbrev ?? archetype.title}
            </th>
            {tools.map((t) => (
              <th key={t.id} className="min-w-[112px] border-b border-l border-line px-2 py-2 text-left align-bottom">
                <button
                  type="button"
                  onClick={() => onSelect(t.id)}
                  className="text-left text-[12px] font-semibold leading-tight text-ink hover:text-introduced hover:underline"
                >
                  {t.name}
                </button>
                <span className="mt-0.5 block text-[10.5px] font-medium text-ink-3">
                  {vendorById.get(t.vendor)?.name ?? t.vendor}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cap, i) => {
            const orgIds = orgEntriesFor("capabilities", cap.id);
            return (
              <tr key={cap.id} className="border-t border-line">
                <td className="sticky left-0 z-10 border-r border-line bg-paper px-3 py-1.5 align-middle">
                  <span className="mr-1.5 inline-flex h-[16px] w-[16px] items-center justify-center rounded-full border border-introduced bg-introduced-soft text-[9px] font-bold text-introduced">
                    {i + 1}
                  </span>
                  <span className="font-medium text-ink" title={cap.title}>
                    {cap.abbrev ?? cap.title}
                  </span>
                  {orgIds.length > 0 && (
                    <span className="ml-1.5 text-[10.5px] text-ink-3" title={orgIds.map((o) => `${o.id} ${o.label}`).join("\n")}>
                      {orgIds.map((o) => o.id).join(" · ")}
                    </span>
                  )}
                </td>
                {tools.map((t) => {
                  const control = t.controls.find((c) => c.capability === cap.id);
                  const status = orgStatusFor(t.id, cap.id);
                  const cov = control ? COVERAGE_META[control.coverage] : null;
                  const style = status ? STATUS_STYLE[status.status] : null;
                  const title = [
                    `${t.name} · ${cap.title}`,
                    cov ? `Vendor: ${cov.label}${control?.mechanism ? ` — ${control.mechanism}` : ""}` : "Vendor: not assessed",
                    status ? `Status: ${ORG_STATUS_LABEL[status.status]}${status.note ? ` — ${status.note}` : ""}` : "Status: —",
                  ].join("\n");
                  return (
                    <td key={t.id} className="border-l border-line p-0 align-middle">
                      <button
                        type="button"
                        onClick={() => onSelect(t.id, cap.id)}
                        title={title}
                        className="flex h-full w-full items-center gap-1.5 px-2 py-1.5 text-left hover:brightness-95"
                        style={style ? { background: style.bg, color: style.text } : undefined}
                      >
                        <span className={`w-3 text-center text-[13px] ${cov ? "text-ink" : "text-ink-3"}`}>
                          {cov ? cov.glyph : "·"}
                        </span>
                        <span className="truncate text-[10.5px] font-medium">
                          {status ? ORG_STATUS_LABEL[status.status] : cov ? cov.label : ""}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
