"use client";

import { useCallback, useSyncExternalStore } from "react";
import { stringify } from "yaml";
import { capabilities, dataset, surfaces } from "@/lib/data";
import type { Capability, CapabilityStatus } from "@/lib/types";

/**
 * Per-browser posture overrides for the capability matrix. The shipped dataset never sets a
 * status — a team maps its own posture here, and the export below produces a
 * capabilities.yaml a fork can commit, at which point the statuses ship in the dataset
 * itself. The exported file must round-trip through `npm run data` unchanged.
 */
export type StatusOverrides = Record<string, Record<string, CapabilityStatus | null>>;

const STORAGE_KEY = "capabilityStatus.v1";
const EMPTY: StatusOverrides = {};

/**
 * Nothing ships assessed. The repository maps what the taxonomy covers, never what any
 * organisation has deployed, so every capability starts blank and a team fills it in through
 * the edit pane or commits its own answers in a fork.
 */
export const DEFAULT_STATUS: CapabilityStatus = "needsAssessment";

// A tiny external store keeps localStorage reads out of render effects: the server snapshot
// is empty, the client snapshot hydrates lazily, and every write notifies subscribers.
let cache: StatusOverrides | null = null;
const listeners = new Set<() => void>();

function snapshot(): StatusOverrides {
  if (cache === null) {
    try {
      cache = (JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") ??
        EMPTY) as StatusOverrides;
    } catch {
      cache = EMPTY;
    }
  }
  return cache;
}

function write(next: StatusOverrides) {
  cache = next;
  try {
    if (Object.keys(next).length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage may be unavailable (private mode); edits still live for the session.
  }
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useStatusOverrides() {
  const overrides = useSyncExternalStore(subscribe, snapshot, () => EMPTY);

  const set = useCallback(
    (capabilityId: string, surfaceId: string, status: CapabilityStatus | null) => {
      const current = snapshot();
      write({ ...current, [capabilityId]: { ...current[capabilityId], [surfaceId]: status } });
    },
    [],
  );

  const reset = useCallback(() => write(EMPTY), []);

  const effective = useCallback(
    (capability: Capability, surfaceId: string): CapabilityStatus =>
      overrides[capability.id]?.[surfaceId] ??
      capability.surfaces[surfaceId]?.status ??
      DEFAULT_STATUS,
    [overrides],
  );

  const hasEdits = Object.values(overrides).some((s) => Object.values(s).some((v) => v != null));

  return { overrides, set, reset, effective, hasEdits };
}

/** Rebuild the capabilities overlay document with the edited statuses merged in. */
export function exportYaml(overrides: StatusOverrides) {
  const doc = {
    attribution: dataset.capabilitiesAttribution,
    surfaces,
    capabilities: capabilities.map((cap) => ({
      ...cap,
      surfaces: Object.fromEntries(
        Object.entries(cap.surfaces).map(([surfaceId, info]) => {
          const rest: typeof info = { ...info };
          delete rest.status;
          // Surfaces the capability cannot reach carry no posture to record, and an
          // unassessed surface writes nothing — the file should hold the answers given, not a
          // wall of placeholders for the ones that were not.
          if (!info.applies) return [surfaceId, rest];
          const status = overrides[cap.id]?.[surfaceId] ?? info.status;
          return status && status !== DEFAULT_STATUS
            ? [surfaceId, { ...rest, status }]
            : [surfaceId, rest];
        }),
      ),
    })),
  };

  const header =
    "# Technology-capability taxonomy with posture statuses exported from the Capabilities\n" +
    "# tab. Drop into data/overlay/capabilities.yaml in your fork and run `npm run data`.\n";
  const blob = new Blob([header + stringify(doc)], { type: "text/yaml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "capabilities.yaml";
  a.click();
  URL.revokeObjectURL(url);
}

export const STATUS_META: Record<CapabilityStatus, { label: string; short: string }> = {
  needsAssessment: { label: "Needs assessed", short: "Needs assessed" },
  inPlace: { label: "In place", short: "In place" },
  partial: { label: "Partial coverage", short: "Partial" },
  gap: { label: "Gap — not deployed", short: "Gap" },
};

/**
 * Status is carried by the capability pill itself. Tints stay pale so a wall of them reads as
 * a matrix rather than a traffic light; the text colour does the work. The shipped state is
 * neutral — the matrix should look unanswered until someone answers it.
 */
export const STATUS_STYLE: Record<
  CapabilityStatus,
  { bg: string; border: string; text: string; dashed?: boolean }
> = {
  needsAssessment: { bg: "#f7f8fa", border: "#dfe4ec", text: "#5b6675" },
  inPlace: { bg: "#e8f6ef", border: "#a7dcc4", text: "#06845a" },
  partial: { bg: "#fdf3e4", border: "#eecfa3", text: "#b45309" },
  gap: { bg: "#fdeadf", border: "#f0c1a3", text: "#c2410c", dashed: true },
};
