import type { ReactNode } from "react";
import { controlCategories, surfaces } from "@/lib/data";

/** A row of the matrix: a NIST CSF category or a CoSAI control group. */
export interface MatrixRow {
  id: string;
  title: string;
  /** A short identifier shown beside the title, e.g. the CSF category id. */
  code?: string;
}
import { STATUS_META, STATUS_STYLE, type DisplayStatus } from "@/components/StatusPill";

/** A chip with no status set: unanswered, neutral. */
const NEUTRAL = { bg: "#f7f8fa", border: "#dfe4ec", text: "#5b6675" };

export interface MatrixItem {
  id: string;
  title: string;
  placements: { category: string; surface: string }[];
}

export function DefenseMatrix({ items, selectedId, onSelect, category, surface, statusFor, label, cellExtra, rows = controlCategories, rowHeader = "CoSAI control group" }: {
  items: MatrixItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  category: string;
  surface: string;
  statusFor?: (id: string) => DisplayStatus;
  label: string;
  /** What the rows are; CoSAI control groups unless told otherwise. */
  rows?: MatrixRow[];
  rowHeader?: string;
  /** Rendered under the chips of a non-empty cell, e.g. the mitigations those items implement. */
  cellExtra?: (category: string, surface: string, items: MatrixItem[]) => ReactNode;
}) {
  const columns = surfaces.filter((s) => !surface || s.id === surface);
  return <div className="overflow-x-auto rounded-xl border border-line bg-paper">
    <table aria-label={label} className="w-full min-w-[700px] table-fixed border-collapse text-left">
      <thead><tr className="bg-ink text-white">
        <th scope="col" className="w-[200px] px-4 py-3.5 text-sm">{rowHeader}</th>
        {columns.map((s) => <th scope="col" key={s.id} className="border-l border-white/10 px-4 py-3.5 text-sm">{s.title}</th>)}
      </tr></thead>
      <tbody>{rows.filter((c) => !category || c.id === category).map((cat) => <tr key={cat.id} className="border-t border-line">
        <th scope="row" className="bg-[#fbfcfe] px-4 py-3.5 align-top text-xs font-bold">{cat.title}</th>
        {columns.map((s) => {
          const cell = items.filter((item) => item.placements.some((p) => p.category === cat.id && p.surface === s.id));
          return <td key={s.id} className="border-l border-line px-3 py-3 align-top">
            {cell.length ? <div className="flex flex-wrap gap-1.5">{cell.map((item) => {
              const active = item.id === selectedId;
              const status = statusFor?.(item.id);
              const tint = status && status !== "notSet" ? STATUS_STYLE[status] : NEUTRAL;
              return <button key={item.id} onClick={() => onSelect(item.id)} aria-pressed={active}
                title={`${item.title}${status && status !== "notSet" ? ` — ${STATUS_META[status].label}` : ""}`}
                className="inline-flex rounded-full border px-2.5 py-[5px] text-left text-xs font-medium"
                style={{ background: tint.bg, color: tint.text, borderColor: active ? "var(--ink)" : tint.border, boxShadow: active ? "0 0 0 1px var(--ink)" : undefined }}>
                {item.title}
              </button>;
            })}</div> : <span className="text-sm text-ink-3">—</span>}
            {cell.length > 0 && cellExtra?.(cat.id, s.id, cell)}
          </td>;
        })}
      </tr>)}</tbody>
    </table>
  </div>;
}
