"use client";

import { useEffect, useRef, useState } from "react";
import { capabilitiesInOrder, controlCategories, surfaces } from "@/lib/data";
import { CAPABILITY_STATUSES, type CapabilityStatus } from "@/lib/types";
import { StatusPill } from "./StatusPill";
import { exportYaml, STATUS_META, type StatusOverrides } from "./status";

/** in place -> partial -> gap -> N/A -> in place. */
const nextStatus = (current: CapabilityStatus): CapabilityStatus =>
  CAPABILITY_STATUSES[(CAPABILITY_STATUSES.indexOf(current) + 1) % CAPABILITY_STATUSES.length];

export function SettingsDrawer({
  open,
  overrides,
  effective,
  onSet,
  onReset,
  onClose,
}: {
  open: boolean;
  overrides: StatusOverrides;
  effective: (
    capability: (typeof capabilitiesInOrder)[number],
    surfaceId: string,
  ) => CapabilityStatus;
  onSet: (capabilityId: string, surfaceId: string, status: CapabilityStatus | null) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  // Adjust during render (the Panel.tsx idiom) so a reopened drawer never flashes the
  // stale "Really reset?" state.
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) setConfirmReset(false);
  }

  // Focus the panel on open, lock body scroll, close on Escape. Focus restoration falls to
  // the trigger button, which the browser re-focuses when the dialog subtree unmounts.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        aria-label="Close customize panel"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-ink/30"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Customize capability statuses"
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col border-l border-line bg-paper shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <p className="eyebrow">Edit taxonomy · your organisation&apos;s posture</p>
            <h2 className="display mt-1 text-[20px] font-bold text-ink">Capability statuses</h2>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-2">
              Everything starts green — an idealised baseline, not a claim about any
              organisation. Click a cell to cycle its status. Edits live in this browser only;
              this site is static, so to keep them, fork the repository, export below, and
              commit the file as <span className="ident">data/overlay/capabilities.yaml</span>.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-ink-3 transition-colors hover:bg-mist hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path
                d="M4 4 L12 12 M12 4 L4 12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {CAPABILITY_STATUSES.map((s) => (
              <StatusPill key={s} status={s} label="long" />
            ))}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_repeat(3,96px)] items-center">
            <span />
            {surfaces.map((s) => (
              <span key={s.id} className="px-2 py-1 text-center text-[11.5px] font-semibold text-ink-2">
                {s.title}
              </span>
            ))}

            {controlCategories.map((cat) => {
              const caps = capabilitiesInOrder.filter((c) => c.category === cat.id);
              if (!caps.length) return null;
              return [
                <p
                  key={cat.id}
                  className="col-span-4 mt-4 mb-1 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-2"
                >
                  {cat.title}
                </p>,
                ...caps.map((cap) => [
                  <span
                    key={`${cap.id}-label`}
                    className="truncate border-t border-line py-1.5 pr-3 text-[13px] text-ink"
                    title={cap.title}
                  >
                    {cap.title}
                  </span>,
                  ...surfaces.map((s) => {
                    const info = cap.surfaces[s.id];
                    const status = effective(cap, s.id);
                    const edited = overrides[cap.id]?.[s.id] != null;
                    if (!info?.applies) {
                      return (
                        <span
                          key={`${cap.id}-${s.id}`}
                          className="border-t border-line py-1.5 text-center text-[12px] text-ink-3"
                          title={info?.note}
                        >
                          —
                        </span>
                      );
                    }
                    return (
                      <button
                        key={`${cap.id}-${s.id}`}
                        onClick={() => onSet(cap.id, s.id, nextStatus(status))}
                        title={`${cap.title} · ${s.title}: ${STATUS_META[status].label} — click to change`}
                        className="flex items-center justify-center border-t border-line py-1.5 transition-colors hover:bg-mist"
                      >
                        <span className={edited ? "ring-1 ring-ink/25 rounded-full" : undefined}>
                          <StatusPill status={status} />
                        </span>
                      </button>
                    );
                  }),
                ]),
              ];
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
          <button
            onClick={() => {
              if (!confirmReset) return setConfirmReset(true);
              onReset();
              setConfirmReset(false);
            }}
            className={`rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
              confirmReset
                ? "border-exposed bg-exposed-soft text-exposed"
                : "border-line text-ink-2 hover:border-line-strong"
            }`}
          >
            {confirmReset ? "Really reset all edits?" : "Reset to shipped"}
          </button>
          <button
            onClick={() => exportYaml(overrides)}
            className="rounded-lg bg-ink px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
          >
            Export capabilities.yaml
          </button>
        </div>
      </div>
    </>
  );
}
