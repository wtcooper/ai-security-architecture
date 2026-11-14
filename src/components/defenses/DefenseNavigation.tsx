"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { surfaces } from "@/lib/data";
import { GROUPING_META, type Grouping } from "./model";

export function matrixHref(path: string, category: string, surface: string) {
  const params = new URLSearchParams();
  if (category) params.set("group", category);
  if (surface) params.set("surface", surface);
  return path + (params.size ? `?${params}` : "");
}

export function useMatrixFilters() {
  const params = useSearchParams();
  const by: Grouping = params.get("by") === "cosai" ? "cosai" : "csf";
  return {
    by,
    category: GROUPING_META[by].rows.find((c) => c.id === params.get("group"))?.id ?? "",
    surface: surfaces.find((s) => s.id === params.get("surface"))?.id ?? "",
  };
}

/** Keep the selected control bookmarkable and responsive to browser back/forward navigation. */
export function useDefenseSelection() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const select = (id: string | null) => {
    const next = new URLSearchParams(params.toString());
    next.delete("control");
    if (id) next.set("control", id);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  return [params.get("control"), select] as const;
}

export function CapabilityFilters() {
  const { by, category, surface } = useMatrixFilters();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value); else next.delete(key);
    }
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  const meta = GROUPING_META[by];
  return <div className="mt-5 space-y-4">
    <div className="flex flex-wrap items-end gap-4">
      <div className="text-xs text-ink-2" role="group" aria-label="Group rows by">Group rows by
        <div className="mt-1 flex gap-1">
          {(Object.keys(GROUPING_META) as Grouping[]).map((g) => (
            <button key={g} type="button" aria-pressed={by === g}
              // A row filter belongs to its grouping, so switching the grouping clears it.
              onClick={() => update({ by: g === "csf" ? "" : g, group: "" })}
              className={`rounded-md border px-3 py-2 text-sm font-medium ${by === g ? "border-ink bg-ink text-white" : "border-line bg-paper text-ink-2 hover:border-ink-3"}`}>
              {GROUPING_META[g].label}
            </button>
          ))}
        </div>
      </div>
      <label className="text-xs text-ink-2">{meta.rowHeader}
        <select value={category} onChange={(e) => update({ group: e.target.value })} className="mt-1 block max-w-[260px] rounded-md border border-line bg-paper px-3 py-2 text-sm">
          <option value="">All</option>{meta.rows.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </label>
      <label className="text-xs text-ink-2">Deployment surface
        <select value={surface} onChange={(e) => update({ surface: e.target.value })} className="mt-1 block rounded-md border border-line bg-paper px-3 py-2 text-sm">
          <option value="">All surfaces</option>{surfaces.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </label>
    </div>
  </div>;
}
