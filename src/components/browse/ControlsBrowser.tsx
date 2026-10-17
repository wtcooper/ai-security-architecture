"use client";

import { useSearchParams } from "next/navigation";
import { firstLine } from "@/components/Prose";
import { StatusPill } from "@/components/StatusPill";
import { controls, controlStatusFor, mitigationsForControl } from "@/lib/data";
import { CataloguePage } from "./CataloguePage";
import { ControlDetail } from "./ControlDetail";

export { CONTROL_CATEGORY_ACCENT } from "./CataloguePage";

/** Question one: what controls does the business need, and can we deliver them? */
export function ControlsBrowser() {
  const params = useSearchParams();
  return <CataloguePage items={controls} param="control" linked={params.get("control")}
    eyebrow={`${controls.length} controls · CoSAI taxonomy`} title="Controls"
    lead="The protections an AI deployment needs, as CoSAI names them. Each control is delivered by one or more capabilities, and its status rolls up from theirs."
    placeholder="Search controls, or the MITRE methods that support them…"
    searchText={(c) => `${c.title} ${c.id} ${mitigationsForControl(c.id).map((m) => `${m.title} ${m.id}`).join(" ")}`}
    meta={(c) => controlStatusFor(c.id) !== "notSet" ? <StatusPill status={controlStatusFor(c.id)} compact /> : firstLine(c.description, 80)}
    detail={(c) => <ControlDetail controlId={c.id} framed={false} />} />;
}
