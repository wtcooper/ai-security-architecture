import type { ToolControl as CurrentToolControl, OrgOrgStatus } from "../../src/lib/types";

export type LegacyToolControl = Omit<CurrentToolControl, "mitigation"> & { capability: string };
type ToolControl = LegacyToolControl;

export interface MigrationRule { targets: string[]; reviewRequired: boolean; reason: string }
export type MigrationRules = Record<string, MigrationRule>;
const unique = <T,>(values: T[]): T[] => [...new Set(values)];
const reviewNote = "Capability scope changed: reassess this function. Retained configuration and evidence describe the former capability, not verified coverage of every replacement.";

export function migrateToolControls(rows: ToolControl[], rules: MigrationRules): ToolControl[] {
  const grouped = new Map<string, { row: ToolControl; review: boolean }[]>();
  for (const row of rows) {
    const rule = rules[row.capability];
    for (const id of rule?.targets ?? [row.capability]) {
      grouped.set(id, [...(grouped.get(id) ?? []), { row, review: rule?.reviewRequired ?? false }]);
    }
  }
  return [...grouped].map(([capability, entries]) => {
    if (entries.length === 1 && entries[0].row.capability === capability) return entries[0].row;
    const review = entries.length > 1 || entries.some((e) => e.review);
    const originals = entries.map((e) => e.row);
    return {
      capability,
      coverage: review ? "unknown" : originals[0].coverage,
      mechanism: originals.map((r) => r.mechanism).filter(Boolean).join("; ") || undefined,
      steps: originals.flatMap((r) => r.steps ?? []),
      evidence: originals.flatMap((r) => r.evidence ?? []),
      // Do not give migrated claims a fresh verification date.
      verified: review ? undefined : originals[0].verified,
      note: [review ? reviewNote : "Identifier migrated; implementation scope retained.", ...originals.map((r) => `[${r.capability}] ${r.note ?? ""}`.trim())].join("\n\n"),
      migration: { from: unique(originals.map((r) => r.capability)), reviewRequired: review, original: originals.map((r) => ({ ...r })) },
    };
  });
}

export function mergePosture(entries: { id: string; value: OrgOrgStatus; review: boolean }[]): OrgOrgStatus {
  const review = entries.length > 1 || entries.some((e) => e.review);
  const statuses = entries.map((e) => e.value.status);
  const status = statuses.every((s) => s === "gap") ? "gap"
    : statuses.every((s) => s === "enabled") && !review ? "enabled" : "inProgress";
  return {
    ...entries[0].value,
    status,
    technology: unique(entries.map((e) => e.value.technology).filter((v): v is string => !!v)).join("; ") || undefined,
    note: [review ? reviewNote : "Identifier migrated; implementation scope retained.", ...entries.map((e) => `[${e.id}] ${e.value.note ?? ""}`.trim())].join("\n\n"),
    migration: { from: unique(entries.map((e) => e.id)), reviewRequired: review, original: entries.map((e) => ({ capability: e.id, ...e.value })) },
  };
}

/** Capability-keyed org posture, framework crosswalks, or enforcement vocabulary. */
export function migrateKeyed(values: Record<string, unknown>, rules: MigrationRules): Record<string, unknown> {
  const groups = new Map<string, { id: string; value: unknown; review: boolean }[]>();
  for (const [id, value] of Object.entries(values)) {
    for (const target of rules[id]?.targets ?? [id]) {
      groups.set(target, [...(groups.get(target) ?? []), { id, value, review: rules[id]?.reviewRequired ?? false }]);
    }
  }
  return Object.fromEntries([...groups].map(([id, entries]) => {
    if (entries.length === 1 && entries[0].id === id) return [id, entries[0].value];
    if (entries.every((e) => Array.isArray(e.value))) return [id, unique(entries.flatMap((e) => e.value as string[]))];
    if (entries.every((e) => e.value && typeof e.value === "object" && "status" in e.value)) {
      return [id, mergePosture(entries as { id: string; value: OrgOrgStatus; review: boolean }[])];
    }
    const surfaces = unique(entries.flatMap((e) => Object.keys(e.value as object)));
    return [id, Object.fromEntries(surfaces.map((surface) => [surface, mergePosture(entries
      .filter((e) => surface in (e.value as object))
      .map((e) => ({ ...e, value: (e.value as Record<string, OrgOrgStatus>)[surface] })))]))];
  }));
}
