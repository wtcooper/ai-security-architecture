import { controlCategories, surfaces } from "@/lib/data";
import { NEUTRAL_STYLE, STATUS_META, STATUS_STYLE, type DisplayStatus } from "@/components/StatusPill";

export interface MatrixItem {
  id: string;
  title: string;
  placements: { category: string; surface: string }[];
}

export function DefenseMatrix({ items, selectedId, onSelect, category, surface, statusFor, orgNamesFor, label }: {
  items: MatrixItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  category: string;
  surface: string;
  statusFor?: (id: string, surface: string) => DisplayStatus;
  orgNamesFor?: (id: string, surface: string) => string | undefined;
  label: string;
}) {
  const columns = surfaces.filter((s) => !surface || s.id === surface);
  return <div className="overflow-x-auto rounded-xl border border-line bg-paper">
    <table aria-label={label} className="w-full min-w-[700px] table-fixed border-collapse text-left">
      <thead><tr className="bg-ink text-white">
        <th scope="col" className="w-[180px] px-4 py-3.5 text-sm">CoSAI control group</th>
        {columns.map((s) => <th scope="col" key={s.id} className="border-l border-white/10 px-4 py-3.5 text-sm">{s.title}</th>)}
      </tr></thead>
      <tbody>{controlCategories.filter((c) => !category || c.id === category).map((cat) => <tr key={cat.id} className="border-t border-line">
        <th scope="row" className="bg-[#fbfcfe] px-4 py-3.5 align-top text-xs font-bold">{cat.title}</th>
        {columns.map((s) => {
          const cell = items.filter((item) => item.placements.some((p) => p.category === cat.id && p.surface === s.id));
          return <td key={s.id} className="border-l border-line px-3 py-3 align-top">
            {cell.length ? <div className="flex flex-wrap gap-1.5">{cell.map((item) => {
              const active = item.id === selectedId;
              const status = statusFor?.(item.id, s.id);
              const tint = status ? STATUS_STYLE[status] : NEUTRAL_STYLE;
              const orgNames = orgNamesFor?.(item.id, s.id);
              return <span key={item.id} className="inline-flex max-w-full flex-col items-start gap-1">
                <button onClick={() => onSelect(item.id)} aria-pressed={active}
                title={`${item.title} (${item.id})${status ? ` — ${STATUS_META[status].label}` : ""}`}
                className="inline-flex rounded-full border px-2.5 py-[5px] text-left text-xs font-medium"
                style={{ background: tint.bg, color: tint.text, borderColor: active ? "var(--ink)" : tint.border, borderStyle: "dashed" in tint && tint.dashed ? "dashed" : "solid", boxShadow: active ? "0 0 0 1px var(--ink)" : undefined }}>
                {item.title}
                </button>
                {status && <span className="max-w-[240px] px-2 text-[10px] text-ink-3">{orgNames ? `${orgNames} · ` : ""}{STATUS_META[status].label}</span>}
              </span>;
            })}</div> : <span className="text-sm text-ink-3">—</span>}
          </td>;
        })}
      </tr>)}</tbody>
    </table>
  </div>;
}
