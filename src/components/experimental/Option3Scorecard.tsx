"use client";

/**
 * Option 3 — "Can we deploy it?" scorecard. Task first: the business asks for a product; each
 * product becomes an action list against the architecture's core controls — what to switch on
 * in the product, what our layer already provides, what to buy, what nobody covers, what to ask
 * the vendor. Counts per answer, never a percentage or a combined score.
 */
import { useMemo, useState } from "react";

import type { Highlight } from "@/components/reference/FlowDiagram";
import { ControlRowDetail } from "@/components/tooling/ControlRowDetail";
import { docsUrlFor } from "@/components/tooling/shared";
import { useOrgOverlay } from "@/components/tooling/overlay";
import { mitigationById, orgSurfaceStatusFor, orgToolAvailableFor } from "@/lib/data";
import type { Archetype, DisplayStatus, Tool } from "@/lib/types";
import { controlOf, enterpriseStatus, fullName, settingUrl, shortName, sitesFor, verdictFor, type Verdict } from "./model";
import { answerStatus, AvailableTag, ChipNumber, chipNumber, countBy, DrawingBar, StatusLegend, StatusTag, statusPaint, vendorName } from "./parts";

export function useScorecardPaint(archetype: Archetype) {
  const overlay = useOrgOverlay();
  return useMemo(() => (overlay ? statusPaint(archetype) : null), [overlay, archetype]);
}

export function ScorecardBar({ archetype }: { archetype: Archetype }) {
  const overlay = useOrgOverlay();
  return (
    <DrawingBar
      legend={
        overlay ? (
          <StatusLegend lead="Chips show our status" counts={countBy(archetype.mitigations.map((c) => orgSurfaceStatusFor(c, archetype.surface)))} />
        ) : (
          <p className="text-[11.5px] text-ink-3">The drawing is the reference: every numbered chip is a core control the scorecard below checks each product against.</p>
        )
      }
    />
  );
}

const SECTIONS: { id: string; title: string; blurb: string; verdicts: Verdict[]; color: string }[] = [
  { id: "configure", title: "Switch on in the product", blurb: "Admin settings only the product can enforce.", verdicts: ["product", "partial"], color: "#3d5bd9" },
  { id: "both", title: "Product setting + our layer", blurb: "Set it in the product; our layer covers the rest.", verdicts: ["shared"], color: "#0e7490" },
  { id: "ours", title: "Our layer already provides", blurb: "Covered once for every product of this type.", verdicts: ["enterprise"], color: "#344054" },
  { id: "buy", title: "Bring a third-party product", blurb: "The product offers nothing; something around it must.", verdicts: ["thirdParty"], color: "#7c3aed" },
  { id: "uncovered", title: "Nobody covers it — decide", blurb: "Accept, compensate by process, or don't deploy.", verdicts: ["uncovered"], color: "#b42318" },
  { id: "ask", title: "Ask the vendor", blurb: "Not confirmed from the vendor's documentation.", verdicts: ["unverified"], color: "#7b8798" },
];

export function ScorecardPanel({ archetype, tools, onHighlight }: { archetype: Archetype; tools: Tool[]; onHighlight: (h: Highlight | null) => void }) {
  const [selected, setSelected] = useState<string[]>(tools.slice(0, 3).map((t) => t.id));
  const [lastArch, setLastArch] = useState(archetype.id);
  if (lastArch !== archetype.id) {
    setLastArch(archetype.id);
    setSelected(tools.slice(0, 3).map((t) => t.id));
  }
  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-3)));
  const shown = tools.filter((t) => selected.includes(t.id));

  return (
    <div className="space-y-4">
      <div>
        <h4 className="display text-[17px] font-bold text-ink">Can we deploy it?</h4>
        <p className="mt-1 max-w-4xl text-[12.5px] leading-snug text-ink-2">
          The {archetype.mitigations.length} core controls this type of application needs, turned into an action list per
          product. Pick up to three to compare.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {tools.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className={`rounded-full border px-3 py-1 text-[12px] ${selected.includes(t.id) ? "border-ink bg-ink font-semibold text-white" : "border-line-strong bg-paper text-ink-2 hover:border-ink"}`}
            >
              {selected.includes(t.id) ? "✓ " : "+ "}
              {t.name}
            </button>
          ))}
        </div>
      </div>
      <div className={`grid gap-4 ${shown.length >= 3 ? "xl:grid-cols-3" : ""} ${shown.length >= 2 ? "lg:grid-cols-2" : ""}`}>
        {shown.map((t) => (
          <ToolCard key={t.id} archetype={archetype} tool={t} onHighlight={onHighlight} />
        ))}
      </div>
    </div>
  );
}

function ToolCard({ archetype, tool, onHighlight }: { archetype: Archetype; tool: Tool; onHighlight: (h: Highlight | null) => void }) {
  const overlay = useOrgOverlay();
  const [open, setOpen] = useState<string | null>(null);
  const verdicts = new Map(archetype.mitigations.map((c) => [c, verdictFor(archetype, tool, c)]));
  const inUse = orgToolAvailableFor(tool.id);
  // A product not in use has no records of its own; only our layer's status still answers.
  const statuses = new Map(
    archetype.mitigations
      .filter((c) => inUse || verdicts.get(c) === "enterprise" || verdicts.get(c) === "shared")
      .map((c) => [c, verdicts.get(c) === "shared" && !inUse ? enterpriseStatus(c, archetype.surface).status : answerStatus(archetype, tool, c)]),
  );
  const na = archetype.mitigations.filter((c) => verdicts.get(c) === "na");
  const blockers = overlay ? archetype.mitigations.filter((c) => verdicts.get(c) === "uncovered" || statuses.get(c) === "gap") : [];
  const statusCounts = countBy(archetype.mitigations.filter((c) => verdicts.get(c) !== "na" && statuses.has(c)).map((c) => statuses.get(c)!));

  const pick = (capId: string) => {
    setOpen(open === capId ? null : capId);
    onHighlight(open === capId ? null : { kind: "mitigation", id: capId });
  };

  return (
    <div className="flex flex-col rounded-xl border border-line bg-paper">
      <div className="border-b border-line px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow">{vendorName(tool)}</span>
          {tool.status && <span className="rounded-full border border-line-strong px-1.5 py-px font-mono text-[10px] font-semibold uppercase text-ink-2">{tool.status}</span>}
          {overlay && <AvailableTag tool={tool} />}
        </div>
        <h5 className="mt-0.5 text-[16px] font-bold text-ink">{tool.name}</h5>
        {docsUrlFor(tool) && (
          <a href={docsUrlFor(tool)} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-introduced hover:underline">
            Vendor docs ↗
          </a>
        )}
        <div className="mt-2.5 grid grid-cols-6 gap-1">
          {SECTIONS.map((s) => {
            const n = archetype.mitigations.filter((c) => s.verdicts.includes(verdicts.get(c)!)).length;
            return (
              <div key={s.id} className="rounded-md border border-line px-1.5 py-1 text-center" style={{ opacity: 1 }}>
                <span className="block text-[17px] font-bold leading-none" style={{ color: n ? s.color : "var(--ink-3)" }}>
                  {n}
                </span>
                <span className="mt-0.5 block text-[9.5px] leading-tight text-ink-3">{s.title}</span>
              </div>
            );
          })}
        </div>
        {overlay && (
          <div className="mt-2.5">
            <StatusLegend lead={inUse ? "Do we have it" : "Our layer today"} counts={statusCounts} />
            {!inUse && <p className="mt-1 text-[11px] text-ink-3">Not in use yet, so the product has no records — this card is what rollout would take.</p>}
          </div>
        )}
      </div>

      {overlay && blockers.length > 0 && (
        <div className="border-b border-line bg-[#fff5f3] px-4 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#b42318]">Blocking rollout · {blockers.length}</p>
          <ul className="mt-1 space-y-0.5">
            {blockers.map((c) => (
              <li key={c} className="text-[12px] text-ink-2">
                <button type="button" onClick={() => pick(c)} className="text-left hover:underline">
                  <span className="font-semibold text-ink">{shortName(c)}</span> — {verdicts.get(c) === "uncovered" ? "nobody covers it" : "recorded as a gap"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1 divide-y divide-line">
        {SECTIONS.map((s) => {
          const caps = archetype.mitigations.filter((c) => s.verdicts.includes(verdicts.get(c)!));
          if (!caps.length) return null;
          return (
            <section key={s.id} className="px-4 py-3">
              <p className="text-[12.5px] font-semibold" style={{ color: s.color }}>
                {s.title} <span className="font-normal text-ink-3">· {caps.length}</span>
              </p>
              <p className="text-[11px] text-ink-3">{s.blurb}</p>
              <ul className="mt-2 space-y-1.5">
                {caps.map((c) => (
                  <Item
                    key={c}
                    archetype={archetype}
                    tool={tool}
                    capId={c}
                    verdict={verdicts.get(c)!}
                    status={overlay ? statuses.get(c) : undefined}
                    open={open === c}
                    onPick={() => pick(c)}
                  />
                ))}
              </ul>
            </section>
          );
        })}
        {na.length > 0 && <p className="px-4 py-2 text-[11px] text-ink-3">Not applicable to this product: {na.map(shortName).join(", ")}</p>}
      </div>
    </div>
  );
}

function Item({
  archetype,
  tool,
  capId,
  verdict,
  status,
  open,
  onPick,
}: {
  archetype: Archetype;
  tool: Tool;
  capId: string;
  verdict: Verdict;
  status?: DisplayStatus;
  open: boolean;
  onPick: () => void;
}) {
  const control = controlOf(tool, capId);
  const url = settingUrl(control);
  const ours = [...new Set(sitesFor(archetype, capId).filter((s) => s.side === "enterprise").map((s) => s.title))];
  const examples = mitigationById.get(capId)?.examples ?? [];
  const line =
    verdict === "enterprise"
      ? `At ${ours.join(" · ")}`
      : verdict === "thirdParty"
        ? control?.mechanism ?? (examples.length ? `Bought as: ${examples.slice(0, 3).join(" · ")}` : control?.note)
        : verdict === "unverified"
          ? control?.note ?? "No vendor record for this control yet."
          : verdict === "uncovered"
            ? control?.note ?? control?.mechanism
            : control?.mechanism;
  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onPick}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPick()}
        className={`flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 hover:bg-mist ${open ? "bg-mist" : ""}`}
      >
        <ChipNumber n={chipNumber(archetype, capId)} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-[12.5px] font-semibold text-ink">{shortName(capId)}</span>
            {verdict === "partial" && <span className="text-[10.5px] font-semibold text-[#5b6fd6]">partly</span>}
            {verdict === "shared" && ours.length > 0 && <span className="text-[10.5px] text-ink-3">+ ours at {ours[0]}</span>}
            {status && <StatusTag status={status} />}
          </span>
          {line && <span className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-ink-2">{line}</span>}
        </span>
        {url && (
          <a href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0 text-[11px] font-semibold text-introduced hover:underline">
            ↗
          </a>
        )}
      </div>
      {open && (
        <div className="mt-1.5 rounded-lg border border-line bg-mist/50 px-3 py-3">
          <p className="eyebrow mb-2">{fullName(capId)}</p>
          <ControlRowDetail tool={tool} mitigationId={capId} />
        </div>
      )}
    </li>
  );
}
