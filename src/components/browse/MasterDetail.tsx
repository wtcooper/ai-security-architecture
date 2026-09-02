"use client";

/**
 * The taxonomy pages' shared shape: a grouped list on the left that stays put, one full entry
 * on the right. Replaces the closed-accordion list, which showed thirty-six titles and asked
 * the reader to open each one to see anything it was related to. Selection lives in the URL
 * (`?risk=`, `?control=`) so every entry stays linkable.
 */
import { useEffect, useRef, type ReactNode } from "react";

export interface MasterGroup<T> {
  id: string;
  title: string;
  accent: string;
  items: T[];
}

export function MasterDetail<T extends { id: string; title: string }>({
  groups,
  selectedId,
  onSelect,
  meta,
  children,
}: {
  groups: MasterGroup<T>[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** One line under a list row. */
  meta?: (item: T) => ReactNode;
  /** The selected entry, rendered by the caller. */
  children: ReactNode;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  // Keep the selected row in view when it changes by deep link or keyboard.
  useEffect(() => {
    const row = listRef.current?.querySelector<HTMLElement>(`[data-id="${CSS.escape(selectedId)}"]`);
    if (!row || !listRef.current) return;
    const list = listRef.current.getBoundingClientRect();
    const r = row.getBoundingClientRect();
    if (r.top < list.top || r.bottom > list.bottom) row.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  const flat = groups.flatMap((g) => g.items);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const i = flat.findIndex((x) => x.id === selectedId);
    const next = flat[e.key === "ArrowDown" ? i + 1 : i - 1];
    if (next) onSelect(next.id);
  };

  return (
    <div className="mx-auto grid w-full max-w-[1400px] gap-6 px-6 py-8 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
      <div
        ref={listRef}
        onKeyDown={onKey}
        className="self-start rounded-xl border border-line bg-paper lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
      >
        {groups.map((g) => (
          <section key={g.id} className="border-b border-line last:border-b-0">
            <h2 className="flex items-center gap-2 px-4 pb-1.5 pt-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-2">
              <span className="h-2 w-2 rounded-full" style={{ background: g.accent }} aria-hidden />
              {g.title}
              <span className="font-normal text-ink-3">{g.items.length}</span>
            </h2>
            <ul className="px-2 pb-2">
              {g.items.map((item) => {
                const active = item.id === selectedId;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      data-id={item.id}
                      onClick={() => onSelect(item.id)}
                      aria-current={active ? "true" : undefined}
                      className={`block w-full rounded-md px-2.5 py-2 text-left transition-colors ${
                        active ? "bg-ink text-white" : "hover:bg-mist"
                      }`}
                    >
                      <span className={`block text-[13.5px] font-semibold leading-snug ${active ? "text-white" : "text-ink"}`}>
                        {item.title}
                      </span>
                      {meta && (
                        <span className={`mt-0.5 block text-[11.5px] leading-snug ${active ? "text-white/70" : "text-ink-3"}`}>
                          {meta(item)}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <article className="min-w-0 rounded-xl border border-line bg-paper p-7">{children}</article>
    </div>
  );
}

/** Selection resolved from a click, a deep link, or the first entry — and written back to the URL. */
export function useMasterSelection(
  param: string,
  linked: string | null,
  ids: string[],
  clicked: string | null,
): string {
  const selected = clicked ?? (linked && ids.includes(linked) ? linked : ids[0]);
  useEffect(() => {
    if (typeof window === "undefined" || !selected) return;
    window.history.replaceState(null, "", `?${param}=${selected}`);
  }, [param, selected]);
  return selected;
}
