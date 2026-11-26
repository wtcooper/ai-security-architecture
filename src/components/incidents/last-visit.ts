"use client";

/**
 * "N new since your last visit" on the feed. The reader's last visit is remembered in this
 * browser only (localStorage): the ids of the items the feed held then, among those filed (their
 * `added`) from a day on. An item is new when it was filed since then and was not among them,
 * whatever its `date`, so an item found late and dated an older day is still new to the reader.
 * Reloading within an hour is the same visit and keeps the marks.
 *
 * Every read and write is wrapped: with storage blocked, full or absent (a private window, a
 * test, the server), the feed simply marks nothing.
 */
import { useEffect, useSyncExternalStore } from "react";

import type { FeedItem } from "@/lib/types";

const KEY = "ai-security-architecture:feed-last-visit";
/** Reloads within this long are one visit. */
export const VISIT_MS = 60 * 60 * 1000;
/** Only the items filed within this many days of the newest are remembered; older ones are never new. */
export const REMEMBERED_DAYS = 60;

/** One visit: when, and the items the feed held then (those filed, by `added`, on `from` or later). */
export interface Visit {
  at: number;
  from: string;
  seen: string[];
}

interface Stored {
  /** The visit under way, or the last one. */
  last: Visit;
  /** The visit before it: what "new" is measured against while `last` is still under way. */
  before: Visit | null;
}

/** What "new" is measured against on this visit, and what to keep when the visit is recorded. */
export interface VisitState {
  /** False on the server and before the browser has been asked. */
  ready: boolean;
  /** The reader's previous visit; null on a first visit or without storage. */
  previous: Visit | null;
}

const isVisit = (v: unknown): v is Visit => {
  const x = v as Visit | null;
  return Boolean(x) && typeof x!.at === "number" && typeof x!.from === "string" && Array.isArray(x!.seen) && x!.seen.every((s) => typeof s === "string");
};

function read(): Stored | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!isVisit(parsed?.last)) return null;
    return { last: parsed.last, before: isVisit(parsed.before) ? parsed.before : null };
  } catch {
    return null;
  }
}

/** The visit to measure against: the last one, unless the last one is still under way. */
export function previousVisit(stored: Stored | null, now: number): Visit | null {
  if (!stored) return null;
  return now - stored.last.at < VISIT_MS ? stored.before : stored.last;
}

/** The items that are new since a visit: filed since what it remembered, and not among those it saw. */
export function newSince(items: Pick<FeedItem, "id" | "added">[], previous: Visit | null): Set<string> {
  if (!previous) return new Set();
  const seen = new Set(previous.seen);
  return new Set(items.filter((f) => f.added >= previous.from && !seen.has(f.id)).map((f) => f.id));
}

/**
 * This visit, as it will be remembered: the items filed within REMEMBERED_DAYS of the newest
 * filing day. The page is built with the items filed in its newest days and loads older months as
 * the reader goes, so `loadedFrom` says from which filing day on every item was in front of the
 * reader; nothing filed earlier is remembered, so nothing filed earlier is new next time.
 */
export function visitOf(items: Pick<FeedItem, "id" | "added">[], now: number, loadedFrom = ""): Visit {
  const newest = items.reduce((d, f) => (f.added > d ? f.added : d), "");
  let from = "";
  if (newest) {
    const day = new Date(`${newest}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() - REMEMBERED_DAYS);
    from = day.toISOString().slice(0, 10);
  }
  if (loadedFrom > from) from = loadedFrom;
  return { at: now, from, seen: items.filter((f) => f.added >= from).map((f) => f.id) };
}

// Asked once per page load, so a re-render or a return to the feed keeps the same marks.
let asked: VisitState | undefined;
const SERVER: VisitState = { ready: false, previous: null };
const subscribe = () => () => {};
const snapshot = (): VisitState => (asked ??= { ready: true, previous: previousVisit(read(), Date.now()) });

/** The reader's previous visit, then this one remembered. Server and tests see `ready: false`. */
export function useLastVisit(items: FeedItem[], loadedFrom = ""): VisitState {
  const state = useSyncExternalStore(subscribe, snapshot, () => SERVER);
  const ids = items.map((f) => f.id).join(" ");
  useEffect(() => {
    if (!state.ready) return;
    try {
      const stored = read();
      const now = Date.now();
      // While a visit is under way, the one before it is kept as what "new" is measured against.
      const before = stored && now - stored.last.at < VISIT_MS ? stored.before : (stored?.last ?? null);
      // What this visit saw is every item filed from `loadedFrom` on, which the page was built with.
      window.localStorage.setItem(KEY, JSON.stringify({ last: visitOf(items, now, loadedFrom), before } satisfies Stored));
    } catch {
      // No storage: nothing is remembered, and the next visit marks nothing.
    }
    // The ids stand for the items: a new array of the same reports is the same visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, ids, loadedFrom]);
  return state;
}
