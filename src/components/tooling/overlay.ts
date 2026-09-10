"use client";

/**
 * The organisation overlay: one switch that decides whether anything from data/org is drawn —
 * status pills, adoption, the organisation's control ids beside CoSAI names. Off, every page is
 * the general-purpose reference: the controls a category needs, the vendors' variants, what
 * each vendor lets an administrator switch on, and the official page for each. On, the same
 * pages gain the organisation's answers. Defaults on when an adopter's data/org/local exists
 * and off on the shipped example, and remembers the viewer's choice in this browser.
 */
import { useSyncExternalStore } from "react";

import { org } from "@/lib/data";

const KEY = "orgOverlay.v1";
const DEFAULT = !org.example;
let cache: boolean | null = null;
const listeners = new Set<() => void>();

const read = (): boolean => {
  if (cache !== null) return cache;
  try {
    const raw = typeof window === "undefined" ? null : window.localStorage.getItem(KEY);
    cache = raw === null ? DEFAULT : raw === "1";
  } catch {
    cache = DEFAULT;
  }
  return cache;
};

export const useOrgOverlay = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => DEFAULT,
  );

export function setOrgOverlay(value: boolean) {
  cache = value;
  try {
    window.localStorage.setItem(KEY, value ? "1" : "0");
  } catch {
    /* private mode */
  }
  for (const cb of listeners) cb();
}

/** What the switch is called, honestly: the example profile is never anyone's posture. */
export const overlayLabel = () => (org.example ? "Example organisation overlay" : `${org.shortName ?? org.name} overlay`);
