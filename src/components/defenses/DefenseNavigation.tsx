"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { controlCategories, surfaces } from "@/lib/data";

export function matrixHref(path: string, category: string, surface: string) {
  const params = new URLSearchParams();
  if (category) params.set("group", category);
  if (surface) params.set("surface", surface);
  return path + (params.size ? `?${params}` : "");
}

export function useMatrixFilters() {
  const params = useSearchParams();
  return {
    category: controlCategories.find((c) => c.id === params.get("group"))?.id ?? "",
    surface: surfaces.find((s) => s.id === params.get("surface"))?.id ?? "",
  };
}

/** Keep selected items bookmarkable and responsive to browser back/forward navigation. */
export function useDefenseSelection(kind: "capability" | "mitigation") {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const select = (id: string | null) => {
    const next = new URLSearchParams(params.toString());
    next.delete("capability");
    next.delete("mitigation");
    if (id) next.set(kind, id);
    const destination = kind === "mitigation" ? "/mitigations" : pathname;
    router.replace(`${destination}${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  return [params.get(kind), select] as const;
}

export function DefenseNavigation({ current }: { current: "mitigations" | "capabilities" }) {
  const { category, surface } = useMatrixFilters();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  return <div className="mt-5 space-y-4">
    <nav aria-label="Defense matrices" className="flex flex-wrap gap-2">
      {(["mitigations", "capabilities"] as const).map((kind) => <Link key={kind} href={matrixHref(`/${kind}`, category, surface)} aria-current={current === kind ? "page" : undefined}
        className={`rounded-full border px-4 py-2 text-sm font-semibold ${current === kind ? "border-ink bg-ink text-white" : "border-line text-ink-2 hover:border-ink"}`}>
        {kind === "mitigations" ? "Mitigations" : "Technology capabilities"}
      </Link>)}
    </nav>
    <div className="flex flex-wrap gap-4">
      <label className="text-xs text-ink-2">CoSAI control group
        <select value={category} onChange={(e) => update("group", e.target.value)} className="mt-1 block rounded-md border border-line bg-paper px-3 py-2 text-sm">
          <option value="">All control groups</option>{controlCategories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </label>
      <label className="text-xs text-ink-2">Deployment surface
        <select value={surface} onChange={(e) => update("surface", e.target.value)} className="mt-1 block rounded-md border border-line bg-paper px-3 py-2 text-sm">
          <option value="">All surfaces</option>{surfaces.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </label>
    </div>
  </div>;
}
