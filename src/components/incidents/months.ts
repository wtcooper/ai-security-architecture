"use client";

/**
 * The feed as far back as the reader has it. A page is built with its newest days only; older
 * months load from /data/feed/<YYYY-MM>.json (written by the build) when the page wants them: when
 * the reader opens an older week, filters, asks for the next month or follows a link to an item
 * not loaded yet. Months are walked newest first, so what is loaded always runs unbroken from the
 * newest item back to `covered`. The feed page and the Incidents page's report list share this.
 */
import { useEffect, useMemo, useRef, useState } from "react";

import { fileHref } from "@/lib/routes";
import type { FeedIndex, FeedItem } from "@/lib/types";

/** One month of the feed, as the build wrote it. */
export async function fetchMonth(month: string): Promise<FeedItem[]> {
  const res = await fetch(fileHref(`/data/feed/${month}.json`));
  if (!res.ok) throw new Error(`${month}: ${res.status}`);
  return (await res.json()) as FeedItem[];
}

/**
 * How far back the reader has the whole feed: from `from` on (empty: all of it), and the month to
 * load next. Months are walked newest first; a month with no items has no file and nothing missing.
 */
export function coverage(index: Pick<FeedIndex, "months">, from: string, loaded: Set<string>): { from: string; next: string | null } {
  if (!from) return { from: "", next: null };
  let covered = from;
  for (const { month } of index.months) {
    if (`${month}-01` >= covered) continue;
    if (!loaded.has(month)) return { from: covered, next: month };
    covered = `${month}-01`;
  }
  return { from: "", next: null };
}

/** Whether everything dated `day` or later is in hand, given how far back the feed is loaded. */
export const isCovered = (covered: string, day: string) => !covered || covered <= day;

export interface FeedMonths<T> {
  /**
   * Everything loaded, newest first (ties as given): every item dated `covered` or later, and
   * whatever older items the page was built with (an item filed late, dated an older day).
   */
  items: T[];
  /** The first day from which every item is loaded; empty when the whole feed is. */
  covered: string;
  /** The month that loads next; null when the whole feed is in hand. */
  next: string | null;
  /** The month being loaded, or about to be. */
  loading: string | null;
  /** The month that failed to load, until the reader tries again. */
  failed: string | null;
  retry: () => void;
  /** Load the next month now. */
  loadNext: () => void;
}

export function useFeedMonths<T extends { id: string; date: string }>({
  whole,
  initial,
  from,
  index,
  loadMonth = fetchMonth,
  select,
  want,
}: {
  /** The whole feed, for a test: nothing is loaded later. */
  whole?: T[];
  /** What the page was built with: every item dated `from` or later. */
  initial: T[];
  from: string;
  index: Pick<FeedIndex, "months">;
  /** How a month is fetched; the build's file under /data/feed/ unless a test passes its own. */
  loadMonth?: (month: string) => Promise<FeedItem[]>;
  /** What the page keeps of a loaded month (the incidents only, say, cut down to what a row shows). */
  select: (items: FeedItem[]) => T[];
  /** Whether the page wants the month before what it has, given how far back that is and what is loaded. */
  want?: (covered: string, items: T[]) => boolean;
}): FeedMonths<T> {
  const [months, setMonths] = useState<Record<string, T[]>>({});
  const [failed, setFailed] = useState<string | null>(null);
  const [askedFor, setAskedFor] = useState<string | null>(null);
  const { from: covered, next } = whole ? { from: "", next: null } : coverage(index, from, new Set(Object.keys(months)));

  const items = useMemo(() => {
    const seen = new Set<string>();
    const all: T[] = [];
    for (const f of [...(whole ?? initial), ...Object.values(months).flat()]) {
      if (seen.has(f.id)) continue;
      seen.add(f.id);
      all.push(f);
    }
    const order = new Map(all.map((f, i) => [f.id, i]));
    return all.sort((a, b) => b.date.localeCompare(a.date) || order.get(a.id)! - order.get(b.id)!);
  }, [whole, initial, months]);

  const wanted = Boolean(next) && failed !== next && (askedFor === next || Boolean(want?.(covered, items)));
  const inflight = useRef<string | null>(null);
  useEffect(() => {
    if (!wanted || !next || inflight.current === next) return;
    inflight.current = next;
    loadMonth(next)
      .then(
        (list) => setMonths((m) => ({ ...m, [next]: select(list) })),
        () => setFailed(next),
      )
      .finally(() => {
        if (inflight.current === next) inflight.current = null;
      });
  }, [wanted, next, loadMonth, select]);

  return {
    items,
    covered,
    next,
    loading: wanted ? next : null,
    failed: next && failed === next ? failed : null,
    retry: () => setFailed(null),
    loadNext: () => {
      if (next) setAskedFor(next);
    },
  };
}
