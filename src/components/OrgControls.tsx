/**
 * The organisation's own controls beside a catalogue control (data/org/controls.yaml). One of
 * theirs may map to several of ours and several of theirs to one of ours, so a catalogue control
 * lists every one mapped to it. Names only: an identifier means nothing to a reader.
 */
import { StatusPill } from "@/components/StatusPill";
import { orgControlsFor } from "@/lib/data";

/** One line for a folded row: the names of the organisation's controls that deliver this one. */
export function OrgControlNames({ controlId, className = "" }: { controlId: string; className?: string }) {
  const mine = orgControlsFor(controlId);
  if (!mine.length) return null;
  return (
    <span className={`block text-[11.5px] leading-snug text-ink-3 ${className}`} data-org-control-names>
      <span className="font-semibold text-ink-2">Yours: </span>
      {mine.map((c) => c.name).join(" · ")}
    </span>
  );
}

/** Each of the organisation's controls for this one, with its status, note and a link to its policy or evidence. */
export function OrgControlList({ controlId, heading = "Your organisation's controls" }: { controlId: string; heading?: string }) {
  const mine = orgControlsFor(controlId);
  if (!mine.length) return null;
  return (
    <div data-org-controls={controlId}>
      <p className="eyebrow">{heading}</p>
      <ul className="mt-1.5 space-y-1.5">
        {mine.map((c) => (
          <li key={c.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[12.5px] leading-snug" data-org-control>
            {c.link ? (
              <a href={c.link} target="_blank" rel="noreferrer" className="font-semibold text-ink hover:text-introduced hover:underline">
                {c.name} <span className="text-[11px] text-introduced">↗</span>
              </a>
            ) : (
              <span className="font-semibold text-ink">{c.name}</span>
            )}
            <StatusPill status={c.status ?? "notSet"} compact />
            {c.note && <span className="text-ink-2">{c.note}</span>}
            {c.maps.length > 1 && <span className="text-[11.5px] text-ink-3">also delivers {c.maps.length - 1} other {c.maps.length === 2 ? "control" : "controls"}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
